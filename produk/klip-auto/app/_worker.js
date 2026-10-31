/**
 * Klip Auto — Cloudflare Pages Edge Worker v2.2.0
 * Fitur Utama:
 * 1. Validasi Lisensi Server & Pengunci Aset Aplikasi Inti (`env.KLIP_AUTO_LICENSE_CONFIG` — nol rahasia di kode sumber).
 * 2. Pembaca Link YouTube Langsung Tanpa Ekstensi Tambahan (`/api/youtube/info`, `/api/youtube/stream`, `/api/youtube/download`)
 *    khusus pengguna berlisensi sah (`401 AUTH_REQUIRED` untuk publik/bot tanpa sesi).
 * 3. Pengambil Subtitle Kata Presisi (`srv3` anti-tumpang-tindih) + Grafik Most-Replayed (`heatmap`).
 * 4. Info Versi (`/api/version`) & Laporan Error Tersanitasi (`/api/error-report`).
 */

const APP_VERSION = '2.2.0';
const SESSION_COOKIE_NAME = 'klip_lic_session';
const SEVEN_DAYS_SEC = 7 * 24 * 3600;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLAYER_CACHE_TTL_MS = 14 * 60 * 1000;
const MAX_STREAM_CHUNK_BYTES = 6 * 1024 * 1024;

// Registri ikatan perangkat & cache sesi pemutar dalam isolate Edge
const memoryDeviceRegistry = new Map();
const edgePlayerCache = new Map();
const recentErrorReports = [];

const PUBLIC_ENGINE_FILES = new Set([
  '/engine/license-client.js',
  '/engine/device-checker.js'
]);

const WEB_DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

function isProtectedAppAsset(pathname) {
  if (pathname === '/wizard-controller.js') return true;
  if (pathname === '/klip-auto-jembatan-lokal-v2.1.zip') return true;
  if (pathname.startsWith('/companion-extension/')) return true;
  if (pathname.startsWith('/vendor/')) return true;
  if (pathname.startsWith('/data/')) return true;
  if (pathname.startsWith('/engine/') && !PUBLIC_ENGINE_FILES.has(pathname)) return true;
  return false;
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const padded = String(str || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(str || '').length / 4) * 4, '=');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function sha256HexAsync(text) {
  const data = new TextEncoder().encode(String(text || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSignString(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parseLicenseServerConfig(env) {
  const raw = env?.KLIP_AUTO_LICENSE_CONFIG;
  if (!raw) return null;
  try {
    let parsed = null;
    if (typeof raw === 'object') {
      parsed = raw;
    } else {
      const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '');
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        const decoded = new TextDecoder().decode(fromBase64Url(trimmed));
        parsed = JSON.parse(decoded);
      }
    }
    if (!parsed || !parsed.hmacSecret || !parsed.salt || !parsed.licenses) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseOptionalUpstreamConfig(env) {
  const raw = env?.KLIP_AUTO_YT_UPSTREAM_CONFIG;
  if (!raw) return null;
  try {
    const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '');
    const parsed = trimmed.startsWith('{')
      ? JSON.parse(trimmed)
      : JSON.parse(new TextDecoder().decode(fromBase64Url(trimmed)));
    if (!parsed || !parsed.endpoint) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildPackageFeatures(tier = 'inti') {
  const isTambahan = tier === 'tambahan' || tier === 'pro';
  const isPro = tier === 'pro';
  return {
    tier,
    extraPresets: isTambahan,
    customWatermark: isTambahan,
    descriptionHashtagGenerator: isTambahan,
    gamingSplit: isPro,
    multiVideoBatch: isPro,
    multiDevice: isPro
  };
}

function getTierLabel(tier = 'inti') {
  if (tier === 'pro') return 'Paket Pro (Multi-Video + Gaming Split)';
  if (tier === 'tambahan') return 'Paket Inti + Tambahan (Watermark & Generator)';
  return 'Paket Inti (9:16 Tanpa Kuota)';
}

async function readDeviceRegistry(licenseId) {
  const mem = memoryDeviceRegistry.get(licenseId);
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const req = new Request(`https://lic-registry.klipauto.internal/v2/${encodeURIComponent(licenseId)}`);
      const cached = await caches.default.match(req);
      if (cached) {
        const data = await cached.json();
        if (!mem || (data.updatedAt || 0) >= (mem.updatedAt || 0)) {
          memoryDeviceRegistry.set(licenseId, data);
          return data;
        }
      }
    }
  } catch {}
  return (
    mem || {
      licenseId,
      generation: 1,
      ownerEmail: '',
      devices: [],
      updatedAt: 0
    }
  );
}

async function writeDeviceRegistry(licenseId, record) {
  const next = { ...record, licenseId, updatedAt: Date.now() };
  memoryDeviceRegistry.set(licenseId, next);
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const req = new Request(`https://lic-registry.klipauto.internal/v2/${encodeURIComponent(licenseId)}`);
      const res = new Response(JSON.stringify(next), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000'
        }
      });
      await caches.default.put(req, res);
    }
  } catch {}
  return next;
}

async function createSignedSessionToken(payloadObj, hmacSecret) {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const sigB64 = await hmacSignString(hmacSecret, payloadB64);
  return `${payloadB64}.${sigB64}`;
}

async function verifySignedSessionToken(tokenStr, hmacSecret) {
  if (!tokenStr || !tokenStr.includes('.')) return null;
  const [payloadB64, sigB64] = tokenStr.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = await hmacSignString(hmacSecret, payloadB64);
  if (!timingSafeEqualStr(sigB64, expectedSig)) return null;

  try {
    const jsonStr = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function readCookieValue(request, cookieName) {
  const raw = request.headers.get('Cookie') || '';
  const parts = raw.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === cookieName) {
      return part.slice(idx + 1).trim();
    }
  }
  return '';
}

function formatSessionCookieHeader(tokenValue, isHttps, maxAgeSec = SEVEN_DAYS_SEC) {
  const secureFlag = isHttps ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${tokenValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secureFlag}`;
}

async function getAuthenticatedSession(request, cfg) {
  if (!cfg) return null;
  const rawCookie = readCookieValue(request, SESSION_COOKIE_NAME);
  if (!rawCookie) return null;
  return verifySignedSessionToken(rawCookie, cfg.hmacSecret);
}

/* ============================================================================
 * MESIN PEMBACA YOUTUBE LANGSUNG TANPA EKSTENSI (KHUSUS SESI TERLISENSI)
 * ============================================================================ */

function extractYoutubeVideoId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      const seg = u.pathname.split('/').filter(Boolean)[0];
      if (seg && /^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
    }
    if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = u.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['shorts', 'live', 'embed', 'v', 'clips'].includes(parts[0])) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(parts[1])) return parts[1];
      }
    }
  } catch {}

  const m = raw.match(/(?:v=|\/shorts\/|\/live\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function decodeXmlEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanCaptionToken(tok) {
  return decodeXmlEntities(tok)
    .replace(/<[^>]+>/g, '')
    .replace(/\[(?:musik|music|applause|tertawa|laughter|tepuk tangan)\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateWordSyllables(word) {
  const clean = String(word || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!clean) return 1;
  const groups = clean.match(/[aiueo]+/g);
  return Math.max(1, groups ? groups.length : Math.ceil(clean.length / 3));
}

/**
 * Mengurai format subtitle `srv3` / XML YouTube menjadi daftar kata ber-timestamp presisi
 * dengan proteksi anti-tumpang-tindih antar baris rollup `<p>` sehingga TIDAK ADA kata yang terlewat atau melompat!
 */
function parseSrv3TimedTextToWords(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') return [];

  const parsedBlocks = [];
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const attrs = pMatch[1] || '';
    const inner = pMatch[2] || '';
    const tAttr = attrs.match(/\bt="(\d+)"/);
    if (!tAttr) continue;
    const dAttr = attrs.match(/\bd="(\d+)"/);
    const pStartMs = Number(tAttr[1]);
    const pDurMs = dAttr ? Number(dAttr[1]) : 2600;
    parsedBlocks.push({ pStartMs, pDurMs, inner });
  }

  // Fallback untuk format timedtext klasik `<text start="1.23" dur="3.45">...</text>`
  if (parsedBlocks.length === 0) {
    const textRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
    let tMatch;
    while ((tMatch = textRegex.exec(xmlText)) !== null) {
      const attrs = tMatch[1] || '';
      const inner = tMatch[2] || '';
      const sAttr = attrs.match(/\bstart="([\d.]+)"/);
      if (!sAttr) continue;
      const dAttr = attrs.match(/\bdur="([\d.]+)"/);
      parsedBlocks.push({
        pStartMs: Math.round(Number(sAttr[1]) * 1000),
        pDurMs: Math.round((dAttr ? Number(dAttr[1]) : 2.5) * 1000),
        inner
      });
    }
  }

  if (parsedBlocks.length === 0) return [];
  parsedBlocks.sort((a, b) => a.pStartMs - b.pStartMs);

  const rawWords = [];

  for (let bIdx = 0; bIdx < parsedBlocks.length; bIdx++) {
    const block = parsedBlocks[bIdx];
    const nextBlock = parsedBlocks[bIdx + 1] || null;
    // Batasi akhir blok `<p>` agar tidak menabrak awal blok `<p>` berikutnya pada mode rollup YouTube!
    const clampedEndMs = nextBlock
      ? Math.min(block.pStartMs + block.pDurMs, Math.max(block.pStartMs + 100, nextBlock.pStartMs))
      : block.pStartMs + block.pDurMs;

    const sRegex = /<s\b([^>]*)>([\s\S]*?)<\/s>/g;
    const sTokens = [];
    let sMatch;
    while ((sMatch = sRegex.exec(block.inner)) !== null) {
      const sAttrs = sMatch[1] || '';
      const offAttr = sAttrs.match(/\bt="(\d+)"/);
      const relMs = offAttr ? Number(offAttr[1]) : 0;
      const textPiece = cleanCaptionToken(sMatch[2]);
      if (textPiece) {
        sTokens.push({ startMs: block.pStartMs + relMs, text: textPiece });
      }
    }

    if (sTokens.length > 0) {
      for (let i = 0; i < sTokens.length; i++) {
        const cur = sTokens[i];
        const next = sTokens[i + 1];
        const segEndMs = next
          ? Math.max(cur.startMs + 85, next.startMs)
          : Math.max(cur.startMs + 160, Math.min(clampedEndMs, cur.startMs + 680));
        const subWords = cur.text.split(/\s+/).filter(Boolean);
        if (subWords.length === 1) {
          rawWords.push({
            word: subWords[0],
            start: cur.startMs / 1000,
            end: segEndMs / 1000
          });
        } else {
          const weights = subWords.map(estimateWordSyllables);
          const totalW = weights.reduce((a, b) => a + b, 0) || subWords.length;
          let cursorMs = cur.startMs;
          const spanMs = Math.max(90 * subWords.length, segEndMs - cur.startMs);
          for (let k = 0; k < subWords.length; k++) {
            const wDur = (weights[k] / totalW) * spanMs;
            rawWords.push({
              word: subWords[k],
              start: cursorMs / 1000,
              end: (cursorMs + wDur) / 1000
            });
            cursorMs += wDur;
          }
        }
      }
    } else {
      const plain = cleanCaptionToken(block.inner);
      if (!plain) continue;
      const tokens = plain.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;
      const weights = tokens.map(estimateWordSyllables);
      const totalW = weights.reduce((a, b) => a + b, 0) || tokens.length;
      const spanMs = Math.max(tokens.length * 110, clampedEndMs - block.pStartMs);
      let cursorMs = block.pStartMs;
      for (let k = 0; k < tokens.length; k++) {
        const wDur = (weights[k] / totalW) * spanMs;
        rawWords.push({
          word: tokens[k],
          start: cursorMs / 1000,
          end: (cursorMs + wDur) / 1000
        });
        cursorMs += wDur;
      }
    }
  }

  // Sanitasi akhir: pastikan urutan waktu monotonik rapi & tidak ada kata berdurasi nol
  const normalized = [];
  for (let i = 0; i < rawWords.length; i++) {
    const w = rawWords[i];
    if (!w.word) continue;
    let s = Math.max(0, Number(w.start) || 0);
    let e = Math.max(s + 0.08, Number(w.end) || s + 0.18);
    if (normalized.length > 0) {
      const prev = normalized[normalized.length - 1];
      if (s < prev.start) s = prev.start + 0.04;
      if (prev.end > s + 0.02) {
        prev.end = Number(Math.max(prev.start + 0.075, s).toFixed(3));
      }
    }
    normalized.push({
      word: w.word,
      start: Number(s.toFixed(3)),
      end: Number(Math.max(s + 0.08, e).toFixed(3))
    });
  }
  return normalized;
}

function extractBalancedJson(source, marker) {
  const idx = source.indexOf(marker);
  if (idx === -1) return null;
  const openIdx = source.indexOf('{', idx + marker.length);
  if (openIdx === -1) return null;

  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(openIdx, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function extractHeatmapFromInitialData(initialData) {
  if (!initialData || typeof initialData !== 'object') return [];
  const markers = [];

  const stack = [initialData];
  let steps = 0;
  while (stack.length > 0 && steps < 6000) {
    steps++;
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;

    if (node.heatMarkerRenderer && typeof node.heatMarkerRenderer === 'object') {
      const hm = node.heatMarkerRenderer;
      const startMs = Number(hm.timeRangeStartMillis ?? 0);
      const durMs = Number(hm.markerDurationMillis ?? 5000);
      const score = Number(hm.heatMarkerIntensityScoreNormalized ?? 0);
      if (durMs > 0 && Number.isFinite(score)) {
        markers.push({
          startSec: Number((startMs / 1000).toFixed(2)),
          endSec: Number(((startMs + durMs) / 1000).toFixed(2)),
          intensity: Number(Math.max(0, Math.min(1, score)).toFixed(4))
        });
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) stack.push(node[i]);
    } else {
      for (const val of Object.values(node)) {
        if (val && typeof val === 'object') stack.push(val);
      }
    }
  }

  return markers;
}

async function fetchWatchPageAndOembedSignals(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=id`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&format=json`;

  const [watchRes, oeRes] = await Promise.allSettled([
    fetch(watchUrl, {
      headers: {
        'User-Agent': WEB_DESKTOP_UA,
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+410'
      }
    }),
    fetch(oembedUrl, {
      headers: { 'User-Agent': WEB_DESKTOP_UA }
    })
  ]);

  let oembed = null;
  let oembedStatus = 0;
  if (oeRes.status === 'fulfilled') {
    oembedStatus = oeRes.value.status;
    if (oeRes.value.ok) {
      oembed = await oeRes.value.json().catch(() => null);
    }
  }

  let visitorData = '';
  let heatmap = [];
  let watchCaptionTracks = [];
  let watchVideoDetails = null;
  let htmlDurationSec = 0;

  if (watchRes.status === 'fulfilled' && watchRes.value.ok) {
    const html = await watchRes.value.text().catch(() => '');
    const visMatch = html.match(/"VISITOR_DATA"\s*:\s*"([^"]+)"/);
    if (visMatch) visitorData = visMatch[1];

    const initialData =
      extractBalancedJson(html, 'var ytInitialData =') ||
      extractBalancedJson(html, 'window["ytInitialData"] =') ||
      extractBalancedJson(html, 'ytInitialData =');
    if (initialData) {
      heatmap = extractHeatmapFromInitialData(initialData);
    }

    const watchPlayer =
      extractBalancedJson(html, 'var ytInitialPlayerResponse =') ||
      extractBalancedJson(html, 'ytInitialPlayerResponse =');
    if (watchPlayer) {
      watchVideoDetails = watchPlayer.videoDetails || null;
      const tracks = watchPlayer?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        watchCaptionTracks = tracks;
      }
    }

    const lenMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    if (lenMatch) {
      htmlDurationSec = Number(lenMatch[1]) || 0;
    } else {
      const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
      if (approxMatch) {
        htmlDurationSec = Math.round(Number(approxMatch[1]) / 1000) || 0;
      } else {
        const isoMatch = html.match(
          /itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i
        );
        if (isoMatch) {
          htmlDurationSec =
            (Number(isoMatch[1] || 0) * 3600) +
            (Number(isoMatch[2] || 0) * 60) +
            Number(isoMatch[3] || 0);
        }
      }
    }
    if (!htmlDurationSec && heatmap.length > 0) {
      htmlDurationSec = Math.round(heatmap[heatmap.length - 1].endSec) || 0;
    }
  }

  return {
    oembed,
    oembedStatus,
    visitorData,
    heatmap,
    watchCaptionTracks,
    watchVideoDetails,
    htmlDurationSec
  };
}

function chooseBestCaptionTrack(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  const rank = (t) => {
    const lang = String(t.languageCode || '').toLowerCase();
    const isAuto = t.kind === 'asr';
    if (lang.startsWith('id') && !isAuto) return 100;
    if (lang.startsWith('id') && isAuto) return 92;
    if (lang.startsWith('ms') && !isAuto) return 84;
    if (lang.startsWith('en') && !isAuto) return 78;
    if (lang.startsWith('en') && isAuto) return 72;
    return isAuto ? 40 : 55;
  };
  return [...tracks].sort((a, b) => rank(b) - rank(a))[0];
}

async function fetchCaptionWordsFromTracks(tracks, ua = WEB_DESKTOP_UA) {
  const best = chooseBestCaptionTrack(tracks);
  if (!best || !best.baseUrl) {
    return {
      words: [],
      captionMeta: { available: false, languageCode: '', isAutoGenerated: false, wordCount: 0 }
    };
  }

  const urlsToTry = [
    best.baseUrl.includes('fmt=') ? best.baseUrl : `${best.baseUrl}&fmt=srv3`,
    best.baseUrl
  ];

  for (const capUrl of urlsToTry) {
    try {
      const res = await fetch(capUrl, {
        headers: {
          'User-Agent': ua,
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
        }
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const words = parseSrv3TimedTextToWords(xml);
      if (words.length > 0) {
        return {
          words,
          captionMeta: {
            available: true,
            languageCode: best.languageCode || 'id',
            isAutoGenerated: best.kind === 'asr',
            wordCount: words.length
          }
        };
      }
    } catch {}
  }

  return {
    words: [],
    captionMeta: { available: false, languageCode: best.languageCode || '', isAutoGenerated: false, wordCount: 0 }
  };
}

function estimateStandardMp4Bytes(shortSide, durationSec) {
  if (!durationSec || durationSec <= 0) return 0;
  const kbpsMap = { 1080: 1850, 720: 1050, 480: 540, 360: 340 };
  const kbps = kbpsMap[shortSide] || 600;
  return Math.round(((kbps * 1000) / 8) * durationSec);
}

function buildConverterOnlyQualityOptions(durationSec) {
  const formatMb = (bytes) => (bytes > 0 ? ` · ~${(bytes / (1024 * 1024)).toFixed(1)} MB` : '');
  const MAX_REC_BYTES = 220 * 1024 * 1024;
  const est720 = estimateStandardMp4Bytes(720, durationSec);
  const est480 = estimateStandardMp4Bytes(480, durationSec);
  const est360 = estimateStandardMp4Bytes(360, durationSec);
  const est1080 = estimateStandardMp4Bytes(1080, durationSec);
  const rec720 = est720 === 0 || est720 <= MAX_REC_BYTES;
  const rec480 = !rec720 && est480 <= MAX_REC_BYTES;

  return [
    {
      id: '720p-hd',
      shortLabel: '720p HD',
      label: `720p HD — Tajam & Cepat (Rekomendasi)${formatMb(est720)}`,
      mode: 'converter',
      converterFormat: '720',
      videoItag: null,
      audioItag: null,
      totalBytes: est720,
      recommended: rec720
    },
    {
      id: '480p-sd',
      shortLabel: '480p SD',
      label: `480p SD — Seimbang${formatMb(est480)}`,
      mode: 'converter',
      converterFormat: '480',
      videoItag: null,
      audioItag: null,
      totalBytes: est480,
      recommended: rec480
    },
    {
      id: '360p-fast',
      shortLabel: '360p Cepat',
      label: `360p Cepat — Hemat Kuota & Instan${formatMb(est360)}`,
      mode: 'converter',
      converterFormat: '360',
      videoItag: null,
      audioItag: null,
      totalBytes: est360,
      recommended: !rec720 && !rec480
    },
    {
      id: '1080p-fhd',
      shortLabel: '1080p Full HD',
      label: `1080p Full HD — Sangat Tajam${formatMb(est1080)}`,
      mode: 'converter',
      converterFormat: '1080',
      videoItag: null,
      audioItag: null,
      totalBytes: est1080,
      recommended: false
    }
  ];
}

function buildQualityOptionsFromFormats(allFormats, durationSec) {
  const direct = allFormats.filter((f) => f && typeof f.url === 'string' && f.url.startsWith('http'));
  if (direct.length === 0) return { qualities: [], formatsByItag: new Map() };

  const formatsByItag = new Map();
  for (const f of direct) {
    const itag = Number(f.itag);
    if (!formatsByItag.has(itag)) {
      const mime = String(f.mimeType || 'video/mp4');
      const h = Number(f.height || 0);
      const w = Number(f.width || 0);
      const shortSide = w > 0 && h > 0 ? Math.min(w, h) : h;
      const approxBytes =
        Number(f.contentLength || 0) ||
        (f.bitrate && durationSec > 0 ? Math.round((Number(f.bitrate) / 8) * durationSec) : 0);
      formatsByItag.set(itag, {
        itag,
        url: f.url,
        mimeType: mime,
        height: h,
        width: w,
        shortSide,
        bitrate: Number(f.bitrate || 0),
        contentLength: approxBytes,
        hasVideo: Boolean(h || mime.startsWith('video/')),
        hasAudio: Boolean(
          mime.startsWith('audio/') || (mime.startsWith('video/') && mime.includes('mp4a'))
        ),
        isAvc: mime.includes('avc1') || (!mime.includes('codecs=') && mime.startsWith('video/mp4')),
        isM4a: mime.includes('mp4a') || (!mime.includes('codecs=') && mime.startsWith('audio/mp4'))
      });
    }
  }

  const list = Array.from(formatsByItag.values());
  const bestAudio =
    list
      .filter((f) => !f.hasVideo && f.hasAudio && f.isM4a)
      .sort((a, b) => b.bitrate - a.bitrate)[0] ||
    list.filter((f) => !f.hasVideo && f.hasAudio).sort((a, b) => b.bitrate - a.bitrate)[0] ||
    null;

  const formatMb = (bytes) => (bytes > 0 ? ` · ~${(bytes / (1024 * 1024)).toFixed(1)} MB` : '');
  const qualities = [];

  // 1080p Full HD
  const v1080Prog = list.find(
    (f) => f.hasVideo && f.hasAudio && f.shortSide >= 1000 && f.shortSide <= 1120
  );
  const v1080Adap = list
    .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc && f.shortSide >= 1000 && f.shortSide <= 1120)
    .sort((a, b) => b.bitrate - a.bitrate)[0];
  if (v1080Prog) {
    qualities.push({
      id: '1080p-fhd',
      shortLabel: '1080p Full HD',
      label: `1080p Full HD — Sangat Tajam${formatMb(v1080Prog.contentLength)}`,
      mode: 'progressive',
      converterFormat: '1080',
      videoItag: v1080Prog.itag,
      totalBytes: v1080Prog.contentLength,
      recommended: false
    });
  } else if (v1080Adap && bestAudio) {
    const total = (v1080Adap.contentLength || 0) + (bestAudio.contentLength || 0);
    qualities.push({
      id: '1080p-fhd',
      shortLabel: '1080p Full HD',
      label: `1080p Full HD — Sangat Tajam${formatMb(total)}`,
      mode: 'adaptive',
      converterFormat: '1080',
      videoItag: v1080Adap.itag,
      audioItag: bestAudio.itag,
      videoBytes: v1080Adap.contentLength,
      audioBytes: bestAudio.contentLength,
      totalBytes: total,
      recommended: false
    });
  }

  // 720p HD (Rekomendasi Utama bila ukuran wajar <= 240 MB)
  const v720Prog = list.find(
    (f) => f.hasVideo && f.hasAudio && f.shortSide >= 680 && f.shortSide <= 760
  );
  const v720Adap = list
    .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc && f.shortSide >= 680 && f.shortSide <= 760)
    .sort((a, b) => b.bitrate - a.bitrate)[0];
  const MAX_REC_720_BYTES = 240 * 1024 * 1024;
  if (v720Prog) {
    const rec = !v720Prog.contentLength || v720Prog.contentLength <= MAX_REC_720_BYTES;
    qualities.push({
      id: '720p-hd',
      shortLabel: '720p HD',
      label: `720p HD — Tajam & Cepat${rec ? ' (Rekomendasi)' : ''}${formatMb(v720Prog.contentLength)}`,
      mode: 'progressive',
      converterFormat: '720',
      videoItag: v720Prog.itag,
      totalBytes: v720Prog.contentLength,
      recommended: rec
    });
  } else if (v720Adap && bestAudio) {
    const total = (v720Adap.contentLength || 0) + (bestAudio.contentLength || 0);
    const rec = !total || total <= MAX_REC_720_BYTES;
    qualities.push({
      id: '720p-hd',
      shortLabel: '720p HD',
      label: `720p HD — Tajam & Cepat${rec ? ' (Rekomendasi)' : ''}${formatMb(total)}`,
      mode: 'adaptive',
      converterFormat: '720',
      videoItag: v720Adap.itag,
      audioItag: bestAudio.itag,
      videoBytes: v720Adap.contentLength,
      audioBytes: bestAudio.contentLength,
      totalBytes: total,
      recommended: rec
    });
  }

  // 480p SD
  const v480Adap = list
    .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc && f.shortSide >= 440 && f.shortSide <= 540)
    .sort((a, b) => b.bitrate - a.bitrate)[0];
  if (v480Adap && bestAudio) {
    const total = (v480Adap.contentLength || 0) + (bestAudio.contentLength || 0);
    qualities.push({
      id: '480p-sd',
      shortLabel: '480p SD',
      label: `480p SD — Seimbang${formatMb(total)}`,
      mode: 'adaptive',
      converterFormat: '480',
      videoItag: v480Adap.itag,
      audioItag: bestAudio.itag,
      videoBytes: v480Adap.contentLength,
      audioBytes: bestAudio.contentLength,
      totalBytes: total,
      recommended: !qualities.some((q) => q.recommended)
    });
  }

  // 360p / 240p Cepat
  const v360Prog =
    list.find((f) => f.itag === 18) ||
    list.find((f) => f.hasVideo && f.hasAudio && f.shortSide >= 220 && f.shortSide <= 400);
  const v360Adap =
    list
      .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc && f.shortSide >= 300 && f.shortSide <= 400)
      .sort((a, b) => b.bitrate - a.bitrate)[0] ||
    list
      .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc && f.shortSide >= 140 && f.shortSide < 300)
      .sort((a, b) => b.shortSide - a.shortSide || b.bitrate - a.bitrate)[0];

  if (v360Prog) {
    const tag = v360Prog.shortSide && v360Prog.shortSide < 300 ? `${v360Prog.shortSide}p Cepat` : '360p Cepat';
    qualities.push({
      id: '360p-fast',
      shortLabel: tag,
      label: `${tag} — Hemat Kuota & Instan${formatMb(v360Prog.contentLength)}`,
      mode: 'progressive',
      converterFormat: '360',
      videoItag: v360Prog.itag,
      totalBytes: v360Prog.contentLength,
      recommended: !qualities.some((q) => q.recommended)
    });
  } else if (v360Adap && bestAudio) {
    const total = (v360Adap.contentLength || 0) + (bestAudio.contentLength || 0);
    const tag = v360Adap.shortSide && v360Adap.shortSide < 300 ? `${v360Adap.shortSide}p Cepat` : '360p Cepat';
    qualities.push({
      id: '360p-fast',
      shortLabel: tag,
      label: `${tag} — Hemat Kuota & Instan${formatMb(total)}`,
      mode: 'adaptive',
      converterFormat: '360',
      videoItag: v360Adap.itag,
      audioItag: bestAudio.itag,
      videoBytes: v360Adap.contentLength,
      audioBytes: bestAudio.contentLength,
      totalBytes: total,
      recommended: !qualities.some((q) => q.recommended)
    });
  }

  // Fallback universal bila video memakai resolusi non-standar
  if (qualities.length === 0) {
    const anyProg = list.find((f) => f.hasVideo && f.hasAudio && f.isAvc);
    const anyAdap = list
      .filter((f) => f.hasVideo && !f.hasAudio && f.isAvc)
      .sort((a, b) => b.shortSide - a.shortSide || b.bitrate - a.bitrate)[0];
    if (anyProg) {
      qualities.push({
        id: '360p-fast',
        shortLabel: `${anyProg.shortSide || 360}p MP4`,
        label: `${anyProg.shortSide || 360}p MP4 — Siap Unduh & Potong${formatMb(anyProg.contentLength)}`,
        mode: 'progressive',
        converterFormat: '360',
        videoItag: anyProg.itag,
        totalBytes: anyProg.contentLength,
        recommended: true
      });
    } else if (anyAdap && bestAudio) {
      const total = (anyAdap.contentLength || 0) + (bestAudio.contentLength || 0);
      qualities.push({
        id: '360p-fast',
        shortLabel: `${anyAdap.shortSide || 360}p MP4`,
        label: `${anyAdap.shortSide || 360}p MP4 — Siap Unduh & Potong${formatMb(total)}`,
        mode: 'adaptive',
        converterFormat: '360',
        videoItag: anyAdap.itag,
        audioItag: bestAudio.itag,
        videoBytes: anyAdap.contentLength,
        audioBytes: bestAudio.contentLength,
        totalBytes: total,
        recommended: true
      });
    }
  }

  if (qualities.length > 0 && !qualities.some((q) => q.recommended)) {
    qualities[0].recommended = true;
  }

  return { qualities, formatsByItag };
}

const visitorCacheByHost = new Map();

async function mintClientVisitorData(apiHost, clientDef, { forceFresh = false } = {}) {
  const cacheKey = `${apiHost}:${clientDef.name}`;
  const existing = visitorCacheByHost.get(cacheKey);
  if (!forceFresh && existing && Date.now() - existing.at < 10 * 60 * 1000) {
    return existing.value;
  }

  try {
    const res = await fetch(`${apiHost}/youtubei/v1/visitor_id?prettyPrint=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': clientDef.ua
      },
      body: JSON.stringify({
        context: {
          client: {
            ...clientDef.client,
            hl: clientDef.hl || 'en',
            gl: clientDef.gl || 'US'
          }
        }
      })
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const minted = data?.responseContext?.visitorData || '';
      if (minted) {
        visitorCacheByHost.set(cacheKey, { value: minted, at: Date.now() });
        return minted;
      }
    }
  } catch {}

  return existing?.value || '';
}

async function callInnerTubePlayer(videoId, clientDef, visitorData = '') {
  const clientCtx = {
    ...clientDef.client,
    hl: clientDef.hl || 'en',
    gl: clientDef.gl || 'US'
  };

  const useVisitor = Boolean(clientDef.useEmbedVisitor && visitorData);
  if (useVisitor) {
    clientCtx.visitorData = visitorData;
  }

  const bodyObj = {
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
    context: {
      client: clientCtx,
      ...(clientDef.thirdParty ? { thirdParty: clientDef.thirdParty } : {})
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': clientDef.ua
  };
  if (clientDef.sendClientHeaders && clientDef.clientId) {
    headers['X-YouTube-Client-Name'] = String(clientDef.clientId);
    headers['X-YouTube-Client-Version'] = clientDef.client.clientVersion;
  }
  if (useVisitor) {
    headers['X-Goog-Visitor-Id'] = visitorData;
  }

  const endpoint = clientDef.apiHost || 'https://www.youtube.com';
  const res = await fetch(`${endpoint}/youtubei/v1/player?prettyPrint=false`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj)
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function resolveViaConfiguredUpstream(videoId, upstreamCfg, fallbackMeta) {
  if (!upstreamCfg || !upstreamCfg.endpoint) return null;
  const headers = { 'User-Agent': WEB_DESKTOP_UA };
  if (upstreamCfg.headerName && upstreamCfg.apiKey) {
    headers[upstreamCfg.headerName] = upstreamCfg.apiKey;
  }

  const ytWatch = `https://www.youtube.com/watch?v=${videoId}`;
  const reqUrl = upstreamCfg.endpoint
    .replace('{VIDEO_ID}', encodeURIComponent(videoId))
    .replace('{VIDEO_URL}', encodeURIComponent(ytWatch));

  const initRes = await fetch(reqUrl, { headers });
  if (!initRes.ok) return null;
  const initJson = await initRes.json().catch(() => null);
  if (!initJson) return null;

  let directDownloadUrl = initJson.download_url || initJson.url || '';
  if (!directDownloadUrl && initJson.progress_url) {
    for (let poll = 0; poll < 16; poll++) {
      await new Promise((r) => setTimeout(r, 1100));
      const pRes = await fetch(initJson.progress_url, { headers });
      if (!pRes.ok) continue;
      const pJson = await pRes.json().catch(() => null);
      if (pJson?.download_url) {
        directDownloadUrl = pJson.download_url;
        break;
      }
      if (Number(pJson?.progress || 0) >= 1000 && pJson?.url) {
        directDownloadUrl = pJson.url;
        break;
      }
    }
  }
  if (!directDownloadUrl) return null;

  const formatsByItag = new Map();
  formatsByItag.set(7200, {
    itag: 7200,
    url: directDownloadUrl,
    mimeType: 'video/mp4',
    height: 720,
    width: 1280,
    bitrate: 0,
    contentLength: 0,
    hasVideo: true,
    hasAudio: true,
    isAvc: true,
    isM4a: true
  });

  return {
    videoId,
    title: initJson.info?.title || fallbackMeta.title || 'Video YouTube',
    author: fallbackMeta.author || 'YouTube',
    durationSec: Number(fallbackMeta.durationSec || 0),
    thumbnailUrl: initJson.info?.image || fallbackMeta.thumbnailUrl,
    ua: WEB_DESKTOP_UA,
    formatsByItag,
    qualities: [
      {
        id: '720p-hd',
        shortLabel: '720p HD',
        label: '720p HD — MP4 Utuh Siap Unduh & Potong (Rekomendasi)',
        mode: 'progressive',
        videoItag: 7200,
        totalBytes: 0,
        recommended: true
      }
    ],
    captionTracks: []
  };
}

async function resolveYoutubeMediaOnEdge(
  videoId,
  env,
  { forceRefresh = false, skipMetadataSignals = false, attemptOffset = 0 } = {}
) {
  const cached = edgePlayerCache.get(videoId);
  if (
    !forceRefresh &&
    cached &&
    cached.formatsByItag?.size > 0 &&
    Date.now() - cached.createdAt < PLAYER_CACHE_TTL_MS &&
    (skipMetadataSignals || cached.metadataHydrated)
  ) {
    return cached;
  }

  let watchSignals = {
    oembed: null,
    oembedStatus: 200,
    visitorData: '',
    heatmap: [],
    watchCaptionTracks: [],
    watchVideoDetails: null,
    htmlDurationSec: 0
  };

  const iosBase = {
    name: 'IOS',
    clientId: 5,
    sendClientHeaders: false,
    useEmbedVisitor: true,
    hl: 'en',
    gl: 'US',
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)',
    client: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.2.22C152'
    }
  };

  const vrBase = {
    name: 'ANDROID_VR',
    clientId: 28,
    sendClientHeaders: false,
    useEmbedVisitor: true,
    hl: 'en',
    gl: 'US',
    ua: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    client: {
      clientName: 'ANDROID_VR',
      clientVersion: '1.60.19',
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      androidSdkVersion: 32,
      osName: 'Android',
      osVersion: '12L'
    }
  };

  const clientsToTry = [
    { ...vrBase, apiHost: 'https://www.youtube.com' },
    { ...iosBase, apiHost: 'https://www.youtube.com' },
    { ...vrBase, apiHost: 'https://m.youtube.com' },
    { ...iosBase, apiHost: 'https://m.youtube.com' },
    { ...iosBase, apiHost: 'https://www.youtube-nocookie.com' },
    {
      name: 'ANDROID',
      clientId: 3,
      apiHost: 'https://www.youtube.com',
      sendClientHeaders: false,
      useEmbedVisitor: true,
      hl: 'en',
      gl: 'US',
      ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 34,
        osName: 'Android',
        osVersion: '14'
      }
    },
    {
      name: 'WEB_EMBEDDED_PLAYER',
      clientId: 56,
      apiHost: 'https://www.youtube.com',
      sendClientHeaders: true,
      useEmbedVisitor: true,
      hl: 'id',
      gl: 'ID',
      ua: WEB_DESKTOP_UA,
      client: {
        clientName: 'WEB_EMBEDDED_PLAYER',
        clientVersion: '1.20260115.01.00'
      },
      thirdParty: {
        embedUrl: 'https://www.google.com/'
      }
    }
  ];

  let chosenPlayer = null;
  let chosenUa = WEB_DESKTOP_UA;
  let builtQualities = null;
  let harvestedVideoDetails = null;
  let harvestedCaptionTracks = [];

  for (let step = 0; step < clientsToTry.length; step++) {
    const cIdx = (step + Math.max(0, Number(attemptOffset) || 0)) % clientsToTry.length;
    const clientDef = clientsToTry[cIdx];
    try {
      const mintedVis =
        (await mintClientVisitorData(clientDef.apiHost, clientDef, {
          forceFresh: forceRefresh || step > 0
        })) ||
        watchSignals.visitorData ||
        '';
      const pJson = await callInnerTubePlayer(videoId, clientDef, mintedVis);
      if (!pJson) continue;

      if (!harvestedVideoDetails && (pJson?.videoDetails?.title || pJson?.videoDetails?.lengthSeconds)) {
        harvestedVideoDetails = pJson.videoDetails;
      }
      const pTracks = pJson?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (harvestedCaptionTracks.length === 0 && Array.isArray(pTracks) && pTracks.length > 0) {
        harvestedCaptionTracks = pTracks;
      }

      if (pJson?.playabilityStatus?.status !== 'OK') continue;

      const allFormats = [
        ...(pJson?.streamingData?.formats || []),
        ...(pJson?.streamingData?.adaptiveFormats || [])
      ];
      const dur = Number(
        pJson?.videoDetails?.lengthSeconds ||
          watchSignals.watchVideoDetails?.lengthSeconds ||
          watchSignals.htmlDurationSec ||
          0
      );
      const qData = buildQualityOptionsFromFormats(allFormats, dur);
      if (qData.qualities.length > 0) {
        chosenPlayer = pJson;
        chosenUa = clientDef.ua;
        builtQualities = qData;
        break;
      }
    } catch (innerErr) {
      if (innerErr?.code === 'VIDEO_UNAVAILABLE') throw innerErr;
    }
  }

  // Ambil sinyal pelengkap (Most-Replayed heatmap & oEmbed) SETELAH koneksi mobile IOS bersih selesai,
  // sehingga scraping HTML desktop tidak pernah memicu blokir IP sebelum stream video didapat!
  if (!skipMetadataSignals) {
    watchSignals = await fetchWatchPageAndOembedSignals(videoId).catch(() => watchSignals);
    if (
      !builtQualities &&
      (watchSignals.oembedStatus === 401 || watchSignals.oembedStatus === 403 || watchSignals.oembedStatus === 404) &&
      !watchSignals.watchVideoDetails &&
      !harvestedVideoDetails
    ) {
      const err = new Error(
        'Video YouTube ini bersifat Pribadi (Private), sudah dihapus, atau dibatasi pemilik channel.'
      );
      err.code = 'VIDEO_UNAVAILABLE';
      throw err;
    }
  }

  if (!builtQualities) {
    const upstreamCfg = parseOptionalUpstreamConfig(env);
    const mergedFallbackDetails = harvestedVideoDetails || watchSignals.watchVideoDetails || null;
    const knownTitle = watchSignals.oembed?.title || mergedFallbackDetails?.title || '';
    const knownAuthor = watchSignals.oembed?.author_name || mergedFallbackDetails?.author || 'YouTube';
    const rawDurSec = Number(mergedFallbackDetails?.lengthSeconds || watchSignals.htmlDurationSec || 0);
    const thumbFallback =
      watchSignals.oembed?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const fallbackMeta = {
      title: knownTitle || 'Video YouTube',
      author: knownAuthor,
      durationSec: rawDurSec,
      thumbnailUrl: thumbFallback
    };

    const upResolved = await resolveViaConfiguredUpstream(videoId, upstreamCfg, fallbackMeta);
    if (upResolved) {
      const capTracks =
        harvestedCaptionTracks.length > 0
          ? harvestedCaptionTracks
          : watchSignals.watchCaptionTracks.length > 0
          ? watchSignals.watchCaptionTracks
          : upResolved.captionTracks;
      const capRes = await fetchCaptionWordsFromTracks(capTracks, WEB_DESKTOP_UA);
      const entry = {
        ...upResolved,
        heatmap: watchSignals.heatmap || [],
        words: capRes.words,
        captionMeta: capRes.captionMeta,
        createdAt: Date.now()
      };
      edgePlayerCache.set(videoId, entry);
      return entry;
    }

    const err = new Error(
      'Video YouTube ini membatasi unduhan otomatis atau memerlukan login usia. Coba link publik lain atau pilih file video lokal (.MP4 / .MOV / .MKV).'
    );
    err.code = 'STREAM_RESTRICTED';
    throw err;
  }

  const vd = chosenPlayer.videoDetails || harvestedVideoDetails || watchSignals.watchVideoDetails || {};
  const playerTracks = chosenPlayer?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  const mergedTracks =
    playerTracks.length > 0
      ? playerTracks
      : harvestedCaptionTracks.length > 0
      ? harvestedCaptionTracks
      : watchSignals.watchCaptionTracks;
  const capRes = skipMetadataSignals
    ? {
        words: [],
        captionMeta: { available: false, languageCode: '', isAutoGenerated: false, wordCount: 0 }
      }
    : await fetchCaptionWordsFromTracks(mergedTracks, chosenUa);

  const thumbs = vd?.thumbnail?.thumbnails || [];
  const bestThumb =
    thumbs.length > 0
      ? thumbs[thumbs.length - 1].url
      : watchSignals.oembed?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const resolvedDur =
    Number(vd.lengthSeconds || watchSignals.htmlDurationSec || 0) ||
    (capRes.words.length > 0 ? Math.ceil(capRes.words[capRes.words.length - 1].end + 2) : 0);

  const entry = {
    videoId,
    title: vd.title || watchSignals.oembed?.title || 'Video YouTube',
    author: vd.author || watchSignals.oembed?.author_name || 'YouTube',
    durationSec: resolvedDur,
    thumbnailUrl: bestThumb,
    ua: chosenUa,
    formatsByItag: builtQualities.formatsByItag,
    qualities: builtQualities.qualities,
    heatmap: watchSignals.heatmap || [],
    words: capRes.words,
    captionMeta: capRes.captionMeta,
    metadataHydrated: !skipMetadataSignals,
    createdAt: Date.now()
  };

  if (!skipMetadataSignals || !edgePlayerCache.has(videoId)) {
    edgePlayerCache.set(videoId, entry);
  } else {
    const prev = edgePlayerCache.get(videoId);
    edgePlayerCache.set(videoId, {
      ...prev,
      ua: chosenUa,
      formatsByItag: builtQualities.formatsByItag,
      qualities: builtQualities.qualities,
      createdAt: Date.now()
    });
  }
  if (edgePlayerCache.size > 40) {
    const oldestKey = edgePlayerCache.keys().next().value;
    if (oldestKey) edgePlayerCache.delete(oldestKey);
  }
  return entry;
}

function findBestMatchingFormat(entry, requestedItag) {
  const direct = entry.formatsByItag?.get(Number(requestedItag));
  if (direct && direct.url) return direct;
  if (!entry.formatsByItag || entry.formatsByItag.size === 0) return null;

  const list = Array.from(entry.formatsByItag.values()).filter((f) => f && f.url);
  const wantAudioOnly = [139, 140, 141, 249, 250, 251].includes(Number(requestedItag));
  if (wantAudioOnly) {
    return (
      list.filter((f) => !f.hasVideo && f.hasAudio && f.isM4a).sort((a, b) => b.bitrate - a.bitrate)[0] ||
      list.filter((f) => !f.hasVideo && f.hasAudio).sort((a, b) => b.bitrate - a.bitrate)[0] ||
      null
    );
  }
  const targetHeightMap = { 18: 360, 133: 240, 134: 360, 135: 480, 136: 720, 137: 1080 };
  const targetH = targetHeightMap[Number(requestedItag)] || 360;
  return (
    list
      .filter((f) => f.hasVideo && f.isAvc)
      .sort(
        (a, b) =>
          Math.abs((a.shortSide || a.height || 360) - targetH) -
          Math.abs((b.shortSide || b.height || 360) - targetH)
      )[0] || null
  );
}

async function fetchUpstreamFormatRange(entry, itag, rangeStart, rangeEnd) {
  const fmt = findBestMatchingFormat(entry, itag);
  if (!fmt || !fmt.url) return { response: null, fmt: null };

  const headers = {
    'User-Agent': entry.ua || WEB_DESKTOP_UA,
    Accept: '*/*'
  };

  // Untuk adaptive stream YouTube, parameter query `&range=start-end` jauh lebih cepat & tidak memicu preflight
  let targetUrl = fmt.url;
  if (!fmt.hasAudio || !fmt.hasVideo) {
    if (rangeStart != null && rangeEnd != null && rangeEnd >= rangeStart) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${sep}range=${rangeStart}-${rangeEnd}`;
    }
  } else if (rangeStart != null && rangeEnd != null && rangeEnd >= rangeStart) {
    headers.Range = `bytes=${rangeStart}-${rangeEnd}`;
  } else if (rangeStart != null && rangeStart > 0) {
    headers.Range = `bytes=${rangeStart}-`;
  }

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers,
    redirect: 'follow'
  });
  return { response, fmt };
}

/* ============================================================================
 * PENANGAN API SERVER (/api/*)
 * ============================================================================ */

async function handleApiRequest(request, env, ctx = null) {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range'
      }
    });
  }

  /* 1. INFO VERSI APLIKASI */
  if (url.pathname === '/api/version' && request.method === 'GET') {
    return jsonResponse({
      ok: true,
      version: APP_VERSION,
      releaseDate: '2026-10-31',
      supportedBrowsers: 'Google Chrome 94+, Microsoft Edge 94+, Brave 1.32+, Opera 80+',
      extensionlessYoutube: true,
      notes:
        'Pembaruan v2.2: Tempel link YouTube langsung tanpa ekstensi tambahan, pengunduh video YouTube (.MP4), subtitle anti-miss 100%, dan pemilih 9 font subtitle kustom.'
    });
  }

  /* 2. LAPORAN ERROR TANPA VIDEO & TANPA DATA PRIBADI */
  if (url.pathname === '/api/error-report' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Format laporan tidak valid.' }, 400);
    }

    const reportId = `KLIP-ERR-${Date.now().toString(36).toUpperCase()}`;
    const safeSummary = String(body.summary || 'Laporan diagnostik')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[disensor]')
      .slice(0, 400);
    const safeLogs = (Array.isArray(body.logs) ? body.logs : [])
      .slice(0, 25)
      .map((l) => String(l || '').slice(0, 300));

    recentErrorReports.unshift({
      reportId,
      receivedAt: new Date().toISOString(),
      clientVersion: String(body.clientVersion || APP_VERSION).slice(0, 20),
      summary: safeSummary,
      logCount: safeLogs.length,
      environment: body.environment || {}
    });
    if (recentErrorReports.length > 50) recentErrorReports.pop();

    return jsonResponse({
      ok: true,
      reportId,
      receivedAt: new Date().toISOString(),
      message: 'Laporan log teknis (tanpa video & tanpa data pribadi) berhasil diterima.'
    });
  }

  const cfg = parseLicenseServerConfig(env);
  if (!cfg) {
    return jsonResponse(
      {
        ok: false,
        code: 'SERVER_CONFIG_MISSING',
        error: 'Konfigurasi rahasia server lisensi belum dipasang pada environment.'
      },
      503
    );
  }

  /* 3. JALUR YOUTUBE LANGSUNG TANPA EKSTENSI (TERKUNCI KHUSUS PENGGUNA BERLISENSI SAH) */
  if (url.pathname.startsWith('/api/youtube/')) {
    const validSession = await getAuthenticatedSession(request, cfg);
    if (!validSession) {
      return jsonResponse(
        {
          ok: false,
          code: 'AUTH_REQUIRED',
          error: 'Masuk dengan kode lisensi resmi terlebih dahulu untuk memproses atau mengunduh link YouTube.'
        },
        401
      );
    }

    if (url.pathname === '/api/youtube/info' && request.method === 'GET') {
      const rawUrl = url.searchParams.get('url') || url.searchParams.get('v') || '';
      const videoId = extractYoutubeVideoId(rawUrl);
      if (!videoId) {
        return jsonResponse(
          {
            ok: false,
            code: 'INVALID_URL',
            error: 'Format link YouTube tidak dikenali. Gunakan link youtube.com/watch?v=... atau youtu.be/...'
          },
          400
        );
      }

      try {
        const attNum = Math.max(1, Number(url.searchParams.get('att') || 1));
        const entry = await resolveYoutubeMediaOnEdge(videoId, env, {
          forceRefresh: attNum > 1,
          attemptOffset: attNum - 1
        });

        return jsonResponse({
          ok: true,
          mode: 'direct-edge',
          videoId: entry.videoId,
          title: entry.title,
          author: entry.author,
          durationSec: entry.durationSec,
          thumbnailUrl: entry.thumbnailUrl,
          qualities: entry.qualities,
          heatmap: entry.heatmap,
          words: entry.words,
          captionMeta: entry.captionMeta
        });
      } catch (ytErr) {
        return jsonResponse(
          {
            ok: false,
            code: ytErr?.code || 'YOUTUBE_RESOLVE_FAILED',
            error:
              ytErr?.message ||
              'Link YouTube ini belum bisa dimuat. Pastikan video bersifat Publik (Public).'
          },
          200
        );
      }
    }

    if (url.pathname === '/api/youtube/stream' && request.method === 'GET') {
      const videoId = extractYoutubeVideoId(url.searchParams.get('v') || '');
      const itag = Number(url.searchParams.get('itag') || 0);
      const start = Math.max(0, Number(url.searchParams.get('start') || 0));
      const requestedEnd = Number(url.searchParams.get('end') || start + MAX_STREAM_CHUNK_BYTES - 1);
      const end = Math.min(start + MAX_STREAM_CHUNK_BYTES - 1, Math.max(start, requestedEnd));

      if (!videoId || !itag) {
        return jsonResponse({ ok: false, error: 'Parameter video atau kualitas tidak lengkap.' }, 400);
      }

      try {
        let entry = await resolveYoutubeMediaOnEdge(videoId, env, {
          forceRefresh: false,
          skipMetadataSignals: true
        });
        let { response: upRes, fmt } = await fetchUpstreamFormatRange(entry, itag, start, end);
        const firstStatus = upRes ? upRes.status : 0;

        // Bila pindah isolate IP atau link kadaluarsa, segarkan sekali langsung di isolate ini!
        if (!upRes || upRes.status === 401 || upRes.status === 403 || upRes.status === 410) {
          entry = await resolveYoutubeMediaOnEdge(videoId, env, {
            forceRefresh: true,
            skipMetadataSignals: true
          });
          const retry = await fetchUpstreamFormatRange(entry, itag, start, end);
          upRes = retry.response;
          fmt = retry.fmt;
        }

        if (!upRes || (!upRes.ok && upRes.status !== 206)) {
          return jsonResponse(
            {
              ok: false,
              code: 'UPSTREAM_STREAM_ERROR',
              firstStatus,
              retryStatus: upRes ? upRes.status : 0,
              mapSize: entry.formatsByItag?.size || 0,
              error: `Aliran video mengembalikan status ${upRes ? upRes.status : 'kosong'} (awal: ${firstStatus}).`
            },
            200
          );
        }

        const contentRange = upRes.headers.get('Content-Range') || '';
        let totalBytes = fmt?.contentLength || 0;
        const slashMatch = contentRange.match(/\/(\d+)/);
        if (slashMatch) {
          totalBytes = Number(slashMatch[1]);
        } else if (!totalBytes && start === 0) {
          const cl = Number(upRes.headers.get('Content-Length') || 0);
          const requestedSpan = end - start + 1;
          if (cl > 0 && upRes.status === 200 && cl < requestedSpan) {
            totalBytes = cl;
          }
        }

        const respHeaders = new Headers();
        respHeaders.set('Content-Type', fmt?.mimeType?.split(';')[0] || 'video/mp4');
        respHeaders.set('Cache-Control', 'private, no-store');
        respHeaders.set('Accept-Ranges', 'bytes');
        if (contentRange) respHeaders.set('Content-Range', contentRange);
        if (totalBytes > 0) respHeaders.set('X-Total-Bytes', String(totalBytes));

        return new Response(upRes.body, {
          status: upRes.status,
          headers: respHeaders
        });
      } catch (streamErr) {
        return jsonResponse(
          {
            ok: false,
            code: 'STREAM_FAILED',
            error: streamErr?.message || 'Gagal mengalirkan potongan byte video YouTube.'
          },
          200
        );
      }
    }

    if (url.pathname === '/api/youtube/download' && request.method === 'GET') {
      const videoId = extractYoutubeVideoId(url.searchParams.get('v') || '');
      const itag = Number(url.searchParams.get('itag') || 18);
      const rawName = String(url.searchParams.get('filename') || `youtube-${videoId}.mp4`)
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .slice(0, 90);
      const safeFilename = rawName.endsWith('.mp4') ? rawName : `${rawName}.mp4`;

      if (!videoId) {
        return jsonResponse({ ok: false, error: 'ID video tidak valid.' }, 400);
      }

      try {
        let entry = await resolveYoutubeMediaOnEdge(videoId, env, { forceRefresh: false });
        const fmt = entry.formatsByItag.get(itag);
        const browserRange = request.headers.get('Range') || '';

        const doDirectFetch = (ent) => {
          const f = ent.formatsByItag.get(itag);
          if (!f || !f.url) return Promise.resolve(null);
          const h = { 'User-Agent': ent.ua || WEB_DESKTOP_UA, Accept: '*/*' };
          if (browserRange) h.Range = browserRange;
          return fetch(f.url, { headers: h, redirect: 'follow' });
        };

        let upRes = await doDirectFetch(entry);
        if (!upRes || upRes.status === 401 || upRes.status === 403 || upRes.status === 410) {
          entry = await resolveYoutubeMediaOnEdge(videoId, env, { forceRefresh: true });
          upRes = await doDirectFetch(entry);
        }

        if (!upRes || (!upRes.ok && upRes.status !== 206)) {
          return jsonResponse({ ok: false, error: 'Gagal mengunduh file MP4 dari sumber.' }, 502);
        }

        const respHeaders = new Headers();
        respHeaders.set('Content-Type', fmt?.mimeType?.split(';')[0] || 'video/mp4');
        respHeaders.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
        respHeaders.set('Accept-Ranges', 'bytes');
        const cl = upRes.headers.get('Content-Length');
        const cr = upRes.headers.get('Content-Range');
        if (cl) respHeaders.set('Content-Length', cl);
        if (cr) respHeaders.set('Content-Range', cr);

        return new Response(upRes.body, {
          status: upRes.status,
          headers: respHeaders
        });
      } catch (dlErr) {
        return jsonResponse({ ok: false, error: dlErr?.message || 'Gagal mengunduh MP4.' }, 502);
      }
    }
  }

  /* 4. AKTIVASI LISENSI (1 LAPTOP UNTUK INTI/TAMBAHAN, MULTI-LAPTOP UNTUK PRO) */
  if (url.pathname === '/api/license/activate' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Permintaan aktivasi tidak valid.' }, 400);
    }

    const rawCode = String(body.code || '').trim().toUpperCase();
    const rawName = String(body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const deviceId = String(body.deviceId || '').trim() || 'dev-default';
    const deviceLabel = String(body.deviceLabel || 'Laptop Pembeli').slice(0, 60);

    if (!rawCode) {
      return jsonResponse(
        { ok: false, code: 'EMPTY_CODE', error: 'Masukkan kode lisensi pembelian terlebih dahulu.' },
        400
      );
    }

    const computedHash = await sha256HexAsync(cfg.salt + rawCode);
    const licEntry = cfg.licenses[computedHash] || null;
    if (!licEntry) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_CODE',
          error: 'Kode lisensi tidak valid atau salah ketik. Periksa kembali kode pembelian resmimu.'
        },
        401
      );
    }

    const isDev = licEntry.role === 'developer';
    if (!isDev) {
      if (rawName.length < 2) {
        return jsonResponse(
          { ok: false, code: 'NAME_REQUIRED', error: 'Masukkan nama kreator atau nama channel (minimal 2 huruf).' },
          400
        );
      }
      if (!EMAIL_REGEX.test(rawEmail)) {
        return jsonResponse(
          {
            ok: false,
            code: 'EMAIL_REQUIRED',
            error: 'Masukkan alamat email aktif yang dipakai saat pembelian (penting untuk pindah perangkat mandiri).'
          },
          400
        );
      }
    }

    const finalName = rawName || (isDev ? 'Developer Klip Auto' : 'Kreator Klip Auto');
    const finalEmail = rawEmail || (isDev ? 'dev@klipauto.local' : '');
    const maxDevices = Number(licEntry.maxDevices || (licEntry.tier === 'pro' ? 3 : 1));
    const reg = await readDeviceRegistry(licEntry.id);

    const existingIdx = reg.devices.findIndex((d) => d.id === deviceId);
    if (existingIdx === -1 && reg.devices.length >= maxDevices) {
      return jsonResponse(
        {
          ok: false,
          code: 'DEVICE_LIMIT_REACHED',
          canSelfTransfer: true,
          currentDeviceHint: reg.devices[0]?.label || 'Perangkat sebelumnya',
          error: `Lisensi ini dibatasi untuk ${maxDevices} perangkat dan sedang aktif di perangkat lain (${
            reg.devices[0]?.label || 'laptop lama'
          }). Gunakan tombol "Pindah Perangkat Mandiri" di bawah untuk memindahkan akses ke laptop ini.`
        },
        409
      );
    }

    const nextDevices = [...reg.devices];
    if (existingIdx >= 0) {
      nextDevices[existingIdx] = { id: deviceId, label: deviceLabel, boundAt: Date.now() };
    } else {
      nextDevices.push({ id: deviceId, label: deviceLabel, boundAt: Date.now() });
    }

    const savedReg = await writeDeviceRegistry(licEntry.id, {
      ...reg,
      ownerEmail: reg.ownerEmail || finalEmail,
      devices: nextDevices
    });

    const exp = Date.now() + SEVEN_DAYS_SEC * 1000;
    const tokenPayload = {
      sub: licEntry.id,
      tier: licEntry.tier || 'inti',
      role: licEntry.role || 'buyer',
      name: finalName,
      email: finalEmail,
      deviceId,
      gen: savedReg.generation || 1,
      exp
    };
    const token = await createSignedSessionToken(tokenPayload, cfg.hmacSecret);

    return jsonResponse(
      {
        ok: true,
        user: {
          name: finalName,
          email: finalEmail,
          role: tokenPayload.role
        },
        tier: tokenPayload.tier,
        tierLabel: getTierLabel(tokenPayload.tier),
        features: buildPackageFeatures(tokenPayload.tier),
        activatedAt: Date.now(),
        leaseExpiresAt: exp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(token, isHttps) }
    );
  }

  /* 5. PINDAH PERANGKAT MANDIRI */
  if (url.pathname === '/api/license/transfer' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Permintaan pindah perangkat tidak valid.' }, 400);
    }

    const rawCode = String(body.code || '').trim().toUpperCase();
    const rawName = String(body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const deviceId = String(body.deviceId || '').trim() || 'dev-transferred';
    const deviceLabel = String(body.deviceLabel || 'Laptop Baru').slice(0, 60);

    if (!rawCode) {
      return jsonResponse({ ok: false, error: 'Masukkan kode lisensi untuk memindahkan perangkat.' }, 400);
    }

    const computedHash = await sha256HexAsync(cfg.salt + rawCode);
    const licEntry = cfg.licenses[computedHash] || null;
    if (!licEntry) {
      return jsonResponse({ ok: false, code: 'INVALID_CODE', error: 'Kode lisensi tidak dikenali.' }, 401);
    }

    const isDev = licEntry.role === 'developer';
    const reg = await readDeviceRegistry(licEntry.id);

    if (!isDev) {
      if (!EMAIL_REGEX.test(rawEmail)) {
        return jsonResponse(
          { ok: false, error: 'Masukkan email pembelian untuk memverifikasi pindah perangkat mandiri.' },
          400
        );
      }
      if (reg.ownerEmail && reg.ownerEmail !== rawEmail) {
        return jsonResponse(
          {
            ok: false,
            code: 'EMAIL_MISMATCH',
            error: 'Email tidak sesuai dengan email yang terdaftar saat aktivasi pertama kode ini.'
          },
          403
        );
      }
    }

    const finalName = rawName || (isDev ? 'Developer Klip Auto' : 'Kreator Klip Auto');
    const finalEmail = rawEmail || reg.ownerEmail || (isDev ? 'dev@klipauto.local' : '');
    const nextGen = (reg.generation || 1) + 1;

    await writeDeviceRegistry(licEntry.id, {
      licenseId: licEntry.id,
      generation: nextGen,
      ownerEmail: finalEmail,
      devices: [{ id: deviceId, label: deviceLabel, boundAt: Date.now() }]
    });

    const exp = Date.now() + SEVEN_DAYS_SEC * 1000;
    const tokenPayload = {
      sub: licEntry.id,
      tier: licEntry.tier || 'inti',
      role: licEntry.role || 'buyer',
      name: finalName,
      email: finalEmail,
      deviceId,
      gen: nextGen,
      exp
    };
    const token = await createSignedSessionToken(tokenPayload, cfg.hmacSecret);

    return jsonResponse(
      {
        ok: true,
        transferred: true,
        user: { name: finalName, email: finalEmail, role: tokenPayload.role },
        tier: tokenPayload.tier,
        tierLabel: getTierLabel(tokenPayload.tier),
        features: buildPackageFeatures(tokenPayload.tier),
        leaseExpiresAt: exp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(token, isHttps) }
    );
  }

  /* 6. VERIFIKASI SESI AKTIF */
  if (url.pathname === '/api/license/verify' && request.method === 'GET') {
    const rawCookie = readCookieValue(request, SESSION_COOKIE_NAME);
    if (!rawCookie) {
      return jsonResponse({ ok: false, code: 'NO_VALID_SESSION' }, 200);
    }
    const verified = await verifySignedSessionToken(rawCookie, cfg.hmacSecret);
    if (!verified) {
      return jsonResponse(
        { ok: false, code: 'SESSION_EXPIRED' },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    const reqDeviceId = url.searchParams.get('deviceId') || verified.deviceId;
    if (reqDeviceId !== verified.deviceId) {
      return jsonResponse(
        {
          ok: false,
          code: 'DEVICE_MISMATCH',
          error: 'Sesi ini terikat pada perangkat lain.'
        },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    const reg = await readDeviceRegistry(verified.sub);
    if (
      reg.devices.length > 0 &&
      ((reg.generation && verified.gen && verified.gen < reg.generation) ||
        !reg.devices.some((d) => d.id === verified.deviceId))
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'REVOKED_TRANSFERRED',
          error: 'Lisensi ini telah dipindahkan ke perangkat lain.'
        },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    const liveEntry =
      Object.values(cfg.licenses).find((item) => item && item.id === verified.sub) || null;
    const currentTier = liveEntry?.tier || verified.tier || 'inti';
    const refreshedExp = Date.now() + SEVEN_DAYS_SEC * 1000;

    const refreshedToken = await createSignedSessionToken(
      { ...verified, tier: currentTier, exp: refreshedExp },
      cfg.hmacSecret
    );

    return jsonResponse(
      {
        ok: true,
        user: {
          name: verified.name,
          email: verified.email,
          role: verified.role
        },
        tier: currentTier,
        tierLabel: getTierLabel(currentTier),
        features: buildPackageFeatures(currentTier),
        leaseExpiresAt: refreshedExp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(refreshedToken, isHttps) }
    );
  }

  /* 7. LEPAS PERANGKAT SAAT INI / KELUAR */
  if (
    (url.pathname === '/api/license/release' || url.pathname === '/api/license/logout') &&
    request.method === 'POST'
  ) {
    const rawCookie = readCookieValue(request, SESSION_COOKIE_NAME);
    const verified = await verifySignedSessionToken(rawCookie, cfg.hmacSecret);

    if (verified && url.pathname === '/api/license/release') {
      const reg = await readDeviceRegistry(verified.sub);
      const remaining = reg.devices.filter((d) => d.id !== verified.deviceId);
      await writeDeviceRegistry(verified.sub, {
        ...reg,
        generation: (reg.generation || 1) + 1,
        devices: remaining
      });
    }

    return jsonResponse(
      { ok: true },
      200,
      { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
    );
  }

  return jsonResponse({ ok: false, error: 'Endpoint server tidak ditemukan.' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // Kunci kode aplikasi inti di belakang verifikasi sesi lisensi server!
    if (isProtectedAppAsset(url.pathname)) {
      const cfg = parseLicenseServerConfig(env);
      const validSession = await getAuthenticatedSession(request, cfg);

      if (!validSession) {
        return jsonResponse(
          {
            ok: false,
            code: 'AUTH_REQUIRED',
            error: 'Kode aplikasi Klip Auto hanya dikirim setelah lisensi tervalidasi di server.'
          },
          401
        );
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    if (isProtectedAppAsset(url.pathname)) {
      headers.set('Cache-Control', 'private, no-store');
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
};

/**
 * Klip Auto Companion Bridge — Background Service Worker (Manifest V3)
 * Berjalan 100% di koneksi internet pembeli sendiri (tanpa server proxy & tanpa layanan pihak ketiga):
 * 1. Mengambil metadata, daftar stream H.264/AAC, subtitle kata, & grafik Most-Replayed (heatmap) asli YouTube
 * 2. Mengambil potongan byte langsung dari CDN googlevideo sesuai IP internet pembeli
 * 3. Memperbarui konfigurasi klien YouTube secara otomatis dari endpoint info versi resmi Klip Auto
 */

const BRIDGE_VERSION = '2.1.0';
const VERSION_ENDPOINT = 'https://nifari-klip-auto-app.pages.dev/api/version';

let dynamicClientConfig = {
  androidVersion: '20.10.38',
  iosVersion: '20.10.4',
  checkedAt: 0
};

async function refreshDynamicConfigIfNeeded() {
  if (Date.now() - dynamicClientConfig.checkedAt < 6 * 3600 * 1000) {
    return dynamicClientConfig;
  }
  try {
    const res = await fetch(VERSION_ENDPOINT, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.ytExtractorConfig) {
        dynamicClientConfig = {
          ...dynamicClientConfig,
          ...data.ytExtractorConfig,
          checkedAt: Date.now()
        };
      }
    }
  } catch {
    dynamicClientConfig.checkedAt = Date.now();
  }
  return dynamicClientConfig;
}

function decodeEntities(str) {
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

function extractBalancedJsonAfter(text, marker) {
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  const start = idx + marker.length;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < Math.min(text.length, start + 2400000); i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Mengekstrak Grafik Most-Replayed (`heatmap`) dari ytInitialData halaman Watch YouTube.
 */
function extractHeatmapFromInitialData(html) {
  const heatmap = [];
  if (!html) return heatmap;

  const markerRegex =
    /"(?:timeRangeStartMillis|startMillis)"\s*:\s*"?(\d+)"?\s*,\s*"(?:markerDurationMillis|durationMillis)"\s*:\s*"?(\d+)"?\s*,\s*"(?:heatMarkerIntensityScoreNormalized|intensityScoreNormalized)"\s*:\s*([0-9.]+)/g;
  let m;
  while ((m = markerRegex.exec(html)) !== null) {
    const startSec = Number(m[1]) / 1000;
    const durSec = Number(m[2]) / 1000;
    const intensity = Number(m[3]);
    if (Number.isFinite(startSec) && durSec > 0 && Number.isFinite(intensity)) {
      heatmap.push({
        startSec: Number(startSec.toFixed(2)),
        endSec: Number((startSec + durSec).toFixed(2)),
        intensity: Number(Math.max(0, Math.min(1, intensity)).toFixed(4))
      });
    }
  }
  return heatmap;
}

function parseSrv3ToWords(xmlText, maxDurationSec = 10800) {
  const words = [];
  if (!xmlText || !xmlText.includes('<p ')) return words;

  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const attrs = pMatch[1] || '';
    const inner = pMatch[2] || '';
    const tMatch = attrs.match(/\bt="(\d+)"/);
    if (!tMatch) continue;
    const dMatch = attrs.match(/\bd="(\d+)"/);
    const pStartMs = Number(tMatch[1]) || 0;
    const pDurMs = dMatch ? Number(dMatch[1]) : 2600;
    const pEndMs = pStartMs + Math.max(250, pDurMs);

    if (inner.includes('<s')) {
      const sRegex = /<s\b([^>]*)>([\s\S]*?)<\/s>/g;
      const segTokens = [];
      let sMatch;
      while ((sMatch = sRegex.exec(inner)) !== null) {
        const sAttrs = sMatch[1] || '';
        const rawWord = decodeEntities(sMatch[2].replace(/<[^>]+>/g, '')).trim();
        if (!rawWord) continue;
        const offMatch = sAttrs.match(/\bt="(\d+)"/);
        segTokens.push({
          word: rawWord,
          startMs: pStartMs + (offMatch ? Number(offMatch[1]) : 0)
        });
      }
      for (let i = 0; i < segTokens.length; i++) {
        const cur = segTokens[i];
        const nextMs = i + 1 < segTokens.length ? segTokens[i + 1].startMs : pEndMs;
        const ws = Math.max(0, Math.min(maxDurationSec, cur.startMs / 1000));
        const we = Math.max(ws + 0.08, Math.min(maxDurationSec, Math.max(cur.startMs + 110, nextMs) / 1000));
        const parts = cur.word.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          words.push({ word: parts[0], start: Number(ws.toFixed(3)), end: Number(we.toFixed(3)) });
        } else {
          const step = (we - ws) / parts.length;
          for (let k = 0; k < parts.length; k++) {
            const ks = ws + k * step;
            words.push({
              word: parts[k],
              start: Number(ks.toFixed(3)),
              end: Number(Math.min(maxDurationSec, ks + Math.max(0.08, step * 0.94)).toFixed(3))
            });
          }
        }
      }
    } else {
      const cleanLine = decodeEntities(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
      if (!cleanLine) continue;
      const parts = cleanLine.split(' ').filter(Boolean);
      const s0 = Math.max(0, Math.min(maxDurationSec, pStartMs / 1000));
      const s1 = Math.max(s0 + 0.25, Math.min(maxDurationSec, pEndMs / 1000));
      const step = (s1 - s0) / parts.length;
      for (let i = 0; i < parts.length; i++) {
        const ws = s0 + i * step;
        words.push({
          word: parts[i],
          start: Number(ws.toFixed(3)),
          end: Number(Math.min(maxDurationSec, ws + Math.max(0.08, step * 0.94)).toFixed(3))
        });
      }
    }
  }
  return words;
}

const streamCache = new Map();

async function ensureExtensionHeaderRules(userAgent) {
  if (!chrome?.declarativeNetRequest?.updateDynamicRules) return;
  const extId = chrome.runtime.id;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [9101, 9102, 9103],
    addRules: [
      {
        id: 9101,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'User-Agent', operation: 'set', value: userAgent },
            { header: 'Origin', operation: 'remove' },
            { header: 'Referer', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||youtube.com/youtubei/v1/player',
          initiatorDomains: [extId],
          resourceTypes: ['xmlhttprequest', 'other']
        }
      },
      {
        id: 9102,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'User-Agent', operation: 'set', value: userAgent },
            { header: 'Origin', operation: 'remove' },
            { header: 'Referer', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: 'googlevideo.com/videoplayback',
          initiatorDomains: [extId],
          resourceTypes: ['xmlhttprequest', 'other']
        }
      },
      {
        id: 9103,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'User-Agent', operation: 'set', value: userAgent },
            { header: 'Origin', operation: 'remove' },
            { header: 'Referer', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '||youtube.com/api/timedtext',
          initiatorDomains: [extId],
          resourceTypes: ['xmlhttprequest', 'other']
        }
      }
    ]
  });
}

async function fetchDirectYoutubeInfo(videoId) {
  const cfg = await refreshDynamicConfigIfNeeded();
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=id`, {
    credentials: 'omit'
  });
  if (!watchRes.ok) {
    throw new Error(`Halaman YouTube merespons status ${watchRes.status}.`);
  }
  const watchHtml = await watchRes.text();
  const watchPr = extractBalancedJsonAfter(watchHtml, 'ytInitialPlayerResponse = ');
  const heatmap = extractHeatmapFromInitialData(watchHtml);

  // Ambil URL stream langsung lewat InnerTube di IP internet pembeli sendiri
  let playerData = null;
  let activeUa = `com.google.android.youtube/${cfg.androidVersion} (Linux; U; Android 14) gzip`;
  const clients = [
    {
      ua: `com.google.android.youtube/${cfg.androidVersion} (Linux; U; Android 14) gzip`,
      clientNameId: '3',
      client: {
        clientName: 'ANDROID',
        clientVersion: cfg.androidVersion,
        androidSdkVersion: 34,
        osName: 'Android',
        osVersion: '14',
        hl: 'id',
        gl: 'ID'
      }
    },
    {
      ua: `com.google.ios.youtube/${cfg.iosVersion} (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)`,
      clientNameId: '5',
      client: {
        clientName: 'IOS',
        clientVersion: cfg.iosVersion,
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        osName: 'iPhone',
        osVersion: '18.3.2.22D82',
        hl: 'id',
        gl: 'ID'
      }
    }
  ];

  for (const c of clients) {
    try {
      await ensureExtensionHeaderRules(c.ua);
      const pRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'X-YouTube-Client-Name': c.clientNameId,
          'X-YouTube-Client-Version': c.client.clientVersion
        },
        body: JSON.stringify({
          videoId,
          context: { client: c.client },
          contentCheckOk: true,
          racyCheckOk: true
        })
      });
      if (pRes.ok) {
        const d = await pRes.json();
        const hasUrl = [
          ...(d?.streamingData?.formats || []),
          ...(d?.streamingData?.adaptiveFormats || [])
        ].some((f) => f && f.url);
        if (d?.playabilityStatus?.status === 'OK' && hasUrl) {
          playerData = d;
          activeUa = c.ua;
          break;
        }
      }
    } catch {}
  }
  await ensureExtensionHeaderRules(activeUa);

  const activePr = playerData || watchPr;
  if (!activePr || activePr?.playabilityStatus?.status !== 'OK') {
    const reason =
      activePr?.playabilityStatus?.reason ||
      'Video ini dibatasi usia, bersifat pribadi, atau tidak mengizinkan pemutaran luar.';
    throw new Error(reason);
  }

  const vd = activePr.videoDetails || watchPr?.videoDetails || {};
  const durationSec = Number(vd.lengthSeconds || 0);
  if (vd.isLiveContent && durationSec === 0) {
    throw new Error('Siaran langsung (Live) yang belum selesai tidak bisa dipotong langsung.');
  }

  const rawFormats = [
    ...(activePr?.streamingData?.formats || []),
    ...(activePr?.streamingData?.adaptiveFormats || [])
  ].filter((f) => f && f.itag && f.url);

  const itagMap = new Map();
  for (const f of rawFormats) {
    itagMap.set(Number(f.itag), {
      itag: Number(f.itag),
      url: f.url,
      mimeType: String(f.mimeType || 'video/mp4'),
      width: Number(f.width || 0),
      height: Number(f.height || 0),
      bitrate: Number(f.bitrate || f.averageBitrate || 0),
      contentLength: Number(f.contentLength || 0),
      hasVideo: Boolean(f.width || f.qualityLabel),
      hasAudio: Boolean(f.audioQuality || f.audioChannels)
    });
  }

  streamCache.set(videoId, { itagMap, savedAt: Date.now() });

  // Susun opsi resolusi H.264 + AAC
  const allFmts = Array.from(itagMap.values());
  const bestAudio =
    allFmts
      .filter((f) => !f.hasVideo && f.mimeType.includes('audio/mp4'))
      .sort((a, b) => (a.itag === 140 ? -1 : b.itag === 140 ? 1 : b.bitrate - a.bitrate))[0] || null;
  const avcVideos = allFmts.filter(
    (f) => f.hasVideo && !f.hasAudio && f.mimeType.includes('video/mp4') && f.mimeType.includes('avc1')
  );
  const progMp4 = allFmts.filter((f) => f.hasVideo && f.hasAudio && f.mimeType.includes('video/mp4'));

  const estBytes = (f) =>
    f?.contentLength > 0
      ? f.contentLength
      : f?.bitrate && durationSec > 0
      ? Math.round((f.bitrate * durationSec) / 8)
      : 0;

  const qualities = [];
  const audioBytes = bestAudio ? estBytes(bestAudio) : 0;

  const addAdaptive = (shortSide, id, label, shortLabel) => {
    const v = avcVideos.find((x) => Math.abs(Math.min(x.width, x.height) - shortSide) <= 40);
    if (v && bestAudio) {
      const vb = estBytes(v);
      qualities.push({
        id,
        label: `${label} (${v.width}×${v.height})`,
        shortLabel,
        mode: 'adaptive',
        videoItag: v.itag,
        audioItag: bestAudio.itag,
        width: v.width,
        height: v.height,
        videoBytes: vb,
        audioBytes,
        totalBytes: vb + audioBytes,
        recommended: shortSide === (durationSec > 2400 ? 480 : 720)
      });
    }
  };

  addAdaptive(720, '720p-hd', '720p HD Jernih', '720p HD');
  addAdaptive(480, '480p-sd', '480p Standar Hemat RAM', '480p SD');
  if (progMp4[0]) {
    const p = progMp4[0];
    const tb = estBytes(p);
    qualities.push({
      id: '360p-fast',
      label: `360p Cepat (${p.width}×${p.height})`,
      shortLabel: '360p Cepat',
      mode: 'progressive',
      videoItag: p.itag,
      audioItag: null,
      width: p.width,
      height: p.height,
      videoBytes: tb,
      audioBytes: 0,
      totalBytes: tb,
      recommended: qualities.length === 0
    });
  }
  addAdaptive(1080, '1080p-fhd', '1080p Full HD', '1080p Full HD');

  if (qualities.length === 0) {
    throw new Error(
      'YouTube tidak menyediakan aliran MP4 langsung pada video ini di koneksi saat ini.'
    );
  }
  if (!qualities.some((q) => q.recommended)) {
    const progOpt = qualities.find((q) => q.mode === 'progressive');
    if (durationSec > 2400 && progOpt) {
      progOpt.recommended = true;
    } else {
      qualities[0].recommended = true;
    }
  }

  // Ambil subtitle YouTube bila bagus (utamakan track bertanda tangan mobile activePr, lalu watchPr)
  const tracks =
    activePr?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
    watchPr?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
    [];
  let words = [];
  let captionMeta = { available: false };

  if (tracks.length > 0) {
    const rank = (t) => {
      const l = String(t.languageCode || '').toLowerCase();
      const auto = t.kind === 'asr';
      if (l === 'id' && !auto) return 100;
      if (l.startsWith('id')) return 88;
      if (l === 'en' && !auto) return 72;
      if (l.startsWith('en')) return 60;
      return auto ? 25 : 40;
    };
    const bestTrack = [...tracks].sort((a, b) => rank(b) - rank(a))[0];
    if (bestTrack?.baseUrl) {
      try {
        const u = new URL(bestTrack.baseUrl);
        u.searchParams.set('fmt', 'srv3');
        const cRes = await fetch(u.toString(), { credentials: 'omit' });
        if (cRes.ok) {
          const xml = await cRes.text();
          words = parseSrv3ToWords(xml, durationSec || 10800);
          captionMeta = {
            available: words.length >= 8,
            languageCode: bestTrack.languageCode || 'id',
            isAuto: bestTrack.kind === 'asr',
            wordCount: words.length
          };
        }
      } catch {}
    }
  }

  const thumbs = vd?.thumbnail?.thumbnails || [];
  return {
    videoId,
    title: vd.title || `Video YouTube ${videoId}`,
    author: vd.author || 'Channel YouTube',
    durationSec,
    viewCount: Number(vd.viewCount || 0),
    thumbnailUrl: thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    qualities,
    captionMeta,
    words,
    heatmap,
    bridgeVersion: BRIDGE_VERSION
  };
}

async function fetchDirectStreamChunk({ videoId, itag, start, end }) {
  let cached = streamCache.get(videoId);
  if (!cached || Date.now() - cached.savedAt > 20 * 60 * 1000) {
    await fetchDirectYoutubeInfo(videoId);
    cached = streamCache.get(videoId);
  }
  const fmt = cached?.itagMap?.get(Number(itag));
  if (!fmt?.url) {
    throw new Error(`Aliran itag ${itag} tidak ditemukan untuk video ini.`);
  }

  const res = await fetch(fmt.url, {
    credentials: 'omit',
    headers: {
      Range: `bytes=${start}-${end}`
    }
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`CDN YouTube merespons status ${res.status} pada jaringan ini.`);
  }

  const cr = res.headers.get('content-range') || '';
  const totalMatch = cr.match(/\/(\d+)$/);
  const totalBytes = totalMatch
    ? Number(totalMatch[1])
    : fmt.contentLength || Number(res.headers.get('content-length') || 0);

  const ab = await res.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  }

  return {
    base64: btoa(binary),
    byteLength: bytes.byteLength,
    totalBytes
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.action === 'YT_INFO') {
        const info = await fetchDirectYoutubeInfo(msg.payload?.videoId);
        sendResponse({ ok: true, data: info });
      } else if (msg.action === 'YT_CHUNK') {
        const chunk = await fetchDirectStreamChunk(msg.payload || {});
        sendResponse({ ok: true, data: chunk });
      } else {
        sendResponse({ ok: false, error: 'Aksi jembatan tidak dikenal.' });
      }
    } catch (err) {
      sendResponse({
        ok: false,
        error: err?.message || 'Gagal mengambil data dari YouTube lewat koneksi lokal.'
      });
    }
  })();
  return true;
});

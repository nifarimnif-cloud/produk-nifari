/**
 * Klip Auto — Cloudflare Pages Serverless Edge Proxy untuk Informasi, Subtitle & Stream YouTube
 * Menangani:
 * - GET /api/youtube/info?url=...   -> Metadata video, daftar kualitas MP4, & transkrip kata otomatis
 * - GET /api/youtube/stream?v=...   -> Pengambilan potongan byte (HTTP Range) cepat dari CDN YouTube
 * - Aset statis aplikasi tetap dilayani dengan header COOP/COEP untuk WebCodecs & WASM
 */

const STREAM_CACHE = new Map();
const CACHE_TTL_MS = 12 * 60 * 1000;

const CLIENTS = [
  {
    name: 'ANDROID',
    ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
    contextClient: {
      clientName: 'ANDROID',
      clientVersion: '20.10.38',
      androidSdkVersion: 34,
      osName: 'Android',
      osVersion: '14',
      hl: 'id',
      gl: 'ID'
    }
  },
  {
    name: 'IOS',
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    contextClient: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.3.2.22D82',
      hl: 'id',
      gl: 'ID'
    }
  }
];

export function extractYoutubeVideoId(input) {
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
        const candidate = parts[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
      }
    }
  } catch {
    // Abaikan kegagalan URL parser, lanjut regex cadangan
  }

  const m = raw.match(/(?:v=|\/shorts\/|\/live\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function decodeHtmlEntities(str) {
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

function parseSrv3TimedTextToWords(xmlText, maxDurationSec = 7200) {
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
    const pDurMs = dMatch ? Number(dMatch[1]) : 2800;
    const pEndMs = pStartMs + Math.max(250, pDurMs);

    if (inner.includes('<s')) {
      const sRegex = /<s\b([^>]*)>([\s\S]*?)<\/s>/g;
      const segTokens = [];
      let sMatch;
      while ((sMatch = sRegex.exec(inner)) !== null) {
        const sAttrs = sMatch[1] || '';
        const rawWord = decodeHtmlEntities(sMatch[2].replace(/<[^>]+>/g, '')).trim();
        if (!rawWord) continue;
        const offMatch = sAttrs.match(/\bt="(\d+)"/);
        const offsetMs = offMatch ? Number(offMatch[1]) : 0;
        segTokens.push({
          word: rawWord,
          startMs: pStartMs + offsetMs
        });
      }

      for (let i = 0; i < segTokens.length; i++) {
        const cur = segTokens[i];
        const nextStartMs = i + 1 < segTokens.length ? segTokens[i + 1].startMs : pEndMs;
        const wStart = Math.max(0, Math.min(maxDurationSec, cur.startMs / 1000));
        const wEnd = Math.max(wStart + 0.08, Math.min(maxDurationSec, Math.max(cur.startMs + 120, nextStartMs) / 1000));
        // Pecah jika satu tag <s> berisi lebih dari 1 kata
        const subParts = cur.word.split(/\s+/).filter(Boolean);
        if (subParts.length === 1) {
          words.push({
            word: subParts[0],
            start: Number(wStart.toFixed(3)),
            end: Number(wEnd.toFixed(3))
          });
        } else {
          const span = (wEnd - wStart) / subParts.length;
          for (let k = 0; k < subParts.length; k++) {
            const ks = wStart + k * span;
            const ke = ks + Math.max(0.08, span * 0.95);
            words.push({
              word: subParts[k],
              start: Number(ks.toFixed(3)),
              end: Number(Math.min(maxDurationSec, ke).toFixed(3))
            });
          }
        }
      }
    } else {
      const cleanLine = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleanLine) continue;
      const parts = cleanLine.split(' ').filter(Boolean);
      const startSec = Math.max(0, Math.min(maxDurationSec, pStartMs / 1000));
      const endSec = Math.max(startSec + 0.25, Math.min(maxDurationSec, pEndMs / 1000));
      const step = (endSec - startSec) / parts.length;
      for (let i = 0; i < parts.length; i++) {
        const ws = startSec + i * step;
        const we = ws + Math.max(0.08, step * 0.94);
        words.push({
          word: parts[i],
          start: Number(ws.toFixed(3)),
          end: Number(Math.min(maxDurationSec, we).toFixed(3))
        });
      }
    }
  }

  return words;
}

function pruneCache() {
  const now = Date.now();
  for (const [k, v] of STREAM_CACHE.entries()) {
    if (now - v.savedAt > CACHE_TTL_MS) {
      STREAM_CACHE.delete(k);
    }
  }
  if (STREAM_CACHE.size > 60) {
    const oldestKey = STREAM_CACHE.keys().next().value;
    if (oldestKey) STREAM_CACHE.delete(oldestKey);
  }
}

async function resolveYoutubePlayer(videoId) {
  pruneCache();
  const cached = STREAM_CACHE.get(videoId);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
    return cached;
  }

  let lastReason = 'Video tidak tersedia atau dibatasi oleh pemilik channel.';

  for (const clientCfg of CLIENTS) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': clientCfg.ua
        },
        body: JSON.stringify({
          videoId,
          context: { client: clientCfg.contextClient },
          contentCheckOk: true,
          racyCheckOk: true
        })
      });

      if (!res.ok) {
        lastReason = `Server YouTube merespons status ${res.status}.`;
        continue;
      }

      const data = await res.json();
      const status = data?.playabilityStatus?.status;
      const fmts = data?.streamingData?.formats || [];
      const adaptive = data?.streamingData?.adaptiveFormats || [];

      if (status === 'OK' && (fmts.length > 0 || adaptive.length > 0)) {
        const formatMap = new Map();
        for (const f of [...fmts, ...adaptive]) {
          if (f && f.itag && f.url) {
            formatMap.set(Number(f.itag), {
              itag: Number(f.itag),
              url: f.url,
              mimeType: String(f.mimeType || 'video/mp4'),
              qualityLabel: f.qualityLabel || '',
              width: Number(f.width || 0),
              height: Number(f.height || 0),
              fps: Number(f.fps || 30),
              bitrate: Number(f.bitrate || f.averageBitrate || 0),
              contentLength: Number(f.contentLength || 0),
              audioQuality: f.audioQuality || '',
              hasAudio: Boolean(f.audioQuality || f.audioChannels),
              hasVideo: Boolean(f.width || f.qualityLabel)
            });
          }
        }

        const entry = {
          videoId,
          ua: clientCfg.ua,
          clientName: clientCfg.name,
          savedAt: Date.now(),
          videoDetails: data.videoDetails || {},
          captionTracks: data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [],
          formats: fmts,
          adaptiveFormats: adaptive,
          formatMap
        };

        STREAM_CACHE.set(videoId, entry);
        return entry;
      }

      if (data?.playabilityStatus?.reason) {
        lastReason = data.playabilityStatus.reason;
      }
    } catch (err) {
      lastReason = err.message || lastReason;
    }
  }

  throw new Error(lastReason);
}

function estimateBytes(fmt, durationSec) {
  if (fmt.contentLength && fmt.contentLength > 0) return fmt.contentLength;
  if (fmt.bitrate && durationSec > 0) {
    return Math.round((fmt.bitrate * durationSec) / 8);
  }
  return 0;
}

function buildQualityOptions(entry, durationSec) {
  const all = Array.from(entry.formatMap.values());

  // Cari jalur audio MP4/M4A AAC terbaik (itag 140 standar 128kbps AAC)
  const audioCandidates = all
    .filter((f) => !f.hasVideo && f.mimeType.includes('audio/mp4'))
    .sort((a, b) => (a.itag === 140 ? -1 : b.itag === 140 ? 1 : b.bitrate - a.bitrate));
  const bestAudio = audioCandidates[0] || null;
  const audioBytes = bestAudio ? estimateBytes(bestAudio, durationSec) : 0;

  // Cari jalur video H.264 (avc1) di dalam container MP4 agar WebCodecs & semua perangkat mendukung 100%
  const avcVideos = all.filter(
    (f) => f.hasVideo && !f.hasAudio && f.mimeType.includes('video/mp4') && f.mimeType.includes('avc1')
  );

  // Cari jalur progresif MP4 (video + audio sudah menyatu, biasanya itag 18 = 360p)
  const progressiveMp4 = all.filter(
    (f) => f.hasVideo && f.hasAudio && f.mimeType.includes('video/mp4')
  );

  const pickAvcByShortSide = (targetShortSide, preferredItags = []) => {
    for (const itag of preferredItags) {
      const exact = avcVideos.find((v) => v.itag === itag);
      if (exact) return exact;
    }
    return (
      avcVideos.find((v) => {
        const shortSide = Math.min(v.width || 9999, v.height || 9999);
        return Math.abs(shortSide - targetShortSide) <= 40 || v.qualityLabel.startsWith(`${targetShortSide}p`);
      }) || null
    );
  };

  const options = [];
  const MAX_RECOMMENDED_HD_BYTES = 220 * 1024 * 1024; // >220 MB arahkan default ke 480p/360p agar ringan di HP

  // 1) 720p HD (pilihan utama paling seimbang untuk video s/d ~35 menit)
  const v720 = pickAvcByShortSide(720, [136, 298]);
  if (v720 && bestAudio) {
    const vBytes = estimateBytes(v720, durationSec);
    const tot720 = vBytes + audioBytes;
    options.push({
      id: '720p-hd',
      label: `720p HD Jernih (${v720.width}×${v720.height})`,
      shortLabel: '720p HD',
      mode: 'adaptive',
      videoItag: v720.itag,
      audioItag: bestAudio.itag,
      width: v720.width,
      height: v720.height,
      videoBytes: vBytes,
      audioBytes,
      totalBytes: tot720,
      recommended: tot720 <= MAX_RECOMMENDED_HD_BYTES
    });
  }

  // 2) 480p SD
  const v480 = pickAvcByShortSide(480, [135]);
  if (v480 && bestAudio) {
    const vBytes = estimateBytes(v480, durationSec);
    const tot480 = vBytes + audioBytes;
    const alreadyRec = options.some((o) => o.recommended);
    options.push({
      id: '480p-sd',
      label: `480p Standar (${v480.width}×${v480.height})`,
      shortLabel: '480p SD',
      mode: 'adaptive',
      videoItag: v480.itag,
      audioItag: bestAudio.itag,
      width: v480.width,
      height: v480.height,
      videoBytes: vBytes,
      audioBytes,
      totalBytes: tot480,
      recommended: !alreadyRec && tot480 <= MAX_RECOMMENDED_HD_BYTES
    });
  }

  // 3) 360p Cepat Hemat Kuota (utamakan progressive itag 18 supaya langsung jadi tanpa remux)
  const prog360 = progressiveMp4.find((p) => p.itag === 18) || progressiveMp4[0];
  if (prog360) {
    const tBytes = estimateBytes(prog360, durationSec);
    const alreadyRec = options.some((o) => o.recommended);
    options.push({
      id: '360p-fast',
      label: `360p Cepat Hemat Kuota (${prog360.width}×${prog360.height})`,
      shortLabel: '360p Cepat',
      mode: 'progressive',
      videoItag: prog360.itag,
      audioItag: null,
      width: prog360.width,
      height: prog360.height,
      videoBytes: tBytes,
      audioBytes: 0,
      totalBytes: tBytes,
      recommended: !alreadyRec
    });
  } else {
    const v360 = pickAvcByShortSide(360, [134]);
    if (v360 && bestAudio) {
      const vBytes = estimateBytes(v360, durationSec);
      const alreadyRec = options.some((o) => o.recommended);
      options.push({
        id: '360p-sd',
        label: `360p Hemat Kuota (${v360.width}×${v360.height})`,
        shortLabel: '360p',
        mode: 'adaptive',
        videoItag: v360.itag,
        audioItag: bestAudio.itag,
        width: v360.width,
        height: v360.height,
        videoBytes: vBytes,
        audioBytes,
        totalBytes: vBytes + audioBytes,
        recommended: !alreadyRec
      });
    }
  }

  // 4) 1080p Full HD (opsional jika tersedia)
  const v1080 = pickAvcByShortSide(1080, [137, 299]);
  if (v1080 && bestAudio) {
    const vBytes = estimateBytes(v1080, durationSec);
    options.push({
      id: '1080p-fhd',
      label: `1080p Full HD Tajam (${v1080.width}×${v1080.height})`,
      shortLabel: '1080p Full HD',
      mode: 'adaptive',
      videoItag: v1080.itag,
      audioItag: bestAudio.itag,
      width: v1080.width,
      height: v1080.height,
      videoBytes: vBytes,
      audioBytes,
      totalBytes: vBytes + audioBytes,
      recommended: false
    });
  }

  return options;
}

async function fetchBestCaptionWords(captionTracks, durationSec) {
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
    return { captionMeta: { available: false }, words: [] };
  }

  // Urutan prioritas: Bahasa Indonesia manual -> Indonesia otomatis -> Inggris -> Track pertama
  const scoreTrack = (t) => {
    const lang = String(t.languageCode || '').toLowerCase();
    const isAuto = t.kind === 'asr';
    if (lang === 'id' && !isAuto) return 100;
    if (lang.startsWith('id')) return 90;
    if (lang === 'en' && !isAuto) return 70;
    if (lang.startsWith('en')) return 60;
    return isAuto ? 30 : 45;
  };

  const sorted = [...captionTracks].sort((a, b) => scoreTrack(b) - scoreTrack(a));
  const chosen = sorted[0];
  if (!chosen?.baseUrl) {
    return { captionMeta: { available: false }, words: [] };
  }

  try {
    const capUrl = new URL(chosen.baseUrl);
    capUrl.searchParams.set('fmt', 'srv3');
    const res = await fetch(capUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) {
      return { captionMeta: { available: false }, words: [] };
    }
    const xml = await res.text();
    const words = parseSrv3TimedTextToWords(xml, durationSec || 7200);
    const trackLabel =
      chosen?.name?.simpleText ||
      chosen?.name?.runs?.map((r) => r.text).join('') ||
      chosen.languageCode ||
      'Otomatis';

    return {
      captionMeta: {
        available: words.length > 0,
        languageCode: chosen.languageCode || 'id',
        isAuto: chosen.kind === 'asr',
        label: trackLabel,
        wordCount: words.length
      },
      words
    };
  } catch {
    return { captionMeta: { available: false }, words: [] };
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

export async function handleYoutubeApiRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  if (url.pathname === '/api/youtube/info') {
    const rawUrl = url.searchParams.get('url') || url.searchParams.get('v') || '';
    const videoId = extractYoutubeVideoId(rawUrl);
    if (!videoId) {
      return jsonResponse(
        {
          ok: false,
          error: 'Link YouTube tidak dikenali. Tempelkan link seperti youtube.com/watch?v=... atau youtu.be/...'
        },
        400
      );
    }

    try {
      const entry = await resolveYoutubePlayer(videoId);
      const vd = entry.videoDetails || {};
      const durationSec = Number(vd.lengthSeconds || 0);
      if (vd.isLiveContent && durationSec === 0) {
        return jsonResponse(
          {
            ok: false,
            error: 'Siaran langsung (Live) yang masih berlangsung belum bisa diunduh. Gunakan rekaman video yang sudah selesai.'
          },
          400
        );
      }

      const qualities = buildQualityOptions(entry, durationSec);
      if (qualities.length === 0) {
        return jsonResponse(
          {
            ok: false,
            error: 'Format MP4 untuk video ini tidak tersedia dari YouTube.'
          },
          422
        );
      }

      const { captionMeta, words } = await fetchBestCaptionWords(entry.captionTracks, durationSec);
      const thumbs = vd?.thumbnail?.thumbnails || [];
      const bestThumb =
        thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return jsonResponse({
        ok: true,
        videoId,
        title: vd.title || `Video YouTube ${videoId}`,
        author: vd.author || 'Channel YouTube',
        durationSec,
        viewCount: Number(vd.viewCount || 0),
        isShort: Boolean(vd.isShort || (qualities[0] && qualities[0].height > qualities[0].width)),
        thumbnailUrl: bestThumb,
        qualities,
        captionMeta,
        words
      });
    } catch (err) {
      return jsonResponse(
        {
          ok: false,
          error: `Gagal mengambil data video YouTube: ${err.message || 'Coba link video publik lainnya.'}`
        },
        502
      );
    }
  }

  if (url.pathname === '/api/youtube/stream') {
    const videoId = extractYoutubeVideoId(url.searchParams.get('v') || '');
    const itag = Number(url.searchParams.get('itag') || 0);
    const start = Math.max(0, Number(url.searchParams.get('start') || 0));
    const rawEnd = url.searchParams.get('end');
    // Batasi maksimal 5 MB per request agar selalu super cepat & lolos antrean CDN
    const maxChunk = 5 * 1024 * 1024 - 1;
    const end =
      rawEnd != null && rawEnd !== ''
        ? Math.min(start + maxChunk, Math.max(start, Number(rawEnd)))
        : start + 4 * 1024 * 1024 - 1;

    if (!videoId || !itag) {
      return jsonResponse({ ok: false, error: 'Parameter v dan itag wajib diisi.' }, 400);
    }

    try {
      let entry = await resolveYoutubePlayer(videoId);
      let fmt = entry.formatMap.get(itag);
      if (!fmt) {
        STREAM_CACHE.delete(videoId);
        entry = await resolveYoutubePlayer(videoId);
        fmt = entry.formatMap.get(itag);
      }
      if (!fmt) {
        return jsonResponse({ ok: false, error: `Format stream itag ${itag} tidak ditemukan.` }, 404);
      }

      let upstream = await fetch(fmt.url, {
        headers: {
          'User-Agent': entry.ua,
          Range: `bytes=${start}-${end}`
        }
      });

      // Jika URL kadaluarsa atau ditolak, segarkan cache 1 kali
      if (upstream.status === 403 || upstream.status === 401 || upstream.status === 410) {
        STREAM_CACHE.delete(videoId);
        entry = await resolveYoutubePlayer(videoId);
        fmt = entry.formatMap.get(itag);
        if (fmt) {
          upstream = await fetch(fmt.url, {
            headers: {
              'User-Agent': entry.ua,
              Range: `bytes=${start}-${end}`
            }
          });
        }
      }

      if (!upstream.ok && upstream.status !== 206) {
        return jsonResponse(
          { ok: false, error: `CDN YouTube menolak pembacaan stream (${upstream.status}).` },
          502
        );
      }

      const contentRange = upstream.headers.get('content-range') || '';
      const totalMatch = contentRange.match(/\/(\d+)$/);
      const totalBytes = totalMatch
        ? Number(totalMatch[1])
        : fmt.contentLength || Number(upstream.headers.get('content-length') || 0);

      const headers = new Headers();
      headers.set('Content-Type', fmt.mimeType.split(';')[0] || 'application/octet-stream');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Expose-Headers', 'X-Total-Bytes, Content-Range, Content-Length');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
      headers.set('Cache-Control', 'private, max-age=600');
      if (contentRange) headers.set('Content-Range', contentRange);
      if (totalBytes > 0) headers.set('X-Total-Bytes', String(totalBytes));
      const cl = upstream.headers.get('content-length');
      if (cl) headers.set('Content-Length', cl);

      return new Response(upstream.body, {
        status: upstream.status,
        headers
      });
    } catch (err) {
      return jsonResponse(
        { ok: false, error: `Gagal mengalirkan potongan video: ${err.message}` },
        502
      );
    }
  }

  return jsonResponse({ ok: false, error: 'Endpoint API tidak ditemukan.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleYoutubeApiRequest(request);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
};

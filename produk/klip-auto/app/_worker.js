/**
 * Klip Auto — Cloudflare Pages Serverless Edge Engine untuk Informasi, Subtitle & Unduhan MP4 YouTube Anti-403
 * Menangani:
 * - GET /api/youtube/info?url=...              -> Metadata video, daftar kualitas MP4, & transkrip kata otomatis (InnerTube + Watch Page + oEmbed fallback)
 * - GET /api/youtube/convert-init?v=...        -> Inisiasi jalur unduh MP4 non-IP-locked (bebas error 403 googlevideo)
 * - GET /api/youtube/convert-progress?id=...   -> Cek progres penyiapan file MP4 utuh (360p / 480p / 720p / 1080p)
 * - GET /api/youtube/proxy-file?url=...        -> Aliran unduhan langsung .MP4 cepat dengan Content-Disposition attachment & CORS aman
 * - GET /api/youtube/stream?v=...              -> Cadangan pengambilan potongan byte (HTTP Range) dalam satu eksekusi Worker
 * - Aset statis aplikasi tetap dilayani dengan header COOP/COEP untuk WebCodecs & WASM
 */

const SAVENOW_API_KEY = 'dfcb6d76f2f6a9894gjkege8a4ab232222';
const SAVENOW_HEADERS = {
  Origin: 'https://en.loader.to',
  Referer: 'https://en.loader.to/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};

const ALLOWED_PROXY_HOST_SUFFIXES = [
  '.savenow.to',
  'savenow.to',
  '.googlevideo.com',
  '.savetube.me',
  '.savetube.su',
  '.savetube.vip',
  '.cococococ.com'
];

const CLIENTS = [
  {
    name: 'ANDROID',
    hdrName: '3',
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
    hdrName: '5',
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
    // Lanjut regex cadangan bila URL tidak standar
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
        const wEnd = Math.max(
          wStart + 0.08,
          Math.min(maxDurationSec, Math.max(cur.startMs + 120, nextStartMs) / 1000)
        );
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

async function fetchEmbedVisitorData(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/embed/${videoId}`, {
      headers: {
        'User-Agent': SAVENOW_HEADERS['User-Agent'],
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
      }
    });
    if (!res.ok) return '';
    const html = await res.text();
    const m = html.match(/"VISITOR_DATA":"([^"]+)"/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

/**
 * Mengambil data player InnerTube segar:
 * 1) Coba ANDROID & IOS murni terlebih dahulu (tanpa mencampur visitorData WEB yang memicu blokir lintas-klien)
 * 2) Bila masih tertahan di IP tertentu, coba WEB_EMBEDDED_PLAYER dengan visitorData yang sepadan
 */
async function resolveFreshYoutubePlayer(videoId) {
  let lastReason = 'Video tidak tersedia atau dibatasi oleh pemilik channel.';

  const parseOkPlayer = (data, ua, clientName) => {
    const status = data?.playabilityStatus?.status;
    const fmts = data?.streamingData?.formats || [];
    const adaptive = data?.streamingData?.adaptiveFormats || [];
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const hasDetails = Boolean(data?.videoDetails?.title && Number(data?.videoDetails?.lengthSeconds) > 0);

    if (status === 'OK' && (fmts.length > 0 || adaptive.length > 0 || hasDetails)) {
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
      return {
        videoId,
        ua,
        clientName,
        videoDetails: data.videoDetails || {},
        captionTracks: tracks,
        formatMap
      };
    }
    return null;
  };

  // Jalur 1: ANDROID & IOS murni (persis konfigurasi yang lolos di Cloudflare Edge Indonesia)
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
      const parsed = parseOkPlayer(data, clientCfg.ua, clientCfg.name);
      if (parsed) return parsed;

      if (data?.playabilityStatus?.reason) {
        lastReason = data.playabilityStatus.reason;
      }
    } catch (err) {
      lastReason = err.message || lastReason;
    }
  }

  // Jalur 2: WEB_EMBEDDED_PLAYER dengan visitorData sepadan dari halaman /embed/
  try {
    const visitorData = await fetchEmbedVisitorData(videoId);
    const embedRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': SAVENOW_HEADERS['User-Agent'],
        'X-Youtube-Client-Name': '56',
        'X-Youtube-Client-Version': '1.20250219.01.00',
        ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {})
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: 'WEB_EMBEDDED_PLAYER',
            clientVersion: '1.20250219.01.00',
            hl: 'id',
            gl: 'ID',
            ...(visitorData ? { visitorData } : {})
          },
          thirdParty: { embedUrl: 'https://www.google.com/' }
        },
        contentCheckOk: true,
        racyCheckOk: true
      })
    });
    if (embedRes.ok) {
      const embedData = await embedRes.json();
      const parsed = parseOkPlayer(embedData, SAVENOW_HEADERS['User-Agent'], 'WEB_EMBEDDED_PLAYER');
      if (parsed) return parsed;
    }
  } catch {}

  const err = new Error(lastReason);
  err.isInnerTubeBlocked = true;
  throw err;
}

/**
 * Fallback anti-gagal ketika IP datacenter terkena pemeriksaan bot pada endpoint /player:
 * Mengambil judul, nama channel, durasi, serta jalur captionTracks langsung dari halaman Watch + oEmbed resmi.
 */
async function resolveFallbackMetadataAndCaptions(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=id`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&format=json`;

  const [watchRes, oembedRes] = await Promise.allSettled([
    fetch(watchUrl, {
      headers: {
        'User-Agent': SAVENOW_HEADERS['User-Agent'],
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
        Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+471'
      }
    }),
    fetch(oembedUrl, {
      headers: { 'User-Agent': SAVENOW_HEADERS['User-Agent'] }
    })
  ]);

  let title = '';
  let author = '';
  let durationSec = 0;
  let viewCount = 0;
  let isLive = false;
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let captionTracks = [];

  if (oembedRes.status === 'fulfilled' && oembedRes.value.ok) {
    try {
      const oe = await oembedRes.value.json();
      if (oe.title) title = oe.title;
      if (oe.author_name) author = oe.author_name;
      if (oe.thumbnail_url) thumbnailUrl = oe.thumbnail_url;
    } catch {}
  }

  if (watchRes.status === 'fulfilled' && watchRes.value.ok) {
    try {
      const html = await watchRes.value.text();

      // Ekstrak ytInitialPlayerResponse bila tersedia di HTML Watch
      const marker = 'ytInitialPlayerResponse = ';
      const mIdx = html.indexOf(marker);
      if (mIdx !== -1) {
        let depth = 0;
        let inStr = false;
        let esc = false;
        let jsonEnd = -1;
        const startIdx = mIdx + marker.length;
        for (let i = startIdx; i < Math.min(html.length, startIdx + 900000); i++) {
          const ch = html[i];
          if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
          } else {
            if (ch === '"') inStr = true;
            else if (ch === '{') depth++;
            else if (ch === '}') {
              depth--;
              if (depth === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
          }
        }
        if (jsonEnd > startIdx) {
          const pr = JSON.parse(html.slice(startIdx, jsonEnd));
          const vd = pr?.videoDetails || {};
          if (vd.title) title = vd.title;
          if (vd.author) author = vd.author;
          if (vd.lengthSeconds) durationSec = Number(vd.lengthSeconds) || 0;
          if (vd.viewCount) viewCount = Number(vd.viewCount) || 0;
          if (vd.isLiveContent && durationSec === 0) isLive = true;
          const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (Array.isArray(tracks) && tracks.length > 0) {
            captionTracks = tracks;
          }
        }
      }

      if (!durationSec) {
        const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
        if (lenMatch) durationSec = Number(lenMatch[1]) || 0;
      }
      if (!title) {
        const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = decodeHtmlEntities(titleMatch[1].replace(/\s*-\s*YouTube\s*$/i, '').trim());
        }
      }
    } catch {}
  }

  if (!title) {
    throw new Error('Video YouTube tidak ditemukan atau bersifat pribadi (Private).');
  }

  return {
    videoId,
    videoDetails: {
      title,
      author: author || 'Channel YouTube',
      lengthSeconds: durationSec,
      viewCount,
      isLiveContent: isLive,
      thumbnail: { thumbnails: [{ url: thumbnailUrl }] }
    },
    captionTracks,
    formatMap: new Map()
  };
}

function estimateBytes(fmt, durationSec) {
  if (fmt && fmt.contentLength && fmt.contentLength > 0) return fmt.contentLength;
  if (fmt && fmt.bitrate && durationSec > 0) {
    return Math.round((fmt.bitrate * durationSec) / 8);
  }
  return 0;
}

function estimateStandardMp4Bytes(shortSide, durationSec) {
  if (!durationSec || durationSec <= 0) return 0;
  // Estimasi realistis H.264 + AAC 128kbps YouTube (bytes per detik)
  const kbpsMap = {
    1080: 1850,
    720: 1050,
    480: 540,
    360: 340
  };
  const kbps = kbpsMap[shortSide] || 600;
  return Math.round(((kbps * 1000) / 8) * durationSec);
}

function buildQualityOptions(entry, durationSec) {
  const all = Array.from(entry.formatMap.values());
  const MAX_RECOMMENDED_HD_BYTES = 220 * 1024 * 1024;

  // Jika formatMap kosong (jalur fallback metadata), susun daftar resolusi standar jalur konverter bebas-403
  if (all.length === 0) {
    const est720 = estimateStandardMp4Bytes(720, durationSec);
    const est480 = estimateStandardMp4Bytes(480, durationSec);
    const est360 = estimateStandardMp4Bytes(360, durationSec);
    const est1080 = estimateStandardMp4Bytes(1080, durationSec);
    const rec720 = est720 > 0 && est720 <= MAX_RECOMMENDED_HD_BYTES;
    const rec480 = !rec720 && est480 <= MAX_RECOMMENDED_HD_BYTES;

    return [
      {
        id: '720p-hd',
        label: '720p HD Jernih (1280×720)',
        shortLabel: '720p HD',
        mode: 'converter',
        savenowFormat: '720',
        videoItag: null,
        audioItag: null,
        width: 1280,
        height: 720,
        videoBytes: est720,
        audioBytes: 0,
        totalBytes: est720,
        recommended: rec720
      },
      {
        id: '480p-sd',
        label: '480p Standar (854×480)',
        shortLabel: '480p SD',
        mode: 'converter',
        savenowFormat: '480',
        videoItag: null,
        audioItag: null,
        width: 854,
        height: 480,
        videoBytes: est480,
        audioBytes: 0,
        totalBytes: est480,
        recommended: rec480 || (!rec720 && durationSec === 0)
      },
      {
        id: '360p-fast',
        label: '360p Cepat Hemat Kuota (640×360)',
        shortLabel: '360p Cepat',
        mode: 'converter',
        savenowFormat: '360',
        videoItag: null,
        audioItag: null,
        width: 640,
        height: 360,
        videoBytes: est360,
        audioBytes: 0,
        totalBytes: est360,
        recommended: !rec720 && !rec480 && durationSec > 0
      },
      {
        id: '1080p-fhd',
        label: '1080p Full HD Tajam (1920×1080)',
        shortLabel: '1080p Full HD',
        mode: 'converter',
        savenowFormat: '1080',
        videoItag: null,
        audioItag: null,
        width: 1920,
        height: 1080,
        videoBytes: est1080,
        audioBytes: 0,
        totalBytes: est1080,
        recommended: false
      }
    ];
  }

  const audioCandidates = all
    .filter((f) => !f.hasVideo && f.mimeType.includes('audio/mp4'))
    .sort((a, b) => (a.itag === 140 ? -1 : b.itag === 140 ? 1 : b.bitrate - a.bitrate));
  const bestAudio = audioCandidates[0] || null;
  const audioBytes = bestAudio ? estimateBytes(bestAudio, durationSec) : 0;

  const avcVideos = all.filter(
    (f) => f.hasVideo && !f.hasAudio && f.mimeType.includes('video/mp4') && f.mimeType.includes('avc1')
  );
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

  const v720 = pickAvcByShortSide(720, [136, 298]);
  if (v720 && bestAudio) {
    const vBytes = estimateBytes(v720, durationSec);
    const tot720 = vBytes + audioBytes;
    options.push({
      id: '720p-hd',
      label: `720p HD Jernih (${v720.width}×${v720.height})`,
      shortLabel: '720p HD',
      mode: 'adaptive',
      savenowFormat: '720',
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
      savenowFormat: '480',
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

  const prog360 = progressiveMp4.find((p) => p.itag === 18) || progressiveMp4[0];
  if (prog360) {
    const tBytes = estimateBytes(prog360, durationSec);
    const alreadyRec = options.some((o) => o.recommended);
    options.push({
      id: '360p-fast',
      label: `360p Cepat Hemat Kuota (${prog360.width}×${prog360.height})`,
      shortLabel: '360p Cepat',
      mode: 'progressive',
      savenowFormat: '360',
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
        savenowFormat: '360',
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

  const v1080 = pickAvcByShortSide(1080, [137, 299]);
  if (v1080 && bestAudio) {
    const vBytes = estimateBytes(v1080, durationSec);
    options.push({
      id: '1080p-fhd',
      label: `1080p Full HD Tajam (${v1080.width}×${v1080.height})`,
      shortLabel: '1080p Full HD',
      mode: 'adaptive',
      savenowFormat: '1080',
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
      headers: { 'User-Agent': SAVENOW_HEADERS['User-Agent'] }
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

async function initiateSavenowJob(videoId, formatStr = '480') {
  const allowedFormats = ['360', '480', '720', '1080'];
  const fmt = allowedFormats.includes(String(formatStr)) ? String(formatStr) : '480';
  const ytWatch = `https://www.youtube.com/watch?v=${videoId}`;
  const initUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${fmt}&url=${encodeURIComponent(
    ytWatch
  )}&apikey=${SAVENOW_API_KEY}`;

  const res = await fetch(initUrl, { headers: SAVENOW_HEADERS });
  if (!res.ok) {
    throw new Error(`Layanan pengonversi MP4 merespons status ${res.status}.`);
  }
  const data = await res.json();
  if (!data || (!data.success && !data.id)) {
    throw new Error(data?.message || 'Gagal memulai penyiapan file MP4 dari YouTube.');
  }
  return {
    jobId: data.id,
    format: fmt,
    progressUrl: data.progress_url || `https://p.savenow.to/api/progress?id=${encodeURIComponent(data.id)}`,
    directUrl: data.download_url || null
  };
}

function isAllowedMediaHost(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_PROXY_HOST_SUFFIXES.some((s) => (s.startsWith('.') ? host.endsWith(s) : host === s));
  } catch {
    return false;
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

export async function handleYoutubeApiRequest(request, ctx = null) {
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

  /* 1. INFORMASI VIDEO + SUBTITLE KATA OTOMATIS + PEMANASAN JALUR MP4 */
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
      let entry;
      try {
        entry = await resolveFreshYoutubePlayer(videoId);
      } catch {
        entry = await resolveFallbackMetadataAndCaptions(videoId);
      }

      const vd = entry.videoDetails || {};
      const durationSec = Number(vd.lengthSeconds || 0);
      if (vd.isLiveContent && durationSec === 0) {
        return jsonResponse(
          {
            ok: false,
            error:
              'Siaran langsung (Live) yang masih berlangsung belum bisa diunduh. Gunakan rekaman video yang sudah selesai.'
          },
          400
        );
      }

      // Bila InnerTube tidak menyertakan captionTracks namun video punya subtitle, coba ambil dari halaman Watch
      let captionTracks = entry.captionTracks || [];
      if (captionTracks.length === 0) {
        try {
          const fb = await resolveFallbackMetadataAndCaptions(videoId);
          if (fb.captionTracks?.length > 0) captionTracks = fb.captionTracks;
        } catch {}
      }

      const qualities = buildQualityOptions(entry, durationSec);
      const { captionMeta, words } = await fetchBestCaptionWords(captionTracks, durationSec);
      const thumbs = vd?.thumbnail?.thumbnails || [];
      const bestThumb =
        thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Panaskan jalur MP4 rekomendasi di latar belakang agar saat tombol Unduh diklik langsung siap!
      const recQuality = qualities.find((q) => q.recommended) || qualities[0];
      if (recQuality?.savenowFormat && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(
          initiateSavenowJob(videoId, recQuality.savenowFormat).catch(() => {})
        );
      }

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

  /* 2. INISIASI KONVERSI / PENYIAPAN MP4 BEBAS-403 */
  if (url.pathname === '/api/youtube/convert-init') {
    const videoId = extractYoutubeVideoId(url.searchParams.get('v') || url.searchParams.get('url') || '');
    const format = url.searchParams.get('format') || '480';
    if (!videoId) {
      return jsonResponse({ ok: false, error: 'Parameter videoId (v) wajib diisi.' }, 400);
    }

    try {
      const job = await initiateSavenowJob(videoId, format);
      return jsonResponse({
        ok: true,
        videoId,
        jobId: job.jobId,
        format: job.format,
        directUrl: job.directUrl
      });
    } catch (err) {
      return jsonResponse(
        { ok: false, error: err.message || 'Gagal menyiapkan unduhan MP4.' },
        502
      );
    }
  }

  /* 3. CEK PROGRES PENYIAPAN MP4 */
  if (url.pathname === '/api/youtube/convert-progress') {
    const jobId = String(url.searchParams.get('id') || '').trim();
    if (!jobId) {
      return jsonResponse({ ok: false, error: 'Parameter id wajib diisi.' }, 400);
    }

    try {
      const progRes = await fetch(
        `https://p.savenow.to/api/progress?id=${encodeURIComponent(jobId)}`,
        { headers: SAVENOW_HEADERS }
      );
      if (!progRes.ok) {
        return jsonResponse(
          { ok: false, error: `Server progres merespons status ${progRes.status}.` },
          502
        );
      }
      const p = await progRes.json();
      const rawProgress = Number(p.progress || 0); // 0 .. 1000
      const pct = Math.max(0, Math.min(100, Math.round(rawProgress / 10)));
      const downloadUrl = p.download_url || null;

      if (p.success === 0 && !downloadUrl && rawProgress >= 1000) {
        return jsonResponse(
          { ok: false, error: p.text || 'Video ini tidak dapat dikonversi oleh server MP4.' },
          422
        );
      }

      return jsonResponse({
        ok: true,
        jobId,
        percent: downloadUrl ? 100 : pct,
        finished: Boolean(downloadUrl),
        downloadUrl,
        statusText: p.text || ''
      });
    } catch (err) {
      return jsonResponse(
        { ok: false, error: `Gagal memeriksa progres unduhan: ${err.message}` },
        502
      );
    }
  }

  /* 4. PROXY ALIRAN FILE .MP4 LANGSUNG (MENDUKUNG SIMPAN KE PERANGKAT & STREAM KE STUDIO) */
  if (url.pathname === '/api/youtube/proxy-file') {
    const targetUrl = String(url.searchParams.get('url') || '').trim();
    const rawName = String(url.searchParams.get('name') || 'video-youtube.mp4').trim();
    const dispositionMode = url.searchParams.get('dl') === '1' ? 'attachment' : 'inline';

    if (!targetUrl || !isAllowedMediaHost(targetUrl)) {
      return jsonResponse({ ok: false, error: 'Alamat sumber media tidak diizinkan.' }, 400);
    }

    const safeFileName =
      rawName
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 90) || 'video-youtube.mp4';
    const finalName = safeFileName.endsWith('.mp4') ? safeFileName : `${safeFileName}.mp4`;

    try {
      const reqHeaders = {
        'User-Agent': SAVENOW_HEADERS['User-Agent']
      };
      const incomingRange = request.headers.get('Range');
      if (incomingRange) {
        reqHeaders.Range = incomingRange;
      }

      const upstream = await fetch(targetUrl, {
        headers: reqHeaders,
        redirect: 'follow'
      });

      if (!upstream.ok && upstream.status !== 206) {
        return jsonResponse(
          { ok: false, error: `CDN file MP4 merespons status ${upstream.status}.` },
          502
        );
      }

      const headers = new Headers();
      headers.set('Content-Type', 'video/mp4');
      headers.set(
        'Content-Disposition',
        `${dispositionMode}; filename="${finalName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`
      );
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Disposition');
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
      headers.set('Cache-Control', 'no-store');

      const cl = upstream.headers.get('content-length');
      if (cl) headers.set('Content-Length', cl);
      const cr = upstream.headers.get('content-range');
      if (cr) headers.set('Content-Range', cr);

      return new Response(upstream.body, {
        status: upstream.status,
        headers
      });
    } catch (err) {
      return jsonResponse(
        { ok: false, error: `Gagal mengalirkan file MP4: ${err.message}` },
        502
      );
    }
  }

  /* 5. CADANGAN STREAM POTONGAN BYTE LANGSUNG DALAM SATU ISOLATE */
  if (url.pathname === '/api/youtube/stream') {
    const videoId = extractYoutubeVideoId(url.searchParams.get('v') || '');
    const itag = Number(url.searchParams.get('itag') || 0);
    const start = Math.max(0, Number(url.searchParams.get('start') || 0));
    const rawEnd = url.searchParams.get('end');
    const maxChunk = 5 * 1024 * 1024 - 1;
    const end =
      rawEnd != null && rawEnd !== ''
        ? Math.min(start + maxChunk, Math.max(start, Number(rawEnd)))
        : start + 4 * 1024 * 1024 - 1;

    if (!videoId || !itag) {
      return jsonResponse({ ok: false, error: 'Parameter v dan itag wajib diisi.' }, 400);
    }

    try {
      const entry = await resolveFreshYoutubePlayer(videoId);
      const fmt = entry.formatMap.get(itag);
      if (!fmt) {
        return jsonResponse({ ok: false, fallbackConverter: true, error: `Format itag ${itag} tidak tersedia.` }, 404);
      }

      const upstream = await fetch(fmt.url, {
        headers: {
          'User-Agent': entry.ua,
          Range: `bytes=${start}-${end}`
        }
      });

      if (!upstream.ok && upstream.status !== 206) {
        return jsonResponse(
          {
            ok: false,
            fallbackConverter: true,
            error: `CDN langsung menolak stream (${upstream.status}), beralih ke jalur konverter.`
          },
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
      headers.set('Cache-Control', 'no-store');
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
        { ok: false, fallbackConverter: true, error: `Gagal mengalirkan potongan video: ${err.message}` },
        502
      );
    }
  }

  return jsonResponse({ ok: false, error: 'Endpoint API tidak ditemukan.' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleYoutubeApiRequest(request, ctx);
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

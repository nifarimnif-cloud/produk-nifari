/**
 * Klip Auto — Mesin Pembaca & Pengunduh Video YouTube Langsung Tanpa Ekstensi Tambahan (v2.2)
 * - Tempel link YouTube (watch, youtu.be, shorts, live) langsung di browser — TANPA perlu pasang ekstensi!
 * - Mendukung dua aksi sekaligus dari satu pratinjau:
 *   1. Potong Jadi Klip 9:16 Sekarang (lengkap dengan subtitle kata anti-miss & grafik Most-Replayed)
 *   2. Unduh Video YouTube Utuh (.MP4 — 360p, 480p, 720p HD, hingga 1080p Full HD) langsung ke perangkat
 * - Dilengkapi pemakaian ulang cerdas di memori (unduh sekali -> simpan MP4 & potong klip tanpa unduh ulang)
 */

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  EncodedVideoPacketSource,
  Input,
  Mp4OutputFormat,
  Output
} from '../vendor/mediabunny.min.mjs';
import { pickMomentsFromWordsLocally } from './transcriber-moments.js';

const CHUNK_SIZE = 5 * 1024 * 1024;
const YT_TRANSCRIPT_CACHE_KEY = 'klip_auto_yt_cache_v2';

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
    // Lanjut regex cadangan bila URL tidak diawali skema standar
  }

  const m = raw.match(/(?:v=|\/shorts\/|\/live\/|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function formatBytesReadable(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return 'Ukuran otomatis';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeTitleSlug(text) {
  return (
    String(text || '')
      .toLowerCase()
      .replace(/\.mp4$|\.mov$|\.webm$|\.mkv$/i, '')
      .replace(/\(\d+\)/g, '')
      .replace(/-(360pcepat|360p|480psd|480p|720phd|720p|1080pfullhd|1080p)$/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 56) || 'video-youtube'
  );
}

export function sanitizeYoutubeFilename(title, suffix = '') {
  const base = normalizeTitleSlug(title);
  return suffix ? `${base}-${suffix}.mp4` : `${base}.mp4`;
}

/**
 * Pemeriksaan opsional senyap apabila ekstensi pendamping lama kebetulan terpasang (tidak pernah diwajibkan).
 */
export async function detectCompanionBridge(timeoutMs = 180) {
  if (typeof window === 'undefined') return { active: false, version: null };

  const attrVer = document.documentElement?.getAttribute('data-klip-yt-bridge');
  if (attrVer) return { active: true, version: attrVer };

  const reqId = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (val) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMsg);
      resolve(val);
    };

    const onMsg = (ev) => {
      if (ev.source === window && ev.data?.channel === 'KLIP_AUTO_YT_RES' && ev.data?.requestId === reqId) {
        finish({ active: Boolean(ev.data.ok), version: ev.data.version || '2.2.0' });
      }
    };

    window.addEventListener('message', onMsg);
    window.postMessage({ channel: 'KLIP_AUTO_YT_REQ', requestId: reqId, action: 'PING' }, '*');
    setTimeout(() => {
      finish({ active: false, version: null });
    }, timeoutMs);
  });
}

function callCompanionBridge(action, payload, signal = null, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Proses link YouTube dibatalkan.', 'AbortError'));
      return;
    }

    const requestId = `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let settled = false;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      cleanup();
      reject(new DOMException('Proses link YouTube dibatalkan.', 'AbortError'));
    };

    const onMessage = (ev) => {
      if (settled || ev.source !== window || ev.data?.channel !== 'KLIP_AUTO_YT_RES') return;
      if (ev.data.requestId !== requestId) return;
      cleanup();
      if (ev.data.ok) {
        resolve(ev.data.data);
      } else {
        const err = new Error(ev.data.error || 'Gagal membaca data dari YouTube.');
        err.code = 'YT_BRIDGE_ERROR';
        reject(err);
      }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      const err = new Error('Waktu tunggu koneksi ke YouTube habis.');
      err.code = 'YT_TIMEOUT';
      reject(err);
    }, timeoutMs);

    window.addEventListener('message', onMessage);
    signal?.addEventListener('abort', onAbort, { once: true });
    window.postMessage({ channel: 'KLIP_AUTO_YT_REQ', requestId, action, payload }, '*');
  });
}

/**
 * Menyimpan cache subtitle utuh & grafik Most-Replayed YouTube di localStorage perangkat pembeli.
 */
export function saveYoutubeTranscriptCache(info) {
  if (!info || !info.videoId) return;
  try {
    const raw = localStorage.getItem(YT_TRANSCRIPT_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const prev = Array.isArray(list) ? list.find((x) => x && x.videoId === info.videoId) : null;
    const incomingWords = Array.isArray(info.allWords)
      ? info.allWords
      : Array.isArray(info.words)
      ? info.words
      : [];
    const bestWords = incomingWords.length > 0 ? incomingWords : Array.isArray(prev?.words) ? prev.words : [];
    const bestHeatmap =
      Array.isArray(info.heatmap) && info.heatmap.length > 0
        ? info.heatmap
        : Array.isArray(prev?.heatmap)
        ? prev.heatmap
        : [];
    const bestDur = Number(info.durationSec || 0) || Number(prev?.durationSec || 0);

    const entry = {
      videoId: info.videoId,
      title: String(info.title || prev?.title || ''),
      slug: normalizeTitleSlug(info.title || prev?.title || ''),
      durationSec: bestDur,
      words: bestWords,
      heatmap: bestHeatmap,
      savedAt: Date.now()
    };

    const filtered = Array.isArray(list) ? list.filter((x) => x && x.videoId !== info.videoId) : [];
    filtered.unshift(entry);

    let trimmed = filtered.slice(0, 8);
    while (trimmed.length > 0) {
      try {
        localStorage.setItem(YT_TRANSCRIPT_CACHE_KEY, JSON.stringify(trimmed));
        break;
      } catch {
        trimmed = trimmed.slice(0, trimmed.length - 1);
      }
    }
  } catch {}
}

/**
 * Mencocokkan file lokal yang dipilih pembeli dengan cache subtitle utuh & heatmap YouTube di browser.
 */
export function findMatchingYoutubeCache(file, mediaInfo) {
  if (!file) return null;
  try {
    const raw = localStorage.getItem(YT_TRANSCRIPT_CACHE_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return null;

    const fileSlug = normalizeTitleSlug(file.name);
    const rawNameLower = String(file.name || '').toLowerCase();
    const fileDur = Number(mediaInfo?.duration || 0);

    for (const entry of list) {
      if (!entry) continue;
      const idMatch = entry.videoId && rawNameLower.includes(entry.videoId.toLowerCase());
      const slugPrefix = entry.slug ? entry.slug.slice(0, 18) : '';
      const slugMatch =
        slugPrefix.length >= 8 &&
        (fileSlug.includes(slugPrefix) || entry.slug.includes(fileSlug.slice(0, 18)));
      const durMatch =
        fileDur > 8 && entry.durationSec > 8 && Math.abs(fileDur - entry.durationSec) <= 2.5;

      if (idMatch || slugMatch || durMatch) {
        if (Array.isArray(entry.words) && entry.words.length > 0) {
          const targetDur = fileDur > 0 ? fileDur : entry.durationSec;
          const moments = buildMomentsFromYoutubeWords(
            entry.words,
            targetDur,
            entry.title,
            entry.heatmap || null
          );
          return {
            videoId: entry.videoId,
            title: entry.title,
            wordCount: entry.words.length,
            words: entry.words,
            allWords: entry.words,
            heatmap: entry.heatmap || [],
            moments
          };
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function buildMomentsFromYoutubeWords(
  words,
  durationSec,
  fallbackTitle = 'Klip Utama Video',
  heatmap = null
) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const effectiveDur =
    Number(durationSec || 0) > 0
      ? Number(durationSec)
      : Math.max(10, Math.ceil((Number(words[words.length - 1]?.end) || 28) + 2));
  const picked = pickMomentsFromWordsLocally(words, effectiveDur, { heatmap });
  const scoringMeta = picked.scoringMeta || null;
  let moments = picked.map((m, idx) => ({
    ...m,
    id: `yt-momen-${idx + 1}`
  }));

  if (moments.length === 0) {
    const endClip = Number(Math.min(effectiveDur, Math.max(1, Math.min(40, effectiveDur))).toFixed(2));
    const clipWords = words.filter((w) => w.end >= 0 && w.start <= endClip);
    moments = [
      {
        id: 'yt-momen-1',
        title: String(fallbackTitle || 'Klip Utama Video').slice(0, 54),
        score: 78,
        reason: 'Dipilih dari kalimat pembuka subtitle YouTube.',
        startSec: 0,
        endSec: endClip,
        transcript: clipWords.map((w) => w.word).join(' '),
        words: clipWords
      }
    ];
  }
  if (scoringMeta) {
    moments.scoringMeta = scoringMeta;
  }
  return moments;
}

function enrichYoutubeDataPayload(data, transportMode = 'direct-edge') {
  const allWords = Array.isArray(data.words) ? data.words : [];
  const moments = buildMomentsFromYoutubeWords(
    allWords,
    data.durationSec,
    data.title,
    data.heatmap || null
  );
  const wordCount = Number(data.captionMeta?.wordCount ?? allWords.length);
  const enriched = {
    ok: true,
    ...data,
    transportMode,
    allWords,
    words: allWords,
    thumbnail: data.thumbnail || data.thumbnailUrl || '',
    hasCaptions: Boolean(data.captionMeta?.available || wordCount >= 5),
    wordCount,
    captionLang: String(data.captionMeta?.languageCode || 'id'),
    moments,
    scoringMeta: moments.scoringMeta || null
  };
  saveYoutubeTranscriptCache(enriched);
  return enriched;
}

/**
 * Mengambil informasi video, resolusi unduhan, subtitle kata asli, & grafik Most-Replayed
 * langsung lewat copy-paste link YouTube TANPA memerlukan ekstensi tambahan!
 */
export async function fetchYoutubeVideoInfo(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) {
    const err = new Error('Tempelkan link video YouTube terlebih dahulu, atau pilih file video dari perangkatmu.');
    err.code = 'EMPTY_URL';
    err.offerLocalUpload = true;
    throw err;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new Error(
      'Koneksi internet perangkatmu sedang terputus. Nyalakan internet untuk memproses link YouTube, atau langsung pilih file video lokal (.mp4, .mov, .mkv) — Klip Auto tetap berjalan offline!'
    );
    err.code = 'OFFLINE';
    err.offerLocalUpload = true;
    throw err;
  }

  const videoId = extractYoutubeVideoId(clean);
  if (!videoId) {
    const err = new Error(
      'Format link YouTube tidak dikenali. Pastikan link berbentuk youtube.com/watch?v=..., youtu.be/..., atau youtube.com/shorts/...'
    );
    err.code = 'INVALID_URL';
    err.offerLocalUpload = true;
    throw err;
  }

  // Jalur Utama v2.2: Langsung panggil endpoint terotentikasi `/api/youtube/info` tanpa ekstensi apa pun!
  // Dilengkapi rotasi percobaan otomatis (hingga 4x) agar selalu mendapatkan node Edge yang bersih.
  let serverError = null;
  for (let att = 1; att <= 4; att++) {
    try {
      const res = await fetch(`./api/youtube/info?url=${encodeURIComponent(clean)}&att=${att}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.ok) {
        return enrichYoutubeDataPayload(data, 'direct-edge');
      }
      serverError = new Error(data?.error || 'Link YouTube belum dapat dimuat saat ini.');
      serverError.code = data?.code || 'YOUTUBE_RESOLVE_FAILED';

      // Jika video memang privat/dihapus atau sesi belum masuk (401), tidak perlu ulangi
      if (
        data?.code === 'VIDEO_UNAVAILABLE' ||
        res.status === 404 ||
        res.status === 401 ||
        res.status === 400
      ) {
        break;
      }
      if (att < 4) {
        await new Promise((r) => setTimeout(r, 260 * att));
      }
    } catch (netErr) {
      serverError = netErr;
      if (att < 4) {
        await new Promise((r) => setTimeout(r, 300 * att));
      }
    }
  }

  // Cadangan opsional senyap jika ekstensi jembatan lokal kebetulan aktif di browser pengguna
  const bridge = await detectCompanionBridge();
  if (bridge.active) {
    try {
      const bridgeData = await callCompanionBridge('YT_INFO', { videoId });
      return enrichYoutubeDataPayload(bridgeData, 'companion-bridge');
    } catch {}
  }

  const friendly = new Error(
    serverError?.message ||
      'Video YouTube ini bersifat Pribadi atau dibatasi pemilik channel. Coba link publik lain atau pilih file video lokal (.mp4, .mov, .mkv).'
  );
  friendly.code = serverError?.code || 'LINK_FAILED';
  friendly.offerLocalUpload = true;
  friendly.offerExtensionGuide = false;
  throw friendly;
}

function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function fetchSingleServerChunk({ videoId, itag, start, end, signal }) {
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Proses link YouTube dibatalkan.', 'AbortError');
    }
    try {
      const url = `./api/youtube/stream?v=${encodeURIComponent(videoId)}&itag=${encodeURIComponent(
        itag
      )}&start=${start}&end=${end}&att=${attempt + 1}`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        signal
      });
      const ct = (res.headers.get('Content-Type') || '').toLowerCase();
      if ((!res.ok && res.status !== 206) || ct.includes('application/json')) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Gagal mengambil potongan video (${res.status}).`);
      }
      return res;
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) throw err;
      lastErr = err;
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 320 * (attempt + 1)));
      }
    }
  }
  throw lastErr || new Error('Gagal mengalirkan data video YouTube.');
}

async function downloadFormatViaServerStream({
  videoId,
  itag,
  expectedBytes,
  mimeType,
  signal,
  onBytes
}) {
  let downloaded = 0;
  let totalKnown = Number(expectedBytes || 0);
  const parts = [];

  let pos = 0;
  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Proses link YouTube dibatalkan.', 'AbortError');
    }

    const reqEnd =
      totalKnown > 0 ? Math.min(totalKnown - 1, pos + CHUNK_SIZE - 1) : pos + CHUNK_SIZE - 1;
    const res = await fetchSingleServerChunk({
      videoId,
      itag,
      start: pos,
      end: reqEnd,
      signal
    });

    const headerTotal = Number(res.headers.get('X-Total-Bytes') || 0);
    if (headerTotal > 0) {
      totalKnown = headerTotal;
    } else if (!totalKnown) {
      const cr = res.headers.get('Content-Range') || '';
      const m = cr.match(/\/(\d+)/);
      if (m) totalKnown = Number(m[1]);
    }

    let chunkByteLen = 0;
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.byteLength > 0) {
          parts.push(value);
          chunkByteLen += value.byteLength;
          downloaded += value.byteLength;
          if (onBytes) onBytes(downloaded, totalKnown || downloaded);
        }
      }
    } else {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 0) {
        parts.push(buf);
        chunkByteLen = buf.byteLength;
        downloaded += buf.byteLength;
        if (onBytes) onBytes(downloaded, totalKnown || downloaded);
      }
    }

    if (chunkByteLen === 0) break;
    pos += chunkByteLen;

    // Jika sudah mencapai totalKnown, selesai!
    if (res.status === 200 && pos === chunkByteLen && totalKnown > 0 && downloaded >= totalKnown) {
      break;
    }
    if (totalKnown > 0 && pos >= totalKnown) {
      break;
    }
    if (chunkByteLen < CHUNK_SIZE && totalKnown === 0) {
      break;
    }
  }

  return new Blob(parts, { type: mimeType });
}

async function downloadFormatViaBridge({ videoId, itag, expectedBytes, mimeType, signal, onBytes }) {
  let downloaded = 0;
  let totalKnown = expectedBytes || 0;

  const firstEnd = totalKnown > 0 ? Math.min(totalKnown - 1, CHUNK_SIZE - 1) : CHUNK_SIZE - 1;
  const firstRes = await callCompanionBridge(
    'YT_CHUNK',
    { videoId, itag, start: 0, end: firstEnd },
    signal,
    60000
  );
  const firstBytes = base64ToUint8Array(firstRes.base64);
  downloaded += firstBytes.byteLength;
  if (firstRes.totalBytes > 0) totalKnown = firstRes.totalBytes;
  else if (totalKnown <= 0) totalKnown = firstBytes.byteLength;
  if (onBytes) onBytes(downloaded, totalKnown);

  if (firstBytes.byteLength >= totalKnown) {
    return new Blob([firstBytes], { type: mimeType });
  }

  const parts = [firstBytes];
  for (let pos = firstBytes.byteLength; pos < totalKnown; pos += CHUNK_SIZE) {
    const end = Math.min(totalKnown - 1, pos + CHUNK_SIZE - 1);
    const partRes = await callCompanionBridge(
      'YT_CHUNK',
      { videoId, itag, start: pos, end },
      signal,
      60000
    );
    const u8 = base64ToUint8Array(partRes.base64);
    parts.push(u8);
    downloaded += u8.byteLength;
    if (onBytes) onBytes(downloaded, totalKnown);
  }

  return new Blob(parts, { type: mimeType });
}

async function downloadSingleStreamFormat(opts) {
  if (opts.transportMode === 'companion-bridge') {
    return downloadFormatViaBridge(opts);
  }
  return downloadFormatViaServerStream(opts);
}

async function remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal) {
  const vInput = new Input({ source: new BlobSource(videoBlob), formats: ALL_FORMATS });
  const aInput = new Input({ source: new BlobSource(audioBlob), formats: ALL_FORMATS });

  try {
    const [vTrack, aTrack] = await Promise.all([
      vInput.getPrimaryVideoTrack(),
      aInput.getPrimaryAudioTrack()
    ]);

    if (!vTrack) throw new Error('Jalur gambar video sumber tidak terbaca.');
    if (!aTrack) throw new Error('Jalur suara sumber tidak terbaca.');

    const [vDecCfg, aDecCfg] = await Promise.all([
      vTrack.getDecoderConfig(),
      aTrack.getDecoderConfig()
    ]);

    const target = new BufferTarget();
    const out = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target
    });

    const vOutSrc = new EncodedVideoPacketSource(vTrack.codec);
    const aOutSrc = new EncodedAudioPacketSource(aTrack.codec);
    out.addVideoTrack(vOutSrc);
    out.addAudioTrack(aOutSrc);
    await out.start();

    const vSink = new EncodedPacketSink(vTrack);
    let firstV = true;
    for await (const pkt of vSink.packets()) {
      if (signal?.aborted) {
        await out.cancel().catch(() => {});
        throw new DOMException('Proses link YouTube dibatalkan.', 'AbortError');
      }
      if (firstV) {
        await vOutSrc.add(pkt, { decoderConfig: vDecCfg });
        firstV = false;
      } else {
        await vOutSrc.add(pkt);
      }
    }

    const aSink = new EncodedPacketSink(aTrack);
    let firstA = true;
    for await (const pkt of aSink.packets()) {
      if (signal?.aborted) {
        await out.cancel().catch(() => {});
        throw new DOMException('Proses link YouTube dibatalkan.', 'AbortError');
      }
      if (firstA) {
        await aOutSrc.add(pkt, { decoderConfig: aDecCfg });
        firstA = false;
      } else {
        await aOutSrc.add(pkt);
      }
    }

    await out.finalize();
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    vInput.dispose();
    aInput.dispose();
  }
}

export function pickQualityOption(info, qualityId) {
  if (!info || !Array.isArray(info.qualities) || info.qualities.length === 0) {
    throw new Error('Pilihan kualitas video belum tersedia.');
  }
  return (
    info.qualities.find((q) => q.id === qualityId) ||
    info.qualities.find((q) => q.recommended) ||
    info.qualities[0]
  );
}

/**
 * Memicu penyimpanan file .MP4 langsung ke folder Unduhan (Downloads) perangkat pengguna.
 */
export function triggerBrowserFileDownload(fileOrBlob, fileName = 'video-youtube.mp4') {
  const objectUrl = URL.createObjectURL(fileOrBlob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {}
  }, 15000);
}

/**
 * Mengunduh sumber video YouTube ke objek File .MP4 utuh (siap untuk langsung dipotong menjadi klip 9:16
 * maupun disimpan sebagai file video YouTube .MP4 ke laptop/HP).
 */
export async function downloadYoutubeAsMp4File({
  info,
  qualityId = null,
  signal = null,
  onProgress = null
}) {
  const quality = pickQualityOption(info, qualityId);
  const suffix = quality.shortLabel.replace(/\s+/g, '').toLowerCase();
  const fileName = sanitizeYoutubeFilename(info.title, suffix);
  const transportMode = info.transportMode || 'direct-edge';
  const allWords = Array.isArray(info.allWords)
    ? info.allWords
    : Array.isArray(info.words)
    ? info.words
    : [];

  saveYoutubeTranscriptCache(info);

  if (quality.mode === 'progressive') {
    const mp4Blob = await downloadSingleStreamFormat({
      transportMode,
      videoId: info.videoId,
      itag: quality.videoItag,
      expectedBytes: quality.totalBytes,
      mimeType: 'video/mp4',
      signal,
      onBytes: (done, total) => {
        if (!onProgress) return;
        const pct = total > 0 ? Math.min(98, Math.round((done / total) * 94) + 4) : 50;
        onProgress({
          phase: `Mengunduh video YouTube ${quality.shortLabel} (${formatBytesReadable(done)}${
            total > 0 ? ` / ${formatBytesReadable(total)}` : ''
          })...`,
          percent: pct
        });
      }
    });

    if (onProgress) {
      onProgress({ phase: 'Video MP4 selesai disiapkan!', percent: 100 });
    }

    return {
      cacheKey: `${info.videoId}:${quality.id}`,
      file: new File([mp4Blob], fileName, { type: 'video/mp4' }),
      fileName,
      quality,
      qualityLabel: quality.shortLabel,
      moments: info.moments || [],
      heatmap: info.heatmap || [],
      allWords
    };
  }

  const videoBlob = await downloadSingleStreamFormat({
    transportMode,
    videoId: info.videoId,
    itag: quality.videoItag,
    expectedBytes: quality.videoBytes,
    mimeType: 'video/mp4',
    signal,
    onBytes: (done, total) => {
      if (!onProgress) return;
      const denom = Math.max(1, (total || quality.videoBytes || 1) + (quality.audioBytes || 0));
      const pct = Math.min(76, Math.max(4, Math.round((done / denom) * 76)));
      onProgress({
        phase: `Mengunduh gambar ${quality.shortLabel} (${formatBytesReadable(done)}${
          total > 0 ? ` / ${formatBytesReadable(total)}` : ''
        })...`,
        percent: pct
      });
    }
  });

  const audioBlob = await downloadSingleStreamFormat({
    transportMode,
    videoId: info.videoId,
    itag: quality.audioItag,
    expectedBytes: quality.audioBytes,
    mimeType: 'audio/mp4',
    signal,
    onBytes: (done, total) => {
      if (!onProgress) return;
      const ratio = total > 0 ? done / total : 0.5;
      onProgress({
        phase: `Mengunduh jalur suara jernih AAC (${formatBytesReadable(done)})...`,
        percent: Math.min(92, 76 + Math.round(ratio * 16))
      });
    }
  });

  if (onProgress) {
    onProgress({ phase: 'Menyatukan gambar HD & suara AAC ke MP4 utuh...', percent: 96 });
  }
  const merged = await remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal);

  if (onProgress) {
    onProgress({ phase: 'File MP4 selesai disiapkan!', percent: 100 });
  }

  return {
    cacheKey: `${info.videoId}:${quality.id}`,
    file: new File([merged], fileName, { type: 'video/mp4' }),
    fileName,
    quality,
    qualityLabel: quality.shortLabel,
    moments: info.moments || [],
    heatmap: info.heatmap || [],
    allWords
  };
}

/**
 * Mengunduh video YouTube utuh (.MP4 — 360p s/d 1080p Full HD) langsung ke perangkat pengguna,
 * sekaligus mengembalikan hasil `File` agar bila pengguna ingin langsung memotong klip 9:16
 * tidak perlu mengunduh dua kali!
 */
export async function saveYoutubeMp4ToDevice({
  info,
  qualityId = null,
  cachedResult = null,
  signal = null,
  onProgress = null
}) {
  const quality = pickQualityOption(info, qualityId);
  const targetKey = `${info.videoId}:${quality.id}`;

  if (cachedResult && cachedResult.cacheKey === targetKey && cachedResult.file) {
    triggerBrowserFileDownload(cachedResult.file, cachedResult.fileName || cachedResult.file.name);
    return cachedResult;
  }

  const downloaded = await downloadYoutubeAsMp4File({
    info,
    qualityId: quality.id,
    signal,
    onProgress
  });
  triggerBrowserFileDownload(downloaded.file, downloaded.fileName);
  return downloaded;
}

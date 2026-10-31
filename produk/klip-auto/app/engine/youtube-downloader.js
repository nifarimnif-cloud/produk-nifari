/**
 * Klip Auto — Penghubung Link YouTube Lewat Internet Pembeli Sendiri (0% Layanan Pihak Ketiga)
 * - Bekerja murni lewat koneksi internet perangkat pembeli sendiri (via Jembatan Ekstensi Chrome/Edge Lokal)
 * - Mengambil informasi video, subtitle kata asli, serta Grafik Most-Replayed (`heatmap`)
 * - Tanpa proxy server, tanpa layanan konverter luar, dan memiliki pesan pemulihan jelas + tombol pilih file lokal
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
      .slice(0, 56) || 'video-sumber'
  );
}

export function sanitizeYoutubeFilename(title, suffix = '') {
  const base = normalizeTitleSlug(title);
  return suffix ? `${base}-${suffix}.mp4` : `${base}.mp4`;
}

/**
 * Memeriksa apakah Jembatan Ekstensi Chrome/Edge Lokal Klip Auto sudah aktif di browser pembeli.
 */
export async function detectCompanionBridge(timeoutMs = 300) {
  if (typeof window === 'undefined') return { active: false, version: null };

  const attrVer = document.documentElement?.getAttribute('data-klip-yt-bridge');
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
        finish({ active: Boolean(ev.data.ok), version: ev.data.version || attrVer || '2.1.0' });
      }
    };

    window.addEventListener('message', onMsg);
    window.postMessage({ channel: 'KLIP_AUTO_YT_REQ', requestId: reqId, action: 'PING' }, '*');
    setTimeout(() => {
      finish({ active: Boolean(attrVer), version: attrVer || null });
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
        const err = new Error(ev.data.error || 'Gagal membaca data dari YouTube lewat koneksi lokal.');
        err.code = 'YT_BRIDGE_ERROR';
        reject(err);
      }
    };

    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      const err = new Error(
        'Waktu tunggu koneksi ke YouTube habis. Periksa koneksi internet kamu atau pilih file video lokal (.mp4 / .mov / .mkv).'
      );
      err.code = 'YT_TIMEOUT';
      reject(err);
    }, timeoutMs);

    window.addEventListener('message', onMessage);
    signal?.addEventListener('abort', onAbort, { once: true });
    window.postMessage({ channel: 'KLIP_AUTO_YT_REQ', requestId, action, payload }, '*');
  });
}

/**
 * Menyimpan cache subtitle & grafik Most-Replayed YouTube di localStorage perangkat pembeli.
 */
export function saveYoutubeTranscriptCache(info) {
  if (!info || !info.videoId) return;
  try {
    const raw = localStorage.getItem(YT_TRANSCRIPT_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const prev = Array.isArray(list) ? list.find((x) => x && x.videoId === info.videoId) : null;
    const incomingWords = Array.isArray(info.words) ? info.words : [];
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
 * Mencocokkan file lokal yang dipilih pembeli dengan cache subtitle & heatmap YouTube di browser.
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
  if (!Array.isArray(words) || words.length === 0 || durationSec <= 0) return [];
  const picked = pickMomentsFromWordsLocally(words, durationSec, { heatmap });
  const scoringMeta = picked.scoringMeta || null;
  let moments = picked.map((m, idx) => ({
    ...m,
    id: `yt-momen-${idx + 1}`
  }));

  if (moments.length === 0) {
    const endClip = Number(Math.min(durationSec, Math.max(1, Math.min(40, durationSec))).toFixed(2));
    const clipWords = words.filter((w) => w.start <= endClip);
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

/**
 * Mengambil informasi video YouTube langsung lewat koneksi internet pembeli sendiri (Ekstensi Pendamping).
 * Apabila ekstensi belum terpasang atau video tidak bisa diakses, mengembalikan alasan yang mudah dimengerti
 * sehingga UI langsung menawarkan tombol Pilih File Video Lokal (.mp4 / .mov / .mkv).
 */
export async function fetchYoutubeVideoInfo(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) {
    const err = new Error('Tempelkan link video YouTube terlebih dahulu, atau pilih file video dari laptopmu.');
    err.code = 'EMPTY_URL';
    err.offerLocalUpload = true;
    throw err;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new Error(
      'Koneksi internet perangkatmu sedang terputus. Nyalakan kembali internet untuk memproses link YouTube, atau langsung pilih file video lokal (.mp4, .mov, .mkv) dari laptopmu — Klip Auto tetap berjalan offline!'
    );
    err.code = 'OFFLINE';
    err.offerLocalUpload = true;
    throw err;
  }

  const videoId = extractYoutubeVideoId(clean);
  if (!videoId) {
    const err = new Error(
      'Format link YouTube tidak dikenali. Pastikan link berbentuk youtube.com/watch?v=... atau youtu.be/..., atau pilih file video lokal (.mp4, .mov, .mkv).'
    );
    err.code = 'INVALID_URL';
    err.offerLocalUpload = true;
    throw err;
  }

  const bridge = await detectCompanionBridge();
  if (!bridge.active) {
    // Cek oEmbed publik langsung dari browser pembeli supaya judul video tetap informatif bila valid
    let detectedTitle = '';
    try {
      const oeRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${videoId}`
        )}&format=json`
      );
      if (oeRes.ok) {
        const oe = await oeRes.json();
        detectedTitle = oe?.title || '';
      } else if (oeRes.status === 401 || oeRes.status === 403 || oeRes.status === 404) {
        const privErr = new Error(
          'Video YouTube ini bersifat Pribadi (Private), sudah dihapus, atau dibatasi pemilik channel sehingga tidak bisa diakses. Silakan pilih file rekaman video lokal (.mp4, .mov, .mkv) dari perangkatmu.'
        );
        privErr.code = 'VIDEO_UNAVAILABLE';
        privErr.offerLocalUpload = true;
        throw privErr;
      }
    } catch (subErr) {
      if (subErr?.code === 'VIDEO_UNAVAILABLE') throw subErr;
    }

    const titleNote = detectedTitle ? ` ("${detectedTitle.slice(0, 64)}")` : '';
    const err = new Error(
      `Agar link YouTube${titleNote} diproses 100% lewat internet perangkatmu sendiri tanpa layanan luar, pasang Ekstensi Jembatan Lokal Klip Auto terlebih dahulu — atau langsung pilih file video (.mp4, .mov, .mkv) dari laptopmu.`
    );
    err.code = 'BRIDGE_REQUIRED';
    err.offerLocalUpload = true;
    err.offerExtensionGuide = true;
    err.detectedTitle = detectedTitle;
    throw err;
  }

  try {
    const data = await callCompanionBridge('YT_INFO', { videoId });
    const moments = buildMomentsFromYoutubeWords(
      data.words,
      data.durationSec,
      data.title,
      data.heatmap || null
    );
    const wordCount = Number(data.captionMeta?.wordCount ?? (Array.isArray(data.words) ? data.words.length : 0));
    const enriched = {
      ok: true,
      ...data,
      thumbnail: data.thumbnail || data.thumbnailUrl || '',
      hasCaptions: Boolean(data.captionMeta?.available || wordCount >= 8),
      wordCount,
      captionLang: String(data.captionMeta?.languageCode || 'id'),
      moments,
      scoringMeta: moments.scoringMeta || null
    };
    saveYoutubeTranscriptCache(enriched);
    return enriched;
  } catch (bridgeErr) {
    const friendly = new Error(
      `Link YouTube belum berhasil dimuat (${
        bridgeErr?.message || 'video dibatasi atau koneksi melambat'
      }). Kamu bisa langsung memilih file video lokal (.mp4, .mov, .mkv) dari laptopmu untuk segera dipotong.`
    );
    friendly.code = bridgeErr?.code || 'LINK_FAILED';
    friendly.offerLocalUpload = true;
    throw friendly;
  }
}

function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
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

function pickQualityOption(info, qualityId) {
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
 * Mengalirkan sumber video YouTube lewat internet pembeli sendiri ke objek File .mp4 di memori browser
 * untuk langsung dipotong menjadi klip 9:16 oleh Klip Auto Studio.
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

  saveYoutubeTranscriptCache(info);

  if (quality.mode === 'progressive') {
    const mp4Blob = await downloadFormatViaBridge({
      videoId: info.videoId,
      itag: quality.videoItag,
      expectedBytes: quality.totalBytes,
      mimeType: 'video/mp4',
      signal,
      onBytes: (done, total) => {
        if (!onProgress) return;
        const pct = total > 0 ? Math.min(98, Math.round((done / total) * 94) + 4) : 50;
        onProgress({
          phase: `Memuat sumber video (${formatBytesReadable(done)} / ${formatBytesReadable(total)})...`,
          percent: pct
        });
      }
    });
    return {
      file: new File([mp4Blob], fileName, { type: 'video/mp4' }),
      quality,
      moments: info.moments || [],
      heatmap: info.heatmap || []
    };
  }

  const videoBlob = await downloadFormatViaBridge({
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
        phase: `Memuat jalur gambar ${quality.shortLabel} lewat koneksi lokal (${formatBytesReadable(done)})...`,
        percent: pct
      });
    }
  });

  const audioBlob = await downloadFormatViaBridge({
    videoId: info.videoId,
    itag: quality.audioItag,
    expectedBytes: quality.audioBytes,
    mimeType: 'audio/mp4',
    signal,
    onBytes: (done, total) => {
      if (!onProgress) return;
      const ratio = total > 0 ? done / total : 0.5;
      onProgress({
        phase: `Memuat jalur suara jernih AAC (${formatBytesReadable(done)})...`,
        percent: Math.min(92, 76 + Math.round(ratio * 16))
      });
    }
  });

  if (onProgress) {
    onProgress({ phase: 'Menyatukan gambar & suara di perangkatmu...', percent: 96 });
  }
  const merged = await remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal);

  if (onProgress) {
    onProgress({ phase: 'Video siap dipotong menjadi klip 9:16!', percent: 100 });
  }

  return {
    file: new File([merged], fileName, { type: 'video/mp4' }),
    quality,
    moments: info.moments || [],
    heatmap: info.heatmap || []
  };
}

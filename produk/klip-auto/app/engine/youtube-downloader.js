/**
 * Klip Auto — Mesin Pengunduh MP4 YouTube Anti-403 & Cache Pintar Transkrip Otomatis
 * - Mengambil metadata, pilihan resolusi (360p / 480p / 720p HD / 1080p), & subtitle kata otomatis
 * - Menyimpan cache pintar transkrip YouTube di browser sehingga saat pembeli memasukkan file .MP4
 *   hasil unduhan dari komputer, AI Agent langsung mengenali transkrip & momennya dalam < 0.1 detik
 * - Jalur utama unduh: Konverter MP4 Non-IP-Locked (bebas error 403 CDN YouTube) + Streaming Proxy
 * - Jalur cadangan otomatis: Potongan 4 MB + Penggabung Lossless Mediabunny
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

const CHUNK_SIZE = 4 * 1024 * 1024;
const YT_TRANSCRIPT_CACHE_KEY = 'klip_auto_yt_cache_v1';

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
 * Menyimpan transkrip & momen video YouTube ke localStorage agar ketika pembeli
 * mengunggah ulang file .MP4 hasil unduhannya, AI Agent langsung punya transkrip utuh seketika.
 */
export function saveYoutubeTranscriptCache(info) {
  if (!info || !info.videoId) return;
  try {
    const raw = localStorage.getItem(YT_TRANSCRIPT_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const entry = {
      videoId: info.videoId,
      title: String(info.title || ''),
      slug: normalizeTitleSlug(info.title),
      durationSec: Number(info.durationSec || 0),
      words: Array.isArray(info.words) ? info.words : [],
      savedAt: Date.now()
    };

    const filtered = Array.isArray(list) ? list.filter((x) => x && x.videoId !== info.videoId) : [];
    filtered.unshift(entry);

    // Batasi maksimal 8 entri terbaru agar hemat ruang localStorage
    let trimmed = filtered.slice(0, 8);
    while (trimmed.length > 0) {
      try {
        localStorage.setItem(YT_TRANSCRIPT_CACHE_KEY, JSON.stringify(trimmed));
        break;
      } catch {
        trimmed = trimmed.slice(0, trimmed.length - 1);
      }
    }
  } catch {
    // Abaikan jika mode penyamaran menolak penyimpanan
  }
}

/**
 * Mencocokkan file video lokal yang dimasukkan pembeli dengan riwayat video YouTube yang baru dicek/diunduh.
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
          const moments = buildMomentsFromYoutubeWords(entry.words, targetDur, entry.title);
          return {
            videoId: entry.videoId,
            title: entry.title,
            wordCount: entry.words.length,
            words: entry.words,
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

export function buildMomentsFromYoutubeWords(words, durationSec, fallbackTitle = 'Klip Utama YouTube') {
  if (!Array.isArray(words) || words.length === 0 || durationSec <= 0) return [];
  let moments = pickMomentsFromWordsLocally(words, durationSec).map((m, idx) => ({
    ...m,
    id: `yt-momen-${idx + 1}`,
    reason: 'Diekstrak otomatis oleh AI Agent dari transkrip asli video YouTube.'
  }));

  if (moments.length === 0) {
    const endClip = Number(Math.min(durationSec, Math.max(1, Math.min(40, durationSec))).toFixed(2));
    const clipWords = words.filter((w) => w.start <= endClip);
    moments = [
      {
        id: 'yt-momen-1',
        title: String(fallbackTitle || 'Klip Utama YouTube').slice(0, 54),
        score: 92,
        reason: 'Transkrip kata asli dari YouTube siap langsung diberi gaya caption.',
        startSec: 0,
        endSec: endClip,
        transcript: clipWords.map((w) => w.word).join(' '),
        words: clipWords
      }
    ];
  }
  return moments;
}

/**
 * Mengambil informasi lengkap video YouTube beserta daftar kualitas MP4 dan momen subtitle otomatis.
 */
export async function fetchYoutubeVideoInfo(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) {
    throw new Error('Tempelkan link video YouTube terlebih dahulu.');
  }

  let res;
  try {
    res = await fetch(`./api/youtube/info?url=${encodeURIComponent(clean)}`);
  } catch {
    throw new Error(
      'Tidak dapat terhubung ke layanan pengambil YouTube. Pastikan koneksi internet aktif dan aplikasi dibuka melalui alamat web.'
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Fitur link YouTube memerlukan server web aktif (Cloudflare Pages). Silakan buka melalui link web aplikasi.'
    );
  }

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Gagal memeriksa link YouTube (${res.status}).`);
  }

  const moments = buildMomentsFromYoutubeWords(data.words, data.durationSec, data.title);
  const enriched = {
    ...data,
    moments
  };

  saveYoutubeTranscriptCache(enriched);
  return enriched;
}

function sleepAbortable(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Unduhan YouTube dibatalkan.', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Unduhan YouTube dibatalkan.', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function pickQualityOption(info, qualityId) {
  if (!info || !Array.isArray(info.qualities) || info.qualities.length === 0) {
    throw new Error('Data kualitas video YouTube belum tersedia.');
  }
  return (
    info.qualities.find((q) => q.id === qualityId) ||
    info.qualities.find((q) => q.recommended) ||
    info.qualities[0]
  );
}

/**
 * Menyiapkan URL stream MP4 utuh bebas-403 melalui konverter server + proxy aman.
 */
async function resolveConverterMp4ProxyUrl({
  videoId,
  savenowFormat = '480',
  fileName,
  attachment = false,
  signal = null,
  onProgress = null
}) {
  if (signal?.aborted) {
    throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
  }

  if (onProgress) {
    onProgress({
      phase: `Menghubungi jalur unduh MP4 ${savenowFormat}p bebas blokir...`,
      percent: 8
    });
  }

  const initRes = await fetch(
    `./api/youtube/convert-init?v=${encodeURIComponent(videoId)}&format=${encodeURIComponent(savenowFormat)}`,
    { signal }
  );
  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok || !initData.ok) {
    throw new Error(initData.error || `Gagal memulai penyiapan MP4 (${initRes.status}).`);
  }

  let downloadUrl = initData.directUrl || null;
  const jobId = initData.jobId;

  if (!downloadUrl) {
    const maxPolls = 55;
    for (let i = 0; i < maxPolls; i++) {
      await sleepAbortable(1500, signal);
      const progRes = await fetch(
        `./api/youtube/convert-progress?id=${encodeURIComponent(jobId)}`,
        { signal }
      );
      const progData = await progRes.json().catch(() => ({}));
      if (!progRes.ok || !progData.ok) {
        if (progRes.status === 422) {
          throw new Error(progData.error || 'Format video ini tidak dapat disiapkan.');
        }
        continue;
      }

      if (progData.finished && progData.downloadUrl) {
        downloadUrl = progData.downloadUrl;
        break;
      }

      if (onProgress) {
        const rawPct = Number(progData.percent || 0);
        // Berikan progres visual halus 12%..88% selama server merakit stream MP4
        const visualPct =
          rawPct > 10
            ? Math.min(88, 12 + Math.round(rawPct * 0.76))
            : Math.min(82, 12 + Math.round(((i + 1) / 14) * 66));
        onProgress({
          phase: `Menyiapkan file MP4 ${savenowFormat}p utuh dari YouTube (${visualPct}%)...`,
          percent: visualPct
        });
      }
    }
  }

  if (!downloadUrl) {
    throw new Error('Waktu penyiapan MP4 habis untuk video panjang ini. Silakan klik tombol sekali lagi (jalur sudah dipanaskan).');
  }

  return `./api/youtube/proxy-file?url=${encodeURIComponent(downloadUrl)}&name=${encodeURIComponent(
    fileName
  )}&dl=${attachment ? '1' : '0'}`;
}

/**
 * Menyimpan file .MP4 YouTube langsung ke folder Downloads perangkat pembeli menggunakan
 * pengunduh asli browser (tanpa membebani RAM meskipun video berdurasi 25–60 menit).
 */
export async function saveYoutubeMp4ToDevice({
  info,
  qualityId = null,
  signal = null,
  onProgress = null
}) {
  const quality = pickQualityOption(info, qualityId);
  const suffix = quality.shortLabel.replace(/\s+/g, '').toLowerCase();
  const fileName = sanitizeYoutubeFilename(info.title, suffix);
  const savenowFormat = quality.savenowFormat || '480';

  saveYoutubeTranscriptCache(info);

  try {
    const proxyDownloadUrl = await resolveConverterMp4ProxyUrl({
      videoId: info.videoId,
      savenowFormat,
      fileName,
      attachment: true,
      signal,
      onProgress
    });

    if (onProgress) {
      onProgress({
        phase: `Memverifikasi aliran MP4 ${quality.shortLabel}...`,
        percent: 94
      });
    }

    // Pastikan endpoint benar-benar mengembalikan aliran video/mp4 (200/206) sebelum memicu unduhan browser
    const probeCtrl = new AbortController();
    const onOuterAbort = () => probeCtrl.abort();
    signal?.addEventListener('abort', onOuterAbort, { once: true });

    try {
      const probeRes = await fetch(proxyDownloadUrl, {
        signal: probeCtrl.signal
      });
      if (!probeRes.ok && probeRes.status !== 206) {
        let errMsg = `Server unduhan merespons status ${probeRes.status}.`;
        try {
          const j = await probeRes.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        throw new Error(errMsg);
      }
      // Baca sedikit byte pertama untuk memastikan stream aktif, lalu tutup koneksi probe
      if (probeRes.body) {
        const reader = probeRes.body.getReader();
        await reader.read();
        await reader.cancel().catch(() => {});
      }
    } finally {
      signal?.removeEventListener('abort', onOuterAbort);
    }

    if (signal?.aborted) {
      throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
    }

    if (onProgress) {
      onProgress({
        phase: `Unduhan MP4 ${quality.shortLabel} dimulai di browser kamu!`,
        percent: 100
      });
    }

    const a = document.createElement('a');
    a.href = proxyDownloadUrl;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();

    return { fileName, quality, directStarted: true };
  } catch (convErr) {
    if (convErr?.name === 'AbortError') throw convErr;

    // Cadangan otomatis bila jalur konverter sedang penuh dan video memiliki itag langsung
    if (quality.videoItag) {
      const res = await downloadYoutubeViaChunksFallback({
        info,
        quality,
        fileName,
        signal,
        onProgress
      });
      const blobUrl = URL.createObjectURL(res.file);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = res.file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
      return { fileName: res.file.name, quality, directStarted: true, file: res.file };
    }

    throw convErr;
  }
}

async function streamProxyUrlIntoFile({ proxyUrl, fileName, expectedBytes, qualityLabel, signal, onProgress }) {
  const res = await fetch(proxyUrl, { signal });
  if (!res.ok && res.status !== 206) {
    let msg = `Gagal mengalirkan video MP4 (${res.status}).`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  const cl = Number(res.headers.get('content-length') || 0) || expectedBytes || 0;
  if (!res.body) {
    const ab = await res.arrayBuffer();
    return new File([ab], fileName, { type: 'video/mp4' });
  }

  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) {
      await reader.cancel().catch(() => {});
      throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
    }
    if (value && value.byteLength > 0) {
      chunks.push(value);
      received += value.byteLength;
      if (onProgress) {
        const pct =
          cl > 0
            ? Math.min(99, 88 + Math.round((received / cl) * 11))
            : Math.min(98, 88 + Math.min(10, Math.floor(received / (5 * 1024 * 1024))));
        onProgress({
          phase: `Memuat aliran MP4 ${qualityLabel} ke Studio (${formatBytesReadable(received)})...`,
          percent: pct
        });
      }
    }
  }

  if (received < 1024) {
    throw new Error('Aliran file MP4 terlalu pendek atau terputus.');
  }

  const blob = new Blob(chunks, { type: 'video/mp4' });
  return new File([blob], fileName, { type: 'video/mp4' });
}

async function fetchSingleRangeChunk({ videoId, itag, start, end, signal, onDeltaBytes }) {
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
    }
    try {
      const url = `./api/youtube/stream?v=${encodeURIComponent(videoId)}&itag=${encodeURIComponent(
        itag
      )}&start=${start}&end=${end}`;
      const res = await fetch(url, { signal });
      if (!res.ok && res.status !== 206) {
        let msg = `Gagal mengunduh potongan stream (${res.status}).`;
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }

      const headerTotal = Number(res.headers.get('x-total-bytes') || 0);
      const cr = res.headers.get('content-range') || '';
      const crMatch = cr.match(/\/(\d+)$/);
      const totalBytes = headerTotal || (crMatch ? Number(crMatch[1]) : 0);

      const ab = await res.arrayBuffer();
      const u8 = new Uint8Array(ab);
      if (onDeltaBytes) onDeltaBytes(u8.byteLength);
      return { chunk: u8, totalBytes };
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      lastErr = err;
      await sleepAbortable(300 * (attempt + 1), signal);
    }
  }
  throw lastErr || new Error('Gagal mengunduh stream dari YouTube.');
}

async function downloadFormatAsBlob({ videoId, itag, expectedBytes, mimeType, signal, onBytes }) {
  let downloaded = 0;
  let totalKnown = expectedBytes || 0;
  const reportDelta = (delta) => {
    downloaded += delta;
    if (onBytes) onBytes(downloaded, totalKnown);
  };

  const firstEnd = totalKnown > 0 ? Math.min(totalKnown - 1, CHUNK_SIZE - 1) : CHUNK_SIZE - 1;
  const first = await fetchSingleRangeChunk({
    videoId,
    itag,
    start: 0,
    end: firstEnd,
    signal,
    onDeltaBytes: reportDelta
  });

  if (first.totalBytes > 0) totalKnown = first.totalBytes;
  else if (totalKnown <= 0) totalKnown = first.chunk.byteLength;

  if (first.chunk.byteLength >= totalKnown) {
    return new Blob([first.chunk], { type: mimeType });
  }

  const orderedChunks = [first.chunk];
  for (let pos = first.chunk.byteLength; pos < totalKnown; pos += CHUNK_SIZE) {
    const res = await fetchSingleRangeChunk({
      videoId,
      itag,
      start: pos,
      end: Math.min(totalKnown - 1, pos + CHUNK_SIZE - 1),
      signal,
      onDeltaBytes: reportDelta
    });
    orderedChunks.push(res.chunk);
  }

  return new Blob(orderedChunks, { type: mimeType });
}

async function remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal) {
  const vInput = new Input({ source: new BlobSource(videoBlob), formats: ALL_FORMATS });
  const aInput = new Input({ source: new BlobSource(audioBlob), formats: ALL_FORMATS });

  try {
    const [vTrack, aTrack] = await Promise.all([
      vInput.getPrimaryVideoTrack(),
      aInput.getPrimaryAudioTrack()
    ]);

    if (!vTrack) throw new Error('Jalur gambar video YouTube tidak terbaca.');
    if (!aTrack) throw new Error('Jalur suara audio YouTube tidak terbaca.');

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
        throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
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
        throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
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

async function downloadYoutubeViaChunksFallback({ info, quality, fileName, signal, onProgress }) {
  if (quality.mode === 'progressive') {
    const mp4Blob = await downloadFormatAsBlob({
      videoId: info.videoId,
      itag: quality.videoItag,
      expectedBytes: quality.totalBytes,
      mimeType: 'video/mp4',
      signal,
      onBytes: (done, total) => {
        if (!onProgress) return;
        const pct = total > 0 ? Math.min(98, Math.round((done / total) * 94) + 4) : 50;
        onProgress({
          phase: `Mengunduh video ${quality.shortLabel} (${formatBytesReadable(done)} / ${formatBytesReadable(total)})...`,
          percent: pct
        });
      }
    });
    return {
      file: new File([mp4Blob], fileName, { type: 'video/mp4' }),
      quality,
      moments: info.moments || []
    };
  }

  const videoBlob = await downloadFormatAsBlob({
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
        phase: `Mengunduh gambar ${quality.shortLabel} (${formatBytesReadable(done)})...`,
        percent: pct
      });
    }
  });

  const audioBlob = await downloadFormatAsBlob({
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
    onProgress({ phase: 'Menyatukan gambar HD & suara jernih menjadi MP4 utuh...', percent: 96 });
  }
  const merged = await remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal);
  return {
    file: new File([merged], fileName, { type: 'video/mp4' }),
    quality,
    moments: info.moments || []
  };
}

/**
 * Mengunduh video YouTube menjadi objek File .mp4 untuk langsung dimuat ke Studio & dipotong AI Agent.
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
  const savenowFormat = quality.savenowFormat || '480';

  saveYoutubeTranscriptCache(info);

  try {
    const proxyUrl = await resolveConverterMp4ProxyUrl({
      videoId: info.videoId,
      savenowFormat,
      fileName,
      attachment: false,
      signal,
      onProgress
    });

    const file = await streamProxyUrlIntoFile({
      proxyUrl,
      fileName,
      expectedBytes: quality.totalBytes,
      qualityLabel: quality.shortLabel,
      signal,
      onProgress
    });

    if (onProgress) {
      onProgress({ phase: 'Video YouTube MP4 siap dipotong AI Agent!', percent: 100 });
    }

    return { file, quality, moments: info.moments || [] };
  } catch (convErr) {
    if (convErr?.name === 'AbortError') throw convErr;
    if (quality.videoItag) {
      return downloadYoutubeViaChunksFallback({ info, quality, fileName, signal, onProgress });
    }
    throw convErr;
  }
}

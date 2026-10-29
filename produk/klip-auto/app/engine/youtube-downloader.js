/**
 * Klip Auto — Mesin Pengunduh & Penggabung MP4 YouTube di Browser
 * - Mengambil metadata, pilihan resolusi (360p / 480p / 720p HD / 1080p), & subtitle kata otomatis
 * - Mengunduh stream YouTube per potongan 4 MB paralel agar cepat dan tidak terkena limit kecepatan
 * - Menggabungkan jalur gambar H.264 + suara AAC jernih secara lossless (tanpa encode ulang) memakai Mediabunny
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

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB per potongan Range

export function formatBytesReadable(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return 'Ukuran otomatis';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeYoutubeFilename(title, suffix = '') {
  const base = String(title || 'video-youtube')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 56) || 'video-youtube';
  return suffix ? `${base}-${suffix}.mp4` : `${base}.mp4`;
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

  // Susun momen otomatis jika video memiliki subtitle YouTube
  let moments = [];
  if (Array.isArray(data.words) && data.words.length > 0 && data.durationSec > 0) {
    moments = pickMomentsFromWordsLocally(data.words, data.durationSec).map((m, idx) => ({
      ...m,
      id: `yt-momen-${idx + 1}`,
      reason: 'Diekstrak otomatis dari jalur transkrip asli video YouTube.'
    }));

    if (moments.length === 0) {
      const endClip = Number(Math.min(data.durationSec, Math.max(1, Math.min(45, data.durationSec))).toFixed(2));
      const clipWords = data.words.filter((w) => w.start <= endClip);
      moments = [
        {
          id: 'yt-momen-1',
          title: String(data.title || 'Klip Utama YouTube').slice(0, 54),
          score: 92,
          reason: 'Transkrip kata asli dari YouTube siap langsung diberi gaya caption.',
          startSec: 0,
          endSec: endClip,
          transcript: clipWords.map((w) => w.word).join(' '),
          words: clipWords
        }
      ];
    }
  }

  return {
    ...data,
    moments
  };
}

async function fetchSingleRangeChunk({ videoId, itag, start, end, signal, onDeltaBytes }) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
    }
    try {
      const url = `./api/youtube/stream?v=${encodeURIComponent(videoId)}&itag=${encodeURIComponent(itag)}&start=${start}&end=${end}`;
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

      if (!res.body) {
        const ab = await res.arrayBuffer();
        const u8 = new Uint8Array(ab);
        if (onDeltaBytes) onDeltaBytes(u8.byteLength);
        return { chunk: u8, totalBytes };
      }

      const reader = res.body.getReader();
      const parts = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signal?.aborted) {
          await reader.cancel().catch(() => {});
          throw new DOMException('Unduhan YouTube dibatalkan.', 'AbortError');
        }
        if (value && value.byteLength > 0) {
          parts.push(value);
          received += value.byteLength;
          if (onDeltaBytes) onDeltaBytes(value.byteLength);
        }
      }

      const merged = new Uint8Array(received);
      let offset = 0;
      for (const p of parts) {
        merged.set(p, offset);
        offset += p.byteLength;
      }
      return { chunk: merged, totalBytes };
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      lastErr = err;
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('Gagal mengunduh stream dari YouTube.');
}

async function downloadFormatAsBlob({ videoId, itag, expectedBytes, mimeType, signal, onBytes }) {
  let downloaded = 0;
  const reportDelta = (delta) => {
    downloaded += delta;
    if (onBytes) onBytes(downloaded, totalKnown);
  };

  let totalKnown = expectedBytes || 0;

  // Ambil potongan pertama (0 .. 4 MB) sekaligus memastikan ukuran total presisi dari header Content-Range
  const firstEnd = totalKnown > 0 ? Math.min(totalKnown - 1, CHUNK_SIZE - 1) : CHUNK_SIZE - 1;
  const first = await fetchSingleRangeChunk({
    videoId,
    itag,
    start: 0,
    end: firstEnd,
    signal,
    onDeltaBytes: reportDelta
  });

  if (first.totalBytes > 0) {
    totalKnown = first.totalBytes;
  } else if (totalKnown <= 0) {
    totalKnown = first.chunk.byteLength;
  }

  if (first.chunk.byteLength >= totalKnown) {
    return new Blob([first.chunk], { type: mimeType });
  }

  const ranges = [];
  for (let pos = first.chunk.byteLength; pos < totalKnown; pos += CHUNK_SIZE) {
    ranges.push({
      index: ranges.length + 1,
      start: pos,
      end: Math.min(totalKnown - 1, pos + CHUNK_SIZE - 1)
    });
  }

  const orderedChunks = new Array(ranges.length + 1);
  orderedChunks[0] = first.chunk;

  let cursor = 0;
  const concurrency = Math.min(2, ranges.length);
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < ranges.length) {
      const job = ranges[cursor++];
      const res = await fetchSingleRangeChunk({
        videoId,
        itag,
        start: job.start,
        end: job.end,
        signal,
        onDeltaBytes: reportDelta
      });
      orderedChunks[job.index] = res.chunk;
    }
  });

  await Promise.all(workers);
  return new Blob(orderedChunks, { type: mimeType });
}

/**
 * Menggabungkan jalur gambar H.264 dan jalur suara AAC M4A menjadi satu file .MP4 utuh
 * tanpa re-encode sehingga kualitas jernih 100% asli dan selesai dalam hitungan milidetik.
 */
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

/**
 * Mengunduh video YouTube menjadi objek File .mp4 siap simpan ke perangkat maupun siap dimuat ke Studio 9:16.
 */
export async function downloadYoutubeAsMp4File({
  info,
  qualityId = null,
  signal = null,
  onProgress = null
}) {
  if (!info || !Array.isArray(info.qualities) || info.qualities.length === 0) {
    throw new Error('Data kualitas video YouTube belum tersedia.');
  }

  const quality =
    info.qualities.find((q) => q.id === qualityId) ||
    info.qualities.find((q) => q.recommended) ||
    info.qualities[0];

  const fileName = sanitizeYoutubeFilename(info.title, quality.shortLabel.replace(/\s+/g, '').toLowerCase());

  if (quality.mode === 'progressive') {
    if (onProgress) {
      onProgress({
        phase: `Mengunduh video YouTube ${quality.shortLabel}...`,
        percent: 4
      });
    }

    const mp4Blob = await downloadFormatAsBlob({
      videoId: info.videoId,
      itag: quality.videoItag,
      expectedBytes: quality.totalBytes,
      mimeType: 'video/mp4',
      signal,
      onBytes: (done, total) => {
        if (!onProgress) return;
        const pct = total > 0 ? Math.min(98, Math.round((done / total) * 96) + 2) : 50;
        onProgress({
          phase: `Mengunduh video ${quality.shortLabel} (${formatBytesReadable(done)} / ${formatBytesReadable(total)})...`,
          percent: pct
        });
      }
    });

    if (onProgress) {
      onProgress({ phase: 'Video MP4 selesai disiapkan!', percent: 100 });
    }

    const file = new File([mp4Blob], fileName, { type: 'video/mp4' });
    return { file, quality, moments: info.moments || [] };
  }

  // Mode Adaptive HD (unduh jalur gambar H.264 + jalur suara AAC jernih lalu satukan ke MP4)
  let videoDone = 0;
  let audioDone = 0;
  const estTotal = Math.max(1, (quality.videoBytes || 0) + (quality.audioBytes || 0));

  const videoBlob = await downloadFormatAsBlob({
    videoId: info.videoId,
    itag: quality.videoItag,
    expectedBytes: quality.videoBytes,
    mimeType: 'video/mp4',
    signal,
    onBytes: (done, total) => {
      videoDone = done;
      if (!onProgress) return;
      const denom = total > 0 ? total + (quality.audioBytes || 0) : estTotal;
      const pct = Math.min(76, Math.max(3, Math.round((videoDone / Math.max(1, denom)) * 76)));
      onProgress({
        phase: `Mengunduh gambar ${quality.shortLabel} (${formatBytesReadable(done)} / ${formatBytesReadable(total || quality.videoBytes)})...`,
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
      audioDone = done;
      if (!onProgress) return;
      const ratio = total > 0 ? done / total : 0.5;
      const pct = Math.min(92, 76 + Math.round(ratio * 16));
      onProgress({
        phase: `Mengunduh jalur suara jernih AAC (${formatBytesReadable(done)} / ${formatBytesReadable(total || quality.audioBytes)})...`,
        percent: pct
      });
    }
  });

  if (onProgress) {
    onProgress({
      phase: 'Menyatukan gambar HD & suara jernih menjadi MP4 utuh...',
      percent: 95
    });
  }

  const mergedMp4Blob = await remuxVideoAndAudioToMp4(videoBlob, audioBlob, signal);

  if (onProgress) {
    onProgress({
      phase: 'Video YouTube MP4 siap digunakan!',
      percent: 100
    });
  }

  const file = new File([mergedMp4Blob], fileName, { type: 'video/mp4' });
  return { file, quality, moments: info.moments || [] };
}

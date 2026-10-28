/**
 * Klip Auto — Pemroses Audio Streaming Hemat RAM & Pembuat Video Contoh
 * Membaca file besar (10–30 menit) lewat BlobSource Mediabunny tanpa menyalin
 * seluruh video ke RAM.
 */

import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  QUALITY_MEDIUM
} from '../vendor/mediabunny.min.mjs';

/**
 * Membaca metadata video (durasi, resolusi, ada/tidaknya jalur suara) secara hemat memori.
 */
export async function probeMediaFile(fileOrBlob) {
  const input = new Input({
    source: new BlobSource(fileOrBlob),
    formats: ALL_FORMATS
  });

  try {
    const [videoTrack, audioTrack, durationMeta] = await Promise.all([
      input.getPrimaryVideoTrack(),
      input.getPrimaryAudioTrack(),
      input.getDurationFromMetadata()
    ]);

    if (!videoTrack) {
      throw new Error('File ini tidak memiliki jalur gambar video yang valid.');
    }

    let duration = durationMeta;
    if (duration == null || !Number.isFinite(duration) || duration <= 0) {
      duration = await input.computeDuration([videoTrack]);
    }

    const [codedWidth, codedHeight, rotation] = await Promise.all([
      videoTrack.getCodedWidth(),
      videoTrack.getCodedHeight(),
      videoTrack.getRotation()
    ]);

    const swapped = rotation === 90 || rotation === 270;
    const width = swapped ? codedHeight : codedWidth;
    const height = swapped ? codedWidth : codedHeight;

    return {
      duration: Number(duration || 0),
      width,
      height,
      hasAudio: Boolean(audioTrack),
      sizeBytes: fileOrBlob.size || 0
    };
  } finally {
    input.dispose();
  }
}

/**
 * Mengekstrak suara mono ringan (misal 16 kHz untuk Whisper atau 8 kHz untuk kirim cepat ke Gemini)
 * tanpa mendekode satupun frame gambar video.
 */
export async function extractMonoAudio(fileOrBlob, {
  startSec = 0,
  endSec = null,
  targetSampleRate = 16000,
  onProgress = null
} = {}) {
  const input = new Input({
    source: new BlobSource(fileOrBlob),
    formats: ALL_FORMATS
  });

  try {
    const audioTrack = await input.getPrimaryAudioTrack();
    let totalDuration = await input.getDurationFromMetadata();
    if (!totalDuration || !Number.isFinite(totalDuration)) {
      totalDuration = await input.computeDuration();
    }

    const actualEnd = endSec != null ? Math.min(endSec, totalDuration) : totalDuration;
    const span = Math.max(0.1, actualEnd - startSec);
    const totalSamples = Math.max(1, Math.ceil(span * targetSampleRate));
    const monoOut = new Float32Array(totalSamples);

    if (!audioTrack) {
      return { samples: monoOut, sampleRate: targetSampleRate, duration: span };
    }

    const sink = new AudioBufferSink(audioTrack);
    let writeCursor = 0;

    for await (const wrapped of sink.buffers(startSec, actualEnd)) {
      const buf = wrapped.buffer;
      const srcRate = buf.sampleRate;
      const channels = buf.numberOfChannels;
      const ch0 = buf.getChannelData(0);
      const ch1 = channels > 1 ? buf.getChannelData(1) : null;

      // Hitung bagian buffer yang masuk ke jendela [startSec, actualEnd]
      const chunkStart = wrapped.timestamp;
      const skipSec = Math.max(0, startSec - chunkStart);
      const skipSrcSamples = Math.floor(skipSec * srcRate);
      const availSrcSamples = Math.max(0, buf.length - skipSrcSamples);

      if (availSrcSamples > 0) {
        const outLen = Math.floor((availSrcSamples * targetSampleRate) / srcRate);
        const ratio = srcRate / targetSampleRate;

        for (let i = 0; i < outLen && writeCursor < totalSamples; i++) {
          const srcIdx = Math.min(buf.length - 1, skipSrcSamples + Math.floor(i * ratio));
          const sample = ch1 ? (ch0[srcIdx] + ch1[srcIdx]) * 0.5 : ch0[srcIdx];
          monoOut[writeCursor++] = Math.max(-1, Math.min(1, sample));
        }
      }

      if (onProgress) {
        const pct = Math.min(99, Math.round(((wrapped.timestamp - startSec) / span) * 100));
        onProgress(Math.max(0, pct));
      }
    }

    if (onProgress) onProgress(100);
    return {
      samples: monoOut.subarray(0, Math.max(1, writeCursor)),
      sampleRate: targetSampleRate,
      duration: span
    };
  } finally {
    input.dispose();
  }
}

/**
 * Mengubah Float32Array mono menjadi Blob WAV 16-bit PCM ringan (untuk dikirim ke API Gemini BYOK).
 */
export function encodeMonoWavBlob(float32Samples, sampleRate = 16000) {
  const numSamples = float32Samples.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // format = 1
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, float32Samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Mengambil potongan AudioBuffer jernih (48 kHz stereo/mono) presisi untuk rentang klip [startSec, endSec]
 * lengkap dengan fade-in & fade-out halus 15ms supaya tidak terdengar bunyi klik di awal/akhir klip.
 */
export async function extractClipAudioBuffer(fileOrBlob, startSec, endSec) {
  const clipDuration = Math.max(0.2, endSec - startSec);
  const input = new Input({
    source: new BlobSource(fileOrBlob),
    formats: ALL_FORMATS
  });

  try {
    const audioTrack = await input.getPrimaryAudioTrack();
    const fallbackRate = 48000;

    if (!audioTrack) {
      const silent = new AudioBuffer({
        length: Math.ceil(clipDuration * fallbackRate),
        numberOfChannels: 2,
        sampleRate: fallbackRate
      });
      return silent;
    }

    const sink = new AudioBufferSink(audioTrack);
    let outBuffer = null;
    let sampleRate = fallbackRate;
    let numChannels = 2;

    for await (const wrapped of sink.buffers(startSec, endSec)) {
      const buf = wrapped.buffer;
      if (!outBuffer) {
        sampleRate = buf.sampleRate || 48000;
        numChannels = Math.min(2, Math.max(1, buf.numberOfChannels || 1));
        outBuffer = new AudioBuffer({
          length: Math.max(1, Math.ceil(clipDuration * sampleRate)),
          numberOfChannels: numChannels,
          sampleRate
        });
      }

      const relStartSec = wrapped.timestamp - startSec;
      const srcOffset = relStartSec < 0 ? Math.round(-relStartSec * sampleRate) : 0;
      const dstOffset = relStartSec > 0 ? Math.round(relStartSec * sampleRate) : 0;
      const copyCount = Math.min(buf.length - srcOffset, outBuffer.length - dstOffset);

      if (copyCount > 0 && srcOffset < buf.length && dstOffset < outBuffer.length) {
        for (let ch = 0; ch < numChannels; ch++) {
          const srcCh = buf.getChannelData(Math.min(ch, buf.numberOfChannels - 1));
          const dstCh = outBuffer.getChannelData(ch);
          dstCh.set(srcCh.subarray(srcOffset, srcOffset + copyCount), dstOffset);
        }
      }
    }

    if (!outBuffer) {
      outBuffer = new AudioBuffer({
        length: Math.ceil(clipDuration * fallbackRate),
        numberOfChannels: 2,
        sampleRate: fallbackRate
      });
      return outBuffer;
    }

    // Fade-in & fade-out halus 15ms anti bunyi "pop"
    const fadeSamples = Math.min(Math.floor(outBuffer.length / 4), Math.floor(sampleRate * 0.015));
    for (let ch = 0; ch < outBuffer.numberOfChannels; ch++) {
      const data = outBuffer.getChannelData(ch);
      for (let i = 0; i < fadeSamples; i++) {
        const gain = i / fadeSamples;
        data[i] *= gain;
        data[data.length - 1 - i] *= gain;
      }
    }

    return outBuffer;
  } finally {
    input.dispose();
  }
}

/**
 * Membuat file video contoh podcast 16:9 (.mp4 asli, 16 detik, 2 pembicara bergantian kiri & kanan)
 * langsung di browser agar pembeli bisa langsung mencoba seluruh fitur tanpa harus punya stok video dulu.
 */
export async function createSamplePodcastMp4(onProgress = null) {
  const W = 1280;
  const H = 720;
  const FPS = 30;
  const DURATION = 16;
  const totalFrames = DURATION * FPS;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target
  });

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    quality: QUALITY_MEDIUM,
    keyFrameInterval: 1
  });
  const audioSource = new AudioBufferSource({
    codec: 'aac',
    quality: QUALITY_HIGH
  });

  output.addVideoTrack(videoSource);
  output.addAudioTrack(audioSource);
  await output.start();

  // Buat ritme suara simulasi ucapan kata demi kata agar sinkronisasi gelombang suara terasa hidup
  const sr = 48000;
  const audioBuf = new AudioBuffer({
    length: DURATION * sr,
    numberOfChannels: 2,
    sampleRate: sr
  });
  const chL = audioBuf.getChannelData(0);
  const chR = audioBuf.getChannelData(1);

  for (let i = 0; i < audioBuf.length; i++) {
    const t = i / sr;
    const syllableGate = Math.max(0, Math.sin(t * Math.PI * 3.6)) > 0.22 ? 1 : 0.04;
    const speakerFreq = t < 8 ? 165 : 210;
    const harmonic =
      Math.sin(2 * Math.PI * speakerFreq * t) * 0.55 +
      Math.sin(2 * Math.PI * speakerFreq * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * (speakerFreq * 1.5) * t) * 0.12;
    const val = harmonic * syllableGate * 0.16;
    chL[i] = val;
    chR[i] = val;
  }
  await audioSource.add(audioBuf);

  for (let f = 0; f < totalFrames; f++) {
    const t = f / FPS;
    const activeLeft = t < 8.0;

    // Latar studio podcast hangat
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E293B');
    grad.addColorStop(1, '#090D16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Lampu aksen belakang studio
    ctx.fillStyle = activeLeft ? 'rgba(20, 184, 166, 0.18)' : 'rgba(245, 158, 11, 0.18)';
    ctx.beginPath();
    ctx.arc(activeLeft ? W * 0.28 : W * 0.72, H * 0.36, 230, 0, Math.PI * 2);
    ctx.fill();

    // Gambar 2 pembicara (Kiri di X=0.28, Kanan di X=0.72) supaya fitur Wajah Tengah terlihat nyata berpindah
    const drawSpeaker = (cx, cy, isSpeaking, label, shirtColor) => {
      const bob = isSpeaking ? Math.sin(t * 7) * 5 : 0;
      // Bahu / badan
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 165 + bob * 0.4, 115, 95, 0, Math.PI, 0, false);
      ctx.fill();

      // Kepala (rona kulit hangat agar terdeteksi juga oleh fallback maupun wajah)
      ctx.fillStyle = isSpeaking ? '#F1C29B' : '#B98E6B';
      ctx.beginPath();
      ctx.ellipse(cx, cy + bob, 64, 76, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rambut
      ctx.fillStyle = '#1E1B18';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 42 + bob, 66, 36, 0, Math.PI, 0, false);
      ctx.fill();

      // Mata & mulut bicara
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 8 + bob, 6, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 8 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      const mouthOpen = isSpeaking ? 5 + Math.abs(Math.sin(t * 11)) * 12 : 3;
      ctx.fillStyle = '#7F1D1D';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28 + bob, 16, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mikrofon podcast
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 10, cy + 88, 20, 62);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(cx, cy + 82, 18, 0, Math.PI * 2);
      ctx.fill();

      // Label nama
      ctx.fillStyle = isSpeaking ? '#FACC15' : '#94A3B8';
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, H - 36);
    };

    drawSpeaker(W * 0.28, H * 0.42, activeLeft, 'Host Podcast (Kiri)', '#0F766E');
    drawSpeaker(W * 0.72, H * 0.42, !activeLeft, 'Narasumber (Kanan)', '#B45309');

    // Meja studio bawah
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, H - 24, W, 24);

    await videoSource.add(t, 1 / FPS);
    if (onProgress && f % 15 === 0) {
      onProgress(Math.round((f / totalFrames) * 100));
    }
  }

  await output.finalize();
  if (onProgress) onProgress(100);

  const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' });
  const sampleFile = new File([mp4Blob], 'contoh-podcast-2-pembicara.mp4', {
    type: 'video/mp4'
  });

  const sampleMoments = [
    {
      id: 'momen-1',
      title: 'Kesalahan Terbesar Saat Bikin Konten Pendek',
      score: 95,
      reason: 'Kalimat pembuka langsung menyentuh masalah utama penonton dalam 3 detik pertama.',
      startSec: 0.4,
      endSec: 15.6,
      transcript:
        'Banyak kreator gagal bukan karena idenya jelek tapi tiga detik pertama pembukaannya terlalu bertele-tele jadi penonton langsung lewat begitu saja.',
      words: [
        { word: 'Banyak', start: 0.5, end: 1.0 },
        { word: 'kreator', start: 1.0, end: 1.6 },
        { word: 'gagal', start: 1.6, end: 2.2 },
        { word: 'bukan', start: 2.3, end: 2.8 },
        { word: 'karena', start: 2.8, end: 3.3 },
        { word: 'idenya', start: 3.3, end: 3.9 },
        { word: 'jelek,', start: 3.9, end: 4.6 },
        { word: 'tapi', start: 4.8, end: 5.3 },
        { word: 'tiga', start: 5.3, end: 5.8 },
        { word: 'detik', start: 5.8, end: 6.4 },
        { word: 'pertama', start: 6.4, end: 7.1 },
        { word: 'pembukaannya', start: 7.1, end: 7.9 },
        { word: 'terlalu', start: 8.1, end: 8.8 },
        { word: 'bertele-tele', start: 8.8, end: 9.8 },
        { word: 'jadi', start: 10.0, end: 10.5 },
        { word: 'penonton', start: 10.5, end: 11.3 },
        { word: 'langsung', start: 11.3, end: 12.1 },
        { word: 'lewat', start: 12.1, end: 12.9 },
        { word: 'begitu', start: 13.0, end: 13.8 },
        { word: 'saja.', start: 13.8, end: 15.1 }
      ]
    },
    {
      id: 'momen-2',
      title: 'Tiga Detik Pertama Penentu Penonton Bertahan',
      score: 89,
      reason: 'Peralihan dari Host ke Narasumber dengan poin inti yang padat dan jelas.',
      startSec: 4.8,
      endSec: 15.4,
      transcript:
        'Tapi tiga detik pertama pembukaannya terlalu bertele-tele jadi penonton langsung lewat begitu saja.',
      words: [
        { word: 'Tapi', start: 4.8, end: 5.3 },
        { word: 'tiga', start: 5.3, end: 5.8 },
        { word: 'detik', start: 5.8, end: 6.4 },
        { word: 'pertama', start: 6.4, end: 7.1 },
        { word: 'pembukaannya', start: 7.1, end: 7.9 },
        { word: 'terlalu', start: 8.1, end: 8.8 },
        { word: 'bertele-tele', start: 8.8, end: 9.8 },
        { word: 'jadi', start: 10.0, end: 10.5 },
        { word: 'penonton', start: 10.5, end: 11.3 },
        { word: 'langsung', start: 11.3, end: 12.1 },
        { word: 'lewat', start: 12.1, end: 12.9 },
        { word: 'begitu', start: 13.0, end: 13.8 },
        { word: 'saja.', start: 13.8, end: 15.1 }
      ]
    }
  ];

  return { file: sampleFile, moments: sampleMoments };
}

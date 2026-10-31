/**
 * Klip Auto — Pemroses Audio Streaming Hemat RAM, Penjernih Vokal Podcast & Pembuat Video Contoh
 * - Membaca file besar (10–30 menit) lewat BlobSource Mediabunny + cadangan Web Audio decodeAudioData
 * - Menstandarkan output klip ke 48 kHz Stereo jernih, menyeimbangkan mic sebelah (mono-kiri/kanan),
 *   meredam dengung rendah (85 Hz), memperjelas vokal (3.1 kHz), dan menormalkan volume ucapan pelan
 * - Membuat video contoh 2 pembicara dengan rekaman suara percakapan Bahasa Indonesia asli
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
import { alignTextToVocalWaveform } from './vocal-aligner.js';

const MAX_WEBAUDIO_FALLBACK_BYTES = 195 * 1024 * 1024;

function getAudioContextClass() {
  return window.AudioContext || window.webkitAudioContext || null;
}

/**
 * Cadangan dekode jalur suara memakai decoder bawaan browser (Web Audio API)
 * bila container/codec video tidak terbaca oleh WebCodecs AudioBufferSink.
 */
async function decodeAudioSliceFallback(fileOrBlob, startSec = 0, endSec = null) {
  if (!fileOrBlob || (fileOrBlob.size && fileOrBlob.size > MAX_WEBAUDIO_FALLBACK_BYTES)) {
    return null;
  }
  const AudioCtx = getAudioContextClass();
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  try {
    const ab = await fileOrBlob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(ab.slice(0));
    const sr = decoded.sampleRate || 48000;
    const actualEnd = endSec != null ? Math.min(decoded.duration, endSec) : decoded.duration;
    const safeStart = Math.max(0, Math.min(actualEnd, startSec));
    const span = Math.max(0.1, actualEnd - safeStart);

    const s0 = Math.max(0, Math.floor(safeStart * sr));
    const s1 = Math.min(decoded.length, Math.ceil(actualEnd * sr));
    const frameLen = Math.max(1, s1 - s0 || Math.ceil(span * sr));
    const chCount = Math.min(2, Math.max(1, decoded.numberOfChannels || 1));

    const sliced = new AudioBuffer({
      length: frameLen,
      numberOfChannels: chCount,
      sampleRate: sr
    });

    for (let ch = 0; ch < chCount; ch++) {
      const src = decoded.getChannelData(Math.min(ch, decoded.numberOfChannels - 1));
      const dst = sliced.getChannelData(ch);
      if (s1 > s0) {
        dst.set(src.subarray(s0, s0 + Math.min(frameLen, s1 - s0)), 0);
      }
    }
    return sliced;
  } catch {
    return null;
  } finally {
    ctx.close().catch(() => {});
  }
}

function measureBufferPeak(audioBuffer) {
  if (!audioBuffer) return 0;
  let peak = 0;
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    // Sampling cepat setiap 4 sampel bila buffer panjang
    const step = data.length > 240000 ? 4 : 1;
    for (let i = 0; i < data.length; i += step) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

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
 * tanpa mendekode satupun frame gambar video, lengkap dengan cadangan Web Audio bila diperlukan.
 */
export async function extractMonoAudio(
  fileOrBlob,
  { startSec = 0, endSec = null, targetSampleRate = 16000, onProgress = null } = {}
) {
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
    let writeCursor = 0;
    let peak = 0;

    if (audioTrack) {
      try {
        const sink = new AudioBufferSink(audioTrack);
        for await (const wrapped of sink.buffers(startSec, actualEnd)) {
          const buf = wrapped.buffer;
          const srcRate = buf.sampleRate;
          const channels = buf.numberOfChannels;
          const ch0 = buf.getChannelData(0);
          const ch1 = channels > 1 ? buf.getChannelData(1) : null;

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
              const clamped = Math.max(-1, Math.min(1, sample));
              const abs = Math.abs(clamped);
              if (abs > peak) peak = abs;
              monoOut[writeCursor++] = clamped;
            }
          }

          if (onProgress) {
            const pct = Math.min(99, Math.round(((wrapped.timestamp - startSec) / span) * 100));
            onProgress(Math.max(0, pct));
          }
        }
      } catch {
        // Lanjut ke fallback Web Audio di bawah bila codec khusus tidak didukung AudioBufferSink
      }
    }

    if (writeCursor === 0 || peak < 1e-5) {
      const fb = await decodeAudioSliceFallback(fileOrBlob, startSec, actualEnd);
      if (fb) {
        const srcRate = fb.sampleRate;
        const ch0 = fb.getChannelData(0);
        const ch1 = fb.numberOfChannels > 1 ? fb.getChannelData(1) : null;
        const ratio = srcRate / targetSampleRate;
        const outLen = Math.min(totalSamples, Math.floor((fb.length * targetSampleRate) / srcRate));
        writeCursor = 0;
        for (let i = 0; i < outLen; i++) {
          const idx = Math.min(fb.length - 1, Math.floor(i * ratio));
          const s = ch1 ? (ch0[idx] + ch1[idx]) * 0.5 : ch0[idx];
          monoOut[writeCursor++] = Math.max(-1, Math.min(1, s));
        }
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
 * Pemindai gelombang vokal hemat memori untuk video panjang (60–120+ menit di laptop RAM 8 GB).
 * Membaca jalur suara per jendela 3 menit (180 detik) dari disk via BlobSource tanpa menyalin seluruh PCM ke RAM,
 * lalu langsung memadatkannya menjadi kurva energi vokal 50ms (< 300 KB total untuk video 1,5 jam!).
 */
export async function scanLongVideoAudioFeatures(
  fileOrBlob,
  { maxDurationSec = null, windowSec = 180, hopMs = 50, onProgress = null } = {}
) {
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
    const scanDur =
      maxDurationSec != null ? Math.min(totalDuration, maxDurationSec) : totalDuration;
    const frameSec = hopMs / 1000;
    const totalFrames = Math.max(1, Math.ceil(scanDur / frameSec));
    const rmsFrames = new Float32Array(totalFrames);
    const peakFrames = new Float32Array(totalFrames);

    if (!audioTrack || scanDur <= 0) {
      if (onProgress) onProgress(100);
      return { rmsFrames, peakFrames, frameSec, duration: scanDur };
    }

    const sink = new AudioBufferSink(audioTrack);
    const numWindows = Math.max(1, Math.ceil(scanDur / windowSec));

    for (let w = 0; w < numWindows; w++) {
      const wStart = w * windowSec;
      const wEnd = Math.min(scanDur, (w + 1) * windowSec);

      for await (const wrapped of sink.buffers(wStart, wEnd)) {
        const buf = wrapped.buffer;
        const sr = buf.sampleRate || 48000;
        const ch0 = buf.getChannelData(0);
        const ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
        const chunkStartSec = wrapped.timestamp;
        const samplesPerHop = Math.max(1, Math.round(sr * frameSec));
        const localHops = Math.ceil(buf.length / samplesPerHop);

        // Filter diferensial ringan untuk menonjolkan frekuensi vokal & tawa dibanding dengung rendah
        let prevX = 0;
        let hpY = 0;
        const alpha = 0.94;

        for (let h = 0; h < localHops; h++) {
          const globalFrameIdx = Math.floor((chunkStartSec + h * frameSec) / frameSec);
          if (globalFrameIdx < 0 || globalFrameIdx >= totalFrames) continue;

          const s0 = h * samplesPerHop;
          const s1 = Math.min(buf.length, s0 + samplesPerHop);
          if (s1 <= s0) continue;

          let sumSq = 0;
          let maxAbs = 0;
          const step = sr >= 32000 ? 2 : 1;
          let count = 0;

          for (let i = s0; i < s1; i += step) {
            const raw = ch1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
            hpY = alpha * (hpY + raw - prevX);
            prevX = raw;
            const a = Math.abs(hpY);
            sumSq += hpY * hpY;
            if (a > maxAbs) maxAbs = a;
            count++;
          }

          if (count > 0) {
            rmsFrames[globalFrameIdx] = Math.sqrt(sumSq / count);
            peakFrames[globalFrameIdx] = maxAbs;
          }
        }
      }

      if (onProgress) {
        onProgress(Math.min(99, Math.round(((w + 1) / numWindows) * 100)));
      }
      // Beri napas event loop 0ms setiap 3 menit audio agar UI tidak pernah beku
      await new Promise((r) => setTimeout(r, 0));
    }

    if (onProgress) onProgress(100);
    return { rmsFrames, peakFrames, frameSec, duration: scanDur };
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
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
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
 * Mengambil potongan AudioBuffer 48 kHz Stereo jernih presisi untuk rentang klip [startSec, endSec]:
 * - Cadangan Web Audio API otomatis bila codec tidak terbaca WebCodecs
 * - Menyeimbangkan rekaman mic sebelah (mono kiri/kanan) menjadi stereo penuh
 * - Penjernih Vokal Podcast opsional (High-pass 85 Hz + Presence 3.1 kHz + Compressor + Auto-Gain)
 * - Pengatur volume (0% – 200%) dengan pembatas lembut anti-pecah (soft limiter) + fade 15ms
 */
export async function extractClipAudioBuffer(
  fileOrBlob,
  startSec,
  endSec,
  { voiceBoost = true, volumeGain = 1.0, monoToStereo = true } = {}
) {
  const clipDuration = Math.max(0.2, endSec - startSec);
  const targetRate = 48000;
  const targetFrames = Math.max(1, Math.ceil(clipDuration * targetRate));

  const input = new Input({
    source: new BlobSource(fileOrBlob),
    formats: ALL_FORMATS
  });

  let rawBuffer = null;

  try {
    const audioTrack = await input.getPrimaryAudioTrack();
    if (audioTrack) {
      try {
        const sink = new AudioBufferSink(audioTrack);
        let sampleRate = targetRate;
        let numChannels = 2;

        for await (const wrapped of sink.buffers(startSec, endSec)) {
          const buf = wrapped.buffer;
          if (!rawBuffer) {
            sampleRate = buf.sampleRate || targetRate;
            numChannels = Math.min(2, Math.max(1, buf.numberOfChannels || 1));
            rawBuffer = new AudioBuffer({
              length: Math.max(1, Math.ceil(clipDuration * sampleRate)),
              numberOfChannels: numChannels,
              sampleRate
            });
          }

          const relStartSec = wrapped.timestamp - startSec;
          const srcOffset = relStartSec < 0 ? Math.round(-relStartSec * sampleRate) : 0;
          const dstOffset = relStartSec > 0 ? Math.round(relStartSec * sampleRate) : 0;
          const copyCount = Math.min(buf.length - srcOffset, rawBuffer.length - dstOffset);

          if (copyCount > 0 && srcOffset < buf.length && dstOffset < rawBuffer.length) {
            for (let ch = 0; ch < numChannels; ch++) {
              const srcCh = buf.getChannelData(Math.min(ch, buf.numberOfChannels - 1));
              const dstCh = rawBuffer.getChannelData(ch);
              dstCh.set(srcCh.subarray(srcOffset, srcOffset + copyCount), dstOffset);
            }
          }
        }
      } catch {
        rawBuffer = null;
      }
    }
  } finally {
    input.dispose();
  }

  // Jika hasil kosong atau senyap karena codec unik, gunakan dekoder bawaan Web Audio
  if (!rawBuffer || measureBufferPeak(rawBuffer) < 1e-5) {
    const fallbackBuf = await decodeAudioSliceFallback(fileOrBlob, startSec, endSec);
    if (fallbackBuf && measureBufferPeak(fallbackBuf) >= 1e-5) {
      rawBuffer = fallbackBuf;
    }
  }

  if (!rawBuffer || volumeGain <= 0.001) {
    return new AudioBuffer({
      length: targetFrames,
      numberOfChannels: 2,
      sampleRate: targetRate
    });
  }

  // Deteksi mic podcast sebelah (misal terhubung di Input 1 Kiri saja sedangkan Kanan mati)
  if (monoToStereo && rawBuffer.numberOfChannels === 2) {
    const ch0 = rawBuffer.getChannelData(0);
    const ch1 = rawBuffer.getChannelData(1);
    let p0 = 0;
    let p1 = 0;
    const step = ch0.length > 120000 ? 4 : 1;
    for (let i = 0; i < ch0.length; i += step) {
      const a0 = Math.abs(ch0[i]);
      const a1 = Math.abs(ch1[i]);
      if (a0 > p0) p0 = a0;
      if (a1 > p1) p1 = a1;
    }
    if (p0 > 0.01 && p1 < p0 * 0.08) {
      ch1.set(ch0);
    } else if (p1 > 0.01 && p0 < p1 * 0.08) {
      ch0.set(ch1);
    }
  }

  // Resample bersih ke 48.000 Hz 2-channel Stereo + Rantai Penjernih Suara Podcast
  let processed = null;
  try {
    const offline = new OfflineAudioContext(2, targetFrames, targetRate);
    const srcNode = offline.createBufferSource();
    srcNode.buffer = rawBuffer;

    if (voiceBoost) {
      const highpass = offline.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 85;
      highpass.Q.value = 0.707;

      const presence = offline.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3100;
      presence.Q.value = 1.05;
      presence.gain.value = 2.8;

      const compressor = offline.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 3.2;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.18;

      srcNode.connect(highpass);
      highpass.connect(presence);
      presence.connect(compressor);
      compressor.connect(offline.destination);
    } else {
      srcNode.connect(offline.destination);
    }

    srcNode.start(0);
    processed = await offline.startRendering();
  } catch {
    // Cadangan manual bila OfflineAudioContext tidak tersedia
    processed = new AudioBuffer({
      length: targetFrames,
      numberOfChannels: 2,
      sampleRate: targetRate
    });
    const ratio = rawBuffer.sampleRate / targetRate;
    const c0 = rawBuffer.getChannelData(0);
    const c1 = rawBuffer.numberOfChannels > 1 ? rawBuffer.getChannelData(1) : c0;
    const out0 = processed.getChannelData(0);
    const out1 = processed.getChannelData(1);
    for (let i = 0; i < targetFrames; i++) {
      const idx = Math.min(rawBuffer.length - 1, Math.floor(i * ratio));
      out0[i] = c0[idx];
      out1[i] = c1[idx];
    }
  }

  // Normalisasi pintar untuk rekaman yang terlalu pelan + pengali volume pilihan pengguna
  const currentPeak = measureBufferPeak(processed);
  let autoNormGain = 1.0;
  if (voiceBoost && currentPeak > 0.006 && currentPeak < 0.75) {
    autoNormGain = Math.min(2.8, 0.84 / currentPeak);
  }
  const finalGain = autoNormGain * Math.max(0, Number(volumeGain) || 1);

  const fadeSamples = Math.min(Math.floor(processed.length / 4), Math.floor(targetRate * 0.015));
  for (let ch = 0; ch < processed.numberOfChannels; ch++) {
    const data = processed.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      let v = data[i] * finalGain;
      // Pembatas halus agar suara tidak pecah saat volume dinaikkan > 100%
      if (v > 0.9 || v < -0.9) {
        v = Math.tanh(v);
      }
      data[i] = v;
    }
    for (let i = 0; i < fadeSamples; i++) {
      const ramp = i / fadeSamples;
      data[i] *= ramp;
      data[data.length - 1 - i] *= ramp;
    }
  }

  return processed;
}

function alignSampleSentenceWords(sentence, startSec, endSec, monoChannel, sampleRate) {
  const tokens = String(sentence || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return [];

  const weights = tokens.map((tok) => {
    const cleanLen = Math.max(2, tok.replace(/[^a-zA-Z0-9]/g, '').length);
    const comma = /[,;:]$/.test(tok) ? 2.4 : 0;
    const period = /[.!?]$/.test(tok) ? 3.2 : 0;
    return cleanLen + comma + period;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const span = Math.max(0.4, endSec - startSec);

  let cursor = startSec;
  const words = [];
  for (let i = 0; i < tokens.length; i++) {
    const share = (weights[i] / totalWeight) * span;
    const pauseAfter = /[,;:.!?]$/.test(tokens[i]);
    const dur = pauseAfter ? Math.max(0.14, share * 0.82) : Math.max(0.12, share * 0.96);
    const ws = Number(cursor.toFixed(3));
    const we = Number(Math.min(endSec, cursor + dur).toFixed(3));
    words.push({
      word: tokens[i],
      start: ws,
      end: Math.max(ws + 0.08, we)
    });
    cursor += share;
  }

  // Geser tipis ke puncak energi vokal terdekat
  if (monoChannel && monoChannel.length > sampleRate) {
    const win = Math.max(1, Math.floor(sampleRate * 0.035));
    for (let i = 0; i < words.length; i++) {
      const center = Math.floor(words[i].start * sampleRate);
      let bestE = 0;
      let bestDelta = 0;
      for (let d = -win * 2; d <= win * 2; d += Math.max(1, Math.floor(win / 2))) {
        const s0 = Math.max(0, center + d);
        const s1 = Math.min(monoChannel.length, s0 + win);
        if (s1 <= s0) continue;
        let sum = 0;
        for (let k = s0; k < s1; k += 2) sum += Math.abs(monoChannel[k]);
        const avg = sum / ((s1 - s0) / 2);
        if (avg > bestE * 1.15) {
          bestE = avg;
          bestDelta = d / sampleRate;
        }
      }
      if (Math.abs(bestDelta) <= 0.07) {
        const minAllowed = i > 0 ? words[i - 1].end : startSec;
        const dur = words[i].end - words[i].start;
        const ns = Math.max(minAllowed, words[i].start + bestDelta);
        words[i].start = Number(ns.toFixed(3));
        words[i].end = Number(Math.min(endSec, ns + dur).toFixed(3));
      }
    }
  }

  return words;
}

async function buildRealPodcastSampleAudio(durationSec, sampleRate) {
  const totalSamples = durationSec * sampleRate;
  const offline = new OfflineAudioContext(2, totalSamples, sampleRate);

  const [hostAb, guestAb] = await Promise.all([
    fetch('./data/sample-host.mp3').then((r) => {
      if (!r.ok) throw new Error('Aset suara host tidak ditemukan');
      return r.arrayBuffer();
    }),
    fetch('./data/sample-guest.mp3').then((r) => {
      if (!r.ok) throw new Error('Aset suara narasumber tidak ditemukan');
      return r.arrayBuffer();
    })
  ]);

  const [hostDecoded, guestDecoded] = await Promise.all([
    offline.decodeAudioData(hostAb.slice(0)),
    offline.decodeAudioData(guestAb.slice(0))
  ]);

  const hostStart = 0.25;
  const hostRate = 1.02;
  const hostDur = hostDecoded.duration / hostRate;
  const hostEnd = Number((hostStart + hostDur).toFixed(2));

  const guestStart = Math.max(10.35, Number((hostEnd + 0.32).toFixed(2)));
  const guestRate = 1.03;
  const guestDur = guestDecoded.duration / guestRate;
  const guestEnd = Number(Math.min(durationSec - 0.15, guestStart + guestDur).toFixed(2));

  // Rantai mic Host (karakter radio hangat + fokus sedikit kiri-tengah)
  const hostSrc = offline.createBufferSource();
  hostSrc.buffer = hostDecoded;
  hostSrc.playbackRate.value = hostRate;

  const hostWarmth = offline.createBiquadFilter();
  hostWarmth.type = 'lowshelf';
  hostWarmth.frequency.value = 195;
  hostWarmth.gain.value = 3.2;

  const hostPresence = offline.createBiquadFilter();
  hostPresence.type = 'peaking';
  hostPresence.frequency.value = 2850;
  hostPresence.gain.value = 2.0;

  const hostGain = offline.createGain();
  hostGain.gain.value = 0.95;

  hostSrc.connect(hostWarmth);
  hostWarmth.connect(hostPresence);
  hostPresence.connect(hostGain);
  hostGain.connect(offline.destination);
  hostSrc.start(hostStart);

  // Rantai mic Narasumber (karakter jernih artikulatif)
  const guestSrc = offline.createBufferSource();
  guestSrc.buffer = guestDecoded;
  guestSrc.playbackRate.value = guestRate;

  const guestHp = offline.createBiquadFilter();
  guestHp.type = 'highpass';
  guestHp.frequency.value = 115;

  const guestBright = offline.createBiquadFilter();
  guestBright.type = 'peaking';
  guestBright.frequency.value = 3350;
  guestBright.gain.value = 3.0;

  const guestGain = offline.createGain();
  guestGain.gain.value = 0.95;

  guestSrc.connect(guestHp);
  guestHp.connect(guestBright);
  guestBright.connect(guestGain);
  guestGain.connect(offline.destination);
  guestSrc.start(guestStart);

  const rendered = await offline.startRendering();

  // Normalisasi ringan ke -1.5 dBFS supaya lantang dan jernih di speaker laptop/HP
  const peak = measureBufferPeak(rendered);
  if (peak > 0.01) {
    const norm = Math.min(2.2, 0.85 / peak);
    for (let ch = 0; ch < rendered.numberOfChannels; ch++) {
      const d = rendered.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        d[i] = Math.max(-0.96, Math.min(0.96, d[i] * norm));
      }
    }
  }

  return {
    audioBuf: rendered,
    hostStart,
    hostEnd,
    guestStart,
    guestEnd,
    switchSec: Number(((hostEnd + guestStart) * 0.5).toFixed(2))
  };
}

/**
 * Membuat file video contoh podcast 16:9 (.mp4 asli, 20 detik, 2 pembicara Bahasa Indonesia asli
 * bergantian kiri & kanan) langsung di browser agar pembeli langsung mendengar kualitas suara jernih.
 */
export async function createSamplePodcastMp4(onProgress = null) {
  const W = 1280;
  const H = 720;
  const FPS = 30;
  const DURATION = 20;
  const totalFrames = DURATION * FPS;
  const sr = 48000;

  const hostSentence =
    'Banyak kreator gagal bukan karena idenya jelek, tapi tiga detik pertama pembukaannya terlalu bertele-tele jadi penonton langsung lewat.';
  const guestSentence =
    'Betul banget, makanya kalimat pertama wajib langsung menyentuh masalah utama supaya penonton bertahan sampai akhir video.';

  let audioBuf;
  let hostStart = 0.25;
  let hostEnd = 10.1;
  let guestStart = 10.45;
  let guestEnd = 19.5;
  let switchSec = 10.3;

  try {
    const built = await buildRealPodcastSampleAudio(DURATION, sr);
    audioBuf = built.audioBuf;
    hostStart = built.hostStart;
    hostEnd = built.hostEnd;
    guestStart = built.guestStart;
    guestEnd = built.guestEnd;
    switchSec = built.switchSec;
  } catch {
    // Cadangan darurat hanya jika file mp3 gagal dimuat secara offline
    audioBuf = new AudioBuffer({
      length: DURATION * sr,
      numberOfChannels: 2,
      sampleRate: sr
    });
  }

  // Hitung amplitudo vokal per frame 30 FPS agar gerak bibir pembicara sinkron dengan suku kata asli
  const monoRef = audioBuf.getChannelData(0);
  const samplesPerFrame = Math.floor(sr / FPS);
  const frameEnergy = new Float32Array(totalFrames);
  for (let f = 0; f < totalFrames; f++) {
    const s0 = f * samplesPerFrame;
    const s1 = Math.min(monoRef.length, s0 + samplesPerFrame);
    let sumSq = 0;
    for (let i = s0; i < s1; i += 2) {
      sumSq += monoRef[i] * monoRef[i];
    }
    const rms = Math.sqrt(sumSq / Math.max(1, (s1 - s0) / 2));
    frameEnergy[f] = Math.min(1, rms * 4.2);
  }

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
  await audioSource.add(audioBuf);

  for (let f = 0; f < totalFrames; f++) {
    const t = f / FPS;
    const activeLeft = t < switchSec;
    const energy = frameEnergy[f];

    // Latar studio podcast modern hangat
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E293B');
    grad.addColorStop(1, '#090D16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Sorot lampu studio mengikuti pembicara aktif
    ctx.fillStyle = activeLeft ? 'rgba(190, 255, 80, 0.14)' : 'rgba(245, 158, 11, 0.16)';
    ctx.beginPath();
    ctx.arc(activeLeft ? W * 0.28 : W * 0.72, H * 0.36, 235, 0, Math.PI * 2);
    ctx.fill();

    const drawSpeaker = (cx, cy, isSpeaking, label, shirtColor) => {
      const liveEnergy = isSpeaking ? energy : 0;
      const bob = isSpeaking ? liveEnergy * 4.5 * Math.sin(t * 9) : 0;

      // Bahu / badan
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 165 + bob * 0.4, 115, 95, 0, Math.PI, 0, false);
      ctx.fill();

      // Kepala (rona kulit hangat agar terdeteksi otomatis oleh pelacak wajah tengah)
      ctx.fillStyle = isSpeaking ? '#F1C29B' : '#B98E6B';
      ctx.beginPath();
      ctx.ellipse(cx, cy + bob, 64, 76, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rambut
      ctx.fillStyle = '#1E1B18';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 42 + bob, 66, 36, 0, Math.PI, 0, false);
      ctx.fill();

      // Mata
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 8 + bob, 6, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 8 + bob, 6, 0, Math.PI * 2);
      ctx.fill();

      // Gerak bibir mengikuti gelombang suara nyata Bahasa Indonesia
      const mouthOpen = isSpeaking ? 3 + liveEnergy * 16 : 2.5;
      ctx.fillStyle = '#7F1D1D';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28 + bob, 15 + liveEnergy * 4, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mikrofon kondensor podcast
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 10, cy + 88, 20, 62);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(cx, cy + 82, 18, 0, Math.PI * 2);
      ctx.fill();

      // Indikator cincin suara aktif di mikrofon
      if (isSpeaking && liveEnergy > 0.08) {
        ctx.strokeStyle = '#BEFF50';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy + 82, 22 + liveEnergy * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label nama pembicara
      ctx.fillStyle = isSpeaking ? '#BEFF50' : '#94A3B8';
      ctx.font = '600 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, H - 38);
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

  // Ekstrak sampel 16 kHz dari kanal vokal nyata agar setiap kata terkunci presisi ke pulau bicara asli!
  const downRatio = sr / 16000;
  const mono16kLen = Math.floor(monoRef.length / downRatio);
  const mono16k = new Float32Array(mono16kLen);
  for (let i = 0; i < mono16kLen; i++) {
    mono16k[i] = monoRef[Math.min(monoRef.length - 1, Math.floor(i * downRatio))];
  }

  const hostSlice16k = mono16k.subarray(
    Math.max(0, Math.floor(hostStart * 16000)),
    Math.min(mono16k.length, Math.ceil(hostEnd * 16000))
  );
  const guestSlice16k = mono16k.subarray(
    Math.max(0, Math.floor(guestStart * 16000)),
    Math.min(mono16k.length, Math.ceil(guestEnd * 16000))
  );

  const hostWords = alignTextToVocalWaveform(hostSentence, hostStart, hostEnd, hostSlice16k, 16000);
  const guestWords = alignTextToVocalWaveform(guestSentence, guestStart, guestEnd, guestSlice16k, 16000);
  const allWords = [...hostWords, ...guestWords];
  const fullTranscript = `${hostSentence} ${guestSentence}`;

  const sampleMoments = [
    {
      id: 'momen-1',
      title: 'Kesalahan 3 Detik Pertama Saat Bikin Konten',
      score: 89,
      reason: 'Lonjakan vokal +36% + angka konkret pembuka ("tiga detik pertama") + akhir jeda napas bersih.',
      startSec: 0.1,
      endSec: Number(Math.min(DURATION, guestEnd + 0.25).toFixed(1)),
      transcript: fullTranscript,
      words: allWords
    },
    {
      id: 'momen-2',
      title: 'Kenapa Penonton Langsung Lewat di Awal Video',
      score: 82,
      reason: 'Pernyataan kontras di pembukaan Host + dinamika vokal tegas + potong tepat sebelum ganti pembicara.',
      startSec: 0.1,
      endSec: Number((hostEnd + 0.18).toFixed(1)),
      transcript: hostSentence,
      words: hostWords
    },
    {
      id: 'momen-3',
      title: 'Rumus Kalimat Pertama Agar Penonton Bertahan',
      score: 75,
      reason: 'Respons persetujuan cepat Narasumber + kalimat kesimpulan utuh tanpa terpotong di tengah kata.',
      startSec: Number(Math.max(0, guestStart - 0.12).toFixed(1)),
      endSec: Number(Math.min(DURATION, guestEnd + 0.25).toFixed(1)),
      transcript: guestSentence,
      words: guestWords
    }
  ];

  return {
    file: sampleFile,
    moments: sampleMoments,
    scoringMeta: {
      hasHeatmap: false,
      weightNotice:
        'Grafik Most-Replayed tidak tersedia pada rekaman lokal — bobot skor dialihkan ke Lonjakan Vokal (40%), Kekuatan Kalimat Pembuka (35%), dan Jeda Napas Kalimat Utuh (25%).'
    }
  };
}

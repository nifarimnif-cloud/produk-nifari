/**
 * Klip Auto — Mesin Transkrip Vokal Akurat (Whisper-Small Lokal Indlish), Penyelaras Suku Kata,
 * & Penilai Momen Jujur 4 Sinyal (Grafik Most-Replayed + Lonjakan Suara + Pembuka Kuat + Jeda Napas)
 */

import { encodeMonoWavBlob, extractMonoAudio, scanLongVideoAudioFeatures } from './audio-processor.js';
import {
  alignTextToVocalWaveform,
  analyzeVocalEnvelope,
  refineWhisperWordsWithVocal,
  snapClipBoundsToBreathPause
} from './vocal-aligner.js';

let whisperPipelinePromise = null;
let activeWhisperDevice = 'wasm';
const whisperProgressListeners = new Set();

export const WHISPER_MODEL_ID = 'Xenova/whisper-small';

/**
 * Mengubah teks menjadi urutan kata ber-timestamp yang terkunci langsung ke pulau-pulau energi vokal.
 */
export function buildWordsFromTextAndWindow(text, startSec, endSec, monoSamples = null, sampleRate = 16000) {
  return alignTextToVocalWaveform(text, startSec, endSec, monoSamples, sampleRate);
}

/**
 * Mode Opsional BYOK: Analisis via Gemini API Key milik pembeli (bila sengaja diisi pembeli).
 */
export async function analyzePodcastWithGemini({
  file,
  apiKey,
  totalDurationSec,
  onStatus = null
}) {
  const cleanKey = String(apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Masukkan Gemini API Key terlebih dahulu atau gunakan mode Transkrip Lokal Tanpa API Key.');
  }

  if (onStatus) onStatus('Mengekstrak jalur suara ringan 8 kHz...', 12);
  const { samples, sampleRate } = await extractMonoAudio(file, {
    startSec: 0,
    endSec: Math.min(totalDurationSec, 3600),
    targetSampleRate: 8000,
    onProgress: (p) => {
      if (onStatus) onStatus(`Mengekstrak jalur suara ringan (${p}%)...`, 12 + Math.round(p * 0.22));
    }
  });

  if (onStatus) onStatus('Mengemas audio ringkas untuk dianalisis...', 38);
  const wavBlob = encodeMonoWavBlob(samples, sampleRate);

  const startUploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(wavBlob.size),
        'X-Goog-Upload-Header-Content-Type': 'audio/wav',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file: { display_name: 'klip-auto-audio.wav' } })
    }
  );

  if (!startUploadRes.ok) {
    const errTxt = await startUploadRes.text().catch(() => '');
    throw new Error(`Gagal menghubungkan Gemini API Key (${startUploadRes.status}). ${errTxt.slice(0, 100)}`);
  }

  const uploadUrl = startUploadRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    throw new Error('Tidak mendapatkan URL unggah dari Gemini File API.');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(wavBlob.size),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: wavBlob
  });

  if (!uploadRes.ok) {
    throw new Error(`Gagal mengirim data suara ke Gemini (${uploadRes.status}).`);
  }

  const uploadedInfo = await uploadRes.json();
  const fileUri = uploadedInfo?.file?.uri;
  const fileName = uploadedInfo?.file?.name;

  try {
    if (onStatus) onStatus('Menyaring 5–10 momen percakapan paling kuat...', 65);
    const targetCount = totalDurationSec >= 300 ? '6 sampai 10' : '3 sampai 6';
    const prompt = `Kamu adalah produser klip pendek (Reels/TikTok/Shorts) berbahasa Indonesia (termasuk istilah Inggris yang sering dipakai di percakapan).
Durasi total rekaman adalah ${Math.round(totalDurationSec)} detik.
Pilih ${targetCount} momen paling menarik berdurasi 20–55 detik yang kalimat awalnya kuat dan berhenti tepat di akhir kalimat utuh.
Berikan skor yang jujur & bervariasi (antara 65 sampai 95, jangan seragam) beserta alasan spesifik.
Kembalikan HANYA JSON murni:
{
  "moments": [
    {
      "title": "Judul Pembuka Maks 7 Kata",
      "score": 88,
      "reason": "Alasan spesifik kenapa momen ini kuat",
      "startSec": 12.4,
      "endSec": 46.8,
      "transcript": "Transkrip kata demi kata yang akurat sesuai ucapan pembicara"
    }
  ]
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let parsed = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      const genRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ file_data: { mime_type: 'audio/wav', file_uri: fileUri } }, { text: prompt }] }],
            generationConfig: { temperature: 0.25, responseMimeType: 'application/json' }
          })
        }
      );

      if (!genRes.ok) {
        lastError = `Status ${genRes.status} pada ${modelName}`;
        continue;
      }

      const genData = await genRes.json();
      const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.moments) && parsed.moments.length > 0) break;
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!parsed || !Array.isArray(parsed.moments) || parsed.moments.length === 0) {
      throw new Error(`Respons belum menghasilkan daftar momen valid (${lastError || 'coba lagi'}).`);
    }

    if (onStatus) onStatus('Mengunci setiap kata ke gelombang vokal pembicara...', 90);

    const normalizedMoments = [];
    for (let idx = 0; idx < parsed.moments.length; idx++) {
      const m = parsed.moments[idx];
      const s = Math.max(0, Math.min(totalDurationSec - 1, Number(m.startSec) || 0));
      const e = Math.max(s + 1, Math.min(totalDurationSec, Number(m.endSec) || s + 30));

      // Ambil potongan 16 kHz presisi pada momen tersebut untuk mengunci suku kata ke vokal!
      const clipAudio16k = await extractMonoAudio(file, {
        startSec: s,
        endSec: e,
        targetSampleRate: 16000
      });

      const env = analyzeVocalEnvelope(clipAudio16k.samples, 16000, s);
      const snapped = snapClipBoundsToBreathPause(s, e, env, totalDurationSec);
      const alignedWords = alignTextToVocalWaveform(
        m.transcript || '',
        snapped.startSec,
        snapped.endSec,
        clipAudio16k.samples,
        16000
      );

      normalizedMoments.push({
        id: `momen-byok-${idx + 1}`,
        title: String(m.title || `Sorotan Pembicara #${idx + 1}`).trim(),
        score: Math.max(60, Math.min(96, Math.round(Number(m.score) || 82 - idx * 3))),
        reason: String(m.reason || 'Kalimat pembuka kuat & berhenti di jeda napas bersih.').trim(),
        startSec: snapped.startSec,
        endSec: snapped.endSec,
        transcript: String(m.transcript || '').trim(),
        words: alignedWords
      });
    }

    if (onStatus) onStatus('Selesai memilih momen & menyelaraskan vokal!', 100);
    return normalizedMoments;
  } finally {
    if (fileName) {
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${encodeURIComponent(cleanKey)}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }
  }
}

/**
 * Memuat model lokal akurat Bahasa Indonesia + Inggris (Xenova/whisper-small, 244M parameter).
 * Otomatis memakai akselerasi GPU (WebGPU) jika tersedia di browser, atau pindah mulus ke CPU WASM (q8).
 */
export async function getWhisperPipeline(onProgress = null) {
  if (onProgress) whisperProgressListeners.add(onProgress);

  if (!whisperPipelinePromise) {
    const fileProgress = new Map();
    whisperPipelinePromise = (async () => {
      try {
        const transformers = await import(
          'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.min.js'
        );
        transformers.env.allowLocalModels = false;

        const notifyProgress = (info) => {
          if (!info) return;
          if (info.file && typeof info.progress === 'number') {
            fileProgress.set(info.file, info.progress);
            let sum = 0;
            for (const v of fileProgress.values()) sum += v;
            const avg = Math.round(sum / Math.max(1, fileProgress.size));
            for (const cb of whisperProgressListeners) {
              try {
                cb(avg);
              } catch {}
            }
          }
        };

        // Coba akselerasi GPU (WebGPU) terlebih dahulu bila tersedia, otomatis jatuh ke CPU (WASM q8) bila gagal!
        let hasWebGpu = false;
        if (typeof navigator !== 'undefined' && navigator.gpu) {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            hasWebGpu = Boolean(adapter);
          } catch {
            hasWebGpu = false;
          }
        }

        if (hasWebGpu) {
          try {
            const gpuPipe = await transformers.pipeline(
              'automatic-speech-recognition',
              WHISPER_MODEL_ID,
              {
                device: 'webgpu',
                dtype: {
                  encoder_model: 'fp32',
                  decoder_model_merged: 'q4'
                },
                progress_callback: notifyProgress
              }
            );
            activeWhisperDevice = 'webgpu';
            return gpuPipe;
          } catch {
            fileProgress.clear();
          }
        }

        const wasmPipe = await transformers.pipeline(
          'automatic-speech-recognition',
          WHISPER_MODEL_ID,
          {
            device: 'wasm',
            dtype: 'q8',
            progress_callback: notifyProgress
          }
        );
        activeWhisperDevice = 'wasm';
        return wasmPipe;
      } catch (err) {
        whisperPipelinePromise = null;
        throw err;
      }
    })();
  }

  try {
    return await whisperPipelinePromise;
  } finally {
    if (onProgress) whisperProgressListeners.delete(onProgress);
  }
}

export function getActiveWhisperDeviceMode() {
  return activeWhisperDevice;
}

/**
 * Penjernih jalur vokal 16 kHz untuk pengenalan ucapan:
 * - Memotong dengung bass/musik < 120 Hz & desis tinggi > 6800 Hz
 * - Meratakan suara pembicara pelan vs keras agar konsonan Bahasa Indonesia & istilah Inggris terbaca tajam
 */
export async function prepareCleanSpeech16k(rawSamples) {
  if (!rawSamples || rawSamples.length === 0) return new Float32Array(0);

  let working = null;
  const OfflineCtx =
    typeof OfflineAudioContext !== 'undefined'
      ? OfflineAudioContext
      : typeof webkitOfflineAudioContext !== 'undefined'
      ? webkitOfflineAudioContext
      : null;

  if (OfflineCtx && rawSamples.length >= 800) {
    try {
      const ctx = new OfflineCtx(1, rawSamples.length, 16000);
      const buf = ctx.createBuffer(1, rawSamples.length, 16000);
      buf.getChannelData(0).set(rawSamples);

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 120;
      hpf.Q.value = 0.707;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 2750;
      presence.Q.value = 1.0;
      presence.gain.value = 2.4;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.knee.value = 16;
      comp.ratio.value = 3.2;
      comp.attack.value = 0.004;
      comp.release.value = 0.12;

      src.connect(hpf);
      hpf.connect(presence);
      presence.connect(comp);
      comp.connect(ctx.destination);
      src.start(0);

      const rendered = await ctx.startRendering();
      working = new Float32Array(rendered.getChannelData(0));
    } catch {
      working = null;
    }
  }

  if (!working) {
    working = new Float32Array(rawSamples.length);
    let prevIn = 0;
    let prevOut = 0;
    const alpha = 0.955;
    for (let i = 0; i < rawSamples.length; i++) {
      const x = rawSamples[i];
      const y = alpha * (prevOut + x - prevIn);
      prevIn = x;
      prevOut = y;
      working[i] = y;
    }
  }

  let peak = 0;
  for (let i = 0; i < working.length; i++) {
    const a = Math.abs(working[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0.003) {
    const scale = 0.89 / peak;
    for (let i = 0; i < working.length; i++) {
      working[i] = Math.max(-1, Math.min(1, working[i] * scale));
    }
  }

  return working;
}

const HALLUCINATION_PATTERNS = [
  /^\[.*\]$/,
  /^\(.*\)$/,
  /^\*.*\*$/,
  /^musik$/i,
  /^music$/i,
  /^applause$/i,
  /^subtitle\s+oleh/i,
  /^subtitles\s+by/i,
  /^terima\s+kasih\s+telah\s+menonton/i,
  /^thank\s+you\s+for\s+watching/i
];

function isValidSpokenWord(token) {
  const clean = String(token || '').trim();
  if (!clean) return false;
  if (!/[\p{L}\p{N}]/u.test(clean)) return false;
  for (const pat of HALLUCINATION_PATTERNS) {
    if (pat.test(clean)) return false;
  }
  return true;
}

/**
 * Mengurai keluaran Whisper-Small menjadi kata-kata utuh lalu menguncinya langsung ke pulau vokal nyata!
 */
function parseWhisperOutputToWords(out, offsetSec, maxEndSec, cleanSamples) {
  const merged = [];

  if (out && Array.isArray(out.chunks) && out.chunks.length > 0) {
    for (const ch of out.chunks) {
      const rawText = String(ch.text || '');
      const trimmed = rawText.trim();
      if (!trimmed) continue;

      const spaceTokens = trimmed.split(/\s+/).filter(Boolean);
      const rawT0 = Number(ch.timestamp?.[0] ?? 0);
      const rawT1 = Number(
        ch.timestamp?.[1] ?? Math.min(maxEndSec - offsetSec, rawT0 + Math.max(0.32, spaceTokens.length * 0.28))
      );
      const segStart = Math.max(offsetSec, Math.min(maxEndSec - 0.08, offsetSec + Math.max(0, rawT0)));
      const segEnd = Math.max(segStart + 0.1, Math.min(maxEndSec, offsetSec + Math.max(rawT0 + 0.12, rawT1)));

      if (spaceTokens.length > 1) {
        const sIdx = Math.max(0, Math.floor((segStart - offsetSec) * 16000));
        const eIdx = Math.min(cleanSamples.length, Math.ceil((segEnd - offsetSec) * 16000));
        const subMono = eIdx > sIdx ? cleanSamples.subarray(sIdx, eIdx) : null;
        const expanded = alignTextToVocalWaveform(trimmed, segStart, segEnd, subMono, 16000).filter((w) =>
          isValidSpokenWord(w.word)
        );
        merged.push(...expanded);
        continue;
      }

      const isContinuation = !/^\s/.test(rawText) && merged.length > 0 && !/^[.,!?;:]/.test(trimmed);
      if (isContinuation) {
        merged[merged.length - 1].word += trimmed;
        merged[merged.length - 1].end = Number(Math.max(merged[merged.length - 1].end, segEnd).toFixed(3));
      } else {
        const prevEnd = merged.length > 0 ? merged[merged.length - 1].end : offsetSec;
        const monotonicStart = Math.max(segStart, Math.min(segEnd - 0.06, prevEnd));
        merged.push({
          word: trimmed,
          start: Number(Math.max(offsetSec, monotonicStart).toFixed(3)),
          end: Number(Math.max(monotonicStart + 0.08, segEnd).toFixed(3))
        });
      }
    }
  }

  const valid = merged.filter((w) => isValidSpokenWord(w.word));
  if (valid.length > 0) {
    return refineWhisperWordsWithVocal(valid, cleanSamples, 16000, offsetSec, maxEndSec);
  }

  if (out && typeof out.text === 'string' && out.text.trim()) {
    return alignTextToVocalWaveform(out.text.trim(), offsetSec, maxEndSec, cleanSamples, 16000).filter((w) =>
      isValidSpokenWord(w.word)
    );
  }

  return [];
}

/**
 * Transkrip potongan audio bersih ke kata ber-timestamp akurat memakai Whisper-Small
 * (mendukung obrolan campur Bahasa Indonesia + istilah Bahasa Inggris).
 */
export async function transcribeCleanAudioToWords(transcriber, rawSamples, offsetSec, maxEndSec) {
  const cleanSamples = await prepareCleanSpeech16k(rawSamples);
  if (cleanSamples.length < 1600) return [];

  let peak = 0;
  for (let i = 0; i < cleanSamples.length; i += 4) {
    const a = Math.abs(cleanSamples[i]);
    if (a > peak) peak = a;
  }
  if (peak < 0.014) return [];

  // Gunakan pulau vokal untuk memotong hening awal/akhir panjang sebelum dikirim ke Whisper
  // agar cross-attention timestamp tidak meleset akibat keheningan pembuka!
  const env = analyzeVocalEnvelope(cleanSamples, 16000, offsetSec);
  if (env.islands.length === 0) return [];

  const speechPadStartSec = Math.max(offsetSec, env.islands[0].startSec - 0.18);
  const speechPadEndSec = Math.min(maxEndSec, env.islands[env.islands.length - 1].endSec + 0.22);
  const trimStartIdx = Math.max(0, Math.floor((speechPadStartSec - offsetSec) * 16000));
  const trimEndIdx = Math.min(cleanSamples.length, Math.ceil((speechPadEndSec - offsetSec) * 16000));
  const trimmedSpeech =
    trimEndIdx - trimStartIdx >= 1600 ? cleanSamples.subarray(trimStartIdx, trimEndIdx) : cleanSamples;
  const trimmedOffsetSec = trimEndIdx - trimStartIdx >= 1600 ? speechPadStartSec : offsetSec;

  try {
    const outWord = await transcriber(trimmedSpeech, {
      language: 'indonesian',
      task: 'transcribe',
      return_timestamps: 'word',
      chunk_length_s: 20,
      stride_length_s: 3
    });
    const words = parseWhisperOutputToWords(outWord, trimmedOffsetSec, speechPadEndSec, trimmedSpeech);
    if (words.length > 0) return words;
  } catch {
    // Lanjut ke mode segmen + forced vocal alignment bila browser membatasi cross-attention
  }

  const outSeg = await transcriber(trimmedSpeech, {
    language: 'indonesian',
    task: 'transcribe',
    return_timestamps: true,
    chunk_length_s: 20,
    stride_length_s: 3
  });
  return parseWhisperOutputToWords(outSeg, trimmedOffsetSec, speechPadEndSec, trimmedSpeech);
}

/* ============================================================================
 * PENILAI MOMEN JUJUR 4 SINYAL ASLI (SESUAI GUIDE-KLIP-AUTO.md BAGIAN 3C)
 * 1. Grafik Most-Replayed YouTube (`heatmap`), bila tersedia
 * 2. Lonjakan suara / dinamika vokal (`audioFeatures`)
 * 3. Kekuatan kalimat pembuka (kalimat tanya, angka konkret, pemicu penasaran)
 * 4. Akhir kalimat & jeda napas (agar klip tidak terpotong di tengah omongan)
 * ============================================================================ */

const CURIOSITY_TRIGGERS = [
  'rahasia', 'kesalahan', 'jangan', 'ternyata', 'penting', 'cara', 'tips',
  'masalah', 'solusi', 'fakta', 'kenapa', 'mengapa', 'bagaimana', 'alasan',
  'kunci', 'strategi', 'uang', 'bisnis', 'omzet', 'gagal', 'berhasil',
  'pertama', 'terbesar', 'hati-hati', 'jebakan', 'mistake', 'mindset', 'growth'
];

function sampleHeatmapScore(heatmap, startSec, endSec) {
  if (!Array.isArray(heatmap) || heatmap.length === 0) return null;
  let weightedSum = 0;
  let weightDur = 0;
  let peakIntensity = 0;

  for (const hm of heatmap) {
    const hs = Number(hm.startSec ?? hm.start_time ?? 0);
    const he = Number(hm.endSec ?? hm.end_time ?? hs + 5);
    const val = Math.max(0, Math.min(1, Number(hm.intensity ?? hm.value ?? 0)));
    const inter = Math.max(0, Math.min(endSec, he) - Math.max(startSec, hs));
    if (inter > 0) {
      weightedSum += val * inter;
      weightDur += inter;
      if (val > peakIntensity) peakIntensity = val;
    }
  }

  if (weightDur <= 0) return 0;
  const avg = weightedSum / weightDur;
  return Math.min(1, avg * 0.45 + peakIntensity * 0.55);
}

function sampleAudioSpikeSignal(audioFeatures, startSec, endSec, medianRms) {
  if (!audioFeatures || !audioFeatures.rmsFrames || audioFeatures.rmsFrames.length === 0) {
    return null;
  }
  const { rmsFrames, frameSec } = audioFeatures;
  const f0 = Math.max(0, Math.floor(startSec / frameSec));
  const f1 = Math.min(rmsFrames.length - 1, Math.ceil(endSec / frameSec));
  if (f1 <= f0) return null;

  let sum = 0;
  let peak = 0;
  let modSum = 0;
  let voiced = 0;
  const span = f1 - f0;

  for (let f = f0; f < f1; f++) {
    const v = rmsFrames[f];
    sum += v;
    if (v > peak) peak = v;
    if (v > medianRms * 0.55) voiced++;
    if (f > f0) modSum += Math.abs(v - rmsFrames[f - 1]);
  }

  const avg = sum / span;
  const liftRatio = (peak - medianRms) / Math.max(0.002, medianRms);
  const avgRatio = avg / Math.max(0.002, medianRms);
  const modRatio = (modSum / span) / Math.max(0.001, medianRms * 0.4);
  const voicedRatio = voiced / span;

  // Skor 0..1 berdasarkan lonjakan intonasi nyata & kepadatan vokal
  const normScore = Math.max(
    0,
    Math.min(
      1,
      Math.min(0.45, liftRatio * 0.16) +
        Math.min(0.3, (avgRatio - 0.7) * 0.25) +
        Math.min(0.25, modRatio * 0.15) -
        (voicedRatio < 0.35 ? 0.25 : 0)
    )
  );

  const liftPct = Math.max(5, Math.min(95, Math.round(Math.max(0.08, liftRatio) * 32)));
  return { normScore, liftPct, voicedRatio };
}

function evaluateOpeningHookSignal(wordsInWin) {
  if (!wordsInWin || wordsInWin.length === 0) {
    return { normScore: 0.25, reasonParts: [] };
  }

  const openingWords = wordsInWin.slice(0, Math.min(14, wordsInWin.length));
  const openingText = openingWords.map((w) => w.word).join(' ');
  const fullText = wordsInWin.map((w) => w.word).join(' ');
  const openLower = openingText.toLowerCase();

  let pts = 0.22;
  const tags = [];

  if (/\?/.test(openingText) || /\b(kenapa|mengapa|bagaimana|gimana|apa\s+yang|pernah\s+nggak|tau\s+nggak)\b/i.test(openLower)) {
    pts += 0.34;
    tags.push('kalimat tanya pembuka');
  }
  if (/\d+/.test(openingText) || /\b(satu|dua|tiga|empat|lima|sepuluh|persen|juta|miliar|detik|menit)\b/i.test(openLower)) {
    pts += 0.26;
    tags.push('angka konkret di awal');
  }

  let matchedKw = null;
  for (const kw of CURIOSITY_TRIGGERS) {
    if (openLower.includes(kw)) {
      matchedKw = kw;
      break;
    }
  }
  if (matchedKw) {
    pts += 0.24;
    tags.push(`pemicu penasaran ("${matchedKw}")`);
  } else {
    const anyKw = CURIOSITY_TRIGGERS.find((kw) => fullText.toLowerCase().includes(kw));
    if (anyKw) {
      pts += 0.12;
      tags.push(`kata kunci "${anyKw}"`);
    }
  }

  return {
    normScore: Math.min(1, pts),
    reasonParts: tags
  };
}

function evaluateSentenceClosureSignal(wordsInWin, nextWordAfterWin, audioFeatures) {
  if (!wordsInWin || wordsInWin.length === 0) {
    return { normScore: 0.5, cleanEnd: false, pauseAfterMs: 0 };
  }
  const lastWord = wordsInWin[wordsInWin.length - 1];
  const endsWithPunct = /[.!?]$/.test(String(lastWord.word || '').trim());
  const pauseAfterSec = nextWordAfterWin ? Math.max(0, nextWordAfterWin.start - lastWord.end) : 0.45;

  let acousticQuietEnd = false;
  if (audioFeatures && audioFeatures.rmsFrames && audioFeatures.rmsFrames.length > 0) {
    const fEnd = Math.min(
      audioFeatures.rmsFrames.length - 1,
      Math.max(0, Math.round(lastWord.end / audioFeatures.frameSec))
    );
    const val = audioFeatures.rmsFrames[fEnd] || 0;
    const nextVal = audioFeatures.rmsFrames[Math.min(audioFeatures.rmsFrames.length - 1, fEnd + 2)] || 0;
    if (nextVal <= val * 0.65 || nextVal < 0.015) acousticQuietEnd = true;
  }

  let score = 0.35;
  if (endsWithPunct) score += 0.35;
  if (pauseAfterSec >= 0.22) score += 0.3;
  else if (acousticQuietEnd) score += 0.2;

  return {
    normScore: Math.min(1, score),
    cleanEnd: endsWithPunct || pauseAfterSec >= 0.2 || acousticQuietEnd,
    pauseAfterMs: Math.round(pauseAfterSec * 1000)
  };
}

/**
 * Menghitung momen terbaik dengan rumus 4 sinyal jujur dan transparan.
 * Mengembalikan daftar momen (atau objek dengan properti `.scoringMeta`).
 */
export function pickMomentsFromWordsLocally(allWords, totalDurationSec, extraSignals = {}) {
  const heatmap = Array.isArray(extraSignals?.heatmap) && extraSignals.heatmap.length > 0 ? extraSignals.heatmap : null;
  const audioFeatures = extraSignals?.audioFeatures || null;
  const hasHeatmap = Boolean(heatmap);

  const weightNotice = hasHeatmap
    ? 'Bobot skor aktif: Grafik Most-Replayed YouTube (35%) + Lonjakan Vokal (25%) + Kalimat Pembuka (25%) + Jeda Napas Akhir (15%).'
    : 'Grafik Most-Replayed tidak tersedia pada sumber ini — bobot penilaian otomatis dialihkan ke Lonjakan Vokal (40%), Kekuatan Kalimat Pembuka (35%), dan Jeda Napas Kalimat Utuh (25%).';

  if (!allWords || allWords.length === 0) {
    const emptyArr = [];
    emptyArr.scoringMeta = { hasHeatmap, weightNotice };
    return emptyArr;
  }

  let medianRms = 0.02;
  if (audioFeatures && audioFeatures.rmsFrames && audioFeatures.rmsFrames.length > 0) {
    const activeVals = Array.from(audioFeatures.rmsFrames).filter((v) => v > 0.002).sort((a, b) => a - b);
    if (activeVals.length > 0) {
      medianRms = activeVals[Math.floor(activeVals.length * 0.5)] || 0.02;
    }
  }

  const targetWinSec = totalDurationSec <= 35 ? Math.max(8, totalDurationSec * 0.48) : Math.min(44, Math.max(20, totalDurationSec * 0.18));
  const stepSec = Math.max(6, targetWinSec * 0.45);
  const candidates = [];

  for (let winStart = 0; winStart < totalDurationSec - 3; winStart += stepSec) {
    const roughEnd = Math.min(totalDurationSec, winStart + targetWinSec);

    // Cari kata pertama setelah jeda napas dekat winStart agar awal klip bersih
    let firstIdx = allWords.findIndex((w) => w.start >= winStart - 0.15);
    if (firstIdx === -1) break;
    if (firstIdx > 0 && winStart > 1) {
      for (let probe = firstIdx; probe < Math.min(allWords.length - 3, firstIdx + 6); probe++) {
        const gapBefore = allWords[probe].start - allWords[probe - 1].end;
        const prevEndsSentence = /[.!?]$/.test(allWords[probe - 1].word);
        if (prevEndsSentence || gapBefore >= 0.22) {
          firstIdx = probe;
          break;
        }
      }
    }

    // Cari batas akhir kalimat / jeda napas terdekat di sekitar roughEnd agar TIDAK terpotong tengah kalimat!
    let lastIdx = firstIdx;
    for (let k = firstIdx; k < allWords.length; k++) {
      if (allWords[k].end <= roughEnd + 3.5) {
        lastIdx = k;
      } else {
        break;
      }
    }

    let bestEndIdx = lastIdx;
    let bestClosureBonus = -1;
    const minEndSearchSec = allWords[firstIdx].start + Math.min(10, targetWinSec * 0.55);
    for (let k = firstIdx + 3; k <= lastIdx; k++) {
      if (allWords[k].end < minEndSearchSec) continue;
      const punct = /[.!?]$/.test(allWords[k].word) ? 2 : /[,;:]$/.test(allWords[k].word) ? 0.8 : 0;
      const gapNext = k + 1 < allWords.length ? Math.min(1.5, allWords[k + 1].start - allWords[k].end) : 1.0;
      const distPenalty = Math.abs(allWords[k].end - roughEnd) * 0.12;
      const closureScore = punct + gapNext * 2.2 - distPenalty;
      if (closureScore > bestClosureBonus) {
        bestClosureBonus = closureScore;
        bestEndIdx = k;
      }
    }

    const wordsInWin = allWords.slice(firstIdx, bestEndIdx + 1);
    if (wordsInWin.length < 4) continue;

    const actualStart = Math.max(0, wordsInWin[0].start - 0.12);
    const actualEnd = Math.min(totalDurationSec, wordsInWin[wordsInWin.length - 1].end + 0.18);
    if (actualEnd - actualStart < 3.5) continue;

    const heatmapSig = hasHeatmap ? sampleHeatmapScore(heatmap, actualStart, actualEnd) : null;
    const audioSig = sampleAudioSpikeSignal(audioFeatures, actualStart, actualEnd, medianRms);
    const hookSig = evaluateOpeningHookSignal(wordsInWin);
    const closureSig = evaluateSentenceClosureSignal(
      wordsInWin,
      allWords[bestEndIdx + 1] || null,
      audioFeatures
    );

    // Kecepatan bicara alami sebagai penguat bila audioFeatures belum diekstrak (misal pratinjau cepat teks)
    const wps = wordsInWin.length / Math.max(1, actualEnd - actualStart);
    const paceNorm = wps >= 1.9 && wps <= 3.7 ? 0.78 : wps >= 1.3 ? 0.55 : 0.35;
    const vocalNorm = audioSig ? audioSig.normScore : paceNorm;

    let composite01 = 0;
    if (hasHeatmap) {
      composite01 =
        (heatmapSig ?? 0) * 0.35 +
        vocalNorm * 0.25 +
        hookSig.normScore * 0.25 +
        closureSig.normScore * 0.15;
    } else {
      composite01 =
        vocalNorm * 0.4 +
        hookSig.normScore * 0.35 +
        closureSig.normScore * 0.25;
    }

    // Konversi ke skala skor jujur 58..95 (bukan semua 95!)
    const honestScore = Math.max(58, Math.min(95, Math.round(54 + composite01 * 42)));

    // Susun alasan transparan berdasarkan sinyal terukur
    const reasonParts = [];
    if (hasHeatmap && heatmapSig != null && heatmapSig > 0.15) {
      reasonParts.push(`puncak Most-Replayed ${Math.round(heatmapSig * 100)}%`);
    }
    if (audioSig) {
      reasonParts.push(`lonjakan vokal +${audioSig.liftPct}%`);
    } else {
      reasonParts.push(`ritme bicara ${wps.toFixed(1)} kata/dtk`);
    }
    if (hookSig.reasonParts.length > 0) {
      reasonParts.push(hookSig.reasonParts[0]);
    }
    if (closureSig.cleanEnd) {
      reasonParts.push('akhir jeda napas bersih');
    }

    const reasonText =
      reasonParts.length > 0
        ? reasonParts.join(' + ').replace(/^./, (c) => c.toUpperCase()) + '.'
        : 'Kepadatan kalimat stabil dan berhenti pada jeda antar kalimat.';

    const cleanLeadTokens = wordsInWin
      .slice(0, 7)
      .map((w) => w.word.replace(/^[.,?!:;'"-]+|[.,?!:;'"-]+$/g, ''))
      .filter(Boolean);
    const autoTitle =
      cleanLeadTokens.join(' ').replace(/^./, (c) => c.toUpperCase()) || 'Poin Penting Pembicara';

    candidates.push({
      title: autoTitle,
      score: honestScore,
      reason: reasonText,
      startSec: Number(actualStart.toFixed(2)),
      endSec: Number(actualEnd.toFixed(2)),
      transcript: wordsInWin.map((w) => w.word).join(' '),
      words: wordsInWin,
      hasHeatmap
    });

    if (roughEnd >= totalDurationSec) break;
  }

  candidates.sort((a, b) => b.score - a.score || a.startSec - b.startSec);

  const chosen = [];
  for (const cand of candidates) {
    const minSpan = Math.min(cand.endSec - cand.startSec, targetWinSec);
    const overlaps = chosen.some(
      (c) => Math.max(0, Math.min(c.endSec, cand.endSec) - Math.max(c.startSec, cand.startSec)) > minSpan * 0.35
    );
    if (!overlaps) {
      // Pastikan skor jujur tidak kembar identik semua jika selisih desimal tipis
      let displayScore = cand.score;
      while (chosen.some((x) => x.score === displayScore) && displayScore > 56) {
        displayScore -= 1;
      }
      chosen.push({
        ...cand,
        score: displayScore,
        id: `lokal-momen-${chosen.length + 1}`
      });
    }
    if (chosen.length >= 9) break;
  }

  const finalMoments =
    chosen.length > 0
      ? chosen
      : candidates.slice(0, 5).map((c, i) => ({
          ...c,
          score: Math.max(58, c.score - i * 2),
          id: `lokal-momen-${i + 1}`
        }));

  finalMoments.scoringMeta = { hasHeatmap, weightNotice };
  return finalMoments;
}

/**
 * Mode Lokal 100% Tanpa API Key (Aman untuk Video 10 Menit s/d 120+ Menit di Laptop RAM 8 GB!):
 * 1. Untuk video panjang (> 15 menit), memindai kurva energi vokal hemat memori terlebih dahulu
 *    untuk menemukan 8 kandidat segmen paling hidup, lalu mentranskripsi vokal segmen tersebut
 *    dengan Whisper-Small (Indlish) secara presisi tanpa menghabiskan RAM tab browser!
 * 2. Untuk video <= 15 menit, mentranskripsi per jendela 24 detik dan menyelaraskan semua kata ke vokal.
 */
export async function transcribeAndPickWithWhisperWeb({
  file,
  totalDurationSec,
  heatmap = null,
  onStatus = null
}) {
  if (onStatus) {
    onStatus('Menyiapkan model lokal Bahasa Indonesia + Inggris (Whisper-Small)...', 6);
  }
  const transcriber = await getWhisperPipeline((dlPct) => {
    if (onStatus) {
      onStatus(
        `Mengunduh model suara lokal akurat Whisper-Small (${dlPct}% — tersimpan otomatis di browser)...`,
        6 + Math.round(dlPct * 0.2)
      );
    }
  });

  if (onStatus) onStatus('Memindai dinamika vokal & jeda napas rekaman secara hemat memori...', 28);
  const audioFeatures = await scanLongVideoAudioFeatures(file, {
    maxDurationSec: totalDurationSec,
    windowSec: 180,
    hopMs: 50,
    onProgress: (p) => {
      if (onStatus) {
        onStatus(`Memindai lonjakan vokal & jeda napas (${p}%)...`, 28 + Math.round(p * 0.14));
      }
    }
  });

  // Bila video berdurasi panjang (> 18 menit / > 1080 detik), gunakan seleksi jendela akustik hemat RAM
  // agar video 60–120 menit tidak pernah membuat tab browser kehabisan memori di laptop RAM 8 GB!
  if (totalDurationSec > 1080) {
    const { rmsFrames, frameSec } = audioFeatures;
    const activeVals = Array.from(rmsFrames).filter((v) => v > 0.002).sort((a, b) => a - b);
    const medianRms = activeVals[Math.floor(activeVals.length * 0.5)] || 0.015;

    const winSec = 42;
    const stepSec = 30;
    const winFrames = Math.max(1, Math.round(winSec / frameSec));
    const stepFrames = Math.max(1, Math.round(stepSec / frameSec));
    const rawWindows = [];

    for (let f0 = 0; f0 + winFrames <= rmsFrames.length; f0 += stepFrames) {
      let sum = 0;
      let peak = 0;
      let voiced = 0;
      for (let f = f0; f < f0 + winFrames; f++) {
        const v = rmsFrames[f];
        sum += v;
        if (v > peak) peak = v;
        if (v > Math.max(0.004, medianRms * 0.45)) voiced++;
      }
      const voicedRatio = voiced / winFrames;
      if (voicedRatio < 0.12 && peak < 0.03) continue;
      const sSec = f0 * frameSec;
      const eSec = Math.min(totalDurationSec, (f0 + winFrames) * frameSec);
      const hm = heatmap ? sampleHeatmapScore(heatmap, sSec, eSec) || 0 : 0;
      const rankScore = (sum / winFrames) / Math.max(0.002, medianRms) + peak * 2.2 + hm * 1.8;
      rawWindows.push({ startSec: sSec, endSec: eSec, rankScore });
    }

    rawWindows.sort((a, b) => b.rankScore - a.rankScore);
    const topWindows = [];
    for (const w of rawWindows) {
      if (!topWindows.some((t) => Math.abs(t.startSec - w.startSec) < winSec * 0.85)) {
        topWindows.push(w);
      }
      if (topWindows.length >= 8) break;
    }
    topWindows.sort((a, b) => a.startSec - b.startSec);

    const collectedWords = [];
    for (let i = 0; i < topWindows.length; i++) {
      const win = topWindows[i];
      if (onStatus) {
        const pct = 44 + Math.round(((i + 0.5) / Math.max(1, topWindows.length)) * 48);
        onStatus(
          `Mentranskripsi segmen unggulan ${i + 1}/${topWindows.length} (${Math.floor(win.startSec / 60)}m${Math.floor(win.startSec % 60)}s)...`,
          pct
        );
      }
      const { samples } = await extractMonoAudio(file, {
        startSec: win.startSec,
        endSec: win.endSec,
        targetSampleRate: 16000
      });
      const wList = await transcribeCleanAudioToWords(transcriber, samples, win.startSec, win.endSec);
      collectedWords.push(...wList);
    }

    if (collectedWords.length === 0) {
      throw new Error('Tidak terdengar ucapan vokal yang jelas pada rekaman panjang ini.');
    }

    const moments = pickMomentsFromWordsLocally(collectedWords, totalDurationSec, {
      heatmap,
      audioFeatures
    });
    if (onStatus) onStatus('Transkrip vokal & penilaian skor 4 sinyal selesai!', 100);
    return moments;
  }

  // Untuk video <= 18 menit: transkrip menyeluruh per jendela 24 detik hemat memori
  const chunkSeconds = 24;
  const totalChunks = Math.max(1, Math.ceil(totalDurationSec / chunkSeconds));
  const allWords = [];

  for (let c = 0; c < totalChunks; c++) {
    const offsetSec = c * chunkSeconds;
    const sliceEndSec = Math.min(totalDurationSec, (c + 1) * chunkSeconds);
    if (sliceEndSec - offsetSec < 0.4) break;

    if (onStatus) {
      const pct = 44 + Math.round(((c + 0.5) / totalChunks) * 48);
      onStatus(`Membaca ucapan vokal bagian ${c + 1} dari ${totalChunks} (Whisper-Small)...`, pct);
    }

    const { samples } = await extractMonoAudio(file, {
      startSec: offsetSec,
      endSec: sliceEndSec,
      targetSampleRate: 16000
    });
    const chunkWords = await transcribeCleanAudioToWords(transcriber, samples, offsetSec, sliceEndSec);
    allWords.push(...chunkWords);
  }

  if (allWords.length === 0) {
    throw new Error('Tidak terdengar ucapan vokal yang jelas pada video ini. Kamu juga bisa mengetik/menempel teks caption manual.');
  }

  if (onStatus) onStatus('Menghitung skor 4 sinyal & mengunci jeda napas akhir kalimat...', 95);
  const moments = pickMomentsFromWordsLocally(allWords, totalDurationSec, {
    heatmap,
    audioFeatures
  });
  if (onStatus) onStatus('Pembacaan vokal & penilaian momen selesai!', 100);
  return moments;
}

/**
 * Membaca & menyelaraskan vokal pembicara per kata khusus untuk 1 klip pendek [startSec, endSec].
 * Menghasilkan daftar kata yang terkunci rapat ke pulau energi vokal pembicara!
 */
export async function syncClipWordsWithWhisper(file, startSec, endSec, onStatus = null) {
  if (onStatus) onStatus('Menyiapkan model suara lokal Whisper-Small (ID + EN)...', 10);
  const transcriber = await getWhisperPipeline((dlPct) => {
    if (onStatus) {
      onStatus(
        `Mengunduh model suara lokal akurat (${dlPct}%)...`,
        10 + Math.round(dlPct * 0.35)
      );
    }
  });

  if (onStatus) onStatus('Mengekstrak & menyaring pita frekuensi vokal pembicara...', 50);
  const { samples } = await extractMonoAudio(file, {
    startSec,
    endSec,
    targetSampleRate: 16000
  });

  if (onStatus) onStatus('Membaca suku kata & mengunci waktu tepat ke getaran vokal...', 74);
  const words = await transcribeCleanAudioToWords(transcriber, samples, startSec, endSec);

  if (onStatus) onStatus(`Selesai menyelaraskan ${words.length} kata tepat ke vokal pembicara!`, 100);
  return words;
}

/**
 * Mengunci ulang teks caption (misal setelah pembeli mengedit ejaan kata di Langkah 2)
 * langsung ke gelombang vokal asli pada rentang [startSec, endSec] tanpa perlu memanggil ulang Whisper!
 */
export async function lockEditedTextToClipVocal(file, text, startSec, endSec) {
  if (!file) {
    return alignTextToVocalWaveform(text, startSec, endSec, null, 16000);
  }
  const { samples } = await extractMonoAudio(file, {
    startSec,
    endSec,
    targetSampleRate: 16000
  });
  return alignTextToVocalWaveform(text, startSec, endSec, samples, 16000);
}

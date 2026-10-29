/**
 * Klip Auto — Mesin Transkrip Otomatis, Pemilih 5–10 Momen Menarik, & Sinkronisasi Kata
 * Mendukung 2 jalur tanpa biaya server:
 * 1) BYOK Gemini API Key milik pembeli (Upload Resumable File API, kuat untuk podcast 10–30 menit)
 * 2) Whisper Web langsung di browser (@huggingface/transformers WebGPU/WASM) + Skor Momen Lokal
 */

import { encodeMonoWavBlob, extractMonoAudio } from './audio-processor.js';

let whisperPipelinePromise = null;
const whisperProgressListeners = new Set();

/**
 * Mengubah teks biasa menjadi urutan kata ber-timestamp proporsional dengan panjang suku kata
 * dan menempelkannya ke energi suara asli agar sinkron saat pembeli mengedit teks caption.
 */
export function buildWordsFromTextAndWindow(text, startSec, endSec, monoSamples = null, sampleRate = 16000) {
  const cleanTokens = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleanTokens.length === 0) return [];

  const padStart = startSec + 0.08;
  const padEnd = Math.max(padStart + 0.3, endSec - 0.12);
  const totalSpan = padEnd - padStart;

  // Bobot durasi per kata berdasarkan panjang huruf + tanda baca jeda
  const weights = cleanTokens.map((tok) => {
    const base = Math.max(2, tok.replace(/[^a-zA-Z0-9]/g, '').length);
    const commaPause = /[,;:]$/.test(tok) ? 2.2 : 0;
    const endPause = /[.!?]$/.test(tok) ? 3.5 : 0;
    return base + commaPause + endPause;
  });

  const sumWeights = weights.reduce((a, b) => a + b, 0) || 1;
  let cursor = padStart;
  const result = [];

  for (let i = 0; i < cleanTokens.length; i++) {
    const share = (weights[i] / sumWeights) * totalSpan;
    const hasPauseAfter = /[,;:.!?]$/.test(cleanTokens[i]);
    const wordDur = hasPauseAfter ? Math.max(0.14, share * 0.82) : Math.max(0.12, share * 0.96);
    const wStart = Number(cursor.toFixed(3));
    const wEnd = Number(Math.min(padEnd, cursor + wordDur).toFixed(3));
    result.push({
      word: cleanTokens[i],
      start: wStart,
      end: Math.max(wStart + 0.08, wEnd)
    });
    cursor += share;
  }

  // Jika ada sampel gelombang suara klip, geser tipis awal kata mengikuti puncak suara terdekat
  if (monoSamples && monoSamples.length > 100) {
    const winSamples = Math.max(1, Math.floor(sampleRate * 0.04));
    for (let i = 0; i < result.length; i++) {
      const relSec = result[i].start - startSec;
      const centerIdx = Math.floor(relSec * sampleRate);
      let bestEnergy = 0;
      let bestOffset = 0;

      for (let delta = -winSamples * 2; delta <= winSamples * 2; delta += Math.max(1, Math.floor(winSamples / 2))) {
        const s0 = Math.max(0, centerIdx + delta);
        const s1 = Math.min(monoSamples.length, s0 + winSamples);
        if (s1 <= s0) continue;
        let sum = 0;
        for (let k = s0; k < s1; k++) sum += Math.abs(monoSamples[k]);
        const avg = sum / (s1 - s0);
        if (avg > bestEnergy * 1.18) {
          bestEnergy = avg;
          bestOffset = delta / sampleRate;
        }
      }

      if (Math.abs(bestOffset) <= 0.08) {
        const prevEnd = i > 0 ? result[i - 1].end : startSec;
        const shifted = Math.max(prevEnd, result[i].start + bestOffset);
        const dur = result[i].end - result[i].start;
        result[i].start = Number(shifted.toFixed(3));
        result[i].end = Number(Math.min(endSec, shifted + dur).toFixed(3));
      }
    }
  }

  return result;
}

/**
 * Mode 1 (Tercepat untuk Podcast 10–30 Menit):
 * Upload audio ringan 8 kHz WAV ke Gemini File API menggunakan API Key pribadi pembeli (BYOK),
 * minta Gemini memilih 5–10 momen paling menarik + skor + judul + transkrip.
 */
export async function analyzePodcastWithGemini({
  file,
  apiKey,
  totalDurationSec,
  onStatus = null
}) {
  const cleanKey = String(apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Masukkan Gemini API Key kamu dulu di Pengaturan atau kolom API Key.');
  }

  if (onStatus) onStatus('Mengekstrak suara ringan dari video...', 10);
  // 8 kHz mono 16-bit = ~0.96 MB per menit (20 menit = ~19 MB, ringan & sangat jelas untuk suara bicara)
  const { samples, sampleRate } = await extractMonoAudio(file, {
    startSec: 0,
    endSec: totalDurationSec,
    targetSampleRate: 8000,
    onProgress: (p) => {
      if (onStatus) onStatus(`Mengekstrak jalur suara (${p}%)...`, 10 + Math.round(p * 0.25));
    }
  });

  const wavBlob = encodeMonoWavBlob(samples, sampleRate);

  if (onStatus) onStatus('Mengirim audio ke akun Gemini kamu...', 40);

  // Gunakan Resumable File API Gemini agar aman untuk podcast 10–30 menit (sampai ratusan MB)
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
      body: JSON.stringify({
        file: { display_name: 'klip-auto-audio.wav' }
      })
    }
  );

  if (!startUploadRes.ok) {
    const errTxt = await startUploadRes.text().catch(() => '');
    throw new Error(`Gagal menghubungkan Gemini API Key (${startUploadRes.status}). Pastikan API Key valid. ${errTxt.slice(0, 120)}`);
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
    if (onStatus) onStatus('AI sedang mendengarkan & memilih 5–10 momen paling menarik...', 65);

    const targetCount = totalDurationSec >= 300 ? '6 sampai 10' : '3 sampai 6';
    const prompt = `Kamu adalah produser klip pendek (Reels/TikTok/Shorts) berbahasa Indonesia.
Durasi total rekaman ini adalah ${Math.round(totalDurationSec)} detik.
Dengarkan seluruh rekaman ini, lalu pilih ${targetCount} momen paling menarik, kuat, lucu, emosional, atau penuh daging/tips praktis.

Aturan wajib:
1. Durasi tiap momen idealnya 20 sampai 60 detik (atau sesuaikan jika video asli pendek, jangan melebihi ${totalDurationSec.toFixed(1)} detik).
2. Titik mulai (startSec) dan selesai (endSec) harus pas di awal dan akhir kalimat utuh dalam satuan detik angka desimal.
3. Tuliskan transkrip kata demi kata yang diucapkan pembicara di dalam rentang momen tersebut secara akurat.
4. Berikan skor 70-99 dan judul atas singkat yang bikin orang berhenti scroll (maksimal 8 kata, bahasa Indonesia natural).

Kembalikan HANYA JSON murni sesuai skema berikut:
{
  "moments": [
    {
      "title": "Judul Hook Singkat Maks 8 Kata",
      "score": 94,
      "reason": "Alasan singkat 1 kalimat kenapa bagian ini menarik",
      "startSec": 12.5,
      "endSec": 48.0,
      "transcript": "Teks transkrip akurat yang diucapkan pembicara pada rentang detik tersebut"
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
            contents: [
              {
                parts: [
                  { file_data: { mime_type: 'audio/wav', file_uri: fileUri } },
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: 'application/json'
            }
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
        if (parsed && Array.isArray(parsed.moments) && parsed.moments.length > 0) {
          break;
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!parsed || !Array.isArray(parsed.moments) || parsed.moments.length === 0) {
      throw new Error(`Respons AI belum menghasilkan daftar momen valid (${lastError || 'coba lagi'}).`);
    }

    if (onStatus) onStatus('Menyelaraskan caption per kata dengan gelombang suara...', 90);

    const normalizedMoments = parsed.moments
      .map((m, idx) => {
        const s = Math.max(0, Math.min(totalDurationSec - 1, Number(m.startSec) || 0));
        const e = Math.max(s + 1, Math.min(totalDurationSec, Number(m.endSec) || s + 30));
        const sliceStartIdx = Math.floor(s * sampleRate);
        const sliceEndIdx = Math.min(samples.length, Math.ceil(e * sampleRate));
        const clipMono = samples.subarray(sliceStartIdx, sliceEndIdx);

        return {
          id: `ai-momen-${idx + 1}`,
          title: String(m.title || `Momen Menarik #${idx + 1}`).trim(),
          score: Math.max(60, Math.min(99, Math.round(Number(m.score) || 85))),
          reason: String(m.reason || 'Bagian percakapan dengan poin kuat dan jelas.').trim(),
          startSec: Number(s.toFixed(2)),
          endSec: Number(e.toFixed(2)),
          transcript: String(m.transcript || '').trim(),
          words: buildWordsFromTextAndWindow(m.transcript || '', s, e, clipMono, sampleRate)
        };
      })
      .sort((a, b) => b.score - a.score);

    if (onStatus) onStatus('Selesai memilih momen terbaik!', 100);
    return normalizedMoments;
  } finally {
    // Hapus file audio sementara dari server Gemini demi privasi pembeli
    if (fileName) {
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${encodeURIComponent(cleanKey)}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }
  }
}

/**
 * Memuat pipeline pembaca suara vokal Whisper (Xenova/whisper-base q8 WASM) langsung di browser.
 * Model ini memiliki bobot cross-attention penuh untuk penandaan waktu per kata (word-level timestamps)
 * dalam Bahasa Indonesia, dan disimpan otomatis di Cache browser setelah unduhan pertama.
 */
async function getWhisperPipeline(onProgress = null) {
  if (onProgress) whisperProgressListeners.add(onProgress);

  if (!whisperPipelinePromise) {
    const fileProgress = new Map();
    whisperPipelinePromise = (async () => {
      try {
        const transformers = await import(
          'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.min.js'
        );
        transformers.env.allowLocalModels = false;

        return await transformers.pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-base',
          {
            device: 'wasm',
            dtype: 'q8',
            progress_callback: (info) => {
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
            }
          }
        );
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

/**
 * Penjernih jalur suara khusus pengenalan ucapan vokal (16 kHz):
 * - Memotong dentuman bass / ledakan / musik rendah (< 95 Hz) tanpa memotong konsonan Bahasa Indonesia (95–8000 Hz)
 * - Meratakan suara pembicara pelan vs keras memakai kompresor lembut agar setiap kata terbaca jelas oleh Whisper
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
      hpf.frequency.value = 95;
      hpf.Q.value = 0.707;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.knee.value = 18;
      comp.ratio.value = 3.2;
      comp.attack.value = 0.004;
      comp.release.value = 0.14;

      src.connect(hpf);
      hpf.connect(comp);
      comp.connect(ctx.destination);
      src.start(0);

      const rendered = await ctx.startRendering();
      working = new Float32Array(rendered.getChannelData(0));
    } catch {
      working = null;
    }
  }

  if (!working) {
    // Cadangan filter diferensial 1st-order high-pass 95 Hz bila OfflineAudioContext tidak tersedia
    working = new Float32Array(rawSamples.length);
    let prevIn = 0;
    let prevOut = 0;
    const alpha = 0.964;
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
    const scale = 0.88 / peak;
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
  /^subtitle\s+oleh/i,
  /^terima\s+kasih\s+telah\s+menonton/i
];

const PHONETIC_FIX_ID = {
  gambal: 'kembali',
  gambali: 'kembali',
  melidugi: 'melindungi',
  peningbak: 'penembak',
  jidu: 'jitu',
  jombi: 'zombie',
  alian: 'alien'
};

function normalizeIndonesianToken(token) {
  const raw = String(token || '').trim();
  if (!raw) return '';
  const m = raw.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u);
  if (!m) return raw;
  const [, pre, core, post] = m;
  const fixed = PHONETIC_FIX_ID[core.toLowerCase()];
  if (!fixed) return raw;
  const cased =
    core[0] === core[0].toUpperCase() ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
  return `${pre}${cased}${post}`;
}

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
 * Menggabungkan potongan sub-kata BPE dari Whisper menjadi kata utuh ber-timestamp rapi dan monotonik.
 */
function parseWhisperOutputToWords(out, offsetSec, maxEndSec, cleanSamples) {
  const merged = [];

  if (out && Array.isArray(out.chunks) && out.chunks.length > 0) {
    for (const ch of out.chunks) {
      const rawText = String(ch.text || '');
      const trimmed = rawText.trim();
      if (!trimmed) continue;

      // Jika chunk adalah kalimat panjang (fallback return_timestamps: true), pecah proporsional mengikuti energi suara
      const spaceTokens = trimmed.split(/\s+/).filter(Boolean);
      const rawT0 = Number(ch.timestamp?.[0] ?? 0);
      const rawT1 = Number(
        ch.timestamp?.[1] ?? Math.min(maxEndSec - offsetSec, rawT0 + Math.max(0.35, spaceTokens.length * 0.32))
      );
      const segStart = Math.max(offsetSec, Math.min(maxEndSec - 0.08, offsetSec + Math.max(0, rawT0)));
      const segEnd = Math.max(segStart + 0.12, Math.min(maxEndSec, offsetSec + Math.max(rawT0 + 0.14, rawT1)));

      if (spaceTokens.length > 1) {
        const sIdx = Math.max(0, Math.floor((segStart - offsetSec) * 16000));
        const eIdx = Math.min(cleanSamples.length, Math.ceil((segEnd - offsetSec) * 16000));
        const subMono = eIdx > sIdx ? cleanSamples.subarray(sIdx, eIdx) : null;
        const expanded = buildWordsFromTextAndWindow(trimmed, segStart, segEnd, subMono, 16000).filter((w) =>
          isValidSpokenWord(w.word)
        );
        merged.push(...expanded);
        continue;
      }

      const isContinuation = !/^\s/.test(rawText) && merged.length > 0;
      if (isContinuation) {
        merged[merged.length - 1].word += trimmed;
        merged[merged.length - 1].end = Number(Math.max(merged[merged.length - 1].end, segEnd).toFixed(3));
      } else {
        const prevEnd = merged.length > 0 ? merged[merged.length - 1].end : offsetSec;
        const monotonicStart = Math.max(segStart, Math.min(segEnd - 0.08, prevEnd - 0.02));
        merged.push({
          word: trimmed,
          start: Number(Math.max(offsetSec, monotonicStart).toFixed(3)),
          end: Number(Math.max(monotonicStart + 0.1, segEnd).toFixed(3))
        });
      }
    }
  }

  const filtered = merged
    .map((w) => ({ ...w, word: normalizeIndonesianToken(w.word) }))
    .filter((w) => isValidSpokenWord(w.word));
  if (filtered.length > 0) {
    return filtered;
  }

  if (out && typeof out.text === 'string' && out.text.trim()) {
    return buildWordsFromTextAndWindow(out.text.trim(), offsetSec, maxEndSec, cleanSamples, 16000).filter((w) =>
      isValidSpokenWord(w.word)
    );
  }

  return [];
}

async function transcribeCleanAudioToWords(transcriber, rawSamples, offsetSec, maxEndSec) {
  const cleanSamples = await prepareCleanSpeech16k(rawSamples);
  if (cleanSamples.length < 1600) return [];

  let peak = 0;
  for (let i = 0; i < cleanSamples.length; i += 4) {
    const a = Math.abs(cleanSamples[i]);
    if (a > peak) peak = a;
  }
  if (peak < 0.015) return [];

  try {
    const outWord = await transcriber(cleanSamples, {
      language: 'indonesian',
      task: 'transcribe',
      return_timestamps: 'word',
      chunk_length_s: 22,
      stride_length_s: 3
    });
    const words = parseWhisperOutputToWords(outWord, offsetSec, maxEndSec, cleanSamples);
    if (words.length > 0) return words;
  } catch {
    // Lanjut ke mode timestamp segmen bila diperlukan
  }

  const outSeg = await transcriber(cleanSamples, {
    language: 'indonesian',
    task: 'transcribe',
    return_timestamps: true,
    chunk_length_s: 22,
    stride_length_s: 3
  });
  return parseWhisperOutputToWords(outSeg, offsetSec, maxEndSec, cleanSamples);
}

const HOOK_KEYWORDS_ID = [
  'rahasia', 'kesalahan', 'jangan', 'ternyata', 'penting', 'cara', 'tips',
  'masalah', 'solusi', 'fakta', 'kenapa', 'alasan', 'kunci', 'strategi',
  'uang', 'bisnis', 'omzet', 'viral', 'gagal', 'berhasil', 'pertama', 'terbesar'
];

/**
 * Menyusun 5–10 momen menarik secara lokal dari daftar kata ber-timestamp hasil Whisper Web.
 */
export function pickMomentsFromWordsLocally(allWords, totalDurationSec) {
  if (!allWords || allWords.length === 0) return [];

  const windowSec = Math.min(42, Math.max(12, totalDurationSec * 0.35));
  const stepSec = Math.max(8, windowSec * 0.55);
  const candidates = [];

  for (let winStart = 0; winStart < totalDurationSec - 3; winStart += stepSec) {
    const winEnd = Math.min(totalDurationSec, winStart + windowSec);
    const wordsInWin = allWords.filter((w) => w.start >= winStart - 0.1 && w.end <= winEnd + 0.3);
    if (wordsInWin.length < 4) continue;

    const text = wordsInWin.map((w) => w.word).join(' ');
    const lower = text.toLowerCase();

    let score = 74;
    for (const kw of HOOK_KEYWORDS_ID) {
      if (lower.includes(kw)) score += 4;
    }
    if (/\d+/.test(text)) score += 5;
    if (text.includes('?')) score += 4;

    const wps = wordsInWin.length / Math.max(1, winEnd - winStart);
    if (wps >= 1.8 && wps <= 3.8) score += 6;

    const actualStart = wordsInWin[0].start;
    const actualEnd = wordsInWin[wordsInWin.length - 1].end;
    const firstWords = wordsInWin
      .slice(0, 6)
      .map((w) => w.word.replace(/[.,!?]+$/, ''))
      .join(' ');
    const autoTitle = firstWords.charAt(0).toUpperCase() + firstWords.slice(1);

    candidates.push({
      title: autoTitle || 'Poin Penting Pembicara',
      score: Math.min(97, score),
      reason: 'Bagian dengan kepadatan kalimat tinggi dan kata kunci penarik perhatian.',
      startSec: Number(Math.max(0, actualStart - 0.15).toFixed(2)),
      endSec: Number(Math.min(totalDurationSec, actualEnd + 0.25).toFixed(2)),
      transcript: text,
      words: wordsInWin
    });

    if (winEnd >= totalDurationSec) break;
  }

  candidates.sort((a, b) => b.score - a.score);

  // Hindari tumpang tindih berlebihan antar momen terpilih
  const chosen = [];
  for (const cand of candidates) {
    const overlaps = chosen.some(
      (c) => Math.max(0, Math.min(c.endSec, cand.endSec) - Math.max(c.startSec, cand.startSec)) > windowSec * 0.5
    );
    if (!overlaps) {
      chosen.push({ ...cand, id: `lokal-momen-${chosen.length + 1}` });
    }
    if (chosen.length >= 8) break;
  }

  return chosen.length > 0 ? chosen : candidates.slice(0, 5).map((c, i) => ({ ...c, id: `lokal-momen-${i + 1}` }));
}

/**
 * Mode 2 (100% Tanpa API Key): Transkrip suara vokal langsung di browser memakai Whisper Web
 * lalu pilih momen terbaik secara otomatis.
 */
export async function transcribeAndPickWithWhisperWeb({
  file,
  totalDurationSec,
  onStatus = null
}) {
  if (onStatus) onStatus('Menyiapkan mesin pembaca vokal Bahasa Indonesia (pertama kali unduh ~75 MB)...', 8);
  const transcriber = await getWhisperPipeline((dlPct) => {
    if (onStatus) onStatus(`Mengunduh model pembaca vokal Bahasa Indonesia (${dlPct}%)...`, 8 + Math.round(dlPct * 0.2));
  });

  if (onStatus) onStatus('Mengekstrak jalur vokal 16 kHz...', 30);
  const { samples } = await extractMonoAudio(file, {
    startSec: 0,
    endSec: totalDurationSec,
    targetSampleRate: 16000
  });

  // Proses per potongan 28 detik agar browser tetap responsif di video 10–30 menit
  const chunkSeconds = 28;
  const chunkSize = chunkSeconds * 16000;
  const totalChunks = Math.max(1, Math.ceil(samples.length / chunkSize));
  const allWords = [];

  for (let c = 0; c < totalChunks; c++) {
    const offsetSec = c * chunkSeconds;
    const slice = samples.subarray(c * chunkSize, Math.min(samples.length, (c + 1) * chunkSize));
    const sliceEndSec = Math.min(totalDurationSec, offsetSec + slice.length / 16000);
    if (onStatus) {
      const pct = 35 + Math.round(((c + 0.5) / totalChunks) * 55);
      onStatus(`Membaca ucapan vokal bagian ${c + 1} dari ${totalChunks}...`, pct);
    }

    const chunkWords = await transcribeCleanAudioToWords(transcriber, slice, offsetSec, sliceEndSec);
    allWords.push(...chunkWords);
  }

  if (allWords.length === 0) {
    throw new Error('Tidak terdengar ucapan vokal yang jelas pada video ini. Kamu juga bisa mengetik/menempel teks caption manual.');
  }

  if (onStatus) onStatus('Memilih momen paling menarik dari transkrip vokal...', 95);
  const moments = pickMomentsFromWordsLocally(allWords, totalDurationSec);
  if (onStatus) onStatus('Pembacaan vokal & pemilihan momen selesai!', 100);
  return moments;
}

/**
 * Membaca vokal pembicara per kata dengan Whisper khusus untuk 1 klip pendek [startSec, endSec].
 */
export async function syncClipWordsWithWhisper(file, startSec, endSec, onStatus = null) {
  if (onStatus) onStatus('Menyiapkan model pembaca vokal Bahasa Indonesia...', 10);
  const transcriber = await getWhisperPipeline((dlPct) => {
    if (onStatus) {
      onStatus(
        `Mengunduh model pembaca vokal Bahasa Indonesia (sekali saja, ${dlPct}%)...`,
        10 + Math.round(dlPct * 0.35)
      );
    }
  });

  if (onStatus) onStatus('Mengekstrak & menjernihkan vokal pembicara pada klip...', 50);
  const { samples } = await extractMonoAudio(file, {
    startSec,
    endSec,
    targetSampleRate: 16000
  });

  if (onStatus) onStatus('Membaca ucapan pembicara menjadi subtitle per kata...', 72);
  const words = await transcribeCleanAudioToWords(transcriber, samples, startSec, endSec);

  if (onStatus) onStatus(`Selesai membaca ${words.length} kata dari vokal pembicara!`, 100);
  return words;
}

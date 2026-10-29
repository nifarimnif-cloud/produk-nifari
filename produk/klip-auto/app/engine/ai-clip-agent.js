/**
 * Klip Auto — AI Agent Pemotong Video Otomatis End-to-End (100% di Browser)
 * Begitu pengguna memasukkan video (baik hasil unduhan YouTube maupun rekaman lokal):
 * 1. Mengenali transkrip secara otomatis (Smart Match cache YouTube < 0.1 dtk / Gemini / Akustik Vokal + Whisper Lokal)
 * 2. Mengkurasi momen skor tertinggi & menyusun Judul Hook Bahasa Indonesia yang memikat
 * 3. Memindai posisi wajah pembicara ke tengah 9:16 + menjernihkan vokal 48 kHz Stereo
 * 4. Merender klip-klip .MP4 vertikal siap tonton & siap unduh secara berurutan tanpa campur tangan manual
 */

import { extractMonoAudio } from './audio-processor.js';
import { renderClipToMp4 } from './mp4-exporter.js';
import {
  analyzePodcastWithGemini,
  buildWordsFromTextAndWindow,
  syncClipWordsWithWhisper
} from './transcriber-moments.js';
import { findMatchingYoutubeCache, normalizeTitleSlug } from './youtube-downloader.js';

const FILLER_PREFIX_WORDS = new Set([
  'jadi',
  'nah',
  'oke',
  'terus',
  'kemudian',
  'dan',
  'tapi',
  'kalau',
  'karena',
  'sebenarnya',
  'itu',
  'ini',
  'yang',
  'di',
  'ke',
  'dari',
  'ya',
  'kan',
  'lah'
]);

function formatClock(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

/**
 * Merapikan kalimat awal transkrip menjadi Judul Atas (Hook) singkat maksimal 7 kata tanpa emoji.
 */
export function craftCleanHookTitle(rawTitleOrTranscript, fallbackIndex = 1) {
  const cleaned = String(rawTitleOrTranscript || '')
    .replace(/[^\p{L}\p{N}\s.,?!:'"-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return `Sorotan Penting Pembicara #${fallbackIndex}`;
  }

  let tokens = cleaned
    .split(' ')
    .map((t) => t.replace(/^[.,?!:;'"-]+|[.,?!:;'"-]+$/g, ''))
    .filter(Boolean);

  // Buang kata sambung pembuka berulang agar judul langsung ke inti kalimat
  while (tokens.length > 5 && FILLER_PREFIX_WORDS.has(tokens[0].toLowerCase())) {
    tokens.shift();
  }

  const picked = tokens.slice(0, 7);
  if (picked.length === 0) {
    return `Sorotan Penting Pembicara #${fallbackIndex}`;
  }

  const joined = picked
    .map((w, idx) => {
      if (w.length <= 2 && idx > 0) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  return joined.slice(0, 56);
}

/**
 * Detektor segmen suara berenergi tinggi & jeda kalimat alami (bekerja < 1.5 detik bahkan untuk video 30 menit).
 */
export function pickMomentsFromAudioWaveform(samples, sampleRate, totalDurationSec, desiredCount = 5) {
  if (!samples || samples.length < sampleRate * 2 || totalDurationSec <= 1) {
    const end = Number(Math.min(totalDurationSec || 15, 20).toFixed(2));
    return [
      {
        id: 'agen-momen-1',
        title: 'Bagian Utama Pembicara',
        score: 90,
        reason: 'Segmen utama video dipilih otomatis oleh AI Agent.',
        startSec: 0,
        endSec: Math.max(1, end),
        transcript: '',
        words: []
      }
    ];
  }

  const frameSec = 0.25;
  const frameLen = Math.max(1, Math.floor(sampleRate * frameSec));
  const numFrames = Math.max(1, Math.floor(samples.length / frameLen));
  const rmsArr = new Float32Array(numFrames);

  for (let f = 0; f < numFrames; f++) {
    const start = f * frameLen;
    const end = Math.min(samples.length, start + frameLen);
    let sumSq = 0;
    for (let i = start; i < end; i++) {
      sumSq += samples[i] * samples[i];
    }
    rmsArr[f] = Math.sqrt(sumSq / Math.max(1, end - start));
  }

  // Hitung median energi untuk membedakan ucapan aktif vs jeda napas
  const sortedRms = Array.from(rmsArr).sort((a, b) => a - b);
  const medianRms = sortedRms[Math.floor(sortedRms.length * 0.55)] || 0.01;
  const pauseThreshold = Math.max(0.004, medianRms * 0.42);

  // Tentukan durasi klip ideal berdasarkan panjang video sumber
  let targetWinSec = 26;
  if (totalDurationSec <= 25) {
    targetWinSec = Math.max(6, Math.min(12, totalDurationSec * 0.55));
  } else if (totalDurationSec <= 90) {
    targetWinSec = Math.max(12, Math.min(22, totalDurationSec * 0.42));
  }

  const winFrames = Math.max(8, Math.round(targetWinSec / frameSec));
  const stepFrames = Math.max(4, Math.round(winFrames * 0.35));

  // Hindari 3% awal & akhir bila video panjang (biasanya bumper musik intro/outro)
  const marginFrames = totalDurationSec > 120 ? Math.floor(numFrames * 0.03) : 0;
  const maxStartFrame = Math.max(0, numFrames - winFrames - marginFrames);

  const candidates = [];
  for (let sFrame = marginFrames; sFrame <= maxStartFrame; sFrame += stepFrames) {
    const eFrame = Math.min(numFrames - 1, sFrame + winFrames);

    // Geser titik mulai & selesai ke lembah jeda kalimat terdekat (±1.5 detik) agar tidak memotong kata
    let snappedStart = sFrame;
    let bestStartVal = rmsArr[sFrame];
    for (let d = -5; d <= 5; d++) {
      const idx = sFrame + d;
      if (idx >= 0 && idx < eFrame - 6 && rmsArr[idx] < bestStartVal) {
        bestStartVal = rmsArr[idx];
        snappedStart = idx;
      }
    }

    let snappedEnd = eFrame;
    let bestEndVal = rmsArr[eFrame];
    for (let d = -6; d <= 6; d++) {
      const idx = eFrame + d;
      if (idx > snappedStart + 8 && idx < numFrames && rmsArr[idx] < bestEndVal) {
        bestEndVal = rmsArr[idx];
        snappedEnd = idx;
      }
    }

    let sumEnergy = 0;
    let activeSpeechFrames = 0;
    let peakEnergy = 0;
    let dynamicDiffSum = 0;
    const span = Math.max(1, snappedEnd - snappedStart);

    for (let k = snappedStart; k < snappedEnd; k++) {
      const v = rmsArr[k];
      sumEnergy += v;
      if (v > pauseThreshold) activeSpeechFrames++;
      if (v > peakEnergy) peakEnergy = v;
      if (k > snappedStart) dynamicDiffSum += Math.abs(v - rmsArr[k - 1]);
    }

    const avgEnergy = sumEnergy / span;
    const speechDensity = activeSpeechFrames / span;
    const dynamicModulation = dynamicDiffSum / span;

    // Skor komposit: kepadatan bicara (tidak banyak hening) + intonasi dinamis + kejelasan vokal
    const densityScore = speechDensity >= 0.55 && speechDensity <= 0.94 ? 14 : speechDensity * 15;
    const energyRatio = Math.min(2.2, avgEnergy / Math.max(0.002, medianRms));
    const modRatio = Math.min(2.0, dynamicModulation / Math.max(0.001, medianRms * 0.45));
    const rawScore = Math.round(68 + densityScore + energyRatio * 7 + modRatio * 5);

    const startSec = Number((snappedStart * frameSec).toFixed(2));
    const endSec = Number(Math.min(totalDurationSec, snappedEnd * frameSec).toFixed(2));
    if (endSec - startSec < 3) continue;

    candidates.push({
      startSec,
      endSec,
      score: Math.max(72, Math.min(98, rawScore)),
      speechDensity
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected = [];
  for (const cand of candidates) {
    const candLen = cand.endSec - cand.startSec;
    const overlaps = selected.some((sel) => {
      const inter = Math.max(0, Math.min(sel.endSec, cand.endSec) - Math.max(sel.startSec, cand.startSec));
      return inter > candLen * 0.25;
    });
    if (!overlaps) {
      selected.push({
        id: `agen-momen-${selected.length + 1}`,
        title: `Sorotan Inti Pembicara #${selected.length + 1}`,
        score: cand.score,
        reason: 'Puncak intonasi vokal & kepadatan kalimat tertinggi terdeteksi AI Agent.',
        startSec: cand.startSec,
        endSec: cand.endSec,
        transcript: '',
        words: []
      });
    }
    if (selected.length >= Math.max(desiredCount, 5)) break;
  }

  if (selected.length === 0) {
    const end = Number(Math.min(totalDurationSec, targetWinSec).toFixed(2));
    selected.push({
      id: 'agen-momen-1',
      title: 'Sorotan Utama Video #1',
      score: 90,
      reason: 'Segmen utama video dipilih otomatis oleh AI Agent.',
      startSec: 0,
      endSec: Math.max(1, end),
      transcript: '',
      words: []
    });
  }

  return selected;
}

async function withTimeoutOrNull(promise, timeoutMs) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      })
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Menjalankan alur kerja penuh AI Agent Pemotong Klip Otomatis.
 */
export async function runAutonomousClipAgent({
  file,
  mediaInfo,
  prebuiltMoments = null,
  geminiApiKey = '',
  clipCount = 3,
  presetId = 'kreator-kuning',
  frameMode = 'crop-fill',
  autoFaceCenter = true,
  hookStyle = 'white',
  watermarkImage = null,
  watermarkText = '',
  watermarkPos = 'top-right',
  resolution = '720p',
  voiceBoost = true,
  volumeGain = 1.0,
  monoToStereo = true,
  signal = null,
  onStage = null,
  onLog = null,
  onMomentsReady = null,
  onClipRendered = null
}) {
  const checkAbort = () => {
    if (signal?.aborted) {
      throw new DOMException('AI Agent dihentikan oleh pengguna.', 'AbortError');
    }
  };

  const emitStage = (stageIndex, stageTitle, detail, percent) => {
    if (onStage) onStage({ stageIndex, stageTitle, detail, percent });
  };
  const emitLog = (msg) => {
    if (onLog) onLog(msg);
  };

  const totalDur = Math.max(1, Number(mediaInfo?.duration || 15));
  const requestedCount = Math.max(1, Math.min(5, Number(clipCount) || 3));

  checkAbort();
  emitStage(
    1,
    'Memindai Transkrip & Gelombang Suara',
    'Memeriksa kecocokan transkrip otomatis atau mengekstrak pola bicara...',
    8
  );

  let discoveredMoments = [];
  let sourceModeLabel = 'lokal';
  let cachedMono8k = null;

  // 1A. Cek apakah momen sudah tersedia langsung (dari tombol Muat YouTube atau Video Contoh)
  if (Array.isArray(prebuiltMoments) && prebuiltMoments.length > 0) {
    discoveredMoments = prebuiltMoments.map((m, idx) => ({
      ...m,
      id: m.id || `agen-momen-${idx + 1}`,
      title: craftCleanHookTitle(m.title || m.transcript, idx + 1)
    }));
    sourceModeLabel = 'transkrip-siap';
    emitLog(`Transkrip bawaan terdeteksi langsung (${discoveredMoments.length} kandidat momen siap).`);
  }

  // 1B. Cek pencocokan pintar dengan riwayat video YouTube yang baru dicek/diunduh pembeli!
  if (discoveredMoments.length === 0) {
    const ytMatch = findMatchingYoutubeCache(file, mediaInfo);
    if (ytMatch && Array.isArray(ytMatch.moments) && ytMatch.moments.length > 0) {
      discoveredMoments = ytMatch.moments.map((m, idx) => ({
        ...m,
        id: `yt-agen-${idx + 1}`,
        title: craftCleanHookTitle(m.title || m.transcript, idx + 1)
      }));
      sourceModeLabel = 'cache-youtube';
      emitLog(
        `Video dikenali dari unduhan YouTube: ${ytMatch.wordCount} kata transkrip Bahasa Indonesia terpasang instan.`
      );
    }
  }

  // 1C. Jika belum ada transkrip dan pembeli mengisi Gemini API Key, gunakan kurasi Gemini
  if (discoveredMoments.length === 0 && String(geminiApiKey || '').trim().length > 10) {
    try {
      emitLog('Menghubungi Gemini AI untuk menyaring momen paling kuat dari rekaman...');
      const gemMoments = await analyzePodcastWithGemini({
        file,
        apiKey: geminiApiKey,
        totalDurationSec: totalDur,
        onStatus: (txt, pct) => {
          checkAbort();
          emitStage(1, 'Analisis Konteks Gemini AI', txt, Math.min(35, 8 + Math.round(pct * 0.27)));
        }
      });
      if (Array.isArray(gemMoments) && gemMoments.length > 0) {
        discoveredMoments = gemMoments.map((m, idx) => ({
          ...m,
          title: craftCleanHookTitle(m.title || m.transcript, idx + 1)
        }));
        sourceModeLabel = 'gemini';
        emitLog(`Gemini AI menemukan ${discoveredMoments.length} momen unggulan.`);
      }
    } catch (gemErr) {
      checkAbort();
      emitLog(`Kunci Gemini dilewati (${gemErr.message.slice(0, 60)}), beralih ke Mesin Vokal Lokal...`);
    }
  }

  // 1D. Mesin Vokal & Whisper Lokal 100% Tanpa API Key (cepat untuk video pendek maupun 30 menit!)
  if (discoveredMoments.length === 0) {
    emitLog('Memindai puncak intonasi vokal & batas kalimat pembicara secara lokal...');
    const scanEndSec = Math.min(totalDur, 2700); // s/d 45 menit
    const audio8k = await extractMonoAudio(file, {
      startSec: 0,
      endSec: scanEndSec,
      targetSampleRate: 8000,
      onProgress: (p) => {
        checkAbort();
        emitStage(
          1,
          'Memindai Gelombang Vokal Pembicara',
          `Membaca jalur suara video (${p}%)...`,
          8 + Math.round(p * 0.14)
        );
      }
    });
    cachedMono8k = audio8k;
    checkAbort();

    discoveredMoments = pickMomentsFromAudioWaveform(
      audio8k.samples,
      audio8k.sampleRate,
      scanEndSec,
      Math.max(requestedCount + 2, 5)
    );
    sourceModeLabel = 'akustik-whisper';
    emitLog(`Ditemukan ${discoveredMoments.length} segmen bicara berenergi tinggi pada rekaman.`);
  }

  checkAbort();

  // TAHAP 2: KURASI MOMEN TERBAIK & TRANSKRIPSI SPESIFIK POTONGAN BILA PERLU
  emitStage(
    2,
    'Mengkurasi Momen Skor Tertinggi & Hook',
    `Memilih ${Math.min(requestedCount, discoveredMoments.length)} klip paling potensial...`,
    26
  );

  discoveredMoments.sort((a, b) => (b.score || 0) - (a.score || 0));
  const chosenMoments = discoveredMoments.slice(0, requestedCount);

  // Bila kata-kata momen belum terisi (mode lokal tanpa cache YouTube), transkrip hanya potongan terpilih dengan Whisper!
  for (let i = 0; i < chosenMoments.length; i++) {
    checkAbort();
    const m = chosenMoments[i];
    if (!Array.isArray(m.words) || m.words.length === 0) {
      emitStage(
        2,
        'Menyalin Kalimat Pembicara (Whisper Lokal)',
        `Mentranskrip suara Klip #${i + 1}/${chosenMoments.length} (${formatClock(m.startSec)} – ${formatClock(m.endSec)})...`,
        28 + Math.round(((i + 0.5) / chosenMoments.length) * 14)
      );

      const whisperWords = await withTimeoutOrNull(
        syncClipWordsWithWhisper(file, m.startSec, m.endSec),
        32000
      );

      checkAbort();
      if (Array.isArray(whisperWords) && whisperWords.length > 0) {
        m.words = whisperWords;
        m.transcript = whisperWords.map((w) => w.word).join(' ');
        m.title = craftCleanHookTitle(m.transcript, i + 1);
        emitLog(`Klip #${i + 1}: ${whisperWords.length} kata berhasil disalin otomatis dari suara pembicara.`);
      } else {
        // Cadangan bersih bila browser offline dan model Whisper belum terunduh
        const fallbackLine = m.title || `Sorotan Penting Pembicara Bagian ${i + 1}`;
        const sliceMono = cachedMono8k
          ? cachedMono8k.samples.subarray(
              Math.floor(m.startSec * cachedMono8k.sampleRate),
              Math.ceil(m.endSec * cachedMono8k.sampleRate)
            )
          : null;
        m.transcript = fallbackLine;
        m.words = buildWordsFromTextAndWindow(
          fallbackLine,
          m.startSec,
          m.endSec,
          sliceMono,
          cachedMono8k ? cachedMono8k.sampleRate : 8000
        );
      }
    }
  }

  if (onMomentsReady) {
    onMomentsReady(discoveredMoments);
  }

  emitLog(
    `Kurasi selesai: memproses ${chosenMoments.length} klip terbaik (${chosenMoments
      .map((m) => `Skor ${m.score}`)
      .join(', ')}).`
  );

  // TAHAP 3 & 4: PELACAKAN WAJAH 9:16 + PENJERNIH VOKAL 48 KHZ + AUTO-RENDER MP4 BERURUTAN
  const renderedClips = [];
  const baseSlug = normalizeTitleSlug(file.name).slice(0, 32);

  for (let i = 0; i < chosenMoments.length; i++) {
    checkAbort();
    const m = chosenMoments[i];
    const clipOrdinal = i + 1;
    const basePct = 42 + Math.round((i / chosenMoments.length) * 56);
    const spanPct = Math.round(56 / chosenMoments.length);

    emitStage(
      3,
      `Mengunci Wajah & Merender Klip #${clipOrdinal}/${chosenMoments.length}`,
      `Memproses "${m.title}" (${formatClock(m.startSec)} – ${formatClock(m.endSec)})...`,
      basePct
    );
    emitLog(
      `Merender Klip #${clipOrdinal}/${chosenMoments.length} (${formatClock(m.startSec)} – ${formatClock(
        m.endSec
      )}) ke 9:16 HD + Suara 48 kHz...`
    );

    const renderRes = await renderClipToMp4({
      file,
      startSec: m.startSec,
      endSec: m.endSec,
      resolution,
      fps: 30,
      frameMode,
      autoFaceCenter,
      manualCenterXOffset: 0,
      presetId,
      words: m.words || [],
      hookTitle: m.title,
      hookStyle,
      watermarkImage,
      watermarkText,
      watermarkPos,
      watermarkOpacity: 0.88,
      voiceBoost,
      volumeGain,
      monoToStereo,
      signal,
      onProgress: ({ phase, percent }) => {
        checkAbort();
        const overallPct = Math.min(99, basePct + Math.round(((percent || 0) / 100) * spanPct));
        const stageIdx = (percent || 0) < 24 ? 3 : 4;
        emitStage(
          stageIdx,
          `Klip #${clipOrdinal}/${chosenMoments.length} · ${m.title}`,
          phase,
          overallPct
        );
      }
    });

    const objectUrl = URL.createObjectURL(renderRes.blob);
    const clipFileName = `${baseSlug}-klip-${clipOrdinal}-9x16.mp4`;
    const clipArtifact = {
      id: `agent-clip-${Date.now()}-${clipOrdinal}`,
      index: clipOrdinal,
      moment: m,
      hookTitle: m.title,
      score: m.score,
      startSec: m.startSec,
      endSec: m.endSec,
      durationSec: renderRes.durationSec,
      width: renderRes.width,
      height: renderRes.height,
      sizeBytes: renderRes.sizeBytes,
      renderSeconds: renderRes.renderSeconds,
      cameraTrack: renderRes.cameraTrack,
      blob: renderRes.blob,
      objectUrl,
      fileName: clipFileName,
      presetId
    };

    renderedClips.push(clipArtifact);
    emitLog(
      `Klip #${clipOrdinal} selesai (${renderRes.width}×${renderRes.height} · ${renderRes.durationSec.toFixed(
        1
      )} dtk · ${(renderRes.sizeBytes / (1024 * 1024)).toFixed(2)} MB).`
    );

    if (onClipRendered) {
      onClipRendered(clipArtifact, i, chosenMoments.length);
    }
  }

  emitStage(
    4,
    'AI Agent Selesai Memotong Video',
    `${renderedClips.length} klip vertikal 9:16 siap diputar, diunduh, atau dikustomisasi di Studio.`,
    100
  );

  return {
    sourceMode: sourceModeLabel,
    moments: discoveredMoments,
    clips: renderedClips
  };
}

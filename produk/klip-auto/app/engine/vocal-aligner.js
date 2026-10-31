/**
 * Klip Auto — Mesin Penyelaras Vokal Presisi Tinggi (10ms Vocal-Band VAD & Forced Syllable Alignment)
 * Memastikan setiap kata pada subtitle menyala dan padam tepat mengikuti getaran pita suara pembicara:
 * 1. Menyaring khusus pita frekuensi vokal manusia (165 Hz – 3750 Hz) agar dentuman musik/bass tidak menggeser teks.
 * 2. Mendeteksi pulau ucapan aktif (Voiced Islands) vs jeda napas nyata dengan resolusi 10 milidetik.
 * 3. Mengunci awal & akhir kata Whisper/YouTube/SRT tepat ke titik mulai suara (vocal onset) dan akhir ucapan.
 * 4. Membagi kalimat berdasarkan hitungan suku kata Bahasa Indonesia + Inggris pada kurva energi vokal nyata.
 */

const DEFAULT_FRAME_MS = 10;

/**
 * Menghitung jumlah suku kata perkiraan (Indonesia + Inggris) untuk bobot durasi pengucapan alami.
 */
export function countSpokenSyllables(word) {
  const clean = String(word || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (!clean) return 1;

  // Angka diucapkan lebih panjang (misal "99" -> sembilan puluh sembilan, "2026" -> dua ribu...)
  if (/^\d+$/.test(clean)) {
    return Math.min(6, Math.max(2, clean.length * 1.8));
  }

  // Hitung gugus vokal (a, i, u, e, o, y di akhir)
  const vowelGroups = clean.match(/[aiueoy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Koreksi akhiran bisu bahasa Inggris umum pada obrolan campur (code-switching: "update", "live", "share")
  if (clean.length > 4 && /[^aiueo]e$/.test(clean) && !/(ke|di|se|me|pe|te|be)$/.test(clean)) {
    count = Math.max(1, count - 0.4);
  }

  return Math.max(1, count);
}

/**
 * Menyaring sinyal 16 kHz ke pita vokal manusia (~165 Hz s/d ~3750 Hz) secara ringan di memori,
 * lalu menghitung amplop energi RMS tiap 10 milidetik beserta pulau-pulau bicara (Voiced Islands).
 */
export function analyzeVocalEnvelope(samples, sampleRate = 16000, offsetSec = 0, frameMs = DEFAULT_FRAME_MS) {
  const frameSamples = Math.max(16, Math.round((sampleRate * frameMs) / 1000));
  const frameSec = frameSamples / sampleRate;

  if (!samples || samples.length < frameSamples) {
    return {
      frameSec,
      offsetSec,
      rms: new Float32Array(0),
      noiseFloor: 0.002,
      speechThreshold: 0.01,
      islands: []
    };
  }

  const numFrames = Math.max(1, Math.floor(samples.length / frameSamples));
  const rms = new Float32Array(numFrames);

  // Filter IIR 1-kutub ganda: High-pass ~165 Hz (buang bass/musik) + Low-pass ~3750 Hz (buang desis)
  const dt = 1 / sampleRate;
  const rcHigh = 1 / (2 * Math.PI * 165);
  const alphaHigh = rcHigh / (rcHigh + dt);
  const rcLow = 1 / (2 * Math.PI * 3750);
  const alphaLow = dt / (rcLow + dt);

  let prevRaw = samples[0] || 0;
  let hpState = 0;
  let lpState = 0;

  for (let f = 0; f < numFrames; f++) {
    const startIdx = f * frameSamples;
    const endIdx = Math.min(samples.length, startIdx + frameSamples);
    let sumSq = 0;

    for (let i = startIdx; i < endIdx; i++) {
      const x = samples[i];
      hpState = alphaHigh * (hpState + x - prevRaw);
      prevRaw = x;
      lpState = lpState + alphaLow * (hpState - lpState);
      sumSq += lpState * lpState;
    }

    rms[f] = Math.sqrt(sumSq / Math.max(1, endIdx - startIdx));
  }

  // Haluskan kurva RMS (jendela 30ms) agar konsonan letup singkat tidak memutus kata
  const smoothed = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    const a = f > 0 ? rms[f - 1] : rms[f];
    const b = rms[f];
    const c = f + 1 < numFrames ? rms[f + 1] : rms[f];
    smoothed[f] = a * 0.25 + b * 0.5 + c * 0.25;
  }

  // Hitung ambang adaptif antara lantai derau (persentil 18%) dan puncak bicara (persentil 88%)
  const sorted = Array.from(smoothed).sort((x, y) => x - y);
  const p18 = sorted[Math.floor(sorted.length * 0.18)] || 0.001;
  const p88 = sorted[Math.floor(sorted.length * 0.88)] || 0.02;
  const dynamicRange = Math.max(0.004, p88 - p18);
  const speechThreshold = Math.max(p18 * 1.85, p18 + dynamicRange * 0.17, 0.0045);

  // Bentuk pulau bicara awal
  const rawIslands = [];
  let inSpeech = false;
  let islandStartFrame = 0;

  for (let f = 0; f < numFrames; f++) {
    const active = smoothed[f] >= speechThreshold;
    if (active && !inSpeech) {
      inSpeech = true;
      // Mundur 2 frame (20ms) untuk menangkap konsonan awal kata seperti 'k', 's', 't', 'p'
      islandStartFrame = Math.max(0, f - 2);
    } else if (!active && inSpeech) {
      inSpeech = false;
      // Maju 3 frame (30ms) untuk menangkap ekor vokal akhir kata
      const endFrame = Math.min(numFrames, f + 3);
      rawIslands.push({ startFrame: islandStartFrame, endFrame });
    }
  }
  if (inSpeech) {
    rawIslands.push({ startFrame: islandStartFrame, endFrame: numFrames });
  }

  // Gabungkan jeda mikro < 85ms (penutupan bibir konsonan di tengah kalimat)
  const minGapFrames = Math.max(1, Math.round(0.085 / frameSec));
  const minIslandFrames = Math.max(3, Math.round(0.06 / frameSec));
  const mergedIslands = [];

  for (const isl of rawIslands) {
    if (mergedIslands.length === 0) {
      mergedIslands.push({ ...isl });
      continue;
    }
    const prev = mergedIslands[mergedIslands.length - 1];
    if (isl.startFrame - prev.endFrame <= minGapFrames) {
      prev.endFrame = Math.max(prev.endFrame, isl.endFrame);
    } else {
      mergedIslands.push({ ...isl });
    }
  }

  const islands = [];
  for (const isl of mergedIslands) {
    if (isl.endFrame - isl.startFrame < minIslandFrames) continue;
    let energySum = 0;
    let peakVal = 0;
    for (let f = isl.startFrame; f < isl.endFrame; f++) {
      energySum += smoothed[f];
      if (smoothed[f] > peakVal) peakVal = smoothed[f];
    }
    islands.push({
      startSec: Number((offsetSec + isl.startFrame * frameSec).toFixed(3)),
      endSec: Number((offsetSec + isl.endFrame * frameSec).toFixed(3)),
      startFrame: isl.startFrame,
      endFrame: isl.endFrame,
      energyIntegral: energySum,
      peakRms: peakVal
    });
  }

  return {
    frameSec,
    offsetSec,
    rms: smoothed,
    noiseFloor: p18,
    speechThreshold,
    islands
  };
}

/**
 * Mencari titik lembah energi lokal (batas antar kata/konsonan) terdekat di sekitar target detik.
 */
function snapBoundaryToConsonantDip(targetSec, minSec, maxSec, env) {
  if (!env || !env.rms || env.rms.length === 0) return targetSec;
  const searchRadiusSec = 0.065;
  const loSec = Math.max(minSec, targetSec - searchRadiusSec);
  const hiSec = Math.min(maxSec, targetSec + searchRadiusSec);
  if (hiSec <= loSec) return targetSec;

  const f0 = Math.max(0, Math.floor((loSec - env.offsetSec) / env.frameSec));
  const f1 = Math.min(env.rms.length - 1, Math.ceil((hiSec - env.offsetSec) / env.frameSec));
  if (f1 <= f0) return targetSec;

  let bestFrame = Math.round((targetSec - env.offsetSec) / env.frameSec);
  bestFrame = Math.max(f0, Math.min(f1, bestFrame));
  let bestVal = env.rms[bestFrame] ?? Infinity;

  for (let f = f0; f <= f1; f++) {
    // Beri sedikit penalti jarak agar tidak melenceng terlalu jauh dari proporsi suku kata
    const distSec = Math.abs(env.offsetSec + f * env.frameSec - targetSec);
    const penalized = env.rms[f] + distSec * 0.035;
    if (penalized < bestVal) {
      bestVal = penalized;
      bestFrame = f;
    }
  }

  return Number((env.offsetSec + bestFrame * env.frameSec).toFixed(3));
}

/**
 * Membagi sekumpulan token kata ke dalam 1 rentang bicara [segStart, segEnd]
 * berdasarkan bobot suku kata + kurva energi vokal kumulatif + lembah konsonan.
 */
function distributeTokensInsideVoicedSpan(tokens, segStart, segEnd, env) {
  if (!tokens || tokens.length === 0) return [];
  const span = Math.max(0.12, segEnd - segStart);

  if (tokens.length === 1) {
    return [
      {
        word: tokens[0],
        start: Number(segStart.toFixed(3)),
        end: Number(Math.max(segStart + 0.09, segEnd).toFixed(3))
      }
    ];
  }

  const weights = tokens.map((tok) => {
    const syl = countSpokenSyllables(tok);
    const charBonus = Math.min(1.4, tok.replace(/[^a-zA-Z0-9]/g, '').length * 0.08);
    const punctBonus = /[,;:]$/.test(tok) ? 0.35 : /[.!?]$/.test(tok) ? 0.55 : 0;
    return syl + charBonus + punctBonus;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  const out = [];
  let cursor = segStart;
  let accWeight = 0;

  for (let i = 0; i < tokens.length; i++) {
    accWeight += weights[i];
    const isLast = i === tokens.length - 1;
    const idealEnd = isLast ? segEnd : segStart + (accWeight / totalWeight) * span;

    const remainingTokens = tokens.length - 1 - i;
    const maxAllowedEnd = segEnd - remainingTokens * 0.075;
    const minAllowedEnd = cursor + 0.075;

    const snappedEnd = isLast
      ? segEnd
      : snapBoundaryToConsonantDip(
          Math.max(minAllowedEnd, Math.min(maxAllowedEnd, idealEnd)),
          minAllowedEnd,
          Math.max(minAllowedEnd, maxAllowedEnd),
          env
        );

    const hasPunctPause = /[,;:.!?]$/.test(tokens[i]) && !isLast;
    const wordEnd = hasPunctPause ? Math.max(cursor + 0.075, snappedEnd - 0.025) : snappedEnd;

    out.push({
      word: tokens[i],
      start: Number(cursor.toFixed(3)),
      end: Number(Math.max(cursor + 0.075, wordEnd).toFixed(3))
    });

    cursor = snappedEnd;
  }

  return out;
}

/**
 * Memetakan teks kalimat ke pulau-pulau vokal aktif (Voiced Islands) di dalam [windowStart, windowEnd]
 * sehingga kata TIDAK PERNAH berjalan sendiri saat pembicara sedang jeda napas / hening!
 */
export function alignTextToVocalWaveform(
  text,
  windowStartSec,
  windowEndSec,
  monoSamples = null,
  sampleRate = 16000
) {
  const cleanTokens = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleanTokens.length === 0) return [];

  const safeStart = Math.max(0, Number(windowStartSec) || 0);
  const safeEnd = Math.max(safeStart + 0.25, Number(windowEndSec) || safeStart + 1);

  if (!monoSamples || monoSamples.length < sampleRate * 0.12) {
    return distributeTokensInsideVoicedSpan(cleanTokens, safeStart + 0.04, safeEnd - 0.06, null);
  }

  const env = analyzeVocalEnvelope(monoSamples, sampleRate, safeStart);
  const activeIslands = env.islands.filter(
    (isl) => isl.endSec > safeStart + 0.02 && isl.startSec < safeEnd - 0.02
  );

  if (activeIslands.length === 0) {
    return distributeTokensInsideVoicedSpan(cleanTokens, safeStart + 0.04, safeEnd - 0.06, env);
  }

  // Jika hanya 1 pulau bicara utuh, langsung kunci awal & akhir ke pulau vokal tersebut!
  if (activeIslands.length === 1 || cleanTokens.length <= 2) {
    const firstStart = Math.max(safeStart, activeIslands[0].startSec);
    const lastEnd = Math.min(safeEnd, activeIslands[activeIslands.length - 1].endSec);
    return distributeTokensInsideVoicedSpan(cleanTokens, firstStart, Math.max(firstStart + 0.15, lastEnd), env);
  }

  // Jika ada beberapa pulau bicara (dipisahkan jeda napas nyata >= 110ms), alokasikan kata proporsional
  // terhadap durasi & energi tiap pulau vokal + tanda baca klausa!
  const significantIslands = [];
  for (const isl of activeIslands) {
    const prev = significantIslands[significantIslands.length - 1];
    if (prev && isl.startSec - prev.endSec < 0.14) {
      prev.endSec = isl.endSec;
      prev.energyIntegral += isl.energyIntegral;
    } else {
      significantIslands.push({ ...isl });
    }
  }

  if (significantIslands.length === 1) {
    const isl = significantIslands[0];
    return distributeTokensInsideVoicedSpan(
      cleanTokens,
      Math.max(safeStart, isl.startSec),
      Math.min(safeEnd, isl.endSec),
      env
    );
  }

  const totalIslandDur = significantIslands.reduce(
    (acc, isl) => acc + Math.max(0.08, isl.endSec - isl.startSec),
    0
  );
  const tokenSyllables = cleanTokens.map((t) => countSpokenSyllables(t));
  const totalSyllables = tokenSyllables.reduce((a, b) => a + b, 0) || 1;

  const result = [];
  let tokenCursor = 0;
  let consumedIslandDur = 0;

  for (let idx = 0; idx < significantIslands.length; idx++) {
    const isl = significantIslands[idx];
    const remainingIslands = significantIslands.length - 1 - idx;
    const remainingTokens = cleanTokens.length - tokenCursor;
    if (remainingTokens <= 0) break;

    if (remainingIslands === 0) {
      const sliceTokens = cleanTokens.slice(tokenCursor);
      result.push(
        ...distributeTokensInsideVoicedSpan(
          sliceTokens,
          Math.max(safeStart, isl.startSec),
          Math.min(safeEnd, isl.endSec),
          env
        )
      );
      break;
    }

    consumedIslandDur += Math.max(0.08, isl.endSec - isl.startSec);
    const targetSyllablesCum = (consumedIslandDur / totalIslandDur) * totalSyllables;

    let bestEndTokenIdx = tokenCursor + 1;
    let runningSyl = 0;
    for (let k = 0; k < cleanTokens.length; k++) {
      runningSyl += tokenSyllables[k];
      if (k >= tokenCursor && k < cleanTokens.length - remainingIslands) {
        bestEndTokenIdx = k + 1;
        // Utamakan berhenti tepat di koma/titik dekat batas jeda napas!
        if (runningSyl >= targetSyllablesCum * 0.86 && /[,;:.!?]$/.test(cleanTokens[k])) {
          break;
        }
        if (runningSyl >= targetSyllablesCum) {
          break;
        }
      }
    }

    const maxTake = cleanTokens.length - remainingIslands;
    bestEndTokenIdx = Math.max(tokenCursor + 1, Math.min(maxTake, bestEndTokenIdx));
    const sliceTokens = cleanTokens.slice(tokenCursor, bestEndTokenIdx);
    tokenCursor = bestEndTokenIdx;

    result.push(
      ...distributeTokensInsideVoicedSpan(
        sliceTokens,
        Math.max(safeStart, isl.startSec),
        Math.min(safeEnd, isl.endSec),
        env
      )
    );
  }

  return result;
}

/**
 * Mengunci daftar kata ber-timestamp kasar (dari Whisper atau YouTube) ke pulau vokal nyata:
 * - Mencegah kata pertama muncul saat pembicara belum buka mulut (hening di awal).
 * - Memotong ekor kata yang menggantung panjang di ruang hening jeda napas.
 * - Memperbaiki kata yang bertumpuk atau berdurasi terlalu sempit (< 75ms).
 */
export function refineWhisperWordsWithVocal(rawWords, monoSamples, sampleRate = 16000, offsetSec = 0, maxEndSec = null) {
  if (!Array.isArray(rawWords) || rawWords.length === 0) return [];
  const validWords = rawWords
    .filter((w) => w && String(w.word || '').trim())
    .map((w) => ({
      word: String(w.word).trim(),
      start: Number(w.start ?? offsetSec),
      end: Number(w.end ?? offsetSec + 0.2)
    }));
  if (validWords.length === 0) return [];

  const clipEnd =
    maxEndSec != null
      ? maxEndSec
      : offsetSec + (monoSamples ? monoSamples.length / sampleRate : 60);

  if (!monoSamples || monoSamples.length < sampleRate * 0.1) {
    return validWords;
  }

  const env = analyzeVocalEnvelope(monoSamples, sampleRate, offsetSec);
  if (env.islands.length === 0) {
    return validWords;
  }

  const firstVocalOnset = env.islands[0].startSec;
  const lastVocalOffset = env.islands[env.islands.length - 1].endSec;

  // 1. Jika kata pertama jatuh di ruang hening sebelum pembicara bersuara, geser ke vocal onset asli!
  if (validWords[0].start < firstVocalOnset - 0.03 && firstVocalOnset - validWords[0].start < 2.8) {
    const dur = Math.max(0.11, Math.min(0.45, validWords[0].end - validWords[0].start));
    validWords[0].start = firstVocalOnset;
    validWords[0].end = Math.max(firstVocalOnset + 0.09, Math.min(clipEnd, firstVocalOnset + dur));
  }

  // 2. Kunci setiap kata agar tidak melintasi jeda hening panjang (> 160ms) atau menggantung di udara kosong
  for (let i = 0; i < validWords.length; i++) {
    const w = validWords[i];
    const prevEnd = i > 0 ? validWords[i - 1].end : offsetSec;
    if (w.start < prevEnd - 0.01) {
      w.start = prevEnd;
    }

    // Cari pulau vokal yang bersinggungan atau paling dekat dalam radius 320ms
    const overlapping = env.islands.filter(
      (isl) => isl.endSec >= w.start - 0.06 && isl.startSec <= w.end + 0.06
    );

    if (overlapping.length > 0) {
      const firstIsl = overlapping[0];
      // Bila awal kata masih di hening sebelum pulau vokal dimulai, majukan ke awal vokal!
      if (w.start < firstIsl.startSec - 0.025 && firstIsl.startSec - w.start <= 0.45) {
        w.start = Math.max(prevEnd, firstIsl.startSec);
      }
      // Bila kata merentang melewati jeda napas ke pulau kedua padahal cuma 1 kata, potong di akhir pulau pertama!
      if (overlapping.length >= 2 && firstIsl.endSec > w.start + 0.08) {
        const gapAfterFirst = overlapping[1].startSec - firstIsl.endSec;
        if (gapAfterFirst >= 0.14) {
          w.end = firstIsl.endSec;
        }
      } else {
        const lastIsl = overlapping[overlapping.length - 1];
        if (w.end > lastIsl.endSec + 0.05 && w.end - lastIsl.endSec <= 1.5) {
          w.end = Math.max(w.start + 0.085, lastIsl.endSec);
        }
      }
    } else {
      // Kata jatuh tepat di sela hening: tarik ke pulau bicara terdekat jika jaraknya <= 280ms
      let nearest = null;
      let bestDist = Infinity;
      for (const isl of env.islands) {
        const dist =
          w.end < isl.startSec
            ? isl.startSec - w.end
            : w.start > isl.endSec
            ? w.start - isl.endSec
            : 0;
        if (dist < bestDist) {
          bestDist = dist;
          nearest = isl;
        }
      }
      if (nearest && bestDist <= 0.28) {
        const dur = Math.max(0.09, Math.min(0.36, w.end - w.start));
        if (w.start < nearest.startSec) {
          w.start = Math.max(prevEnd, nearest.startSec);
          w.end = Math.min(nearest.endSec, w.start + dur);
        } else if (w.end > nearest.endSec) {
          w.end = nearest.endSec;
          w.start = Math.max(prevEnd, Math.max(nearest.startSec, w.end - dur));
        }
      }
    }

    // Pastikan durasi minimum wajar sesuai suku kata & tidak menabrak kata berikutnya
    const minDur = Math.min(0.22, 0.065 + countSpokenSyllables(w.word) * 0.03);
    if (w.end - w.start < minDur) {
      const nextStart = i + 1 < validWords.length ? validWords[i + 1].start : lastVocalOffset;
      w.end = Math.min(clipEnd, Math.max(w.start + 0.075, Math.min(w.start + minDur, nextStart + 0.02)));
    }

    w.start = Number(Math.max(offsetSec, w.start).toFixed(3));
    w.end = Number(Math.max(w.start + 0.075, Math.min(clipEnd, w.end)).toFixed(3));
  }

  // 3. Pastikan kata terakhir tidak menggantung melampaui akhir vokal pembicara
  const lastWord = validWords[validWords.length - 1];
  if (lastWord.end > lastVocalOffset + 0.08 && lastVocalOffset > lastWord.start + 0.08) {
    lastWord.end = Number((lastVocalOffset + 0.04).toFixed(3));
  }

  return validWords;
}

/**
 * Menggeser titik potong awal & akhir klip ke jeda napas hening terdekat
 * agar klip tidak pernah memotong ucapan pembicara di tengah kata/kalimat.
 */
export function snapClipBoundsToBreathPause(startSec, endSec, env, totalDurationSec) {
  if (!env || !env.islands || env.islands.length === 0) {
    return {
      startSec: Number(Math.max(0, startSec).toFixed(2)),
      endSec: Number(Math.min(totalDurationSec, endSec).toFixed(2))
    };
  }

  let bestStart = startSec;
  let bestEnd = endSec;

  // Jika startSec memotong pulau bicara, mundurkan sedikit ke awal pulau tersebut (-0.12s)
  for (const isl of env.islands) {
    if (startSec > isl.startSec && startSec < isl.endSec) {
      if (startSec - isl.startSec <= 1.8) {
        bestStart = Math.max(0, isl.startSec - 0.12);
      }
      break;
    }
  }

  // Jika endSec memotong pulau bicara, panjangkan sedikit sampai pulau kalimat selesai (+0.18s)
  for (const isl of env.islands) {
    if (endSec > isl.startSec && endSec < isl.endSec) {
      if (isl.endSec - endSec <= 2.2) {
        bestEnd = Math.min(totalDurationSec, isl.endSec + 0.18);
      }
      break;
    }
  }

  if (bestEnd <= bestStart + 1.5) {
    bestEnd = Math.min(totalDurationSec, bestStart + Math.max(3, endSec - startSec));
  }

  return {
    startSec: Number(Math.max(0, bestStart).toFixed(2)),
    endSec: Number(Math.min(totalDurationSec, bestEnd).toFixed(2))
  };
}

/**
 * Klip Auto — Deteksi Wajah Otomatis, Pemilih Pembicara Aktif, & Peredam Guncangan Kamera 9:16
 * Menggunakan MediaPipe Face Detector (@mediapipe/tasks-vision) ditambah analisis gerak mulut/wajah
 * agar pada podcast 2 orang kamera fokus ke orang yang sedang bicara (bukan tembok kosong di tengah).
 */

let cachedDetectorPromise = null;

async function loadMediaPipeDetector() {
  if (cachedDetectorPromise) return cachedDetectorPromise;
  cachedDetectorPromise = (async () => {
    try {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      const detector = await vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'CPU'
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.45
      });
      return detector;
    } catch {
      return null;
    }
  })();
  return cachedDetectorPromise;
}

/**
 * Menghitung aktivitas gerak piksel di dalam kotak [nx0..nx1, ny0..ny1] (skala 0..1)
 * untuk mengetahui wajah mana yang mulut/kepalanya sedang aktif berbicara.
 */
function measureRegionMotion(currRgba, prevRgba, pw, ph, nx0, ny0, nx1, ny1) {
  if (!prevRgba) return 0;
  const x0 = Math.max(0, Math.floor(nx0 * pw));
  const x1 = Math.min(pw, Math.ceil(nx1 * pw));
  const y0 = Math.max(0, Math.floor(ny0 * ph));
  const y1 = Math.min(ph, Math.ceil(ny1 * ph));
  if (x1 <= x0 || y1 <= y0) return 0;

  let diffSum = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (y * pw + x) * 4;
      diffSum +=
        Math.abs(currRgba[idx] - prevRgba[idx]) +
        Math.abs(currRgba[idx + 1] - prevRgba[idx + 1]) +
        Math.abs(currRgba[idx + 2] - prevRgba[idx + 2]);
      count++;
    }
  }
  return count > 0 ? diffSum / count : 0;
}

/**
 * Cadangan lokal: mencari puncak subjek paling aktif (rona wajah + gerak bicara) per kolom,
 * sehingga bila ada 2 orang kiri & kanan tidak pernah dirata-rata ke tembok tengah (0.5).
 */
function estimateActiveSubjectPeak(currRgba, prevRgba, pw, ph) {
  const numBins = 16;
  const binScores = new Float32Array(numBins);
  const yStart = Math.floor(ph * 0.12);
  const yEnd = Math.floor(ph * 0.68);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = (y * pw + x) * 4;
      const r = currRgba[idx];
      const g = currRgba[idx + 1];
      const b = currRgba[idx + 2];

      const isWarmSkin =
        r > 75 && g > 40 && b > 25 &&
        r > g && r > b &&
        (r - Math.min(g, b)) > 18;

      let motion = 0;
      if (prevRgba) {
        motion =
          (Math.abs(r - prevRgba[idx]) +
            Math.abs(g - prevRgba[idx + 1]) +
            Math.abs(b - prevRgba[idx + 2])) /
          3;
      }

      if (isWarmSkin || motion > 14) {
        const bin = Math.min(numBins - 1, Math.floor((x / pw) * numBins));
        const skinWeight = isWarmSkin ? 1.0 + (r - b) / 80 : 0.15;
        const motionBoost = 1.0 + Math.min(4.0, motion / 8);
        binScores[bin] += skinWeight * motionBoost;
      }
    }
  }

  // Haluskan antar bin bertetangga (3-tap) lalu pilih puncak tertinggi (bukan rata-rata global!)
  let bestBin = -1;
  let bestVal = 0;
  for (let b = 0; b < numBins; b++) {
    const left = b > 0 ? binScores[b - 1] * 0.5 : 0;
    const right = b < numBins - 1 ? binScores[b + 1] * 0.5 : 0;
    const smoothed = left + binScores[b] + right;
    if (smoothed > bestVal) {
      bestVal = smoothed;
      bestBin = b;
    }
  }

  if (bestBin === -1 || bestVal < 18) return null;
  return Math.max(0.14, Math.min(0.86, (bestBin + 0.5) / numBins));
}

/**
 * Menghaluskan jejak koordinat X wajah agar kamera 9:16 tenang (deadzone),
 * halus saat pembicara bergeser pelan, namun sigap pindah saat ganti pembicara.
 */
export function stabilizeCameraTrack(rawKeyframes) {
  if (!rawKeyframes || rawKeyframes.length === 0) {
    return [{ time: 0, centerX: 0.5 }];
  }

  const stabilized = [];
  let lockedX = rawKeyframes[0].centerX ?? 0.5;
  const DEADZONE = 0.055;
  const CUT_THRESHOLD = 0.22;

  for (let i = 0; i < rawKeyframes.length; i++) {
    const pt = rawKeyframes[i];
    const targetX = pt.centerX;

    if (targetX == null || Number.isNaN(targetX)) {
      stabilized.push({ time: pt.time, centerX: lockedX });
      continue;
    }

    const diff = targetX - lockedX;
    const absDiff = Math.abs(diff);

    if (absDiff <= DEADZONE) {
      // Tetap tenang di dalam deadzone
    } else if (absDiff >= CUT_THRESHOLD) {
      const nextPt = rawKeyframes[i + 1];
      if (!nextPt || nextPt.centerX == null || Math.abs(nextPt.centerX - targetX) < 0.15) {
        lockedX = targetX;
      }
    } else {
      lockedX = lockedX + diff * 0.30;
    }

    stabilized.push({
      time: pt.time,
      centerX: Math.max(0.12, Math.min(0.88, lockedX))
    });
  }

  return stabilized;
}

/**
 * Mengambil nilai centerX (0..1) yang terinterpolasi mulus pada waktu `timeSec`.
 */
export function sampleCameraCenterX(track, timeSec, manualOffset = 0) {
  if (!track || track.length === 0) {
    return Math.max(0, Math.min(1, 0.5 + manualOffset));
  }
  if (timeSec <= track[0].time) {
    return Math.max(0, Math.min(1, track[0].centerX + manualOffset));
  }
  const last = track[track.length - 1];
  if (timeSec >= last.time) {
    return Math.max(0, Math.min(1, last.centerX + manualOffset));
  }

  let lo = 0;
  let hi = track.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (track[mid].time <= timeSec) lo = mid;
    else hi = mid;
  }

  const a = track[lo];
  const b = track[hi];
  const jump = Math.abs(b.centerX - a.centerX);
  let val = a.centerX;

  if (jump < 0.20 && b.time > a.time) {
    const t = (timeSec - a.time) / (b.time - a.time);
    val = a.centerX + (b.centerX - a.centerX) * t;
  }

  return Math.max(0, Math.min(1, val + manualOffset));
}

/**
 * Memindai posisi wajah pembicara aktif sepanjang klip [startSec, endSec].
 */
export async function buildFaceTrackForClip({
  canvasSink,
  startSec,
  endSec,
  sampleIntervalSec = 0.25,
  onProgress = null
}) {
  const detector = await loadMediaPipeDetector();
  const timestamps = [];
  for (let t = startSec; t <= endSec + 0.001; t += sampleIntervalSec) {
    timestamps.push(Math.min(endSec, Number(t.toFixed(3))));
  }
  if (timestamps.length === 0) timestamps.push(startSec);

  const probeCanvas = document.createElement('canvas');
  probeCanvas.width = 160;
  probeCanvas.height = 90;
  const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true });

  const mpBridgeCanvas = document.createElement('canvas');
  const mpBridgeCtx = mpBridgeCanvas.getContext('2d');

  const rawPoints = [];
  let prevRgba = null;
  let lastSpeakerX = null;
  let idx = 0;

  for await (const wrapped of canvasSink.canvasesAtTimestamps(timestamps)) {
    const t = timestamps[idx] ?? startSec;
    idx++;

    let detectedX = null;
    if (wrapped && wrapped.canvas) {
      const srcW = wrapped.canvas.width;
      const srcH = wrapped.canvas.height;

      probeCtx.drawImage(wrapped.canvas, 0, 0, probeCanvas.width, probeCanvas.height);
      const currRgba = new Uint8ClampedArray(
        probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data
      );

      if (detector && srcW > 0 && srcH > 0) {
        try {
          let targetEl = wrapped.canvas;
          if (!(targetEl instanceof HTMLCanvasElement)) {
            mpBridgeCanvas.width = Math.min(640, srcW);
            mpBridgeCanvas.height = Math.round(mpBridgeCanvas.width * (srcH / srcW));
            mpBridgeCtx.drawImage(wrapped.canvas, 0, 0, mpBridgeCanvas.width, mpBridgeCanvas.height);
            targetEl = mpBridgeCanvas;
          }
          const res = detector.detect(targetEl);
          if (res && res.detections && res.detections.length > 0) {
            let bestScore = -1;
            for (const det of res.detections) {
              const bb = det.boundingBox;
              if (!bb) continue;
              const nx0 = bb.originX / targetEl.width;
              const ny0 = bb.originY / targetEl.height;
              const nw = bb.width / targetEl.width;
              const nh = bb.height / targetEl.height;
              const centerX = nx0 + nw / 2;

              // Ukur gerak rahang/mulut (paruh bawah wajah) supaya pada podcast 2 orang fokus ke yang sedang bicara
              const mouthMotion = measureRegionMotion(
                currRgba,
                prevRgba,
                probeCanvas.width,
                probeCanvas.height,
                nx0,
                ny0 + nh * 0.45,
                nx0 + nw,
                ny0 + nh * 1.05
              );

              const areaScore = nw * nh;
              const conf = det.categories?.[0]?.score ?? 0.6;
              const continuityBonus =
                lastSpeakerX != null && Math.abs(centerX - lastSpeakerX) < 0.12 ? 1.18 : 1.0;
              const totalWeight = areaScore * conf * (1 + mouthMotion * 0.25) * continuityBonus;

              if (totalWeight > bestScore) {
                bestScore = totalWeight;
                detectedX = centerX;
              }
            }
          }
        } catch {
          detectedX = null;
        }
      }

      if (detectedX == null) {
        detectedX = estimateActiveSubjectPeak(
          currRgba,
          prevRgba,
          probeCanvas.width,
          probeCanvas.height
        );
      }

      prevRgba = currRgba;
      if (detectedX != null) {
        lastSpeakerX = detectedX;
      }
    }

    rawPoints.push({ time: t, centerX: detectedX });
    if (onProgress) {
      onProgress(Math.round((idx / timestamps.length) * 100));
    }
  }

  let firstValid = rawPoints.find((p) => p.centerX != null)?.centerX ?? 0.5;
  for (const p of rawPoints) {
    if (p.centerX == null) p.centerX = firstValid;
    else firstValid = p.centerX;
  }

  return stabilizeCameraTrack(rawPoints);
}

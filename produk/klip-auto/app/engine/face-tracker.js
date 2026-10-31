/**
 * Klip Auto — Deteksi Otomatis 1 atau 2 Wajah, Podcast Split Tanpa Keyframe, & Peredam Kamera 9:16
 * Menggunakan MediaPipe Face Detector (@mediapipe/tasks-vision) + analisis gerak mulut/subjek:
 * - Mendeteksi otomatis apakah klip berisi 1 pembicara (Fullscreen Tengah) atau 2 pembicara (Podcast Split Atas-Bawah)
 * - Mengunci koordinat pembicara kiri & kanan tanpa perlu keyframe manual
 * - Mendeteksi kotak facecam pojok untuk mode Gaming Split (Pro)
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
 * Cadangan lokal: mendeteksi 1 atau 2 puncak subjek manusia (rona wajah + gerak bicara) per kolom,
 * sehingga podcast 2 orang kiri-kanan maupun 1 pembicara tetap terdeteksi akurat walau offline.
 */
function estimateSubjectPeaks(currRgba, prevRgba, pw, ph) {
  const numBins = 16;
  const skinScores = new Float32Array(numBins);
  const activeScores = new Float32Array(numBins);
  const yStart = Math.floor(ph * 0.10);
  const yEnd = Math.floor(ph * 0.70);

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

      const bin = Math.min(numBins - 1, Math.floor((x / pw) * numBins));
      if (isWarmSkin) {
        const w = 1.0 + (r - b) / 80;
        skinScores[bin] += w;
        activeScores[bin] += w * (1.0 + Math.min(4.0, motion / 8));
      } else if (motion > 14) {
        activeScores[bin] += 0.18 * (1.0 + Math.min(3.5, motion / 9));
      }
    }
  }

  const smoothSkin = new Float32Array(numBins);
  const smoothActive = new Float32Array(numBins);
  for (let b = 0; b < numBins; b++) {
    smoothSkin[b] =
      (b > 0 ? skinScores[b - 1] * 0.45 : 0) +
      skinScores[b] +
      (b < numBins - 1 ? skinScores[b + 1] * 0.45 : 0);
    smoothActive[b] =
      (b > 0 ? activeScores[b - 1] * 0.45 : 0) +
      activeScores[b] +
      (b < numBins - 1 ? activeScores[b + 1] * 0.45 : 0);
  }

  // Cek puncak kiri (bin 1..6) vs puncak kanan (bin 9..14) untuk mendeteksi 2 pembicara bersebelahan
  let leftBestBin = -1;
  let leftBestSkin = 0;
  for (let b = 1; b <= 6; b++) {
    if (smoothSkin[b] > leftBestSkin) {
      leftBestSkin = smoothSkin[b];
      leftBestBin = b;
    }
  }

  let rightBestBin = -1;
  let rightBestSkin = 0;
  for (let b = 9; b <= 14; b++) {
    if (smoothSkin[b] > rightBestSkin) {
      rightBestSkin = smoothSkin[b];
      rightBestBin = b;
    }
  }

  const midValley = (smoothSkin[7] + smoothSkin[8]) * 0.5;
  const hasTwoSubjects =
    leftBestSkin >= 22 &&
    rightBestSkin >= 22 &&
    rightBestBin - leftBestBin >= 4 &&
    midValley < Math.min(leftBestSkin, rightBestSkin) * 0.72;

  let bestActiveBin = -1;
  let bestActiveVal = 0;
  for (let b = 0; b < numBins; b++) {
    if (smoothActive[b] > bestActiveVal) {
      bestActiveVal = smoothActive[b];
      bestActiveBin = b;
    }
  }

  const activeX =
    bestActiveBin !== -1 && bestActiveVal >= 18
      ? Math.max(0.14, Math.min(0.86, (bestActiveBin + 0.5) / numBins))
      : null;

  if (hasTwoSubjects) {
    return {
      faceCount: 2,
      activeX: activeX ?? 0.3,
      leftX: Math.max(0.16, Math.min(0.45, (leftBestBin + 0.5) / numBins)),
      rightX: Math.max(0.55, Math.min(0.84, (rightBestBin + 0.5) / numBins)),
      leftY: 0.36,
      rightY: 0.36
    };
  }

  return {
    faceCount: activeX != null ? 1 : 0,
    activeX,
    leftX: null,
    rightX: null,
    leftY: null,
    rightY: null
  };
}

function medianOf(arr, fallback) {
  if (!arr || arr.length === 0) return fallback;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Menghaluskan jejak koordinat X wajah agar kamera 9:16 tenang (deadzone),
 * halus saat pembicara bergeser pelan, namun sigap pindah saat ganti pembicara.
 */
export function stabilizeCameraTrack(rawKeyframes, meta = null) {
  if (!rawKeyframes || rawKeyframes.length === 0) {
    const fallback = [{ time: 0, centerX: 0.5 }];
    if (meta) fallback.meta = meta;
    return fallback;
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

  if (meta) {
    stabilized.meta = meta;
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
 * Mengembalikan mode framing konkret ('crop-fill', 'podcast-split', 'blur-fit', 'gaming-split')
 * apabila pembeli memilih mode 'auto' (Otomatis Deteksi 1 atau 2 Wajah).
 */
export function resolveEffectiveFrameMode(requestedFrameMode, cameraTrack) {
  if (requestedFrameMode && requestedFrameMode !== 'auto') {
    return requestedFrameMode;
  }
  const meta = cameraTrack?.meta;
  if (meta && meta.detectedFaces >= 2) {
    return 'podcast-split';
  }
  return 'crop-fill';
}

/**
 * Memindai posisi wajah (1 atau 2 orang sekaligus) sepanjang klip [startSec, endSec].
 * Menghasilkan array jejak kamera + properti `.meta` berisi jumlah wajah, koordinat Podcast Split,
 * dan koordinat facecam pojok (untuk Gaming Split).
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
  const mpLeftXs = [];
  const mpLeftYs = [];
  const mpRightXs = [];
  const mpRightYs = [];
  const heurLeftXs = [];
  const heurLeftYs = [];
  const heurRightXs = [];
  const heurRightYs = [];
  const cornerCams = [];
  let mpAnyFaceFrames = 0;
  let mpTwoFaceFrames = 0;
  let heurTwoFaceFrames = 0;
  let validFrames = 0;

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
      validFrames++;

      probeCtx.drawImage(wrapped.canvas, 0, 0, probeCanvas.width, probeCanvas.height);
      const currRgba = new Uint8ClampedArray(
        probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data
      );

      let frameFaces = [];

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
              if (nw < 0.025 || nh < 0.04) continue;

              const centerX = nx0 + nw / 2;
              const centerY = ny0 + nh / 2;

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

              frameFaces.push({ centerX, centerY, nw, nh, conf, areaScore });

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

      if (frameFaces.length >= 1) {
        mpAnyFaceFrames++;
      }

      if (frameFaces.length >= 2) {
        const sortedByX = [...frameFaces].sort((a, b) => a.centerX - b.centerX);
        const fLeft = sortedByX[0];
        const fRight = sortedByX[sortedByX.length - 1];
        if (fRight.centerX - fLeft.centerX >= 0.18) {
          mpTwoFaceFrames++;
          mpLeftXs.push(fLeft.centerX);
          mpLeftYs.push(fLeft.centerY);
          mpRightXs.push(fRight.centerX);
          mpRightYs.push(fRight.centerY);
        }
      } else if (frameFaces.length === 1) {
        const f = frameFaces[0];
        // Cek apakah wajah berukuran kecil di area pojok layar (ciri khas facecam game)
        const nearSide = f.centerX < 0.28 || f.centerX > 0.72;
        const nearVertEdge = f.centerY < 0.36 || f.centerY > 0.64;
        if (f.nw < 0.26 && nearSide && nearVertEdge) {
          cornerCams.push({ centerX: f.centerX, centerY: f.centerY, nw: f.nw, nh: f.nh });
        }
      }

      if (detectedX == null || frameFaces.length === 0) {
        const heur = estimateSubjectPeaks(currRgba, prevRgba, probeCanvas.width, probeCanvas.height);
        if (detectedX == null) {
          detectedX = heur.activeX;
        }
        if (heur.faceCount >= 2 && frameFaces.length === 0) {
          heurTwoFaceFrames++;
          heurLeftXs.push(heur.leftX);
          heurLeftYs.push(heur.leftY);
          heurRightXs.push(heur.rightX);
          heurRightYs.push(heur.rightY);
        }
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

  // Bila MediaPipe mendeteksi wajah manusia asli pada >= 20% frame, gunakan hitungan MediaPipe murni
  // agar latar/meja berwarna hangat pada B-roll tidak disalahartikan sebagai pembicara kedua.
  const useMediaPipeCounts = mpAnyFaceFrames >= Math.max(2, validFrames * 0.2);
  const twoFaceRatio = useMediaPipeCounts
    ? mpTwoFaceFrames / Math.max(1, mpAnyFaceFrames)
    : validFrames > 0
    ? heurTwoFaceFrames / validFrames
    : 0;
  const detectedFaces = useMediaPipeCounts
    ? twoFaceRatio >= 0.40
      ? 2
      : 1
    : twoFaceRatio >= 0.28
    ? 2
    : 1;

  const leftXs = useMediaPipeCounts && mpLeftXs.length > 0 ? mpLeftXs : heurLeftXs;
  const leftYs = useMediaPipeCounts && mpLeftYs.length > 0 ? mpLeftYs : heurLeftYs;
  const rightXs = useMediaPipeCounts && mpRightXs.length > 0 ? mpRightXs : heurRightXs;
  const rightYs = useMediaPipeCounts && mpRightYs.length > 0 ? mpRightYs : heurRightYs;

  let facecamBox = null;
  if (cornerCams.length > 0) {
    facecamBox = {
      centerX: Number(medianOf(cornerCams.map((c) => c.centerX), 0.82).toFixed(3)),
      centerY: Number(medianOf(cornerCams.map((c) => c.centerY), 0.76).toFixed(3)),
      nw: Number(medianOf(cornerCams.map((c) => c.nw), 0.14).toFixed(3)),
      nh: Number(medianOf(cornerCams.map((c) => c.nh), 0.22).toFixed(3))
    };
  }

  const meta = {
    detectedFaces,
    recommendedMode: detectedFaces >= 2 ? 'podcast-split' : 'crop-fill',
    twoFaceRatio: Number(twoFaceRatio.toFixed(2)),
    leftSpeakerX: Number(Math.max(0.15, Math.min(0.46, medianOf(leftXs, 0.28))).toFixed(3)),
    leftSpeakerY: Number(Math.max(0.18, Math.min(0.55, medianOf(leftYs, 0.36))).toFixed(3)),
    rightSpeakerX: Number(Math.max(0.54, Math.min(0.85, medianOf(rightXs, 0.72))).toFixed(3)),
    rightSpeakerY: Number(Math.max(0.18, Math.min(0.55, medianOf(rightYs, 0.36))).toFixed(3)),
    facecamBox
  };

  return stabilizeCameraTrack(rawPoints, meta);
}

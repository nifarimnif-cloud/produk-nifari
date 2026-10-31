/**
 * Klip Auto — Mesin Render & Ekspor MP4 9:16 (Akselerasi GPU + Fallback CPU Otomatis)
 * Menghasilkan file .mp4 standar (H.264 video + AAC audio, fastStart) yang siap diunggah ke
 * Reels, TikTok, Shorts, atau dikirim lewat WhatsApp.
 */

import {
  ALL_FORMATS,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH
} from '../vendor/mediabunny.min.mjs';
import { extractClipAudioBuffer } from './audio-processor.js';
import {
  drawClipFrame,
  ensureCaptionFontLoaded,
  groupWordsIntoPhrases
} from './caption-presets.js';
import {
  buildFaceTrackForClip,
  resolveEffectiveFrameMode,
  sampleCameraCenterX
} from './face-tracker.js';
import { ensureZeroMissClipSubtitles } from './transcriber-moments.js';

/**
 * Memeriksa apakah akselerasi GPU perangkat tersedia untuk resolusi target.
 */
async function probeGpuEncodeSupport(width, height, fps = 30) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoEncoder.isConfigSupported !== 'function') {
    return false;
  }
  const codecs = ['avc1.640028', 'avc1.4d0028', 'avc1.42001f'];
  for (const codec of codecs) {
    try {
      const res = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware'
      });
      if (res && res.supported) return true;
    } catch {
      // Lanjut codec berikutnya
    }
  }
  return false;
}

/**
 * Merender potongan video [startSec, endSec] menjadi file MP4 vertikal 9:16 lengkap dengan
 * deteksi 1/2 wajah otomatis (Fullscreen / Podcast Split / Cinema Blur / Gaming Split),
 * caption per kata sinkron vokal, judul pembuka 3 detik, dan akselerasi GPU -> fallback CPU otomatis.
 */
export async function renderClipToMp4({
  file,
  startSec,
  endSec,
  resolution = '720p', // '720p' (720x1280 cepat) atau '1080p' (1080x1920 tajam)
  fps = 30,
  frameMode = 'auto', // 'auto' | 'crop-fill' | 'podcast-split' | 'blur-fit' | 'gaming-split'
  autoFaceCenter = true,
  manualCenterXOffset = 0,
  prebuiltCameraTrack = null,
  presetId = 'kreator-kuning',
  fontFamilyId = 'jakarta',
  fontScale = 1.0,
  textCase = 'auto',
  words = [],
  fullSourceWords = null,
  captionOffsetSec = 0,
  hookTitle = '',
  hookStyle = 'white',
  hookDurationSec = 3.0,
  forceCpuMode = false,
  watermarkImage = null,
  watermarkText = '',
  watermarkPos = 'top-right',
  watermarkOpacity = 0.85,
  voiceBoost = true,
  volumeGain = 1.0,
  monoToStereo = true,
  signal = null,
  onProgress = null
}) {
  const startedAtMs = performance.now();
  const clipDuration = Math.max(0.5, endSec - startSec);
  const targetWidth = resolution === '1080p' ? 1080 : 720;
  const targetHeight = resolution === '1080p' ? 1920 : 1280;

  const checkAbort = () => {
    if (signal && signal.aborted) {
      throw new DOMException('Proses render dibatalkan oleh pengguna.', 'AbortError');
    }
  };

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS
  });

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error('Tidak ditemukan jalur video pada file yang dipilih.');
    }

    const canvasSink = new CanvasSink(videoTrack);

    // 1. Pindai posisi 1 atau 2 wajah pembicara di sepanjang klip (kecuali sudah dipindai & sama rentangnya)
    let cameraTrack = prebuiltCameraTrack;
    const needsFaceScan =
      !cameraTrack &&
      (frameMode === 'auto' ||
        frameMode === 'podcast-split' ||
        frameMode === 'gaming-split' ||
        (autoFaceCenter && frameMode === 'crop-fill'));

    if (needsFaceScan) {
      if (onProgress) {
        onProgress({
          phase: 'Mendeteksi 1 atau 2 wajah pembicara & komposisi layar...',
          percent: 4
        });
      }
      cameraTrack = await buildFaceTrackForClip({
        canvasSink,
        startSec,
        endSec,
        sampleIntervalSec: 0.3,
        onProgress: (p) => {
          checkAbort();
          if (onProgress) {
            onProgress({
              phase: `Memindai posisi wajah pembicara (${p}%)...`,
              percent: 4 + Math.round(p * 0.14)
            });
          }
        }
      });
    } else if (!cameraTrack) {
      cameraTrack = [{ time: startSec, centerX: 0.5 }];
    }

    const effectiveFrameMode = resolveEffectiveFrameMode(frameMode, cameraTrack);
    checkAbort();

    // 2. Siapkan potongan suara jernih 48 kHz Stereo [startSec, endSec]
    if (onProgress) {
      onProgress({
        phase: voiceBoost
          ? 'Menjernihkan vokal & menormalkan jalur suara 48 kHz...'
          : 'Menyiapkan jalur suara klip 48 kHz...',
        percent: 20
      });
    }
    const clipAudioBuffer = await extractClipAudioBuffer(file, startSec, endSec, {
      voiceBoost,
      volumeGain,
      monoToStereo
    });
    checkAbort();

    // 3. Tentukan urutan percobaan akselerasi: GPU dulu (bila ada), gagal -> otomatis pindah ke CPU!
    const gpuAvailable = !forceCpuMode && (await probeGpuEncodeSupport(targetWidth, targetHeight, fps));
    const encodeModesToTry = gpuAvailable
      ? [
          { hw: 'prefer-hardware', label: 'GPU', code: 'gpu' },
          { hw: 'prefer-software', label: 'CPU', code: 'cpu' },
          { hw: 'no-preference', label: 'CPU Standar', code: 'cpu' }
        ]
      : [
          { hw: 'prefer-software', label: 'CPU', code: 'cpu' },
          { hw: 'no-preference', label: 'CPU Standar', code: 'cpu' }
        ];

    const totalFrames = Math.max(1, Math.round(clipDuration * fps));
    const timestamps = new Array(totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      timestamps[i] = Math.min(endSec, startSec + i / fps);
    }

    // Pastikan font subtitle pilihan sudah dimuat penuh di memori browser sebelum menggambar frame #1
    await ensureCaptionFontLoaded(
      fontFamilyId,
      Math.round(targetWidth * 0.064 * Math.max(0.75, Number(fontScale) || 1))
    );

    // Pastikan tidak ada kata di tepi klip yang hilang & otomatis baca vokal bila kata belum tersedia
    let verifiedWords = Array.isArray(words) ? words : [];
    if (
      (Array.isArray(fullSourceWords) && fullSourceWords.length > 0) ||
      verifiedWords.length === 0
    ) {
      verifiedWords = await ensureZeroMissClipSubtitles({
        file,
        startSec,
        endSec,
        words: verifiedWords,
        fullSourceWords,
        allowWhisperGapFill: verifiedWords.length === 0,
        onStatus: (txt) => {
          if (onProgress) onProgress({ phase: txt, percent: 22 });
        }
      });
    }

    const activeWords = (verifiedWords || []).filter((w) => w.end >= startSec && w.start <= endSec);
    const phraseGroups = groupWordsIntoPhrases(activeWords, 4);

    let finalMp4Blob = null;
    let usedEncoderMode = 'cpu';
    let lastEncodeError = null;

    for (let attemptIdx = 0; attemptIdx < encodeModesToTry.length; attemptIdx++) {
      checkAbort();
      const attempt = encodeModesToTry[attemptIdx];
      let attemptOutput = null;

      if (attemptIdx > 0 && onProgress) {
        onProgress({
          phase: `Akselerasi GPU gagal/tidak didukung, otomatis berpindah ke mode ${attempt.label}...`,
          percent: 23
        });
      }

      try {
        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = targetWidth;
        renderCanvas.height = targetHeight;
        const renderCtx = renderCanvas.getContext('2d', { alpha: false });

        const bufferTarget = new BufferTarget();
        attemptOutput = new Output({
          format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
          target: bufferTarget
        });

        const videoSource = new CanvasSource(renderCanvas, {
          codec: 'avc',
          quality: QUALITY_HIGH,
          keyFrameInterval: 2,
          hardwareAcceleration: attempt.hw
        });
        const audioSource = new AudioBufferSource({
          codec: 'aac',
          quality: QUALITY_HIGH
        });

        attemptOutput.addVideoTrack(videoSource);
        attemptOutput.addAudioTrack(audioSource);
        await attemptOutput.start();
        await audioSource.add(clipAudioBuffer);

        let frameIndex = 0;
        let lastValidCanvas = null;
        const encodeStartMs = performance.now();

        for await (const wrapped of canvasSink.canvasesAtTimestamps(timestamps)) {
          checkAbort();

          const absTimeSec = timestamps[frameIndex];
          const outTimeSec = frameIndex / fps;
          const srcCanvas = wrapped?.canvas || lastValidCanvas;
          if (wrapped?.canvas) {
            lastValidCanvas = wrapped.canvas;
          }

          const centerX = autoFaceCenter
            ? sampleCameraCenterX(cameraTrack, absTimeSec, manualCenterXOffset)
            : Math.max(0, Math.min(1, 0.5 + manualCenterXOffset));

          drawClipFrame(renderCtx, {
            source: srcCanvas,
            sourceWidth: srcCanvas ? srcCanvas.width : targetWidth,
            sourceHeight: srcCanvas ? srcCanvas.height : targetHeight,
            targetWidth,
            targetHeight,
            currentTimeSec: absTimeSec,
            clipStartSec: startSec,
            centerX,
            frameMode: effectiveFrameMode,
            cameraMeta: cameraTrack?.meta || null,
            presetId,
            fontFamilyId,
            fontScale,
            textCase,
            phraseGroups,
            captionOffsetSec,
            hookTitle,
            hookStyle,
            hookDurationSec,
            watermarkImage,
            watermarkText,
            watermarkPos,
            watermarkOpacity
          });

          await videoSource.add(outTimeSec, 1 / fps);
          frameIndex++;

          if (onProgress && (frameIndex % 5 === 0 || frameIndex === totalFrames)) {
            const elapsedSec = Math.max(0.1, (performance.now() - encodeStartMs) / 1000);
            const currentFps = Math.round(frameIndex / elapsedSec);
            const remainingFrames = totalFrames - frameIndex;
            const etaSec = currentFps > 0 ? Math.ceil(remainingFrames / currentFps) : 0;
            const pct = 24 + Math.round((frameIndex / totalFrames) * 72);
            onProgress({
              phase: `Merender 9:16 [${attempt.label}] (${frameIndex}/${totalFrames} frame • ${currentFps} fps)...`,
              percent: Math.min(96, pct),
              fps: currentFps,
              etaSec,
              encoderMode: attempt.code
            });
          }
        }

        if (onProgress) {
          onProgress({
            phase: 'Menyelesaikan pembungkusan file MP4...',
            percent: 98
          });
        }

        await attemptOutput.finalize();
        finalMp4Blob = new Blob([bufferTarget.buffer], { type: 'video/mp4' });
        usedEncoderMode = attempt.code;
        break;
      } catch (encErr) {
        if (attemptOutput && attemptOutput.state === 'started') {
          try {
            await attemptOutput.cancel();
          } catch {}
        }
        if (encErr?.name === 'AbortError' || signal?.aborted) {
          throw encErr;
        }
        lastEncodeError = encErr;
      }
    }

    if (!finalMp4Blob) {
      throw lastEncodeError || new Error('Gagal merender video MP4 pada perangkat ini.');
    }

    const renderSeconds = Number(((performance.now() - startedAtMs) / 1000).toFixed(2));

    if (onProgress) {
      onProgress({
        phase: `Selesai dalam ${renderSeconds} detik (mode ${usedEncoderMode.toUpperCase()})!`,
        percent: 100,
        encoderMode: usedEncoderMode
      });
    }

    return {
      blob: finalMp4Blob,
      sizeBytes: finalMp4Blob.size,
      durationSec: clipDuration,
      width: targetWidth,
      height: targetHeight,
      renderSeconds,
      encoderMode: usedEncoderMode,
      effectiveFrameMode,
      detectedFaces: cameraTrack?.meta?.detectedFaces || 1,
      cameraTrack
    };
  } finally {
    input.dispose();
  }
}

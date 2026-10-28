/**
 * Klip Auto — Mesin Render & Ekspor MP4 9:16 Berakselerasi GPU (WebCodecs + Mediabunny)
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
import { drawClipFrame, groupWordsIntoPhrases } from './caption-presets.js';
import { buildFaceTrackForClip, sampleCameraCenterX } from './face-tracker.js';

/**
 * Merender potongan video [startSec, endSec] menjadi file MP4 vertikal 9:16 lengkap dengan
 * wajah tengah otomatis, caption per kata, judul atas, dan logo/watermark pembeli.
 */
export async function renderClipToMp4({
  file,
  startSec,
  endSec,
  resolution = '720p', // '720p' (720x1280 cepat) atau '1080p' (1080x1920 tajam)
  fps = 30,
  frameMode = 'crop-fill', // 'crop-fill' atau 'blur-fit'
  autoFaceCenter = true,
  manualCenterXOffset = 0,
  presetId = 'kreator-kuning',
  words = [],
  hookTitle = '',
  hookStyle = 'white',
  watermarkImage = null,
  watermarkText = '',
  watermarkPos = 'top-right',
  watermarkOpacity = 0.85,
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

  let output = null;

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new Error('Tidak ditemukan jalur video pada file yang dipilih.');
    }

    const canvasSink = new CanvasSink(videoTrack);

    // 1. Pindai posisi wajah pembicara di sepanjang klip bila fitur Wajah Tengah aktif
    let cameraTrack = [{ time: startSec, centerX: 0.5 }];
    if (autoFaceCenter && frameMode === 'crop-fill') {
      if (onProgress) {
        onProgress({
          phase: 'Memindai posisi wajah pembicara...',
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
    }

    checkAbort();

    // 2. Siapkan potongan suara jernih [startSec, endSec]
    if (onProgress) {
      onProgress({
        phase: 'Menyiapkan jalur suara jernih...',
        percent: 20
      });
    }
    const clipAudioBuffer = await extractClipAudioBuffer(file, startSec, endSec);
    checkAbort();

    // 3. Siapkan kanvas komposisi 9:16 & Muxer Output MP4
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = targetWidth;
    renderCanvas.height = targetHeight;
    const renderCtx = renderCanvas.getContext('2d', { alpha: false });

    const bufferTarget = new BufferTarget();
    output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: bufferTarget
    });

    const videoSource = new CanvasSource(renderCanvas, {
      codec: 'avc',
      quality: QUALITY_HIGH,
      keyFrameInterval: 2
    });
    const audioSource = new AudioBufferSource({
      codec: 'aac',
      quality: QUALITY_HIGH
    });

    output.addVideoTrack(videoSource);
    output.addAudioTrack(audioSource);
    await output.start();

    // Masukkan audio klip lebih dulu
    await audioSource.add(clipAudioBuffer);

    // 4. Render frame demi frame pada 30 FPS menggunakan CanvasSink.canvasesAtTimestamps
    const totalFrames = Math.max(1, Math.round(clipDuration * fps));
    const timestamps = new Array(totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      timestamps[i] = Math.min(endSec, startSec + i / fps);
    }

    const activeWords = (words || []).filter((w) => w.end >= startSec && w.start <= endSec);
    const phraseGroups = groupWordsIntoPhrases(activeWords, 4);

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
        centerX,
        frameMode,
        presetId,
        phraseGroups,
        hookTitle,
        hookStyle,
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
          phase: `Merender klip 9:16 (${frameIndex}/${totalFrames} frame • ${currentFps} fps)...`,
          percent: Math.min(96, pct),
          fps: currentFps,
          etaSec
        });
      }
    }

    if (onProgress) {
      onProgress({
        phase: 'Menyelesaikan pembungkusan file MP4...',
        percent: 98
      });
    }

    await output.finalize();

    const mp4Blob = new Blob([bufferTarget.buffer], { type: 'video/mp4' });
    const renderSeconds = Number(((performance.now() - startedAtMs) / 1000).toFixed(2));

    if (onProgress) {
      onProgress({
        phase: `Selesai dalam ${renderSeconds} detik!`,
        percent: 100
      });
    }

    return {
      blob: mp4Blob,
      sizeBytes: mp4Blob.size,
      durationSec: clipDuration,
      width: targetWidth,
      height: targetHeight,
      renderSeconds,
      cameraTrack
    };
  } catch (err) {
    if (output && output.state === 'started') {
      try {
        await output.cancel();
      } catch {}
    }
    throw err;
  } finally {
    input.dispose();
  }
}

/**
 * Klip Auto — Pengendali Utama Wizard 3 Langkah & Pratinjau Kanvas 9:16
 */

import { ALL_FORMATS, BlobSource, CanvasSink, Input } from './vendor/mediabunny.min.mjs';
import { createSamplePodcastMp4, probeMediaFile } from './engine/audio-processor.js';
import { CAPTION_PRESETS, drawClipFrame, groupWordsIntoPhrases } from './engine/caption-presets.js';
import { buildFaceTrackForClip, sampleCameraCenterX } from './engine/face-tracker.js';
import { renderClipToMp4 } from './engine/mp4-exporter.js';
import {
  analyzePodcastWithGemini,
  buildWordsFromTextAndWindow,
  syncClipWordsWithWhisper,
  transcribeAndPickWithWhisperWeb
} from './engine/transcriber-moments.js';

const STORAGE_KEY_GEMINI = 'klip_auto_gemini_key';
const STORAGE_KEY_THEME = 'klip_auto_theme';

const state = {
  file: null,
  videoObjectUrl: null,
  resultObjectUrl: null,
  mediaInfo: null,
  moments: [],
  selectedMomentId: null,
  startSec: 0,
  endSec: 15,
  words: [],
  phraseGroups: [],
  presetId: 'kreator-kuning',
  frameMode: 'crop-fill',
  autoFaceCenter: true,
  manualOffset: 0,
  previewCameraTrack: [{ time: 0, centerX: 0.5 }],
  hookTitle: '',
  hookStyle: 'white',
  watermarkText: '',
  watermarkPos: 'top-right',
  watermarkImage: null,
  resolution: '720p',
  renderAbortController: null
};

// Elemen DOM
const el = {
  themeToggle: document.getElementById('theme-toggle'),
  stepTabs: Array.from(document.querySelectorAll('.step-tab')),
  panels: {
    1: document.getElementById('panel-step-1'),
    2: document.getElementById('panel-step-2'),
    3: document.getElementById('panel-step-3')
  },
  globalError: document.getElementById('global-error'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('video-file-input'),
  btnPickFile: document.getElementById('btn-pick-file'),
  btnLoadSample: document.getElementById('btn-load-sample'),
  fileSummary: document.getElementById('file-summary'),
  fileSummaryText: document.getElementById('file-summary-text'),
  btnSkipToStep2: document.getElementById('btn-skip-to-step2'),
  step1Status: document.getElementById('step1-status'),
  step1StatusText: document.getElementById('step1-status-text'),
  step1ProgressFill: document.getElementById('step1-progress-fill'),
  geminiKeyInput: document.getElementById('gemini-key-input'),
  btnAnalyzeGemini: document.getElementById('btn-analyze-gemini'),
  btnAnalyzeWhisper: document.getElementById('btn-analyze-whisper'),

  momentsContainer: document.getElementById('moments-container'),
  clipStartInput: document.getElementById('clip-start-input'),
  clipEndInput: document.getElementById('clip-end-input'),
  clipTranscriptInput: document.getElementById('clip-transcript-input'),
  step2Status: document.getElementById('step2-status'),
  step2StatusText: document.getElementById('step2-status-text'),
  step2ProgressFill: document.getElementById('step2-progress-fill'),
  btnResyncWhisper: document.getElementById('btn-resync-whisper'),
  btnGoStep3: document.getElementById('btn-go-step3'),

  previewCanvas: document.getElementById('preview-canvas'),
  hiddenVideo: document.getElementById('hidden-preview-video'),
  btnTogglePlay: document.getElementById('btn-toggle-play'),
  previewTimeLabel: document.getElementById('preview-time-label'),
  presetGrid: document.getElementById('preset-grid'),
  frameModeSelect: document.getElementById('frame-mode-select'),
  autoFaceCheckbox: document.getElementById('auto-face-checkbox'),
  manualOffsetRange: document.getElementById('manual-offset-range'),
  btnScanFacePreview: document.getElementById('btn-scan-face-preview'),
  hookTitleInput: document.getElementById('hook-title-input'),
  hookStyleSelect: document.getElementById('hook-style-select'),
  watermarkTextInput: document.getElementById('watermark-text-input'),
  watermarkPosSelect: document.getElementById('watermark-pos-select'),
  watermarkFileInput: document.getElementById('watermark-file-input'),
  resolutionSelect: document.getElementById('resolution-select'),
  btnRenderMp4: document.getElementById('btn-render-mp4'),
  btnCancelRender: document.getElementById('btn-cancel-render'),
  renderStatus: document.getElementById('render-status'),
  renderStatusText: document.getElementById('render-status-text'),
  renderProgressFill: document.getElementById('render-progress-fill'),
  resultBox: document.getElementById('result-box'),
  resultMeta: document.getElementById('result-meta'),
  resultVideo: document.getElementById('result-video'),
  btnDownloadMp4: document.getElementById('btn-download-mp4')
};

const previewCtx = el.previewCanvas.getContext('2d');

function showError(msg) {
  if (!msg) {
    el.globalError.style.display = 'none';
    el.globalError.textContent = '';
    return;
  }
  el.globalError.textContent = msg;
  el.globalError.style.display = 'block';
}

function setStatusBar(boxEl, textEl, fillEl, visible, text = '', pct = 0) {
  boxEl.style.display = visible ? 'block' : 'none';
  if (visible) {
    textEl.textContent = text;
    fillEl.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  }
}

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function switchStep(stepNum) {
  showError('');
  if (stepNum > 1 && !state.file) {
    showError('Pilih file video dulu atau klik tombol "Coba Video Contoh" di Langkah 1.');
    return;
  }
  for (const tab of el.stepTabs) {
    const s = Number(tab.dataset.step);
    tab.classList.toggle('active', s === stepNum);
  }
  for (const [k, panel] of Object.entries(el.panels)) {
    panel.classList.toggle('active', Number(k) === stepNum);
  }
  if (stepNum === 3) {
    syncPreviewToStart();
    renderPreviewOnce();
  } else {
    el.hiddenVideo.pause();
    updatePlayButtonText();
  }
}

// Inisialisasi Tema & API Key Tersimpan
function initPreferences() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  el.themeToggle.textContent = savedTheme === 'dark' ? 'Mode Terang' : 'Mode Gelap';

  el.themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem(STORAGE_KEY_THEME, cur);
    el.themeToggle.textContent = cur === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  });

  const savedKey = localStorage.getItem(STORAGE_KEY_GEMINI) || '';
  el.geminiKeyInput.value = savedKey;
  el.geminiKeyInput.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEY_GEMINI, el.geminiKeyInput.value.trim());
  });
}

// Render Tombol 6 Preset Gaya Caption
function renderPresetButtons() {
  el.presetGrid.innerHTML = '';
  for (const p of CAPTION_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-btn ${p.id === state.presetId ? 'active' : ''}`;
    btn.dataset.presetId = p.id;
    btn.innerHTML = `<strong>${p.name}</strong><span>${p.desc}</span>`;
    btn.addEventListener('click', () => {
      state.presetId = p.id;
      for (const b of el.presetGrid.querySelectorAll('.preset-btn')) {
        b.classList.toggle('active', b.dataset.presetId === p.id);
      }
      renderPreviewOnce();
    });
    el.presetGrid.appendChild(btn);
  }
}

function rebuildPhrases() {
  const active = (state.words || []).filter((w) => w.end >= state.startSec && w.start <= state.endSec);
  state.phraseGroups = groupWordsIntoPhrases(active, 4);
}

function renderMomentsCards() {
  el.momentsContainer.innerHTML = '';
  if (!state.moments || state.moments.length === 0) {
    return;
  }

  for (const m of state.moments) {
    const card = document.createElement('div');
    card.className = `moment-card ${m.id === state.selectedMomentId ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="moment-top">
        <span class="score-pill">Skor ${m.score}/100</span>
        <span class="time-pill">${formatDuration(m.startSec)} – ${formatDuration(m.endSec)}</span>
      </div>
      <h4>${m.title}</h4>
      <p>${m.reason}</p>
    `;
    card.addEventListener('click', () => applyMomentSelection(m));
    el.momentsContainer.appendChild(card);
  }
}

function applyMomentSelection(moment) {
  state.selectedMomentId = moment.id;
  state.startSec = moment.startSec;
  state.endSec = moment.endSec;
  state.hookTitle = moment.title || '';
  state.words = Array.isArray(moment.words) && moment.words.length > 0
    ? moment.words.map((w) => ({ ...w }))
    : buildWordsFromTextAndWindow(moment.transcript || '', moment.startSec, moment.endSec);

  el.clipStartInput.value = state.startSec.toFixed(1);
  el.clipEndInput.value = state.endSec.toFixed(1);
  el.clipTranscriptInput.value = moment.transcript || state.words.map((w) => w.word).join(' ');
  el.hookTitleInput.value = state.hookTitle;

  rebuildPhrases();
  renderMomentsCards();
}

async function handleSelectedVideoFile(file, prebuiltMoments = null) {
  showError('');
  setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, true, 'Membaca informasi video...', 35);

  try {
    const info = await probeMediaFile(file);
    state.file = file;
    state.mediaInfo = info;

    if (state.videoObjectUrl) URL.revokeObjectURL(state.videoObjectUrl);
    state.videoObjectUrl = URL.createObjectURL(file);
    el.hiddenVideo.src = state.videoObjectUrl;
    el.hiddenVideo.load();

    const defaultEnd = Number(Math.min(info.duration, Math.max(1, Math.min(45, info.duration))).toFixed(1));
    state.startSec = 0;
    state.endSec = defaultEnd;
    el.clipStartInput.max = String(Math.max(0, info.duration - 0.5));
    el.clipEndInput.max = String(info.duration);
    el.clipStartInput.value = '0';
    el.clipEndInput.value = String(defaultEnd);

    const mb = (info.sizeBytes / (1024 * 1024)).toFixed(1);
    el.fileSummaryText.textContent = `${file.name} • Durasi ${formatDuration(info.duration)} (${info.duration.toFixed(1)} dtk) • ${info.width}×${info.height} • ${mb} MB`;
    el.fileSummary.style.display = 'flex';

    el.btnAnalyzeGemini.disabled = false;
    el.btnAnalyzeWhisper.disabled = false;

    if (prebuiltMoments && prebuiltMoments.length > 0) {
      state.moments = prebuiltMoments;
      applyMomentSelection(prebuiltMoments[0]);
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      switchStep(2);
    } else {
      state.moments = [];
      state.selectedMomentId = null;
      const defaultCaption = 'Ketik kalimat pembicara di sini atau gunakan fitur transkrip otomatis di Langkah 1.';
      el.clipTranscriptInput.value = defaultCaption;
      state.words = buildWordsFromTextAndWindow(defaultCaption, state.startSec, state.endSec);
      rebuildPhrases();
      renderMomentsCards();
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    }
  } catch (err) {
    setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    showError(err.message || 'Gagal membuka file video tersebut.');
  }
}

// Pratinjau Kanvas Real-Time 9:16
function syncPreviewToStart() {
  if (!state.file) return;
  if (el.hiddenVideo.currentTime < state.startSec || el.hiddenVideo.currentTime > state.endSec) {
    el.hiddenVideo.currentTime = state.startSec;
  }
}

function updatePlayButtonText() {
  el.btnTogglePlay.textContent = el.hiddenVideo.paused ? 'Putar Preview' : 'Jeda Preview';
}

function renderPreviewOnce() {
  if (!state.file) return;
  const cur = el.hiddenVideo.currentTime || state.startSec;
  const relCur = Math.max(0, cur - state.startSec);
  const clipDur = Math.max(0.5, state.endSec - state.startSec);
  el.previewTimeLabel.textContent = `${relCur.toFixed(1)}s / ${clipDur.toFixed(1)}s`;

  const centerX = state.autoFaceCenter
    ? sampleCameraCenterX(state.previewCameraTrack, cur, state.manualOffset)
    : Math.max(0, Math.min(1, 0.5 + state.manualOffset));

  drawClipFrame(previewCtx, {
    source: el.hiddenVideo,
    sourceWidth: el.hiddenVideo.videoWidth || state.mediaInfo?.width || 1280,
    sourceHeight: el.hiddenVideo.videoHeight || state.mediaInfo?.height || 720,
    targetWidth: el.previewCanvas.width,
    targetHeight: el.previewCanvas.height,
    currentTimeSec: cur,
    centerX,
    frameMode: state.frameMode,
    presetId: state.presetId,
    phraseGroups: state.phraseGroups,
    hookTitle: state.hookTitle,
    hookStyle: state.hookStyle,
    watermarkImage: state.watermarkImage,
    watermarkText: state.watermarkText,
    watermarkPos: state.watermarkPos,
    watermarkOpacity: 0.88
  });
}

function previewAnimationLoop() {
  if (!el.hiddenVideo.paused && !el.hiddenVideo.ended) {
    if (el.hiddenVideo.currentTime >= state.endSec) {
      el.hiddenVideo.currentTime = state.startSec;
    }
    renderPreviewOnce();
  }
  requestAnimationFrame(previewAnimationLoop);
}

// Event Listeners
function bindEvents() {
  for (const tab of el.stepTabs) {
    tab.addEventListener('click', () => switchStep(Number(tab.dataset.step)));
  }

  el.btnPickFile.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) handleSelectedVideoFile(f);
  });

  el.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.dropzone.classList.add('dragover');
  });
  el.dropzone.addEventListener('dragleave', () => el.dropzone.classList.remove('dragover'));
  el.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropzone.classList.remove('dragover');
    const f = e.dataTransfer?.files?.[0];
    if (f) handleSelectedVideoFile(f);
  });

  el.btnLoadSample.addEventListener('click', async () => {
    showError('');
    el.btnLoadSample.disabled = true;
    setStatusBar(
      el.step1Status,
      el.step1StatusText,
      el.step1ProgressFill,
      true,
      'Membuat video contoh podcast 2 pembicara (16 detik)...',
      15
    );
    try {
      const { file, moments } = await createSamplePodcastMp4((pct) => {
        setStatusBar(
          el.step1Status,
          el.step1StatusText,
          el.step1ProgressFill,
          true,
          `Menyiapkan video contoh (${pct}%)...`,
          pct
        );
      });
      await handleSelectedVideoFile(file, moments);
    } catch (err) {
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      showError(err.message || 'Gagal menyiapkan video contoh.');
    } finally {
      el.btnLoadSample.disabled = false;
    }
  });

  el.btnSkipToStep2.addEventListener('click', () => switchStep(2));

  el.btnAnalyzeGemini.addEventListener('click', async () => {
    if (!state.file) return;
    showError('');
    el.btnAnalyzeGemini.disabled = true;
    try {
      const moments = await analyzePodcastWithGemini({
        file: state.file,
        apiKey: el.geminiKeyInput.value,
        totalDurationSec: state.mediaInfo.duration,
        onStatus: (txt, pct) => {
          setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, true, txt, pct);
        }
      });
      state.moments = moments;
      applyMomentSelection(moments[0]);
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      switchStep(2);
    } catch (err) {
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      showError(err.message);
    } finally {
      el.btnAnalyzeGemini.disabled = false;
    }
  });

  el.btnAnalyzeWhisper.addEventListener('click', async () => {
    if (!state.file) return;
    showError('');
    el.btnAnalyzeWhisper.disabled = true;
    try {
      const moments = await transcribeAndPickWithWhisperWeb({
        file: state.file,
        totalDurationSec: state.mediaInfo.duration,
        onStatus: (txt, pct) => {
          setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, true, txt, pct);
        }
      });
      state.moments = moments;
      applyMomentSelection(moments[0]);
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      switchStep(2);
    } catch (err) {
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      showError(err.message);
    } finally {
      el.btnAnalyzeWhisper.disabled = false;
    }
  });

  const handleClipTimeEdit = () => {
    if (!state.mediaInfo) return;
    let s = Math.max(0, Number(el.clipStartInput.value) || 0);
    let e = Math.min(state.mediaInfo.duration, Number(el.clipEndInput.value) || s + 5);
    if (e <= s + 0.5) e = Math.min(state.mediaInfo.duration, s + 1);
    state.startSec = Number(s.toFixed(2));
    state.endSec = Number(e.toFixed(2));

    // Pertahankan timestamp kata asli bila sudah ada; cukup saring kata dalam rentang klip baru
    const selectedMoment = state.moments.find((m) => m.id === state.selectedMomentId);
    if (selectedMoment && Array.isArray(selectedMoment.words) && selectedMoment.words.length > 0) {
      state.words = selectedMoment.words.map((w) => ({ ...w }));
      const visibleWords = state.words.filter((w) => w.end >= state.startSec && w.start <= state.endSec);
      if (visibleWords.length > 0) {
        el.clipTranscriptInput.value = visibleWords.map((w) => w.word).join(' ');
      }
    } else {
      state.words = buildWordsFromTextAndWindow(el.clipTranscriptInput.value, state.startSec, state.endSec);
    }
    rebuildPhrases();
  };

  el.clipStartInput.addEventListener('change', handleClipTimeEdit);
  el.clipEndInput.addEventListener('change', handleClipTimeEdit);
  el.clipTranscriptInput.addEventListener('input', () => {
    state.words = buildWordsFromTextAndWindow(el.clipTranscriptInput.value, state.startSec, state.endSec);
    rebuildPhrases();
  });

  el.btnResyncWhisper.addEventListener('click', async () => {
    if (!state.file) return;
    showError('');
    el.btnResyncWhisper.disabled = true;
    try {
      const words = await syncClipWordsWithWhisper(
        state.file,
        state.startSec,
        state.endSec,
        (txt, pct) => setStatusBar(el.step2Status, el.step2StatusText, el.step2ProgressFill, true, txt, pct)
      );
      if (words.length > 0) {
        state.words = words;
        el.clipTranscriptInput.value = words.map((w) => w.word).join(' ');
        rebuildPhrases();
      }
      setStatusBar(el.step2Status, el.step2StatusText, el.step2ProgressFill, false);
    } catch (err) {
      setStatusBar(el.step2Status, el.step2StatusText, el.step2ProgressFill, false);
      showError(err.message || 'Gagal menyelaraskan ulang kata dengan Whisper.');
    } finally {
      el.btnResyncWhisper.disabled = false;
    }
  });

  el.btnGoStep3.addEventListener('click', () => switchStep(3));

  el.hiddenVideo.addEventListener('loadeddata', () => renderPreviewOnce());
  el.hiddenVideo.addEventListener('seeked', () => renderPreviewOnce());
  el.hiddenVideo.addEventListener('play', updatePlayButtonText);
  el.hiddenVideo.addEventListener('pause', updatePlayButtonText);

  el.btnTogglePlay.addEventListener('click', () => {
    if (!state.file) return;
    if (el.hiddenVideo.paused) {
      if (el.hiddenVideo.currentTime < state.startSec || el.hiddenVideo.currentTime >= state.endSec) {
        el.hiddenVideo.currentTime = state.startSec;
      }
      el.hiddenVideo.play();
    } else {
      el.hiddenVideo.pause();
    }
  });

  el.frameModeSelect.addEventListener('change', () => {
    state.frameMode = el.frameModeSelect.value;
    renderPreviewOnce();
  });

  el.autoFaceCheckbox.addEventListener('change', () => {
    state.autoFaceCenter = el.autoFaceCheckbox.checked;
    renderPreviewOnce();
  });

  el.manualOffsetRange.addEventListener('input', () => {
    state.manualOffset = Number(el.manualOffsetRange.value) || 0;
    renderPreviewOnce();
  });

  el.btnScanFacePreview.addEventListener('click', async () => {
    if (!state.file) return;
    el.btnScanFacePreview.disabled = true;
    el.btnScanFacePreview.textContent = 'Memindai wajah...';
    const input = new Input({ source: new BlobSource(state.file), formats: ALL_FORMATS });
    try {
      const vt = await input.getPrimaryVideoTrack();
      const sink = new CanvasSink(vt);
      state.previewCameraTrack = await buildFaceTrackForClip({
        canvasSink: sink,
        startSec: state.startSec,
        endSec: state.endSec,
        sampleIntervalSec: 0.35
      });
      renderPreviewOnce();
      el.btnScanFacePreview.textContent = 'Wajah Berhasil Dikunci di Tengah ✓';
    } catch (err) {
      showError(err.message);
      el.btnScanFacePreview.textContent = 'Pindai Posisi Wajah untuk Preview';
    } finally {
      input.dispose();
      el.btnScanFacePreview.disabled = false;
    }
  });

  el.hookTitleInput.addEventListener('input', () => {
    state.hookTitle = el.hookTitleInput.value;
    renderPreviewOnce();
  });
  el.hookStyleSelect.addEventListener('change', () => {
    state.hookStyle = el.hookStyleSelect.value;
    renderPreviewOnce();
  });
  el.watermarkTextInput.addEventListener('input', () => {
    state.watermarkText = el.watermarkTextInput.value;
    renderPreviewOnce();
  });
  el.watermarkPosSelect.addEventListener('change', () => {
    state.watermarkPos = el.watermarkPosSelect.value;
    renderPreviewOnce();
  });
  el.watermarkFileInput.addEventListener('change', (e) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) {
      state.watermarkImage = null;
      renderPreviewOnce();
      return;
    }
    const img = new Image();
    img.onload = () => {
      state.watermarkImage = img;
      renderPreviewOnce();
    };
    img.src = URL.createObjectURL(imgFile);
  });

  el.resolutionSelect.addEventListener('change', () => {
    state.resolution = el.resolutionSelect.value;
  });

  // Render & Ekspor MP4
  el.btnRenderMp4.addEventListener('click', async () => {
    if (!state.file) return;
    showError('');
    el.hiddenVideo.pause();
    el.resultBox.style.display = 'none';
    el.btnRenderMp4.disabled = true;
    el.btnCancelRender.style.display = 'inline-flex';

    const abortController = new AbortController();
    state.renderAbortController = abortController;

    try {
      const result = await renderClipToMp4({
        file: state.file,
        startSec: state.startSec,
        endSec: state.endSec,
        resolution: state.resolution,
        fps: 30,
        frameMode: state.frameMode,
        autoFaceCenter: state.autoFaceCenter,
        manualCenterXOffset: state.manualOffset,
        presetId: state.presetId,
        words: state.words,
        hookTitle: state.hookTitle,
        hookStyle: state.hookStyle,
        watermarkImage: state.watermarkImage,
        watermarkText: state.watermarkText,
        watermarkPos: state.watermarkPos,
        watermarkOpacity: 0.88,
        signal: abortController.signal,
        onProgress: ({ phase, percent }) => {
          setStatusBar(el.renderStatus, el.renderStatusText, el.renderProgressFill, true, phase, percent);
        }
      });

      state.previewCameraTrack = result.cameraTrack;
      if (state.resultObjectUrl) URL.revokeObjectURL(state.resultObjectUrl);
      state.resultObjectUrl = URL.createObjectURL(result.blob);

      const sizeMb = (result.sizeBytes / (1024 * 1024)).toFixed(2);
      el.resultMeta.textContent = `Resolusi ${result.width}×${result.height} (9:16) • Durasi ${result.durationSec.toFixed(1)} dtk • Ukuran ${sizeMb} MB • Selesai dalam ${result.renderSeconds} detik`;
      el.resultVideo.src = state.resultObjectUrl;
      el.btnDownloadMp4.href = state.resultObjectUrl;
      el.btnDownloadMp4.download = `klip-auto-${Date.now()}.mp4`;
      el.resultBox.style.display = 'block';
    } catch (err) {
      if (err.name !== 'AbortError') {
        showError(err.message || 'Gagal merender klip MP4.');
      } else {
        setStatusBar(el.renderStatus, el.renderStatusText, el.renderProgressFill, false);
      }
    } finally {
      el.btnRenderMp4.disabled = false;
      el.btnCancelRender.style.display = 'none';
      state.renderAbortController = null;
    }
  });

  el.btnCancelRender.addEventListener('click', () => {
    if (state.renderAbortController) {
      state.renderAbortController.abort();
    }
  });
}

initPreferences();
renderPresetButtons();
bindEvents();
requestAnimationFrame(previewAnimationLoop);

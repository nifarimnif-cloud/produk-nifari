/**
 * Klip Auto Studio — Pengendali Utama Aplikasi Pembeli & Mesin Pemotong 9:16
 * Menggabungkan: Login Pembeli, Beranda Editorial, Wizard Pemotong 3 Langkah
 * (WebCodecs + MediaBunny + FaceTracker + Whisper/Gemini/SRT),
 * Pustaka 140 Koleksi Kreator, Riwayat Render, Favorit, Pengaturan & Tema Terang/Gelap.
 */

import { ALL_FORMATS, BlobSource, CanvasSink, Input } from './vendor/mediabunny.min.mjs';
import { createSamplePodcastMp4, probeMediaFile } from './engine/audio-processor.js';
import { CAPTION_PRESETS, drawClipFrame, groupWordsIntoPhrases } from './engine/caption-presets.js';
import { buildFaceTrackForClip, sampleCameraCenterX } from './engine/face-tracker.js';
import { renderClipToMp4 } from './engine/mp4-exporter.js';
import {
  analyzePodcastWithGemini,
  buildWordsFromTextAndWindow,
  pickMomentsFromWordsLocally,
  syncClipWordsWithWhisper,
  transcribeAndPickWithWhisperWeb
} from './engine/transcriber-moments.js';
import { runAutonomousClipAgent } from './engine/ai-clip-agent.js';
import {
  downloadYoutubeAsMp4File,
  fetchYoutubeVideoInfo,
  formatBytesReadable,
  saveYoutubeMp4ToDevice
} from './engine/youtube-downloader.js';
import { CREATOR_CATEGORIES, CREATOR_LIBRARY_ITEMS } from './data/creator-library.js';

const KEYS = {
  USER: 'klip_auto_user_v1',
  SETTINGS: 'klip_auto_settings_v1',
  HISTORY: 'klip_auto_history_v1',
  FAVORITES: 'klip_auto_favs_v1',
  GEMINI: 'klip_auto_gemini_key',
  THEME: 'klip_auto_theme_v2'
};

const LICENSE_SALT = 'nifari-lic-2026::';
const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
const DEV_AGENT_HASHES = new Set([
  'bb24231af9658311908623605e7af829c6b160673df1997f405b2376c3cd8417',
  'b5e9dd7f69b02c05c2ca57cdbca83e0a7e4550b91029e8a3ba7645c7eeb9bfc1',
  'fe1ace26ec77203def76d45007177495416cdd51d804e7817eb698601734c621',
  '00168dda418ed7b5316234853fabd15ea6371b137b98d4d9354bafa0ad453ea4',
  'f75cfceddc6da61a7191e94d993253216972fc9329d9b5f89ec43a48623fa9e3'
]);
const CREATOR_MASTER_HASHES = new Set([CREATOR_MASTER_HASH, ...DEV_AGENT_HASHES]);
const OFFICIAL_BUYER_HASH = '4a7bbc7ef6f92c8973ccfb2cdf5adc141b494a9a48cb3622d5511b04e8bc1e7b';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CAPTION_PLACEHOLDER =
  'Ketik kalimat pembicara di sini atau gunakan fitur transkrip otomatis di Langkah 1.';

/**
 * Verifikasi SHA-256 sinkron murni JS (UTF-8 -> hex 64 karakter) tanpa menyimpan kode asli di source.
 */
function sha256Hex(inputStr) {
  const bytes = new TextEncoder().encode(String(inputStr ?? ''));
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const bitLen = bytes.length * 8;
  const totalLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const buf = new Uint8Array(totalLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function hashLicenseCode(rawCode) {
  const normalized = String(rawCode ?? '').trim().toUpperCase();
  if (!normalized) return '';
  return sha256Hex(LICENSE_SALT + normalized);
}

function loadValidatedSession() {
  const saved = loadJson(KEYS.USER, null);
  if (
    saved &&
    typeof saved === 'object' &&
    (CREATOR_MASTER_HASHES.has(saved.codeHash) || saved.codeHash === OFFICIAL_BUYER_HASH)
  ) {
    return saved;
  }
  try {
    localStorage.removeItem(KEYS.USER);
  } catch {}
  return null;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.display = 'none';
  }, 2600);
}

/**
 * Parser ringan file subtitle .SRT atau .VTT menjadi urutan kata ber-timestamp
 */
function parseSubtitleToWords(rawText, maxDurationSec = 3600) {
  const cleaned = String(rawText || '').replace(/\r\n/g, '\n');
  const blocks = cleaned.split(/\n\s*\n/);
  const words = [];

  const parseTime = (ts) => {
    const parts = ts.trim().replace(',', '.').split(':');
    if (parts.length === 3) {
      return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
    }
    if (parts.length === 2) {
      return Number(parts[0]) * 60 + Number(parts[1]);
    }
    return 0;
  };

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const [rawStart, rawEnd] = lines[timeLineIdx].split('-->');
    const segStart = Math.max(0, Math.min(maxDurationSec, parseTime(rawStart)));
    const segEnd = Math.max(segStart + 0.25, Math.min(maxDurationSec, parseTime(rawEnd.split(/\s+/)[0])));
    const textContent = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!textContent) continue;
    const chunkWords = buildWordsFromTextAndWindow(textContent, segStart, segEnd);
    words.push(...chunkWords);
  }

  return words;
}

const state = {
  user: loadValidatedSession(),
  settings: loadJson(KEYS.SETTINGS, {
    creatorName: '',
    defaultWatermark: '',
    defaultPreset: 'kreator-kuning'
  }),
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),

  activeView: 'dashboard',
  activeStep: 1,
  libCategory: 'Semua Kategori',
  libNiche: 'Semua',
  libQuery: '',
  modalItemId: null,

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
  transcriptManuallyEdited: false,
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
  voiceBoost: true,
  volumeGain: 1.0,
  monoToStereo: true,
  previewMuted: false,
  ytInfo: null,
  ytCachedDownload: null,
  ytAbortController: null,
  agentAutoRun: true,
  agentClipCount: 3,
  agentRunning: false,
  agentAbortController: null,
  agentRenderedClips: [],
  agentLogs: [],
  renderAbortController: null
};

state.presetId = state.settings.defaultPreset || 'kreator-kuning';
state.watermarkText = state.settings.defaultWatermark || '';

// Elemen DOM
const el = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginName: document.getElementById('login-name'),
  loginEmail: document.getElementById('login-email'),
  loginCode: document.getElementById('login-code'),
  loginError: document.getElementById('login-error'),
  btnDemoLogin: document.getElementById('btn-demo-login'),

  appLayout: document.getElementById('app-layout'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  btnOpenSidebar: document.getElementById('btn-open-sidebar'),
  btnLogout: document.getElementById('btn-logout'),
  themeToggle: document.getElementById('theme-toggle'),
  btnThemeMobile: document.getElementById('btn-theme-mobile'),

  navItems: Array.from(document.querySelectorAll('.nav-item')),
  mnavBtns: Array.from(document.querySelectorAll('.mnav-btn')),
  views: {
    dashboard: document.getElementById('view-dashboard'),
    wizard: document.getElementById('view-wizard'),
    library: document.getElementById('view-library'),
    history: document.getElementById('view-history'),
    favorites: document.getElementById('view-favorites'),
    settings: document.getElementById('view-settings')
  },

  // Dashboard
  dashGreeting: document.getElementById('dash-greeting'),
  dashBtnOpenWizard: document.getElementById('dash-btn-open-wizard'),
  dashBtnYoutube: document.getElementById('dash-btn-youtube'),
  dashBtnQuickSample: document.getElementById('dash-btn-quick-sample'),
  statRenderedCount: document.getElementById('stat-rendered-count'),
  statMomentsCount: document.getElementById('stat-moments-count'),
  statLibraryTotal: document.getElementById('stat-library-total'),
  statFavCount: document.getElementById('stat-fav-count'),
  navHistoryCount: document.getElementById('nav-history-count'),
  navFavCount: document.getElementById('nav-fav-count'),
  navLibCount: document.getElementById('nav-lib-count'),
  dashRecentRenders: document.getElementById('dash-recent-renders'),
  dashSeeAllHistory: document.getElementById('dash-see-all-history'),

  // Wizard
  wizTopSampleBtn: document.getElementById('wiz-top-sample-btn'),
  stepTabs: Array.from(document.querySelectorAll('.step-tab')),
  panels: {
    1: document.getElementById('panel-step-1'),
    2: document.getElementById('panel-step-2'),
    3: document.getElementById('panel-step-3')
  },
  globalError: document.getElementById('global-error'),
  ytUrlInput: document.getElementById('yt-url-input'),
  btnYtFetch: document.getElementById('btn-yt-fetch'),
  ytStatus: document.getElementById('yt-status'),
  ytStatusText: document.getElementById('yt-status-text'),
  ytProgressFill: document.getElementById('yt-progress-fill'),
  ytPreviewCard: document.getElementById('yt-preview-card'),
  ytThumb: document.getElementById('yt-thumb'),
  ytDurationBadge: document.getElementById('yt-duration-badge'),
  ytChannelPill: document.getElementById('yt-channel-pill'),
  ytCaptionPill: document.getElementById('yt-caption-pill'),
  ytTitle: document.getElementById('yt-title'),
  ytQualitySelect: document.getElementById('yt-quality-select'),
  btnYtImportStudio: document.getElementById('btn-yt-import-studio'),
  btnYtDownloadMp4: document.getElementById('btn-yt-download-mp4'),
  btnYtCancel: document.getElementById('btn-yt-cancel'),
  ytPostDownloadHint: document.getElementById('yt-post-download-hint'),

  aiAgentCard: document.getElementById('ai-agent-card'),
  agentStatePill: document.getElementById('agent-state-pill'),
  agentAutoRunCheckbox: document.getElementById('agent-auto-run-checkbox'),
  agentClipCountSelect: document.getElementById('agent-clip-count-select'),
  btnRunAiAgent: document.getElementById('btn-run-ai-agent'),
  btnStopAiAgent: document.getElementById('btn-stop-ai-agent'),
  agentTracker: document.getElementById('agent-tracker'),
  agentStageChips: Array.from(document.querySelectorAll('.agent-stage-chip')),
  agentStageTitle: document.getElementById('agent-stage-title'),
  agentPctBadge: document.getElementById('agent-pct-badge'),
  agentStageDetail: document.getElementById('agent-stage-detail'),
  agentProgressFill: document.getElementById('agent-progress-fill'),
  agentLogList: document.getElementById('agent-log-list'),
  agentResultsWrap: document.getElementById('agent-results-wrap'),
  agentResultsBadge: document.getElementById('agent-results-badge'),
  agentResultsGrid: document.getElementById('agent-results-grid'),
  btnDownloadAllAgent: document.getElementById('btn-download-all-agent'),

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
  srtFileInput: document.getElementById('srt-file-input'),
  btnPickSrt: document.getElementById('btn-pick-srt'),
  btnCopyAiPrompt: document.getElementById('btn-copy-ai-prompt'),
  btnCopyAiPromptStep2: document.getElementById('btn-copy-ai-prompt-step2'),

  btnOpenHookPicker: document.getElementById('btn-open-hook-picker'),
  momentsContainer: document.getElementById('moments-container'),
  labelClipDuration: document.getElementById('label-clip-duration'),
  clipStartInput: document.getElementById('clip-start-input'),
  clipEndInput: document.getElementById('clip-end-input'),
  sliderClipStart: document.getElementById('slider-clip-start'),
  sliderClipEnd: document.getElementById('slider-clip-end'),
  btnStep2PlayAudio: document.getElementById('btn-step2-play-audio'),
  step2AudioTime: document.getElementById('step2-audio-time'),
  clipTranscriptInput: document.getElementById('clip-transcript-input'),
  step2Status: document.getElementById('step2-status'),
  step2StatusText: document.getElementById('step2-status-text'),
  step2ProgressFill: document.getElementById('step2-progress-fill'),
  btnResyncWhisper: document.getElementById('btn-resync-whisper'),
  btnGoStep3: document.getElementById('btn-go-step3'),

  previewCanvas: document.getElementById('preview-canvas'),
  hiddenVideo: document.getElementById('hidden-preview-video'),
  btnTogglePlay: document.getElementById('btn-toggle-play'),
  btnToggleMute: document.getElementById('btn-toggle-mute'),
  previewTimeLabel: document.getElementById('preview-time-label'),
  presetGrid: document.getElementById('preset-grid'),
  frameModeSelect: document.getElementById('frame-mode-select'),
  autoFaceCheckbox: document.getElementById('auto-face-checkbox'),
  manualOffsetRange: document.getElementById('manual-offset-range'),
  btnScanFacePreview: document.getElementById('btn-scan-face-preview'),
  audioVolumeRange: document.getElementById('audio-volume-range'),
  audioVolumeLabel: document.getElementById('audio-volume-label'),
  voiceBoostCheckbox: document.getElementById('voice-boost-checkbox'),
  monoStereoCheckbox: document.getElementById('mono-stereo-checkbox'),
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
  btnDownloadMp4: document.getElementById('btn-download-mp4'),

  // Library & Modal
  libSearchInput: document.getElementById('lib-search-input'),
  libNicheSelect: document.getElementById('lib-niche-select'),
  libCatPills: document.getElementById('lib-cat-pills'),
  libShowingBadge: document.getElementById('lib-showing-badge'),
  libraryGrid: document.getElementById('library-grid'),
  favoritesGrid: document.getElementById('favorites-grid'),
  historyListContainer: document.getElementById('history-list-container'),
  btnClearHistory: document.getElementById('btn-clear-history'),

  libModal: document.getElementById('lib-modal'),
  modalCategory: document.getElementById('modal-category'),
  modalNiche: document.getElementById('modal-niche'),
  modalTitle: document.getElementById('modal-title'),
  modalExplanation: document.getElementById('modal-explanation'),
  modalExample: document.getElementById('modal-example'),
  modalTips: document.getElementById('modal-tips'),
  modalBtnUseHook: document.getElementById('modal-btn-use-hook'),
  modalBtnCopy: document.getElementById('modal-btn-copy'),
  modalBtnFav: document.getElementById('modal-btn-fav'),
  modalBtnClose: document.getElementById('modal-btn-close'),

  // Settings
  setCreatorName: document.getElementById('set-creator-name'),
  setDefaultWatermark: document.getElementById('set-default-watermark'),
  setDefaultPreset: document.getElementById('set-default-preset'),
  setGeminiKey: document.getElementById('set-gemini-key'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnExportJson: document.getElementById('btn-export-json'),
  btnImportJson: document.getElementById('btn-import-json'),
  importJsonInput: document.getElementById('import-json-input')
};

const previewCtx = el.previewCanvas.getContext('2d');

/* ================= SESI LOGIN & NAVIGASI STUDIO ================= */
function syncAuthView() {
  if (state.user) {
    el.loginScreen.style.display = 'none';
    el.appLayout.classList.add('active');
    const displayName = state.settings.creatorName || state.user.name || 'Kreator';
    el.dashGreeting.textContent = `Selamat berkarya, ${displayName}`;
    el.watermarkTextInput.value = state.watermarkText;
    refreshDashboardAndBadges();
  } else {
    el.loginScreen.style.display = 'flex';
    el.appLayout.classList.remove('active');
  }
}

function closeMobileSidebar() {
  el.sidebar.classList.remove('open');
  el.sidebarOverlay.classList.remove('open');
}

function switchView(viewName) {
  if (!el.views[viewName]) return;
  state.activeView = viewName;

  for (const [k, pane] of Object.entries(el.views)) {
    pane.classList.toggle('active', k === viewName);
  }
  for (const btn of el.navItems) {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  }
  for (const mbtn of el.mnavBtns) {
    mbtn.classList.toggle('active', mbtn.dataset.mview === viewName);
  }

  if (viewName !== 'wizard') {
    el.hiddenVideo.pause();
    updatePlayButtonText();
  }
  if (viewName === 'library') renderLibraryGrid();
  if (viewName === 'favorites') renderFavoritesGrid();
  if (viewName === 'history') renderHistory();
  if (viewName === 'settings') populateSettingsForm();
  if (viewName === 'dashboard') refreshDashboardAndBadges();

  closeMobileSidebar();
  window.scrollTo(0, 0);
}

function refreshDashboardAndBadges() {
  const histCount = state.history.length;
  const favCount = state.favorites.length;
  const momCount = state.moments.length;
  const libTotal = CREATOR_LIBRARY_ITEMS.length;

  el.statRenderedCount.textContent = String(histCount);
  el.statMomentsCount.textContent = String(momCount);
  el.statLibraryTotal.textContent = String(libTotal);
  el.statFavCount.textContent = String(favCount);

  el.navHistoryCount.textContent = String(histCount);
  el.navFavCount.textContent = String(favCount);
  el.navLibCount.textContent = String(libTotal);

  if (histCount === 0) {
    el.dashRecentRenders.innerHTML = `
      <div class="parchment-card" style="padding:20px;border-radius:18px;margin-bottom:0;">
        <p class="muted-copy" style="font-size:14px;margin-bottom:12px;">
          Belum ada klip MP4 yang dirender. Kamu bisa langsung mencoba memotong video contoh 2 pembicara dalam 1 klik.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="empty-recent-sample-btn">
          Coba Potong Video Contoh Sekarang
        </button>
      </div>
    `;
    const quickBtn = document.getElementById('empty-recent-sample-btn');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => triggerSampleVideoFromAnywhere());
    }
  } else {
    el.dashRecentRenders.innerHTML = state.history
      .slice(0, 3)
      .map(
        (h) => `
        <div class="quick-step-row">
          <div>
            <strong>${escHtml(h.hookTitle || h.sourceName)}</strong>
            <div class="muted-copy" style="font-size:12.5px;">
              ${escHtml(h.resolution)} · ${h.durationSec} dtk · Preset ${escHtml(h.presetName)}
            </div>
          </div>
          <span class="pill-tag">${escHtml(h.dateLabel)}</span>
        </div>
      `
      )
      .join('');
  }
}

/* ================= TEMA & PREFERENSI ================= */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEYS.THEME, theme);
  el.themeToggle.textContent = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
}

function initPreferences() {
  const savedTheme = localStorage.getItem(KEYS.THEME) || 'light';
  applyTheme(savedTheme);

  const toggleFn = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };
  el.themeToggle.addEventListener('click', toggleFn);
  el.btnThemeMobile.addEventListener('click', toggleFn);

  const savedKey = localStorage.getItem(KEYS.GEMINI) || '';
  el.geminiKeyInput.value = savedKey;
  el.setGeminiKey.value = savedKey;

  el.geminiKeyInput.addEventListener('input', () => {
    const k = el.geminiKeyInput.value.trim();
    localStorage.setItem(KEYS.GEMINI, k);
    el.setGeminiKey.value = k;
  });

  // Isi opsi preset di halaman Pengaturan
  el.setDefaultPreset.innerHTML = CAPTION_PRESETS.map(
    (p) => `<option value="${escHtml(p.id)}">${escHtml(p.name)}</option>`
  ).join('');
}

function populateSettingsForm() {
  el.setCreatorName.value = state.settings.creatorName || (state.user?.name ?? '');
  el.setDefaultWatermark.value = state.settings.defaultWatermark || '';
  el.setDefaultPreset.value = state.settings.defaultPreset || 'kreator-kuning';
  el.setGeminiKey.value = localStorage.getItem(KEYS.GEMINI) || '';
}

/* ================= PUSTAKA 140 KOLEKSI KREATOR ================= */
function initLibraryControls() {
  const niches = ['Semua', ...new Set(CREATOR_LIBRARY_ITEMS.map((i) => i.niche))];
  el.libNicheSelect.innerHTML = niches
    .map((n) => `<option value="${escHtml(n)}">${n === 'Semua' ? 'Semua Topik Kreator' : escHtml(n)}</option>`)
    .join('');

  renderCategoryPills();
  renderLibraryGrid();
}

function renderCategoryPills() {
  el.libCatPills.innerHTML = CREATOR_CATEGORIES.map(
    (cat) => `
      <button type="button" class="cat-pill-btn ${cat === state.libCategory ? 'active' : ''}" data-cat="${escHtml(cat)}">
        ${escHtml(cat)}
      </button>
    `
  ).join('');

  for (const btn of el.libCatPills.querySelectorAll('.cat-pill-btn')) {
    btn.addEventListener('click', () => {
      state.libCategory = btn.dataset.cat;
      renderCategoryPills();
      renderLibraryGrid();
    });
  }
}

function getFilteredLibraryItems() {
  const q = state.libQuery.trim().toLowerCase();
  return CREATOR_LIBRARY_ITEMS.filter((item) => {
    if (state.libCategory !== 'Semua Kategori' && item.category !== state.libCategory) return false;
    if (state.libNiche !== 'Semua' && item.niche !== state.libNiche) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.hook.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.niche.toLowerCase().includes(q)
    );
  });
}

function buildLibCardHtml(item) {
  const isFav = state.favorites.includes(item.id);
  return `
    <article class="lib-card">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <span class="pill-tag">${escHtml(item.category)}</span>
          <span class="eyebrow" style="font-size:10px;">${escHtml(item.niche)}</span>
        </div>
        <h3>${escHtml(item.title)}</h3>
        <p class="muted-copy" style="font-size:13.5px;">${escHtml(item.summary)}</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--color-ash);">
        <span style="font-size:12px;color:var(--color-graphite);">${isFav ? 'Tersimpan di Favorit' : 'Siap pakai'}</span>
        <button type="button" class="underline-link btn-open-detail" data-id="${escHtml(item.id)}">
          Lihat Detail
        </button>
      </div>
    </article>
  `;
}

function bindCardDetailButtons(container) {
  for (const btn of container.querySelectorAll('.btn-open-detail')) {
    btn.addEventListener('click', () => openLibraryModal(btn.dataset.id));
  }
}

function renderLibraryGrid() {
  const items = getFilteredLibraryItems();
  el.libShowingBadge.textContent = `${items.length} Koleksi`;
  if (items.length === 0) {
    el.libraryGrid.innerHTML = `
      <div class="parchment-card" style="grid-column:1 / -1;">
        <p class="muted-copy">Tidak ditemukan koleksi untuk kata kunci tersebut. Coba pilih Semua Kategori.</p>
      </div>
    `;
    return;
  }
  el.libraryGrid.innerHTML = items.map(buildLibCardHtml).join('');
  bindCardDetailButtons(el.libraryGrid);
}

function renderFavoritesGrid() {
  const favItems = CREATOR_LIBRARY_ITEMS.filter((i) => state.favorites.includes(i.id));
  if (favItems.length === 0) {
    el.favoritesGrid.innerHTML = `
      <div class="parchment-card" style="grid-column:1 / -1;">
        <p class="muted-copy" style="margin-bottom:12px;">Belum ada item yang disimpan ke Favorit.</p>
        <button type="button" class="btn btn-primary btn-sm" id="fav-go-lib-btn">Jelajahi 140 Pustaka Kreator</button>
      </div>
    `;
    document.getElementById('fav-go-lib-btn')?.addEventListener('click', () => switchView('library'));
    return;
  }
  el.favoritesGrid.innerHTML = favItems.map(buildLibCardHtml).join('');
  bindCardDetailButtons(el.favoritesGrid);
}

function openLibraryModal(itemId) {
  const item = CREATOR_LIBRARY_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  state.modalItemId = item.id;

  el.modalCategory.textContent = item.category;
  el.modalNiche.textContent = item.niche;
  el.modalTitle.textContent = item.title;
  el.modalExplanation.textContent = item.explanation;
  el.modalExample.textContent = item.example;
  el.modalTips.textContent = item.tips;

  const isFav = state.favorites.includes(item.id);
  el.modalBtnFav.textContent = isFav ? 'Hapus dari Favorit' : 'Simpan Favorit';
  el.libModal.classList.add('open');
}

function closeLibraryModal() {
  el.libModal.classList.remove('open');
  state.modalItemId = null;
}

/* ================= RIWAYAT RENDER ================= */
function recordRenderedHistory(meta) {
  const now = new Date();
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const entry = {
    id: `render-${Date.now()}`,
    sourceName: state.file?.name || 'video-klip.mp4',
    hookTitle: state.hookTitle || `Klip ${formatDuration(state.startSec)}–${formatDuration(state.endSec)}`,
    startSec: state.startSec,
    endSec: state.endSec,
    durationSec: meta.durationSec.toFixed(1),
    resolution: `${meta.width}×${meta.height}`,
    presetId: state.presetId,
    presetName: CAPTION_PRESETS.find((p) => p.id === state.presetId)?.name || state.presetId,
    sizeMb: (meta.sizeBytes / (1024 * 1024)).toFixed(2),
    dateLabel: `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`
  };

  const existingIdx = state.history.findIndex(
    (h) =>
      h.sourceName === entry.sourceName &&
      Math.abs(h.startSec - entry.startSec) < 0.2 &&
      Math.abs(h.endSec - entry.endSec) < 0.2
  );
  if (existingIdx >= 0) {
    state.history[existingIdx] = entry;
  } else {
    state.history.unshift(entry);
  }
  saveJson(KEYS.HISTORY, state.history);
  refreshDashboardAndBadges();
}

function renderHistory() {
  if (state.history.length === 0) {
    el.historyListContainer.innerHTML = `
      <div class="parchment-card">
        <p class="muted-copy" style="margin-bottom:14px;">Belum ada riwayat render klip MP4 pada perangkat ini.</p>
        <button type="button" class="btn btn-primary btn-sm" id="hist-start-wiz-btn">Mulai Buat Klip Pertama</button>
      </div>
    `;
    document.getElementById('hist-start-wiz-btn')?.addEventListener('click', () => switchView('wizard'));
    return;
  }

  el.historyListContainer.innerHTML = state.history
    .map(
      (h) => `
      <div class="parchment-card" style="padding:22px 24px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
        <div>
          <span class="pill-tag lime" style="margin-bottom:8px;">${escHtml(h.resolution)} · ${escHtml(h.sizeMb)} MB</span>
          <h3 class="card-subheading">${escHtml(h.hookTitle)}</h3>
          <p class="muted-copy" style="font-size:13.5px;margin-top:4px;">
            Sumber: ${escHtml(h.sourceName)} · Rentang ${formatDuration(h.startSec)} – ${formatDuration(h.endSec)} (${escHtml(h.durationSec)} dtk) · Preset ${escHtml(h.presetName)}
          </p>
        </div>
        <div class="btn-row">
          <span class="pill-tag">${escHtml(h.dateLabel)}</span>
          <button type="button" class="btn btn-secondary btn-sm btn-apply-hist" data-id="${escHtml(h.id)}">
            Pakai Setelan Ini
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-del-hist" data-id="${escHtml(h.id)}">
            Hapus
          </button>
        </div>
      </div>
    `
    )
    .join('');

  for (const btn of el.historyListContainer.querySelectorAll('.btn-apply-hist')) {
    btn.addEventListener('click', () => {
      const h = state.history.find((x) => x.id === btn.dataset.id);
      if (!h) return;
      state.hookTitle = h.hookTitle;
      state.presetId = h.presetId;
      el.hookTitleInput.value = h.hookTitle;
      renderPresetButtons();
      switchView('wizard');
      if (!state.file) {
        switchStep(1);
        const guideMsg = `Setelan judul & gaya caption "${h.presetName}" sudah disiapkan! Sekarang pilih atau muat videomu dulu di Langkah 1 ya.`;
        showError(guideMsg);
        showToast(guideMsg);
        return;
      }
      switchStep(3);
      renderPreviewOnce();
      showToast('Judul hook & preset caption diterapkan ke Studio!');
    });
  }

  for (const btn of el.historyListContainer.querySelectorAll('.btn-del-hist')) {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.id;
      state.history = state.history.filter((x) => x.id !== targetId);
      saveJson(KEYS.HISTORY, state.history);
      renderHistory();
      refreshDashboardAndBadges();
      showToast('Item riwayat berhasil dihapus.');
    });
  }
}

/* ================= MESIN INTI WIZARD 3 LANGKAH ================= */
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

function updateClipDurationBadge() {
  const dur = Math.max(0.5, state.endSec - state.startSec);
  el.labelClipDuration.textContent = `Durasi Klip: ${dur.toFixed(1)} dtk`;
}

function switchStep(stepNum) {
  showError('');
  if (stepNum > 1 && !state.file) {
    showError('Pilih atau muat video dulu di Langkah 1 ya.');
    showToast('Pilih atau muat video dulu di Langkah 1 ya.');
    return;
  }
  state.activeStep = stepNum;
  for (const tab of el.stepTabs) {
    const s = Number(tab.dataset.step);
    tab.classList.toggle('active', s === stepNum);
  }
  for (const [k, panel] of Object.entries(el.panels)) {
    panel.classList.toggle('active', Number(k) === stepNum);
  }
  el.hiddenVideo.pause();
  updatePlayButtonText();
  if (stepNum === 3) {
    syncPreviewToStart();
    renderPreviewOnce();
  }
}

function renderPresetButtons() {
  el.presetGrid.innerHTML = '';
  for (const p of CAPTION_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-btn ${p.id === state.presetId ? 'active' : ''}`;
    btn.dataset.presetId = p.id;
    btn.innerHTML = `<strong>${escHtml(p.name)}</strong><span>${escHtml(p.desc)}</span>`;
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
      <h4>${escHtml(m.title)}</h4>
      <p>${escHtml(m.reason)}</p>
    `;
    card.addEventListener('click', () => applyMomentSelection(m));
    el.momentsContainer.appendChild(card);
  }
}

function syncStartEndInputsAndSliders() {
  el.clipStartInput.value = state.startSec.toFixed(1);
  el.clipEndInput.value = state.endSec.toFixed(1);
  el.sliderClipStart.value = String(state.startSec);
  el.sliderClipEnd.value = String(state.endSec);
  updateClipDurationBadge();
}

function applyMomentSelection(moment) {
  state.selectedMomentId = moment.id;
  state.startSec = moment.startSec;
  state.endSec = moment.endSec;
  state.hookTitle = moment.title || '';
  state.transcriptManuallyEdited = false;
  state.previewCameraTrack = [{ time: moment.startSec, centerX: 0.5 }];
  if (el.btnScanFacePreview) {
    el.btnScanFacePreview.textContent = 'Pindai Posisi Wajah untuk Preview';
  }
  state.words = Array.isArray(moment.words) && moment.words.length > 0
    ? moment.words.map((w) => ({ ...w }))
    : buildWordsFromTextAndWindow(moment.transcript || '', moment.startSec, moment.endSec);

  syncStartEndInputsAndSliders();
  el.clipTranscriptInput.value = moment.transcript || state.words.map((w) => w.word).join(' ');
  el.hookTitleInput.value = state.hookTitle;

  rebuildPhrases();
  renderMomentsCards();
}

function revokeAgentRenderedClips() {
  if (Array.isArray(state.agentRenderedClips)) {
    for (const c of state.agentRenderedClips) {
      if (c?.objectUrl) {
        try {
          URL.revokeObjectURL(c.objectUrl);
        } catch {}
      }
    }
  }
  state.agentRenderedClips = [];
  if (el.agentResultsGrid) el.agentResultsGrid.innerHTML = '';
  el.agentResultsWrap?.classList.remove('visible');
}

function updateAgentStageUi(stageIndex, title, detail, percent) {
  el.agentTracker?.classList.add('visible');
  for (const chip of el.agentStageChips) {
    const idx = Number(chip.dataset.agentStage);
    chip.classList.toggle('done', idx < stageIndex);
    chip.classList.toggle('active', idx === stageIndex);
  }
  if (el.agentStageTitle) el.agentStageTitle.textContent = title;
  if (el.agentStageDetail) el.agentStageDetail.textContent = detail;
  const clamped = Math.max(0, Math.min(100, Math.round(percent || 0)));
  if (el.agentPctBadge) el.agentPctBadge.textContent = `${clamped}%`;
  if (el.agentProgressFill) el.agentProgressFill.style.width = `${clamped}%`;
}

function appendAgentLog(text) {
  state.agentLogs.push(text);
  if (state.agentLogs.length > 10) {
    state.agentLogs = state.agentLogs.slice(-10);
  }
  if (!el.agentLogList) return;
  el.agentLogList.innerHTML = state.agentLogs
    .map(
      (line) => `
      <div class="agent-log-line">
        <span class="agent-log-dot">&rsaquo;</span>
        <span>${escHtml(line)}</span>
      </div>
    `
    )
    .join('');
}

function appendAgentClipCard(clip, totalExpected) {
  if (!el.agentResultsGrid || !el.agentResultsWrap) return;
  el.agentResultsWrap.classList.add('visible');
  if (el.agentResultsBadge) {
    el.agentResultsBadge.textContent = `Hasil AI Agent: ${state.agentRenderedClips.length}/${totalExpected} Klip Selesai`;
  }

  const sizeMb = (clip.sizeBytes / (1024 * 1024)).toFixed(2);
  const card = document.createElement('article');
  card.className = 'agent-clip-card';
  card.innerHTML = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
        <span class="pill-tag lime">Klip #${clip.index} · Skor ${clip.score}/100</span>
        <span class="pill-tag">${formatDuration(clip.startSec)} – ${formatDuration(clip.endSec)}</span>
      </div>
      <h4>${escHtml(clip.hookTitle)}</h4>
      <p class="muted-copy" style="font-size:12.5px;margin:4px 0 10px;">
        ${clip.width}×${clip.height} (9:16) · ${clip.durationSec.toFixed(1)} dtk · ${sizeMb} MB · Suara 48 kHz
      </p>
      <video src="${clip.objectUrl}" controls playsinline preload="metadata"></video>
    </div>
    <div class="btn-row">
      <a class="btn btn-primary btn-sm" href="${clip.objectUrl}" download="${escHtml(clip.fileName)}" style="flex:1;">
        Simpan Klip MP4
      </a>
      <button type="button" class="btn btn-secondary btn-sm btn-edit-agent-clip" data-clip-id="${escHtml(clip.id)}">
        Edit di Studio
      </button>
    </div>
  `;

  card.querySelector('.btn-edit-agent-clip')?.addEventListener('click', () => {
    applyMomentSelection(clip.moment);
    if (Array.isArray(clip.cameraTrack) && clip.cameraTrack.length > 0) {
      state.previewCameraTrack = clip.cameraTrack;
    }
    switchStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Klip #${clip.index} dibuka di Studio 9:16!`);
  });

  el.agentResultsGrid.appendChild(card);
}

async function startAiClipAgent(prebuiltMoments = null) {
  if (!state.file || !state.mediaInfo) {
    showError('Pilih atau masukkan file video terlebih dahulu agar AI Agent dapat memotongnya.');
    return;
  }

  if (state.agentAbortController) {
    state.agentAbortController.abort();
  }

  showError('');
  revokeAgentRenderedClips();
  state.agentLogs = [];
  if (el.agentLogList) el.agentLogList.innerHTML = '';

  const abortCtrl = new AbortController();
  state.agentAbortController = abortCtrl;
  state.agentRunning = true;

  if (el.btnRunAiAgent) el.btnRunAiAgent.disabled = true;
  if (el.btnStopAiAgent) el.btnStopAiAgent.style.display = 'inline-flex';
  if (el.agentStatePill) {
    el.agentStatePill.textContent = 'AI Agent Sedang Bekerja...';
    el.agentStatePill.className = 'pill-tag lime';
  }

  const clipCount = Number(el.agentClipCountSelect?.value || state.agentClipCount || 3);
  state.agentClipCount = clipCount;

  appendAgentLog(`Memulai AI Agent untuk file "${state.file.name}" (target ${clipCount} klip 9:16)...`);

  try {
    const res = await runAutonomousClipAgent({
      file: state.file,
      mediaInfo: state.mediaInfo,
      prebuiltMoments:
        Array.isArray(prebuiltMoments) && prebuiltMoments.length > 0
          ? prebuiltMoments
          : null,
      geminiApiKey: el.geminiKeyInput?.value || '',
      clipCount,
      presetId: state.presetId,
      frameMode: state.frameMode,
      autoFaceCenter: state.autoFaceCenter,
      hookStyle: state.hookStyle,
      watermarkImage: state.watermarkImage,
      watermarkText: state.watermarkText,
      watermarkPos: state.watermarkPos,
      resolution: state.resolution,
      voiceBoost: state.voiceBoost,
      volumeGain: state.volumeGain,
      monoToStereo: state.monoToStereo,
      signal: abortCtrl.signal,
      onStage: ({ stageIndex, stageTitle, detail, percent }) => {
        updateAgentStageUi(stageIndex, stageTitle, detail, percent);
      },
      onLog: (msg) => {
        appendAgentLog(msg);
      },
      onMomentsReady: (moments) => {
        if (Array.isArray(moments) && moments.length > 0) {
          state.moments = moments;
          applyMomentSelection(moments[0]);
          refreshDashboardAndBadges();
        }
      },
      onClipRendered: (clipArtifact, _idx, total) => {
        state.agentRenderedClips.push(clipArtifact);
        appendAgentClipCard(clipArtifact, total);

        // Simpan juga ke Riwayat Render pembeli
        const prevHook = state.hookTitle;
        const prevStart = state.startSec;
        const prevEnd = state.endSec;
        state.hookTitle = clipArtifact.hookTitle;
        state.startSec = clipArtifact.startSec;
        state.endSec = clipArtifact.endSec;
        recordRenderedHistory({
          durationSec: clipArtifact.durationSec,
          width: clipArtifact.width,
          height: clipArtifact.height,
          sizeBytes: clipArtifact.sizeBytes
        });
        state.hookTitle = prevHook;
        state.startSec = prevStart;
        state.endSec = prevEnd;
      }
    });

    if (el.agentStatePill) {
      el.agentStatePill.textContent = `${res.clips.length} Klip Selesai Otomatis`;
    }
    for (const chip of el.agentStageChips) {
      chip.classList.remove('active');
      chip.classList.add('done');
    }
    showToast(`AI Agent selesai membuat ${res.clips.length} klip MP4 9:16 siap unggah!`);
  } catch (err) {
    if (err?.name === 'AbortError') {
      appendAgentLog('Proses AI Agent dihentikan oleh pengguna.');
      if (el.agentStatePill) {
        el.agentStatePill.textContent = 'AI Agent Dihentikan';
        el.agentStatePill.className = 'pill-tag';
      }
      showToast('AI Agent dihentikan.');
    } else {
      appendAgentLog(`Kendala: ${err.message || 'Gagal menyelesaikan pemotongan otomatis.'}`);
      if (el.agentStatePill) {
        el.agentStatePill.textContent = 'Perlu Perhatian';
        el.agentStatePill.className = 'pill-tag';
      }
      showError(err.message || 'AI Agent mengalami kendala saat memproses video.');
    }
  } finally {
    state.agentRunning = false;
    state.agentAbortController = null;
    if (el.btnRunAiAgent) el.btnRunAiAgent.disabled = !state.file;
    if (el.btnStopAiAgent) el.btnStopAiAgent.style.display = 'none';
  }
}

async function handleSelectedVideoFile(file, prebuiltMoments = null, options = {}) {
  showError('');
  if (state.agentAbortController) {
    state.agentAbortController.abort();
  }
  if (state.renderAbortController) {
    state.renderAbortController.abort();
  }
  setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, true, 'Membaca informasi video...', 35);

  try {
    const info = await probeMediaFile(file);
    state.file = file;
    state.mediaInfo = info;

    if (state.videoObjectUrl) URL.revokeObjectURL(state.videoObjectUrl);
    state.videoObjectUrl = URL.createObjectURL(file);
    el.hiddenVideo.src = state.videoObjectUrl;
    el.hiddenVideo.load();

    // Bersihkan hasil render & jejak kamera dari video sebelumnya agar tidak membingungkan
    if (state.resultObjectUrl) {
      try {
        URL.revokeObjectURL(state.resultObjectUrl);
      } catch {}
      state.resultObjectUrl = null;
    }
    if (el.resultVideo) {
      el.resultVideo.pause?.();
      el.resultVideo.removeAttribute('src');
      el.resultVideo.load?.();
    }
    if (el.resultBox) el.resultBox.style.display = 'none';
    if (el.renderStatus) el.renderStatus.style.display = 'none';
    state.transcriptManuallyEdited = false;
    state.previewCameraTrack = [{ time: 0, centerX: 0.5 }];
    if (el.btnScanFacePreview) {
      el.btnScanFacePreview.textContent = 'Pindai Posisi Wajah untuk Preview';
    }
    revokeAgentRenderedClips();

    const defaultEnd = Number(Math.min(info.duration, Math.max(1, Math.min(45, info.duration))).toFixed(1));
    state.startSec = 0;
    state.endSec = defaultEnd;

    const maxStart = String(Math.max(0, Number((info.duration - 0.5).toFixed(1))));
    const maxEnd = String(Number(info.duration.toFixed(1)));
    el.clipStartInput.max = maxStart;
    el.clipEndInput.max = maxEnd;
    el.sliderClipStart.max = maxStart;
    el.sliderClipEnd.max = maxEnd;
    syncStartEndInputsAndSliders();

    const mb = (info.sizeBytes / (1024 * 1024)).toFixed(1);
    el.fileSummaryText.textContent = `${file.name} · Durasi ${formatDuration(info.duration)} (${info.duration.toFixed(1)} dtk) · ${info.width}×${info.height} · ${mb} MB`;
    el.fileSummary.style.display = 'flex';

    el.btnAnalyzeGemini.disabled = false;
    el.btnAnalyzeWhisper.disabled = false;
    el.btnPickSrt.disabled = false;
    if (el.btnRunAiAgent) el.btnRunAiAgent.disabled = false;

    if (prebuiltMoments && prebuiltMoments.length > 0) {
      state.moments = prebuiltMoments;
      applyMomentSelection(prebuiltMoments[0]);
    } else {
      state.moments = [];
      state.selectedMomentId = null;
      state.hookTitle = '';
      if (el.hookTitleInput) el.hookTitleInput.value = '';
      el.clipTranscriptInput.value = DEFAULT_CAPTION_PLACEHOLDER;
      state.words = buildWordsFromTextAndWindow(DEFAULT_CAPTION_PLACEHOLDER, state.startSec, state.endSec);
      rebuildPhrases();
      renderMomentsCards();
    }

    refreshDashboardAndBadges();
    setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);

    const shouldRunAgent = Boolean(options.forceRunAgent || state.agentAutoRun);
    if (shouldRunAgent) {
      switchStep(1);
      setTimeout(() => {
        el.aiAgentCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      await startAiClipAgent(prebuiltMoments);
    } else if (prebuiltMoments && prebuiltMoments.length > 0) {
      switchStep(2);
    }
  } catch (err) {
    setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    showError(err.message || 'Gagal membuka file video tersebut.');
  }
}

async function copyAiHandoffPrompt() {
  const videoTitle =
    state.ytInfo?.title ||
    state.file?.name ||
    '(Tulis judul video podcast / live / webinar kamu di sini)';
  const durationLabel = state.mediaInfo?.duration
    ? `${formatDuration(state.mediaInfo.duration)} (${state.mediaInfo.duration.toFixed(1)} detik)`
    : state.ytInfo?.durationSec
    ? `${formatDuration(state.ytInfo.durationSec)} (${state.ytInfo.durationSec} detik)`
    : '(Tulis durasi total video)';

  let transcriptBody = '';
  if (Array.isArray(state.moments) && state.moments.length > 0) {
    transcriptBody = state.moments
      .map(
        (m, idx) =>
          `${idx + 1}. [${formatDuration(m.startSec)} - ${formatDuration(m.endSec)}] (${m.startSec.toFixed(1)}s - ${m.endSec.toFixed(1)}s): ${m.transcript || (Array.isArray(m.words) ? m.words.map((w) => w.word).join(' ') : '')}`
      )
      .join('\n');
  } else {
    const manualTxt = (el.clipTranscriptInput?.value || '').trim();
    if (manualTxt && manualTxt !== DEFAULT_CAPTION_PLACEHOLDER) {
      transcriptBody = manualTxt;
    } else {
      transcriptBody = '[Tempelkan transkrip YouTube, teks subtitle .SRT, atau ringkasan obrolan videomu di sini]';
    }
  }

  const promptText = [
    'Kamu adalah editor konten video pendek (Reels, TikTok, YouTube Shorts) berbahasa Indonesia yang tajam memilih bagian obrolan paling menarik.',
    '',
    `Judul / File Video: ${videoTitle}`,
    `Durasi Total: ${durationLabel}`,
    '',
    'Tugasmu: Pilih 5 sampai 10 momen terbaik berdurasi 15–45 detik dari transkrip di bawah yang langsung memancing rasa penasaran penonton di 3 detik pertama.',
    '',
    'Untuk setiap momen, tuliskan dengan urutan rapi:',
    '1. Rentang Waktu: MM:SS - MM:SS (sertakan juga angka detik awal dan detik akhir untuk dimasukkan ke Klip Auto Studio)',
    '2. Skor Daya Tarik: 1–100 beserta alasan singkat 1 kalimat kenapa bagian ini kuat',
    '3. Judul Hook Atas: Maksimal 7 kata, bahasa Indonesia ngobrol yang natural, jelas, tanpa clickbait berlebihan',
    '4. Teks Caption Bersih: Kalimat pembicara yang sudah dirapikan tanda bacanya dan siap ditempel ke kolom Teks Caption di Langkah 2 Klip Auto Studio',
    '',
    '--- TRANSKRIP / CATATAN VIDEO ---',
    transcriptBody
  ].join('\n');

  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(promptText);
      copied = true;
    }
  } catch {}

  if (!copied) {
    const ta = document.createElement('textarea');
    ta.value = promptText;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      copied = true;
    } catch {}
    ta.remove();
  }

  showToast('Prompt kurasi momen disalin! Tempel langsung di ChatGPT atau Gemini.');
}

let previewAudioGraph = null;

function syncPreviewAudioGraphParams() {
  if (el.btnToggleMute) {
    el.btnToggleMute.textContent = state.previewMuted ? 'Suara: Bisu' : 'Suara: Aktif';
  }
  if (el.audioVolumeLabel) {
    el.audioVolumeLabel.textContent = `Volume: ${Math.round(state.volumeGain * 100)}%`;
  }
  if (!previewAudioGraph) {
    el.hiddenVideo.muted = state.previewMuted;
    el.hiddenVideo.volume = state.previewMuted ? 0 : Math.max(0, Math.min(1, state.volumeGain));
    return;
  }
  const { hp, presence, comp, gain } = previewAudioGraph;
  hp.frequency.value = state.voiceBoost ? 85 : 20;
  presence.gain.value = state.voiceBoost ? 2.8 : 0;
  comp.ratio.value = state.voiceBoost ? 3.0 : 1.0;
  const boostLift = state.voiceBoost ? 1.12 : 1.0;
  gain.gain.value = state.previewMuted ? 0 : Math.max(0, state.volumeGain * boostLift);
}

function ensurePreviewAudioGraph() {
  el.hiddenVideo.muted = false;
  el.hiddenVideo.volume = 1;
  if (previewAudioGraph) {
    if (previewAudioGraph.ctx.state === 'suspended') {
      previewAudioGraph.ctx.resume().catch(() => {});
    }
    syncPreviewAudioGraphParams();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const source = ctx.createMediaElementSource(el.hiddenVideo);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 3100;
    presence.Q.value = 1.05;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3.0;
    const gain = ctx.createGain();

    source.connect(hp);
    hp.connect(presence);
    presence.connect(comp);
    comp.connect(gain);
    gain.connect(ctx.destination);

    previewAudioGraph = { ctx, source, hp, presence, comp, gain };
    syncPreviewAudioGraphParams();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    syncPreviewAudioGraphParams();
  }
}

async function handleFetchYoutubeInfo() {
  const rawUrl = el.ytUrlInput?.value?.trim() || '';
  if (!rawUrl) {
    showError('Tempelkan link video YouTube terlebih dahulu pada kolom Link YouTube.');
    el.ytUrlInput?.focus();
    return;
  }

  showError('');
  el.btnYtFetch.disabled = true;
  el.ytPreviewCard.classList.remove('visible');
  setStatusBar(
    el.ytStatus,
    el.ytStatusText,
    el.ytProgressFill,
    true,
    'Memeriksa link & mengambil daftar kualitas MP4 dari YouTube...',
    32
  );

  try {
    const info = await fetchYoutubeVideoInfo(rawUrl);
    state.ytInfo = info;

    el.ytThumb.onerror = () => {
      el.ytThumb.src =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="%2314140f"/><polygon points="215,105 275,135 215,165" fill="%23beff50"/></svg>';
    };
    el.ytThumb.src = info.thumbnailUrl;
    el.ytDurationBadge.textContent = info.durationSec > 0 ? formatDuration(info.durationSec) : 'MP4 Siap';
    el.ytChannelPill.textContent = info.author || 'YouTube';

    if (info.captionMeta?.available) {
      el.ytCaptionPill.textContent = `Subtitle Otomatis Siap (${info.captionMeta.wordCount} kata)`;
      el.ytCaptionPill.className = 'pill-tag lime';
    } else {
      el.ytCaptionPill.textContent = 'Tanpa Subtitle Bawaan (Bisa Pakai Whisper/Gemini)';
      el.ytCaptionPill.className = 'pill-tag';
    }

    el.ytTitle.textContent =
      String(info.title || '')
        .replace(/\p{Extended_Pictographic}|\uFE0F|\u203C|\u2049/gu, '')
        .replace(/\s+/g, ' ')
        .trim() || info.title;
    el.ytQualitySelect.innerHTML = info.qualities
      .map((q) => {
        const sizeLabel = q.totalBytes > 0 ? ` — sekitar ${formatBytesReadable(q.totalBytes)}` : '';
        return `<option value="${escHtml(q.id)}" ${q.recommended ? 'selected' : ''}>${escHtml(q.label)}${escHtml(sizeLabel)}</option>`;
      })
      .join('');

    setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, false);
    el.ytPreviewCard.classList.add('visible');
    showToast('Video YouTube ditemukan! Pilih Simpan MP4 atau Muat ke Studio.');
  } catch (err) {
    setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, false);
    showError(err.message || 'Gagal mengambil informasi video YouTube.');
  } finally {
    el.btnYtFetch.disabled = false;
  }
}

async function runYoutubeDownloadAction(mode) {
  if (!state.ytInfo) return;
  showError('');
  if (el.ytPostDownloadHint) el.ytPostDownloadHint.style.display = 'none';

  const selectedQualityId = el.ytQualitySelect.value;
  el.btnYtImportStudio.disabled = true;
  el.btnYtDownloadMp4.disabled = true;
  el.btnYtFetch.disabled = true;
  el.btnYtCancel.style.display = 'inline-flex';

  const abortCtrl = new AbortController();
  state.ytAbortController = abortCtrl;

  try {
    if (mode === 'save') {
      const saved = await saveYoutubeMp4ToDevice({
        info: state.ytInfo,
        qualityId: selectedQualityId,
        signal: abortCtrl.signal,
        onProgress: ({ phase, percent }) => {
          setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, true, phase, percent);
        }
      });

      setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, false);
      if (el.ytPostDownloadHint) el.ytPostDownloadHint.style.display = 'block';
      showToast(`Unduhan "${saved.fileName}" dimulai! Masukkan videonya setelah selesai untuk dipotong AI Agent.`);
      return;
    }

    let downloaded = null;
    if (
      state.ytCachedDownload &&
      state.ytCachedDownload.videoId === state.ytInfo.videoId &&
      state.ytCachedDownload.qualityId === selectedQualityId
    ) {
      downloaded = state.ytCachedDownload;
    } else {
      const res = await downloadYoutubeAsMp4File({
        info: state.ytInfo,
        qualityId: selectedQualityId,
        signal: abortCtrl.signal,
        onProgress: ({ phase, percent }) => {
          setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, true, phase, percent);
        }
      });
      downloaded = {
        videoId: state.ytInfo.videoId,
        qualityId: selectedQualityId,
        file: res.file,
        moments: res.moments
      };
      state.ytCachedDownload = downloaded;
    }

    setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, false);

    await handleSelectedVideoFile(
      downloaded.file,
      downloaded.moments && downloaded.moments.length > 0 ? downloaded.moments : null,
      { forceRunAgent: true }
    );
  } catch (err) {
    setStatusBar(el.ytStatus, el.ytStatusText, el.ytProgressFill, false);
    if (err?.name !== 'AbortError') {
      showError(err.message || 'Gagal mengunduh video dari YouTube.');
    } else {
      showToast('Unduhan video YouTube dibatalkan.');
    }
  } finally {
    el.btnYtImportStudio.disabled = false;
    el.btnYtDownloadMp4.disabled = false;
    el.btnYtFetch.disabled = false;
    el.btnYtCancel.style.display = 'none';
    state.ytAbortController = null;
  }
}

async function triggerSampleVideoFromAnywhere() {
  switchView('wizard');
  switchStep(1);
  showError('');
  el.btnLoadSample.disabled = true;
  setStatusBar(
    el.step1Status,
    el.step1StatusText,
    el.step1ProgressFill,
    true,
    'Menyiapkan video contoh podcast 2 pembicara bersuara asli (20 detik)...',
    15
  );
  try {
    const { file, moments } = await createSamplePodcastMp4((pct) => {
      setStatusBar(
        el.step1Status,
        el.step1StatusText,
        el.step1ProgressFill,
        true,
        `Menyiapkan video contoh bersuara jernih (${pct}%)...`,
        pct
      );
    });
    await handleSelectedVideoFile(file, moments);
    showToast('Video contoh 2 pembicara bersuara jernih siap diputar!');
  } catch (err) {
    setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    showError(err.message || 'Gagal menyiapkan video contoh.');
  } finally {
    el.btnLoadSample.disabled = false;
  }
}

function syncPreviewToStart() {
  if (!state.file) return;
  if (el.hiddenVideo.currentTime < state.startSec || el.hiddenVideo.currentTime > state.endSec) {
    el.hiddenVideo.currentTime = state.startSec;
  }
}

function updatePlayButtonText() {
  const isPlaying = !el.hiddenVideo.paused && !el.hiddenVideo.ended;
  el.btnTogglePlay.textContent = isPlaying ? 'Jeda Preview' : 'Putar Preview';
  if (el.btnStep2PlayAudio) {
    el.btnStep2PlayAudio.textContent =
      isPlaying && state.activeStep === 2 ? 'Hentikan Suara' : 'Dengarkan Suara Momen Ini';
  }
  if (!isPlaying && el.step2AudioTime && state.activeStep === 2) {
    el.step2AudioTime.textContent = `Rentang aktif: ${formatDuration(state.startSec)} – ${formatDuration(state.endSec)} (${Math.max(0.5, state.endSec - state.startSec).toFixed(1)} dtk)`;
  }
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
    if (state.activeStep === 2 && el.step2AudioTime) {
      const cur = Math.max(0, el.hiddenVideo.currentTime - state.startSec);
      const tot = Math.max(0.5, state.endSec - state.startSec);
      el.step2AudioTime.textContent = `Memutar suara momen: ${cur.toFixed(1)} dtk / ${tot.toFixed(1)} dtk`;
    }
    if (state.activeStep === 3) {
      renderPreviewOnce();
    }
  }
  requestAnimationFrame(previewAnimationLoop);
}

/* ================= BINDING SELURUH INTERAKSI ================= */
function bindEvents() {
  // Login Pembeli & Akses Cepat Kreator Utama (Salted SHA-256)
  const hideLoginError = () => {
    if (el.loginError) {
      el.loginError.style.display = 'none';
      el.loginError.textContent = '';
    }
  };
  el.loginName?.addEventListener('input', hideLoginError);
  el.loginEmail?.addEventListener('input', hideLoginError);
  el.loginCode?.addEventListener('input', hideLoginError);

  el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = el.loginName.value.trim();
    const rawEmail = el.loginEmail.value.trim();
    const codeHash = hashLicenseCode(el.loginCode.value);

    const showLoginErr = (msg, inputEl) => {
      el.loginError.textContent = msg;
      el.loginError.style.display = 'block';
      inputEl?.focus();
    };

    if (CREATOR_MASTER_HASHES.has(codeHash)) {
      const isDevAgent = DEV_AGENT_HASHES.has(codeHash);
      const creatorName = rawName || (isDevAgent ? 'Tim Developer' : 'Nifari (Kreator Utama)');
      const creatorEmail = rawEmail || (isDevAgent ? 'dev@klipauto.id' : 'creator@nifari.id');
      state.user = {
        name: creatorName,
        email: creatorEmail,
        role: 'creator',
        codeHash
      };
    } else {
      if (!rawName) {
        showLoginErr('Isi nama panggilan atau nama channel-mu dulu ya.', el.loginName);
        return;
      }
      if (!EMAIL_REGEX.test(rawEmail)) {
        showLoginErr('Masukkan alamat email yang valid (contoh: nama@email.com).', el.loginEmail);
        return;
      }
      if (codeHash !== OFFICIAL_BUYER_HASH) {
        showLoginErr(
          'Kode akses belum sesuai. Cek lagi kode dari bukti pembelianmu, atau ambil akses resmi di halaman produk.',
          el.loginCode
        );
        return;
      }
      state.user = {
        name: rawName,
        email: rawEmail,
        role: 'buyer',
        codeHash
      };
    }

    hideLoginError();
    saveJson(KEYS.USER, state.user);
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      state.settings.creatorName = state.user.name.split('(')[0].trim();
      saveJson(KEYS.SETTINGS, state.settings);
    }
    syncAuthView();
    showToast('Selamat datang di Klip Auto Studio!');
  });

  el.btnLogout.addEventListener('click', () => {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
    if (el.loginCode) el.loginCode.value = '';
    hideLoginError();
    el.hiddenVideo.pause();
    syncAuthView();
  });

  // Navigasi Sidebar & Mobile
  for (const btn of el.navItems) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  for (const mbtn of el.mnavBtns) {
    mbtn.addEventListener('click', () => switchView(mbtn.dataset.mview));
  }
  el.btnOpenSidebar.addEventListener('click', () => {
    el.sidebar.classList.add('open');
    el.sidebarOverlay.classList.add('open');
  });
  el.sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Dashboard Shortcuts
  el.dashBtnOpenWizard.addEventListener('click', () => switchView('wizard'));
  el.dashBtnYoutube?.addEventListener('click', () => {
    switchView('wizard');
    switchStep(1);
    setTimeout(() => el.ytUrlInput?.focus(), 60);
  });
  el.dashBtnQuickSample.addEventListener('click', () => triggerSampleVideoFromAnywhere());
  el.wizTopSampleBtn.addEventListener('click', () => triggerSampleVideoFromAnywhere());
  el.dashSeeAllHistory.addEventListener('click', () => switchView('history'));

  document.getElementById('stat-go-history')?.addEventListener('click', () => switchView('history'));
  document.getElementById('stat-go-wizard')?.addEventListener('click', () => switchView('wizard'));
  document.getElementById('stat-go-library')?.addEventListener('click', () => switchView('library'));
  document.getElementById('stat-go-favorites')?.addEventListener('click', () => switchView('favorites'));

  for (const jumpBtn of document.querySelectorAll('[data-jump-step]')) {
    jumpBtn.addEventListener('click', () => {
      const targetStep = Number(jumpBtn.dataset.jumpStep) || 1;
      switchView('wizard');
      if (targetStep > 1 && !state.file) {
        switchStep(1);
        showError('Pilih atau muat video dulu di Langkah 1 ya.');
        showToast('Pilih atau muat video dulu di Langkah 1 ya.');
        return;
      }
      switchStep(targetStep);
    });
  }

  // Library Search, Filter & Modal
  el.libSearchInput.addEventListener('input', () => {
    state.libQuery = el.libSearchInput.value;
    renderLibraryGrid();
  });
  el.libNicheSelect.addEventListener('change', () => {
    state.libNiche = el.libNicheSelect.value;
    renderLibraryGrid();
  });
  el.modalBtnClose.addEventListener('click', closeLibraryModal);
  el.libModal.addEventListener('click', (e) => {
    if (e.target === el.libModal) closeLibraryModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.libModal?.classList.contains('open')) {
        closeLibraryModal();
      }
      if (el.sidebar?.classList.contains('open')) {
        closeMobileSidebar();
      }
    }
  });

  el.modalBtnCopy.addEventListener('click', async () => {
    const item = CREATOR_LIBRARY_ITEMS.find((i) => i.id === state.modalItemId);
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.example);
    } catch {}
    showToast('Contoh teks berhasil disalin!');
  });

  el.modalBtnFav.addEventListener('click', () => {
    if (!state.modalItemId) return;
    const idx = state.favorites.indexOf(state.modalItemId);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      showToast('Dihapus dari Koleksi Favorit.');
    } else {
      state.favorites.push(state.modalItemId);
      showToast('Disimpan ke Koleksi Favorit!');
    }
    saveJson(KEYS.FAVORITES, state.favorites);
    el.modalBtnFav.textContent = state.favorites.includes(state.modalItemId)
      ? 'Hapus dari Favorit'
      : 'Simpan Favorit';
    refreshDashboardAndBadges();
    if (state.activeView === 'library') renderLibraryGrid();
    if (state.activeView === 'favorites') renderFavoritesGrid();
  });

  el.modalBtnUseHook.addEventListener('click', () => {
    const item = CREATOR_LIBRARY_ITEMS.find((i) => i.id === state.modalItemId);
    if (!item) return;
    state.hookTitle = item.hook;
    el.hookTitleInput.value = item.hook;
    closeLibraryModal();
    switchView('wizard');
    if (state.file) {
      renderPreviewOnce();
    }
    showToast('Judul hook dipasang ke Studio Klip!');
  });

  el.btnOpenHookPicker.addEventListener('click', () => {
    state.libCategory = 'Hook Judul Atas';
    renderCategoryPills();
    switchView('library');
  });

  // History & Settings
  el.btnClearHistory.addEventListener('click', () => {
    if (state.history.length === 0) {
      showToast('Riwayat render sudah kosong.');
      return;
    }
    if (!window.confirm('Yakin mau menghapus semua riwayat render?')) {
      return;
    }
    state.history = [];
    saveJson(KEYS.HISTORY, state.history);
    renderHistory();
    refreshDashboardAndBadges();
    showToast('Riwayat render dibersihkan.');
  });

  el.btnSaveSettings.addEventListener('click', () => {
    state.settings = {
      creatorName: el.setCreatorName.value.trim() || 'Kreator',
      defaultWatermark: el.setDefaultWatermark.value.trim(),
      defaultPreset: el.setDefaultPreset.value || 'kreator-kuning'
    };
    saveJson(KEYS.SETTINGS, state.settings);

    const k = el.setGeminiKey.value.trim();
    localStorage.setItem(KEYS.GEMINI, k);
    el.geminiKeyInput.value = k;

    state.presetId = state.settings.defaultPreset;
    state.watermarkText = state.settings.defaultWatermark;
    el.watermarkTextInput.value = state.watermarkText;
    renderPresetButtons();
    syncAuthView();
    showToast('Pengaturan studio berhasil disimpan!');
  });

  el.btnExportJson.addEventListener('click', () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      favorites: state.favorites,
      history: state.history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadangan-klip-auto-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('File cadangan JSON berhasil diunduh!');
  });

  el.btnImportJson.addEventListener('click', () => el.importJsonInput.click());
  el.importJsonInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed.settings) {
        state.settings = parsed.settings;
        saveJson(KEYS.SETTINGS, state.settings);
      }
      if (Array.isArray(parsed.favorites)) {
        state.favorites = parsed.favorites;
        saveJson(KEYS.FAVORITES, state.favorites);
      }
      if (Array.isArray(parsed.history)) {
        state.history = parsed.history;
        saveJson(KEYS.HISTORY, state.history);
      }
      populateSettingsForm();
      syncAuthView();
      showToast('Data cadangan berhasil dipulihkan!');
    } catch {
      showToast('Format file cadangan JSON tidak valid.');
    }
  });

  // Wizard Core Events
  for (const tab of el.stepTabs) {
    tab.addEventListener('click', () => switchStep(Number(tab.dataset.step)));
  }

  // Link YouTube: Cek Info, Simpan MP4, atau Muat ke Studio
  el.btnYtFetch?.addEventListener('click', () => handleFetchYoutubeInfo());
  el.ytUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchYoutubeInfo();
    }
  });
  el.btnYtImportStudio?.addEventListener('click', () => runYoutubeDownloadAction('import'));
  el.btnYtDownloadMp4?.addEventListener('click', () => runYoutubeDownloadAction('save'));
  el.btnYtCancel?.addEventListener('click', () => {
    if (state.ytAbortController) state.ytAbortController.abort();
  });

  el.btnPickFile.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) {
      el.fileInput.value = '';
      handleSelectedVideoFile(f);
    }
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

  // Kontrol AI Agent Pemotong Klip Otomatis
  el.agentAutoRunCheckbox?.addEventListener('change', () => {
    state.agentAutoRun = Boolean(el.agentAutoRunCheckbox.checked);
    if (el.agentStatePill && !state.agentRunning) {
      el.agentStatePill.textContent = state.agentAutoRun
        ? 'AI Agent Aktif Otomatis'
        : 'Mode Manual (Klik untuk Jalankan)';
      el.agentStatePill.className = state.agentAutoRun ? 'pill-tag lime' : 'pill-tag';
    }
  });

  el.agentClipCountSelect?.addEventListener('change', () => {
    state.agentClipCount = Number(el.agentClipCountSelect.value || 3);
  });

  el.btnRunAiAgent?.addEventListener('click', () => {
    startAiClipAgent(null);
  });

  el.btnCopyAiPrompt?.addEventListener('click', () => {
    copyAiHandoffPrompt();
  });
  el.btnCopyAiPromptStep2?.addEventListener('click', () => {
    copyAiHandoffPrompt();
  });

  el.btnStopAiAgent?.addEventListener('click', () => {
    if (state.agentAbortController) {
      state.agentAbortController.abort();
    }
  });

  el.btnDownloadAllAgent?.addEventListener('click', () => {
    if (!state.agentRenderedClips.length) return;
    state.agentRenderedClips.forEach((clip, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = clip.objectUrl;
        a.download = clip.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, idx * 450);
    });
    showToast(`Mengunduh ${state.agentRenderedClips.length} klip MP4 ke perangkatmu...`);
  });

  el.btnLoadSample.addEventListener('click', () => triggerSampleVideoFromAnywhere());
  el.btnSkipToStep2.addEventListener('click', () => switchStep(2));

  // Impor Subtitle .SRT / .VTT Instan
  el.btnPickSrt.addEventListener('click', () => el.srtFileInput.click());
  el.srtFileInput.addEventListener('change', async (e) => {
    const srtFile = e.target.files?.[0];
    if (!srtFile || !state.file || !state.mediaInfo) return;
    try {
      const rawText = await srtFile.text();
      const words = parseSubtitleToWords(rawText, state.mediaInfo.duration);
      if (words.length === 0) {
        showError('File subtitle tidak berisi penanda waktu standar .SRT / .VTT.');
        return;
      }
      const moments = pickMomentsFromWordsLocally(words, state.mediaInfo.duration);
      if (moments.length > 0) {
        state.moments = moments;
        applyMomentSelection(moments[0]);
      } else {
        state.transcriptManuallyEdited = false;
        state.words = words;
        el.clipTranscriptInput.value = words.map((w) => w.word).join(' ');
        rebuildPhrases();
      }
      refreshDashboardAndBadges();
      switchStep(2);
      showToast('Subtitle berhasil dipetakan ke daftar momen!');
    } catch (err) {
      showError(err.message || 'Gagal membaca file subtitle.');
    }
  });

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
      refreshDashboardAndBadges();
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
      refreshDashboardAndBadges();
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      switchStep(2);
    } catch (err) {
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
      showError(err.message);
    } finally {
      el.btnAnalyzeWhisper.disabled = false;
    }
  });

  const applyClipRangeUpdate = (rawStart, rawEnd) => {
    if (!state.mediaInfo) return;
    let s = Math.max(0, Number(rawStart) || 0);
    let e = Math.min(state.mediaInfo.duration, Number(rawEnd) || s + 5);
    if (e <= s + 0.5) e = Math.min(state.mediaInfo.duration, s + 1);
    state.startSec = Number(s.toFixed(2));
    state.endSec = Number(e.toFixed(2));
    syncStartEndInputsAndSliders();

    const selectedMoment = state.moments.find((m) => m.id === state.selectedMomentId);
    if (state.transcriptManuallyEdited) {
      const editedText =
        el.clipTranscriptInput.value ||
        (Array.isArray(state.words) ? state.words.map((w) => w.word).join(' ') : '');
      state.words = buildWordsFromTextAndWindow(editedText, state.startSec, state.endSec);
    } else if (selectedMoment && Array.isArray(selectedMoment.words) && selectedMoment.words.length > 0) {
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

  el.clipStartInput.addEventListener('change', () =>
    applyClipRangeUpdate(el.clipStartInput.value, el.clipEndInput.value)
  );
  el.clipEndInput.addEventListener('change', () =>
    applyClipRangeUpdate(el.clipStartInput.value, el.clipEndInput.value)
  );
  el.sliderClipStart.addEventListener('input', () =>
    applyClipRangeUpdate(el.sliderClipStart.value, el.sliderClipEnd.value)
  );
  el.sliderClipEnd.addEventListener('input', () =>
    applyClipRangeUpdate(el.sliderClipStart.value, el.sliderClipEnd.value)
  );

  el.clipTranscriptInput.addEventListener('input', () => {
    state.transcriptManuallyEdited = true;
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
        state.transcriptManuallyEdited = false;
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

  el.btnStep2PlayAudio?.addEventListener('click', () => {
    if (!state.file) return;
    ensurePreviewAudioGraph();
    if (el.hiddenVideo.paused) {
      state.previewMuted = false;
      syncPreviewAudioGraphParams();
      el.hiddenVideo.currentTime = state.startSec;
      el.hiddenVideo.play().catch(() => {});
    } else {
      el.hiddenVideo.pause();
    }
  });

  el.hiddenVideo.addEventListener('loadeddata', () => renderPreviewOnce());
  el.hiddenVideo.addEventListener('seeked', () => renderPreviewOnce());
  el.hiddenVideo.addEventListener('play', updatePlayButtonText);
  el.hiddenVideo.addEventListener('pause', updatePlayButtonText);

  el.btnTogglePlay.addEventListener('click', () => {
    if (!state.file) return;
    ensurePreviewAudioGraph();
    if (el.hiddenVideo.paused) {
      if (el.hiddenVideo.currentTime < state.startSec || el.hiddenVideo.currentTime >= state.endSec) {
        el.hiddenVideo.currentTime = state.startSec;
      }
      el.hiddenVideo.play().catch(() => {});
    } else {
      el.hiddenVideo.pause();
    }
  });

  el.btnToggleMute?.addEventListener('click', () => {
    state.previewMuted = !state.previewMuted;
    ensurePreviewAudioGraph();
    syncPreviewAudioGraphParams();
  });

  el.audioVolumeRange?.addEventListener('input', () => {
    const pct = Number(el.audioVolumeRange.value);
    state.volumeGain = Math.max(0, Math.min(2, pct / 100));
    if (state.volumeGain > 0 && state.previewMuted) {
      state.previewMuted = false;
    }
    syncPreviewAudioGraphParams();
  });

  el.voiceBoostCheckbox?.addEventListener('change', () => {
    state.voiceBoost = Boolean(el.voiceBoostCheckbox.checked);
    syncPreviewAudioGraphParams();
  });

  el.monoStereoCheckbox?.addEventListener('change', () => {
    state.monoToStereo = Boolean(el.monoStereoCheckbox.checked);
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
    el.btnScanFacePreview.textContent = 'Memindai posisi wajah...';
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
      el.btnScanFacePreview.textContent = 'Posisi Wajah Terkunci di Tengah';
      showToast('Fokus wajah dikunci di tengah bingkai 9:16!');
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
        voiceBoost: state.voiceBoost,
        volumeGain: state.volumeGain,
        monoToStereo: state.monoToStereo,
        signal: abortController.signal,
        onProgress: ({ phase, percent }) => {
          setStatusBar(el.renderStatus, el.renderStatusText, el.renderProgressFill, true, phase, percent);
        }
      });

      state.previewCameraTrack = result.cameraTrack;
      if (state.resultObjectUrl) URL.revokeObjectURL(state.resultObjectUrl);
      state.resultObjectUrl = URL.createObjectURL(result.blob);

      const sizeMb = (result.sizeBytes / (1024 * 1024)).toFixed(2);
      el.resultMeta.textContent = `Resolusi ${result.width}×${result.height} (9:16) · Durasi ${result.durationSec.toFixed(1)} dtk · Ukuran ${sizeMb} MB · Selesai dalam ${result.renderSeconds} detik`;
      el.resultVideo.src = state.resultObjectUrl;
      el.btnDownloadMp4.href = state.resultObjectUrl;
      el.btnDownloadMp4.download = `klip-auto-${Date.now()}.mp4`;
      el.resultBox.style.display = 'block';

      recordRenderedHistory(result);
      showToast('Klip MP4 9:16 selesai dirender & siap disimpan!');
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
initLibraryControls();
renderPresetButtons();
bindEvents();
syncAuthView();
requestAnimationFrame(previewAnimationLoop);

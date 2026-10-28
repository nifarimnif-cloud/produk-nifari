/**
 * Klip Auto Studio — Pengendali Utama Aplikasi Pembeli & Mesin Pemotong 9:16
 * Menggabungkan: Login Pembeli, Beranda Editorial, Wizard Pemotong 3 Langkah
 * (WebCodecs + MediaBunny + FaceTracker + Whisper/Gemini/SRT),
 * Pustaka 120 Koleksi Kreator, Riwayat Render, Favorit, Pengaturan & Tema Terang/Gelap.
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
import { CREATOR_CATEGORIES, CREATOR_LIBRARY_ITEMS } from './data/creator-library.js';

const KEYS = {
  USER: 'klip_auto_user_v1',
  SETTINGS: 'klip_auto_settings_v1',
  HISTORY: 'klip_auto_history_v1',
  FAVORITES: 'klip_auto_favs_v1',
  GEMINI: 'klip_auto_gemini_key',
  THEME: 'klip_auto_theme_v2'
};

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
  user: loadJson(KEYS.USER, null),
  settings: loadJson(KEYS.SETTINGS, {
    creatorName: 'Raka Pratama',
    defaultWatermark: '@obrolanbisnis',
    defaultPreset: 'kreator-kuning'
  }),
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),

  activeView: 'dashboard',
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

  btnOpenHookPicker: document.getElementById('btn-open-hook-picker'),
  momentsContainer: document.getElementById('moments-container'),
  labelClipDuration: document.getElementById('label-clip-duration'),
  clipStartInput: document.getElementById('clip-start-input'),
  clipEndInput: document.getElementById('clip-end-input'),
  sliderClipStart: document.getElementById('slider-clip-start'),
  sliderClipEnd: document.getElementById('slider-clip-end'),
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
  if (viewName === 'history') renderHistoryPage();
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

/* ================= PUSTAKA 120 KOLEKSI KREATOR ================= */
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
        <button type="button" class="btn btn-primary btn-sm" id="fav-go-lib-btn">Jelajahi 120 Pustaka Kreator</button>
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

function renderHistoryPage() {
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
      showToast('Judul hook & preset caption diterapkan ke Studio!');
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
    showError('Pilih file video dulu atau klik tombol "Coba Video Contoh 2 Pembicara" di Langkah 1.');
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
  state.words = Array.isArray(moment.words) && moment.words.length > 0
    ? moment.words.map((w) => ({ ...w }))
    : buildWordsFromTextAndWindow(moment.transcript || '', moment.startSec, moment.endSec);

  syncStartEndInputsAndSliders();
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

    if (prebuiltMoments && prebuiltMoments.length > 0) {
      state.moments = prebuiltMoments;
      applyMomentSelection(prebuiltMoments[0]);
      refreshDashboardAndBadges();
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
      refreshDashboardAndBadges();
      setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    }
  } catch (err) {
    setStatusBar(el.step1Status, el.step1StatusText, el.step1ProgressFill, false);
    showError(err.message || 'Gagal membuka file video tersebut.');
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
}

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

/* ================= BINDING SELURUH INTERAKSI ================= */
function bindEvents() {
  // Login
  el.btnDemoLogin.addEventListener('click', () => {
    el.loginName.value = 'Raka Pratama (@obrolanbisnis)';
    el.loginEmail.value = 'raka@studio-kreatif.id';
    el.loginCode.value = 'KLIP-AUTO-2026';
    el.loginError.style.display = 'none';
  });

  el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.loginName.value.trim();
    const email = el.loginEmail.value.trim();
    const code = el.loginCode.value.trim().toUpperCase();

    if (!name || !email || code.length < 6) {
      el.loginError.textContent = 'Mohon isi nama, email, dan kode lisensi yang valid (misal: KLIP-AUTO-2026).';
      el.loginError.style.display = 'block';
      return;
    }

    state.user = { name, email, license: code };
    saveJson(KEYS.USER, state.user);
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      state.settings.creatorName = name.split('(')[0].trim();
      saveJson(KEYS.SETTINGS, state.settings);
    }
    syncAuthView();
    showToast('Selamat datang di Klip Auto Studio!');
  });

  el.btnLogout.addEventListener('click', () => {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
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
      if (targetStep === 1 || state.file) {
        switchStep(targetStep);
      }
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
    state.history = [];
    saveJson(KEYS.HISTORY, state.history);
    renderHistoryPage();
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
      el.hiddenVideo.play().catch(() => {});
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

/**
 * Klip Auto Studio v2.2 — Pengendali Utama Ruang Kerja Terotentikasi & Mesin Pemotong 9:16
 * PENTING (Sesuai GUIDE-KLIP-AUTO.md):
 * - TIDAK ADA kode lisensi, hash, maupun salt di dalam file ini (100% divalidasi oleh server).
 * - Copy-Paste Link YouTube Tanpa Ekstensi Tambahan + Unduh Video YouTube Utuh (.MP4 360p–1080p).
 * - Subtitle Anti-Miss (Penyelaras Vokal Presisi 10ms + Jembatan Jeda Mikro + Tambal Otomatis Whisper-Small).
 * - Pemilih 9 Jenis Font Subtitle Kreator + Pengatur Ukuran & Kapitalisasi Huruf.
 */

import { ALL_FORMATS, BlobSource, CanvasSink, Input } from './vendor/mediabunny.min.mjs';
import { renderDeviceCheckIntoContainer } from './auth-boot.js';
import { CREATOR_CATEGORIES, CREATOR_LIBRARY_ITEMS } from './data/creator-library.js';
import { craftCleanHookTitle, runAutonomousClipAgent } from './engine/ai-clip-agent.js';
import {
  createSamplePodcastMp4,
  extractMonoAudio,
  probeMediaFile
} from './engine/audio-processor.js';
import {
  CAPTION_FONTS,
  CAPTION_PRESETS,
  drawClipFrame,
  ensureCaptionFontLoaded,
  getCaptionFontById,
  groupWordsIntoPhrases
} from './engine/caption-presets.js';
import { assertSufficientDiskForRender, runDeviceReadinessCheck } from './engine/device-checker.js';
import {
  buildFaceTrackForClip,
  resolveEffectiveFrameMode,
  sampleCameraCenterX
} from './engine/face-tracker.js';
import {
  APP_CLIENT_VERSION,
  checkServerVersionInfo,
  logoutLicenseSession,
  releaseCurrentDevice,
  sendSanitizedErrorReport
} from './engine/license-client.js';
import { renderClipToMp4 } from './engine/mp4-exporter.js';
import {
  analyzePodcastWithGemini,
  buildWordsFromTextAndWindow,
  ensureZeroMissClipSubtitles,
  lockEditedTextToClipVocal,
  pickMomentsFromWordsLocally,
  sliceSourceWordsForWindow,
  syncClipWordsWithWhisper,
  transcribeAndPickWithWhisperWeb
} from './engine/transcriber-moments.js';
import {
  analyzeVocalEnvelope,
  refineWhisperWordsWithVocal,
  snapClipBoundsToBreathPause
} from './engine/vocal-aligner.js';
import {
  detectCompanionBridge,
  downloadYoutubeAsMp4File,
  fetchYoutubeVideoInfo,
  pickQualityOption,
  saveYoutubeMp4ToDevice
} from './engine/youtube-downloader.js';

const KEYS = {
  SETTINGS: 'klip_auto_settings_v2',
  HISTORY: 'klip_auto_history_v2',
  FAVORITES: 'klip_auto_favs_v2',
  GEMINI: 'klip_auto_gemini_key',
  THEME: 'klip_auto_theme_v2'
};

const DEFAULT_CAPTION_PLACEHOLDER =
  'Ketik kalimat pembicara di sini atau gunakan fitur transkrip Whisper-Small di Langkah 1.';

const state = {
  booted: false,
  session: null,
  user: null,
  tier: 'inti',
  tierLabel: 'Paket Inti',
  features: {
    extraPresets: false,
    customWatermark: false,
    descriptionHashtagGenerator: false,
    gamingSplit: false,
    multiVideoBatch: false
  },
  settings: {
    creatorName: '',
    defaultWatermark: '',
    defaultPreset: 'kreator-kuning',
    defaultFont: 'jakarta',
    geminiKey: ''
  },
  history: [],
  favorites: new Set(),
  activeView: 'dashboard',
  libCategory: 'Semua',
  libNiche: 'Semua',
  libQuery: '',
  modalItem: null,

  // State Mesin Pemotong 9:16
  file: null,
  videoObjectUrl: null,
  mediaInfo: null,
  ytInfo: null,
  ytDownloadedCache: null,
  ytAbortController: null,
  ytHeatmap: null,
  moments: [],
  scoringMeta: null,
  selectedMomentIndex: 0,
  clipStartSec: 0,
  clipEndSec: 15,
  words: [],
  fullSourceWords: null,
  transcriptManuallyEdited: false,
  captionOffsetSec: 0,
  vocalEnvelope: null,
  vocalClipSamples: null,
  vocalAnalysisToken: 0,

  presetId: 'kreator-kuning',
  fontFamilyId: 'jakarta',
  fontScale: 1.0,
  textCase: 'auto',
  frameMode: 'auto',
  autoFaceCenter: true,
  manualCenterXOffset: 0,
  cameraTrack: null,
  hookTitle: '',
  hookStyle: 'white',
  hookDurationSec: 3.0,
  watermarkImage: null,
  watermarkText: '',
  watermarkPos: 'top-right',
  resolution: '720p',
  voiceBoost: true,
  volumeGain: 1.0,
  monoToStereo: true,
  isPlayingPreview: false,
  isPreviewMuted: false,
  previewRafId: null,
  previewWebAudioCtx: null,
  previewWebAudioGain: null,
  previewStaticInput: null,
  previewStaticSink: null,
  previewStaticBusy: false,
  previewStaticPendingSec: null,
  step2AudioEl: null,
  step2AudioRafId: null,
  renderAbortController: null,
  lastRenderedObjectUrl: null,

  // Batch Klip Otomatis & Multi-Video
  agentAutoRun: true,
  agentClipCount: 3,
  agentAbortController: null,
  agentRenderedClips: [],
  agentFailedClips: [],
  multiVideoQueue: [],

  // Catatan Diagnostik (Tanpa Data Pribadi / Tanpa Nama File Pembeli)
  diagnosticLogs: []
};

const $ = (id) => document.getElementById(id);

function recordDiagnostic(eventMsg) {
  const stamp = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  state.diagnosticLogs.push(`[${stamp}] ${String(eventMsg || '').slice(0, 260)}`);
  if (state.diagnosticLogs.length > 40) {
    state.diagnosticLogs.shift();
  }
}

/* ============================================================================
 * 1. UTILITAS PENYIMPANAN LOKAL & TEMA
 * ============================================================================ */

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Abaikan bila mode privat penuh
  }
}

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function showError(msg) {
  recordDiagnostic(`Kendala UI: ${msg}`);
  const el = $('global-error');
  if (!el) return;
  if (!msg) {
    el.classList.remove('visible');
    el.textContent = '';
    return;
  }
  el.textContent = msg;
  el.classList.add('visible');
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {}
}

function setStatus(prefix, visible, text = '', percent = null) {
  const bar = $(`${prefix}-status`);
  const txt = $(`${prefix}-status-text`);
  const fill = $(`${prefix}-progress-fill`);
  if (!bar) return;
  if (!visible) {
    bar.classList.remove('visible');
    return;
  }
  bar.classList.add('visible');
  if (txt && text) txt.textContent = text;
  if (fill && percent !== null) {
    fill.style.width = `${Math.max(2, Math.min(100, percent))}%`;
  }
}

function formatClock(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(KEYS.THEME, next);
  } catch {}
  const btn = $('theme-toggle');
  if (btn) btn.textContent = next === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  drawVocalSyncTimeline();
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

/* ============================================================================
 * 2. PEMBUKAAN RUANG STUDIO TEROTENTIKASI & PEMBATASAN PAKET (INTI / TAMBAHAN / PRO)
 * ============================================================================ */

function loadLocalPreferences() {
  const savedSettings = readJson(KEYS.SETTINGS, null);
  if (savedSettings && typeof savedSettings === 'object') {
    state.settings = { ...state.settings, ...savedSettings };
  }
  const savedHistory = readJson(KEYS.HISTORY, []);
  if (Array.isArray(savedHistory)) state.history = savedHistory;

  const savedFavs = readJson(KEYS.FAVORITES, []);
  if (Array.isArray(savedFavs)) state.favorites = new Set(savedFavs);

  try {
    const legacyGem = localStorage.getItem(KEYS.GEMINI);
    if (legacyGem && !state.settings.geminiKey) {
      state.settings.geminiKey = legacyGem;
    }
  } catch {}

  state.presetId = state.settings.defaultPreset || 'kreator-kuning';
  state.fontFamilyId = state.settings.defaultFont || 'jakarta';
  if (state.features.customWatermark && state.settings.defaultWatermark) {
    state.watermarkText = state.settings.defaultWatermark;
  } else {
    state.watermarkText = '';
  }
}

function applyPackageTierPermissions() {
  const f = state.features || {};

  // Badge sidebar & beranda
  const sideBadge = $('sidebar-tier-badge');
  if (sideBadge) {
    sideBadge.textContent = `${state.tierLabel} · v${APP_CLIENT_VERSION}`;
  }
  const dashEyebrow = $('dash-package-eyebrow');
  if (dashEyebrow) {
    dashEyebrow.textContent = `${state.tierLabel} Aktif · Tanpa Kuota Klip`;
  }

  // Ringkasan lisensi & masa aktif offline di Pengaturan
  const licSum = $('settings-license-summary');
  if (licSum && state.session) {
    const daysLeft = Math.max(
      1,
      Math.ceil(((state.session.leaseExpiresAt || Date.now()) - Date.now()) / (24 * 3600 * 1000))
    );
    const modeNote = state.session.offlineMode
      ? `Mode Offline Aktif (sisa masa pakai offline ${daysLeft} hari)`
      : `Terhubung & Tervalidasi Server (bisa dipakai offline hingga ${daysLeft} hari ke depan)`;
    licSum.textContent = `Paket: ${state.tierLabel} · Perangkat: ${
      state.session.deviceLabel || 'Laptop Ini'
    } · ${modeNote}.`;
  }

  // Pita informasi offline / pembaruan versi
  const verBanner = $('version-update-banner');
  const verText = $('version-banner-text');
  const verReloadBtn = $('btn-reload-version');
  if (verBanner && verText) {
    if (state.session?.offlineMode) {
      const d = state.session.offlineDaysRemaining || 7;
      verBanner.classList.add('visible');
      verText.textContent = `Mode Offline Aktif — Klip Auto berjalan penuh tanpa internet (${d} hari tersisa sebelum verifikasi ulang). Pemrosesan link YouTube memerlukan internet; pilih file video lokal (.mp4/.mov/.mkv) untuk langsung memotong.`;
      if (verReloadBtn) verReloadBtn.style.display = 'none';
    } else if (window.__KLIP_SERVER_VERSION_INFO?.hasNewerVersion) {
      verBanner.classList.add('visible');
      verText.textContent = `Versi baru Klip Auto v${window.__KLIP_SERVER_VERSION_INFO.version} tersedia di server.`;
      if (verReloadBtn) {
        verReloadBtn.style.display = 'inline-flex';
        verReloadBtn.onclick = () => window.location.reload();
      }
    } else {
      verBanner.classList.remove('visible');
    }
  }

  // Watermark Nama Sendiri / Logo (Paket Tambahan & Pro)
  const wmText = $('watermark-text-input');
  const wmPos = $('watermark-pos-select');
  const wmFile = $('watermark-file-input');
  const setDefWm = $('set-default-watermark');
  if (!f.customWatermark) {
    state.watermarkText = '';
    state.watermarkImage = null;
    if (wmText) {
      wmText.value = '';
      wmText.disabled = true;
      wmText.placeholder = 'Tersedia di Paket Tambahan (Rp 49.000)';
    }
    if (wmPos) wmPos.disabled = true;
    if (wmFile) wmFile.disabled = true;
    if (setDefWm) {
      setDefWm.value = '';
      setDefWm.disabled = true;
      setDefWm.placeholder = 'Tersedia di Paket Tambahan';
    }
  } else {
    if (wmText) {
      wmText.disabled = false;
      wmText.value = state.watermarkText || '';
    }
    if (wmPos) wmPos.disabled = false;
    if (wmFile) wmFile.disabled = false;
    if (setDefWm) setDefWm.disabled = false;
  }

  // Generator Deskripsi & Hashtag (Paket Tambahan & Pro)
  const descBtn = $('btn-generate-desc');
  const descPill = $('desc-gen-tier-pill');
  if (descPill) {
    descPill.textContent = f.descriptionHashtagGenerator
      ? 'Aktif di Paketmu'
      : 'Khusus Paket Tambahan';
    descPill.classList.toggle('lime', Boolean(f.descriptionHashtagGenerator));
  }
  if (descBtn) {
    descBtn.textContent = f.descriptionHashtagGenerator
      ? 'Buat Deskripsi & Hashtag'
      : 'Tersedia di Paket Tambahan (Rp 49.000)';
  }

  // Gaming Split & Batch Multi-Video (Paket Pro)
  const frameSelect = $('frame-mode-select');
  if (frameSelect) {
    const gamingOpt = frameSelect.querySelector('option[value="gaming-split"]');
    if (gamingOpt) {
      gamingOpt.disabled = !f.gamingSplit;
      gamingOpt.textContent = f.gamingSplit
        ? 'Gaming Split — Facecam Atas + Gameplay Bawah (Aktif)'
        : 'Gaming Split — Facecam + Gameplay (Segera di Paket Pro)';
    }
  }

  const multiBtn = $('btn-pick-multi-video');
  const multiNote = $('pro-multivideo-note');
  if (multiBtn) {
    multiBtn.textContent = f.multiVideoBatch
      ? 'Pilih Banyak Video Sekaligus'
      : 'Segera di Paket Pro';
  }
  if (multiNote && !f.multiVideoBatch) {
    multiNote.textContent =
      'Fitur antrean banyak file video sekaligus tersedia pada Paket Pro. Gunakan pemotong 1 video panjang (hingga 120 menit) di atas.';
  }
}

export async function bootStudioWithSession(session) {
  state.session = session;
  state.user = session?.user || { name: 'Kreator Studio', email: '' };
  state.tier = session?.tier || 'inti';
  state.tierLabel = session?.tierLabel || 'Paket Inti';
  state.features = {
    extraPresets: Boolean(session?.features?.extraPresets),
    customWatermark: Boolean(session?.features?.customWatermark),
    descriptionHashtagGenerator: Boolean(session?.features?.descriptionHashtagGenerator),
    gamingSplit: Boolean(session?.features?.gamingSplit),
    multiVideoBatch: Boolean(session?.features?.multiVideoBatch)
  };

  loadLocalPreferences();
  if (!state.settings.creatorName && state.user?.name) {
    state.settings.creatorName = state.user.name;
  }

  // Pastikan preset tersimpan sesuai hak paket
  const chosenPreset = CAPTION_PRESETS.find((p) => p.id === state.presetId);
  if (chosenPreset?.tier === 'tambahan' && !state.features.extraPresets) {
    state.presetId = 'kreator-kuning';
  }

  const loginScreen = $('login-screen');
  const appLayout = $('app-layout');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (appLayout) appLayout.classList.add('active');

  if (!state.booted) {
    state.booted = true;
    setupNavigation();
    setupSettingsAndSupport();
    setupLibraryAndFavorites();
    setupWizardControls();
  }

  applyPackageTierPermissions();
  syncSettingsInputs();
  renderPresetCards();
  renderFontCards();
  populateLibraryFilters();
  refreshDashboardAndBadges();
  refreshCompanionBridgeBadge();

  checkServerVersionInfo().then((vInfo) => {
    if (vInfo) {
      window.__KLIP_SERVER_VERSION_INFO = vInfo;
      applyPackageTierPermissions();
    }
  });

  recordDiagnostic(`Studio aktif (${state.tierLabel}, v${APP_CLIENT_VERSION}).`);
}

/* ============================================================================
 * 3. NAVIGASI MULTI-HALAMAN & BERANDA STUDIO
 * ============================================================================ */

function switchView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll('.view-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `view-${viewName}`);
  });
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  document.querySelectorAll('.mnav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mview === viewName);
  });

  closeMobileSidebar();

  if (viewName !== 'wizard') {
    stopPreviewPlayback();
    stopStep2AudioPreview();
  }
  if (viewName === 'dashboard') refreshDashboardAndBadges();
  if (viewName === 'library') renderLibraryGrid();
  if (viewName === 'history') renderHistoryPage();
  if (viewName === 'favorites') renderFavoritesPage();
  if (viewName === 'settings') applyPackageTierPermissions();
}

function openMobileSidebar() {
  $('sidebar')?.classList.add('open');
  $('sidebar-overlay')?.classList.add('open');
}

function closeMobileSidebar() {
  $('sidebar')?.classList.remove('open');
  $('sidebar-overlay')?.classList.remove('open');
}

function refreshDashboardAndBadges() {
  const displayName = state.settings.creatorName || state.user?.name || 'Kreator';
  const greet = $('dash-greeting');
  if (greet) greet.textContent = `Selamat berkarya, ${displayName}`;

  const totalLib = CREATOR_LIBRARY_ITEMS.length;
  const favCount = state.favorites.size;
  const histCount = state.history.length;
  const momCount = state.moments.length;

  if ($('nav-lib-count')) $('nav-lib-count').textContent = String(totalLib);
  if ($('nav-history-count')) $('nav-history-count').textContent = String(histCount);
  if ($('nav-fav-count')) $('nav-fav-count').textContent = String(favCount);

  if ($('stat-rendered-count')) $('stat-rendered-count').textContent = String(histCount);
  if ($('stat-moments-count')) $('stat-moments-count').textContent = String(momCount);
  if ($('stat-library-total')) $('stat-library-total').textContent = String(totalLib);
  if ($('stat-fav-count')) $('stat-fav-count').textContent = String(favCount);

  const recentBox = $('dash-recent-renders');
  if (!recentBox) return;

  if (state.history.length === 0) {
    recentBox.innerHTML = `
      <div class="empty-state" style="padding:28px 18px;">
        <p class="muted-copy" style="margin-bottom:14px;">
          Belum ada klip MP4 yang dirender pada perangkat ini. Tempel link YouTube atau muat video contoh 2 pembicara untuk mencoba sekarang.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="empty-try-sample-btn">
          Coba Video Contoh 2 Pembicara
        </button>
      </div>
    `;
    $('empty-try-sample-btn')?.addEventListener('click', () => {
      switchView('wizard');
      goToWizardStep(1);
      handleLoadSampleVideo();
    });
    return;
  }

  recentBox.innerHTML = state.history
    .slice(0, 4)
    .map(
      (h) => `
      <div class="history-row" style="padding:14px 16px;margin-bottom:10px;">
        <div>
          <strong style="font-size:15px;display:block;">${escapeHtml(h.hookTitle || h.sourceName)}</strong>
          <span class="muted-copy" style="font-size:12.5px;">
            ${escapeHtml(h.presetName)} · ${escapeHtml(h.resolution)} · ${escapeHtml(h.durationLabel)} · ${escapeHtml(h.dateLabel)}
          </span>
        </div>
        <span class="pill-tag lime">MP4 9:16</span>
      </div>
    `
    )
    .join('');
}

/* ============================================================================
 * 4. PUSTAKA 140 KOLEKSI KREATOR & FAVORIT
 * ============================================================================ */

function populateLibraryFilters() {
  const nicheSelect = $('lib-niche-select');
  if (nicheSelect && nicheSelect.options.length <= 1) {
    const niches = Array.from(new Set(CREATOR_LIBRARY_ITEMS.map((i) => i.niche))).sort();
    niches.forEach((n) => {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      nicheSelect.appendChild(opt);
    });
  }

  const pillsBar = $('lib-cat-pills');
  if (!pillsBar) return;
  pillsBar.innerHTML = '';

  CREATOR_CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-pill ${state.libCategory === cat ? 'active' : ''}`;
    const count =
      cat === 'Semua'
        ? CREATOR_LIBRARY_ITEMS.length
        : CREATOR_LIBRARY_ITEMS.filter((i) => i.category === cat).length;
    btn.textContent = `${cat} (${count})`;
    btn.addEventListener('click', () => {
      state.libCategory = cat;
      populateLibraryFilters();
      renderLibraryGrid();
    });
    pillsBar.appendChild(btn);
  });
}

function getFilteredLibraryItems() {
  const q = state.libQuery.trim().toLowerCase();
  return CREATOR_LIBRARY_ITEMS.filter((item) => {
    if (state.libCategory !== 'Semua' && item.category !== state.libCategory) return false;
    if (state.libNiche !== 'Semua' && item.niche !== state.libNiche) return false;
    if (!q) return true;
    const hay = `${item.title} ${item.category} ${item.niche} ${item.explanation} ${item.example}`.toLowerCase();
    return hay.includes(q);
  });
}

function createLibraryCardHtml(item) {
  const isFav = state.favorites.has(item.id);
  return `
    <article class="lib-card" data-item-id="${escapeHtml(item.id)}">
      <div class="lib-card-top">
        <span class="pill-tag">${escapeHtml(item.category)}</span>
        <span class="muted-copy" style="font-size:12px;">${escapeHtml(item.niche)}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.explanation)}</p>
      <div class="lib-example-snippet">${escapeHtml(item.example)}</div>
      <div class="lib-card-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-open-detail="${escapeHtml(item.id)}">
          Detail &amp; Pakai
        </button>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="underline-link" data-use-hook="${escapeHtml(item.id)}">
            Pasang Judul
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-toggle-fav="${escapeHtml(item.id)}" aria-label="Favorit">
            ${isFav ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderLibraryGrid() {
  const grid = $('library-grid');
  if (!grid) return;
  const items = getFilteredLibraryItems();
  const badge = $('lib-showing-badge');
  if (badge) badge.textContent = `${items.length} Koleksi`;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <p class="muted-copy">Tidak ada koleksi yang cocok dengan pencarian tersebut.</p>
      </div>
    `;
    return;
  }
  grid.innerHTML = items.map(createLibraryCardHtml).join('');
  bindLibraryCardButtons(grid);
}

function renderFavoritesPage() {
  const grid = $('favorites-grid');
  if (!grid) return;
  const favItems = CREATOR_LIBRARY_ITEMS.filter((i) => state.favorites.has(i.id));
  if (favItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h3 class="card-subheading" style="margin-bottom:6px;">Belum Ada Koleksi Favorit</h3>
        <p class="muted-copy" style="margin-bottom:14px;">
          Tandai judul pembuka, pola kalimat, atau prompt dari Pustaka Kreator agar mudah dipasang saat memotong klip.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="fav-go-lib-btn">Buka Pustaka 140 Koleksi</button>
      </div>
    `;
    $('fav-go-lib-btn')?.addEventListener('click', () => switchView('library'));
    return;
  }
  grid.innerHTML = favItems.map(createLibraryCardHtml).join('');
  bindLibraryCardButtons(grid);
}

function bindLibraryCardButtons(container) {
  container.querySelectorAll('[data-open-detail]').forEach((btn) => {
    btn.addEventListener('click', () => openLibraryModal(btn.dataset.openDetail));
  });
  container.querySelectorAll('[data-use-hook]').forEach((btn) => {
    btn.addEventListener('click', () => applyItemAsHook(btn.dataset.useHook));
  });
  container.querySelectorAll('[data-toggle-fav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleFavoriteItem(btn.dataset.toggleFav);
      if (state.activeView === 'library') renderLibraryGrid();
      if (state.activeView === 'favorites') renderFavoritesPage();
    });
  });
}

function toggleFavoriteItem(itemId) {
  if (state.favorites.has(itemId)) {
    state.favorites.delete(itemId);
    showToast('Dihapus dari Koleksi Favorit');
  } else {
    state.favorites.add(itemId);
    showToast('Disimpan ke Koleksi Favorit');
  }
  writeJson(KEYS.FAVORITES, Array.from(state.favorites));
  refreshDashboardAndBadges();
}

function openLibraryModal(itemId) {
  const item = CREATOR_LIBRARY_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  state.modalItem = item;
  $('modal-category').textContent = item.category;
  $('modal-niche').textContent = item.niche;
  $('modal-title').textContent = item.title;
  $('modal-explanation').textContent = item.explanation;
  $('modal-example').textContent = item.example;
  $('modal-tips').textContent = item.tips;
  $('modal-btn-fav').textContent = state.favorites.has(item.id) ? 'Hapus Favorit' : 'Simpan Favorit';
  $('lib-modal')?.classList.add('open');
}

function closeLibraryModal() {
  $('lib-modal')?.classList.remove('open');
  state.modalItem = null;
}

function applyItemAsHook(itemId) {
  const item = CREATOR_LIBRARY_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  const cleanedHook = item.example.replace(/^["']|["']$/g, '').slice(0, 68);
  state.hookTitle = cleanedHook;
  if ($('hook-title-input')) $('hook-title-input').value = cleanedHook;
  closeLibraryModal();
  switchView('wizard');
  if (state.file) {
    goToWizardStep(3);
    renderStaticPreviewFrame(state.clipStartSec);
  } else {
    goToWizardStep(1);
  }
  showToast('Judul pembuka dipasang ke Studio Pemotong');
}

/* ============================================================================
 * 5. RIWAYAT RENDER, PENGATURAN, PINDAH PERANGKAT, & LAPORAN ERROR
 * ============================================================================ */

function addRenderHistoryEntry({
  hookTitle,
  sourceName,
  presetId,
  fontFamilyId,
  resolution,
  durationSec,
  sizeMb
}) {
  const presetObj = CAPTION_PRESETS.find((p) => p.id === presetId) || CAPTION_PRESETS[0];
  const fontObj = getCaptionFontById(fontFamilyId || state.fontFamilyId);
  const entry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hookTitle: hookTitle || sourceName || 'Klip Vertikal 9:16',
    sourceName: sourceName || 'video.mp4',
    presetName: `${presetObj.name} · ${fontObj.name}`,
    resolution,
    durationLabel: `${durationSec.toFixed(1)} dtk · ${sizeMb} MB`,
    dateLabel: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  state.history.unshift(entry);
  state.history = state.history.slice(0, 60);
  writeJson(KEYS.HISTORY, state.history);
  refreshDashboardAndBadges();
}

function renderHistoryPage() {
  const box = $('history-list-container');
  if (!box) return;
  if (state.history.length === 0) {
    box.innerHTML = `
      <div class="empty-state">
        <h3 class="card-subheading" style="margin-bottom:6px;">Belum Ada Riwayat Ekspor MP4</h3>
        <p class="muted-copy" style="margin-bottom:14px;">
          Setiap klip MP4 9:16 yang selesai kamu buat akan tercatat rapi di halaman ini.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="hist-go-wiz">Mulai Potong Video</button>
      </div>
    `;
    $('hist-go-wiz')?.addEventListener('click', () => switchView('wizard'));
    return;
  }

  box.innerHTML = state.history
    .map(
      (h) => `
      <div class="history-row">
        <div>
          <span class="pill-tag lime" style="margin-bottom:6px;">${escapeHtml(h.presetName)}</span>
          <h3 class="card-subheading" style="font-size:17px;">${escapeHtml(h.hookTitle)}</h3>
          <p class="muted-copy" style="font-size:13.5px;margin-top:2px;">
            Sumber: ${escapeHtml(h.sourceName)} · Output ${escapeHtml(h.resolution)} (${escapeHtml(h.durationLabel)})
          </p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px;color:var(--color-graphite);">${escapeHtml(h.dateLabel)}</div>
          <button type="button" class="underline-link" data-reuse-hook="${escapeHtml(h.hookTitle)}" style="margin-top:6px;">
            Pakai Judul Lagi
          </button>
        </div>
      </div>
    `
    )
    .join('');

  box.querySelectorAll('[data-reuse-hook]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.hookTitle = btn.dataset.reuseHook || '';
      if ($('hook-title-input')) $('hook-title-input').value = state.hookTitle;
      switchView('wizard');
      showToast('Judul pembuka dipasang ke Wizard');
    });
  });
}

function syncSettingsInputs() {
  const presetSel = $('set-default-preset');
  if (presetSel && presetSel.options.length === 0) {
    CAPTION_PRESETS.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.tier === 'tambahan' ? `${p.name} (Paket Tambahan)` : p.name;
      if (p.tier === 'tambahan' && !state.features.extraPresets) {
        opt.disabled = true;
      }
      presetSel.appendChild(opt);
    });
  }
  const fontSel = $('set-default-font');
  if (fontSel && fontSel.options.length === 0) {
    CAPTION_FONTS.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.name} — ${f.styleLabel}`;
      fontSel.appendChild(opt);
    });
  }
  const agentFontSel = $('agent-font-select');
  if (agentFontSel && agentFontSel.options.length === 0) {
    CAPTION_FONTS.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.name} (${f.styleLabel})`;
      agentFontSel.appendChild(opt);
    });
  }
  if ($('set-creator-name')) $('set-creator-name').value = state.settings.creatorName || '';
  if ($('set-default-watermark') && state.features.customWatermark) {
    $('set-default-watermark').value = state.settings.defaultWatermark || '';
  }
  if (presetSel) presetSel.value = state.settings.defaultPreset || 'kreator-kuning';
  if (fontSel) fontSel.value = state.settings.defaultFont || 'jakarta';
  if (agentFontSel) agentFontSel.value = state.fontFamilyId || 'jakarta';
  if ($('set-gemini-key')) $('set-gemini-key').value = state.settings.geminiKey || '';
  if ($('gemini-key-input')) $('gemini-key-input').value = state.settings.geminiKey || '';
  if ($('watermark-text-input') && state.features.customWatermark && !state.watermarkText) {
    state.watermarkText = state.settings.defaultWatermark || '';
    $('watermark-text-input').value = state.watermarkText;
  }
}

async function handleSendErrorReport(customSummary = '') {
  const noteInput = $('error-report-note-input');
  const summary =
    customSummary ||
    noteInput?.value?.trim() ||
    'Laporan diagnostik teknis dari tombol aplikasi Klip Auto';

  const btnMain = $('btn-send-error-report');
  const btnSide = $('btn-sidebar-error-report');
  if (btnMain) btnMain.disabled = true;
  if (btnSide) btnSide.disabled = true;

  try {
    const devReport = await runDeviceReadinessCheck();
    const res = await sendSanitizedErrorReport({
      summary,
      diagnosticLogs: state.diagnosticLogs,
      deviceSummary: devReport
    });
    if (noteInput) noteInput.value = '';
    showToast(`Laporan error terkirim (${res.reportId || 'Tanpa Data Pribadi'})`);
  } catch (err) {
    showToast(err?.message || 'Gagal mengirim laporan error');
  } finally {
    if (btnMain) btnMain.disabled = false;
    if (btnSide) btnSide.disabled = false;
  }
}

function setupSettingsAndSupport() {
  $('theme-toggle')?.addEventListener('click', toggleTheme);
  $('btn-theme-mobile')?.addEventListener('click', toggleTheme);

  $('btn-save-settings')?.addEventListener('click', () => {
    state.settings.creatorName = $('set-creator-name')?.value.trim() || state.user?.name || 'Kreator';
    if (state.features.customWatermark) {
      state.settings.defaultWatermark = $('set-default-watermark')?.value.trim() || '';
      state.watermarkText = state.settings.defaultWatermark;
      if ($('watermark-text-input')) $('watermark-text-input').value = state.watermarkText;
    }
    state.settings.defaultPreset = $('set-default-preset')?.value || 'kreator-kuning';
    state.settings.defaultFont = $('set-default-font')?.value || 'jakarta';
    state.settings.geminiKey = $('set-gemini-key')?.value.trim() || '';
    writeJson(KEYS.SETTINGS, state.settings);

    state.presetId = state.settings.defaultPreset;
    state.fontFamilyId = state.settings.defaultFont;
    if ($('agent-font-select')) $('agent-font-select').value = state.fontFamilyId;
    if ($('gemini-key-input')) $('gemini-key-input').value = state.settings.geminiKey;

    renderPresetCards();
    renderFontCards();
    refreshDashboardAndBadges();
    showToast('Pengaturan studio & font bawaan disimpan');
  });

  // Lepas ikatan perangkat mandiri (Pindah Perangkat ke Laptop Baru)
  $('btn-release-device')?.addEventListener('click', async () => {
    const btn = $('btn-release-device');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Melepas Ikatan Perangkat...';
    }
    await releaseCurrentDevice();
    window.location.reload();
  });

  // Buka modal Cek Perangkat & Ruang Disk dari halaman Pengaturan
  $('btn-settings-device-check')?.addEventListener('click', async () => {
    const modal = $('modal-device-check');
    const body = $('device-check-results');
    if (modal) modal.classList.add('open');
    await renderDeviceCheckIntoContainer(body);
  });

  // Kirim laporan error tanpa video & tanpa data pribadi
  $('btn-send-error-report')?.addEventListener('click', () => handleSendErrorReport());
  $('btn-sidebar-error-report')?.addEventListener('click', () => {
    switchView('settings');
    handleSendErrorReport('Laporan cepat dari tombol bilah samping');
  });

  // Keluar sesi
  $('btn-logout')?.addEventListener('click', async () => {
    stopPreviewPlayback();
    stopStep2AudioPreview();
    await logoutLicenseSession();
    window.location.reload();
  });

  $('btn-clear-history')?.addEventListener('click', () => {
    state.history = [];
    writeJson(KEYS.HISTORY, []);
    renderHistoryPage();
    refreshDashboardAndBadges();
    showToast('Riwayat render dibersihkan');
  });

  $('btn-export-json')?.addEventListener('click', () => {
    const payload = {
      app: 'Klip Auto Studio',
      version: APP_CLIENT_VERSION,
      exportedAt: new Date().toISOString(),
      settings: {
        creatorName: state.settings.creatorName,
        defaultWatermark: state.settings.defaultWatermark,
        defaultPreset: state.settings.defaultPreset
      },
      favorites: Array.from(state.favorites),
      history: state.history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klip-auto-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('File cadangan .json diunduh');
  });

  $('btn-import-json')?.addEventListener('click', () => $('import-json-input')?.click());
  $('import-json-input')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed.settings && typeof parsed.settings === 'object') {
        state.settings = { ...state.settings, ...parsed.settings };
        writeJson(KEYS.SETTINGS, state.settings);
      }
      if (Array.isArray(parsed.favorites)) {
        state.favorites = new Set(parsed.favorites);
        writeJson(KEYS.FAVORITES, parsed.favorites);
      }
      if (Array.isArray(parsed.history)) {
        state.history = parsed.history;
        writeJson(KEYS.HISTORY, parsed.history);
      }
      syncSettingsInputs();
      refreshDashboardAndBadges();
      showToast('Data cadangan berhasil dipulihkan');
    } catch {
      showToast('File JSON tidak valid');
    }
  });
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.querySelectorAll('.mnav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.mview));
  });

  $('btn-open-sidebar')?.addEventListener('click', openMobileSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

  $('dash-btn-open-wizard')?.addEventListener('click', () => {
    switchView('wizard');
    goToWizardStep(1);
  });
  $('dash-btn-youtube')?.addEventListener('click', () => {
    switchView('wizard');
    goToWizardStep(1);
    setTimeout(() => $('yt-url-input')?.focus(), 80);
  });
  $('dash-btn-quick-sample')?.addEventListener('click', () => {
    switchView('wizard');
    goToWizardStep(1);
    handleLoadSampleVideo();
  });
  $('wiz-top-sample-btn')?.addEventListener('click', () => {
    goToWizardStep(1);
    handleLoadSampleVideo();
  });

  $('stat-go-history')?.addEventListener('click', () => switchView('history'));
  $('stat-go-wizard')?.addEventListener('click', () => switchView('wizard'));
  $('stat-go-library')?.addEventListener('click', () => switchView('library'));
  $('stat-go-favorites')?.addEventListener('click', () => switchView('favorites'));
  $('dash-see-all-history')?.addEventListener('click', () => switchView('history'));

  document.querySelectorAll('[data-jump-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStep = Number(btn.dataset.jumpStep) || 1;
      switchView('wizard');
      if (targetStep > 1 && !state.file) {
        goToWizardStep(1);
        showToast('Pilih video lokal atau tempel link terlebih dahulu');
      } else {
        goToWizardStep(targetStep);
      }
    });
  });
}

function setupLibraryAndFavorites() {
  $('lib-search-input')?.addEventListener('input', (e) => {
    state.libQuery = e.target.value || '';
    renderLibraryGrid();
  });
  $('lib-niche-select')?.addEventListener('change', (e) => {
    state.libNiche = e.target.value || 'Semua';
    renderLibraryGrid();
  });

  $('modal-btn-close')?.addEventListener('click', closeLibraryModal);
  $('lib-modal')?.addEventListener('click', (e) => {
    if (e.target === $('lib-modal')) closeLibraryModal();
  });
  $('modal-btn-copy')?.addEventListener('click', async () => {
    if (!state.modalItem) return;
    try {
      await navigator.clipboard.writeText(state.modalItem.example);
      showToast('Contoh teks berhasil disalin');
    } catch {
      showToast('Gagal menyalin otomatis');
    }
  });
  $('modal-btn-fav')?.addEventListener('click', () => {
    if (!state.modalItem) return;
    toggleFavoriteItem(state.modalItem.id);
    $('modal-btn-fav').textContent = state.favorites.has(state.modalItem.id)
      ? 'Hapus Favorit'
      : 'Simpan Favorit';
    if (state.activeView === 'library') renderLibraryGrid();
    if (state.activeView === 'favorites') renderFavoritesPage();
  });
  $('modal-btn-use-hook')?.addEventListener('click', () => {
    if (state.modalItem) applyItemAsHook(state.modalItem.id);
  });
}

/* ============================================================================
 * 6. PENYELARAS VOKAL PRESISI 10MS (#vocal-sync-canvas) & SINKRONISASI KATA
 * ============================================================================ */

async function refreshClipVocalEnvelopeAndWords({ relockExistingWords = false } = {}) {
  const token = ++state.vocalAnalysisToken;
  if (!state.file || state.clipEndSec <= state.clipStartSec) {
    state.vocalEnvelope = null;
    state.vocalClipSamples = null;
    drawVocalSyncTimeline();
    return;
  }

  try {
    const { samples } = await extractMonoAudio(state.file, {
      startSec: state.clipStartSec,
      endSec: state.clipEndSec,
      targetSampleRate: 16000
    });
    if (token !== state.vocalAnalysisToken) return;

    state.vocalClipSamples = samples;
    state.vocalEnvelope = analyzeVocalEnvelope(samples, 16000, state.clipStartSec);

    const badge = $('vocal-islands-badge');
    if (badge) {
      const count = state.vocalEnvelope.islands.length;
      badge.textContent =
        count > 0 ? `${count} Pulau Vokal Terkunci (10ms)` : 'Menunggu Sinyal Suara';
    }

    if (relockExistingWords && state.words.length > 0) {
      state.words = refineWhisperWordsWithVocal(
        state.words,
        samples,
        16000,
        state.clipStartSec,
        state.clipEndSec
      );
    }

    drawVocalSyncTimeline();
  } catch {
    drawVocalSyncTimeline();
  }
}

/**
 * Menggambar pita gelombang energi vokal 165–3750 Hz, pulau bicara aktif (#beff50),
 * penanda kata ber-timestamp, serta jarum waktu putar secara presisi di #vocal-sync-canvas.
 */
function drawVocalSyncTimeline(playheadSec = null) {
  const canvas = $('vocal-sync-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#1b1b15';
  ctx.fillRect(0, 0, W, H);

  const startSec = state.clipStartSec;
  const endSec = Math.max(startSec + 0.5, state.clipEndSec);
  const spanSec = endSec - startSec;
  const env = state.vocalEnvelope;

  const waveTop = 8;
  const waveBottom = H - 28;
  const waveMid = Math.round((waveTop + waveBottom) / 2);
  const waveAmpMax = Math.max(10, Math.floor((waveBottom - waveTop) / 2) - 2);

  // 1. Sorot latar pulau bicara aktif (Voiced Islands)
  if (env && Array.isArray(env.islands)) {
    ctx.fillStyle = 'rgba(190, 255, 80, 0.11)';
    for (const isl of env.islands) {
      const x0 = Math.max(0, ((isl.startSec - startSec) / spanSec) * W);
      const x1 = Math.min(W, ((isl.endSec - startSec) / spanSec) * W);
      if (x1 > x0) {
        ctx.fillRect(x0, 2, Math.max(2, x1 - x0), waveBottom - 2);
      }
    }
  }

  // 2. Gambar batang gelombang energi RMS vokal (hijau limau saat vokal aktif, abu redup saat jeda napas)
  if (env && env.rms && env.rms.length > 0) {
    let maxRms = 0.02;
    for (let i = 0; i < env.rms.length; i++) {
      if (env.rms[i] > maxRms) maxRms = env.rms[i];
    }

    const barCount = Math.min(220, Math.max(60, Math.floor(W / 3.5)));
    const barStepPx = W / barCount;

    for (let b = 0; b < barCount; b++) {
      const barTime = startSec + ((b + 0.5) / barCount) * spanSec;
      const fIdx = Math.max(
        0,
        Math.min(env.rms.length - 1, Math.round((barTime - env.offsetSec) / env.frameSec))
      );
      const val = env.rms[fIdx] || 0;
      const isVoiced = val >= env.speechThreshold;
      const norm = Math.min(1, val / maxRms);
      const halfBar = Math.max(1.5, norm * waveAmpMax);

      ctx.fillStyle = isVoiced ? '#beff50' : '#4a4b44';
      const x = Math.round(b * barStepPx);
      const bw = Math.max(1.5, barStepPx - 1.2);
      ctx.fillRect(x, waveMid - halfBar, bw, halfBar * 2);
    }
  } else {
    ctx.fillStyle = '#8b8c84';
    ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gelombang vokal klip akan tampil begitu video dipilih', W / 2, waveMid + 4);
  }

  // 3. Gambar blok penanda waktu kata di jalur bawah (mengikuti kalibrasi captionOffsetSec)
  const trackY = H - 22;
  ctx.fillStyle = '#25261e';
  ctx.fillRect(0, trackY, W, 20);

  const offset = Number(state.captionOffsetSec) || 0;
  if (Array.isArray(state.words) && state.words.length > 0) {
    ctx.font = '600 9.5px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < state.words.length; i++) {
      const w = state.words[i];
      const ws = w.start + offset;
      const we = w.end + offset;
      if (we < startSec || ws > endSec) continue;

      const x0 = Math.max(0, ((ws - startSec) / spanSec) * W);
      const x1 = Math.min(W, ((we - startSec) / spanSec) * W);
      const bw = Math.max(3, x1 - x0 - 1);

      const isSpokenNow =
        playheadSec != null && playheadSec >= ws - 0.02 && playheadSec <= we + 0.04;

      ctx.fillStyle = isSpokenNow ? '#beff50' : 'rgba(245, 245, 235, 0.24)';
      ctx.fillRect(x0, trackY + 2, bw, 16);

      if (bw >= 26) {
        ctx.fillStyle = isSpokenNow ? '#14140f' : '#f5f5eb';
        ctx.textAlign = 'left';
        const clippedLabel = String(w.word || '').slice(0, Math.max(3, Math.floor(bw / 6)));
        ctx.fillText(clippedLabel, x0 + 3, trackY + 10.5);
      }
    }
  }

  // 4. Jarum penunjuk detik putar (Playhead)
  if (playheadSec != null && playheadSec >= startSec && playheadSec <= endSec) {
    const px = Math.round(((playheadSec - startSec) / spanSec) * W);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 1, 0, 2, H);
  }
}

/* ============================================================================
 * 7. WIZARD PEMOTONG 9:16 (YOUTUBE LOKAL, BATCH OTOMATIS, PREVIEW, & EKSPOR MP4)
 * ============================================================================ */

function goToWizardStep(stepNum) {
  [1, 2, 3].forEach((n) => {
    $(`tab-step-${n}`)?.classList.toggle('active', n === stepNum);
    $(`panel-step-${n}`)?.classList.toggle('active', n === stepNum);
  });
  showError('');

  if (stepNum !== 2) {
    stopStep2AudioPreview();
  } else {
    drawVocalSyncTimeline();
  }

  if (stepNum === 3 && state.file) {
    preparePreviewPlayer();
  } else {
    stopPreviewPlayback();
  }
}

function renderPresetCards() {
  const grid = $('preset-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const preset of CAPTION_PRESETS) {
    const isLockedTambahan = preset.tier === 'tambahan' && !state.features.extraPresets;
    const card = document.createElement('div');
    card.className = `preset-card ${preset.id === state.presetId ? 'selected' : ''}`;
    card.dataset.presetId = preset.id;

    let sampleStyle = `color:${preset.activeColor};`;
    if (preset.activePillColor) {
      sampleStyle += `background:${preset.activePillColor};padding:2px 6px;border-radius:4px;`;
    }

    const tierTag =
      preset.tier === 'tambahan'
        ? `<span style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,0.16);color:#f5f5eb;margin-left:5px;">${
            isLockedTambahan ? 'Tambahan' : 'Aktif'
          }</span>`
        : '';

    card.innerHTML = `
      <div class="preset-sample" style="${
        isLockedTambahan ? 'opacity:0.7;' : ''
      }"><span style="color:#fff">KATA </span><span style="${sampleStyle}">AKTIF</span></div>
      <div class="preset-name">${escapeHtml(preset.name)}${tierTag}</div>
      <div class="preset-desc">${escapeHtml(preset.desc)}</div>
    `;
    card.addEventListener('click', () => {
      if (isLockedTambahan) {
        showToast('Gaya caption ekstra ini tersedia pada Paket Tambahan (Rp 49.000)');
        return;
      }
      state.presetId = preset.id;
      grid.querySelectorAll('.preset-card').forEach((el) => {
        el.classList.toggle('selected', el.dataset.presetId === preset.id);
      });
      renderStaticPreviewFrame(getPreviewCurrentTime());
    });
    grid.appendChild(card);
  }
}

function renderFontCards() {
  const activeFont = getCaptionFontById(state.fontFamilyId);
  if ($('selected-font-badge')) {
    $('selected-font-badge').textContent = `Font: ${activeFont.name}`;
  }

  const agentSelect = $('agent-font-select');
  if (agentSelect) {
    agentSelect.innerHTML = CAPTION_FONTS.map(
      (f) => `<option value="${f.id}">${escapeHtml(f.name)} — ${escapeHtml(f.category)}</option>`
    ).join('');
    agentSelect.value = activeFont.id;
  }

  if ($('caption-size-range')) {
    $('caption-size-range').value = String(Math.round((state.fontScale || 1) * 100));
  }
  if ($('caption-size-label')) {
    $('caption-size-label').textContent = `${Math.round((state.fontScale || 1) * 100)}%`;
  }
  if ($('caption-case-select')) {
    $('caption-case-select').value = state.textCase || 'auto';
  }

  const grid = $('caption-font-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const font of CAPTION_FONTS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `font-card ${font.id === activeFont.id ? 'selected' : ''}`;
    card.dataset.fontId = font.id;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', font.id === activeFont.id ? 'true' : 'false');

    const sampleCss = [
      `font-family:${font.fontFamily}`,
      `font-weight:${font.loadWeight || font.fixedWeight || 800}`,
      font.letterSpacingEm ? `letter-spacing:${font.letterSpacingEm}em` : ''
    ]
      .filter(Boolean)
      .join(';');

    card.innerHTML = `
      <span class="font-card-sample" style="${sampleCss}">${escapeHtml(font.sampleText)}</span>
      <span class="font-card-name">${escapeHtml(font.name)}</span>
      <span class="font-card-meta">${escapeHtml(font.styleLabel || '')}</span>
    `;

    card.addEventListener('click', async () => {
      state.fontFamilyId = font.id;
      grid.querySelectorAll('.font-card').forEach((el) => {
        const isSelected = el.dataset.fontId === font.id;
        el.classList.toggle('selected', isSelected);
        el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      });
      if ($('selected-font-badge')) {
        $('selected-font-badge').textContent = `Font: ${font.name}`;
      }
      if ($('agent-font-select')) {
        $('agent-font-select').value = font.id;
      }
      await ensureCaptionFontLoaded(font.id, 48);
      renderStaticPreviewFrame(getPreviewCurrentTime());
    });

    grid.appendChild(card);
  }

  ensureCaptionFontLoaded(activeFont.id, 48).catch(() => {});
}

async function refreshCompanionBridgeBadge() {
  const pill = $('yt-bridge-status-pill');
  if (!pill) return;
  const status = await detectCompanionBridge();
  pill.classList.add('lime');
  if (status.active && status.mode === 'companion-bridge') {
    pill.textContent = `Langsung Tanpa Ekstensi + Jembatan Cadangan Aktif`;
  } else {
    pill.textContent = 'Langsung Tempel Link · Tanpa Ekstensi Tambahan';
  }
}

function showYoutubeFriendlyFallback(title, reasonText, offerExtGuide = false) {
  const box = $('yt-fallback-box');
  if (!box) return;
  if ($('yt-fallback-title')) $('yt-fallback-title').textContent = title || 'Link Belum Bisa Dimuat Langsung';
  if ($('yt-fallback-reason')) $('yt-fallback-reason').textContent = reasonText || '';
  const guideBtn = $('btn-open-ext-guide');
  if (guideBtn) guideBtn.style.display = offerExtGuide ? 'inline-flex' : 'none';
  box.classList.add('visible');
}

function hideYoutubeFriendlyFallback() {
  $('yt-fallback-box')?.classList.remove('visible');
}

async function handleFetchYoutubeUrl() {
  const rawUrl = $('yt-url-input')?.value.trim() || '';
  showError('');
  hideYoutubeFriendlyFallback();

  const fetchBtn = $('btn-yt-fetch');
  if (fetchBtn) fetchBtn.disabled = true;
  $('yt-preview-card')?.classList.remove('visible');
  setStatus('yt', true, 'Membaca video, pilihan resolusi MP4 & subtitle YouTube tanpa ekstensi...', 24);

  try {
    const info = await fetchYoutubeVideoInfo(rawUrl);
    if (state.ytDownloadedCache && state.ytDownloadedCache.videoId !== info.videoId) {
      state.ytDownloadedCache = null;
    }
    state.ytInfo = info;
    state.ytHeatmap = Array.isArray(info.heatmap) && info.heatmap.length > 0 ? info.heatmap : null;

    if ($('yt-thumb')) $('yt-thumb').src = info.thumbnail || '';
    if ($('yt-duration-badge')) {
      $('yt-duration-badge').textContent =
        Number(info.durationSec || 0) > 0 ? formatClock(info.durationSec) : 'MP4 Utuh';
    }
    if ($('yt-channel-pill')) $('yt-channel-pill').textContent = info.author || 'YouTube';
    if ($('yt-title')) $('yt-title').textContent = info.title || 'Video YouTube';

    const capPill = $('yt-caption-pill');
    if (capPill) {
      if (info.hasCaptions && info.wordCount > 0) {
        capPill.textContent = `Subtitle Anti-Miss Siap (${info.captionLang.toUpperCase()} · ${info.wordCount} kata)`;
        capPill.className = 'pill-tag lime';
      } else {
        capPill.textContent = 'Tanpa Subtitle Bawaan — Siap Transkrip Whisper-Small';
        capPill.className = 'pill-tag';
      }
    }

    const hmPill = $('yt-heatmap-pill');
    if (hmPill) {
      hmPill.style.display = state.ytHeatmap ? 'inline-flex' : 'none';
    }

    const qSelect = $('yt-quality-select');
    if (qSelect) {
      qSelect.innerHTML = '';
      (info.qualities || []).forEach((q) => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = q.label;
        if (q.recommended) opt.selected = true;
        qSelect.appendChild(opt);
      });
    }

    setStatus('yt', false);
    $('yt-preview-card')?.classList.add('visible');
    showToast('Video siap dipotong jadi klip 9:16 atau diunduh utuh sebagai .MP4');
  } catch (err) {
    setStatus('yt', false);
    recordDiagnostic(`Link YouTube dilewati (${err?.code || 'INFO'}): ${err?.message || ''}`);
    const title =
      err?.code === 'OFFLINE'
        ? 'Koneksi Internet Sedang Terputus'
        : err?.code === 'VIDEO_UNAVAILABLE'
        ? 'Video Bersifat Pribadi atau Dibatasi Pemilik Channel'
        : err?.code === 'INVALID_URL' || err?.code === 'EMPTY_URL'
        ? 'Periksa Kembali Alamat Link YouTube'
        : 'Video Ini Membatasi Akses Langsung';

    showYoutubeFriendlyFallback(
      title,
      err?.message ||
        'Link ini membatasi pembacaan langsung. Silakan pilih file video lokal (.mp4, .mov, .mkv) dari laptopmu.',
      Boolean(err?.offerExtensionGuide)
    );
  } finally {
    if (fetchBtn) fetchBtn.disabled = false;
  }
}

async function handleYoutubeDirectDownloadAction() {
  if (!state.ytInfo) return;
  showError('');
  hideYoutubeFriendlyFallback();

  const qualityId = $('yt-quality-select')?.value || null;
  const dlBtn = $('btn-yt-download-mp4');
  const importBtn = $('btn-yt-import-studio');
  const fetchBtn = $('btn-yt-fetch');
  const cancelBtn = $('btn-yt-cancel');

  state.ytAbortController = new AbortController();
  if (dlBtn) dlBtn.disabled = true;
  if (importBtn) importBtn.disabled = true;
  if (fetchBtn) fetchBtn.disabled = true;
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  setStatus('yt', true, 'Menyiapkan unduhan video YouTube (.MP4) langsung ke perangkatmu...', 5);

  try {
    const res = await saveYoutubeMp4ToDevice({
      info: state.ytInfo,
      qualityId,
      cachedResult: state.ytDownloadedCache,
      signal: state.ytAbortController.signal,
      onProgress: ({ phase, percent }) => {
        setStatus('yt', true, phase, percent);
      }
    });

    state.ytDownloadedCache = {
      ...res,
      videoId: state.ytInfo.videoId
    };
    setStatus('yt', false);
    showToast(`Video YouTube (.MP4 ${res.qualityLabel || ''}) berhasil diunduh ke perangkatmu!`);
  } catch (err) {
    setStatus('yt', false);
    if (err?.name === 'AbortError') {
      showToast('Unduhan video YouTube dibatalkan');
    } else {
      showYoutubeFriendlyFallback(
        'Unduhan Video Terputus Sementara',
        `${
          err?.message || 'Sumber video membatasi unduhan pada resolusi ini.'
        } Coba pilih resolusi 360p/720p atau klik ulang tombol Unduh Video YouTube (.MP4).`,
        false
      );
    }
  } finally {
    state.ytAbortController = null;
    if (dlBtn) dlBtn.disabled = false;
    if (importBtn) importBtn.disabled = false;
    if (fetchBtn) fetchBtn.disabled = false;
    if (cancelBtn) cancelBtn.style.display = 'none';
  }
}

async function handleYoutubeImportAction() {
  if (!state.ytInfo) return;
  showError('');
  hideYoutubeFriendlyFallback();

  const qualityId = $('yt-quality-select')?.value || null;
  const pickedQ = pickQualityOption(state.ytInfo, qualityId);
  const expectedCacheKey = `${state.ytInfo.videoId}:${pickedQ.id}`;

  const dlBtn = $('btn-yt-download-mp4');
  const importBtn = $('btn-yt-import-studio');
  const fetchBtn = $('btn-yt-fetch');
  const cancelBtn = $('btn-yt-cancel');

  state.ytAbortController = new AbortController();
  if (dlBtn) dlBtn.disabled = true;
  if (importBtn) importBtn.disabled = true;
  if (fetchBtn) fetchBtn.disabled = true;
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  setStatus('yt', true, 'Memuat video & mengunci semua kata subtitle tanpa ekstensi...', 6);

  try {
    let res = null;
    if (
      state.ytDownloadedCache &&
      state.ytDownloadedCache.cacheKey === expectedCacheKey &&
      state.ytDownloadedCache.file
    ) {
      res = state.ytDownloadedCache;
    } else {
      res = await downloadYoutubeAsMp4File({
        info: state.ytInfo,
        qualityId,
        signal: state.ytAbortController.signal,
        onProgress: ({ phase, percent }) => {
          setStatus('yt', true, phase, percent);
        }
      });
      state.ytDownloadedCache = {
        ...res,
        videoId: state.ytInfo.videoId
      };
    }

    setStatus('yt', false);
    state.ytHeatmap = Array.isArray(res.heatmap) && res.heatmap.length > 0 ? res.heatmap : null;

    await handleVideoSelected(res.file, {
      prebuiltMoments: res.moments && res.moments.length > 0 ? res.moments : null,
      allSourceWords: Array.isArray(res.allWords) && res.allWords.length > 0 ? res.allWords : null,
      heatmap: state.ytHeatmap,
      skipAutoJump: false
    });
  } catch (err) {
    setStatus('yt', false);
    if (err?.name === 'AbortError') {
      showToast('Proses pemuatan link dibatalkan');
    } else {
      showYoutubeFriendlyFallback(
        'Aliran Video Terputus Sementara',
        `${
          err?.message || 'Sumber video membatasi pembacaan langsung.'
        } Coba pilih resolusi 360p/720p atau gunakan file video lokal (.mp4, .mov, .mkv).`,
        false
      );
    }
  } finally {
    state.ytAbortController = null;
    if (dlBtn) dlBtn.disabled = false;
    if (importBtn) importBtn.disabled = false;
    if (fetchBtn) fetchBtn.disabled = false;
    if (cancelBtn) cancelBtn.style.display = 'none';
  }
}

/* ============================================================================
 * 8. PEMOTONG BATCH OTOMATIS (4 SINYAL + ISOLASI ERROR PER KLIP + MULTI-VIDEO)
 * ============================================================================ */

function appendAgentLog(message) {
  recordDiagnostic(message);
  const logBox = $('agent-log-list');
  if (!logBox) return;
  const row = document.createElement('div');
  row.className = 'agent-log-item';
  const now = new Date();
  const stamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  row.innerHTML = `<span class="agent-log-time">${stamp}</span><span>${escapeHtml(message)}</span>`;
  logBox.appendChild(row);
  logBox.scrollTop = logBox.scrollHeight;
}

function setAgentStageVisual(stageIndex, title, detail, percent) {
  $('agent-tracker')?.classList.add('visible');
  if ($('agent-stage-title') && title) $('agent-stage-title').textContent = title;
  if ($('agent-stage-detail') && detail) $('agent-stage-detail').textContent = detail;
  if ($('agent-pct-badge') && percent != null) {
    $('agent-pct-badge').textContent = `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
  }
  if ($('agent-progress-fill') && percent != null) {
    $('agent-progress-fill').style.width = `${Math.max(2, Math.min(100, percent))}%`;
  }
  document.querySelectorAll('[data-agent-stage]').forEach((chip) => {
    const idx = Number(chip.dataset.agentStage);
    chip.classList.toggle('active', idx === stageIndex);
    chip.classList.toggle('done', idx < stageIndex);
  });
}

function clearOldAgentClips() {
  for (const clip of state.agentRenderedClips) {
    if (clip.objectUrl) {
      try {
        URL.revokeObjectURL(clip.objectUrl);
      } catch {}
    }
  }
  state.agentRenderedClips = [];
  state.agentFailedClips = [];
  if ($('agent-results-grid')) $('agent-results-grid').innerHTML = '';
  $('agent-results-wrap')?.classList.remove('visible');
}

function appendAgentClipCard(clip) {
  const wrap = $('agent-results-wrap');
  const grid = $('agent-results-grid');
  if (!wrap || !grid) return;

  wrap.classList.add('visible');
  if ($('agent-results-badge')) {
    $('agent-results-badge').textContent = `${state.agentRenderedClips.length} Klip 9:16 Siap Pakai`;
  }

  const sizeMb = (clip.sizeBytes / (1024 * 1024)).toFixed(2);
  const modeLabel =
    clip.effectiveFrameMode === 'podcast-split'
      ? 'Podcast Split 2 Wajah'
      : clip.effectiveFrameMode === 'blur-fit'
      ? 'Cinema Blur'
      : clip.effectiveFrameMode === 'gaming-split'
      ? 'Gaming Split'
      : 'Fullscreen Tengah';

  const card = document.createElement('article');
  card.className = 'agent-clip-card';
  card.innerHTML = `
    <div class="agent-clip-head">
      <span class="pill-tag lime">Klip #${clip.index} · Skor ${clip.score || 80}</span>
      <span class="muted-copy" style="font-size:12px;">${formatClock(clip.startSec)} – ${formatClock(clip.endSec)}</span>
    </div>
    <video class="agent-clip-video" src="${clip.objectUrl}" controls playsinline preload="metadata"></video>
    <h4 class="agent-clip-title">${escapeHtml(clip.hookTitle)}</h4>
    <p class="muted-copy" style="font-size:12.5px;margin-bottom:6px;">
      ${escapeHtml(clip.reason || 'Dipilih dari lonjakan suara & kalimat utuh.')}
    </p>
    <p class="muted-copy" style="font-size:12px;margin-bottom:12px;">
      ${modeLabel} · ${String(clip.encoderMode || 'gpu').toUpperCase()} · ${clip.width}×${clip.height} · ${clip.durationSec.toFixed(1)} dtk · ${sizeMb} MB
    </p>
    <div class="btn-row" style="gap:8px;">
      <a class="btn btn-primary btn-sm" href="${clip.objectUrl}" download="${escapeHtml(clip.fileName)}" style="flex:1;text-align:center;">
        Simpan MP4
      </a>
      <button type="button" class="btn btn-secondary btn-sm" data-customize-agent-clip="${clip.index}">
         Poles di Studio
      </button>
    </div>
  `;

  card.querySelector('[data-customize-agent-clip]')?.addEventListener('click', async () => {
    state.clipStartSec = clip.startSec;
    state.clipEndSec = clip.endSec;
    state.words = Array.isArray(clip.moment?.words) ? [...clip.moment.words] : [];
    state.hookTitle = clip.hookTitle || '';
    state.cameraTrack = clip.cameraTrack || null;
    if ($('hook-title-input')) $('hook-title-input').value = state.hookTitle;
    if ($('clip-transcript-input')) {
      $('clip-transcript-input').value =
        clip.moment?.transcript || state.words.map((w) => w.word).join(' ');
    }
    syncTrimmerInputs();
    updateDetectedFacesBadge(clip.cameraTrack);
    await refreshClipVocalEnvelopeAndWords({ relockExistingWords: false });
    goToWizardStep(3);
    showToast(`Klip #${clip.index} dibuka di Studio 9:16 untuk dipoles`);
  });

  grid.appendChild(card);
}

function appendFailedAgentClipCard(failedItem) {
  const wrap = $('agent-results-wrap');
  const grid = $('agent-results-grid');
  if (!wrap || !grid) return;

  wrap.classList.add('visible');
  const card = document.createElement('article');
  card.className = 'agent-clip-card';
  card.style.borderStyle = 'dashed';
  card.innerHTML = `
    <div class="agent-clip-head">
      <span class="pill-tag">Klip #${failedItem.index} Dilewati</span>
      <span class="muted-copy" style="font-size:12px;">${formatClock(failedItem.startSec)} – ${formatClock(failedItem.endSec)}</span>
    </div>
    <h4 class="agent-clip-title">${escapeHtml(failedItem.title || `Klip #${failedItem.index}`)}</h4>
    <p class="muted-copy" style="font-size:13px;margin:8px 0 12px;">
      Klip ini dilewati otomatis agar klip lain tetap selesai: ${escapeHtml(failedItem.error)}
    </p>
  `;
  grid.appendChild(card);
}

async function startAutonomousClipAgent({ prebuiltMoments = null } = {}) {
  if (!state.file || !state.mediaInfo) {
    showError('Pilih file video lokal atau tempel link YouTube terlebih dahulu.');
    return;
  }

  if (state.agentAbortController) {
    state.agentAbortController.abort();
  }

  showError('');
  clearOldAgentClips();
  if ($('agent-log-list')) $('agent-log-list').innerHTML = '';

  const runBtn = $('btn-run-ai-agent');
  const stopBtn = $('btn-stop-ai-agent');
  const pill = $('agent-state-pill');
  const clipCount = Number($('agent-clip-count-select')?.value || state.agentClipCount || 3);
  state.agentClipCount = clipCount;

  const geminiApiKey = $('gemini-key-input')?.value.trim() || state.settings.geminiKey || '';

  state.agentAbortController = new AbortController();
  if (runBtn) runBtn.disabled = true;
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  if (pill) pill.textContent = 'Sedang Memotong & Merender...';

  setAgentStageVisual(1, 'Memulai Pemotong Batch 9:16...', 'Memeriksa ruang disk & sinyal suara...', 5);

  try {
    await assertSufficientDiskForRender(75 * 1024 * 1024);

    const res = await runAutonomousClipAgent({
      file: state.file,
      mediaInfo: state.mediaInfo,
      prebuiltMoments,
      allSourceWords: state.fullSourceWords,
      heatmap: state.ytHeatmap,
      geminiApiKey,
      clipCount,
      presetId: state.presetId,
      fontFamilyId: state.fontFamilyId,
      fontScale: state.fontScale,
      textCase: state.textCase,
      frameMode: state.frameMode,
      autoFaceCenter: state.autoFaceCenter,
      captionOffsetSec: state.captionOffsetSec,
      hookStyle: state.hookStyle,
      hookDurationSec: state.hookDurationSec,
      watermarkImage: state.features.customWatermark ? state.watermarkImage : null,
      watermarkText: state.features.customWatermark ? state.watermarkText : '',
      watermarkPos: state.watermarkPos,
      resolution: state.resolution,
      voiceBoost: state.voiceBoost,
      volumeGain: state.volumeGain,
      monoToStereo: state.monoToStereo,
      signal: state.agentAbortController.signal,
      onStage: ({ stageIndex, stageTitle, detail, percent }) => {
        setAgentStageVisual(stageIndex, stageTitle, detail, percent);
      },
      onLog: (msg) => {
        appendAgentLog(msg);
      },
      onMomentsReady: (moments) => {
        state.moments = moments;
        state.scoringMeta = moments.scoringMeta || null;
        if (Array.isArray(moments.allWords) && moments.allWords.length > 0) {
          state.fullSourceWords = moments.allWords;
        }
        renderMomentsCards();
        selectMoment(0, { skipVocalExtract: true });
        refreshDashboardAndBadges();
      },
      onClipRendered: (clip) => {
        state.agentRenderedClips.push(clip);
        appendAgentClipCard(clip);
        const sizeMb = (clip.sizeBytes / (1024 * 1024)).toFixed(2);
        addRenderHistoryEntry({
          hookTitle: clip.hookTitle,
          sourceName: state.file?.name || 'video.mp4',
          presetId: clip.presetId,
          fontFamilyId: clip.fontFamilyId || state.fontFamilyId,
          resolution: state.resolution,
          durationSec: clip.durationSec,
          sizeMb
        });
      },
      onClipFailed: (failedInfo) => {
        state.agentFailedClips.push(failedInfo);
        appendFailedAgentClipCard(failedInfo);
      }
    });

    if (pill) {
      pill.textContent =
        res.failedClips.length > 0
          ? `Selesai (${res.clips.length} Berhasil, ${res.failedClips.length} Dilewati)`
          : `Selesai · ${res.clips.length} Klip MP4 Siap`;
    }
    showToast(`${res.clips.length} klip vertikal 9:16 selesai dibuat`);
    $('agent-results-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    if (err?.name === 'AbortError') {
      appendAgentLog('Pembuatan batch klip dihentikan oleh pengguna.');
      if (pill) pill.textContent = 'Dibatalkan Pengguna';
      showToast('Proses batch dibatalkan');
    } else {
      appendAgentLog(`Kendala batch: ${err?.message || err}`);
      if (pill) pill.textContent = 'Perlu Perhatian';
      showError(err?.message || 'Gagal menyelesaikan batch klip otomatis.');
    }
  } finally {
    state.agentAbortController = null;
    if (runBtn) runBtn.disabled = !state.file;
    if (stopBtn) stopBtn.style.display = 'none';
  }
}

async function runMultiVideoBatchQueue(filesList) {
  if (!filesList || filesList.length === 0) return;
  showToast(`Memproses antrean ${filesList.length} video secara berurutan...`);
  for (let i = 0; i < filesList.length; i++) {
    const f = filesList[i];
    appendAgentLog(`=== Antrean Multi-Video #${i + 1}/${filesList.length}: ${f.name} ===`);
    await handleVideoSelected(f, { skipAutoJump: true, forceWaitBatch: true });
  }
  showToast(`Antrean ${filesList.length} video selesai diproses`);
}

async function handleVideoSelected(
  file,
  {
    prebuiltMoments = null,
    allSourceWords = null,
    heatmap = null,
    skipAutoJump = false,
    forceWaitBatch = false
  } = {}
) {
  if (!file) return;
  showError('');
  hideYoutubeFriendlyFallback();

  if (state.agentAbortController) {
    state.agentAbortController.abort();
    state.agentAbortController = null;
  }

  if (state.videoObjectUrl) URL.revokeObjectURL(state.videoObjectUrl);
  state.file = file;
  state.videoObjectUrl = URL.createObjectURL(file);
  state.cameraTrack = null;
  state.moments = [];
  state.scoringMeta = null;
  state.words = [];
  state.fullSourceWords =
    Array.isArray(allSourceWords) && allSourceWords.length > 0
      ? allSourceWords
      : Array.isArray(prebuiltMoments?.allWords) && prebuiltMoments.allWords.length > 0
      ? prebuiltMoments.allWords
      : null;
  state.transcriptManuallyEdited = false;
  state.vocalEnvelope = null;
  state.vocalClipSamples = null;
  state.ytHeatmap = heatmap || null;

  setStatus('step1', true, 'Membaca durasi, resolusi & jalur audio video...', 30);

  try {
    const info = await probeMediaFile(file);
    state.mediaInfo = info;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const summary = $('file-summary');
    const summaryText = $('file-summary-text');
    if (summary && summaryText) {
      summary.classList.add('visible');
      summaryText.textContent = `${file.name} (${info.width}×${info.height} · ${formatClock(info.duration)} · ${sizeMb} MB)`;
    }

    ['btn-analyze-whisper', 'btn-pick-srt', 'btn-analyze-gemini', 'btn-run-ai-agent'].forEach(
      (id) => {
        if ($(id)) $(id).disabled = false;
      }
    );

    const defEnd = Math.min(info.duration, Math.max(5, Math.min(30, info.duration)));
    state.clipStartSec = 0;
    state.clipEndSec = Number(defEnd.toFixed(1));
    state.moments = [
      {
        id: 'manual-1',
        title: 'Potongan Awal Video',
        score: 76,
        reason: 'Segmen pembuka siap digeser manual atau dianalisis dengan skor 4 sinyal.',
        startSec: 0,
        endSec: state.clipEndSec,
        transcript: '',
        words: []
      }
    ];
    setStatus('step1', false);

    const autoRunEnabled = Boolean($('agent-auto-run-checkbox')?.checked);

    if (Array.isArray(prebuiltMoments) && prebuiltMoments.length > 0) {
      state.moments = prebuiltMoments;
      state.scoringMeta = prebuiltMoments.scoringMeta || null;
      renderMomentsCards();
      await selectMoment(0);
      refreshDashboardAndBadges();

      if (autoRunEnabled || forceWaitBatch) {
        await startAutonomousClipAgent({ prebuiltMoments });
        return;
      }
      if (!skipAutoJump) {
        goToWizardStep(2);
      }
      return;
    }

    renderMomentsCards();
    await selectMoment(0);
    refreshDashboardAndBadges();

    if (autoRunEnabled || forceWaitBatch) {
      await startAutonomousClipAgent();
    } else {
      showToast('Video siap! Klik Buat Batch Klip atau Transkrip Whisper-Small');
    }
  } catch (err) {
    setStatus('step1', false);
    showError(
      `File video tidak terbaca (${
        err?.message || 'format rusak'
      }). Gunakan rekaman video berformat .mp4, .mov, .mkv, atau .webm yang utuh.`
    );
  }
}

async function handleLoadSampleVideo() {
  showError('');
  const btn = $('btn-load-sample');
  if (btn) btn.disabled = true;
  setStatus('step1', true, 'Membuat video contoh podcast 2 pembicara (1280×720) beserta vokal...', 45);

  try {
    const { file, moments, prebuiltMoments, scoringMeta } = await createSamplePodcastMp4((p) => {
      setStatus('step1', true, `Menyiapkan video contoh 2 pembicara (${p}%)...`, p);
    });
    const sampleMoments = moments || prebuiltMoments || null;
    if (sampleMoments && scoringMeta) {
      sampleMoments.scoringMeta = scoringMeta;
    }
    setStatus('step1', false);
    await handleVideoSelected(file, { prebuiltMoments: sampleMoments, skipAutoJump: false });
  } catch (err) {
    setStatus('step1', false);
    showError(`Gagal membuat video contoh: ${err.message}`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleWhisperAnalysis() {
  if (!state.file || !state.mediaInfo) return;
  showError('');
  const btn = $('btn-analyze-whisper');
  if (btn) btn.disabled = true;

  try {
    const moments = await transcribeAndPickWithWhisperWeb({
      file: state.file,
      totalDurationSec: state.mediaInfo.duration,
      heatmap: state.ytHeatmap,
      onStatus: (txt, pct) => setStatus('step1', true, txt, pct)
    });
    state.moments = moments;
    state.scoringMeta = moments.scoringMeta || null;
    if (Array.isArray(moments.allWords) && moments.allWords.length > 0) {
      state.fullSourceWords = moments.allWords;
    }
    setStatus('step1', false);
    renderMomentsCards();
    await selectMoment(0);
    refreshDashboardAndBadges();
    goToWizardStep(2);
    showToast(`${moments.length} momen terukur ditemukan dengan Whisper-Small`);
  } catch (err) {
    setStatus('step1', false);
    showError(err.message || 'Gagal membaca transkrip vokal lokal.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleGeminiAnalysis() {
  if (!state.file || !state.mediaInfo) return;
  const apiKey = $('gemini-key-input')?.value.trim() || '';
  if (!apiKey) {
    showError('Masukkan kunci API Gemini pribadimu terlebih dahulu, atau gunakan tombol Whisper-Small gratis di sebelah kiri.');
    return;
  }
  state.settings.geminiKey = apiKey;
  writeJson(KEYS.SETTINGS, state.settings);
  if ($('set-gemini-key')) $('set-gemini-key').value = apiKey;

  showError('');
  const btn = $('btn-analyze-gemini');
  if (btn) btn.disabled = true;

  try {
    const moments = await analyzePodcastWithGemini({
      file: state.file,
      apiKey,
      totalDurationSec: state.mediaInfo.duration,
      onStatus: (txt, pct) => setStatus('step1', true, txt, pct)
    });
    state.moments = moments;
    state.scoringMeta = moments.scoringMeta || null;
    setStatus('step1', false);
    renderMomentsCards();
    await selectMoment(0);
    refreshDashboardAndBadges();
    goToWizardStep(2);
  } catch (err) {
    setStatus('step1', false);
    showError(err.message || 'Gagal menganalisis dengan kunci Gemini.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function parseSrtTimestamp(raw) {
  const clean = raw.trim().replace(',', '.');
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

async function handleSrtUpload(file) {
  if (!file || !state.mediaInfo) return;
  showError('');
  try {
    const text = await file.text();
    const blocks = text.replace(/\r\n/g, '\n').split(/\n\s*\n/);
    const allWords = [];

    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
      if (timeLineIdx === -1) continue;
      const [startRaw, endRaw] = lines[timeLineIdx].split('-->');
      const startSec = parseSrtTimestamp(startRaw);
      const endSec = parseSrtTimestamp(endRaw.split(' ')[0]);
      const captionText = lines
        .slice(timeLineIdx + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (!captionText) continue;

      allWords.push(...buildWordsFromTextAndWindow(captionText, startSec, endSec));
    }

    if (allWords.length === 0) {
      throw new Error('Format file .SRT / .VTT kosong atau tidak memiliki penanda waktu.');
    }

    const moments = pickMomentsFromWordsLocally(allWords, state.mediaInfo.duration, {
      heatmap: state.ytHeatmap
    });
    state.fullSourceWords = allWords;
    state.moments = moments;
    state.scoringMeta = moments.scoringMeta || null;
    renderMomentsCards();
    await selectMoment(0);
    refreshDashboardAndBadges();
    goToWizardStep(2);
    showToast('Subtitle .SRT/.VTT berhasil dikunci ke gelombang vokal');
  } catch (err) {
    showError(err.message || 'Gagal membaca file subtitle.');
  }
}

async function handleCopyAiPromptHelper() {
  const dur = state.mediaInfo ? formatClock(state.mediaInfo.duration) : '15:00';
  const name = state.file ? state.file.name : 'rekaman-podcast.mp4';
  const sampleTranscript = state.moments
    .map((m) => `[${formatClock(m.startSec)} - ${formatClock(m.endSec)}] ${m.transcript || m.title}`)
    .join('\n');

  const promptText = [
    `Saya sedang memotong video "${name}" (durasi ${dur}) menjadi klip vertikal 9:16 untuk Reels, TikTok, dan Shorts.`,
    `Tolong pilihkan 5 bagian paling menarik berdurasi 20–45 detik yang punya:`,
    `1. Kalimat pembuka kuat di 3 detik pertama (pertanyaan, angka konkret, atau pernyataan yang memancing rasa ingin tahu)`,
    `2. Akhir kalimat utuh yang berhenti pas di jeda napas`,
    `3. Usulan Judul Pembuka singkat maksimal 7 kata untuk tiap klip.`,
    sampleTranscript ? `\nRingkasan transkrip saat ini:\n${sampleTranscript}` : ''
  ].join('\n');

  try {
    await navigator.clipboard.writeText(promptText);
    showToast('Prompt transkrip berhasil disalin ke papan klip');
  } catch {
    showToast('Gagal menyalin otomatis');
  }
}

/* ============================================================================
 * 9. LANGKAH 2: SKOR JUJUR 4 SINYAL, GESER DETIK & KUNCI TEKS KE VOKAL
 * ============================================================================ */

function renderMomentsCards() {
  const container = $('moments-container');
  const weightBanner = $('scoring-weight-banner');

  if (weightBanner) {
    const notice =
      state.scoringMeta?.weightNotice ||
      (state.ytHeatmap
        ? 'Bobot skor aktif: Grafik Most-Replayed YouTube (35%) + Lonjakan Vokal (25%) + Kalimat Pembuka (25%) + Jeda Napas Akhir (15%).'
        : 'Grafik Most-Replayed tidak tersedia pada sumber ini — bobot penilaian otomatis dialihkan ke Lonjakan Vokal (40%), Kekuatan Kalimat Pembuka (35%), dan Jeda Napas Kalimat Utuh (25%).');
    weightBanner.textContent = notice;
  }

  if (!container) return;
  container.innerHTML = '';

  state.moments.forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = `moment-card ${idx === state.selectedMomentIndex ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="moment-head">
        <div>
          <span class="pill-tag lime" style="margin-bottom:6px;">Skor ${m.score || 78}/100</span>
          <div class="moment-title">${idx + 1}. ${escapeHtml(m.title)}</div>
        </div>
        <span class="pill-tag">${formatClock(m.startSec)} – ${formatClock(m.endSec)} (${(m.endSec - m.startSec).toFixed(1)} dtk)</span>
      </div>
      <div class="moment-reason">${escapeHtml(m.reason || '')}</div>
      ${
        m.transcript
          ? `<div class="moment-quote">"${escapeHtml(m.transcript.slice(0, 175))}${
              m.transcript.length > 175 ? '...' : ''
            }"</div>`
          : ''
      }
    `;
    card.addEventListener('click', () => selectMoment(idx));
    container.appendChild(card);
  });
}

async function selectMoment(index, { skipVocalExtract = false } = {}) {
  const m = state.moments[index];
  if (!m) return;
  stopStep2AudioPreview();
  state.selectedMomentIndex = index;
  state.clipStartSec = Number(m.startSec.toFixed(2));
  state.clipEndSec = Number(m.endSec.toFixed(2));
  state.cameraTrack = null;
  state.transcriptManuallyEdited = false;

  const totalDur = state.mediaInfo?.duration || 60;
  ['slider-clip-start', 'slider-clip-end'].forEach((id) => {
    if ($(id)) $(id).max = String(Math.ceil(totalDur));
  });
  syncTrimmerInputs();

  const transcriptBox = $('clip-transcript-input');
  const slicedFromFull =
    Array.isArray(state.fullSourceWords) && state.fullSourceWords.length > 0
      ? sliceSourceWordsForWindow(state.fullSourceWords, state.clipStartSec, state.clipEndSec)
      : [];

  if (slicedFromFull.length > 0 && (!Array.isArray(m.words) || slicedFromFull.length >= m.words.length)) {
    state.words = slicedFromFull.map((w) => ({ ...w }));
    if (transcriptBox) transcriptBox.value = state.words.map((w) => w.word).join(' ');
  } else if (Array.isArray(m.words) && m.words.length > 0) {
    state.words = m.words.map((w) => ({ ...w }));
    if (transcriptBox) transcriptBox.value = m.transcript || m.words.map((w) => w.word).join(' ');
  } else {
    const rawTxt = m.transcript || '';
    if (transcriptBox) transcriptBox.value = rawTxt;
    state.words = rawTxt
      ? buildWordsFromTextAndWindow(rawTxt, state.clipStartSec, state.clipEndSec)
      : [];
  }

  state.hookTitle = craftCleanHookTitle(m.title || m.transcript, index + 1);
  if ($('hook-title-input')) $('hook-title-input').value = state.hookTitle;

  document.querySelectorAll('.moment-card').forEach((el, i) => {
    el.classList.toggle('selected', i === index);
  });

  if (!skipVocalExtract) {
    await refreshClipVocalEnvelopeAndWords({ relockExistingWords: state.words.length > 0 });
  }
}

function syncTrimmerInputs() {
  if ($('clip-start-input')) $('clip-start-input').value = String(state.clipStartSec);
  if ($('slider-clip-start')) $('slider-clip-start').value = String(state.clipStartSec);
  if ($('clip-end-input')) $('clip-end-input').value = String(state.clipEndSec);
  if ($('slider-clip-end')) $('slider-clip-end').value = String(state.clipEndSec);
  const dur = Math.max(0.5, state.clipEndSec - state.clipStartSec);
  if ($('label-clip-duration')) {
    $('label-clip-duration').textContent = `Durasi Klip: ${dur.toFixed(1)} dtk`;
  }
}

function handleTrimChange(source) {
  const maxDur = state.mediaInfo?.duration || 3600;
  let s = Number(
    source === 'slider' ? $('slider-clip-start').value : $('clip-start-input').value
  );
  let e = Number(source === 'slider' ? $('slider-clip-end').value : $('clip-end-input').value);
  s = Math.max(0, Math.min(maxDur - 1, s));
  e = Math.max(s + 1, Math.min(maxDur, e));

  state.clipStartSec = Number(s.toFixed(2));
  state.clipEndSec = Number(e.toFixed(2));
  state.cameraTrack = null;
  syncTrimmerInputs();

  clearTimeout(handleTrimChange._debounce);
  handleTrimChange._debounce = setTimeout(async () => {
    if (
      Array.isArray(state.fullSourceWords) &&
      state.fullSourceWords.length > 0 &&
      !state.transcriptManuallyEdited
    ) {
      const sliced = sliceSourceWordsForWindow(
        state.fullSourceWords,
        state.clipStartSec,
        state.clipEndSec
      );
      state.words = sliced;
      if ($('clip-transcript-input')) {
        $('clip-transcript-input').value = sliced.map((w) => w.word).join(' ');
      }
      await refreshClipVocalEnvelopeAndWords({ relockExistingWords: sliced.length > 0 });
      return;
    }

    await refreshClipVocalEnvelopeAndWords({ relockExistingWords: false });
    const txt = $('clip-transcript-input')?.value.trim() || '';
    if (txt && state.vocalClipSamples) {
      state.words = buildWordsFromTextAndWindow(
        txt,
        state.clipStartSec,
        state.clipEndSec,
        state.vocalClipSamples,
        16000
      );
      drawVocalSyncTimeline();
    }
  }, 180);
}

async function handleSnapBoundsToBreathPause() {
  if (!state.file || !state.mediaInfo) return;
  if (!state.vocalEnvelope) {
    await refreshClipVocalEnvelopeAndWords();
  }
  const snapped = snapClipBoundsToBreathPause(
    state.clipStartSec,
    state.clipEndSec,
    state.vocalEnvelope,
    state.mediaInfo.duration
  );
  state.clipStartSec = snapped.startSec;
  state.clipEndSec = snapped.endSec;
  syncTrimmerInputs();

  if (
    Array.isArray(state.fullSourceWords) &&
    state.fullSourceWords.length > 0 &&
    !state.transcriptManuallyEdited
  ) {
    const sliced = sliceSourceWordsForWindow(
      state.fullSourceWords,
      state.clipStartSec,
      state.clipEndSec
    );
    if (sliced.length > 0) {
      state.words = sliced;
      if ($('clip-transcript-input')) {
        $('clip-transcript-input').value = sliced.map((w) => w.word).join(' ');
      }
    }
  }

  await refreshClipVocalEnvelopeAndWords({ relockExistingWords: true });
  showToast('Titik awal & akhir dirapatkan ke jeda napas terdekat tanpa kata tertinggal');
}

async function handleLockEditedTextToVocal() {
  const txt = $('clip-transcript-input')?.value.trim() || '';
  if (!txt) {
    state.words = [];
    drawVocalSyncTimeline();
    showToast('Teks caption dikosongkan');
    return;
  }
  const btn = $('btn-lock-text-vocal');
  if (btn) btn.disabled = true;
  try {
    const locked = await lockEditedTextToClipVocal(
      state.file,
      txt,
      state.clipStartSec,
      state.clipEndSec
    );
    state.words = locked;
    if (state.moments[state.selectedMomentIndex]) {
      state.moments[state.selectedMomentIndex].words = locked;
      state.moments[state.selectedMomentIndex].transcript = txt;
    }
    await refreshClipVocalEnvelopeAndWords({ relockExistingWords: false });
    showToast(`${locked.length} kata berhasil dikunci presisi ke gelombang vokal`);
  } catch (err) {
    showError(err?.message || 'Gagal mengunci teks ke gelombang vokal.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function stopStep2AudioPreview() {
  if (state.step2AudioRafId) {
    cancelAnimationFrame(state.step2AudioRafId);
    state.step2AudioRafId = null;
  }
  if (state.step2AudioEl) {
    state.step2AudioEl.pause();
  }
  const btn = $('btn-step2-play-audio');
  if (btn) btn.textContent = 'Dengarkan Suara & Cek Ketukan Kata';
  drawVocalSyncTimeline(null);
}

async function toggleStep2AudioPreview(seekToSec = null) {
  if (!state.videoObjectUrl) return;
  if (!state.step2AudioEl) {
    state.step2AudioEl = document.createElement('video');
    state.step2AudioEl.className = 'offscreen-media-player';
    state.step2AudioEl.playsInline = true;
    document.body.appendChild(state.step2AudioEl);
  }
  const media = state.step2AudioEl;
  if (media.src !== state.videoObjectUrl) {
    media.src = state.videoObjectUrl;
  }

  if (seekToSec == null && !media.paused) {
    stopStep2AudioPreview();
    return;
  }

  const targetStart =
    seekToSec != null
      ? Math.max(state.clipStartSec, Math.min(state.clipEndSec - 0.1, seekToSec))
      : state.clipStartSec;

  media.currentTime = targetStart;
  media.muted = false;
  media.volume = 1;

  try {
    await media.play();
    const btn = $('btn-step2-play-audio');
    if (btn) btn.textContent = 'Hentikan Suara';

    const tick = () => {
      if (media.paused) return;
      if (media.currentTime >= state.clipEndSec) {
        stopStep2AudioPreview();
        return;
      }
      const cur = media.currentTime;
      const offset = Number(state.captionOffsetSec) || 0;
      const activeWord = state.words.find(
        (w) => cur - offset >= w.start - 0.02 && cur - offset <= w.end + 0.05
      );
      if ($('step2-audio-time')) {
        $('step2-audio-time').textContent = `Memutar ${formatClock(cur)} / ${formatClock(
          state.clipEndSec
        )}${activeWord ? ` · Kata aktif: "${activeWord.word}"` : ' · (Jeda napas)'}`;
      }
      drawVocalSyncTimeline(cur);
      state.step2AudioRafId = requestAnimationFrame(tick);
    };
    if (state.step2AudioRafId) cancelAnimationFrame(state.step2AudioRafId);
    state.step2AudioRafId = requestAnimationFrame(tick);
  } catch {
    showError('Klik sekali lagi untuk mengaktifkan pemutar suara di browser.');
  }
}

async function handleResyncClipWithWhisper() {
  if (!state.file) return;
  const btn = $('btn-resync-whisper');
  if (btn) btn.disabled = true;
  showError('');

  try {
    const words = await syncClipWordsWithWhisper(
      state.file,
      state.clipStartSec,
      state.clipEndSec,
      (txt, pct) => setStatus('step2', true, txt, pct)
    );
    setStatus('step2', false);

    if (words.length > 0) {
      state.words = words;
      state.transcriptManuallyEdited = false;
      const joined = words.map((w) => w.word).join(' ');
      if ($('clip-transcript-input')) $('clip-transcript-input').value = joined;
      state.hookTitle = craftCleanHookTitle(joined, state.selectedMomentIndex + 1);
      if ($('hook-title-input')) $('hook-title-input').value = state.hookTitle;
      await refreshClipVocalEnvelopeAndWords({ relockExistingWords: false });
      showToast(`${words.length} kata berhasil dibaca & dikunci ke vokal`);
    } else {
      showError('Tidak terdengar vokal ucapan pada rentang detik ini. Coba geser titik mulai/selesai klip.');
    }
  } catch (err) {
    setStatus('step2', false);
    showError(err.message || 'Gagal membaca ulang vokal klip.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleEnsureZeroMissSubtitles() {
  if (!state.file) return;
  const btn = $('btn-ensure-zero-miss');
  if (btn) btn.disabled = true;
  showError('');

  try {
    setStatus('step2', true, 'Memeriksa pulau vokal & menambal kata yang terlewat (Anti-Miss)...', 18);
    const patched = await ensureZeroMissClipSubtitles({
      file: state.file,
      clipSamples16k: state.vocalClipSamples,
      startSec: state.clipStartSec,
      endSec: state.clipEndSec,
      words: state.words,
      fullSourceWords: state.transcriptManuallyEdited ? null : state.fullSourceWords,
      allowWhisperGapFill: true,
      onStatus: (txt, pct) => setStatus('step2', true, txt, pct)
    });
    setStatus('step2', false);

    if (patched.length > 0) {
      const addedCount = Math.max(0, patched.length - (state.words?.length || 0));
      state.words = patched;
      const joined = patched.map((w) => w.word).join(' ');
      if ($('clip-transcript-input')) $('clip-transcript-input').value = joined;
      if (state.moments[state.selectedMomentIndex]) {
        state.moments[state.selectedMomentIndex].words = patched;
        state.moments[state.selectedMomentIndex].transcript = joined;
      }
      drawVocalSyncTimeline();
      showToast(
        addedCount > 0
          ? `Anti-Miss selesai: +${addedCount} kata yang sempat kosong berhasil ditambal (${patched.length} kata total)`
          : `Seluruh ${patched.length} kata sudah utuh & terkunci presisi tanpa ada miss!`
      );
    } else {
      showToast('Tidak terdengar vokal ucapan aktif pada rentang klip ini.');
    }
  } catch (err) {
    setStatus('step2', false);
    showError(err?.message || 'Gagal memeriksa celah subtitle.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ============================================================================
 * 10. LANGKAH 3: FRAMING 1/2 WAJAH, GENERATOR DESKRIPSI, PREVIEW & EKSPOR MP4
 * ============================================================================ */

function updateDetectedFacesBadge(cameraTrack) {
  const badge = $('detected-faces-badge');
  if (!badge) return;
  const meta = cameraTrack?.meta;
  if (!meta) {
    badge.textContent = 'Deteksi Otomatis 1 / 2 Wajah';
    return;
  }
  const effective = resolveEffectiveFrameMode(state.frameMode, cameraTrack);
  if (meta.detectedFaces >= 2) {
    badge.textContent =
      effective === 'podcast-split'
        ? '2 Wajah Terdeteksi -> Podcast Split Atas-Bawah'
        : `2 Wajah Terdeteksi (${effective})`;
  } else {
    badge.textContent =
      effective === 'crop-fill'
        ? '1 Pembicara Terdeteksi -> Fullscreen Tengah'
        : `1 Pembicara Terdeteksi (${effective})`;
  }
}

function generatePostDescriptionAndHashtags() {
  if (!state.features.descriptionHashtagGenerator) {
    showToast('Generator Deskripsi & Hashtag tersedia pada Paket Tambahan (Rp 49.000)');
    return;
  }

  const hook = ($('hook-title-input')?.value || state.hookTitle || 'Poin Penting Hari Ini').trim();
  const rawTranscript = (
    $('clip-transcript-input')?.value ||
    state.words.map((w) => w.word).join(' ') ||
    ''
  ).trim();

  // Ambil 1-2 kalimat pembuka yang bersih dari transkrip klip
  const cleanSummary = rawTranscript
    ? rawTranscript.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').slice(0, 240)
    : 'Simak cuplikan lengkapnya dalam kurang dari satu menit.';

  // Ekstrak kata kunci topik bermakna (> 4 huruf, bukan kata sambung umum) untuk hashtag relevan
  const stopWords = new Set([
    'yang', 'untuk', 'dalam', 'dengan', 'adalah', 'karena', 'kalau', 'tidak', 'bukan',
    'sudah', 'masih', 'akan', 'bisa', 'harus', 'lebih', 'sangat', 'banyak', 'semua',
    'seperti', 'ketika', 'terus', 'kemudian', 'sekarang', 'mereka', 'kita', 'kamu',
    'saya', 'dari', 'pada', 'atau', 'tapi', 'jadi', 'banget', 'gimana', 'kenapa'
  ]);
  const wordFreq = new Map();
  const combinedTokens = `${hook} ${rawTranscript}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !stopWords.has(w) && !/^\d+$/.test(w));

  for (const tok of combinedTokens) {
    wordFreq.set(tok, (wordFreq.get(tok) || 0) + 1);
  }

  const topTags = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([w]) => `#${w}`);

  const baseTags = ['#klippodcast', '#potonganvideo', '#edukasikreator', '#reelsindonesia', '#belajarbisnis'];
  const mergedTags = Array.from(new Set([...topTags, ...baseTags])).slice(0, 7);

  const creatorHandle = state.watermarkText ? `\nSumber: ${state.watermarkText}` : '';
  const finalDesc = `${hook}\n\n${cleanSummary}${creatorHandle}\n\nTulis pendapatmu di kolom komentar dan simpan klip ini bila bermanfaat.\n\n${mergedTags.join(' ')}`;

  const outBox = $('generated-desc-output');
  const copyBtn = $('btn-copy-desc');
  if (outBox) {
    outBox.value = finalDesc;
    outBox.style.display = 'block';
  }
  if (copyBtn) {
    copyBtn.style.display = 'inline-flex';
  }
  showToast('Deskripsi & hashtag siap disalin');
}

function getPreviewCurrentTime() {
  const vid = $('hidden-preview-video');
  if (vid && !Number.isNaN(vid.currentTime) && vid.currentTime >= state.clipStartSec) {
    return vid.currentTime;
  }
  return state.clipStartSec;
}

function ensurePreviewAudioBoostGraph(vid) {
  if (!vid) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!state.previewWebAudioCtx) {
    try {
      const ctx = new AudioCtx();
      const src = ctx.createMediaElementSource(vid);
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 80;
      const gain = ctx.createGain();
      gain.gain.value = state.volumeGain;
      src.connect(hpf);
      hpf.connect(gain);
      gain.connect(ctx.destination);
      state.previewWebAudioCtx = ctx;
      state.previewWebAudioGain = gain;
    } catch {}
  }

  if (state.previewWebAudioCtx?.state === 'suspended') {
    state.previewWebAudioCtx.resume().catch(() => {});
  }
  if (state.previewWebAudioGain) {
    state.previewWebAudioGain.gain.value = state.isPreviewMuted ? 0 : state.volumeGain;
  }
}

function disposePreviewStaticDecoder() {
  if (state.previewStaticInput) {
    try {
      state.previewStaticInput.dispose();
    } catch {}
  }
  state.previewStaticInput = null;
  state.previewStaticSink = null;
  state.previewStaticBusy = false;
  state.previewStaticPendingSec = null;
}

async function preparePreviewPlayer() {
  const vid = $('hidden-preview-video');
  if (!vid || !state.videoObjectUrl) return;

  if (vid.dataset.boundUrl !== state.videoObjectUrl) {
    disposePreviewStaticDecoder();
    vid.src = state.videoObjectUrl;
    vid.dataset.boundUrl = state.videoObjectUrl;
    await new Promise((resolve) => {
      if (vid.readyState >= 2) return resolve();
      vid.onloadeddata = () => resolve();
      vid.onerror = () => resolve();
      setTimeout(resolve, 1400);
    });
  }

  vid.muted = state.isPreviewMuted;
  vid.volume = 1.0;
  vid.currentTime = state.clipStartSec;

  if (!state.words || state.words.length === 0) {
    const rawTxt = $('clip-transcript-input')?.value.trim() || '';
    if (rawTxt && rawTxt !== DEFAULT_CAPTION_PLACEHOLDER) {
      state.words = buildWordsFromTextAndWindow(
        rawTxt,
        state.clipStartSec,
        state.clipEndSec,
        state.vocalClipSamples,
        16000
      );
    }
  }

  await ensureCaptionFontLoaded(state.fontFamilyId, 48);
  updateDetectedFacesBadge(state.cameraTrack);
  await renderStaticPreviewFrame(state.clipStartSec);

  if (!state.cameraTrack && state.file && !state.autoPreviewFaceScanning) {
    state.autoPreviewFaceScanning = true;
    handleScanFacePreview().finally(() => {
      state.autoPreviewFaceScanning = false;
    });
  }
}

function paintCurrentStateToPreviewCanvas(frameSource, srcW, srcH, timeSec) {
  const canvas = $('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const phraseGroups = groupWordsIntoPhrases(state.words, 4);

  let centerX = 0.5 + state.manualCenterXOffset;
  if (state.autoFaceCenter && state.cameraTrack) {
    centerX = sampleCameraCenterX(state.cameraTrack, timeSec) + state.manualCenterXOffset;
  }
  centerX = Math.max(0.05, Math.min(0.95, centerX));

  drawClipFrame(ctx, {
    source: frameSource,
    sourceWidth: srcW,
    sourceHeight: srcH,
    targetWidth: canvas.width,
    targetHeight: canvas.height,
    currentTimeSec: timeSec,
    clipStartSec: state.clipStartSec,
    centerX,
    frameMode: state.frameMode,
    cameraMeta: state.cameraTrack?.meta || null,
    presetId: state.presetId,
    fontFamilyId: state.fontFamilyId,
    fontScale: state.fontScale,
    textCase: state.textCase,
    phraseGroups,
    captionOffsetSec: state.captionOffsetSec,
    hookTitle: $('hook-title-input')?.value ?? state.hookTitle,
    hookStyle: $('hook-style-select')?.value || state.hookStyle,
    hookDurationSec: state.hookDurationSec,
    watermarkImage: state.features.customWatermark ? state.watermarkImage : null,
    watermarkText: state.features.customWatermark
      ? $('watermark-text-input')?.value || state.watermarkText
      : '',
    watermarkPos: $('watermark-pos-select')?.value || state.watermarkPos,
    watermarkOpacity: 0.88
  });

  const relCur = Math.max(0, timeSec - state.clipStartSec);
  const relDur = Math.max(0.5, state.clipEndSec - state.clipStartSec);
  if ($('preview-time-label')) {
    $('preview-time-label').textContent = `${relCur.toFixed(1)}s / ${relDur.toFixed(1)}s`;
  }
}

async function renderStaticPreviewFrame(timeSec) {
  if (!state.file || state.isPlayingPreview) return;

  if (state.previewStaticBusy) {
    state.previewStaticPendingSec = timeSec;
    return;
  }
  state.previewStaticBusy = true;

  try {
    if (!state.previewStaticSink) {
      const input = new Input({
        source: new BlobSource(state.file),
        formats: ALL_FORMATS
      });
      const vTrack = await input.getPrimaryVideoTrack();
      if (vTrack) {
        state.previewStaticInput = input;
        state.previewStaticSink = new CanvasSink(vTrack, { poolSize: 2 });
      } else {
        input.dispose();
      }
    }

    if (state.previewStaticSink) {
      const wrapped = await state.previewStaticSink.getCanvas(Math.max(0, timeSec));
      if (wrapped?.canvas) {
        paintCurrentStateToPreviewCanvas(
          wrapped.canvas,
          wrapped.canvas.width,
          wrapped.canvas.height,
          timeSec
        );
        return;
      }
    }

    const vid = $('hidden-preview-video');
    if (vid && vid.videoWidth > 0) {
      paintCurrentStateToPreviewCanvas(vid, vid.videoWidth, vid.videoHeight, timeSec);
    }
  } catch {
    const vid = $('hidden-preview-video');
    if (vid && vid.videoWidth > 0) {
      paintCurrentStateToPreviewCanvas(vid, vid.videoWidth, vid.videoHeight, timeSec);
    }
  } finally {
    state.previewStaticBusy = false;
    if (state.previewStaticPendingSec !== null) {
      const nextSec = state.previewStaticPendingSec;
      state.previewStaticPendingSec = null;
      renderStaticPreviewFrame(nextSec);
    }
  }
}

function startPreviewPlayback() {
  const vid = $('hidden-preview-video');
  if (!vid || !state.file) return;

  if (vid.currentTime < state.clipStartSec || vid.currentTime >= state.clipEndSec - 0.15) {
    vid.currentTime = state.clipStartSec;
  }
  vid.muted = state.isPreviewMuted;
  vid.volume = 1.0;
  ensurePreviewAudioBoostGraph(vid);

  vid
    .play()
    .then(() => {
      state.isPlayingPreview = true;
      if ($('btn-toggle-play')) $('btn-toggle-play').textContent = 'Jeda Preview';
      const loop = () => {
        if (!state.isPlayingPreview) return;
        if (vid.currentTime >= state.clipEndSec) {
          vid.currentTime = state.clipStartSec;
        }
        if (vid.videoWidth > 0) {
          paintCurrentStateToPreviewCanvas(
            vid,
            vid.videoWidth,
            vid.videoHeight,
            vid.currentTime
          );
        }
        state.previewRafId = requestAnimationFrame(loop);
      };
      state.previewRafId = requestAnimationFrame(loop);
    })
    .catch(() => {
      showError('Klik tombol Putar Preview sekali lagi untuk mengaktifkan suara & video.');
    });
}

function stopPreviewPlayback() {
  state.isPlayingPreview = false;
  if (state.previewRafId) {
    cancelAnimationFrame(state.previewRafId);
    state.previewRafId = null;
  }
  const vid = $('hidden-preview-video');
  if (vid && !vid.paused) vid.pause();
  if ($('btn-toggle-play')) $('btn-toggle-play').textContent = 'Putar Preview';
}

async function handleScanFacePreview() {
  if (!state.file) return;
  const btn = $('btn-scan-face-preview');
  if (btn) btn.disabled = true;
  showError('');
  setStatus('render', true, 'Mendeteksi 1 atau 2 wajah pembicara di sepanjang klip...', 25);

  let scanInput = null;
  try {
    scanInput = new Input({
      source: new BlobSource(state.file),
      formats: ALL_FORMATS
    });
    const vTrack = await scanInput.getPrimaryVideoTrack();
    if (!vTrack) {
      throw new Error('Jalur video tidak ditemukan pada file sumber.');
    }
    const canvasSink = new CanvasSink(vTrack, { poolSize: 2 });
    state.cameraTrack = await buildFaceTrackForClip({
      canvasSink,
      startSec: state.clipStartSec,
      endSec: state.clipEndSec,
      onProgress: (p) => setStatus('render', true, `Memindai tata letak wajah pembicara (${p}%)...`, p)
    });
    setStatus('render', false);
    updateDetectedFacesBadge(state.cameraTrack);
    renderStaticPreviewFrame(getPreviewCurrentTime());
    const facesCount = state.cameraTrack?.meta?.detectedFaces || 1;
    showToast(
      facesCount >= 2
        ? '2 wajah terdeteksi: Podcast Split Atas-Bawah siap tanpa keyframe manual'
        : '1 pembicara terdeteksi: Fullscreen Tengah terkunci mulus'
    );
  } catch (err) {
    setStatus('render', false);
    showError(`Gagal memindai posisi wajah: ${err.message}`);
  } finally {
    try {
      scanInput?.dispose();
    } catch {}
    if (btn) btn.disabled = false;
  }
}

async function handleRenderMp4() {
  if (!state.file) return;
  stopPreviewPlayback();
  showError('');
  $('result-box')?.classList.remove('visible');

  try {
    await assertSufficientDiskForRender(65 * 1024 * 1024);
  } catch (diskErr) {
    showError(diskErr.message);
    return;
  }

  const renderBtn = $('btn-render-mp4');
  const cancelBtn = $('btn-cancel-render');
  if (renderBtn) renderBtn.disabled = true;
  if (cancelBtn) cancelBtn.style.display = 'inline-flex';

  state.renderAbortController = new AbortController();
  const resolution = $('resolution-select')?.value || '720p';
  const hookTitleVal = $('hook-title-input')?.value || '';
  const wmTextVal = state.features.customWatermark
    ? $('watermark-text-input')?.value || state.watermarkText
    : '';

  try {
    const res = await renderClipToMp4({
      file: state.file,
      startSec: state.clipStartSec,
      endSec: state.clipEndSec,
      resolution,
      fps: 30,
      frameMode: state.frameMode,
      autoFaceCenter: state.autoFaceCenter,
      manualCenterXOffset: state.manualCenterXOffset,
      prebuiltCameraTrack: state.autoFaceCenter ? state.cameraTrack : null,
      presetId: state.presetId,
      fontFamilyId: state.fontFamilyId,
      fontScale: state.fontScale,
      textCase: state.textCase,
      words: state.words,
      fullSourceWords: state.transcriptManuallyEdited ? null : state.fullSourceWords,
      captionOffsetSec: state.captionOffsetSec,
      hookTitle: hookTitleVal,
      hookStyle: $('hook-style-select')?.value || 'white',
      hookDurationSec: state.hookDurationSec,
      forceCpuMode: typeof window !== 'undefined' && Boolean(window.__KLIP_FORCE_CPU_ENCODE),
      watermarkImage: state.features.customWatermark ? state.watermarkImage : null,
      watermarkText: wmTextVal,
      watermarkPos: $('watermark-pos-select')?.value || 'top-right',
      watermarkOpacity: 0.88,
      voiceBoost: state.voiceBoost,
      volumeGain: state.volumeGain,
      monoToStereo: state.monoToStereo,
      signal: state.renderAbortController.signal,
      onProgress: ({ phase, percent }) => setStatus('render', true, phase, percent)
    });

    state.cameraTrack = res.cameraTrack || state.cameraTrack;
    updateDetectedFacesBadge(state.cameraTrack);
    setStatus('render', false);

    if (state.lastRenderedObjectUrl) URL.revokeObjectURL(state.lastRenderedObjectUrl);
    state.lastRenderedObjectUrl = URL.createObjectURL(res.blob);

    const outVideo = $('result-video');
    if (outVideo) {
      outVideo.src = state.lastRenderedObjectUrl;
      outVideo.load();
    }

    const dlBtn = $('btn-download-mp4');
    const cleanBase = state.file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
    if (dlBtn) {
      dlBtn.href = state.lastRenderedObjectUrl;
      dlBtn.download = `${cleanBase}-klip-9x16.mp4`;
    }

    const sizeMb = (res.sizeBytes / (1024 * 1024)).toFixed(2);
    const fontObj = getCaptionFontById(state.fontFamilyId);
    const modeLabel =
      res.effectiveFrameMode === 'podcast-split'
        ? 'Podcast Split 2 Wajah'
        : res.effectiveFrameMode === 'blur-fit'
        ? 'Cinema Blur'
        : res.effectiveFrameMode === 'gaming-split'
        ? 'Gaming Split'
        : 'Fullscreen Tengah';

    if ($('result-meta')) {
      $('result-meta').textContent = `${modeLabel} · Font ${fontObj.name} · Mesin ${String(
        res.encoderMode || 'gpu'
      ).toUpperCase()} · Resolusi ${res.width}×${res.height} · Durasi ${res.durationSec.toFixed(
        1
      )} dtk · Ukuran ${sizeMb} MB · Selesai dalam ${res.renderSeconds} detik.`;
    }
    $('result-box')?.classList.add('visible');

    addRenderHistoryEntry({
      hookTitle: hookTitleVal || state.moments[state.selectedMomentIndex]?.title,
      sourceName: state.file.name,
      presetId: state.presetId,
      fontFamilyId: state.fontFamilyId,
      resolution,
      durationSec: res.durationSec,
      sizeMb
    });

    showToast('File MP4 9:16 selesai dibuat');
  } catch (err) {
    setStatus('render', false);
    if (err.name === 'AbortError') {
      showError('Proses render MP4 dibatalkan.');
    } else {
      showError(`Gagal merender MP4: ${err.message}`);
    }
  } finally {
    if (renderBtn) renderBtn.disabled = false;
    if (cancelBtn) cancelBtn.style.display = 'none';
    state.renderAbortController = null;
  }
}

/* ============================================================================
 * 11. PENDAFTARAN EVENT HANDLER STUDIO WIZARD
 * ============================================================================ */

function setupWizardControls() {
  renderPresetCards();
  renderFontCards();

  // Navigasi 3 Tab Langkah Wizard
  [1, 2, 3].forEach((n) => {
    $(`tab-step-${n}`)?.addEventListener('click', () => {
      if (n > 1 && !state.file) {
        showError('Pilih file video lokal atau tempel link YouTube terlebih dahulu di Langkah 1.');
        return;
      }
      goToWizardStep(n);
    });
  });

  // Kartu Link YouTube Tanpa Ekstensi + Unduh Video YouTube (.MP4) + Fallback Ramah
  $('btn-yt-fetch')?.addEventListener('click', handleFetchYoutubeUrl);
  $('yt-url-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchYoutubeUrl();
    }
  });
  $('btn-yt-import-studio')?.addEventListener('click', handleYoutubeImportAction);
  $('btn-yt-download-mp4')?.addEventListener('click', handleYoutubeDirectDownloadAction);
  $('btn-yt-cancel')?.addEventListener('click', () => state.ytAbortController?.abort());

  // Tombol Fallback Pilih File Lokal & Modal Panduan Ekstensi Jembatan Lokal
  $('btn-fallback-pick-local')?.addEventListener('click', () => $('video-file-input')?.click());
  $('btn-open-ext-guide')?.addEventListener('click', () => $('modal-ext-guide')?.classList.add('open'));
  $('btn-close-ext-guide')?.addEventListener('click', () => $('modal-ext-guide')?.classList.remove('open'));
  $('btn-ext-modal-pick-local')?.addEventListener('click', () => {
    $('modal-ext-guide')?.classList.remove('open');
    $('video-file-input')?.click();
  });
  $('modal-ext-guide')?.addEventListener('click', (e) => {
    if (e.target === $('modal-ext-guide')) $('modal-ext-guide')?.classList.remove('open');
  });

  // Pemotong Batch Otomatis & Multi-Video (Pro)
  $('btn-run-ai-agent')?.addEventListener('click', () => startAutonomousClipAgent());
  $('btn-stop-ai-agent')?.addEventListener('click', () => state.agentAbortController?.abort());
  $('agent-clip-count-select')?.addEventListener('change', (e) => {
    state.agentClipCount = Number(e.target.value) || 3;
  });
  $('agent-font-select')?.addEventListener('change', async (e) => {
    state.fontFamilyId = e.target.value || 'jakarta';
    renderFontCards();
    await ensureCaptionFontLoaded(state.fontFamilyId, 48);
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });
  $('btn-download-all-agent')?.addEventListener('click', () => {
    if (state.agentRenderedClips.length === 0) return;
    state.agentRenderedClips.forEach((clip, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = clip.objectUrl;
        a.download = clip.fileName;
        a.click();
      }, idx * 280);
    });
    showToast(`Mengunduh ${state.agentRenderedClips.length} file MP4 ke perangkatmu...`);
  });

  $('btn-pick-multi-video')?.addEventListener('click', () => {
    if (!state.features.multiVideoBatch) {
      showToast('Batch Multi-Video tersedia pada Paket Pro');
      return;
    }
    $('multi-video-input')?.click();
  });
  $('multi-video-input')?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) runMultiVideoBatchQueue(files);
  });

  // Dropzone & Pilih File Video Lokal (.MP4, .MOV, .MKV, .WEBM)
  const dropzone = $('dropzone');
  const fileInput = $('video-file-input');
  $('btn-pick-file')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });
  $('btn-load-sample')?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLoadSampleVideo();
  });
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    fileInput?.click();
  });
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.[0]) handleVideoSelected(e.dataTransfer.files[0]);
  });
  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.[0]) handleVideoSelected(fileInput.files[0]);
  });

  $('btn-skip-to-step2')?.addEventListener('click', () => goToWizardStep(2));
  $('btn-analyze-whisper')?.addEventListener('click', handleWhisperAnalysis);
  $('btn-analyze-gemini')?.addEventListener('click', handleGeminiAnalysis);
  $('btn-pick-srt')?.addEventListener('click', () => $('srt-file-input')?.click());
  $('srt-file-input')?.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleSrtUpload(e.target.files[0]);
  });

  $('btn-copy-ai-prompt')?.addEventListener('click', handleCopyAiPromptHelper);
  $('btn-copy-ai-prompt-step2')?.addEventListener('click', handleCopyAiPromptHelper);
  $('btn-open-hook-picker')?.addEventListener('click', () => {
    state.libCategory = 'Hook Video Viral';
    populateLibraryFilters();
    switchView('library');
  });

  // Langkah 2: Geser Detik, Rapatkan ke Jeda Napas, Kalibrasi Offset Vokal, & Kunci Teks
  $('slider-clip-start')?.addEventListener('input', () => handleTrimChange('slider'));
  $('slider-clip-end')?.addEventListener('input', () => handleTrimChange('slider'));
  $('clip-start-input')?.addEventListener('change', () => handleTrimChange('number'));
  $('clip-end-input')?.addEventListener('change', () => handleTrimChange('number'));
  $('btn-snap-breath')?.addEventListener('click', handleSnapBoundsToBreathPause);
  $('btn-step2-play-audio')?.addEventListener('click', () => toggleStep2AudioPreview());

  // Klik langsung pada kanvas gelombang vokal untuk mengecek ketukan kata di titik mana saja!
  $('vocal-sync-canvas')?.addEventListener('click', (ev) => {
    const canvas = $('vocal-sync-canvas');
    if (!canvas || !state.file) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
    const targetSec = state.clipStartSec + ratio * (state.clipEndSec - state.clipStartSec);
    toggleStep2AudioPreview(targetSec);
  });

  $('caption-offset-range')?.addEventListener('input', (e) => {
    const val = Number(e.target.value) || 0;
    state.captionOffsetSec = val;
    const ms = Math.round(val * 1000);
    if ($('caption-offset-label')) {
      $('caption-offset-label').textContent =
        ms === 0 ? '0 ms (Pas Otomatis)' : `${ms > 0 ? '+' : ''}${ms} ms`;
    }
    drawVocalSyncTimeline();
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('btn-lock-text-vocal')?.addEventListener('click', handleLockEditedTextToVocal);
  $('clip-transcript-input')?.addEventListener('input', (e) => {
    state.transcriptManuallyEdited = true;
    const txt = e.target.value.trim();
    state.words = txt
      ? buildWordsFromTextAndWindow(
          txt,
          state.clipStartSec,
          state.clipEndSec,
          state.vocalClipSamples,
          16000
        )
      : [];
    drawVocalSyncTimeline();
  });

  $('btn-resync-whisper')?.addEventListener('click', handleResyncClipWithWhisper);
  $('btn-ensure-zero-miss')?.addEventListener('click', handleEnsureZeroMissSubtitles);
  $('btn-go-step3')?.addEventListener('click', () => goToWizardStep(3));

  // Langkah 3: Preview 9:16, Mode Framing, Judul 3 Detik, Watermark, Generator Deskripsi & Ekspor MP4
  $('btn-toggle-play')?.addEventListener('click', () => {
    if (state.isPlayingPreview) stopPreviewPlayback();
    else startPreviewPlayback();
  });

  $('btn-toggle-mute')?.addEventListener('click', () => {
    state.isPreviewMuted = !state.isPreviewMuted;
    const vid = $('hidden-preview-video');
    if (vid) vid.muted = state.isPreviewMuted;
    if (state.previewWebAudioGain) {
      state.previewWebAudioGain.gain.value = state.isPreviewMuted ? 0 : state.volumeGain;
    }
    if ($('btn-toggle-mute')) {
      $('btn-toggle-mute').textContent = state.isPreviewMuted ? 'Suara: Bisu' : 'Suara: Aktif';
    }
  });

  $('frame-mode-select')?.addEventListener('change', (e) => {
    const chosen = e.target.value;
    if (chosen === 'gaming-split' && !state.features.gamingSplit) {
      e.target.value = state.frameMode;
      showToast('Mode Gaming Split tersedia pada Paket Pro');
      return;
    }
    state.frameMode = chosen;
    updateDetectedFacesBadge(state.cameraTrack);
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('auto-face-checkbox')?.addEventListener('change', (e) => {
    state.autoFaceCenter = e.target.checked;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('manual-offset-range')?.addEventListener('input', (e) => {
    state.manualCenterXOffset = Number(e.target.value);
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('btn-scan-face-preview')?.addEventListener('click', handleScanFacePreview);

  $('caption-size-range')?.addEventListener('input', (e) => {
    const pct = Math.max(80, Math.min(135, Number(e.target.value) || 100));
    state.fontScale = pct / 100;
    if ($('caption-size-label')) $('caption-size-label').textContent = `${pct}%`;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('caption-case-select')?.addEventListener('change', (e) => {
    state.textCase = e.target.value || 'auto';
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('hook-title-input')?.addEventListener('input', (e) => {
    state.hookTitle = e.target.value;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('hook-duration-select')?.addEventListener('change', (e) => {
    state.hookDurationSec = e.target.value === 'full' ? 'full' : 3.0;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('hook-style-select')?.addEventListener('change', (e) => {
    state.hookStyle = e.target.value;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('watermark-text-input')?.addEventListener('input', (e) => {
    if (!state.features.customWatermark) return;
    state.watermarkText = e.target.value;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('watermark-pos-select')?.addEventListener('change', (e) => {
    state.watermarkPos = e.target.value;
    renderStaticPreviewFrame(getPreviewCurrentTime());
  });

  $('watermark-file-input')?.addEventListener('change', (e) => {
    if (!state.features.customWatermark) return;
    const f = e.target.files?.[0];
    if (!f) {
      state.watermarkImage = null;
      renderStaticPreviewFrame(getPreviewCurrentTime());
      return;
    }
    const img = new Image();
    img.onload = () => {
      state.watermarkImage = img;
      renderStaticPreviewFrame(getPreviewCurrentTime());
    };
    img.src = URL.createObjectURL(f);
  });

  // Generator Deskripsi & Hashtag
  $('btn-generate-desc')?.addEventListener('click', generatePostDescriptionAndHashtags);
  $('btn-copy-desc')?.addEventListener('click', async () => {
    const val = $('generated-desc-output')?.value || '';
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      showToast('Deskripsi & hashtag disalin ke papan klip');
    } catch {
      showToast('Gagal menyalin otomatis');
    }
  });

  // Kejernihan & Volume Audio
  $('audio-volume-range')?.addEventListener('input', (e) => {
    const pct = Number(e.target.value) || 100;
    state.volumeGain = pct / 100;
    if ($('audio-volume-label')) $('audio-volume-label').textContent = `Volume: ${pct}%`;
    if (state.previewWebAudioGain && !state.isPreviewMuted) {
      state.previewWebAudioGain.gain.value = state.volumeGain;
    }
  });

  $('voice-boost-checkbox')?.addEventListener('change', (e) => {
    state.voiceBoost = e.target.checked;
  });

  $('mono-stereo-checkbox')?.addEventListener('change', (e) => {
    state.monoToStereo = e.target.checked;
  });

  $('resolution-select')?.addEventListener('change', (e) => {
    state.resolution = e.target.value;
  });

  $('btn-render-mp4')?.addEventListener('click', handleRenderMp4);
  $('btn-cancel-render')?.addEventListener('click', () => state.renderAbortController?.abort());
}

/**
 * TarifKarya Studio — Pengendali Utama Aplikasi Pembeli
 */

import {
  FREELANCE_LIBRARY_ITEMS,
  LIBRARY_CATEGORIES,
  SERVICE_PRESETS,
  WA_OBJECTION_SCENARIOS
} from './data/freelance-library.js';
import {
  exportAgreementDocx,
  exportInvoicePdf,
  exportProposalPdf,
  exportRateCardPng,
  formatRp
} from './exporter.js';

const STORAGE = {
  USER: 'tarifkarya_user_v1',
  SETTINGS: 'tarifkarya_settings_v1',
  HISTORY: 'tarifkarya_history_v1',
  FAVORITES: 'tarifkarya_favs_v1',
  THEME: 'tarifkarya_theme_v1'
};

const LICENSE_SALT = 'nifari-lic-2026::';
const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
const DEV_AGENT_HASHES = new Set([
  '5ee8688148bf8de3503f7b6dcdd097b53c93fe4287ee5b2493b8dfffd155506c',
  '51f761112cb9be11f6c61af74a127dc43626d2e498d61821d4d92ff234f5ca87',
  '50c17c0287b73ef6cc6eb0f0a2b7e5cd881782a36fdc05c99eeb716751fb1856',
  'f835737a5c7c10dcbefcae9435fb8cf081e6efc255a3258314d852cfe10d84f8',
  '94a0d4ceb3c10f084c224a8f3bf2f5726d8357ff7e72aeb515aeccb9d8007282',
  '7f143ed3c89f0cd8272c61eb19485339e3c6bd0e0a7d6fe11f560de5ee16d51e'
]);
const OFFICIAL_BUYER_HASH = 'd3e951adfa061f1bf2d2d3f40806fb7bcb10dbcf94ad8c48ac7ad87d8a7a7843';

const DEFAULT_PROJECT_TITLES = {
  'sosmed-konten': 'Pengelolaan Konten Instagram & Reels Bulanan',
  'edit-video-pendek': 'Produksi & Edit Video Pendek Reels / TikTok',
  'desain-grafis': 'Desain Identitas Logo, Kemasan & Materi Promo',
  'landing-page-web': 'Pembuatan Landing Page & Website UMKM',
  'foto-produk': 'Sesi Foto & Video Katalog Produk UMKM',
  'copywriting-artikel': 'Penulisan Copywriting Iklan, Skrip & Artikel SEO',
  'manajemen-iklan': 'Pemasangan & Optimasi Kampanye Meta / TikTok Ads',
  'admin-asisten-virtual': 'Pengelolaan Data, Rekap Laporan & Asisten Virtual'
};

function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));
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
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLen = bytes.length * 8;
  const padLen = ((bytes.length + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(padLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(padLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  for (let off = 0; off < padLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, '0')).join('');
}

function hashAccessCode(code) {
  return sha256Hex(LICENSE_SALT + String(code ?? '').trim().toUpperCase());
}

function isValidSession(user) {
  return Boolean(
    user &&
      typeof user === 'object' &&
      (user.validHash === CREATOR_MASTER_HASH || DEV_AGENT_HASHES.has(user.validHash) || user.validHash === OFFICIAL_BUYER_HASH)
  );
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadVerifiedUser() {
  const saved = readStore(STORAGE.USER, null);
  if (isValidSession(saved)) return saved;
  localStorage.removeItem(STORAGE.USER);
  return null;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayLabel() {
  const d = new Date();
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function triggerDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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

const clonePreset = (p) => JSON.parse(JSON.stringify(p));

function isDefaultProjectTitle(value) {
  const clean = String(value ?? '').trim();
  if (!clean) return true;
  if (Object.values(DEFAULT_PROJECT_TITLES).includes(clean)) return true;
  return SERVICE_PRESETS.some((s) => s.name === clean);
}

const state = {
  user: loadVerifiedUser(),
  settings: readStore(STORAGE.SETTINGS, {
    studioName: 'Karya Visual Studio',
    creatorName: 'Dimas Prakoso',
    contactPhone: '0812-XXXX-XXXX',
    bankInfo: 'BCA 8410-2291-88 a.n. Dimas Prakoso'
  }),
  history: readStore(STORAGE.HISTORY, []),
  favorites: readStore(STORAGE.FAVORITES, []),

  activeView: 'dashboard',
  wizStep: 1,
  serviceId: SERVICE_PRESETS[0].id,
  tiers: clonePreset(SERVICE_PRESETS[0].tiers),
  addons: clonePreset(SERVICE_PRESETS[0].addons),
  selectedAddonIndexes: [],
  selectedTierIdx: 1,
  hasCustomStep2Edits: false,

  clientName: 'Kopi Senja Nusantara',
  projectName: DEFAULT_PROJECT_TITLES[SERVICE_PRESETS[0].id],
  turnaround: SERVICE_PRESETS[0].defaultTurnaround,
  dpPercent: SERVICE_PRESETS[0].defaultDp,
  revisionLimit: SERVICE_PRESETS[0].defaultRevisions,
  customClause:
    'Selama tahap pratinjau, hasil kerja dikirim ber-watermark. File akhir resolusi penuh tanpa watermark diserahkan maksimal 1x24 jam setelah pelunasan 100% diterima. Permintaan di luar lingkup awal atau file mentah dikenakan biaya tambahan sesuai kartu harga.',

  hourlySafeRate: 85000,
  recommendedPopulerPrice: 1700000,

  waScenarioId: WA_OBJECTION_SCENARIOS[0].id,
  libCategory: 'Semua Kategori',
  libNiche: 'Semua',
  libQuery: '',
  modalItemId: null
};

const el = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginName: document.getElementById('login-name'),
  loginEmail: document.getElementById('login-email'),
  loginCode: document.getElementById('login-code'),
  loginError: document.getElementById('login-error'),

  appShell: document.getElementById('app-shell'),
  sidebar: document.getElementById('sidebar'),
  sidebarBackdrop: document.getElementById('sidebar-backdrop'),
  btnOpenDrawer: document.getElementById('btn-open-drawer'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnThemeMobile: document.getElementById('btn-theme-mobile'),
  btnLogout: document.getElementById('btn-logout'),

  navBtns: Array.from(document.querySelectorAll('.nav-btn')),
  dockBtns: Array.from(document.querySelectorAll('.dock-btn')),
  views: {
    dashboard: document.getElementById('view-dashboard'),
    wizard: document.getElementById('view-wizard'),
    wareply: document.getElementById('view-wareply'),
    library: document.getElementById('view-library'),
    history: document.getElementById('view-history'),
    favorites: document.getElementById('view-favorites'),
    settings: document.getElementById('view-settings')
  },

  dashGreeting: document.getElementById('dash-greeting'),
  statDocsCount: document.getElementById('stat-docs-count'),
  statHourlyRate: document.getElementById('stat-hourly-rate'),
  statLibCount: document.getElementById('stat-lib-count'),
  statFavCount: document.getElementById('stat-fav-count'),
  navLibBadge: document.getElementById('nav-lib-badge'),
  navHistBadge: document.getElementById('nav-hist-badge'),
  navFavBadge: document.getElementById('nav-fav-badge'),

  calcIncomeInput: document.getElementById('calc-income-input'),
  calcCostInput: document.getElementById('calc-cost-input'),
  calcHoursInput: document.getElementById('calc-hours-input'),
  calcRecommendedPkg: document.getElementById('calc-recommended-pkg'),
  btnApplyCalcToWizard: document.getElementById('btn-apply-calc-to-wizard'),
  dashRecentList: document.getElementById('dash-recent-list'),

  wizActiveServiceBadge: document.getElementById('wiz-active-service-badge'),
  stepPills: Array.from(document.querySelectorAll('.step-pill')),
  wizPanes: {
    1: document.getElementById('wiz-step-1'),
    2: document.getElementById('wiz-step-2'),
    3: document.getElementById('wiz-step-3')
  },
  servicePresetGrid: document.getElementById('service-preset-grid'),
  inpClientName: document.getElementById('inp-client-name'),
  inpProjectName: document.getElementById('inp-project-name'),
  inpTurnaround: document.getElementById('inp-turnaround'),
  inpDpPercent: document.getElementById('inp-dp-percent'),
  inpRevisionLimit: document.getElementById('inp-revision-limit'),
  tiersEditorContainer: document.getElementById('tiers-editor-container'),
  addonsCheckboxList: document.getElementById('addons-checkbox-list'),
  inpCustomClause: document.getElementById('inp-custom-clause'),
  livePaperPreview: document.getElementById('live-paper-preview'),

  waScenarioSelect: document.getElementById('wa-scenario-select'),
  waContextSummary: document.getElementById('wa-context-summary'),
  waOutputText: document.getElementById('wa-output-text'),
  btnCopyWaReply: document.getElementById('btn-copy-wa-reply'),

  libSearchInput: document.getElementById('lib-search-input'),
  libNicheFilter: document.getElementById('lib-niche-filter'),
  libCatStrip: document.getElementById('lib-cat-strip'),
  libResultBadge: document.getElementById('lib-result-badge'),
  libraryGrid: document.getElementById('library-grid'),
  favoritesGrid: document.getElementById('favorites-grid'),
  historyContainer: document.getElementById('history-container'),

  libModal: document.getElementById('lib-modal'),
  modalCatBadge: document.getElementById('modal-cat-badge'),
  modalNicheBadge: document.getElementById('modal-niche-badge'),
  modalTitle: document.getElementById('modal-title'),
  modalExplanation: document.getElementById('modal-explanation'),
  modalExample: document.getElementById('modal-example'),
  modalTips: document.getElementById('modal-tips'),
  modalBtnApply: document.getElementById('modal-btn-apply'),
  modalBtnFav: document.getElementById('modal-btn-fav'),
  modalBtnClose: document.getElementById('modal-btn-close'),

  setStudioName: document.getElementById('set-studio-name'),
  setCreatorName: document.getElementById('set-creator-name'),
  setPhone: document.getElementById('set-phone'),
  setBank: document.getElementById('set-bank'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnExportBackup: document.getElementById('btn-export-backup'),
  btnImportBackup: document.getElementById('btn-import-backup'),
  inpImportBackup: document.getElementById('inp-import-backup')
};

/* ================= TEMA & SESI LOGIN ================= */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE.THEME, theme);
  el.btnThemeToggle.textContent = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
}

function syncSessionUi() {
  if (isValidSession(state.user)) {
    el.loginScreen.style.display = 'none';
    el.appShell.classList.add('active');
    const greetName = state.settings.creatorName || state.user.name;
    el.dashGreeting.textContent = `Halo, ${greetName}`;
    recomputeRateCalculator();
    refreshCountersAndRecent();
  } else {
    state.user = null;
    localStorage.removeItem(STORAGE.USER);
    el.loginScreen.style.display = 'flex';
    el.appShell.classList.remove('active');
  }
}

function closeDrawer() {
  el.sidebar.classList.remove('open');
  el.sidebarBackdrop.classList.remove('open');
}

function switchView(view) {
  if (!el.views[view]) return;
  state.activeView = view;
  for (const [k, sec] of Object.entries(el.views)) {
    sec.classList.toggle('active', k === view);
  }
  for (const b of el.navBtns) {
    b.classList.toggle('active', b.dataset.view === view);
  }
  for (const db of el.dockBtns) {
    db.classList.toggle('active', db.dataset.mview === view);
  }

  if (view === 'dashboard') refreshCountersAndRecent();
  if (view === 'wizard') renderWizardAll();
  if (view === 'wareply') refreshWaReplyView();
  if (view === 'library') renderLibraryGrid();
  if (view === 'favorites') renderFavoritesGrid();
  if (view === 'history') renderHistoryList();
  if (view === 'settings') populateSettingsFields();

  closeDrawer();
  window.scrollTo(0, 0);
}

/* ================= KALKULATOR TARIF IDEAL BERANDA ================= */
function recomputeRateCalculator() {
  const rawIncome = el.calcIncomeInput.value.trim();
  const rawCost = el.calcCostInput.value.trim();
  const rawHours = el.calcHoursInput.value.trim();

  const parsedIncome =
    rawIncome !== '' && Number.isFinite(Number(rawIncome)) ? Number(rawIncome) : 8000000;
  const parsedCost =
    rawCost !== '' && Number.isFinite(Number(rawCost)) ? Number(rawCost) : 500000;
  const parsedHours =
    rawHours !== '' && Number.isFinite(Number(rawHours)) ? Number(rawHours) : 100;

  if (rawIncome !== '' && parsedIncome < 0) el.calcIncomeInput.value = '0';
  if (rawCost !== '' && parsedCost < 0) el.calcCostInput.value = '0';
  if (rawHours !== '' && parsedHours < 1) el.calcHoursInput.value = '1';

  const income = Math.max(0, parsedIncome);
  const cost = Math.max(0, parsedCost);
  const hours = Math.max(1, parsedHours);

  const hourly = Math.ceil((income + cost) / hours / 5000) * 5000;
  const populer = Math.ceil((hourly * 20) / 50000) * 50000;

  state.hourlySafeRate = hourly;
  state.recommendedPopulerPrice = populer;

  el.statHourlyRate.textContent = formatRp(hourly);
  el.calcRecommendedPkg.textContent = formatRp(populer);
}

function refreshCountersAndRecent() {
  const hLen = state.history.length;
  const fLen = state.favorites.length;
  const lLen = FREELANCE_LIBRARY_ITEMS.length;

  el.statDocsCount.textContent = String(hLen);
  el.statLibCount.textContent = String(lLen);
  el.statFavCount.textContent = String(fLen);

  el.navHistBadge.textContent = String(hLen);
  el.navFavBadge.textContent = String(fLen);
  el.navLibBadge.textContent = String(lLen);

  if (hLen === 0) {
    el.dashRecentList.innerHTML = `
      <div class="ash-card" style="padding:16px;">
        <p class="muted-copy" style="font-size:13.5px;margin-bottom:10px;">
          Belum ada dokumen klien yang diunduh. Klik tombol di bawah untuk langsung membuat Kartu Harga & Invoice pertamamu.
        </p>
        <button type="button" class="btn btn-volt btn-sm" id="btn-empty-start-wiz">
          Buka Wizard Pembuat Paket
        </button>
      </div>
    `;
    document.getElementById('btn-empty-start-wiz')?.addEventListener('click', () => switchView('wizard'));
  } else {
    el.dashRecentList.innerHTML = state.history
      .slice(0, 3)
      .map(
        (h) => `
        <div class="ash-card" style="padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div>
            <div style="font-weight:700;font-size:14px;">${esc(h.clientName)} — ${esc(h.chosenTier)}</div>
            <div class="muted-copy" style="font-size:12.5px;">${esc(h.serviceName)} · ${formatRp(h.totalPrice)}</div>
          </div>
          <span class="mono-pill">${esc(h.docType)}</span>
        </div>
      `
      )
      .join('');
  }
}

/* ================= WIZARD 3 LANGKAH ================= */
function activateWizardStepDom(step) {
  state.wizStep = step;
  for (const pill of el.stepPills) {
    pill.classList.toggle('active', Number(pill.dataset.step) === step);
  }
  for (const [k, pane] of Object.entries(el.wizPanes)) {
    pane.classList.toggle('active', Number(k) === step);
  }
  if (step === 2) {
    renderTiersEditor();
    renderAddonsList();
  }
  if (step === 3) {
    renderPaperPreview();
  }
}

function validateStep1Inputs() {
  const cName = el.inpClientName.value.trim();
  const pName = el.inpProjectName.value.trim();
  state.clientName = cName;
  state.projectName = pName;

  el.inpClientName.classList.toggle('field-invalid', !cName);
  el.inpProjectName.classList.toggle('field-invalid', !pName);

  if (!cName || !pName) {
    activateWizardStepDom(1);
    (!cName ? el.inpClientName : el.inpProjectName).focus();
    showToast('Isi dulu Nama Klien dan Nama Proyek di Langkah 1 ya.');
    return false;
  }
  return true;
}

function validateStep2SelectedTier() {
  const chosenIdx = Number.isInteger(state.selectedTierIdx) ? state.selectedTierIdx : 1;
  const chosen = state.tiers[chosenIdx];
  const validPrice = chosen && Number.isFinite(Number(chosen.price)) && Number(chosen.price) > 0;
  const nonEmptyItems = Array.isArray(chosen?.items)
    ? chosen.items.filter((x) => String(x).trim().length > 0)
    : [];
  const validItems = nonEmptyItems.length > 0;

  if (!validPrice || !validItems) {
    activateWizardStepDom(2);
    const priceInput = el.tiersEditorContainer.querySelector(`.inp-tier-price[data-tidx="${chosenIdx}"]`);
    const itemsInput = el.tiersEditorContainer.querySelector(`.inp-tier-items[data-tidx="${chosenIdx}"]`);
    if (!validPrice && priceInput) {
      priceInput.classList.add('field-invalid');
      priceInput.focus();
      showToast('Isi dulu harga paket yang dipilih (lebih dari Rp 0) di Langkah 2 ya.');
    } else if (!validItems && itemsInput) {
      itemsInput.classList.add('field-invalid');
      itemsInput.focus();
      showToast('Isi minimal 1 rincian fasilitas pada paket yang dipilih di Langkah 2 ya.');
    } else {
      showToast('Pastikan paket yang dipilih punya harga di atas Rp 0 dan rincian item ya.');
    }
    return false;
  }
  return true;
}

function switchWizardStep(step, { force = false } = {}) {
  if (!force) {
    if (step >= 2 && !validateStep1Inputs()) return false;
    if (step === 3 && !validateStep2SelectedTier()) return false;
  }
  activateWizardStepDom(step);
  return true;
}

function getActiveServiceObj() {
  return SERVICE_PRESETS.find((s) => s.id === state.serviceId) || SERVICE_PRESETS[0];
}

function selectServicePreset(presetId, { skipConfirm = false } = {}) {
  const found = SERVICE_PRESETS.find((s) => s.id === presetId);
  if (!found) return;

  if (!skipConfirm && state.hasCustomStep2Edits) {
    const ok = window.confirm(
      'Ganti bidang jasa akan memuat ulang paket harga sesuai bidang baru. Lanjutkan?'
    );
    if (!ok) return;
  }

  const shouldUpdateProjectTitle = isDefaultProjectTitle(el.inpProjectName.value);

  state.serviceId = found.id;
  state.tiers = clonePreset(found.tiers);
  state.addons = clonePreset(found.addons);
  state.selectedAddonIndexes = [];
  state.selectedTierIdx = 1;
  state.hasCustomStep2Edits = false;
  state.turnaround = found.defaultTurnaround;
  state.dpPercent = found.defaultDp;
  state.revisionLimit = found.defaultRevisions;

  if (shouldUpdateProjectTitle) {
    const nextProjectTitle = DEFAULT_PROJECT_TITLES[found.id] || found.name;
    state.projectName = nextProjectTitle;
    el.inpProjectName.value = nextProjectTitle;
    el.inpProjectName.classList.remove('field-invalid');
  }

  el.inpTurnaround.value = state.turnaround;
  el.inpDpPercent.value = String(state.dpPercent);
  el.inpRevisionLimit.value = state.revisionLimit;
  el.wizActiveServiceBadge.textContent = found.name.toUpperCase();

  renderServicePresetChips();
  renderTiersEditor();
  renderAddonsList();
  renderPaperPreview();
}

function renderServicePresetChips() {
  el.servicePresetGrid.innerHTML = SERVICE_PRESETS.map(
    (s) => `
      <button type="button" class="service-chip ${s.id === state.serviceId ? 'active' : ''}" data-sid="${esc(s.id)}">
        <span class="mono-stamp" style="display:block;margin-bottom:4px;opacity:0.75;">BIDANG JASA</span>
        <span>${esc(s.name)}</span>
      </button>
    `
  ).join('');

  for (const btn of el.servicePresetGrid.querySelectorAll('.service-chip')) {
    btn.addEventListener('click', () => selectServicePreset(btn.dataset.sid));
  }
}

function renderTiersEditor() {
  el.tiersEditorContainer.innerHTML = state.tiers
    .map((t, idx) => {
      const isSel = idx === state.selectedTierIdx;
      return `
        <div class="tier-editor-card ${isSel ? 'selected' : ''}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:10px;">
              <span class="${isSel ? 'volt-badge' : 'mono-pill'}">${esc(t.tier)}</span>
              <button type="button" class="text-link btn-pick-tier" data-tidx="${idx}" style="font-size:12px;">
                ${isSel ? 'Dipilih di Invoice' : 'Pilih Paket Ini'}
              </button>
            </div>

            <div class="field">
              <label for="inp-tier-price-${idx}">Harga Paket (Rp)</label>
              <input type="number" id="inp-tier-price-${idx}" min="0" class="inp-tier-price" data-tidx="${idx}" value="${t.price}" step="50000" />
            </div>

            <div class="field">
              <label for="inp-tier-days-${idx}">Estimasi Waktu Selesai</label>
              <input type="text" id="inp-tier-days-${idx}" class="inp-tier-days" data-tidx="${idx}" value="${esc(t.days)}" />
            </div>

            <div class="field" style="margin-bottom:0;">
              <label for="inp-tier-items-${idx}">Rincian Item (1 baris = 1 fasilitas)</label>
              <textarea id="inp-tier-items-${idx}" class="inp-tier-items" data-tidx="${idx}" rows="4">${esc((t.items || []).join('\n'))}</textarea>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  for (const b of el.tiersEditorContainer.querySelectorAll('.btn-pick-tier')) {
    b.addEventListener('click', () => {
      state.selectedTierIdx = Number(b.dataset.tidx);
      renderTiersEditor();
    });
  }

  for (const inp of el.tiersEditorContainer.querySelectorAll('.inp-tier-price')) {
    inp.addEventListener('input', () => {
      const idx = Number(inp.dataset.tidx);
      const raw = inp.value.trim();
      const parsed = raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : 0;
      if (raw !== '' && parsed < 0) inp.value = '0';
      state.tiers[idx].price = Math.max(0, parsed);
      state.hasCustomStep2Edits = true;
      if (state.tiers[idx].price > 0) inp.classList.remove('field-invalid');
    });
  }

  for (const inp of el.tiersEditorContainer.querySelectorAll('.inp-tier-days')) {
    inp.addEventListener('input', () => {
      const idx = Number(inp.dataset.tidx);
      state.tiers[idx].days = inp.value;
      state.hasCustomStep2Edits = true;
    });
  }

  for (const ta of el.tiersEditorContainer.querySelectorAll('.inp-tier-items')) {
    ta.addEventListener('input', () => {
      const idx = Number(ta.dataset.tidx);
      state.tiers[idx].items = ta.value
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      state.hasCustomStep2Edits = true;
      if (state.tiers[idx].items.length > 0) ta.classList.remove('field-invalid');
    });
  }
}

function renderAddonsList() {
  el.addonsCheckboxList.innerHTML = state.addons
    .map((ad, idx) => {
      const checked = state.selectedAddonIndexes.includes(idx) ? 'checked' : '';
      return `
        <label for="chk-addon-${idx}" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-subtle);cursor:pointer;font-size:13.5px;">
          <span style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="chk-addon-${idx}" class="chk-addon" data-aidx="${idx}" ${checked} />
            <span>${esc(ad.name)}</span>
          </span>
          <strong>${formatRp(ad.price)}</strong>
        </label>
      `;
    })
    .join('');

  for (const chk of el.addonsCheckboxList.querySelectorAll('.chk-addon')) {
    chk.addEventListener('change', () => {
      const idx = Number(chk.dataset.aidx);
      if (chk.checked) {
        if (!state.selectedAddonIndexes.includes(idx)) state.selectedAddonIndexes.push(idx);
      } else {
        state.selectedAddonIndexes = state.selectedAddonIndexes.filter((x) => x !== idx);
      }
      state.hasCustomStep2Edits = true;
    });
  }
}

function buildCurrentDocumentPayload() {
  const srv = getActiveServiceObj();
  const stampNum = String(Date.now()).slice(-5);
  const chosen = state.tiers[state.selectedTierIdx] || state.tiers[1] || state.tiers[0];
  const selectedAddons = state.selectedAddonIndexes.map((i) => state.addons[i]).filter(Boolean);
  const addonTotal = selectedAddons.reduce((sum, ad) => sum + (Number(ad.price) || 0), 0);
  const basePrice = Number(chosen?.price) || 0;
  const grandTotal = basePrice + addonTotal;
  const dpPercent = Number(state.dpPercent) || 50;
  const dpAmount = Math.round((grandTotal * dpPercent) / 100);
  const finalAmount = Math.max(0, grandTotal - dpAmount);

  return {
    studioName: state.settings.studioName || 'Karya Visual Studio',
    creatorName: state.settings.creatorName || state.user?.name || 'Penyedia Jasa',
    contactPhone: state.settings.contactPhone || '-',
    bankInfo: state.settings.bankInfo || '-',
    serviceName: srv.name,
    clientName: state.clientName.trim() || 'Calon Klien',
    projectName: state.projectName.trim() || srv.name,
    turnaround: state.turnaround || srv.defaultTurnaround,
    dpPercent,
    revisionLimit: state.revisionLimit || srv.defaultRevisions || '2x Revisi Minor',
    customClause: state.customClause,
    tiers: state.tiers,
    selectedTierIdx: state.selectedTierIdx,
    selectedAddons,
    addonTotal,
    grandTotal,
    dpAmount,
    finalAmount,
    dateLabel: todayLabel(),
    docNumber: `TK-PROP/${new Date().getFullYear()}/${stampNum}`,
    invoiceNumber: `INV/${new Date().getFullYear()}/${stampNum}`
  };
}

function renderPaperPreview() {
  const d = buildCurrentDocumentPayload();
  const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];

  const addonRowsHtml =
    d.selectedAddons.length > 0
      ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12.5px;color:#3a3636;">
        <span>Harga Paket Utama (${esc(chosen.tier)}):</span>
        <span>${formatRp(chosen.price)}</span>
      </div>
      ${d.selectedAddons
        .map(
          (ad) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12.5px;color:#3a3636;">
          <span>+ Add-On: ${esc(ad.name)}</span>
          <span>${formatRp(ad.price)}</span>
        </div>
      `
        )
        .join('')}
      <div style="border-top:1px dashed #b8b8b8;margin:6px 0;"></div>
    `
      : '';

  el.livePaperPreview.innerHTML = `
    <div class="paper-head">
      <div>
        <span class="volt-badge sharp" style="margin-bottom:6px;">PRATINJAU RESMI DOKUMEN KLIEN</span>
        <div style="font-size:20px;font-weight:700;">${esc(d.studioName)}</div>
        <div style="font-size:12.5px;color:#b8b8b8;">${esc(d.creatorName)} · WA: ${esc(d.contactPhone)}</div>
      </div>
      <div style="text-align:right;font-family:var(--font-mono);font-size:11px;">
        <div>NO: ${esc(d.invoiceNumber)}</div>
        <div style="color:#a1ff62;margin-top:4px;">TGL: ${esc(d.dateLabel)}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-bottom:12px;border-bottom:1px solid #d2d2d2;margin-bottom:14px;font-size:13.5px;">
      <div>
        <span class="mono-stamp" style="color:#7a7a7a;">KEPADA KLIEN:</span>
        <div style="font-weight:700;font-size:15px;">${esc(d.clientName)}</div>
        <div>Proyek: ${esc(d.projectName)}</div>
      </div>
      <div>
        <span class="mono-stamp" style="color:#7a7a7a;">KETENTUAN INTI:</span>
        <div>Durasi: <strong>${esc(d.turnaround)}</strong></div>
        <div>Revisi: <strong>${esc(d.revisionLimit)}</strong></div>
      </div>
    </div>

    <div class="mono-stamp" style="margin-bottom:8px;">PERBANDINGAN 3 PAKET RATE CARD:</div>
    ${d.tiers
      .map(
        (t, idx) => `
      <div class="paper-tier-row ${idx === d.selectedTierIdx ? 'active' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <strong>${esc(t.tier)} ${idx === d.selectedTierIdx ? '— [DIPILIH DI INVOICE]' : ''}</strong>
          <strong style="color:${idx === d.selectedTierIdx ? '#a1ff62' : '#151313'};">${formatRp(t.price)}</strong>
        </div>
        <div style="font-size:12.5px;opacity:0.85;margin-top:4px;">
          ${(t.items || []).map((it) => `• ${esc(it)}`).join(' &nbsp; ')}
        </div>
      </div>
    `
      )
      .join('')}

    <div style="background:#eaeaea;border:1px solid #201d1d;border-radius:2px;padding:12px 14px;margin-top:14px;font-size:13.5px;">
      ${addonRowsHtml}
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>Total Nilai Proyek ${d.addonTotal > 0 ? '(Paket + Add-On)' : 'Terpilih'}:</span>
        <strong>${formatRp(d.grandTotal)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>Tagihan Awal (DP ${d.dpPercent}% Pengunci Jadwal):</span>
        <strong>${formatRp(d.dpAmount)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Sisa Pelunasan Sebelum File Final (${100 - d.dpPercent}%):</span>
        <strong>${formatRp(d.finalAmount)}</strong>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #b8b8b8;font-family:var(--font-mono);font-size:11.5px;">
        REKENING RESMI: ${esc(d.bankInfo)}
      </div>
    </div>
  `;
}

function renderWizardAll() {
  el.wizActiveServiceBadge.textContent = getActiveServiceObj().name.toUpperCase();
  renderServicePresetChips();
  renderTiersEditor();
  renderAddonsList();
  renderPaperPreview();
}

function recordDocumentHistory(docTypeLabel) {
  const d = buildCurrentDocumentPayload();
  const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];

  const entry = {
    id: `doc-${Date.now()}`,
    clientName: d.clientName,
    projectName: d.projectName,
    serviceId: state.serviceId,
    serviceName: d.serviceName,
    chosenTier: chosen.tier,
    totalPrice: d.grandTotal,
    docType: docTypeLabel,
    dateLabel: d.dateLabel,
    snapshot: {
      serviceId: state.serviceId,
      clientName: state.clientName,
      projectName: state.projectName,
      turnaround: state.turnaround,
      dpPercent: state.dpPercent,
      revisionLimit: state.revisionLimit,
      customClause: state.customClause,
      tiers: clonePreset(state.tiers),
      addons: clonePreset(state.addons),
      selectedTierIdx: state.selectedTierIdx,
      selectedAddonIndexes: [...state.selectedAddonIndexes]
    }
  };

  // Perbarui arsip jika klien, proyek, paket & jenis dokumen sama persis
  const dupIdx = state.history.findIndex(
    (x) =>
      x.clientName === entry.clientName &&
      x.projectName === entry.projectName &&
      x.chosenTier === entry.chosenTier &&
      x.docType === entry.docType
  );
  if (dupIdx >= 0) {
    state.history.splice(dupIdx, 1);
  }
  state.history.unshift(entry);
  writeStore(STORAGE.HISTORY, state.history);
  refreshCountersAndRecent();
}

function restoreHistoryEntry(h) {
  if (h.snapshot && Array.isArray(h.snapshot.tiers)) {
    const snap = h.snapshot;
    const srv = SERVICE_PRESETS.find((s) => s.id === snap.serviceId) || SERVICE_PRESETS[0];
    state.serviceId = srv.id;
    state.tiers = clonePreset(snap.tiers);
    state.addons = Array.isArray(snap.addons) ? clonePreset(snap.addons) : clonePreset(srv.addons);
    state.selectedTierIdx = Number.isInteger(snap.selectedTierIdx) ? snap.selectedTierIdx : 1;
    state.selectedAddonIndexes = Array.isArray(snap.selectedAddonIndexes)
      ? [...snap.selectedAddonIndexes]
      : [];
    state.clientName = snap.clientName || h.clientName || '';
    state.projectName = snap.projectName || h.projectName || '';
    state.turnaround = snap.turnaround || srv.defaultTurnaround;
    state.dpPercent = Number(snap.dpPercent) || srv.defaultDp || 50;
    state.revisionLimit = snap.revisionLimit || srv.defaultRevisions;
    state.customClause = typeof snap.customClause === 'string' ? snap.customClause : state.customClause;
    state.hasCustomStep2Edits = true;

    el.inpClientName.value = state.clientName;
    el.inpProjectName.value = state.projectName;
    el.inpTurnaround.value = state.turnaround;
    el.inpDpPercent.value = String(state.dpPercent);
    el.inpRevisionLimit.value = state.revisionLimit;
    el.inpCustomClause.value = state.customClause;
    el.inpClientName.classList.remove('field-invalid');
    el.inpProjectName.classList.remove('field-invalid');
  } else {
    selectServicePreset(h.serviceId, { skipConfirm: true });
    state.clientName = h.clientName || '';
    state.projectName = h.projectName || '';
    el.inpClientName.value = state.clientName;
    el.inpProjectName.value = state.projectName;
  }

  switchView('wizard');
  switchWizardStep(3, { force: true });
  showToast('Seluruh rincian paket & harga klien dimuat kembali ke Wizard!');
}

/* ================= PENANGKIS NAWAR WA ================= */
function refreshWaReplyView() {
  const d = buildCurrentDocumentPayload();
  const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];
  const scenario =
    WA_OBJECTION_SCENARIOS.find((s) => s.id === state.waScenarioId) || WA_OBJECTION_SCENARIOS[0];
  const addonLabel =
    d.selectedAddons.length > 0 ? ` + ${d.selectedAddons.map((a) => a.name).join(', ')}` : '';
  const pkgFullLabel = `${chosen.tier}${addonLabel}`;

  el.waContextSummary.textContent = `${d.studioName} · Klien: ${d.clientName} · ${pkgFullLabel} (${formatRp(d.grandTotal)}) · DP ${d.dpPercent}% (${formatRp(d.dpAmount)})`;
  el.waOutputText.value = scenario.buildReply({
    studio: d.studioName,
    client: d.clientName,
    pkgName: `${pkgFullLabel} (${d.serviceName})`,
    priceRp: formatRp(d.grandTotal),
    dpPct: d.dpPercent,
    bankInfo: d.bankInfo
  });
}

/* ================= PUSTAKA 120 KOLEKSI ================= */
function initLibraryFilters() {
  const niches = ['Semua', ...new Set(FREELANCE_LIBRARY_ITEMS.map((i) => i.niche))];
  el.libNicheFilter.innerHTML = niches
    .map((n) => `<option value="${esc(n)}">${n === 'Semua' ? 'Semua Bidang Jasa' : esc(n)}</option>`)
    .join('');

  el.waScenarioSelect.innerHTML = WA_OBJECTION_SCENARIOS.map(
    (s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`
  ).join('');

  renderCategoryChips();
  renderLibraryGrid();
}

function renderCategoryChips() {
  el.libCatStrip.innerHTML = LIBRARY_CATEGORIES.map(
    (c) => `
      <button type="button" class="cat-chip ${c === state.libCategory ? 'active' : ''}" data-cat="${esc(c)}">
        ${esc(c)}
      </button>
    `
  ).join('');

  for (const btn of el.libCatStrip.querySelectorAll('.cat-chip')) {
    btn.addEventListener('click', () => {
      state.libCategory = btn.dataset.cat;
      renderCategoryChips();
      renderLibraryGrid();
    });
  }
}

function getFilteredLibrary() {
  const q = state.libQuery.trim().toLowerCase();
  return FREELANCE_LIBRARY_ITEMS.filter((it) => {
    if (state.libCategory !== 'Semua Kategori' && it.category !== state.libCategory) return false;
    if (state.libNiche !== 'Semua' && it.niche !== state.libNiche) return false;
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      it.summary.toLowerCase().includes(q) ||
      it.example.toLowerCase().includes(q) ||
      it.niche.toLowerCase().includes(q)
    );
  });
}

function buildLibCardHtml(item, { showRemoveFav = false } = {}) {
  const fav = state.favorites.includes(item.id);
  return `
    <article class="lib-tile">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:10px;">
          <span class="mono-pill" style="white-space:nowrap;">${esc(item.category)}</span>
          <span class="mono-stamp" style="color:var(--text-muted);white-space:nowrap;flex-shrink:0;">${esc(item.niche)}</span>
        </div>
        <h3 class="card-title" style="font-size:16.5px;margin-bottom:6px;">${esc(item.title)}</h3>
        <p class="muted-copy" style="font-size:13.5px;">${esc(item.summary)}</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--border-subtle);">
        <span class="mono-stamp" style="color:var(--text-muted);">${fav ? 'FAVORIT TERSIMPAN' : 'SIAP PAKAI'}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          ${
            showRemoveFav
              ? `<button type="button" class="btn btn-ghost btn-sm btn-remove-fav" data-id="${esc(item.id)}" style="padding:4px 8px;font-size:11.5px;">Hapus</button>`
              : ''
          }
          <button type="button" class="text-link btn-lib-detail" data-id="${esc(item.id)}">Lihat Detail</button>
        </div>
      </div>
    </article>
  `;
}

function bindLibDetailTriggers(container) {
  for (const b of container.querySelectorAll('.btn-lib-detail')) {
    b.addEventListener('click', () => openLibModal(b.dataset.id));
  }
  for (const rm of container.querySelectorAll('.btn-remove-fav')) {
    rm.addEventListener('click', () => {
      const targetId = rm.dataset.id;
      state.favorites = state.favorites.filter((fid) => fid !== targetId);
      writeStore(STORAGE.FAVORITES, state.favorites);
      refreshCountersAndRecent();
      if (state.activeView === 'favorites') renderFavoritesGrid();
      if (state.activeView === 'library') renderLibraryGrid();
      showToast('Dihapus dari Koleksi Favorit.');
    });
  }
}

function renderLibraryGrid() {
  const list = getFilteredLibrary();
  el.libResultBadge.textContent = `${list.length} KOLEKSI`;
  if (list.length === 0) {
    el.libraryGrid.innerHTML = `<div class="tile-card" style="grid-column:1/-1;"><p class="muted-copy">Tidak ada item yang cocok. Coba pilih Semua Kategori.</p></div>`;
    return;
  }
  el.libraryGrid.innerHTML = list.map((item) => buildLibCardHtml(item)).join('');
  bindLibDetailTriggers(el.libraryGrid);
}

function renderFavoritesGrid() {
  const list = FREELANCE_LIBRARY_ITEMS.filter((i) => state.favorites.includes(i.id));
  if (list.length === 0) {
    el.favoritesGrid.innerHTML = `
      <div class="tile-card" style="grid-column:1/-1;">
        <p class="muted-copy" style="margin-bottom:12px;">Belum ada skrip atau klausul yang disimpan ke Favorit.</p>
        <button type="button" class="btn btn-volt btn-sm" id="btn-fav-open-lib">Jelajahi 120 Pustaka Jasa</button>
      </div>
    `;
    document.getElementById('btn-fav-open-lib')?.addEventListener('click', () => switchView('library'));
    return;
  }
  el.favoritesGrid.innerHTML = list.map((item) => buildLibCardHtml(item, { showRemoveFav: true })).join('');
  bindLibDetailTriggers(el.favoritesGrid);
}

function openLibModal(id) {
  const item = FREELANCE_LIBRARY_ITEMS.find((x) => x.id === id);
  if (!item) return;
  state.modalItemId = item.id;
  el.modalCatBadge.textContent = item.category;
  el.modalNicheBadge.textContent = item.niche;
  el.modalTitle.textContent = item.title;
  el.modalExplanation.textContent = item.explanation;
  el.modalExample.textContent = item.example;
  el.modalTips.textContent = item.tips;

  const isFav = state.favorites.includes(item.id);
  el.modalBtnFav.textContent = isFav ? 'Hapus dari Favorit' : 'Simpan Favorit';
  el.modalBtnApply.textContent =
    item.category === 'Klausul Anti-Revisi Bocor'
      ? 'Pasang ke Klausul Wizard & Salin'
      : 'Salin Kalimat Siap Pakai';
  el.libModal.classList.add('open');
}

function closeLibModal() {
  el.libModal.classList.remove('open');
  state.modalItemId = null;
}

/* ================= RIWAYAT & PENGATURAN ================= */
function renderHistoryList() {
  if (state.history.length === 0) {
    el.historyContainer.innerHTML = `
      <div class="tile-card">
        <p class="muted-copy" style="margin-bottom:12px;">Belum ada arsip dokumen yang diunduh pada perangkat ini.</p>
        <button type="button" class="btn btn-volt btn-sm" id="btn-hist-open-wiz">Mulai Buat Dokumen Pertama</button>
      </div>
    `;
    document.getElementById('btn-hist-open-wiz')?.addEventListener('click', () => switchView('wizard'));
    return;
  }

  el.historyContainer.innerHTML = state.history
    .map(
      (h) => `
      <div class="tile-card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <span class="volt-badge sharp" style="margin-bottom:6px;">${esc(h.docType)}</span>
          <h3 class="card-title" style="font-size:17px;">${esc(h.clientName)} — ${esc(h.projectName)}</h3>
          <p class="muted-copy" style="font-size:13px;margin-top:3px;">
            ${esc(h.serviceName)} · ${esc(h.chosenTier)} (${formatRp(h.totalPrice)}) · Tanggal ${esc(h.dateLabel)}
          </p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost btn-sm btn-reopen-hist" data-id="${esc(h.id)}">
            Buka di Wizard
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-del-hist" data-id="${esc(h.id)}">
            Hapus
          </button>
        </div>
      </div>
    `
    )
    .join('');

  for (const b of el.historyContainer.querySelectorAll('.btn-reopen-hist')) {
    b.addEventListener('click', () => {
      const h = state.history.find((x) => x.id === b.dataset.id);
      if (!h) return;
      restoreHistoryEntry(h);
    });
  }

  for (const dBtn of el.historyContainer.querySelectorAll('.btn-del-hist')) {
    dBtn.addEventListener('click', () => {
      const h = state.history.find((x) => x.id === dBtn.dataset.id);
      if (!h) return;
      if (!window.confirm(`Hapus arsip "${h.clientName} — ${h.docType}" dari riwayat?`)) return;
      state.history = state.history.filter((x) => x.id !== h.id);
      writeStore(STORAGE.HISTORY, state.history);
      renderHistoryList();
      refreshCountersAndRecent();
      showToast('Arsip dokumen dihapus dari riwayat.');
    });
  }
}

function populateSettingsFields() {
  el.setStudioName.value = state.settings.studioName || '';
  el.setCreatorName.value = state.settings.creatorName || '';
  el.setPhone.value = state.settings.contactPhone || '';
  el.setBank.value = state.settings.bankInfo || '';
}

function syncInitialFormValues() {
  el.inpClientName.value = state.clientName;
  el.inpProjectName.value = state.projectName;
  el.inpTurnaround.value = state.turnaround;
  el.inpDpPercent.value = String(state.dpPercent);
  el.inpRevisionLimit.value = state.revisionLimit;
  el.inpCustomClause.value = state.customClause;
  recomputeRateCalculator();
}

/* ================= BINDING EVENT LENGKAP ================= */
function bindAllEvents() {
  el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = el.loginName.value.trim();
    const rawEmail = el.loginEmail.value.trim();
    const rawCode = el.loginCode.value.trim().toUpperCase();
    const digest = rawCode ? hashAccessCode(rawCode) : '';
    const isDevAgent = DEV_AGENT_HASHES.has(digest);
    const isCreator = digest === CREATOR_MASTER_HASH || isDevAgent;

    if (!isCreator) {
      if (!rawName) {
        el.loginError.textContent = 'Isi dulu nama usaha atau nama penyedia jasamu ya.';
        el.loginError.style.display = 'block';
        el.loginName.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        el.loginError.textContent = 'Masukkan alamat email yang benar (contoh: nama@email.com).';
        el.loginError.style.display = 'block';
        el.loginEmail.focus();
        return;
      }
      if (digest !== OFFICIAL_BUYER_HASH) {
        el.loginError.textContent =
          'Kode akses tidak sesuai. Pastikan kamu memasukkan kode resmi dari bukti pembelian ya.';
        el.loginError.style.display = 'block';
        el.loginCode.focus();
        return;
      }
    }

    const finalName = rawName || (isDevAgent ? 'Tim Developer — Studio Uji' : 'Nifari — Studio Kreator');
    const finalEmail = rawEmail || (isDevAgent ? 'dev@tarifkarya.id' : 'creator@nifari.id');

    el.loginError.style.display = 'none';
    el.loginCode.value = '';

    state.user = {
      name: finalName,
      email: finalEmail,
      validHash: digest,
      role: isCreator ? 'creator' : 'buyer'
    };
    writeStore(STORAGE.USER, state.user);

    const parts = finalName.split(/[—–-]/).map((s) => s.trim()).filter(Boolean);
    state.settings.creatorName = parts[0] || finalName;
    state.settings.studioName = parts[1] || `${parts[0] || 'Karya'} Studio`;
    if (!state.settings.bankInfo || state.settings.bankInfo.includes('Dimas Prakoso')) {
      state.settings.bankInfo = `BCA 8410-2291-88 a.n. ${state.settings.creatorName}`;
    }
    writeStore(STORAGE.SETTINGS, state.settings);
    populateSettingsFields();

    syncSessionUi();
    showToast('Selamat datang di TarifKarya Studio!');
  });

  el.btnLogout.addEventListener('click', () => {
    localStorage.removeItem(STORAGE.USER);
    state.user = null;
    syncSessionUi();
  });

  const toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };
  el.btnThemeToggle.addEventListener('click', toggleTheme);
  el.btnThemeMobile.addEventListener('click', toggleTheme);

  el.btnOpenDrawer.addEventListener('click', () => {
    el.sidebar.classList.add('open');
    el.sidebarBackdrop.classList.add('open');
  });
  el.btnCloseDrawer?.addEventListener('click', closeDrawer);
  el.sidebarBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.libModal.classList.contains('open')) closeLibModal();
      if (el.sidebar.classList.contains('open')) closeDrawer();
    }
  });

  for (const b of el.navBtns) {
    b.addEventListener('click', () => switchView(b.dataset.view));
  }
  for (const db of el.dockBtns) {
    db.addEventListener('click', () => switchView(db.dataset.mview));
  }

  document.getElementById('dash-btn-start-wizard').addEventListener('click', () => switchView('wizard'));
  document.getElementById('dash-btn-open-wareply').addEventListener('click', () => switchView('wareply'));
  document.getElementById('dash-see-history').addEventListener('click', () => switchView('history'));

  // Kalkulator Anti Harga Teman
  for (const inp of [el.calcIncomeInput, el.calcCostInput, el.calcHoursInput]) {
    inp.addEventListener('input', recomputeRateCalculator);
  }
  el.btnApplyCalcToWizard.addEventListener('click', () => {
    const pop = state.recommendedPopulerPrice;
    state.tiers[0].price = Math.round((pop * 0.58) / 25000) * 25000;
    state.tiers[1].price = pop;
    state.tiers[2].price = Math.round((pop * 1.72) / 50000) * 50000;
    state.hasCustomStep2Edits = true;
    switchView('wizard');
    switchWizardStep(2);
    showToast('Patokan harga aman berhasil diterapkan ke 3 Paket Wizard!');
  });

  // Navigasi Wizard
  for (const pill of el.stepPills) {
    pill.addEventListener('click', () => switchWizardStep(Number(pill.dataset.step)));
  }
  document.getElementById('btn-to-step-2').addEventListener('click', () => switchWizardStep(2));
  document.getElementById('btn-back-step-1').addEventListener('click', () => switchWizardStep(1, { force: true }));
  document.getElementById('btn-to-step-3').addEventListener('click', () => switchWizardStep(3));
  document.getElementById('btn-back-step-2').addEventListener('click', () => switchWizardStep(2));

  el.inpClientName.addEventListener('input', () => {
    state.clientName = el.inpClientName.value;
    if (el.inpClientName.value.trim()) el.inpClientName.classList.remove('field-invalid');
  });
  el.inpProjectName.addEventListener('input', () => {
    state.projectName = el.inpProjectName.value;
    if (el.inpProjectName.value.trim()) el.inpProjectName.classList.remove('field-invalid');
  });
  el.inpTurnaround.addEventListener('input', () => {
    state.turnaround = el.inpTurnaround.value;
  });
  el.inpDpPercent.addEventListener('change', () => {
    state.dpPercent = Number(el.inpDpPercent.value) || 50;
  });
  el.inpRevisionLimit.addEventListener('input', () => {
    state.revisionLimit = el.inpRevisionLimit.value;
  });
  el.inpCustomClause.addEventListener('input', () => {
    state.customClause = el.inpCustomClause.value;
    state.hasCustomStep2Edits = true;
  });

  document.getElementById('btn-pick-clause-lib').addEventListener('click', () => {
    state.libCategory = 'Klausul Anti-Revisi Bocor';
    renderCategoryChips();
    switchView('library');
  });

  // 4 Tombol Ekspor File Asli
  document.getElementById('btn-dl-ratecard-png').addEventListener('click', async () => {
    if (!validateStep1Inputs() || !validateStep2SelectedTier()) return;
    const d = buildCurrentDocumentPayload();
    const blob = await exportRateCardPng(d);
    triggerDownloadBlob(blob, `RateCard-${d.studioName.replace(/\s+/g, '-')}.png`);
    recordDocumentHistory('RATE CARD .PNG');
    showToast('Gambar Rate Card 3 Paket (.PNG) berhasil diunduh!');
  });

  document.getElementById('btn-dl-proposal-pdf').addEventListener('click', () => {
    if (!validateStep1Inputs() || !validateStep2SelectedTier()) return;
    const d = buildCurrentDocumentPayload();
    const blob = exportProposalPdf(d);
    triggerDownloadBlob(blob, `Proposal-${d.clientName.replace(/\s+/g, '-')}.pdf`);
    recordDocumentHistory('PROPOSAL .PDF');
    showToast('Proposal Penawaran Resmi (.PDF) berhasil diunduh!');
  });

  document.getElementById('btn-dl-invoice-pdf').addEventListener('click', () => {
    if (!validateStep1Inputs() || !validateStep2SelectedTier()) return;
    const d = buildCurrentDocumentPayload();
    const blob = exportInvoicePdf(d);
    triggerDownloadBlob(blob, `Invoice-${d.clientName.replace(/\s+/g, '-')}.pdf`);
    recordDocumentHistory('INVOICE .PDF');
    showToast('Invoice Tagihan Resmi (.PDF) berhasil diunduh!');
  });

  document.getElementById('btn-dl-spk-docx').addEventListener('click', () => {
    if (!validateStep1Inputs() || !validateStep2SelectedTier()) return;
    const d = buildCurrentDocumentPayload();
    const blob = exportAgreementDocx(d);
    triggerDownloadBlob(blob, `Kesepakatan-Kerja-${d.clientName.replace(/\s+/g, '-')}.docx`);
    recordDocumentHistory('KESEPAKATAN .DOCX');
    showToast('Surat Kesepakatan Kerja (.DOCX) berhasil diunduh!');
  });

  document.getElementById('btn-copy-ai-prompt').addEventListener('click', async () => {
    const d = buildCurrentDocumentPayload();
    const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];
    const addonNote =
      d.selectedAddons.length > 0
        ? ` ditambah add-on (${d.selectedAddons.map((a) => a.name).join(', ')})`
        : '';
    const prompt = `Saya dari ${d.studioName} akan mengirimkan proposal jasa "${d.serviceName}" (${chosen.tier}${addonNote}, total nilai proyek ${formatRp(d.grandTotal)}, DP ${d.dpPercent}% sebesar ${formatRp(d.dpAmount)}) kepada calon klien bernama "${d.clientName}" untuk kebutuhan "${d.projectName}". Buatkan 3 poin pengantar singkat dalam bahasa Indonesia sehari-hari yang sopan, meyakinkan, dan menjelaskan mengapa paket ini menghemat waktu serta menguntungkan bisnis mereka dibanding mengerjakan sendiri.`;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {}
    showToast('Prompt AI khusus klien ini berhasil disalin!');
  });

  // Penangkis WA
  el.waScenarioSelect.addEventListener('change', () => {
    state.waScenarioId = el.waScenarioSelect.value;
    refreshWaReplyView();
  });
  el.btnCopyWaReply.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(el.waOutputText.value);
    } catch {}
    showToast('Balasan WhatsApp berhasil disalin!');
  });

  // Pustaka & Modal
  el.libSearchInput.addEventListener('input', () => {
    state.libQuery = el.libSearchInput.value;
    renderLibraryGrid();
  });
  el.libNicheFilter.addEventListener('change', () => {
    state.libNiche = el.libNicheFilter.value;
    renderLibraryGrid();
  });

  el.modalBtnClose.addEventListener('click', closeLibModal);
  el.libModal.addEventListener('click', (e) => {
    if (e.target === el.libModal) closeLibModal();
  });

  el.modalBtnFav.addEventListener('click', () => {
    if (!state.modalItemId) return;
    const idx = state.favorites.indexOf(state.modalItemId);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      showToast('Dihapus dari Favorit.');
    } else {
      state.favorites.push(state.modalItemId);
      showToast('Disimpan ke Koleksi Favorit!');
    }
    writeStore(STORAGE.FAVORITES, state.favorites);
    el.modalBtnFav.textContent = state.favorites.includes(state.modalItemId)
      ? 'Hapus dari Favorit'
      : 'Simpan Favorit';
    refreshCountersAndRecent();
    if (state.activeView === 'library') renderLibraryGrid();
    if (state.activeView === 'favorites') renderFavoritesGrid();
  });

  el.modalBtnApply.addEventListener('click', async () => {
    const item = FREELANCE_LIBRARY_ITEMS.find((x) => x.id === state.modalItemId);
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.example);
    } catch {}
    if (item.category === 'Klausul Anti-Revisi Bocor') {
      state.customClause = item.example;
      state.hasCustomStep2Edits = true;
      el.inpCustomClause.value = item.example;
      closeLibModal();
      switchView('wizard');
      switchWizardStep(2, { force: true });
      showToast('Klausul dipasang ke Wizard & disalin!');
    } else {
      closeLibModal();
      showToast('Contoh teks berhasil disalin ke papan klip!');
    }
  });

  // Riwayat & Pengaturan
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    if (state.history.length === 0) {
      showToast('Riwayat dokumen sudah kosong.');
      return;
    }
    if (!window.confirm('Bersihkan seluruh riwayat dokumen klien di perangkat ini?')) return;
    state.history = [];
    writeStore(STORAGE.HISTORY, state.history);
    renderHistoryList();
    refreshCountersAndRecent();
    showToast('Riwayat dokumen dibersihkan.');
  });

  el.btnSaveSettings.addEventListener('click', () => {
    state.settings = {
      studioName: el.setStudioName.value.trim() || 'Karya Visual Studio',
      creatorName: el.setCreatorName.value.trim() || 'Penyedia Jasa',
      contactPhone: el.setPhone.value.trim() || '-',
      bankInfo: el.setBank.value.trim() || '-'
    };
    writeStore(STORAGE.SETTINGS, state.settings);
    syncSessionUi();
    showToast('Identitas kop usaha & rekening berhasil disimpan!');
  });

  el.btnExportBackup.addEventListener('click', () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            settings: state.settings,
            favorites: state.favorites,
            history: state.history
          },
          null,
          2
        )
      ],
      { type: 'application/json' }
    );
    triggerDownloadBlob(blob, `cadangan-tarifkarya-${Date.now()}.json`);
    showToast('File cadangan .JSON berhasil diunduh!');
  });

  el.btnImportBackup.addEventListener('click', () => el.inpImportBackup.click());
  el.inpImportBackup.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!isValidSession(state.user)) {
      showToast('Masuk dulu dengan kode akses resmi sebelum memulihkan cadangan.');
      return;
    }
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed.settings && typeof parsed.settings === 'object') {
        state.settings = {
          studioName: String(parsed.settings.studioName || state.settings.studioName || 'Karya Visual Studio'),
          creatorName: String(parsed.settings.creatorName || state.settings.creatorName || 'Penyedia Jasa'),
          contactPhone: String(parsed.settings.contactPhone || state.settings.contactPhone || '-'),
          bankInfo: String(parsed.settings.bankInfo || state.settings.bankInfo || '-')
        };
        writeStore(STORAGE.SETTINGS, state.settings);
      }
      if (Array.isArray(parsed.favorites)) {
        state.favorites = parsed.favorites;
        writeStore(STORAGE.FAVORITES, state.favorites);
      }
      if (Array.isArray(parsed.history)) {
        state.history = parsed.history;
        writeStore(STORAGE.HISTORY, state.history);
      }
      populateSettingsFields();
      syncSessionUi();
      showToast('Data cadangan berhasil dipulihkan!');
    } catch {
      showToast('Format file cadangan .JSON tidak valid.');
    }
  });
}

applyTheme(localStorage.getItem(STORAGE.THEME) || 'light');
syncInitialFormValues();
initLibraryFilters();
renderWizardAll();
bindAllEvents();
syncSessionUi();

// Ekspor helper ke window khusus verifikasi otomatis headless browser bila diperlukan
window.__tarifKaryaDebug = {
  exportRateCardPng,
  exportProposalPdf,
  exportInvoicePdf,
  exportAgreementDocx,
  buildCurrentDocumentPayload
};

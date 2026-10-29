/**
 * RancangRAB Studio — Pengendali Utama Aplikasi Kontraktor & Pemborong
 */

import { AHSP_CATEGORIES, AHSP_LIBRARY_ITEMS } from './data/ahsp-library.js';
import {
  PROJECT_PRESETS,
  ZONA_WILAYAH,
  calculateMaterialShoppingList,
  calculateRabSummary,
  formatRupiah,
  formatTanggalIndo,
  generateRabPdfBlob,
  generateRabXlsxBlob,
  generateSpkDocxBlob,
  parseMasaGaransi
} from './data/rab-engine.js';

const KEYS = {
  USER: 'rancangrab_user_v1',
  SETTINGS: 'rancangrab_settings_v1',
  HISTORY: 'rancangrab_history_v1',
  FAVORITES: 'rancangrab_favs_v1',
  THEME: 'rancangrab_theme_v1'
};

// Validasi Kode Akses SHA-256 Tersinkron (murni JS tanpa teks kode terbuka)
const LICENSE_SALT = 'nifari-lic-2026::';
const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
const BUYER_VALID_HASHES = new Set([
  '87037471c7d7f51d8697e9d9969d08349b3484296c898fcb12a5a133bb8f35f6',
  'b780853b63d89442070cdef038837e34fc3d62a80a045831a67819a870b83085'
]);

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotr32(n, x) {
  return (x >>> n) | (x << (32 - n));
}

function sha256Hex(asciiText) {
  const bytes = new TextEncoder().encode(asciiText);
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 9 + 63) >> 6) << 6);
  const buf = new Uint8Array(totalLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr32(7, w[i - 15]) ^ rotr32(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr32(17, w[i - 2]) ^ rotr32(19, w[i - 2]) ^ (w[i - 2] >>> 10);
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

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr32(6, e) ^ rotr32(11, e) ^ rotr32(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr32(2, a) ^ rotr32(13, a) ^ rotr32(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
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

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function hashAccessCode(rawCode) {
  const normalized = String(rawCode ?? '').trim().toUpperCase();
  if (!normalized) return '';
  return sha256Hex(LICENSE_SALT + normalized);
}

function isValidLicenseHash(h) {
  return Boolean(h) && (h === CREATOR_MASTER_HASH || BUYER_VALID_HASHES.has(h));
}

function parseLoginIdentity(rawName) {
  const clean = String(rawName || '').trim();
  if (!clean) return { pelaksana: '', usaha: '' };
  const parts = clean
    .split(/\s*(?:—|–|\s-\s|\|)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    pelaksana: parts[0] || clean,
    usaha: parts.slice(1).join(' — ')
  };
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInitials(name) {
  const words = String(name || 'PK')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(bapak|ibu|pak|bu|cv|pt|ud)$/i.test(w));
  if (words.length === 0) return 'PR';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const DEFAULT_SETTINGS = {
  namaUsaha: '',
  namaPelaksana: '',
  teleponUsaha: '',
  kota: 'Indonesia',
  rekeningPembayaran: ''
};

const state = {
  user: loadJson(KEYS.USER, null),
  settings: loadJson(KEYS.SETTINGS, { ...DEFAULT_SETTINGS }),
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),
  selectedPresetId: 'bangun-rumah-1lt',
  activeRows: [],
  activeProjectId: null,
  activeLibCategory: 'SEMUA',
  activeModalItem: null,
  appliedZonaFactor: 1.0,
  appliedLuas: 36,
  rowsManuallyEdited: false,
  currentView: 'dashboard'
};

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    t.style.display = 'none';
  }, 2800);
}

// TEMA GELAP / TERANG
function initTheme() {
  const saved = localStorage.getItem(KEYS.THEME) || 'dark';
  applyTheme(saved);
  const toggle = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };
  document.getElementById('btn-theme-toggle').addEventListener('click', toggle);
  document.getElementById('btn-theme-mobile').addEventListener('click', toggle);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEYS.THEME, theme);
  document.getElementById('btn-theme-toggle').textContent =
    theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
}

// LOGIN PEMBELI & VALIDASI KODE AKSES SHA-256
function initAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const nameInp = document.getElementById('login-name');
  const emailInp = document.getElementById('login-email');
  const codeInp = document.getElementById('login-code');

  const showLoginError = (msg, focusEl) => {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    if (focusEl) {
      focusEl.classList.add('input-error');
      focusEl.focus();
    }
  };

  for (const inp of [nameInp, emailInp, codeInp]) {
    inp.addEventListener('input', () => {
      inp.classList.remove('input-error');
      if (errEl.style.display !== 'none') errEl.style.display = 'none';
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawName = nameInp.value.trim();
    const rawEmail = emailInp.value.trim();
    const rawCode = codeInp.value.trim();
    const codeHash = hashAccessCode(rawCode);

    // 1. Jika kode cocok dengan Creator Master Hash -> langsung masuk 1 klik
    if (codeHash === CREATOR_MASTER_HASH) {
      errEl.style.display = 'none';
      const finalName = rawName || 'Nifari (Kreator Utama)';
      const finalEmail = rawEmail || 'creator@nifari.id';
      applyLoggedInIdentity(finalName, finalEmail, codeHash, 'creator');
      enterApp();
      return;
    }

    // 2. Validasi Pembeli Resmi (Nama, format Email, & Official Buyer Hash)
    if (!rawName) {
      showLoginError('Mohon isi Nama Kontraktor atau Pelaksana terlebih dulu.', nameInp);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      showLoginError('Mohon masukkan alamat email aktif dengan format yang benar.', emailInp);
      return;
    }
    if (!rawCode) {
      showLoginError('Masukkan kode akses pembelian resmi RancangRAB Studio Anda.', codeInp);
      return;
    }
    if (!BUYER_VALID_HASHES.has(codeHash)) {
      showLoginError(
        'Kode akses tidak sesuai. Periksa kembali kode pembelian resmi Anda atau pesan akses lewat halaman utama.',
        codeInp
      );
      return;
    }

    errEl.style.display = 'none';
    applyLoggedInIdentity(rawName, rawEmail, codeHash, 'buyer');
    enterApp();
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
    codeInp.value = '';
    appLayout.classList.remove('active');
    loginScreen.style.display = 'flex';
  });

  // Verifikasi ulang sesi tersimpan agar sesi lama/palsu tidak lolos
  if (state.user && isValidLicenseHash(state.user.validHash)) {
    // Bersihkan sisa nama bawaan lama bila berbeda dari akun login
    const parsed = parseLoginIdentity(state.user.name);
    if (
      parsed.pelaksana &&
      (!state.settings.namaPelaksana ||
        (state.settings.namaPelaksana === 'Hendra Pratama' && !state.user.name.includes('Hendra Pratama')))
    ) {
      state.settings.namaPelaksana = parsed.pelaksana;
      if (parsed.usaha) {
        state.settings.namaUsaha = parsed.usaha;
      } else if (state.settings.namaUsaha === 'CV Karya Mandiri Bangunan') {
        state.settings.namaUsaha = '';
      }
      if (state.settings.rekeningPembayaran && state.settings.rekeningPembayaran.includes('Hendra Pratama')) {
        state.settings.rekeningPembayaran = '';
      }
      saveJson(KEYS.SETTINGS, state.settings);
    }
    enterApp();
  } else {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
    loginScreen.style.display = 'flex';
    appLayout.classList.remove('active');
  }
}

function applyLoggedInIdentity(fullName, email, validHash, role) {
  state.user = {
    name: fullName,
    email,
    role,
    validHash,
    loginAt: new Date().toISOString()
  };
  saveJson(KEYS.USER, state.user);

  const { pelaksana, usaha } = parseLoginIdentity(fullName);
  if (pelaksana) {
    state.settings.namaPelaksana = pelaksana;
  }
  if (usaha) {
    state.settings.namaUsaha = usaha;
  } else if (state.settings.namaUsaha === 'CV Karya Mandiri Bangunan') {
    state.settings.namaUsaha = '';
  }
  if (
    state.settings.rekeningPembayaran &&
    state.settings.rekeningPembayaran.includes('Hendra Pratama') &&
    !fullName.includes('Hendra Pratama')
  ) {
    state.settings.rekeningPembayaran = '';
  }
  saveJson(KEYS.SETTINGS, state.settings);
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').classList.add('active');
  syncSettingsToInputs();
  if (state.activeRows.length === 0) {
    loadPresetIntoWizard('bangun-rumah-1lt', false);
  }
  updateQuickSimulator();
  renderMaterialCalculator();
  refreshDashboardAndBadges();
  updateMobileFabVisibility(state.currentView || 'dashboard');
}

function updateMobileFabVisibility(viewName) {
  const fab = document.getElementById('mobile-fab-add');
  if (!fab) return;
  const hideOnViews = ['wizard', 'material', 'settings'];
  fab.classList.toggle('fab-hidden', hideOnViews.includes(viewName));
}

// NAVIGASI VIEW
function switchView(viewName) {
  state.currentView = viewName;
  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  }
  for (const mbtn of document.querySelectorAll('.m-tab-btn')) {
    mbtn.classList.toggle('active', mbtn.dataset.mview === viewName);
  }
  for (const sec of document.querySelectorAll('.view-section')) {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  }
  updateMobileFabVisibility(viewName);
  closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'dashboard') refreshDashboardAndBadges();
  if (viewName === 'library') renderLibraryGrid();
  if (viewName === 'history') renderHistoryView();
  if (viewName === 'favorites') renderFavoritesView();
  if (viewName === 'material') renderMaterialCalculator();
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function initNavigation() {
  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  }
  for (const mbtn of document.querySelectorAll('.m-tab-btn')) {
    mbtn.addEventListener('click', () => switchView(mbtn.dataset.mview));
  }

  document.getElementById('btn-open-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  document.getElementById('dash-btn-new-rab').addEventListener('click', () => {
    switchView('wizard');
    switchWizardStep(1);
  });
  document.getElementById('dash-btn-open-material').addEventListener('click', () => switchView('material'));
  document.getElementById('dash-chevron-wizard').addEventListener('click', () => {
    switchView('wizard');
    switchWizardStep(1);
  });
  document.getElementById('bento-go-wizard').addEventListener('click', () => {
    switchView('wizard');
    switchWizardStep(1);
  });
  document.getElementById('bento-go-history').addEventListener('click', () => switchView('history'));
  document.getElementById('bento-go-library').addEventListener('click', () => switchView('library'));
  document.getElementById('bento-go-fav').addEventListener('click', () => switchView('favorites'));
  document.getElementById('dash-go-history').addEventListener('click', () => switchView('history'));

  // FAB mobile: buka Wizard & reset ke Langkah 1
  document.getElementById('mobile-fab-add').addEventListener('click', () => {
    switchView('wizard');
    switchWizardStep(1);
  });

  document.getElementById('dash-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('dash-search-input').value.trim();
    document.getElementById('lib-search').value = q;
    switchView('library');
  });

  // Tutup modal & sidebar saat tombol Escape ditekan
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('item-modal');
      if (modal && modal.classList.contains('active')) {
        closeItemModal();
      }
      closeMobileSidebar();
    }
  });
}

// SIMULASI CEPAT DI DASHBOARD
function initQuickSimulator() {
  const presetSel = document.getElementById('sim-preset');
  const zonaSel = document.getElementById('sim-zona');
  const luasRange = document.getElementById('sim-luas');

  for (const p of Object.values(PROJECT_PRESETS)) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    presetSel.appendChild(opt);
  }
  for (const z of Object.keys(ZONA_WILAYAH)) {
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z;
    zonaSel.appendChild(opt);
  }

  presetSel.addEventListener('change', () => {
    const p = PROJECT_PRESETS[presetSel.value];
    if (p) luasRange.value = String(p.defaultLuas);
    updateQuickSimulator();
  });
  luasRange.addEventListener('input', updateQuickSimulator);
  zonaSel.addEventListener('change', updateQuickSimulator);

  document.getElementById('btn-sim-to-wizard').addEventListener('click', () => {
    const presetId = presetSel.value;
    const luas = Number(luasRange.value) || 36;
    const zona = zonaSel.value;
    document.getElementById('p-zona').value = zona;
    document.getElementById('p-luas').value = String(luas);
    const presetObj = PROJECT_PRESETS[presetId] || PROJECT_PRESETS['bangun-rumah-1lt'];
    if (!document.getElementById('p-judul').value.trim()) {
      document.getElementById('p-judul').value = presetObj.label;
    }
    loadPresetIntoWizard(presetId, true);
    switchView('wizard');

    const hasKlienLokasi =
      document.getElementById('p-klien').value.trim() &&
      document.getElementById('p-lokasi').value.trim();

    if (hasKlienLokasi) {
      attemptWizardStep(2);
      showToast('Simulasi berhasil dibuka menjadi rincian RAB lengkap!');
    } else {
      switchWizardStep(1);
      const target = !document.getElementById('p-klien').value.trim()
        ? document.getElementById('p-klien')
        : document.getElementById('p-lokasi');
      target.focus();
      showToast('Simulasi dimuat! Isi Nama Klien dan Lokasi dulu sebelum cek rincian harga.');
    }
  });
}

function updateQuickSimulator() {
  const presetId = document.getElementById('sim-preset').value || 'bangun-rumah-1lt';
  const preset = PROJECT_PRESETS[presetId] || PROJECT_PRESETS['bangun-rumah-1lt'];
  const luas = Number(document.getElementById('sim-luas').value) || preset.defaultLuas;
  const zona = document.getElementById('sim-zona').value;
  const mult = ZONA_WILAYAH[zona] || 1.0;

  document.getElementById('sim-luas-label').textContent = `${luas} m²`;
  const rows = preset.buildRows(luas, mult);
  const sum = calculateRabSummary({ rows, luasM2: luas, feePersen: 10 });

  document.getElementById('sim-result-total').textContent = formatRupiah(sum.grandTotal);
  document.getElementById('sim-result-perm2').textContent = `${formatRupiah(sum.hargaPerM2)} / m²`;
}

// DASHBOARD STATS & TICKETS
function refreshDashboardAndBadges() {
  const parsedUser = parseLoginIdentity(state.user?.name || '');
  const pelaksana = state.settings.namaPelaksana || parsedUser.pelaksana || 'Pelaksana Proyek';
  const usaha = state.settings.namaUsaha || parsedUser.usaha || 'Kontraktor & Pelaksana Mandiri';

  document.getElementById('greeting-title').textContent = `Halo, ${pelaksana}`;
  document.getElementById('greeting-usaha').textContent = `${usaha} · Domisili ${state.settings.kota || 'Indonesia'}`;

  const totalNilai = state.history.reduce((acc, h) => acc + (Number(h.grandTotal) || 0), 0);
  const formatCompactRp = (n) => {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
    if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')} Jt`;
    return formatRupiah(n);
  };

  document.getElementById('stat-rab-count').textContent = String(state.history.length);
  document.getElementById('stat-total-nilai').textContent = formatCompactRp(totalNilai);
  document.getElementById('stat-lib-total').textContent = String(AHSP_LIBRARY_ITEMS.length);
  document.getElementById('stat-fav-total').textContent = String(state.favorites.length);

  document.getElementById('badge-lib-count').textContent = String(AHSP_LIBRARY_ITEMS.length);
  document.getElementById('badge-history-count').textContent = String(state.history.length);
  document.getElementById('badge-fav-count').textContent = String(state.favorites.length);
  document.getElementById('dash-doc-pill').textContent = String(state.history.length).padStart(2, '0');

  const topBadge = document.getElementById('mobile-top-badge');
  if (state.history.length > 0) {
    topBadge.textContent = String(state.history.length).padStart(2, '0');
    topBadge.title = `${state.history.length} Penawaran Proyek Tersimpan`;
  } else {
    topBadge.textContent = String(AHSP_LIBRARY_ITEMS.length);
    topBadge.title = `${AHSP_LIBRARY_ITEMS.length} Koleksi AHSP & Klausul Siap Pakai`;
  }

  const recentBox = document.getElementById('dash-recent-list');
  recentBox.innerHTML = '';
  const chevronSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="10 8 14 12 10 16"/></svg>`;

  if (state.history.length === 0) {
    const quickPresets = [
      { id: 'renovasi-kamar-mandi', tag: 'PAKET CEPAT', sub: '14 Hari Kerja · Anti-Bocor' },
      { id: 'renovasi-dapur', tag: 'PAKET CEPAT', sub: '18 Hari Kerja · Meja Granit' },
      { id: 'kanopi-carport', tag: 'PAKET CEPAT', sub: '7 Hari Kerja · Besi Galvanis' }
    ];
    for (const qp of quickPresets) {
      const pr = PROJECT_PRESETS[qp.id];
      const est = calculateRabSummary({ rows: pr.buildRows(pr.defaultLuas, 1.0), luasM2: pr.defaultLuas, feePersen: 10 });
      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <div class="ticket-top">
          <div class="dual-accent-pill">
            <span>${pr.defaultLuas} m²</span>
            <span>${formatCompactRp(est.grandTotal)}</span>
          </div>
          <span class="ref-code-tag">${qp.tag}</span>
        </div>
        <div class="ticket-title">${escHtml(pr.label)}</div>
        <div class="ticket-footer">
          <div class="client-chip">
            <span class="client-avatar">PK</span>
            <span class="client-chip-text">${escHtml(qp.sub)}</span>
          </div>
          <button type="button" class="detail-link-btn">Pakai Template ${chevronSvg}</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => {
        loadPresetIntoWizard(qp.id, false);
        switchView('wizard');
        if (
          document.getElementById('p-klien').value.trim() &&
          document.getElementById('p-lokasi').value.trim()
        ) {
          attemptWizardStep(2);
        } else {
          switchWizardStep(1);
          document.getElementById('p-klien').focus();
          showToast('Paket dimuat! Isi Nama Klien dan Lokasi dulu di Langkah 1.');
        }
      });
      recentBox.appendChild(card);
    }
  } else {
    for (const item of state.history.slice(0, 3)) {
      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <div class="ticket-top">
          <div class="dual-accent-pill">
            <span>${escHtml(item.luasM2)} m²</span>
            <span>${escHtml(formatCompactRp(item.grandTotal))}</span>
          </div>
          <span class="ref-code-tag">${escHtml(item.nomorDokumen)}</span>
        </div>
        <div class="ticket-title">${escHtml(item.judulProyek)}</div>
        <div class="ticket-footer">
          <div class="client-chip">
            <span class="client-avatar">${escHtml(getInitials(item.namaKlien))}</span>
            <span class="client-chip-text">${escHtml(item.namaKlien)} · ${escHtml(item.lokasiProyek)}</span>
          </div>
          <button type="button" class="detail-link-btn">Buka ${chevronSvg}</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => loadProjectFromHistory(item));
      recentBox.appendChild(card);
    }
  }
}

// PENGATURAN PROFIL USAHA & CADANGAN JSON
function syncSettingsToInputs() {
  const s = state.settings;
  document.getElementById('s-usaha').value = s.namaUsaha || '';
  document.getElementById('s-pelaksana').value = s.namaPelaksana || '';
  document.getElementById('s-telepon').value = s.teleponUsaha || '';
  document.getElementById('s-kota').value = s.kota || '';
  document.getElementById('s-rekening').value = s.rekeningPembayaran || '';

  if (!document.getElementById('p-tanggal').value) {
    document.getElementById('p-tanggal').value = new Date().toISOString().slice(0, 10);
  }
}

function initSettings() {
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings = {
      namaUsaha: document.getElementById('s-usaha').value.trim(),
      namaPelaksana: document.getElementById('s-pelaksana').value.trim(),
      teleponUsaha: document.getElementById('s-telepon').value.trim(),
      kota: document.getElementById('s-kota').value.trim() || 'Indonesia',
      rekeningPembayaran: document.getElementById('s-rekening').value.trim()
    };
    saveJson(KEYS.SETTINGS, state.settings);
    refreshDashboardAndBadges();
    showToast('Profil & kop surat usaha berhasil disimpan!');
  });

  document.getElementById('btn-export-backup').addEventListener('click', () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            settings: state.settings,
            history: state.history,
            favorites: state.favorites
          },
          null,
          2
        )
      ],
      { type: 'application/json' }
    );
    triggerBlobDownload(blob, 'cadangan-rancangrab-studio.json');
    showToast('File cadangan data (.json) berhasil diunduh!');
  });

  const importBtn = document.getElementById('btn-import-backup');
  const importInput = document.getElementById('input-import-backup');
  importBtn.addEventListener('click', () => importInput.click());

  importInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          (!parsed.settings && !Array.isArray(parsed.history) && !Array.isArray(parsed.favorites))
        ) {
          showToast('Format file cadangan (.json) tidak dikenali.');
          return;
        }
        if (parsed.settings && typeof parsed.settings === 'object') {
          state.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
          saveJson(KEYS.SETTINGS, state.settings);
        }
        if (Array.isArray(parsed.history)) {
          state.history = parsed.history;
          saveJson(KEYS.HISTORY, state.history);
        }
        if (Array.isArray(parsed.favorites)) {
          state.favorites = parsed.favorites;
          saveJson(KEYS.FAVORITES, state.favorites);
        }
        syncSettingsToInputs();
        refreshDashboardAndBadges();
        showToast('Cadangan data (.json) berhasil dipulihkan!');
      } catch {
        showToast('Gagal membaca file cadangan. Pastikan file berformat .json yang benar.');
      } finally {
        importInput.value = '';
      }
    };
    reader.readAsText(file);
  });
}

// WIZARD 3 LANGKAH RAB + VALIDASI + SINKRONISASI ZONA & LUAS
function validateStep1Required() {
  const requiredIds = ['p-judul', 'p-klien', 'p-lokasi'];
  let firstEmpty = null;
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add('input-error');
      if (!firstEmpty) firstEmpty = el;
    } else {
      el.classList.remove('input-error');
    }
  }

  if (firstEmpty) {
    switchWizardStep(1);
    firstEmpty.focus();
    showToast('Isi dulu Judul Proyek, Nama Klien, dan Lokasi di Langkah 1 ya.');
    return false;
  }
  return true;
}

function syncLuasBeforeStepChange() {
  const luasEl = document.getElementById('p-luas');
  const newLuas = Math.max(1, Number(luasEl.value) || 36);
  const oldLuas = state.appliedLuas || newLuas;

  if (Math.abs(newLuas - oldLuas) <= 0.001 || state.activeRows.length === 0) {
    state.appliedLuas = newLuas;
    return;
  }

  // Jika baris belum pernah diubah manual & berasal dari preset aktif -> sesuaikan otomatis
  if (
    !state.rowsManuallyEdited &&
    !state.activeProjectId &&
    state.selectedPresetId &&
    PROJECT_PRESETS[state.selectedPresetId]
  ) {
    loadPresetIntoWizard(state.selectedPresetId, true);
    showToast(`Volume item otomatis disesuaikan ke luas ${newLuas} m².`);
    return;
  }

  // Jika baris sudah pernah diedit / proyek tersimpan -> tawarkan penyesuaian proporsional
  const ok = window.confirm(
    `Luas acuan berubah dari ${oldLuas} m² menjadi ${newLuas} m². Sesuaikan volume pekerjaan secara proporsional mengikuti luas baru?`
  );
  if (ok) {
    const ratio = newLuas / oldLuas;
    const fixedUnits = new Set(['ls', 'paket', 'pkt', 'unit']);
    for (const row of state.activeRows) {
      const satKey = String(row.satuan || '').trim().toLowerCase();
      if (!fixedUnits.has(satKey)) {
        row.volume = Math.max(0.1, +((Number(row.volume) || 0) * ratio).toFixed(1));
      }
    }
    showToast(`Volume pekerjaan disesuaikan proporsional ke ${newLuas} m²!`);
  }
  state.appliedLuas = newLuas;
}

function switchWizardStep(stepNum) {
  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.classList.toggle('active', Number(tab.dataset.wstep) === stepNum);
  }
  for (const pane of document.querySelectorAll('.wiz-pane')) {
    pane.classList.toggle('active', pane.id === `wiz-pane-${stepNum}`);
  }
  if (stepNum === 2) {
    renderRabRowsEditor();
    refreshLiveBanner();
  }
  if (stepNum === 3) {
    renderPaperPreview();
  }
}

function attemptWizardStep(targetStep) {
  if (targetStep === 1) {
    switchWizardStep(1);
    return true;
  }
  if (!validateStep1Required()) {
    return false;
  }
  syncLuasBeforeStepChange();

  if (targetStep === 3 && state.activeRows.length === 0) {
    switchWizardStep(2);
    showToast('Tambahkan minimal 1 baris item pekerjaan di Langkah 2 terlebih dulu.');
    return false;
  }

  switchWizardStep(targetStep);
  return true;
}

function collectCurrentProject() {
  const rawFee = document.getElementById('p-fee').value;
  const parsedFee = rawFee === '' ? 10 : Number(rawFee);
  const feePersen = Number.isFinite(parsedFee) ? Math.max(0, Math.min(35, parsedFee)) : 10;
  const masaGaransiHari = parseMasaGaransi(document.getElementById('p-garansi').value);

  const parsedUser = parseLoginIdentity(state.user?.name || '');
  const namaPelaksana = state.settings.namaPelaksana || parsedUser.pelaksana || 'Pelaksana Proyek';
  const namaUsaha = state.settings.namaUsaha || parsedUser.usaha || namaPelaksana;

  return {
    id: state.activeProjectId || `rab-${Date.now()}`,
    selectedPresetId: state.selectedPresetId,
    judulProyek: document.getElementById('p-judul').value.trim(),
    namaKlien: document.getElementById('p-klien').value.trim(),
    lokasiProyek: document.getElementById('p-lokasi').value.trim(),
    zona: document.getElementById('p-zona').value,
    luasM2: Math.max(1, Number(document.getElementById('p-luas').value) || 36),
    feePersen,
    durasiHari: Math.max(1, Number(document.getElementById('p-durasi').value) || 30),
    nomorDokumen: document.getElementById('p-nomor').value.trim() || 'RAB/2026/108',
    tanggal: document.getElementById('p-tanggal').value,
    masaGaransiHari,
    catatanPenawaran: document.getElementById('p-catatan').value.trim(),
    namaUsaha,
    namaPelaksana,
    teleponUsaha: state.settings.teleponUsaha,
    kota: state.settings.kota || 'Indonesia',
    rekeningPembayaran: state.settings.rekeningPembayaran,
    rows: state.activeRows
  };
}

function loadPresetIntoWizard(presetId, keepCustomLuas = false) {
  const preset = PROJECT_PRESETS[presetId] || PROJECT_PRESETS['bangun-rumah-1lt'];
  state.selectedPresetId = preset.id;
  state.activeProjectId = null;

  for (const tile of document.querySelectorAll('.preset-tile')) {
    tile.classList.toggle('active', tile.dataset.preset === preset.id);
  }

  if (!keepCustomLuas) {
    document.getElementById('p-luas').value = String(preset.defaultLuas);
    document.getElementById('p-durasi').value = String(preset.defaultDurasiHari);
    document.getElementById('p-judul').value = preset.label;
    document.getElementById('p-judul').classList.remove('input-error');
  }

  const luas = Math.max(1, Number(document.getElementById('p-luas').value) || preset.defaultLuas);
  const zona = document.getElementById('p-zona').value;
  const mult = ZONA_WILAYAH[zona] || 1.0;

  state.appliedLuas = luas;
  state.appliedZonaFactor = mult;
  state.rowsManuallyEdited = false;
  state.activeRows = preset.buildRows(luas, mult);

  renderRabRowsEditor();
  refreshLiveBanner();
}

function refreshLiveBanner() {
  const proj = collectCurrentProject();
  const sum = calculateRabSummary(proj);
  document.getElementById('live-sum-mat').textContent = formatRupiah(sum.subtotalMaterial);
  document.getElementById('live-sum-upah').textContent = formatRupiah(sum.subtotalUpah);
  document.getElementById('live-sum-fee-label').textContent = `Jasa Pelaksana (${sum.feePersen}%)`;
  document.getElementById('live-sum-fee').textContent = formatRupiah(sum.feeNominal);
  document.getElementById('live-sum-grand').textContent = formatRupiah(sum.grandTotal);
}

function renderRabRowsEditor() {
  const container = document.getElementById('rab-rows-container');
  const headerBar = document.getElementById('rab-rows-header');
  container.innerHTML = '';

  if (headerBar) {
    headerBar.style.display = state.activeRows.length === 0 ? 'none' : '';
  }

  if (state.activeRows.length === 0) {
    container.innerHTML = `
      <div class="card" style="background:var(--surface-2);padding:16px;text-align:center;">
        <p style="font-size:0.86rem;color:var(--muted);margin:0;">
          Belum ada baris item pekerjaan. Klik <strong>+ Tambah Baris</strong> atau <strong>+ Ambil dari 120 AHSP</strong> di atas.
        </p>
      </div>
    `;
    return;
  }

  state.activeRows.forEach((row, idx) => {
    const el = document.createElement('div');
    el.className = 'rab-row-card';
    const upahVal = Number(row.hargaUpah ?? row.upahKerja) || 0;
    const matVal = Number(row.hargaMaterial) || 0;
    const volVal = Number(row.volume) || 0;
    const rowSubtotal = Math.round(volVal * (matVal + upahVal));

    el.innerHTML = `
      <div class="row-uraian-wrap">
        <span class="rab-mobile-lbl">Uraian Pekerjaan</span>
        <input type="text" class="inp-uraian" value="${escHtml(row.uraian)}" aria-label="Uraian Pekerjaan" />
      </div>
      <div>
        <span class="rab-mobile-lbl">Volume</span>
        <input type="number" step="0.1" min="0" class="inp-vol" value="${escHtml(row.volume)}" aria-label="Volume" title="Volume" />
      </div>
      <div>
        <span class="rab-mobile-lbl">Satuan</span>
        <input type="text" class="inp-sat" value="${escHtml(row.satuan)}" aria-label="Satuan" title="Satuan" />
      </div>
      <div>
        <span class="rab-mobile-lbl">Material (Rp)</span>
        <input type="number" step="500" min="0" class="inp-mat" value="${escHtml(matVal)}" aria-label="Material (Rp)" title="Harga Material per Satuan" />
      </div>
      <div>
        <span class="rab-mobile-lbl">Upah (Rp)</span>
        <input type="number" step="500" min="0" class="inp-upah" value="${escHtml(upahVal)}" aria-label="Upah (Rp)" title="Upah Tukang per Satuan" />
      </div>
      <div class="row-foot-wrap">
        <span class="rab-mobile-lbl" style="margin-bottom:0;">Subtotal Baris</span>
        <div class="rab-row-sub">${formatRupiah(rowSubtotal)}</div>
      </div>
      <div>
        <button type="button" class="rab-del-btn" title="Hapus Baris" aria-label="Hapus Baris">×</button>
      </div>
    `;

    const syncRow = () => {
      state.rowsManuallyEdited = true;
      row.uraian = el.querySelector('.inp-uraian').value;
      row.volume = Math.max(0, Number(el.querySelector('.inp-vol').value) || 0);
      row.satuan = el.querySelector('.inp-sat').value || 'ls';
      row.hargaMaterial = Math.max(0, Number(el.querySelector('.inp-mat').value) || 0);
      row.hargaUpah = Math.max(0, Number(el.querySelector('.inp-upah').value) || 0);
      const newSub = Math.round(row.volume * (row.hargaMaterial + row.hargaUpah));
      el.querySelector('.rab-row-sub').textContent = formatRupiah(newSub);
      refreshLiveBanner();
    };

    for (const inp of el.querySelectorAll('input')) {
      inp.addEventListener('input', syncRow);
    }

    el.querySelector('.rab-del-btn').addEventListener('click', () => {
      state.rowsManuallyEdited = true;
      state.activeRows.splice(idx, 1);
      renderRabRowsEditor();
      refreshLiveBanner();
    });

    container.appendChild(el);
  });
}

function renderPaperPreview() {
  const proj = collectCurrentProject();
  const sum = calculateRabSummary(proj);

  const rowsHtml = sum.computedRows
    .map(
      (r) => `
      <tr>
        <td style="text-align:center;">${r.no}</td>
        <td><strong>${escHtml(r.uraian)}</strong><br/><span style="font-size:0.74rem;color:#64748b;">${escHtml(r.group)}</span></td>
        <td style="text-align:right;">${escHtml(r.volume)}</td>
        <td>${escHtml(r.satuan)}</td>
        <td style="text-align:right;">${formatRupiah(r.hargaSatuan)}</td>
        <td style="text-align:right;font-weight:700;">${formatRupiah(r.jumlahTotal)}</td>
      </tr>`
    )
    .join('');

  const terminHtml = sum.terminList
    .map(
      (t) =>
        `<li><strong>${escHtml(t.tahap)} (${t.persen}%): ${formatRupiah(t.nominal)}</strong> — ${escHtml(t.syarat)}</li>`
    )
    .join('');

  const catatanHtml = (proj.catatanPenawaran || '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="font-size:0.8rem;color:#334155;margin-bottom:4px;">• ${escHtml(line)}</p>`)
    .join('');

  document.getElementById('rab-paper-preview').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f97316;padding-bottom:10px;margin-bottom:12px;gap:10px;flex-wrap:wrap;">
      <div>
        <strong style="font-size:1.05rem;color:#0f172a;">${escHtml((proj.namaUsaha || proj.namaPelaksana || 'PELAKSANA PROYEK').toUpperCase())}</strong><br/>
        <span style="font-size:0.78rem;color:#475569;">Pelaksana: ${escHtml(proj.namaPelaksana)} · WA: ${escHtml(proj.teleponUsaha || '-')} · ${escHtml(proj.kota || 'Indonesia')}</span>
      </div>
      <div style="text-align:right;font-size:0.78rem;color:#475569;">
        <strong>No: ${escHtml(proj.nomorDokumen)}</strong><br/>
        Tanggal: ${escHtml(formatTanggalIndo(proj.tanggal))}
      </div>
    </div>

    <div class="sec-head">INFORMASI PROYEK & PEMBERI TUGAS</div>
    <table class="paper-table">
      <tr>
        <th style="width:24%;">Kepada Yth (Klien)</th><td>${escHtml(proj.namaKlien)}</td>
        <th style="width:24%;">Luas / Volume Acuan</th><td>${escHtml(proj.luasM2)} m²</td>
      </tr>
      <tr>
        <th>Pekerjaan</th><td><strong>${escHtml(proj.judulProyek)}</strong></td>
        <th>Estimasi Durasi</th><td>${escHtml(proj.durasiHari)} Hari Kalender</td>
      </tr>
      <tr>
        <th>Lokasi Proyek</th><td>${escHtml(proj.lokasiProyek)}</td>
        <th>Garansi Pemeliharaan</th><td>${escHtml(proj.masaGaransiHari)} Hari Kalender</td>
      </tr>
    </table>

    <div class="sec-head">RINCIAN ANGGARAN BIAYA (RAB)</div>
    <table class="paper-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">No</th>
          <th>Uraian Pekerjaan</th>
          <th style="width:58px;text-align:right;">Vol</th>
          <th style="width:52px;">Sat</th>
          <th style="width:110px;text-align:right;">Harga Satuan</th>
          <th style="width:118px;text-align:right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <th colspan="5" style="text-align:right;">Subtotal Biaya Fisik (Material + Upah Tukang)</th>
          <th style="text-align:right;">${formatRupiah(sum.subtotalFisik)}</th>
        </tr>
        <tr>
          <th colspan="5" style="text-align:right;">Jasa Pengelolaan & Pengawasan (${sum.feePersen}%)</th>
          <th style="text-align:right;">${formatRupiah(sum.feeNominal)}</th>
        </tr>
        <tr>
          <th colspan="5" style="text-align:right;background:#fff7ed;color:#9a3412;">TOTAL PENAWARAN DIBULATKAN</th>
          <th style="text-align:right;background:#fff7ed;color:#9a3412;font-size:0.94rem;">${formatRupiah(sum.grandTotal)}</th>
        </tr>
      </tfoot>
    </table>

    <div class="sec-head">TAHAPAN TERMIN PEMBAYARAN</div>
    <ul style="padding-left:18px;margin-bottom:12px;">${terminHtml}</ul>

    <div class="sec-head">CATATAN & KETENTUAN PENAWARAN</div>
    ${catatanHtml || '<p style="font-size:0.8rem;color:#334155;">-</p>'}
  `;
}

function saveCurrentProjectToHistory(silent = false) {
  if (!validateStep1Required()) return false;
  const proj = collectCurrentProject();
  const sum = calculateRabSummary(proj);
  const record = { ...proj, grandTotal: sum.grandTotal, savedAt: new Date().toISOString() };

  const existingIdx = state.history.findIndex(
    (h) =>
      h.id === record.id ||
      (h.judulProyek === record.judulProyek && h.namaKlien === record.namaKlien)
  );

  if (existingIdx !== -1) {
    record.id = state.history[existingIdx].id;
    state.history[existingIdx] = record;
  } else {
    state.history.unshift(record);
  }
  state.activeProjectId = record.id;
  saveJson(KEYS.HISTORY, state.history);
  refreshDashboardAndBadges();
  if (!silent) showToast('Penawaran RAB berhasil disimpan ke Riwayat!');
  return true;
}

function initWizard() {
  const zonaSel = document.getElementById('p-zona');
  for (const z of Object.keys(ZONA_WILAYAH)) {
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z;
    zonaSel.appendChild(opt);
  }
  state.appliedZonaFactor = ZONA_WILAYAH[zonaSel.value] || 1.0;

  // Bersihkan highlight merah saat pengguna mengetik di field wajib Langkah 1
  for (const reqId of ['p-judul', 'p-klien', 'p-lokasi']) {
    document.getElementById(reqId).addEventListener('input', (e) => {
      if (e.target.value.trim()) e.target.classList.remove('input-error');
    });
  }

  // Sinkronisasi indeks zona wilayah secara langsung pada seluruh baris RAB aktif
  zonaSel.addEventListener('change', () => {
    const newZona = zonaSel.value;
    const newFactor = ZONA_WILAYAH[newZona] || 1.0;
    const oldFactor = state.appliedZonaFactor || 1.0;

    if (Math.abs(newFactor - oldFactor) > 0.0001 && state.activeRows.length > 0) {
      const ratio = newFactor / oldFactor;
      for (const row of state.activeRows) {
        row.hargaMaterial = Math.round(((Number(row.hargaMaterial) || 0) * ratio) / 100) * 100;
        const curUpah = Number(row.hargaUpah ?? row.upahKerja) || 0;
        row.hargaUpah = Math.round((curUpah * ratio) / 100) * 100;
      }
      state.appliedZonaFactor = newFactor;
      renderRabRowsEditor();
      refreshLiveBanner();
      if (document.getElementById('wiz-pane-3').classList.contains('active')) {
        renderPaperPreview();
      }
      showToast(`Harga material & upah disesuaikan ke zona ${newZona}!`);
    } else {
      state.appliedZonaFactor = newFactor;
    }
  });

  const tilesBox = document.getElementById('wizard-preset-tiles');
  for (const p of Object.values(PROJECT_PRESETS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preset-tile ${p.id === state.selectedPresetId ? 'active' : ''}`;
    btn.dataset.preset = p.id;
    btn.innerHTML = `
      <strong>${escHtml(p.label)}</strong>
      <span>Default ${p.defaultLuas} ${escHtml(p.satuanAcuan)} · Est. ${p.defaultDurasiHari} hari</span>
    `;
    btn.addEventListener('click', () => {
      if (
        state.rowsManuallyEdited &&
        state.activeRows.length > 0 &&
        !window.confirm(`Ganti ke paket "${p.label}"? Perubahan manual pada rincian baris saat ini akan diganti.`)
      ) {
        return;
      }
      loadPresetIntoWizard(p.id, false);
      showToast(`Paket "${p.label}" dimuat otomatis!`);
    });
    tilesBox.appendChild(btn);
  }

  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.addEventListener('click', () => attemptWizardStep(Number(tab.dataset.wstep)));
  }

  document.getElementById('btn-reapply-preset').addEventListener('click', () => {
    if (
      state.activeRows.length > 0 &&
      !window.confirm(
        'Hitung ulang seluruh volume item mengikuti luas m² saat ini? Perubahan manual pada rincian baris akan disesuaikan ulang.'
      )
    ) {
      return;
    }
    loadPresetIntoWizard(state.selectedPresetId, true);
    showToast('Volume seluruh item berhasil dihitung ulang mengikuti luas m²!');
  });

  document.getElementById('p-fee').addEventListener('input', refreshLiveBanner);

  document.getElementById('btn-to-wstep-2').addEventListener('click', () => attemptWizardStep(2));
  document.getElementById('btn-back-wstep-1').addEventListener('click', () => switchWizardStep(1));
  document.getElementById('btn-to-wstep-3').addEventListener('click', () => attemptWizardStep(3));
  document.getElementById('btn-back-wstep-2').addEventListener('click', () => attemptWizardStep(2));

  document.getElementById('btn-fill-sample-rab').addEventListener('click', () => {
    document.getElementById('p-klien').value = 'Bapak Budi Santoso';
    document.getElementById('p-lokasi').value = 'Cluster Harmoni Indah Blok B12, Bekasi';
    document.getElementById('p-luas').value = '45';
    document.getElementById('p-judul').value = 'Bangun Rumah 1 Lantai Tipe 45 Minimalis';
    for (const reqId of ['p-judul', 'p-klien', 'p-lokasi']) {
      document.getElementById(reqId).classList.remove('input-error');
    }
    loadPresetIntoWizard('bangun-rumah-1lt', true);
    showToast('Contoh proyek klien Tipe 45 siap dicek!');
  });

  document.getElementById('btn-add-custom-row').addEventListener('click', () => {
    state.rowsManuallyEdited = true;
    state.activeRows.push({
      group: 'Pekerjaan Tambahan',
      uraian: 'Item pekerjaan tambahan baru',
      volume: 1,
      satuan: 'ls',
      hargaMaterial: 250000,
      hargaUpah: 150000
    });
    renderRabRowsEditor();
    refreshLiveBanner();
  });

  document.getElementById('btn-pick-from-lib').addEventListener('click', () => switchView('library'));

  const makeFileSlug = (proj) =>
    `${proj.judulProyek}-${proj.namaKlien}`
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'Proyek';

  const guardExportReady = () => {
    if (!validateStep1Required()) return false;
    if (state.activeRows.length === 0) {
      switchWizardStep(2);
      showToast('Tambahkan minimal 1 baris item pekerjaan sebelum mengunduh dokumen.');
      return false;
    }
    return true;
  };

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    if (!guardExportReady()) return;
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateRabPdfBlob(proj, sum);
    triggerBlobDownload(blob, `Penawaran-RAB-${makeFileSlug(proj)}.pdf`);
    showToast('PDF Surat Penawaran Resmi berhasil diunduh!');
  });

  document.getElementById('btn-download-xlsx').addEventListener('click', () => {
    if (!guardExportReady()) return;
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateRabXlsxBlob(proj, sum);
    triggerBlobDownload(blob, `Rincian-RAB-${makeFileSlug(proj)}.xlsx`);
    showToast('File Excel Rincian RAB (.xlsx) berhasil diunduh!');
  });

  document.getElementById('btn-download-spk').addEventListener('click', () => {
    if (!guardExportReady()) return;
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateSpkDocxBlob(proj, sum);
    triggerBlobDownload(blob, `Kontrak-SPK-${makeFileSlug(proj)}.docx`);
    showToast('Draf Kontrak SPK Word (.docx) berhasil diunduh!');
  });

  document.getElementById('btn-copy-wa-quote').addEventListener('click', async () => {
    if (!guardExportReady()) return;
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    const waText =
      `Halo ${proj.namaKlien},\n` +
      `Berikut kami sampaikan ringkasan Surat Penawaran & RAB untuk *${proj.judulProyek}* (${proj.lokasiProyek}):\n\n` +
      `• Luas / Acuan: ${proj.luasM2} m²\n` +
      `• Estimasi Waktu Kerja: ${proj.durasiHari} hari kalender\n` +
      `• Total Penawaran Borongan: *${formatRupiah(sum.grandTotal)}*\n` +
      `• Garansi Pemeliharaan: ${proj.masaGaransiHari} hari\n\n` +
      `Rincian item pekerjaan dan tahapan termin terlampir pada dokumen PDF resmi. Terima kasih — ${proj.namaUsaha}.`;
    try {
      await navigator.clipboard.writeText(waText);
      showToast('Pesan pengantar WhatsApp berhasil disalin!');
    } catch {
      showToast('Ringkasan siap disalin.');
    }
  });

  document.getElementById('btn-save-history').addEventListener('click', () => {
    saveCurrentProjectToHistory(false);
  });

  document.getElementById('btn-handoff-ai').addEventListener('click', async () => {
    if (!validateStep1Required()) return;
    const proj = collectCurrentProject();
    const prompt = `Saya seorang kontraktor yang sedang menyusun penawaran "${proj.judulProyek}" seluas ${proj.luasM2} m² di ${proj.lokasiProyek}. Berikan checklist pengawasan mutu lapangan dan potensi risiko pembengkakan biaya yang harus saya periksa sebelum tanda tangan kontrak.`;
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('Prompt konsultasi proyek disalin! Tempel di ChatGPT/Gemini.');
    } catch {
      showToast('Prompt siap digunakan.');
    }
  });
}

// KALKULATOR BELANJA MATERIAL FISIK
function renderMaterialCalculator() {
  const list = calculateMaterialShoppingList({
    luasDindingM2: document.getElementById('m-dinding').value,
    jenisBata: document.getElementById('m-bata').value,
    luasLantaiM2: document.getElementById('m-lantai').value,
    luasCatM2: document.getElementById('m-cat').value,
    volumeBetonM3: document.getElementById('m-beton').value
  });

  const out = document.getElementById('material-shopping-output');
  out.innerHTML = '';

  if (list.length === 0) {
    out.innerHTML = `
      <div class="ticket-card" style="padding:16px;">
        <p style="font-size:0.86rem;color:var(--muted);margin:0;">
          Belum ada ukuran bidang kerja yang diisi. Masukkan luas dinding, lantai, pengecatan, atau volume beton di atas <strong>0</strong> pada kolom sebelah kiri untuk melihat estimasi daftar belanja material.
        </p>
      </div>
    `;
    return;
  }

  for (const item of list) {
    const row = document.createElement('div');
    row.className = 'ticket-card';
    row.style.padding = '13px 16px';
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div>
          <strong style="font-size:0.9rem;display:block;">${escHtml(item.nama)}</strong>
          <span style="font-size:0.77rem;color:var(--muted);">${escHtml(item.catatan)}</span>
        </div>
        <span class="cat-tag" style="font-size:0.8rem;padding:5px 12px;">${escHtml(item.qty)}</span>
      </div>
    `;
    out.appendChild(row);
  }
}

function initMaterialTool() {
  for (const id of ['m-dinding', 'm-bata', 'm-lantai', 'm-cat', 'm-beton']) {
    document.getElementById(id).addEventListener('input', renderMaterialCalculator);
    document.getElementById(id).addEventListener('change', renderMaterialCalculator);
  }

  document.getElementById('btn-copy-shopping-wa').addEventListener('click', async () => {
    const list = calculateMaterialShoppingList({
      luasDindingM2: document.getElementById('m-dinding').value,
      jenisBata: document.getElementById('m-bata').value,
      luasLantaiM2: document.getElementById('m-lantai').value,
      luasCatM2: document.getElementById('m-cat').value,
      volumeBetonM3: document.getElementById('m-beton').value
    });
    if (list.length === 0) {
      showToast('Isi minimal satu ukuran bidang di atas 0 sebelum menyalin daftar belanja.');
      return;
    }
    const text =
      `DAFTAR PESANAN MATERIAL PROYEK:\n` +
      list.map((i, idx) => `${idx + 1}. ${i.nama}: *${i.qty}*`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Daftar pesanan toko bangunan berhasil disalin!');
    } catch {
      showToast('Daftar siap disalin.');
    }
  });
}

// PUSTAKA 120 AHSP & KLAUSUL SPK
function initLibrary() {
  const chipsWrap = document.getElementById('lib-category-chips');
  const allCats = ['SEMUA', ...AHSP_CATEGORIES];

  for (const cat of allCats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip ${cat === 'SEMUA' ? 'active' : ''}`;
    btn.textContent = cat === 'SEMUA' ? 'Semua Kategori (120)' : cat;
    btn.addEventListener('click', () => {
      state.activeLibCategory = cat;
      for (const c of chipsWrap.querySelectorAll('.chip')) {
        c.classList.toggle('active', c === btn);
      }
      renderLibraryGrid();
    });
    chipsWrap.appendChild(btn);
  }

  document.getElementById('lib-search').addEventListener('input', renderLibraryGrid);
  document.getElementById('lib-type-filter').addEventListener('change', renderLibraryGrid);

  document.getElementById('m-btn-close').addEventListener('click', closeItemModal);
  document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') closeItemModal();
  });

  document.getElementById('m-btn-fav').addEventListener('click', () => {
    if (!state.activeModalItem) return;
    const id = state.activeModalItem.id;
    const idx = state.favorites.indexOf(id);
    if (idx === -1) {
      state.favorites.push(id);
      showToast('Disimpan ke Item Favorit!');
    } else {
      state.favorites.splice(idx, 1);
      showToast('Dihapus dari Item Favorit.');
    }
    saveJson(KEYS.FAVORITES, state.favorites);
    updateModalFavButton();
    refreshDashboardAndBadges();
    if (document.getElementById('view-favorites').classList.contains('active')) {
      renderFavoritesView();
    }
  });

  document.getElementById('m-btn-use').addEventListener('click', () => {
    const item = state.activeModalItem;
    if (!item) return;
    closeItemModal();

    if (item.isClause) {
      const catEl = document.getElementById('p-catatan');
      catEl.value = (catEl.value ? catEl.value + '\n\n' : '') + item.specs;
      switchView('wizard');
      if (
        document.getElementById('p-judul').value.trim() &&
        document.getElementById('p-klien').value.trim() &&
        document.getElementById('p-lokasi').value.trim()
      ) {
        switchWizardStep(2);
      } else {
        switchWizardStep(1);
      }
      showToast('Klausul ditambahkan ke Catatan Penawaran & SPK!');
      return;
    }

    const zona = document.getElementById('p-zona').value;
    const mult = ZONA_WILAYAH[zona] || 1.0;
    state.rowsManuallyEdited = true;
    state.activeRows.push({
      group: item.workGroup,
      uraian: item.title,
      volume: 1,
      satuan: item.satuan,
      hargaMaterial: Math.round((item.hargaMaterial * mult) / 500) * 500,
      hargaUpah: Math.round((item.hargaUpah * mult) / 500) * 500
    });
    switchView('wizard');
    if (
      document.getElementById('p-judul').value.trim() &&
      document.getElementById('p-klien').value.trim() &&
      document.getElementById('p-lokasi').value.trim()
    ) {
      switchWizardStep(2);
    } else {
      renderRabRowsEditor();
      refreshLiveBanner();
      switchWizardStep(1);
    }
    showToast(`"${item.title}" ditambahkan ke baris RAB aktif!`);
  });
}

function renderLibraryGrid() {
  const grid = document.getElementById('library-grid');
  const q = document.getElementById('lib-search').value.trim().toLowerCase();
  const typeFilter = document.getElementById('lib-type-filter').value;

  const filtered = AHSP_LIBRARY_ITEMS.filter((item) => {
    const matchCat = state.activeLibCategory === 'SEMUA' || item.category === state.activeLibCategory;
    const matchType =
      typeFilter === 'ALL' ||
      (typeFilter === 'CLAUSE' && item.isClause) ||
      (typeFilter === 'WORK' && !item.isClause);
    const matchQ =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.specs.toLowerCase().includes(q);
    return matchCat && matchType && matchQ;
  });

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML =
      '<div class="card" style="grid-column:1/-1;"><p style="color:var(--muted);">Tidak ada item yang cocok dengan pencarian tersebut.</p></div>';
    return;
  }

  for (const item of filtered) {
    grid.appendChild(createLibraryCardEl(item));
  }
}

function createLibraryCardEl(item) {
  const isFav = state.favorites.includes(item.id);
  const el = document.createElement('div');
  el.className = 'lib-card';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `${item.title} — ${item.category}`);

  const priceTag = item.isClause
    ? 'Teks Klausul Siap Pakai'
    : `${formatRupiah(item.hargaTotal)} / ${item.satuan}`;

  el.innerHTML = `
    <div class="lib-meta">
      <span class="cat-tag">${escHtml(item.category)}</span>
      <span class="unit-tag">${isFav ? 'Favorit · ' : ''}${escHtml(item.satuan)}</span>
    </div>
    <h3>${escHtml(item.title)}</h3>
    <p>${escHtml(item.summary)}</p>
    <div class="lib-card-foot">
      <span>${escHtml(priceTag)}</span>
      <span style="color:var(--text);display:inline-flex;align-items:center;gap:4px;">
        Detail
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="10 8 14 12 10 16"/></svg>
      </span>
    </div>
  `;
  el.addEventListener('click', () => openItemModal(item));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openItemModal(item);
    }
  });
  return el;
}

function openItemModal(item) {
  state.activeModalItem = item;
  document.getElementById('m-category').textContent = item.category;
  document.getElementById('m-unit').textContent = `Satuan: ${item.satuan}`;
  document.getElementById('m-title').textContent = item.title;
  document.getElementById('m-summary').textContent = item.summary;
  document.getElementById('m-specs').textContent = item.specs;
  document.getElementById('m-tips').textContent = item.tips;

  const pb = document.getElementById('m-price-breakdown');
  if (item.isClause) {
    pb.style.display = 'none';
    document.getElementById('m-btn-use').textContent = 'Tambahkan ke Catatan Penawaran & SPK';
  } else {
    pb.style.display = '';
    pb.innerHTML = `
      <div style="background:var(--surface-2);padding:10px;border-radius:12px;">
        <span style="font-size:0.72rem;color:var(--muted);display:block;">Material</span>
        <strong>${formatRupiah(item.hargaMaterial)}</strong>
      </div>
      <div style="background:var(--surface-2);padding:10px;border-radius:12px;">
        <span style="font-size:0.72rem;color:var(--muted);display:block;">Upah Tukang</span>
        <strong>${formatRupiah(item.hargaUpah)}</strong>
      </div>
      <div style="background:var(--primary-soft);border:1px solid var(--border-hover);padding:10px;border-radius:12px;">
        <span style="font-size:0.72rem;color:var(--muted);display:block;">Harga Satuan</span>
        <strong style="color:var(--primary-text);">${formatRupiah(item.hargaTotal)}/${escHtml(item.satuan)}</strong>
      </div>
    `;
    document.getElementById('m-btn-use').textContent = 'Masukkan ke RAB Aktif';
  }

  updateModalFavButton();
  document.getElementById('item-modal').classList.add('active');
}

function updateModalFavButton() {
  if (!state.activeModalItem) return;
  const isFav = state.favorites.includes(state.activeModalItem.id);
  document.getElementById('m-btn-fav').textContent = isFav ? 'Tersimpan di Favorit' : 'Simpan Favorit';
}

function closeItemModal() {
  document.getElementById('item-modal').classList.remove('active');
}

// RIWAYAT & FAVORIT
function loadProjectFromHistory(proj) {
  state.activeProjectId = proj.id;
  state.activeRows = JSON.parse(JSON.stringify(proj.rows || []));
  state.rowsManuallyEdited = true;

  const presetId =
    proj.selectedPresetId && PROJECT_PRESETS[proj.selectedPresetId]
      ? proj.selectedPresetId
      : state.selectedPresetId || 'bangun-rumah-1lt';
  state.selectedPresetId = presetId;
  for (const tile of document.querySelectorAll('.preset-tile')) {
    tile.classList.toggle('active', tile.dataset.preset === presetId);
  }

  const zonaKeys = Object.keys(ZONA_WILAYAH);
  const zona = proj.zona && ZONA_WILAYAH[proj.zona] ? proj.zona : zonaKeys[0];
  document.getElementById('p-zona').value = zona;
  state.appliedZonaFactor = ZONA_WILAYAH[zona] || 1.0;

  const luas = Math.max(1, Number(proj.luasM2) || 36);
  document.getElementById('p-luas').value = String(luas);
  state.appliedLuas = luas;

  const parsedFee = Number(proj.feePersen);
  document.getElementById('p-fee').value = String(Number.isFinite(parsedFee) ? parsedFee : 10);

  document.getElementById('p-judul').value = proj.judulProyek || '';
  document.getElementById('p-klien').value = proj.namaKlien || '';
  document.getElementById('p-lokasi').value = proj.lokasiProyek || '';
  document.getElementById('p-durasi').value = String(proj.durasiHari || 30);
  document.getElementById('p-nomor').value = proj.nomorDokumen || 'RAB/2026/108';
  document.getElementById('p-tanggal').value = proj.tanggal || '';
  document.getElementById('p-garansi').value = String(parseMasaGaransi(proj.masaGaransiHari));
  document.getElementById('p-catatan').value = proj.catatanPenawaran || '';

  for (const reqId of ['p-judul', 'p-klien', 'p-lokasi']) {
    document.getElementById(reqId).classList.remove('input-error');
  }

  renderRabRowsEditor();
  refreshLiveBanner();
  switchView('wizard');
  switchWizardStep(3);
}

function renderHistoryView() {
  const box = document.getElementById('history-container');
  if (state.history.length === 0) {
    box.innerHTML =
      '<div class="card"><p style="color:var(--muted);">Belum ada penawaran yang disimpan. Buat RAB pertama Anda di menu <strong>Susun RAB Baru</strong>.</p></div>';
    return;
  }

  box.innerHTML = '';
  state.history.forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.style.marginBottom = '12px';
    card.innerHTML = `
      <div class="ticket-top">
        <div class="dual-accent-pill">
          <span>${escHtml(proj.luasM2)} m²</span>
          <span>${escHtml(formatRupiah(proj.grandTotal))}</span>
        </div>
        <span class="ref-code-tag">${escHtml(proj.nomorDokumen)}</span>
      </div>
      <div class="ticket-title">${escHtml(proj.judulProyek)}</div>
      <div class="ticket-footer">
        <div class="client-chip">
          <span class="client-avatar">${escHtml(getInitials(proj.namaKlien))}</span>
          <span class="client-chip-text">${escHtml(proj.namaKlien)} · ${escHtml(proj.lokasiProyek)}</span>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary btn-h-open" style="padding:7px 14px;font-size:0.8rem;">Buka & Unduh</button>
          <button type="button" class="btn btn-danger btn-h-del" style="padding:7px 12px;font-size:0.8rem;">Hapus</button>
        </div>
      </div>
    `;
    card.querySelector('.btn-h-open').addEventListener('click', () => loadProjectFromHistory(proj));
    card.querySelector('.btn-h-del').addEventListener('click', () => {
      if (!window.confirm(`Hapus penawaran "${proj.judulProyek}" dari riwayat?`)) return;
      state.history.splice(idx, 1);
      if (state.activeProjectId === proj.id) {
        state.activeProjectId = null;
      }
      saveJson(KEYS.HISTORY, state.history);
      renderHistoryView();
      refreshDashboardAndBadges();
      showToast('Penawaran berhasil dihapus dari riwayat.');
    });
    box.appendChild(card);
  });
}

function renderFavoritesView() {
  const grid = document.getElementById('favorites-grid');
  const favItems = AHSP_LIBRARY_ITEMS.filter((item) => state.favorites.includes(item.id));
  grid.innerHTML = '';
  if (favItems.length === 0) {
    grid.innerHTML =
      '<div class="card" style="grid-column:1/-1;"><p style="color:var(--muted);">Belum ada item favorit. Buka <strong>Pustaka AHSP</strong> lalu simpan harga satuan yang sering Anda pakai.</p></div>';
    return;
  }
  for (const item of favItems) {
    grid.appendChild(createLibraryCardEl(item));
  }
}

// INISIALISASI UTAMA
initTheme();
initNavigation();
initQuickSimulator();
initSettings();
initWizard();
initMaterialTool();
initLibrary();
initAuth();

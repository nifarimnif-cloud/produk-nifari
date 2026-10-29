/**
 * RuangAjar Merdeka — Pengendali Utama Studio Web App Guru
 * Mencakup: Login tervalidasi SHA-256, Dashboard Bento + Kalender Kapsul + Ticket Cards,
 * Wizard 3 Langkah (.docx & .pdf), Penyusun Rapor (.csv),
 * Perpustakaan 120 Item + Modal Detail, Riwayat, Favorit, Pengaturan (+ Impor/Ekspor JSON), & Tema Gelap/Terang.
 */

import { LIBRARY_CATEGORIES, LIBRARY_ITEMS } from './data/library-items.js';
import {
  FASE_MAP,
  LKPD_DOTTED_LINE,
  MODEL_BELAJAR_TEMPLATES,
  buildRaporDescriptionForStudent,
  composeFullModulAjar,
  formatNip,
  generateModulDocxBlob,
  generateModulPdfBlob,
  generateRaporCsvBlob,
  parseTanggalIndonesiaToIso
} from './data/modul-engine.js';

const KEYS = {
  USER: 'ruangajar_user_v1',
  SETTINGS: 'ruangajar_settings_v1',
  HISTORY: 'ruangajar_history_v1',
  FAVORITES: 'ruangajar_favs_v1',
  RAPOR: 'ruangajar_rapor_v1',
  THEME: 'ruangajar_theme_v2'
};

const LIC_SALT = 'nifari-lic-2026::';
const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
const DEV_AGENT_HASHES = new Set([
  '0879ef038bb527ec3a47683ae7ba878d3d8373cfd2935df9454f46c21337c1f4',
  '76074a15c355fc921620a2d6b5900dee5cdec9333292043fd2aaeed9e8c1b3c8',
  'b045c12150811c2963c742595ebc50bc8bbcb84c6e49f8dda2b784c791a71bb8',
  '3514169ccc5cbaafdb8392c6436875f7af1a36e32af4d215ad92bc136e056f46',
  'b2ca50ad803887495c5bb477bcf3103650f6a7cceb65d0b94cc23dc7949fa2a8',
  '5bff8d449f9034af0ada973f5cb13abef116019f31c212885a69edf02a96f1d3',
  'dfdd6bfb2e481e34a17760f77ee39c0fb2ff06105f78ace59933483895c9ccff'
]);
const OFFICIAL_BUYER_HASH = '67ed0c8a62421481fdf872fcd5135e27c771027f17f6c83f298fe8ebbbb62677';
const VALID_ACCESS_HASHES = new Set([CREATOR_MASTER_HASH, OFFICIAL_BUYER_HASH, ...DEV_AGENT_HASHES]);

/**
 * Pure-JS synchronous SHA-256 (UTF-8 -> hex lowercase).
 */
function sha256Hex(input) {
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
  const bytes = new TextEncoder().encode(String(input));
  const bitLen = bytes.length * 8;
  const totalLen = ((bytes.length + 9 + 63) >> 6) << 6;
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
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  for (let off = 0; off < totalLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
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
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
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
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, '0')).join('');
}

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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
  const parts = String(name || 'Guru')
    .replace(/[,.*]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(ibu|bapak|pak|bu|drs|dra|s|m|pd|gr)$/i.test(w));
  if (parts.length === 0) return 'GR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  namaSekolah: 'SD Negeri 1 Nusantara',
  kota: 'Bandung',
  namaGuru: '',
  nipGuru: '-',
  namaKepsek: 'Drs. Hendra Wijaya, M.Pd.',
  nipKepsek: '19740510 199903 1 002',
  tahunAjaran: '2026/2027'
};

const state = {
  user: loadJson(KEYS.USER, null),
  settings: { ...DEFAULT_SETTINGS, ...loadJson(KEYS.SETTINGS, {}) },
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),
  raporList: loadJson(KEYS.RAPOR, []),
  activeLibCategory: 'SEMUA',
  activeModalItem: null,
  currentComposedModul: null,
  lastAutoDraftKey: '',
  isAutoDraft: false,
  editingRaporIdx: null,
  weekOffset: 0,
  selectedDayIso: new Date().toISOString().slice(0, 10)
};

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    t.style.display = 'none';
  }, 2900);
}

// TEMA GELAP (DEFAULT STUDIO) & TERANG
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

// LOGIN & PROFIL PEMBELI (DENGAN VALIDASI SHA-256 BERSALT)
function initAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const nameInput = document.getElementById('login-name');
  const emailInput = document.getElementById('login-email');
  const codeInput = document.getElementById('login-code');

  const clearLoginErrors = () => {
    errEl.style.display = 'none';
    [nameInput, emailInput, codeInput].forEach((el) => el.classList.remove('input-error'));
  };

  [nameInput, emailInput, codeInput].forEach((el) => {
    el.addEventListener('input', () => {
      el.classList.remove('input-error');
      if (errEl.style.display !== 'none') errEl.style.display = 'none';
    });
  });

  const showLoginError = (msg, targetEl) => {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    if (targetEl) {
      targetEl.classList.add('input-error');
      targetEl.focus();
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearLoginErrors();

    const rawName = nameInput.value.trim();
    const rawEmail = emailInput.value.trim();
    const normCode = codeInput.value.trim().toUpperCase();
    const codeHash = normCode ? sha256Hex(LIC_SALT + normCode) : '';

    if (codeHash === CREATOR_MASTER_HASH || DEV_AGENT_HASHES.has(codeHash)) {
      const isDevAgent = DEV_AGENT_HASHES.has(codeHash);
      const finalName = rawName || (isDevAgent ? 'Tim Developer' : 'Nifari (Kreator Utama)');
      const finalEmail = rawEmail || (isDevAgent ? 'dev@ruangajar.id' : 'creator@nifari.id');
      state.user = {
        name: finalName,
        email: finalEmail,
        validHash: codeHash,
        role: 'creator',
        loginAt: new Date().toISOString()
      };
      saveJson(KEYS.USER, state.user);
      if (!state.settings.namaGuru) {
        state.settings.namaGuru = finalName;
        saveJson(KEYS.SETTINGS, state.settings);
      }
      enterApp();
      return;
    }

    if (!rawName) {
      showLoginError('Silakan isi Nama Lengkap & Gelar Bapak/Ibu terlebih dulu.', nameInput);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      showLoginError('Masukkan alamat email aktif yang valid (contoh: ratna@sekolah.sch.id).', emailInput);
      return;
    }
    if (!normCode) {
      showLoginError('Masukkan kode akses pembelian resmi Bapak/Ibu.', codeInput);
      return;
    }
    if (codeHash !== OFFICIAL_BUYER_HASH) {
      showLoginError(
        'Kode akses tidak dikenali. Periksa kembali penulisan kode sesuai bukti pembelian resmi, atau klik tombol di bawah untuk memesan akses.',
        codeInput
      );
      return;
    }

    state.user = {
      name: rawName,
      email: rawEmail,
      validHash: codeHash,
      role: 'buyer',
      loginAt: new Date().toISOString()
    };
    saveJson(KEYS.USER, state.user);

    if (!state.settings.namaGuru) {
      state.settings.namaGuru = rawName;
      saveJson(KEYS.SETTINGS, state.settings);
    }

    enterApp();
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
    appLayout.classList.remove('active');
    loginScreen.style.display = 'flex';
  });

  // Verifikasi ulang sesi tersimpan agar sesi lama/palsu tanpa validHash resmi tidak bisa tembus
  const isStoredSessionValid =
    state.user &&
    typeof state.user.validHash === 'string' &&
    VALID_ACCESS_HASHES.has(state.user.validHash);

  if (isStoredSessionValid) {
    enterApp();
  } else {
    localStorage.removeItem(KEYS.USER);
    state.user = null;
    loginScreen.style.display = 'flex';
    appLayout.classList.remove('active');
  }
}

function enterApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').classList.add('active');
  syncSettingsToInputs();
  renderWeekCalendar();
  refreshDashboardAndBadges();
  updateMobileFabVisibility('dashboard');
}

function updateMobileFabVisibility(viewName) {
  const fab = document.getElementById('mobile-fab-add');
  if (!fab) return;
  const shouldHide = ['wizard', 'rapor', 'settings'].includes(viewName);
  fab.classList.toggle('fab-hidden', shouldHide);
}

// NAVIGASI VIEW, SIDEBAR & BOTTOM BAR HP
function switchView(viewName) {
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
  if (viewName === 'rapor') renderRaporTable();
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

  const openWizardStep1 = () => {
    switchView('wizard');
    switchWizardStep(1);
  };

  document.getElementById('dash-btn-new-modul').addEventListener('click', openWizardStep1);
  document.getElementById('dash-btn-open-rapor').addEventListener('click', () => switchView('rapor'));
  document.getElementById('quick-wizard-btn').addEventListener('click', openWizardStep1);
  document.getElementById('bento-go-wizard').addEventListener('click', openWizardStep1);
  document.getElementById('quick-library-btn').addEventListener('click', () => switchView('library'));
  document.getElementById('bento-go-rapor').addEventListener('click', () => switchView('rapor'));
  document.getElementById('bento-go-fav').addEventListener('click', () => switchView('favorites'));
  document.getElementById('quick-settings-btn').addEventListener('click', () => switchView('settings'));
  document.getElementById('slot-edit-school').addEventListener('click', () => switchView('settings'));
  document.getElementById('slot-plus-modul').addEventListener('click', openWizardStep1);
  document.getElementById('dash-go-history').addEventListener('click', () => switchView('history'));
  document.getElementById('mobile-fab-add').addEventListener('click', openWizardStep1);

  // Search Pill di Dashboard langsung membuka Perpustakaan sesuai kata kunci
  document.getElementById('dash-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('dash-search-input').value.trim();
    document.getElementById('lib-search').value = q;
    switchView('library');
  });
}

// KALENDER KAPSUL PEKAN MENGAJAR (Senin - Sabtu)
function renderWeekCalendar() {
  const strip = document.getElementById('cal-days-strip');
  const monthLabel = document.getElementById('cal-month-label');
  if (!strip || !monthLabel) return;

  const base = new Date();
  base.setDate(base.getDate() + state.weekOffset * 7);
  const dayOfWeek = base.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);

  monthLabel.textContent = `${BULAN_ID[monday.getMonth()]} ${monday.getFullYear()}`;
  const dayLetters = ['S', 'S', 'R', 'K', 'J', 'S'];

  strip.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cal-day-pill ${iso === state.selectedDayIso ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="d-let">${dayLetters[i]}</span>
      <span class="d-num">${String(d.getDate()).padStart(2, '0')}</span>
    `;
    btn.addEventListener('click', () => {
      state.selectedDayIso = iso;
      document.getElementById('f-tanggal').value = iso;
      renderWeekCalendar();
      showToast(`Tanggal dokumen diatur ke ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`);
    });
    strip.appendChild(btn);
  }
}

function initCalendarControls() {
  document.getElementById('cal-prev-week').addEventListener('click', () => {
    state.weekOffset -= 1;
    renderWeekCalendar();
  });
  document.getElementById('cal-next-week').addEventListener('click', () => {
    state.weekOffset += 1;
    renderWeekCalendar();
  });
}

// DASHBOARD BENTO & TICKET CARDS
function refreshDashboardAndBadges() {
  const guruName = state.user?.name || state.settings.namaGuru || 'Bapak/Ibu Guru';
  document.getElementById('greeting-title').textContent = `Halo, ${guruName}`;
  document.getElementById('greeting-school').textContent =
    `${state.settings.namaSekolah || 'Sekolah belum diatur'} · Tahun Pelajaran ${state.settings.tahunAjaran || '2026/2027'}`;

  document.getElementById('stat-modul-count').textContent = String(state.history.length);
  document.getElementById('stat-rapor-count').textContent = String(state.raporList.length);
  document.getElementById('stat-lib-total').textContent = String(LIBRARY_ITEMS.length);
  document.getElementById('stat-fav-total').textContent = String(state.favorites.length);

  document.getElementById('badge-lib-count').textContent = String(LIBRARY_ITEMS.length);
  document.getElementById('badge-history-count').textContent = String(state.history.length);
  document.getElementById('badge-fav-count').textContent = String(state.favorites.length);
  document.getElementById('dash-doc-pill').textContent = String(state.history.length).padStart(2, '0');

  const mobileBadge = document.getElementById('mobile-top-badge');
  if (mobileBadge) {
    if (state.history.length > 0) {
      mobileBadge.textContent = String(state.history.length).padStart(2, '0');
      mobileBadge.title = `${state.history.length} Modul Ajar Tersimpan`;
      mobileBadge.setAttribute('aria-label', `${state.history.length} Modul Ajar Tersimpan`);
    } else {
      mobileBadge.textContent = String(LIBRARY_ITEMS.length);
      mobileBadge.title = `${LIBRARY_ITEMS.length} Koleksi Perpustakaan Guru`;
      mobileBadge.setAttribute('aria-label', `${LIBRARY_ITEMS.length} Koleksi Perpustakaan Guru`);
    }
  }

  const recentBox = document.getElementById('dash-recent-list');
  recentBox.innerHTML = '';

  const chevronCircleSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="10 8 14 12 10 16"/></svg>`;

  if (state.history.length === 0) {
    const starterCard = document.createElement('div');
    starterCard.className = 'ticket-card';
    starterCard.innerHTML = `
      <div class="ticket-top">
        <div class="dual-gold-pill">
          <span>Fase B</span>
          <span>2 JP · 70m</span>
        </div>
        <span class="ref-code-tag">SIAP SUSUN</span>
      </div>
      <div class="ticket-title">IPAS — Perubahan Wujud Benda dalam Kehidupan Sehari-hari</div>
      <div class="ticket-footer">
        <div class="guru-chip">
          <span class="guru-avatar">${escHtml(getInitials(guruName))}</span>
          <span class="guru-chip-text">${escHtml(guruName)}</span>
        </div>
        <button type="button" class="detail-link-btn">Coba Susun ${chevronCircleSvg}</button>
      </div>
    `;
    starterCard.querySelector('button').addEventListener('click', () => {
      document.getElementById('btn-fill-sample-modul').click();
      switchView('wizard');
      switchWizardStep(1);
    });
    recentBox.appendChild(starterCard);

    const raporStarter = document.createElement('div');
    raporStarter.className = 'ticket-card';
    raporStarter.innerHTML = `
      <div class="ticket-top">
        <div class="dual-gold-pill">
          <span>e-Rapor</span>
          <span>CSV Excel</span>
        </div>
        <span class="ref-code-tag">DESKRIPSI</span>
      </div>
      <div class="ticket-title">Generator Kalimat Capaian Kompetensi Rapor Siswa Otomatis</div>
      <div class="ticket-footer">
        <div class="guru-chip">
          <span class="guru-avatar">RP</span>
          <span class="guru-chip-text">${escHtml(state.settings.namaSekolah || 'Semua Kelas')}</span>
        </div>
        <button type="button" class="detail-link-btn">Buka Rapor ${chevronCircleSvg}</button>
      </div>
    `;
    raporStarter.querySelector('button').addEventListener('click', () => switchView('rapor'));
    recentBox.appendChild(raporStarter);
  } else {
    for (const item of state.history.slice(0, 3)) {
      const refCode = `MOD-${String(item.id || '').slice(-5).toUpperCase()}`;
      const shortJp = (item.identitas.alokasiWaktu || '2 JP').split('(')[0].trim();
      const card = document.createElement('div');
      card.className = 'ticket-card';
      card.innerHTML = `
        <div class="ticket-top">
          <div class="dual-gold-pill">
            <span>${escHtml(item.identitas.fase || 'Fase B')}</span>
            <span>${escHtml(shortJp)}</span>
          </div>
          <span class="ref-code-tag">${escHtml(refCode)}</span>
        </div>
        <div class="ticket-title">${escHtml(item.identitas.mapel)} — ${escHtml(item.identitas.topik)}</div>
        <div class="ticket-footer">
          <div class="guru-chip">
            <span class="guru-avatar">${escHtml(getInitials(item.identitas.namaGuru))}</span>
            <span class="guru-chip-text">${escHtml(item.identitas.kelasFase)} · ${escHtml(item.identitas.tanggalDokumen)}</span>
          </div>
          <button type="button" class="detail-link-btn">Buka ${chevronCircleSvg}</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => loadModulFromHistory(item));
      recentBox.appendChild(card);
    }
  }
}

// PENGATURAN SEKOLAH TETAP (+ IMPOR & EKSPOR CADANGAN JSON)
function syncSettingsToInputs() {
  const s = state.settings;
  document.getElementById('s-sekolah').value = s.namaSekolah || '';
  document.getElementById('s-kota').value = s.kota || '';
  document.getElementById('s-guru').value = s.namaGuru || state.user?.name || '';
  document.getElementById('s-nip-guru').value = s.nipGuru || '-';
  document.getElementById('s-kepsek').value = s.namaKepsek || '';
  document.getElementById('s-nip-kepsek').value = s.nipKepsek || '-';
  document.getElementById('s-tahun').value = s.tahunAjaran || '2026/2027';

  document.getElementById('f-sekolah').value = s.namaSekolah || '';
  document.getElementById('f-kota').value = s.kota || '';
  document.getElementById('f-guru').value = s.namaGuru || state.user?.name || '';
  document.getElementById('f-nip-guru').value = s.nipGuru || '-';
  document.getElementById('f-kepsek').value = s.namaKepsek || '';
  document.getElementById('f-nip-kepsek').value = s.nipKepsek || '-';
  document.getElementById('f-tahun').value = s.tahunAjaran || '2026/2027';

  const todayIso = new Date().toISOString().slice(0, 10);
  if (!document.getElementById('f-tanggal').value) {
    document.getElementById('f-tanggal').value = todayIso;
  }
}

function initSettings() {
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings = {
      namaSekolah: document.getElementById('s-sekolah').value.trim(),
      kota: document.getElementById('s-kota').value.trim(),
      namaGuru: document.getElementById('s-guru').value.trim(),
      nipGuru: document.getElementById('s-nip-guru').value.trim() || '-',
      namaKepsek: document.getElementById('s-kepsek').value.trim(),
      nipKepsek: document.getElementById('s-nip-kepsek').value.trim() || '-',
      tahunAjaran: document.getElementById('s-tahun').value.trim() || '2026/2027'
    };
    saveJson(KEYS.SETTINGS, state.settings);
    syncSettingsToInputs();
    refreshDashboardAndBadges();
    showToast('Pengaturan identitas sekolah berhasil disimpan!');
  });

  document.getElementById('btn-export-backup').addEventListener('click', () => {
    const backup = {
      app: 'ruangajar-merdeka',
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      history: state.history,
      favorites: state.favorites,
      raporList: state.raporList
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    triggerBlobDownload(blob, 'cadangan-ruangajar-merdeka.json');
    showToast('File cadangan (.json) berhasil diunduh!');
  });

  const importBtn = document.getElementById('btn-import-backup');
  const importInput = document.getElementById('input-import-backup');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          (!parsed.settings && !Array.isArray(parsed.history) && !Array.isArray(parsed.raporList) && !Array.isArray(parsed.favorites))
        ) {
          throw new Error('Format cadangan tidak sesuai');
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
        if (Array.isArray(parsed.raporList)) {
          state.raporList = parsed.raporList;
          saveJson(KEYS.RAPOR, state.raporList);
        }
        syncSettingsToInputs();
        refreshDashboardAndBadges();
        renderRaporTable();
        renderHistoryView();
        showToast('Cadangan data berhasil dipulihkan!');
      } catch {
        showToast('File cadangan tidak valid. Pilih file .json resmi dari RuangAjar Merdeka.');
      } finally {
        importInput.value = '';
      }
    });
  }
}

// WIZARD 3 LANGKAH MODUL AJAR (VALIDASI LANGKAH 1 + AUTO-SYNC DRAF LANGKAH 2)
function getDraftKey() {
  const kelas = document.getElementById('f-kelas').value.trim();
  const mapel = document.getElementById('f-mapel').value.trim();
  const topik = document.getElementById('f-topik').value.trim();
  const model = document.getElementById('f-model').value.trim();
  return `${kelas}|${mapel}|${topik}|${model}`;
}

function hasAnyStep2Text() {
  return ['f-tp', 'f-pemantik', 'f-icebreaking', 'f-inti', 'f-asesmen'].some(
    (id) => document.getElementById(id).value.trim().length > 0
  );
}

function applyAutoDraftToStep2(silent = false) {
  const draft = composeFullModulAjar({
    ...collectWizardForm(),
    tujuanPembelajaran: '',
    pertanyaanPemantik: '',
    iceBreaking: '',
    kegiatanInti: '',
    asesmen: ''
  });
  document.getElementById('f-tp').value = draft.komponenInti.tujuanPembelajaran;
  document.getElementById('f-pemantik').value = draft.komponenInti.pertanyaanPemantik;
  document.getElementById('f-icebreaking').value = draft.komponenInti.iceBreaking;
  document.getElementById('f-inti').value = draft.komponenInti.inti.langkah
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');
  document.getElementById('f-asesmen').value = draft.komponenInti.asesmen;
  state.lastAutoDraftKey = getDraftKey();
  state.isAutoDraft = true;
  if (!silent) {
    showToast('Draf kegiatan & asesmen berhasil disusun otomatis!');
  }
}

function syncStep2DraftWithCurrentTopic() {
  if (!hasAnyStep2Text()) {
    state.lastAutoDraftKey = '';
    return;
  }
  const currentKey = getDraftKey();
  if (!state.lastAutoDraftKey) {
    state.lastAutoDraftKey = currentKey;
    return;
  }
  if (state.lastAutoDraftKey === currentKey) return;

  if (state.isAutoDraft) {
    applyAutoDraftToStep2(true);
    showToast('Draf kegiatan disinkronkan otomatis sesuai topik & model terbaru.');
  } else {
    const shouldRefresh = window.confirm(
      'Topik/Model berubah. Perbarui draf kegiatan otomatis sesuai topik baru?'
    );
    if (shouldRefresh) {
      applyAutoDraftToStep2(false);
    } else {
      state.lastAutoDraftKey = currentKey;
    }
  }
}

function validateStep1Required() {
  const reqIds = ['f-sekolah', 'f-mapel', 'f-topik', 'f-guru'];
  let firstEmpty = null;
  for (const id of reqIds) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add('input-error');
      if (!firstEmpty) firstEmpty = el;
    } else {
      el.classList.remove('input-error');
    }
  }
  if (firstEmpty) {
    activateWizardUiStep(1);
    firstEmpty.focus();
    showToast('Lengkapi dulu Mata Pelajaran dan Topik Materi di Langkah 1 ya, Bapak/Ibu.');
    return false;
  }
  return true;
}

function activateWizardUiStep(stepNum) {
  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.classList.toggle('active', Number(tab.dataset.wstep) === stepNum);
  }
  for (const pane of document.querySelectorAll('.wiz-pane')) {
    pane.classList.toggle('active', pane.id === `wiz-pane-${stepNum}`);
  }
}

function switchWizardStep(stepNum) {
  if (stepNum >= 2 && !validateStep1Required()) {
    return false;
  }
  if (stepNum >= 2) {
    syncStep2DraftWithCurrentTopic();
  }
  activateWizardUiStep(stepNum);
  if (stepNum === 3) {
    buildAndRenderModulPreview();
  }
  return true;
}

function collectWizardForm() {
  const checkedKarakter = Array.from(
    document.querySelectorAll('#karakter-pills input[type="checkbox"]:checked')
  ).map((c) => c.value);

  return {
    namaSekolah: document.getElementById('f-sekolah').value,
    kelasFase: document.getElementById('f-kelas').value,
    mapel: document.getElementById('f-mapel').value,
    semester: document.getElementById('f-semester').value,
    jumlahJp: Number(document.getElementById('f-jp').value) || 2,
    topik: document.getElementById('f-topik').value,
    namaGuru: document.getElementById('f-guru').value,
    nipGuru: document.getElementById('f-nip-guru').value,
    namaKepsek: document.getElementById('f-kepsek').value,
    nipKepsek: document.getElementById('f-nip-kepsek').value,
    kota: document.getElementById('f-kota').value,
    tanggalDokumen: document.getElementById('f-tanggal').value,
    tahunAjaran: document.getElementById('f-tahun').value,
    modelBelajar: document.getElementById('f-model').value,
    sarana: document.getElementById('f-sarana').value,
    dimensiKarakter: checkedKarakter,
    tujuanPembelajaran: document.getElementById('f-tp').value,
    pertanyaanPemantik: document.getElementById('f-pemantik').value,
    iceBreaking: document.getElementById('f-icebreaking').value,
    kegiatanInti: document.getElementById('f-inti').value,
    asesmen: document.getElementById('f-asesmen').value
  };
}

function buildAndRenderModulPreview() {
  const modul = composeFullModulAjar(collectWizardForm());
  state.currentComposedModul = modul;
  const id = modul.identitas;
  const ki = modul.komponenInti;

  const listHtml = (arr) =>
    `<ol style="padding-left:20px;margin:4px 0 10px;">${arr.map((x) => `<li>${escHtml(x)}</li>`).join('')}</ol>`;

  const rubrikRowsHtml = ki.rubrik
    .map(
      (r) => `
      <tr>
        <td><strong>${escHtml(r.aspek)}</strong></td>
        <td>${escHtml(r.sangatBaik)}</td>
        <td>${escHtml(r.baik)}</td>
        <td>${escHtml(r.cukup)}</td>
        <td>${escHtml(r.perluBimbingan)}</td>
      </tr>`
    )
    .join('');

  const dottedFourHtml = `<div class="lkpd-dotted-line">${LKPD_DOTTED_LINE}<br/>${LKPD_DOTTED_LINE}<br/>${LKPD_DOTTED_LINE}<br/>${LKPD_DOTTED_LINE}</div>`;

  const lkpdTasksHtml = `<ol style="padding-left:20px;margin:6px 0 12px;">${modul.lkpd.tugas
    .map(
      (t) =>
        `<li style="margin-bottom:10px;"><strong>${escHtml(t)}</strong>${dottedFourHtml}</li>`
    )
    .join('')}</ol>`;

  document.getElementById('modul-paper-preview').innerHTML = `
    <h3>MODUL AJAR KURIKULUM MERDEKA</h3>
    <p style="text-align:center;font-weight:700;margin-bottom:14px;">${escHtml(id.namaSekolah.toUpperCase())} · TP ${escHtml(id.tahunAjaran)}</p>

    <div class="sec-head">A. INFORMASI UMUM PERANGKAT AJAR</div>
    <table class="paper-table">
      <tr><th>Nama Penyusun</th><td>${escHtml(id.namaGuru)}${escHtml(formatNip(id.nipGuru, { inline: true }))}</td></tr>
      <tr><th>Satuan Pendidikan</th><td>${escHtml(id.namaSekolah)}</td></tr>
      <tr><th>Kelas / Fase / Semester</th><td>${escHtml(id.kelasFase)} — Semester ${escHtml(id.semester)}</td></tr>
      <tr><th>Mata Pelajaran</th><td>${escHtml(id.mapel)}</td></tr>
      <tr><th>Topik / Materi Pokok</th><td><strong>${escHtml(id.topik)}</strong></td></tr>
      <tr><th>Alokasi Waktu</th><td>${escHtml(id.alokasiWaktu)}</td></tr>
      <tr><th>Model Pembelajaran</th><td>${escHtml(id.modelBelajar)}</td></tr>
      <tr><th>Dimensi Karakter</th><td>${escHtml(id.dimensiKarakter)}</td></tr>
      <tr><th>Sarana & Sumber</th><td>${escHtml(id.sarana)}</td></tr>
    </table>

    <div class="sec-head">B. KOMPONEN INTI PEMBELAJARAN</div>
    <p><strong>1. Tujuan Pembelajaran:</strong><br/>${escHtml(ki.tujuanPembelajaran)}</p>
    <p style="margin-top:8px;"><strong>2. Pemahaman Bermakna:</strong><br/>${escHtml(ki.pemahamanBermakna)}</p>
    <p style="margin-top:8px;white-space:pre-line;"><strong>3. Pertanyaan Pemantik:</strong>\n${escHtml(ki.pertanyaanPemantik)}</p>

    <p style="margin-top:10px;"><strong>4. Langkah-Langkah Kegiatan Pembelajaran — ${escHtml(id.alokasiWaktu)}</strong></p>
    <p><em>a) Kegiatan Pendahuluan (${escHtml(ki.pendahuluan.durasi)})</em></p>
    ${listHtml(ki.pendahuluan.langkah)}
    <p><em>b) Kegiatan Inti — ${escHtml(id.modelBelajar)} (${escHtml(ki.inti.durasi)})</em></p>
    ${listHtml(ki.inti.langkah)}
    <p><em>c) Kegiatan Penutup (${escHtml(ki.penutup.durasi)})</em></p>
    ${listHtml(ki.penutup.langkah)}

    <p style="white-space:pre-line;"><strong>5. Rencana Asesmen & Rubrik Ketercapaian:</strong>\n${escHtml(ki.asesmen)}</p>
    <table class="paper-table" style="margin-top:8px;">
      <thead>
        <tr>
          <th style="width:18%;">Aspek Penilaian</th>
          <th style="width:20.5%;">Sangat Baik (4)</th>
          <th style="width:20.5%;">Baik (3)</th>
          <th style="width:20.5%;">Cukup (2)</th>
          <th style="width:20.5%;">Perlu Bimbingan (1)</th>
        </tr>
      </thead>
      <tbody>${rubrikRowsHtml}</tbody>
    </table>

    <p style="margin-top:8px;"><strong>6. Pengayaan & Remedial:</strong><br/>
      • <em>Pengayaan:</em> ${escHtml(ki.pengayaanRemedial.pengayaan)}<br/>
      • <em>Remedial:</em> ${escHtml(ki.pengayaanRemedial.remedial)}
    </p>

    <p style="margin-top:8px;"><strong>7. Refleksi Pendidik & Peserta Didik:</strong></p>
    <p><em>Refleksi Pendidik:</em></p>
    ${listHtml(ki.refleksi.refleksiGuru)}
    <p><em>Refleksi Peserta Didik:</em></p>
    ${listHtml(ki.refleksi.refleksiMurid)}

    <table style="width:100%;margin-top:20px;font-size:0.84rem;border:none;">
      <tr>
        <td style="width:50%;border:none;color:#0f172a;vertical-align:top;">
          Mengetahui,<br/><strong>Kepala ${escHtml(id.namaSekolah)}</strong><br/><br/><br/>
          <strong><u>${escHtml(id.namaKepsek)}</u></strong><br/>${escHtml(formatNip(id.nipKepsek))}
        </td>
        <td style="width:50%;border:none;color:#0f172a;vertical-align:top;">
          ${escHtml(id.kota)}, ${escHtml(id.tanggalDokumen)}<br/><strong>Guru Pengampu,</strong><br/><br/><br/>
          <strong><u>${escHtml(id.namaGuru)}</u></strong><br/>${escHtml(formatNip(id.nipGuru))}
        </td>
      </tr>
    </table>

    <div class="paper-page-break">Halaman Baru — Lampiran Siap Gandakan untuk Siswa</div>

    <div class="sec-head">C. LAMPIRAN LEMBAR KERJA PESERTA DIDIK (LKPD)</div>
    <p><strong>${escHtml(modul.lkpd.judul)}</strong></p>
    <p style="margin:6px 0 2px;">Nama Kelompok : .................................................................</p>
    <p style="margin:0 0 8px;">Anggota : 1) .................. &nbsp; 2) .................. &nbsp; 3) .................. &nbsp; 4) ..................</p>
    <p><strong>Petunjuk Pengerjaan:</strong></p>
    ${listHtml(modul.lkpd.petunjuk)}
    <p><strong>Tugas Diskusi & Pengamatan:</strong></p>
    ${lkpdTasksHtml}
  `;
}

function saveCurrentModulToHistory(silent = false) {
  if (!state.currentComposedModul) {
    buildAndRenderModulPreview();
  }
  const mod = state.currentComposedModul;
  const existingIdx = state.history.findIndex(
    (h) =>
      h.id === mod.id ||
      (h.identitas.mapel === mod.identitas.mapel &&
        h.identitas.topik === mod.identitas.topik &&
        h.identitas.kelasFase === mod.identitas.kelasFase)
  );
  if (existingIdx !== -1) {
    const keepId = state.history[existingIdx].id;
    state.currentComposedModul = { ...mod, id: keepId };
    state.history[existingIdx] = state.currentComposedModul;
  } else {
    const newId = mod.id || `modul-${Date.now()}`;
    state.currentComposedModul = { ...mod, id: newId };
    state.history.unshift(state.currentComposedModul);
  }
  saveJson(KEYS.HISTORY, state.history);
  refreshDashboardAndBadges();
  if (!silent) showToast('Modul Ajar tersimpan di Riwayat Dokumen!');
}

function initWizard() {
  const kelasSelect = document.getElementById('f-kelas');
  for (const k of Object.keys(FASE_MAP)) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    if (k === 'SD Kelas 4 (Fase B)') opt.selected = true;
    kelasSelect.appendChild(opt);
  }

  const modelSelect = document.getElementById('f-model');
  for (const m of Object.keys(MODEL_BELAJAR_TEMPLATES)) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  }

  // Bersihkan highlight error saat guru mengetik di Langkah 1
  for (const reqId of ['f-sekolah', 'f-mapel', 'f-topik', 'f-guru']) {
    document.getElementById(reqId).addEventListener('input', (e) => {
      e.target.classList.remove('input-error');
    });
  }

  // Tandai jika guru mengetik manual di Langkah 2
  for (const s2Id of ['f-tp', 'f-pemantik', 'f-icebreaking', 'f-inti', 'f-asesmen']) {
    document.getElementById(s2Id).addEventListener('input', () => {
      if (hasAnyStep2Text()) {
        state.isAutoDraft = false;
        if (!state.lastAutoDraftKey) {
          state.lastAutoDraftKey = getDraftKey();
        }
      } else {
        state.lastAutoDraftKey = '';
        state.isAutoDraft = false;
      }
    });
  }

  // Jika Model Belajar diganti di Langkah 2 ketika draf sudah terisi, sinkronkan juga
  modelSelect.addEventListener('change', () => {
    if (hasAnyStep2Text()) {
      syncStep2DraftWithCurrentTopic();
    }
  });

  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.addEventListener('click', () => switchWizardStep(Number(tab.dataset.wstep)));
  }

  document.getElementById('btn-to-wstep-2').addEventListener('click', () => switchWizardStep(2));
  document.getElementById('btn-back-wstep-1').addEventListener('click', () => switchWizardStep(1));
  document.getElementById('btn-to-wstep-3').addEventListener('click', () => switchWizardStep(3));
  document.getElementById('btn-back-wstep-2').addEventListener('click', () => switchWizardStep(2));

  document.getElementById('btn-fill-sample-modul').addEventListener('click', () => {
    document.getElementById('f-kelas').value = 'SD Kelas 4 (Fase B)';
    document.getElementById('f-mapel').value = 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    document.getElementById('f-topik').value = 'Perubahan Wujud Benda dalam Kehidupan Sehari-hari';
    document.getElementById('f-jp').value = '2';
    document.getElementById('f-sarana').value = 'Es batu, gelas bening, air hangat, buku IPAS Kelas 4, dan LKPD kelompok';
    ['f-sekolah', 'f-mapel', 'f-topik', 'f-guru'].forEach((id) =>
      document.getElementById(id).classList.remove('input-error')
    );
    if (hasAnyStep2Text() && state.isAutoDraft) {
      applyAutoDraftToStep2(true);
    }
    showToast('Contoh materi terisi! Silakan lanjut ke Langkah 2 atau 3.');
  });

  document.getElementById('btn-autofill-komponen').addEventListener('click', () => {
    if (!validateStep1Required()) return;
    applyAutoDraftToStep2(false);
  });

  const slugFile = (mod) =>
    `Modul-Ajar-${mod.identitas.mapel}-${mod.identitas.topik}`
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 65);

  document.getElementById('btn-download-docx').addEventListener('click', () => {
    if (!validateStep1Required()) return;
    buildAndRenderModulPreview();
    saveCurrentModulToHistory(true);
    const blob = generateModulDocxBlob(state.currentComposedModul);
    triggerBlobDownload(blob, `${slugFile(state.currentComposedModul)}.docx`);
    showToast('File Word (.docx) berhasil diunduh!');
  });

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    if (!validateStep1Required()) return;
    buildAndRenderModulPreview();
    saveCurrentModulToHistory(true);
    const blob = generateModulPdfBlob(state.currentComposedModul);
    triggerBlobDownload(blob, `${slugFile(state.currentComposedModul)}.pdf`);
    showToast('File PDF Resmi (.pdf) berhasil diunduh!');
  });

  document.getElementById('btn-save-history').addEventListener('click', () => {
    if (!validateStep1Required()) return;
    buildAndRenderModulPreview();
    saveCurrentModulToHistory(false);
  });

  document.getElementById('btn-handoff-ai').addEventListener('click', async () => {
    const m = state.currentComposedModul || composeFullModulAjar(collectWizardForm());
    const promptText = `Buatkan 10 soal latihan kontekstual lengkap dengan kunci jawaban dan pembahasan singkat untuk peserta didik ${m.identitas.kelasFase}, Mata Pelajaran ${m.identitas.mapel}, Topik "${m.identitas.topik}". Gunakan bahasa Indonesia yang mudah dipahami siswa.`;
    try {
      await navigator.clipboard.writeText(promptText);
      showToast('Prompt berhasil disalin! Tempelkan di ChatGPT atau Gemini.');
    } catch {
      showToast('Prompt siap dipakai.');
    }
  });
}

// PENYUSUN RAPOR CEPAT (DENGAN EDIT, HAPUS, SKOR 0 VALID & KONFIRMASI)
function resetRaporEditState() {
  state.editingRaporIdx = null;
  const addBtn = document.getElementById('btn-add-rapor-row');
  const cancelBtn = document.getElementById('btn-cancel-rapor-edit');
  if (addBtn) addBtn.textContent = '+ Buat & Tambahkan Kalimat Rapor';
  if (cancelBtn) cancelBtn.style.display = 'none';
}

function renderRaporTable() {
  const wrap = document.getElementById('rapor-table-wrap');
  if (state.raporList.length === 0) {
    wrap.innerHTML =
      '<p style="color:var(--muted);font-size:0.88rem;">Belum ada daftar siswa. Tambahkan di atas atau klik <strong>Muat Contoh 3 Siswa</strong>.</p>';
    return;
  }

  let html = `<table class="rapor-table">
    <thead>
      <tr>
        <th style="width:45px;">No</th>
        <th style="width:175px;">Nama Siswa</th>
        <th style="width:70px;">Nilai</th>
        <th>Kalimat Deskripsi Capaian e-Rapor</th>
        <th style="width:190px;">Aksi</th>
      </tr>
    </thead>
    <tbody id="rapor-tbody">`;

  state.raporList.forEach((row, idx) => {
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escHtml(row.nama)}</strong></td>
        <td><span class="cat-tag">${escHtml(row.nilai)}</span></td>
        <td>${escHtml(row.deskripsi)}</td>
        <td>
          <div class="btn-row" style="gap:6px;">
            <button type="button" class="btn btn-secondary btn-copy-rapor" data-idx="${idx}" style="padding:6px 10px;font-size:0.75rem;">Salin</button>
            <button type="button" class="btn btn-secondary btn-rapor-edit" data-idx="${idx}" style="padding:6px 10px;font-size:0.75rem;">Edit</button>
            <button type="button" class="btn btn-danger btn-rapor-del" data-idx="${idx}" style="padding:6px 10px;font-size:0.75rem;">Hapus</button>
          </div>
        </td>
      </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;

  for (const btn of wrap.querySelectorAll('.btn-copy-rapor')) {
    btn.addEventListener('click', () => {
      const item = state.raporList[Number(btn.dataset.idx)];
      if (item) {
        navigator.clipboard?.writeText(item.deskripsi).catch(() => {});
        showToast(`Deskripsi ${item.nama} disalin!`);
      }
    });
  }

  for (const btn of wrap.querySelectorAll('.btn-rapor-edit')) {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const item = state.raporList[idx];
      if (!item) return;
      state.editingRaporIdx = idx;
      document.getElementById('r-nama').value = item.nama || '';
      document.getElementById('r-nilai').value = String(item.nilai ?? 80);
      document.getElementById('r-capai').value = item.tpTercapai ?? item.deskripsi ?? '';
      document.getElementById('r-bimbing').value = item.tpBimbingan ?? '';
      document.getElementById('btn-add-rapor-row').textContent = 'Simpan Perubahan Siswa';
      document.getElementById('btn-cancel-rapor-edit').style.display = 'inline-flex';
      document.getElementById('r-nama').focus();
      showToast(`Mengedit data rapor ${item.nama}.`);
    });
  }

  for (const btn of wrap.querySelectorAll('.btn-rapor-del')) {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      const removed = state.raporList[idx];
      if (!removed) return;
      state.raporList.splice(idx, 1);
      if (state.editingRaporIdx === idx) {
        resetRaporEditState();
      } else if (state.editingRaporIdx !== null && state.editingRaporIdx > idx) {
        state.editingRaporIdx -= 1;
      }
      saveJson(KEYS.RAPOR, state.raporList);
      renderRaporTable();
      refreshDashboardAndBadges();
      showToast(`Data rapor ${removed.nama} dihapus.`);
    });
  }
}

function initRaporTool() {
  document.getElementById('btn-add-rapor-row').addEventListener('click', () => {
    const nama = document.getElementById('r-nama').value.trim();
    if (!nama) {
      document.getElementById('r-nama').focus();
      showToast('Isi nama peserta didik terlebih dulu.');
      return;
    }
    const rawNilaiStr = document.getElementById('r-nilai').value.trim();
    const parsed = rawNilaiStr === '' ? NaN : Number(rawNilaiStr);
    const n = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 80;

    const row = buildRaporDescriptionForStudent({
      nama,
      nilai: n,
      tpTercapai: document.getElementById('r-capai').value,
      tpBimbingan: document.getElementById('r-bimbing').value
    });

    if (state.editingRaporIdx !== null && state.raporList[state.editingRaporIdx]) {
      state.raporList[state.editingRaporIdx] = row;
      resetRaporEditState();
      showToast(`Data rapor ${row.nama} berhasil diperbarui!`);
    } else {
      state.raporList.push(row);
      showToast('Kalimat rapor siswa berhasil ditambahkan!');
    }

    saveJson(KEYS.RAPOR, state.raporList);
    document.getElementById('r-nama').value = '';
    renderRaporTable();
    refreshDashboardAndBadges();
  });

  document.getElementById('btn-cancel-rapor-edit').addEventListener('click', () => {
    resetRaporEditState();
    document.getElementById('r-nama').value = '';
    showToast('Mode edit dibatalkan.');
  });

  document.getElementById('btn-sample-rapor').addEventListener('click', () => {
    if (
      state.raporList.length > 0 &&
      !window.confirm('Daftar siswa saat ini tidak kosong. Ganti dengan contoh 3 siswa?')
    ) {
      return;
    }
    resetRaporEditState();
    const samples = [
      buildRaporDescriptionForStudent({
        nama: 'Alya Putri Ramadhani',
        nilai: 92,
        tpTercapai: 'mengidentifikasi perubahan wujud benda melalui percobaan sederhana secara teliti',
        tpBimbingan: ''
      }),
      buildRaporDescriptionForStudent({
        nama: 'Bagas Pratama Wijaya',
        nilai: 83,
        tpTercapai: 'memahami contoh mencair dan menguap dalam kehidupan sehari-hari',
        tpBimbingan: 'menuliskan simpulan hubungan kalor dan wujud benda secara runtut'
      }),
      buildRaporDescriptionForStudent({
        nama: 'Citra Kirana Sari',
        nilai: 76,
        tpTercapai: 'mengikuti langkah pengamatan kelompok dengan antusias',
        tpBimbingan: 'membedakan peristiwa menyublim dan mengembun melalui latihan contoh nyata'
      })
    ];
    state.raporList = samples;
    saveJson(KEYS.RAPOR, state.raporList);
    renderRaporTable();
    refreshDashboardAndBadges();
    showToast('Contoh 3 deskripsi rapor siswa berhasil dimuat!');
  });

  document.getElementById('btn-export-rapor-csv').addEventListener('click', () => {
    if (state.raporList.length === 0) {
      showToast('Tambahkan minimal 1 siswa sebelum mengunduh tabel CSV.');
      return;
    }
    const mapel = document.getElementById('r-mapel').value.trim() || 'Mata-Pelajaran';
    const blob = generateRaporCsvBlob(state.raporList, mapel);
    triggerBlobDownload(blob, `Rekap-Deskripsi-Rapor-${mapel.replace(/\s+/g, '-')}.csv`);
    showToast('Tabel Rapor (.csv untuk Excel) berhasil diunduh!');
  });

  document.getElementById('btn-clear-rapor').addEventListener('click', () => {
    if (state.raporList.length === 0) {
      showToast('Daftar rapor sudah kosong.');
      return;
    }
    if (!window.confirm('Bersihkan seluruh daftar siswa di tabel rapor ini?')) {
      return;
    }
    resetRaporEditState();
    state.raporList = [];
    saveJson(KEYS.RAPOR, state.raporList);
    renderRaporTable();
    refreshDashboardAndBadges();
    showToast('Daftar rapor berhasil dibersihkan.');
  });
}

// PERPUSTAKAAN 120 ITEM & MODAL DETAIL (+ A11Y KEYBOARD & ESCAPE)
function initLibrary() {
  const chipsWrap = document.getElementById('lib-category-chips');
  const allCats = ['SEMUA', ...LIBRARY_CATEGORIES];

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
  document.getElementById('lib-jenjang').addEventListener('change', renderLibraryGrid);

  document.getElementById('m-btn-close').addEventListener('click', closeItemModal);
  document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') closeItemModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('item-modal').classList.contains('active')) {
        closeItemModal();
      }
      closeMobileSidebar();
    }
  });

  document.getElementById('m-btn-copy').addEventListener('click', () => {
    if (!state.activeModalItem) return;
    navigator.clipboard?.writeText(state.activeModalItem.example).catch(() => {});
    showToast('Teks contoh berhasil disalin!');
  });

  document.getElementById('m-btn-fav').addEventListener('click', () => {
    if (!state.activeModalItem) return;
    const id = state.activeModalItem.id;
    const idx = state.favorites.indexOf(id);
    if (idx === -1) {
      state.favorites.push(id);
      showToast('Ditambahkan ke Koleksi Favorit!');
    } else {
      state.favorites.splice(idx, 1);
      showToast('Dihapus dari Koleksi Favorit.');
    }
    saveJson(KEYS.FAVORITES, state.favorites);
    updateModalFavButton();
    refreshDashboardAndBadges();
    if (document.getElementById('view-favorites').classList.contains('active')) {
      renderFavoritesView();
    }
    if (document.getElementById('view-library').classList.contains('active')) {
      renderLibraryGrid();
    }
  });

  document.getElementById('m-btn-use').addEventListener('click', () => {
    const item = state.activeModalItem;
    if (!item) return;
    closeItemModal();

    if (item.wizardField === 'catatanRapor') {
      switchView('rapor');
      const ex = item.example.trim();
      if (/^Perlu\b/i.test(ex)) {
        document.getElementById('r-bimbing').value = ex;
      } else {
        document.getElementById('r-capai').value = ex;
        if (/[.!]\s+Perlu\b/.test(ex)) {
          document.getElementById('r-bimbing').value = '';
        }
      }
      document.getElementById('r-nama').focus();
      showToast('Dimasukkan ke Penyusun Rapor! Isi nama siswa lalu klik Buat.');
      return;
    }

    const fieldMap = {
      tujuanPembelajaran: 'f-tp',
      pertanyaanPemantik: 'f-pemantik',
      iceBreaking: 'f-icebreaking',
      kegiatanInti: 'f-inti',
      asesmen: 'f-asesmen'
    };
    const targetInputId = fieldMap[item.wizardField] || 'f-tp';
    document.getElementById(targetInputId).value = item.example;
    state.isAutoDraft = false;
    state.lastAutoDraftKey = getDraftKey();

    switchView('wizard');
    if (switchWizardStep(2)) {
      showToast(`"${item.title}" dimasukkan ke Langkah 2 Wizard!`);
    }
  });
}

function renderLibraryGrid() {
  const grid = document.getElementById('library-grid');
  const q = document.getElementById('lib-search').value.trim().toLowerCase();
  const jenjang = document.getElementById('lib-jenjang').value;

  const filtered = LIBRARY_ITEMS.filter((item) => {
    const matchCat = state.activeLibCategory === 'SEMUA' || item.category === state.activeLibCategory;
    const matchJenjang =
      jenjang === 'ALL' || item.jenjang === 'Semua Jenjang' || item.jenjang === jenjang;
    const matchQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.example.toLowerCase().includes(q);
    return matchCat && matchJenjang && matchQuery;
  });

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML =
      '<div class="card" style="grid-column:1/-1;"><p style="color:var(--muted);">Tidak ditemukan item yang cocok dengan kata kunci tersebut.</p></div>';
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
  el.innerHTML = `
    <div class="lib-meta">
      <span class="cat-tag">${escHtml(item.category)}</span>
      <span class="jenjang-tag">${isFav ? 'Tersimpan · ' : ''}${escHtml(item.jenjang)}</span>
    </div>
    <h3>${escHtml(item.title)}</h3>
    <p>${escHtml(item.summary)}</p>
    <div class="lib-card-foot">
      <span>Contoh &amp; Tips Kelas</span>
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
  document.getElementById('m-jenjang').textContent = item.jenjang;
  document.getElementById('m-title').textContent = item.title;
  document.getElementById('m-explanation').textContent = item.explanation;
  document.getElementById('m-example').textContent = item.example;
  document.getElementById('m-tips').textContent = item.tips;
  document.getElementById('m-btn-use').textContent =
    item.wizardField === 'catatanRapor'
      ? 'Masukkan ke Penyusun Rapor'
      : 'Masukkan ke Wizard Modul Ajar';
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

// RIWAYAT & FAVORIT (RESTORE PENUH SEMUA FIELD WIZARD)
function loadModulFromHistory(mod) {
  const id = mod.identitas || {};
  const ki = mod.komponenInti || {};

  document.getElementById('f-sekolah').value = id.namaSekolah || state.settings.namaSekolah || '';
  document.getElementById('f-kelas').value = FASE_MAP[id.kelasFase] ? id.kelasFase : 'SD Kelas 4 (Fase B)';
  document.getElementById('f-mapel').value = id.mapel || '';
  document.getElementById('f-semester').value = id.semester || 'Ganjil';

  const parsedJp = Number(id.jumlahJp) || parseInt(id.alokasiWaktu, 10) || 2;
  document.getElementById('f-jp').value = String(parsedJp);

  document.getElementById('f-topik').value = id.topik || '';
  document.getElementById('f-guru').value = id.namaGuru || state.settings.namaGuru || '';
  document.getElementById('f-nip-guru').value = id.nipGuru || '-';
  document.getElementById('f-kepsek').value = id.namaKepsek || state.settings.namaKepsek || '';
  document.getElementById('f-nip-kepsek').value = id.nipKepsek || '-';
  document.getElementById('f-kota').value = id.kota || state.settings.kota || '';

  const restoredIso =
    id.tanggalIso ||
    parseTanggalIndonesiaToIso(id.tanggalDokumen) ||
    new Date().toISOString().slice(0, 10);
  document.getElementById('f-tanggal').value = restoredIso;
  document.getElementById('f-tahun').value = id.tahunAjaran || '2026/2027';

  // Pulihkan Model Belajar berdasarkan key atau label
  const resolvedModelKey =
    (id.modelKey && MODEL_BELAJAR_TEMPLATES[id.modelKey] && id.modelKey) ||
    Object.keys(MODEL_BELAJAR_TEMPLATES).find(
      (k) => k === id.modelBelajar || MODEL_BELAJAR_TEMPLATES[k].label === id.modelBelajar
    ) ||
    'Problem Based Learning (PBL)';
  document.getElementById('f-model').value = resolvedModelKey;

  document.getElementById('f-sarana').value = id.sarana || '';

  // Pulihkan checkbox Dimensi Karakter
  const karakterArr = Array.isArray(id.dimensiKarakterList)
    ? id.dimensiKarakterList
    : String(id.dimensiKarakter || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  for (const cb of document.querySelectorAll('#karakter-pills input[type="checkbox"]')) {
    cb.checked = karakterArr.some((k) => k.toLowerCase() === cb.value.toLowerCase());
  }

  document.getElementById('f-tp').value = ki.tujuanPembelajaran || '';
  document.getElementById('f-pemantik').value = ki.pertanyaanPemantik || '';
  document.getElementById('f-icebreaking').value = ki.iceBreaking || '';
  document.getElementById('f-inti').value = Array.isArray(ki.inti?.langkah)
    ? ki.inti.langkah.join('\n')
    : '';
  document.getElementById('f-asesmen').value = ki.asesmen || '';

  state.lastAutoDraftKey = getDraftKey();
  state.isAutoDraft = false;
  state.currentComposedModul = mod;

  switchView('wizard');
  switchWizardStep(3);
}

function renderHistoryView() {
  const box = document.getElementById('history-container');
  if (state.history.length === 0) {
    box.innerHTML =
      '<div class="card"><p style="color:var(--muted);">Belum ada riwayat Modul Ajar. Buat modul pertamamu di menu <strong>Buat Modul Ajar</strong>.</p></div>';
    return;
  }

  box.innerHTML = '';
  state.history.forEach((mod, idx) => {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.style.marginBottom = '12px';
    card.innerHTML = `
      <div class="ticket-top">
        <div class="dual-gold-pill">
          <span>${escHtml(mod.identitas.kelasFase)}</span>
          <span>${escHtml(mod.identitas.semester)}</span>
        </div>
        <span class="ref-code-tag">${escHtml(mod.identitas.tanggalDokumen)}</span>
      </div>
      <div class="ticket-title">${escHtml(mod.identitas.mapel)} — ${escHtml(mod.identitas.topik)}</div>
      <div class="ticket-footer">
        <div class="guru-chip">
          <span class="guru-avatar">${escHtml(getInitials(mod.identitas.namaGuru))}</span>
          <span class="guru-chip-text">${escHtml(mod.identitas.namaSekolah)}</span>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary btn-h-open" style="padding:7px 14px;font-size:0.8rem;">Buka & Unduh</button>
          <button type="button" class="btn btn-danger btn-h-del" style="padding:7px 12px;font-size:0.8rem;">Hapus</button>
        </div>
      </div>
    `;
    card.querySelector('.btn-h-open').addEventListener('click', () => loadModulFromHistory(mod));
    card.querySelector('.btn-h-del').addEventListener('click', () => {
      if (
        !window.confirm(
          `Hapus Modul Ajar "${mod.identitas.mapel} — ${mod.identitas.topik}" dari Riwayat Dokumen?`
        )
      ) {
        return;
      }
      state.history.splice(idx, 1);
      saveJson(KEYS.HISTORY, state.history);
      renderHistoryView();
      refreshDashboardAndBadges();
      showToast('Modul Ajar dihapus dari riwayat.');
    });
    box.appendChild(card);
  });
}

function renderFavoritesView() {
  const grid = document.getElementById('favorites-grid');
  const favItems = LIBRARY_ITEMS.filter((item) => state.favorites.includes(item.id));
  grid.innerHTML = '';

  if (favItems.length === 0) {
    grid.innerHTML =
      '<div class="card" style="grid-column:1/-1;"><p style="color:var(--muted);">Belum ada item favorit. Buka <strong>Perpustakaan Guru</strong> lalu klik Simpan Favorit pada item yang sering kamu pakai.</p></div>';
    return;
  }
  for (const item of favItems) {
    grid.appendChild(createLibraryCardEl(item));
  }
}

// JALANKAN SEMUA INISIALISASI
initTheme();
initNavigation();
initCalendarControls();
initSettings();
initWizard();
initRaporTool();
initLibrary();
initAuth();

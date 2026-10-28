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
  generateSpkDocxBlob
} from './data/rab-engine.js';

const KEYS = {
  USER: 'rancangrab_user_v1',
  SETTINGS: 'rancangrab_settings_v1',
  HISTORY: 'rancangrab_history_v1',
  FAVORITES: 'rancangrab_favs_v1',
  THEME: 'rancangrab_theme_v1'
};

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

const state = {
  user: loadJson(KEYS.USER, null),
  settings: loadJson(KEYS.SETTINGS, {
    namaUsaha: 'CV Karya Mandiri Bangunan',
    namaPelaksana: 'Hendra Pratama',
    teleponUsaha: '0812-8899-7766',
    kota: 'Bekasi',
    rekeningPembayaran: 'BCA 5420-8899-11 a.n. Hendra Pratama'
  }),
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),
  selectedPresetId: 'bangun-rumah-1lt',
  activeRows: [],
  activeProjectId: null,
  activeLibCategory: 'SEMUA',
  activeModalItem: null
};

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    t.style.display = 'none';
  }, 2600);
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

// LOGIN PEMBELI
function initAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');

  document.getElementById('btn-demo-fill').addEventListener('click', () => {
    document.getElementById('login-name').value = 'Hendra Pratama — Karya Mandiri Bangunan';
    document.getElementById('login-email').value = 'hendra@karyamandiri.id';
    document.getElementById('login-code').value = 'RAB-PRO-2026';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const email = document.getElementById('login-email').value.trim();
    const code = document.getElementById('login-code').value.trim();

    if (code.length < 4) {
      errEl.textContent = 'Masukkan kode akses pembelian yang valid (minimal 4 karakter).';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    state.user = { name, email, code, loginAt: new Date().toISOString() };
    saveJson(KEYS.USER, state.user);

    if (name.includes('—')) {
      const [pelaksana, usaha] = name.split('—').map((s) => s.trim());
      if (pelaksana) state.settings.namaPelaksana = pelaksana;
      if (usaha) state.settings.namaUsaha = usaha;
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

  if (state.user) {
    enterApp();
  } else {
    loginScreen.style.display = 'flex';
    appLayout.classList.remove('active');
  }
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
}

// NAVIGASI VIEW
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

  document.getElementById('dash-btn-new-rab').addEventListener('click', () => switchView('wizard'));
  document.getElementById('dash-btn-open-material').addEventListener('click', () => switchView('material'));
  document.getElementById('dash-chevron-wizard').addEventListener('click', () => switchView('wizard'));
  document.getElementById('bento-go-wizard').addEventListener('click', () => switchView('wizard'));
  document.getElementById('bento-go-history').addEventListener('click', () => switchView('history'));
  document.getElementById('bento-go-library').addEventListener('click', () => switchView('library'));
  document.getElementById('bento-go-fav').addEventListener('click', () => switchView('favorites'));
  document.getElementById('dash-go-history').addEventListener('click', () => switchView('history'));
  document.getElementById('mobile-fab-add').addEventListener('click', () => switchView('wizard'));

  document.getElementById('dash-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('dash-search-input').value.trim();
    document.getElementById('lib-search').value = q;
    switchView('library');
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
    loadPresetIntoWizard(presetId, true);
    switchView('wizard');
    switchWizardStep(2);
    showToast('Simulasi berhasil dibuka menjadi rincian RAB lengkap!');
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
  const pelaksana = state.settings.namaPelaksana || state.user?.name || 'Pelaksana Proyek';
  const usaha = state.settings.namaUsaha || 'Kontraktor Mandiri';
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
  document.getElementById('mobile-top-badge').textContent =
    state.history.length > 0 ? String(state.history.length).padStart(2, '0') : String(AHSP_LIBRARY_ITEMS.length);

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
        switchWizardStep(2);
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

// PENGATURAN PROFIL USAHA
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
      kota: document.getElementById('s-kota').value.trim(),
      rekeningPembayaran: document.getElementById('s-rekening').value.trim()
    };
    saveJson(KEYS.SETTINGS, state.settings);
    refreshDashboardAndBadges();
    showToast('Profil & kop surat usaha berhasil disimpan!');
  });

  document.getElementById('btn-export-backup').addEventListener('click', () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), settings: state.settings, history: state.history, favorites: state.favorites }, null, 2)],
      { type: 'application/json' }
    );
    triggerBlobDownload(blob, 'cadangan-rancangrab-studio.json');
  });
}

// WIZARD 3 LANGKAH RAB
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

function collectCurrentProject() {
  return {
    id: state.activeProjectId || `rab-${Date.now()}`,
    judulProyek: document.getElementById('p-judul').value.trim() || 'Pekerjaan Konstruksi & Renovasi',
    namaKlien: document.getElementById('p-klien').value.trim() || 'Bapak Budi Santoso',
    lokasiProyek: document.getElementById('p-lokasi').value.trim() || 'Perumahan Griya Asri, Bekasi',
    zona: document.getElementById('p-zona').value,
    luasM2: Number(document.getElementById('p-luas').value) || 36,
    feePersen: Number(document.getElementById('p-fee').value ?? 10),
    durasiHari: Number(document.getElementById('p-durasi').value) || 30,
    nomorDokumen: document.getElementById('p-nomor').value.trim() || 'RAB/2026/108',
    tanggal: document.getElementById('p-tanggal').value,
    masaGaransiHari: Number(document.getElementById('p-garansi').value) || 60,
    catatanPenawaran: document.getElementById('p-catatan').value.trim(),
    namaUsaha: state.settings.namaUsaha,
    namaPelaksana: state.settings.namaPelaksana,
    teleponUsaha: state.settings.teleponUsaha,
    kota: state.settings.kota,
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
  }

  const luas = Number(document.getElementById('p-luas').value) || preset.defaultLuas;
  const zona = document.getElementById('p-zona').value;
  const mult = ZONA_WILAYAH[zona] || 1.0;

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
  container.innerHTML = '';

  state.activeRows.forEach((row, idx) => {
    const el = document.createElement('div');
    el.className = 'rab-row-card';
    const rowSubtotal = Math.round((Number(row.volume) || 0) * ((Number(row.hargaMaterial) || 0) + (Number(row.hargaUpah) || 0)));

    el.innerHTML = `
      <div class="row-uraian-wrap">
        <input type="text" class="inp-uraian" value="${escHtml(row.uraian)}" aria-label="Uraian Pekerjaan" />
      </div>
      <div>
        <input type="number" step="0.1" class="inp-vol" value="${escHtml(row.volume)}" aria-label="Volume" title="Volume" />
      </div>
      <div>
        <input type="text" class="inp-sat" value="${escHtml(row.satuan)}" aria-label="Satuan" title="Satuan" />
      </div>
      <div>
        <input type="number" step="500" class="inp-mat" value="${escHtml(row.hargaMaterial)}" aria-label="Harga Material" title="Harga Material per Satuan" />
      </div>
      <div>
        <input type="number" step="500" class="inp-upah" value="${escHtml(row.hargaUpah)}" aria-label="Upah Tukang" title="Upah Tukang per Satuan" />
      </div>
      <div class="row-foot-wrap">
        <div class="rab-row-sub">${formatRupiah(rowSubtotal)}</div>
      </div>
      <div>
        <button type="button" class="rab-del-btn" title="Hapus Baris" aria-label="Hapus Baris">×</button>
      </div>
    `;

    const syncRow = () => {
      row.uraian = el.querySelector('.inp-uraian').value;
      row.volume = Number(el.querySelector('.inp-vol').value) || 0;
      row.satuan = el.querySelector('.inp-sat').value || 'ls';
      row.hargaMaterial = Number(el.querySelector('.inp-mat').value) || 0;
      row.hargaUpah = Number(el.querySelector('.inp-upah').value) || 0;
      const newSub = Math.round(row.volume * (row.hargaMaterial + row.hargaUpah));
      el.querySelector('.rab-row-sub').textContent = formatRupiah(newSub);
      refreshLiveBanner();
    };

    for (const inp of el.querySelectorAll('input')) {
      inp.addEventListener('input', syncRow);
    }

    el.querySelector('.rab-del-btn').addEventListener('click', () => {
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

  document.getElementById('rab-paper-preview').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f97316;padding-bottom:10px;margin-bottom:12px;gap:10px;flex-wrap:wrap;">
      <div>
        <strong style="font-size:1.05rem;color:#0f172a;">${escHtml((proj.namaUsaha || 'PELAKSANA PROYEK').toUpperCase())}</strong><br/>
        <span style="font-size:0.78rem;color:#475569;">Pelaksana: ${escHtml(proj.namaPelaksana)} · WA: ${escHtml(proj.teleponUsaha)} · ${escHtml(proj.kota)}</span>
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

    <p style="font-size:0.8rem;color:#334155;"><strong>Catatan & Ketentuan:</strong> ${escHtml(proj.catatanPenawaran)}</p>
  `;
}

function saveCurrentProjectToHistory(silent = false) {
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
}

function initWizard() {
  const zonaSel = document.getElementById('p-zona');
  for (const z of Object.keys(ZONA_WILAYAH)) {
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z;
    zonaSel.appendChild(opt);
  }

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
      loadPresetIntoWizard(p.id, false);
      showToast(`Paket "${p.label}" dimuat otomatis!`);
    });
    tilesBox.appendChild(btn);
  }

  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.addEventListener('click', () => switchWizardStep(Number(tab.dataset.wstep)));
  }

  document.getElementById('btn-reapply-preset').addEventListener('click', () => {
    loadPresetIntoWizard(state.selectedPresetId, true);
    showToast('Volume seluruh item berhasil dihitung ulang mengikuti luas m²!');
  });

  document.getElementById('p-fee').addEventListener('input', refreshLiveBanner);

  document.getElementById('btn-to-wstep-2').addEventListener('click', () => switchWizardStep(2));
  document.getElementById('btn-back-wstep-1').addEventListener('click', () => switchWizardStep(1));
  document.getElementById('btn-to-wstep-3').addEventListener('click', () => switchWizardStep(3));
  document.getElementById('btn-back-wstep-2').addEventListener('click', () => switchWizardStep(2));

  document.getElementById('btn-fill-sample-rab').addEventListener('click', () => {
    document.getElementById('p-klien').value = 'Bapak Budi Santoso';
    document.getElementById('p-lokasi').value = 'Cluster Harmoni Indah Blok B12, Bekasi';
    document.getElementById('p-luas').value = '45';
    document.getElementById('p-judul').value = 'Bangun Rumah 1 Lantai Tipe 45 Minimalis';
    loadPresetIntoWizard('bangun-rumah-1lt', true);
    showToast('Contoh proyek klien Tipe 45 siap dicek!');
  });

  document.getElementById('btn-add-custom-row').addEventListener('click', () => {
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
      .slice(0, 60);

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateRabPdfBlob(proj, sum);
    triggerBlobDownload(blob, `Penawaran-RAB-${makeFileSlug(proj)}.pdf`);
    showToast('PDF Surat Penawaran Resmi berhasil diunduh!');
  });

  document.getElementById('btn-download-xlsx').addEventListener('click', () => {
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateRabXlsxBlob(proj, sum);
    triggerBlobDownload(blob, `Rincian-RAB-${makeFileSlug(proj)}.xlsx`);
    showToast('File Excel Rincian RAB (.xlsx) berhasil diunduh!');
  });

  document.getElementById('btn-download-spk').addEventListener('click', () => {
    const proj = collectCurrentProject();
    const sum = calculateRabSummary(proj);
    saveCurrentProjectToHistory(true);
    const blob = generateSpkDocxBlob(proj, sum);
    triggerBlobDownload(blob, `Kontrak-SPK-${makeFileSlug(proj)}.docx`);
    showToast('Draf Kontrak SPK Word (.docx) berhasil diunduh!');
  });

  document.getElementById('btn-copy-wa-quote').addEventListener('click', async () => {
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
      switchWizardStep(2);
      showToast('Klausul ditambahkan ke Catatan Penawaran & SPK!');
      return;
    }

    const zona = document.getElementById('p-zona').value;
    const mult = ZONA_WILAYAH[zona] || 1.0;
    state.activeRows.push({
      group: item.workGroup,
      uraian: item.title,
      volume: 1,
      satuan: item.satuan,
      hargaMaterial: Math.round((item.hargaMaterial * mult) / 500) * 500,
      hargaUpah: Math.round((item.hargaUpah * mult) / 500) * 500
    });
    switchView('wizard');
    switchWizardStep(2);
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
    pb.style.display = 'grid';
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
  document.getElementById('p-judul').value = proj.judulProyek || '';
  document.getElementById('p-klien').value = proj.namaKlien || '';
  document.getElementById('p-lokasi').value = proj.lokasiProyek || '';
  document.getElementById('p-luas').value = String(proj.luasM2 || 36);
  document.getElementById('p-fee').value = String(proj.feePersen ?? 10);
  document.getElementById('p-durasi').value = String(proj.durasiHari || 30);
  document.getElementById('p-nomor').value = proj.nomorDokumen || 'RAB/2026/108';
  document.getElementById('p-tanggal').value = proj.tanggal || '';
  document.getElementById('p-garansi').value = String(proj.masaGaransiHari || 60);
  document.getElementById('p-catatan').value = proj.catatanPenawaran || '';

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
      state.history.splice(idx, 1);
      saveJson(KEYS.HISTORY, state.history);
      renderHistoryView();
      refreshDashboardAndBadges();
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

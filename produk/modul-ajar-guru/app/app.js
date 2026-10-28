/**
 * RuangAjar Merdeka — Pengendali Utama Web App Guru
 * Mencakup: Login, Dashboard, Wizard 3 Langkah (.docx & .pdf), Penyusun Rapor (.csv),
 * Perpustakaan 120 Item + Halaman Detail, Riwayat, Favorit, Pengaturan, & Tema Terang/Gelap.
 */

import { LIBRARY_CATEGORIES, LIBRARY_ITEMS } from './data/library-items.js';
import {
  FASE_MAP,
  MODEL_BELAJAR_TEMPLATES,
  buildRaporDescriptionForStudent,
  composeFullModulAjar,
  generateModulDocxBlob,
  generateModulPdfBlob,
  generateRaporCsvBlob
} from './data/modul-engine.js';

const KEYS = {
  USER: 'ruangajar_user_v1',
  SETTINGS: 'ruangajar_settings_v1',
  HISTORY: 'ruangajar_history_v1',
  FAVORITES: 'ruangajar_favs_v1',
  RAPOR: 'ruangajar_rapor_v1',
  THEME: 'ruangajar_theme_v1'
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
    namaSekolah: 'SD Negeri 1 Nusantara',
    kota: 'Bandung',
    namaGuru: '',
    nipGuru: '-',
    namaKepsek: 'Drs. Hendra Wijaya, M.Pd.',
    nipKepsek: '19740510 199903 1 002',
    tahunAjaran: '2026/2027'
  }),
  history: loadJson(KEYS.HISTORY, []),
  favorites: loadJson(KEYS.FAVORITES, []),
  raporList: loadJson(KEYS.RAPOR, []),
  activeLibCategory: 'SEMUA',
  activeModalItem: null,
  currentComposedModul: null
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

// TEMA TERANG / GELAP
function initTheme() {
  const saved = localStorage.getItem(KEYS.THEME) || 'light';
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

// LOGIN & PROFIL PEMBELI
function initAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appLayout = document.getElementById('app-layout');
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');

  document.getElementById('btn-demo-fill').addEventListener('click', () => {
    document.getElementById('login-name').value = 'Ibu Ratna Dewi, S.Pd.';
    document.getElementById('login-email').value = 'ratnadewi@sekolah.sch.id';
    document.getElementById('login-code').value = 'GURU-MERDEKA-2026';
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

    if (!state.settings.namaGuru) {
      state.settings.namaGuru = name;
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
  refreshDashboardAndBadges();
}

// NAVIGASI VIEW & SIDEBAR HP
function switchView(viewName) {
  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.classList.toggle('active', btn.dataset.view === viewName);
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
  document.getElementById('btn-open-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  document.getElementById('dash-btn-new-modul').addEventListener('click', () => switchView('wizard'));
  document.getElementById('dash-btn-open-rapor').addEventListener('click', () => switchView('rapor'));
  document.getElementById('quick-wizard-btn').addEventListener('click', () => switchView('wizard'));
  document.getElementById('quick-library-btn').addEventListener('click', () => switchView('library'));
  document.getElementById('quick-settings-btn').addEventListener('click', () => switchView('settings'));
}

// DASHBOARD & KARTU ANGKA
function refreshDashboardAndBadges() {
  const guruName = state.user?.name || state.settings.namaGuru || 'Bapak/Ibu Guru';
  document.getElementById('greeting-title').textContent = `Selamat mengajar, ${guruName}! 👋`;
  document.getElementById('greeting-school').textContent =
    `Satuan Pendidikan Aktif: ${state.settings.namaSekolah || 'Belum diatur'} • Tahun Pelajaran ${state.settings.tahunAjaran || '2026/2027'}`;

  document.getElementById('stat-modul-count').textContent = String(state.history.length);
  document.getElementById('stat-rapor-count').textContent = String(state.raporList.length);
  document.getElementById('stat-lib-total').textContent = String(LIBRARY_ITEMS.length);
  document.getElementById('stat-fav-total').textContent = String(state.favorites.length);

  document.getElementById('badge-lib-count').textContent = String(LIBRARY_ITEMS.length);
  document.getElementById('badge-history-count').textContent = String(state.history.length);
  document.getElementById('badge-fav-count').textContent = String(state.favorites.length);

  const recentBox = document.getElementById('dash-recent-list');
  if (state.history.length === 0) {
    recentBox.innerHTML = 'Belum ada modul yang disimpan. Klik <strong>+ Buat Modul Ajar Baru</strong> untuk memulai.';
  } else {
    recentBox.innerHTML = '';
    for (const item of state.history.slice(0, 4)) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--surface-2);gap:8px;';
      row.innerHTML = `
        <div>
          <strong style="color:var(--text);display:block;">${escHtml(item.identitas.mapel)} — ${escHtml(item.identitas.topik)}</strong>
          <span style="font-size:0.78rem;">${escHtml(item.identitas.kelasFase)} • ${escHtml(item.identitas.tanggalDokumen)}</span>
        </div>
        <button type="button" class="btn btn-secondary" style="padding:6px 10px;font-size:0.78rem;">Buka</button>
      `;
      row.querySelector('button').addEventListener('click', () => loadModulFromHistory(item));
      recentBox.appendChild(row);
    }
  }
}

// PENGATURAN SEKOLAH TETAP
function syncSettingsToInputs() {
  const s = state.settings;
  document.getElementById('s-sekolah').value = s.namaSekolah || '';
  document.getElementById('s-kota').value = s.kota || '';
  document.getElementById('s-guru').value = s.namaGuru || state.user?.name || '';
  document.getElementById('s-nip-guru').value = s.nipGuru || '-';
  document.getElementById('s-kepsek').value = s.namaKepsek || '';
  document.getElementById('s-nip-kepsek').value = s.nipKepsek || '-';
  document.getElementById('s-tahun').value = s.tahunAjaran || '2026/2027';

  // Isi juga default ke form Wizard Langkah 1
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
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      history: state.history,
      favorites: state.favorites,
      raporList: state.raporList
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    triggerBlobDownload(blob, 'cadangan-ruangajar-merdeka.json');
  });
}

// WIZARD 3 LANGKAH MODUL AJAR
function switchWizardStep(stepNum) {
  for (const tab of document.querySelectorAll('.wiz-tab')) {
    tab.classList.toggle('active', Number(tab.dataset.wstep) === stepNum);
  }
  for (const pane of document.querySelectorAll('.wiz-pane')) {
    pane.classList.toggle('active', pane.id === `wiz-pane-${stepNum}`);
  }
  if (stepNum === 3) {
    buildAndRenderModulPreview();
  }
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

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const listHtml = (arr) =>
    `<ol style="padding-left:20px;margin:4px 0 10px;">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;

  document.getElementById('modul-paper-preview').innerHTML = `
    <h3>MODUL AJAR KURIKULUM MERDEKA</h3>
    <p style="text-align:center;font-weight:700;margin-bottom:14px;">${esc(id.namaSekolah.toUpperCase())} • TP ${esc(id.tahunAjaran)}</p>

    <div class="sec-head">A. INFORMASI UMUM PERANGKAT AJAR</div>
    <table class="paper-table">
      <tr><th>Nama Penyusun</th><td>${esc(id.namaGuru)} (NIP. ${esc(id.nipGuru)})</td></tr>
      <tr><th>Kelas / Fase / Semester</th><td>${esc(id.kelasFase)} — Semester ${esc(id.semester)}</td></tr>
      <tr><th>Mata Pelajaran</th><td>${esc(id.mapel)}</td></tr>
      <tr><th>Topik / Materi Pokok</th><td><strong>${esc(id.topik)}</strong></td></tr>
      <tr><th>Alokasi Waktu</th><td>${esc(id.alokasiWaktu)}</td></tr>
      <tr><th>Model Pembelajaran</th><td>${esc(id.modelBelajar)}</td></tr>
      <tr><th>Dimensi Karakter</th><td>${esc(id.dimensiKarakter)}</td></tr>
      <tr><th>Sarana & Sumber</th><td>${esc(id.sarana)}</td></tr>
    </table>

    <div class="sec-head">B. KOMPONEN INTI PEMBELAJARAN</div>
    <p><strong>1. Tujuan Pembelajaran:</strong><br/>${esc(ki.tujuanPembelajaran)}</p>
    <p style="margin-top:8px;"><strong>2. Pemahaman Bermakna:</strong><br/>${esc(ki.pemahamanBermakna)}</p>
    <p style="margin-top:8px;white-space:pre-line;"><strong>3. Pertanyaan Pemantik:</strong>\n${esc(ki.pertanyaanPemantik)}</p>

    <p style="margin-top:10px;"><strong>4. Kegiatan Pembelajaran:</strong></p>
    <p><em>a) Kegiatan Pendahuluan (${esc(ki.pendahuluan.durasi)})</em></p>
    ${listHtml(ki.pendahuluan.langkah)}
    <p><em>b) Kegiatan Inti — ${esc(id.modelBelajar)} (${esc(ki.inti.durasi)})</em></p>
    ${listHtml(ki.inti.langkah)}
    <p><em>c) Kegiatan Penutup (${esc(ki.penutup.durasi)})</em></p>
    ${listHtml(ki.penutup.langkah)}

    <p style="white-space:pre-line;"><strong>5. Rencana Asesmen:</strong>\n${esc(ki.asesmen)}</p>
    <p style="margin-top:8px;"><strong>6. Pengayaan & Remedial:</strong><br/>
      • <em>Pengayaan:</em> ${esc(ki.pengayaanRemedial.pengayaan)}<br/>
      • <em>Remedial:</em> ${esc(ki.pengayaanRemedial.remedial)}
    </p>

    <div class="sec-head">C. LAMPIRAN LEMBAR KERJA PESERTA DIDIK (LKPD)</div>
    <p><strong>${esc(modul.lkpd.judul)}</strong></p>
    ${listHtml(modul.lkpd.tugas)}

    <table style="width:100%;margin-top:22px;font-size:0.84rem;border:none;">
      <tr>
        <td style="width:50%;border:none;">
          Mengetahui,<br/><strong>Kepala ${esc(id.namaSekolah)}</strong><br/><br/><br/>
          <strong><u>${esc(id.namaKepsek)}</u></strong><br/>NIP. ${esc(id.nipKepsek)}
        </td>
        <td style="width:50%;border:none;">
          ${esc(id.kota)}, ${esc(id.tanggalDokumen)}<br/><strong>Guru Pengampu,</strong><br/><br/><br/>
          <strong><u>${esc(id.namaGuru)}</u></strong><br/>NIP. ${esc(id.nipGuru)}
        </td>
      </tr>
    </table>
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
    showToast('Contoh materi terisi! Silakan lanjut ke Langkah 2 atau 3.');
  });

  document.getElementById('btn-autofill-komponen').addEventListener('click', () => {
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
    showToast('Draf kegiatan & asesmen berhasil disusun otomatis!');
  });

  const slugFile = (mod) =>
    `Modul-Ajar-${mod.identitas.mapel}-${mod.identitas.topik}`
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 65);

  document.getElementById('btn-download-docx').addEventListener('click', () => {
    buildAndRenderModulPreview();
    saveCurrentModulToHistory(true);
    const blob = generateModulDocxBlob(state.currentComposedModul);
    triggerBlobDownload(blob, `${slugFile(state.currentComposedModul)}.docx`);
    showToast('File Word (.docx) berhasil diunduh!');
  });

  document.getElementById('btn-download-pdf').addEventListener('click', () => {
    buildAndRenderModulPreview();
    saveCurrentModulToHistory(true);
    const blob = generateModulPdfBlob(state.currentComposedModul);
    triggerBlobDownload(blob, `${slugFile(state.currentComposedModul)}.pdf`);
    showToast('File PDF Resmi (.pdf) berhasil diunduh!');
  });

  document.getElementById('btn-save-history').addEventListener('click', () => {
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

// PENYUSUN RAPOR CEPAT
function renderRaporTable() {
  const wrap = document.getElementById('rapor-table-wrap');
  if (state.raporList.length === 0) {
    wrap.innerHTML =
      '<p style="color:var(--muted);font-size:0.88rem;">Belum ada daftar siswa. Tambahkan di atas atau klik <strong>Muat Contoh 3 Siswa</strong>.</p>';
    return;
  }

  let html = `<table class="paper-table" style="background:var(--surface);color:var(--text);">
    <thead>
      <tr>
        <th style="width:45px;background:var(--surface-2);color:var(--text);">No</th>
        <th style="width:180px;background:var(--surface-2);color:var(--text);">Nama Siswa</th>
        <th style="width:70px;background:var(--surface-2);color:var(--text);">Nilai</th>
        <th style="background:var(--surface-2);color:var(--text);">Kalimat Deskripsi Capaian e-Rapor</th>
        <th style="width:90px;background:var(--surface-2);color:var(--text);">Aksi</th>
      </tr>
    </thead>
    <tbody>`;

  state.raporList.forEach((row, idx) => {
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escHtml(row.nama)}</strong></td>
        <td>${escHtml(row.nilai)}</td>
        <td>${escHtml(row.deskripsi)}</td>
        <td>
          <button type="button" class="btn btn-secondary btn-copy-rapor" data-idx="${idx}" style="padding:5px 9px;font-size:0.76rem;">Salin</button>
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
}

function initRaporTool() {
  document.getElementById('btn-add-rapor-row').addEventListener('click', () => {
    const nama = document.getElementById('r-nama').value.trim();
    if (!nama) {
      showToast('Isi nama peserta didik terlebih dulu.');
      return;
    }
    const row = buildRaporDescriptionForStudent({
      nama,
      nilai: document.getElementById('r-nilai').value,
      tpTercapai: document.getElementById('r-capai').value,
      tpBimbingan: document.getElementById('r-bimbing').value
    });
    state.raporList.push(row);
    saveJson(KEYS.RAPOR, state.raporList);
    document.getElementById('r-nama').value = '';
    renderRaporTable();
    refreshDashboardAndBadges();
    showToast('Kalimat rapor siswa berhasil ditambahkan!');
  });

  document.getElementById('btn-sample-rapor').addEventListener('click', () => {
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
    state.raporList = [];
    saveJson(KEYS.RAPOR, state.raporList);
    renderRaporTable();
    refreshDashboardAndBadges();
  });
}

// PERPUSTAKAAN 120 ITEM & MODAL DETAIL
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

  // Modal actions
  document.getElementById('m-btn-close').addEventListener('click', closeItemModal);
  document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') closeItemModal();
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
  });

  document.getElementById('m-btn-use').addEventListener('click', () => {
    const item = state.activeModalItem;
    if (!item) return;
    closeItemModal();

    if (item.wizardField === 'catatanRapor') {
      switchView('rapor');
      document.getElementById('r-capai').value = item.example;
      showToast('Dimasukkan ke Penyusun Rapor!');
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
    switchView('wizard');
    switchWizardStep(2);
    showToast(`"${item.title}" dimasukkan ke Langkah 2 Wizard!`);
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
  el.innerHTML = `
    <div class="lib-meta">
      <span class="cat-tag">${item.category}</span>
      <span class="jenjang-tag">${isFav ? '★ ' : ''}${item.jenjang}</span>
    </div>
    <h3>${item.title}</h3>
    <p>${item.summary}</p>
  `;
  el.addEventListener('click', () => openItemModal(item));
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
  updateModalFavButton();
  document.getElementById('item-modal').classList.add('active');
}

function updateModalFavButton() {
  if (!state.activeModalItem) return;
  const isFav = state.favorites.includes(state.activeModalItem.id);
  document.getElementById('m-btn-fav').textContent = isFav ? '★ Tersimpan di Favorit' : '☆ Simpan Favorit';
}

function closeItemModal() {
  document.getElementById('item-modal').classList.remove('active');
}

// RIWAYAT & FAVORIT
function loadModulFromHistory(mod) {
  const id = mod.identitas;
  const ki = mod.komponenInti;
  document.getElementById('f-sekolah').value = id.namaSekolah;
  document.getElementById('f-kelas').value = id.kelasFase;
  document.getElementById('f-mapel').value = id.mapel;
  document.getElementById('f-semester').value = id.semester;
  document.getElementById('f-topik').value = id.topik;
  document.getElementById('f-guru').value = id.namaGuru;
  document.getElementById('f-nip-guru').value = id.nipGuru;
  document.getElementById('f-kepsek').value = id.namaKepsek;
  document.getElementById('f-nip-kepsek').value = id.nipKepsek;
  document.getElementById('f-kota').value = id.kota;
  document.getElementById('f-tahun').value = id.tahunAjaran;
  document.getElementById('f-tp').value = ki.tujuanPembelajaran;
  document.getElementById('f-pemantik').value = ki.pertanyaanPemantik;
  document.getElementById('f-icebreaking').value = ki.iceBreaking;
  document.getElementById('f-inti').value = ki.inti.langkah.join('\n');
  document.getElementById('f-asesmen').value = ki.asesmen;

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
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h2>${escHtml(mod.identitas.mapel)} — ${escHtml(mod.identitas.topik)}</h2>
          <p class="sub" style="margin-bottom:6px;">
            ${escHtml(mod.identitas.kelasFase)} • ${escHtml(mod.identitas.namaSekolah)} • Disusun ${escHtml(mod.identitas.tanggalDokumen)}
          </p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary btn-h-open">Lihat & Unduh</button>
          <button type="button" class="btn btn-danger btn-h-del">Hapus</button>
        </div>
      </div>
    `;
    card.querySelector('.btn-h-open').addEventListener('click', () => loadModulFromHistory(mod));
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
  const favItems = LIBRARY_ITEMS.filter((item) => state.favorites.includes(item.id));
  grid.innerHTML = '';

  if (favItems.length === 0) {
    grid.innerHTML =
      '<div class="card" style="grid-column:1/-1;"><p style="color:var(--muted);">Belum ada item favorit. Buka <strong>Perpustakaan Guru</strong> lalu klik tombol bintang pada item yang sering kamu pakai.</p></div>';
    return;
  }
  for (const item of favItems) {
    grid.appendChild(createLibraryCardEl(item));
  }
}

// JALANKAN SEMUA INISIALISASI
initTheme();
initNavigation();
initSettings();
initWizard();
initRaporTool();
initLibrary();
initAuth();

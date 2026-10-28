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

const state = {
  user: readStore(STORAGE.USER, null),
  settings: readStore(STORAGE.SETTINGS, {
    studioName: 'Karya Visual Studio',
    creatorName: 'Dimas Prakoso',
    contactPhone: '0812-8899-4421',
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

  clientName: 'Kopi Senja Nusantara',
  projectName: 'Pengelolaan Konten Instagram & Reels Bulanan',
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
  btnDemoLogin: document.getElementById('btn-demo-login'),

  appShell: document.getElementById('app-shell'),
  sidebar: document.getElementById('sidebar'),
  sidebarBackdrop: document.getElementById('sidebar-backdrop'),
  btnOpenDrawer: document.getElementById('btn-open-drawer'),
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
  if (state.user) {
    el.loginScreen.style.display = 'none';
    el.appShell.classList.add('active');
    const greetName = state.settings.creatorName || state.user.name;
    el.dashGreeting.textContent = `Halo, ${greetName}`;
    recomputeRateCalculator();
    refreshCountersAndRecent();
  } else {
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
  const income = Math.max(500000, Number(el.calcIncomeInput.value) || 8000000);
  const cost = Math.max(0, Number(el.calcCostInput.value) || 500000);
  const hours = Math.max(10, Number(el.calcHoursInput.value) || 100);

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
function switchWizardStep(step) {
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

function getActiveServiceObj() {
  return SERVICE_PRESETS.find((s) => s.id === state.serviceId) || SERVICE_PRESETS[0];
}

function selectServicePreset(presetId) {
  const found = SERVICE_PRESETS.find((s) => s.id === presetId);
  if (!found) return;
  state.serviceId = found.id;
  state.tiers = clonePreset(found.tiers);
  state.addons = clonePreset(found.addons);
  state.selectedAddonIndexes = [];
  state.selectedTierIdx = 1;
  state.turnaround = found.defaultTurnaround;
  state.dpPercent = found.defaultDp;
  state.revisionLimit = found.defaultRevisions;

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
              <label>Harga Paket (Rp)</label>
              <input type="number" class="inp-tier-price" data-tidx="${idx}" value="${t.price}" step="50000" />
            </div>

            <div class="field">
              <label>Estimasi Waktu Selesai</label>
              <input type="text" class="inp-tier-days" data-tidx="${idx}" value="${esc(t.days)}" />
            </div>

            <div class="field" style="margin-bottom:0;">
              <label>Rincian Item (1 baris = 1 fasilitas)</label>
              <textarea class="inp-tier-items" data-tidx="${idx}" rows="4">${esc((t.items || []).join('\n'))}</textarea>
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
      state.tiers[idx].price = Math.max(0, Number(inp.value) || 0);
    });
  }

  for (const inp of el.tiersEditorContainer.querySelectorAll('.inp-tier-days')) {
    inp.addEventListener('input', () => {
      const idx = Number(inp.dataset.tidx);
      state.tiers[idx].days = inp.value;
    });
  }

  for (const ta of el.tiersEditorContainer.querySelectorAll('.inp-tier-items')) {
    ta.addEventListener('input', () => {
      const idx = Number(ta.dataset.tidx);
      state.tiers[idx].items = ta.value
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
    });
  }
}

function renderAddonsList() {
  el.addonsCheckboxList.innerHTML = state.addons
    .map((ad, idx) => {
      const checked = state.selectedAddonIndexes.includes(idx) ? 'checked' : '';
      return `
        <label style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-subtle);cursor:pointer;font-size:13.5px;">
          <span style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" class="chk-addon" data-aidx="${idx}" ${checked} />
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
    });
  }
}

function buildCurrentDocumentPayload() {
  const srv = getActiveServiceObj();
  const stampNum = String(Date.now()).slice(-5);
  const selectedAddons = state.selectedAddonIndexes.map((i) => state.addons[i]).filter(Boolean);

  return {
    studioName: state.settings.studioName || 'Karya Visual Studio',
    creatorName: state.settings.creatorName || state.user?.name || 'Penyedia Jasa',
    contactPhone: state.settings.contactPhone || '-',
    bankInfo: state.settings.bankInfo || '-',
    serviceName: srv.name,
    clientName: state.clientName || 'Calon Klien',
    projectName: state.projectName || srv.name,
    turnaround: state.turnaround || srv.defaultTurnaround,
    dpPercent: Number(state.dpPercent) || 50,
    revisionLimit: state.revisionLimit || '2x Revisi Minor',
    customClause: state.customClause,
    tiers: state.tiers,
    selectedTierIdx: state.selectedTierIdx,
    selectedAddons,
    dateLabel: todayLabel(),
    docNumber: `TK-PROP/${new Date().getFullYear()}/${stampNum}`,
    invoiceNumber: `INV/${new Date().getFullYear()}/${stampNum}`
  };
}

function renderPaperPreview() {
  const d = buildCurrentDocumentPayload();
  const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];
  const addonSum = d.selectedAddons.reduce((a, b) => a + (Number(b.price) || 0), 0);
  const grandTotal = chosen.price + addonSum;
  const dpNominal = Math.round((grandTotal * d.dpPercent) / 100);
  const remNominal = Math.max(0, grandTotal - dpNominal);

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
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>Total Nilai Paket Terpilih ${addonSum > 0 ? '(+ Add-On)' : ''}:</span>
        <strong>${formatRp(grandTotal)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span>Tagihan Awal (DP ${d.dpPercent}% Pengunci Jadwal):</span>
        <strong>${formatRp(dpNominal)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Sisa Pelunasan Sebelum File Final (${100 - d.dpPercent}%):</span>
        <strong>${formatRp(remNominal)}</strong>
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
  const addonSum = d.selectedAddons.reduce((a, b) => a + (Number(b.price) || 0), 0);
  const grandTotal = chosen.price + addonSum;

  const entry = {
    id: `doc-${Date.now()}`,
    clientName: d.clientName,
    projectName: d.projectName,
    serviceId: state.serviceId,
    serviceName: d.serviceName,
    chosenTier: chosen.tier,
    totalPrice: grandTotal,
    docType: docTypeLabel,
    dateLabel: d.dateLabel
  };

  // Cegah duplikat beruntun untuk klien & jenis file yang sama
  const dupIdx = state.history.findIndex(
    (x) => x.clientName === entry.clientName && x.chosenTier === entry.chosenTier && x.docType === entry.docType
  );
  if (dupIdx >= 0) {
    state.history[dupIdx] = entry;
  } else {
    state.history.unshift(entry);
  }
  writeStore(STORAGE.HISTORY, state.history);
  refreshCountersAndRecent();
}

/* ================= PENANGKIS NAWAR WA ================= */
function refreshWaReplyView() {
  const d = buildCurrentDocumentPayload();
  const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];
  const scenario =
    WA_OBJECTION_SCENARIOS.find((s) => s.id === state.waScenarioId) || WA_OBJECTION_SCENARIOS[0];

  el.waContextSummary.textContent = `${d.studioName} · Klien: ${d.clientName} · ${chosen.tier} (${formatRp(chosen.price)}) · DP ${d.dpPercent}%`;
  el.waOutputText.value = scenario.buildReply({
    studio: d.studioName,
    client: d.clientName,
    pkgName: `${chosen.tier} (${d.serviceName})`,
    priceRp: formatRp(chosen.price),
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

function buildLibCardHtml(item) {
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
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border-subtle);">
        <span class="mono-stamp" style="color:var(--text-muted);">${fav ? 'FAVORIT TERSIMPAN' : 'SIAP PAKAI'}</span>
        <button type="button" class="text-link btn-lib-detail" data-id="${esc(item.id)}">Lihat Detail</button>
      </div>
    </article>
  `;
}

function bindLibDetailTriggers(container) {
  for (const b of container.querySelectorAll('.btn-lib-detail')) {
    b.addEventListener('click', () => openLibModal(b.dataset.id));
  }
}

function renderLibraryGrid() {
  const list = getFilteredLibrary();
  el.libResultBadge.textContent = `${list.length} KOLEKSI`;
  if (list.length === 0) {
    el.libraryGrid.innerHTML = `<div class="tile-card" style="grid-column:1/-1;"><p class="muted-copy">Tidak ada item yang cocok. Coba pilih Semua Kategori.</p></div>`;
    return;
  }
  el.libraryGrid.innerHTML = list.map(buildLibCardHtml).join('');
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
  el.favoritesGrid.innerHTML = list.map(buildLibCardHtml).join('');
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
        <button type="button" class="btn btn-ghost btn-sm btn-reopen-hist" data-id="${esc(h.id)}">
          Buka di Wizard
        </button>
      </div>
    `
    )
    .join('');

  for (const b of el.historyContainer.querySelectorAll('.btn-reopen-hist')) {
    b.addEventListener('click', () => {
      const h = state.history.find((x) => x.id === b.dataset.id);
      if (!h) return;
      selectServicePreset(h.serviceId);
      state.clientName = h.clientName;
      state.projectName = h.projectName;
      el.inpClientName.value = h.clientName;
      el.inpProjectName.value = h.projectName;
      switchView('wizard');
      switchWizardStep(3);
      showToast('Data klien dimuat kembali ke pratinjau Wizard!');
    });
  }
}

function populateSettingsFields() {
  el.setStudioName.value = state.settings.studioName || '';
  el.setCreatorName.value = state.settings.creatorName || '';
  el.setPhone.value = state.settings.contactPhone || '';
  el.setBank.value = state.settings.bankInfo || '';
}

/* ================= BINDING EVENT LENGKAP ================= */
function bindAllEvents() {
  el.btnDemoLogin.addEventListener('click', () => {
    el.loginName.value = 'Dimas Prakoso — Karya Visual Studio';
    el.loginEmail.value = 'dimas@karyavisual.id';
    el.loginCode.value = 'FREELANCE-2026-PRO';
    el.loginError.style.display = 'none';
  });

  el.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.loginName.value.trim();
    const email = el.loginEmail.value.trim();
    const code = el.loginCode.value.trim().toUpperCase();
    if (!name || !email || code.length < 6) {
      el.loginError.textContent = 'Mohon lengkapi nama, email, dan kode lisensi yang valid.';
      el.loginError.style.display = 'block';
      return;
    }
    state.user = { name, email, code };
    writeStore(STORAGE.USER, state.user);

    if (!localStorage.getItem(STORAGE.SETTINGS)) {
      const parts = name.split('—').map((s) => s.trim());
      state.settings.creatorName = parts[0] || name;
      state.settings.studioName = parts[1] || `${parts[0]} Studio`;
      writeStore(STORAGE.SETTINGS, state.settings);
    }
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
  el.sidebarBackdrop.addEventListener('click', closeDrawer);

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
    switchView('wizard');
    switchWizardStep(2);
    showToast('Patokan harga aman berhasil diterapkan ke 3 Paket Wizard!');
  });

  // Navigasi Wizard
  for (const pill of el.stepPills) {
    pill.addEventListener('click', () => switchWizardStep(Number(pill.dataset.step)));
  }
  document.getElementById('btn-to-step-2').addEventListener('click', () => switchWizardStep(2));
  document.getElementById('btn-back-step-1').addEventListener('click', () => switchWizardStep(1));
  document.getElementById('btn-to-step-3').addEventListener('click', () => switchWizardStep(3));
  document.getElementById('btn-back-step-2').addEventListener('click', () => switchWizardStep(2));

  el.inpClientName.addEventListener('input', () => {
    state.clientName = el.inpClientName.value;
  });
  el.inpProjectName.addEventListener('input', () => {
    state.projectName = el.inpProjectName.value;
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
  });

  document.getElementById('btn-pick-clause-lib').addEventListener('click', () => {
    state.libCategory = 'Klausul Anti-Revisi Bocor';
    renderCategoryChips();
    switchView('library');
  });

  // 4 Tombol Ekspor File Asli
  document.getElementById('btn-dl-ratecard-png').addEventListener('click', async () => {
    const d = buildCurrentDocumentPayload();
    const blob = await exportRateCardPng(d);
    triggerDownloadBlob(blob, `RateCard-${d.studioName.replace(/\s+/g, '-')}.png`);
    recordDocumentHistory('RATE CARD .PNG');
    showToast('Gambar Rate Card 3 Paket (.PNG) berhasil diunduh!');
  });

  document.getElementById('btn-dl-proposal-pdf').addEventListener('click', () => {
    const d = buildCurrentDocumentPayload();
    const blob = exportProposalPdf(d);
    triggerDownloadBlob(blob, `Proposal-${d.clientName.replace(/\s+/g, '-')}.pdf`);
    recordDocumentHistory('PROPOSAL .PDF');
    showToast('Proposal Penawaran Resmi (.PDF) berhasil diunduh!');
  });

  document.getElementById('btn-dl-invoice-pdf').addEventListener('click', () => {
    const d = buildCurrentDocumentPayload();
    const blob = exportInvoicePdf(d);
    triggerDownloadBlob(blob, `Invoice-${d.clientName.replace(/\s+/g, '-')}.pdf`);
    recordDocumentHistory('INVOICE .PDF');
    showToast('Invoice Tagihan Resmi (.PDF) berhasil diunduh!');
  });

  document.getElementById('btn-dl-spk-docx').addEventListener('click', () => {
    const d = buildCurrentDocumentPayload();
    const blob = exportAgreementDocx(d);
    triggerDownloadBlob(blob, `Kesepakatan-Kerja-${d.clientName.replace(/\s+/g, '-')}.docx`);
    recordDocumentHistory('KESEPAKATAN .DOCX');
    showToast('Surat Kesepakatan Kerja (.DOCX) berhasil diunduh!');
  });

  document.getElementById('btn-copy-ai-prompt').addEventListener('click', async () => {
    const d = buildCurrentDocumentPayload();
    const chosen = d.tiers[d.selectedTierIdx] || d.tiers[1];
    const prompt = `Saya dari ${d.studioName} akan mengirimkan proposal jasa "${d.serviceName}" (${chosen.tier} senilai ${formatRp(chosen.price)}) kepada calon klien bernama "${d.clientName}" untuk kebutuhan "${d.projectName}". Buatkan 3 poin pengantar singkat dalam bahasa Indonesia sehari-hari yang sopan, meyakinkan, dan menjelaskan mengapa paket ini menghemat waktu serta menguntungkan bisnis mereka dibanding mengerjakan sendiri.`;
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
      el.inpCustomClause.value = item.example;
      closeLibModal();
      switchView('wizard');
      switchWizardStep(2);
      showToast('Klausul dipasang ke Wizard & disalin!');
    } else {
      closeLibModal();
      showToast('Contoh teks berhasil disalin ke papan klip!');
    }
  });

  // Riwayat & Pengaturan
  document.getElementById('btn-clear-history').addEventListener('click', () => {
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
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed.settings) {
        state.settings = parsed.settings;
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

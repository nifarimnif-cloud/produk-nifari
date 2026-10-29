// LabaToko Studio — Logika Utama Kalkulator Untung Toko Online & Batas Aman Iklan
(function () {
  const STORAGE_KEY = 'labatoko_studio_state_v1';
  const DATA = window.LABATOKO_DATA || { presets: [], library: [] };

  const defaultStore = {
    loggedIn: false,
    ownerName: '',
    storeName: '',
    email: '',
    license: '',
    theme: 'light'
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          store: { ...defaultStore, ...(parsed.store || {}) },
          skus: Array.isArray(parsed.skus) ? parsed.skus : [],
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          exportsCount: Number(parsed.exportsCount) || 0
        };
      }
    } catch (e) {
      // ignore invalid json
    }
    return {
      store: { ...defaultStore },
      skus: [],
      favorites: [],
      exportsCount: 0
    };
  }

  let state = loadState();
  let activePresetId = DATA.presets[0] ? DATA.presets[0].id : '';
  let activeStep = 1;
  let currentSku = null;
  let activeLibCategory = 'ALL';
  let activeModalItem = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore storage quota
    }
  }

  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    const neg = n < 0 ? '-' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    state.store.theme = t;
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = t === 'dark' ? 'Tema Terang' : 'Tema Gelap';
    saveState();
  }

  // 1. Dashboard Quick Leak Scanner
  function updateQuickLeakScanner() {
    const hpp = Math.max(0, Number(document.getElementById('qHpp').value) || 0);
    const price = Math.max(1000, Number(document.getElementById('qPrice').value) || 1000);
    const adminPct = Math.min(50, Math.max(0, Number(document.getElementById('qAdminPct').value) || 0));
    const adCpa = Math.max(0, Number(document.getElementById('qAdCpa').value) || 0);

    const fixedFee = 1250;
    const feeRp = Math.round(price * (adminPct / 100)) + fixedFee;
    const beforeAds = price - hpp - feeRp;
    const netAfterAds = beforeAds - adCpa;
    const netPct = (netAfterAds / price) * 100;
    const breakRoas = beforeAds > 0 ? price / beforeAds : 99.9;

    document.getElementById('qResFee').textContent = '- ' + formatRp(feeRp);
    document.getElementById('qResNet').textContent = formatRp(netAfterAds) + ' / pcs';
    document.getElementById('qResBreakRoas').textContent = beforeAds > 0 ? breakRoas.toFixed(2) + 'x' : 'Rugi Dasar';
    document.getElementById('statQuickProfit').textContent = formatRp(netAfterAds);

    const card = document.getElementById('qProfitCard');
    const pctEl = document.getElementById('qResPct');
    const diagEl = document.getElementById('qDiagnosisText');

    if (netAfterAds <= 0) {
      card.className = 'card-alert';
      document.getElementById('statQuickProfit').style.color = 'var(--color-accent)';
      pctEl.textContent = `AWAS BONCOS (${netPct.toFixed(1)}%) — Toko nombok tiap barang laku!`;
      diagEl.textContent = `Darurat: setiap 100 paket terkirim tokomu justru tekor ${formatRp(Math.abs(netAfterAds * 100))}. Segera perbaiki harga jualnya di Wizard.`;
    } else if (netPct < 10) {
      card.className = 'card-alert';
      document.getElementById('statQuickProfit').style.color = 'var(--color-accent)';
      pctEl.textContent = `Margin tipis ${netPct.toFixed(1)}% — rawan habis bila ada retur.`;
      diagEl.textContent = `Hati-hati: sisa bersih hanya ${formatRp(netAfterAds)}/pcs. Gunakan strategi Paket Bundling 2 Pcs di Wizard agar margin menebal.`;
    } else {
      card.className = 'card-profit';
      document.getElementById('statQuickProfit').style.color = 'var(--color-profit)';
      pctEl.textContent = `Margin sehat ${netPct.toFixed(1)}% setelah seluruh potongan & iklan.`;
      diagEl.textContent = `Status sehat: kantong toko menerima bersih ${formatRp(netAfterAds)}/pcs. Kunci rambu ROAS dan cetak SOP-nya di Wizard.`;
    }
  }

  // 2. Step 1 Recommended Price Computation
  function calcRecommendedPriceFromStep1() {
    const hpp = Math.max(0, Number(document.getElementById('skuHpp').value) || 0);
    const packing = Math.max(0, Number(document.getElementById('skuPacking').value) || 0);
    const retBuf = Math.max(0, Number(document.getElementById('skuReturnBuf').value) || 0);
    const adminPct = Math.max(0, Number(document.getElementById('skuAdminPct').value) || 0);
    const xtraPct = Math.max(0, Number(document.getElementById('skuXtraPct').value) || 0);
    const fixedFee = Math.max(0, Number(document.getElementById('skuFixedFee').value) || 0);
    const voucher = Math.max(0, Number(document.getElementById('skuVoucher').value) || 0);
    const targetProfit = Math.max(1000, Number(document.getElementById('skuTargetProfit').value) || 15000);

    const totalPct = Math.min(65, adminPct + xtraPct);
    const denom = Math.max(0.2, 1 - totalPct / 100);
    const rawPrice = (hpp + packing + retBuf + fixedFee + voucher + targetProfit) / denom;
    const rounded = Math.ceil(rawPrice / 1000) * 1000;

    document.getElementById('step1RecPrice').textContent = formatRp(rounded);
    return rounded;
  }

  // Build Complete SKU Object
  function buildSkuObject(customSellingPrice) {
    const skuName = document.getElementById('skuName').value.trim() || 'Produk Utama Toko';
    const platform = document.getElementById('skuPlatform').value;
    const hpp = Math.max(0, Number(document.getElementById('skuHpp').value) || 0);
    const packingCost = Math.max(0, Number(document.getElementById('skuPacking').value) || 0);
    const returnBuffer = Math.max(0, Number(document.getElementById('skuReturnBuf').value) || 0);
    const adminPct = Math.max(0, Number(document.getElementById('skuAdminPct').value) || 0);
    const programXtraPct = Math.max(0, Number(document.getElementById('skuXtraPct').value) || 0);
    const fixedOrderFee = Math.max(0, Number(document.getElementById('skuFixedFee').value) || 0);
    const voucherSellerRp = Math.max(0, Number(document.getElementById('skuVoucher').value) || 0);
    const targetProfit = Math.max(1000, Number(document.getElementById('skuTargetProfit').value) || 15000);

    const recPrice = calcRecommendedPriceFromStep1();
    const sellingPrice = Math.max(1000, Number(customSellingPrice) || recPrice);
    const strikeDiscountPct = Number(document.getElementById('wizStrikePct').value) || 25;
    const strikePrice = Math.ceil(sellingPrice / (1 - strikeDiscountPct / 100) / 1000) * 1000;

    const totalFeePct = adminPct + programXtraPct;
    const marketplaceFeeRp = Math.round(sellingPrice * (totalFeePct / 100));
    const baseUnitCost = hpp + packingCost + returnBuffer;
    const profitBeforeAds = sellingPrice - baseUnitCost - marketplaceFeeRp - fixedOrderFee - voucherSellerRp;
    const netMarginBeforeAdsPct = (profitBeforeAds / sellingPrice) * 100;

    const adSharePct = Number(document.getElementById('wizAdShareSelect').value) || 40;
    const maxCpaBreakEven = Math.max(0, profitBeforeAds);
    const healthyCpaTarget = profitBeforeAds > 0 ? Math.max(500, Math.round(profitBeforeAds * (adSharePct / 100))) : 0;
    const finalTakeHomePerOrder = profitBeforeAds - healthyCpaTarget;
    const breakEvenRoas = profitBeforeAds > 0 ? sellingPrice / profitBeforeAds : 99.9;
    const healthyRoas = healthyCpaTarget > 0 ? sellingPrice / healthyCpaTarget : 99.9;

    // 3 Bundle Packages
    const disc2 = Math.max(2000, Math.round((sellingPrice * 2 * 0.05) / 1000) * 1000);
    const b2Price = sellingPrice * 2 - disc2;
    const b2Fee = Math.round(b2Price * (totalFeePct / 100)) + fixedOrderFee + voucherSellerRp;
    const b2Cost = hpp * 2 + Math.round(packingCost * 1.35) + returnBuffer * 2 + b2Fee;
    const b2Net = b2Price - b2Cost;

    const disc3 = Math.max(5000, Math.round((sellingPrice * 3 * 0.08) / 1000) * 1000);
    const b3Price = sellingPrice * 3 - disc3;
    const b3Fee = Math.round(b3Price * (totalFeePct / 100)) + fixedOrderFee + voucherSellerRp;
    const b3Cost = hpp * 3 + Math.round(packingCost * 1.65) + returnBuffer * 3 + b3Fee;
    const b3Net = b3Price - b3Cost;

    const bundles = [
      {
        title: '1. Varian Satuan (1 Pcs)',
        subtitle: 'Harga dasar penarik pembeli baru',
        bundlePrice: sellingPrice,
        netProfit: profitBeforeAds
      },
      {
        title: `2. Paket Hemat 2 Pcs (Hemat ${formatRp(disc2)})`,
        subtitle: 'Hemat 1x biaya resi tetap & kardus gabungan',
        bundlePrice: b2Price,
        netProfit: b2Net
      },
      {
        title: `3. Paket Stok 3 Pcs (Hemat ${formatRp(disc3)})`,
        subtitle: 'Ruang anggaran iklan paling lega per pesanan',
        bundlePrice: b3Price,
        netProfit: b3Net
      }
    ];

    return {
      id: (currentSku && currentSku.id) || 'sku-' + Date.now(),
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      skuName,
      platform,
      hpp,
      packingCost,
      returnBuffer,
      adminPct,
      programXtraPct,
      totalFeePct,
      fixedOrderFee,
      voucherSellerRp,
      targetProfit,
      sellingPrice,
      strikeDiscountPct,
      strikePrice,
      marketplaceFeeRp,
      profitBeforeAds,
      netMarginBeforeAdsPct,
      adSharePct,
      maxCpaBreakEven,
      healthyCpaTarget,
      finalTakeHomePerOrder,
      breakEvenRoas,
      healthyRoas,
      bundles
    };
  }

  function renderPresetChips() {
    const grid = document.getElementById('presetGrid');
    if (!grid) return;
    grid.innerHTML = '';
    DATA.presets.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-chip' + (p.id === activePresetId ? ' active' : '');
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        activePresetId = p.id;
        applyPresetToForm(p);
        renderPresetChips();
        showToast('Preset ' + p.label + ' dimuat');
      });
      grid.appendChild(btn);
    });
  }

  function applyPresetToForm(p) {
    if (!p) return;
    document.getElementById('skuName').value = p.skuName;
    document.getElementById('skuPlatform').value = p.platform;
    document.getElementById('skuHpp').value = p.hpp;
    document.getElementById('skuPacking').value = p.packingCost;
    document.getElementById('skuReturnBuf').value = p.returnBuffer;
    document.getElementById('skuAdminPct').value = p.adminPct;
    document.getElementById('skuXtraPct').value = p.programXtraPct;
    document.getElementById('skuFixedFee').value = p.fixedOrderFee;
    document.getElementById('skuVoucher').value = p.voucherSellerRp;
    document.getElementById('skuTargetProfit').value = p.targetNetProfit;

    const rec = calcRecommendedPriceFromStep1();
    document.getElementById('wizSellPrice').value = rec;
    currentSku = buildSkuObject(rec);
  }

  function goToStep(stepNum) {
    activeStep = stepNum;
    document.querySelectorAll('.step-tab').forEach((t) => {
      t.classList.toggle('active', Number(t.dataset.step) === stepNum);
    });
    document.getElementById('wizStep1').classList.toggle('hidden', stepNum !== 1);
    document.getElementById('wizStep2').classList.toggle('hidden', stepNum !== 2);
    document.getElementById('wizStep3').classList.toggle('hidden', stepNum !== 3);

    if (stepNum === 2) {
      const rec = calcRecommendedPriceFromStep1();
      const sellInp = document.getElementById('wizSellPrice');
      if (!sellInp.value || Number(sellInp.value) < 1000) sellInp.value = rec;
      renderStep2();
    } else if (stepNum === 3) {
      const sellVal = Number(document.getElementById('wizSellPrice').value) || calcRecommendedPriceFromStep1();
      currentSku = buildSkuObject(sellVal);
      renderStep3();
    }
  }

  function renderStep2() {
    const sellVal = Number(document.getElementById('wizSellPrice').value) || calcRecommendedPriceFromStep1();
    currentSku = buildSkuObject(sellVal);

    document.getElementById('wizStrikeDisplay').textContent = formatRp(currentSku.strikePrice);
    document.getElementById('wizSellDisplay').textContent = formatRp(currentSku.sellingPrice);
    document.getElementById('wizDiscBadge').textContent = `HEMAT ${currentSku.strikeDiscountPct}%`;

    const bWrap = document.getElementById('bundleCardsWrap');
    bWrap.innerHTML = currentSku.bundles
      .map(
        (b) => `
      <div class="card-muted" style="padding: 12px 16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div>
          <div style="font-weight:700; font-size:13.5px;">${b.title}</div>
          <div class="text-muted" style="font-size:12px;">${b.subtitle}</div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="num-mono" style="font-weight:700;">${formatRp(b.bundlePrice)}</div>
          <div class="num-mono" style="font-size:12px; color:var(--color-profit);">Laba: ${formatRp(b.netProfit)}</div>
        </div>
      </div>`
      )
      .join('');

    document.getElementById('wizBreakRoas').textContent = currentSku.profitBeforeAds > 0 ? currentSku.breakEvenRoas.toFixed(2) + 'x' : 'Rugi';
    document.getElementById('wizMaxCpa').textContent = formatRp(currentSku.maxCpaBreakEven);
    document.getElementById('wizHealthyRoas').textContent = currentSku.healthyCpaTarget > 0 ? currentSku.healthyRoas.toFixed(2) + 'x' : 'N/A';
    document.getElementById('wizHealthyCpa').textContent = formatRp(currentSku.healthyCpaTarget) + '/order';
    document.getElementById('wizTakeHome').textContent = formatRp(currentSku.finalTakeHomePerOrder) + '/order';

    const omzetPer100k = Math.round(100000 * currentSku.healthyRoas);
    document.getElementById('wizRoasHumanExplain').innerHTML =
      currentSku.profitBeforeAds > 0
        ? `<strong>Bahasa gampangnya:</strong> Setiap saldo iklan <strong>Rp 100.000</strong> terpakai, iklan produk ini wajib menghasilkan omzet minimal <strong>${formatRp(
            omzetPer100k
          )}</strong> supaya kamu tetap mengantongi bersih <strong>${formatRp(currentSku.finalTakeHomePerOrder)}</strong> per barang.`
        : `<strong>Peringatan:</strong> Harga tayang saat ini belum menutup modal + potongan admin. Naikkan harga jual di sebelah kiri terlebih dahulu.`;
  }

  function renderStep3() {
    document.getElementById('prevSkuTitle').textContent = currentSku.skuName;
    document.getElementById('prevSkuSub').textContent = `${currentSku.platform} • Harga Coret ${formatRp(currentSku.strikePrice)} -> Tayang ${formatRp(currentSku.sellingPrice)}`;

    const rows = [
      ['Harga Tayang Etalase', formatRp(currentSku.sellingPrice)],
      ['Modal Pokok HPP Barang', '- ' + formatRp(currentSku.hpp)],
      ['Biaya Kemasan + Cetak Resi', '- ' + formatRp(currentSku.packingCost)],
      ['Cadangan Risiko Retur', '- ' + formatRp(currentSku.returnBuffer)],
      [`Potongan Admin + Xtra (${currentSku.totalFeePct.toFixed(1)}%)`, '- ' + formatRp(currentSku.marketplaceFeeRp)],
      ['Biaya Proses Tetap per Resi', '- ' + formatRp(currentSku.fixedOrderFee)],
      ['Alokasi Voucher Toko', '- ' + formatRp(currentSku.voucherSellerRp)],
      ['Sisa Laba Sebelum Iklan', formatRp(currentSku.profitBeforeAds)],
      [`Alokasi Iklan Sehat (ROAS >= ${currentSku.healthyRoas.toFixed(2)}x)`, '- ' + formatRp(currentSku.healthyCpaTarget)]
    ];

    document.getElementById('prevLedgerRows').innerHTML = rows
      .map(
        ([l, r]) => `
      <div class="ledger-row">
        <span>${l}</span>
        <span class="num-mono" style="font-weight:600;">${r}</span>
      </div>`
      )
      .join('');

    const totBox = document.getElementById('prevLedgerTotal');
    totBox.classList.toggle('loss', currentSku.finalTakeHomePerOrder <= 0);
    document.getElementById('prevTakeHomeVal').textContent = formatRp(currentSku.finalTakeHomePerOrder);

    // 8-Point Margin & Ad Health Audit
    const checks = [
      { ok: currentSku.profitBeforeAds > 0, label: 'Harga tayang menutup penuh HPP + potongan persen marketplace' },
      { ok: currentSku.netMarginBeforeAdsPct >= 18, label: 'Margin sebelum iklan >= 18% (cukup ruang bernapas untuk promosi)' },
      { ok: currentSku.packingCost >= 1000, label: 'Biaya kardus/bubble wrap & lakban sudah dihitung tidak terlupakan' },
      { ok: currentSku.returnBuffer >= 500, label: 'Memiliki cadangan pengaman retur COD / selisih stok gudang' },
      { ok: currentSku.fixedOrderFee >= 1000, label: 'Biaya proses tetap per resi sudah diperhitungkan' },
      { ok: currentSku.healthyRoas <= 14, label: 'Target ROAS sehat masih realistis dicapai di iklan pencarian/GMV Max' },
      { ok: currentSku.bundles[1].netProfit > currentSku.profitBeforeAds * 1.7, label: 'Paket Bundel 2 Pcs menghasilkan laba rupiah jauh lebih tebal' },
      { ok: currentSku.finalTakeHomePerOrder >= 8000, label: 'Sisa uang tunai bersih ke kantong pemilik >= Rp 8.000 per pesanan' }
    ];

    const passed = checks.filter((c) => c.ok).length;
    const pct = Math.round((passed / checks.length) * 100);
    document.getElementById('marginScorePct').textContent = pct + '%';
    document.getElementById('marginScoreFill').style.width = pct + '%';

    document.getElementById('marginChecklist').innerHTML = checks
      .map(
        (c) => `
      <div class="check-item">
        <span class="check-dot ${c.ok ? 'ok' : 'warn'}">${c.ok ? 'OK' : '!'}</span>
        <span>${c.label}</span>
      </div>`
      )
      .join('');
  }

  // 3. Flash Sale Stress Simulator
  function updateFlashSaleSim() {
    const normalPrice = Math.max(1000, Number(document.getElementById('fsNormalPrice').value) || 89000);
    const totalHpp = Math.max(0, Number(document.getElementById('fsTotalHpp').value) || 45000);
    const extraDiscPct = Math.min(80, Math.max(0, Number(document.getElementById('fsExtraDiscPct').value) || 0));
    const adminPct = Math.min(50, Math.max(0, Number(document.getElementById('fsAdminPct').value) || 13.5));
    const affPct = Math.min(40, Math.max(0, Number(document.getElementById('fsAffPct').value) || 0));
    const voucherRp = Math.max(0, Number(document.getElementById('fsVoucherRp').value) || 0);
    const adPerOrder = Math.max(0, Number(document.getElementById('fsAdPerOrder').value) || 0);
    const qty = Math.max(1, Number(document.getElementById('fsTargetQty').value) || 100);

    const flashPrice = Math.round(normalPrice * (1 - extraDiscPct / 100));
    const buyerPaidAfterVoucher = Math.max(0, flashPrice - voucherRp);
    const adminRp = Math.round(buyerPaidAfterVoucher * (adminPct / 100)) + 1250;
    const affRp = Math.round(buyerPaidAfterVoucher * (affPct / 100));
    const netUnit = buyerPaidAfterVoucher - totalHpp - adminRp - affRp - adPerOrder;
    const totalCampaign = netUnit * qty;

    const badge = document.getElementById('fsStatusBadge');
    const title = document.getElementById('fsVerdictTitle');
    const sub = document.getElementById('fsVerdictSub');
    const totBox = document.getElementById('fsTotalBox');

    if (netUnit < 0) {
      badge.className = 'badge';
      badge.textContent = 'BAHAYA BONCOS — JANGAN AKTIFKAN';
      title.textContent = `Rugi ${formatRp(Math.abs(netUnit))} Setiap 1 Barang Laku!`;
      sub.textContent = `Tumpukan diskon Flash Sale ${extraDiscPct}% + komisi affiliate ${affPct}% + iklan membuat toko nombok. Kurangi diskon atau matikan voucher tambahan.`;
      totBox.classList.add('loss');
    } else if (netUnit < 5000) {
      badge.className = 'badge';
      badge.textContent = 'RAWAN KERJA BAKTI';
      title.textContent = `Tipis Sekali: Sisa ${formatRp(netUnit)} / Pcs`;
      sub.textContent = 'Masih positif tipis, tetapi bila ada 3–4 paket retur rusak saja keuntungan kampanye bisa habis.';
      totBox.classList.remove('loss');
    } else {
      badge.className = 'badge badge-profit';
      badge.textContent = 'AMAN DIIKUTI — TETAP UNTUNG';
      title.textContent = `Untung Bersih ${formatRp(netUnit)} / Pcs`;
      sub.textContent = 'Struktur harga ini tahan terhadap potongan bertumpuk tanggal kembar sekaligus memberi perputaran kas sehat.';
      totBox.classList.remove('loss');
    }

    const fsRows = [
      ['Harga Flash Sale Setelah Diskon ' + extraDiscPct + '%', formatRp(flashPrice)],
      ['Dikurangi Voucher Toko', '- ' + formatRp(voucherRp)],
      ['HPP + Packing + Cadangan', '- ' + formatRp(totalHpp)],
      ['Potongan Admin Platform + Biaya Resi', '- ' + formatRp(adminRp)],
      ['Komisi Affiliate Kreator (' + affPct + '%)', '- ' + formatRp(affRp)],
      ['Biaya Iklan per Pesanan', '- ' + formatRp(adPerOrder)]
    ];

    document.getElementById('fsBreakdownRows').innerHTML = fsRows
      .map(
        ([l, r]) => `<div class="ledger-row"><span>${l}</span><span class="num-mono" style="font-weight:600;">${r}</span></div>`
      )
      .join('');

    totBox.querySelector('span:first-child').textContent = `Total Hasil Bersih ${qty} Pcs Habis`;
    document.getElementById('fsTotalCampaignRp').textContent = formatRp(totalCampaign);
  }

  // 4. Library 120 Strategies
  function renderLibraryCategoryPills() {
    const wrap = document.getElementById('libCategoryPills');
    if (!wrap) return;
    const map = new Map();
    map.set('ALL', 'Semua (120)');
    DATA.library.forEach((it) => {
      if (!map.has(it.category)) map.set(it.category, it.shortCategory || it.category);
    });

    wrap.innerHTML = '';
    map.forEach((shortLabel, fullCat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-pill' + (activeLibCategory === fullCat ? ' active' : '');
      btn.textContent = shortLabel;
      btn.addEventListener('click', () => {
        activeLibCategory = fullCat;
        renderLibraryCategoryPills();
        renderLibraryGrid();
      });
      wrap.appendChild(btn);
    });
  }

  function renderLibraryGrid() {
    const grid = document.getElementById('libCardsGrid');
    const info = document.getElementById('libCountInfo');
    if (!grid) return;

    const q = (document.getElementById('libSearchInput').value || '').trim().toLowerCase();
    const niche = document.getElementById('libNicheSelect').value;

    const filtered = DATA.library.filter((it) => {
      if (activeLibCategory !== 'ALL' && it.category !== activeLibCategory) return false;
      if (niche !== 'ALL' && it.niche !== niche) return false;
      if (q) {
        const hay = `${it.title} ${it.formulaText} ${it.actionStep} ${it.niche} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    info.textContent = `Menampilkan ${filtered.length} dari ${DATA.library.length} strategi siap pakai`;
    grid.innerHTML = '';

    filtered.forEach((item) => {
      const isFav = state.favorites.includes(item.id);
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="badge">${item.shortCategory}</span>
            <span class="badge badge-neutral">${item.niche}</span>
          </div>
          <h3 style="font-size:16.5px; font-weight:700; margin-top:12px;">${item.title}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">${item.formulaText.slice(0, 122)}${item.formulaText.length > 122 ? '...' : ''}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--color-hairline); font-size:13px; font-weight:700;">
          <span style="color:var(--color-accent);">Buka Rumus &amp; SOP</span>
          <span>${isFav ? 'Tersimpan' : 'Detail'}</span>
        </div>
      `;
      card.addEventListener('click', () => openLibModal(item));
      grid.appendChild(card);
    });
  }

  function openLibModal(item) {
    activeModalItem = item;
    document.getElementById('modalCategoryBadge').textContent = item.shortCategory || item.category;
    document.getElementById('modalNicheBadge').textContent = item.niche;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalFormulaText').textContent = item.formulaText;
    document.getElementById('modalActionStep').textContent = item.actionStep;
    document.getElementById('modalProfitTip').textContent = item.profitTip;

    document.getElementById('modalToggleFavBtn').textContent = state.favorites.includes(item.id)
      ? 'Hapus dari Favorit'
      : 'Simpan ke Favorit';

    document.getElementById('libModal').classList.add('open');
  }

  function closeLibModal() {
    document.getElementById('libModal').classList.remove('open');
  }

  function renderFavoritesGrid() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    const items = DATA.library.filter((it) => state.favorites.includes(it.id));
    if (items.length === 0) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><p class="text-sm text-muted">Belum ada strategi yang ditandai favorit. Buka Pustaka 120 Strategi untuk menyimpan rumus andalan tokomu.</p></div>`;
      return;
    }
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <span class="badge">${item.shortCategory}</span>
          <h3 style="font-size:16.5px; font-weight:700; margin-top:10px;">${item.title}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">${item.formulaText}</p>
        </div>
        <div style="font-size:13px; font-weight:700; color:var(--color-accent);">Buka Detail</div>
      `;
      card.addEventListener('click', () => openLibModal(item));
      grid.appendChild(card);
    });
  }

  // Save & History
  function saveCurrentSku(silent) {
    const sellVal = Number(document.getElementById('wizSellPrice').value) || calcRecommendedPriceFromStep1();
    currentSku = buildSkuObject(sellVal);
    const copy = JSON.parse(JSON.stringify(currentSku));
    const idx = state.skus.findIndex((s) => s.id === copy.id);
    if (idx >= 0) state.skus[idx] = copy;
    else state.skus.unshift(copy);
    saveState();
    updateBadges();
    renderHistoryList();
    if (!silent) showToast('SKU disimpan ke Buku Besar Riwayat');
  }

  function recordExport() {
    saveCurrentSku(true);
    state.exportsCount = (state.exportsCount || 0) + 1;
    saveState();
    updateBadges();
  }

  function renderHistoryList() {
    const wrap = document.getElementById('historyListContainer');
    if (!wrap) return;
    if (state.skus.length === 0) {
      wrap.innerHTML = `<div class="card"><p class="text-sm text-muted">Belum ada produk yang disimpan. Hitung SKU pertamamu di menu Wizard Harga &amp; ROAS.</p></div>`;
      return;
    }
    wrap.innerHTML = '';
    state.skus.forEach((sku) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.padding = '20px 24px';
      div.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:14px;">
          <div>
            <span class="badge">${sku.platform}</span>
            <span class="badge badge-profit" style="margin-left:6px;">ROAS Wajib >= ${sku.healthyRoas.toFixed(2)}x</span>
            <h3 class="heading-card" style="margin-top:10px;">${sku.skuName}</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">Tayang ${formatRp(sku.sellingPrice)} • Laba Sebelum Iklan ${formatRp(sku.profitBeforeAds)}/pcs • Bersih Kantong ${formatRp(sku.finalTakeHomePerOrder)}/pcs</p>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button type="button" class="btn btn-primary open-sku-btn">Buka Audit</button>
            <button type="button" class="btn btn-secondary pdf-sku-btn">Unduh PDF</button>
            <button type="button" class="btn btn-ghost del-sku-btn">Hapus</button>
          </div>
        </div>
      `;
      div.querySelector('.open-sku-btn').addEventListener('click', () => {
        currentSku = JSON.parse(JSON.stringify(sku));
        document.getElementById('skuName').value = sku.skuName;
        document.getElementById('skuHpp').value = sku.hpp;
        document.getElementById('skuPacking').value = sku.packingCost;
        document.getElementById('skuReturnBuf').value = sku.returnBuffer;
        document.getElementById('skuAdminPct').value = sku.adminPct;
        document.getElementById('skuXtraPct').value = sku.programXtraPct;
        document.getElementById('skuFixedFee').value = sku.fixedOrderFee;
        document.getElementById('skuVoucher').value = sku.voucherSellerRp;
        document.getElementById('skuTargetProfit').value = sku.targetProfit;
        document.getElementById('wizSellPrice').value = sku.sellingPrice;
        switchView('wizard');
        goToStep(3);
      });
      div.querySelector('.pdf-sku-btn').addEventListener('click', () => {
        window.LabaTokoExporter.exportMarginAuditPdf(sku, state.store);
        showToast('Lembar Audit PDF diunduh');
      });
      div.querySelector('.del-sku-btn').addEventListener('click', () => {
        state.skus = state.skus.filter((s) => s.id !== sku.id);
        saveState();
        updateBadges();
        renderHistoryList();
      });
      wrap.appendChild(div);
    });
  }

  function switchView(viewName) {
    document.querySelectorAll('.view-panel').forEach((p) => {
      p.classList.toggle('active', p.id === 'view-' + viewName);
    });
    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    document.querySelectorAll('.mob-nav-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateBadges() {
    document.getElementById('statSkus').textContent = String(state.skus.length);
    document.getElementById('statExports').textContent = String(state.exportsCount || 0);
    document.getElementById('statFavs').textContent = String(state.favorites.length);
    document.getElementById('historyBadge').textContent = String(state.skus.length);
    document.getElementById('favBadge').textContent = String(state.favorites.length);

    document.getElementById('greetStoreName').textContent = state.store.storeName || 'Toko Online';
    document.getElementById('sidebarStoreName').textContent = state.store.storeName || 'Toko Online';
    document.getElementById('sidebarOwnerName').textContent = state.store.ownerName || 'Pemilik';

    document.getElementById('setOwnerName').value = state.store.ownerName || '';
    document.getElementById('setStoreName').value = state.store.storeName || '';
    document.getElementById('setStoreEmail').value = state.store.email || '';
  }

  function enterStudio() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    applyTheme(state.store.theme || 'light');
    renderPresetChips();
    if (DATA.presets[0] && !document.getElementById('skuName').value) {
      applyPresetToForm(DATA.presets[0]);
    }
    updateQuickLeakScanner();
    updateFlashSaleSim();
    renderLibraryCategoryPills();
    renderLibraryGrid();
    renderFavoritesGrid();
    renderHistoryList();
    updateBadges();
  }

  function bindEvents() {
    document.getElementById('fillDemoLoginBtn').addEventListener('click', () => {
      document.getElementById('loginOwner').value = 'Hendra Wijaya';
      document.getElementById('loginStore').value = 'Berkah Sandang Official';
      document.getElementById('loginEmail').value = 'hendra@berkahsandang.id';
      document.getElementById('loginCode').value = 'LABA-2026-PRO';
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const ownerName = document.getElementById('loginOwner').value.trim();
      const storeName = document.getElementById('loginStore').value.trim();
      const email = document.getElementById('loginEmail').value.trim();
      const code = document.getElementById('loginCode').value.trim().toUpperCase();
      const errEl = document.getElementById('loginError');

      if (code.length < 6) {
        errEl.textContent = 'Masukkan kode lisensi pembelian yang valid (contoh demo: LABA-2026-PRO).';
        errEl.classList.remove('hidden');
        return;
      }
      errEl.classList.add('hidden');
      state.store = {
        ...state.store,
        loggedIn: true,
        ownerName,
        storeName,
        email,
        license: code
      };
      saveState();
      enterStudio();
      showToast('Selamat datang di LabaToko Studio, ' + storeName);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      state.store.loggedIn = false;
      saveState();
      document.getElementById('appShell').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
    });

    const toggleTheme = () => applyTheme(state.store.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeBtn').addEventListener('click', toggleTheme);
    document.getElementById('settingsThemeBtn').addEventListener('click', toggleTheme);
    document.getElementById('mobileSettingsBtn').addEventListener('click', () => switchView('settings'));

    document.querySelectorAll('.nav-btn, .mob-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('.jump-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.target));
    });
    document.getElementById('heroStartWizardBtn').addEventListener('click', () => switchView('wizard'));

    // Quick Leak Scanner
    ['qHpp', 'qPrice', 'qAdminPct', 'qAdCpa'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateQuickLeakScanner);
    });

    document.getElementById('sendQuickToWizardBtn').addEventListener('click', () => {
      const qHpp = Number(document.getElementById('qHpp').value) || 45000;
      const qAdmin = Number(document.getElementById('qAdminPct').value) || 13.5;
      document.getElementById('skuHpp').value = Math.max(1000, qHpp - 2200);
      document.getElementById('skuPacking').value = 2200;
      document.getElementById('skuAdminPct').value = Math.max(0, (qAdmin - 5).toFixed(1));
      document.getElementById('skuXtraPct').value = 5.0;
      const rec = calcRecommendedPriceFromStep1();
      document.getElementById('wizSellPrice').value = rec;
      switchView('wizard');
      goToStep(1);
      showToast('Data dipindahkan ke Wizard untuk dirancang harga sehatnya');
    });

    // Wizard Step 1 live recommended price
    ['skuHpp', 'skuPacking', 'skuReturnBuf', 'skuAdminPct', 'skuXtraPct', 'skuFixedFee', 'skuVoucher', 'skuTargetProfit'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('input', () => {
          const rec = calcRecommendedPriceFromStep1();
          document.getElementById('wizSellPrice').value = rec;
        });
      }
    );

    // Wizard Step 2 live updates
    ['wizSellPrice', 'wizStrikePct', 'wizAdShareSelect'].forEach((id) => {
      document.getElementById(id).addEventListener('input', renderStep2);
      document.getElementById(id).addEventListener('change', renderStep2);
    });

    document.querySelectorAll('.step-tab').forEach((tab) => {
      tab.addEventListener('click', () => goToStep(Number(tab.dataset.step)));
    });

    document.getElementById('toStep2Btn').addEventListener('click', () => {
      document.getElementById('wizSellPrice').value = calcRecommendedPriceFromStep1();
      goToStep(2);
    });
    document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));
    document.getElementById('toStep3Btn').addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep2Btn').addEventListener('click', () => goToStep(2));

    document.getElementById('saveSkuBtn').addEventListener('click', () => saveCurrentSku(false));

    document.getElementById('sendToFlashSaleBtn').addEventListener('click', () => {
      if (!currentSku) currentSku = buildSkuObject();
      document.getElementById('fsNormalPrice').value = currentSku.sellingPrice;
      document.getElementById('fsTotalHpp').value = currentSku.hpp + currentSku.packingCost + currentSku.returnBuffer;
      document.getElementById('fsAdminPct').value = currentSku.totalFeePct;
      document.getElementById('fsVoucherRp').value = currentSku.voucherSellerRp;
      document.getElementById('fsAdPerOrder').value = currentSku.healthyCpaTarget;
      updateFlashSaleSim();
      switchView('flashsale');
      showToast('SKU dimuat ke Simulasi Kampanye Flash Sale');
    });

    // 4 Real File Exports
    document.getElementById('dlAuditPdfBtn').addEventListener('click', () => {
      if (!currentSku) currentSku = buildSkuObject();
      window.LabaTokoExporter.exportMarginAuditPdf(currentSku, state.store);
      recordExport();
      showToast('Lembar Audit Margin & ROAS (.PDF) diunduh');
    });

    document.getElementById('dlAdminPngBtn').addEventListener('click', async () => {
      if (!currentSku) currentSku = buildSkuObject();
      await window.LabaTokoExporter.exportAdminCardPng(currentSku, state.store);
      recordExport();
      showToast('Kartu Rambu Admin (.PNG) berhasil diunduh');
    });

    document.getElementById('dlTrackerCsvBtn').addEventListener('click', () => {
      if (!currentSku) currentSku = buildSkuObject();
      window.LabaTokoExporter.exportProfitTrackerCsv(currentSku, state.store);
      recordExport();
      showToast('Tabel Pelacak Untung & Iklan 30 Hari (.CSV) diunduh');
    });

    document.getElementById('dlSopDocxBtn').addEventListener('click', () => {
      if (!currentSku) currentSku = buildSkuObject();
      window.LabaTokoExporter.exportStoreSopDocx(currentSku, state.store);
      recordExport();
      showToast('Dokumen SOP Promo & Iklan (.DOCX Word) diunduh');
    });

    document.getElementById('copyStoreAiPromptBtn').addEventListener('click', () => {
      if (!currentSku) currentSku = buildSkuObject();
      const prompt = `Saya menjual produk "${currentSku.skuName}" di ${currentSku.platform} dengan harga tayang ${formatRp(
        currentSku.sellingPrice
      )} (harga coret ${formatRp(currentSku.strikePrice)}) dan menyediakan Paket Hemat 2 Pcs seharga ${formatRp(
        currentSku.bundles[1].bundlePrice
      )}. Tolong buatkan: 1) 5 variasi judul produk ramah pencarian marketplace Indonesia (70-95 karakter), 2) Teks singkat untuk 5 urutan foto etalase, dan 3) Deskripsi produk yang rapi dibaca di HP.`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt);
      }
      showToast('Prompt optimasi etalase disalin ke papan klip');
    });

    // Flash Sale inputs
    ['fsNormalPrice', 'fsTotalHpp', 'fsExtraDiscPct', 'fsAdminPct', 'fsAffPct', 'fsVoucherRp', 'fsAdPerOrder', 'fsTargetQty'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('input', updateFlashSaleSim);
      }
    );

    // Library & Modal
    document.getElementById('libSearchInput').addEventListener('input', renderLibraryGrid);
    document.getElementById('libNicheSelect').addEventListener('change', renderLibraryGrid);
    document.getElementById('closeModalBtn').addEventListener('click', closeLibModal);
    document.getElementById('libModal').addEventListener('click', (e) => {
      if (e.target.id === 'libModal') closeLibModal();
    });

    document.getElementById('modalCopyBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(activeModalItem.formulaText);
      }
      showToast('Rumus disalin ke papan klip');
    });

    document.getElementById('modalToggleFavBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      const idx = state.favorites.indexOf(activeModalItem.id);
      if (idx >= 0) {
        state.favorites.splice(idx, 1);
        document.getElementById('modalToggleFavBtn').textContent = 'Simpan ke Favorit';
        showToast('Dihapus dari Favorit');
      } else {
        state.favorites.push(activeModalItem.id);
        document.getElementById('modalToggleFavBtn').textContent = 'Hapus dari Favorit';
        showToast('Disimpan ke Strategi Favorit');
      }
      saveState();
      updateBadges();
      renderLibraryGrid();
      renderFavoritesGrid();
    });

    // Profile & Backup
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      state.store.ownerName = document.getElementById('setOwnerName').value.trim();
      state.store.storeName = document.getElementById('setStoreName').value.trim();
      state.store.email = document.getElementById('setStoreEmail').value.trim();
      saveState();
      updateBadges();
      showToast('Profil toko berhasil diperbarui');
    });

    document.getElementById('exportBackupBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cadangan-LabaToko-Studio.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showToast('Cadangan data SKU berhasil diunduh');
    });

    document.getElementById('importBackupInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          if (parsed && parsed.store) {
            state = {
              store: { ...defaultStore, ...parsed.store, loggedIn: true },
              skus: Array.isArray(parsed.skus) ? parsed.skus : [],
              favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
              exportsCount: Number(parsed.exportsCount) || 0
            };
            saveState();
            enterStudio();
            showToast('Cadangan data SKU berhasil dipulihkan');
          }
        } catch (err) {
          showToast('File JSON tidak valid');
        }
      };
      reader.readAsText(file);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    applyTheme(state.store.theme || 'light');
    if (state.store.loggedIn) enterStudio();
  });
})();

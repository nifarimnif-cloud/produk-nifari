// LabaToko Studio — Logika Utama Kalkulator Untung Toko Online & Batas Aman Iklan
(function () {
  const STORAGE_KEY = 'labatoko_studio_state_v1';
  const DATA = window.LABATOKO_DATA || { presets: [], library: [] };

  const AUTH_SALT = 'nifari-lic-2026::';
  const CREATOR_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
  const BUYER_HASH = '8d4e9a9392fd7a396f4ad18cb14c42e2349677cf29fa60764a6fd065a3dbd600';

  function sha256Hex(str) {
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
    const bytes = Array.from(new TextEncoder().encode(String(str)));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLen / 0x100000000);
    const lo = bitLen >>> 0;
    bytes.push(
      (hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255
    );
    let H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const W = new Int32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < bytes.length; i += 64) {
      for (let t = 0; t < 16; t++) {
        const j = i + t * 4;
        W[t] = (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3];
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      H = [
        (H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0,
        (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0
      ];
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  function hashAccessCode(rawCode) {
    const clean = String(rawCode || '').trim().toUpperCase();
    if (!clean) return '';
    return sha256Hex(AUTH_SALT + clean);
  }

  function isValidSessionStore(store) {
    return Boolean(
      store &&
      store.loggedIn === true &&
      (store.validHash === CREATOR_HASH || store.validHash === BUYER_HASH)
    );
  }

  const defaultStore = {
    loggedIn: false,
    ownerName: '',
    storeName: '',
    email: '',
    validHash: '',
    theme: 'light'
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const mergedStore = { ...defaultStore, ...(parsed.store || {}) };
        delete mergedStore.license;
        if (!isValidSessionStore(mergedStore)) {
          mergedStore.loggedIn = false;
          mergedStore.validHash = '';
        }
        return {
          store: mergedStore,
          skus: Array.isArray(parsed.skus) ? parsed.skus : [],
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          exportsCount: Number.isFinite(Number(parsed.exportsCount)) ? Number(parsed.exportsCount) : 0,
          customSellPriceEdited: false
        };
      }
    } catch (e) {
      // ignore invalid json
    }
    return {
      store: { ...defaultStore },
      skus: [],
      favorites: [],
      exportsCount: 0,
      customSellPriceEdited: false
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
      const cleanStore = { ...state.store };
      delete cleanStore.license;
      const toPersist = {
        store: cleanStore,
        skus: state.skus,
        favorites: state.favorites,
        exportsCount: state.exportsCount
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      // ignore storage quota
    }
  }

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readNum(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const raw = String(el.value).trim();
    if (raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatRp(num) {
    const n = Math.round(Number.isFinite(Number(num)) ? Number(num) : 0);
    const neg = n < 0 ? '-' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    state.store.theme = t;
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = t === 'dark' ? 'Tema Terang' : 'Tema Gelap';
    saveState();
  }

  function openMobileDrawer() {
    const drawer = document.getElementById('sidebarDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  }

  function closeMobileDrawer() {
    const drawer = document.getElementById('sidebarDrawer');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  function setSelectValueSafe(selectId, value, fallbackValue) {
    const sel = document.getElementById(selectId);
    if (!sel) return '';
    const target = String(value == null ? '' : value).trim();
    if (target) {
      const hasOption = Array.from(sel.options).some((opt) => opt.value === target);
      if (!hasOption) {
        const opt = document.createElement('option');
        opt.value = target;
        opt.textContent = target;
        sel.appendChild(opt);
      }
      sel.value = target;
    } else if (fallbackValue != null) {
      sel.value = String(fallbackValue);
    }
    if (!sel.value && sel.options.length > 0) {
      sel.selectedIndex = 0;
    }
    return sel.value;
  }

  // 1. Dashboard Quick Leak Scanner
  function updateQuickLeakScanner() {
    const hpp = Math.max(0, readNum('qHpp', 0));
    const price = Math.max(1000, readNum('qPrice', 1000));
    const adminPct = Math.min(85, Math.max(0, readNum('qAdminPct', 0)));
    const adCpa = Math.max(0, readNum('qAdCpa', 0));

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

  // Unified Step 1 Cost & Clamped Fee Reader (<= 85%)
  function readStep1Parameters() {
    const hpp = Math.max(0, readNum('skuHpp', 0));
    const packingCost = Math.max(0, readNum('skuPacking', 0));
    const returnBuffer = Math.max(0, readNum('skuReturnBuf', 0));
    const adminPct = Math.max(0, readNum('skuAdminPct', 0));
    const programXtraPct = Math.max(0, readNum('skuXtraPct', 0));
    const fixedOrderFee = Math.max(0, readNum('skuFixedFee', 0));
    const voucherSellerRp = Math.max(0, readNum('skuVoucher', 0));
    const targetProfit = Math.max(0, readNum('skuTargetProfit', 0));

    const rawTotalFeePct = adminPct + programXtraPct;
    const isFeeCapped = rawTotalFeePct > 85;
    const totalFeePct = Math.min(85, Math.max(0, rawTotalFeePct));

    const warnEl = document.getElementById('step1FeeWarn');
    if (warnEl) {
      if (isFeeCapped) {
        warnEl.textContent = `Perhatian: Total biaya Admin + Promo Xtra (${rawTotalFeePct.toFixed(1)}%) tidak realistis dan otomatis dibatasi maksimal 85% agar perhitungan harga tetap aman.`;
        warnEl.classList.remove('hidden');
      } else {
        warnEl.classList.add('hidden');
      }
    }

    return {
      hpp,
      packingCost,
      returnBuffer,
      adminPct,
      programXtraPct,
      rawTotalFeePct,
      totalFeePct,
      isFeeCapped,
      fixedOrderFee,
      voucherSellerRp,
      targetProfit
    };
  }

  // 2. Step 1 Recommended Price Computation
  function calcRecommendedPriceFromStep1() {
    const p = readStep1Parameters();
    const denom = 1 - p.totalFeePct / 100; // >= 0.15 since totalFeePct <= 85
    const fixedCosts = p.hpp + p.packingCost + p.returnBuffer + p.fixedOrderFee + p.voucherSellerRp;
    const desiredProfit = Math.max(1000, p.targetProfit);
    const rawPrice = (fixedCosts + desiredProfit) / denom;
    let rounded = Math.max(1000, Math.ceil(rawPrice / 1000) * 1000);

    // Ensure rounding never drops profit below desired minimum (> 0 always)
    let safety = 0;
    while (
      rounded - fixedCosts - Math.round(rounded * (p.totalFeePct / 100)) < Math.max(1, p.targetProfit) &&
      safety < 50
    ) {
      rounded += 1000;
      safety++;
    }

    const recEl = document.getElementById('step1RecPrice');
    if (recEl) recEl.textContent = formatRp(rounded);
    return rounded;
  }

  function validateStep1() {
    const nameInp = document.getElementById('skuName');
    const hppInp = document.getElementById('skuHpp');
    const nameVal = (nameInp ? nameInp.value : '').trim();
    const rawHpp = hppInp ? String(hppInp.value).trim() : '';
    const hppNum = rawHpp === '' ? NaN : Number(rawHpp);

    const nameMissing = !nameVal;
    const hppMissing = !Number.isFinite(hppNum) || hppNum <= 0;

    if (nameInp) nameInp.classList.toggle('input-error', nameMissing);
    if (hppInp) hppInp.classList.toggle('input-error', hppMissing);

    if (nameMissing || hppMissing) {
      if (activeStep !== 1) {
        activeStep = 1;
        document.querySelectorAll('.step-tab').forEach((t) => {
          t.classList.toggle('active', Number(t.dataset.step) === 1);
        });
        document.getElementById('wizStep1').classList.remove('hidden');
        document.getElementById('wizStep2').classList.add('hidden');
        document.getElementById('wizStep3').classList.add('hidden');
      }
      if (nameMissing && nameInp) nameInp.focus();
      else if (hppMissing && hppInp) hppInp.focus();
      showToast('Isi dulu Nama Produk dan Modal HPP di Langkah 1 ya.');
      return false;
    }
    return true;
  }

  // Build Complete SKU Object
  function buildSkuObject(customSellingPrice) {
    const skuName = document.getElementById('skuName').value.trim() || 'Produk Utama Toko';
    const platform = setSelectValueSafe('skuPlatform', document.getElementById('skuPlatform').value);
    const p = readStep1Parameters();

    const recPrice = calcRecommendedPriceFromStep1();
    const parsedCustom = Number(customSellingPrice);
    const sellingPrice = Math.max(
      1000,
      Number.isFinite(parsedCustom) && parsedCustom >= 1000 ? parsedCustom : recPrice
    );
    const strikeDiscountPct = readNum('wizStrikePct', 25) || 25;
    const strikePrice = Math.ceil(sellingPrice / (1 - strikeDiscountPct / 100) / 1000) * 1000;

    const totalFeePct = p.totalFeePct;
    const marketplaceFeeRp = Math.round(sellingPrice * (totalFeePct / 100));
    const baseUnitCost = p.hpp + p.packingCost + p.returnBuffer;
    const profitBeforeAds = sellingPrice - baseUnitCost - marketplaceFeeRp - p.fixedOrderFee - p.voucherSellerRp;
    const netMarginBeforeAdsPct = (profitBeforeAds / sellingPrice) * 100;

    const adSharePct = readNum('wizAdShareSelect', 40) || 40;
    const maxCpaBreakEven = Math.max(0, profitBeforeAds);
    const healthyCpaTarget = profitBeforeAds > 0 ? Math.max(500, Math.round(profitBeforeAds * (adSharePct / 100))) : 0;
    const finalTakeHomePerOrder = profitBeforeAds - healthyCpaTarget;
    const breakEvenRoas = profitBeforeAds > 0 ? sellingPrice / profitBeforeAds : 99.9;
    const healthyRoas = healthyCpaTarget > 0 ? sellingPrice / healthyCpaTarget : 99.9;

    // 3 Bundle Packages
    const disc2 = Math.max(2000, Math.round((sellingPrice * 2 * 0.05) / 1000) * 1000);
    const b2Price = sellingPrice * 2 - disc2;
    const b2Fee = Math.round(b2Price * (totalFeePct / 100)) + p.fixedOrderFee + p.voucherSellerRp;
    const b2Cost = p.hpp * 2 + Math.round(p.packingCost * 1.35) + p.returnBuffer * 2 + b2Fee;
    const b2Net = b2Price - b2Cost;

    const disc3 = Math.max(5000, Math.round((sellingPrice * 3 * 0.08) / 1000) * 1000);
    const b3Price = sellingPrice * 3 - disc3;
    const b3Fee = Math.round(b3Price * (totalFeePct / 100)) + p.fixedOrderFee + p.voucherSellerRp;
    const b3Cost = p.hpp * 3 + Math.round(p.packingCost * 1.65) + p.returnBuffer * 3 + b3Fee;
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
      skuPlatform: platform,
      hpp: p.hpp,
      packingCost: p.packingCost,
      returnBuffer: p.returnBuffer,
      adminPct: p.adminPct,
      programXtraPct: p.programXtraPct,
      totalFeePct,
      fixedOrderFee: p.fixedOrderFee,
      voucherSellerRp: p.voucherSellerRp,
      targetProfit: p.targetProfit,
      sellingPrice,
      strikeDiscountPct,
      wizStrikePct: strikeDiscountPct,
      strikePrice,
      marketplaceFeeRp,
      profitBeforeAds,
      netMarginBeforeAdsPct,
      adSharePct,
      wizAdShareSelect: adSharePct,
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
        currentSku = null;
        applyPresetToForm(p);
        renderPresetChips();
        showToast('Preset ' + p.label + ' dimuat');
      });
      grid.appendChild(btn);
    });
  }

  function applyPresetToForm(p) {
    if (!p) return;
    const nameInp = document.getElementById('skuName');
    const hppInp = document.getElementById('skuHpp');
    if (nameInp) nameInp.classList.remove('input-error');
    if (hppInp) hppInp.classList.remove('input-error');

    document.getElementById('skuName').value = p.skuName;
    setSelectValueSafe('skuPlatform', p.platform);
    document.getElementById('skuHpp').value = p.hpp;
    document.getElementById('skuPacking').value = p.packingCost;
    document.getElementById('skuReturnBuf').value = p.returnBuffer;
    document.getElementById('skuAdminPct').value = p.adminPct;
    document.getElementById('skuXtraPct').value = p.programXtraPct;
    document.getElementById('skuFixedFee').value = p.fixedOrderFee;
    document.getElementById('skuVoucher').value = p.voucherSellerRp;
    document.getElementById('skuTargetProfit').value = p.targetNetProfit;

    state.customSellPriceEdited = false;
    const rec = calcRecommendedPriceFromStep1();
    document.getElementById('wizSellPrice').value = rec;
    currentSku = buildSkuObject(rec);
  }

  function syncSellPriceBeforeStep2Or3() {
    const rec = calcRecommendedPriceFromStep1();
    const sellInp = document.getElementById('wizSellPrice');
    const curVal = readNum('wizSellPrice', 0);

    if (!state.customSellPriceEdited || curVal < 1000) {
      sellInp.value = rec;
      state.customSellPriceEdited = false;
      return rec;
    }

    // User customized wizSellPrice: preserve it unless Step 1 costs rose past break-even
    const checkObj = buildSkuObject(curVal);
    if (checkObj.profitBeforeAds <= 0) {
      sellInp.value = rec;
      state.customSellPriceEdited = false;
      showToast('Harga tayang disesuaikan ke harga rekomendasi aman karena modal berubah melewati batas impas.');
      return rec;
    }
    return curVal;
  }

  function goToStep(stepNum) {
    if (stepNum > 1 && !validateStep1()) {
      return;
    }

    activeStep = stepNum;
    document.querySelectorAll('.step-tab').forEach((t) => {
      t.classList.toggle('active', Number(t.dataset.step) === stepNum);
    });
    document.getElementById('wizStep1').classList.toggle('hidden', stepNum !== 1);
    document.getElementById('wizStep2').classList.toggle('hidden', stepNum !== 2);
    document.getElementById('wizStep3').classList.toggle('hidden', stepNum !== 3);

    if (stepNum === 2) {
      syncSellPriceBeforeStep2Or3();
      renderStep2();
    } else if (stepNum === 3) {
      const sellVal = syncSellPriceBeforeStep2Or3();
      currentSku = buildSkuObject(sellVal);
      renderStep3();
    }
  }

  function renderStep2() {
    const sellVal = readNum('wizSellPrice', 0) >= 1000 ? readNum('wizSellPrice', 0) : calcRecommendedPriceFromStep1();
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
          <div style="font-weight:700; font-size:13.5px;">${escHtml(b.title)}</div>
          <div class="text-muted" style="font-size:12px;">${escHtml(b.subtitle)}</div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="num-mono" style="font-weight:700;">${escHtml(formatRp(b.bundlePrice))}</div>
          <div class="num-mono" style="font-size:12px; color:${b.netProfit > 0 ? 'var(--color-profit)' : 'var(--color-accent)'};">Laba: ${escHtml(formatRp(b.netProfit))}</div>
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
        ? `<strong>Bahasa gampangnya:</strong> Setiap saldo iklan <strong>Rp 100.000</strong> terpakai, iklan produk ini wajib menghasilkan omzet minimal <strong>${escHtml(
            formatRp(omzetPer100k)
          )}</strong> supaya kamu tetap mengantongi bersih <strong>${escHtml(formatRp(currentSku.finalTakeHomePerOrder))}</strong> per barang.`
        : `<strong>Peringatan:</strong> Harga tayang saat ini belum menutup modal + potongan admin. Naikkan harga jual di sebelah kiri atau klik tombol <strong>Pakai Rekomendasi</strong>.`;
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
        <span>${escHtml(l)}</span>
        <span class="num-mono" style="font-weight:600;">${escHtml(r)}</span>
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
        <span>${escHtml(c.label)}</span>
      </div>`
      )
      .join('');
  }

  // 3. Flash Sale Stress Simulator (Zero-safe)
  function updateFlashSaleSim() {
    const normalPrice = Math.max(0, readNum('fsNormalPrice', 85000));
    const totalHpp = Math.max(0, readNum('fsTotalHpp', 0));
    const extraDiscPct = Math.min(80, Math.max(0, readNum('fsExtraDiscPct', 0)));
    const adminPct = Math.min(85, Math.max(0, readNum('fsAdminPct', 0)));
    const affPct = Math.min(50, Math.max(0, readNum('fsAffPct', 0)));
    const voucherRp = Math.max(0, readNum('fsVoucherRp', 0));
    const adPerOrder = Math.max(0, readNum('fsAdPerOrder', 0));
    const qty = Math.max(1, readNum('fsTargetQty', 100));

    const flashPrice = Math.round(normalPrice * (1 - extraDiscPct / 100));
    const buyerPaidAfterVoucher = Math.max(0, flashPrice - voucherRp);
    const adminRp = buyerPaidAfterVoucher > 0 ? Math.round(buyerPaidAfterVoucher * (adminPct / 100)) + 1250 : 0;
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
        ([l, r]) => `<div class="ledger-row"><span>${escHtml(l)}</span><span class="num-mono" style="font-weight:600;">${escHtml(r)}</span></div>`
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

  function attachCardKeyboardOpen(card, item) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLibModal(item);
      }
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
      const preview = item.formulaText.slice(0, 122) + (item.formulaText.length > 122 ? '...' : '');
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="badge">${escHtml(item.shortCategory)}</span>
            <span class="badge badge-neutral">${escHtml(item.niche)}</span>
          </div>
          <h3 style="font-size:16.5px; font-weight:700; margin-top:12px;">${escHtml(item.title)}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">${escHtml(preview)}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--color-hairline); font-size:13px; font-weight:700;">
          <span style="color:var(--color-accent);">Buka Rumus &amp; SOP</span>
          <span>${isFav ? 'Tersimpan' : 'Detail'}</span>
        </div>
      `;
      card.addEventListener('click', () => openLibModal(item));
      attachCardKeyboardOpen(card, item);
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
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="badge">${escHtml(item.shortCategory)}</span>
            <span class="badge badge-neutral">${escHtml(item.niche)}</span>
          </div>
          <h3 style="font-size:16.5px; font-weight:700; margin-top:10px;">${escHtml(item.title)}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">${escHtml(item.formulaText)}</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding-top:10px; border-top:1px solid var(--color-hairline);">
          <span style="font-size:13px; font-weight:700; color:var(--color-accent);">Buka Detail</span>
          <button type="button" class="btn btn-ghost remove-fav-btn" style="padding:5px 10px; font-size:12px;">Hapus Favorit</button>
        </div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.remove-fav-btn')) return;
        openLibModal(item);
      });
      card.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.favorites = state.favorites.filter((fid) => fid !== item.id);
        saveState();
        updateBadges();
        renderFavoritesGrid();
        renderLibraryGrid();
        showToast('Dihapus dari Strategi Favorit');
      });
      attachCardKeyboardOpen(card, item);
      grid.appendChild(card);
    });
  }

  // Save & History
  function saveCurrentSku(silent) {
    if (!silent && !validateStep1()) return;
    const sellVal = readNum('wizSellPrice', 0) >= 1000 ? readNum('wizSellPrice', 0) : calcRecommendedPriceFromStep1();
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
    const clearBtn = document.getElementById('clearAllHistoryBtn');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', state.skus.length === 0);
    }
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
      const platLabel = sku.skuPlatform || sku.platform || 'Marketplace';
      const roasText = Number.isFinite(Number(sku.healthyRoas)) ? Number(sku.healthyRoas).toFixed(2) : '0.00';
      div.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:14px;">
          <div>
            <span class="badge">${escHtml(platLabel)}</span>
            <span class="badge badge-profit" style="margin-left:6px;">ROAS Wajib &gt;= ${escHtml(roasText)}x</span>
            <h3 class="heading-card" style="margin-top:10px;">${escHtml(sku.skuName)}</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">Tayang ${escHtml(formatRp(sku.sellingPrice))} • Laba Sebelum Iklan ${escHtml(formatRp(sku.profitBeforeAds))}/pcs • Bersih Kantong ${escHtml(formatRp(sku.finalTakeHomePerOrder))}/pcs</p>
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
        activePresetId = '';
        renderPresetChips();

        document.getElementById('skuName').classList.remove('input-error');
        document.getElementById('skuHpp').classList.remove('input-error');

        document.getElementById('skuName').value = sku.skuName || '';
        setSelectValueSafe('skuPlatform', sku.skuPlatform || sku.platform);
        document.getElementById('skuHpp').value = sku.hpp ?? 0;
        document.getElementById('skuPacking').value = sku.packingCost ?? 0;
        document.getElementById('skuReturnBuf').value = sku.returnBuffer ?? 0;
        document.getElementById('skuAdminPct').value = sku.adminPct ?? 0;
        document.getElementById('skuXtraPct').value = sku.programXtraPct ?? 0;
        document.getElementById('skuFixedFee').value = sku.fixedOrderFee ?? 0;
        document.getElementById('skuVoucher').value = sku.voucherSellerRp ?? 0;
        document.getElementById('skuTargetProfit').value = sku.targetProfit ?? 0;

        setSelectValueSafe('wizStrikePct', sku.wizStrikePct ?? sku.strikeDiscountPct ?? 25, 25);
        setSelectValueSafe('wizAdShareSelect', sku.wizAdShareSelect ?? sku.adSharePct ?? 40, 40);
        document.getElementById('wizSellPrice').value = sku.sellingPrice;
        state.customSellPriceEdited = true;

        calcRecommendedPriceFromStep1();
        renderStep2();
        switchView('wizard');
        goToStep(3);
      });
      div.querySelector('.pdf-sku-btn').addEventListener('click', () => {
        window.LabaTokoExporter.exportMarginAuditPdf(sku, state.store);
        showToast('Lembar Audit PDF diunduh');
      });
      div.querySelector('.del-sku-btn').addEventListener('click', () => {
        if (!window.confirm(`Hapus riwayat audit SKU "${sku.skuName}" dari daftar?`)) return;
        state.skus = state.skus.filter((s) => s.id !== sku.id);
        saveState();
        updateBadges();
        renderHistoryList();
        showToast('Riwayat SKU dihapus');
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
    closeMobileDrawer();
    if (viewName === 'favorites') renderFavoritesGrid();
    if (viewName === 'history') renderHistoryList();
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

  function performLogout() {
    closeMobileDrawer();
    state.store.loggedIn = false;
    state.store.validHash = '';
    saveState();
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginCode').value = '';
    document.getElementById('loginError').classList.add('hidden');
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
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawOwner = document.getElementById('loginOwner').value.trim();
      const rawStore = document.getElementById('loginStore').value.trim();
      const rawEmail = document.getElementById('loginEmail').value.trim();
      const rawCode = document.getElementById('loginCode').value;
      const errEl = document.getElementById('loginError');

      const codeHash = hashAccessCode(rawCode);

      if (codeHash === CREATOR_HASH) {
        errEl.classList.add('hidden');
        const ownerName = rawOwner || 'Nifari (Kreator Utama)';
        const storeName = rawStore || 'Toko Resmi Nifari';
        const email = rawEmail || 'creator@nifari.id';
        state.store = {
          ...state.store,
          loggedIn: true,
          ownerName,
          storeName,
          email,
          validHash: codeHash
        };
        saveState();
        enterStudio();
        showToast('Selamat datang di LabaToko Studio, ' + storeName);
        return;
      }

      if (!rawOwner || !rawStore || !rawEmail || !rawCode.trim()) {
        errEl.textContent = 'Mohon lengkapi nama pemilik, nama toko online, email aktif, dan kode akses pembelian resmi.';
        errEl.classList.remove('hidden');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        errEl.textContent = 'Format alamat email belum tepat. Periksa kembali penulisan emailmu.';
        errEl.classList.remove('hidden');
        return;
      }

      if (codeHash !== BUYER_HASH) {
        errEl.textContent = 'Kode akses pembelian tidak dikenali. Periksa kembali kode resmimu atau ambil akses di halaman utama.';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');
      state.store = {
        ...state.store,
        loggedIn: true,
        ownerName: rawOwner,
        storeName: rawStore,
        email: rawEmail,
        validHash: codeHash
      };
      saveState();
      enterStudio();
      showToast('Selamat datang di LabaToko Studio, ' + rawStore);
    });

    document.getElementById('logoutBtn').addEventListener('click', performLogout);
    document.getElementById('settingsLogoutBtn').addEventListener('click', performLogout);

    const toggleTheme = () => applyTheme(state.store.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeBtn').addEventListener('click', toggleTheme);
    document.getElementById('settingsThemeBtn').addEventListener('click', toggleTheme);

    document.getElementById('mobileFavBtn').addEventListener('click', () => switchView('favorites'));
    document.getElementById('settingsFavBtn').addEventListener('click', () => switchView('favorites'));
    document.getElementById('mobileMenuBtn').addEventListener('click', openMobileDrawer);
    document.getElementById('closeMobileDrawerBtn').addEventListener('click', closeMobileDrawer);
    document.getElementById('mobileDrawerBackdrop').addEventListener('click', closeMobileDrawer);

    document.querySelectorAll('.nav-btn, .mob-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('.jump-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.target));
    });
    document.getElementById('heroStartWizardBtn').addEventListener('click', () => {
      currentSku = null;
      state.customSellPriceEdited = false;
      switchView('wizard');
      goToStep(1);
    });

    // Quick Leak Scanner
    ['qHpp', 'qPrice', 'qAdminPct', 'qAdCpa'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateQuickLeakScanner);
    });

    document.getElementById('sendQuickToWizardBtn').addEventListener('click', () => {
      const qHpp = Math.max(0, readNum('qHpp', 45000));
      const qPrice = Math.max(1000, readNum('qPrice', 85000));
      const qAdmin = Math.min(85, Math.max(0, readNum('qAdminPct', 13.5)));

      activePresetId = '';
      currentSku = null;
      renderPresetChips();

      const skuNameInp = document.getElementById('skuName');
      const isPresetName = DATA.presets.some((pr) => pr.skuName === skuNameInp.value.trim());
      if (!skuNameInp.value.trim() || isPresetName) {
        skuNameInp.value = 'Produk Etalase Saat Ini';
      }
      skuNameInp.classList.remove('input-error');
      document.getElementById('skuHpp').classList.remove('input-error');

      document.getElementById('skuHpp').value = qHpp > 0 ? qHpp : 1000;
      document.getElementById('skuPacking').value = 0;
      document.getElementById('skuReturnBuf').value = 0;
      document.getElementById('skuAdminPct').value = qAdmin;
      document.getElementById('skuXtraPct').value = 0;
      document.getElementById('skuFixedFee').value = 1250;
      document.getElementById('skuVoucher').value = 0;

      const feeRp = Math.round(qPrice * (qAdmin / 100)) + 1250;
      const estProfit = Math.max(0, qPrice - qHpp - feeRp);
      document.getElementById('skuTargetProfit').value = estProfit > 0 ? estProfit : 15000;

      calcRecommendedPriceFromStep1();
      document.getElementById('wizSellPrice').value = qPrice;
      state.customSellPriceEdited = true;

      switchView('wizard');
      goToStep(1);
      showToast('Data pemindai cepat dipindahkan utuh ke Wizard');
    });

    // Wizard Step 1 live listeners
    document.getElementById('skuName').addEventListener('input', (e) => {
      if (e.target.value.trim()) e.target.classList.remove('input-error');
    });

    const handleStep1PlatformChange = () => {
      if (currentSku) {
        currentSku.platform = document.getElementById('skuPlatform').value;
        currentSku.skuPlatform = currentSku.platform;
      }
    };
    document.getElementById('skuPlatform').addEventListener('input', handleStep1PlatformChange);
    document.getElementById('skuPlatform').addEventListener('change', handleStep1PlatformChange);

    ['skuHpp', 'skuPacking', 'skuReturnBuf', 'skuAdminPct', 'skuXtraPct', 'skuFixedFee', 'skuVoucher', 'skuTargetProfit'].forEach(
      (id) => {
        document.getElementById(id).addEventListener('input', (e) => {
          if (id === 'skuHpp' && readNum('skuHpp', 0) > 0) {
            e.target.classList.remove('input-error');
          }
          const rec = calcRecommendedPriceFromStep1();
          if (!state.customSellPriceEdited) {
            document.getElementById('wizSellPrice').value = rec;
          }
        });
      }
    );

    // Wizard Step 2 live updates
    document.getElementById('wizSellPrice').addEventListener('input', () => {
      state.customSellPriceEdited = true;
      renderStep2();
    });
    document.getElementById('wizSellPrice').addEventListener('change', () => {
      state.customSellPriceEdited = true;
      renderStep2();
    });

    document.getElementById('useRecPriceBtn').addEventListener('click', () => {
      state.customSellPriceEdited = false;
      document.getElementById('wizSellPrice').value = calcRecommendedPriceFromStep1();
      renderStep2();
      showToast('Harga tayang dikembalikan ke rekomendasi aman Langkah 1');
    });

    ['wizStrikePct', 'wizAdShareSelect'].forEach((id) => {
      document.getElementById(id).addEventListener('input', renderStep2);
      document.getElementById(id).addEventListener('change', renderStep2);
    });

    document.querySelectorAll('.step-tab').forEach((tab) => {
      tab.addEventListener('click', () => goToStep(Number(tab.dataset.step)));
    });

    document.getElementById('toStep2Btn').addEventListener('click', () => {
      goToStep(2);
    });
    document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));
    document.getElementById('toStep3Btn').addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep2Btn').addEventListener('click', () => goToStep(2));

    document.getElementById('saveSkuBtn').addEventListener('click', () => saveCurrentSku(false));

    document.getElementById('clearAllHistoryBtn').addEventListener('click', () => {
      if (state.skus.length === 0) return;
      if (!window.confirm('Yakin ingin menghapus seluruh riwayat audit SKU di perangkat ini?')) return;
      state.skus = [];
      saveState();
      updateBadges();
      renderHistoryList();
      showToast('Seluruh riwayat SKU telah dibersihkan');
    });

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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('libModal');
        if (modal && modal.classList.contains('open')) {
          closeLibModal();
        }
        closeMobileDrawer();
      }
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
      state.store.ownerName = document.getElementById('setOwnerName').value.trim() || state.store.ownerName;
      state.store.storeName = document.getElementById('setStoreName').value.trim() || state.store.storeName;
      state.store.email = document.getElementById('setStoreEmail').value.trim() || state.store.email;
      saveState();
      updateBadges();
      showToast('Profil toko berhasil diperbarui');
    });

    document.getElementById('exportBackupBtn').addEventListener('click', () => {
      const safeExport = {
        store: {
          ownerName: state.store.ownerName,
          storeName: state.store.storeName,
          email: state.store.email,
          theme: state.store.theme
        },
        skus: state.skus,
        favorites: state.favorites,
        exportsCount: state.exportsCount
      };
      const blob = new Blob([JSON.stringify(safeExport, null, 2)], { type: 'application/json' });
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
          if (parsed && typeof parsed === 'object') {
            const wasAuth = isValidSessionStore(state.store);
            const preservedHash = wasAuth ? state.store.validHash : '';
            const impStore = parsed.store && typeof parsed.store === 'object' ? parsed.store : {};

            state = {
              store: {
                ...defaultStore,
                ownerName: String(impStore.ownerName || state.store.ownerName || ''),
                storeName: String(impStore.storeName || state.store.storeName || ''),
                email: String(impStore.email || state.store.email || ''),
                theme: impStore.theme === 'dark' ? 'dark' : (state.store.theme || 'light'),
                loggedIn: wasAuth,
                validHash: preservedHash
              },
              skus: Array.isArray(parsed.skus) ? parsed.skus : [],
              favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
              exportsCount: Number.isFinite(Number(parsed.exportsCount)) ? Number(parsed.exportsCount) : state.exportsCount,
              customSellPriceEdited: false
            };
            saveState();
            applyTheme(state.store.theme);
            if (wasAuth) {
              enterStudio();
              showToast('Cadangan data SKU berhasil dipulihkan');
            } else {
              showToast('Data dipulihkan. Silakan masuk dengan kode akses resmi terlebih dahulu.');
            }
          }
        } catch (err) {
          showToast('File JSON tidak valid');
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    applyTheme(state.store.theme || 'light');
    if (isValidSessionStore(state.store)) {
      enterStudio();
    }
  });
})();

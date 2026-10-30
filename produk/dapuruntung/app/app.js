// DapurUntung Studio — Mesin Aplikasi Utama (100% Mandiri di Browser, Nol AI, Nol Emoji)
(function () {
  const LICENSE_SALT = 'nifari-lic-2026::';
  const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
  const DEV_AGENT_HASHES = new Set([
    'e84e7d2e9b247c51c5b558de9dde03fb8ba3c5e1c2774d4b7ee992938c992892',
    'b93ff000e30c0eb00dc5dfd2532e02e12432e258a190972e710597ff1cee2d96',
    '745f157401af8456d9bbbcc6b285bf838ecac77e3d2b18f5b019f217b6fad31b',
    '1932847020b4e595bcf15ad63ea8c85690d14cd41b2315fe70b4584c87c3d648',
    '8560c29987d331116132b89dfcdfe0b1aba3623879ecd44a87fa54313309a40a',
    'e6e9d2294908b7faae7f645a290054c8b7fb58db74e9f66c75315650ab472e47'
  ]);
  const OFFICIAL_BUYER_HASH = 'ff59064cba2ffe8ba6f17b47ed5dfe628156eef6c3315dea872d3bccc2b045ac';

  const STORAGE_KEYS = {
    session: 'dapuruntung_session_v1',
    state: 'dapuruntung_state_v1',
    theme: 'dapuruntung_theme_v1'
  };

  // Pure-JS Synchronous SHA-256 (FIPS 180-4)
  function sha256Hex(asciiOrUtf8) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    const bytes = [];
    const str = String(asciiOrUtf8 || '');
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        i++;
        code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }

    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const h = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);

    const hiLen = Math.floor(bitLen / 0x100000000);
    const loLen = bitLen >>> 0;
    bytes.push(
      (hiLen >>> 24) & 0xff, (hiLen >>> 16) & 0xff, (hiLen >>> 8) & 0xff, hiLen & 0xff,
      (loLen >>> 24) & 0xff, (loLen >>> 16) & 0xff, (loLen >>> 8) & 0xff, loLen & 0xff
    );

    const w = new Array(64);
    for (let offset = 0; offset < bytes.length; offset += 64) {
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = (rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
        const s1 = (rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h[0], b = h[1], c = h[2], d = h[3];
      let e = h[4], f = h[5], g = h[6], hh = h[7];

      for (let i = 0; i < 64; i++) {
        const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (hh + S1 + ch + k[i] + w[i]) >>> 0;
        const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (S0 + maj) >>> 0;

        hh = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      h[0] = (h[0] + a) >>> 0;
      h[1] = (h[1] + b) >>> 0;
      h[2] = (h[2] + c) >>> 0;
      h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0;
      h[5] = (h[5] + f) >>> 0;
      h[6] = (h[6] + g) >>> 0;
      h[7] = (h[7] + hh) >>> 0;
    }

    return h.map((v) => v.toString(16).padStart(8, '0')).join('');
  }

  function classifyLicenseHash(hash) {
    if (!hash) return null;
    if (DEV_AGENT_HASHES.has(hash)) return 'dev';
    if (hash === CREATOR_MASTER_HASH) return 'creator';
    if (hash === OFFICIAL_BUYER_HASH) return 'buyer';
    return null;
  }

  function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const formatRp = window.DapurExporter.formatRp;
  const formatNum = window.DapurExporter.formatNum;

  function roundUpRp500(val) {
    const n = Number(val) || 0;
    if (n <= 0) return 0;
    return Math.ceil(n / 500) * 500;
  }

  const DATA = window.DAPUR_DATA || { PRESETS: [], CATEGORIES: [], LIBRARY_ITEMS: [] };
  const defaultPreset = DATA.PRESETS[1] || DATA.PRESETS[0]; // Ayam Geprek default penuh bahan

  let session = null;
  let activeView = 'dashboard';
  let activeStep = 1;
  let activePreviewTab = 'sop';
  let activeLibCategory = 'all';
  let favOnlyMode = false;
  let currentModalItem = null;

  let appState = {
    activePresetId: defaultPreset ? defaultPreset.id : 'ayam-geprek',
    currentRecipe: cloneDeep(defaultPreset),
    savedRecipes: [],
    favoriteIds: ['lib-001', 'lib-041'],
    exportCount: 0,
    shopInfo: {
      ownerName: '',
      shopName: '',
      city: 'Jakarta & Sekitarnya',
      phone: 'WA 0812-8800-9900'
    }
  };

  function showToast(msg) {
    const el = document.getElementById('toast-pill');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.classList.add('hidden');
    }, 2600);
  }

  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
      const rawState = localStorage.getItem(STORAGE_KEYS.state);
      if (rawState) {
        const parsed = JSON.parse(rawState);
        if (parsed && typeof parsed === 'object') {
          if (parsed.currentRecipe && Array.isArray(parsed.currentRecipe.ingredients)) {
            appState.currentRecipe = parsed.currentRecipe;
          }
          if (Array.isArray(parsed.savedRecipes)) appState.savedRecipes = parsed.savedRecipes;
          if (Array.isArray(parsed.favoriteIds)) appState.favoriteIds = parsed.favoriteIds;
          if (typeof parsed.exportCount === 'number') appState.exportCount = parsed.exportCount;
          if (parsed.activePresetId) appState.activePresetId = parsed.activePresetId;
          if (parsed.shopInfo) appState.shopInfo = Object.assign({}, appState.shopInfo, parsed.shopInfo);
        }
      }
      const rawSession = localStorage.getItem(STORAGE_KEYS.session);
      if (rawSession) {
        const parsedSes = JSON.parse(rawSession);
        if (parsedSes && classifyLicenseHash(parsedSes.licenseHash)) {
          session = parsedSes;
          if (!appState.shopInfo.ownerName) appState.shopInfo.ownerName = session.ownerName;
          if (!appState.shopInfo.shopName) appState.shopInfo.shopName = session.shopName;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat penyimpanan lokal:', err);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(appState));
    } catch (e) {}
  }

  // MESIN KALKULASI UTAMA HPP, % YIELD, HARGA OJOL, COMBO & BEP
  function computeRecipeMetrics(recipe) {
    const batchPortions = Math.max(1, Number(recipe.batchPortions) || 1);
    const packagingPerPortion = Math.max(0, Number(recipe.packagingPerPortion) || 0);
    const gasUtilityPerPortion = Math.max(0, Number(recipe.gasUtilityPerPortion) || 0);
    const offlinePrice = Math.max(0, Number(recipe.offlinePrice) || 0);
    const ojolCommissionPct = Math.min(65, Math.max(0, Number(recipe.ojolCommissionPct) || 0));
    const ojolFixedFee = Math.max(0, Number(recipe.ojolFixedFee) || 0);
    const ojolPromoPct = Math.min(65, Math.max(0, Number(recipe.ojolPromoPct) || 0));
    const monthlyFixedCost = Math.max(0, Number(recipe.monthlyFixedCost) || 0);

    let batchRawTotal = 0;
    const ingredientRows = (recipe.ingredients || []).map((ing) => {
      const buyPrice = Math.max(0, Number(ing.buyPrice) || 0);
      const buyQty = Math.max(0.01, Number(ing.buyQty) || 1);
      const yieldPct = Math.min(100, Math.max(5, Number(ing.yieldPct) || 100));
      const useQty = Math.max(0, Number(ing.useQty) || 0);

      const cleanUsableFromPack = buyQty * (yieldPct / 100);
      const costPerCleanUnit = buyPrice / Math.max(0.0001, cleanUsableFromPack);
      const batchCost = costPerCleanUnit * useQty;
      const perPortionQty = useQty / batchPortions;
      const perPortionCost = batchCost / batchPortions;

      batchRawTotal += batchCost;
      return {
        id: ing.id,
        name: ing.name || 'Bahan Dapur',
        buyPrice,
        buyQty,
        unit: ing.unit || 'gr',
        yieldPct,
        useQty,
        batchCost,
        perPortionQty,
        perPortionCost
      };
    });

    const rawCostPerPortion = batchRawTotal / batchPortions;
    const totalHppPerPortion = rawCostPerPortion + packagingPerPortion + gasUtilityPerPortion;
    const offlineProfitPerPortion = offlinePrice - totalHppPerPortion;
    const offlineFoodCostPct = offlinePrice > 0 ? (totalHppPerPortion / offlinePrice) * 100 : 0;

    // 1. Cara Salah (Naikkan harga biasa sebesar % komisi)
    const commFrac = ojolCommissionPct / 100;
    const promoFrac = ojolPromoPct / 100;
    const naiveOjolPrice = roundUpRp500(offlinePrice * (1 + commFrac));
    const naiveCommissionCut = Math.round(naiveOjolPrice * commFrac + ojolFixedFee);
    const naiveNetReceived = naiveOjolPrice - naiveCommissionCut;
    const naiveProfitPerPortion = naiveNetReceived - totalHppPerPortion;

    // 2. Rumus Balik Aman DapurUntung (Uang cair kedai >= Harga Offline utuh)
    const targetNetPayout = Math.max(offlinePrice, totalHppPerPortion + 4000);
    const rawSafeOjol = (targetNetPayout + ojolFixedFee) / Math.max(0.2, 1 - commFrac);
    const recommendedOjolNetPrice = roundUpRp500(rawSafeOjol);
    const recommendedOjolCommissionCut = Math.round(recommendedOjolNetPrice * commFrac + ojolFixedFee);
    const recommendedOjolPayout = recommendedOjolNetPrice - recommendedOjolCommissionCut;
    const recommendedOjolProfit = recommendedOjolPayout - totalHppPerPortion;

    // 3. Harga Tayang Sebelum Diskon Coret
    const rawStrike = recommendedOjolNetPrice / Math.max(0.2, 1 - promoFrac);
    const recommendedOjolStrikePrice = ojolPromoPct > 0 ? roundUpRp500(rawStrike) : recommendedOjolNetPrice;
    const afterDiscountPrice = Math.round(recommendedOjolStrikePrice * (1 - promoFrac));
    const strikeCommissionCut = Math.round(afterDiscountPrice * commFrac + ojolFixedFee);
    const strikeTotalCut = (recommendedOjolStrikePrice - afterDiscountPrice) + strikeCommissionCut;

    // 3 Paket Combo Penaik Nilai Nota
    const drinkHpp = 1750;
    const drinkPrice = 6000;
    const combo1Offline = roundUpRp500(offlinePrice + drinkPrice - 2000);
    const combo1Hpp = totalHppPerPortion + drinkHpp;
    const combo1Ojol = roundUpRp500((combo1Offline + ojolFixedFee) / Math.max(0.2, 1 - commFrac));

    const combo2Offline = roundUpRp500((offlinePrice * 2) + (drinkPrice * 2) - 5000);
    const combo2Hpp = (totalHppPerPortion * 2) + (drinkHpp * 2) - 400;
    const combo2Ojol = roundUpRp500((combo2Offline + ojolFixedFee) / Math.max(0.2, 1 - commFrac));

    const combo3Offline = roundUpRp500((offlinePrice * 4) * 0.92);
    const combo3Hpp = (totalHppPerPortion * 4) - 800;
    const combo3Ojol = roundUpRp500((combo3Offline + ojolFixedFee) / Math.max(0.2, 1 - commFrac));

    const combos = [
      {
        title: 'Paket Kenyang Sendiri',
        desc: `1x ${recipe.name} + 1x Es Teh / Minuman Segar`,
        hpp: combo1Hpp,
        offlinePrice: combo1Offline,
        ojolPrice: combo1Ojol,
        profit: combo1Offline - combo1Hpp
      },
      {
        title: 'Paket Hemat Berdua',
        desc: `2x ${recipe.name} + 2x Minuman Segar (Hemat Rp 5.000)`,
        hpp: combo2Hpp,
        offlinePrice: combo2Offline,
        ojolPrice: combo2Ojol,
        profit: combo2Offline - combo2Hpp
      },
      {
        title: 'Paket Ramean Keluarga (4 Porsi)',
        desc: `4x ${recipe.name} Kemasan Gabung Hemat 8%`,
        hpp: combo3Hpp,
        offlinePrice: combo3Offline,
        ojolPrice: combo3Ojol,
        profit: combo3Offline - combo3Hpp
      }
    ];

    // BEP Kedai
    const unitMargin = Math.max(1000, offlineProfitPerPortion);
    const bepPortionsMonthly = Math.ceil(monthlyFixedCost / unitMargin);
    const bepPortionsDaily = Math.ceil(bepPortionsMonthly / 30);
    const projectedNetMonthlyProfit = ((bepPortionsDaily + 25) * 30 * unitMargin) - monthlyFixedCost;

    // 8 Poin Audit Kesehatan Margin Dapur
    const hasYieldRealism = ingredientRows.some((r) => r.yieldPct < 100);
    const packRatioPct = offlinePrice > 0 ? (packagingPerPortion / offlinePrice) * 100 : 0;
    const sopLen = String(recipe.sopNotes || '').trim().length;

    const auditChecks = [
      {
        label: 'Rasio HPP terhadap Harga Jual',
        passed: offlineFoodCostPct > 0 && offlineFoodCostPct <= 48,
        detail: `HPP saat ini ${offlineFoodCostPct.toFixed(1)}% dari harga offline (batas sehat kuliner <= 48%).`
      },
      {
        label: 'Koreksi Susut Kupas & Masak (% Yield)',
        passed: hasYieldRealism,
        detail: hasYieldRealism
          ? 'Sudah memperhitungkan susut kupas/masak bahan mentah secara nyata.'
          : 'Semua bahan masih 100%; pastikan bahan kupas/daging sudah dikoreksi Yield-nya.'
      },
      {
        label: 'Ketebalan Laba Bersih per Porsi',
        passed: offlineProfitPerPortion >= 5000,
        detail: `Laba bersih per porsi ${formatRp(offlineProfitPerPortion)} (aman menutup fluktuasi harga pasar).`
      },
      {
        label: 'Perlindungan Rumus Balik Komisi Ojol',
        passed: recommendedOjolProfit >= offlineProfitPerPortion - 200,
        detail: `Menyelamatkan selisih ${formatRp(recommendedOjolProfit - naiveProfitPerPortion)}/porsi dibanding naik harga biasa.`
      },
      {
        label: 'Efisiensi Biaya Kemasan Takeaway',
        passed: packRatioPct <= 12,
        detail: `Beban kemasan ${packRatioPct.toFixed(1)}% dari harga jual (ideal di bawah 10%-12%).`
      },
      {
        label: 'Batas Wajar Diskon Coret Aplikasi',
        passed: ojolPromoPct <= 25,
        detail: `Rencana diskon coret ${ojolPromoPct}% (jaga <= 25% agar harga coret tetap dipercaya pelanggan).`
      },
      {
        label: 'Kewajaran Titik Impas Harian (BEP)',
        passed: bepPortionsDaily <= 45,
        detail: `Butuh minimal ${bepPortionsDaily} porsi/hari untuk menutup beban tetap ${formatRp(monthlyFixedCost)}/bln.`
      },
      {
        label: 'Kelengkapan SOP Takaran Kru Dapur',
        passed: sopLen >= 30,
        detail: sopLen >= 30
          ? 'Instruksi langkah masak & takaran kru sudah siap dicetak ke PDF.'
          : 'Tambahkan catatan langkah masak di Langkah 1 supaya rasa kru selalu konsisten.'
      }
    ];

    return {
      menuName: recipe.name || 'Menu Andalan Kedai',
      category: recipe.category || 'Kuliner Utama',
      batchPortions,
      packagingPerPortion,
      gasUtilityPerPortion,
      offlinePrice,
      ojolCommissionPct,
      ojolFixedFee,
      ojolPromoPct,
      monthlyFixedCost,
      sopNotes: recipe.sopNotes || '',
      ingredientRows,
      batchRawTotal,
      rawCostPerPortion,
      totalHppPerPortion,
      offlineProfitPerPortion,
      offlineFoodCostPct,
      naiveOjolPrice,
      naiveCommissionCut,
      naiveNetReceived,
      naiveProfitPerPortion,
      recommendedOjolNetPrice,
      recommendedOjolCommissionCut,
      recommendedOjolPayout,
      recommendedOjolProfit,
      recommendedOjolStrikePrice,
      strikeTotalCut,
      combos,
      bepPortionsMonthly,
      bepPortionsDaily,
      projectedNetMonthlyProfit,
      auditChecks
    };
  }

  // UPDATE RING SVG HELPER
  function setRingArc(arcId, pctTextId, rpTextId, partValue, baseTotal, rpLabel) {
    const pct = baseTotal > 0 ? Math.max(0, Math.min(100, (partValue / baseTotal) * 100)) : 0;
    const circumference = 251.2;
    const offset = circumference - (pct / 100) * circumference;
    const arcEl = document.getElementById(arcId);
    const pctEl = document.getElementById(pctTextId);
    const rpEl = document.getElementById(rpTextId);
    if (arcEl) arcEl.setAttribute('stroke-dashoffset', offset.toFixed(1));
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (rpEl) rpEl.textContent = rpLabel;
  }

  function renderIdentityAndKpis(calc) {
    const owner = appState.shopInfo.ownerName || 'Kepala Dapur';
    const shop = appState.shopInfo.shopName || 'Dapur Kuliner Mandiri';

    document.getElementById('side-shop-name').textContent = shop;
    document.getElementById('side-owner-name').textContent = owner;
    document.getElementById('dash-greeting').textContent = `Halo, ${owner}`;
    document.getElementById('dash-subtitle').textContent = `${shop} • Pantau modal resep, susut bahan, dan harga aman aplikasi pesan-antar.`;

    document.getElementById('kpi-saved-count').textContent = `${appState.savedRecipes.length} Menu`;
    document.getElementById('kpi-export-count').textContent = `${appState.exportCount} File`;
    document.getElementById('kpi-fav-count').textContent = `${appState.favoriteIds.length} SOP`;
    document.getElementById('kpi-active-profit').textContent = formatRp(calc.recommendedOjolProfit);
    document.getElementById('kpi-active-menu-name').textContent = `${calc.menuName} (via Ojol)`;

    // Update 4 Foodnoms Cost Rings against Recommended Ojol Net Price
    const baseOjol = Math.max(1, calc.recommendedOjolNetPrice);
    document.getElementById('ring-menu-label').textContent = calc.menuName;
    document.getElementById('ring-ojol-price-pill').textContent = `Harga Ojol Aman: ${formatRp(calc.recommendedOjolNetPrice)}`;

    const packPlusGas = calc.packagingPerPortion + calc.gasUtilityPerPortion;
    setRingArc('ring-arc-raw', 'ring-pct-raw', 'ring-rp-raw', calc.rawCostPerPortion, baseOjol, `${formatRp(calc.rawCostPerPortion)} / porsi`);
    setRingArc('ring-arc-pack', 'ring-pct-pack', 'ring-rp-pack', packPlusGas, baseOjol, `${formatRp(packPlusGas)} / porsi`);
    setRingArc('ring-arc-comm', 'ring-pct-comm', 'ring-rp-comm', calc.recommendedOjolCommissionCut, baseOjol, `${formatRp(calc.recommendedOjolCommissionCut)} / porsi`);
    setRingArc('ring-arc-profit', 'ring-pct-profit', 'ring-rp-profit', calc.recommendedOjolProfit, baseOjol, `${formatRp(calc.recommendedOjolProfit)} / porsi`);
  }

  function renderQuickChecker() {
    const hpp = Math.max(0, Number(document.getElementById('qc-hpp').value) || 0);
    const off = Math.max(0, Number(document.getElementById('qc-offline').value) || 0);
    const comm = Math.min(60, Math.max(0, Number(document.getElementById('qc-comm').value) || 0));
    const promo = Math.min(60, Math.max(0, Number(document.getElementById('qc-promo').value) || 0));

    const cFrac = comm / 100;
    const pFrac = promo / 100;
    const naiveP = roundUpRp500(off * (1 + cFrac));
    const naiveNet = naiveP - Math.round(naiveP * cFrac + 1000);
    const safeNet = roundUpRp500((Math.max(off, hpp + 3000) + 1000) / Math.max(0.2, 1 - cFrac));
    const safeStrike = promo > 0 ? roundUpRp500(safeNet / Math.max(0.2, 1 - pFrac)) : safeNet;

    document.getElementById('qc-naive-result').textContent = `Cair ${formatRp(naiveNet)} (Kurang ${formatRp(Math.max(0, off - naiveNet))})`;
    document.getElementById('qc-safe-net').textContent = formatRp(safeNet);
    document.getElementById('qc-safe-strike').textContent = formatRp(safeStrike);
  }

  function renderDashboardPresets() {
    const container = document.getElementById('dash-preset-list');
    container.innerHTML = DATA.PRESETS.slice(0, 6).map((p) => {
      const m = computeRecipeMetrics(p);
      return `
        <div class="card-white" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div style="min-width:0;">
            <div style="font-size:14.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
            <div style="font-size:12.5px;color:var(--text-muted);font-weight:600;">HPP ${formatRp(m.totalHppPerPortion)} • Jual Ojol ${formatRp(m.recommendedOjolNetPrice)}</div>
          </div>
          <button type="button" class="btn btn-fog btn-sm dash-load-preset" data-pid="${escapeHtml(p.id)}">Pakai</button>
        </div>
      `;
    }).join('');
  }

  function renderPresetChips() {
    const wrap = document.getElementById('wiz-preset-chips');
    wrap.innerHTML = DATA.PRESETS.map((p) => `
      <button type="button" class="preset-chip ${appState.activePresetId === p.id ? 'active' : ''}" data-preset-id="${escapeHtml(p.id)}">
        ${escapeHtml(p.name.split('(')[0].trim())}
      </button>
    `).join('');
  }

  function syncWizardInputsFromRecipe() {
    const r = appState.currentRecipe;
    document.getElementById('menu-name').value = r.name || '';
    document.getElementById('menu-category').value = r.category || '';
    document.getElementById('batch-portions').value = r.batchPortions || 10;
    document.getElementById('pack-cost').value = r.packagingPerPortion || 0;
    document.getElementById('gas-cost').value = r.gasUtilityPerPortion || 0;
    document.getElementById('sop-notes').value = r.sopNotes || '';

    document.getElementById('offline-price').value = r.offlinePrice || 0;
    document.getElementById('ojol-comm-pct').value = r.ojolCommissionPct != null ? r.ojolCommissionPct : 20;
    document.getElementById('ojol-fixed-fee').value = r.ojolFixedFee != null ? r.ojolFixedFee : 1000;
    document.getElementById('ojol-promo-pct').value = r.ojolPromoPct != null ? r.ojolPromoPct : 10;
    document.getElementById('monthly-fixed-cost').value = r.monthlyFixedCost != null ? r.monthlyFixedCost : 4500000;
  }

  function renderIngredientsTable() {
    const tbody = document.getElementById('ing-tbody');
    const calc = computeRecipeMetrics(appState.currentRecipe);

    tbody.innerHTML = calc.ingredientRows.map((row, idx) => `
      <tr data-idx="${idx}">
        <td class="ing-col-name">
          <input type="text" class="input-pill input-sm ing-field" data-idx="${idx}" data-key="name" value="${escapeHtml(row.name)}" aria-label="Nama Bahan" />
        </td>
        <td>
          <input type="number" class="input-pill input-sm ing-field" data-idx="${idx}" data-key="buyPrice" value="${row.buyPrice}" min="0" step="500" aria-label="Harga Beli" />
        </td>
        <td>
          <input type="number" class="input-pill input-sm ing-field" data-idx="${idx}" data-key="buyQty" value="${row.buyQty}" min="0.1" step="any" aria-label="Isi Kemasan Beli" />
        </td>
        <td>
          <select class="input-pill input-sm ing-field" data-idx="${idx}" data-key="unit" aria-label="Satuan">
            ${['gr', 'ml', 'pcs', 'butir', 'lembar'].map((u) => `<option value="${u}" ${row.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </td>
        <td>
          <input type="number" class="input-pill input-sm ing-field" data-idx="${idx}" data-key="yieldPct" value="${row.yieldPct}" min="5" max="100" step="1" aria-label="Persentase Yield" />
        </td>
        <td>
          <input type="number" class="input-pill input-sm ing-field" data-idx="${idx}" data-key="useQty" value="${row.useQty}" min="0" step="any" aria-label="Takaran Pakai" />
        </td>
        <td class="ing-col-cost">
          <strong class="ing-row-cost-txt" style="font-size:14px;">${formatRp(row.batchCost)}</strong>
          <button type="button" class="icon-del-btn ing-del-btn" data-idx="${idx}" title="Hapus Bahan" aria-label="Hapus Bahan">&times;</button>
        </td>
      </tr>
    `).join('');
  }

  function renderWizardComputedOutputs(calc) {
    // Update Step 1 Summary & individual row batch costs without destroying focus
    document.getElementById('step1-batch-summary').textContent =
      `Modal Bahan 1 Batch (${calc.batchPortions} porsi): ${formatRp(calc.batchRawTotal)} • Bahan/porsi ${formatRp(calc.rawCostPerPortion)} + Kemasan/Gas ${formatRp(calc.packagingPerPortion + calc.gasUtilityPerPortion)}`;
    document.getElementById('step1-hpp-portion').textContent = formatRp(calc.totalHppPerPortion);

    const costLabels = document.querySelectorAll('#ing-tbody .ing-row-cost-txt');
    calc.ingredientRows.forEach((r, idx) => {
      if (costLabels[idx]) costLabels[idx].textContent = formatRp(r.batchCost);
    });

    // Update Step 2 Ojol Comparison Cards
    document.getElementById('ojol-compare-cards').innerHTML = `
      <div class="ojol-box">
        <span class="pill-tag">MAKAN DI TEMPAT / WA</span>
        <div class="ojol-price-big">${formatRp(calc.offlinePrice)}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:8px;">Potongan aplikasi: Rp 0</div>
        <div style="font-size:14.5px;font-weight:800;">Untung Bersih: <span class="accent-green">${formatRp(calc.offlineProfitPerPortion)}</span></div>
      </div>

      <div class="ojol-box warn">
        <span class="pill-tag" style="border-color:var(--color-signal-red-orange);color:var(--color-signal-red-orange);">CARA SALAH (+${calc.ojolCommissionPct}% BIASA)</span>
        <div class="ojol-price-big accent-red">${formatRp(calc.naiveOjolPrice)}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:8px;">Dipotong ${formatRp(calc.naiveCommissionCut)} &rarr; Cair ${formatRp(calc.naiveNetReceived)}</div>
        <div style="font-size:14.5px;font-weight:800;">Untung Tinggal: <span class="accent-red">${formatRp(calc.naiveProfitPerPortion)}</span></div>
      </div>

      <div class="ojol-box safe">
        <span class="pill-tag pill-tag-green">RUMUS AMAN DAPURUNTUNG</span>
        <div class="ojol-price-big accent-green">${formatRp(calc.recommendedOjolNetPrice)}</div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:6px;">Harga Tayang Coret Diskon ${calc.ojolPromoPct}%: <strong>${formatRp(calc.recommendedOjolStrikePrice)}</strong></div>
        <div style="font-size:14.5px;font-weight:800;">Untung Utuh: <span class="accent-green">${formatRp(calc.recommendedOjolProfit)} / porsi</span></div>
      </div>
    `;

    // Step 2 Combos
    document.getElementById('combo-cards-list').innerHTML = calc.combos.map((cb) => `
      <div class="card-fog" style="padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <strong style="font-size:15px;">${escapeHtml(cb.title)}</strong>
          <span class="pill-tag pill-tag-green">Untung +${formatRp(cb.profit)}</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin:4px 0 8px;">${escapeHtml(cb.desc)}</div>
        <div style="font-size:13px;font-weight:700;">Offline: ${formatRp(cb.offlinePrice)} &nbsp;|&nbsp; Aplikasi Ojol: <span class="accent-orange">${formatRp(cb.ojolPrice)}</span></div>
      </div>
    `).join('');

    // Step 2 BEP Box
    document.getElementById('bep-summary-box').innerHTML = `
      <div class="card-fog" style="padding:18px;margin-bottom:12px;">
        <div style="font-size:12.5px;font-weight:700;color:var(--text-muted);">TARGET IMPAS HARIAN (NOL RUGI)</div>
        <div style="font-size:32px;font-weight:800;margin:4px 0;" class="accent-orange">${calc.bepPortionsDaily} Porsi / Hari</div>
        <div style="font-size:13.5px;color:var(--text-muted);">Setara ${calc.bepPortionsMonthly} porsi/bulan untuk menutup biaya sewa, listrik &amp; gaji kru ${formatRp(calc.monthlyFixedCost)}.</div>
      </div>
      <div class="card-fog" style="padding:18px;">
        <div style="font-size:12.5px;font-weight:700;color:var(--text-muted);">SIMULASI TUMBUH (+25 PORSI DI ATAS BEP)</div>
        <div style="font-size:24px;font-weight:800;margin:4px 0;" class="accent-green">${formatRp(calc.projectedNetMonthlyProfit)} / Bulan</div>
        <div style="font-size:13px;color:var(--text-muted);">Estimasi laba bersih masuk kantong pemilik bila rata-rata terjual ${calc.bepPortionsDaily + 25} porsi/hari.</div>
      </div>
    `;

    // Step 2 Audit 8 Checks
    document.getElementById('audit-checks-grid').innerHTML = calc.auditChecks.map((chk) => `
      <div class="audit-item">
        <span class="audit-dot ${chk.passed ? 'ok' : 'fix'}">${chk.passed ? 'OK' : '!'}</span>
        <div>
          <strong style="display:block;font-size:14.5px;">${escapeHtml(chk.label)}</strong>
          <span style="font-size:13px;color:var(--text-muted);">${escapeHtml(chk.detail)}</span>
        </div>
      </div>
    `).join('');

    // Step 3 Live Preview Sheet
    renderStep3Preview(calc);
  }

  function renderStep3Preview(calc) {
    const box = document.getElementById('step3-preview-sheet');
    const shop = appState.shopInfo.shopName || 'Dapur Kuliner Mandiri';

    if (activePreviewTab === 'sop') {
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding-bottom:14px;border-bottom:2px solid var(--border-subtle);">
          <div>
            <span class="pill-tag pill-tag-orange">KARTU STANDAR RESEP &amp; HPP</span>
            <h3 style="margin:8px 0 2px;font-size:22px;font-weight:800;">${escapeHtml(calc.menuName)}</h3>
            <div style="font-size:13.5px;color:var(--text-muted);">${escapeHtml(shop)} • Hasil 1 Resep: ${calc.batchPortions} Porsi</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);">TOTAL HPP BERSIH / PORSI</div>
            <div style="font-size:26px;font-weight:800;" class="accent-green">${formatRp(calc.totalHppPerPortion)}</div>
          </div>
        </div>

        <div class="clean-table-scroll">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Bahan Baku</th>
                <th>Harga Kemasan</th>
                <th>% Yield</th>
                <th>Pakai 1 Batch</th>
                <th>Gramasi / Porsi</th>
                <th>Biaya / Porsi</th>
              </tr>
            </thead>
            <tbody>
              ${calc.ingredientRows.map((r) => `
                <tr>
                  <td><strong>${escapeHtml(r.name)}</strong></td>
                  <td>${formatRp(r.buyPrice)} / ${formatNum(r.buyQty)} ${escapeHtml(r.unit)}</td>
                  <td>${r.yieldPct}%</td>
                  <td>${formatNum(r.useQty)} ${escapeHtml(r.unit)}</td>
                  <td>${formatNum(r.perPortionQty, 1)} ${escapeHtml(r.unit)}</td>
                  <td><strong>${formatRp(r.perPortionCost)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="card-fog" style="margin-top:16px;padding:16px 20px;">
          <strong style="font-size:13.5px;display:block;margin-bottom:6px;">INSTRUKSI TAKARAN &amp; LANGKAH MASAK KRU DAPUR:</strong>
          <div style="font-size:14px;white-space:pre-line;line-height:1.6;">${escapeHtml(calc.sopNotes)}</div>
        </div>
      `;
    } else if (activePreviewTab === 'ojol') {
      box.innerHTML = `
        <span class="pill-tag pill-tag-green">SIMULASI HARGA MULTIKANAL</span>
        <h3 style="margin:8px 0 12px;font-size:21px;font-weight:800;">Rincian Harga Offline, Aplikasi Ojol &amp; 3 Paket Combo</h3>
        <div class="clean-table-scroll">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Skema Penjualan</th>
                <th>Harga Tayang</th>
                <th>Potongan Komisi + Promo</th>
                <th>Cair ke Kedai</th>
                <th>Untung Bersih</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Makan di Tempat / WA Offline</strong></td>
                <td>${formatRp(calc.offlinePrice)}</td>
                <td>Rp 0</td>
                <td>${formatRp(calc.offlinePrice)}</td>
                <td><strong class="accent-green">${formatRp(calc.offlineProfitPerPortion)}</strong></td>
              </tr>
              <tr>
                <td>Cara Salah (Naik +${calc.ojolCommissionPct}% Biasa)</td>
                <td>${formatRp(calc.naiveOjolPrice)}</td>
                <td>- ${formatRp(calc.naiveCommissionCut)}</td>
                <td>${formatRp(calc.naiveNetReceived)}</td>
                <td><strong class="accent-red">${formatRp(calc.naiveProfitPerPortion)}</strong></td>
              </tr>
              <tr>
                <td><strong>Harga Aman Aplikasi Ojol (Tanpa Diskon)</strong></td>
                <td><strong>${formatRp(calc.recommendedOjolNetPrice)}</strong></td>
                <td>- ${formatRp(calc.recommendedOjolCommissionCut)}</td>
                <td>${formatRp(calc.recommendedOjolPayout)}</td>
                <td><strong class="accent-green">${formatRp(calc.recommendedOjolProfit)}</strong></td>
              </tr>
              <tr>
                <td><strong>Harga Tayang Sebelum Coret Diskon ${calc.ojolPromoPct}%</strong></td>
                <td><strong class="accent-orange">${formatRp(calc.recommendedOjolStrikePrice)}</strong></td>
                <td>- ${formatRp(calc.strikeTotalCut)}</td>
                <td>${formatRp(calc.recommendedOjolPayout)}</td>
                <td><strong class="accent-green">${formatRp(calc.recommendedOjolProfit)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else {
      const f50 = 50 / calc.batchPortions;
      const f100 = 100 / calc.batchPortions;
      box.innerHTML = `
        <span class="pill-tag">DAFTAR BELANJA OTOMATIS</span>
        <h3 style="margin:8px 0 12px;font-size:21px;font-weight:800;">Kebutuhan Belanja Kotor Pasar (Sudah Termasuk Koreksi % Yield)</h3>
        <div class="clean-table-scroll">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Bahan Baku</th>
                <th>% Yield</th>
                <th>Belanja Kotor 50 Porsi</th>
                <th>Estimasi Biaya 50 Porsi</th>
                <th>Belanja Kotor 100 Porsi</th>
                <th>Estimasi Biaya 100 Porsi</th>
              </tr>
            </thead>
            <tbody>
              ${calc.ingredientRows.map((r) => {
                const yf = Math.max(0.05, r.yieldPct / 100);
                const g50 = Math.ceil((r.useQty / yf) * f50);
                const g100 = Math.ceil((r.useQty / yf) * f100);
                return `
                  <tr>
                    <td><strong>${escapeHtml(r.name)}</strong></td>
                    <td>${r.yieldPct}%</td>
                    <td>${formatNum(g50)} ${escapeHtml(r.unit)}</td>
                    <td>${formatRp(r.batchCost * f50)}</td>
                    <td><strong>${formatNum(g100)} ${escapeHtml(r.unit)}</strong></td>
                    <td><strong>${formatRp(r.batchCost * f100)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // STANDALONE VIEW: KONVERSI BELANJA PASAR & KATERING
  function renderMarketConverter(calc) {
    const targetPortions = Math.max(1, Math.round(Number(document.getElementById('market-target-portions').value) || 75));
    const bufferPct = Math.max(0, Number(document.getElementById('market-buffer-pct').value) || 0);
    const effectivePortions = Math.ceil(targetPortions * (1 + bufferPct / 100));
    const scaleFactor = effectivePortions / calc.batchPortions;

    let totalMarketRawCash = 0;
    const rowsHtml = calc.ingredientRows.map((r) => {
      const cleanNeed = r.useQty * scaleFactor;
      const yFrac = Math.max(0.05, r.yieldPct / 100);
      const grossBuyNeed = cleanNeed / yFrac;
      const packsNeeded = Math.ceil((grossBuyNeed / r.buyQty) * 10) / 10;
      const estCash = r.batchCost * scaleFactor;
      totalMarketRawCash += estCash;

      return `
        <tr>
          <td><strong>${escapeHtml(r.name)}</strong></td>
          <td>${formatNum(cleanNeed, 1)} ${escapeHtml(r.unit)}</td>
          <td><span class="pill-tag">${r.yieldPct}%</span></td>
          <td><strong class="accent-orange">${formatNum(Math.ceil(grossBuyNeed))} ${escapeHtml(r.unit)}</strong></td>
          <td>~${formatNum(packsNeeded, 1)} kemasan beli</td>
          <td><strong>${formatRp(estCash)}</strong></td>
        </tr>
      `;
    }).join('');

    const totalPackAndGas = (calc.packagingPerPortion + calc.gasUtilityPerPortion) * effectivePortions;
    const totalModalOrder = totalMarketRawCash + totalPackAndGas;
    const totalOmzetOrder = calc.offlinePrice * targetPortions;
    const dp50Required = Math.ceil(totalOmzetOrder * 0.5);
    const netOrderProfit = totalOmzetOrder - totalModalOrder;

    document.getElementById('market-table-heading').textContent =
      `Daftar Belanja Kotor Pasar: ${calc.menuName} (${targetPortions} Porsi + Buffer ${bufferPct}% = ${effectivePortions} Porsi Masak)`;

    document.getElementById('market-kpi-row').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Uang Belanja Bahan</div>
        <div class="kpi-value accent-orange">${formatRp(totalMarketRawCash)}</div>
        <div class="kpi-foot">Untuk ${effectivePortions} porsi siap masak</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Modal Total (+Kemasan/Gas)</div>
        <div class="kpi-value">${formatRp(totalModalOrder)}</div>
        <div class="kpi-foot">Seluruh modal produksi pesanan</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Wajib Tagih DP 50%</div>
        <div class="kpi-value accent-sky">${formatRp(dp50Required)}</div>
        <div class="kpi-foot">Menutup 100% modal belanja dapur!</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Estimasi Laba Bersih Order</div>
        <div class="kpi-value accent-green">${formatRp(netOrderProfit)}</div>
        <div class="kpi-foot">Dari total tagihan ${formatRp(totalOmzetOrder)}</div>
      </div>
    `;

    document.getElementById('market-tbody').innerHTML = rowsHtml;
  }

  // LIBRARY 120 SOP RENDERING
  function renderLibraryCategoryPills() {
    const wrap = document.getElementById('lib-cat-pills');
    const allBtn = `<button type="button" class="preset-chip ${activeLibCategory === 'all' ? 'active' : ''}" data-cat="all">Semua Kategori (120)</button>`;
    const catBtns = DATA.CATEGORIES.map((c) => `
      <button type="button" class="preset-chip ${activeLibCategory === c.id ? 'active' : ''}" data-cat="${escapeHtml(c.id)}">
        ${escapeHtml(c.name)} (20)
      </button>
    `).join('');
    wrap.innerHTML = allBtn + catBtns;
  }

  function renderLibraryGrid() {
    const q = String(document.getElementById('lib-search-input').value || '').trim().toLowerCase();
    const favBtn = document.getElementById('lib-fav-only-btn');
    favBtn.textContent = `Tampilkan Favorit Saja (${appState.favoriteIds.length})`;
    favBtn.className = favOnlyMode ? 'btn btn-orange btn-sm' : 'btn btn-outline btn-sm';

    const filtered = DATA.LIBRARY_ITEMS.filter((item) => {
      if (activeLibCategory !== 'all' && item.categoryId !== activeLibCategory) return false;
      if (favOnlyMode && !appState.favoriteIds.includes(item.id)) return false;
      if (q) {
        const hay = `${item.code} ${item.title} ${item.summary} ${item.example} ${item.tip} ${item.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById('lib-count-badge').textContent = `${filtered.length} SOP Ditampilkan`;

    const grid = document.getElementById('lib-cards-grid');
    if (!filtered.length) {
      grid.innerHTML = `<div class="card-fog" style="grid-column:1/-1;text-align:center;padding:36px;">Tidak ada SOP yang cocok dengan kata kunci tersebut.</div>`;
      return;
    }

    grid.innerHTML = filtered.map((item) => {
      const isFav = appState.favoriteIds.includes(item.id);
      return `
        <article class="lib-card" data-lib-id="${escapeHtml(item.id)}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span class="pill-tag" style="border-color:${escapeHtml(item.categoryColor)};color:${escapeHtml(item.categoryColor)};">${escapeHtml(item.code)}</span>
              <span style="font-size:12px;font-weight:800;color:${isFav ? 'var(--color-ember-orange)' : 'var(--text-muted)'};">${isFav ? ' Tersimpan' : 'Klik Detail'}</span>
            </div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <div style="font-size:12.5px;font-weight:700;color:var(--color-verdant-green);padding-top:10px;border-top:1px solid var(--border-subtle);">
            ${escapeHtml(item.categoryName)} &rarr;
          </div>
        </article>
      `;
    }).join('');
  }

  function openLibModal(itemId) {
    const item = DATA.LIBRARY_ITEMS.find((x) => x.id === itemId);
    if (!item) return;
    currentModalItem = item;
    document.getElementById('lib-modal-badge').textContent = `${item.code} • ${item.categoryName}`;
    document.getElementById('lib-modal-title').textContent = item.title;
    document.getElementById('lib-modal-summary').textContent = item.summary;
    document.getElementById('lib-modal-example').textContent = item.example;
    document.getElementById('lib-modal-tip').textContent = item.tip;

    const isFav = appState.favoriteIds.includes(item.id);
    document.getElementById('lib-modal-fav').textContent = isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit';
    document.getElementById('lib-modal').classList.remove('hidden');
  }

  function closeLibModal() {
    document.getElementById('lib-modal').classList.add('hidden');
    currentModalItem = null;
  }

  function renderHistoryAndFavorites() {
    const recWrap = document.getElementById('history-recipes-list');
    if (!appState.savedRecipes.length) {
      recWrap.innerHTML = `<div class="card-white" style="padding:18px;font-size:14px;color:var(--text-muted);">Belum ada resep menu yang disimpan. Buka <strong>Wizard HPP &amp; Ojol</strong> lalu klik tombol <strong>Simpan Resep Ini</strong>.</div>`;
    } else {
      recWrap.innerHTML = appState.savedRecipes.map((entry, idx) => {
        const m = computeRecipeMetrics(entry.recipe);
        return `
          <div class="card-white" style="padding:18px 22px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
            <div>
              <strong style="font-size:17px;">${escapeHtml(entry.recipe.name)}</strong>
              <div style="font-size:13px;color:var(--text-muted);margin-top:3px;">
                Disimpan ${escapeHtml(entry.savedAt)} • HPP ${formatRp(m.totalHppPerPortion)}/porsi • Harga Ojol Aman ${formatRp(m.recommendedOjolNetPrice)}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn btn-orange btn-sm hist-load-btn" data-hidx="${idx}">Buka di Wizard</button>
              <button type="button" class="btn btn-graphite btn-sm hist-pdf-btn" data-hidx="${idx}">Cetak PDF SOP</button>
              <button type="button" class="btn btn-fog btn-sm hist-del-btn" data-hidx="${idx}">Hapus</button>
            </div>
          </div>
        `;
      }).join('');
    }

    const favWrap = document.getElementById('history-favs-list');
    const favItems = DATA.LIBRARY_ITEMS.filter((x) => appState.favoriteIds.includes(x.id));
    if (!favItems.length) {
      favWrap.innerHTML = `<div style="font-size:14px;color:var(--text-muted);">Belum ada SOP favorit yang ditandai.</div>`;
    } else {
      favWrap.innerHTML = favItems.map((it) => `
        <div class="card-fog" style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <span class="pill-tag" style="margin-right:8px;">${escapeHtml(it.code)}</span>
            <strong style="font-size:14.5px;">${escapeHtml(it.title)}</strong>
          </div>
          <button type="button" class="btn btn-outline btn-sm hist-open-sop" data-id="${escapeHtml(it.id)}">Baca</button>
        </div>
      `).join('');
    }
  }

  function syncSettingsForm() {
    document.getElementById('set-owner').value = appState.shopInfo.ownerName || '';
    document.getElementById('set-shop').value = appState.shopInfo.shopName || '';
    document.getElementById('set-city').value = appState.shopInfo.city || '';
    document.getElementById('set-phone').value = appState.shopInfo.phone || '';
  }

  function refreshAll() {
    const calc = computeRecipeMetrics(appState.currentRecipe);
    renderIdentityAndKpis(calc);
    renderWizardComputedOutputs(calc);
    renderMarketConverter(calc);
    renderLibraryCategoryPills();
    renderLibraryGrid();
    renderHistoryAndFavorites();
    saveState();
  }

  function switchView(viewName) {
    activeView = viewName;
    document.querySelectorAll('.app-view').forEach((el) => {
      el.classList.toggle('hidden', el.id !== `view-${viewName}`);
    });
    document.querySelectorAll('.sidebar-nav .nav-btn, .mobile-tabbar .mob-tab, .mob-nav-link').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });
    document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchWizardStep(stepNum) {
    activeStep = Number(stepNum) || 1;
    [1, 2, 3].forEach((n) => {
      document.getElementById(`wiz-step-${n}`).classList.toggle('hidden', n !== activeStep);
    });
    document.querySelectorAll('.step-pill').forEach((pill) => {
      pill.classList.toggle('active', Number(pill.getAttribute('data-step')) === activeStep);
    });
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    document.getElementById('theme-toggle-btn').textContent = next === 'dark' ? 'Tema Terang' : 'Tema Gelap';
  }

  function enterAuthenticatedApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.getElementById('theme-toggle-btn').textContent = curTheme === 'dark' ? 'Tema Terang' : 'Tema Gelap';

    renderDashboardPresets();
    renderPresetChips();
    syncWizardInputsFromRecipe();
    renderIngredientsTable();
    renderQuickChecker();
    syncSettingsForm();
    refreshAll();
  }

  function doLogout() {
    session = null;
    localStorage.removeItem(STORAGE_KEYS.session);
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-code').value = '';
  }

  function bindEvents() {
    // 1. Login Form (Supports Developer Blank-Field Login + Buyer Validation)
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const errBox = document.getElementById('login-error');
      errBox.classList.add('hidden');

      const rawName = document.getElementById('login-name').value.trim();
      const rawShop = document.getElementById('login-shop').value.trim();
      const rawEmail = document.getElementById('login-email').value.trim();
      const rawCode = document.getElementById('login-code').value.trim().toUpperCase();

      if (!rawCode) {
        errBox.textContent = 'Masukkan kode lisensi akses terlebih dahulu.';
        errBox.classList.remove('hidden');
        return;
      }

      const codeHash = sha256Hex(LICENSE_SALT + rawCode);
      const role = classifyLicenseHash(codeHash);

      if (!role) {
        errBox.textContent = 'Kode lisensi tidak dikenali. Periksa kembali huruf besar/tanda hubung kode dari email pembelianmu.';
        errBox.classList.remove('hidden');
        return;
      }

      if (role === 'buyer') {
        if (!rawName || !rawShop || !rawEmail || !rawEmail.includes('@')) {
          errBox.textContent = 'Lengkapi Nama Pemilik, Nama Kedai, dan alamat Email yang valid untuk mengaktifkan lisensi pembeli.';
          errBox.classList.remove('hidden');
          return;
        }
      }

      const finalOwner = rawName || 'Tim Developer';
      const finalShop = rawShop || 'Dapur Uji Studio';
      const finalEmail = rawEmail || 'dev@dapuruntung.id';

      session = {
        ownerName: finalOwner,
        shopName: finalShop,
        email: finalEmail,
        role,
        licenseHash: codeHash,
        loggedInAt: new Date().toISOString()
      };
      appState.shopInfo.ownerName = finalOwner;
      appState.shopInfo.shopName = finalShop;

      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      saveState();
      enterAuthenticatedApp();
      showToast(`Selamat datang di DapurUntung, ${finalOwner}!`);
    });

    // Navigation
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchView(btn.getAttribute('data-view'));
      });
    });

    document.getElementById('dash-open-wizard-btn').addEventListener('click', () => {
      switchView('wizard');
      switchWizardStep(1);
    });

    // Mobile Drawer
    document.getElementById('mob-menu-btn').addEventListener('click', () => {
      document.getElementById('mobile-drawer-backdrop').classList.remove('hidden');
    });
    document.getElementById('mob-drawer-close').addEventListener('click', () => {
      document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
    });
    document.getElementById('mobile-drawer-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'mobile-drawer-backdrop') {
        document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
      }
    });

    // Theme & Logout
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('mob-theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('settings-theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('logout-btn').addEventListener('click', doLogout);
    document.getElementById('settings-logout-btn').addEventListener('click', doLogout);

    // Quick Checker 30s
    ['qc-hpp', 'qc-offline', 'qc-comm', 'qc-promo'].forEach((id) => {
      document.getElementById(id).addEventListener('input', renderQuickChecker);
    });
    document.getElementById('qc-apply-wizard-btn').addEventListener('click', () => {
      appState.currentRecipe.offlinePrice = Number(document.getElementById('qc-offline').value) || 18000;
      appState.currentRecipe.ojolCommissionPct = Number(document.getElementById('qc-comm').value) || 20;
      appState.currentRecipe.ojolPromoPct = Number(document.getElementById('qc-promo').value) || 10;
      syncWizardInputsFromRecipe();
      refreshAll();
      switchView('wizard');
      switchWizardStep(2);
      showToast('Simulasi harga dikirim ke Langkah 2 Wizard.');
    });

    // Dashboard Load Preset
    document.getElementById('dash-preset-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.dash-load-preset');
      if (!btn) return;
      const pid = btn.getAttribute('data-pid');
      const found = DATA.PRESETS.find((x) => x.id === pid);
      if (found) {
        appState.activePresetId = found.id;
        appState.currentRecipe = cloneDeep(found);
        renderPresetChips();
        syncWizardInputsFromRecipe();
        renderIngredientsTable();
        refreshAll();
        switchView('wizard');
        switchWizardStep(1);
        showToast(`Preset "${found.name}" dimuat ke Wizard.`);
      }
    });

    // Wizard Stepper
    document.querySelectorAll('.step-pill').forEach((pill) => {
      pill.addEventListener('click', () => switchWizardStep(pill.getAttribute('data-step')));
    });
    document.querySelectorAll('.wiz-go-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchWizardStep(btn.getAttribute('data-target'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Wizard Preset Chips
    document.getElementById('wiz-preset-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-preset-id]');
      if (!chip) return;
      const pid = chip.getAttribute('data-preset-id');
      const found = DATA.PRESETS.find((x) => x.id === pid);
      if (found) {
        appState.activePresetId = found.id;
        appState.currentRecipe = cloneDeep(found);
        renderPresetChips();
        syncWizardInputsFromRecipe();
        renderIngredientsTable();
        refreshAll();
        showToast(`Resep "${found.name}" siap diedit.`);
      }
    });

    // Wizard Header & Step 2 Inputs
    const fieldMap = [
      ['menu-name', 'name', false],
      ['menu-category', 'category', false],
      ['batch-portions', 'batchPortions', true],
      ['pack-cost', 'packagingPerPortion', true],
      ['gas-cost', 'gasUtilityPerPortion', true],
      ['sop-notes', 'sopNotes', false],
      ['offline-price', 'offlinePrice', true],
      ['ojol-comm-pct', 'ojolCommissionPct', true],
      ['ojol-fixed-fee', 'ojolFixedFee', true],
      ['ojol-promo-pct', 'ojolPromoPct', true],
      ['monthly-fixed-cost', 'monthlyFixedCost', true]
    ];
    fieldMap.forEach(([domId, prop, isNum]) => {
      document.getElementById(domId).addEventListener('input', (e) => {
        appState.currentRecipe[prop] = isNum ? (Number(e.target.value) || 0) : e.target.value;
        refreshAll();
      });
    });

    // Ingredient Table Edits & Delete
    document.getElementById('ing-tbody').addEventListener('input', (e) => {
      const input = e.target.closest('.ing-field');
      if (!input) return;
      const idx = Number(input.getAttribute('data-idx'));
      const key = input.getAttribute('data-key');
      const item = appState.currentRecipe.ingredients[idx];
      if (!item) return;
      if (key === 'name' || key === 'unit') {
        item[key] = input.value;
      } else {
        item[key] = Number(input.value) || 0;
      }
      refreshAll();
    });

    document.getElementById('ing-tbody').addEventListener('click', (e) => {
      const del = e.target.closest('.ing-del-btn');
      if (!del) return;
      const idx = Number(del.getAttribute('data-idx'));
      if (appState.currentRecipe.ingredients.length <= 1) {
        showToast('Minimal harus ada 1 bahan baku dalam resep.');
        return;
      }
      appState.currentRecipe.ingredients.splice(idx, 1);
      renderIngredientsTable();
      refreshAll();
    });

    document.getElementById('add-ing-btn').addEventListener('click', () => {
      appState.currentRecipe.ingredients.push({
        id: 'ing-' + Date.now(),
        name: 'Bahan Tambahan Baru',
        buyPrice: 25000,
        buyQty: 1000,
        unit: 'gr',
        yieldPct: 95,
        useQty: 100
      });
      renderIngredientsTable();
      refreshAll();
    });

    // Step 3 Preview Tabs
    document.querySelectorAll('.prev-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePreviewTab = btn.getAttribute('data-ptab');
        document.querySelectorAll('.prev-tab-btn').forEach((b) => {
          b.className = b === btn ? 'btn btn-graphite btn-sm prev-tab-btn' : 'btn btn-fog btn-sm prev-tab-btn';
        });
        renderStep3Preview(computeRecipeMetrics(appState.currentRecipe));
      });
    });

    // 4 Genuine File Exports
    function bumpExport(label) {
      appState.exportCount += 1;
      refreshAll();
      showToast(`Berhasil mengunduh ${label}`);
    }

    document.getElementById('btn-export-sop-pdf').addEventListener('click', () => {
      const calc = computeRecipeMetrics(appState.currentRecipe);
      const res = window.DapurExporter.exportRecipeSopPdf(calc, appState.shopInfo);
      bumpExport(res.filename);
    });

    document.getElementById('btn-export-poster-png').addEventListener('click', async () => {
      const calc = computeRecipeMetrics(appState.currentRecipe);
      const res = await window.DapurExporter.exportMenuPosterPng(calc, appState.shopInfo);
      bumpExport(res.filename);
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      const calc = computeRecipeMetrics(appState.currentRecipe);
      const customTarget = Number(document.getElementById('market-target-portions').value) || 75;
      const res = window.DapurExporter.exportShoppingHppCsv(calc, appState.shopInfo, customTarget);
      bumpExport(res.filename);
    });

    document.getElementById('btn-export-audit-pdf').addEventListener('click', () => {
      const calc = computeRecipeMetrics(appState.currentRecipe);
      const res = window.DapurExporter.exportOjolAuditPdf(calc, appState.shopInfo);
      bumpExport(res.filename);
    });

    // Save Recipe to History
    function saveCurrentRecipeToHistory() {
      const copy = cloneDeep(appState.currentRecipe);
      const now = new Date();
      const stamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      appState.savedRecipes.unshift({
        id: 'rec-' + Date.now(),
        savedAt: stamp,
        recipe: copy
      });
      if (appState.savedRecipes.length > 30) appState.savedRecipes.pop();
      refreshAll();
      showToast(`Resep "${copy.name}" disimpan ke Riwayat Kedai.`);
    }

    document.getElementById('wiz-save-history-top').addEventListener('click', saveCurrentRecipeToHistory);
    document.getElementById('wiz-save-history-bottom').addEventListener('click', saveCurrentRecipeToHistory);

    // Market Converter View Events
    document.getElementById('market-target-portions').addEventListener('input', () => {
      document.querySelectorAll('.market-qty-chip').forEach((c) => c.classList.remove('active'));
      renderMarketConverter(computeRecipeMetrics(appState.currentRecipe));
    });
    document.getElementById('market-buffer-pct').addEventListener('change', () => {
      renderMarketConverter(computeRecipeMetrics(appState.currentRecipe));
    });
    document.querySelectorAll('.market-qty-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.market-qty-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        document.getElementById('market-target-portions').value = chip.getAttribute('data-qty');
        renderMarketConverter(computeRecipeMetrics(appState.currentRecipe));
      });
    });
    document.getElementById('market-download-csv-btn').addEventListener('click', () => {
      const calc = computeRecipeMetrics(appState.currentRecipe);
      const target = Number(document.getElementById('market-target-portions').value) || 75;
      const res = window.DapurExporter.exportShoppingHppCsv(calc, appState.shopInfo, target);
      bumpExport(res.filename);
    });

    // Library Events & Modal
    document.getElementById('lib-search-input').addEventListener('input', renderLibraryGrid);
    document.getElementById('lib-fav-only-btn').addEventListener('click', () => {
      favOnlyMode = !favOnlyMode;
      renderLibraryGrid();
    });
    document.getElementById('lib-cat-pills').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      activeLibCategory = btn.getAttribute('data-cat');
      renderLibraryCategoryPills();
      renderLibraryGrid();
    });
    document.getElementById('lib-cards-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-lib-id]');
      if (card) openLibModal(card.getAttribute('data-lib-id'));
    });

    document.getElementById('lib-modal-close').addEventListener('click', closeLibModal);
    document.getElementById('lib-modal').addEventListener('click', (e) => {
      if (e.target.id === 'lib-modal') closeLibModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentModalItem) closeLibModal();
    });

    document.getElementById('lib-modal-copy').addEventListener('click', () => {
      if (!currentModalItem) return;
      const txt = `${currentModalItem.title}\n${currentModalItem.summary}\nContoh: ${currentModalItem.example}\nTips: ${currentModalItem.tip}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt);
      }
      showToast('Panduan SOP disalin ke papan klip.');
    });

    document.getElementById('lib-modal-fav').addEventListener('click', () => {
      if (!currentModalItem) return;
      const idx = appState.favoriteIds.indexOf(currentModalItem.id);
      if (idx >= 0) {
        appState.favoriteIds.splice(idx, 1);
        showToast('Dihapus dari daftar SOP Favorit.');
      } else {
        appState.favoriteIds.push(currentModalItem.id);
        showToast('Disimpan ke daftar SOP Favorit.');
      }
      document.getElementById('lib-modal-fav').textContent =
        appState.favoriteIds.includes(currentModalItem.id) ? 'Hapus dari Favorit' : 'Simpan ke Favorit';
      refreshAll();
    });

    document.getElementById('lib-modal-apply').addEventListener('click', () => {
      if (!currentModalItem) return;
      const addition = `\n• [${currentModalItem.code}] ${currentModalItem.title}: ${currentModalItem.tip}`;
      appState.currentRecipe.sopNotes = String(appState.currentRecipe.sopNotes || '').trim() + addition;
      syncWizardInputsFromRecipe();
      refreshAll();
      closeLibModal();
      switchView('wizard');
      switchWizardStep(1);
      showToast('Tips SOP ditempelkan ke Catatan Resep.');
    });

    // History Actions
    document.getElementById('history-recipes-list').addEventListener('click', (e) => {
      const loadBtn = e.target.closest('.hist-load-btn');
      const pdfBtn = e.target.closest('.hist-pdf-btn');
      const delBtn = e.target.closest('.hist-del-btn');
      if (loadBtn) {
        const entry = appState.savedRecipes[Number(loadBtn.getAttribute('data-hidx'))];
        if (entry) {
          appState.currentRecipe = cloneDeep(entry.recipe);
          syncWizardInputsFromRecipe();
          renderIngredientsTable();
          refreshAll();
          switchView('wizard');
          switchWizardStep(1);
          showToast(`Resep "${entry.recipe.name}" dimuat kembali.`);
        }
      } else if (pdfBtn) {
        const entry = appState.savedRecipes[Number(pdfBtn.getAttribute('data-hidx'))];
        if (entry) {
          const calc = computeRecipeMetrics(entry.recipe);
          const res = window.DapurExporter.exportRecipeSopPdf(calc, appState.shopInfo);
          bumpExport(res.filename);
        }
      } else if (delBtn) {
        const idx = Number(delBtn.getAttribute('data-hidx'));
        appState.savedRecipes.splice(idx, 1);
        refreshAll();
        showToast('Resep dihapus dari riwayat.');
      }
    });

    document.getElementById('history-favs-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.hist-open-sop');
      if (btn) openLibModal(btn.getAttribute('data-id'));
    });

    // Settings Form & JSON Backup/Restore
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      appState.shopInfo.ownerName = document.getElementById('set-owner').value.trim() || 'Kepala Dapur';
      appState.shopInfo.shopName = document.getElementById('set-shop').value.trim() || 'Dapur Kuliner Mandiri';
      appState.shopInfo.city = document.getElementById('set-city').value.trim() || 'Indonesia';
      appState.shopInfo.phone = document.getElementById('set-phone').value.trim() || '';
      refreshAll();
      showToast('Profil kedai berhasil diperbarui.');
    });

    document.getElementById('backup-json-btn').addEventListener('click', () => {
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), appState }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cadangan-DapurUntung-Studio.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showToast('File cadangan JSON berhasil diunduh.');
    });

    document.getElementById('restore-json-input').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          if (parsed && parsed.appState && parsed.appState.currentRecipe) {
            appState = Object.assign(appState, parsed.appState);
            syncWizardInputsFromRecipe();
            renderIngredientsTable();
            syncSettingsForm();
            refreshAll();
            showToast('Data kedai berhasil dipulihkan dari file cadangan!');
          } else {
            showToast('Format file cadangan tidak sesuai.');
          }
        } catch (err) {
          showToast('Gagal membaca file JSON.');
        }
      };
      reader.readAsText(file);
    });
  }

  // INIT
  loadPersistedState();
  bindEvents();
  if (session) {
    enterAuthenticatedApp();
  }
})();

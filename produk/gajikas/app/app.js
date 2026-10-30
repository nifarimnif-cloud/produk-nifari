// GajiKas Studio — Mesin Aplikasi Utama (100% Mandiri di Browser, Nol AI, Nol Emoji)
(function () {
  const LICENSE_SALT = 'nifari-lic-2026::';
  const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
  const DEV_AGENT_HASHES = new Set([
    '60a41e79f49faf4013b030879b1a96750cc2ce7a3ac36c7e67682fb72aa4478a',
    '648b2b57cc14be903609a4f9592c75472ad1c3b3af909623209c16d84fb77f2d',
    '6a01fa9dc6d008fcc7af47bdf0fed051de3fc33d64654675d7f9652c5876a4fd',
    'da0b8b57ce0954d12300ac48af76dd4ef0ed4affd14bb2c1399c4a7b7aa12352',
    '54c493738ab56754747609e7645554b1d0707ad0df07a8f253d4d4b0fca77319',
    '6b5e6084623cd1ba3aedc8e5b7f140951eaf2d060119a6cc1e446c8b30d4fbd9'
  ]);
  const OFFICIAL_BUYER_HASH = '2afbafd7f7c8cbaf9d179f7f627525a13aa9473257c902cd1ef7d3bdcaf28304';

  const STORAGE_KEYS = {
    session: 'gajikas_session_v1',
    state: 'gajikas_state_v1',
    theme: 'gajikas_theme_v1'
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

  const formatRp = window.GajiKasExporter.formatRp;
  const angkaKeTerbilang = window.GajiKasExporter.angkaKeTerbilang;
  const formatIndoDate = window.GajiKasExporter.formatIndoDate;

  // Core Payroll & P&L Calculations
  function computeEmployee(raw) {
    const tenureMonths = Math.max(0, Math.round(Number(raw.tenureMonths) || 0));
    const daysPresent = Math.max(0, Math.min(31, Number(raw.daysPresent) || 0));
    const baseSalary = Math.max(0, Math.round(Number(raw.baseSalary) || 0));
    const dailyAllowanceRate = Math.max(0, Math.round(Number(raw.dailyAllowanceRate) || 0));
    const overtimeHours = Math.max(0, Number(raw.overtimeHours) || 0);
    const overtimeMethod = raw.overtimeMethod === 'flat' ? 'flat' : 'depnaker';
    const overtimeRate = Math.max(0, Math.round(Number(raw.overtimeRate) || 0));
    const bonus = Math.max(0, Math.round(Number(raw.bonus) || 0));
    const includeThr = Boolean(raw.includeThr);
    const kasbonCut = Math.max(0, Math.round(Number(raw.kasbonCut) || 0));
    const lateCut = Math.max(0, Math.round(Number(raw.lateCut) || 0));
    const bpjsCut = Math.max(0, Math.round(Number(raw.bpjsCut) || 0));

    const allowanceTotal = Math.round(daysPresent * dailyAllowanceRate);
    const hourlyDepnaker = Math.round(baseSalary / 173);
    const overtimeTotal =
      overtimeMethod === 'depnaker'
        ? Math.round((baseSalary / 173) * overtimeHours)
        : Math.round(overtimeRate * overtimeHours);

    let thrAmount = 0;
    if (includeThr) {
      if (tenureMonths >= 12) thrAmount = baseSalary;
      else if (tenureMonths >= 1) thrAmount = Math.round((tenureMonths / 12) * baseSalary);
    }

    const grossPay = baseSalary + allowanceTotal + overtimeTotal + bonus + thrAmount;
    const totalDeductions = kasbonCut + lateCut + bpjsCut;
    const takeHomePay = Math.max(0, grossPay - totalDeductions);
    const excessDeduction = Math.max(0, totalDeductions - grossPay);
    const trimmedRawName = String(raw.name == null ? '' : raw.name).trim();

    return {
      id: raw.id || 'emp-' + Date.now(),
      name: trimmedRawName || 'Karyawan',
      rawNameEmpty: !trimmedRawName,
      role: String(raw.role || 'Staf Operasional').trim() || 'Staf Operasional',
      tenureMonths,
      daysPresent,
      baseSalary,
      dailyAllowanceRate,
      overtimeHours,
      overtimeMethod,
      overtimeRate,
      hourlyDepnaker,
      bonus,
      includeThr,
      kasbonCut,
      lateCut,
      bpjsCut,
      allowanceTotal,
      overtimeTotal,
      thrAmount,
      grossPay,
      totalDeductions,
      excessDeduction,
      takeHomePay,
      terbilang: angkaKeTerbilang(takeHomePay)
    };
  }

  function estimateKurPlafon36Months(monthlyInstallment) {
    // Standard KUR 6% effective p.a. 36 months annuity factor: ~0.0304219 per Rp 1 principal
    if (monthlyInstallment <= 0) return 0;
    return Math.round(monthlyInstallment / 0.0304219 / 100000) * 100000;
  }

  function computeFullPeriod(period) {
    const computedEmployees = (period.employees || []).map(computeEmployee);
    const cf = period.cashflow || {};

    const cashRevenue = Math.max(0, Math.round(Number(cf.cashRevenue) || 0));
    const nonCashRevenue = Math.max(0, Math.round(Number(cf.nonCashRevenue) || 0));
    const totalRevenue = cashRevenue + nonCashRevenue;
    const hppCost = Math.max(0, Math.round(Number(cf.hppCost) || 0));
    const grossProfit = totalRevenue - hppCost;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    let totalBaseSalary = 0;
    let totalAllowance = 0;
    let totalOvertimeHours = 0;
    let totalOvertimeRp = 0;
    let totalBonus = 0;
    let totalThr = 0;
    let payrollGrossTotal = 0;
    let totalKasbonCut = 0;
    let totalLateCut = 0;
    let totalBpjsCut = 0;
    let totalDeductionsAll = 0;
    let payrollTakeHomeTotal = 0;

    computedEmployees.forEach((e) => {
      totalBaseSalary += e.baseSalary;
      totalAllowance += e.allowanceTotal;
      totalOvertimeHours += e.overtimeHours;
      totalOvertimeRp += e.overtimeTotal;
      totalBonus += e.bonus;
      totalThr += e.thrAmount;
      payrollGrossTotal += e.grossPay;
      totalKasbonCut += e.kasbonCut;
      totalLateCut += e.lateCut;
      totalBpjsCut += e.bpjsCut;
      totalDeductionsAll += e.totalDeductions;
      payrollTakeHomeTotal += e.takeHomePay;
    });

    const rentCost = Math.max(0, Math.round(Number(cf.rentCost) || 0));
    const utilityCost = Math.max(0, Math.round(Number(cf.utilityCost) || 0));
    const suppliesCost = Math.max(0, Math.round(Number(cf.suppliesCost) || 0));
    const transportCost = Math.max(0, Math.round(Number(cf.transportCost) || 0));
    const marketingCost = Math.max(0, Math.round(Number(cf.marketingCost) || 0));
    const otherCost = Math.max(0, Math.round(Number(cf.otherCost) || 0));

    const nonPayrollOpex = rentCost + utilityCost + suppliesCost + transportCost + marketingCost + otherCost;
    const totalOpex = payrollGrossTotal + nonPayrollOpex;
    const netProfit = grossProfit - totalOpex;
    const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const payrollRatioPct = totalRevenue > 0 ? (payrollGrossTotal / totalRevenue) * 100 : 0;
    const kasbonRatioPct = totalBaseSalary > 0 ? (totalKasbonCut / totalBaseSalary) * 100 : 0;
    const fixedOverheadPct = totalRevenue > 0 ? ((rentCost + utilityCost) / totalRevenue) * 100 : 0;
    const nonCashSharePct = totalRevenue > 0 ? (nonCashRevenue / totalRevenue) * 100 : 0;
    const revPerEmp = computedEmployees.length > 0 ? Math.round(totalRevenue / computedEmployees.length) : totalRevenue;
    const kurMaxInstallment = netProfit > 0 ? Math.round(netProfit * 0.3) : 0;
    const estimatedKurPlafon36m = estimateKurPlafon36Months(kurMaxInstallment);

    // 8-Point Audit Items
    const audits = [
      {
        title: '1. Margin Laba Kotor (Omzet - HPP)',
        val: `${grossMarginPct.toFixed(1)}% (${formatRp(grossProfit)})`,
        ok: grossMarginPct >= 20,
        note: grossMarginPct >= 20 ? 'Margin kotor cukup sehat menutup biaya tetap.' : 'Margin kotor tipis; cek harga beli supplier & kebocoran stok.'
      },
      {
        title: '2. Rasio Gaji Tim terhadap Omzet',
        val: `${payrollRatioPct.toFixed(1)}%`,
        ok: payrollRatioPct <= 28,
        note: payrollRatioPct <= 25 ? 'Ideal UMKM (< 25% omzet).' : payrollRatioPct <= 30 ? 'Batas atas wajar (25-30%).' : 'Melebihi 30% omzet; evaluasi jadwal lembur/produktivitas.'
      },
      {
        title: '3. Margin Laba Bersih Operasional',
        val: `${netMarginPct.toFixed(1)}% (${formatRp(netProfit)})`,
        ok: netProfit > 0 && netMarginPct >= 8,
        note: netProfit <= 0 ? 'Usaha mengalami defisit kas bulan ini.' : netMarginPct >= 10 ? 'Laba bersih sehat untuk ditabung & ekspansi.' : 'Laba positif namun tipis (< 10%).'
      },
      {
        title: '4. Rasio Potongan Kasbon terhadap Gaji Pokok',
        val: `${kasbonRatioPct.toFixed(1)}% (${formatRp(totalKasbonCut)})`,
        ok: kasbonRatioPct <= 20,
        note: kasbonRatioPct <= 20 ? 'Cicilan kasbon tim terkendali aman (<= 20%).' : 'Kasbon tim cukup tinggi; batasi pinjaman baru sebelum lunas.'
      },
      {
        title: '5. Beban Sewa & Utilitas Tetap',
        val: `${fixedOverheadPct.toFixed(1)}% omzet`,
        ok: fixedOverheadPct <= 14,
        note: fixedOverheadPct <= 14 ? 'Beban ruko & listrik efisien.' : 'Sewa + listrik cukup berat dibanding omzet saat ini.'
      },
      {
        title: '6. Porsi Mutasi Non-Tunai / QRIS Rekening',
        val: `${nonCashSharePct.toFixed(1)}%`,
        ok: nonCashSharePct >= 25,
        note: nonCashSharePct >= 25 ? 'Tercatat kuat di mutasi rekening koran bank.' : 'Dominan tunai; rutin setor tunai ke ATM CRM agar terbaca analis KUR.'
      },
      {
        title: '7. Produktivitas Omzet per Karyawan',
        val: `${formatRp(revPerEmp)} / org`,
        ok: computedEmployees.length === 0 || revPerEmp >= 8000000,
        note: 'Rata-rata omzet bulanan yang dihasilkan per anggota tim.'
      },
      {
        title: '8. Kapasitas Aman Angsuran KUR Bank (30% Laba)',
        val: `${formatRp(kurMaxInstallment)} / bln`,
        ok: kurMaxInstallment >= 750000,
        note: kurMaxInstallment >= 750000 ? `Layak ajukan KUR hingga kisaran ${formatRp(estimatedKurPlafon36m)} (36 bln).` : 'Naikkan laba bersih dulu sebelum mengambil cicilan bank.'
      }
    ];

    return {
      ...period,
      employees: computedEmployees,
      summary: {
        cashRevenue,
        nonCashRevenue,
        totalRevenue,
        hppCost,
        grossProfit,
        grossMarginPct,
        totalBaseSalary,
        totalAllowance,
        totalOvertimeHours,
        totalOvertimeRp,
        totalBonus,
        totalThr,
        payrollGrossTotal,
        totalKasbonCut,
        totalLateCut,
        totalBpjsCut,
        totalDeductionsAll,
        payrollTakeHomeTotal,
        rentCost,
        utilityCost,
        suppliesCost,
        transportCost,
        marketingCost,
        otherCost,
        nonPayrollOpex,
        totalOpex,
        netProfit,
        netMarginPct,
        payrollRatioPct,
        kasbonRatioPct,
        fixedOverheadPct,
        nonCashSharePct,
        revPerEmp,
        kurMaxInstallment,
        estimatedKurPlafon36m,
        audits
      }
    };
  }

  // Application State
  let session = null;
  let appState = null;
  let activeNav = 'dashboard';
  let activeWizStep = 1;
  let activeEmpId = null;
  let activePreviewMode = 'slip';
  let activeLibCategory = 'Semua';
  let activeSopModalId = null;

  function buildDefaultState(ownerSession) {
    const firstPreset = cloneDeep(window.GAJIKAS_PRESETS[0]);
    const ownerName = (ownerSession && ownerSession.ownerName) || 'Pemilik Usaha';
    const bizName = (ownerSession && ownerSession.businessName) || firstPreset.businessName;
    const currentPeriod = {
      id: 'per-initial',
      presetId: firstPreset.id,
      presetLabel: firstPreset.label,
      ownerName,
      businessName: bizName,
      city: firstPreset.city,
      periodLabel: firstPreset.periodLabel,
      payDate: firstPreset.payDate,
      cashflow: firstPreset.cashflow,
      employees: firstPreset.employees
    };
    const savedSample = cloneDeep(currentPeriod);
    savedSample.id = 'hist-sample-1';
    savedSample.ownerName = ownerName;
    savedSample.savedAt = '2026-10-29T09:00:00Z';

    return {
      profile: {
        ownerName,
        businessName: bizName,
        city: firstPreset.city,
        email: (ownerSession && ownerSession.email) || ''
      },
      currentPeriod,
      history: [savedSample],
      favorites: ['sop-001', 'sop-021', 'sop-067', 'sop-101']
    };
  }

  function formatSavedTimestamp(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return String(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dd = d.getDate();
    const mm = months[d.getMonth()] || '';
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mm} ${yyyy}, ${hh}:${min}`;
  }

  function saveState() {
    if (!appState) return;
    try {
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(appState));
    } catch (_e) {
      // Ignore storage quota issues
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }

  // Theme Management
  function applyTheme(theme) {
    const clean = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', clean);
    const lbl = document.getElementById('theme-toggle-label');
    if (lbl) lbl.textContent = clean === 'dark' ? 'Mode Terang' : 'Mode Gelap';
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.innerHTML =
        clean === 'dark'
          ? '<circle cx="10" cy="10" r="3.6"/><path d="M10 2.2v2.1M10 15.7v2.1M2.2 10h2.1M15.7 10h2.1M4.5 4.5l1.5 1.5M14 14l1.5 1.5M15.5 4.5L14 6M6 14l-1.5 1.5"/>'
          : '<path d="M10 3a7 7 0 1 0 7 7c0-.4 0-.8-.1-1.2A5.5 5.5 0 0 1 11.2 3.1C10.8 3 10.4 3 10 3z"/>';
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, clean);
    } catch (_e) {}
  }

  // Navigation & Drawer
  function closeMobileDrawer() {
    document.getElementById('mobile-drawer').classList.remove('open');
    document.getElementById('drawer-backdrop').classList.remove('open');
  }

  function openMobileDrawer() {
    document.getElementById('mobile-drawer').classList.add('open');
    document.getElementById('drawer-backdrop').classList.add('open');
  }

  function switchView(viewId) {
    activeNav = viewId;
    document.querySelectorAll('.view-pane').forEach((p) => {
      p.classList.toggle('active', p.id === 'view-' + viewId);
    });
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-nav') === viewId);
    });
    const mobMoreBtn = document.getElementById('btn-mob-more');
    if (mobMoreBtn) {
      mobMoreBtn.classList.toggle('active', ['favorites', 'history', 'settings'].includes(viewId));
    }
    closeMobileDrawer();
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (viewId === 'favorites') renderFavorites();
    if (viewId === 'history') renderHistory();
    if (viewId === 'library') renderLibrary();
    if (viewId === 'settings') populateSettingsForm();
  }

  function activateWizardDomStep(stepNum) {
    activeWizStep = stepNum;
    [1, 2, 3].forEach((n) => {
      const pane = document.getElementById('wiz-pane-' + n);
      if (pane) pane.style.display = n === stepNum ? 'block' : 'none';
    });
    document.querySelectorAll('.step-tab').forEach((t) => {
      t.classList.toggle('active', Number(t.getAttribute('data-wiz-step')) === stepNum);
    });
  }

  function switchWizardStep(stepNum) {
    if ((stepNum === 2 || stepNum === 3) && appState && appState.currentPeriod) {
      const p = appState.currentPeriod;
      if (!String(p.businessName || '').trim()) {
        activateWizardDomStep(1);
        renderAllCalculatedUI();
        showToast('Mohon isi Nama Usaha di Dokumen pada Langkah 1 terlebih dahulu.');
        const el = document.getElementById('wiz-biz-name');
        if (el) el.focus();
        return false;
      }
      if (!String(p.periodLabel || '').trim()) {
        activateWizardDomStep(1);
        renderAllCalculatedUI();
        showToast('Mohon isi Bulan & Tahun Periode pada Langkah 1 terlebih dahulu.');
        const el = document.getElementById('wiz-period-label');
        if (el) el.focus();
        return false;
      }
      if (!Array.isArray(p.employees) || p.employees.length === 0) {
        activateWizardDomStep(1);
        renderAllCalculatedUI();
        showToast('Daftar karyawan masih kosong. Tambahkan minimal 1 karyawan terlebih dahulu.');
        const el = document.getElementById('btn-add-employee');
        if (el) el.focus();
        return false;
      }
      const unnamed = p.employees.find((emp) => !emp || !emp.name || !String(emp.name).trim());
      if (unnamed) {
        activeEmpId = unnamed.id;
        activateWizardDomStep(1);
        populateEmployeeEditor();
        renderAllCalculatedUI();
        showToast('Nama karyawan tidak boleh kosong. Lengkapi Nama Karyawan yang aktif diedit.');
        const el = document.getElementById('emp-name');
        if (el) el.focus();
        return false;
      }
    }

    activateWizardDomStep(stepNum);
    renderAllCalculatedUI();
    return true;
  }

  // Render Preset Buttons
  function renderPresetButtons() {
    const wrap = document.getElementById('preset-buttons');
    if (!wrap) return;
    wrap.innerHTML = '';
    (window.GAJIKAS_PRESETS || []).forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-btn' + (appState.currentPeriod.presetId === p.id ? ' active' : '');
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        const cloned = cloneDeep(p);
        appState.currentPeriod.id = 'per-' + Date.now();
        appState.currentPeriod.presetId = cloned.id;
        appState.currentPeriod.presetLabel = cloned.label;
        appState.currentPeriod.ownerName = appState.profile.ownerName || 'Pemilik Usaha';
        appState.currentPeriod.businessName = cloned.businessName;
        appState.currentPeriod.city = cloned.city;
        appState.currentPeriod.periodLabel = cloned.periodLabel;
        appState.currentPeriod.payDate = cloned.payDate;
        appState.currentPeriod.cashflow = cloned.cashflow;
        appState.currentPeriod.employees = cloned.employees;
        activeEmpId = cloned.employees[0] ? cloned.employees[0].id : null;
        syncPeriodMetaInputs();
        syncCashflowInputs();
        populateEmployeeEditor();
        renderPresetButtons();
        syncQuickCalcFromPeriod();
        renderAllCalculatedUI();
        saveState();
        showToast('Preset "' + cloned.label + '" dimuat (3 staf & buku kas).');
      });
      wrap.appendChild(btn);
    });
  }

  function syncPeriodMetaInputs() {
    const p = appState.currentPeriod;
    document.getElementById('wiz-biz-name').value = p.businessName || '';
    document.getElementById('wiz-period-label').value = p.periodLabel || '';
    document.getElementById('wiz-pay-date').value = p.payDate || '2026-10-31';
    document.getElementById('wiz-city').value = p.city || '';
  }

  function syncCashflowInputs() {
    const cf = appState.currentPeriod.cashflow || {};
    document.getElementById('cf-cash').value = cf.cashRevenue ?? 0;
    document.getElementById('cf-noncash').value = cf.nonCashRevenue ?? 0;
    document.getElementById('cf-hpp').value = cf.hppCost ?? 0;
    document.getElementById('cf-rent').value = cf.rentCost ?? 0;
    document.getElementById('cf-utility').value = cf.utilityCost ?? 0;
    document.getElementById('cf-supplies').value = cf.suppliesCost ?? 0;
    document.getElementById('cf-transport').value = cf.transportCost ?? 0;
    document.getElementById('cf-marketing').value = cf.marketingCost ?? 0;
    document.getElementById('cf-other').value = cf.otherCost ?? 0;
  }

  function getActiveEmployeeRaw() {
    const emps = appState.currentPeriod.employees || [];
    if (!emps.length) return null;
    let found = emps.find((e) => e.id === activeEmpId);
    if (!found) {
      found = emps[0];
      activeEmpId = found.id;
    }
    return found;
  }

  function populateEmployeeEditor() {
    const raw = getActiveEmployeeRaw();
    const panel = document.getElementById('emp-editor-panel');
    const badge = document.getElementById('emp-editor-badge');
    const warnEl = document.getElementById('emp-cut-warning');
    if (!raw) {
      panel.style.opacity = '0.5';
      panel.style.pointerEvents = 'none';
      document.getElementById('emp-editor-heading').textContent = 'Belum Ada Karyawan';
      if (badge) {
        badge.className = 'tag tag-warn';
        badge.textContent = 'Nonaktif';
      }
      document.getElementById('emp-name').value = '';
      document.getElementById('emp-role').value = '';
      document.getElementById('emp-tenure').value = 0;
      document.getElementById('emp-days').value = 0;
      document.getElementById('emp-base').value = 0;
      document.getElementById('emp-allowance').value = 0;
      document.getElementById('emp-ot-hours').value = 0;
      document.getElementById('emp-ot-method').value = 'depnaker';
      document.getElementById('emp-ot-rate').value = 0;
      document.getElementById('emp-bonus').value = 0;
      document.getElementById('emp-thr-toggle').checked = false;
      document.getElementById('emp-kasbon').value = 0;
      document.getElementById('emp-late').value = 0;
      document.getElementById('emp-bpjs').value = 0;
      document.getElementById('emp-live-thp').textContent = 'Rp 0';
      document.getElementById('emp-live-terbilang').textContent = 'Tambahkan karyawan untuk mulai menghitung gaji.';
      if (warnEl) warnEl.style.display = 'none';
      return;
    }

    panel.style.opacity = '1';
    panel.style.pointerEvents = 'auto';
    if (badge) {
      badge.className = 'tag tag-ok';
      badge.textContent = 'Aktif Diedit';
    }
    document.getElementById('emp-editor-heading').textContent = String(raw.name || '').trim() || 'Karyawan Baru';
    document.getElementById('emp-name').value = raw.name || '';
    document.getElementById('emp-role').value = raw.role || '';
    document.getElementById('emp-tenure').value = raw.tenureMonths ?? 12;
    document.getElementById('emp-days').value = raw.daysPresent ?? 26;
    document.getElementById('emp-base').value = raw.baseSalary ?? 0;
    document.getElementById('emp-allowance').value = raw.dailyAllowanceRate ?? 0;
    document.getElementById('emp-ot-hours').value = raw.overtimeHours ?? 0;
    const method = raw.overtimeMethod === 'flat' ? 'flat' : 'depnaker';
    document.getElementById('emp-ot-method').value = method;
    if (method === 'flat') {
      const flatVal = Number(raw.overtimeRate) > 0 ? Math.round(Number(raw.overtimeRate)) : 20000;
      document.getElementById('emp-ot-rate').value = flatVal;
      document.getElementById('emp-ot-rate').disabled = false;
    } else {
      updateOvertimeRateVisibility();
    }
    document.getElementById('emp-bonus').value = raw.bonus ?? 0;
    document.getElementById('emp-thr-toggle').checked = Boolean(raw.includeThr);
    document.getElementById('emp-kasbon').value = raw.kasbonCut ?? 0;
    document.getElementById('emp-late').value = raw.lateCut ?? 0;
    document.getElementById('emp-bpjs').value = raw.bpjsCut ?? 0;
  }

  function updateOvertimeRateVisibility() {
    const method = document.getElementById('emp-ot-method').value;
    const rateInput = document.getElementById('emp-ot-rate');
    if (method === 'depnaker') {
      const raw = getActiveEmployeeRaw();
      const autoRate = raw ? Math.round((Number(raw.baseSalary) || 0) / 173) : 0;
      rateInput.value = autoRate;
      rateInput.disabled = true;
    } else {
      rateInput.disabled = false;
    }
  }

  function renderAllCalculatedUI() {
    const comp = computeFullPeriod(appState.currentPeriod);
    const sum = comp.summary;
    const displayBizName = comp.businessName || appState.profile.businessName || 'Usaha UMKM';
    const ownerDisplay = appState.profile.ownerName || comp.ownerName || 'Pemilik Usaha';
    const profileBizDisplay = appState.profile.businessName || displayBizName;

    // Header, Sidebar, Mobile Drawer & Badges
    document.getElementById('topbar-biz-name').textContent = displayBizName;
    document.getElementById('topbar-period-tag').textContent = 'Periode: ' + (comp.periodLabel || '-');
    document.getElementById('sidebar-user-label').textContent = `${ownerDisplay} • ${profileBizDisplay}`;
    document.getElementById('dash-greeting').textContent = `Selamat bertugas, ${ownerDisplay}`;

    const drawerOwner = document.getElementById('drawer-user-owner');
    const drawerBiz = document.getElementById('drawer-user-biz');
    const drawerFav = document.getElementById('drawer-fav-badge');
    const drawerHist = document.getElementById('drawer-hist-badge');
    if (drawerOwner) drawerOwner.textContent = ownerDisplay;
    if (drawerBiz) drawerBiz.textContent = profileBizDisplay;
    if (drawerFav) drawerFav.textContent = appState.favorites.length;
    if (drawerHist) drawerHist.textContent = appState.history.length;

    document.getElementById('nav-emp-badge').textContent = comp.employees.length;
    document.getElementById('nav-fav-badge').textContent = appState.favorites.length;
    document.getElementById('nav-hist-badge').textContent = appState.history.length;

    document.getElementById('stat-periods').textContent = appState.history.length;
    document.getElementById('stat-employees').textContent = comp.employees.length;
    document.getElementById('stat-favorites').textContent = appState.favorites.length;

    // Dashboard Live Rail Diagram
    document.getElementById('rail-omzet-val').textContent = formatRp(sum.totalRevenue);
    document.getElementById('rail-hpp-val').textContent = '- ' + formatRp(sum.hppCost);
    document.getElementById('rail-gross-sub').textContent = `Laba Kotor: ${sum.grossMarginPct.toFixed(1)}%`;
    document.getElementById('rail-opex-val').textContent = '- ' + formatRp(sum.totalOpex);
    document.getElementById('rail-payroll-sub').textContent = `Rasio Gaji: ${sum.payrollRatioPct.toFixed(1)}%`;
    document.getElementById('rail-net-val').textContent = formatRp(sum.netProfit);
    document.getElementById('rail-kur-sub').textContent = `Aman KUR 30%: ${formatRp(sum.kurMaxInstallment)}/bln`;
    document.getElementById('rail-plafon-note').textContent = `Est. Plafon KUR 36 Bln: ${formatRp(sum.estimatedKurPlafon36m)}`;

    const railBadge = document.getElementById('rail-status-badge');
    if (sum.netProfit > 0 && sum.payrollRatioPct <= 28) {
      railBadge.className = 'tag tag-ok';
      railBadge.textContent = 'RASIO GAJI & KAS SEHAT';
    } else {
      railBadge.className = 'tag tag-warn';
      railBadge.textContent = 'PERLU EVALUASI RASIO KAS';
    }

    // Step 1 Payroll Roster Table
    const tbody = document.getElementById('payroll-table-body');
    tbody.innerHTML = '';
    if (!comp.employees.length) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `<td colspan="6" class="text-subtle" style="text-align: center; padding: 24px 16px;">Belum ada karyawan dalam daftar gaji periode ini. Klik tombol <strong>+ Tambah Karyawan</strong> di kanan atas untuk mulai menghitung.</td>`;
      tbody.appendChild(emptyTr);
    } else {
      comp.employees.forEach((emp) => {
        const tr = document.createElement('tr');
        if (emp.id === activeEmpId) tr.className = 'selected-row';
        tr.style.cursor = 'pointer';

        const tdName = document.createElement('td');
        const nameMarkup = emp.rawNameEmpty
          ? `<span style="color: var(--color-ledger-brown); font-style: italic;">(Nama Belum Diisi)</span>`
          : escapeHtml(emp.name);
        tdName.innerHTML = `<div style="font-weight: 600; color: var(--color-ink);">${nameMarkup}</div><div class="text-subtle" style="font-size: 12px;">${escapeHtml(emp.role)}</div>`;

        const tdDays = document.createElement('td');
        tdDays.className = 'num-mono';
        tdDays.innerHTML = `${emp.daysPresent} hr<div class="text-subtle" style="font-family: var(--font-sans); font-size: 11.5px;">${emp.tenureMonths} bln${emp.includeThr ? ' + THR' : ''}</div>`;

        const tdGross = document.createElement('td');
        tdGross.className = 'num-mono';
        tdGross.textContent = formatRp(emp.grossPay);

        const tdCut = document.createElement('td');
        tdCut.className = 'num-mono';
        tdCut.style.color = 'var(--color-ledger-brown)';
        tdCut.textContent = '- ' + formatRp(emp.totalDeductions);

        const tdNet = document.createElement('td');
        tdNet.innerHTML = `<div class="num-mono" style="font-weight: 600; color: var(--color-network-green);">${formatRp(emp.takeHomePay)}</div><div class="text-subtle" style="font-size: 11px; max-width: 190px;">${escapeHtml(emp.terbilang)}</div>`;

        const tdAct = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-subtle btn-sm';
        editBtn.style.marginRight = '4px';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          activeEmpId = emp.id;
          populateEmployeeEditor();
          renderAllCalculatedUI();
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-subtle btn-sm';
        delBtn.textContent = 'Hapus';
        delBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          appState.currentPeriod.employees = appState.currentPeriod.employees.filter((x) => x.id !== emp.id);
          if (!appState.currentPeriod.employees.length) {
            activeEmpId = null;
            populateEmployeeEditor();
          } else if (activeEmpId === emp.id) {
            activeEmpId = appState.currentPeriod.employees[0].id;
            populateEmployeeEditor();
          }
          renderAllCalculatedUI();
          saveState();
          showToast('Baris karyawan dihapus.');
        });

        tdAct.appendChild(editBtn);
        tdAct.appendChild(delBtn);

        tr.addEventListener('click', () => {
          activeEmpId = emp.id;
          populateEmployeeEditor();
          renderAllCalculatedUI();
        });

        tr.append(tdName, tdDays, tdGross, tdCut, tdNet, tdAct);
        tbody.appendChild(tr);
      });
    }

    document.getElementById('step1-total-gross').textContent = formatRp(sum.payrollGrossTotal);
    document.getElementById('step1-total-cuts').textContent = '- ' + formatRp(sum.totalDeductionsAll);
    document.getElementById('step1-total-net').textContent = formatRp(sum.payrollTakeHomeTotal);
    document.getElementById('step1-total-terbilang').textContent =
      'Terbilang Kas Gaji Bersih Tim: # ' + angkaKeTerbilang(sum.payrollTakeHomeTotal) + ' #';

    // Update Active Employee Live Box & Excess Deduction Warning
    const warnEl = document.getElementById('emp-cut-warning');
    const activeComp = comp.employees.find((e) => e.id === activeEmpId) || comp.employees[0];
    if (activeComp) {
      document.getElementById('emp-editor-heading').textContent = activeComp.rawNameEmpty ? 'Karyawan Baru' : activeComp.name;
      document.getElementById('emp-live-thp').textContent = formatRp(activeComp.takeHomePay);
      document.getElementById('emp-live-terbilang').textContent =
        'Terbilang: # ' + activeComp.terbilang + ' #';
      if (warnEl) {
        if (activeComp.totalDeductions > activeComp.grossPay) {
          warnEl.textContent =
            `Perhatian: Total potongan (${formatRp(activeComp.totalDeductions)}) melebihi Gaji Kotor (${formatRp(activeComp.grossPay)}). Sisa kasbon ${formatRp(activeComp.excessDeduction)} perlu dijadwalkan ke bulan depan.`;
          warnEl.style.display = 'block';
        } else {
          warnEl.style.display = 'none';
        }
      }
      const thrExplain = document.getElementById('emp-thr-explain');
      if (activeComp.includeThr) {
        thrExplain.textContent =
          activeComp.tenureMonths >= 12
            ? `Masa kerja ${activeComp.tenureMonths} bln (>= 12 bln) -> THR Penuh 1x Gaji Pokok: ${formatRp(activeComp.thrAmount)}`
            : `Masa kerja ${activeComp.tenureMonths} bln (< 12 bln) -> THR Proporsional (${activeComp.tenureMonths}/12): ${formatRp(activeComp.thrAmount)}`;
      } else {
        thrExplain.textContent =
          activeComp.tenureMonths >= 12
            ? `Jika dicentang: berhak 1x Gaji Pokok (${formatRp(activeComp.baseSalary)}).`
            : `Jika dicentang: proporsional ${activeComp.tenureMonths}/12 x Gaji Pokok (${formatRp(Math.round((activeComp.tenureMonths / 12) * activeComp.baseSalary))}).`;
      }
    } else if (warnEl) {
      warnEl.style.display = 'none';
    }

    // Step 2 Sync & 8-Point Audit
    document.getElementById('cf-payroll-locked').textContent = formatRp(sum.payrollGrossTotal);
    document.getElementById('cf-payroll-sub').textContent =
      `${comp.employees.length} karyawan • Kas bersih ditransfer: ${formatRp(sum.payrollTakeHomeTotal)} (Potongan: ${formatRp(sum.totalDeductionsAll)})`;
    document.getElementById('step2-net-profit').textContent = formatRp(sum.netProfit);
    document.getElementById('step2-net-terbilang').textContent =
      'Terbilang: # ' + angkaKeTerbilang(sum.netProfit) + ' #';
    document.getElementById('step2-kur-limit').textContent = formatRp(sum.kurMaxInstallment) + ' / bln';
    document.getElementById('step2-kur-plafon').textContent = formatRp(sum.estimatedKurPlafon36m);

    const auditWrap = document.getElementById('audit-8-list');
    auditWrap.innerHTML = '';
    sum.audits.forEach((a) => {
      const item = document.createElement('div');
      item.style.padding = '10px 12px';
      item.style.border = '1px solid var(--color-rule-gray)';
      item.style.borderRadius = '4px';
      item.style.backgroundColor = 'var(--color-canvas-subtle)';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <strong style="font-size: 13px;">${escapeHtml(a.title)}</strong>
          <span class="tag ${a.ok ? 'tag-ok' : 'tag-warn'}">${escapeHtml(a.val)}</span>
        </div>
        <div class="text-subtle" style="margin-top: 4px; font-size: 12px;">${escapeHtml(a.note)}</div>
      `;
      auditWrap.appendChild(item);
    });

    // Step 3 Preview Dropdown & Sheets (always synced with activeEmpId)
    const sel = document.getElementById('preview-emp-select');
    sel.innerHTML = '';
    if (!comp.employees.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Belum ada karyawan --';
      sel.appendChild(opt);
      sel.disabled = true;
    } else {
      sel.disabled = false;
      comp.employees.forEach((e) => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.name} — ${e.role} (${formatRp(e.takeHomePay)})`;
        sel.appendChild(opt);
      });
      if (activeEmpId && comp.employees.some((e) => e.id === activeEmpId)) {
        sel.value = activeEmpId;
      } else {
        activeEmpId = comp.employees[0].id;
        sel.value = activeEmpId;
      }
    }

    renderStep3Previews(comp);
  }

  function renderStep3Previews(comp) {
    const bizName = comp.businessName || appState.profile.businessName || 'Usaha UMKM';
    const ownerName = comp.ownerName || appState.profile.ownerName || 'Pemilik Usaha';
    const city = comp.city || appState.profile.city || 'Indonesia';
    const selId = document.getElementById('preview-emp-select').value;
    const emp = comp.employees.find((e) => e.id === selId) || comp.employees[0];
    const sum = comp.summary;

    const slipEl = document.getElementById('preview-pane-slip');
    if (!emp) {
      slipEl.innerHTML = `
        <div class="doc-sheet-body" style="padding: 36px 24px; text-align: center;">
          <div style="font-family: var(--font-mono); font-size: 12px; color: #706f6f;">PRATINJAU SLIP GAJI KARYAWAN</div>
          <div style="font-weight: 600; font-size: 16px; color: #151515; margin-top: 8px;">Belum ada karyawan dalam daftar gaji periode ini.</div>
          <div style="font-size: 13.5px; color: #706f6f; margin-top: 6px;">Kembali ke Langkah 1 dan klik tombol <strong>+ Tambah Karyawan</strong> untuk membuat slip gaji resmi.</div>
        </div>
      `;
    } else {
      slipEl.innerHTML = `
        <div class="doc-sheet-header">
          <div>
            <div style="font-family: var(--font-mono); font-size: 11.5px; color: #bae0cf;">SLIP GAJI RESMI KARYAWAN // GAJIKAS LEDGER</div>
            <div style="font-family: var(--font-display); font-size: 22px; font-weight: 500; margin-top: 4px;">${escapeHtml(bizName)}</div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.78); margin-top: 2px;">Periode: ${escapeHtml(comp.periodLabel)} &bull; Tanggal Bayar: ${escapeHtml(formatIndoDate(comp.payDate))}</div>
          </div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 12px; color: #bae0cf;">
            DOKUMEN ASLI SIAP CETAK
          </div>
        </div>
        <div class="doc-sheet-body">
          <div class="grid-2" style="padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid #dcdcdc; gap: 10px;">
            <div>
              <div style="font-size: 12px; color: #706f6f;">Nama Penerima &amp; Jabatan</div>
              <div style="font-weight: 600; font-size: 16px; color: #151515;">${escapeHtml(emp.name)} — ${escapeHtml(emp.role)}</div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 13px; color: #424242;">
              Masa Kerja: <strong>${emp.tenureMonths} Bulan</strong> &nbsp;|&nbsp; Kehadiran: <strong>${emp.daysPresent} Hari</strong> &nbsp;|&nbsp; Lembur: <strong>${emp.overtimeHours} Jam</strong>
            </div>
          </div>

          <div class="grid-2" style="gap: 24px;">
            <div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: #29735c; font-weight: 600; margin-bottom: 8px;">A. RINCIAN PENERIMAAN</div>
              <div class="kv-row" style="border-color: #ececec;"><span>Gaji Pokok Bulanan</span><span class="num-mono">${formatRp(emp.baseSalary)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>Makan &amp; Transport (${emp.daysPresent} hr)</span><span class="num-mono">${formatRp(emp.allowanceTotal)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>Upah Lembur (${emp.overtimeHours} jam)</span><span class="num-mono">${formatRp(emp.overtimeTotal)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>Bonus / Insentif Kinerja</span><span class="num-mono">${formatRp(emp.bonus)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>THR Keagamaan ${emp.includeThr ? (emp.tenureMonths >= 12 ? '(Penuh 1x)' : '(Proporsional)') : ''}</span><span class="num-mono">${formatRp(emp.thrAmount)}</span></div>
              <div class="kv-row" style="font-weight: 600; padding-top: 10px;"><span>Total Penerimaan Kotor</span><span class="num-mono">${formatRp(emp.grossPay)}</span></div>
            </div>

            <div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: #7b5953; font-weight: 600; margin-bottom: 8px;">B. RINCIAN POTONGAN</div>
              <div class="kv-row" style="border-color: #ececec;"><span>Cicilan Kasbon Karyawan</span><span class="num-mono">- ${formatRp(emp.kasbonCut)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>Potongan Keterlambatan / Absen</span><span class="num-mono">- ${formatRp(emp.lateCut)}</span></div>
              <div class="kv-row" style="border-color: #ececec;"><span>Iuran BPJS Karyawan</span><span class="num-mono">- ${formatRp(emp.bpjsCut)}</span></div>
              <div class="kv-row" style="font-weight: 600; padding-top: 10px; color: #7b5953;"><span>Total Potongan</span><span class="num-mono">- ${formatRp(emp.totalDeductions)}</span></div>
            </div>
          </div>

          <div style="margin-top: 18px; padding: 16px 18px; background-color: #f0f8f9; border-left: 4px solid #29735c;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px;">
              <span style="font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: #151515;">GAJI BERSIH DITERIMA (TAKE-HOME PAY)</span>
              <strong class="num-mono" style="font-size: 24px; color: #29735c;">${formatRp(emp.takeHomePay)}</strong>
            </div>
            <div style="margin-top: 6px; font-size: 13.5px; color: #424242;">
              Terbilang: <strong># ${escapeHtml(emp.terbilang)} #</strong>
            </div>
          </div>

          <div class="doc-sig-grid">
            <div>
              <div style="font-size: 12px; color: #706f6f;">&nbsp;</div>
              <div style="font-size: 13px; color: #424242; margin-top: 2px;">Disetujui oleh Pemilik / HR,</div>
              <div style="height: 44px;"></div>
              <div style="font-weight: 600; color: #151515;">( ${escapeHtml(ownerName)} )</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #706f6f;">${escapeHtml(city)}, ${escapeHtml(formatIndoDate(comp.payDate))}</div>
              <div style="font-size: 13px; color: #424242; margin-top: 2px;">Penerima Upah,</div>
              <div style="height: 44px;"></div>
              <div style="font-weight: 600; color: #151515;">( ${escapeHtml(emp.name)} )</div>
            </div>
          </div>
        </div>
      `;
    }

    const plEl = document.getElementById('preview-pane-pl');
    plEl.innerHTML = `
      <div class="doc-sheet-header">
        <div>
          <div style="font-family: var(--font-mono); font-size: 11.5px; color: #bae0cf;">LAPORAN LABA-RUGI OPERASIONAL STANDAR BANK / KUR</div>
          <div style="font-family: var(--font-display); font-size: 22px; font-weight: 500; margin-top: 4px;">${escapeHtml(bizName)}</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.78); margin-top: 2px;">Sektor: ${escapeHtml(comp.presetLabel || 'UMKM')} &bull; Periode: ${escapeHtml(comp.periodLabel)} &bull; Lokasi: ${escapeHtml(city)}</div>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 12px; color: #bae0cf;">
          LAMPIRAN KEUANGAN UMKM
        </div>
      </div>
      <div class="doc-sheet-body">
        <div style="font-family: var(--font-mono); font-size: 12px; color: #29735c; font-weight: 600; margin-bottom: 6px;">I. PENDAPATAN KOTOR (OMZET)</div>
        <div class="kv-row" style="border-color: #ececec;"><span>Penjualan Tunai Kasir</span><span class="num-mono">${formatRp(sum.cashRevenue)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Penjualan Non-Tunai (QRIS / Debit / Transfer)</span><span class="num-mono">${formatRp(sum.nonCashRevenue)}</span></div>
        <div class="kv-row" style="font-weight: 600; background: #f0f8f9; padding: 8px 10px;"><span>TOTAL PENDAPATAN KOTOR</span><span class="num-mono">${formatRp(sum.totalRevenue)}</span></div>

        <div style="font-family: var(--font-mono); font-size: 12px; color: #7b5953; font-weight: 600; margin-top: 16px; margin-bottom: 6px;">II. HARGA POKOK PENJUALAN (HPP)</div>
        <div class="kv-row" style="border-color: #ececec;"><span>Pembelian Barang Dagang / Bahan Baku Pokok</span><span class="num-mono">- ${formatRp(sum.hppCost)}</span></div>
        <div class="kv-row" style="font-weight: 600; background: #f0f8f9; padding: 8px 10px;"><span>LABA KOTOR USAHA (Margin ${sum.grossMarginPct.toFixed(1)}%)</span><span class="num-mono">${formatRp(sum.grossProfit)}</span></div>

        <div style="font-family: var(--font-mono); font-size: 12px; color: #7b5953; font-weight: 600; margin-top: 16px; margin-bottom: 6px;">III. BEBAN GAJI TIM &amp; OPERASIONAL</div>
        <div class="kv-row" style="border-color: #ececec;"><span>Beban Gaji, Tunjangan, Lembur &amp; THR (${comp.employees.length} Karyawan)</span><span class="num-mono">${formatRp(sum.payrollGrossTotal)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Beban Sewa Tempat Bulanan</span><span class="num-mono">${formatRp(sum.rentCost)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Listrik, Air &amp; Internet</span><span class="num-mono">${formatRp(sum.utilityCost)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Perlengkapan Habis Pakai &amp; Kemasan</span><span class="num-mono">${formatRp(sum.suppliesCost)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Transportasi, Bensin &amp; Pengiriman</span><span class="num-mono">${formatRp(sum.transportCost)}</span></div>
        <div class="kv-row" style="border-color: #ececec;"><span>Pemasaran &amp; Operasional Lainnya</span><span class="num-mono">${formatRp(sum.marketingCost + sum.otherCost)}</span></div>
        <div class="kv-row" style="font-weight: 600;"><span>TOTAL BEBAN GAJI &amp; OPERASIONAL</span><span class="num-mono">- ${formatRp(sum.totalOpex)}</span></div>

        <div style="margin-top: 18px; padding: 16px 18px; background-color: #f0f8f9; border-left: 4px solid #29735c;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px;">
            <span style="font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: #151515;">LABA BERSIH OPERASIONAL (Margin ${sum.netMarginPct.toFixed(1)}%)</span>
            <strong class="num-mono" style="font-size: 24px; color: #29735c;">${formatRp(sum.netProfit)}</strong>
          </div>
          <div style="margin-top: 4px; font-size: 13px; color: #424242;">Terbilang: <strong># ${escapeHtml(angkaKeTerbilang(sum.netProfit))} #</strong></div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dcdcdc; font-family: var(--font-mono); font-size: 12.5px; color: #151515;">
            Batas Aman Angsuran KUR Bank (30% Laba): <strong>${formatRp(sum.kurMaxInstallment)}/bln</strong> &nbsp;|&nbsp; Est. Plafon 36 Bln: <strong>${formatRp(sum.estimatedKurPlafon36m)}</strong>
          </div>
        </div>

        <div class="doc-sig-grid">
          <div style="font-size: 12.5px; color: #706f6f;">
            Laporan ini disusun berdasarkan catatan kas operasional dan rekapitulasi penggajian nyata usaha.
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; color: #424242;">${escapeHtml(city)}, ${escapeHtml(formatIndoDate(comp.payDate))}<br/>Pemilik / Penanggung Jawab Usaha,</div>
            <div style="height: 44px;"></div>
            <div style="font-weight: 600; color: #151515;">( ${escapeHtml(ownerName)} )</div>
          </div>
        </div>
      </div>
    `;
  }

  function syncQuickCalcFromPeriod() {
    if (!appState || !appState.currentPeriod) return;
    const comp = computeFullPeriod(appState.currentPeriod);
    const s = comp.summary;
    const elOmzet = document.getElementById('qc-omzet');
    const elHpp = document.getElementById('qc-hpp');
    const elPayroll = document.getElementById('qc-payroll');
    const elOpex = document.getElementById('qc-opex');
    if (elOmzet) elOmzet.value = s.totalRevenue;
    if (elHpp) elHpp.value = s.hppCost;
    if (elPayroll) elPayroll.value = s.payrollGrossTotal;
    if (elOpex) elOpex.value = s.nonPayrollOpex;
    updateQuickCalculator();
  }

  // Dashboard 30s Quick Calculator
  function updateQuickCalculator() {
    const omzet = Math.max(0, Number(document.getElementById('qc-omzet').value) || 0);
    const hpp = Math.max(0, Number(document.getElementById('qc-hpp').value) || 0);
    const payroll = Math.max(0, Number(document.getElementById('qc-payroll').value) || 0);
    const opex = Math.max(0, Number(document.getElementById('qc-opex').value) || 0);

    const gross = omzet - hpp;
    const grossPct = omzet > 0 ? (gross / omzet) * 100 : 0;
    const payPct = omzet > 0 ? (payroll / omzet) * 100 : 0;
    const net = gross - payroll - opex;
    const kur = net > 0 ? Math.round(net * 0.3) : 0;
    const plafon = estimateKurPlafon36Months(kur);

    document.getElementById('qc-res-gross').textContent = `${formatRp(gross)} (${grossPct.toFixed(1)}%)`;
    document.getElementById('qc-res-payratio').textContent = `${payPct.toFixed(1)}% (${payPct <= 28 ? 'Sehat' : 'Tinggi'})`;
    document.getElementById('qc-res-net').textContent = formatRp(net);
    document.getElementById('qc-res-kur').textContent = formatRp(kur) + ' / bln';
    document.getElementById('qc-res-plafon').textContent = formatRp(plafon);

    const box = document.getElementById('qc-verdict-box');
    if (net <= 0) {
      box.textContent =
        'Peringatan: Total HPP + Gaji + Operasional melebihi omzet. Klik "Kirim ke Wizard" untuk membedah pos kebocoran biaya.';
    } else if (payPct > 30) {
      box.textContent =
        `Catatan: Usaha masih untung ${formatRp(net)}, namun rasio gaji (${payPct.toFixed(1)}%) cukup tinggi. Evaluasi jam lembur dan target komisi tim.`;
    } else {
      box.textContent =
        `Sehat: Rasio gaji ${payPct.toFixed(1)}% terkendali dan laba bersih ${formatRp(net)} mendukung kapasitas angsuran KUR hingga ${formatRp(kur)}/bulan.`;
    }
  }

  // Standalone Tools (Kasbon & THR/Lembur)
  function updateKasbonTool() {
    const name = document.getElementById('ksb-name').value.trim() || 'Karyawan';
    const salary = Math.max(1, Number(document.getElementById('ksb-salary').value) || 0);
    const amount = Math.max(0, Number(document.getElementById('ksb-amount').value) || 0);
    const tenor = Math.max(1, Number(document.getElementById('ksb-tenor').value) || 1);

    const monthly = Math.round(amount / tenor);
    const ratio = (monthly / salary) * 100;
    const remain = salary - monthly;

    document.getElementById('ksb-monthly').textContent = formatRp(monthly) + ' / bln';
    document.getElementById('ksb-ratio').textContent = ratio.toFixed(1) + '% dari Gaji Pokok';
    document.getElementById('ksb-remain').textContent = formatRp(remain);

    const tag = document.getElementById('ksb-status-tag');
    if (ratio <= 20) {
      tag.className = 'tag tag-ok';
      tag.textContent = 'AMAN DISETUJUI (<= 20%)';
    } else if (ratio <= 30) {
      tag.className = 'tag tag-warn';
      tag.textContent = 'BATAS WASPADA (20-30%)';
    } else {
      tag.className = 'tag tag-warn';
      tag.textContent = 'RAWAN GAJI TIPIS (> 30%)';
    }

    const biz =
      (appState && (appState.currentPeriod.businessName || appState.profile.businessName)) || 'Usaha UMKM';
    document.getElementById('ksb-clause-box').value = [
      `BERITA ACARA PINJAMAN KASBON — ${biz.toUpperCase()}`,
      `Nama Karyawan: ${name}`,
      `Jumlah Kasbon Disetujui: ${formatRp(amount)} (${angkaKeTerbilang(amount)})`,
      `Skema Pelunasan: Potong gaji otomatis ${tenor}x sebesar ${formatRp(monthly)}/bulan.`,
      `Menyetujui pelunasan penuh dari hak gaji terakhir apabila berhenti bekerja sebelum cicilan selesai.`
    ].join('\n');
  }

  function updateThrLemburTool() {
    const salary = Math.max(0, Number(document.getElementById('tl-salary').value) || 0);
    const months = Math.max(0, Number(document.getElementById('tl-months').value) || 0);
    const wdHours = Math.max(0, Number(document.getElementById('tl-wd-ot').value) || 0);
    const holHours = Math.max(0, Number(document.getElementById('tl-hol-ot').value) || 0);

    const hourly = salary / 173;
    let wdMultiplierHours = 0;
    if (wdHours > 0) {
      const firstHour = Math.min(1, wdHours);
      const restHours = Math.max(0, wdHours - 1);
      wdMultiplierHours = firstHour * 1.5 + restHours * 2.0;
    }
    const wdRp = Math.round(hourly * wdMultiplierHours);
    const holRp = Math.round(hourly * 2.0 * holHours);

    let thrRp = 0;
    let thrLabel = 'Hak THR (Masa kerja < 1 bln)';
    if (months >= 12) {
      thrRp = salary;
      thrLabel = `Hak THR Penuh (Masa kerja ${months} bln >= 12 bln)`;
    } else if (months >= 1) {
      thrRp = Math.round((months / 12) * salary);
      thrLabel = `Hak THR Proporsional (${months}/12 x Gaji)`;
    }

    document.getElementById('tl-hourly').textContent = formatRp(Math.round(hourly)) + ' / jam';
    document.getElementById('tl-wd-rp').textContent = formatRp(wdRp);
    document.getElementById('tl-hol-rp').textContent = formatRp(holRp);
    document.getElementById('tl-thr-label').textContent = thrLabel;
    document.getElementById('tl-thr-rp').textContent = formatRp(thrRp);
    document.getElementById('tl-thr-terbilang').textContent =
      'Terbilang Hak THR: # ' + angkaKeTerbilang(thrRp) + ' #';
  }

  // Library 120 SOP & Modal
  function renderLibraryCatPills() {
    const wrap = document.getElementById('lib-cat-pills');
    const cats = ['Semua'].concat(window.GAJIKAS_CATEGORIES || []);
    wrap.innerHTML = '';
    cats.forEach((cat) => {
      const count =
        cat === 'Semua'
          ? window.GAJIKAS_LIBRARY.length
          : window.GAJIKAS_LIBRARY.filter((x) => x.category === cat).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-pill' + (activeLibCategory === cat ? ' active' : '');
      btn.textContent = `${cat} (${count})`;
      btn.addEventListener('click', () => {
        activeLibCategory = cat;
        renderLibraryCatPills();
        renderLibrary();
      });
      wrap.appendChild(btn);
    });
  }

  function createSopCardElement(item) {
    const isFav = appState.favorites.includes(item.id);
    const card = document.createElement('article');
    card.className = 'sop-card';
    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="eyebrow-mono">${escapeHtml(item.code)} &bull; ${escapeHtml(item.category)}</span>
          <button type="button" class="icon-btn ${isFav ? 'fav-active' : ''}" data-fav-btn="${item.id}" title="Simpan ke Favorit">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7"><path d="M5 3h10v14l-5-3.2L5 17V3z"/></svg>
          </button>
        </div>
        <h3 class="title-card" style="font-size: 16px;">${escapeHtml(item.title)}</h3>
        <p class="text-subtle" style="margin-top: 6px;">${escapeHtml(item.summary)}</p>
      </div>
      <div>
        <div style="padding: 8px 10px; background-color: var(--color-ice-panel); border: 1px solid var(--color-rule-gray); font-family: var(--font-mono); font-size: 11.5px; margin-bottom: 10px;">
          ${escapeHtml(item.formulaOrRule)}
        </div>
        <button type="button" class="btn btn-outline btn-sm btn-block" data-open-sop="${item.id}">
          Baca Aturan &amp; Salin Teks SOP
        </button>
      </div>
    `;

    card.querySelector(`[data-fav-btn="${item.id}"]`).addEventListener('click', () => {
      toggleFavorite(item.id);
    });
    card.querySelector(`[data-open-sop="${item.id}"]`).addEventListener('click', () => {
      openSopModal(item.id);
    });
    return card;
  }

  function renderLibrary() {
    const q = (document.getElementById('lib-search').value || '').trim().toLowerCase();
    const list = (window.GAJIKAS_LIBRARY || []).filter((item) => {
      const catMatch = activeLibCategory === 'Semua' || item.category === activeLibCategory;
      if (!catMatch) return false;
      if (!q) return true;
      const hay = `${item.code} ${item.category} ${item.title} ${item.summary} ${item.formulaOrRule} ${item.readyText}`.toLowerCase();
      return hay.includes(q);
    });

    document.getElementById('lib-count-info').textContent =
      `Menampilkan ${list.length} dari ${(window.GAJIKAS_LIBRARY || []).length} SOP & Rumus Keuangan UMKM`;
    const grid = document.getElementById('library-grid');
    grid.innerHTML = '';
    list.forEach((it) => grid.appendChild(createSopCardElement(it)));
  }

  function renderFavorites() {
    const favItems = (window.GAJIKAS_LIBRARY || []).filter((x) => appState.favorites.includes(x.id));
    const empty = document.getElementById('favorites-empty');
    const grid = document.getElementById('favorites-grid');
    grid.innerHTML = '';
    empty.style.display = favItems.length ? 'none' : 'block';
    favItems.forEach((it) => grid.appendChild(createSopCardElement(it)));
  }

  function toggleFavorite(sopId) {
    const idx = appState.favorites.indexOf(sopId);
    if (idx >= 0) {
      appState.favorites.splice(idx, 1);
      showToast('Dihapus dari daftar SOP Favorit.');
    } else {
      appState.favorites.push(sopId);
      showToast('Disimpan ke daftar SOP Favorit.');
    }
    saveState();
    renderAllCalculatedUI();
    if (activeNav === 'library') renderLibrary();
    if (activeNav === 'favorites') renderFavorites();
    if (activeSopModalId === sopId) syncModalFavBtn();
  }

  function syncModalFavBtn() {
    const btn = document.getElementById('btn-modal-fav');
    const isFav = appState.favorites.includes(activeSopModalId);
    btn.textContent = isFav ? 'Tersimpan di Favorit (Hapus)' : 'Simpan ke Favorit';
  }

  function openSopModal(sopId) {
    const item = (window.GAJIKAS_LIBRARY || []).find((x) => x.id === sopId);
    if (!item) return;
    activeSopModalId = item.id;
    document.getElementById('sop-modal-code').textContent = `${item.code} • ${item.category}`;
    document.getElementById('sop-modal-title').textContent = item.title;
    document.getElementById('sop-modal-summary').textContent = item.summary;
    document.getElementById('sop-modal-formula').textContent = item.formulaOrRule;
    document.getElementById('sop-modal-text').textContent = item.readyText;
    document.getElementById('sop-modal-tip').textContent = ' ' + item.tip;
    syncModalFavBtn();
    document.getElementById('sop-modal').classList.add('open');
  }

  function closeSopModal() {
    document.getElementById('sop-modal').classList.remove('open');
    activeSopModalId = null;
  }

  // History View
  function renderHistory() {
    const wrap = document.getElementById('history-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!appState.history.length) {
      wrap.innerHTML = `<div class="card-ice">Belum ada riwayat periode tersimpan. Di Langkah 3 Wizard, klik tombol <strong>Simpan Periode ke Riwayat Laporan</strong>.</div>`;
      return;
    }

    appState.history.forEach((per) => {
      const comp = computeFullPeriod(per);
      const s = comp.summary;
      const histOwner = per.ownerName || appState.profile.ownerName || 'Pemilik Usaha';
      const savedTimeStr = formatSavedTimestamp(per.savedAt);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="eyebrow-mono">${escapeHtml(comp.presetLabel || 'UMKM')} &bull; PERIODE ${escapeHtml(comp.periodLabel)}</div>
            <h3 class="title-section" style="margin-top: 4px;">${escapeHtml(comp.businessName)}</h3>
            <div class="text-subtle" style="margin-top: 3px; font-size: 12.5px;">
              Pemilik: <strong>${escapeHtml(histOwner)}</strong> &bull; Disimpan: <span class="num-mono" style="font-size: 12px;">${escapeHtml(savedTimeStr)}</span>
            </div>
            <div class="text-subtle" style="margin-top: 4px;">
              ${comp.employees.length} Karyawan &bull; Total Gaji: <strong class="num-mono">${formatRp(s.payrollGrossTotal)}</strong> &bull; Laba Bersih: <strong class="num-mono" style="color: var(--color-network-green);">${formatRp(s.netProfit)}</strong> &bull; Aman KUR: <strong class="num-mono">${formatRp(s.kurMaxInstallment)}/bln</strong>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="btn btn-primary btn-sm" data-hist-open="${per.id}">Buka di Wizard</button>
            <button type="button" class="btn btn-outline btn-sm" data-hist-slip="${per.id}">PDF Slip</button>
            <button type="button" class="btn btn-outline btn-sm" data-hist-pl="${per.id}">PDF Laba-Rugi</button>
            <button type="button" class="btn btn-subtle btn-sm" data-hist-del="${per.id}">Hapus</button>
          </div>
        </div>
      `;

      card.querySelector(`[data-hist-open="${per.id}"]`).addEventListener('click', () => {
        appState.currentPeriod = cloneDeep(per);
        appState.currentPeriod.ownerName = histOwner;
        activeEmpId = appState.currentPeriod.employees[0] ? appState.currentPeriod.employees[0].id : null;
        syncPeriodMetaInputs();
        syncCashflowInputs();
        populateEmployeeEditor();
        renderPresetButtons();
        syncQuickCalcFromPeriod();
        renderAllCalculatedUI();
        saveState();
        switchView('wizard');
        switchWizardStep(1);
        showToast('Periode "' + per.periodLabel + '" dibuka kembali di Wizard.');
      });

      card.querySelector(`[data-hist-slip="${per.id}"]`).addEventListener('click', () => {
        if (!comp.employees.length) {
          showToast('Daftar karyawan pada laporan ini kosong.');
          return;
        }
        window.GajiKasExporter.exportPayslipPdf(
          comp,
          { ...appState.profile, ownerName: histOwner, businessName: comp.businessName, city: comp.city },
          'all'
        );
      });

      card.querySelector(`[data-hist-pl="${per.id}"]`).addEventListener('click', () => {
        if (!comp.employees.length) {
          showToast('Daftar karyawan pada laporan ini kosong.');
          return;
        }
        window.GajiKasExporter.exportProfitLossPdf(comp, {
          ...appState.profile,
          ownerName: histOwner,
          businessName: comp.businessName,
          city: comp.city
        });
      });

      card.querySelector(`[data-hist-del="${per.id}"]`).addEventListener('click', () => {
        appState.history = appState.history.filter((x) => x.id !== per.id);
        saveState();
        renderHistory();
        renderAllCalculatedUI();
        showToast('Laporan dihapus dari riwayat.');
      });

      wrap.appendChild(card);
    });
  }

  function populateSettingsForm() {
    if (!appState || !appState.profile) return;
    document.getElementById('set-owner').value = appState.profile.ownerName || '';
    document.getElementById('set-biz').value = appState.profile.businessName || '';
    document.getElementById('set-city').value = appState.profile.city || '';
    document.getElementById('set-email').value = appState.profile.email || '';
  }

  function renderAll() {
    renderPresetButtons();
    syncPeriodMetaInputs();
    syncCashflowInputs();
    populateEmployeeEditor();
    populateSettingsForm();
    renderLibraryCatPills();
    renderLibrary();
    renderFavorites();
    renderHistory();
    syncQuickCalcFromPeriod();
    updateKasbonTool();
    updateThrLemburTool();
    renderAllCalculatedUI();
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg);
    }
  }

  // Unlock App Workspace
  function unlockWorkspace(validSession, isFreshLogin = false) {
    session = validSession;
    let loaded = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.state);
      if (raw) loaded = JSON.parse(raw);
    } catch (_e) {}

    if (loaded && loaded.currentPeriod && Array.isArray(loaded.currentPeriod.employees)) {
      appState = loaded;
      appState.profile = appState.profile || {
        ownerName: 'Pemilik Usaha',
        businessName: loaded.currentPeriod.businessName || 'Usaha UMKM',
        city: loaded.currentPeriod.city || 'Indonesia',
        email: ''
      };
      appState.history = Array.isArray(appState.history) ? appState.history : [];
      appState.favorites = Array.isArray(appState.favorites) ? appState.favorites : [];

      const prevOwner = appState.profile.ownerName || '';
      const prevBiz = appState.profile.businessName || '';
      const prevEmail = appState.profile.email || '';
      const identityChanged =
        isFreshLogin ||
        (validSession.ownerName && validSession.ownerName !== prevOwner) ||
        (validSession.businessName && validSession.businessName !== prevBiz) ||
        (validSession.email && validSession.email !== prevEmail);

      if (validSession.ownerName) appState.profile.ownerName = validSession.ownerName;
      if (validSession.businessName) appState.profile.businessName = validSession.businessName;
      if (validSession.email) appState.profile.email = validSession.email;

      if (identityChanged) {
        if (validSession.businessName) {
          appState.currentPeriod.businessName = validSession.businessName;
        }
        if (validSession.ownerName) {
          appState.currentPeriod.ownerName = validSession.ownerName;
        }
        saveState();
      } else if (!appState.currentPeriod.ownerName) {
        appState.currentPeriod.ownerName = appState.profile.ownerName || 'Pemilik Usaha';
      }
    } else {
      appState = buildDefaultState(validSession);
      saveState();
    }

    activeEmpId = appState.currentPeriod.employees[0] ? appState.currentPeriod.employees[0].id : null;

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'grid';

    renderAll();

    if (isFreshLogin) {
      switchView('dashboard');
      activateWizardDomStep(1);
    }
  }

  function handleLogout() {
    session = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.session);
    } catch (_e) {}
    closeMobileDrawer();
    document.getElementById('app-shell').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-owner').value = '';
    document.getElementById('login-business').value = '';
    document.getElementById('login-email').value = '';
    document.getElementById('login-code').value = '';
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.style.display = 'none';
    }
  }

  function adjustPeriodPayrollToTarget(targetPayroll) {
    const cleanTarget = Math.max(0, Math.round(Number(targetPayroll) || 0));
    const emps = appState.currentPeriod.employees || [];
    if (!emps.length && cleanTarget > 0) {
      const created = {
        id: 'emp-' + Date.now(),
        name: 'Staf Operasional 1',
        role: 'Staf Operasional',
        tenureMonths: 12,
        daysPresent: 26,
        baseSalary: cleanTarget,
        dailyAllowanceRate: 0,
        overtimeHours: 0,
        overtimeMethod: 'depnaker',
        overtimeRate: 20000,
        bonus: 0,
        includeThr: false,
        kasbonCut: 0,
        lateCut: 0,
        bpjsCut: 0
      };
      appState.currentPeriod.employees = [created];
      activeEmpId = created.id;
      return true;
    }

    const beforeComp = computeFullPeriod(appState.currentPeriod);
    const curTotal = beforeComp.summary.payrollGrossTotal;
    if (curTotal === cleanTarget) return false;

    if (!emps.length) return false;

    if (cleanTarget === 0) {
      emps.forEach((raw) => {
        raw.baseSalary = 0;
        raw.dailyAllowanceRate = 0;
        raw.overtimeHours = 0;
        raw.bonus = 0;
        raw.includeThr = false;
      });
      return true;
    }

    const weights = beforeComp.employees.map((ce) => (curTotal > 0 ? ce.grossPay / curTotal : 1 / emps.length));
    let runningSum = 0;
    const targetPerEmp = emps.map((_, idx) => {
      if (idx === emps.length - 1) return Math.max(0, cleanTarget - runningSum);
      const share = Math.round(cleanTarget * weights[idx]);
      runningSum += share;
      return share;
    });

    emps.forEach((raw, idx) => {
      const empTarget = targetPerEmp[idx];
      let ce = computeEmployee(raw);
      let fixedAdd =
        ce.allowanceTotal + (ce.overtimeMethod === 'flat' ? ce.overtimeTotal : 0) + ce.bonus;

      if (empTarget < fixedAdd) {
        raw.bonus = 0;
        raw.overtimeHours = 0;
        if (ce.daysPresent > 0) {
          raw.dailyAllowanceRate = Math.min(
            Number(raw.dailyAllowanceRate) || 0,
            Math.floor((empTarget * 0.25) / ce.daysPresent)
          );
        } else {
          raw.dailyAllowanceRate = 0;
        }
        ce = computeEmployee(raw);
        fixedAdd =
          ce.allowanceTotal + (ce.overtimeMethod === 'flat' ? ce.overtimeTotal : 0) + ce.bonus;
      }

      const remForBase = Math.max(0, empTarget - fixedAdd);
      const otFactor = ce.overtimeMethod === 'depnaker' ? ce.overtimeHours / 173 : 0;
      const thrFactor = ce.includeThr
        ? ce.tenureMonths >= 12
          ? 1
          : ce.tenureMonths >= 1
            ? ce.tenureMonths / 12
            : 0
        : 0;
      const mult = 1 + otFactor + thrFactor;
      const approxBase = Math.max(0, Math.round(remForBase / mult));
      raw.baseSalary = approxBase;

      let bestBase = approxBase;
      let bestDiff = empTarget - computeEmployee(raw).grossPay;
      for (let delta = -6; delta <= 6; delta++) {
        const cand = Math.max(0, approxBase + delta);
        raw.baseSalary = cand;
        const diff = empTarget - computeEmployee(raw).grossPay;
        if (diff === 0) {
          bestBase = cand;
          bestDiff = 0;
          break;
        }
        if (diff > 0 && (bestDiff <= 0 || diff < bestDiff)) {
          bestBase = cand;
          bestDiff = diff;
        }
      }
      raw.baseSalary = bestBase;
      const residual = empTarget - computeEmployee(raw).grossPay;
      if (residual !== 0) {
        if (residual < 0 && raw.baseSalary > 0) {
          raw.baseSalary = Math.max(0, raw.baseSalary - 1);
        }
        const rem2 = empTarget - computeEmployee(raw).grossPay;
        if (rem2 > 0) {
          raw.bonus = Math.max(0, (Number(raw.bonus) || 0) + rem2);
        }
      }
    });

    return true;
  }

  // Event Listeners Initialization
  function bindEvents() {
    // 1. Auth Form Submit
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      errEl.style.display = 'none';

      const rawOwner = document.getElementById('login-owner').value.trim();
      const rawBiz = document.getElementById('login-business').value.trim();
      const rawEmail = document.getElementById('login-email').value.trim();
      const rawCode = document.getElementById('login-code').value.trim();

      if (!rawCode) {
        errEl.textContent = 'Masukkan Kode Akses Lisensi terlebih dahulu.';
        errEl.style.display = 'block';
        return;
      }

      const hExact = sha256Hex(LICENSE_SALT + rawCode);
      const hUpper = sha256Hex(LICENSE_SALT + rawCode.toUpperCase());
      const roleExact = classifyLicenseHash(hExact);
      const roleUpper = classifyLicenseHash(hUpper);
      const role = roleExact || roleUpper;
      const matchedHash = roleExact ? hExact : hUpper;

      if (!role) {
        errEl.textContent = 'Kode Akses tidak valid. Periksa kembali kode di email bukti pembelian resmi Anda.';
        errEl.style.display = 'block';
        return;
      }

      let finalOwner = rawOwner;
      let finalBiz = rawBiz;
      let finalEmail = rawEmail;

      if (role === 'creator') {
        finalOwner = rawOwner || 'Nifari (Kreator Utama)';
        finalBiz = rawBiz || 'Nifari Studio (Owner)';
        finalEmail = rawEmail || 'creator@nifari.id';
      } else if (role === 'dev') {
        finalOwner = rawOwner || 'Tim Developer';
        finalBiz = rawBiz || 'Studio GajiKas';
        finalEmail = rawEmail || 'dev@gajikas.id';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rawOwner || !rawBiz || !emailRegex.test(rawEmail)) {
          errEl.textContent = 'Harap lengkapi Nama Pemilik, Nama Usaha, dan alamat Email yang valid.';
          errEl.style.display = 'block';
          return;
        }
      }

      const newSession = {
        ownerName: finalOwner,
        businessName: finalBiz,
        email: finalEmail,
        validHash: matchedHash
      };

      try {
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(newSession));
      } catch (_e) {}

      unlockWorkspace(newSession, true);
    });

    // 2. Navigation Links & Stat Cards
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.getAttribute('data-nav')));
    });

    document.querySelectorAll('[data-nav-jump]').forEach((card) => {
      card.addEventListener('click', () => switchView(card.getAttribute('data-nav-jump')));
    });

    document.querySelectorAll('[data-goto-wizard]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchView('wizard');
        switchWizardStep(Number(btn.getAttribute('data-goto-wizard')) || 1);
      });
    });

    // Mobile Drawer
    document.getElementById('btn-open-drawer').addEventListener('click', openMobileDrawer);
    document.getElementById('btn-mob-more').addEventListener('click', openMobileDrawer);
    document.getElementById('btn-close-drawer').addEventListener('click', closeMobileDrawer);
    document.getElementById('drawer-backdrop').addEventListener('click', closeMobileDrawer);

    // Theme Toggle & Logout
    document.getElementById('btn-theme-toggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('btn-logout-sidebar').addEventListener('click', handleLogout);
    document.getElementById('btn-logout-drawer').addEventListener('click', handleLogout);

    // Quick Calculator
    ['qc-omzet', 'qc-hpp', 'qc-payroll', 'qc-opex'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateQuickCalculator);
    });

    document.getElementById('btn-send-to-wizard').addEventListener('click', () => {
      const omzet = Math.max(0, Math.round(Number(document.getElementById('qc-omzet').value) || 0));
      const hpp = Math.max(0, Math.round(Number(document.getElementById('qc-hpp').value) || 0));
      const payroll = Math.max(0, Math.round(Number(document.getElementById('qc-payroll').value) || 0));
      const opex = Math.max(0, Math.round(Number(document.getElementById('qc-opex').value) || 0));

      appState.currentPeriod.cashflow.cashRevenue = Math.round(omzet * 0.6);
      appState.currentPeriod.cashflow.nonCashRevenue = omzet - Math.round(omzet * 0.6);
      appState.currentPeriod.cashflow.hppCost = hpp;
      appState.currentPeriod.cashflow.rentCost = Math.round(opex * 0.45);
      appState.currentPeriod.cashflow.utilityCost = Math.round(opex * 0.25);
      appState.currentPeriod.cashflow.suppliesCost = Math.round(opex * 0.15);
      appState.currentPeriod.cashflow.transportCost =
        opex - Math.round(opex * 0.45) - Math.round(opex * 0.25) - Math.round(opex * 0.15);
      appState.currentPeriod.cashflow.marketingCost = 0;
      appState.currentPeriod.cashflow.otherCost = 0;

      const payrollAdjusted = adjustPeriodPayrollToTarget(payroll);

      syncCashflowInputs();
      populateEmployeeEditor();
      renderAllCalculatedUI();
      saveState();
      switchView('wizard');
      const advanced = switchWizardStep(2);
      if (advanced) {
        showToast(
          payrollAdjusted
            ? `Angka Kalkulator Cepat dikirim ke Wizard (beban gaji tim disesuaikan ke ${formatRp(payroll)}).`
            : 'Angka Kalkulator Cepat berhasil dikirim ke Buku Kas Wizard.'
        );
      }
    });

    // Wizard Steps Navigation
    document.querySelectorAll('.step-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchWizardStep(Number(tab.getAttribute('data-wiz-step'))));
    });
    document.querySelectorAll('[data-wiz-goto]').forEach((btn) => {
      btn.addEventListener('click', () => switchWizardStep(Number(btn.getAttribute('data-wiz-goto'))));
    });

    // Step 1 Period Meta Inputs
    const metaMap = [
      ['wiz-biz-name', 'businessName'],
      ['wiz-period-label', 'periodLabel'],
      ['wiz-pay-date', 'payDate'],
      ['wiz-city', 'city']
    ];
    metaMap.forEach(([id, key]) => {
      document.getElementById(id).addEventListener('input', (ev) => {
        appState.currentPeriod[key] = ev.target.value;
        renderAllCalculatedUI();
        saveState();
      });
    });

    // Add Employee
    document.getElementById('btn-add-employee').addEventListener('click', () => {
      const newEmp = {
        id: 'emp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: 'Staf Baru ' + (appState.currentPeriod.employees.length + 1),
        role: 'Staf Operasional',
        tenureMonths: 6,
        daysPresent: 26,
        baseSalary: 2200000,
        dailyAllowanceRate: 20000,
        overtimeHours: 0,
        overtimeMethod: 'depnaker',
        overtimeRate: 20000,
        bonus: 0,
        includeThr: false,
        kasbonCut: 0,
        lateCut: 0,
        bpjsCut: 44000
      };
      appState.currentPeriod.employees.push(newEmp);
      activeEmpId = newEmp.id;
      populateEmployeeEditor();
      renderAllCalculatedUI();
      saveState();
      document.getElementById('emp-name').focus();
      showToast('Baris karyawan baru ditambahkan.');
    });

    // Active Employee Editor Bindings
    function updateActiveEmpFromEditor() {
      const raw = getActiveEmployeeRaw();
      if (!raw) return;
      raw.name = document.getElementById('emp-name').value;
      raw.role = document.getElementById('emp-role').value;
      raw.tenureMonths = Number(document.getElementById('emp-tenure').value) || 0;
      raw.daysPresent = Number(document.getElementById('emp-days').value) || 0;
      raw.baseSalary = Number(document.getElementById('emp-base').value) || 0;
      raw.dailyAllowanceRate = Number(document.getElementById('emp-allowance').value) || 0;
      raw.overtimeHours = Number(document.getElementById('emp-ot-hours').value) || 0;
      if (raw.overtimeMethod === 'flat') {
        raw.overtimeRate = Number(document.getElementById('emp-ot-rate').value) || 0;
      }
      raw.bonus = Number(document.getElementById('emp-bonus').value) || 0;
      raw.includeThr = document.getElementById('emp-thr-toggle').checked;
      raw.kasbonCut = Number(document.getElementById('emp-kasbon').value) || 0;
      raw.lateCut = Number(document.getElementById('emp-late').value) || 0;
      raw.bpjsCut = Number(document.getElementById('emp-bpjs').value) || 0;

      if (raw.overtimeMethod !== 'flat') {
        updateOvertimeRateVisibility();
      }
      renderAllCalculatedUI();
      saveState();
    }

    document.getElementById('emp-ot-method').addEventListener('change', (ev) => {
      const raw = getActiveEmployeeRaw();
      if (!raw) return;
      const nextMethod = ev.target.value === 'flat' ? 'flat' : 'depnaker';
      raw.overtimeMethod = nextMethod;
      const rateInput = document.getElementById('emp-ot-rate');
      if (nextMethod === 'flat') {
        const savedFlat = Number(raw.overtimeRate) > 0 ? Math.round(Number(raw.overtimeRate)) : 20000;
        raw.overtimeRate = savedFlat;
        rateInput.value = savedFlat;
        rateInput.disabled = false;
      } else {
        updateOvertimeRateVisibility();
      }
      renderAllCalculatedUI();
      saveState();
    });

    [
      'emp-name',
      'emp-role',
      'emp-tenure',
      'emp-days',
      'emp-base',
      'emp-allowance',
      'emp-ot-hours',
      'emp-ot-rate',
      'emp-bonus',
      'emp-thr-toggle',
      'emp-kasbon',
      'emp-late',
      'emp-bpjs'
    ].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('input', updateActiveEmpFromEditor);
      el.addEventListener('change', updateActiveEmpFromEditor);
    });

    // Step 2 Cashflow Inputs
    const cfMap = [
      ['cf-cash', 'cashRevenue'],
      ['cf-noncash', 'nonCashRevenue'],
      ['cf-hpp', 'hppCost'],
      ['cf-rent', 'rentCost'],
      ['cf-utility', 'utilityCost'],
      ['cf-supplies', 'suppliesCost'],
      ['cf-transport', 'transportCost'],
      ['cf-marketing', 'marketingCost'],
      ['cf-other', 'otherCost']
    ];
    cfMap.forEach(([id, key]) => {
      document.getElementById(id).addEventListener('input', (ev) => {
        appState.currentPeriod.cashflow[key] = Number(ev.target.value) || 0;
        renderAllCalculatedUI();
        saveState();
      });
    });

    // Step 3 Preview Tabs & Employee Select (picker remains visible on both tabs)
    document.querySelectorAll('[data-prev-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePreviewMode = btn.getAttribute('data-prev-mode');
        const isSlip = activePreviewMode === 'slip';
        document.getElementById('preview-pane-slip').style.display = isSlip ? 'block' : 'none';
        document.getElementById('preview-pane-pl').style.display = isSlip ? 'none' : 'block';
        document.getElementById('preview-emp-picker-wrap').style.display = 'flex';
        const pickerLbl = document.getElementById('preview-emp-picker-label');
        if (pickerLbl) {
          pickerLbl.textContent = isSlip
            ? 'Karyawan Terpilih (Slip & WA PNG):'
            : 'Karyawan untuk Ekspor WA / Slip:';
        }

        document.getElementById('tab-prev-slip').className = isSlip ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
        document.getElementById('tab-prev-pl').className = !isSlip ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
      });
    });

    document.getElementById('preview-emp-select').addEventListener('change', (ev) => {
      if (ev.target.value) {
        activeEmpId = ev.target.value;
        populateEmployeeEditor();
      }
      renderStep3Previews(computeFullPeriod(appState.currentPeriod));
    });

    // Step 3: 4 Genuine File Exports + Save History
    function buildExportBusinessInfo(comp) {
      return {
        ...appState.profile,
        ownerName: comp.ownerName || appState.profile.ownerName || 'Pemilik Usaha',
        businessName: comp.businessName || appState.profile.businessName || 'Usaha UMKM',
        city: comp.city || appState.profile.city || 'Indonesia'
      };
    }

    document.getElementById('btn-export-slip-pdf').addEventListener('click', () => {
      const comp = computeFullPeriod(appState.currentPeriod);
      if (!comp.employees.length) {
        showToast('Daftar karyawan masih kosong. Tambahkan minimal 1 karyawan terlebih dahulu.');
        return;
      }
      const scope = document.getElementById('pdf-slip-scope').value;
      const targetId = scope === 'selected' ? document.getElementById('preview-emp-select').value : 'all';
      window.GajiKasExporter.exportPayslipPdf(comp, buildExportBusinessInfo(comp), targetId);
      showToast('Slip Gaji Resmi (.PDF A4) berhasil diunduh.');
    });

    document.getElementById('btn-export-pl-pdf').addEventListener('click', () => {
      const comp = computeFullPeriod(appState.currentPeriod);
      if (!comp.employees.length) {
        showToast('Daftar karyawan masih kosong. Tambahkan minimal 1 karyawan terlebih dahulu.');
        return;
      }
      window.GajiKasExporter.exportProfitLossPdf(comp, buildExportBusinessInfo(comp));
      showToast('Laporan Laba-Rugi KUR (.PDF A4) berhasil diunduh.');
    });

    document.getElementById('btn-export-wa-png').addEventListener('click', async () => {
      const comp = computeFullPeriod(appState.currentPeriod);
      if (!comp.employees.length) {
        showToast('Daftar karyawan masih kosong. Tambahkan minimal 1 karyawan terlebih dahulu.');
        return;
      }
      const selId = document.getElementById('preview-emp-select').value;
      const emp = comp.employees.find((e) => e.id === selId) || comp.employees[0];
      if (!emp) return;
      await window.GajiKasExporter.exportPayslipWaPng(emp, comp, buildExportBusinessInfo(comp));
      showToast('Kartu Slip Gaji WA (.PNG) berhasil diunduh.');
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      const comp = computeFullPeriod(appState.currentPeriod);
      if (!comp.employees.length) {
        showToast('Daftar karyawan masih kosong. Tambahkan minimal 1 karyawan terlebih dahulu.');
        return;
      }
      window.GajiKasExporter.exportPayrollAndPlCsv(comp, buildExportBusinessInfo(comp));
      showToast('Rekap Gaji & Laba-Rugi (.CSV Excel) berhasil diunduh.');
    });

    document.getElementById('btn-save-period').addEventListener('click', () => {
      const snap = cloneDeep(appState.currentPeriod);
      snap.ownerName = snap.ownerName || appState.profile.ownerName || 'Pemilik Usaha';
      snap.businessName = String(snap.businessName || appState.profile.businessName || 'Usaha UMKM').trim();
      snap.periodLabel = String(snap.periodLabel || '-').trim();
      snap.savedAt = new Date().toISOString();

      const norm = (s) => String(s || '').trim().toLowerCase();
      const existingIdx = appState.history.findIndex(
        (h) => norm(h.businessName) === norm(snap.businessName) && norm(h.periodLabel) === norm(snap.periodLabel)
      );

      let wasUpdated = false;
      if (existingIdx >= 0) {
        snap.id = appState.history[existingIdx].id || 'hist-' + Date.now();
        appState.history.splice(existingIdx, 1);
        wasUpdated = true;
      } else {
        snap.id = 'hist-' + Date.now();
      }
      appState.history.unshift(snap);
      saveState();
      renderHistory();
      renderAllCalculatedUI();
      showToast(
        wasUpdated
          ? 'Laporan periode "' + snap.periodLabel + '" (' + snap.businessName + ') diperbarui di Riwayat Laporan.'
          : 'Periode "' + snap.periodLabel + '" disimpan ke Riwayat Laporan.'
      );
    });

    // Standalone Tools Events
    ['ksb-name', 'ksb-salary', 'ksb-amount', 'ksb-tenor'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateKasbonTool);
      document.getElementById(id).addEventListener('change', updateKasbonTool);
    });
    document.getElementById('btn-copy-ksb').addEventListener('click', () => {
      copyText(document.getElementById('ksb-clause-box').value, 'Teks Berita Acara Kasbon disalin.');
    });

    ['tl-salary', 'tl-months', 'tl-wd-ot', 'tl-hol-ot'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateThrLemburTool);
    });

    // Library Search & Modal
    document.getElementById('lib-search').addEventListener('input', renderLibrary);
    document.getElementById('btn-close-sop-modal').addEventListener('click', closeSopModal);
    document.getElementById('sop-modal').addEventListener('click', (ev) => {
      if (ev.target.id === 'sop-modal') closeSopModal();
    });
    document.getElementById('btn-modal-fav').addEventListener('click', () => {
      if (activeSopModalId) toggleFavorite(activeSopModalId);
    });
    document.getElementById('btn-modal-copy').addEventListener('click', () => {
      copyText(document.getElementById('sop-modal-text').textContent, 'Teks aturan SOP berhasil disalin.');
    });

    // History Clear All
    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (!appState.history.length) return;
      if (window.confirm('Yakin ingin menghapus seluruh arsip Riwayat Laporan di perangkat ini?')) {
        appState.history = [];
        saveState();
        renderHistory();
        renderAllCalculatedUI();
        showToast('Seluruh riwayat laporan dibersihkan.');
      }
    });

    // Settings Form & Backup/Restore JSON
    document.getElementById('settings-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      appState.profile.ownerName = document.getElementById('set-owner').value.trim() || 'Pemilik Usaha';
      appState.profile.businessName = document.getElementById('set-biz').value.trim() || 'Usaha UMKM';
      appState.profile.city = document.getElementById('set-city').value.trim() || 'Indonesia';
      appState.profile.email = document.getElementById('set-email').value.trim();
      appState.currentPeriod.ownerName = appState.profile.ownerName;
      appState.currentPeriod.businessName = appState.profile.businessName;
      appState.currentPeriod.city = appState.profile.city;

      if (session) {
        session.ownerName = appState.profile.ownerName;
        session.businessName = appState.profile.businessName;
        session.email = appState.profile.email;
        try {
          localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
        } catch (_e) {}
      }

      renderAll();
      saveState();
      showToast('Profil usaha berhasil diperbarui.');
    });

    document.getElementById('btn-backup-json').addEventListener('click', () => {
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), app: 'GajiKas Studio', data: appState }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cadangan-GajiKas-Studio.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showToast('File cadangan .JSON berhasil diunduh.');
    });

    document.getElementById('input-restore-json').addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          const restored = parsed.data && parsed.data.currentPeriod ? parsed.data : parsed;
          if (!restored || !restored.currentPeriod || !Array.isArray(restored.currentPeriod.employees)) {
            showToast('Format file cadangan tidak sesuai.');
            return;
          }
          appState = restored;
          appState.profile = appState.profile || {
            ownerName: restored.currentPeriod.ownerName || 'Pemilik Usaha',
            businessName: restored.currentPeriod.businessName || 'Usaha UMKM',
            city: restored.currentPeriod.city || 'Indonesia',
            email: ''
          };
          appState.history = Array.isArray(appState.history) ? appState.history : [];
          appState.favorites = Array.isArray(appState.favorites) ? appState.favorites : [];
          if (!appState.currentPeriod.ownerName) {
            appState.currentPeriod.ownerName = appState.profile.ownerName || 'Pemilik Usaha';
          }
          activeEmpId = appState.currentPeriod.employees[0] ? appState.currentPeriod.employees[0].id : null;
          renderAll();
          saveState();
          showToast('Data usaha & riwayat berhasil dipulihkan.');
        } catch (_err) {
          showToast('Gagal membaca file JSON.');
        }
      };
      reader.readAsText(file);
      ev.target.value = '';
    });

    // Global Escape Key for Modal & Drawer
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        closeSopModal();
        closeMobileDrawer();
      }
    });
  }

  // Boot App & Re-validate Session Hash
  function boot() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (savedTheme === 'dark' || savedTheme === 'light') applyTheme(savedTheme);
    } catch (_e) {}

    bindEvents();

    try {
      const rawSession = localStorage.getItem(STORAGE_KEYS.session);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && classifyLicenseHash(parsed.validHash)) {
          unlockWorkspace(parsed, false);
          return;
        }
      }
    } catch (_e) {}

    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

// BerkasSah Studio — Mesin Perakit Surat Perjanjian, Jadwal Termin, BAST & Kwitansi (100% Mandiri, Nol AI, Nol Emoji)
(function () {
  const LICENSE_SALT = 'nifari-lic-2026::';
  const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
  const DEV_AGENT_HASHES = new Set([
    '47d0f9e66acc0714730c396f5a6ee5fa40d8c44f7f9b0b7d4f0c1c76f9563c23',
    '11d421b99814eafc4bedf4df321d57470bef9d977187c341770c2fd1e9911403',
    'a06a4d939a66996483c8aaae1b38ffdb9fbdfb2d98bfa571a1460cfd1190908a',
    'c6aa1f040d47b2e2d70ef8e81844a62ee0326051135a15fd26bb7c6ae506292b',
    '3714f9782b25bf3e0e00b653208fc0107ecd7e239cfa0c164ee69289ccc8e905'
  ]);
  const OFFICIAL_BUYER_HASH = 'bb2bf39c6ee093f679a9d986e0b905b8a85369964f2b0f2e86c15821d9234329';

  const STORAGE_KEYS = {
    session: 'berkassah_session_v1',
    state: 'berkassah_state_v1',
    theme: 'berkassah_theme_v1'
  };

  function sha256Hex(asciiOrUtf8) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const bytes = [];
    const str = String(asciiOrUtf8 || '');
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 0x80) bytes.push(code);
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        i++;
        code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
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
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
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
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (hh + S1 + ch + k[i] + w[i]) >>> 0;
        const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
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

  function cloneDeep(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const formatRp = window.BerkasExporter.formatRp;
  const angkaKeTerbilang = window.BerkasExporter.angkaKeTerbilang;
  const formatLegalIndoDate = window.BerkasExporter.formatLegalIndoDate;

  const DATA = window.BERKAS_DATA || { PROTECTIVE_CLAUSES: [], PRESETS: [], CATEGORIES: [], LIBRARY_ITEMS: [] };
  const initialPreset = DATA.PRESETS[0];

  function createDraftFromPreset(preset, profileInfo = {}) {
    return {
      presetId: preset.id,
      presetName: preset.name,
      docHeading: preset.docHeading,
      signCity: profileInfo.defaultCity || preset.signCity || 'Jakarta',
      courtCity: profileInfo.defaultCity || preset.courtCity || 'Jakarta',
      signDate: preset.signDate || '2026-10-30',
      p1Name: profileInfo.userName || 'Budi Hartono',
      p1Nik: profileInfo.defaultNik || '3273011805860002',
      p1Phone: '0812-8800-4411',
      p1Role: preset.party1Role || 'Pihak Pertama',
      p1Address: 'Jl. Cempaka Putih No. 12, ' + (profileInfo.defaultCity || preset.signCity || 'Bandung'),
      p2Name: 'Dimas Saputra',
      p2Nik: '3273052209910004',
      p2Phone: '0813-9922-7788',
      p2Role: preset.party2Role || 'Pihak Kedua',
      p2Address: 'Jl. Melati Indah Blok B4 No. 9, ' + (preset.signCity || 'Bandung'),
      objectTitle: preset.objectTitle,
      contractValue: preset.contractValue,
      depositValue: preset.depositValue,
      lateFeePerDay: preset.lateFeePerDay,
      durationText: preset.durationText,
      terminCount: preset.terminCount,
      collateralDesc: preset.collateralDesc,
      witness1: preset.witness1,
      witness2: preset.witness2,
      handoverItems: preset.handoverItems,
      coreScopeText: preset.coreScopeText,
      activeClauses: cloneDeep(preset.activeClauses || []),
      customExtraClause: ''
    };
  }

  let session = null;
  let activeStep = 1;
  let activePreviewMode = 'contract';
  let activeLibCat = 'all';
  let favOnly = false;
  let currentModalItem = null;

  let appState = {
    draft: createDraftFromPreset(initialPreset),
    savedDocs: [],
    favoriteIds: ['kls-001', 'kls-021'],
    exportCount: 0,
    profile: {
      userName: '',
      orgName: '',
      defaultNik: '3273011805860002',
      defaultCity: 'Bandung'
    }
  };

  function showToast(msg) {
    const el = document.getElementById('toast-pill');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function loadPersisted() {
    try {
      const th = localStorage.getItem(STORAGE_KEYS.theme);
      if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th);

      const rawSt = localStorage.getItem(STORAGE_KEYS.state);
      if (rawSt) {
        const p = JSON.parse(rawSt);
        if (p && typeof p === 'object') {
          if (p.draft && p.draft.docHeading) appState.draft = p.draft;
          if (Array.isArray(p.savedDocs)) appState.savedDocs = p.savedDocs;
          if (Array.isArray(p.favoriteIds)) appState.favoriteIds = p.favoriteIds;
          if (typeof p.exportCount === 'number') appState.exportCount = p.exportCount;
          if (p.profile) appState.profile = Object.assign({}, appState.profile, p.profile);
        }
      }

      const rawSes = localStorage.getItem(STORAGE_KEYS.session);
      if (rawSes) {
        const s = JSON.parse(rawSes);
        if (s && classifyLicenseHash(s.licenseHash)) {
          session = s;
          if (!appState.profile.userName) appState.profile.userName = s.userName;
          if (!appState.profile.orgName) appState.profile.orgName = s.orgName;
        }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(appState));
    } catch (e) {}
  }

  // ASSEMBLE FULL DOCUMENT MODEL, SCHEDULE & 8-POINT AUDIT
  function buildDocumentModel(draft) {
    const contractValue = Math.max(0, Number(draft.contractValue) || 0);
    const depositValue = Math.max(0, Number(draft.depositValue) || 0);
    const lateFeePerDay = Math.max(0, Number(draft.lateFeePerDay) || 0);
    const terminCount = Math.min(36, Math.max(1, Math.round(Number(draft.terminCount) || 1)));
    const dateInfo = formatLegalIndoDate(draft.signDate);

    // Build Payment Schedule Rows spaced monthly from signDate
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let baseDt = new Date();
    if (draft.signDate && /^\d{4}-\d{2}-\d{2}$/.test(draft.signDate)) {
      const p = draft.signDate.split('-').map(Number);
      baseDt = new Date(p[0], p[1] - 1, p[2]);
    }

    const scheduleRows = [];
    const basePart = Math.floor(contractValue / terminCount);
    for (let i = 0; i < terminCount; i++) {
      const d = new Date(baseDt.getFullYear(), baseDt.getMonth() + i, baseDt.getDate());
      const dueStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      const amt = i === terminCount - 1 ? (contractValue - basePart * (terminCount - 1)) : basePart;
      scheduleRows.push({
        label: terminCount === 1 ? 'Pelunasan Penuh (100%)' : `Termin ke-${i + 1}`,
        dueDate: dueStr,
        amount: amt,
        terbilang: angkaKeTerbilang(amt),
        note: i === 0 ? 'Saat Tanda Tangan / Awal' : `Jatuh Tempo Bulan ke-${i + 1}`
      });
    }

    // Build Sequential Articles
    const articles = [];
    articles.push({
      title: 'OBJEK DAN RUANG LINGKUP KESEPAKATAN',
      body: `Objek dalam Perjanjian ini adalah: ${draft.objectTitle || '-'}. ${draft.coreScopeText || ''}`.trim()
    });

    articles.push({
      title: 'NILAI TRANSAKSI, JANGKA WAKTU DAN TATA CARA PEMBAYARAN',
      body: `Total nilai kesepakatan yang mengikat Para Pihak adalah sebesar ${formatRp(contractValue)} (${angkaKeTerbilang(contractValue)}), dengan masa berlaku / jangka waktu selama ${draft.durationText || 'sesuai jadwal terlampir'}. Pembayaran dilaksanakan sebanyak ${terminCount} (${angkaKeTerbilang(terminCount).replace(' Rupiah', '').toLowerCase()}) tahap sesuai rincian jadwal jatuh tempo pada Perjanjian ini.`
    });

    const activeSet = new Set(draft.activeClauses || []);
    DATA.PROTECTIVE_CLAUSES.forEach((cl) => {
      if (!activeSet.has(cl.id)) return;
      const depVal = depositValue > 0 ? depositValue : Math.round(contractValue * 0.1);
      const lateVal = lateFeePerDay > 0 ? lateFeePerDay : 50000;
      const bodyFilled = cl.bodyTemplate
        .replace(/\{\{depositRp\}\}/g, formatRp(depVal))
        .replace(/\{\{depositTerbilang\}\}/g, angkaKeTerbilang(depVal))
        .replace(/\{\{lateFeeRp\}\}/g, formatRp(lateVal))
        .replace(/\{\{lateFeeTerbilang\}\}/g, angkaKeTerbilang(lateVal))
        .replace(/\{\{collateralDesc\}\}/g, draft.collateralDesc && draft.collateralDesc !== '-' ? draft.collateralDesc : 'dokumen/barang jaminan milik Pihak Kedua sesuai Berita Acara')
        .replace(/\{\{courtCity\}\}/g, draft.courtCity || draft.signCity || 'setempat');

      articles.push({
        title: cl.title,
        body: bodyFilled
      });
    });

    if (draft.customExtraClause && draft.customExtraClause.trim().length > 5) {
      articles.push({
        title: 'KETENTUAN KHUSUS TAMBAHAN',
        body: draft.customExtraClause.trim()
      });
    }

    // 8-Point Legal Completeness Audit
    const hasParties = Boolean(draft.p1Name && draft.p1Nik && draft.p2Name && draft.p2Nik && draft.p1Nik.length >= 8 && draft.p2Nik.length >= 8);
    const hasObject = Boolean(draft.objectTitle && draft.objectTitle.trim().length >= 15);
    const hasValue = contractValue > 0;
    const hasWanprestasi = activeSet.has('cl-wanprestasi');
    const hasSengketa = activeSet.has('cl-sengketa');
    const hasFinancialGuard = activeSet.has('cl-deposit') || activeSet.has('cl-denda') || activeSet.has('cl-agunan') || activeSet.has('cl-garansi');
    const hasWitnesses = Boolean(draft.witness1 && draft.witness1.trim() && draft.witness2 && draft.witness2.trim());
    const needsMateraiInfo = contractValue >= 5000000;

    const auditChecks = [
      {
        label: 'Komparisi Identitas & NIK Kedua Pihak',
        passed: hasParties,
        detail: hasParties ? 'Nama lengkap dan NIK KTP Pihak 1 & Pihak 2 sudah tercantum jelas.' : 'Lengkapi nama sesuai KTP dan NIK minimal 16 digit bagi kedua pihak.'
      },
      {
        label: 'Kejelasan Objek & Ruang Lingkup (Pasal 1320 KUHPerdata)',
        passed: hasObject,
        detail: hasObject ? 'Objek yang diperjanjikan sudah tertulis spesifik dan terukur.' : 'Perjelas spesifikasi objek, alamat, atau ukuran agar bebas tafsir ganda.'
      },
      {
        label: 'Kepastian Nominal & Kalimat Terbilang Anti-Selisih',
        passed: hasValue,
        detail: hasValue ? `${formatRp(contractValue)} otomatis dikunci dengan kalimat Terbilang.` : 'Isi nilai nominal transaksi lebih besar dari Rp 0.'
      },
      {
        label: 'Tabel Tanggal Jatuh Tempo Pasti',
        passed: scheduleRows.length >= 1,
        detail: `Terjadwal jelas dalam ${terminCount} tahap pembayaran lengkap tanggal jatuh tempo.`
      },
      {
        label: 'Klausul Pengaman Keuangan (Deposit / Denda / Jaminan)',
        passed: hasFinancialGuard,
        detail: hasFinancialGuard ? 'Sudah dilengkapi pasal penahan risiko keterlambatan/kerusakan.' : 'Aktifkan minimal 1 pasal pengaman (Deposit, Denda, atau Garansi) di Langkah 2.'
      },
      {
        label: 'Klausul Wanprestasi & Pengakhiran Tegas',
        passed: hasWanprestasi,
        detail: hasWanprestasi ? 'Mekanisme teguran (somasi) dan jatuh tempo seketika sudah aktif.' : 'Disarankan mencentang Klausul Wanprestasi untuk perlindungan gagal bayar.'
      },
      {
        label: 'Domisili Pengadilan Negeri & Musyawarah',
        passed: hasSengketa,
        detail: hasSengketa ? `Domisili hukum terkunci di PN ${draft.courtCity || draft.signCity}.` : 'Centang pasal Penyelesaian Perselisihan untuk kepastian domisili hukum.'
      },
      {
        label: 'Kehadiran 2 Saksi Dewasa & Kotak Materai Rp 10.000',
        passed: hasWitnesses,
        detail: hasWitnesses
          ? `2 Saksi terisi (${needsMateraiInfo ? 'Nilai >= Rp 5 Juta: Wajib tempel Materai Rp 10.000 di 2 rangkap' : 'Siap tempel Materai Rp 10.000 untuk kekuatan bukti sempurna'}).`
          : 'Isi nama Saksi Pertama dan Saksi Kedua agar pembuktian tanda tangan kuat.'
      }
    ];

    const passedCount = auditChecks.filter((c) => c.passed).length;
    const yearStr = (draft.signDate || '2026').slice(0, 4);
    const refNumber = `BS/${(draft.presetId || 'DOK').slice(0, 4).toUpperCase()}/${yearStr}/${String(contractValue % 900 + 100)}`;

    return {
      refNumber,
      presetName: draft.presetName,
      docHeading: (draft.docHeading || 'SURAT PERJANJIAN RESMI').toUpperCase(),
      signCity: draft.signCity || 'Jakarta',
      courtCity: draft.courtCity || draft.signCity || 'Jakarta',
      dateInfo,
      p1Name: draft.p1Name || 'Pihak Pertama',
      p1Nik: draft.p1Nik || '-',
      p1Phone: draft.p1Phone || '-',
      p1Role: draft.p1Role || 'Pihak Pertama',
      p1Address: draft.p1Address || '-',
      p2Name: draft.p2Name || 'Pihak Kedua',
      p2Nik: draft.p2Nik || '-',
      p2Phone: draft.p2Phone || '-',
      p2Role: draft.p2Role || 'Pihak Kedua',
      p2Address: draft.p2Address || '-',
      objectTitle: draft.objectTitle || '-',
      contractValue,
      depositValue,
      lateFeePerDay,
      durationText: draft.durationText || '-',
      terminCount,
      witness1: draft.witness1 || '',
      witness2: draft.witness2 || '',
      handoverItems: draft.handoverItems || draft.objectTitle || '-',
      articles,
      scheduleRows,
      auditChecks,
      passedCount
    };
  }

  function renderQuickConverter() {
    const nom = Math.max(0, Number(document.getElementById('qc-nominal').value) || 0);
    const term = Math.min(36, Math.max(1, Math.round(Number(document.getElementById('qc-termin').value) || 1)));
    const perTerm = Math.round(nom / term);
    const matNote = nom >= 5000000
      ? 'Wajib Bea Materai Rp 10.000 (UU No. 10/2020 untuk dokumen nilai > Rp 5 Juta)'
      : 'Disarankan tempel Materai Rp 10.000 sebagai alat bukti perdata';

    document.getElementById('qc-terbilang-out').textContent = `# ${angkaKeTerbilang(nom)} #`;
    document.getElementById('qc-cicilan-out').textContent =
      `Estimasi per Termin (${term}x): ${formatRp(perTerm)} • ${matNote}`;
  }

  function renderDashboardPresets() {
    const wrap = document.getElementById('dash-preset-cards');
    wrap.innerHTML = DATA.PRESETS.slice(0, 6).map((p) => `
      <div class="card-white" style="padding:11px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div style="min-width:0;">
          <div style="font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.name)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(p.category)} • ${p.activeClauses.length + 2} Pasal Aktif</div>
        </div>
        <button type="button" class="btn btn-stone btn-sm dash-pick-preset" data-pid="${escapeHtml(p.id)}">Gunakan</button>
      </div>
    `).join('');
  }

  function renderPresetChips() {
    document.getElementById('wiz-preset-chips').innerHTML = DATA.PRESETS.map((p) => `
      <button type="button" class="preset-chip ${appState.draft.presetId === p.id ? 'active' : ''}" data-preset-id="${escapeHtml(p.id)}">
        ${escapeHtml(p.name.replace('Perjanjian ', '').replace('Surat ', ''))}
      </button>
    `).join('');
  }

  function syncWizardFieldsFromDraft() {
    const d = appState.draft;
    const pairs = [
      ['doc-heading', d.docHeading],
      ['sign-city', d.signCity],
      ['sign-date', d.signDate],
      ['p1-name', d.p1Name],
      ['p1-nik', d.p1Nik],
      ['p1-phone', d.p1Phone],
      ['p1-role', d.p1Role],
      ['p1-address', d.p1Address],
      ['p2-name', d.p2Name],
      ['p2-nik', d.p2Nik],
      ['p2-phone', d.p2Phone],
      ['p2-role', d.p2Role],
      ['p2-address', d.p2Address],
      ['object-title', d.objectTitle],
      ['contract-value', d.contractValue],
      ['termin-count', d.terminCount],
      ['duration-text', d.durationText],
      ['core-scope-text', d.coreScopeText],
      ['witness-1', d.witness1],
      ['witness-2', d.witness2],
      ['handover-items', d.handoverItems],
      ['deposit-value', d.depositValue],
      ['late-fee-day', d.lateFeePerDay],
      ['collateral-desc', d.collateralDesc],
      ['court-city', d.courtCity],
      ['custom-extra-clause', d.customExtraClause]
    ];
    pairs.forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val == null ? '' : val;
    });
  }

  function renderSmartClausesToggles() {
    const active = new Set(appState.draft.activeClauses || []);
    document.getElementById('smart-clauses-grid').innerHTML = DATA.PROTECTIVE_CLAUSES.map((cl) => {
      const isChecked = active.has(cl.id);
      return `
        <label class="clause-toggle-card ${isChecked ? 'checked' : ''}">
          <input type="checkbox" class="smart-clause-cb" value="${escapeHtml(cl.id)}" ${isChecked ? 'checked' : ''} />
          <div>
            <strong style="display:block;font-size:13.5px;">${escapeHtml(cl.label)}</strong>
            <span style="font-size:12px;color:var(--text-muted);">Otomatis menyusun Pasal ${escapeHtml(cl.title)}</span>
          </div>
        </label>
      `;
    }).join('');
  }

  function renderStep3Folio(doc) {
    const sheet = document.getElementById('step3-folio-preview');
    if (activePreviewMode === 'contract') {
      sheet.innerHTML = `
        <div style="text-align:center;border-bottom:3px double var(--border-strong);padding-bottom:14px;margin-bottom:18px;">
          <h2 style="margin:0;font-size:21px;letter-spacing:0.02em;">${escapeHtml(doc.docHeading)}</h2>
          <div style="font-family:var(--font-sans);font-size:12.5px;color:var(--text-muted);margin-top:4px;">Nomor: ${escapeHtml(doc.refNumber)}</div>
        </div>

        <p style="margin:0 0 12px;">${escapeHtml(doc.dateInfo.legalSentence)}, bertempat di <strong>${escapeHtml(doc.signCity)}</strong>, kami yang bertanda tangan di bawah ini:</p>

        <div style="padding-left:16px;margin-bottom:14px;font-size:14.5px;">
          <p style="margin:0 0 8px;"><strong>1. ${escapeHtml(doc.p1Name)}</strong> (NIK: ${escapeHtml(doc.p1Nik)}), ${escapeHtml(doc.p1Role)}, beralamat di ${escapeHtml(doc.p1Address)}, Telp: ${escapeHtml(doc.p1Phone)}, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</p>
          <p style="margin:0;"><strong>2. ${escapeHtml(doc.p2Name)}</strong> (NIK: ${escapeHtml(doc.p2Nik)}), ${escapeHtml(doc.p2Role)}, beralamat di ${escapeHtml(doc.p2Address)}, Telp: ${escapeHtml(doc.p2Phone)}, selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
        </div>

        ${doc.articles.map((art, i) => `
          <div style="margin-bottom:16px;">
            <div style="text-align:center;font-weight:700;font-size:15px;">PASAL ${i + 1}<br/>${escapeHtml(art.title)}</div>
            <p style="margin:6px 0 0;text-align:justify;font-size:14.5px;">${escapeHtml(art.body)}</p>
          </div>
        `).join('')}

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-folio);display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:center;font-size:14px;">
          <div>
            <strong>PIHAK PERTAMA,</strong>
            <div style="height:68px;"></div>
            <strong>( ${escapeHtml(doc.p1Name)} )</strong>
          </div>
          <div>
            <strong>PIHAK KEDUA,</strong>
            <div><span class="materai-stamp-box"><span>MATERAI TEMPEL</span><span>Rp 10.000</span></span></div>
            <strong>( ${escapeHtml(doc.p2Name)} )</strong>
          </div>
        </div>

        <div style="margin-top:18px;text-align:center;font-size:13.5px;color:var(--text-muted);">
          Saksi I: <strong>${escapeHtml(doc.witness1 || '................')}</strong> &nbsp;&bull;&nbsp; Saksi II: <strong>${escapeHtml(doc.witness2 || '................')}</strong>
        </div>
      `;
    } else {
      const firstAmt = doc.scheduleRows[0] ? doc.scheduleRows[0].amount : doc.contractValue;
      sheet.innerHTML = `
        <div style="border-bottom:2px solid var(--border-strong);padding-bottom:12px;margin-bottom:16px;">
          <span class="seal-badge seal-badge-crimson">LAMPIRAN SERAH TERIMA &amp; BUKTI BAYAR</span>
          <h3 style="margin:8px 0 2px;font-size:20px;">BERITA ACARA SERAH TERIMA (BAST) &amp; KWITANSI RESMI</h3>
        </div>
        <p style="font-size:14.5px;"><strong>Diserahterimakan dari ${escapeHtml(doc.p1Name)} kepada ${escapeHtml(doc.p2Name)}:</strong><br/>${escapeHtml(doc.handoverItems)}</p>
        <div class="card-stone" style="margin-top:16px;font-family:var(--font-sans);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            <strong style="font-size:16px;">KWITANSI TANDA TERIMA • No: KW-${escapeHtml(doc.refNumber)}</strong>
            <span class="seal-badge seal-badge-blue">${formatRp(firstAmt)}</span>
          </div>
          <div style="font-size:14px;margin-bottom:6px;"><strong>Telah Terima Dari:</strong> ${escapeHtml(doc.p2Name)}</div>
          <div style="font-size:14px;margin-bottom:6px;"><strong>Uang Sejumlah:</strong> <span class="text-blue"># ${escapeHtml(angkaKeTerbilang(firstAmt))} #</span></div>
          <div style="font-size:14px;"><strong>Untuk Pembayaran:</strong> ${escapeHtml(doc.presetName)} (${escapeHtml(doc.objectTitle)})</div>
        </div>
      `;
    }
  }

  function renderTerminView(doc) {
    document.getElementById('termin-kpi-summary').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Nilai Total Kontrak</div>
        <div class="kpi-value text-blue">${formatRp(doc.contractValue)}</div>
        <div class="kpi-foot">${escapeHtml(angkaKeTerbilang(doc.contractValue))}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Jumlah Tahap</div>
        <div class="kpi-value">${doc.terminCount} Termin</div>
        <div class="kpi-foot">Otomatis terjadwal bulanan</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Deposit / Jaminan</div>
        <div class="kpi-value text-emerald">${formatRp(doc.depositValue)}</div>
        <div class="kpi-foot">Pengaman pelaksanaan kontrak</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Denda Telat Harian</div>
        <div class="kpi-value text-crimson">${formatRp(doc.lateFeePerDay)}</div>
        <div class="kpi-foot">Per hari kalender keterlambatan</div>
      </div>
    `;

    document.getElementById('termin-table-title').textContent = `Jadwal Pembayaran: ${doc.docHeading}`;
    document.getElementById('termin-tbody').innerHTML = doc.scheduleRows.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.label)}</strong></td>
        <td>${escapeHtml(r.dueDate)}</td>
        <td><strong class="text-blue">${formatRp(r.amount)}</strong></td>
        <td>${escapeHtml(r.terbilang)}</td>
        <td>${escapeHtml(r.note)}</td>
      </tr>
    `).join('');
  }

  function renderLibrary() {
    document.getElementById('lib-cat-strip').innerHTML =
      `<button type="button" class="preset-chip ${activeLibCat === 'all' ? 'active' : ''}" data-lcat="all">Semua Kategori (120)</button>` +
      DATA.CATEGORIES.map((c) => `
        <button type="button" class="preset-chip ${activeLibCat === c.id ? 'active' : ''}" data-lcat="${escapeHtml(c.id)}">${escapeHtml(c.name)} (20)</button>
      `).join('');

    const q = String(document.getElementById('lib-search-input').value || '').trim().toLowerCase();
    const favBtn = document.getElementById('lib-fav-btn');
    favBtn.textContent = `Favorit Saja (${appState.favoriteIds.length})`;
    favBtn.className = favOnly ? 'btn btn-blue btn-sm' : 'btn btn-outline btn-sm';

    const items = DATA.LIBRARY_ITEMS.filter((it) => {
      if (activeLibCat !== 'all' && it.categoryId !== activeLibCat) return false;
      if (favOnly && !appState.favoriteIds.includes(it.id)) return false;
      if (q) {
        const hay = `${it.code} ${it.title} ${it.summary} ${it.clauseText} ${it.tip} ${it.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById('lib-count-pill').textContent = `${items.length} Klausul`;
    const grid = document.getElementById('lib-cards-grid');
    if (!items.length) {
      grid.innerHTML = `<div class="card-stone" style="grid-column:1/-1;text-align:center;padding:32px;">Tidak ditemukan klausul dengan kata kunci tersebut.</div>`;
      return;
    }

    grid.innerHTML = items.map((it) => {
      const fav = appState.favoriteIds.includes(it.id);
      return `
        <article class="lib-card" data-kls-id="${escapeHtml(it.id)}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="seal-badge" style="color:${escapeHtml(it.categoryColor)};border-color:${escapeHtml(it.categoryColor)};">${escapeHtml(it.code)}</span>
              <span style="font-size:12px;font-weight:700;color:${fav ? 'var(--seal-blue)' : 'var(--text-muted)'};">${fav ? 'Tersimpan' : 'Baca Pasal'}</span>
            </div>
            <h4>${escapeHtml(it.title)}</h4>
            <p>${escapeHtml(it.summary)}</p>
          </div>
          <div style="font-size:12px;font-weight:800;color:var(--emerald-valid);padding-top:8px;border-top:1px solid var(--border-folio);">
            ${escapeHtml(it.categoryName)} &rarr;
          </div>
        </article>
      `;
    }).join('');
  }

  function renderHistory() {
    const docWrap = document.getElementById('history-docs-list');
    if (!appState.savedDocs.length) {
      docWrap.innerHTML = `<div class="card-white" style="padding:16px;font-size:13.5px;color:var(--text-muted);">Belum ada surat perjanjian di arsip. Klik tombol <strong>Simpan ke Arsip</strong> di halaman Wizard.</div>`;
    } else {
      docWrap.innerHTML = appState.savedDocs.map((item, idx) => `
        <div class="card-white" style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <strong style="font-size:16px;">${escapeHtml(item.draft.docHeading)}</strong>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">
              ${escapeHtml(item.draft.p1Name)} &amp; ${escapeHtml(item.draft.p2Name)} • Nilai ${formatRp(item.draft.contractValue)} • Disimpan ${escapeHtml(item.savedAt)}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn btn-blue btn-sm hist-open-doc" data-idx="${idx}">Buka di Wizard</button>
            <button type="button" class="btn btn-oxford btn-sm hist-pdf-doc" data-idx="${idx}">Unduh PDF</button>
            <button type="button" class="btn btn-stone btn-sm hist-del-doc" data-idx="${idx}">Hapus</button>
          </div>
        </div>
      `).join('');
    }

    const favWrap = document.getElementById('history-favs-list');
    const favItems = DATA.LIBRARY_ITEMS.filter((x) => appState.favoriteIds.includes(x.id));
    favWrap.innerHTML = favItems.length
      ? favItems.map((it) => `
          <div class="card-stone" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div><span class="seal-badge" style="margin-right:8px;">${escapeHtml(it.code)}</span><strong>${escapeHtml(it.title)}</strong></div>
            <button type="button" class="btn btn-outline btn-sm hist-open-kls" data-id="${escapeHtml(it.id)}">Lihat</button>
          </div>
        `).join('')
      : `<div style="font-size:13.5px;color:var(--text-muted);">Belum ada klausul favorit.</div>`;
  }

  function refreshAll() {
    const doc = buildDocumentModel(appState.draft);
    const uName = appState.profile.userName || 'Pengguna Resmi';
    const oName = appState.profile.orgName || 'Ruang Dokumen Resmi';

    document.getElementById('side-org-name').textContent = oName;
    document.getElementById('side-user-name').textContent = uName;
    document.getElementById('dash-greeting').textContent = `Halo, ${uName} — Siapkan Perjanjian Tertulis`;
    document.getElementById('dash-subtitle').textContent = `${oName} • Pastikan setiap transaksi uang, sewa, dan kerja sama terlindungi secara sah.`;

    document.getElementById('kpi-saved-docs').textContent = `${appState.savedDocs.length} Surat`;
    document.getElementById('kpi-export-files').textContent = `${appState.exportCount} Berkas`;
    document.getElementById('kpi-audit-score').textContent = `${doc.passedCount}/8 Aman`;
    document.getElementById('kpi-active-pasal').textContent = `${doc.articles.length} Pasal tersusun rapi`;
    document.getElementById('kpi-active-nominal').textContent = formatRp(doc.contractValue);
    document.getElementById('kpi-active-preset').textContent = doc.presetName || doc.docHeading;

    document.getElementById('step1-terbilang-live').textContent = `# ${angkaKeTerbilang(doc.contractValue)} #`;

    document.getElementById('legal-audit-grid').innerHTML = doc.auditChecks.map((c) => `
      <div class="audit-row">
        <span class="audit-badge-dot ${c.passed ? 'ok' : 'warn'}">${c.passed ? 'OK' : '!'}</span>
        <div>
          <strong style="display:block;font-size:13.5px;">${escapeHtml(c.label)}</strong>
          <span style="font-size:12.5px;color:var(--text-muted);">${escapeHtml(c.detail)}</span>
        </div>
      </div>
    `).join('');

    renderStep3Folio(doc);
    renderTerminView(doc);
    renderLibrary();
    renderHistory();
    saveState();
  }

  function switchView(v) {
    document.querySelectorAll('.app-view').forEach((el) => el.classList.toggle('hidden', el.id !== `view-${v}`));
    document.querySelectorAll('.sidebar-nav .nav-btn, .mobile-tabbar .mob-tab, .mob-nav-link').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-view') === v);
    });
    document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchStep(n) {
    activeStep = Number(n) || 1;
    [1, 2, 3].forEach((s) => document.getElementById(`wiz-step-${s}`).classList.toggle('hidden', s !== activeStep));
    document.querySelectorAll('.step-pill').forEach((p) => p.classList.toggle('active', Number(p.getAttribute('data-step')) === activeStep));
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    document.getElementById('theme-toggle-btn').textContent = next === 'dark' ? 'Tema Terang' : 'Tema Gelap';
  }

  function openModal(id) {
    const item = DATA.LIBRARY_ITEMS.find((x) => x.id === id);
    if (!item) return;
    currentModalItem = item;
    document.getElementById('lib-modal-badge').textContent = `${item.code} • ${item.categoryName}`;
    document.getElementById('lib-modal-title').textContent = item.title;
    document.getElementById('lib-modal-summary').textContent = item.summary;
    document.getElementById('lib-modal-clause').textContent = item.clauseText;
    document.getElementById('lib-modal-tip').textContent = item.tip;
    document.getElementById('lib-modal-fav').textContent =
      appState.favoriteIds.includes(item.id) ? 'Hapus Favorit' : 'Simpan Favorit';
    document.getElementById('lib-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('lib-modal').classList.add('hidden');
    currentModalItem = null;
  }

  function enterApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    document.getElementById('theme-toggle-btn').textContent = cur === 'dark' ? 'Tema Terang' : 'Tema Gelap';

    renderQuickConverter();
    renderDashboardPresets();
    renderPresetChips();
    syncWizardFieldsFromDraft();
    renderSmartClausesToggles();

    document.getElementById('set-name').value = appState.profile.userName || '';
    document.getElementById('set-org').value = appState.profile.orgName || '';
    document.getElementById('set-nik').value = appState.profile.defaultNik || '';
    document.getElementById('set-city').value = appState.profile.defaultCity || '';

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
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      errEl.classList.add('hidden');

      const rawName = document.getElementById('login-name').value.trim();
      const rawOrg = document.getElementById('login-org').value.trim();
      const rawEmail = document.getElementById('login-email').value.trim();
      const rawCode = document.getElementById('login-code').value.trim().toUpperCase();

      if (!rawCode) {
        errEl.textContent = 'Masukkan kode lisensi akses terlebih dahulu.';
        errEl.classList.remove('hidden');
        return;
      }

      const codeHash = sha256Hex(LICENSE_SALT + rawCode);
      const role = classifyLicenseHash(codeHash);

      if (!role) {
        errEl.textContent = 'Kode lisensi tidak valid. Periksa kembali kode akses resmi dari bukti pembelianmu.';
        errEl.classList.remove('hidden');
        return;
      }

      if (role === 'buyer') {
        if (!rawName || !rawEmail || !rawEmail.includes('@')) {
          errEl.textContent = 'Lengkapi Nama Lengkap dan Email aktif untuk mengaktifkan lisensi pembeli.';
          errEl.classList.remove('hidden');
          return;
        }
      }

      const finalUser = rawName || 'Tim Developer';
      const finalOrg = rawOrg || 'Ruang Uji Dokumen';
      const finalEmail = rawEmail || 'dev@berkassah.id';

      session = {
        userName: finalUser,
        orgName: finalOrg,
        email: finalEmail,
        role,
        licenseHash: codeHash
      };
      appState.profile.userName = finalUser;
      appState.profile.orgName = finalOrg;
      if (rawName) appState.draft.p1Name = finalUser;

      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      saveState();
      enterApp();
      showToast(`Selamat datang di BerkasSah Studio, ${finalUser}!`);
    });

    document.querySelectorAll('[data-view]').forEach((b) => {
      b.addEventListener('click', () => switchView(b.getAttribute('data-view')));
    });

    document.getElementById('dash-start-wizard-btn').addEventListener('click', () => {
      switchView('wizard');
      switchStep(1);
    });

    document.getElementById('mob-menu-btn').addEventListener('click', () => {
      document.getElementById('mobile-drawer-backdrop').classList.remove('hidden');
    });
    document.getElementById('mob-drawer-close').addEventListener('click', () => {
      document.getElementById('mobile-drawer-backdrop').classList.add('hidden');
    });
    document.getElementById('mobile-drawer-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'mobile-drawer-backdrop') e.target.classList.add('hidden');
    });

    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('mob-theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('settings-theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('logout-btn').addEventListener('click', doLogout);
    document.getElementById('settings-logout-btn').addEventListener('click', doLogout);

    // Quick Converter
    ['qc-nominal', 'qc-termin'].forEach((id) => {
      document.getElementById(id).addEventListener('input', renderQuickConverter);
    });
    document.getElementById('qc-copy-terbilang-btn').addEventListener('click', () => {
      const txt = document.getElementById('qc-terbilang-out').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
      showToast('Kalimat Terbilang berhasil disalin.');
    });
    document.getElementById('qc-send-wizard-btn').addEventListener('click', () => {
      appState.draft.contractValue = Number(document.getElementById('qc-nominal').value) || 0;
      appState.draft.terminCount = Number(document.getElementById('qc-termin').value) || 1;
      syncWizardFieldsFromDraft();
      refreshAll();
      switchView('wizard');
      switchStep(1);
      showToast('Nilai transaksi & termin dimasukkan ke Wizard.');
    });

    function applyPresetById(pid) {
      const found = DATA.PRESETS.find((x) => x.id === pid);
      if (!found) return;
      appState.draft = createDraftFromPreset(found, appState.profile);
      renderPresetChips();
      syncWizardFieldsFromDraft();
      renderSmartClausesToggles();
      refreshAll();
    }

    document.getElementById('dash-preset-cards').addEventListener('click', (e) => {
      const btn = e.target.closest('.dash-pick-preset');
      if (!btn) return;
      applyPresetById(btn.getAttribute('data-pid'));
      switchView('wizard');
      switchStep(1);
      showToast('Template perjanjian siap diedit di Wizard.');
    });

    document.getElementById('wiz-preset-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-preset-id]');
      if (!chip) return;
      applyPresetById(chip.getAttribute('data-preset-id'));
      showToast('Template pasal berhasil dimuat.');
    });

    document.querySelectorAll('.step-pill').forEach((p) => {
      p.addEventListener('click', () => switchStep(p.getAttribute('data-step')));
    });
    document.querySelectorAll('.wiz-go-step').forEach((b) => {
      b.addEventListener('click', () => {
        switchStep(b.getAttribute('data-target'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const inputBindings = [
      ['doc-heading', 'docHeading', false],
      ['sign-city', 'signCity', false],
      ['sign-date', 'signDate', false],
      ['p1-name', 'p1Name', false],
      ['p1-nik', 'p1Nik', false],
      ['p1-phone', 'p1Phone', false],
      ['p1-role', 'p1Role', false],
      ['p1-address', 'p1Address', false],
      ['p2-name', 'p2Name', false],
      ['p2-nik', 'p2Nik', false],
      ['p2-phone', 'p2Phone', false],
      ['p2-role', 'p2Role', false],
      ['p2-address', 'p2Address', false],
      ['object-title', 'objectTitle', false],
      ['contract-value', 'contractValue', true],
      ['termin-count', 'terminCount', true],
      ['duration-text', 'durationText', false],
      ['core-scope-text', 'coreScopeText', false],
      ['witness-1', 'witness1', false],
      ['witness-2', 'witness2', false],
      ['handover-items', 'handoverItems', false],
      ['deposit-value', 'depositValue', true],
      ['late-fee-day', 'lateFeePerDay', true],
      ['collateral-desc', 'collateralDesc', false],
      ['court-city', 'courtCity', false],
      ['custom-extra-clause', 'customExtraClause', false]
    ];

    inputBindings.forEach(([domId, key, isNum]) => {
      document.getElementById(domId).addEventListener('input', (e) => {
        appState.draft[key] = isNum ? (Number(e.target.value) || 0) : e.target.value;
        refreshAll();
      });
    });

    document.getElementById('smart-clauses-grid').addEventListener('change', (e) => {
      if (!e.target.classList.contains('smart-clause-cb')) return;
      const checkedIds = Array.from(document.querySelectorAll('.smart-clause-cb:checked')).map((cb) => cb.value);
      appState.draft.activeClauses = checkedIds;
      renderSmartClausesToggles();
      refreshAll();
    });

    document.querySelectorAll('.prev-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePreviewMode = btn.getAttribute('data-pmode');
        document.querySelectorAll('.prev-mode-btn').forEach((b) => {
          b.className = b === btn ? 'btn btn-oxford btn-sm prev-mode-btn' : 'btn btn-stone btn-sm prev-mode-btn';
        });
        renderStep3Folio(buildDocumentModel(appState.draft));
      });
    });

    function recordExport(fname) {
      appState.exportCount += 1;
      refreshAll();
      showToast(`Berhasil mengunduh ${fname}`);
    }

    document.getElementById('btn-dl-contract-pdf').addEventListener('click', () => {
      const res = window.BerkasExporter.exportContractPdf(buildDocumentModel(appState.draft));
      recordExport(res.filename);
    });

    document.getElementById('btn-dl-bast-pdf').addEventListener('click', () => {
      const res = window.BerkasExporter.exportBastKwitansiPdf(buildDocumentModel(appState.draft));
      recordExport(res.filename);
    });

    document.getElementById('termin-print-kwitansi-btn').addEventListener('click', () => {
      const res = window.BerkasExporter.exportBastKwitansiPdf(buildDocumentModel(appState.draft));
      recordExport(res.filename);
    });

    document.getElementById('btn-dl-word-rtf').addEventListener('click', () => {
      const res = window.BerkasExporter.exportContractWordRtf(buildDocumentModel(appState.draft));
      recordExport(res.filename);
    });

    document.getElementById('btn-dl-wa-png').addEventListener('click', async () => {
      const res = await window.BerkasExporter.exportKwitansiWaPng(buildDocumentModel(appState.draft));
      recordExport(res.filename);
    });

    function saveDraftToArchive() {
      const now = new Date();
      const stamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      appState.savedDocs.unshift({
        id: 'arc-' + Date.now(),
        savedAt: stamp,
        draft: cloneDeep(appState.draft)
      });
      if (appState.savedDocs.length > 30) appState.savedDocs.pop();
      refreshAll();
      showToast('Surat perjanjian berhasil disimpan ke Arsip.');
    }

    document.getElementById('wiz-save-top-btn').addEventListener('click', saveDraftToArchive);
    document.getElementById('wiz-save-bottom-btn').addEventListener('click', saveDraftToArchive);

    // Library & Modal
    document.getElementById('lib-search-input').addEventListener('input', renderLibrary);
    document.getElementById('lib-fav-btn').addEventListener('click', () => {
      favOnly = !favOnly;
      renderLibrary();
    });
    document.getElementById('lib-cat-strip').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lcat]');
      if (!b) return;
      activeLibCat = b.getAttribute('data-lcat');
      renderLibrary();
    });
    document.getElementById('lib-cards-grid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-kls-id]');
      if (card) openModal(card.getAttribute('data-kls-id'));
    });

    document.getElementById('lib-modal-close').addEventListener('click', closeModal);
    document.getElementById('lib-modal').addEventListener('click', (e) => {
      if (e.target.id === 'lib-modal') closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentModalItem) closeModal();
    });

    document.getElementById('lib-modal-copy').addEventListener('click', () => {
      if (!currentModalItem) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentModalItem.clauseText);
      }
      showToast('Bunyi pasal berhasil disalin.');
    });

    document.getElementById('lib-modal-fav').addEventListener('click', () => {
      if (!currentModalItem) return;
      const i = appState.favoriteIds.indexOf(currentModalItem.id);
      if (i >= 0) appState.favoriteIds.splice(i, 1);
      else appState.favoriteIds.push(currentModalItem.id);
      document.getElementById('lib-modal-fav').textContent =
        appState.favoriteIds.includes(currentModalItem.id) ? 'Hapus Favorit' : 'Simpan Favorit';
      refreshAll();
    });

    document.getElementById('lib-modal-insert').addEventListener('click', () => {
      if (!currentModalItem) return;
      const cur = String(appState.draft.customExtraClause || '').trim();
      appState.draft.customExtraClause = (cur ? cur + '\n\n' : '') + currentModalItem.clauseText;
      syncWizardFieldsFromDraft();
      refreshAll();
      closeModal();
      switchView('wizard');
      switchStep(2);
      showToast('Klausul ditambahkan ke Pasal Tambahan Kontrak.');
    });

    // History Actions
    document.getElementById('history-docs-list').addEventListener('click', (e) => {
      const openBtn = e.target.closest('.hist-open-doc');
      const pdfBtn = e.target.closest('.hist-pdf-doc');
      const delBtn = e.target.closest('.hist-del-doc');
      if (openBtn) {
        const entry = appState.savedDocs[Number(openBtn.getAttribute('data-idx'))];
        if (entry) {
          appState.draft = cloneDeep(entry.draft);
          renderPresetChips();
          syncWizardFieldsFromDraft();
          renderSmartClausesToggles();
          refreshAll();
          switchView('wizard');
          switchStep(1);
          showToast('Arsip perjanjian dimuat ke Wizard.');
        }
      } else if (pdfBtn) {
        const entry = appState.savedDocs[Number(pdfBtn.getAttribute('data-idx'))];
        if (entry) {
          const res = window.BerkasExporter.exportContractPdf(buildDocumentModel(entry.draft));
          recordExport(res.filename);
        }
      } else if (delBtn) {
        appState.savedDocs.splice(Number(delBtn.getAttribute('data-idx')), 1);
        refreshAll();
        showToast('Arsip dihapus.');
      }
    });

    document.getElementById('history-favs-list').addEventListener('click', (e) => {
      const b = e.target.closest('.hist-open-kls');
      if (b) openModal(b.getAttribute('data-id'));
    });

    // Settings & Backup
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      appState.profile.userName = document.getElementById('set-name').value.trim() || 'Pengguna Resmi';
      appState.profile.orgName = document.getElementById('set-org').value.trim() || 'Ruang Dokumen Resmi';
      appState.profile.defaultNik = document.getElementById('set-nik').value.trim() || '';
      appState.profile.defaultCity = document.getElementById('set-city').value.trim() || 'Jakarta';
      refreshAll();
      showToast('Profil identitas default disimpan.');
    });

    document.getElementById('backup-json-btn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), appState }, null, 2)], { type: 'application/json' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'Cadangan-BerkasSah-Studio.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(u); }, 300);
      showToast('File cadangan JSON diunduh.');
    });

    document.getElementById('restore-json-input').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const parsed = JSON.parse(String(r.result || '{}'));
          if (parsed && parsed.appState && parsed.appState.draft) {
            appState = Object.assign(appState, parsed.appState);
            renderPresetChips();
            syncWizardFieldsFromDraft();
            renderSmartClausesToggles();
            refreshAll();
            showToast('Arsip berhasil dipulihkan!');
          }
        } catch (err) {
          showToast('File JSON tidak valid.');
        }
      };
      r.readAsText(f);
    });
  }

  loadPersisted();
  bindEvents();
  if (session) enterApp();
})();

// KomisiKlip Studio — Logika Utama Aplikasi Web Pembeli
(function () {
  const STORAGE_KEY = 'komisiklip_studio_state_v1';
  const DATA = window.KOMISIKLIP_DATA || { presets: [], safeWords: [], calendarPillars: [], library: [] };

  const LICENSE_SALT = 'nifari-lic-2026::';
  const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
  const DEV_AGENT_HASHES = new Set([
    'e011906c1c3655bc2656f9e6fbc69573ea4de2e73ed1e5d281311709d1032a7e',
    '7d9be756557a5eb42834bb3a3ceff782befd14a6711f81866797bc4feb938d04',
    'f7dde8fa7044dd2ee3dcbce6ae5bb77e32c61e07189fdd39e64b5cd71a130bde',
    '2db7af2e07375dcdcc68d241c99665a492dba2ff2bbad0536724012eb2ded319',
    '68e25197e2b4b2b405530c3de2c309b0d84fb0bb30a3203d6774b3d47ac91241',
    'a6bf15d90cb90bd793dc9577bfc4b60c8773321ef14c76fa5475ccb102aeb243'
  ]);
  const OFFICIAL_BUYER_HASH = '5cff13023c29dff707e896c1df7248df6c129ea93219b5b90105bd852cee42c9';

  function sha256Hex(input) {
    const bytes = new TextEncoder().encode(String(input));
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
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const bitLen = bytes.length * 8;
    const padLen = ((bytes.length + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(padLen);
    buf.set(bytes);
    buf[bytes.length] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000), false);
    dv.setUint32(padLen - 4, bitLen >>> 0, false);

    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
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
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) >>> 0;
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

  function hashAccessCode(code) {
    return sha256Hex(LICENSE_SALT + String(code == null ? '' : code).trim().toUpperCase());
  }

  function isValidCreatorSession(creator) {
    return Boolean(
      creator &&
        creator.loggedIn === true &&
        (creator.validHash === CREATOR_MASTER_HASH || DEV_AGENT_HASHES.has(creator.validHash) || creator.validHash === OFFICIAL_BUYER_HASH)
    );
  }

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function makeProjectId() {
    return 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  }

  const defaultCreator = {
    loggedIn: false,
    name: '',
    handle: '',
    email: '',
    validHash: '',
    defaultHours: '11:30 WIB & 19:30 WIB',
    theme: 'light'
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const mergedCreator = { ...defaultCreator, ...(parsed.creator || {}) };
        delete mergedCreator.license;
        if (!isValidCreatorSession(mergedCreator)) {
          mergedCreator.loggedIn = false;
          mergedCreator.validHash = '';
        }
        return {
          creator: mergedCreator,
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          exportsCount: Number.isFinite(Number(parsed.exportsCount)) ? Number(parsed.exportsCount) : 0,
          targetIncome: Number.isFinite(Number(parsed.targetIncome)) ? Number(parsed.targetIncome) : 6000000
        };
      }
    } catch (e) {
      // ignore corrupted storage
    }
    return {
      creator: { ...defaultCreator },
      projects: [],
      favorites: [],
      exportsCount: 0,
      targetIncome: 6000000
    };
  }

  let state = loadState();
  let activePresetId = DATA.presets[0] ? DATA.presets[0].id : '';
  let activeStep = 1;
  let activeVarIdx = 0;
  let currentProject = null;
  let pendingProjectId = makeProjectId();
  let step1Dirty = false;
  let wizardInitializedOnce = false;
  let activeLibCategory = 'ALL';
  let activeModalItem = null;
  let tpTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore quota error
    }
  }

  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatCompactRp(num) {
    const n = Number(num) || 0;
    if (n >= 1000000) {
      const jt = (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1).replace('.', ',');
      return 'Rp ' + jt + ' Jt';
    }
    return formatRp(n);
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
    state.creator.theme = t;
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = t === 'dark' ? 'Tema Terang' : 'Tema Gelap';
    saveState();
  }

  function openMobileDrawer() {
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.add('open');
    if (bd) bd.classList.add('open');
  }

  function closeMobileDrawer() {
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('open');
    if (bd) bd.classList.remove('open');
  }

  function pauseTeleprompter() {
    if (tpTimer) {
      clearInterval(tpTimer);
      tpTimer = null;
    }
    const btn = document.getElementById('tpPlayPauseBtn');
    if (btn) btn.textContent = 'Mulai Gulir';
  }

  function ensureSelectHasOption(selectEl, val) {
    if (!selectEl || !val) return;
    const exists = Array.from(selectEl.options).some((opt) => opt.value === val);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      selectEl.appendChild(opt);
    }
    selectEl.value = val;
  }

  function resolvePostTimeSlot(postsPerDay) {
    const fallbackMap = {
      1: ['19:30 WIB'],
      2: ['11:45 WIB', '19:30 WIB'],
      3: ['08:30 WIB', '12:15 WIB', '19:45 WIB']
    };
    const defaults = fallbackMap[postsPerDay] || fallbackMap[2];
    const customRaw = String((state.creator && state.creator.defaultHours) || '').trim();
    if (!customRaw) {
      return defaults.join(' & ');
    }
    const parts = customRaw
      .split(/\s*(?:&|,|\/|;|\bdan\b)\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) {
      return defaults.join(' & ');
    }
    const picked = [];
    for (let i = 0; i < postsPerDay; i++) {
      picked.push(parts[i] || defaults[i] || parts[parts.length - 1]);
    }
    return picked.join(' & ');
  }

  function activateStepDom(stepNum) {
    activeStep = stepNum;
    document.querySelectorAll('.step-tab').forEach((t) => {
      t.classList.toggle('active', Number(t.dataset.step) === stepNum);
    });
    document.getElementById('wizStep1').classList.toggle('hidden', stepNum !== 1);
    document.getElementById('wizStep2').classList.toggle('hidden', stepNum !== 2);
    document.getElementById('wizStep3').classList.toggle('hidden', stepNum !== 3);
  }

  function validateStep1Product() {
    const prodInput = document.getElementById('prodName');
    const prodVal = prodInput.value.trim();
    if (!prodVal) {
      activateStepDom(1);
      prodInput.classList.add('input-invalid');
      prodInput.focus();
      showToast('Isi dulu Nama Produk yang mau dipromosikan di Langkah 1 ya.');
      return false;
    }
    prodInput.classList.remove('input-invalid');
    return true;
  }

  // Build 3 Script Variations + 30-Day Schedule from form fields
  function buildProjectFromInputs() {
    const activePreset = DATA.presets.find((p) => p.id === activePresetId) || null;
    const rawProdName = document.getElementById('prodName').value.trim();
    const productName = rawProdName || 'Produk Pilihan Keranjang';
    const platform = document.getElementById('prodPlatform').value;

    const rawPrice = document.getElementById('prodPrice').value.trim();
    const parsedPrice = rawPrice !== '' && Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : 59000;
    const price = Math.max(0, parsedPrice);

    const rawComm = document.getElementById('prodComm').value.trim();
    const parsedComm = rawComm !== '' && Number.isFinite(Number(rawComm)) ? Number(rawComm) : 10;
    const commissionPct = Math.min(60, Math.max(0, parsedComm));

    const visualStyle =
      document.getElementById('prodVisualStyle').value || 'Tanpa Tampil Wajah (Fokus Tangan & Tekstur)';
    const audience = document.getElementById('prodAudience').value.trim() || 'Pembeli harian Indonesia';
    const promoHook =
      document.getElementById('prodPromo').value.trim() ||
      'Cek harga promo dan potongan ongkir di keranjang kiri bawah';
    const painPoint =
      document.getElementById('prodPain').value.trim() || 'Sering repot dengan cara lama yang makan waktu';
    const b1 = document.getElementById('prodBen1').value.trim() || 'Praktis dipakai setiap hari tanpa ribet';
    const b2 = document.getElementById('prodBen2').value.trim() || 'Bahan kokoh dan awet dipakai jangka panjang';
    const b3 = document.getElementById('prodBen3').value.trim() || 'Ukuran pas dan nyaman dibawa ke mana saja';

    const rawFreq = document.getElementById('scheduleFreqSelect').value;
    const postsPerDay = Number.isFinite(Number(rawFreq)) && Number(rawFreq) >= 1 ? Number(rawFreq) : 2;

    const isMatchingPresetProduct = Boolean(
      activePreset &&
        productName.toLowerCase() === String(activePreset.productName || '').trim().toLowerCase()
    );

    const shortPain = painPoint.length > 48 ? painPoint.slice(0, 48).trim() + '...' : painPoint;
    const s1 =
      isMatchingPresetProduct && activePreset.sampleShot1
        ? activePreset.sampleShot1
        : `Sorot dekat ${productName} dengan gaya "${visualStyle}" sambil perlihatkan kontras sebelum mengatasi masalah ${shortPain.toLowerCase()}`;
    const s2 =
      isMatchingPresetProduct && activePreset.sampleShot2
        ? activePreset.sampleShot2
        : `Peragakan pemakaian nyata ${productName} (${visualStyle}) selama 5-7 detik tanpa jeda agar fungsinya terlihat jelas`;
    const s3 =
      isMatchingPresetProduct && activePreset.sampleShot3
        ? activePreset.sampleShot3
        : `Perlihatkan detail fisik & kelengkapan ${productName}, lalu arahkan telunjuk ke ikon keranjang kiri bawah`;

    const variations = [
      {
        id: 'var-a',
        title: 'Sudut Masalah Sehari-hari',
        duration: '24–28 detik',
        onScreenText: `Masih sering ${painPoint.slice(0, 34).toLowerCase()}? Cek solusi praktis ini`,
        blocks: [
          {
            time: '00–03 dtk',
            stage: 'Hook Penahan Jempol',
            spoken: `Siapa di sini yang masih sering kesal gara-gara ${painPoint.toLowerCase()}? Jangan buru-buru ganti barang sebelum lihat tes singkat ini.`,
            visual: s1
          },
          {
            time: '03–11 dtk',
            stage: 'Masalah & Bukti Awal',
            spoken: `Buat ${audience.toLowerCase()}, masalah kayak gini kelihatannya sepele tapi bikin makan waktu tiap hari. Makanya sekarang aku pindah pakai ${productName}.`,
            visual: s2
          },
          {
            time: '11–21 dtk',
            stage: 'Keunggulan Terasa Nyata',
            spoken: `Yang paling bikin tenang, ${b1.toLowerCase()}. Ditambah lagi ${b2.toLowerCase()}, dan ${b3.toLowerCase()}.`,
            visual: `Sorot jarak dekat bagian detail ${productName} saat sedang bekerja nyata (${visualStyle})`
          },
          {
            time: '21–27 dtk',
            stage: 'Arahkan Klik Keranjang',
            spoken: `${promoHook}. Coba cek di akun kalian dapat harga berapa lewat keranjang kiri bawah ya.`,
            visual: s3
          }
        ]
      },
      {
        id: 'var-b',
        title: 'Sudut Uji Bukti Langsung',
        duration: '20–25 detik',
        onScreenText: `Tes jujur ${productName.slice(0, 28)} modal ${formatRp(price)}`,
        blocks: [
          {
            time: '00–03 dtk',
            stage: 'Hook Bukti Visual',
            spoken: `Modal ${formatRp(price)} buat ${productName}, beneran kepakai atau cuma bagus di foto? Kita tes langsung sekarang.`,
            visual: s2
          },
          {
            time: '03–10 dtk',
            stage: 'Peragaan Tanpa Potong',
            spoken: `Lihat sendiri pas dipakai langsung: ${b1.toLowerCase()}. Nggak pakai trik editan cepat, hasilnya memang serapi ini.`,
            visual: s1
          },
          {
            time: '10–19 dtk',
            stage: 'Detail Nilai Tambah',
            spoken: `Selain beresin urusan ${painPoint.slice(0, 48).toLowerCase()}, ${b2.toLowerCase()} jadi awet dipakai rutin.`,
            visual: `Putar ${productName} perlahan memperlihatkan material dan kelengkapan paket`
          },
          {
            time: '19–25 dtk',
            stage: 'Arahkan Klik Keranjang',
            spoken: `Kalau mau samaan persis kayak yang kupegang ini, etalase resminya sudah kutaruh di keranjang kiri bawah selagi stok aman.`,
            visual: s3
          }
        ]
      },
      {
        id: 'var-c',
        title: 'Sudut Hitungan Hemat & Voucher',
        duration: '18–23 detik',
        onScreenText: `Kenapa baru tahu barang sepraktis ini sekarang`,
        blocks: [
          {
            time: '00–03 dtk',
            stage: 'Hook Hitungan Hemat',
            spoken: `Kalau dibagi pemakaian berbulan-bulan, modal ${productName} ini jatuhnya cuma seribuan sehari tapi beresin banyak urusan.`,
            visual: s1
          },
          {
            time: '03–11 dtk',
            stage: 'Manfaat Inti Cepat',
            spoken: `Cocok banget buat ${audience.toLowerCase()}: pertama ${b1.toLowerCase()}, kedua ${b3.toLowerCase()}.`,
            visual: s2
          },
          {
            time: '11–18 dtk',
            stage: 'Jawab Keraguan Umum',
            spoken: `Bahannya juga nggak asal-asalan karena ${b2.toLowerCase()}.`,
            visual: `Ketuk atau perlihatkan bagian sambungan/material ${productName} dari jarak dekat`
          },
          {
            time: '18–23 dtk',
            stage: 'Pengingat Voucher Keranjang',
            spoken: `${promoHook}. Masukin keranjang kiri bawah dulu aja sekarang biar nggak hilang tokonya.`,
            visual: s3
          }
        ]
      }
    ];

    const cleanTag = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join('');

    const caption = `Solusi praktis buat yang sering ${painPoint.toLowerCase()}. ${productName} ini nyaman dipakai harian karena ${b1.toLowerCase()}. Cek pilihan varian dan vouchernya di keranjang bawah ya.`;
    const hashtags = `#${cleanTag || 'rekomendasibarang'} #racunbelanja #reviewjujur #barangbermanfaat #keranjangkuning`;
    const pinnedComment = `Yang cari persis seperti di video: klik keranjang kiri bawah lalu sesuaikan variannya ya. Kalau mau tanya ukuran atau cara pakai, tulis di komentar nanti kubantu jawab!`;

    const schedule30 = buildSchedule30(productName, price, painPoint, b1, b2, b3, postsPerDay);

    if (
      currentProject &&
      currentProject.productName &&
      currentProject.productName.toLowerCase() !== productName.toLowerCase()
    ) {
      pendingProjectId = makeProjectId();
    }

    step1Dirty = false;

    return {
      id: pendingProjectId || makeProjectId(),
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      presetId: isMatchingPresetProduct ? activePresetId : '',
      productName,
      platform,
      price,
      commissionPct,
      visualStyle,
      audience,
      promoHook,
      painPoint,
      benefits: [b1, b2, b3],
      postsPerDay,
      variations,
      caption,
      hashtags,
      pinnedComment,
      schedule30
    };
  }

  function buildSchedule30(productName, price, painPoint, b1, b2, b3, postsPerDay) {
    const slotText = resolvePostTimeSlot(postsPerDay);
    const hooksPool = [
      `Masih sering ${painPoint.toLowerCase()}? Lihat cara beresinnya dalam 10 detik.`,
      `Tes jujur ${productName} dipakai seharian tanpa jeda — beneran sesuai ekspektasi?`,
      `Modal ${formatRp(price)} dapat kelengkapan sebagus apa di paket ${productName}?`,
      `Tiga alasan kenapa ${productName} kepakai banget di rumah maupun dibawa kerja.`,
      `Menjawab pertanyaan paling sering di komentar soal daya tahan ${productName}.`,
      `Jangan salah pilih varian! Ini panduan singkat sebelum ambil ${productName}.`,
      `Bandingkan cara lama yang ribet vs pakai ${productName} yang ringkas.`,
      `Detail kecil di ${productName} yang jarang disadari tapi membantu banget: ${b2.toLowerCase()}.`,
      `Seberapa gampang merawat dan menyimpan ${productName} setelah dipakai?`,
      `Pengingat buat yang kemarin nunggu potongan ongkir ${productName}, cek keranjang hari ini.`
    ];

    const list = [];
    for (let d = 1; d <= 30; d++) {
      const pObj = DATA.calendarPillars[(d - 1) % DATA.calendarPillars.length];
      const hookIdea = hooksPool[(d - 1) % hooksPool.length];
      list.push({
        day: d,
        postTime: slotText,
        pillar: pObj ? pObj.pillar : 'Masalah & Solusi',
        hookIdea,
        visualCue: pObj ? pObj.visual : 'Rekam jarak dekat di cahaya alami terang',
        ctaLine: 'Cek ketersediaan varian dan potongan ongkir di akun masing-masing lewat keranjang bawah.'
      });
    }
    return list;
  }

  // Populate Preset Chips
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
        pendingProjectId = makeProjectId();
        activeVarIdx = 0;
        applyPresetToForm(p);
        renderPresetChips();
        showToast('Preset ' + p.label + ' dimuat');
      });
      grid.appendChild(btn);
    });
  }

  function applyPresetToForm(p) {
    if (!p) return;
    const prodInput = document.getElementById('prodName');
    prodInput.value = p.productName;
    prodInput.classList.remove('input-invalid');
    ensureSelectHasOption(document.getElementById('prodPlatform'), p.platform);
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodComm').value = p.commissionPct;
    ensureSelectHasOption(document.getElementById('prodVisualStyle'), p.visualStyle);
    document.getElementById('prodAudience').value = p.audience;
    document.getElementById('prodPromo').value = p.promoHook;
    document.getElementById('prodPain').value = p.painPoint;
    document.getElementById('prodBen1').value = p.benefits[0] || '';
    document.getElementById('prodBen2').value = p.benefits[1] || '';
    document.getElementById('prodBen3').value = p.benefits[2] || '';
    currentProject = buildProjectFromInputs();
  }

  function resetNewScriptWizard() {
    if (activeStep === 2) syncStep2Edits();
    activePresetId = '';
    pendingProjectId = makeProjectId();
    currentProject = null;
    activeVarIdx = 0;
    step1Dirty = true;

    const prodInput = document.getElementById('prodName');
    prodInput.value = '';
    prodInput.classList.remove('input-invalid');
    document.getElementById('prodPrice').value = '59000';
    document.getElementById('prodComm').value = '10';
    document.getElementById('prodAudience').value = '';
    document.getElementById('prodPromo').value = '';
    document.getElementById('prodPain').value = '';
    document.getElementById('prodBen1').value = '';
    document.getElementById('prodBen2').value = '';
    document.getElementById('prodBen3').value = '';

    renderPresetChips();
    switchView('wizard');
    activateStepDom(1);
    prodInput.focus();
    showToast('Siap meracik produk baru! Pilih preset atau ketik nama produkmu.');
  }

  // Step Navigation
  function goToStep(stepNum, { skipValidation = false } = {}) {
    if (activeStep === 2 && stepNum !== 2) {
      syncStep2Edits();
    }
    if (!skipValidation && stepNum > 1) {
      if (!validateStep1Product()) return false;
      if (!currentProject || step1Dirty) {
        currentProject = buildProjectFromInputs();
      }
    }

    activateStepDom(stepNum);

    if (stepNum === 2) {
      if (!currentProject) currentProject = buildProjectFromInputs();
      renderStep2Editor();
    } else if (stepNum === 3) {
      if (!currentProject) currentProject = buildProjectFromInputs();
      renderStep3PreviewAndAudit();
    }
    return true;
  }

  function renderStep2Editor() {
    const tabsWrap = document.getElementById('variationTabs');
    const blocksWrap = document.getElementById('scriptBlocksEditor');
    tabsWrap.innerHTML = '';

    currentProject.variations.forEach((v, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'var-tab' + (idx === activeVarIdx ? ' active' : '');
      btn.textContent = `Variasi ${idx + 1}: ${v.title}`;
      btn.addEventListener('click', () => {
        syncStep2Edits();
        activeVarIdx = idx;
        renderStep2Editor();
      });
      tabsWrap.appendChild(btn);
    });

    const activeVar = currentProject.variations[activeVarIdx] || currentProject.variations[0];
    blocksWrap.innerHTML = '';
    activeVar.blocks.forEach((b, bIdx) => {
      const div = document.createElement('div');
      div.className = 'script-block';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="badge">${escHtml(b.time)} • ${escHtml(b.stage)}</span>
        </div>
        <div class="field-group" style="margin-bottom:8px;">
          <label class="text-sm text-muted" for="block-spoken-${bIdx}">Kalimat Suara / Narasi:</label>
          <textarea id="block-spoken-${bIdx}" class="textarea block-spoken-input" data-bidx="${bIdx}" style="min-height:64px;"></textarea>
        </div>
        <div class="field-group">
          <label class="text-sm text-muted" for="block-visual-${bIdx}">Arahan Ambil Gambar (Shot):</label>
          <input id="block-visual-${bIdx}" class="input block-visual-input" data-bidx="${bIdx}" type="text" />
        </div>
      `;
      div.querySelector('.block-spoken-input').value = b.spoken;
      div.querySelector('.block-visual-input').value = b.visual;
      blocksWrap.appendChild(div);
    });

    document.getElementById('editCaption').value = currentProject.caption || '';
    document.getElementById('editHashtags').value = currentProject.hashtags || '';
    document.getElementById('editPinned').value = currentProject.pinnedComment || '';
    document.getElementById('scheduleFreqSelect').value = String(currentProject.postsPerDay || 2);

    renderCalendarPreview();
  }

  function syncStep2Edits() {
    if (!currentProject) return;
    const spokenInputs = document.querySelectorAll('.block-spoken-input');
    const visualInputs = document.querySelectorAll('.block-visual-input');
    const activeVar = currentProject.variations[activeVarIdx];
    if (activeVar && (spokenInputs.length > 0 || visualInputs.length > 0)) {
      spokenInputs.forEach((inp) => {
        const idx = Number(inp.dataset.bidx);
        if (activeVar.blocks[idx]) activeVar.blocks[idx].spoken = inp.value.trim();
      });
      visualInputs.forEach((inp) => {
        const idx = Number(inp.dataset.bidx);
        if (activeVar.blocks[idx]) activeVar.blocks[idx].visual = inp.value.trim();
      });
    }
    if (activeStep === 2) {
      const capEl = document.getElementById('editCaption');
      const hashEl = document.getElementById('editHashtags');
      const pinEl = document.getElementById('editPinned');
      if (capEl) currentProject.caption = capEl.value.trim();
      if (hashEl) currentProject.hashtags = hashEl.value.trim();
      if (pinEl) currentProject.pinnedComment = pinEl.value.trim();
    }
  }

  function renderCalendarPreview() {
    const wrap = document.getElementById('calendarPreviewList');
    if (!wrap || !currentProject) return;
    wrap.innerHTML = '';
    currentProject.schedule30.forEach((row) => {
      const el = document.createElement('div');
      el.className = 'calendar-item';
      el.innerHTML = `
        <div>
          <span class="badge">HARI ${escHtml(String(row.day).padStart(2, '0'))}</span>
          <div class="text-muted" style="font-size:12px; margin-top:6px;">${escHtml(row.postTime)}</div>
        </div>
        <div>
          <div style="font-weight:700; font-size:14px;">${escHtml(row.pillar)}</div>
          <p class="text-sm" style="margin-top:3px;">"${escHtml(row.hookIdea)}"</p>
          <p class="text-muted" style="font-size:12px; margin-top:4px;">Visual: ${escHtml(row.visualCue)}</p>
        </div>
      `;
      wrap.appendChild(el);
    });
  }

  function renderStep3PreviewAndAudit() {
    const v = currentProject.variations[activeVarIdx] || currentProject.variations[0];
    const commRp = Math.round(currentProject.price * (currentProject.commissionPct / 100));

    document.getElementById('prevProdTitle').textContent = currentProject.productName;
    document.getElementById('prevProdMeta').textContent = `${formatRp(currentProject.price)} • Komisi ${formatRp(commRp)}/pcs • ${v.title}`;

    const blocksWrap = document.getElementById('prevCueBlocks');
    blocksWrap.innerHTML = '';
    v.blocks.forEach((b) => {
      const row = document.createElement('div');
      row.className = 'cue-row';
      row.innerHTML = `
        <div class="text-caption" style="color: var(--color-deep-teal);">${escHtml(b.time)} • ${escHtml(b.stage)}</div>
        <p style="font-weight:700; font-size:15px; margin-top:5px;">"${escHtml(b.spoken)}"</p>
        <p class="text-sm text-muted" style="margin-top:5px;">Kamera: ${escHtml(b.visual)}</p>
      `;
      blocksWrap.appendChild(row);
    });

    const ostRow = document.createElement('div');
    ostRow.className = 'card-mist';
    ostRow.style.padding = '14px 16px';
    ostRow.innerHTML = `
      <div class="text-caption">TEKS LAYAR &amp; KOMENTAR SEMATAN</div>
      <p class="text-sm" style="margin-top:4px;"><strong>Teks Layar:</strong> ${escHtml(v.onScreenText || '-')}</p>
      <p class="text-sm" style="margin-top:4px;"><strong>Pinned:</strong> ${escHtml(currentProject.pinnedComment || '-')}</p>
    `;
    blocksWrap.appendChild(ostRow);

    // 8-Point Affiliate Script & Safety Audit
    const fullText = v.blocks.map((b) => b.spoken).join(' ') + ' ' + (currentProject.caption || '');
    const lower = fullText.toLowerCase();
    const hasRiskyWord = DATA.safeWords.some((rule) => lower.includes(rule.bad));
    const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

    const checks = [
      { ok: Boolean(v.blocks[0] && v.blocks[0].spoken.length >= 25), label: 'Hook 3 detik pertama langsung menyentuh masalah atau rasa penasaran pembeli' },
      { ok: wordCount >= 40 && wordCount <= 190, label: 'Panjang kalimat narasi ideal untuk durasi tonton 18–30 detik' },
      { ok: v.blocks.every((b) => b.visual && b.visual.length >= 10), label: 'Setiap blok detik memiliki arahan pengambilan gambar (shot list) jelas' },
      { ok: !hasRiskyWord, label: 'Bebas frasa klaim medis mutlak atau pengalihan transaksi luar aplikasi' },
      { ok: lower.includes('keranjang'), label: 'Memiliki ajakan klik keranjang yang natural tanpa terdengar memaksa' },
      { ok: Boolean(v.onScreenText && v.onScreenText.length >= 8), label: 'Dilengkapi teks layar singkat untuk penonton yang mematikan suara HP' },
      { ok: Boolean(currentProject.pinnedComment && currentProject.pinnedComment.length >= 15), label: 'Memiliki draf komentar sematan pancingan diskusi ukuran/varian' },
      { ok: Boolean(currentProject.schedule30 && currentProject.schedule30.length === 30), label: 'Rencana rotasi sudut konten 30 hari siap dijalankan' }
    ];

    const passed = checks.filter((c) => c.ok).length;
    const pct = Math.round((passed / checks.length) * 100);
    document.getElementById('hookScorePct').textContent = pct + '%';
    document.getElementById('hookScoreFill').style.width = pct + '%';

    const checkWrap = document.getElementById('hookChecklist');
    checkWrap.innerHTML = '';
    checks.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'check-item';
      item.innerHTML = `
        <span class="check-dot ${c.ok ? 'ok' : 'warn'}">${c.ok ? 'OK' : '!'}</span>
        <span>${escHtml(c.label)}</span>
      `;
      checkWrap.appendChild(item);
    });
  }

  // Monthly Commission Calculator
  function updateCommissionCalc() {
    const tEl = document.getElementById('calcTargetIncome');
    const pEl = document.getElementById('calcAvgPrice');
    const cEl = document.getElementById('calcCommPct');
    const vEl = document.getElementById('calcVideosDay');

    const rawT = tEl.value.trim();
    const rawP = pEl.value.trim();
    const rawC = cEl.value.trim();
    const rawV = vEl.value.trim();

    const parsedT = rawT !== '' && Number.isFinite(Number(rawT)) ? Number(rawT) : 6000000;
    const parsedP = rawP !== '' && Number.isFinite(Number(rawP)) ? Number(rawP) : 75000;
    const parsedC = rawC !== '' && Number.isFinite(Number(rawC)) ? Number(rawC) : 11;
    const parsedV = rawV !== '' && Number.isFinite(Number(rawV)) ? Number(rawV) : 2;

    if (rawT !== '' && parsedT < 0) tEl.value = '0';
    if (rawP !== '' && parsedP < 0) pEl.value = '0';
    if (rawC !== '' && parsedC < 0) cEl.value = '0';

    const target = Math.max(0, parsedT);
    const avgPrice = Math.max(0, parsedP);
    const commPct = Math.min(60, Math.max(0, parsedC));
    const vidsDay = Math.max(1, parsedV);

    const perItem = Math.max(0, Math.round(avgPrice * (commPct / 100)));
    const monthlyItems = perItem > 0 ? Math.ceil(target / perItem) : 0;
    const dailyItems = monthlyItems > 0 ? Math.ceil(monthlyItems / 30) : 0;
    const monthlyVideos = vidsDay * 30;
    const ordersPerVidSlot = dailyItems > 0 ? Math.max(1, Math.ceil(dailyItems / vidsDay)) : 0;

    document.getElementById('calcResPerItem').textContent = formatRp(perItem);
    document.getElementById('calcResDailySales').textContent = `${dailyItems} pcs / hari`;
    document.getElementById('calcResMonthlySales').textContent = `Total ${monthlyItems} pcs selama 30 hari penuh.`;
    document.getElementById('calcResRhythm').textContent = `${monthlyVideos} Video / Bulan`;
    document.getElementById('calcAdviceText').textContent =
      perItem > 0
        ? `Dengan ritme ${vidsDay} video/hari, rata-rata butuh sekitar ${ordersPerVidSlot} pesanan per slot upload harian untuk menembus ${formatRp(target)}/bulan.`
        : 'Masukkan harga barang dan persentase komisi di atas 0% untuk melihat target pesanan harianmu.';

    state.targetIncome = target;
    document.getElementById('statTargetRp').textContent = formatCompactRp(target);
    saveState();
  }

  // Save Project to History
  function saveCurrentProjectToHistory(silent) {
    if (!validateStep1Product()) return false;
    if (activeStep === 2) syncStep2Edits();
    if (!currentProject || step1Dirty) {
      currentProject = buildProjectFromInputs();
    }
    const copy = JSON.parse(JSON.stringify(currentProject));
    const existingIdx = state.projects.findIndex((p) => p.id === copy.id);
    if (existingIdx >= 0) {
      state.projects.splice(existingIdx, 1);
    }
    state.projects.unshift(copy);
    saveState();
    updateStatsAndBadges();
    renderHistoryList();
    if (!silent) showToast('Proyek disimpan ke Riwayat Studio');
    return true;
  }

  function recordExport() {
    saveCurrentProjectToHistory(true);
    state.exportsCount = (state.exportsCount || 0) + 1;
    saveState();
    updateStatsAndBadges();
  }

  // Safe-Word Scanner & Teleprompter
  function runSafeScan() {
    const input = document.getElementById('safeCheckInput').value;
    const box = document.getElementById('safeScanResult');
    const lower = input.toLowerCase();
    const hits = DATA.safeWords.filter((r) => lower.includes(r.bad));

    if (!input.trim()) {
      box.className = 'card-mist';
      box.innerHTML =
        '<strong style="font-size:14px;">Kotak Teks Masih Kosong</strong><p class="text-sm" style="margin-top:4px;">Masukkan draf narasi atau klik Muat Contoh Rawan di kanan atas.</p>';
      return;
    }

    if (hits.length === 0) {
      box.className = 'card-mist';
      box.innerHTML =
        '<strong style="font-size:14px;">Aman — 0 Frasa Berisiko Terdeteksi</strong><p class="text-sm" style="margin-top:4px;">Naskah ini tidak mengandung kata klaim mutlak atau pengalihan transaksi luar aplikasi. Siap dibaca di Teleprompter sebelah kanan.</p>';
    } else {
      box.className = 'card-blush';
      const listHtml = hits
        .map(
          (h) => `<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(27,27,27,0.12); font-size:13px;">
            <strong>Hindari: "${escHtml(h.bad)}"</strong> — ${escHtml(h.reason)}.<br/>
            <span>Saran aman: <em>"${escHtml(h.safe)}"</em></span>
          </div>`
        )
        .join('');
      box.innerHTML = `<strong style="font-size:14px;">Ditemukan ${hits.length} Frasa Rawan Pembatasan Trafik</strong>${listHtml}`;
    }
    syncTeleprompterStage(input);
  }

  function autoFixSafeText() {
    let text = document.getElementById('safeCheckInput').value;
    if (!text.trim()) return;
    DATA.safeWords.forEach((r) => {
      const regex = new RegExp(r.bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      text = text.replace(regex, r.safe);
    });
    document.getElementById('safeCheckInput').value = text;
    runSafeScan();
    showToast('Seluruh frasa rawan telah diganti ke kalimat aman');
  }

  function syncTeleprompterStage(text) {
    const stage = document.getElementById('teleprompterStage');
    if (!stage) return;
    const clean =
      (text || '').trim() ||
      'Belum ada naskah aktif. Buka Wizard Skrip atau ketik naskah di panel sebelah kiri untuk mulai membaca di depan kamera.';
    stage.innerHTML = clean
      .split(/\n+/)
      .map((p) => `<p style="margin-bottom: 18px;">${escHtml(p)}</p>`)
      .join('');
  }

  // Library 120 Items
  function renderLibraryCategoryPills() {
    const wrap = document.getElementById('libCategoryPills');
    if (!wrap) return;
    const map = new Map();
    map.set('ALL', 'Semua (120)');
    DATA.library.forEach((it) => {
      if (!map.has(it.category)) map.set(it.category, it.shortCategory || it.category);
    });

    wrap.innerHTML = '';
    map.forEach((shortName, fullCat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-pill' + (activeLibCategory === fullCat ? ' active' : '');
      btn.textContent = shortName;
      btn.addEventListener('click', () => {
        activeLibCategory = fullCat;
        renderLibraryCategoryPills();
        renderLibraryGrid();
      });
      wrap.appendChild(btn);
    });
  }

  function attachCardA11yOpen(card, item) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (e) => {
      if (e.target.closest('.unfav-card-btn')) return;
      openLibModal(item);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('.unfav-card-btn')) return;
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
        const hay = `${it.title} ${it.scriptText} ${it.visualCue} ${it.niche} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    info.textContent = `Menampilkan ${filtered.length} dari ${DATA.library.length} koleksi siap pakai`;
    if (filtered.length === 0) {
      grid.innerHTML =
        '<div class="card" style="grid-column: 1 / -1;"><p class="text-sm text-muted">Tidak ada koleksi yang cocok dengan kata kunci tersebut. Coba pilih Semua Kategori Barang.</p></div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach((item) => {
      const isFav = state.favorites.includes(item.id);
      const snippet = item.scriptText.slice(0, 125) + (item.scriptText.length > 125 ? '...' : '');
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span class="badge">${escHtml(item.shortCategory)}</span>
            <span class="badge badge-outline">${escHtml(item.niche)}</span>
          </div>
          <h3 style="font-size:17px; font-weight:700; margin-top:12px;">${escHtml(item.title)}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">"${escHtml(snippet)}"</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--color-hairline); font-size:13px; font-weight:700;">
          <span style="color: var(--color-deep-teal);">Buka Detail &amp; Pakai</span>
          <span>${isFav ? 'Tersimpan' : 'Detail'}</span>
        </div>
      `;
      attachCardA11yOpen(card, item);
      grid.appendChild(card);
    });
  }

  function openLibModal(item) {
    activeModalItem = item;
    document.getElementById('modalCategoryBadge').textContent = item.shortCategory || item.category;
    document.getElementById('modalNicheBadge').textContent = item.niche;
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalScriptText').textContent = item.scriptText;
    document.getElementById('modalVisualCue').textContent = item.visualCue;
    document.getElementById('modalProTip').textContent = item.proTip;

    const favBtn = document.getElementById('modalToggleFavBtn');
    favBtn.textContent = state.favorites.includes(item.id) ? 'Hapus dari Favorit' : 'Simpan ke Favorit';

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
      grid.innerHTML =
        '<div class="card" style="grid-column: 1 / -1;"><p class="text-sm text-muted">Belum ada hook atau rumus skrip yang ditandai favorit. Buka menu Pustaka 120 Hook lalu klik Simpan ke Favorit pada kartu pilihanmu.</p></div>';
      return;
    }
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <span class="badge">${escHtml(item.shortCategory)}</span>
          <h3 style="font-size:17px; font-weight:700; margin-top:12px;">${escHtml(item.title)}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">"${escHtml(item.scriptText)}"</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding-top:10px; border-top:1px solid var(--color-hairline);">
          <span style="font-size:13px; font-weight:700; color: var(--color-deep-teal);">Buka Detail</span>
          <button type="button" class="btn btn-ghost unfav-card-btn" style="padding:5px 10px; font-size:12px;">Hapus Favorit</button>
        </div>
      `;
      card.querySelector('.unfav-card-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.favorites = state.favorites.filter((fid) => fid !== item.id);
        saveState();
        updateStatsAndBadges();
        renderFavoritesGrid();
        renderLibraryGrid();
        showToast('Dihapus dari Koleksi Favorit');
      });
      attachCardA11yOpen(card, item);
      grid.appendChild(card);
    });
  }

  function renderHistoryList() {
    const wrap = document.getElementById('historyListContainer');
    const clearBtn = document.getElementById('clearAllHistoryBtn');
    if (!wrap) return;
    if (clearBtn) clearBtn.style.display = state.projects.length > 0 ? 'inline-flex' : 'none';

    if (state.projects.length === 0) {
      wrap.innerHTML =
        '<div class="card"><p class="text-sm text-muted">Belum ada proyek skrip yang disimpan. Buat skrip pertamamu di menu Wizard Skrip &amp; 30 Hari.</p></div>';
      return;
    }
    wrap.innerHTML = '';
    state.projects.forEach((proj) => {
      const commRp = Math.round((Number(proj.price) || 0) * ((Number(proj.commissionPct) || 0) / 100));
      const div = document.createElement('div');
      div.className = 'card';
      div.style.padding = '22px 24px';
      div.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:14px;">
          <div>
            <span class="badge">${escHtml(proj.platform)}</span>
            <span class="badge badge-outline" style="margin-left:6px;">${escHtml(proj.createdAt || 'Tersimpan')}</span>
            <h3 class="heading-card" style="margin-top:10px;">${escHtml(proj.productName)}</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">Harga ${formatRp(proj.price)} • Komisi ${escHtml(proj.commissionPct)}% (${formatRp(commRp)}/pcs) • ${escHtml(proj.postsPerDay || 2)} Video/Hari</p>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button type="button" class="btn btn-primary open-hist-btn" data-id="${escHtml(proj.id)}">Buka di Wizard</button>
            <button type="button" class="btn btn-secondary pdf-hist-btn" data-id="${escHtml(proj.id)}">Unduh PDF Skrip</button>
            <button type="button" class="btn btn-ghost del-hist-btn" data-id="${escHtml(proj.id)}">Hapus</button>
          </div>
        </div>
      `;
      div.querySelector('.open-hist-btn').addEventListener('click', () => {
        currentProject = JSON.parse(JSON.stringify(proj));
        pendingProjectId = currentProject.id;
        activePresetId = proj.presetId || '';
        activeVarIdx = 0;
        step1Dirty = false;

        const prodInput = document.getElementById('prodName');
        prodInput.value = proj.productName || '';
        prodInput.classList.remove('input-invalid');
        ensureSelectHasOption(document.getElementById('prodPlatform'), proj.platform);
        document.getElementById('prodPrice').value = proj.price;
        document.getElementById('prodComm').value = proj.commissionPct;
        ensureSelectHasOption(document.getElementById('prodVisualStyle'), proj.visualStyle);
        document.getElementById('prodAudience').value = proj.audience || '';
        document.getElementById('prodPromo').value = proj.promoHook || '';
        document.getElementById('prodPain').value = proj.painPoint || '';
        document.getElementById('prodBen1').value = (proj.benefits && proj.benefits[0]) || '';
        document.getElementById('prodBen2').value = (proj.benefits && proj.benefits[1]) || '';
        document.getElementById('prodBen3').value = (proj.benefits && proj.benefits[2]) || '';
        document.getElementById('scheduleFreqSelect').value = String(proj.postsPerDay || 2);

        renderPresetChips();
        switchView('wizard');
        goToStep(3, { skipValidation: true });
        showToast('Proyek dimuat lengkap kembali ke Wizard');
      });
      div.querySelector('.pdf-hist-btn').addEventListener('click', () => {
        window.KomisiKlipExporter.exportScriptSheetPdf(proj, state.creator);
        showToast('Lembar Syuting PDF diunduh');
      });
      div.querySelector('.del-hist-btn').addEventListener('click', () => {
        if (!window.confirm(`Hapus proyek "${proj.productName}" dari Riwayat Studio?`)) return;
        state.projects = state.projects.filter((p) => p.id !== proj.id);
        saveState();
        updateStatsAndBadges();
        renderHistoryList();
        showToast('Proyek dihapus dari riwayat');
      });
      wrap.appendChild(div);
    });
  }

  function switchView(viewName) {
    if (viewName !== 'teleprompter') {
      pauseTeleprompter();
    }
    closeMobileDrawer();
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

  function updateStatsAndBadges() {
    document.getElementById('statProjects').textContent = String(state.projects.length);
    document.getElementById('statExports').textContent = String(state.exportsCount || 0);
    document.getElementById('statFavs').textContent = String(state.favorites.length);
    document.getElementById('statTargetRp').textContent = formatCompactRp(state.targetIncome || 6000000);
    document.getElementById('historyBadge').textContent = String(state.projects.length);
    document.getElementById('favBadge').textContent = String(state.favorites.length);

    const firstName = (state.creator.name || 'Kreator').split(' ')[0];
    document.getElementById('greetName').textContent = firstName;
    document.getElementById('sidebarUserName').textContent = state.creator.name || 'Kreator Affiliate';
    document.getElementById('sidebarUserHandle').textContent = state.creator.handle || '@kreator';

    document.getElementById('setCreatorName').value = state.creator.name || '';
    document.getElementById('setCreatorHandle').value = state.creator.handle || '';
    document.getElementById('setCreatorEmail').value = state.creator.email || '';
    document.getElementById('setDefaultHours').value = state.creator.defaultHours || '11:30 WIB & 19:30 WIB';
  }

  function performLogout() {
    pauseTeleprompter();
    closeMobileDrawer();
    state.creator.loggedIn = false;
    state.creator.validHash = '';
    saveState();
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
  }

  function enterStudio() {
    if (!isValidCreatorSession(state.creator)) {
      performLogout();
      return;
    }
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    applyTheme(state.creator.theme || 'light');
    renderPresetChips();
    if (!wizardInitializedOnce && DATA.presets[0]) {
      wizardInitializedOnce = true;
      activePresetId = DATA.presets[0].id;
      pendingProjectId = makeProjectId();
      applyPresetToForm(DATA.presets[0]);
      renderPresetChips();
    }
    updateCommissionCalc();
    renderLibraryCategoryPills();
    renderLibraryGrid();
    renderFavoritesGrid();
    renderHistoryList();
    updateStatsAndBadges();

    // Preload teleprompter with active script if empty
    if (
      currentProject &&
      currentProject.variations[0] &&
      !document.getElementById('safeCheckInput').value.trim()
    ) {
      const sampleScript = currentProject.variations[0].blocks
        .map((b) => `[${b.time}] ${b.spoken}`)
        .join('\n\n');
      document.getElementById('safeCheckInput').value = sampleScript;
      syncTeleprompterStage(sampleScript);
    }
  }

  // Event Listeners
  function bindEvents() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const rawName = document.getElementById('loginName').value.trim();
      const rawHandle = document.getElementById('loginHandle').value.trim();
      const rawEmail = document.getElementById('loginEmail').value.trim();
      const rawCode = document.getElementById('loginCode').value.trim().toUpperCase();
      const errEl = document.getElementById('loginError');

      const digest = rawCode ? hashAccessCode(rawCode) : '';
      const isDevAgent = DEV_AGENT_HASHES.has(digest);
      const isCreator = digest === CREATOR_MASTER_HASH || isDevAgent;

      if (!isCreator) {
        if (!rawName) {
          errEl.textContent = 'Isi dulu nama panggilan kreatormu ya.';
          errEl.classList.remove('hidden');
          document.getElementById('loginName').focus();
          return;
        }
        if (!rawHandle) {
          errEl.textContent = 'Isi dulu username akun TikTok atau Shopee kamu ya.';
          errEl.classList.remove('hidden');
          document.getElementById('loginHandle').focus();
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
          errEl.textContent = 'Masukkan alamat email yang benar (contoh: nama@email.com).';
          errEl.classList.remove('hidden');
          document.getElementById('loginEmail').focus();
          return;
        }
        if (digest !== OFFICIAL_BUYER_HASH) {
          errEl.textContent =
            'Kode akses tidak sesuai. Pastikan kamu memasukkan kode resmi dari bukti pembelian ya.';
          errEl.classList.remove('hidden');
          document.getElementById('loginCode').focus();
          return;
        }
      }

      const finalName = rawName || (isDevAgent ? 'Tim Developer' : 'Nifari');
      const baseHandle = rawHandle || (isDevAgent ? '@dev.komisiklip' : '@nifari.official');
      const finalHandle = baseHandle.startsWith('@') ? baseHandle : '@' + baseHandle;
      const finalEmail = rawEmail || (isDevAgent ? 'dev@komisiklip.id' : 'creator@nifari.id');

      errEl.classList.add('hidden');
      document.getElementById('loginCode').value = '';

      state.creator = {
        ...state.creator,
        loggedIn: true,
        name: finalName,
        handle: finalHandle,
        email: finalEmail,
        validHash: digest
      };
      delete state.creator.license;
      saveState();
      enterStudio();
      showToast('Selamat datang di KomisiKlip Studio, ' + finalName.split(' ')[0]);
    });

    document.getElementById('logoutBtn').addEventListener('click', performLogout);
    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
    if (settingsLogoutBtn) settingsLogoutBtn.addEventListener('click', performLogout);

    // Mobile Drawer & Topbar Actions
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeDrawerBtn = document.getElementById('closeMobileDrawerBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const mobileFavBtn = document.getElementById('mobileFavBtn');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeMobileDrawer);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileDrawer);
    if (mobileFavBtn) mobileFavBtn.addEventListener('click', () => switchView('favorites'));

    const toggleThemeHandler = () => applyTheme(state.creator.theme === 'dark' ? 'light' : 'dark');
    document.getElementById('themeToggleBtn').addEventListener('click', toggleThemeHandler);
    document.getElementById('mobileThemeBtn').addEventListener('click', toggleThemeHandler);
    document.getElementById('settingsThemeBtn').addEventListener('click', toggleThemeHandler);
    document.getElementById('mobileSettingsBtn').addEventListener('click', () => switchView('settings'));

    document.querySelectorAll('.nav-btn, .mob-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.querySelectorAll('.jump-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.target));
    });

    document.getElementById('heroStartWizardBtn').addEventListener('click', () => {
      pendingProjectId = makeProjectId();
      switchView('wizard');
      activateStepDom(1);
    });

    const newScriptBtn = document.getElementById('newScriptBtn');
    if (newScriptBtn) {
      newScriptBtn.addEventListener('click', resetNewScriptWizard);
    }

    // Track Step 1 dirty state & custom product detachment from preset shots
    const step1FieldIds = [
      'prodName',
      'prodPlatform',
      'prodPrice',
      'prodComm',
      'prodVisualStyle',
      'prodAudience',
      'prodPromo',
      'prodPain',
      'prodBen1',
      'prodBen2',
      'prodBen3'
    ];
    step1FieldIds.forEach((fid) => {
      const inp = document.getElementById(fid);
      if (!inp) return;
      const markDirty = () => {
        step1Dirty = true;
        if (fid === 'prodName') {
          const val = inp.value.trim();
          if (val) inp.classList.remove('input-invalid');
          const activePreset = DATA.presets.find((p) => p.id === activePresetId);
          if (
            activePreset &&
            val.toLowerCase() !== String(activePreset.productName || '').trim().toLowerCase()
          ) {
            activePresetId = '';
            renderPresetChips();
          }
          if (
            currentProject &&
            val &&
            val.toLowerCase() !== String(currentProject.productName || '').trim().toLowerCase()
          ) {
            pendingProjectId = makeProjectId();
          }
        }
      };
      inp.addEventListener('input', markDirty);
      inp.addEventListener('change', markDirty);
    });

    // Commission Calculator
    ['calcTargetIncome', 'calcAvgPrice', 'calcCommPct', 'calcVideosDay'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateCommissionCalc);
      document.getElementById(id).addEventListener('change', updateCommissionCalc);
    });

    document.getElementById('applyCalcToWizardBtn').addEventListener('click', () => {
      document.getElementById('prodPrice').value = document.getElementById('calcAvgPrice').value;
      document.getElementById('prodComm').value = document.getElementById('calcCommPct').value;
      document.getElementById('scheduleFreqSelect').value = document.getElementById('calcVideosDay').value;
      step1Dirty = true;
      if (document.getElementById('prodName').value.trim()) {
        currentProject = buildProjectFromInputs();
      }
      switchView('wizard');
      activateStepDom(1);
      showToast('Target harga, komisi & frekuensi harian diterapkan ke Wizard');
    });

    // Wizard Steps — do NOT wipe Step 2 script edits when clicking between tabs!
    document.querySelectorAll('.step-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const s = Number(tab.dataset.step);
        goToStep(s);
      });
    });

    document.getElementById('toStep2Btn').addEventListener('click', () => {
      if (!validateStep1Product()) return;
      currentProject = buildProjectFromInputs();
      goToStep(2, { skipValidation: true });
    });
    document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));
    document.getElementById('toStep3Btn').addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep2Btn').addEventListener('click', () => goToStep(2));

    document.getElementById('scheduleFreqSelect').addEventListener('change', () => {
      if (!currentProject) {
        if (!validateStep1Product()) return;
        currentProject = buildProjectFromInputs();
      }
      const freq = Number(document.getElementById('scheduleFreqSelect').value) || 2;
      currentProject.postsPerDay = freq;
      currentProject.schedule30 = buildSchedule30(
        currentProject.productName,
        currentProject.price,
        currentProject.painPoint,
        currentProject.benefits[0],
        currentProject.benefits[1],
        currentProject.benefits[2],
        freq
      );
      renderCalendarPreview();
    });

    document.getElementById('saveProjectBtn').addEventListener('click', () => saveCurrentProjectToHistory(false));

    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');
    if (clearAllHistoryBtn) {
      clearAllHistoryBtn.addEventListener('click', () => {
        if (state.projects.length === 0) {
          showToast('Riwayat proyek sudah kosong');
          return;
        }
        if (!window.confirm('Bersihkan seluruh riwayat proyek skrip di perangkat ini?')) return;
        state.projects = [];
        saveState();
        updateStatsAndBadges();
        renderHistoryList();
        showToast('Seluruh riwayat proyek berhasil dibersihkan');
      });
    }

    document.getElementById('sendToTeleprompterBtn').addEventListener('click', () => {
      syncStep2Edits();
      const v = currentProject.variations[activeVarIdx] || currentProject.variations[0];
      const text = v.blocks.map((b) => `[${b.time}] ${b.spoken}`).join('\n\n');
      document.getElementById('safeCheckInput').value = text;
      syncTeleprompterStage(text);
      switchView('teleprompter');
      showToast('Naskah dikirim ke Layar Teleprompter');
    });

    // 4 File Exports
    document.getElementById('dlScriptPdfBtn').addEventListener('click', () => {
      if (!validateStep1Product()) return;
      if (activeStep === 2) syncStep2Edits();
      if (!currentProject || step1Dirty) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportScriptSheetPdf(currentProject, state.creator);
      recordExport();
      showToast('Lembar Syuting 3 Variasi (.PDF) berhasil diunduh');
    });

    document.getElementById('dlCuePngBtn').addEventListener('click', async () => {
      if (!validateStep1Product()) return;
      if (activeStep === 2) syncStep2Edits();
      if (!currentProject || step1Dirty) currentProject = buildProjectFromInputs();
      await window.KomisiKlipExporter.exportCueCardPng(currentProject, state.creator, activeVarIdx);
      recordExport();
      showToast('Kartu Contekan HP 9:16 (.PNG) berhasil diunduh');
    });

    document.getElementById('dlCalendarPdfBtn').addEventListener('click', () => {
      if (!validateStep1Product()) return;
      if (activeStep === 2) syncStep2Edits();
      if (!currentProject || step1Dirty) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportCalendarPdf(currentProject, state.creator);
      recordExport();
      showToast('Kalender Konten 30 Hari (.PDF) berhasil diunduh');
    });

    document.getElementById('dlScheduleCsvBtn').addEventListener('click', () => {
      if (!validateStep1Product()) return;
      if (activeStep === 2) syncStep2Edits();
      if (!currentProject || step1Dirty) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportScheduleCsv(currentProject, state.creator);
      recordExport();
      showToast('Tabel Jadwal & Pelacak Komisi (.CSV) berhasil diunduh');
    });

    document.getElementById('copyAiPromptBtn').addEventListener('click', () => {
      if (!validateStep1Product()) return;
      if (!currentProject || step1Dirty) currentProject = buildProjectFromInputs();
      const promptText = `Saya sedang mempromosikan produk affiliate "${currentProject.productName}" (harga ${formatRp(currentProject.price)}) untuk target "${currentProject.audience}". Masalah utama pembeli: "${currentProject.painPoint}". Tolong buatkan 5 sudut pandang video pendek 20 detik baru dalam bahasa Indonesia ngobrol sehari-hari yang aman dari klaim berlebihan, lengkap kalimat pembuka 3 detik dan ide visual tanpa wajah.`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText);
      }
      showToast('Prompt riset produk disalin ke papan klip');
    });

    // Safe Scanner & Teleprompter Controls
    document.getElementById('fillRiskySampleBtn').addEventListener('click', () => {
      document.getElementById('safeCheckInput').value =
        'Serum ini obat jerawat ampuh yang memutihkan kulit instan dan pasti sembuh 100% permanen dalam semalam! Dijamin paling murah se-Indonesia, buruan order lewat WA dan transfer langsung sekarang ya!';
      runSafeScan();
    });

    document.getElementById('runSafeScanBtn').addEventListener('click', runSafeScan);
    document.getElementById('autoFixSafeBtn').addEventListener('click', autoFixSafeText);
    document.getElementById('safeCheckInput').addEventListener('input', (e) => syncTeleprompterStage(e.target.value));

    document.getElementById('tpPlayPauseBtn').addEventListener('click', () => {
      const btn = document.getElementById('tpPlayPauseBtn');
      const stage = document.getElementById('teleprompterStage');
      if (tpTimer) {
        pauseTeleprompter();
      } else {
        btn.textContent = 'Jeda Gulir';
        tpTimer = setInterval(() => {
          const speed = Number(document.getElementById('tpSpeed').value) || 2;
          stage.scrollTop += speed;
          if (stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 2) {
            pauseTeleprompter();
          }
        }, 45);
      }
    });

    document.getElementById('tpResetBtn').addEventListener('click', () => {
      document.getElementById('teleprompterStage').scrollTop = 0;
    });

    document.getElementById('tpMirrorBtn').addEventListener('click', () => {
      document.getElementById('teleprompterStage').classList.toggle('mirrored');
    });

    document.getElementById('tpFontSize').addEventListener('change', (e) => {
      document.getElementById('teleprompterStage').style.fontSize = e.target.value + 'px';
    });

    // Library Filters & Modal
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
        const sb = document.getElementById('appSidebar');
        if (sb && sb.classList.contains('open')) {
          closeMobileDrawer();
        }
      }
    });

    document.getElementById('modalCopyBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(activeModalItem.scriptText);
      }
      showToast('Kalimat disalin ke papan klip');
    });

    document.getElementById('modalApplyWizardBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      if (!currentProject) {
        if (!validateStep1Product()) {
          closeLibModal();
          switchView('wizard');
          return;
        }
        currentProject = buildProjectFromInputs();
      }
      currentProject.variations[activeVarIdx].blocks[0].spoken = activeModalItem.scriptText;
      currentProject.variations[activeVarIdx].blocks[0].visual = activeModalItem.visualCue;
      closeLibModal();
      switchView('wizard');
      goToStep(2, { skipValidation: true });
      showToast('Ditempel ke Hook Pembuka di Wizard');
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
        showToast('Disimpan ke Koleksi Favorit');
      }
      saveState();
      updateStatsAndBadges();
      renderLibraryGrid();
      renderFavoritesGrid();
    });

    // Settings & Backup
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      state.creator.name = document.getElementById('setCreatorName').value.trim() || state.creator.name;
      const h = document.getElementById('setCreatorHandle').value.trim() || state.creator.handle;
      state.creator.handle = h.startsWith('@') ? h : '@' + h;
      state.creator.email = document.getElementById('setCreatorEmail').value.trim() || state.creator.email;
      state.creator.defaultHours =
        document.getElementById('setDefaultHours').value.trim() || '11:30 WIB & 19:30 WIB';

      if (currentProject) {
        currentProject.schedule30 = buildSchedule30(
          currentProject.productName,
          currentProject.price,
          currentProject.painPoint,
          currentProject.benefits[0],
          currentProject.benefits[1],
          currentProject.benefits[2],
          currentProject.postsPerDay || 2
        );
        renderCalendarPreview();
      }

      saveState();
      updateStatsAndBadges();
      showToast('Profil & jam upload kreator berhasil diperbarui');
    });

    document.getElementById('exportBackupBtn').addEventListener('click', () => {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        creator: {
          name: state.creator.name,
          handle: state.creator.handle,
          email: state.creator.email,
          defaultHours: state.creator.defaultHours,
          theme: state.creator.theme
        },
        projects: state.projects,
        favorites: state.favorites,
        exportsCount: state.exportsCount,
        targetIncome: state.targetIncome
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cadangan-KomisiKlip-Studio.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showToast('File cadangan JSON berhasil diunduh');
    });

    document.getElementById('importBackupInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (!isValidCreatorSession(state.creator)) {
        showToast('Masuk dulu dengan kode akses resmi sebelum memulihkan cadangan.');
        return;
      }
      const verifiedHash = state.creator.validHash;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          if (parsed && typeof parsed === 'object') {
            const incomingCreator = parsed.creator && typeof parsed.creator === 'object' ? parsed.creator : {};
            const restoredCreator = {
              ...defaultCreator,
              name: String(incomingCreator.name || state.creator.name || 'Kreator'),
              handle: String(incomingCreator.handle || state.creator.handle || '@kreator'),
              email: String(incomingCreator.email || state.creator.email || ''),
              defaultHours: String(
                incomingCreator.defaultHours || state.creator.defaultHours || '11:30 WIB & 19:30 WIB'
              ),
              theme: incomingCreator.theme === 'dark' ? 'dark' : state.creator.theme || 'light',
              loggedIn: true,
              validHash: verifiedHash
            };
            delete restoredCreator.license;
            state = {
              creator: restoredCreator,
              projects: Array.isArray(parsed.projects) ? parsed.projects : state.projects,
              favorites: Array.isArray(parsed.favorites) ? parsed.favorites : state.favorites,
              exportsCount: Number.isFinite(Number(parsed.exportsCount))
                ? Number(parsed.exportsCount)
                : state.exportsCount,
              targetIncome: Number.isFinite(Number(parsed.targetIncome))
                ? Number(parsed.targetIncome)
                : state.targetIncome
            };
            saveState();
            enterStudio();
            showToast('Data cadangan berhasil dipulihkan');
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
    applyTheme(state.creator.theme || 'light');
    if (isValidCreatorSession(state.creator)) {
      enterStudio();
    }
  });
})();

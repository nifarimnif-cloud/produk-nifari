// KomisiKlip Studio — Logika Utama Aplikasi Web Pembeli
(function () {
  const STORAGE_KEY = 'komisiklip_studio_state_v1';
  const DATA = window.KOMISIKLIP_DATA || { presets: [], safeWords: [], calendarPillars: [], library: [] };

  const defaultCreator = {
    loggedIn: false,
    name: '',
    handle: '',
    email: '',
    license: '',
    defaultHours: '11:30 WIB & 19:30 WIB',
    theme: 'light'
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          creator: { ...defaultCreator, ...(parsed.creator || {}) },
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          exportsCount: Number(parsed.exportsCount) || 0,
          targetIncome: Number(parsed.targetIncome) || 6000000
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

  // Build 3 Script Variations + 30-Day Schedule from form fields
  function buildProjectFromInputs() {
    const preset = DATA.presets.find((p) => p.id === activePresetId) || DATA.presets[0] || {};
    const productName = document.getElementById('prodName').value.trim() || preset.productName || 'Produk Pilihan Keranjang';
    const platform = document.getElementById('prodPlatform').value;
    const price = Math.max(1000, Number(document.getElementById('prodPrice').value) || 59000);
    const commissionPct = Math.min(60, Math.max(1, Number(document.getElementById('prodComm').value) || 10));
    const visualStyle = document.getElementById('prodVisualStyle').value;
    const audience = document.getElementById('prodAudience').value.trim() || 'Pembeli harian Indonesia';
    const promoHook = document.getElementById('prodPromo').value.trim() || 'Cek harga promo dan potongan ongkir di keranjang kiri bawah';
    const painPoint = document.getElementById('prodPain').value.trim() || 'Sering repot dengan cara lama yang makan waktu';
    const b1 = document.getElementById('prodBen1').value.trim() || 'Praktis dipakai setiap hari tanpa ribet';
    const b2 = document.getElementById('prodBen2').value.trim() || 'Bahan kokoh dan awet dipakai jangka panjang';
    const b3 = document.getElementById('prodBen3').value.trim() || 'Ukuran pas dan nyaman dibawa ke mana saja';
    const postsPerDay = Number(document.getElementById('scheduleFreqSelect').value) || 2;

    const s1 = preset.sampleShot1 || 'Pegang produk dekat kamera di bawah cahaya terang jendela';
    const s2 = preset.sampleShot2 || 'Peragakan fungsi utama produk secara langsung selama 5 detik';
    const s3 = preset.sampleShot3 || 'Perlihatkan detail kemasan lalu arahkan telunjuk ke keranjang kiri bawah';

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
            visual: 'Sorot jarak dekat bagian detail produk saat sedang bekerja nyata'
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
            visual: 'Putar produk perlahan memperlihatkan material dan kelengkapan paket'
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
            visual: 'Ketuk atau perlihatkan bagian sambungan/segel produk dari dekat'
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

    return {
      id: (currentProject && currentProject.id) || 'proj-' + Date.now(),
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      presetId: activePresetId,
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
    const hoursMap = {
      1: ['19:30 WIB'],
      2: ['11:45 WIB', '19:30 WIB'],
      3: ['08:30 WIB', '12:15 WIB', '19:45 WIB']
    };
    const slotText = (hoursMap[postsPerDay] || hoursMap[2]).join(' & ');
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
        applyPresetToForm(p);
        renderPresetChips();
        showToast('Preset ' + p.label + ' dimuat');
      });
      grid.appendChild(btn);
    });
  }

  function applyPresetToForm(p) {
    if (!p) return;
    document.getElementById('prodName').value = p.productName;
    document.getElementById('prodPlatform').value = p.platform;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodComm').value = p.commissionPct;
    document.getElementById('prodVisualStyle').value = p.visualStyle;
    document.getElementById('prodAudience').value = p.audience;
    document.getElementById('prodPromo').value = p.promoHook;
    document.getElementById('prodPain').value = p.painPoint;
    document.getElementById('prodBen1').value = p.benefits[0] || '';
    document.getElementById('prodBen2').value = p.benefits[1] || '';
    document.getElementById('prodBen3').value = p.benefits[2] || '';
    currentProject = buildProjectFromInputs();
  }

  // Step Navigation
  function goToStep(stepNum) {
    activeStep = stepNum;
    document.querySelectorAll('.step-tab').forEach((t) => {
      t.classList.toggle('active', Number(t.dataset.step) === stepNum);
    });
    document.getElementById('wizStep1').classList.toggle('hidden', stepNum !== 1);
    document.getElementById('wizStep2').classList.toggle('hidden', stepNum !== 2);
    document.getElementById('wizStep3').classList.toggle('hidden', stepNum !== 3);

    if (stepNum === 2) {
      if (!currentProject) currentProject = buildProjectFromInputs();
      renderStep2Editor();
    } else if (stepNum === 3) {
      if (!currentProject) currentProject = buildProjectFromInputs();
      syncStep2Edits();
      renderStep3PreviewAndAudit();
    }
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
          <span class="badge">${b.time} • ${b.stage}</span>
        </div>
        <div class="field-group" style="margin-bottom:8px;">
          <label class="text-sm text-muted">Kalimat Suara / Narasi:</label>
          <textarea class="textarea block-spoken-input" data-bidx="${bIdx}" style="min-height:64px;"></textarea>
        </div>
        <div class="field-group">
          <label class="text-sm text-muted">Arahan Ambil Gambar (Shot):</label>
          <input class="input block-visual-input" data-bidx="${bIdx}" type="text" />
        </div>
      `;
      div.querySelector('.block-spoken-input').value = b.spoken;
      div.querySelector('.block-visual-input').value = b.visual;
      blocksWrap.appendChild(div);
    });

    document.getElementById('editCaption').value = currentProject.caption;
    document.getElementById('editHashtags').value = currentProject.hashtags;
    document.getElementById('editPinned').value = currentProject.pinnedComment;
    document.getElementById('scheduleFreqSelect').value = String(currentProject.postsPerDay || 2);

    renderCalendarPreview();
  }

  function syncStep2Edits() {
    if (!currentProject) return;
    const activeVar = currentProject.variations[activeVarIdx];
    if (activeVar) {
      document.querySelectorAll('.block-spoken-input').forEach((inp) => {
        const idx = Number(inp.dataset.bidx);
        if (activeVar.blocks[idx]) activeVar.blocks[idx].spoken = inp.value.trim();
      });
      document.querySelectorAll('.block-visual-input').forEach((inp) => {
        const idx = Number(inp.dataset.bidx);
        if (activeVar.blocks[idx]) activeVar.blocks[idx].visual = inp.value.trim();
      });
    }
    const capEl = document.getElementById('editCaption');
    const hashEl = document.getElementById('editHashtags');
    const pinEl = document.getElementById('editPinned');
    if (capEl && capEl.value) currentProject.caption = capEl.value.trim();
    if (hashEl && hashEl.value) currentProject.hashtags = hashEl.value.trim();
    if (pinEl && pinEl.value) currentProject.pinnedComment = pinEl.value.trim();
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
          <span class="badge">HARI ${String(row.day).padStart(2, '0')}</span>
          <div class="text-muted" style="font-size:12px; margin-top:6px;">${row.postTime}</div>
        </div>
        <div>
          <div style="font-weight:700; font-size:14px;">${row.pillar}</div>
          <p class="text-sm" style="margin-top:3px;">"${row.hookIdea}"</p>
          <p class="text-muted" style="font-size:12px; margin-top:4px;">Visual: ${row.visualCue}</p>
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
        <div class="text-caption" style="color: var(--color-deep-teal);">${b.time} • ${b.stage}</div>
        <p style="font-weight:700; font-size:15px; margin-top:5px;">"${b.spoken}"</p>
        <p class="text-sm text-muted" style="margin-top:5px;">Kamera: ${b.visual}</p>
      `;
      blocksWrap.appendChild(row);
    });

    const ostRow = document.createElement('div');
    ostRow.className = 'card-mist';
    ostRow.style.padding = '14px 16px';
    ostRow.innerHTML = `
      <div class="text-caption">TEKS LAYAR & KOMENTAR SEMATAN</div>
      <p class="text-sm" style="margin-top:4px;"><strong>Teks Layar:</strong> ${v.onScreenText}</p>
      <p class="text-sm" style="margin-top:4px;"><strong>Pinned:</strong> ${currentProject.pinnedComment}</p>
    `;
    blocksWrap.appendChild(ostRow);

    // 8-Point Affiliate Script & Safety Audit
    const fullText = v.blocks.map((b) => b.spoken).join(' ') + ' ' + currentProject.caption;
    const lower = fullText.toLowerCase();
    const hasRiskyWord = DATA.safeWords.some((rule) => lower.includes(rule.bad));
    const wordCount = fullText.trim().split(/\s+/).length;

    const checks = [
      { ok: v.blocks[0] && v.blocks[0].spoken.length >= 25, label: 'Hook 3 detik pertama langsung menyentuh masalah atau rasa penasaran pembeli' },
      { ok: wordCount >= 40 && wordCount <= 190, label: 'Panjang kalimat narasi ideal untuk durasi tonton 18–30 detik' },
      { ok: v.blocks.every((b) => b.visual && b.visual.length >= 10), label: 'Setiap blok detik memiliki arahan pengambilan gambar (shot list) jelas' },
      { ok: !hasRiskyWord, label: 'Bebas frasa klaim medis mutlak atau pengalihan transaksi luar aplikasi' },
      { ok: lower.includes('keranjang'), label: 'Memiliki ajakan klik keranjang yang natural tanpa terdengar memaksa' },
      { ok: Boolean(v.onScreenText && v.onScreenText.length >= 8), label: 'Dilengkapi teks layar singkat untuk penonton yang mematikan suara HP' },
      { ok: Boolean(currentProject.pinnedComment && currentProject.pinnedComment.length >= 15), label: 'Memiliki draf komentar sematan pancingan diskusi ukuran/varian' },
      { ok: currentProject.schedule30 && currentProject.schedule30.length === 30, label: 'Rencana rotasi sudut konten 30 hari siap dijalankan' }
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
        <span>${c.label}</span>
      `;
      checkWrap.appendChild(item);
    });
  }

  // Monthly Commission Calculator
  function updateCommissionCalc() {
    const target = Math.max(100000, Number(document.getElementById('calcTargetIncome').value) || 6000000);
    const avgPrice = Math.max(5000, Number(document.getElementById('calcAvgPrice').value) || 75000);
    const commPct = Math.min(60, Math.max(1, Number(document.getElementById('calcCommPct').value) || 11));
    const vidsDay = Math.max(1, Number(document.getElementById('calcVideosDay').value) || 2);

    const perItem = Math.max(100, Math.round(avgPrice * (commPct / 100)));
    const monthlyItems = Math.ceil(target / perItem);
    const dailyItems = Math.ceil(monthlyItems / 30);
    const monthlyVideos = vidsDay * 30;
    const ordersPerVidSlot = Math.max(1, Math.ceil(dailyItems / vidsDay));

    document.getElementById('calcResPerItem').textContent = formatRp(perItem);
    document.getElementById('calcResDailySales').textContent = `${dailyItems} pcs / hari`;
    document.getElementById('calcResMonthlySales').textContent = `Total ${monthlyItems} pcs selama 30 hari penuh.`;
    document.getElementById('calcResRhythm').textContent = `${monthlyVideos} Video / Bulan`;
    document.getElementById('calcAdviceText').textContent = `Dengan ritme ${vidsDay} video/hari, rata-rata butuh sekitar ${ordersPerVidSlot} pesanan per slot upload harian untuk menembus ${formatRp(target)}/bulan.`;

    state.targetIncome = target;
    document.getElementById('statTargetRp').textContent = formatCompactRp(target);
    saveState();
  }

  // Save Project to History
  function saveCurrentProjectToHistory(silent) {
    if (!currentProject) currentProject = buildProjectFromInputs();
    syncStep2Edits();
    const copy = JSON.parse(JSON.stringify(currentProject));
    const existingIdx = state.projects.findIndex((p) => p.id === copy.id);
    if (existingIdx >= 0) {
      state.projects[existingIdx] = copy;
    } else {
      state.projects.unshift(copy);
    }
    saveState();
    updateStatsAndBadges();
    renderHistoryList();
    if (!silent) showToast('Proyek disimpan ke Riwayat Studio');
  }

  function recordExport() {
    currentProject = currentProject ? { ...currentProject } : buildProjectFromInputs();
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
      box.innerHTML = '<strong style="font-size:14px;">Kotak Teks Masih Kosong</strong><p class="text-sm" style="margin-top:4px;">Masukkan draf narasi atau klik Muat Contoh Rawan di kanan atas.</p>';
      return;
    }

    if (hits.length === 0) {
      box.className = 'card-mist';
      box.innerHTML = `<strong style="font-size:14px;">Aman — 0 Frasa Berisiko Terdeteksi</strong><p class="text-sm" style="margin-top:4px;">Naskah ini tidak mengandung kata klaim mutlak atau pengalihan transaksi luar aplikasi. Siap dibaca di Teleprompter sebelah kanan.</p>`;
    } else {
      box.className = 'card-blush';
      const listHtml = hits
        .map(
          (h) => `<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(27,27,27,0.12); font-size:13px;">
            <strong>Hindari: "${h.bad}"</strong> — ${h.reason}.<br/>
            <span>Saran aman: <em>"${h.safe}"</em></span>
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
    const clean = (text || '').trim() || 'Belum ada naskah aktif. Buka Wizard Skrip atau ketik naskah di panel sebelah kiri untuk mulai membaca di depan kamera.';
    stage.innerHTML = clean
      .split(/\n+/)
      .map((p) => `<p style="margin-bottom: 18px;">${p.replace(/</g, '&lt;')}</p>`)
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
    grid.innerHTML = '';

    filtered.forEach((item) => {
      const isFav = state.favorites.includes(item.id);
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span class="badge">${item.shortCategory}</span>
            <span class="badge badge-outline">${item.niche}</span>
          </div>
          <h3 style="font-size:17px; font-weight:700; margin-top:12px;">${item.title}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">"${item.scriptText.slice(0, 125)}${item.scriptText.length > 125 ? '...' : ''}"</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--color-hairline); font-size:13px; font-weight:700;">
          <span style="color: var(--color-deep-teal);">Buka Detail &amp; Pakai</span>
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
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><p class="text-sm text-muted">Belum ada hook atau rumus skrip yang ditandai favorit. Buka menu Pustaka 120 Hook lalu klik Simpan ke Favorit pada kartu pilihanmu.</p></div>`;
      return;
    }
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'lib-card';
      card.innerHTML = `
        <div>
          <span class="badge">${item.shortCategory}</span>
          <h3 style="font-size:17px; font-weight:700; margin-top:12px;">${item.title}</h3>
          <p class="text-sm text-muted" style="margin-top:8px;">"${item.scriptText}"</p>
        </div>
        <div style="font-size:13px; font-weight:700; color: var(--color-deep-teal);">Buka Detail</div>
      `;
      card.addEventListener('click', () => openLibModal(item));
      grid.appendChild(card);
    });
  }

  function renderHistoryList() {
    const wrap = document.getElementById('historyListContainer');
    if (!wrap) return;
    if (state.projects.length === 0) {
      wrap.innerHTML = `<div class="card"><p class="text-sm text-muted">Belum ada proyek skrip yang disimpan. Buat skrip pertamamu di menu Wizard Skrip &amp; 30 Hari.</p></div>`;
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
            <span class="badge">${proj.platform}</span>
            <span class="badge badge-outline" style="margin-left:6px;">${proj.createdAt || 'Tersimpan'}</span>
            <h3 class="heading-card" style="margin-top:10px;">${proj.productName}</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">Harga ${formatRp(proj.price)} • Komisi ${proj.commissionPct}% (${formatRp(commRp)}/pcs) • ${proj.postsPerDay || 2} Video/Hari</p>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button type="button" class="btn btn-primary open-hist-btn" data-id="${proj.id}">Buka di Wizard</button>
            <button type="button" class="btn btn-secondary pdf-hist-btn" data-id="${proj.id}">Unduh PDF Skrip</button>
            <button type="button" class="btn btn-ghost del-hist-btn" data-id="${proj.id}">Hapus</button>
          </div>
        </div>
      `;
      div.querySelector('.open-hist-btn').addEventListener('click', () => {
        currentProject = JSON.parse(JSON.stringify(proj));
        document.getElementById('prodName').value = proj.productName;
        document.getElementById('prodPrice').value = proj.price;
        document.getElementById('prodComm').value = proj.commissionPct;
        document.getElementById('prodAudience').value = proj.audience;
        document.getElementById('prodPromo').value = proj.promoHook;
        document.getElementById('prodPain').value = proj.painPoint;
        document.getElementById('prodBen1').value = (proj.benefits && proj.benefits[0]) || '';
        document.getElementById('prodBen2').value = (proj.benefits && proj.benefits[1]) || '';
        document.getElementById('prodBen3').value = (proj.benefits && proj.benefits[2]) || '';
        switchView('wizard');
        goToStep(3);
      });
      div.querySelector('.pdf-hist-btn').addEventListener('click', () => {
        window.KomisiKlipExporter.exportScriptSheetPdf(proj, state.creator);
        showToast('Lembar Syuting PDF diunduh');
      });
      div.querySelector('.del-hist-btn').addEventListener('click', () => {
        state.projects = state.projects.filter((p) => p.id !== proj.id);
        saveState();
        updateStatsAndBadges();
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

  function enterStudio() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    applyTheme(state.creator.theme || 'light');
    renderPresetChips();
    if (DATA.presets[0] && !document.getElementById('prodName').value) {
      applyPresetToForm(DATA.presets[0]);
    }
    updateCommissionCalc();
    renderLibraryCategoryPills();
    renderLibraryGrid();
    renderFavoritesGrid();
    renderHistoryList();
    updateStatsAndBadges();

    // Preload teleprompter with active script
    if (currentProject && currentProject.variations[0]) {
      const sampleScript = currentProject.variations[0].blocks.map((b) => `[${b.time}] ${b.spoken}`).join('\n\n');
      document.getElementById('safeCheckInput').value = sampleScript;
      syncTeleprompterStage(sampleScript);
    }
  }

  // Event Listeners
  function bindEvents() {
    document.getElementById('fillDemoLoginBtn').addEventListener('click', () => {
      document.getElementById('loginName').value = 'Rina Sari';
      document.getElementById('loginHandle').value = '@rina.racunhemat';
      document.getElementById('loginEmail').value = 'rina.kreator@gmail.com';
      document.getElementById('loginCode').value = 'KOMISI-2026-PRO';
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('loginName').value.trim();
      const handle = document.getElementById('loginHandle').value.trim();
      const email = document.getElementById('loginEmail').value.trim();
      const code = document.getElementById('loginCode').value.trim().toUpperCase();
      const errEl = document.getElementById('loginError');

      if (code.length < 6) {
        errEl.textContent = 'Masukkan kode lisensi pembelian yang valid (contoh demo: KOMISI-2026-PRO).';
        errEl.classList.remove('hidden');
        return;
      }
      errEl.classList.add('hidden');
      state.creator = {
        ...state.creator,
        loggedIn: true,
        name,
        handle: handle.startsWith('@') ? handle : '@' + handle,
        email,
        license: code
      };
      saveState();
      enterStudio();
      showToast('Selamat datang di KomisiKlip Studio, ' + name.split(' ')[0]);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      state.creator.loggedIn = false;
      saveState();
      document.getElementById('appShell').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
    });

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
    document.getElementById('heroStartWizardBtn').addEventListener('click', () => switchView('wizard'));

    // Commission Calculator
    ['calcTargetIncome', 'calcAvgPrice', 'calcCommPct', 'calcVideosDay'].forEach((id) => {
      document.getElementById(id).addEventListener('input', updateCommissionCalc);
      document.getElementById(id).addEventListener('change', updateCommissionCalc);
    });

    document.getElementById('applyCalcToWizardBtn').addEventListener('click', () => {
      document.getElementById('prodPrice').value = document.getElementById('calcAvgPrice').value;
      document.getElementById('prodComm').value = document.getElementById('calcCommPct').value;
      document.getElementById('scheduleFreqSelect').value = document.getElementById('calcVideosDay').value;
      currentProject = buildProjectFromInputs();
      switchView('wizard');
      goToStep(1);
      showToast('Target harga, komisi & frekuensi harian diterapkan ke Wizard');
    });

    // Wizard Steps
    document.querySelectorAll('.step-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const s = Number(tab.dataset.step);
        if (s > 1) currentProject = buildProjectFromInputs();
        goToStep(s);
      });
    });

    document.getElementById('toStep2Btn').addEventListener('click', () => {
      currentProject = buildProjectFromInputs();
      goToStep(2);
    });
    document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));
    document.getElementById('toStep3Btn').addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep2Btn').addEventListener('click', () => goToStep(2));

    document.getElementById('scheduleFreqSelect').addEventListener('change', () => {
      if (!currentProject) currentProject = buildProjectFromInputs();
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
      if (!currentProject) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportScriptSheetPdf(currentProject, state.creator);
      recordExport();
      showToast('Lembar Syuting 3 Variasi (.PDF) berhasil diunduh');
    });

    document.getElementById('dlCuePngBtn').addEventListener('click', async () => {
      if (!currentProject) currentProject = buildProjectFromInputs();
      await window.KomisiKlipExporter.exportCueCardPng(currentProject, state.creator, activeVarIdx);
      recordExport();
      showToast('Kartu Contekan HP 9:16 (.PNG) berhasil diunduh');
    });

    document.getElementById('dlCalendarPdfBtn').addEventListener('click', () => {
      if (!currentProject) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportCalendarPdf(currentProject, state.creator);
      recordExport();
      showToast('Kalender Konten 30 Hari (.PDF) berhasil diunduh');
    });

    document.getElementById('dlScheduleCsvBtn').addEventListener('click', () => {
      if (!currentProject) currentProject = buildProjectFromInputs();
      window.KomisiKlipExporter.exportScheduleCsv(currentProject, state.creator);
      recordExport();
      showToast('Tabel Jadwal & Pelacak Komisi (.CSV) berhasil diunduh');
    });

    document.getElementById('copyAiPromptBtn').addEventListener('click', () => {
      if (!currentProject) currentProject = buildProjectFromInputs();
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
        clearInterval(tpTimer);
        tpTimer = null;
        btn.textContent = 'Mulai Gulir';
      } else {
        btn.textContent = 'Jeda Gulir';
        tpTimer = setInterval(() => {
          const speed = Number(document.getElementById('tpSpeed').value) || 2;
          stage.scrollTop += speed;
          if (stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 2) {
            clearInterval(tpTimer);
            tpTimer = null;
            btn.textContent = 'Mulai Gulir';
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

    document.getElementById('modalCopyBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(activeModalItem.scriptText);
      }
      showToast('Kalimat disalin ke papan klip');
    });

    document.getElementById('modalApplyWizardBtn').addEventListener('click', () => {
      if (!activeModalItem) return;
      if (!currentProject) currentProject = buildProjectFromInputs();
      currentProject.variations[activeVarIdx].blocks[0].spoken = activeModalItem.scriptText;
      currentProject.variations[activeVarIdx].blocks[0].visual = activeModalItem.visualCue;
      closeLibModal();
      switchView('wizard');
      goToStep(2);
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
      state.creator.name = document.getElementById('setCreatorName').value.trim();
      const h = document.getElementById('setCreatorHandle').value.trim();
      state.creator.handle = h.startsWith('@') ? h : '@' + h;
      state.creator.email = document.getElementById('setCreatorEmail').value.trim();
      state.creator.defaultHours = document.getElementById('setDefaultHours').value.trim();
      saveState();
      updateStatsAndBadges();
      showToast('Profil kreator berhasil diperbarui');
    });

    document.getElementById('exportBackupBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
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
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          if (parsed && parsed.creator) {
            state = {
              creator: { ...defaultCreator, ...parsed.creator, loggedIn: true },
              projects: Array.isArray(parsed.projects) ? parsed.projects : [],
              favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
              exportsCount: Number(parsed.exportsCount) || 0,
              targetIncome: Number(parsed.targetIncome) || 6000000
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
    if (state.creator.loggedIn) {
      enterStudio();
    }
  });
})();

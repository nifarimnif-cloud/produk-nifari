import {
  ROLE_PRESETS,
  SALARY_SCENARIOS,
  LIBRARY_CATEGORIES,
  CAREER_LIBRARY_ITEMS
} from './data/career-library.js';
import {
  formatRp,
  summarizeSkillsClean,
  exportAtsCvPdf,
  exportCoverLetterPdf,
  exportAtsCvDocx
} from './exporter.js';

const STORAGE_KEY = 'karirlolos_studio_v1';
const LICENSE_SALT = 'nifari-lic-2026::';
const CREATOR_MASTER_HASH = '1934419b428fd7cc0efb2496131e297396dc4050b597d024fe94091652033488';
const DEV_AGENT_HASHES = new Set([
  '9609dd6be6e41d0d344b240a470a03341050dda22c326021c8e327da2cadebb4',
  '3c1eff8102b942d3b31fd02a4d96ec57c803a392aefefe7ae491e6ae5f826e17',
  'adcdff10df998eca6e3e79791acbea640e4e88bed60ab23c514381544dcc29c4',
  '5165f582606715df6b7b1d2f48af14e1a402e0dd8e0af04c6fe67eb5cd253697',
  'd922d22d5f2151459b4ac030989668a91adb16c4ad273d2fd3269464301bfec8',
  'b63d7bafb28311994f4e7d2c0a0f565ae8174fdf67422fa144700c69ba9efa62'
]);
const BUYER_ACCESS_HASH = '4b7cf6c7160e4813830aee8bcd91fceab954d06c5c8c4031f6d08ce2ef550048';

// Pure-JS synchronous SHA-256 (works identically on https://, http://localhost, and file://)
function sha256Hex(asciiInput) {
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

  const rotr = (n, x) => (x >>> n) | (x << (32 - n));
  const bytes = new TextEncoder().encode(String(asciiInput));
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(totalLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  dv.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
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
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
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

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function hashAccessCode(rawCode) {
  const normalized = String(rawCode || '').trim().toUpperCase();
  if (!normalized) return '';
  return sha256Hex(LICENSE_SALT + normalized);
}

function isValidLicenseHash(hash) {
  return hash === CREATOR_MASTER_HASH || DEV_AGENT_HASHES.has(hash) || hash === BUYER_ACCESS_HASH;
}

const state = {
  user: null,
  theme: 'light',
  activeView: 'dashboard',
  wizardStep: 1,
  previewTab: 'cv', // 'cv' | 'cl'
  selectedRoleId: ROLE_PRESETS[0].id,
  step2ManuallyEdited: false,
  negoScriptManuallyEdited: false,
  salaryCalc: {
    base: 6500000,
    expMult: 1.22,
    cityMult: 1.05,
    floorVal: 7900000,
    lowAsk: 8400000,
    highAsk: 9300000
  },
  cv: {
    fullName: 'Anisa Rahmawati',
    targetPosition: ROLE_PRESETS[0].targetPosition,
    targetCompany: ROLE_PRESETS[0].targetCompany,
    city: 'Jakarta Selatan',
    phone: '0812-0000-0000',
    email: 'anisa.rahmawati@email.com',
    portfolio: 'linkedin.com/in/anisarahmawati',
    summary: ROLE_PRESETS[0].summary,
    exp1Role: ROLE_PRESETS[0].experiences[0].role,
    exp1Company: ROLE_PRESETS[0].experiences[0].company,
    exp1Period: ROLE_PRESETS[0].experiences[0].period,
    exp1BulletsText: ROLE_PRESETS[0].experiences[0].bullets.join('\n'),
    exp2Role: ROLE_PRESETS[0].experiences[1].role,
    exp2Company: ROLE_PRESETS[0].experiences[1].company,
    exp2Period: ROLE_PRESETS[0].experiences[1].period,
    exp2BulletsText: ROLE_PRESETS[0].experiences[1].bullets.join('\n'),
    education: ROLE_PRESETS[0].education,
    skills: ROLE_PRESETS[0].skills,
    certifications: ROLE_PRESETS[0].certifications
  },
  libCategory: 'ALL',
  libRoleFilter: 'ALL',
  libQuery: '',
  modalItemId: null,
  favorites: [],
  history: []
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayIndo() {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function saveState() {
  try {
    const safeUser =
      state.user && isValidLicenseHash(state.user.validHash)
        ? {
            name: state.user.name,
            email: state.user.email,
            validHash: state.user.validHash,
            role: state.user.role || 'buyer'
          }
        : null;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: safeUser,
        theme: state.theme,
        selectedRoleId: state.selectedRoleId,
        salaryCalc: state.salaryCalc,
        cv: state.cv,
        favorites: state.favorites,
        history: state.history
      })
    );
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.user && isValidLicenseHash(parsed.user.validHash)) {
      state.user = {
        name: String(parsed.user.name || 'Rekan Karier'),
        email: String(parsed.user.email || ''),
        validHash: parsed.user.validHash,
        role: parsed.user.role || 'buyer'
      };
    } else {
      state.user = null;
    }
    if (parsed.theme) state.theme = parsed.theme;
    if (parsed.selectedRoleId) state.selectedRoleId = parsed.selectedRoleId;
    if (parsed.salaryCalc) state.salaryCalc = { ...state.salaryCalc, ...parsed.salaryCalc };
    if (parsed.cv) state.cv = { ...state.cv, ...parsed.cv };
    if (Array.isArray(parsed.favorites)) state.favorites = parsed.favorites;
    if (Array.isArray(parsed.history)) state.history = parsed.history;
  } catch {}
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    t.style.display = 'none';
  }, 2400);
}

function applyTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) btn.textContent = state.theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  saveState();
}

function splitTopLevelCommas(str) {
  const s = String(str || '');
  const items = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;
    else if (ch === ',' && depth === 0) {
      const piece = s.slice(start, i).trim();
      if (piece) items.push(piece);
      start = i + 1;
    }
  }
  const tail = s.slice(start).trim();
  if (tail) items.push(tail);
  return items;
}

function parseBulletLines(txt) {
  return String(txt || '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function buildDocumentPayload() {
  const c = state.cv;
  const experiences = [];
  const b1 = parseBulletLines(c.exp1BulletsText);
  if (c.exp1Role.trim() || c.exp1Company.trim() || b1.length) {
    experiences.push({
      role: c.exp1Role.trim(),
      company: c.exp1Company.trim(),
      period: c.exp1Period.trim(),
      bullets: b1
    });
  }
  const b2 = parseBulletLines(c.exp2BulletsText);
  if (c.exp2Role.trim() || c.exp2Company.trim() || b2.length) {
    experiences.push({
      role: c.exp2Role.trim(),
      company: c.exp2Company.trim(),
      period: c.exp2Period.trim(),
      bullets: b2
    });
  }

  return {
    fullName: c.fullName.trim() || 'Nama Pelamar',
    targetPosition: c.targetPosition.trim() || 'Staf Profesional',
    targetCompany: c.targetCompany.trim() || 'Perusahaan Tujuan',
    city: c.city.trim(),
    phone: c.phone.trim(),
    email: c.email.trim(),
    portfolio: c.portfolio.trim(),
    summary: c.summary.trim(),
    experiences,
    education: c.education.trim(),
    skills: c.skills.trim(),
    certifications: c.certifications.trim(),
    dateLabel: todayIndo()
  };
}

/* ================= 8-POINT REAL-TIME ATS AUDIT ================= */
function computeAtsAudit() {
  const c = state.cv;
  const p = buildDocumentPayload();
  const checks = [];
  let score = 0;

  // 1. Identitas & posisi tujuan jelas (+12)
  const hasIdentity = Boolean(c.fullName.trim() && c.targetPosition.trim());
  if (hasIdentity) score += 12;
  checks.push({ ok: hasIdentity, label: 'Nama & posisi tujuan jelas' });

  // 2. Kontak telepon, email valid & kota domisili (+12)
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim());
  const hasContact = Boolean(c.city.trim() && c.phone.trim() && validEmail);
  if (hasContact) score += 12;
  checks.push({ ok: hasContact, label: 'Kontak telepon, email & domisili' });

  // 3. Tautan LinkedIn / portofolio tercantum (+12)
  const hasPortfolio = c.portfolio.trim().length >= 5;
  if (hasPortfolio) score += 12;
  checks.push({ ok: hasPortfolio, label: 'Tautan LinkedIn / portofolio' });

  // 4. Ringkasan profesional 2–4 kalimat padat (+14)
  const sumLen = p.summary.length;
  const goodSummary = sumLen >= 80 && sumLen <= 600;
  if (goodSummary) score += 14;
  checks.push({ ok: goodSummary, label: 'Ringkasan 2–4 kalimat padat' });

  // 5. Pengalaman memakai kata kerja aktif (+14)
  const allBullets = p.experiences.flatMap((e) => e.bullets);
  const actionVerbRegex = /\b(me[a-z]{3,}|ber[a-z]{3,}|led|managed|built|developed|created|designed|improved|handled|organized|prepared)\b/i;
  const activeBullets = allBullets.filter((b) => actionVerbRegex.test(b));
  const hasActionVerbs = activeBullets.length >= 2;
  if (hasActionVerbs) score += 14;
  checks.push({ ok: hasActionVerbs, label: 'Pengalaman memakai kata kerja aktif' });

  // 6. Bukti angka / persentase capaian kuantitatif (+14)
  const quantBullets = allBullets.filter((b) => /\d+/.test(b));
  const hasNumbers = quantBullets.length >= 2;
  if (hasNumbers) score += 14;
  checks.push({ ok: hasNumbers, label: 'Bukti angka / persentase capaian' });

  // 7. Pendidikan terakhir jelas (+10)
  const hasEdu = p.education.length >= 10;
  if (hasEdu) score += 10;
  checks.push({ ok: hasEdu, label: 'Pendidikan terakhir jelas' });

  // 8. Minimal 4 kata kunci keahlian ATS (+12)
  const skillItems = splitTopLevelCommas(p.skills);
  const goodSkills = skillItems.length >= 4;
  if (goodSkills) score += 12;
  checks.push({ ok: goodSkills, label: 'Minimal 4 kata kunci keahlian ATS' });

  return { score: Math.min(100, score), checks };
}

function refreshAtsUi() {
  const { score, checks } = computeAtsAudit();
  const dashEl = document.getElementById('stat-ats-score');
  const wizPct = document.getElementById('wiz-ats-pct');
  const wizBar = document.getElementById('wiz-ats-bar');
  const wizChecks = document.getElementById('wiz-ats-checks');

  if (dashEl) dashEl.textContent = `${score}%`;
  if (wizPct) wizPct.textContent = `${score}%`;
  if (wizBar) wizBar.style.width = `${score}%`;

  if (wizChecks) {
    wizChecks.innerHTML = checks
      .map(
        (c) => `
        <span class="status-pill ${c.ok ? 'green' : ''}">
          ${c.ok ? 'Lolos: ' : 'Lengkapi: '}${esc(c.label)}
        </span>`
      )
      .join('');
  }
}

/* ================= KALKULATOR GAJI & GENERATOR SKRIP ================= */
function updateSalaryCalculation() {
  const salEl = document.getElementById('calc-base-salary');
  const rawStr = String(salEl?.value ?? '').trim();
  const parsedVal = rawStr === '' ? 0 : Number(rawStr);
  if (Number.isFinite(parsedVal) && parsedVal < 0 && salEl) {
    salEl.value = '0';
  }
  const base = Number.isFinite(parsedVal) ? Math.max(0, parsedVal) : 0;
  const expMult = Number(document.getElementById('calc-exp-level')?.value) || 1.22;
  const cityMult = Number(document.getElementById('calc-city-zone')?.value) || 1.05;

  const rawTarget = base * expMult * cityMult;
  const lowAsk = base > 0 ? Math.ceil(rawTarget / 100000) * 100000 : 0;
  const highAsk = base > 0 ? Math.ceil((rawTarget * 1.11) / 100000) * 100000 : 0;
  const floorVal = base > 0 ? Math.ceil((lowAsk * 0.93) / 100000) * 100000 : 0;

  state.salaryCalc = { base, expMult, cityMult, floorVal, lowAsk, highAsk };

  document.getElementById('calc-range-output').textContent = `${formatRp(lowAsk)} – ${formatRp(highAsk)}`;
  document.getElementById('calc-floor-note').textContent = `Batas bawah ikhlas: ${formatRp(floorVal)} / bulan`;

  const millions = (lowAsk / 1000000).toFixed(1).replace('.', ',');
  document.getElementById('stat-target-salary').textContent = `Rp ${millions} Jt`;

  renderNegotiationScript(false);
  saveState();
}

function renderNegotiationScript(forceOverwrite = false) {
  const scenId = document.getElementById('nego-scenario-select')?.value || SALARY_SCENARIOS[0].id;
  const p = buildDocumentPayload();
  const { floorVal, lowAsk, highAsk } = state.salaryCalc;

  const ctxEl = document.getElementById('nego-context-summary');
  if (ctxEl) {
    ctxEl.textContent = `${p.fullName} · Target: ${p.targetPosition} di ${p.targetCompany} · Rentang Nego: ${formatRp(lowAsk)} – ${formatRp(highAsk)}`;
  }

  if (state.negoScriptManuallyEdited && !forceOverwrite) {
    return;
  }

  let text = '';
  if (scenId === 'ditanya-ekspektasi-awal') {
    text = `Terima kasih atas pertanyaannya Bapak/Ibu. Setelah mempelajari ruang lingkup tanggung jawab posisi ${p.targetPosition} di ${p.targetCompany} serta melihat bekal pengalaman dan keahlian yang saya bawa untuk langsung berkontribusi, ekspektasi gaji bersih bulanan saya berada di kisaran ${formatRp(lowAsk)} hingga ${formatRp(highAsk)}. Tentu saya sangat terbuka untuk menyesuaikannya dengan struktur kompensasi dan paket tunjangan yang berlaku di perusahaan Bapak/Ibu.`;
  } else if (scenId === 'ditawar-bawah-standar') {
    text = `Terima kasih banyak atas surat penawaran dan kepercayaan tim ${p.targetCompany} kepada saya untuk mengisi peran ${p.targetPosition}. Saya sangat antusias untuk bergabung. Mengingat rekam jejak saya di bidang ini yang memungkinkan saya langsung bekerja optimal sejak bulan pertama, apakah masih terdapat ruang penyesuaian komponen gaji mendekati angka ${formatRp(lowAsk)} atau minimal di batas ${formatRp(floorVal)} Bapak/Ibu?`;
  } else if (scenId === 'nego-tunjangan-mentok') {
    text = `Saya memahami sepenuhnya apabila struktur gaji pokok untuk level posisi ${p.targetPosition} sudah berada pada batas tabel perusahaan Bapak/Ibu. Agar total penerimaan tetap mendukung mobilitas kerja harian saya secara optimal, apakah memungkinkan dikombinasikan dengan dukungan tunjangan transportasi/makan bulanan atau dicantumkan klausul peninjauan gaji ke angka ${formatRp(lowAsk)} setelah saya lulus evaluasi masa percobaan 3 bulan?`;
  } else if (scenId === 'freshgrad-nego-pertama') {
    text = `Berdasarkan riset saya mengenai standar upah wilayah setempat untuk posisi ${p.targetPosition} serta bekal magang dan keterampilan praktis yang sudah saya miliki, saya mengharapkan kisaran ${formatRp(floorVal)} hingga ${formatRp(lowAsk)} per bulan. Fokus utama saya saat ini adalah memberikan kinerja terbaik dan bertumbuh jangka panjang bersama tim ${p.targetCompany}.`;
  } else if (scenId === 'alasan-pindah-kantor') {
    text = `Saya sangat bersyukur atas kesempatan dan pembelajaran berharga di tempat kerja sebelumnya. Saat ini saya mencari tantangan dan ruang tanggung jawab yang lebih terarah sebagai ${p.targetPosition}, di mana pengalaman yang telah saya bangun dapat memberikan dampak yang lebih luas selaras dengan skala pertumbuhan ${p.targetCompany}.`;
  } else {
    text = `Selamat pagi Bapak/Ibu Tim Rekrutmen ${p.targetCompany},\n\nSemoga Bapak/Ibu dalam keadaan sehat. Saya ${p.fullName}, ingin menanyakan perkembangan proses seleksi untuk posisi ${p.targetPosition} yang telah saya ikuti wawancaranya beberapa hari lalu. Saya tetap sangat antusias terhadap kesempatan berkontribusi di tim Bapak/Ibu. Apabila dibutuhkan informasi pendukung tambahan, saya siap mengirimkannya segera.\n\nTerima kasih banyak atas waktu dan perhatiannya.`;
  }

  const out = document.getElementById('nego-script-output');
  if (out) out.value = text;
}

/* ================= WIZARD CV & PRATINJAU A4 ================= */
function clearWizardValidationStyles() {
  document.querySelectorAll('#view-wizard .input-error').forEach((el) => el.classList.remove('input-error'));
}

function populateWizardInputsFromState() {
  const c = state.cv;
  document.getElementById('inp-full-name').value = c.fullName;
  document.getElementById('inp-target-position').value = c.targetPosition;
  document.getElementById('inp-target-company').value = c.targetCompany;
  document.getElementById('inp-city').value = c.city;
  document.getElementById('inp-phone').value = c.phone;
  document.getElementById('inp-email').value = c.email;
  document.getElementById('inp-portfolio').value = c.portfolio;
  document.getElementById('inp-summary').value = c.summary;

  document.getElementById('exp1-role').value = c.exp1Role;
  document.getElementById('exp1-company').value = c.exp1Company;
  document.getElementById('exp1-period').value = c.exp1Period;
  document.getElementById('exp1-bullets').value = c.exp1BulletsText;

  document.getElementById('exp2-company-role').value = c.exp2Role;
  document.getElementById('exp2-company').value = c.exp2Company;
  document.getElementById('exp2-period').value = c.exp2Period;
  document.getElementById('exp2-bullets').value = c.exp2BulletsText;

  document.getElementById('inp-education').value = c.education;
  document.getElementById('inp-skills').value = c.skills;
  document.getElementById('inp-certifications').value = c.certifications;
}

function syncWizardStateFromInputs() {
  const c = state.cv;
  c.fullName = document.getElementById('inp-full-name').value;
  c.targetPosition = document.getElementById('inp-target-position').value;
  c.targetCompany = document.getElementById('inp-target-company').value;
  c.city = document.getElementById('inp-city').value;
  c.phone = document.getElementById('inp-phone').value;
  c.email = document.getElementById('inp-email').value;
  c.portfolio = document.getElementById('inp-portfolio').value;
  c.summary = document.getElementById('inp-summary').value;

  c.exp1Role = document.getElementById('exp1-role').value;
  c.exp1Company = document.getElementById('exp1-company').value;
  c.exp1Period = document.getElementById('exp1-period').value;
  c.exp1BulletsText = document.getElementById('exp1-bullets').value;

  c.exp2Role = document.getElementById('exp2-company-role').value;
  c.exp2Company = document.getElementById('exp2-company').value;
  c.exp2Period = document.getElementById('exp2-period').value;
  c.exp2BulletsText = document.getElementById('exp2-bullets').value;

  c.education = document.getElementById('inp-education').value;
  c.skills = document.getElementById('inp-skills').value;
  c.certifications = document.getElementById('inp-certifications').value;

  refreshAtsUi();
  renderLiveA4Preview();
  renderNegotiationScript(false);
  saveState();
}

function renderRolePresetChips() {
  const grid = document.getElementById('role-preset-grid');
  grid.innerHTML = ROLE_PRESETS.map(
    (r) => `
    <button type="button" class="role-chip ${r.id === state.selectedRoleId ? 'active' : ''}" data-rid="${esc(r.id)}">
      ${esc(r.name)}
    </button>`
  ).join('');

  const activeObj = ROLE_PRESETS.find((x) => x.id === state.selectedRoleId) || ROLE_PRESETS[0];
  document.getElementById('wiz-active-role-pill').textContent = activeObj.name;

  grid.querySelectorAll('.role-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const roleObj = ROLE_PRESETS.find((x) => x.id === btn.dataset.rid);
      if (!roleObj) return;
      if (state.step2ManuallyEdited) {
        const ok = window.confirm(
          'Mengganti jalur posisi akan memperbarui ringkasan dan poin pengalaman dengan contoh baru. Lanjutkan?'
        );
        if (!ok) return;
      }

      clearWizardValidationStyles();
      state.selectedRoleId = roleObj.id;
      state.step2ManuallyEdited = false;
      state.cv.targetPosition = roleObj.targetPosition;
      state.cv.targetCompany = roleObj.targetCompany;
      state.cv.summary = roleObj.summary;
      state.cv.exp1Role = roleObj.experiences[0].role;
      state.cv.exp1Company = roleObj.experiences[0].company;
      state.cv.exp1Period = roleObj.experiences[0].period;
      state.cv.exp1BulletsText = roleObj.experiences[0].bullets.join('\n');
      state.cv.exp2Role = roleObj.experiences[1].role;
      state.cv.exp2Company = roleObj.experiences[1].company;
      state.cv.exp2Period = roleObj.experiences[1].period;
      state.cv.exp2BulletsText = roleObj.experiences[1].bullets.join('\n');
      state.cv.education = roleObj.education;
      state.cv.skills = roleObj.skills;
      state.cv.certifications = roleObj.certifications;

      populateWizardInputsFromState();
      renderRolePresetChips();
      refreshAtsUi();
      renderLiveA4Preview();
      renderNegotiationScript(false);
      saveState();
      showToast(`Template "${roleObj.name}" berhasil dimuat!`);
    });
  });
}

function renderLiveA4Preview() {
  const box = document.getElementById('live-a4-preview');
  const p = buildDocumentPayload();

  if (state.previewTab === 'cl') {
    const firstWithBullets = p.experiences.find((e) => Array.isArray(e.bullets) && e.bullets.length > 0);
    const topBullets = (firstWithBullets?.bullets || []).slice(0, 3);
    const skillSummary = summarizeSkillsClean(p.skills, 120);
    const attachSentence = skillSummary
      ? `Sebagai bahan pertimbangan lebih lanjut, bersama surat ini saya lampirkan Curriculum Vitae (CV) terbaru yang memuat rincian riwayat pengalaman, pendidikan, serta keahlian utama (${esc(skillSummary)}).`
      : 'Sebagai bahan pertimbangan lebih lanjut, bersama surat ini saya lampirkan Curriculum Vitae (CV) terbaru yang memuat rincian riwayat pengalaman, pendidikan, serta keahlian pendukung yang relevan.';
    const footerContact = [p.phone, p.portfolio].filter(Boolean).join('  |  ');

    box.innerHTML = `
      <div class="cv-paper-rule"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;padding-bottom:12px;border-bottom:1px solid #dedfe2;margin-bottom:18px;">
        <div>
          <h2 style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#0a0b0d;">${esc(p.fullName)}</h2>
          <p style="font-size:13px;color:#5b616e;">${esc([p.city, p.phone, p.email, p.portfolio].filter(Boolean).join('  |  '))}</p>
        </div>
        <span class="status-pill blue">SURAT LAMARAN RESMI</span>
      </div>
      <p style="font-size:13.5px;margin-bottom:12px;">${esc(p.city || 'Jakarta')}, ${esc(p.dateLabel)}</p>
      <p style="font-size:13.5px;font-weight:700;margin-bottom:14px;">Perihal: Lamaran Pekerjaan — Posisi ${esc(p.targetPosition)}</p>
      <p style="font-size:13.5px;margin-bottom:14px;">Kepada Yth.<br/><strong>Bapak/Ibu Pimpinan &amp; Tim HRD ${esc(p.targetCompany)}</strong><br/>Di Tempat</p>
      <p style="font-size:13.5px;margin-bottom:10px;">Dengan hormat,</p>
      <p style="font-size:13.5px;line-height:1.58;margin-bottom:10px;">
        Melalui surat ini, saya <strong>${esc(p.fullName)}</strong> bermaksud mengajukan lamaran pekerjaan untuk mengisi posisi <strong>${esc(p.targetPosition)}</strong> di <strong>${esc(p.targetCompany)}</strong>. Bekal pengalaman, ketelitian kerja, serta penguasaan perangkat pendukung yang saya miliki selaras dengan kebutuhan tim Bapak/Ibu.
      </p>
      ${
        p.summary
          ? `<p style="font-size:13.5px;line-height:1.58;margin-bottom:10px;">${esc(p.summary)}</p>`
          : ''
      }
      ${
        topBullets.length
          ? `<p style="font-size:13.5px;font-weight:600;margin-bottom:6px;">Beberapa kontribusi nyata yang pernah saya capai antara lain:</p>
             <ul style="padding-left:18px;font-size:13.5px;line-height:1.55;margin-bottom:12px;">
               ${topBullets.map((b) => `<li>${esc(b)}</li>`).join('')}
             </ul>`
          : ''
      }
      <p style="font-size:13.5px;line-height:1.58;margin-bottom:10px;">${attachSentence}</p>
      <p style="font-size:13.5px;line-height:1.58;margin-bottom:18px;">
        Besar harapan saya untuk memperoleh kesempatan wawancara guna menjelaskan bagaimana saya dapat segera berkontribusi positif bagi <strong>${esc(p.targetCompany)}</strong>. Atas waktu dan perhatian Bapak/Ibu, saya ucapkan terima kasih.
      </p>
      <p style="font-size:13.5px;">
        Hormat saya,<br/><br/>
        <strong>${esc(p.fullName)}</strong>
        ${footerContact ? `<br/><span style="font-size:12.5px;color:#5b616e;">${esc(footerContact)}</span>` : ''}
      </p>
    `;
    return;
  }

  const expHtml = p.experiences
    .map(
      (e) => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;">
          <strong style="font-size:14.5px;color:#0a0b0d;">${esc(e.role || 'Jabatan / Peran')}</strong>
          ${e.period ? `<span style="font-size:12.5px;font-weight:600;color:#5b616e;">${esc(e.period)}</span>` : ''}
        </div>
        ${e.company ? `<div style="font-size:13px;color:#5b616e;margin-bottom:5px;">${esc(e.company)}</div>` : ''}
        ${
          (e.bullets || []).length
            ? `<ul style="padding-left:18px;font-size:13.2px;line-height:1.52;color:#141519;">
                 ${e.bullets.map((b) => `<li style="margin-bottom:3px;">${esc(b)}</li>`).join('')}
               </ul>`
            : ''
        }
      </div>`
    )
    .join('');

  box.innerHTML = `
    <div class="cv-paper-rule"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="font-family:var(--font-display);font-size:26px;font-weight:700;color:#0a0b0d;line-height:1.1;">${esc(p.fullName)}</h2>
        <div style="font-size:15px;font-weight:700;color:#0052ff;margin-top:4px;">${esc(p.targetPosition)}</div>
      </div>
      <span class="status-pill green">ATS 1 KOLOM BERSIH</span>
    </div>
    <p style="font-size:12.8px;color:#5b616e;margin-top:6px;">
      ${esc([p.city, p.phone, p.email, p.portfolio].filter(Boolean).join('  |  '))}
    </p>

    ${
      p.summary
        ? `<div class="cv-sec-head">Ringkasan Profesional</div>
           <p style="font-size:13.3px;line-height:1.55;color:#141519;">${esc(p.summary)}</p>`
        : ''
    }

    ${
      expHtml
        ? `<div class="cv-sec-head">Pengalaman Kerja &amp; Proyek Relevan</div>
           ${expHtml}`
        : ''
    }

    ${
      p.education
        ? `<div class="cv-sec-head">Pendidikan</div>
           <p style="font-size:13.5px;font-weight:600;color:#0a0b0d;">${esc(p.education)}</p>`
        : ''
    }

    ${
      p.skills
        ? `<div class="cv-sec-head">Keahlian Utama &amp; Perangkat Kerja</div>
           <p style="font-size:13.3px;line-height:1.52;color:#141519;">${esc(p.skills)}</p>`
        : ''
    }

    ${
      p.certifications
        ? `<div class="cv-sec-head">Sertifikasi &amp; Pelatihan Pendukung</div>
           <p style="font-size:13.3px;color:#141519;">${esc(p.certifications)}</p>`
        : ''
    }
  `;
}

function setWizardStepDom(stepNum) {
  state.wizardStep = stepNum;
  document.querySelectorAll('.step-tab').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.step) === stepNum);
  });
  document.querySelectorAll('.wiz-step-pane').forEach((pane, idx) => {
    pane.classList.toggle('active', idx + 1 === stepNum);
  });
  if (stepNum === 3) renderLiveA4Preview();
}

function switchWizardStep(stepNum) {
  if (stepNum > 1) {
    const nameEl = document.getElementById('inp-full-name');
    const posEl = document.getElementById('inp-target-position');
    const missingName = !nameEl.value.trim();
    const missingPos = !posEl.value.trim();
    if (missingName || missingPos) {
      setWizardStepDom(1);
      if (missingName) nameEl.classList.add('input-error');
      if (missingPos) posEl.classList.add('input-error');
      (missingName ? nameEl : posEl).focus();
      showToast('Mohon isi Nama Lengkap dan Posisi Pekerjaan di Langkah 1 terlebih dahulu.');
      return;
    }
  }

  if (stepNum === 3) {
    const c = state.cv;
    const hasStep2Content = Boolean(
      c.summary.trim() ||
        c.exp1Role.trim() ||
        c.exp1BulletsText.trim() ||
        c.exp2Role.trim() ||
        c.exp2BulletsText.trim() ||
        c.skills.trim()
    );
    if (!hasStep2Content) {
      setWizardStepDom(2);
      const role1El = document.getElementById('exp1-role');
      const bul1El = document.getElementById('exp1-bullets');
      const skEl = document.getElementById('inp-skills');
      role1El.classList.add('input-error');
      bul1El.classList.add('input-error');
      skEl.classList.add('input-error');
      role1El.focus();
      showToast('Lengkapi minimal pengalaman kerja atau keahlian di Langkah 2 sebelum mengunduh.');
      return;
    }
  }

  setWizardStepDom(stepNum);
}

/* ================= EKSPOR FILE & CATAT RIWAYAT LENGKAP ================= */
function triggerDownloadBlob(blob, fileName, docTypeLabel) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  const p = buildDocumentPayload();
  const dedupKey = `${docTypeLabel}|${p.fullName}|${p.targetPosition}|${p.targetCompany}`;
  const snapshot = JSON.parse(JSON.stringify(state.cv));

  const existingIdx = state.history.findIndex((h) => h.dedupKey === dedupKey);
  const entry = {
    id:
      existingIdx >= 0
        ? state.history[existingIdx].id
        : 'h-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    dedupKey,
    docType: docTypeLabel,
    fullName: p.fullName,
    targetPosition: p.targetPosition,
    targetCompany: p.targetCompany,
    roleId: state.selectedRoleId,
    dateLabel: p.dateLabel,
    cvSnapshot: snapshot
  };

  if (existingIdx >= 0) {
    state.history.splice(existingIdx, 1);
  }
  state.history.unshift(entry);

  updateCountersAndHistory();
  saveState();
  showToast(`Berkas ${docTypeLabel} berhasil diunduh!`);
}

/* ================= PUSTAKA 120 KOLEKSI & FAVORIT ================= */
function renderCategoryStrip() {
  const strip = document.getElementById('lib-category-strip');
  const allCats = ['ALL', ...LIBRARY_CATEGORIES];
  strip.innerHTML = allCats
    .map(
      (cat) => `
      <button type="button" class="filter-tag ${state.libCategory === cat ? 'active' : ''}" data-cat="${esc(cat)}">
        ${cat === 'ALL' ? 'Semua Kategori (120)' : esc(cat)}
      </button>`
    )
    .join('');

  strip.querySelectorAll('.filter-tag').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.libCategory = btn.dataset.cat;
      renderCategoryStrip();
      renderLibraryCards();
    });
  });
}

function getFilteredLibraryItems() {
  const q = state.libQuery.trim().toLowerCase();
  return CAREER_LIBRARY_ITEMS.filter((item) => {
    if (state.libCategory !== 'ALL' && item.category !== state.libCategory) return false;
    if (state.libRoleFilter !== 'ALL' && item.niche !== state.libRoleFilter) return false;
    if (q) {
      const hay = `${item.title} ${item.summary} ${item.example} ${item.niche}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const SHORT_CAT_LABELS = {
  'Kalimat Pencapaian CV per Bidang': 'Poin Pencapaian CV',
  'Jawaban Jebakan Wawancara HRD': 'Wawancara HRD',
  'Skrip Negosiasi Gaji & Tunjangan': 'Nego Gaji',
  'Template Surat Lamaran & Email HRD': 'Surat & Email HRD',
  'Kata Kunci Lolos Sistem ATS': 'Kata Kunci ATS',
  'Prompt AI Bedah Info Loker': 'Prompt Info Loker'
};

function buildLibCardMarkup(item, { showRemoveFav = false } = {}) {
  const isFav = state.favorites.includes(item.id);
  const shortCat = SHORT_CAT_LABELS[item.category] || item.category;
  return `
    <article class="lib-card">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
          <span class="status-pill" style="white-space:nowrap;">${esc(shortCat)}</span>
          <span class="caption-label" style="font-size:11px;white-space:nowrap;flex-shrink:0;">${esc(item.niche)}</span>
        </div>
        <h3 class="card-title" style="font-size:17px;margin-bottom:6px;">${esc(item.title)}</h3>
        <p class="slate-copy" style="font-size:14px;">${esc(item.summary)}</p>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:12px;border-top:1px solid var(--border-subtle);">
        ${
          showRemoveFav
            ? `<button type="button" class="ghost-link btn-remove-fav-card" data-id="${esc(item.id)}" style="color:var(--color-negative-red);">Hapus Favorit</button>`
            : `<span style="font-size:12px;font-weight:600;color:${isFav ? 'var(--color-positive-green)' : 'var(--text-helper)'};">
                 ${isFav ? 'Tersimpan di Favorit' : 'Siap Pakai'}
               </span>`
        }
        <button type="button" class="ghost-link btn-open-lib-modal" data-id="${esc(item.id)}">Lihat Contoh</button>
      </div>
    </article>
  `;
}

function renderLibraryCards() {
  const list = getFilteredLibraryItems();
  document.getElementById('lib-count-badge').textContent = `${list.length} KOLEKSI`;
  const grid = document.getElementById('library-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="blueprint-card" style="grid-column:1/-1;"><p class="slate-copy">Tidak ada contekan yang cocok. Coba pilih Semua Kategori.</p></div>`;
    return;
  }
  grid.innerHTML = list.map((item) => buildLibCardMarkup(item)).join('');
  grid.querySelectorAll('.btn-open-lib-modal').forEach((b) => {
    b.addEventListener('click', () => openLibModal(b.dataset.id));
  });
}

function renderFavoritesGrid() {
  const grid = document.getElementById('favorites-grid');
  if (!grid) return;
  const list = CAREER_LIBRARY_ITEMS.filter((i) => state.favorites.includes(i.id));
  if (!list.length) {
    grid.innerHTML = `
      <div class="blueprint-card" style="grid-column:1/-1;">
        <p class="slate-copy" style="margin-bottom:12px;">Belum ada contekan yang disimpan ke Favorit.</p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-empty-fav-go">Jelajahi 120 Pustaka Karir</button>
      </div>`;
    document.getElementById('btn-empty-fav-go')?.addEventListener('click', () => switchView('library'));
    return;
  }
  grid.innerHTML = list.map((item) => buildLibCardMarkup(item, { showRemoveFav: true })).join('');
  grid.querySelectorAll('.btn-open-lib-modal').forEach((b) => {
    b.addEventListener('click', () => openLibModal(b.dataset.id));
  });
  grid.querySelectorAll('.btn-remove-fav-card').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      state.favorites = state.favorites.filter((x) => x !== id);
      updateCountersAndHistory();
      renderFavoritesGrid();
      renderLibraryCards();
      saveState();
      showToast('Dihapus dari Koleksi Favorit');
    });
  });
}

function openLibModal(id) {
  const item = CAREER_LIBRARY_ITEMS.find((x) => x.id === id);
  if (!item) return;
  state.modalItemId = item.id;
  document.getElementById('modal-cat-pill').textContent = item.category;
  document.getElementById('modal-niche-label').textContent = item.niche;
  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-explanation').textContent = item.explanation;
  document.getElementById('modal-example').textContent = item.example;
  document.getElementById('modal-tips').textContent = item.tips;

  const isFav = state.favorites.includes(item.id);
  document.getElementById('modal-btn-fav').textContent = isFav ? 'Hapus Favorit' : 'Simpan Favorit';
  document.getElementById('modal-btn-apply').textContent =
    item.category === 'Kalimat Pencapaian CV per Bidang'
      ? 'Tambahkan ke Poin CV & Salin'
      : 'Salin Kalimat Siap Pakai';
  document.getElementById('lib-modal').classList.add('open');
}

function closeLibModal() {
  document.getElementById('lib-modal').classList.remove('open');
  state.modalItemId = null;
}

function closeMobileDrawer() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
}

/* ================= RIWAYAT & PENGATURAN ================= */
function updateCountersAndHistory() {
  document.getElementById('stat-docs-count').textContent = String(state.history.length);
  document.getElementById('nav-hist-badge').textContent = String(state.history.length);
  document.getElementById('nav-fav-badge').textContent = String(state.favorites.length);

  const recentBox = document.getElementById('dash-recent-docs');
  if (state.history.length === 0) {
    recentBox.innerHTML = `
      <div class="blueprint-card" style="padding:18px;">
        <p class="slate-copy" style="font-size:14px;margin-bottom:12px;">
          Belum ada CV atau Surat Lamaran yang diunduh. Klik tombol di bawah untuk menyusun berkas pertamamu dalam 3 menit.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-recent-start">Mulai Buat CV Sekarang</button>
      </div>`;
    document.getElementById('btn-recent-start')?.addEventListener('click', () => switchView('wizard'));
  } else {
    recentBox.innerHTML = state.history
      .slice(0, 3)
      .map(
        (h) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);gap:8px;">
          <div style="min-width:0;">
            <strong style="font-size:14px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(h.targetPosition)} — ${esc(h.targetCompany)}</strong>
            <span style="font-size:12px;color:var(--text-secondary);">${esc(h.docType)} · ${esc(h.dateLabel)}</span>
          </div>
          <span class="status-pill green" style="flex-shrink:0;">Selesai</span>
        </div>`
      )
      .join('');
  }

  const histBox = document.getElementById('history-list-container');
  if (state.history.length === 0) {
    histBox.innerHTML = `<div class="blueprint-card"><p class="slate-copy">Belum ada berkas yang diunduh pada perangkat ini.</p></div>`;
  } else {
    histBox.innerHTML = state.history
      .map(
        (h) => `
        <div class="white-card" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <span class="status-pill blue" style="margin-bottom:6px;">${esc(h.docType)}</span>
            <h3 class="card-title">${esc(h.targetPosition)} — ${esc(h.targetCompany)}</h3>
            <p class="slate-copy" style="font-size:13.5px;">Pelamar: ${esc(h.fullName)} · Diunduh ${esc(h.dateLabel)}</p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button type="button" class="btn btn-secondary btn-sm btn-reopen-hist" data-id="${esc(h.id)}">Buka di Wizard</button>
            <button type="button" class="btn btn-secondary btn-sm btn-del-hist" data-id="${esc(h.id)}" style="color:var(--color-negative-red);">Hapus</button>
          </div>
        </div>`
      )
      .join('');

    histBox.querySelectorAll('.btn-reopen-hist').forEach((b) => {
      b.addEventListener('click', () => {
        const found = state.history.find((x) => x.id === b.dataset.id);
        if (!found) return;
        clearWizardValidationStyles();
        if (found.cvSnapshot && typeof found.cvSnapshot === 'object') {
          state.cv = { ...state.cv, ...JSON.parse(JSON.stringify(found.cvSnapshot)) };
        } else {
          if (found.fullName) state.cv.fullName = found.fullName;
          if (found.targetPosition) state.cv.targetPosition = found.targetPosition;
          if (found.targetCompany) state.cv.targetCompany = found.targetCompany;
        }
        if (found.roleId) state.selectedRoleId = found.roleId;
        state.step2ManuallyEdited = false;

        populateWizardInputsFromState();
        renderRolePresetChips();
        refreshAtsUi();
        renderLiveA4Preview();
        renderNegotiationScript(false);
        saveState();
        switchView('wizard');
        setWizardStepDom(3);
        showToast('Seluruh isi berkas berhasil dipulihkan ke Wizard!');
      });
    });

    histBox.querySelectorAll('.btn-del-hist').forEach((b) => {
      b.addEventListener('click', () => {
        if (!window.confirm('Hapus berkas ini dari riwayat perangkat?')) return;
        state.history = state.history.filter((x) => x.id !== b.dataset.id);
        updateCountersAndHistory();
        saveState();
        showToast('Berkas dihapus dari riwayat.');
      });
    });
  }
}

function switchView(viewId) {
  state.activeView = viewId;
  document.querySelectorAll('.view-pane').forEach((p) => {
    p.classList.toggle('active', p.id === `view-${viewId}`);
  });
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === viewId);
  });
  document.querySelectorAll('.mob-nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.mview === viewId);
  });
  closeMobileDrawer();

  if (viewId === 'favorites') renderFavoritesGrid();
  if (viewId === 'wizard' && state.wizardStep === 3) renderLiveA4Preview();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function enterStudio() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('studio-shell').classList.add('active');
  const firstName = state.user?.name || state.cv.fullName || 'Rekan Karier';
  document.getElementById('dash-greeting').textContent = `Halo, ${firstName}`;

  document.getElementById('set-name').value = state.cv.fullName;
  document.getElementById('set-city').value = state.cv.city;
  document.getElementById('set-phone').value = state.cv.phone;
  document.getElementById('set-portfolio').value = state.cv.portfolio;

  if (state.salaryCalc) {
    document.getElementById('calc-base-salary').value = state.salaryCalc.base ?? 6500000;
    if (state.salaryCalc.expMult) document.getElementById('calc-exp-level').value = String(state.salaryCalc.expMult);
    if (state.salaryCalc.cityMult) document.getElementById('calc-city-zone').value = String(state.salaryCalc.cityMult);
  }

  populateWizardInputsFromState();
  renderRolePresetChips();
  refreshAtsUi();
  updateSalaryCalculation();
  renderCategoryStrip();
  renderLibraryCards();
  renderFavoritesGrid();
  updateCountersAndHistory();
}

/* ================= EVENT LISTENERS ================= */
function initApp() {
  loadState();
  applyTheme(state.theme);

  // Populate Negotiation Scenario Select
  const negoSel = document.getElementById('nego-scenario-select');
  negoSel.innerHTML = SALARY_SCENARIOS.map(
    (s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`
  ).join('');
  negoSel.addEventListener('change', () => {
    if (state.negoScriptManuallyEdited) {
      const ok = window.confirm('Naskah negosiasi sudah Anda sunting manual. Ganti dengan template skenario baru?');
      if (!ok) return;
      state.negoScriptManuallyEdited = false;
    }
    renderNegotiationScript(true);
  });

  document.getElementById('nego-script-output').addEventListener('input', () => {
    state.negoScriptManuallyEdited = true;
  });

  document.getElementById('btn-reset-nego-script').addEventListener('click', () => {
    state.negoScriptManuallyEdited = false;
    renderNegotiationScript(true);
    showToast('Naskah negosiasi disegarkan sesuai data terbaru!');
  });

  // Login Handler (Salted SHA-256 Official Buyer & Creator Master Access)
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = document.getElementById('login-error');
    err.style.display = 'none';

    const name = document.getElementById('login-name').value.trim();
    const email = document.getElementById('login-email').value.trim();
    const rawCode = document.getElementById('login-code').value;
    const codeHash = hashAccessCode(rawCode);

    // 1-Click Creator / Developer Login (works even when name/email are blank)
    if (codeHash === CREATOR_MASTER_HASH || DEV_AGENT_HASHES.has(codeHash)) {
      const isDevAgent = DEV_AGENT_HASHES.has(codeHash);
      const finalName = name || (isDevAgent ? 'Tim Developer' : 'Nifari (Kreator Utama)');
      const finalEmail = email || (isDevAgent ? 'dev@karirlolos.id' : 'creator@nifari.id');
      state.user = {
        name: finalName,
        email: finalEmail,
        validHash: codeHash,
        role: 'creator'
      };
      if (name) state.cv.fullName = name;
      if (email) state.cv.email = email;
      document.getElementById('login-code').value = '';
      saveState();
      enterStudio();
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailValid) {
      err.textContent = 'Mohon lengkapi nama lengkap dan alamat email profesional yang valid.';
      err.style.display = 'block';
      return;
    }

    if (codeHash !== BUYER_ACCESS_HASH) {
      err.textContent =
        'Kode akses tidak dikenali. Silakan periksa kembali kode resmi dari email konfirmasi pembelian Anda.';
      err.style.display = 'block';
      return;
    }

    state.user = {
      name,
      email,
      validHash: codeHash,
      role: 'buyer'
    };
    state.cv.fullName = name;
    state.cv.email = email;
    document.getElementById('login-code').value = '';
    saveState();
    enterStudio();
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    state.user = null;
    saveState();
    document.getElementById('studio-shell').classList.remove('active');
    document.getElementById('login-screen').style.display = 'flex';
  });

  // Theme Toggles
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('btn-theme-mobile').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Navigation & Mobile Drawer
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });
  document.querySelectorAll('.mob-nav-item').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.mview));
  });
  document.getElementById('btn-open-drawer').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
  });
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeMobileDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeMobileDrawer);

  // Global Escape Key for Modal & Mobile Drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('lib-modal')?.classList.contains('open')) {
        closeLibModal();
      }
      if (document.getElementById('sidebar')?.classList.contains('open')) {
        closeMobileDrawer();
      }
    }
  });

  document.getElementById('dash-btn-open-wizard').addEventListener('click', () => switchView('wizard'));
  document.getElementById('dash-btn-open-nego').addEventListener('click', () => switchView('negotiation'));
  document.getElementById('dash-link-history').addEventListener('click', () => switchView('history'));

  // Salary Calculator
  ['calc-base-salary', 'calc-exp-level', 'calc-city-zone'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', updateSalaryCalculation);
    el.addEventListener('change', updateSalaryCalculation);
  });
  document.getElementById('btn-apply-salary-script').addEventListener('click', () => {
    updateSalaryCalculation();
    if (!state.negoScriptManuallyEdited) {
      renderNegotiationScript(true);
    }
    switchView('negotiation');
    showToast('Rentang gaji diterapkan ke Skrip Negosiasi!');
  });

  // Wizard Steps & Inputs
  document.querySelectorAll('.step-tab').forEach((b) => {
    b.addEventListener('click', () => switchWizardStep(Number(b.dataset.step)));
  });
  document.getElementById('btn-to-step-2').addEventListener('click', () => switchWizardStep(2));
  document.getElementById('btn-back-step-1').addEventListener('click', () => switchWizardStep(1));
  document.getElementById('btn-to-step-3').addEventListener('click', () => switchWizardStep(3));
  document.getElementById('btn-back-step-2').addEventListener('click', () => switchWizardStep(2));

  const step2EditableIds = new Set([
    'inp-summary',
    'exp1-role', 'exp1-company', 'exp1-period', 'exp1-bullets',
    'exp2-company-role', 'exp2-company', 'exp2-period', 'exp2-bullets',
    'inp-education', 'inp-skills', 'inp-certifications'
  ]);

  const wizInputIds = [
    'inp-full-name', 'inp-target-position', 'inp-target-company', 'inp-city',
    'inp-phone', 'inp-email', 'inp-portfolio', 'inp-summary',
    'exp1-role', 'exp1-company', 'exp1-period', 'exp1-bullets',
    'exp2-company-role', 'exp2-company', 'exp2-period', 'exp2-bullets',
    'inp-education', 'inp-skills', 'inp-certifications'
  ];
  wizInputIds.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      if (el.value.trim()) el.classList.remove('input-error');
      if (step2EditableIds.has(id)) {
        state.step2ManuallyEdited = true;
      }
      syncWizardStateFromInputs();
    });
  });

  document.getElementById('btn-pick-achievement-lib').addEventListener('click', () => {
    state.libCategory = 'Kalimat Pencapaian CV per Bidang';
    renderCategoryStrip();
    renderLibraryCards();
    switchView('library');
  });

  // Step 3 Preview Tabs
  document.getElementById('tab-preview-cv').addEventListener('click', () => {
    state.previewTab = 'cv';
    document.getElementById('tab-preview-cv').classList.add('active');
    document.getElementById('tab-preview-cl').classList.remove('active');
    renderLiveA4Preview();
  });
  document.getElementById('tab-preview-cl').addEventListener('click', () => {
    state.previewTab = 'cl';
    document.getElementById('tab-preview-cl').classList.add('active');
    document.getElementById('tab-preview-cv').classList.remove('active');
    renderLiveA4Preview();
  });

  // Step 3 Export 3 Files
  document.getElementById('btn-dl-cv-pdf').addEventListener('click', () => {
    const p = buildDocumentPayload();
    const safeName = p.fullName.replace(/[^a-z0-9]+/gi, '_') || 'Pelamar';
    triggerDownloadBlob(exportAtsCvPdf(p), `CV_ATS_${safeName}.pdf`, 'CV Standar ATS (.PDF)');
  });
  document.getElementById('btn-dl-cv-docx').addEventListener('click', () => {
    const p = buildDocumentPayload();
    const safeName = p.fullName.replace(/[^a-z0-9]+/gi, '_') || 'Pelamar';
    triggerDownloadBlob(exportAtsCvDocx(p), `CV_ATS_${safeName}.docx`, 'CV Word Siap Edit (.DOCX)');
  });
  document.getElementById('btn-dl-cl-pdf').addEventListener('click', () => {
    const p = buildDocumentPayload();
    const safeName = p.fullName.replace(/[^a-z0-9]+/gi, '_') || 'Pelamar';
    triggerDownloadBlob(exportCoverLetterPdf(p), `Surat_Lamaran_${safeName}.pdf`, 'Surat Lamaran Kerja (.PDF)');
  });

  document.getElementById('btn-copy-loker-prompt').addEventListener('click', () => {
    const p = buildDocumentPayload();
    const prompt = `Saya ingin melamar posisi ${p.targetPosition} di ${p.targetCompany}. Berikut ringkasan profil saya: "${p.summary}" dan keahlian saya: "${p.skills}". Tolong bedah teks info lowongan kerja yang akan saya tempel di bawah ini, lalu sebutkan 6 kata kunci ATS penting yang perlu saya tambahkan ke CV saya beserta 3 pertanyaan wawancara yang paling mungkin keluar:\n\n[Tempel Info Loker di Sini]`;
    navigator.clipboard?.writeText(prompt).catch(() => {});
    showToast('Prompt bedah loker disalin ke papan klip!');
  });

  document.getElementById('btn-copy-nego-script').addEventListener('click', () => {
    const txt = document.getElementById('nego-script-output').value;
    navigator.clipboard?.writeText(txt).catch(() => {});
    showToast('Skrip negosiasi disalin ke papan klip!');
  });

  // Library Search & Filter
  document.getElementById('lib-search-input').addEventListener('input', (e) => {
    state.libQuery = e.target.value;
    renderLibraryCards();
  });
  document.getElementById('lib-role-filter').addEventListener('change', (e) => {
    state.libRoleFilter = e.target.value;
    renderLibraryCards();
  });

  // Modal Actions
  document.getElementById('modal-btn-close').addEventListener('click', closeLibModal);
  document.getElementById('lib-modal').addEventListener('click', (e) => {
    if (e.target.id === 'lib-modal') closeLibModal();
  });
  document.getElementById('modal-btn-fav').addEventListener('click', () => {
    const id = state.modalItemId;
    if (!id) return;
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter((x) => x !== id);
      showToast('Dihapus dari Favorit');
    } else {
      state.favorites.push(id);
      showToast('Disimpan ke Favorit!');
    }
    document.getElementById('modal-btn-fav').textContent = state.favorites.includes(id)
      ? 'Hapus Favorit'
      : 'Simpan Favorit';
    updateCountersAndHistory();
    renderLibraryCards();
    renderFavoritesGrid();
    saveState();
  });

  document.getElementById('modal-btn-apply').addEventListener('click', () => {
    const item = CAREER_LIBRARY_ITEMS.find((x) => x.id === state.modalItemId);
    if (!item) return;
    navigator.clipboard?.writeText(item.example).catch(() => {});
    if (item.category === 'Kalimat Pencapaian CV per Bidang') {
      state.cv.exp1BulletsText = (state.cv.exp1BulletsText.trim() + '\n' + item.example).trim();
      state.step2ManuallyEdited = true;
      populateWizardInputsFromState();
      refreshAtsUi();
      renderLiveA4Preview();
      saveState();
      showToast('Ditambahkan ke Poin Pengalaman CV & disalin!');
    } else {
      showToast('Contoh kalimat berhasil disalin!');
    }
    closeLibModal();
  });

  // History & Settings
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    if (state.history.length === 0) return;
    if (!window.confirm('Yakin ingin menghapus seluruh riwayat berkas di perangkat ini?')) return;
    state.history = [];
    updateCountersAndHistory();
    saveState();
    showToast('Riwayat berkas dibersihkan.');
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    state.cv.fullName = document.getElementById('set-name').value.trim() || state.cv.fullName;
    state.cv.city = document.getElementById('set-city').value.trim();
    state.cv.phone = document.getElementById('set-phone').value.trim();
    state.cv.portfolio = document.getElementById('set-portfolio').value.trim();
    if (state.user) state.user.name = state.cv.fullName;
    document.getElementById('dash-greeting').textContent = `Halo, ${state.cv.fullName}`;
    populateWizardInputsFromState();
    refreshAtsUi();
    renderLiveA4Preview();
    renderNegotiationScript(false);
    saveState();
    showToast('Profil kontak pelamar berhasil disimpan!');
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const exportPayload = {
      theme: state.theme,
      selectedRoleId: state.selectedRoleId,
      salaryCalc: state.salaryCalc,
      cv: state.cv,
      favorites: state.favorites,
      history: state.history
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cadangan_KarirLolos_Studio.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.getElementById('inp-import-json').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const currentAuthUser = state.user;
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON');
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        applyTheme(parsed.theme);
      }
      if (typeof parsed.selectedRoleId === 'string') {
        state.selectedRoleId = parsed.selectedRoleId;
      }
      if (parsed.salaryCalc && typeof parsed.salaryCalc === 'object') {
        state.salaryCalc = { ...state.salaryCalc, ...parsed.salaryCalc };
      }
      if (parsed.cv && typeof parsed.cv === 'object') {
        state.cv = { ...state.cv, ...parsed.cv };
      }
      if (Array.isArray(parsed.favorites)) state.favorites = parsed.favorites;
      if (Array.isArray(parsed.history)) state.history = parsed.history;

      // Preserve authenticated session — backup import never overwrites or bypasses auth
      state.user = currentAuthUser;
      state.step2ManuallyEdited = false;
      saveState();
      if (state.user && isValidLicenseHash(state.user.validHash)) {
        enterStudio();
      }
      showToast('Data cadangan berhasil dipulihkan!');
    } catch {
      showToast('File cadangan tidak valid.');
    } finally {
      e.target.value = '';
    }
  });

  if (state.user && isValidLicenseHash(state.user.validHash)) {
    enterStudio();
  }
}

window.__karirLolosDebug = {
  buildDocumentPayload,
  exportAtsCvPdf,
  exportAtsCvDocx,
  exportCoverLetterPdf,
  computeAtsAudit
};

initApp();

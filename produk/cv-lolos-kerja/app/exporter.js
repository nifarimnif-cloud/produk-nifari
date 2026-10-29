/**
 * KarirLolos Studio — Mesin Ekspor 3 Dokumen Lamaran Kerja Resmi 100% di Browser
 * 1. CV Standar ATS 1 Kolom Bersih (.PDF A4 — Teks Asli Mudah Dibaca Mesin ATS & HRD)
 * 2. CV Standar ATS Siap Edit (.DOCX Microsoft Word / Google Docs)
 * 3. Surat Lamaran Kerja / Cover Letter Resmi (.PDF A4)
 */

export function formatRp(num) {
  const n = Math.round(Number(num) || 0);
  const neg = n < 0 ? '-' : '';
  return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function summarizeSkillsClean(skills, maxLen = 120) {
  const s = String(skills || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= maxLen) return s;

  let depth = 0;
  let lastTopComma = -1;
  let lastTopSpace = -1;
  let lastAnySpace = -1;

  for (let i = 0; i < Math.min(s.length, maxLen + 1); i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;

    if (i <= maxLen) {
      if (ch === ',' && depth === 0 && i >= 24) {
        lastTopComma = i;
      }
      if (ch === ' ') {
        lastAnySpace = i;
        if (depth === 0 && i >= 24) lastTopSpace = i;
      }
    }
  }

  if (lastTopComma > 0) {
    return s.slice(0, lastTopComma).trim();
  }
  if (lastTopSpace > 0) {
    return s.slice(0, lastTopSpace).replace(/[,;:\s]+$/, '').trim();
  }
  if (lastAnySpace > 0) {
    let cut = s.slice(0, lastAnySpace).replace(/[,;:\s]+$/, '').trim();
    const opens = (cut.match(/\(/g) || []).length;
    const closes = (cut.match(/\)/g) || []).length;
    if (opens > closes) cut += ')'.repeat(opens - closes);
    return cut;
  }
  return s.slice(0, maxLen).trim();
}

function normalizePdfAscii(str) {
  return String(str ?? '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u00B7/g, '|')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function sanitizePdfText(str) {
  return normalizePdfAscii(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function estimatePdfWidthPt(str, fontSize, bold = false) {
  const clean = normalizePdfAscii(str);
  let units = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if ('ilI.,:;\'!| '.includes(ch)) units += 0.29;
    else if ('()[]-/'.includes(ch)) units += 0.35;
    else if ('mw'.includes(ch)) units += 0.8;
    else if ('MW'.includes(ch)) units += 0.9;
    else if (ch >= 'A' && ch <= 'Z') units += 0.69;
    else units += 0.56;
  }
  return units * fontSize * (bold ? 1.07 : 1.0);
}

function wrapPdfByWidthPt(text, maxWidthPt, fontSize, bold = false) {
  const paragraphs = normalizePdfAscii(text).split(/\n+/);
  const out = [];
  for (const para of paragraphs) {
    const rawWords = para.trim().split(/\s+/).filter(Boolean);
    if (!rawWords.length) continue;
    const words = [];
    for (const rw of rawWords) {
      if (estimatePdfWidthPt(rw, fontSize, bold) <= maxWidthPt) {
        words.push(rw);
      } else {
        let chunk = '';
        for (let i = 0; i < rw.length; i++) {
          const next = chunk + rw[i];
          if (chunk && estimatePdfWidthPt(next, fontSize, bold) > maxWidthPt) {
            words.push(chunk);
            chunk = rw[i];
          } else {
            chunk = next;
          }
        }
        if (chunk) words.push(chunk);
      }
    }
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (!cur || estimatePdfWidthPt(candidate, fontSize, bold) <= maxWidthPt) {
        cur = candidate;
      } else {
        out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
  }
  return out.length ? out : [''];
}

function wrapPlainText(text, maxChars) {
  const paragraphs = String(text || '').split(/\n+/);
  const out = [];
  for (const para of paragraphs) {
    const rawWords = para.trim().split(/\s+/).filter(Boolean);
    if (!rawWords.length) continue;
    const words = [];
    for (const rw of rawWords) {
      if (rw.length <= maxChars) {
        words.push(rw);
      } else {
        for (let i = 0; i < rw.length; i += maxChars) {
          words.push(rw.slice(i, i + maxChars));
        }
      }
    }
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      if ((cur + ' ' + words[i]).length <= maxChars) {
        cur += ' ' + words[i];
      } else {
        out.push(cur);
        cur = words[i];
      }
    }
    out.push(cur);
  }
  return out.length ? out : [''];
}

function buildCleanA4Pdf(pagesCommands) {
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegularId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const pageIds = [];
  const pagesRootPlaceholder = addObj('');

  for (let i = 0; i < pagesCommands.length; i++) {
    const streamStr = pagesCommands[i].join('\n');
    const contentId = addObj(`<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesRootPlaceholder} 0 R /MediaBox [0 0 595 842] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }

  objects[pagesRootPlaceholder - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesRootPlaceholder} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/* ==========================================================================
   1. EKSPOR CV STANDAR ATS 1 KOLOM BERSIH (.PDF A4)
   ========================================================================== */
export function exportAtsCvPdf(cv) {
  const pages = [[]];
  let curPage = pages[0];
  let y = 788;
  const leftX = 48;
  const rightX = 547;
  const bodyWidthPt = rightX - leftX;

  const ensureSpace = (needed) => {
    if (y - needed < 52) {
      curPage = [];
      pages.push(curPage);
      y = 788;
    }
  };

  const addText = (txt, x, yPos, font = 'F1', size = 10, rgb = '0.04 0.04 0.05') => {
    curPage.push(`BT /${font} ${size} Tf ${rgb} rg ${x} ${yPos} Td (${sanitizePdfText(txt)}) Tj ET`);
  };

  const addSectionHeader = (title) => {
    ensureSpace(34);
    y -= 10;
    addText(title.toUpperCase(), leftX, y, 'F2', 10.5, '0.00 0.32 1.00');
    y -= 5;
    curPage.push(`0.87 0.88 0.89 RG 0.8 w ${leftX} ${y} m ${rightX} ${y} l S`);
    y -= 14;
  };

  // Top Coinbase Blue Blueprint Rule
  curPage.push(`0.00 0.32 1.00 rg ${leftX} 804 ${bodyWidthPt} 4 re f`);

  // Candidate Full Name & Target Position (wrapped safely within A4 margins)
  const nameLines = wrapPdfByWidthPt(cv.fullName || 'Nama Lengkap Pelamar', bodyWidthPt, 20, true);
  nameLines.forEach((ln, idx) => {
    ensureSpace(22);
    addText(ln, leftX, y, 'F2', 20, '0.04 0.04 0.05');
    y -= idx === nameLines.length - 1 ? 18 : 22;
  });

  const posLines = wrapPdfByWidthPt(cv.targetPosition || 'Posisi yang Dilamar', bodyWidthPt, 11.5, true);
  posLines.forEach((ln) => {
    ensureSpace(16);
    addText(ln, leftX, y, 'F2', 11.5, '0.00 0.32 1.00');
    y -= 15;
  });

  const contactParts = [cv.city, cv.phone, cv.email, cv.portfolio]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join('  |  ');
  if (contactParts) {
    for (const line of wrapPdfByWidthPt(contactParts, bodyWidthPt, 9.5, false)) {
      ensureSpace(14);
      addText(line, leftX, y, 'F1', 9.5, '0.35 0.38 0.43');
      y -= 13;
    }
  }

  // Ringkasan Profesional
  const cleanSummary = String(cv.summary || '').trim();
  if (cleanSummary) {
    addSectionHeader('RINGKASAN PROFESIONAL');
    for (const line of wrapPdfByWidthPt(cleanSummary, bodyWidthPt, 10, false)) {
      ensureSpace(14);
      addText(line, leftX, y, 'F1', 10, '0.12 0.13 0.15');
      y -= 14;
    }
  }

  // Pengalaman Kerja & Organisasi
  const validExps = (Array.isArray(cv.experiences) ? cv.experiences : []).filter(
    (e) =>
      String(e?.role || '').trim() ||
      String(e?.company || '').trim() ||
      (Array.isArray(e?.bullets) && e.bullets.some((b) => String(b || '').trim()))
  );

  if (validExps.length > 0) {
    addSectionHeader('PENGALAMAN KERJA & PROYEK RELEVAN');
    for (const exp of validExps) {
      const periodStr = String(exp.period || '').trim();
      let periodX = rightX;
      let roleMaxWidth = bodyWidthPt;

      if (periodStr) {
        const periodW = estimatePdfWidthPt(periodStr, 9.5, true);
        periodX = Math.max(352, Math.round(rightX - periodW));
        roleMaxWidth = Math.max(240, periodX - leftX - 14);
      }

      const roleLines = wrapPdfByWidthPt(String(exp.role || '').trim() || 'Jabatan / Peran', roleMaxWidth, 10.5, true);
      ensureSpace(roleLines.length * 13.5 + 24);

      if (periodStr) {
        addText(periodStr, periodX, y, 'F2', 9.5, '0.35 0.38 0.43');
      }
      roleLines.forEach((rLine) => {
        addText(rLine, leftX, y, 'F2', 10.5, '0.04 0.04 0.05');
        y -= 13.5;
      });

      const compStr = String(exp.company || '').trim();
      if (compStr) {
        for (const cLine of wrapPdfByWidthPt(compStr, bodyWidthPt, 9.8, false)) {
          ensureSpace(14);
          addText(cLine, leftX, y, 'F1', 9.8, '0.35 0.38 0.43');
          y -= 14;
        }
      }

      const bullets = (Array.isArray(exp.bullets) ? exp.bullets : [])
        .map((b) => String(b || '').trim())
        .filter(Boolean);
      for (const b of bullets) {
        const wrapped = wrapPdfByWidthPt(b, bodyWidthPt - 22, 9.8, false);
        wrapped.forEach((wLine, idx) => {
          ensureSpace(14);
          const prefix = idx === 0 ? '-  ' : '   ';
          addText(prefix + wLine, leftX + 6, y, 'F1', 9.8, '0.12 0.13 0.15');
          y -= 13.5;
        });
      }
      y -= 5;
    }
  }

  // Pendidikan
  const cleanEdu = String(cv.education || '').trim();
  if (cleanEdu) {
    addSectionHeader('PENDIDIKAN');
    for (const line of wrapPdfByWidthPt(cleanEdu, bodyWidthPt, 10, true)) {
      ensureSpace(14);
      addText(line, leftX, y, 'F2', 10, '0.04 0.04 0.05');
      y -= 14;
    }
  }

  // Keahlian Utama
  const cleanSkills = String(cv.skills || '').trim();
  if (cleanSkills) {
    addSectionHeader('KEAHLIAN UTAMA & PERANGKAT KERJA');
    for (const line of wrapPdfByWidthPt(cleanSkills, bodyWidthPt, 10, false)) {
      ensureSpace(14);
      addText(line, leftX, y, 'F1', 10, '0.12 0.13 0.15');
      y -= 14;
    }
  }

  // Sertifikasi & Pelatihan
  const cleanCerts = String(cv.certifications || '').trim();
  if (cleanCerts) {
    addSectionHeader('SERTIFIKASI & PELATIHAN PENDUKUNG');
    for (const line of wrapPdfByWidthPt(cleanCerts, bodyWidthPt, 10, false)) {
      ensureSpace(14);
      addText(line, leftX, y, 'F1', 10, '0.12 0.13 0.15');
      y -= 14;
    }
  }

  return buildCleanA4Pdf(pages);
}

/* ==========================================================================
   2. EKSPOR SURAT LAMARAN KERJA RESMI (.PDF A4 — MULTI-PAGE SAFE)
   ========================================================================== */
export function exportCoverLetterPdf(cv) {
  const pages = [[]];
  let curPage = pages[0];
  let y = 784;
  const leftX = 52;
  const rightX = 543;
  const bodyWidthPt = rightX - leftX;

  const ensureSpace = (needed) => {
    if (y - needed < 54) {
      curPage = [];
      pages.push(curPage);
      y = 784;
      curPage.push(`0.00 0.32 1.00 rg ${leftX} 802 ${bodyWidthPt} 3 re f`);
    }
  };

  const addText = (txt, x, yPos, font = 'F1', size = 10.5, rgb = '0.08 0.09 0.11') => {
    curPage.push(`BT /${font} ${size} Tf ${rgb} rg ${x} ${yPos} Td (${sanitizePdfText(txt)}) Tj ET`);
  };

  const addWrappedLines = (txt, font = 'F1', size = 10.5, rgb = '0.12 0.13 0.15', lineStep = 15, spacingAfter = 0, xOffset = 0) => {
    const bold = font === 'F2';
    const lines = wrapPdfByWidthPt(txt, bodyWidthPt - xOffset, size, bold);
    for (const ln of lines) {
      ensureSpace(lineStep + 2);
      addText(ln, leftX + xOffset, y, font, size, rgb);
      y -= lineStep;
    }
    y -= spacingAfter;
  };

  const addParagraph = (txt, spacingAfter = 10) => {
    addWrappedLines(txt, 'F1', 10.5, '0.12 0.13 0.15', 15, spacingAfter, 0);
  };

  curPage.push(`0.00 0.32 1.00 rg ${leftX} 802 ${bodyWidthPt} 4 re f`);

  addWrappedLines(cv.fullName || 'Pelamar Kerja', 'F2', 16, '0.04 0.04 0.05', 18, 0, 0);
  const headerContacts = [cv.city, cv.phone, cv.email, cv.portfolio]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join('  |  ');
  if (headerContacts) {
    addWrappedLines(headerContacts, 'F1', 9.5, '0.35 0.38 0.43', 13, 0, 0);
  }
  y -= 4;
  curPage.push(`0.85 0.86 0.88 RG 0.8 w ${leftX} ${y} m ${rightX} ${y} l S`);
  y -= 22;

  addWrappedLines(`${cv.city || 'Jakarta'}, ${cv.dateLabel || '28 Oktober 2026'}`, 'F1', 10.5, '0.08 0.09 0.11', 15, 6, 0);
  addWrappedLines(`Perihal: Lamaran Pekerjaan — Posisi ${cv.targetPosition || 'Staf Profesional'}`, 'F2', 10.5, '0.08 0.09 0.11', 15, 10, 0);

  ensureSpace(48);
  addText('Kepada Yth.', leftX, y, 'F1', 10.5);
  y -= 15;
  addWrappedLines(`Bapak/Ibu Pimpinan & Tim HRD ${cv.targetCompany || 'Perusahaan Tujuan'}`, 'F2', 10.5, '0.08 0.09 0.11', 15, 0, 0);
  ensureSpace(20);
  addText('Di Tempat', leftX, y, 'F1', 10.5);
  y -= 24;

  ensureSpace(24);
  addText('Dengan hormat,', leftX, y, 'F1', 10.5);
  y -= 18;

  const fullName = cv.fullName || 'Pelamar Kerja';
  const targetPos = cv.targetPosition || 'Staf Profesional';
  const targetComp = cv.targetCompany || 'Perusahaan Tujuan';

  addParagraph(
    `Melalui surat ini, saya ${fullName} bermaksud mengajukan lamaran pekerjaan untuk mengisi posisi ${targetPos} di ${targetComp}. Bekal pengalaman, ketelitian kerja, serta penguasaan perangkat pendukung yang saya miliki selaras dengan kebutuhan tim Bapak/Ibu.`
  );

  const cleanSummary = String(cv.summary || '').trim();
  if (cleanSummary) {
    addParagraph(cleanSummary);
  }

  const firstExp = Array.isArray(cv.experiences) && cv.experiences.find((e) => Array.isArray(e?.bullets) && e.bullets.length > 0);
  if (firstExp) {
    ensureSpace(32);
    addText('Beberapa kontribusi nyata yang pernah saya capai antara lain:', leftX, y, 'F2', 10.5);
    y -= 16;
    for (const b of firstExp.bullets.slice(0, 3)) {
      const wrapped = wrapPdfByWidthPt(b, bodyWidthPt - 24, 10.2, false);
      wrapped.forEach((ln, idx) => {
        ensureSpace(16);
        addText((idx === 0 ? '-  ' : '   ') + ln, leftX + 6, y, 'F1', 10.2);
        y -= 14.5;
      });
    }
    y -= 10;
  }

  const skillSummary = summarizeSkillsClean(cv.skills, 120);
  const attachText = skillSummary
    ? `Sebagai bahan pertimbangan lebih lanjut, bersama surat ini saya lampirkan Curriculum Vitae (CV) terbaru yang memuat rincian riwayat pengalaman, pendidikan, serta keahlian utama (${skillSummary}).`
    : 'Sebagai bahan pertimbangan lebih lanjut, bersama surat ini saya lampirkan Curriculum Vitae (CV) terbaru yang memuat rincian riwayat pengalaman, pendidikan, serta keahlian pendukung yang relevan.';
  addParagraph(attachText);

  addParagraph(
    `Besar harapan saya untuk memperoleh kesempatan wawancara guna menjelaskan bagaimana saya dapat segera berkontribusi positif bagi ${targetComp}. Atas waktu dan perhatian Bapak/Ibu, saya ucapkan terima kasih.`
  );

  const footerContact = [cv.phone, cv.portfolio]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join('  |  ');
  const footerContactLines = footerContact ? wrapPdfByWidthPt(footerContact, bodyWidthPt, 9.5, false) : [];
  ensureSpace(76 + footerContactLines.length * 13);

  y -= 10;
  addText('Hormat saya,', leftX, y, 'F1', 10.5);
  y -= 42;
  addWrappedLines(fullName, 'F2', 11, '0.04 0.04 0.05', 14, 0, 0);
  footerContactLines.forEach((ln) => {
    addText(ln, leftX, y, 'F1', 9.5, '0.35 0.38 0.43');
    y -= 13;
  });

  return buildCleanA4Pdf(pages);
}

/* ==========================================================================
   3. EKSPOR CV STANDAR ATS SIAP EDIT (.DOCX MICROSOFT WORD)
   ========================================================================== */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createStoredZip(entries) {
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const dataBytes = typeof entry.content === 'string' ? enc.encode(entry.content) : entry.content;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x2100, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x2100, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const cp of centralParts) centralSize += cp.length;

  const endRec = new Uint8Array(22);
  const ev = new DataView(endRec.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRec], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

function xmlEsc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportAtsCvDocx(cv) {
  const p = (txt, bold = false, sizeHalfPt = 21, hexColor = '0A0B0D', afterTwips = 110) => `
    <w:p>
      <w:pPr><w:spacing w:after="${afterTwips}"/></w:pPr>
      <w:r>
        <w:rPr>${bold ? '<w:b/>' : ''}<w:color w:val="${hexColor}"/><w:sz w:val="${sizeHalfPt}"/></w:rPr>
        <w:t xml:space="preserve">${xmlEsc(txt)}</w:t>
      </w:r>
    </w:p>`;

  const validExps = (cv.experiences || []).filter(
    (e) =>
      String(e?.role || '').trim() ||
      String(e?.company || '').trim() ||
      (Array.isArray(e?.bullets) && e.bullets.some((b) => String(b || '').trim()))
  );

  const expXml = validExps
    .map((e) => {
      const roleStr = String(e.role || '').trim() || 'Jabatan / Peran';
      const periodStr = String(e.period || '').trim();
      const headLine = periodStr ? `${roleStr}  |  ${periodStr}` : roleStr;
      const head = p(headLine, true, 22, '0A0B0D', 40);
      const compStr = String(e.company || '').trim();
      const comp = compStr ? p(compStr, false, 20, '5B616E', 80) : '';
      const buls = (e.bullets || [])
        .map((b) => String(b || '').trim())
        .filter(Boolean)
        .map((b) => p(`• ${b}`, false, 20, '0A0B0D', 70))
        .join('');
      return head + comp + buls;
    })
    .join('');

  const contactStr = [cv.city, cv.phone, cv.email, cv.portfolio]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join('  |  ');

  const cleanSummary = String(cv.summary || '').trim();
  const cleanEdu = String(cv.education || '').trim();
  const cleanSkills = String(cv.skills || '').trim();
  const cleanCerts = String(cv.certifications || '').trim();

  const sectionsXml = [
    p(cv.fullName || 'Nama Lengkap Pelamar', true, 36, '0A0B0D', 60),
    p(cv.targetPosition || 'Posisi Target', true, 24, '0052FF', 80),
    contactStr ? p(contactStr, false, 19, '5B616E', 180) : '',
    cleanSummary ? p('RINGKASAN PROFESIONAL', true, 22, '0052FF', 80) + p(cleanSummary, false, 20, '0A0B0D', 180) : '',
    expXml ? p('PENGALAMAN KERJA & PROYEK RELEVAN', true, 22, '0052FF', 100) + expXml : '',
    cleanEdu ? p('PENDIDIKAN', true, 22, '0052FF', 80) + p(cleanEdu, true, 20, '0A0B0D', 160) : '',
    cleanSkills ? p('KEAHLIAN UTAMA & PERANGKAT KERJA', true, 22, '0052FF', 80) + p(cleanSkills, false, 20, '0A0B0D', 160) : '',
    cleanCerts ? p('SERTIFIKASI & PELATIHAN PENDUKUNG', true, 22, '0052FF', 80) + p(cleanCerts, false, 20, '0A0B0D', 120) : ''
  ].join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${sectionsXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return createStoredZip([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rootRels },
    { name: 'word/document.xml', content: docXml }
  ]);
}

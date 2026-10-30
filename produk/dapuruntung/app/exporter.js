// Mesin Ekspor 4 Dokumen Asli DapurUntung Studio (100% Client-Side: PDF Kartu SOP Resep A4, PNG Poster Menu 1080x1350, CSV Belanja Pasar & PDF Audit Harga Ojol A4)
(function () {
  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    const neg = n < 0 ? '- ' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatNum(num, decimals = 1) {
    const val = Number(num) || 0;
    if (Math.abs(val - Math.round(val)) < 0.01) return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return val.toFixed(decimals).replace('.', ',');
  }

  function slugify(str) {
    return (
      String(str || 'dapuruntung')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 44) || 'dapuruntung'
    );
  }

  function formatIndoDate(isoStr) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (isoStr && /^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
      const p = isoStr.split('-');
      return `${Number(p[2])} ${months[Number(p[1]) - 1] || p[1]} ${p[0]}`;
    }
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 350);
  }

  function normalizePdfAscii(str) {
    return String(str || '')
      .replace(/\u2022/g, '-')
      .replace(/\u2192/g, '->')
      .replace(/\u2190/g, '<-')
      .replace(/\u2264/g, '<=')
      .replace(/\u2265/g, '>=')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[^\x20-\x7E]/g, ' ');
  }

  function sanitizePdf(str) {
    return normalizePdfAscii(str)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function estimatePdfWidth(str, fontSize, bold = false) {
    const clean = normalizePdfAscii(str);
    let units = 0;
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      if ("ilI.,:;'!| ".includes(ch)) units += 0.29;
      else if ('()[]-/'.includes(ch)) units += 0.35;
      else if ('mw'.includes(ch)) units += 0.8;
      else if ('MW'.includes(ch)) units += 0.9;
      else if (ch >= 'A' && ch <= 'Z') units += 0.69;
      else units += 0.56;
    }
    return units * fontSize * (bold ? 1.07 : 1.0);
  }

  function splitTokenByPdfWidth(token, maxWidthPt, fontSize, bold) {
    if (estimatePdfWidth(token, fontSize, bold) <= maxWidthPt) return [token];
    const parts = [];
    let cur = '';
    for (let i = 0; i < token.length; i++) {
      const next = cur + token[i];
      if (cur && estimatePdfWidth(next, fontSize, bold) > maxWidthPt) {
        parts.push(cur);
        cur = token[i];
      } else {
        cur = next;
      }
    }
    if (cur) parts.push(cur);
    return parts;
  }

  function wrapPdfByWidth(text, maxWidthPt, fontSize, bold = false) {
    const rawWords = normalizePdfAscii(text).replace(/\s+/g, ' ').trim().split(' ');
    const words = [];
    for (const rw of rawWords) {
      if (!rw) continue;
      words.push(...splitTokenByPdfWidth(rw, maxWidthPt, fontSize, bold));
    }
    const lines = [];
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (!cur || estimatePdfWidth(candidate, fontSize, bold) <= maxWidthPt) {
        cur = candidate;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function buildMultiPagePdf(pagesCommands) {
    const objects = [];
    const numPages = pagesCommands.length;
    const kidsRefs = [];
    for (let i = 0; i < numPages; i++) kidsRefs.push(`${5 + i * 2} 0 R`);

    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${numPages} >>\nendobj\n`);
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

    for (let i = 0; i < numPages; i++) {
      const pageObjId = 5 + i * 2;
      const contentObjId = 6 + i * 2;
      const stream = pagesCommands[i].join('\n');
      objects.push(
        `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
      );
      objects.push(
        `${contentObjId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
      );
    }

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += obj;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  function pdfTextRight(cmds, text, rightX, y, fontSize, bold = false) {
    const w = estimatePdfWidth(text, fontSize, bold);
    const x = Math.max(36, rightX - w);
    cmds.push(`BT /${bold ? 'F2' : 'F1'} ${fontSize} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${sanitizePdf(text)}) Tj ET`);
  }

  // 1. EKSPOR PDF A4 — KARTU STANDAR RESEP, GRAMASI, % YIELD & HPP DAPUR
  function exportRecipeSopPdf(calc, shopInfo = {}) {
    const pages = [[]];
    let cmds = pages[0];
    let y = 795;

    const shopName = (shopInfo.shopName || '').trim() || 'Dapur Kuliner Mandiri';
    const ownerName = (shopInfo.ownerName || '').trim() || 'Kepala Dapur';
    const shopCity = (shopInfo.city || '').trim() || 'Indonesia';
    const dateStr = formatIndoDate();

    function ensureSpace(needPt) {
      if (y - needPt < 55) {
        cmds = [];
        pages.push(cmds);
        cmds.push('0.184 0.184 0.184 rg');
        cmds.push('0.88 0.88 0.88 RG 0.4 w');
        y = 795;
      }
    }

    // Header Foodnoms Clean Style: Graphite bar + Ember Orange (#ff5406 -> 1.0 0.329 0.024) accent
    cmds.push('0.184 0.184 0.184 rg 36 742 523 64 re f');
    cmds.push('1 0.329 0.024 rg 36 738 523 4 re f');
    cmds.push('1 1 1 rg');
    const hTitle = wrapPdfByWidth('KARTU STANDAR RESEP (SOP GRAMASI & HPP DAPUR)', 495, 12.5, true)[0];
    cmds.push(`BT /F2 12.5 Tf 48 784 Td (${sanitizePdf(hTitle)}) Tj ET`);
    const subShop = wrapPdfByWidth(`${shopName} | ${shopCity} | Tanggal Cetak: ${dateStr}`, 495, 9, false)[0];
    cmds.push(`BT /F1 9 Tf 48 767 Td (${sanitizePdf(subShop)}) Tj ET`);
    const menuHead = wrapPdfByWidth(`Menu: ${calc.menuName} (${calc.category || 'Menu Utama'})`, 495, 9.5, true)[0];
    cmds.push('1 0.82 0.72 rg');
    cmds.push(`BT /F2 9.5 Tf 48 751 Td (${sanitizePdf(menuHead)}) Tj ET`);

    y = 718;

    // 4 Metric Summary Boxes on Fog (#f5f5f5 -> 0.961 0.961 0.961)
    const boxW = 124;
    const summaryMetrics = [
      { label: 'HASIL 1 RESEP', val: `${calc.batchPortions} Porsi`, sub: 'Takaran Baku' },
      { label: 'HPP BAHAN / PORSI', val: formatRp(calc.rawCostPerPortion), sub: 'Termasuk Susut Yield' },
      { label: 'KEMASAN + GAS', val: formatRp(calc.packagingPerPortion + calc.gasUtilityPerPortion), sub: 'Beban per Porsi' },
      { label: 'TOTAL HPP BERSIH', val: formatRp(calc.totalHppPerPortion), sub: `Rasio ${calc.offlineFoodCostPct.toFixed(1)}% Offline` }
    ];
    summaryMetrics.forEach((m, i) => {
      const bx = 36 + i * (boxW + 9);
      cmds.push('0.961 0.961 0.961 rg');
      cmds.push(`${bx} ${y - 46} ${boxW} 46 re f`);
      cmds.push('0.90 0.90 0.90 RG 0.6 w');
      cmds.push(`${bx} ${y - 46} ${boxW} 46 re S`);
      cmds.push('0.45 0.45 0.45 rg');
      cmds.push(`BT /F2 7.5 Tf ${bx + 8} ${y - 13} Td (${sanitizePdf(m.label)}) Tj ET`);
      cmds.push(i === 3 ? '0 0.702 0.247 rg' : '0.184 0.184 0.184 rg');
      const fitVal = wrapPdfByWidth(m.val, 108, 10.5, true)[0];
      cmds.push(`BT /F2 10.5 Tf ${bx + 8} ${y - 28} Td (${sanitizePdf(fitVal)}) Tj ET`);
      cmds.push('0.45 0.45 0.45 rg');
      const fitSub = wrapPdfByWidth(m.sub, 108, 7.5, false)[0];
      cmds.push(`BT /F1 7.5 Tf ${bx + 8} ${y - 40} Td (${sanitizePdf(fitSub)}) Tj ET`);
    });

    y -= 64;

    // Section A: Tabel Bahan Baku & % Yield
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (A. RINCIAN GRAMASI BAHAN BAKU & KOREKSI SUSUT \\(% YIELD\\)) Tj ET`);
    y -= 10;

    // Table Header
    cmds.push('0.184 0.184 0.184 rg 36 ' + (y - 18) + ' 523 18 re f');
    cmds.push('1 1 1 rg');
    cmds.push(`BT /F2 8 Tf 42 ${y - 12} Td (NAMA BAHAN BAKU) Tj ET`);
    cmds.push(`BT /F2 8 Tf 218 ${y - 12} Td (HARGA BELI) Tj ET`);
    cmds.push(`BT /F2 8 Tf 304 ${y - 12} Td (YIELD) Tj ET`);
    cmds.push(`BT /F2 8 Tf 348 ${y - 12} Td (PAKAI / BATCH) Tj ET`);
    cmds.push(`BT /F2 8 Tf 425 ${y - 12} Td (PER PORSI) Tj ET`);
    pdfTextRight(cmds, 'BIAYA BATCH', 553, y - 12, 8, true);
    y -= 18;

    (calc.ingredientRows || []).forEach((row, idx) => {
      const nameLines = wrapPdfByWidth(row.name, 168, 8.2, false);
      const buyTxt = `${formatRp(row.buyPrice)} / ${formatNum(row.buyQty)} ${row.unit}`;
      const buyLines = wrapPdfByWidth(buyTxt, 80, 7.8, false);
      const useLines = wrapPdfByWidth(`${formatNum(row.useQty)} ${row.unit}`, 72, 8, false);
      const porLines = wrapPdfByWidth(`${formatNum(row.perPortionQty, 1)} ${row.unit}`, 62, 8, false);
      const maxLines = Math.max(nameLines.length, buyLines.length, useLines.length, porLines.length);
      const rowH = Math.max(18, maxLines * 10 + 7);
      ensureSpace(rowH + 6);

      if (idx % 2 === 1) {
        cmds.push(`0.973 0.973 0.973 rg 36 ${y - rowH} 523 ${rowH} re f`);
      }
      cmds.push('0.90 0.90 0.90 RG 0.4 w');
      cmds.push(`36 ${y - rowH} 523 ${rowH} re S`);

      cmds.push('0.184 0.184 0.184 rg');
      nameLines.forEach((ln, li) => {
        cmds.push(`BT /F1 8.2 Tf 42 ${y - 11 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      buyLines.forEach((ln, li) => {
        cmds.push(`BT /F1 7.8 Tf 218 ${y - 11 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      cmds.push(`BT /F2 8 Tf 304 ${y - 11} Td (${sanitizePdf(row.yieldPct + '%')}) Tj ET`);
      useLines.forEach((ln, li) => {
        cmds.push(`BT /F1 8 Tf 348 ${y - 11 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      porLines.forEach((ln, li) => {
        cmds.push(`BT /F1 8 Tf 425 ${y - 11 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      pdfTextRight(cmds, formatRp(row.batchCost), 553, y - 11, 8.2, true);
      y -= rowH;
    });

    // Total Batch & Per Portion Footer Row
    ensureSpace(58);
    cmds.push(`0.961 0.961 0.961 rg 36 ${y - 20} 523 20 re f`);
    cmds.push('0.184 0.184 0.184 rg');
    cmds.push(`BT /F2 8.2 Tf 42 ${y - 13} Td (TOTAL MODAL BAHAN 1 BATCH \\(${calc.batchPortions} PORSI\\) / PER PORSI) Tj ET`);
    pdfTextRight(cmds, `${formatRp(calc.batchRawTotal)}  (${formatRp(calc.rawCostPerPortion)}/porsi)`, 553, y - 13, 8.2, true);
    y -= 34;

    // Section B: Komponen HPP & Rekomendasi Harga Jual
    ensureSpace(95);
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (B. REKAP HPP LENGKAP & PATOKAN HARGA JUAL ANTI-BONCOS) Tj ET`);
    y -= 12;

    const priceSummary = [
      ['1. Modal Bahan Baku Bersih per Porsi (setelah koreksi susut Yield)', formatRp(calc.rawCostPerPortion)],
      ['2. Biaya Kemasan Takeaway Lengkap (cup/box, tutup, sendok, tisu, kresek)', formatRp(calc.packagingPerPortion)],
      ['3. Alokasi Gas LPG, Listrik, Minyak Susut & Air per Porsi', formatRp(calc.gasUtilityPerPortion)],
      ['TOTAL HPP DAPUR PER 1 PORSI', formatRp(calc.totalHppPerPortion)],
      ['Harga Jual Makan di Tempat / WA Offline (Untung ' + formatRp(calc.offlineProfitPerPortion) + '/porsi)', formatRp(calc.offlinePrice)],
      [`Harga Aman Aplikasi Ojol (Komisi ${calc.ojolCommissionPct}% + ${formatRp(calc.ojolFixedFee)}, Untung Utuh)`, formatRp(calc.recommendedOjolNetPrice)],
      [`Harga Tayang Sebelum Coret Diskon ${calc.ojolPromoPct}% di Aplikasi Ojol`, formatRp(calc.recommendedOjolStrikePrice)]
    ];

    priceSummary.forEach((item, idx) => {
      const isBold = idx >= 3;
      const labelLines = wrapPdfByWidth(item[0], 395, 8.2, isBold);
      const rowH = Math.max(16, labelLines.length * 10 + 6);
      ensureSpace(rowH + 4);
      if (idx === 3) cmds.push(`0.94 0.98 0.95 rg 36 ${y - rowH} 523 ${rowH} re f`);
      cmds.push('0.88 0.88 0.88 RG 0.4 w');
      cmds.push(`36 ${y - rowH} 523 ${rowH} re S`);
      cmds.push(idx === 3 ? '0 0.62 0.22 rg' : '0.184 0.184 0.184 rg');
      labelLines.forEach((ln, li) => {
        cmds.push(`BT /${isBold ? 'F2' : 'F1'} 8.2 Tf 42 ${y - 11 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      pdfTextRight(cmds, item[1], 553, y - 11, 8.5, isBold);
      y -= rowH;
    });

    y -= 18;

    // Section C: Langkah Takaran & SOP Dapur
    ensureSpace(80);
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (C. INSTRUKSI STANDAR TAKARAN & PENYAJIAN KRU DAPUR) Tj ET`);
    y -= 14;

    const sopTextClean = String(calc.sopNotes || '').trim() || 'Timbang seluruh bahan sesuai tabel gramasi di atas sebelum memasak.';
    const sopLinesRaw = sopTextClean.split(/\r?\n/);
    cmds.push('0.184 0.184 0.184 rg');
    for (const rawLine of sopLinesRaw) {
      if (!rawLine.trim()) continue;
      const wrapped = wrapPdfByWidth(rawLine.trim(), 510, 8.5, false);
      for (const wl of wrapped) {
        ensureSpace(14);
        cmds.push('0.184 0.184 0.184 rg');
        cmds.push(`BT /F1 8.5 Tf 42 ${y} Td (${sanitizePdf(wl)}) Tj ET`);
        y -= 12;
      }
    }

    // Footer Signature (Separated onto its own line to prevent collision)
    ensureSpace(56);
    y -= 14;
    cmds.push('0.85 0.85 0.85 RG 0.6 w 36 ' + y + ' m 559 ' + y + ' l S');
    y -= 14;
    cmds.push('0.35 0.35 0.35 rg');
    cmds.push(`BT /F1 8 Tf 36 ${y} Td (Dokumen Standar Dapur Internal - Wajib ditempel di area racik & timbang.) Tj ET`);
    y -= 13;
    cmds.push('0.184 0.184 0.184 rg');
    const signSop = wrapPdfByWidth(`Disahkan oleh: ${ownerName} (${shopName})`, 520, 8.2, true)[0];
    pdfTextRight(cmds, signSop, 559, y, 8.2, true);

    const blob = buildMultiPagePdf(pages);
    const filename = `SOP-Resep-HPP-${slugify(calc.menuName)}.pdf`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  // 2. EKSPOR PDF A4 — LEMBAR AUDIT HARGA OJOL, 3 PAKET COMBO & TITIK IMPAS KEDAI
  function exportOjolAuditPdf(calc, shopInfo = {}) {
    const pages = [[]];
    let cmds = pages[0];
    let y = 795;

    const shopName = (shopInfo.shopName || '').trim() || 'Dapur Kuliner Mandiri';
    const ownerName = (shopInfo.ownerName || '').trim() || 'Pemilik Usaha';
    const dateStr = formatIndoDate();

    function ensureSpace(needPt) {
      if (y - needPt < 55) {
        cmds = [];
        pages.push(cmds);
        cmds.push('0.184 0.184 0.184 rg');
        cmds.push('0.88 0.88 0.88 RG 0.4 w');
        y = 795;
      }
    }

    // Header
    cmds.push('0.184 0.184 0.184 rg 36 742 523 64 re f');
    cmds.push('0 0.702 0.247 rg 36 738 523 4 re f');
    cmds.push('1 1 1 rg');
    const auditTitle = wrapPdfByWidth('LEMBAR AUDIT HARGA OJOL, PAKET COMBO & TITIK IMPAS KEDAI', 495, 12.2, true)[0];
    cmds.push(`BT /F2 12.2 Tf 48 784 Td (${sanitizePdf(auditTitle)}) Tj ET`);
    const sub = wrapPdfByWidth(`${shopName} | Menu: ${calc.menuName} | Dicetak: ${dateStr}`, 495, 9, false)[0];
    cmds.push(`BT /F1 9 Tf 48 767 Td (${sanitizePdf(sub)}) Tj ET`);
    cmds.push('0.75 0.96 0.82 rg');
    cmds.push(`BT /F2 9 Tf 48 751 Td (Simulasi Anti-Boncos GoFood / GrabFood / ShopeeFood + Target Porsi Harian) Tj ET`);

    y = 716;

    // Comparison: Naive Markup vs Reverse Commission Formula
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (1. PERBANDINGAN CARA NAIKKAN HARGA BIASA VS RUMUS BALIK DAPURUNTUNG) Tj ET`);
    y -= 12;

    const strikePayoutVal = calc.strikePayout != null
      ? calc.strikePayout
      : (calc.recommendedOjolStrikePrice - calc.strikeTotalCut);
    const strikeProfitVal = calc.strikeProfit != null
      ? calc.strikeProfit
      : (strikePayoutVal - calc.totalHppPerPortion);

    const compRows = [
      ['Skenario Penetapan Harga Aplikasi', 'Harga Tayang', 'Potongan Aplikasi', 'Cair ke Kedai', 'Untung Bersih'],
      [
        'Jual Offline / Makan di Tempat',
        formatRp(calc.offlinePrice),
        'Rp 0',
        formatRp(calc.offlinePrice),
        formatRp(calc.offlineProfitPerPortion)
      ],
      [
        `Cara Salah (Cuma Naik +${calc.ojolCommissionPct}% Biasa)`,
        formatRp(calc.naiveOjolPrice),
        '- ' + formatRp(calc.naiveCommissionCut),
        formatRp(calc.naiveNetReceived),
        formatRp(calc.naiveProfitPerPortion)
      ],
      [
        'Rumus Aman DapurUntung (Tanpa Diskon)',
        formatRp(calc.recommendedOjolNetPrice),
        '- ' + formatRp(calc.recommendedOjolCommissionCut),
        formatRp(calc.recommendedOjolPayout),
        formatRp(calc.recommendedOjolProfit)
      ],
      [
        `Rumus Aman + Diskon Coret ${calc.ojolPromoPct}%`,
        formatRp(calc.recommendedOjolStrikePrice),
        '- ' + formatRp(calc.strikeTotalCut),
        formatRp(strikePayoutVal),
        formatRp(strikeProfitVal)
      ]
    ];

    compRows.forEach((r, idx) => {
      const b = idx === 0 || idx >= 3;
      const col0Lines = wrapPdfByWidth(r[0], 178, 7.8, b);
      const h = Math.max(20, col0Lines.length * 10 + 8);
      ensureSpace(h + 4);
      if (idx === 0) {
        cmds.push(`0.184 0.184 0.184 rg 36 ${y - h} 523 ${h} re f`);
        cmds.push('1 1 1 rg');
      } else {
        if (idx === 2) cmds.push(`1 0.95 0.94 rg 36 ${y - h} 523 ${h} re f`);
        else if (idx >= 3) cmds.push(`0.94 0.99 0.96 rg 36 ${y - h} 523 ${h} re f`);
        cmds.push('0.88 0.88 0.88 RG 0.4 w');
        cmds.push(`36 ${y - h} 523 ${h} re S`);
        cmds.push('0.184 0.184 0.184 rg');
      }
      col0Lines.forEach((ln, li) => {
        cmds.push(`BT /${b ? 'F2' : 'F1'} 7.8 Tf 42 ${y - 13 - li * 10} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      cmds.push(`BT /${b ? 'F2' : 'F1'} 7.8 Tf 228 ${y - 13} Td (${sanitizePdf(r[1])}) Tj ET`);
      cmds.push(`BT /${b ? 'F2' : 'F1'} 7.8 Tf 304 ${y - 13} Td (${sanitizePdf(r[2])}) Tj ET`);
      cmds.push(`BT /${b ? 'F2' : 'F1'} 7.8 Tf 402 ${y - 13} Td (${sanitizePdf(r[3])}) Tj ET`);
      pdfTextRight(cmds, r[4], 553, y - 13, 8, true);
      y -= h;
    });

    y -= 18;

    // 2. 3 Paket Combo Hemat Pengungkit Nilai Nota (Multi-line full wrap)
    ensureSpace(50);
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (2. REKOMENDASI 3 PAKET HEMAT \\(COMBO PENAIK OMZET\\)) Tj ET`);
    y -= 12;

    (calc.combos || []).forEach((cb) => {
      const titleDescLines = wrapPdfByWidth(`${cb.title} - ${cb.desc}`, 382, 8.4, true);
      const metaLines = wrapPdfByWidth(
        `HPP Paket: ${formatRp(cb.hpp)} | Harga Offline: ${formatRp(cb.offlinePrice)} | Harga Ojol Aman: ${formatRp(cb.ojolPrice)}`,
        382,
        7.8,
        false
      );
      const boxH = 10 + titleDescLines.length * 10.5 + metaLines.length * 9.5 + 4;
      ensureSpace(boxH + 6);
      cmds.push(`0.961 0.961 0.961 rg 36 ${y - boxH} 523 ${boxH} re f`);
      cmds.push('0.88 0.88 0.88 RG 0.4 w');
      cmds.push(`36 ${y - boxH} 523 ${boxH} re S`);

      let curY = y - 11;
      cmds.push('0.184 0.184 0.184 rg');
      titleDescLines.forEach((ln) => {
        cmds.push(`BT /F2 8.4 Tf 44 ${curY.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
        curY -= 10.5;
      });
      cmds.push('0.4 0.4 0.4 rg');
      metaLines.forEach((ln) => {
        cmds.push(`BT /F1 7.8 Tf 44 ${curY.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
        curY -= 9.5;
      });
      cmds.push('0 0.62 0.22 rg');
      pdfTextRight(cmds, `Untung +${formatRp(cb.profit)}`, 553, y - boxH / 2 - 3, 9, true);
      y -= (boxH + 5);
    });

    y -= 10;

    // 3. Target Titik Impas (Break-Even Point) Bulanan & Harian
    const bepL1 = wrapPdfByWidth(`Beban Tetap Kedai (Sewa, Gaji Kru, Listrik/WiFi): ${formatRp(calc.monthlyFixedCost)} / bulan`, 505, 8.6, true);
    const bepL2 = wrapPdfByWidth(`Target Minimal Laku supaya Impas (0 Rugi): ${calc.bepPortionsMonthly} porsi/bulan atau minimal ${calc.bepPortionsDaily} porsi/hari.`, 505, 8.2, false);
    const bepL3 = wrapPdfByWidth(`Simulasi Laku ${calc.bepPortionsDaily + 25} porsi/hari -> Estimasi Laba Bersih Bulanan: ${formatRp(calc.projectedNetMonthlyProfit)}`, 505, 8.2, true);
    const bepBoxH = 12 + (bepL1.length + bepL2.length + bepL3.length) * 11.5;

    ensureSpace(bepBoxH + 28);
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (3. TARGET TITIK IMPAS \\(BEP\\) PENUTUP BIAYA TETAP KEDAI) Tj ET`);
    y -= 13;
    cmds.push(`0.961 0.961 0.961 rg 36 ${y - bepBoxH} 523 ${bepBoxH} re f`);
    let by = y - 13;
    cmds.push('0.184 0.184 0.184 rg');
    bepL1.forEach((ln) => {
      cmds.push(`BT /F2 8.6 Tf 44 ${by.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
      by -= 11.5;
    });
    bepL2.forEach((ln) => {
      cmds.push(`BT /F1 8.2 Tf 44 ${by.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
      by -= 11.5;
    });
    cmds.push('0 0.62 0.22 rg');
    bepL3.forEach((ln) => {
      cmds.push(`BT /F2 8.2 Tf 44 ${by.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
      by -= 11.5;
    });
    y -= (bepBoxH + 14);

    // 4. 8 Poin Audit Kesehatan Margin Dapur (Multi-line full wrap)
    ensureSpace(44);
    cmds.push('1 0.329 0.024 rg');
    cmds.push(`BT /F2 10 Tf 36 ${y} Td (4. DELAPAN INDIKATOR AUDIT KESEHATAN MARGIN DAPUR) Tj ET`);
    y -= 12;

    (calc.auditChecks || []).forEach((chk) => {
      const lines = wrapPdfByWidth(`${chk.label}: ${chk.detail}`, 445, 8, false);
      const itemH = Math.max(15, lines.length * 10.5 + 4);
      ensureSpace(itemH + 4);
      const badge = chk.passed ? '[AMAN]' : '[PERLU CEK]';
      cmds.push(chk.passed ? '0 0.62 0.22 rg' : '0.85 0.20 0.02 rg');
      cmds.push(`BT /F2 8 Tf 42 ${y - 10} Td (${sanitizePdf(badge)}) Tj ET`);
      cmds.push('0.184 0.184 0.184 rg');
      lines.forEach((ln, li) => {
        cmds.push(`BT /F1 8 Tf 104 ${(y - 10 - li * 10.5).toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
      });
      y -= itemH;
    });

    // Footer Signature (Separated onto its own line to prevent collision)
    ensureSpace(52);
    y -= 12;
    cmds.push('0.85 0.85 0.85 RG 0.6 w 36 ' + y + ' m 559 ' + y + ' l S');
    y -= 14;
    cmds.push('0.4 0.4 0.4 rg');
    cmds.push(`BT /F1 8 Tf 36 ${y} Td (Dihitung otomatis dengan Mesin Rumus DapurUntung Studio - 100% Akurat Tanpa AI.) Tj ET`);
    y -= 13;
    cmds.push('0.184 0.184 0.184 rg');
    const signAudit = wrapPdfByWidth(`Disahkan oleh: ${ownerName} (${shopName})`, 520, 8.2, true)[0];
    pdfTextRight(cmds, signAudit, 559, y, 8.2, true);

    const blob = buildMultiPagePdf(pages);
    const filename = `Audit-Harga-Ojol-${slugify(calc.menuName)}.pdf`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  // Helper Canvas Rounded Rect (26px uniform Foodnoms geometry, flat shadowless)
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function splitCanvasWord(ctx, word, maxWidth) {
    if (ctx.measureText(word).width <= maxWidth) return [word];
    const chunks = [];
    let cur = '';
    for (let i = 0; i < word.length; i++) {
      const next = cur + word[i];
      if (cur && ctx.measureText(next).width > maxWidth) {
        chunks.push(cur);
        cur = word[i];
      } else {
        cur = next;
      }
    }
    if (cur) chunks.push(cur);
    return chunks;
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const rawWords = String(text || '').trim().split(/\s+/).filter(Boolean);
    const words = [];
    for (const rw of rawWords) {
      words.push(...splitCanvasWord(ctx, rw, maxWidth));
    }
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(test).width <= maxWidth) {
        cur = test;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  // 3. EKSPOR PNG 1080x1350 — POSTER DAFTAR MENU & 3 PAKET HEMAT (FOODNOMS FLAT 26PX)
  async function exportMenuPosterPng(calc, shopInfo = {}) {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {}
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      const fontStack = '"Nunito Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const shopName = (shopInfo.shopName || '').trim() || 'Dapur Kuliner Pilihan';
      const rawPhone = (shopInfo.phone || '').trim();
      const footerPhone = rawPhone || 'Tersedia Makan di Tempat & Pesan-Antar';
      const shopCity = (shopInfo.city || '').trim() || 'Siap Antar Hangat Setiap Hari';

      // Pure Paper White Canvas (#ffffff) — flat & shadowless per Foodnoms spec
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 1350);

      // Top Header Pill Bar on Fog (#f5f5f5)
      ctx.fillStyle = '#f5f5f5';
      roundRect(ctx, 64, 54, 952, 88, 44);
      ctx.fill();

      // Brand Icon Square (#ff5406)
      ctx.fillStyle = '#ff5406';
      roundRect(ctx, 84, 70, 56, 56, 18);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 98, 98, 8, 14, 4); ctx.fill();
      roundRect(ctx, 110, 88, 8, 24, 4); ctx.fill();
      roundRect(ctx, 122, 82, 8, 30, 4); ctx.fill();

      ctx.fillStyle = '#2f2f2f';
      ctx.font = `700 28px ${fontStack}`;
      ctx.fillText(shopName, 156, 106, 584);

      ctx.fillStyle = '#00b33f';
      roundRect(ctx, 760, 74, 236, 48, 24);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 20px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText('FRESH SETIAP HARI', 878, 105, 212);
      ctx.textAlign = 'left';

      // Two-Tone Display Headline (Foodnoms signature)
      ctx.font = `800 54px ${fontStack}`;
      ctx.fillStyle = '#ff5406';
      ctx.fillText('Menu Favorit', 64, 224);
      const firstW = ctx.measureText('Menu Favorit ').width;
      ctx.fillStyle = '#2f2f2f';
      ctx.fillText('& Paket Hemat', 64 + firstW, 224, Math.max(200, 952 - firstW));

      ctx.font = `600 24px ${fontStack}`;
      ctx.fillStyle = '#666666';
      ctx.fillText(`${shopCity}  •  Takaran Konsisten, Porsi Puas & Higienis`, 64, 268, 952);

      // Featured Signature Menu Card (Fog #f5f5f5, 26px+ radius, crisp #e6e6e6 border)
      ctx.fillStyle = '#f5f5f5';
      roundRect(ctx, 64, 308, 952, 276, 36);
      ctx.fill();
      ctx.strokeStyle = '#e6e6e6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pill Tag inside Featured Card
      ctx.fillStyle = '#ff5406';
      roundRect(ctx, 100, 342, 230, 42, 21);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 18px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText('MENU ANDALAN UTAMA', 215, 369, 210);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#2f2f2f';
      ctx.font = `800 40px ${fontStack}`;
      const allTitleLines = wrapCanvasText(ctx, calc.menuName, 595);
      const titleLines = allTitleLines.slice(0, 2);
      if (allTitleLines.length > 2) {
        titleLines[1] = titleLines[1] + '...';
      }
      titleLines.forEach((ln, idx) => {
        ctx.fillText(ln, 100, 434 + idx * 46, 595);
      });

      ctx.fillStyle = '#555555';
      ctx.font = `600 21px ${fontStack}`;
      const catText = `${calc.category || 'Spesial Racikan Dapur'} • Porsi Standar Terukur`;
      ctx.fillText(catText, 100, titleLines.length > 1 ? 536 : 498, 595);

      // Price Badge Right Side (White card inside Fog card at x=720)
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 720, 342, 260, 208, 32);
      ctx.fill();
      ctx.fillStyle = '#72a2c5';
      ctx.font = `700 18px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText('HARGA SPESIAL', 850, 388, 232);
      ctx.fillStyle = '#00b33f';
      ctx.font = `800 40px ${fontStack}`;
      ctx.fillText(formatRp(calc.offlinePrice), 850, 444, 232);
      ctx.fillStyle = '#2f2f2f';
      ctx.font = `600 18px ${fontStack}`;
      ctx.fillText(`Aplikasi: ${formatRp(calc.recommendedOjolNetPrice)}`, 850, 492, 232);
      ctx.fillStyle = '#ff5406';
      ctx.font = `700 16px ${fontStack}`;
      ctx.fillText('Siap Bungkus Rapi', 850, 524, 232);
      ctx.textAlign = 'left';

      // Section Heading: Pilihan Paket Hemat
      ctx.font = `800 34px ${fontStack}`;
      ctx.fillStyle = '#00b33f';
      ctx.fillText('Lebih Hemat', 64, 650);
      const lhW = ctx.measureText('Lebih Hemat ').width;
      ctx.fillStyle = '#2f2f2f';
      ctx.fillText('Pesan Paket Ramean', 64 + lhW, 650, Math.max(200, 952 - lhW));

      // 3 Combo Cards Stacked (Up to 2 lines for cb.desc)
      const comboColors = ['#ff5406', '#00a9dd', '#bd4be5'];
      (calc.combos || []).slice(0, 3).forEach((cb, i) => {
        const cy = 682 + i * 166;
        ctx.fillStyle = '#f5f5f5';
        roundRect(ctx, 64, cy, 952, 144, 32);
        ctx.fill();

        // Colored Number Circle
        ctx.fillStyle = comboColors[i % comboColors.length];
        ctx.beginPath();
        ctx.arc(124, cy + 72, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 28px ${fontStack}`;
        ctx.textAlign = 'center';
        ctx.fillText('0' + (i + 1), 124, cy + 82);
        ctx.textAlign = 'left';

        ctx.font = `600 19.5px ${fontStack}`;
        const rawDescLines = wrapCanvasText(ctx, cb.desc, 536);
        const descLines = rawDescLines.slice(0, 2);
        if (rawDescLines.length > 2) {
          descLines[1] = descLines[1] + '...';
        }

        ctx.fillStyle = '#2f2f2f';
        ctx.font = `800 28px ${fontStack}`;
        const titleY = descLines.length > 1 ? cy + 46 : cy + 58;
        ctx.fillText(cb.title, 180, titleY, 536);

        ctx.fillStyle = '#555555';
        ctx.font = `600 19.5px ${fontStack}`;
        descLines.forEach((dLine, dIdx) => {
          const descY = descLines.length > 1 ? (cy + 81 + dIdx * 27) : (cy + 98);
          ctx.fillText(dLine, 180, descY, 536);
        });

        // Combo Price Pill
        ctx.fillStyle = '#2f2f2f';
        roundRect(ctx, 738, cy + 32, 246, 80, 28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 30px ${fontStack}`;
        ctx.textAlign = 'center';
        ctx.fillText(formatRp(cb.offlinePrice), 861, cy + 82, 220);
        ctx.textAlign = 'left';
      });

      // Bottom Footer CTA Bar (#2f2f2f Graphite rounded 32px, button at x=770)
      ctx.fillStyle = '#2f2f2f';
      roundRect(ctx, 64, 1196, 952, 98, 32);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 22px ${fontStack}`;
      ctx.fillText('Info & Pesanan: ' + footerPhone, 100, 1253, 640);

      ctx.fillStyle = '#ff5406';
      roundRect(ctx, 770, 1218, 218, 54, 27);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 20px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText('PESAN SEKARANG', 879, 1252, 198);

      canvas.toBlob((blob) => {
        const filename = `Poster-Menu-${slugify(calc.menuName)}-1080x1350.png`;
        triggerDownload(blob, filename);
        resolve({ filename, size: blob ? blob.size : 0 });
      }, 'image/png');
    });
  }

  // 4. EKSPOR CSV UTF-8 BOM — REKAP HPP + DAFTAR BELANJA PASAR OTOMATIS (50, 100 & KATERING + BUFFER)
  function exportShoppingHppCsv(calc, shopInfo = {}, cateringPortions = 75, cateringBufferPct = 3) {
    const portions = Math.max(1, Math.round(Number(cateringPortions) || 75));
    const rawBuf = Number(cateringBufferPct);
    const bufferPct = (cateringBufferPct !== '' && cateringBufferPct != null && Number.isFinite(rawBuf))
      ? Math.max(0, rawBuf)
      : 3;
    const effectivePortions = Math.ceil(portions * (1 + bufferPct / 100));

    // Safe CSV Escaper (prevents CSV formula injection on =, +, -, @)
    const esc = (v) => {
      if (typeof v === 'number' && Number.isFinite(v)) {
        return `"${String(v)}"`;
      }
      let s = String(v == null ? '' : v);
      if (/^[\s]*[=+\-@]/.test(s)) {
        s = "'" + s;
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [];
    const shopLabel = (shopInfo.shopName || '').trim() || 'Dapur Kuliner Mandiri';

    rows.push(['REKAP HPP RESEP & DAFTAR BELANJA PASAR OTOMATIS - DAPURUNTUNG STUDIO'].map(esc).join(','));
    rows.push(['Nama Kedai / Usaha', shopLabel, 'Tanggal Cetak', formatIndoDate()].map(esc).join(','));
    rows.push(['Nama Menu', calc.menuName, 'Hasil 1 Resep (Batch)', `${calc.batchPortions} Porsi`].map(esc).join(','));
    rows.push(['Target Order Katering', `${portions} Porsi`, 'Cadangan Buffer Dapur', `${bufferPct}% (Masak ${effectivePortions} Porsi)`].map(esc).join(','));
    rows.push([]);

    const customColHeader = bufferPct > 0
      ? `Belanja Kotor Katering ${portions} Porsi (+Buffer ${bufferPct}% = ${effectivePortions} Porsi)`
      : `Belanja Kotor Katering ${portions} Porsi`;

    rows.push([
      'No',
      'Nama Bahan Baku',
      'Harga Beli Kemasan (Rp)',
      'Isi Kemasan Beli',
      'Satuan',
      'Yield Bersih (%)',
      'Takaran Bersih 1 Batch',
      'Biaya Bahan 1 Batch (Rp)',
      'Biaya Bahan per Porsi (Rp)',
      'Belanja Kotor Pasar utk 50 Porsi',
      'Belanja Kotor Pasar utk 100 Porsi',
      customColHeader
    ].map(esc).join(','));

    const factor50 = 50 / calc.batchPortions;
    const factor100 = 100 / calc.batchPortions;
    const factorCustom = effectivePortions / calc.batchPortions;

    (calc.ingredientRows || []).forEach((ing, i) => {
      const yFrac = Math.max(0.05, (Number(ing.yieldPct) || 100) / 100);
      const buy50 = Math.ceil(Number(((ing.useQty * factor50) / yFrac).toFixed(9)));
      const buy100 = Math.ceil(Number(((ing.useQty * factor100) / yFrac).toFixed(9)));
      const buyCustom = Math.ceil(Number(((ing.useQty * factorCustom) / yFrac).toFixed(9)));

      rows.push([
        i + 1,
        ing.name,
        Math.round(ing.buyPrice),
        ing.buyQty,
        ing.unit,
        ing.yieldPct + '%',
        ing.useQty,
        Math.round(ing.batchCost),
        Math.round(ing.perPortionCost),
        `${buy50} ${ing.unit}`,
        `${buy100} ${ing.unit}`,
        `${buyCustom} ${ing.unit}`
      ].map(esc).join(','));
    });

    rows.push([]);
    rows.push(['RINGKASAN HPP & HARGA JUAL ANTI-BONCOS', 'NILAI RUPIAH / RASIO'].map(esc).join(','));
    rows.push(['Modal Bahan Baku per Porsi', Math.round(calc.rawCostPerPortion)].map(esc).join(','));
    rows.push(['Biaya Kemasan Takeaway per Porsi', Math.round(calc.packagingPerPortion)].map(esc).join(','));
    rows.push(['Alokasi Gas, Listrik & Minyak per Porsi', Math.round(calc.gasUtilityPerPortion)].map(esc).join(','));
    rows.push(['TOTAL HPP BERSIH PER PORSI', Math.round(calc.totalHppPerPortion)].map(esc).join(','));
    rows.push(['Harga Jual Offline / Makan di Tempat', Math.round(calc.offlinePrice)].map(esc).join(','));
    rows.push(['Untung Bersih Offline per Porsi', Math.round(calc.offlineProfitPerPortion)].map(esc).join(','));
    rows.push([`Harga Jual Aman GoFood/GrabFood (Komisi ${calc.ojolCommissionPct}% + Rp ${calc.ojolFixedFee})`, Math.round(calc.recommendedOjolNetPrice)].map(esc).join(','));
    rows.push([`Harga Coret Promo Diskon ${calc.ojolPromoPct}% di Aplikasi`, Math.round(calc.recommendedOjolStrikePrice)].map(esc).join(','));
    rows.push(['Target Titik Impas Kedai (Porsi / Hari)', calc.bepPortionsDaily].map(esc).join(','));

    const csvString = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const filename = `Belanja-Pasar-HPP-${slugify(calc.menuName)}.csv`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  window.DapurExporter = {
    formatRp,
    formatNum,
    exportRecipeSopPdf,
    exportOjolAuditPdf,
    exportMenuPosterPng,
    exportShoppingHppCsv
  };
})();

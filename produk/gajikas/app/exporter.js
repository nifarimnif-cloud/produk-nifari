// Mesin Ekspor 4 Dokumen Asli GajiKas Studio (100% Client-Side: PDF Slip Gaji A4, PDF Laba-Rugi KUR A4, PNG WA 1080x1350 & CSV Excel)
(function () {
  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    const neg = n < 0 ? '- ' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function angkaKeTerbilangInt(n) {
    const satuan = [
      '',
      'Satu',
      'Dua',
      'Tiga',
      'Empat',
      'Lima',
      'Enam',
      'Tujuh',
      'Delapan',
      'Sembilan',
      'Sepuluh',
      'Sebelas'
    ];
    if (n < 12) return satuan[n];
    if (n < 20) return angkaKeTerbilangInt(n - 10) + ' Belas';
    if (n < 100) {
      const depan = Math.floor(n / 10);
      const sisa = n % 10;
      return angkaKeTerbilangInt(depan) + ' Puluh' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 200) {
      const sisa = n - 100;
      return 'Seratus' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 1000) {
      const depan = Math.floor(n / 100);
      const sisa = n % 100;
      return angkaKeTerbilangInt(depan) + ' Ratus' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 2000) {
      const sisa = n - 1000;
      return 'Seribu' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 1000000) {
      const depan = Math.floor(n / 1000);
      const sisa = n % 1000;
      return angkaKeTerbilangInt(depan) + ' Ribu' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 1000000000) {
      const depan = Math.floor(n / 1000000);
      const sisa = n % 1000000;
      return angkaKeTerbilangInt(depan) + ' Juta' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    if (n < 1000000000000) {
      const depan = Math.floor(n / 1000000000);
      const sisa = n % 1000000000;
      return angkaKeTerbilangInt(depan) + ' Miliar' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
    }
    const depan = Math.floor(n / 1000000000000);
    const sisa = n % 1000000000000;
    return angkaKeTerbilangInt(depan) + ' Triliun' + (sisa ? ' ' + angkaKeTerbilangInt(sisa) : '');
  }

  function angkaKeTerbilang(nominal) {
    const num = typeof nominal === 'number' ? nominal : Number(nominal);
    if (!Number.isFinite(num) || Math.abs(num) >= 1e15) {
      if (Number.isFinite(num) && Math.abs(num) >= 1e15) {
        return formatRp(Math.round(num));
      }
      return 'Nol Rupiah';
    }
    const rounded = Math.round(num);
    if (rounded === 0) return 'Nol Rupiah';
    if (Math.abs(rounded) >= 1e15) return formatRp(rounded);
    const prefix = rounded < 0 ? 'Minus ' : '';
    return prefix + angkaKeTerbilangInt(Math.abs(rounded)).replace(/\s+/g, ' ').trim() + ' Rupiah';
  }

  function slugify(str) {
    return (
      String(str || 'gajikas')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42) || 'gajikas'
    );
  }

  function formatIndoDate(isoStr) {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];
    if (isoStr && /^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
      const parts = isoStr.split('-');
      const d = Number(parts[2]);
      const m = months[Number(parts[1]) - 1] || parts[1];
      return `${d} ${m} ${parts[0]}`;
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

  function truncatePdfLine(text, maxWidthPt, fontSize, bold = false) {
    const clean = normalizePdfAscii(text).replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    if (estimatePdfWidth(clean, fontSize, bold) <= maxWidthPt) return clean;
    const ellipsis = '...';
    const ellipsisW = estimatePdfWidth(ellipsis, fontSize, bold);
    if (ellipsisW >= maxWidthPt) return ellipsis;
    let out = clean;
    while (out.length > 1 && estimatePdfWidth(out, fontSize, bold) + ellipsisW > maxWidthPt) {
      out = out.slice(0, -1).trimEnd();
    }
    return out + ellipsis;
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

  // Helper: Draw a single Payslip box on A4 starting at topY (height ~374pt -> fits 2 slips cleanly on A4 842pt)
  function drawPayslipBlock(cmds, topY, emp, periodData, businessInfo) {
    const pData = periodData || {};
    const bInfo = businessInfo || {};
    const rawBizName = pData.businessName || bInfo.businessName || 'Usaha UMKM';
    const cityStr = pData.city || bInfo.city || 'Indonesia';
    const ownerStr = pData.ownerName || bInfo.ownerName || 'Pemilik Usaha';

    const leftX = 36;
    const width = 523;
    const rightEdge = leftX + width; // 559
    const boxBottom = topY - 372;

    // Outer crisp ledger border (#cbcac8 -> 0.796 0.792 0.784)
    cmds.push('0.796 0.792 0.784 RG 0.8 w');
    cmds.push(`${leftX} ${boxBottom} ${width} 372 re S`);

    // Forest Ledger Header (#0c221d -> 0.047 0.133 0.114) + Network Green strip (#29735c -> 0.161 0.451 0.361)
    const headerH = 42;
    const headerBottom = topY - headerH;
    cmds.push(`0.047 0.133 0.114 rg ${leftX} ${headerBottom} ${width} ${headerH} re f`);
    cmds.push(`0.161 0.451 0.361 rg ${leftX} ${headerBottom - 3} ${width} 3 re f`);

    cmds.push('1 1 1 rg');
    const bizTitle = truncatePdfLine(rawBizName, 320, 11.5, true);
    cmds.push(`BT /F2 11.5 Tf ${leftX + 12} ${topY - 17} Td (${sanitizePdf(bizTitle)}) Tj ET`);
    const subMeta = truncatePdfLine(
      `SLIP GAJI RESMI KARYAWAN  |  Periode: ${pData.periodLabel || 'Bulanan'}`,
      340,
      8.5,
      false
    );
    cmds.push('0.73 0.88 0.81 rg');
    cmds.push(`BT /F1 8.5 Tf ${leftX + 12} ${topY - 31} Td (${sanitizePdf(subMeta)}) Tj ET`);

    // Right side date on header
    const dateStr = 'Tgl Cetak: ' + formatIndoDate(pData.payDate);
    const dateW = estimatePdfWidth(dateStr, 8.5, false);
    cmds.push('1 1 1 rg');
    cmds.push(`BT /F1 8.5 Tf ${Math.round(rightEdge - 12 - dateW)} ${topY - 24} Td (${sanitizePdf(dateStr)}) Tj ET`);

    // Employee Identity Strip
    const idTop = headerBottom - 15;
    cmds.push('0.082 0.082 0.082 rg');
    const empNameLine = truncatePdfLine(`Nama Karyawan: ${emp.name}`, 250, 9.2, true);
    const empRoleLine = truncatePdfLine(`Jabatan: ${emp.role}`, 250, 8.8, false);
    cmds.push(`BT /F2 9.2 Tf ${leftX + 12} ${idTop} Td (${sanitizePdf(empNameLine)}) Tj ET`);
    cmds.push(`BT /F1 8.8 Tf ${leftX + 12} ${idTop - 13} Td (${sanitizePdf(empRoleLine)}) Tj ET`);

    const tenureLine = `Masa Kerja: ${emp.tenureMonths} Bulan`;
    const attendLine = `Kehadiran: ${emp.daysPresent} Hari  |  Lembur: ${emp.overtimeHours} Jam`;
    cmds.push(`BT /F1 8.8 Tf 312 ${idTop} Td (${sanitizePdf(tenureLine)}) Tj ET`);
    cmds.push(`BT /F1 8.8 Tf 312 ${idTop - 13} Td (${sanitizePdf(attendLine)}) Tj ET`);

    // Divider line
    const tableTop = idTop - 22;
    cmds.push(`0.863 0.863 0.863 rg ${leftX + 10} ${tableTop} ${width - 20} 0.8 re f`);

    // 2-Column Income vs Deductions Header
    const colHeaderY = tableTop - 14;
    cmds.push('0.941 0.973 0.976 rg');
    cmds.push(`${leftX + 10} ${colHeaderY - 4} 244 16 re f`);
    cmds.push(`305 ${colHeaderY - 4} 244 16 re f`);

    cmds.push('0.161 0.451 0.361 rg');
    cmds.push(`BT /F2 8.6 Tf ${leftX + 16} ${colHeaderY} Td (${sanitizePdf('A. RINCIAN PENERIMAAN')}) Tj ET`);
    cmds.push('0.482 0.349 0.325 rg');
    cmds.push(`BT /F2 8.6 Tf 311 ${colHeaderY} Td (${sanitizePdf('B. RINCIAN POTONGAN')}) Tj ET`);

    function drawColRow(colLeft, colRight, rowY, label, valStr, isBold) {
      const f = isBold ? '/F2' : '/F1';
      const fs = 8.6;
      cmds.push('0.082 0.082 0.082 rg');
      const lbl = truncatePdfLine(label, 148, fs, isBold);
      cmds.push(`BT ${f} ${fs} Tf ${colLeft} ${rowY} Td (${sanitizePdf(lbl)}) Tj ET`);
      const vw = estimatePdfWidth(valStr, fs, isBold);
      cmds.push(`BT ${f} ${fs} Tf ${Math.max(colLeft + 145, Math.round(colRight - vw))} ${rowY} Td (${sanitizePdf(valStr)}) Tj ET`);
    }

    const rowStart = colHeaderY - 17;
    const step = 14.5;

    // Left Column: Penerimaan (5 items + Total)
    const incomes = [
      ['Gaji Pokok', formatRp(emp.baseSalary)],
      [`Makan & Transport (${emp.daysPresent} hr)`, formatRp(emp.allowanceTotal)],
      [`Upah Lembur (${emp.overtimeHours} jam)`, formatRp(emp.overtimeTotal)],
      ['Bonus / Insentif Kinerja', formatRp(emp.bonus)],
      [emp.includeThr ? `THR (${emp.tenureMonths >= 12 ? 'Penuh' : 'Proporsional'})` : 'THR Keagamaan', formatRp(emp.thrAmount)]
    ];
    incomes.forEach((it, idx) => {
      drawColRow(leftX + 16, leftX + 248, rowStart - idx * step, it[0], it[1], false);
    });

    // Right Column: Potongan (3 items + Total)
    const deductions = [
      ['Cicilan Kasbon Karyawan', formatRp(emp.kasbonCut)],
      ['Potongan Telat / Absen', formatRp(emp.lateCut)],
      ['Iuran BPJS Karyawan', formatRp(emp.bpjsCut)]
    ];
    deductions.forEach((it, idx) => {
      drawColRow(311, 543, rowStart - idx * step, it[0], it[1], false);
    });

    const totalLineY = rowStart - 5 * step + 3;
    cmds.push(`0.863 0.863 0.863 rg ${leftX + 14} ${totalLineY + 9} 238 0.7 re f`);
    cmds.push(`0.863 0.863 0.863 rg 309 ${totalLineY + 9} 238 0.7 re f`);

    drawColRow(leftX + 16, leftX + 248, totalLineY - 2, 'Total Penerimaan Kotor', formatRp(emp.grossPay), true);
    drawColRow(311, 543, totalLineY - 2, 'Total Potongan', '- ' + formatRp(emp.totalDeductions), true);

    // Take-Home Pay Highlight Banner (Ice Panel #f0f8f9 + Network Green accent)
    const netBoxTop = totalLineY - 14;
    const netBoxH = 48;
    const netBoxBottom = netBoxTop - netBoxH;
    cmds.push(`0.941 0.973 0.976 rg ${leftX + 10} ${netBoxBottom} ${width - 20} ${netBoxH} re f`);
    cmds.push(`0.161 0.451 0.361 rg ${leftX + 10} ${netBoxBottom} 4 ${netBoxH} re f`);

    cmds.push('0.082 0.082 0.082 rg');
    cmds.push(`BT /F2 9.5 Tf ${leftX + 22} ${netBoxTop - 16} Td (${sanitizePdf('GAJI BERSIH DITERIMA (TAKE-HOME PAY)')}) Tj ET`);

    const netValStr = formatRp(emp.takeHomePay);
    const netValW = estimatePdfWidth(netValStr, 12, true);
    cmds.push('0.161 0.451 0.361 rg');
    cmds.push(`BT /F2 12 Tf ${Math.round(rightEdge - 18 - netValW)} ${netBoxTop - 17} Td (${sanitizePdf(netValStr)}) Tj ET`);

    const rawTerbWrapped = wrapPdfByWidth(`Terbilang: # ${emp.terbilang} #`, width - 44, 8.2, false);
    const terbLines =
      rawTerbWrapped.length > 2
        ? [rawTerbWrapped[0], truncatePdfLine(rawTerbWrapped.slice(1).join(' '), width - 44, 8.2, false)]
        : rawTerbWrapped;
    cmds.push('0.259 0.259 0.259 rg');
    terbLines.forEach((ln, idx) => {
      cmds.push(`BT /F1 8.2 Tf ${leftX + 22} ${netBoxTop - 31 - idx * 10} Td (${sanitizePdf(ln)}) Tj ET`);
    });

    // Signatures Row (City + Date above on right <= 205pt; "Penerima Upah," aligned with "Disetujui oleh Pemilik / HR,")
    const sigPlaceY = netBoxBottom - 15;
    const sigRoleY = netBoxBottom - 28;
    const placeDateLine = truncatePdfLine(`${cityStr}, ${formatIndoDate(pData.payDate)}`, 205, 8.2, false);
    cmds.push('0.259 0.259 0.259 rg');
    cmds.push(`BT /F1 8.2 Tf 340 ${sigPlaceY} Td (${sanitizePdf(placeDateLine)}) Tj ET`);
    cmds.push(`BT /F1 8.2 Tf ${leftX + 22} ${sigRoleY} Td (${sanitizePdf('Disetujui oleh Pemilik / HR,')}) Tj ET`);
    cmds.push(`BT /F1 8.2 Tf 340 ${sigRoleY} Td (${sanitizePdf('Penerima Upah,')}) Tj ET`);

    const sigNameY = boxBottom + 14;
    const ownerSign = '( ' + truncatePdfLine(ownerStr, 235, 8.6, true) + ' )';
    const empSign = '( ' + truncatePdfLine(emp.name, 188, 8.6, true) + ' )';
    cmds.push('0.082 0.082 0.082 rg');
    cmds.push(`BT /F2 8.6 Tf ${leftX + 22} ${sigNameY} Td (${sanitizePdf(ownerSign)}) Tj ET`);
    cmds.push(`BT /F2 8.6 Tf 340 ${sigNameY} Td (${sanitizePdf(empSign)}) Tj ET`);
  }

  // 1. Ekspor Slip Gaji Resmi (.PDF A4 — 1-2 slip per halaman, nol teks meluber)
  function exportPayslipPdf(periodData, businessInfo, targetEmpId = 'all') {
    const allEmps = periodData.employees || [];
    const selected =
      targetEmpId && targetEmpId !== 'all'
        ? allEmps.filter((e) => e.id === targetEmpId)
        : allEmps;
    const list = selected.length ? selected : allEmps;

    const pages = [];
    for (let i = 0; i < list.length; i += 2) {
      const cmds = [];
      drawPayslipBlock(cmds, 810, list[i], periodData, businessInfo || {});

      if (list[i + 1]) {
        // Dashed cut line at y = 421
        cmds.push('0.68 0.68 0.68 RG [4 4] 0 d 0.7 w 36 421 m 559 421 l S [] 0 d');
        cmds.push('0.44 0.44 0.44 rg');
        cmds.push(`BT /F1 7.5 Tf 248 418 Td (${sanitizePdf('-- Potong di garis ini --')}) Tj ET`);
        drawPayslipBlock(cmds, 404, list[i + 1], periodData, businessInfo || {});
      }

      pages.push(cmds);
    }

    if (!pages.length) {
      pages.push(['BT /F1 12 Tf 48 780 Td (Belum ada data karyawan.) Tj ET']);
    }

    const blob = buildMultiPagePdf(pages);
    const suffix =
      list.length === 1
        ? slugify(list[0].name)
        : 'tim-' + slugify(periodData.periodLabel || 'periode');
    const filename = `Slip-Gaji-Resmi-${suffix}.pdf`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  // 2. Ekspor Laporan Laba-Rugi & Rasio Kas UMKM Standar Bank/KUR (.PDF A4)
  function exportProfitLossPdf(periodData, businessInfo) {
    const pData = periodData || {};
    const bInfo = businessInfo || {};
    const pages = [];
    let cmds = [];
    let y = 780;
    const bizName = pData.businessName || bInfo.businessName || 'Usaha UMKM';
    const ownerName = pData.ownerName || bInfo.ownerName || 'Pemilik Usaha';
    const city = pData.city || bInfo.city || 'Indonesia';
    const sum = pData.summary;

    function startPage(first) {
      if (cmds.length) pages.push(cmds);
      cmds = [];
      if (first) {
        const headerBottom = 740;
        cmds.push(`0.047 0.133 0.114 rg 0 ${headerBottom} 595 ${842 - headerBottom} re f`);
        cmds.push(`0.161 0.451 0.361 rg 0 ${headerBottom - 4} 595 4 re f`);
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 15 Tf 44 812 Td (${sanitizePdf('LAPORAN LABA-RUGI OPERASIONAL & RASIO KAS UMKM')}) Tj ET`);

        const l1 = truncatePdfLine(
          `${bizName}  |  Sektor: ${pData.presetLabel || 'UMKM'}  |  Periode: ${pData.periodLabel || '-'}`,
          507,
          9.4,
          false
        );
        const l2 = truncatePdfLine(
          `Penanggung Jawab: ${ownerName}  |  Lokasi: ${city}  |  Jumlah Tim: ${(pData.employees || []).length} Karyawan`,
          507,
          9.0,
          false
        );
        cmds.push('0.82 0.91 0.87 rg');
        cmds.push(`BT /F1 9.4 Tf 44 792 Td (${sanitizePdf(l1)}) Tj ET`);
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F1 9.0 Tf 44 776 Td (${sanitizePdf(l2)}) Tj ET`);
        y = 716;
      } else {
        const cont = truncatePdfLine(`GajiKas Studio - Lanjutan Laporan Laba-Rugi: ${bizName}`, 507, 9.8, true);
        cmds.push('0.047 0.133 0.114 rg 0 804 595 38 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 9.8 Tf 44 818 Td (${sanitizePdf(cont)}) Tj ET`);
        y = 780;
      }
      cmds.push('0.082 0.082 0.082 rg');
    }

    function ensureSpace(need) {
      if (y - need < 42) startPage(false);
    }

    function addSection(title) {
      ensureSpace(28);
      cmds.push(`0.941 0.973 0.976 rg 44 ${y - 6} 507 19 re f`);
      cmds.push(`0.161 0.451 0.361 rg 44 ${y - 6} 3.5 19 re f`);
      cmds.push('0.082 0.082 0.082 rg');
      cmds.push(`BT /F2 9.8 Tf 54 ${y} Td (${sanitizePdf(title)}) Tj ET`);
      y -= 22;
    }

    function addRow(left, right, bold = false, highlight = false) {
      const fs = 9.3;
      const font = bold ? '/F2' : '/F1';
      const rightStr = String(right || '');
      const rightW = estimatePdfWidth(rightStr, fs, bold);
      const rightX = Math.max(368, Math.round(545 - rightW));
      const maxLeftW = Math.min(312, rightX - 60);
      const leftLines = wrapPdfByWidth(left, maxLeftW, fs, bold);

      ensureSpace(leftLines.length * 12.5 + 8);
      if (highlight) {
        const bh = leftLines.length * 12.5 + 7;
        cmds.push(`0.941 0.973 0.976 rg 44 ${y - (leftLines.length - 1) * 12.5 - 5} 507 ${bh} re f`);
      }
      cmds.push('0.082 0.082 0.082 rg');
      cmds.push(`BT ${font} ${fs} Tf ${rightX} ${y} Td (${sanitizePdf(rightStr)}) Tj ET`);
      leftLines.forEach((ln, idx) => {
        cmds.push(`BT ${font} ${fs} Tf 50 ${y - idx * 12.5} Td (${sanitizePdf(ln)}) Tj ET`);
      });

      const bottomY = y - (leftLines.length - 1) * 12.5;
      cmds.push(`0.88 0.88 0.88 rg 50 ${bottomY - 4.5} 497 0.5 re f`);
      y = bottomY - 15.5;
    }

    startPage(true);

    addSection('I. PENDAPATAN OPERASIONAL BULANAN (OMZET)');
    addRow('Penjualan Tunai Kasir', formatRp(sum.cashRevenue));
    addRow('Penjualan Non-Tunai (QRIS / Debit / Transfer Rekening)', formatRp(sum.nonCashRevenue));
    addRow('TOTAL PENDAPATAN KOTOR (OMZET)', formatRp(sum.totalRevenue), true, true);

    addSection('II. HARGA POKOK PENJUALAN (HPP) & LABA KOTOR');
    addRow('HPP Pembelian Barang Dagang / Bahan Baku Pokok', '- ' + formatRp(sum.hppCost));
    addRow(
      `LABA KOTOR USAHA (Margin Kotor ${sum.grossMarginPct.toFixed(1)}%)`,
      formatRp(sum.grossProfit),
      true,
      true
    );

    addSection('III. RINCIAN BEBAN GAJI TIM & OPERASIONAL BULANAN');
    addRow(
      `Beban Gaji, Tunjangan, Lembur & THR (${(periodData.employees || []).length} Karyawan)`,
      formatRp(sum.payrollGrossTotal)
    );
    addRow('Beban Sewa Tempat Usaha (Alokasi Bulanan)', formatRp(sum.rentCost));
    addRow('Beban Listrik, Air & Internet Toko', formatRp(sum.utilityCost));
    addRow('Perlengkapan Habis Pakai & Kemasan', formatRp(sum.suppliesCost));
    addRow('Transportasi, BBM & Pengiriman Operasional', formatRp(sum.transportCost));
    addRow('Pemasaran & Promosi Lokal', formatRp(sum.marketingCost));
    addRow('Biaya Operasional Lain-lain', formatRp(sum.otherCost));
    addRow('TOTAL BEBAN GAJI & OPERASIONAL', '- ' + formatRp(sum.totalOpex), true, true);

    addSection('IV. LABA BERSIH OPERASIONAL & TERBILANG');
    addRow(
      `LABA BERSIH USAHA SEBELUM PAJAK (Margin Bersih ${sum.netMarginPct.toFixed(1)}%)`,
      formatRp(sum.netProfit),
      true,
      true
    );
    addRow('Terbilang Laba Bersih', `# ${angkaKeTerbilang(sum.netProfit)} #`, false);

    addSection('V. RASIO KESEHATAN KAS & KAPASITAS ANGSURAN KUR BANK');
    addRow('Rasio Beban Gaji terhadap Total Omzet (Ideal UMKM < 25-30%)', `${sum.payrollRatioPct.toFixed(1)}%`);
    addRow('Porsi Transaksi Non-Tunai Tercatat Rekening', `${sum.nonCashSharePct.toFixed(1)}%`);
    addRow(
      'Batas Aman Angsuran KUR Bank Bulanan (RPC 30% x Laba Bersih)',
      formatRp(sum.kurMaxInstallment),
      true,
      true
    );
    addRow(
      'Estimasi Plafon KUR Aman Tenor 36 Bulan (Asumsi Bunga 6% p.a.)',
      formatRp(sum.estimatedKurPlafon36m),
      true
    );

    // Signature Block (right col x = 356, maxWidth <= 195pt) + Separated Official Footnote below rule
    const signPlaceRaw = `${city}, ${formatIndoDate(pData.payDate)}`;
    const signPlaceWrapped = wrapPdfByWidth(signPlaceRaw, 195, 9.2, false);
    const signPlaceLines =
      signPlaceWrapped.length > 2
        ? [signPlaceWrapped[0], truncatePdfLine(signPlaceWrapped.slice(1).join(' '), 195, 9.2, false)]
        : signPlaceWrapped;
    const signRoleLine = truncatePdfLine('Dibuat & Disahkan oleh Pemilik Usaha,', 195, 9.0, false);
    const ownerWrapped = wrapPdfByWidth(`( ${ownerName} )`, 195, 9.5, true);
    const signOwnerLines =
      ownerWrapped.length > 2
        ? [
            ownerWrapped[0],
            truncatePdfLine(ownerWrapped.slice(1).join(' ').replace(/\s*\)\s*$/, ''), 184, 9.5, true) + ' )'
          ]
        : ownerWrapped;

    const sigBlockNeed = 10 + signPlaceLines.length * 12 + 14 + 44 + signOwnerLines.length * 12 + 28;
    ensureSpace(sigBlockNeed);

    y -= 10;
    cmds.push('0.259 0.259 0.259 rg');
    signPlaceLines.forEach((ln) => {
      cmds.push(`BT /F1 9.2 Tf 356 ${y} Td (${sanitizePdf(ln)}) Tj ET`);
      y -= 12;
    });
    cmds.push(`BT /F1 9.0 Tf 356 ${y - 1} Td (${sanitizePdf(signRoleLine)}) Tj ET`);
    y -= 44;
    cmds.push('0.082 0.082 0.082 rg');
    signOwnerLines.forEach((ln) => {
      cmds.push(`BT /F2 9.5 Tf 356 ${y} Td (${sanitizePdf(ln)}) Tj ET`);
      y -= 12;
    });

    const footerRuleY = y - 6;
    cmds.push(`0.84 0.84 0.84 rg 44 ${footerRuleY} 507 0.6 re f`);
    cmds.push('0.44 0.44 0.44 rg');
    const footNote = truncatePdfLine(
      'Dicetak resmi melalui GajiKas Studio - Sistem Penggajian & Laba-Rugi UMKM Mandiri.',
      507,
      8.0,
      false
    );
    cmds.push(`BT /F1 8.0 Tf 44 ${footerRuleY - 12} Td (${sanitizePdf(footNote)}) Tj ET`);

    if (cmds.length) pages.push(cmds);
    const blob = buildMultiPagePdf(pages);
    const filename = `Laporan-Laba-Rugi-KUR-${slugify(bizName)}-${slugify(pData.periodLabel)}.pdf`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    const rawWords = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
    const words = [];
    rawWords.forEach((rw) => {
      if (!rw) return;
      if (ctx.measureText(rw).width <= maxWidth) {
        words.push(rw);
      } else {
        let chunk = '';
        for (let i = 0; i < rw.length; i++) {
          const next = chunk + rw[i];
          if (chunk && ctx.measureText(next).width > maxWidth) {
            words.push(chunk);
            chunk = rw[i];
          } else {
            chunk = next;
          }
        }
        if (chunk) words.push(chunk);
      }
    });

    const lines = [];
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(candidate).width <= maxWidth) {
        cur = candidate;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    if (!lines.length) return [''];
    if (maxLines && lines.length > maxLines) {
      const sliced = lines.slice(0, maxLines);
      let last = sliced[maxLines - 1];
      while (last.length > 3 && ctx.measureText(last + '...').width > maxWidth) {
        last = last.slice(0, -1);
      }
      sliced[maxLines - 1] = last + '...';
      return sliced;
    }
    return lines;
  }

  // 3. Kartu Slip Gaji Digital Siap Kirim WhatsApp (.PNG 1080x1350 — Modern Treasury Ledger)
  async function exportPayslipWaPng(emp, periodData, businessInfo) {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (_e) {
        // Fallback to system sans/mono cleanly
      }
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      function box(x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Paper #ffffff canvas + subtle graph-paper grid (#dcdcdc at 35% alpha)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 1350);

      ctx.strokeStyle = 'rgba(220, 220, 220, 0.45)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= 1080; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, 1350);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 1350; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(1080, gy);
        ctx.stroke();
      }

      // Forest Ledger Top Band (#0c221d) + Network Green Rail (#29735c)
      ctx.fillStyle = '#0c221d';
      ctx.fillRect(0, 0, 1080, 232);
      ctx.fillStyle = '#29735c';
      ctx.fillRect(0, 232, 1080, 8);

      // Mint Tag Badge
      box(64, 42, 456, 38, 4, '#bae0cf', null);
      ctx.fillStyle = '#151515';
      ctx.font = '500 18px "IBM Plex Mono", monospace';
      ctx.fillText('SLIP GAJI DIGITAL RESMI • GAJIKAS', 82, 67, 420);

      const pData = periodData || {};
      const bInfo = businessInfo || {};
      const bizName = pData.businessName || bInfo.businessName || 'Usaha UMKM';
      const cityStr = pData.city || bInfo.city || 'Indonesia';
      const ownerStr = pData.ownerName || bInfo.ownerName || 'Pemilik Usaha';

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 38px "Manrope", sans-serif';
      const bizLine = wrapCanvasText(ctx, bizName, 952, 1)[0];
      ctx.fillText(bizLine, 64, 136, 952);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.font = '400 22px "Inter", sans-serif';
      const metaSubLine = wrapCanvasText(
        ctx,
        `Periode: ${pData.periodLabel || 'Bulanan'}   |   ${cityStr}, ${formatIndoDate(pData.payDate)}`,
        952,
        1
      )[0];
      ctx.fillText(metaSubLine, 64, 186, 952);

      // Employee Identity Card
      box(64, 272, 952, 152, 8, '#f0f8f9', '#cbcac8');
      ctx.fillStyle = '#7b5953';
      ctx.font = '500 17px "IBM Plex Mono", monospace';
      ctx.fillText('IDENTITAS PENERIMA UPAH', 92, 310, 440);

      ctx.fillStyle = '#151515';
      ctx.font = '500 32px "Manrope", sans-serif';
      const empLine = wrapCanvasText(ctx, emp.name, 560, 1)[0];
      ctx.fillText(empLine, 92, 356, 560);

      ctx.fillStyle = '#424242';
      ctx.font = '500 21px "Inter", sans-serif';
      ctx.fillText(`${emp.role}  •  Masa Kerja ${emp.tenureMonths} Bulan`, 92, 396, 560);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#151515';
      ctx.font = '500 21px "IBM Plex Mono", monospace';
      ctx.fillText(`Hadir: ${emp.daysPresent} Hari`, 988, 348, 320);
      ctx.fillStyle = '#29735c';
      ctx.fillText(`Lembur: ${emp.overtimeHours} Jam`, 988, 390, 320);
      ctx.textAlign = 'left';

      // Income Block
      box(64, 448, 952, 336, 8, '#ffffff', '#cbcac8');
      ctx.fillStyle = '#29735c';
      ctx.font = '500 18px "IBM Plex Mono", monospace';
      ctx.fillText('A. RINCIAN PENERIMAAN', 92, 488, 500);

      const incRows = [
        ['Gaji Pokok Bulanan', formatRp(emp.baseSalary)],
        [`Tunjangan Makan & Transport (${emp.daysPresent} hr x ${formatRp(emp.dailyAllowanceRate)})`, formatRp(emp.allowanceTotal)],
        [`Upah Lembur (${emp.overtimeHours} jam)`, formatRp(emp.overtimeTotal)],
        ['Bonus & Insentif Kinerja', formatRp(emp.bonus)],
        [emp.includeThr ? `Tunjangan Hari Raya (${emp.tenureMonths >= 12 ? '1x Gaji' : 'Proporsional'})` : 'Tunjangan Hari Raya (THR)', formatRp(emp.thrAmount)]
      ];

      incRows.forEach((r, idx) => {
        const ry = 532 + idx * 42;
        ctx.fillStyle = '#424242';
        ctx.font = '400 21px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r[0], 92, ry, 630);
        ctx.fillStyle = '#151515';
        ctx.font = '500 22px "IBM Plex Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(r[1], 988, ry, 280);
      });

      ctx.fillStyle = '#dcdcdc';
      ctx.fillRect(92, 722, 896, 1.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#151515';
      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillText('Total Penerimaan Kotor', 92, 758, 560);
      ctx.textAlign = 'right';
      ctx.font = '500 24px "IBM Plex Mono", monospace';
      ctx.fillText(formatRp(emp.grossPay), 988, 758, 300);
      ctx.textAlign = 'left';

      // Deduction Block
      box(64, 806, 952, 224, 8, '#ffffff', '#cbcac8');
      ctx.fillStyle = '#7b5953';
      ctx.font = '500 18px "IBM Plex Mono", monospace';
      ctx.fillText('B. RINCIAN POTONGAN', 92, 846, 500);

      const dedRows = [
        ['Potongan Cicilan Kasbon', '- ' + formatRp(emp.kasbonCut)],
        ['Potongan Keterlambatan / Absen', '- ' + formatRp(emp.lateCut)],
        ['Iuran BPJS Karyawan', '- ' + formatRp(emp.bpjsCut)]
      ];

      dedRows.forEach((r, idx) => {
        const ry = 888 + idx * 38;
        ctx.fillStyle = '#424242';
        ctx.font = '400 21px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r[0], 92, ry, 630);
        ctx.fillStyle = '#151515';
        ctx.font = '500 22px "IBM Plex Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(r[1], 988, ry, 280);
      });

      ctx.fillStyle = '#dcdcdc';
      ctx.fillRect(92, 980, 896, 1.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#151515';
      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillText('Total Potongan', 92, 1012, 560);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#7b5953';
      ctx.font = '500 24px "IBM Plex Mono", monospace';
      ctx.fillText('- ' + formatRp(emp.totalDeductions), 988, 1012, 300);
      ctx.textAlign = 'left';

      // Final Take-Home Pay Banner
      box(64, 1054, 952, 196, 8, '#f0f8f9', '#29735c');
      ctx.fillStyle = '#29735c';
      ctx.fillRect(64, 1054, 10, 196);

      ctx.fillStyle = '#29735c';
      ctx.font = '500 18px "IBM Plex Mono", monospace';
      ctx.fillText('GAJI BERSIH DITERIMA (TAKE-HOME PAY)', 98, 1096, 560);

      ctx.fillStyle = '#151515';
      ctx.font = '500 50px "IBM Plex Mono", monospace';
      ctx.fillText(formatRp(emp.takeHomePay), 98, 1158, 880);

      ctx.fillStyle = '#424242';
      ctx.font = '500 19px "Inter", sans-serif';
      const terbCanvas = wrapCanvasText(ctx, `Terbilang: # ${emp.terbilang} #`, 884, 2);
      terbCanvas.forEach((ln, idx) => {
        ctx.fillText(ln, 98, 1196 + idx * 26, 884);
      });

      // Footer Verification
      ctx.fillStyle = '#706f6f';
      ctx.font = '500 18px "Inter", sans-serif';
      const footLine = wrapCanvasText(
        ctx,
        `Disahkan di ${cityStr} oleh: ${ownerStr} (${bizName})  •  Dokumen Resmi GajiKas Studio`,
        952,
        1
      )[0];
      ctx.fillText(footLine, 64, 1304, 952);

      canvas.toBlob((blob) => {
        const filename = `Slip-WA-${slugify(emp.name)}-${slugify(pData.periodLabel)}.png`;
        triggerDownload(blob, filename);
        resolve({ blob, filename });
      }, 'image/png');
    });
  }

  // 4. Rekap Penggajian Tim & Laporan Laba-Rugi Excel (.CSV UTF-8 BOM)
  function exportPayrollAndPlCsv(periodData, businessInfo) {
    function esc(v) {
      let s = String(v == null ? '' : v);
      const trimmed = s.trimStart();
      if (/^[=+\-@]/.test(trimmed) && !(typeof v === 'number' || /^-\d+(\.\d+)?%?$/.test(trimmed.trim()))) {
        s = "'" + s;
      }
      return `"${s.replace(/"/g, '""')}"`;
    }

    const pData = periodData || {};
    const bInfo = businessInfo || {};
    const bizName = pData.businessName || bInfo.businessName || 'Usaha UMKM';
    const ownerName = pData.ownerName || bInfo.ownerName || 'Pemilik Usaha';
    const city = pData.city || bInfo.city || 'Indonesia';
    const sum = pData.summary;
    const lines = [];

    lines.push(['REKAP PENGGAJIAN TIM & LAPORAN LABA-RUGI UMKM — GAJIKAS STUDIO', ''].map(esc).join(','));
    lines.push(['Nama Usaha', bizName].map(esc).join(','));
    lines.push(['Nama Pemilik', ownerName].map(esc).join(','));
    lines.push(['Kota / Lokasi Usaha', city].map(esc).join(','));
    lines.push(['Kategori Usaha', pData.presetLabel || 'UMKM'].map(esc).join(','));
    lines.push(['Periode Laporan', pData.periodLabel || '-'].map(esc).join(','));
    lines.push(['Tanggal Pembayaran', pData.payDate || '-'].map(esc).join(','));
    lines.push(['', ''].map(esc).join(','));

    lines.push(['BAGIAN A: DAFTAR GAJI KARYAWAN', ''].map(esc).join(','));
    lines.push(
      [
        'No',
        'Nama Karyawan',
        'Jabatan',
        'Masa Kerja (Bln)',
        'Hari Hadir',
        'Gaji Pokok (Rp)',
        'Makan & Transport (Rp)',
        'Jam Lembur',
        'Upah Lembur (Rp)',
        'Bonus/Insentif (Rp)',
        'THR Keagamaan (Rp)',
        'Gaji Kotor (Rp)',
        'Potongan Kasbon (Rp)',
        'Potongan Telat/Absen (Rp)',
        'Potongan BPJS (Rp)',
        'Total Potongan (Rp)',
        'Gaji Bersih Take-Home (Rp)',
        'Terbilang Rupiah'
      ]
        .map(esc)
        .join(',')
    );

    (periodData.employees || []).forEach((e, idx) => {
      lines.push(
        [
          idx + 1,
          e.name,
          e.role,
          e.tenureMonths,
          e.daysPresent,
          e.baseSalary,
          e.allowanceTotal,
          e.overtimeHours,
          e.overtimeTotal,
          e.bonus,
          e.thrAmount,
          e.grossPay,
          e.kasbonCut,
          e.lateCut,
          e.bpjsCut,
          e.totalDeductions,
          e.takeHomePay,
          e.terbilang
        ]
          .map(esc)
          .join(',')
      );
    });

    lines.push(
      [
        'TOTAL',
        `${(periodData.employees || []).length} Karyawan`,
        '',
        '',
        '',
        sum.totalBaseSalary,
        sum.totalAllowance,
        sum.totalOvertimeHours,
        sum.totalOvertimeRp,
        sum.totalBonus,
        sum.totalThr,
        sum.payrollGrossTotal,
        sum.totalKasbonCut,
        sum.totalLateCut,
        sum.totalBpjsCut,
        sum.totalDeductionsAll,
        sum.payrollTakeHomeTotal,
        angkaKeTerbilang(sum.payrollTakeHomeTotal)
      ]
        .map(esc)
        .join(',')
    );

    lines.push(['', ''].map(esc).join(','));
    lines.push(['BAGIAN B: LAPORAN LABA-RUGI & RASIO KAS BULANAN', 'Nominal (Rp / %)'].map(esc).join(','));
    lines.push(['Pemasukan Tunai Kasir (Rp)', sum.cashRevenue].map(esc).join(','));
    lines.push(['Pemasukan Non-Tunai QRIS/Transfer (Rp)', sum.nonCashRevenue].map(esc).join(','));
    lines.push(['TOTAL PENDAPATAN KOTOR / OMZET (Rp)', sum.totalRevenue].map(esc).join(','));
    lines.push(['HPP Pembelian Barang/Bahan Pokok (Rp)', sum.hppCost].map(esc).join(','));
    lines.push(['LABA KOTOR USAHA (Rp)', sum.grossProfit].map(esc).join(','));
    lines.push(['Margin Laba Kotor (%)', sum.grossMarginPct.toFixed(2) + '%'].map(esc).join(','));
    lines.push(['Total Beban Gaji Kotor Tim (Rp)', sum.payrollGrossTotal].map(esc).join(','));
    lines.push(['Beban Sewa Tempat Bulanan (Rp)', sum.rentCost].map(esc).join(','));
    lines.push(['Listrik, Air & Internet (Rp)', sum.utilityCost].map(esc).join(','));
    lines.push(['Perlengkapan Habis Pakai (Rp)', sum.suppliesCost].map(esc).join(','));
    lines.push(['Transportasi & Bensin (Rp)', sum.transportCost].map(esc).join(','));
    lines.push(['Pemasaran & Promosi (Rp)', sum.marketingCost].map(esc).join(','));
    lines.push(['Biaya Operasional Lain-lain (Rp)', sum.otherCost].map(esc).join(','));
    lines.push(['TOTAL BEBAN OPERASIONAL (Rp)', sum.totalOpex].map(esc).join(','));
    lines.push(['LABA BERSIH OPERASIONAL (Rp)', sum.netProfit].map(esc).join(','));
    lines.push(['Margin Laba Bersih (%)', sum.netMarginPct.toFixed(2) + '%'].map(esc).join(','));
    lines.push(['Rasio Beban Gaji terhadap Omzet (%)', sum.payrollRatioPct.toFixed(2) + '%'].map(esc).join(','));
    lines.push(['Batas Aman Angsuran KUR Bank 30% (Rp)', sum.kurMaxInstallment].map(esc).join(','));
    lines.push(['Estimasi Plafon KUR Aman 36 Bulan (Rp)', sum.estimatedKurPlafon36m].map(esc).join(','));

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const filename = `Rekap-Gaji-LabaRugi-${slugify(bizName)}-${slugify(pData.periodLabel)}.csv`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  window.GajiKasExporter = {
    formatRp,
    angkaKeTerbilang,
    formatIndoDate,
    truncatePdfLine,
    exportPayslipPdf,
    exportProfitLossPdf,
    exportPayslipWaPng,
    exportPayrollAndPlCsv
  };
})();

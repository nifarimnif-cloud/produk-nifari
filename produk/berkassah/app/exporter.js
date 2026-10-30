// Mesin Ekspor 4 Dokumen Hukum Resmi BerkasSah Studio (100% Client-Side: PDF Surat Perjanjian A4, PDF BAST+Kwitansi A4, Word .RTF Resmi & PNG Kwitansi WA 1080x1350)
(function () {
  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    const neg = n < 0 ? '- ' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function angkaKeTerbilangInt(n) {
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return satuan[n];
    if (n < 20) return angkaKeTerbilangInt(n - 10) + ' Belas';
    if (n < 100) {
      const d = Math.floor(n / 10);
      const s = n % 10;
      return angkaKeTerbilangInt(d) + ' Puluh' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 200) {
      const s = n - 100;
      return 'Seratus' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 1000) {
      const d = Math.floor(n / 100);
      const s = n % 100;
      return angkaKeTerbilangInt(d) + ' Ratus' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 2000) {
      const s = n - 1000;
      return 'Seribu' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 1000000) {
      const d = Math.floor(n / 1000);
      const s = n % 1000;
      return angkaKeTerbilangInt(d) + ' Ribu' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 1000000000) {
      const d = Math.floor(n / 1000000);
      const s = n % 1000000;
      return angkaKeTerbilangInt(d) + ' Juta' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    if (n < 1000000000000) {
      const d = Math.floor(n / 1000000000);
      const s = n % 1000000000;
      return angkaKeTerbilangInt(d) + ' Miliar' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
    }
    const d = Math.floor(n / 1000000000000);
    const s = n % 1000000000000;
    return angkaKeTerbilangInt(d) + ' Triliun' + (s ? ' ' + angkaKeTerbilangInt(s) : '');
  }

  function angkaKeTerbilang(nominal) {
    const rounded = Math.round(Number(nominal) || 0);
    if (rounded === 0) return 'Nol Rupiah';
    const prefix = rounded < 0 ? 'Minus ' : '';
    return prefix + angkaKeTerbilangInt(Math.abs(rounded)).replace(/\s+/g, ' ').trim() + ' Rupiah';
  }

  function formatLegalIndoDate(isoStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    let dt = new Date();
    if (isoStr && /^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
      const p = isoStr.split('-').map(Number);
      dt = new Date(p[0], p[1] - 1, p[2]);
    }
    const dayName = days[dt.getDay()];
    const dNum = dt.getDate();
    const mName = months[dt.getMonth()];
    const yNum = dt.getFullYear();
    const dWords = angkaKeTerbilangInt(dNum).trim();
    const yWords = angkaKeTerbilangInt(yNum).trim();
    const ddmm = `${String(dNum).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${yNum}`;
    return {
      shortDate: `${dNum} ${mName} ${yNum}`,
      ddmm,
      legalSentence: `Pada hari ini, ${dayName} tanggal ${dWords} bulan ${mName} tahun ${yWords} (${ddmm})`
    };
  }

  function slugify(str) {
    return (
      String(str || 'berkassah')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 44) || 'berkassah'
    );
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

  function buildMultiPagePdf(pagesCommands) {
    const objects = [];
    const numPages = pagesCommands.length;
    const kidsRefs = [];
    for (let i = 0; i < numPages; i++) kidsRefs.push(`${5 + i * 2} 0 R`);

    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${numPages} >>\nendobj\n`);
    objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\nendobj\n');
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj\n');

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

  function pdfCenterText(cmds, text, y, fontSize, bold = false) {
    const w = estimatePdfWidth(text, fontSize, bold);
    const x = Math.max(48, (595 - w) / 2);
    cmds.push(`BT /${bold ? 'F2' : 'F1'} ${fontSize} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${sanitizePdf(text)}) Tj ET`);
  }

  // 1. EKSPOR PDF A4 — SURAT PERJANJIAN RESMI BERMATERAI (AKTA BAWAH TANGAN)
  function exportContractPdf(doc) {
    const pages = [[]];
    let cmds = pages[0];
    let y = 784;

    function newPage() {
      cmds = [];
      pages.push(cmds);
      y = 784;
    }

    function ensureSpace(pt) {
      if (y - pt < 56) newPage();
    }

    function writeParagraph(txt, fontSize = 10, bold = false, indentX = 50, maxW = 495, lineGap = 13.5) {
      const lines = wrapPdfByWidth(txt, maxW, fontSize, bold);
      for (const ln of lines) {
        ensureSpace(lineGap + 2);
        cmds.push('0.08 0.11 0.16 rg');
        cmds.push(`BT /${bold ? 'F2' : 'F1'} ${fontSize} Tf ${indentX} ${y.toFixed(1)} Td (${sanitizePdf(ln)}) Tj ET`);
        y -= lineGap;
      }
    }

    // Formal Legal Title & Double Rule
    cmds.push('0.08 0.11 0.16 rg');
    const titleLines = wrapPdfByWidth(doc.docHeading || 'SURAT PERJANJIAN RESMI', 480, 13.5, true);
    titleLines.forEach((tl) => {
      pdfCenterText(cmds, tl, y, 13.5, true);
      y -= 17;
    });
    pdfCenterText(cmds, `Nomor Referensi: ${doc.refNumber}`, y + 2, 9.5, false);
    y -= 10;
    cmds.push('0.08 0.11 0.16 RG 1.4 w 50 ' + y + ' 545 ' + y + ' l S');
    cmds.push('0.5 w 50 ' + (y - 3) + ' 545 ' + (y - 3) + ' l S');
    y -= 20;

    // Opening Legal Date & City
    writeParagraph(`${doc.dateInfo.legalSentence}, bertempat di ${doc.signCity}, kami yang bertanda tangan di bawah ini:`, 10, false);
    y -= 4;

    // Party 1 & Party 2 Komparisi
    const p1Block = [
      `1. Nama Lengkap   : ${doc.p1Name}`,
      `   NIK / Identitas : ${doc.p1Nik}`,
      `   Pekerjaan/Peran : ${doc.p1Role}`,
      `   Alamat Lengkap  : ${doc.p1Address} (Telp: ${doc.p1Phone})`,
      `   Dalam hal ini bertindak untuk dan atas nama sendiri/usaha sah, selanjutnya disebut PIHAK PERTAMA.`
    ];
    p1Block.forEach((ln, idx) => writeParagraph(ln, 9.8, idx === 0 || idx === 4, 56, 485, 13));
    y -= 5;

    const p2Block = [
      `2. Nama Lengkap   : ${doc.p2Name}`,
      `   NIK / Identitas : ${doc.p2Nik}`,
      `   Pekerjaan/Peran : ${doc.p2Role}`,
      `   Alamat Lengkap  : ${doc.p2Address} (Telp: ${doc.p2Phone})`,
      `   Dalam hal ini bertindak untuk dan atas nama sendiri/penerima hak, selanjutnya disebut PIHAK KEDUA.`
    ];
    p2Block.forEach((ln, idx) => writeParagraph(ln, 9.8, idx === 0 || idx === 4, 56, 485, 13));
    y -= 6;

    writeParagraph(
      'PIHAK PERTAMA dan PIHAK KEDUA (selanjutnya secara bersama-sama disebut "Para Pihak") menerangkan dengan sadar, sehat jasmani-rohani, serta tanpa paksaan dari pihak mana pun sepakat mengikatkan diri dalam Perjanjian ini dengan ketentuan dan pasal-pasal sebagai berikut:',
      10,
      false
    );
    y -= 8;

    // Render Numbered Articles (Pasal 1 .. N)
    (doc.articles || []).forEach((art, idx) => {
      ensureSpace(46);
      pdfCenterText(cmds, `PASAL ${idx + 1}`, y, 10.5, true);
      y -= 13;
      pdfCenterText(cmds, wrapPdfByWidth(art.title, 460, 9.8, true)[0], y, 9.8, true);
      y -= 15;
      writeParagraph(art.body, 9.8, false, 50, 495, 13.2);
      y -= 8;
    });

    // Payment Schedule Table if termins exist
    if (doc.scheduleRows && doc.scheduleRows.length > 0) {
      ensureSpace(36 + doc.scheduleRows.length * 18);
      cmds.push('0.11 0.31 0.85 rg');
      cmds.push(`BT /F2 9.8 Tf 50 ${y} Td (LAMPIRAN JADWAL PEMBAYARAN / ANGSURAN RESMI:) Tj ET`);
      y -= 10;

      cmds.push(`0.08 0.11 0.16 rg 50 ${y - 17} 495 17 re f`);
      cmds.push('1 1 1 rg');
      cmds.push(`BT /F2 8.5 Tf 58 ${y - 12} Td (TAHAP / TERMIN) Tj ET`);
      cmds.push(`BT /F2 8.5 Tf 205 ${y - 12} Td (JATUH TEMPO) Tj ET`);
      cmds.push(`BT /F2 8.5 Tf 315 ${y - 12} Td (NOMINAL RUPIAH) Tj ET`);
      cmds.push(`BT /F2 8.5 Tf 425 ${y - 12} Td (KETERANGAN) Tj ET`);
      y -= 17;

      doc.scheduleRows.forEach((tr, ti) => {
        ensureSpace(18);
        if (ti % 2 === 1) cmds.push(`0.96 0.95 0.93 rg 50 ${y - 16} 495 16 re f`);
        cmds.push('0.82 0.80 0.77 RG 0.5 w');
        cmds.push(`50 ${y - 16} 495 16 re S`);
        cmds.push('0.08 0.11 0.16 rg');
        cmds.push(`BT /F2 8.5 Tf 58 ${y - 11} Td (${sanitizePdf(tr.label)}) Tj ET`);
        cmds.push(`BT /F1 8.5 Tf 205 ${y - 11} Td (${sanitizePdf(tr.dueDate)}) Tj ET`);
        cmds.push(`BT /F2 8.5 Tf 315 ${y - 11} Td (${sanitizePdf(formatRp(tr.amount))}) Tj ET`);
        cmds.push(`BT /F1 8.2 Tf 425 ${y - 11} Td (${sanitizePdf(wrapPdfByWidth(tr.note, 114, 8.2)[0])}) Tj ET`);
        y -= 16;
      });
      y -= 14;
    }

    // Closing Statement + Signature & Materai Rp 10.000 Box
    ensureSpace(178);
    writeParagraph(
      `Demikian Surat Perjanjian ini dibuat dalam rangkap 2 (dua) asli bermaterai cukup yang masing-masing memiliki kekuatan pembuktian hukum yang sama (Pasal 1320 & Pasal 1338 KUHPerdata), ditandatangani di ${doc.signCity} pada tanggal ${doc.dateInfo.shortDate}.`,
      9.8,
      false
    );
    y -= 16;

    // Two Party Columns + Materai Stamp Box
    cmds.push('0.08 0.11 0.16 rg');
    cmds.push(`BT /F2 9.8 Tf 95 ${y} Td (PIHAK PERTAMA,) Tj ET`);
    cmds.push(`BT /F2 9.8 Tf 385 ${y} Td (PIHAK KEDUA,) Tj ET`);

    // Dashed Materai Rp 10.000 Box under Pihak Kedua (and note for Rangkap 2)
    cmds.push('0.72 0.11 0.11 RG 0.8 w [3 2] 0 d');
    cmds.push(`382 ${y - 54} 88 38 re S`);
    cmds.push('[] 0 d');
    cmds.push('0.72 0.11 0.11 rg');
    cmds.push(`BT /F2 7.5 Tf 396 ${y - 31} Td (MATERAI TEMPEL) Tj ET`);
    cmds.push(`BT /F2 8.5 Tf 402 ${y - 43} Td (Rp 10.000) Tj ET`);

    y -= 74;
    cmds.push('0.08 0.11 0.16 rg');
    cmds.push(`BT /F2 9.8 Tf 72 ${y} Td (${sanitizePdf('( ' + doc.p1Name + ' )')}) Tj ET`);
    cmds.push(`BT /F2 9.8 Tf 368 ${y} Td (${sanitizePdf('( ' + doc.p2Name + ' )')}) Tj ET`);
    y -= 24;

    // Witnesses
    pdfCenterText(cmds, 'SAKSI-SAKSI:', y, 9.2, true);
    y -= 36;
    cmds.push(`BT /F1 9.2 Tf 78 ${y} Td (${sanitizePdf('1. ' + (doc.witness1 || 'Saksi Pertama') + ' ( ...................... )')}) Tj ET`);
    cmds.push(`BT /F1 9.2 Tf 335 ${y} Td (${sanitizePdf('2. ' + (doc.witness2 || 'Saksi Kedua') + ' ( ...................... )')}) Tj ET`);

    const blob = buildMultiPagePdf(pages);
    const filename = `Surat-Perjanjian-${slugify(doc.presetName || doc.docHeading)}.pdf`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  // 2. EKSPOR PDF A4 — BERITA ACARA SERAH TERIMA (BAST) & KWITANSI RESMI BERMATERAI
  function exportBastKwitansiPdf(doc) {
    const cmds = [];
    const pages = [cmds];

    // PART 1 (TOP HALF A4): BERITA ACARA SERAH TERIMA (BAST)
    cmds.push('0.08 0.11 0.16 rg 40 760 515 44 re f');
    cmds.push('0.11 0.31 0.85 rg 40 756 515 4 re f');
    cmds.push('1 1 1 rg');
    pdfCenterText(cmds, 'BERITA ACARA SERAH TERIMA (BAST) RESMI', 784, 12.5, true);
    pdfCenterText(cmds, `Lampiran Perjanjian Nomor: ${doc.refNumber} | Tanggal: ${doc.dateInfo.shortDate}`, 769, 9, false);

    let y = 736;
    function writeTop(txt, bold = false) {
      const lines = wrapPdfByWidth(txt, 505, 9.5, bold);
      for (const ln of lines) {
        cmds.push('0.08 0.11 0.16 rg');
        cmds.push(`BT /${bold ? 'F2' : 'F1'} 9.5 Tf 45 ${y} Td (${sanitizePdf(ln)}) Tj ET`);
        y -= 13;
      }
    }

    writeTop(`${doc.dateInfo.legalSentence}, bertempat di ${doc.signCity}, telah dilaksanakan serah terima fisik/dana/dokumen secara langsung antara:`);
    y -= 2;
    writeTop(`PIHAK YANG MENYERAHKAN : ${doc.p1Name} (${doc.p1Role})`, true);
    writeTop(`PIHAK YANG MENERIMA    : ${doc.p2Name} (${doc.p2Role})`, true);
    y -= 4;
    writeTop('RINCIAN OBJEK / DOKUMEN / KUNCI / DANA YANG DISERAHTERIMAKAN:', true);
    writeTop(doc.handoverItems || doc.objectTitle);
    y -= 4;
    writeTop('Sejak ditandatanganinya Berita Acara ini, objek tersebut telah diperiksa bersama dalam keadaan lengkap dan baik sesuai kesepakatan.');

    y -= 12;
    cmds.push(`BT /F2 9.2 Tf 85 ${y} Td (Yang Menyerahkan,) Tj ET`);
    cmds.push(`BT /F2 9.2 Tf 385 ${y} Td (Yang Menerima,) Tj ET`);
    y -= 44;
    cmds.push(`BT /F2 9.2 Tf 75 ${y} Td (${sanitizePdf('( ' + doc.p1Name + ' )')}) Tj ET`);
    cmds.push(`BT /F2 9.2 Tf 375 ${y} Td (${sanitizePdf('( ' + doc.p2Name + ' )')}) Tj ET`);

    // Cut Line
    y -= 22;
    cmds.push('0.55 0.55 0.55 RG 0.8 w [4 4] 0 d 36 ' + y + ' 559 ' + y + ' l S [] 0 d');
    cmds.push('0.45 0.45 0.45 rg');
    pdfCenterText(cmds, '--- Gunting di sini bila Kwitansi dipegang terpisah ---', y + 4, 8, false);

    // PART 2 (BOTTOM HALF A4): KWITANSI TANDA TERIMA RESMI BERMATERAI
    const kwTop = y - 16;
    const kwH = 310;
    const kwBottom = kwTop - kwH;

    cmds.push('0.985 0.98 0.968 rg 40 ' + kwBottom + ' 515 ' + kwH + ' re f');
    cmds.push('0.08 0.11 0.16 RG 1.4 w 40 ' + kwBottom + ' 515 ' + kwH + ' re S');
    cmds.push('0.5 w 44 ' + (kwBottom + 4) + ' 507 ' + (kwH - 8) + ' re S');

    // Kwitansi Header Bar
    cmds.push('0.11 0.31 0.85 rg 44 ' + (kwTop - 40) + ' 507 36 re f');
    cmds.push('1 1 1 rg');
    cmds.push(`BT /F2 12 Tf 58 ${kwTop - 26} Td (KWITANSI TANDA TERIMA PEMBAYARAN RESMI) Tj ET`);
    cmds.push(`BT /F2 9 Tf 395 ${kwTop - 25} Td (${sanitizePdf('No: KW-' + doc.refNumber)}) Tj ET`);

    let ky = kwTop - 62;
    const firstAmount = (doc.scheduleRows && doc.scheduleRows[0]) ? doc.scheduleRows[0].amount : doc.contractValue;
    const kwFields = [
      ['Telah Terima Dari', `${doc.p2Name} (NIK: ${doc.p2Nik})`],
      ['Uang Sejumlah', `# ${angkaKeTerbilang(firstAmount)} #`],
      ['Untuk Pembayaran', `${doc.scheduleRows && doc.scheduleRows.length > 1 ? 'Pembayaran Tahap 1 / Termin Awal - ' : 'Pelunasan - '}${doc.presetName || doc.docHeading}`],
      ['Objek Transaksi', doc.objectTitle]
    ];

    kwFields.forEach(([label, val], idx) => {
      cmds.push('0.08 0.11 0.16 rg');
      cmds.push(`BT /F2 9.5 Tf 58 ${ky} Td (${sanitizePdf(label)}) Tj ET`);
      cmds.push(`BT /F2 9.5 Tf 162 ${ky} Td (:) Tj ET`);
      const vLines = wrapPdfByWidth(val, 365, 9.5, idx === 1);
      vLines.slice(0, 2).forEach((vl, li) => {
        if (idx === 1) {
          cmds.push(`0.92 0.94 0.99 rg 170 ${ky - 4 - li * 13} 365 14 re f`);
        }
        cmds.push('0.08 0.11 0.16 rg');
        cmds.push(`BT /${idx === 1 ? 'F2' : 'F1'} 9.5 Tf 174 ${ky - li * 13} Td (${sanitizePdf(vl)}) Tj ET`);
      });
      ky -= vLines.length > 1 ? 28 : 19;
    });

    // Big Nominal Box Bottom-Left + Signature & Materai Bottom-Right
    const nomY = kwBottom + 42;
    cmds.push('0.08 0.11 0.16 rg 58 ' + nomY + ' 215 38 re f');
    cmds.push('1 1 1 rg');
    cmds.push(`BT /F2 14 Tf 72 ${nomY + 13} Td (${sanitizePdf('TERBILANG: ' + formatRp(firstAmount))}) Tj ET`);

    cmds.push('0.08 0.11 0.16 rg');
    cmds.push(`BT /F1 9.2 Tf 365 ${kwBottom + 106} Td (${sanitizePdf(doc.signCity + ', ' + doc.dateInfo.shortDate)}) Tj ET`);
    cmds.push(`BT /F2 9.2 Tf 365 ${kwBottom + 93} Td (Penerima Pembayaran,) Tj ET`);

    cmds.push('0.72 0.11 0.11 RG 0.8 w [3 2] 0 d');
    cmds.push(`365 ${kwBottom + 44} 86 36 re S [] 0 d`);
    cmds.push('0.72 0.11 0.11 rg');
    cmds.push(`BT /F2 7.2 Tf 376 ${kwBottom + 65} Td (MATERAI TEMPEL) Tj ET`);
    cmds.push(`BT /F2 8.2 Tf 384 ${kwBottom + 53} Td (Rp 10.000) Tj ET`);

    cmds.push('0.08 0.11 0.16 rg');
    cmds.push(`BT /F2 9.5 Tf 365 ${kwBottom + 22} Td (${sanitizePdf('( ' + doc.p1Name + ' )')}) Tj ET`);

    const blob = buildMultiPagePdf(pages);
    const filename = `BAST-dan-Kwitansi-${slugify(doc.presetName || doc.docHeading)}.pdf`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  // 3. EKSPOR MICROSOFT WORD ASLI (.RTF) — SIAP BUKA & EDIT DI MS WORD / GOOGLE DOCS TANPA PERINGATAN
  function rtfEsc(str) {
    const s = String(str || '');
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      const ch = s[i];
      if (ch === '\\' || ch === '{' || ch === '}') out += '\\' + ch;
      else if (ch === '\n') out += '\\line ';
      else if (code > 127) out += `\\u${code}?`;
      else out += ch;
    }
    return out;
  }

  function exportContractWordRtf(doc) {
    const parts = [];
    parts.push('{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}{\\f1 Arial;}}');
    parts.push('\\paperw11906\\paperh16838\\margl1440\\margr1440\\margt1440\\margb1440');

    // Centered Title
    parts.push(`\\pard\\qc\\f0\\fs28\\b ${rtfEsc(doc.docHeading)}\\b0\\par`);
    parts.push(`\\pard\\qc\\fs20 Nomor Referensi: ${rtfEsc(doc.refNumber)}\\par\\par`);

    // Opening
    parts.push(`\\pard\\qj\\fs22\\sl300\\slmult1 ${rtfEsc(doc.dateInfo.legalSentence)}, bertempat di ${rtfEsc(doc.signCity)}, kami yang bertanda tangan di bawah ini:\\par\\par`);

    parts.push(`\\pard\\li360\\fs22 \\b 1. ${rtfEsc(doc.p1Name)}\\b0  (NIK: ${rtfEsc(doc.p1Nik)}), ${rtfEsc(doc.p1Role)}, beralamat di ${rtfEsc(doc.p1Address)}, Telp: ${rtfEsc(doc.p1Phone)}, selanjutnya disebut \\b PIHAK PERTAMA\\b0.\\par\\par`);
    parts.push(`\\pard\\li360\\fs22 \\b 2. ${rtfEsc(doc.p2Name)}\\b0  (NIK: ${rtfEsc(doc.p2Nik)}), ${rtfEsc(doc.p2Role)}, beralamat di ${rtfEsc(doc.p2Address)}, Telp: ${rtfEsc(doc.p2Phone)}, selanjutnya disebut \\b PIHAK KEDUA\\b0.\\par\\par`);

    parts.push(`\\pard\\qj\\fs22\\sl300\\slmult1 Para Pihak dengan sadar dan tanpa paksaan sepakat mengikatkan diri dalam Perjanjian ini dengan pasal-pasal sebagai berikut:\\par\\par`);

    (doc.articles || []).forEach((art, idx) => {
      parts.push(`\\pard\\qc\\fs22\\b PASAL ${idx + 1}\\line ${rtfEsc(art.title)}\\b0\\par`);
      parts.push(`\\pard\\qj\\fs22\\sl300\\slmult1 ${rtfEsc(art.body)}\\par\\par`);
    });

    if (doc.scheduleRows && doc.scheduleRows.length) {
      parts.push(`\\pard\\fs22\\b JADWAL PEMBAYARAN / TERMIN RESMI:\\b0\\par`);
      doc.scheduleRows.forEach((tr) => {
        parts.push(`\\pard\\li360\\fs21 - \\b ${rtfEsc(tr.label)}\\b0  (${rtfEsc(tr.dueDate)}): \\b ${rtfEsc(formatRp(tr.amount))}\\b0  (${rtfEsc(tr.note)})\\par`);
      });
      parts.push('\\par');
    }

    parts.push(`\\pard\\qj\\fs22 Demikian Surat Perjanjian ini dibuat rangkap 2 (dua) bermaterai cukup yang berkekuatan hukum sama, ditandatangani di ${rtfEsc(doc.signCity)} pada tanggal ${rtfEsc(doc.dateInfo.shortDate)}.\\par\\par\\par`);
    parts.push(`\\pard\\fs22 \\b PIHAK PERTAMA,\\tab\\tab\\tab\\tab PIHAK KEDUA,\\b0\\par\\par`);
    parts.push(`\\pard\\fs19 \\tab\\tab\\tab\\tab\\tab [ Materai Rp 10.000 ]\\par\\par`);
    parts.push(`\\pard\\fs22 \\b ( ${rtfEsc(doc.p1Name)} )\\tab\\tab\\tab ( ${rtfEsc(doc.p2Name)} )\\b0\\par\\par`);
    parts.push(`\\pard\\fs21 Saksi I: ${rtfEsc(doc.witness1 || '................')} \\tab\\tab Saksi II: ${rtfEsc(doc.witness2 || '................')}\\par`);
    parts.push('}');

    const rtfText = parts.join('\n');
    const blob = new Blob([rtfText], { type: 'application/rtf' });
    const filename = `Draf-Kontrak-Word-${slugify(doc.presetName || doc.docHeading)}.rtf`;
    triggerDownload(blob, filename);
    return { filename, size: blob.size };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(test).width <= maxWidth) cur = test;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // 4. EKSPOR PNG 1080x1350 — KARTU RINGKASAN PERJANJIAN & KWITANSI DIGITAL WHATSAPP
  function exportKwitansiWaPng(doc) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      const fontSans = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      // Alabaster Legal Folio Background
      ctx.fillStyle = '#fbfaf7';
      ctx.fillRect(0, 0, 1080, 1350);

      // Outer Double Frame
      ctx.strokeStyle = '#141b29';
      ctx.lineWidth = 4;
      roundRect(ctx, 48, 48, 984, 1254, 20);
      ctx.stroke();

      ctx.strokeStyle = '#d6d0c4';
      ctx.lineWidth = 2;
      roundRect(ctx, 62, 62, 956, 1226, 14);
      ctx.stroke();

      // Deep Oxford Header
      ctx.fillStyle = '#141b29';
      roundRect(ctx, 84, 88, 912, 148, 16);
      ctx.fill();

      ctx.fillStyle = '#93c5fd';
      ctx.font = `700 20px ${fontSans}`;
      ctx.fillText(`RINGKASAN KESEPAKATAN & BUKTI KWITANSI • REF: ${doc.refNumber}`, 120, 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 34px ${fontSans}`;
      ctx.fillText((doc.docHeading || 'SURAT PERJANJIAN RESMI').slice(0, 44), 120, 194);

      // Nominal Highlight Card
      ctx.fillStyle = '#f2efe9';
      roundRect(ctx, 84, 268, 912, 206, 16);
      ctx.fill();
      ctx.strokeStyle = '#ddd8ce';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = `700 20px ${fontSans}`;
      ctx.fillText('NILAI POKOK KESEPAKATAN', 120, 316);

      ctx.fillStyle = '#1d4ed8';
      ctx.font = `800 56px ${fontSans}`;
      ctx.fillText(formatRp(doc.contractValue), 120, 384);

      ctx.fillStyle = '#141b29';
      ctx.font = `600 22px ${fontSans}`;
      const terbLines = wrapCanvasText(ctx, 'Terbilang: ' + angkaKeTerbilang(doc.contractValue), 840);
      ctx.fillText(terbLines[0] || '', 120, 434);

      // Parties Block
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 84, 504, 442, 210, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 554, 504, 442, 210, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8';
      ctx.font = `800 18px ${fontSans}`;
      ctx.fillText('PIHAK PERTAMA', 114, 548);
      ctx.fillStyle = '#0f766e';
      ctx.fillText('PIHAK KEDUA', 584, 548);

      ctx.fillStyle = '#141b29';
      ctx.font = `800 28px ${fontSans}`;
      ctx.fillText(doc.p1Name.slice(0, 24), 114, 594);
      ctx.fillText(doc.p2Name.slice(0, 24), 584, 594);

      ctx.fillStyle = '#555555';
      ctx.font = `600 18.5px ${fontSans}`;
      ctx.fillText(wrapCanvasText(ctx, doc.p1Role, 385)[0] || '', 114, 634);
      ctx.fillText(wrapCanvasText(ctx, doc.p2Role, 385)[0] || '', 584, 634);
      ctx.fillText('NIK: ' + doc.p1Nik.slice(0, 22), 114, 672);
      ctx.fillText('NIK: ' + doc.p2Nik.slice(0, 22), 584, 672);

      // Object & Schedule Summary
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 84, 744, 912, 360, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#141b29';
      ctx.font = `800 22px ${fontSans}`;
      ctx.fillText('OBJEK & JADWAL PEMBAYARAN DISEPAKATI:', 116, 792);

      ctx.fillStyle = '#334155';
      ctx.font = `600 21px ${fontSans}`;
      wrapCanvasText(ctx, doc.objectTitle, 840).slice(0, 2).forEach((ln, i) => {
        ctx.fillText(ln, 116, 834 + i * 32);
      });

      (doc.scheduleRows || []).slice(0, 3).forEach((sr, idx) => {
        const sy = 924 + idx * 52;
        ctx.fillStyle = '#f2efe9';
        roundRect(ctx, 116, sy - 30, 848, 42, 10);
        ctx.fill();
        ctx.fillStyle = '#141b29';
        ctx.font = `700 19px ${fontSans}`;
        ctx.fillText(`${sr.label} (${sr.dueDate})`, 136, sy - 2);
        ctx.fillStyle = '#0f766e';
        ctx.textAlign = 'right';
        ctx.fillText(formatRp(sr.amount), 944, sy - 2);
        ctx.textAlign = 'left';
      });

      // Stamp Seal Footer
      ctx.fillStyle = '#b91c1c';
      roundRect(ctx, 84, 1140, 340, 96, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 21px ${fontSans}`;
      ctx.fillText('SIAP CETAK & MATERAI', 116, 1182);
      ctx.font = `600 17px ${fontSans}`;
      ctx.fillText(`${doc.articles ? doc.articles.length : 8} Pasal Pelindung Aktif`, 116, 1212);

      ctx.fillStyle = '#141b29';
      ctx.font = `700 22px ${fontSans}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${doc.signCity}, ${doc.dateInfo.shortDate}`, 988, 1180);
      ctx.fillStyle = '#64748b';
      ctx.font = `600 19px ${fontSans}`;
      ctx.fillText(`Saksi: ${doc.witness1 || '-'} & ${doc.witness2 || '-'}`, 988, 1216);
      ctx.textAlign = 'left';

      canvas.toBlob((blob) => {
        const filename = `Kwitansi-Ringkasan-WA-${slugify(doc.presetName || doc.docHeading)}.png`;
        triggerDownload(blob, filename);
        resolve({ filename, size: blob ? blob.size : 0 });
      }, 'image/png');
    });
  }

  window.BerkasExporter = {
    formatRp,
    angkaKeTerbilang,
    formatLegalIndoDate,
    exportContractPdf,
    exportBastKwitansiPdf,
    exportContractWordRtf,
    exportKwitansiWaPng
  };
})();

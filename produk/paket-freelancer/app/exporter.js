/**
 * TarifKarya Studio — Mesin Ekspor 4 Dokumen Jadi 100% di Browser
 * 1. Desain Kartu Harga / Rate Card 3 Paket Siap Kirim WA/IG (.PNG 1080×1350)
 * 2. Proposal Penawaran & Rincian Paket Resmi (.PDF A4)
 * 3. Invoice Tagihan DP / Pelunasan Resmi (.PDF A4)
 * 4. Surat Kesepakatan Kerja & Klausul Anti-Revisi (.DOCX Word)
 */

export function formatRp(num) {
  const n = Math.round(Number(num) || 0);
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function sanitizePdfText(str) {
  return String(str ?? '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPlainText(text, maxChars) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    if ((cur + ' ' + words[i]).length <= maxChars) {
      cur += ' ' + words[i];
    } else {
      lines.push(cur);
      cur = words[i];
    }
  }
  lines.push(cur);
  return lines;
}

/**
 * Generator PDF A4 ringan tanpa library luar (%PDF-1.4 standar)
 */
function buildCleanA4Pdf(pagesCommands) {
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegularId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const fontMonoId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  const pageIds = [];
  const pagesRootPlaceholder = addObj('');

  for (let i = 0; i < pagesCommands.length; i++) {
    const streamStr = pagesCommands[i].join('\n');
    const contentId = addObj(`<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesRootPlaceholder} 0 R /MediaBox [0 0 595 842] ` +
        `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontMonoId} 0 R >> >> ` +
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
   1. EKSPOR DESAIN RATE CARD 3 PAKET (.PNG 1080×1350 SIAP KIRIM WA / IG)
   ========================================================================== */
export async function exportRateCardPng(docData) {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Kanvas Concrete (#f4f4f4)
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, W, H);

  // Bingkai luar tipis 2px Ink (#201d1d)
  ctx.strokeStyle = '#201d1d';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Header Blok Obsidian (#151313)
  ctx.fillStyle = '#151313';
  ctx.fillRect(48, 48, W - 96, 210);

  // Badge Volt di kiri atas Header
  ctx.fillStyle = '#a1ff62';
  ctx.fillRect(80, 78, 240, 34);
  ctx.fillStyle = '#151313';
  ctx.font = '700 15px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('RATE CARD RESMI STUDIO', 94, 95);

  // Tanggal di kanan atas Header
  ctx.fillStyle = '#b8b8b8';
  ctx.font = '500 15px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`BERLAKU: ${docData.dateLabel.toUpperCase()}`, W - 80, 95);

  // Judul Studio & Layanan
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f4f4f4';
  ctx.font = '700 42px Inter, Arial, sans-serif';
  ctx.fillText(String(docData.studioName || 'Studio Jasa Kreatif').slice(0, 34), 80, 152);

  ctx.fillStyle = '#a1ff62';
  ctx.font = '500 22px Inter, Arial, sans-serif';
  ctx.fillText(`Layanan: ${docData.serviceName}`, 80, 204);

  // 3 Kartu Paket (Baris Horizontal Tajam 5px gaya Osmo)
  let cardY = 286;
  const cardH = 262;
  for (let i = 0; i < docData.tiers.length; i++) {
    const t = docData.tiers[i];
    const isFeatured = i === docData.selectedTierIdx;

    ctx.fillStyle = isFeatured ? '#151313' : '#ffffff';
    ctx.fillRect(48, cardY, W - 96, cardH);
    ctx.strokeStyle = isFeatured ? '#151313' : '#312e2e';
    ctx.lineWidth = isFeatured ? 3 : 2;
    ctx.strokeRect(48, cardY, W - 96, cardH);

    // Pita penanda kiri
    ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
    ctx.fillRect(48, cardY, 12, cardH);

    // Nama Paket & Badge Rekomendasi
    ctx.fillStyle = isFeatured ? '#f4f4f4' : '#201d1d';
    ctx.font = '700 28px Inter, Arial, sans-serif';
    ctx.fillText(t.tier.toUpperCase(), 84, cardY + 46);

    if (isFeatured) {
      ctx.fillStyle = '#a1ff62';
      ctx.fillRect(320, cardY + 26, 210, 32);
      ctx.fillStyle = '#151313';
      ctx.font = '700 14px monospace';
      ctx.fillText('PALING BANYAK DIPILIH', 334, cardY + 42);
    }

    // Harga Besar di Kanan
    ctx.textAlign = 'right';
    ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
    ctx.font = '700 36px Inter, Arial, sans-serif';
    ctx.fillText(formatRp(t.price), W - 80, cardY + 48);

    ctx.fillStyle = isFeatured ? '#b8b8b8' : '#7a7a7a';
    ctx.font = '500 16px monospace';
    ctx.fillText(`ESTIMASI: ${String(t.days || '').toUpperCase()}`, W - 80, cardY + 82);

    // Deskripsi & Butir Layanan
    ctx.textAlign = 'left';
    ctx.fillStyle = isFeatured ? '#b8b8b8' : '#4f4c4c';
    ctx.font = '400 18px Inter, Arial, sans-serif';
    ctx.fillText(String(t.subtitle || '').slice(0, 68), 84, cardY + 84);

    ctx.strokeStyle = isFeatured ? '#312e2e' : '#e1e1e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(84, cardY + 108);
    ctx.lineTo(W - 80, cardY + 108);
    ctx.stroke();

    const items = (t.items || []).slice(0, 4);
    ctx.font = '500 18px Inter, Arial, sans-serif';
    for (let j = 0; j < items.length; j++) {
      const col = j % 2;
      const row = Math.floor(j / 2);
      const ix = col === 0 ? 84 : 560;
      const iy = cardY + 146 + row * 48;

      ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
      ctx.fillRect(ix, iy - 6, 10, 10);

      ctx.fillStyle = isFeatured ? '#f4f4f4' : '#201d1d';
      ctx.fillText(String(items[j]).slice(0, 40), ix + 20, iy);
    }

    cardY += cardH + 22;
  }

  // Kotak Ketentuan & Kontak Bawah (#eaeaea Ash Gray)
  const footY = 1142;
  ctx.fillStyle = '#eaeaea';
  ctx.fillRect(48, footY, W - 96, 156);
  ctx.strokeStyle = '#312e2e';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, footY, W - 96, 156);

  ctx.fillStyle = '#201d1d';
  ctx.font = '700 18px Inter, Arial, sans-serif';
  ctx.fillText('KETENTUAN PEMESANAN & JADWAL KERJA', 76, footY + 36);

  ctx.fillStyle = '#4f4c4c';
  ctx.font = '400 17px Inter, Arial, sans-serif';
  ctx.fillText(
    `1. Uang Muka (DP) ${docData.dpPercent}% untuk kunci jadwal produksi · Pelunasan ${100 - docData.dpPercent}% sebelum serah terima file akhir.`,
    76,
    footY + 72
  );
  ctx.fillText(
    `2. Kuota revisi gratis: ${docData.revisionLimit} · Kontak Pemesanan: ${docData.contactPhone || '-'} (${docData.creatorName})`,
    76,
    footY + 104
  );

  ctx.fillStyle = '#201d1d';
  ctx.font = '700 15px monospace';
  ctx.fillText(`PEMBAYARAN RESMI: ${String(docData.bankInfo || '').slice(0, 76)}`, 76, footY + 134);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/* ==========================================================================
   2. EKSPOR PROPOSAL PENAWARAN RESMI (.PDF A4)
   ========================================================================== */
export function exportProposalPdf(docData) {
  const cmds = [];
  let y = 790;

  const text = (str, x, yPos, font = 'F1', size = 10, rgb = [0.12, 0.11, 0.11]) => {
    cmds.push(
      `BT /${font} ${size} Tf ${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${yPos} Td (${sanitizePdfText(str)}) Tj ET`
    );
  };
  const rectFill = (x, yPos, w, h, rgb) => {
    cmds.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${yPos} ${w} ${h} re f`);
  };
  const rectStroke = (x, yPos, w, h, rgb = [0.19, 0.18, 0.18], lw = 0.8) => {
    cmds.push(`${lw} w ${rgb[0]} ${rgb[1]} ${rgb[2]} RG ${x} ${yPos} ${w} ${h} re S`);
  };

  // Header Blok Obsidian
  rectFill(40, 734, 515, 72, [0.08, 0.07, 0.07]);
  rectFill(54, 782, 148, 14, [0.63, 1.0, 0.38]);
  text('PROPOSAL PENAWARAN JASA', 60, 786, 'F3', 8, [0.08, 0.07, 0.07]);
  text(docData.studioName || 'Studio Jasa Kreatif', 54, 760, 'F2', 16, [0.96, 0.96, 0.96]);
  text(`${docData.creatorName} | Kontak: ${docData.contactPhone}`, 54, 744, 'F1', 9.5, [0.75, 0.75, 0.75]);
  text(`No: ${docData.docNumber}`, 405, 784, 'F3', 8.5, [0.96, 0.96, 0.96]);
  text(`Tanggal: ${docData.dateLabel}`, 405, 770, 'F1', 9, [0.82, 0.82, 0.82]);

  y = 706;
  rectFill(40, y - 48, 515, 56, [0.95, 0.95, 0.95]);
  rectStroke(40, y - 48, 515, 56);
  text('DITUJUKAN KEPADA:', 52, y - 8, 'F3', 8, [0.45, 0.45, 0.45]);
  text(docData.clientName || 'Calon Klien Yth.', 52, y - 23, 'F2', 12);
  text(`Proyek: ${docData.projectName} (${docData.serviceName})`, 52, y - 38, 'F1', 9.5, [0.28, 0.28, 0.28]);
  text(`Durasi: ${docData.turnaround}`, 380, y - 23, 'F2', 10);
  text(`Kuota Revisi: ${docData.revisionLimit}`, 380, y - 38, 'F1', 9, [0.28, 0.28, 0.28]);

  y -= 72;
  text('1. RINGKASAN PILIHAN PAKET & INVESTASI BIAYA', 40, y, 'F2', 11);
  y -= 12;

  for (let i = 0; i < docData.tiers.length; i++) {
    const t = docData.tiers[i];
    const isSel = i === docData.selectedTierIdx;
    const boxH = 98;
    rectFill(40, y - boxH, 515, boxH, isSel ? [0.93, 0.98, 0.88] : [1, 1, 1]);
    rectStroke(40, y - boxH, 515, boxH, isSel ? [0.08, 0.07, 0.07] : [0.72, 0.72, 0.72], isSel ? 1.4 : 0.7);

    text(
      `${t.tier.toUpperCase()} ${isSel ? '[PAKET REKOMENDASI PILIHAN]' : ''}`,
      52,
      y - 18,
      'F2',
      10.5
    );
    text(`${formatRp(t.price)}  (${t.days})`, 365, y - 18, 'F2', 11);
    text(t.subtitle || '', 52, y - 32, 'F1', 9, [0.35, 0.35, 0.35]);

    const items = (t.items || []).slice(0, 4);
    for (let k = 0; k < items.length; k++) {
      text(`- ${items[k]}`, 56, y - 47 - k * 12, 'F1', 8.8);
    }
    y -= boxH + 10;
  }

  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1];
  const dpAmount = Math.round((chosen.price * docData.dpPercent) / 100);
  const finalAmount = Math.max(0, chosen.price - dpAmount);

  y -= 8;
  text('2. SKEMA PEMBAYARAN & KETENTUAN KERJA', 40, y, 'F2', 11);
  y -= 16;
  rectFill(40, y - 76, 515, 80, [0.96, 0.96, 0.96]);
  rectStroke(40, y - 76, 515, 80);

  text(
    `Paket Terpilih: ${chosen.tier} — Total Nilai Proyek: ${formatRp(chosen.price)}`,
    52,
    y - 14,
    'F2',
    9.8
  );
  text(
    `Termin 1 (DP Pengunci Jadwal ${docData.dpPercent}%): ${formatRp(dpAmount)}   |   Pelunasan Akhir (${100 - docData.dpPercent}%): ${formatRp(finalAmount)}`,
    52,
    y - 29,
    'F1',
    9.2
  );
  text(`Rekening Pembayaran: ${docData.bankInfo}`, 52, y - 44, 'F2', 9);

  const clauseLines = wrapPlainText(docData.customClause, 92).slice(0, 2);
  clauseLines.forEach((cl, idx) => {
    text(cl, 52, y - 58 - idx * 11, 'F1', 8.3, [0.32, 0.32, 0.32]);
  });

  y -= 104;
  text('Disetujui untuk dijadwalkan oleh:', 52, y, 'F1', 9.5);
  text('Hormat kami, Penyedia Jasa:', 360, y, 'F1', 9.5);
  text(`( ${docData.clientName || 'Pihak Klien'} )`, 52, y - 44, 'F2', 9.5);
  text(`( ${docData.creatorName || docData.studioName} )`, 360, y - 44, 'F2', 9.5);

  return buildCleanA4Pdf([cmds]);
}

/* ==========================================================================
   3. EKSPOR INVOICE TAGIHAN RESMI (.PDF A4)
   ========================================================================== */
export function exportInvoicePdf(docData) {
  const cmds = [];
  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1];
  const addonTotal = (docData.selectedAddons || []).reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const grandTotal = chosen.price + addonTotal;
  const dpAmount = Math.round((grandTotal * docData.dpPercent) / 100);
  const remAmount = Math.max(0, grandTotal - dpAmount);

  const text = (str, x, yPos, font = 'F1', size = 10, rgb = [0.12, 0.11, 0.11]) => {
    cmds.push(
      `BT /${font} ${size} Tf ${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${yPos} Td (${sanitizePdfText(str)}) Tj ET`
    );
  };
  const rectFill = (x, yPos, w, h, rgb) => {
    cmds.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x} ${yPos} ${w} ${h} re f`);
  };
  const rectStroke = (x, yPos, w, h, rgb = [0.19, 0.18, 0.18], lw = 0.8) => {
    cmds.push(`${lw} w ${rgb[0]} ${rgb[1]} ${rgb[2]} RG ${x} ${yPos} ${w} ${h} re S`);
  };

  // Header Invoice
  rectFill(40, 736, 515, 70, [0.08, 0.07, 0.07]);
  rectFill(54, 782, 118, 14, [0.63, 1.0, 0.38]);
  text('INVOICE RESMI', 62, 786, 'F3', 8.5, [0.08, 0.07, 0.07]);
  text(docData.studioName || 'Studio Jasa Kreatif', 54, 760, 'F2', 16, [0.96, 0.96, 0.96]);
  text(`${docData.creatorName} | WA: ${docData.contactPhone}`, 54, 744, 'F1', 9.5, [0.75, 0.75, 0.75]);

  text(`No Invoice: ${docData.invoiceNumber}`, 375, 782, 'F3', 9, [0.96, 0.96, 0.96]);
  text(`Tanggal Terbit: ${docData.dateLabel}`, 375, 766, 'F1', 9, [0.85, 0.85, 0.85]);
  text(`Jatuh Tempo: 3 Hari Kalender`, 375, 751, 'F1', 9, [0.63, 1.0, 0.38]);

  // Info Tagihan Kepada
  rectFill(40, 658, 515, 62, [0.95, 0.95, 0.95]);
  rectStroke(40, 658, 515, 62);
  text('TAGIHAN KEPADA:', 52, 704, 'F3', 8, [0.45, 0.45, 0.45]);
  text(docData.clientName || 'Klien Yth.', 52, 688, 'F2', 12);
  text(`Nama Proyek: ${docData.projectName}`, 52, 671, 'F1', 9.5);
  text(`Bidang Layanan: ${docData.serviceName}`, 320, 688, 'F1', 9.5);
  text(`Batas Revisi: ${docData.revisionLimit}`, 320, 671, 'F1', 9.5);

  // Tabel Rincian
  let y = 626;
  rectFill(40, y, 515, 24, [0.12, 0.11, 0.11]);
  text('DESKRIPSI PEKERJAAN & CAKUPAN LAYANAN', 52, y + 8, 'F2', 9, [1, 1, 1]);
  text('DURASI', 355, y + 8, 'F2', 9, [1, 1, 1]);
  text('JUMLAH (IDR)', 455, y + 8, 'F2', 9, [1, 1, 1]);

  y -= 42;
  rectStroke(40, y, 515, 42, [0.78, 0.78, 0.78]);
  text(`${chosen.tier} — ${docData.serviceName}`, 52, y + 25, 'F2', 10);
  text((chosen.items || []).slice(0, 2).join(' + ').slice(0, 65), 52, y + 10, 'F1', 8.5, [0.38, 0.38, 0.38]);
  text(chosen.days || '-', 355, y + 18, 'F1', 9.5);
  text(formatRp(chosen.price), 455, y + 18, 'F2', 10);

  for (const ad of docData.selectedAddons || []) {
    y -= 30;
    rectStroke(40, y, 515, 30, [0.78, 0.78, 0.78]);
    text(`Tambahan (Add-On): ${ad.name}`, 52, y + 10, 'F1', 9.5);
    text('Sesuai Paket', 355, y + 10, 'F1', 9);
    text(formatRp(ad.price), 455, y + 10, 'F2', 9.5);
  }

  // Ringkasan Total & DP
  y -= 92;
  rectFill(280, y, 275, 80, [0.95, 0.95, 0.95]);
  rectStroke(280, y, 275, 80);
  text('Total Nilai Pekerjaan:', 294, y + 58, 'F1', 9.5);
  text(formatRp(grandTotal), 450, y + 58, 'F2', 10);

  text(`Tagihan Termin 1 (DP ${docData.dpPercent}%):`, 294, y + 36, 'F2', 10);
  text(formatRp(dpAmount), 450, y + 36, 'F2', 11);

  text(`Sisa Pelunasan Akhir (${100 - docData.dpPercent}%):`, 294, y + 14, 'F1', 9, [0.38, 0.38, 0.38]);
  text(formatRp(remAmount), 450, y + 14, 'F1', 9.5, [0.38, 0.38, 0.38]);

  // Instruksi Pembayaran
  y -= 86;
  rectFill(40, y, 515, 68, [0.93, 0.98, 0.88]);
  rectStroke(40, y, 515, 68, [0.12, 0.11, 0.11], 1);
  text('INSTRUKSI PEMBAYARAN RESMI', 52, y + 48, 'F2', 9.5);
  text(docData.bankInfo || '-', 52, y + 30, 'F2', 10.5);
  text(
    'Harap cantumkan Nomor Invoice pada berita transfer. File akhir tanpa watermark diserahkan setelah pelunasan 100%.',
    52,
    y + 13,
    'F1',
    8.5,
    [0.25, 0.25, 0.25]
  );

  text('Diterbitkan secara sah oleh:', 400, y - 34, 'F1', 9);
  text(docData.creatorName || docData.studioName, 400, y - 72, 'F2', 10);

  return buildCleanA4Pdf([cmds]);
}

/* ==========================================================================
   4. EKSPOR SURAT KESEPAKATAN KERJA & KLAUSUL ANTI-REVISI (.DOCX WORD ASLI)
   ========================================================================== */
function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ -1) >>> 0;
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

export function exportAgreementDocx(docData) {
  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1];
  const addonTotal = (docData.selectedAddons || []).reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const grandTotal = chosen.price + addonTotal;
  const dpAmount = Math.round((grandTotal * docData.dpPercent) / 100);
  const remAmount = Math.max(0, grandTotal - dpAmount);

  const p = (txt, bold = false, sizeHalfPt = 22) => `
    <w:p>
      <w:pPr><w:spacing w:after="140"/></w:pPr>
      <w:r>
        <w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${sizeHalfPt}"/></w:rPr>
        <w:t xml:space="preserve">${xmlEsc(txt)}</w:t>
      </w:r>
    </w:p>`;

  const deliverablesXml = (chosen.items || [])
    .map((it, idx) => p(`   ${idx + 1}. ${it}`, false, 21))
    .join('');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${p('SURAT KESEPAKATAN KERJA JASA KREATIF & MANDIRI', true, 28)}
    ${p(`Nomor Dokumen: ${docData.docNumber}   |   Tanggal: ${docData.dateLabel}`, false, 20)}
    ${p('--------------------------------------------------------------------------------', false, 18)}
    ${p(`PIHAK PERTAMA (Penyedia Jasa): ${docData.studioName} (${docData.creatorName}) — Kontak: ${docData.contactPhone}`, true, 22)}
    ${p(`PIHAK KEDUA (Pemberi Kerja / Klien): ${docData.clientName}`, true, 22)}
    ${p(`Nama Proyek: ${docData.projectName} (${docData.serviceName} - ${chosen.tier})`, false, 22)}
    ${p('PASAL 1 — RUANG LINGKUP PEKERJAAN', true, 24)}
    ${p(`Pihak Pertama mengerjakan paket layanan "${chosen.tier}" dengan estimasi durasi ${chosen.days} sejak seluruh bahan pendukung diterima lengkap, mencakup rincian sebagai berikut:`)}
    ${deliverablesXml}
    ${p('PASAL 2 — NILAI BIAYA & TAHAPAN PEMBAYARAN', true, 24)}
    ${p(`Total biaya pekerjaan yang disepakati adalah sebesar ${formatRp(grandTotal)} dengan rincian pembayaran:`)}
    ${p(`   - Termin 1 (Uang Muka / DP Pengunci Jadwal ${docData.dpPercent}%): ${formatRp(dpAmount)} dibayarkan sebelum pengerjaan dimulai.`)}
    ${p(`   - Termin 2 (Pelunasan Akhir ${100 - docData.dpPercent}%): ${formatRp(remAmount)} dibayarkan sebelum penyerahan file akhir beresolusi penuh tanpa watermark.`)}
    ${p(`   - Rekening Tujuan Resmi: ${docData.bankInfo}`)}
    ${p('PASAL 3 — KUOTA REVISI & PERLINDUNGAN LINGKUP KERJA', true, 24)}
    ${p(`Paket ini mencakup kuota revisi gratis sebanyak: ${docData.revisionLimit}. Masukan revisi disampaikan terangkum maksimal 5 hari kerja setelah pratinjau draf dikirimkan.`)}
    ${p(docData.customClause || 'Perubahan konsep total di luar kesepakatan awal atau permintaan file proyek mentah dikenakan biaya tambahan sesuai kartu harga Studio.')}
    ${p('PASAL 4 — PERSETUJUAN KEDUA BELAH PIHAK', true, 24)}
    ${p('Dengan ditandatanganinya dokumen ini atau dilakukannya pembayaran Termin 1 (DP), kedua belah pihak menyatakan sepakat atas seluruh poin di atas.')}
    ${p(`Pihak Kedua (Klien): ${docData.clientName}                    Pihak Pertama (Studio): ${docData.creatorName}`, true, 22)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
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

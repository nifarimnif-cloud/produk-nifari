/**
 * TarifKarya Studio — Mesin Ekspor 4 Dokumen Jadi 100% di Browser
 * 1. Desain Kartu Harga / Rate Card 3 Paket Siap Kirim WA/IG (.PNG 1080×1350)
 * 2. Proposal Penawaran & Rincian Paket Resmi (.PDF A4 Multi-Halaman)
 * 3. Invoice Tagihan DP / Pelunasan Resmi (.PDF A4 Multi-Halaman)
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
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPlainText(text, maxChars) {
  const rawParagraphs = String(text || '').split(/\r?\n/);
  const allLines = [];
  for (const para of rawParagraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let cur = words[0];
    while (cur.length > maxChars) {
      allLines.push(cur.slice(0, maxChars - 1) + '-');
      cur = cur.slice(maxChars - 1);
    }
    for (let i = 1; i < words.length; i++) {
      let w = words[i];
      if ((cur + ' ' + w).length <= maxChars) {
        cur += ' ' + w;
      } else {
        allLines.push(cur);
        while (w.length > maxChars) {
          allLines.push(w.slice(0, maxChars - 1) + '-');
          w = w.slice(maxChars - 1);
        }
        cur = w;
      }
    }
    if (cur) allLines.push(cur);
  }
  return allLines.length ? allLines : [''];
}

function fitCanvasSingleLine(ctx, text, maxWidth) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (ctx.measureText(clean).width <= maxWidth) return clean;
  const words = clean.split(' ');
  let fitted = '';
  for (let i = 0; i < words.length; i++) {
    const candidate = fitted ? `${fitted} ${words[i]}` : words[i];
    if (ctx.measureText(`${candidate}…`).width <= maxWidth) {
      fitted = candidate;
    } else {
      break;
    }
  }
  if (fitted) return `${fitted}…`;
  let chars = clean;
  while (chars.length > 1 && ctx.measureText(`${chars}…`).width > maxWidth) {
    chars = chars.slice(0, -1);
  }
  return `${chars}…`;
}

function wrapCanvasLines(ctx, text, maxWidth, maxLines = 2) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const words = clean.split(' ');
  const lines = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else if (!current) {
      lines.push(fitCanvasSingleLine(ctx, word, maxWidth));
      if (lines.length >= maxLines) return lines;
    } else {
      if (lines.length === maxLines - 1) {
        const rest = `${current} ${words.slice(i).join(' ')}`;
        lines.push(fitCanvasSingleLine(ctx, rest, maxWidth));
        return lines;
      }
      lines.push(current);
      current = word;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(fitCanvasSingleLine(ctx, current, maxWidth));
  }
  return lines.length ? lines : [''];
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
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Lanjutkan dengan font fallback sistem jika gagal memuat webfont
    }
  }

  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Kanvas Concrete (#f4f4f4)
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, W, H);

  // Bingkai luar tipis Ink (#201d1d)
  ctx.strokeStyle = '#201d1d';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Header Blok Obsidian (#151313)
  ctx.fillStyle = '#151313';
  ctx.fillRect(48, 48, W - 96, 198);

  // Badge Volt di kiri atas Header
  const headerBadgeText = 'RATE CARD RESMI STUDIO';
  ctx.font = '700 15px monospace';
  const headerBadgeW = Math.max(236, Math.ceil(ctx.measureText(headerBadgeText).width) + 28);
  ctx.fillStyle = '#a1ff62';
  ctx.fillRect(80, 74, headerBadgeW, 34);
  ctx.fillStyle = '#151313';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(headerBadgeText, 94, 91);

  // Tanggal di kanan atas Header
  ctx.fillStyle = '#b8b8b8';
  ctx.font = '500 15px monospace';
  ctx.textAlign = 'right';
  const dateStr = fitCanvasSingleLine(ctx, `BERLAKU: ${String(docData.dateLabel || '').toUpperCase()}`, 360);
  ctx.fillText(dateStr, W - 80, 91);

  // Judul Studio & Layanan
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f4f4f4';
  ctx.font = '700 40px Inter, Arial, sans-serif';
  ctx.fillText(fitCanvasSingleLine(ctx, docData.studioName || 'Studio Jasa Kreatif', W - 160), 80, 148);

  ctx.fillStyle = '#a1ff62';
  ctx.font = '500 22px Inter, Arial, sans-serif';
  ctx.fillText(fitCanvasSingleLine(ctx, `Layanan: ${docData.serviceName || ''}`, W - 160), 80, 200);

  // 3 Kartu Paket (Baris Horizontal Tajam 5px gaya Osmo)
  let cardY = 264;
  const cardH = 274;
  const tiers = (docData.tiers || []).slice(0, 3);

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const isFeatured = i === docData.selectedTierIdx;

    ctx.fillStyle = isFeatured ? '#151313' : '#ffffff';
    ctx.fillRect(48, cardY, W - 96, cardH);
    ctx.strokeStyle = isFeatured ? '#151313' : '#312e2e';
    ctx.lineWidth = isFeatured ? 3 : 2;
    ctx.strokeRect(48, cardY, W - 96, cardH);

    // Pita penanda kiri
    ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
    ctx.fillRect(48, cardY, 12, cardH);

    // Ukur Harga Besar di Kanan terlebih dulu agar judul & badge tidak pernah menabrak harga
    const priceStr = formatRp(t.price);
    ctx.font = '700 34px Inter, Arial, sans-serif';
    const priceW = Math.ceil(ctx.measureText(priceStr).width);
    ctx.textAlign = 'right';
    ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
    ctx.fillText(priceStr, W - 80, cardY + 40);

    // Nama Paket & Badge Rekomendasi Dinamis
    const leftAreaRightEdge = W - 80 - priceW - 24;
    const badgeLabel = 'PALING BANYAK DIPILIH';
    ctx.font = '700 13.5px monospace';
    const badgeW = isFeatured ? Math.ceil(ctx.measureText(badgeLabel).width) + 24 : 0;
    const maxTitleW = Math.max(180, leftAreaRightEdge - 84 - (isFeatured ? badgeW + 14 : 0));

    ctx.textAlign = 'left';
    ctx.font = '700 26px Inter, Arial, sans-serif';
    const tierTitle = fitCanvasSingleLine(ctx, String(t.tier || '').toUpperCase(), maxTitleW);
    const titleW = Math.ceil(ctx.measureText(tierTitle).width);
    ctx.fillStyle = isFeatured ? '#f4f4f4' : '#201d1d';
    ctx.fillText(tierTitle, 84, cardY + 40);

    if (isFeatured) {
      const badgeX = 84 + titleW + 14;
      ctx.fillStyle = '#a1ff62';
      ctx.fillRect(badgeX, cardY + 24, badgeW, 30);
      ctx.fillStyle = '#151313';
      ctx.font = '700 13.5px monospace';
      ctx.fillText(badgeLabel, badgeX + 12, cardY + 39);
    }

    // Subjudul (Kiri) & Estimasi (Kanan) dipisah bersih agar tak pernah bertumpuk
    ctx.textAlign = 'left';
    ctx.fillStyle = isFeatured ? '#b8b8b8' : '#4f4c4c';
    ctx.font = '400 17px Inter, Arial, sans-serif';
    ctx.fillText(fitCanvasSingleLine(ctx, t.subtitle || '', 575), 84, cardY + 76);

    ctx.textAlign = 'right';
    ctx.fillStyle = isFeatured ? '#b8b8b8' : '#7a7a7a';
    ctx.font = '500 15px monospace';
    ctx.fillText(
      fitCanvasSingleLine(ctx, `ESTIMASI: ${String(t.days || '-').toUpperCase()}`, 315),
      W - 80,
      cardY + 76
    );

    // Garis pemisah dalam kartu
    ctx.strokeStyle = isFeatured ? '#312e2e' : '#e1e1e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(84, cardY + 98);
    ctx.lineTo(W - 80, cardY + 98);
    ctx.stroke();

    // Dukung hingga 5 butir layanan per paket dengan pembungkusan 2 baris utuh per kata
    const items = (t.items || []).slice(0, 5);
    const rowCount = Math.max(1, Math.ceil(items.length / 2));
    const rowGap = rowCount >= 3 ? 48 : 62;
    ctx.textAlign = 'left';

    for (let j = 0; j < items.length; j++) {
      const col = j % 2;
      const row = Math.floor(j / 2);
      const ix = col === 0 ? 84 : 548;
      const colMaxW = col === 0 ? 426 : 434;
      const iy = cardY + 122 + row * rowGap;

      ctx.fillStyle = isFeatured ? '#a1ff62' : '#201d1d';
      ctx.fillRect(ix, iy - 5, 9, 9);

      ctx.font = '500 16px Inter, Arial, sans-serif';
      const wrappedBullet = wrapCanvasLines(ctx, items[j], colMaxW, 2);
      ctx.fillStyle = isFeatured ? '#f4f4f4' : '#201d1d';
      wrappedBullet.forEach((ln, lIdx) => {
        ctx.fillText(ln, ix + 18, iy + lIdx * 19);
      });
    }

    cardY += cardH + 16;
  }

  // Kotak Ketentuan & Kontak Bawah (#eaeaea Ash Gray, batas lebar W - 152 = 928px)
  const footY = 1136;
  const footH = 166;
  const footMaxW = W - 152;
  ctx.fillStyle = '#eaeaea';
  ctx.fillRect(48, footY, W - 96, footH);
  ctx.strokeStyle = '#312e2e';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, footY, W - 96, footH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#201d1d';
  ctx.font = '700 17.5px Inter, Arial, sans-serif';
  ctx.fillText('KETENTUAN PEMESANAN & JADWAL KERJA', 76, footY + 30);

  ctx.fillStyle = '#4f4c4c';
  ctx.font = '400 16px Inter, Arial, sans-serif';
  const term1 = `1. Uang Muka (DP) ${docData.dpPercent}% pengunci jadwal · Pelunasan ${100 - docData.dpPercent}% sebelum serah terima file akhir.`;
  const term2 = `2. Kuota revisi gratis: ${docData.revisionLimit || '-'} · Kontak: ${docData.contactPhone || '-'} (${docData.creatorName || '-'})`;

  let fy = footY + 60;
  wrapCanvasLines(ctx, term1, footMaxW, 2).forEach((ln) => {
    ctx.fillText(ln, 76, fy);
    fy += 20;
  });
  fy += 4;
  wrapCanvasLines(ctx, term2, footMaxW, 2).forEach((ln) => {
    ctx.fillText(ln, 76, fy);
    fy += 20;
  });

  ctx.fillStyle = '#201d1d';
  ctx.font = '700 14.5px monospace';
  const bankLine = fitCanvasSingleLine(ctx, `PEMBAYARAN RESMI: ${docData.bankInfo || '-'}`, footMaxW);
  ctx.fillText(bankLine, 76, Math.min(footY + footH - 20, Math.max(fy + 8, footY + 140)));

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/* ==========================================================================
   2. EKSPOR PROPOSAL PENAWARAN RESMI (.PDF A4 MULTI-HALAMAN)
   ========================================================================== */
export function exportProposalPdf(docData) {
  const pages = [];
  let cmds = [];
  let y = 790;

  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1] || docData.tiers[0];
  const selectedAddons = docData.selectedAddons || [];
  const addonTotal = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const grandTotal = (Number(chosen?.price) || 0) + addonTotal;
  const dpAmount = Math.round((grandTotal * (Number(docData.dpPercent) || 50)) / 100);
  const finalAmount = Math.max(0, grandTotal - dpAmount);

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

  function startPage(isFirst) {
    if (cmds.length) pages.push(cmds);
    cmds = [];
    if (isFirst) {
      rectFill(40, 730, 515, 76, [0.08, 0.07, 0.07]);
      rectFill(54, 784, 152, 14, [0.63, 1.0, 0.38]);
      text('PROPOSAL PENAWARAN JASA', 60, 788, 'F3', 8, [0.08, 0.07, 0.07]);
      const studioHead = wrapPlainText(docData.studioName || 'Studio Jasa Kreatif', 38)[0];
      const creatorHead = wrapPlainText(`${docData.creatorName || '-'} | Kontak: ${docData.contactPhone || '-'}`, 56)[0];
      text(studioHead, 54, 760, 'F2', 15, [0.96, 0.96, 0.96]);
      text(creatorHead, 54, 742, 'F1', 9.2, [0.75, 0.75, 0.75]);
      text(`No: ${docData.docNumber}`, 395, 784, 'F3', 8.5, [0.96, 0.96, 0.96]);
      text(`Tanggal: ${docData.dateLabel}`, 395, 768, 'F1', 9, [0.82, 0.82, 0.82]);
      y = 714;
    } else {
      rectFill(40, 774, 515, 32, [0.08, 0.07, 0.07]);
      const contHead = wrapPlainText(`Proposal Penawaran — ${docData.clientName || 'Klien'} (${docData.docNumber})`, 76)[0];
      text(contHead, 54, 786, 'F2', 9.5, [0.96, 0.96, 0.96]);
      y = 754;
    }
  }

  function ensureSpace(need) {
    if (y - need < 48) {
      startPage(false);
    }
  }

  startPage(true);

  // Kotak Info Klien & Ketentuan Inti (dibungkus per kolom agar tidak pernah bertabrakan)
  const clientLines = wrapPlainText(docData.clientName || 'Calon Klien Yth.', 42);
  const projectLines = wrapPlainText(`Proyek: ${docData.projectName} (${docData.serviceName})`, 52);
  const durLines = wrapPlainText(`Durasi: ${docData.turnaround}`, 30);
  const revLines = wrapPlainText(`Kuota Revisi: ${docData.revisionLimit}`, 32);

  const leftCount = 1 + clientLines.length + projectLines.length;
  const rightCount = 1 + durLines.length + revLines.length;
  const infoBoxH = Math.max(58, Math.max(leftCount, rightCount) * 13 + 16);

  rectFill(40, y - infoBoxH, 515, infoBoxH, [0.95, 0.95, 0.95]);
  rectStroke(40, y - infoBoxH, 515, infoBoxH);

  let ly = y - 14;
  text('DITUJUKAN KEPADA:', 52, ly, 'F3', 8, [0.45, 0.45, 0.45]);
  ly -= 14;
  for (const ln of clientLines) {
    text(ln, 52, ly, 'F2', 11);
    ly -= 13;
  }
  for (const ln of projectLines) {
    text(ln, 52, ly, 'F1', 9.2, [0.28, 0.28, 0.28]);
    ly -= 12;
  }

  let ry = y - 14;
  text('KETENTUAN INTI:', 362, ry, 'F3', 8, [0.45, 0.45, 0.45]);
  ry -= 14;
  for (const ln of durLines) {
    text(ln, 362, ry, 'F2', 9.5);
    ry -= 13;
  }
  for (const ln of revLines) {
    text(ln, 362, ry, 'F1', 9, [0.28, 0.28, 0.28]);
    ry -= 12;
  }

  y -= infoBoxH + 18;
  ensureSpace(34);
  text('1. RINGKASAN PILIHAN PAKET & INVESTASI BIAYA', 40, y, 'F2', 11);
  y -= 10;

  for (let i = 0; i < (docData.tiers || []).length; i++) {
    const t = docData.tiers[i];
    const isSel = i === docData.selectedTierIdx;
    const subLines = t.subtitle ? wrapPlainText(t.subtitle, 84) : [];
    const bulletLines = (t.items || []).flatMap((it) => wrapPlainText(`- ${it}`, 86));
    const boxH = 28 + subLines.length * 11.5 + bulletLines.length * 11.5 + 10;

    ensureSpace(boxH + 10);
    rectFill(40, y - boxH, 515, boxH, isSel ? [0.93, 0.98, 0.88] : [1, 1, 1]);
    rectStroke(40, y - boxH, 515, boxH, isSel ? [0.08, 0.07, 0.07] : [0.72, 0.72, 0.72], isSel ? 1.4 : 0.7);

    const tierLabel = wrapPlainText(
      `${String(t.tier || '').toUpperCase()} ${isSel ? '[PAKET REKOMENDASI PILIHAN]' : ''}`,
      50
    )[0];
    const priceDurLabel = wrapPlainText(`${formatRp(t.price)} (${t.days || '-'})`, 30)[0];
    text(tierLabel, 52, y - 16, 'F2', 10.2);
    text(priceDurLabel, 362, y - 16, 'F2', 10.2);

    let ty = y - 30;
    for (const sl of subLines) {
      text(sl, 52, ty, 'F1', 8.8, [0.35, 0.35, 0.35]);
      ty -= 11.5;
    }
    for (const bl of bulletLines) {
      text(bl, 56, ty, 'F1', 8.8);
      ty -= 11.5;
    }

    y -= boxH + 8;
  }

  // Bagian 2: Rincian Paket Terpilih + Add-On + Skema Pembayaran (100% selaras dengan Invoice & SPK)
  const addonItemLines = selectedAddons.flatMap((ad) =>
    wrapPlainText(`+ Tambahan (Add-On): ${ad.name} — ${formatRp(ad.price)}`, 84)
  );
  const bankLines = wrapPlainText(`Rekening Pembayaran: ${docData.bankInfo || '-'}`, 82);
  const payBoxLinesCount = 3 + addonItemLines.length + bankLines.length;
  const payBoxH = payBoxLinesCount * 13.5 + 16;

  ensureSpace(payBoxH + 28);
  y -= 6;
  text('2. RINCIAN INVESTASI TERPILIH & SKEMA PEMBAYARAN', 40, y, 'F2', 11);
  y -= 10;

  rectFill(40, y - payBoxH, 515, payBoxH, [0.96, 0.96, 0.96]);
  rectStroke(40, y - payBoxH, 515, payBoxH);

  let py = y - 15;
  text(`Paket Utama Terpilih: ${chosen.tier} — ${formatRp(chosen.price)}`, 52, py, 'F2', 9.5);
  py -= 13.5;

  for (const al of addonItemLines) {
    text(al, 52, py, 'F1', 9, [0.22, 0.22, 0.22]);
    py -= 13.5;
  }

  text(
    `Total Nilai Proyek${addonTotal > 0 ? ' (Paket + Add-On)' : ''}: ${formatRp(grandTotal)}`,
    52,
    py,
    'F2',
    10
  );
  py -= 13.5;

  text(
    `Termin 1 (DP Pengunci Jadwal ${docData.dpPercent}%): ${formatRp(dpAmount)}   |   Pelunasan Akhir (${100 - docData.dpPercent}%): ${formatRp(finalAmount)}`,
    52,
    py,
    'F1',
    9.1
  );
  py -= 13.5;

  for (const bl of bankLines) {
    text(bl, 52, py, 'F2', 9);
    py -= 13.5;
  }

  y -= payBoxH + 14;

  // Bagian 3: Klausul Perlindungan Kerja Utuh (tanpa .slice(0, 2), mendukung halaman lanjutan)
  const clauseText =
    (docData.customClause || '').trim() ||
    'Selama tahap pratinjau, hasil kerja dikirim ber-watermark. File akhir resolusi penuh diserahkan setelah pelunasan 100% diterima.';
  const clauseLines = wrapPlainText(clauseText, 88);

  ensureSpace(34);
  text('3. KLAUSUL PERLINDUNGAN & KETENTUAN KERJA', 40, y, 'F2', 10.5);
  y -= 14;

  for (const cl of clauseLines) {
    ensureSpace(15);
    text(cl, 46, y, 'F1', 8.8, [0.25, 0.25, 0.25]);
    y -= 12;
  }

  // Blok Tanda Tangan Persetujuan
  ensureSpace(70);
  y -= 14;
  text('Disetujui untuk dijadwalkan oleh:', 52, y, 'F1', 9.5);
  text('Hormat kami, Penyedia Jasa:', 350, y, 'F1', 9.5);
  const signClient = wrapPlainText(`( ${docData.clientName || 'Pihak Klien'} )`, 38)[0];
  const signCreator = wrapPlainText(`( ${docData.creatorName || docData.studioName} )`, 34)[0];
  text(signClient, 52, y - 42, 'F2', 9.5);
  text(signCreator, 350, y - 42, 'F2', 9.5);

  if (cmds.length) pages.push(cmds);
  return buildCleanA4Pdf(pages);
}

/* ==========================================================================
   3. EKSPOR INVOICE TAGIHAN RESMI (.PDF A4 MULTI-HALAMAN)
   ========================================================================== */
export function exportInvoicePdf(docData) {
  const pages = [];
  let cmds = [];
  let y = 790;

  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1] || docData.tiers[0];
  const selectedAddons = docData.selectedAddons || [];
  const addonTotal = selectedAddons.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const grandTotal = (Number(chosen?.price) || 0) + addonTotal;
  const dpAmount = Math.round((grandTotal * (Number(docData.dpPercent) || 50)) / 100);
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

  function startPage(isFirst) {
    if (cmds.length) pages.push(cmds);
    cmds = [];
    if (isFirst) {
      rectFill(40, 732, 515, 74, [0.08, 0.07, 0.07]);
      rectFill(54, 784, 118, 14, [0.63, 1.0, 0.38]);
      text('INVOICE RESMI', 62, 788, 'F3', 8.5, [0.08, 0.07, 0.07]);
      const studioHead = wrapPlainText(docData.studioName || 'Studio Jasa Kreatif', 36)[0];
      const creatorHead = wrapPlainText(`${docData.creatorName || '-'} | WA: ${docData.contactPhone || '-'}`, 52)[0];
      text(studioHead, 54, 760, 'F2', 15, [0.96, 0.96, 0.96]);
      text(creatorHead, 54, 743, 'F1', 9.2, [0.75, 0.75, 0.75]);

      text(`No Invoice: ${docData.invoiceNumber}`, 372, 784, 'F3', 8.8, [0.96, 0.96, 0.96]);
      text(`Tanggal Terbit: ${docData.dateLabel}`, 372, 768, 'F1', 9, [0.85, 0.85, 0.85]);
      text('Jatuh Tempo: 3 Hari Kalender', 372, 752, 'F1', 9, [0.63, 1.0, 0.38]);
      y = 716;
    } else {
      rectFill(40, 774, 515, 32, [0.08, 0.07, 0.07]);
      const contHead = wrapPlainText(`Invoice Lanjutan — ${docData.clientName || 'Klien'} (${docData.invoiceNumber})`, 76)[0];
      text(contHead, 54, 786, 'F2', 9.5, [0.96, 0.96, 0.96]);
      y = 754;
    }
  }

  function ensureSpace(need) {
    if (y - need < 48) {
      startPage(false);
    }
  }

  startPage(true);

  // Info Tagihan Kepada (dibungkus rapi per kolom agar tidak bertabrakan di x = 330)
  const clientLines = wrapPlainText(docData.clientName || 'Klien Yth.', 38);
  const projLines = wrapPlainText(`Nama Proyek: ${docData.projectName}`, 46);
  const srvLines = wrapPlainText(`Bidang Layanan: ${docData.serviceName}`, 36);
  const revLines = wrapPlainText(`Batas Revisi: ${docData.revisionLimit}`, 36);

  const leftRows = 1 + clientLines.length + projLines.length;
  const rightRows = 1 + srvLines.length + revLines.length;
  const billBoxH = Math.max(60, Math.max(leftRows, rightRows) * 13 + 16);

  rectFill(40, y - billBoxH, 515, billBoxH, [0.95, 0.95, 0.95]);
  rectStroke(40, y - billBoxH, 515, billBoxH);

  let ly = y - 14;
  text('TAGIHAN KEPADA:', 52, ly, 'F3', 8, [0.45, 0.45, 0.45]);
  ly -= 14;
  for (const ln of clientLines) {
    text(ln, 52, ly, 'F2', 11);
    ly -= 13;
  }
  for (const ln of projLines) {
    text(ln, 52, ly, 'F1', 9.2);
    ly -= 12;
  }

  let ry = y - 14;
  text('DETAIL LAYANAN:', 332, ry, 'F3', 8, [0.45, 0.45, 0.45]);
  ry -= 14;
  for (const ln of srvLines) {
    text(ln, 332, ry, 'F1', 9.2);
    ry -= 12.5;
  }
  for (const ln of revLines) {
    text(ln, 332, ry, 'F1', 9.2);
    ry -= 12.5;
  }

  y -= billBoxH + 16;

  // Header Tabel Rincian
  ensureSpace(64);
  rectFill(40, y - 24, 515, 24, [0.12, 0.11, 0.11]);
  text('DESKRIPSI PEKERJAAN & CAKUPAN LAYANAN', 52, y - 16, 'F2', 9, [1, 1, 1]);
  text('DURASI', 350, y - 16, 'F2', 9, [1, 1, 1]);
  text('JUMLAH (IDR)', 452, y - 16, 'F2', 9, [1, 1, 1]);
  y -= 24;

  // Baris Paket Utama (seluruh deliverable dibungkus per kata tanpa pemotongan tengah kata)
  const mainTitleLines = wrapPlainText(`${chosen.tier} — ${docData.serviceName}`, 48);
  const mainItemLines = (chosen.items || []).flatMap((it) => wrapPlainText(`* ${it}`, 54));
  const durCellLines = wrapPlainText(docData.turnaround || chosen.days || '-', 16);
  const descHeight = mainTitleLines.length * 13 + mainItemLines.length * 11 + 14;
  const mainRowH = Math.max(40, descHeight, durCellLines.length * 12 + 16);

  ensureSpace(mainRowH + 6);
  rectStroke(40, y - mainRowH, 515, mainRowH, [0.78, 0.78, 0.78]);

  let my = y - 15;
  for (const tl of mainTitleLines) {
    text(tl, 52, my, 'F2', 9.8);
    my -= 13;
  }
  for (const il of mainItemLines) {
    text(il, 56, my, 'F1', 8.4, [0.35, 0.35, 0.35]);
    my -= 11;
  }

  let dy = y - 15;
  for (const dl of durCellLines) {
    text(dl, 350, dy, 'F1', 9);
    dy -= 12;
  }
  text(formatRp(chosen.price), 452, y - 15, 'F2', 10);
  y -= mainRowH;

  // Baris Add-On
  for (const ad of selectedAddons) {
    const adLines = wrapPlainText(`Tambahan (Add-On): ${ad.name}`, 50);
    const adRowH = Math.max(28, adLines.length * 12 + 12);
    ensureSpace(adRowH + 4);
    rectStroke(40, y - adRowH, 515, adRowH, [0.78, 0.78, 0.78]);
    let ay = y - 15;
    for (const al of adLines) {
      text(al, 52, ay, 'F1', 9.3);
      ay -= 12;
    }
    text('Sesuai Paket', 350, y - 15, 'F1', 9);
    text(formatRp(ad.price), 452, y - 15, 'F2', 9.5);
    y -= adRowH;
  }

  // Ringkasan Total & DP
  ensureSpace(96);
  y -= 12;
  rectFill(265, y - 80, 290, 80, [0.95, 0.95, 0.95]);
  rectStroke(265, y - 80, 290, 80);
  text('Total Nilai Pekerjaan:', 278, y - 22, 'F1', 9.5);
  text(formatRp(grandTotal), 452, y - 22, 'F2', 10);

  text(`Tagihan Termin 1 (DP ${docData.dpPercent}%):`, 278, y - 44, 'F2', 10);
  text(formatRp(dpAmount), 452, y - 44, 'F2', 11);

  text(`Sisa Pelunasan Akhir (${100 - docData.dpPercent}%):`, 278, y - 66, 'F1', 9, [0.38, 0.38, 0.38]);
  text(formatRp(remAmount), 452, y - 66, 'F1', 9.5, [0.38, 0.38, 0.38]);
  y -= 94;

  // Instruksi Pembayaran
  const bankLines = wrapPlainText(docData.bankInfo || '-', 74);
  const payBoxH = Math.max(66, 44 + bankLines.length * 13);
  ensureSpace(payBoxH + 14);
  rectFill(40, y - payBoxH, 515, payBoxH, [0.93, 0.98, 0.88]);
  rectStroke(40, y - payBoxH, 515, payBoxH, [0.12, 0.11, 0.11], 1);
  text('INSTRUKSI PEMBAYARAN RESMI', 52, y - 16, 'F2', 9.5);
  let by = y - 32;
  for (const bl of bankLines) {
    text(bl, 52, by, 'F2', 10.2);
    by -= 13;
  }
  text(
    'Harap cantumkan Nomor Invoice pada berita transfer. File akhir tanpa watermark diserahkan setelah pelunasan 100%.',
    52,
    by - 2,
    'F1',
    8.3,
    [0.25, 0.25, 0.25]
  );
  y -= payBoxH + 14;

  // Klausul Ketentuan Tambahan (bila ada) dengan paginasi otomatis
  if (docData.customClause && docData.customClause.trim()) {
    const clauseLines = wrapPlainText(docData.customClause, 88);
    ensureSpace(26);
    text('CATATAN & KETENTUAN KERJA:', 40, y, 'F2', 9.2);
    y -= 13;
    for (const cl of clauseLines) {
      ensureSpace(14);
      text(cl, 46, y, 'F1', 8.5, [0.3, 0.3, 0.3]);
      y -= 11.5;
    }
    y -= 6;
  }

  ensureSpace(62);
  text('Diterbitkan secara sah oleh:', 375, y - 10, 'F1', 9);
  const signCreator = wrapPlainText(docData.creatorName || docData.studioName, 32)[0];
  text(signCreator, 375, y - 46, 'F2', 10);

  if (cmds.length) pages.push(cmds);
  return buildCleanA4Pdf(pages);
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
  const chosen = docData.tiers[docData.selectedTierIdx] || docData.tiers[1] || docData.tiers[0];
  const selectedAddons = docData.selectedAddons || [];
  const addonTotal = selectedAddons.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
  const grandTotal = (Number(chosen?.price) || 0) + addonTotal;
  const dpAmount = Math.round((grandTotal * (Number(docData.dpPercent) || 50)) / 100);
  const remAmount = Math.max(0, grandTotal - dpAmount);
  const turnaroundText = docData.turnaround || chosen.days || '-';

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

  const addonsXml =
    selectedAddons.length > 0
      ? p('   Layanan Tambahan (Add-On) yang Disepakati:', true, 21) +
        selectedAddons
          .map((ad, idx) => p(`   + Add-On ${idx + 1}: ${ad.name} (${formatRp(ad.price)})`, false, 21))
          .join('')
      : '';

  const feeBreakdownNote =
    addonTotal > 0
      ? ` (terdiri dari paket utama ${formatRp(chosen.price)} ditambah layanan tambahan/add-on ${formatRp(addonTotal)})`
      : '';

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
    ${p(`Pihak Pertama mengerjakan paket layanan "${chosen.tier}" dengan estimasi durasi ${turnaroundText} sejak seluruh bahan pendukung diterima lengkap, mencakup rincian sebagai berikut:`)}
    ${deliverablesXml}
    ${addonsXml}
    ${p('PASAL 2 — NILAI BIAYA & TAHAPAN PEMBAYARAN', true, 24)}
    ${p(`Total biaya pekerjaan yang disepakati adalah sebesar ${formatRp(grandTotal)}${feeBreakdownNote} dengan rincian pembayaran:`)}
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

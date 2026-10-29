// Mesin Ekspor 4 Dokumen Asli LabaToko Studio (100% Client-Side: PDF Audit, PNG 1080x1350, CSV Excel & DOCX Word)
(function () {
  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    const neg = n < 0 ? '-' : '';
    return neg + 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function slugify(str) {
    return (
      String(str || 'sku-toko')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42) || 'sku-toko'
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
      if ('ilI.,:;\'!| '.includes(ch)) units += 0.29;
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

  // 1. Lembar Audit Margin, Harga Coret & Rambu Iklan Resmi (.PDF A4)
  function exportMarginAuditPdf(sku, store) {
    const pages = [];
    let cmds = [];
    let y = 780;

    function startPage(first) {
      if (cmds.length) pages.push(cmds);
      cmds = [];
      if (first) {
        const subLines = wrapPdfByWidth(
          'LabaToko Studio  |  Toko: ' + (store.storeName || 'Toko Online') + '  |  Platform: ' + sku.platform,
          500,
          9.6,
          false
        ).slice(0, 2);
        const skuLines = wrapPdfByWidth('SKU Produk: ' + sku.skuName, 500, 9.5, true).slice(0, 2);
        const headerBottom = 738;
        // Espresso Ink header (#141311 -> 0.078 0.075 0.067) + Vermilion bar (#D9381E -> 0.851 0.220 0.118)
        cmds.push(`0.078 0.075 0.067 rg 0 ${headerBottom} 595 ${842 - headerBottom} re f`);
        cmds.push(`0.851 0.220 0.118 rg 0 ${headerBottom - 4} 595 4 re f`);
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 16 Tf 44 812 Td (${sanitizePdf('LEMBAR AUDIT MARGIN SKU & RAMBU BATAS IKLAN')}) Tj ET`);
        let hy = 793;
        subLines.forEach((ln) => {
          cmds.push(`BT /F1 9.6 Tf 44 ${hy} Td (${sanitizePdf(ln)}) Tj ET`);
          hy -= 12.5;
        });
        skuLines.forEach((ln) => {
          cmds.push(`BT /F2 9.5 Tf 44 ${hy} Td (${sanitizePdf(ln)}) Tj ET`);
          hy -= 12.5;
        });
        y = 712;
      } else {
        const contTitle = wrapPdfByWidth('LabaToko Studio - Lanjutan Audit SKU: ' + sku.skuName, 500, 10, true)[0];
        cmds.push('0.078 0.075 0.067 rg 0 804 595 38 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 10 Tf 44 818 Td (${sanitizePdf(contTitle)}) Tj ET`);
        y = 780;
      }
      cmds.push('0.08 0.08 0.08 rg');
    }

    function ensureSpace(need) {
      if (y - need < 54) startPage(false);
    }

    function addSection(title) {
      ensureSpace(30);
      cmds.push('0.988 0.925 0.914 rg 44 ' + (y - 6) + ' 507 20 re f');
      cmds.push('0.851 0.220 0.118 rg');
      cmds.push(`BT /F2 10.5 Tf 52 ${y} Td (${sanitizePdf(title)}) Tj ET`);
      cmds.push('0.08 0.08 0.08 rg');
      y -= 24;
    }

    function addRow(left, right, bold = false) {
      const fontSize = 9.6;
      const font = bold ? '/F2' : '/F1';
      const rightStr = String(right || '');
      const rightW = estimatePdfWidth(rightStr, fontSize, bold);
      const rightX = Math.max(368, Math.round(545 - rightW));
      const maxLeftWidth = Math.min(312, rightX - 60);
      const leftLines = wrapPdfByWidth(left, maxLeftWidth, fontSize, bold);

      ensureSpace(leftLines.length * 13 + 8);
      cmds.push(`BT ${font} ${fontSize} Tf ${rightX} ${y} Td (${sanitizePdf(rightStr)}) Tj ET`);
      leftLines.forEach((ln, idx) => {
        const ly = y - idx * 13;
        cmds.push(`BT ${font} ${fontSize} Tf 48 ${ly} Td (${sanitizePdf(ln)}) Tj ET`);
      });

      const bottomLineY = y - (leftLines.length - 1) * 13;
      cmds.push('0.91 0.90 0.89 rg 48 ' + (bottomLineY - 5) + ' 497 0.6 re f');
      cmds.push('0.08 0.08 0.08 rg');
      y = bottomLineY - 17;
    }

    function addNote(text) {
      const lines = wrapPdfByWidth(text, 496, 9.5, false);
      ensureSpace(lines.length * 13 + 8);
      lines.forEach((ln) => {
        cmds.push(`BT /F1 9.5 Tf 48 ${y} Td (${sanitizePdf(ln)}) Tj ET`);
        y -= 13;
      });
      y -= 4;
    }

    startPage(true);

    addSection('1. RINCIAN MODAL & POTONGAN MARKETPLACE PER 1 PCS');
    addRow('Modal Pokok Barang (HPP)', formatRp(sku.hpp));
    addRow('Biaya Kemasan, Kardus/Bubble & Cetak Resi', formatRp(sku.packingCost));
    addRow('Cadangan Risiko Retur / Selisih Gudang', formatRp(sku.returnBuffer));
    addRow('Harga Jual Tayang Etalase (Setelah Coret)', formatRp(sku.sellingPrice), true);
    addRow(`Potongan Admin + Gratis Ongkir/Promo (${sku.totalFeePct.toFixed(1)}%)`, '- ' + formatRp(sku.marketplaceFeeRp));
    addRow('Biaya Proses Pesanan Tetap per Resi', '- ' + formatRp(sku.fixedOrderFee));
    addRow('Alokasi Voucher Toko Ditanggung Penjual', '- ' + formatRp(sku.voucherSellerRp));
    addRow('LABA KOTOR SEBELUM IKLAN (MARGIN RUANG IKLAN)', `${formatRp(sku.profitBeforeAds)} (${sku.netMarginBeforeAdsPct.toFixed(1)}%)`, true);

    addSection('2. STRATEGI HARGA CORET & 3 PAKET BUNDEL PENAIK OMZET');
    addRow(`Harga Coret Etalase (Diskon Tampil ${sku.strikeDiscountPct}%)`, `${formatRp(sku.strikePrice)} -> Tayang ${formatRp(sku.sellingPrice)}`, true);
    (sku.bundles || []).forEach((b) => {
      addRow(`${b.title} - Harga Paket ${formatRp(b.bundlePrice)}`, `Laba Kotor: ${formatRp(b.netProfit)}`);
    });

    addSection('3. RAMBU BATAS AMAN IKLAN (SHOPEE ADS / GMV MAX TIKTOK)');
    addRow('Batas Maksimal Biaya Iklan / Pesanan (Impas 0 Rugi)', formatRp(sku.maxCpaBreakEven), true);
    addRow('Target Biaya Iklan Sehat / Pesanan (Sisa Laba Aman)', formatRp(sku.healthyCpaTarget));
    addRow('Estimasi Laba Bersih Masuk Kantong (Setelah Iklan Sehat)', formatRp(sku.finalTakeHomePerOrder), true);
    addRow('ROAS Impas Minimal (Di Bawah Angka Ini = Rugi)', `${sku.breakEvenRoas.toFixed(2)}x`);
    addRow('ROAS Sehat Wajib Dicapai Tim Iklan', `${sku.healthyRoas.toFixed(2)}x`, true);

    addNote(
      `Artinya: Setiap saldo iklan Rp 100.000 terpakai, iklan SKU ini WAJIB menghasilkan omzet minimal ${formatRp(Math.round(100000 * sku.healthyRoas))} agar toko tetap membawa pulang laba bersih sehat.`
    );

    if (cmds.length) pages.push(cmds);
    const blob = buildMultiPagePdf(pages);
    const filename = `Audit-Margin-Iklan-${slugify(sku.skuName)}.pdf`;
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

  // 2. Kartu Rambu Harga & Batas Iklan Tim Admin (.PNG 1080x1350)
  async function exportAdminCardPng(sku, store) {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (_e) {
        // Proceed with fallback system fonts if font promise fails
      }
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      function rrect(x, y, w, h, r, fill, stroke) {
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

      // Warm Alabaster Canvas (#F6F5F1)
      ctx.fillStyle = '#F6F5F1';
      ctx.fillRect(0, 0, 1080, 1350);

      // Espresso Header (#141311) + Vermilion Accent Strip (#D9381E)
      ctx.fillStyle = '#141311';
      ctx.fillRect(0, 0, 1080, 278);
      ctx.fillStyle = '#D9381E';
      ctx.fillRect(0, 278, 1080, 10);

      rrect(64, 42, 434, 42, 8, '#D9381E', null);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KARTU RAMBU HARGA & IKLAN TIM ADMIN', 84, 70, 394);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
      const titleLines = wrapCanvasText(ctx, String(sku.skuName || 'SKU Produk Toko'), 952, 2);
      if (titleLines.length === 1) {
        ctx.fillText(titleLines[0], 64, 140, 952);
      } else {
        ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(titleLines[0], 64, 126, 952);
        ctx.fillText(titleLines[1], 64, 162, 952);
      }

      ctx.fillStyle = '#D6D3CD';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      const storeLine = wrapCanvasText(ctx, `${store.storeName || 'Toko Online'}  •  ${sku.platform}`, 952, 1)[0];
      ctx.fillText(storeLine, 64, 210, 952);
      ctx.fillText(`HPP + Packing + Cadangan: ${formatRp(sku.hpp + sku.packingCost + sku.returnBuffer)}`, 64, 248, 952);

      // Card 1: Harga Tayang & Harga Coret
      rrect(64, 316, 952, 240, 24, '#FFFFFF', '#E2DFD9');
      ctx.fillStyle = '#6E6A63';
      ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PATOKAN HARGA ETALASE & VOUCHER MAKSIMAL', 96, 362, 888);

      ctx.fillStyle = '#141311';
      ctx.font = '800 50px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(formatRp(sku.sellingPrice), 96, 432, 888);

      ctx.fillStyle = '#D9381E';
      ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Harga Coret: ${formatRp(sku.strikePrice)} (Diskon ${sku.strikeDiscountPct}%)`, 96, 480, 888);

      ctx.fillStyle = '#137347';
      ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `Sisa Laba Sebelum Iklan: ${formatRp(sku.profitBeforeAds)}/pcs  •  Batas Voucher: ${formatRp(sku.voucherSellerRp)}`,
        96,
        524,
        888
      );

      // Card 2: Rambu Batas Aman Iklan
      rrect(64, 582, 952, 298, 24, '#FCECE9', '#D9381E');
      ctx.fillStyle = '#D9381E';
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('RAMBU WAJIB TIM IKLAN (JANGAN LEWATI BATAS INI)', 96, 628, 888);

      ctx.fillStyle = '#141311';
      ctx.font = '800 42px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`ROAS Sehat Minimal: ${sku.healthyRoas.toFixed(2)}x`, 96, 692, 888);

      ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`• ROAS Impas (Batas 0 Rugi): ${sku.breakEvenRoas.toFixed(2)}x`, 96, 746, 888);
      ctx.fillText(`• Maksimal Biaya Iklan / Pesanan (Impas): ${formatRp(sku.maxCpaBreakEven)}`, 96, 788, 888);
      ctx.fillStyle = '#137347';
      ctx.fillText(
        `• Target Iklan Sehat: ${formatRp(sku.healthyCpaTarget)}/order  ->  Bersih Kantong: ${formatRp(sku.finalTakeHomePerOrder)}`,
        96,
        832,
        888
      );

      // Card 3: Paket Bundling Penaik Keranjang (Stacked 2-line rows so left & right never collide)
      rrect(64, 906, 952, 344, 24, '#FFFFFF', '#E2DFD9');
      ctx.fillStyle = '#6E6A63';
      ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('REKOMENDASI HARGA PAKET BUNDEL (HEMAT ONGKIR & KEMASAN)', 96, 950, 888);

      (sku.bundles || []).forEach((b, idx) => {
        const by = 998 + idx * 84;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#141311';
        ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
        const bTitle = wrapCanvasText(ctx, b.title, 610, 1)[0];
        ctx.fillText(bTitle, 96, by, 610);

        ctx.textAlign = 'right';
        ctx.font = '800 24px "JetBrains Mono", monospace';
        ctx.fillText(formatRp(b.bundlePrice), 984, by, 260);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#6E6A63';
        ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
        const bSub = wrapCanvasText(ctx, b.subtitle || '', 510, 1)[0];
        ctx.fillText(bSub, 96, by + 29, 510);

        ctx.textAlign = 'right';
        ctx.fillStyle = b.netProfit > 0 ? '#137347' : '#D9381E';
        ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Laba Kotor Paket: ${formatRp(b.netProfit)}`, 984, by + 29, 360);

        ctx.textAlign = 'left';
        if (idx < (sku.bundles || []).length - 1) {
          ctx.fillStyle = '#ECEAE4';
          ctx.fillRect(96, by + 44, 888, 1.5);
        }
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = '#6E6A63';
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Dicetak dari LabaToko Studio — Kalkulator Untung Toko Online & Batas Aman Iklan', 64, 1302, 952);

      canvas.toBlob((blob) => {
        const filename = `Rambu-Admin-${slugify(sku.skuName)}.png`;
        triggerDownload(blob, filename);
        resolve({ blob, filename });
      }, 'image/png');
    });
  }

  // 3. Tabel Kalkulator Margin & Pelacak Iklan Harian 30 Hari (.CSV UTF-8 BOM)
  function exportProfitTrackerCsv(sku, store) {
    function esc(v) {
      return `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    }

    const lines = [];
    lines.push(['RINGKASAN UNIT EKONOMI SKU — LABATOKO STUDIO', ''].map(esc).join(','));
    lines.push(['Nama Toko', store.storeName || 'Toko Online'].map(esc).join(','));
    lines.push(['Nama Produk / SKU', sku.skuName].map(esc).join(','));
    lines.push(['Platform', sku.platform].map(esc).join(','));
    lines.push(['Modal HPP (Rp)', sku.hpp].map(esc).join(','));
    lines.push(['Biaya Packing & Resi (Rp)', sku.packingCost].map(esc).join(','));
    lines.push(['Cadangan Retur (Rp)', sku.returnBuffer].map(esc).join(','));
    lines.push(['Harga Tayang Etalase (Rp)', sku.sellingPrice].map(esc).join(','));
    lines.push(['Harga Coret Psikologis (Rp)', sku.strikePrice].map(esc).join(','));
    lines.push(['Total Potongan Persen Platform (%)', sku.totalFeePct.toFixed(2)].map(esc).join(','));
    lines.push(['Potongan Platform + Biaya Proses + Voucher (Rp)', Math.round(sku.marketplaceFeeRp + sku.fixedOrderFee + sku.voucherSellerRp)].map(esc).join(','));
    lines.push(['Laba Sebelum Iklan per Pcs (Rp)', Math.round(sku.profitBeforeAds)].map(esc).join(','));
    lines.push(['ROAS Impas Minimal', sku.breakEvenRoas.toFixed(2)].map(esc).join(','));
    lines.push(['ROAS Sehat Wajib', sku.healthyRoas.toFixed(2)].map(esc).join(','));
    lines.push(['', ''].map(esc).join(','));

    lines.push(
      [
        'Hari Ke',
        'Pesanan Terjual (Pcs)',
        'Omzet Kotor Harian (Rp)',
        'Total HPP + Packing (Rp)',
        'Total Potongan Platform (Rp)',
        'Biaya Iklan Terpakai (Rp)',
        'ROAS Harian Aktual',
        'Laba Bersih Masuk Rekening (Rp)',
        'Status Kesehatan Iklan'
      ]
        .map(esc)
        .join(',')
    );

    const unitCost = Math.round(sku.hpp + sku.packingCost + sku.returnBuffer);
    const unitFee = Math.round(sku.marketplaceFeeRp + sku.fixedOrderFee + sku.voucherSellerRp);
    for (let d = 1; d <= 30; d++) {
      const sampleOrders = d <= 3 ? 10 : 0;
      const omzet = sampleOrders * sku.sellingPrice;
      const totCost = sampleOrders * unitCost;
      const totFee = sampleOrders * unitFee;
      const adSpend = d <= 3 ? sampleOrders * sku.healthyCpaTarget : 0;
      const actualRoas = adSpend > 0 ? (omzet / adSpend).toFixed(2) : '0.00';
      const netCash = omzet - totCost - totFee - adSpend;
      const note = d <= 3 ? 'Contoh Simulasi Sehat (Silakan Ganti Angka)' : 'Belum Diisi';

      lines.push(
        [`Hari ${d}`, sampleOrders, omzet, totCost, totFee, adSpend, actualRoas, netCash, note].map(esc).join(',')
      );
    }

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const filename = `Pelacak-Untung-Iklan-${slugify(sku.skuName)}.csv`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  // Minimal Pure-JS ZIP Builder (STORE method, CRC32) for Genuine OOXML .DOCX
  const crcTable = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildZipBlob(files, mimeType) {
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((f) => {
      const nameBytes = enc.encode(f.name);
      const dataBytes = typeof f.content === 'string' ? enc.encode(f.content) : f.content;
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x2100, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

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
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      localParts.push(localHeader, dataBytes);
      centralParts.push(centralHeader);
      offset += localHeader.length + dataBytes.length;
    });

    const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, eocd], { type: mimeType });
  }

  function escXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 4. Dokumen SOP Promo, Flash Sale & Evaluasi Iklan Harian Tim Toko (.DOCX Word Asli)
  function exportStoreSopDocx(sku, store) {
    function wp(text, bold = false, sizeHalfPt = 22) {
      return `<w:p><w:pPr><w:spacing w:after="140"/></w:pPr><w:r><w:rPr>${
        bold ? '<w:b/>' : ''
      }<w:sz w:val="${sizeHalfPt}"/></w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
    }

    const bodyXml = [
      wp('SOP RESMI HARGA PROMO & EVALUASI IKLAN TOKO ONLINE', true, 30),
      wp(`Nama Toko: ${store.storeName || 'Toko Online'}  |  Platform: ${sku.platform}`, false, 20),
      wp(`SKU Produk: ${sku.skuName}`, true, 24),
      wp('1. ATURAN KERAS HARGA ETALASE & VOUCHER (DILARANG LEWAT BATAS)', true, 24),
      wp(`- Harga Coret Etalase: ${formatRp(sku.strikePrice)} (Diskon Tampil ${sku.strikeDiscountPct}%).`),
      wp(`- Harga Jual Tayang Minimum: ${formatRp(sku.sellingPrice)} per pcs.`),
      wp(`- Batas Maksimal Voucher Toko yang Ditanggung Penjual: ${formatRp(sku.voucherSellerRp)} per pesanan.`),
      wp(`- Jangan pernah mengaktifkan dua voucher toko yang dapat dipakai bertumpuk pada hari kampanye tanggal kembar tanpa simulasi ulang di LabaToko Studio.`),
      wp('2. PAKET BUNDLING PENAIK NILAI KERANJANG', true, 24),
      ...(sku.bundles || []).map((b) => wp(`- ${b.title}: Jual di harga ${formatRp(b.bundlePrice)} (Estimasi Laba Sebelum Iklan: ${formatRp(b.netProfit)}).`)),
      wp('3. SOP HARIAN PEMANTAUAN IKLAN (SHOPEE ADS / GMV MAX TIKTOK)', true, 24),
      wp(`- Angka Keramat ROAS Impas SKU ini adalah ${sku.breakEvenRoas.toFixed(2)}x. Jika selama 3 hari berturut-turut ROAS aktual turun di bawah angka ini, segera jeda kata kunci boros dan periksa stok ukuran/warna populer.`),
      wp(`- Target ROAS Sehat Wajib adalah minimal ${sku.healthyRoas.toFixed(2)}x (Biaya iklan maksimal ${formatRp(sku.healthyCpaTarget)} per pesanan) agar toko mengantongi bersih ${formatRp(sku.finalTakeHomePerOrder)} per pcs.`),
      wp(`- Bila ROAS stabil di atas ${sku.healthyRoas.toFixed(2)}x selama 4 hari penuh dan stok gudang aman, anggaran harian boleh dinaikkan bertahap 20% - 25%.`),
      wp('4. DAFTAR CEK PAGI & SORE ADMIN TOKO', true, 24),
      wp('- Pagi (08.30 WIB): Cek ketersediaan stok varian utama, cek saldo iklan cukup sampai jam 22.00 malam, dan balas chat pembeli semalam.'),
      wp('- Sore (16.00 WIB): Pastikan seluruh paket bundel dihitung jumlah pcs-nya dengan teliti sebelum diserahkan ke kurir penjemputan.')
    ].join('');

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

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const blob = buildZipBlob(
      [
        { name: '[Content_Types].xml', content: contentTypes },
        { name: '_rels/.rels', content: rootRels },
        { name: 'word/document.xml', content: documentXml }
      ],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    const filename = `SOP-Harga-Iklan-${slugify(sku.skuName)}.docx`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  window.LabaTokoExporter = {
    exportMarginAuditPdf,
    exportAdminCardPng,
    exportProfitTrackerCsv,
    exportStoreSopDocx
  };
})();

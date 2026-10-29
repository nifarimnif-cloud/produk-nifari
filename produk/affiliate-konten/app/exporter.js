// Mesin Ekspor 4 Dokumen Asli KomisiKlip Studio (100% Client-Side: PDF Multi-Halaman, PNG 9:16 & CSV Excel)
(function () {
  function sanitizePdfText(str) {
    return String(str || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2022/g, '*')
      .replace(/\u2026/g, '...')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function wrapLines(text, maxChars) {
    const rawParas = String(text || '').split(/\r?\n/);
    const lines = [];
    for (const para of rawParas) {
      const words = para.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      if (!words.length) continue;
      let current = '';
      for (let rawWord of words) {
        while (rawWord.length > maxChars) {
          if (current) {
            lines.push(current);
            current = '';
          }
          lines.push(rawWord.slice(0, maxChars - 1) + '-');
          rawWord = rawWord.slice(maxChars - 1);
        }
        const candidate = current ? current + ' ' + rawWord : rawWord;
        if (candidate.length <= maxChars) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = rawWord;
        }
      }
      if (current) lines.push(current);
    }
    return lines.length ? lines : [''];
  }

  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function buildMultiPagePdf(pagesCommands) {
    const objects = [];
    const numPages = pagesCommands.length;
    const kidsRefs = [];
    for (let i = 0; i < numPages; i++) {
      kidsRefs.push(`${5 + i * 2} 0 R`);
    }

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
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
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

  function slugify(str) {
    return (
      String(str || 'produk-affiliate')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42) || 'produk-affiliate'
    );
  }

  // 1. Ekspor Lembar Syuting 3 Variasi Skrip & Shot List (.PDF)
  function exportScriptSheetPdf(project, creator) {
    const pages = [];
    let cmds = [];
    let y = 790;

    function startNewPage(isFirst) {
      if (cmds.length) pages.push(cmds);
      cmds = [];
      if (isFirst) {
        const metaLine1 = wrapLines(
          'KomisiKlip Studio  |  Kreator: ' +
            (creator.name || 'Kreator Affiliate') +
            ' (' +
            (creator.handle || '@kreator') +
            ')',
          90
        );
        const metaLine2 = wrapLines(
          'Platform: ' + (project.platform || '-') + '  |  Gaya: ' + (project.visualStyle || '-'),
          92
        );
        const totalMetaLines = metaLine1.length + metaLine2.length;
        const bandH = Math.max(86, 56 + totalMetaLines * 14);
        const bandBottom = 842 - bandH;

        cmds.push(`0.031 0.506 0.467 rg 0 ${bandBottom} 595 ${bandH} re f`);
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 17 Tf 44 808 Td (${sanitizePdfText('LEMBAR SYUTING & SKRIP VIDEO AFFILIATE')}) Tj ET`);
        let hy = 788;
        metaLine1.forEach((ln) => {
          cmds.push(`BT /F1 10 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 14;
        });
        metaLine2.forEach((ln) => {
          cmds.push(`BT /F1 9.5 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 13.5;
        });
        y = bandBottom - 26;
      } else {
        const contLines = wrapLines(
          'KomisiKlip Studio - Lanjutan Lembar Syuting: ' + (project.productName || ''),
          84
        );
        const bandH = Math.max(38, 22 + contLines.length * 13);
        const bandBottom = 842 - bandH;
        cmds.push(`0.031 0.506 0.467 rg 0 ${bandBottom} 595 ${bandH} re f`);
        cmds.push('1 1 1 rg');
        let hy = 820;
        contLines.forEach((ln) => {
          cmds.push(`BT /F2 10.5 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 13;
        });
        y = bandBottom - 24;
      }
      cmds.push('0.106 0.106 0.106 rg');
    }

    function ensureSpace(need) {
      if (y - need < 52) {
        startNewPage(false);
      }
    }

    function addHeading(title) {
      const hLines = wrapLines(title, 82);
      const boxH = 8 + hLines.length * 13;
      ensureSpace(boxH + 14);
      cmds.push(`0.847 0.929 0.922 rg 44 ${y - boxH + 12} 507 ${boxH} re f`);
      cmds.push('0.031 0.506 0.467 rg');
      hLines.forEach((ln) => {
        cmds.push(`BT /F2 10.5 Tf 52 ${y} Td (${sanitizePdfText(ln)}) Tj ET`);
        y -= 13;
      });
      cmds.push('0.106 0.106 0.106 rg');
      y -= 11;
    }

    function addParagraph(label, text, indent = 44) {
      const full = label ? `${label}: ${text}` : text;
      const maxChars = Math.max(40, Math.floor((545 - indent) / 5.15));
      const lines = wrapLines(full, maxChars);
      ensureSpace(lines.length * 14 + 6);
      lines.forEach((ln, idx) => {
        const font = idx === 0 && label ? '/F2' : '/F1';
        cmds.push(`BT ${font} 9.8 Tf ${indent} ${y} Td (${sanitizePdfText(ln)}) Tj ET`);
        y -= 13.5;
      });
      y -= 3;
    }

    startNewPage(true);

    const commRp = Math.round((Number(project.price) || 0) * ((Number(project.commissionPct) || 0) / 100));
    addHeading('RINGKASAN PRODUK & POTENSI KOMISI');
    addParagraph('Nama Produk', project.productName);
    addParagraph(
      'Harga & Komisi',
      `${formatRp(project.price)}  |  Komisi ${project.commissionPct}% (${formatRp(commRp)} per barang terjual)`
    );
    addParagraph('Target Pembeli', project.audience);
    addParagraph('Masalah Utama', project.painPoint);

    (project.variations || []).forEach((v, idx) => {
      addHeading(`VARIASI ${idx + 1}: ${v.title.toUpperCase()} (${v.duration})`);
      v.blocks.forEach((b) => {
        addParagraph(`[${b.time}] ${b.stage}`, b.spoken, 48);
        addParagraph('Arahan Kamera', b.visual, 54);
      });
      addParagraph('Teks di Layar', v.onScreenText, 48);
      y -= 4;
    });

    addHeading('PAKET CAPTION, TAGAR & KOMENTAR SEMATAN');
    addParagraph('Caption Video', project.caption || '-');
    addParagraph('Tagar Pencarian', project.hashtags || '-');
    addParagraph('Komentar Sematan (Pinned)', project.pinnedComment || '-');

    if (cmds.length) pages.push(cmds);
    const blob = buildMultiPagePdf(pages);
    const filename = `Skrip-Syuting-${slugify(project.productName)}.pdf`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  // 2. Ekspor Kartu Contekan Syuting 9:16 untuk Galeri HP (.PNG 1080x1920)
  async function exportCueCardPng(project, creator, activeVarIndex = 0) {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font loading timeout
      }
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      const v =
        (project.variations && project.variations[activeVarIndex]) ||
        (project.variations && project.variations[0]);
      const commRp = Math.round((Number(project.price) || 0) * ((Number(project.commissionPct) || 0) / 100));

      function roundRect(x, y, w, h, r, fill, stroke) {
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

      function fitSingleLine(text, maxWidth, font) {
        ctx.font = font;
        const clean = String(text || '').replace(/\s+/g, ' ').trim();
        if (!clean) return '';
        if (ctx.measureText(clean).width <= maxWidth) return clean;
        let trimmed = clean;
        while (trimmed.length > 1 && ctx.measureText(trimmed + '...').width > maxWidth) {
          trimmed = trimmed.slice(0, -1);
        }
        return trimmed.trim() + '...';
      }

      function layoutWrappedLines(text, maxWidth, font, maxLines = 4) {
        ctx.font = font;
        const clean = String(text || '').replace(/\s+/g, ' ').trim();
        if (!clean) return [''];
        const words = clean.split(' ');
        const lines = [];
        let line = '';
        for (let i = 0; i < words.length; i++) {
          const test = line ? line + ' ' + words[i] : words[i];
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = words[i];
            if (lines.length >= maxLines - 1) {
              const rest = words.slice(i).join(' ');
              lines.push(fitSingleLine(rest, maxWidth, font));
              return lines;
            }
          } else if (ctx.measureText(test).width > maxWidth && !line) {
            lines.push(fitSingleLine(words[i], maxWidth, font));
            if (lines.length >= maxLines) return lines;
          } else {
            line = test;
          }
        }
        if (line && lines.length < maxLines) {
          lines.push(fitSingleLine(line, maxWidth, font));
        }
        return lines.length ? lines : [''];
      }

      function drawWrapped(text, x, y, maxWidth, lineHeight, font, color, maxLines = 4) {
        const lines = layoutWrappedLines(text, maxWidth, font, maxLines);
        ctx.font = font;
        ctx.fillStyle = color;
        let curY = y;
        for (const ln of lines) {
          ctx.fillText(ln, x, curY);
          curY += lineHeight;
        }
        return curY;
      }

      // Base Canvas Warmth (#faf8f5)
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, 1080, 1920);

      // Measure header title & meta lines first so header height fits cleanly without overlap
      const titleFont = '700 42px "DM Sans", sans-serif';
      const metaFont = '500 23px "DM Sans", sans-serif';
      const titleLines = layoutWrappedLines(project.productName || 'Produk Affiliate', 952, titleFont, 2);
      const metaRaw = `${formatRp(project.price)}  •  Komisi ${formatRp(commRp)}/pcs  •  ${v ? v.title : 'Skrip Utama'}`;
      const metaLines = layoutWrappedLines(metaRaw, 952, metaFont, 2);

      const titleStartY = 148;
      const afterTitleY = titleStartY + titleLines.length * 50;
      const metaStartY = afterTitleY + 8;
      const afterMetaY = metaStartY + metaLines.length * 32;
      const headerH = Math.max(320, afterMetaY + 18);

      // Deep Teal Brand Header Band (#088177)
      ctx.fillStyle = '#088177';
      ctx.fillRect(0, 0, 1080, headerH);

      // Dynamic width badge inside header
      const topBadgeLabel = 'CONTEKAN SYUTING 9:16  •  KOMISIKLIP';
      ctx.font = '700 21px "DM Sans", sans-serif';
      const topBadgeW = Math.min(952, Math.max(420, Math.ceil(ctx.measureText(topBadgeLabel).width + 44)));
      roundRect(64, 48, topBadgeW, 44, 6, '#d8edeb', null);
      ctx.font = '700 21px "DM Sans", sans-serif';
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText(topBadgeLabel, 86, 77);

      // Product Title in Header
      ctx.font = titleFont;
      ctx.fillStyle = '#ffffff';
      titleLines.forEach((ln, i) => {
        ctx.fillText(ln, 64, titleStartY + i * 50);
      });

      // Wrapped Meta in Header
      ctx.font = metaFont;
      ctx.fillStyle = '#d8edeb';
      metaLines.forEach((ln, i) => {
        ctx.fillText(ln, 64, metaStartY + i * 32);
      });

      // Timecoded Script Cards
      let curY = headerH + 34;
      const blocks = v ? v.blocks : [];
      blocks.forEach((b, idx) => {
        const cardH = 266;
        roundRect(64, curY, 952, cardH, 24, '#ffffff', '#e9e9e9');

        // Dynamic-width stage badge so stage label NEVER spills outside pill
        const badgeBg = idx === 0 ? '#088177' : '#d8edeb';
        const badgeFg = idx === 0 ? '#ffffff' : '#1b1b1b';
        const badgeFont = '700 20px "DM Sans", sans-serif';
        const rawBadgeLabel = `${b.time}  •  ${String(b.stage || '').toUpperCase()}`;
        const badgeLabel = fitSingleLine(rawBadgeLabel, 844, badgeFont);
        ctx.font = badgeFont;
        const badgeW = Math.min(888, Math.max(310, Math.ceil(ctx.measureText(badgeLabel).width + 44)));

        roundRect(96, curY + 24, badgeW, 42, 6, badgeBg, null);
        ctx.font = badgeFont;
        ctx.fillStyle = badgeFg;
        ctx.fillText(badgeLabel, 118, curY + 52);

        // Spoken Script (max 3 lines)
        const nextY = drawWrapped(
          `"${b.spoken || ''}"`,
          96,
          curY + 102,
          888,
          35,
          '700 27px "DM Sans", sans-serif',
          '#1b1b1b',
          3
        );

        // Visual direction footer line (wrapped up to 2 lines within card)
        drawWrapped(
          `Kamera: ${b.visual || '-'}`,
          96,
          Math.max(nextY + 6, curY + 210),
          888,
          25,
          '500 20px "DM Sans", sans-serif',
          '#088177',
          2
        );

        curY += cardH + 20;
      });

      // Bottom Summary Box (On-Screen Text & Pinned Comment)
      const remH = Math.max(210, 1838 - curY);
      roundRect(64, curY, 952, remH, 24, '#d8edeb', '#088177');
      ctx.font = '700 22px "DM Sans", sans-serif';
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText('TEKS LAYAR & KOMENTAR SEMATAN:', 96, curY + 44);

      const afterOst = drawWrapped(
        `Teks Layar: ${v && v.onScreenText ? v.onScreenText : '-'}`,
        96,
        curY + 84,
        888,
        32,
        '500 23px "DM Sans", sans-serif',
        '#1b1b1b',
        2
      );
      drawWrapped(
        `Pinned: ${project.pinnedComment || '-'}`,
        96,
        afterOst + 10,
        888,
        30,
        '400 21px "DM Sans", sans-serif',
        '#1b1b1b',
        2
      );

      // Footer credit clamped within card width
      const footerFont = '500 20px "DM Sans", sans-serif';
      const footerLine = fitSingleLine(
        `Disusun di KomisiKlip Studio  •  ${creator.handle || '@kreator.affiliate'}`,
        952,
        footerFont
      );
      ctx.font = footerFont;
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText(footerLine, 64, 1884);

      canvas.toBlob((blob) => {
        const filename = `Contekan-9x16-${slugify(project.productName)}.png`;
        triggerDownload(blob, filename);
        resolve({ blob, filename });
      }, 'image/png');
    });
  }

  // 3. Ekspor Jadwal Kalender Konten 30 Hari (.PDF)
  function exportCalendarPdf(project, creator) {
    const pages = [];
    let cmds = [];
    let y = 790;

    function startNewPage(isFirst) {
      if (cmds.length) pages.push(cmds);
      cmds = [];
      if (isFirst) {
        const meta1 = wrapLines(
          'Produk: ' + (project.productName || '-') + '  |  Ritme: ' + (project.postsPerDay || 2) + ' Video/Hari',
          90
        );
        const meta2 = wrapLines(
          'Kreator: ' + (creator.name || 'Kreator Affiliate') + '  |  Platform: ' + (project.platform || '-'),
          92
        );
        const totalMeta = meta1.length + meta2.length;
        const bandH = Math.max(82, 54 + totalMeta * 14);
        const bandBottom = 842 - bandH;

        cmds.push(`0.031 0.506 0.467 rg 0 ${bandBottom} 595 ${bandH} re f`);
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 16 Tf 44 808 Td (${sanitizePdfText('JADWAL KALENDER KONTEN AFFILIATE 30 HARI')}) Tj ET`);
        let hy = 788;
        meta1.forEach((ln) => {
          cmds.push(`BT /F1 10 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 14;
        });
        meta2.forEach((ln) => {
          cmds.push(`BT /F1 9.5 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 13.5;
        });
        y = bandBottom - 26;
      } else {
        const contLines = wrapLines(
          'Kalender 30 Hari KomisiKlip Studio - ' + (project.productName || ''),
          84
        );
        const bandH = Math.max(38, 22 + contLines.length * 13);
        const bandBottom = 842 - bandH;
        cmds.push(`0.031 0.506 0.467 rg 0 ${bandBottom} 595 ${bandH} re f`);
        cmds.push('1 1 1 rg');
        let hy = 820;
        contLines.forEach((ln) => {
          cmds.push(`BT /F2 10.5 Tf 44 ${hy} Td (${sanitizePdfText(ln)}) Tj ET`);
          hy -= 13;
        });
        y = bandBottom - 24;
      }
      cmds.push('0.106 0.106 0.106 rg');
    }

    startNewPage(true);

    const schedule = project.schedule30 || [];
    schedule.forEach((item) => {
      const dayTitleLines = wrapLines(
        `HARI ${String(item.day).padStart(2, '0')}  |  ${item.postTime}  |  ${item.pillar}`,
        84
      );
      const hookLines = wrapLines('Hook: ' + (item.hookIdea || ''), 86);
      const visualLines = wrapLines('Visual: ' + (item.visualCue || ''), 90);
      const need = dayTitleLines.length * 13 + hookLines.length * 12 + visualLines.length * 11.5 + 14;

      if (y - need < 50) startNewPage(false);

      cmds.push('0.031 0.506 0.467 rg');
      dayTitleLines.forEach((ln) => {
        cmds.push(`BT /F2 9.8 Tf 44 ${y} Td (${sanitizePdfText(ln)}) Tj ET`);
        y -= 13;
      });

      cmds.push('0.106 0.106 0.106 rg');
      hookLines.forEach((ln) => {
        cmds.push(`BT /F1 9.3 Tf 52 ${y} Td (${sanitizePdfText(ln)}) Tj ET`);
        y -= 12;
      });

      cmds.push('0.29 0.29 0.29 rg');
      visualLines.forEach((ln) => {
        cmds.push(`BT /F1 8.8 Tf 52 ${y} Td (${sanitizePdfText(ln)}) Tj ET`);
        y -= 11.5;
      });

      cmds.push(`0.914 0.914 0.914 rg 44 ${y + 4} 507 0.8 re f`);
      cmds.push('0.106 0.106 0.106 rg');
      y -= 8;
    });

    if (cmds.length) pages.push(cmds);
    const blob = buildMultiPagePdf(pages);
    const filename = `Kalender-30-Hari-${slugify(project.productName)}.pdf`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  // 4. Ekspor Tabel Jadwal 30 Hari & Pelacak Komisi Excel / Google Sheets (.CSV UTF-8 BOM)
  function exportScheduleCsv(project, creator) {
    const commRp = Math.round((Number(project.price) || 0) * ((Number(project.commissionPct) || 0) / 100));
    const headers = [
      'Hari Ke',
      'Jam Upload Ideal',
      'Nama Produk',
      'Platform',
      'Pilar Sudut Konten',
      'Ide Hook 3 Detik Pertama',
      'Arahan Ambil Gambar',
      'Kalimat Klik Keranjang',
      'Status Produksi',
      'Jumlah Tayangan',
      'Klik Keranjang',
      'Terjual (Pcs)',
      'Komisi per Pcs (Rp)',
      'Estimasi Komisi Masuk (Rp)'
    ];

    function escCsv(val) {
      const s = String(val == null ? '' : val).replace(/"/g, '""');
      return `"${s}"`;
    }

    const rows = [headers.map(escCsv).join(',')];
    (project.schedule30 || []).forEach((item) => {
      rows.push(
        [
          `Hari ${item.day}`,
          item.postTime,
          project.productName,
          project.platform,
          item.pillar,
          item.hookIdea,
          item.visualCue,
          item.ctaLine,
          'Belum Rekam',
          '0',
          '0',
          '0',
          String(commRp),
          '0'
        ]
          .map(escCsv)
          .join(',')
      );
    });

    const csvString = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const filename = `Jadwal-Pelacak-Komisi-${slugify(project.productName)}.csv`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  window.KomisiKlipExporter = {
    exportScriptSheetPdf,
    exportCueCardPng,
    exportCalendarPdf,
    exportScheduleCsv
  };
})();

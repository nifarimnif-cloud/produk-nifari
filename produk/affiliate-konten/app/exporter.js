// Mesin Ekspor 4 Dokumen Asli KomisiKlip Studio (100% Client-Side: PDF Multi-Halaman, PNG 9:16 & CSV Excel)
(function () {
  function sanitizePdfText(str) {
    return String(str || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function wrapLines(text, maxChars) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let current = '';
    for (const w of words) {
      if (!w) continue;
      if ((current + ' ' + w).trim().length <= maxChars) {
        current = (current + ' ' + w).trim();
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  function formatRp(num) {
    const n = Math.round(Number(num) || 0);
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function buildMultiPagePdf(pagesCommands) {
    // Object layout:
    // 1: Catalog
    // 2: Pages
    // 3: Font F1 (Helvetica)
    // 4: Font F2 (Helvetica-Bold)
    // For each page i (0..N-1):
    //   pageObjId = 5 + i * 2
    //   contentObjId = 6 + i * 2
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
    return String(str || 'produk-affiliate')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 42) || 'produk-affiliate';
  }

  // 1. Ekspor Lembar Syuting 3 Variasi Skrip & Shot List (.PDF)
  function exportScriptSheetPdf(project, creator) {
    const pages = [];
    let cmds = [];
    let y = 790;

    function startNewPage(isFirst) {
      if (cmds.length) pages.push(cmds);
      cmds = [];
      // Warm editorial top band (#088177 Deep Teal: R=8/255=0.031, G=129/255=0.506, B=119/255=0.467)
      if (isFirst) {
        cmds.push('0.031 0.506 0.467 rg 0 756 595 86 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 17 Tf 44 806 Td (${sanitizePdfText('LEMBAR SYUTING & SKRIP VIDEO AFFILIATE')}) Tj ET`);
        cmds.push(`BT /F1 10 Tf 44 786 Td (${sanitizePdfText('KomisiKlip Studio  |  Kreator: ' + (creator.name || 'Kreator Affiliate') + ' (' + (creator.handle || '@kreator') + ')')}) Tj ET`);
        cmds.push(`BT /F1 9.5 Tf 44 770 Td (${sanitizePdfText('Platform: ' + project.platform + '  |  Gaya: ' + project.visualStyle)}) Tj ET`);
        y = 730;
      } else {
        cmds.push('0.031 0.506 0.467 rg 0 804 595 38 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 10.5 Tf 44 818 Td (${sanitizePdfText('KomisiKlip Studio — Lanjutan Lembar Syuting: ' + project.productName)}) Tj ET`);
        y = 780;
      }
      cmds.push('0.106 0.106 0.106 rg');
    }

    function ensureSpace(need) {
      if (y - need < 52) {
        startNewPage(false);
      }
    }

    function addHeading(title) {
      ensureSpace(32);
      cmds.push('0.847 0.929 0.922 rg 44 ' + (y - 6) + ' 507 20 re f');
      cmds.push('0.031 0.506 0.467 rg');
      cmds.push(`BT /F2 10.5 Tf 52 ${y} Td (${sanitizePdfText(title)}) Tj ET`);
      cmds.push('0.106 0.106 0.106 rg');
      y -= 24;
    }

    function addParagraph(label, text, indent = 44) {
      const full = label ? `${label}: ${text}` : text;
      const maxChars = Math.floor((545 - indent) / 5.1);
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
    addParagraph('Harga & Komisi', `${formatRp(project.price)}  |  Komisi ${project.commissionPct}% (${formatRp(commRp)} per barang terjual)`);
    addParagraph('Target Pembeli', project.audience);
    addParagraph('Masalah Utama', project.painPoint);

    (project.variations || []).forEach((v, idx) => {
      addHeading(`VARIASI ${idx + 1}: ${v.title.toUpperCase()} (${v.duration})`);
      v.blocks.forEach((b) => {
        addParagraph(`[${b.time}] ${b.stage}`, b.spoken, 48);
        addParagraph('   Arahan Kamera', b.visual, 54);
      });
      addParagraph('Teks di Layar', v.onScreenText, 48);
      y -= 4;
    });

    addHeading('PAKET CAPTION, TAGAR & KOMENTAR SEMATAN');
    addParagraph('Caption Video', project.caption || '');
    addParagraph('Tagar Pencarian', project.hashtags || '');
    addParagraph('Komentar Sematan (Pinned)', project.pinnedComment || '');

    if (cmds.length) pages.push(cmds);
    const blob = buildMultiPagePdf(pages);
    const filename = `Skrip-Syuting-${slugify(project.productName)}.pdf`;
    triggerDownload(blob, filename);
    return { blob, filename };
  }

  // 2. Ekspor Kartu Contekan Syuting 9:16 untuk Galeri HP (.PNG 1080x1920)
  function exportCueCardPng(project, creator, activeVarIndex = 0) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      const v = (project.variations && project.variations[activeVarIndex]) || (project.variations && project.variations[0]);
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

      function drawWrapped(text, x, y, maxWidth, lineHeight, font, color, maxLines = 4) {
        ctx.font = font;
        ctx.fillStyle = color;
        const words = String(text || '').split(/\s+/);
        let line = '';
        let count = 0;
        let curY = y;
        for (let i = 0; i < words.length; i++) {
          const test = line ? line + ' ' + words[i] : words[i];
          if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, curY);
            curY += lineHeight;
            count++;
            line = words[i];
            if (count >= maxLines - 1) {
              const rest = words.slice(i).join(' ');
              let trimmed = rest;
              while (ctx.measureText(trimmed + '...').width > maxWidth && trimmed.length > 0) {
                trimmed = trimmed.slice(0, -1);
              }
              ctx.fillText(trimmed + (trimmed.length < rest.length ? '...' : ''), x, curY);
              return curY + lineHeight;
            }
          } else {
            line = test;
          }
        }
        if (line) {
          ctx.fillText(line, x, curY);
          curY += lineHeight;
        }
        return curY;
      }

      // Base Canvas Warmth (#faf8f5)
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, 1080, 1920);

      // Deep Teal Brand Header Band (#088177)
      ctx.fillStyle = '#088177';
      ctx.fillRect(0, 0, 1080, 320);

      // Badge inside header
      roundRect(64, 54, 420, 44, 6, '#d8edeb', null);
      ctx.font = '700 21px "DM Sans", sans-serif';
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText('CONTEKAN SYUTING 9:16  •  KOMISIKLIP', 84, 83);

      // Product Title in Header
      drawWrapped(project.productName, 64, 152, 952, 54, '700 44px "DM Sans", sans-serif', '#ffffff', 2);

      ctx.font = '500 24px "DM Sans", sans-serif';
      ctx.fillStyle = '#d8edeb';
      ctx.fillText(
        `${formatRp(project.price)}  •  Komisi ${formatRp(commRp)}/pcs  •  ${v ? v.title : 'Skrip Utama'}`,
        64,
        282
      );

      // Timecoded Script Cards
      let curY = 364;
      const blocks = v ? v.blocks : [];
      blocks.forEach((b, idx) => {
        const cardH = 268;
        roundRect(64, curY, 952, cardH, 24, '#ffffff', '#e9e9e9');

        // Time badge
        const badgeBg = idx === 0 ? '#088177' : '#d8edeb';
        const badgeFg = idx === 0 ? '#ffffff' : '#1b1b1b';
        roundRect(96, curY + 28, 310, 42, 6, badgeBg, null);
        ctx.font = '700 20px "DM Sans", sans-serif';
        ctx.fillStyle = badgeFg;
        ctx.fillText(`${b.time}  •  ${b.stage.toUpperCase()}`, 114, curY + 56);

        // Spoken Script
        const nextY = drawWrapped(`"${b.spoken}"`, 96, curY + 108, 888, 38, '700 28px "DM Sans", sans-serif', '#1b1b1b', 3);

        // Visual direction footer line
        ctx.fillStyle = '#088177';
        ctx.font = '500 21px "DM Sans", sans-serif';
        drawWrapped(`Kamera: ${b.visual}`, 96, Math.max(nextY + 12, curY + 224), 888, 28, '500 21px "DM Sans", sans-serif', '#088177', 1);

        curY += cardH + 24;
      });

      // Bottom Summary Box (On-Screen Text & Pinned Comment)
      const remH = Math.max(240, 1840 - curY);
      roundRect(64, curY, 952, remH, 24, '#d8edeb', '#088177');
      ctx.font = '700 23px "DM Sans", sans-serif';
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText('TEKS LAYAR & KOMENTAR SEMATAN:', 96, curY + 48);

      const afterOst = drawWrapped(
        `Teks Layar: ${v ? v.onScreenText : ''}`,
        96,
        curY + 90,
        888,
        34,
        '500 24px "DM Sans", sans-serif',
        '#1b1b1b',
        2
      );
      drawWrapped(
        `Pinned: ${project.pinnedComment || ''}`,
        96,
        afterOst + 14,
        888,
        32,
        '400 22px "DM Sans", sans-serif',
        '#1b1b1b',
        2
      );

      // Footer credit
      ctx.font = '500 20px "DM Sans", sans-serif';
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText(
        `Disusun di KomisiKlip Studio  •  ${creator.handle || '@kreator.affiliate'}`,
        64,
        1884
      );

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
        cmds.push('0.031 0.506 0.467 rg 0 760 595 82 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 16 Tf 44 806 Td (${sanitizePdfText('JADWAL KALENDER KONTEN AFFILIATE 30 HARI')}) Tj ET`);
        cmds.push(`BT /F1 10 Tf 44 786 Td (${sanitizePdfText('Produk: ' + project.productName + '  |  Ritme: ' + (project.postsPerDay || 2) + ' Video/Hari')}) Tj ET`);
        cmds.push(`BT /F1 9.5 Tf 44 770 Td (${sanitizePdfText('Kreator: ' + (creator.name || 'Kreator Affiliate') + '  |  Platform: ' + project.platform)}) Tj ET`);
        y = 734;
      } else {
        cmds.push('0.031 0.506 0.467 rg 0 804 595 38 re f');
        cmds.push('1 1 1 rg');
        cmds.push(`BT /F2 10.5 Tf 44 818 Td (${sanitizePdfText('Kalender 30 Hari KomisiKlip Studio — ' + project.productName)}) Tj ET`);
        y = 780;
      }
      cmds.push('0.106 0.106 0.106 rg');
    }

    startNewPage(true);

    const schedule = project.schedule30 || [];
    schedule.forEach((item) => {
      const hookLines = wrapLines(item.hookIdea, 76);
      const need = 28 + hookLines.length * 12;
      if (y - need < 50) startNewPage(false);

      cmds.push('0.914 0.914 0.914 rg 44 ' + (y - need + 8) + ' 507 0.8 re f');
      cmds.push('0.031 0.506 0.467 rg');
      cmds.push(
        `BT /F2 9.8 Tf 44 ${y} Td (${sanitizePdfText(`HARI ${String(item.day).padStart(2, '0')}  |  ${item.postTime}  |  ${item.pillar}`)}) Tj ET`
      );
      cmds.push('0.106 0.106 0.106 rg');
      y -= 13;
      hookLines.forEach((ln) => {
        cmds.push(`BT /F1 9.3 Tf 52 ${y} Td (${sanitizePdfText('Hook: ' + ln)}) Tj ET`);
        y -= 12;
      });
      cmds.push(`BT /F1 8.8 Tf 52 ${y} Td (${sanitizePdfText('Visual: ' + item.visualCue)}) Tj ET`);
      y -= 16;
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

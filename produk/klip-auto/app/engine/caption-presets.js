/**
 * Klip Auto — 6 Preset Gaya Caption & Compositor Kanvas 9:16
 * Menggambar frame video 9:16 (crop wajah tengah / latar blur), judul atas,
 * logo/watermark pembeli, dan caption besar per kata yang sinkron dengan suara.
 */

export const CAPTION_PRESETS = [
  {
    id: 'kreator-kuning',
    name: 'Kreator Tebal',
    desc: 'Putih tebal ber-outline hitam pekat, kata aktif menyala kuning cerah.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 900,
    uppercase: true,
    fontSizeRatio: 0.064,
    yPositionRatio: 0.74,
    baseColor: '#FFFFFF',
    activeColor: '#FACC15',
    strokeColor: '#09090B',
    strokeWidthRatio: 0.16,
    shadowColor: 'rgba(0,0,0,0.65)',
    activePillColor: null,
    backdropColor: null,
    popScale: 1.12
  },
  {
    id: 'sorot-kotak',
    name: 'Kotak Sorot',
    desc: 'Kata yang sedang diucapkan diberi kotak latar oranye tegas.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: true,
    fontSizeRatio: 0.058,
    yPositionRatio: 0.74,
    baseColor: '#FFFFFF',
    activeColor: '#FFFFFF',
    strokeColor: '#0F172A',
    strokeWidthRatio: 0.10,
    shadowColor: 'rgba(0,0,0,0.45)',
    activePillColor: '#EA580C',
    backdropColor: null,
    popScale: 1.06
  },
  {
    id: 'podcast-bersih',
    name: 'Podcast Bersih',
    desc: 'Tampilan hangat dengan gradasi bawah halus & sorotan hijau toska.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: false,
    fontSizeRatio: 0.056,
    yPositionRatio: 0.76,
    baseColor: '#F8FAFC',
    activeColor: '#2DD4BF',
    strokeColor: '#020617',
    strokeWidthRatio: 0.11,
    shadowColor: 'rgba(0,0,0,0.75)',
    activePillColor: null,
    backdropColor: 'gradient-bottom',
    popScale: 1.08
  },
  {
    id: 'neon-siber',
    name: 'Neon Gelap',
    desc: 'Kotak latar gelap transparan dengan efek cahaya hijau neon.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: true,
    fontSizeRatio: 0.056,
    yPositionRatio: 0.74,
    baseColor: '#E2E8F0',
    activeColor: '#4ADE80',
    strokeColor: '#020617',
    strokeWidthRatio: 0.08,
    shadowColor: 'rgba(74,222,128,0.55)',
    activePillColor: null,
    backdropColor: 'rgba(9, 13, 22, 0.78)',
    popScale: 1.10
  },
  {
    id: 'berita-tegas',
    name: 'Tegas Berita',
    desc: 'Pita gelap rapi di bawah tengah dengan aksen merah & kata emas.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: false,
    fontSizeRatio: 0.052,
    yPositionRatio: 0.77,
    baseColor: '#FFFFFF',
    activeColor: '#FBBF24',
    strokeColor: 'transparent',
    strokeWidthRatio: 0,
    shadowColor: 'rgba(0,0,0,0.3)',
    activePillColor: '#DC2626',
    backdropColor: 'rgba(15, 23, 42, 0.90)',
    accentBarColor: '#DC2626',
    popScale: 1.04
  },
  {
    id: 'minimalis-elegan',
    name: 'Minimalis Elegan',
    desc: 'Huruf bersih dan tenang, cocok untuk edukasi, bisnis, atau kajian.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 700,
    uppercase: false,
    fontSizeRatio: 0.052,
    yPositionRatio: 0.76,
    baseColor: '#F1F5F9',
    activeColor: '#38BDF8',
    strokeColor: 'rgba(15,23,42,0.85)',
    strokeWidthRatio: 0.09,
    shadowColor: 'rgba(0,0,0,0.5)',
    activePillColor: null,
    backdropColor: 'rgba(15, 23, 42, 0.58)',
    popScale: 1.05
  }
];

export function getPresetById(id) {
  return CAPTION_PRESETS.find((p) => p.id === id) || CAPTION_PRESETS[0];
}

/**
 * Mengelompokkan daftar kata [{ word, start, end }] menjadi grup pendek (maks 4 kata
 * atau jeda > 0.65 detik) agar mudah dibaca cepat di layar vertikal 9:16.
 */
export function groupWordsIntoPhrases(words, maxWordsPerGroup = 4) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const groups = [];
  let current = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w || !String(w.word || '').trim()) continue;
    current.push(w);

    const next = words[i + 1];
    const endsSentence = /[.!?]$/.test(w.word);
    const longPause = next && (next.start - w.end > 0.6);
    const charLen = current.reduce((acc, item) => acc + String(item.word).length, 0);

    if (current.length >= maxWordsPerGroup || charLen >= 24 || endsSentence || longPause || !next) {
      groups.push({
        start: current[0].start,
        end: current[current.length - 1].end,
        words: current
      });
      current = [];
    }
  }
  return groups;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapTextLines(ctx, text, maxWidth) {
  const rawWords = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!rawWords.length) return [];
  const lines = [];
  let currentLine = rawWords[0];

  for (let i = 1; i < rawWords.length; i++) {
    const candidate = currentLine + ' ' + rawWords[i];
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = rawWords[i];
    }
  }
  lines.push(currentLine);
  return lines.slice(0, 3);
}

/**
 * Menggambar 1 frame utuh klip 9:16 ke canvas tujuan.
 *
 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas | VideoFrame} opts.source
 * @param {number} opts.sourceWidth
 * @param {number} opts.sourceHeight
 * @param {number} opts.targetWidth - misal 720 atau 1080
 * @param {number} opts.targetHeight - misal 1280 atau 1920
 * @param {number} opts.currentTimeSec - waktu absolut video (detik)
 * @param {number} [opts.centerX=0.5] - titik fokus horizontal wajah (0..1)
 * @param {'crop-fill' | 'blur-fit'} [opts.frameMode='crop-fill']
 * @param {string} [opts.presetId='kreator-kuning']
 * @param {Array} [opts.phraseGroups=[]] - hasil groupWordsIntoPhrases()
 * @param {string} [opts.hookTitle=''] - judul atas klip
 * @param {'white' | 'dark' | 'red' | 'none'} [opts.hookStyle='white']
 * @param {HTMLImageElement | ImageBitmap | null} [opts.watermarkImage=null]
 * @param {'top-right' | 'top-left' | 'bottom-right'} [opts.watermarkPos='top-right']
 * @param {number} [opts.watermarkOpacity=0.85]
 * @param {string} [opts.watermarkText='']
 */
export function drawClipFrame(ctx, opts) {
  const {
    source,
    sourceWidth,
    sourceHeight,
    targetWidth: W,
    targetHeight: H,
    currentTimeSec,
    centerX = 0.5,
    frameMode = 'crop-fill',
    presetId = 'kreator-kuning',
    phraseGroups = [],
    hookTitle = '',
    hookStyle = 'white',
    watermarkImage = null,
    watermarkPos = 'top-right',
    watermarkOpacity = 0.85,
    watermarkText = ''
  } = opts;

  ctx.save();
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, W, H);

  // 1. Gambar Video 9:16 (Crop mengikuti wajah tengah ATAU Latar Blur)
  if (source && sourceWidth > 0 && sourceHeight > 0) {
    const targetAspect = W / H; // 0.5625
    const sourceAspect = sourceWidth / sourceHeight;

    if (frameMode === 'blur-fit' && sourceAspect > targetAspect) {
      // Latar belakang isi penuh gelap + redup, depan utuh 16:9 di tengah
      const bgH = H;
      const bgW = bgH * sourceAspect;
      const bgX = -((bgW - W) * Math.max(0, Math.min(1, centerX)));
      ctx.save();
      ctx.filter = 'blur(22px) brightness(0.42)';
      ctx.drawImage(source, bgX - 24, -24, bgW + 48, bgH + 48);
      ctx.restore();

      const fgW = W;
      const fgH = W / sourceAspect;
      const fgY = Math.round((H - fgH) * 0.44);
      ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, fgY, fgW, fgH);
    } else if (sourceAspect > targetAspect) {
      // Video lanskap (16:9) dipotong ke vertikal (9:16) mengikuti centerX wajah
      const cropH = sourceHeight;
      const cropW = sourceHeight * targetAspect;
      const desiredCenterPx = Math.max(0, Math.min(1, centerX)) * sourceWidth;
      const minX = 0;
      const maxX = Math.max(0, sourceWidth - cropW);
      const sx = Math.max(minX, Math.min(maxX, desiredCenterPx - cropW / 2));
      ctx.drawImage(source, sx, 0, cropW, cropH, 0, 0, W, H);
    } else {
      // Video sudah vertikal / kotak
      const cropW = sourceWidth;
      const cropH = sourceWidth / targetAspect;
      const sy = Math.max(0, (sourceHeight - cropH) / 2);
      ctx.drawImage(source, 0, sy, cropW, cropH, 0, 0, W, H);
    }
  }

  const preset = getPresetById(presetId);

  // Gradasi bawah lembut bila preset memintanya
  if (preset.backdropColor === 'gradient-bottom') {
    const grad = ctx.createLinearGradient(0, H * 0.58, 0, H);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);
  }

  // 2. Gambar Judul Atas (Hook Banner)
  const cleanTitle = String(hookTitle || '').trim();
  if (cleanTitle && hookStyle !== 'none') {
    const titleFontSize = Math.round(W * 0.044);
    ctx.font = `800 ${titleFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const maxBoxW = W * 0.84;
    const lines = wrapTextLines(ctx, cleanTitle, maxBoxW - W * 0.08);

    if (lines.length > 0) {
      const lineHeight = Math.round(titleFontSize * 1.28);
      let widest = 0;
      for (const l of lines) {
        widest = Math.max(widest, ctx.measureText(l).width);
      }
      const padX = Math.round(W * 0.045);
      const padY = Math.round(W * 0.026);
      const boxW = Math.min(W * 0.9, widest + padX * 2);
      const boxH = lines.length * lineHeight + padY * 2;
      const boxX = (W - boxW) / 2;
      const boxY = Math.round(H * 0.085);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.38)';
      ctx.shadowBlur = Math.round(W * 0.025);
      ctx.shadowOffsetY = Math.round(W * 0.008);

      let bg = '#FFFFFF';
      let fg = '#0F172A';
      if (hookStyle === 'dark') {
        bg = 'rgba(15, 23, 42, 0.92)';
        fg = '#F8FAFC';
      } else if (hookStyle === 'red') {
        bg = '#DC2626';
        fg = '#FFFFFF';
      }

      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, Math.round(W * 0.024));
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < lines.length; i++) {
        const ly = boxY + padY + lineHeight * (i + 0.5);
        ctx.fillText(lines[i], W / 2, ly);
      }
    }
  }

  // 3. Gambar Watermark / Logo Pembeli
  if (watermarkImage || (watermarkText && watermarkText.trim())) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, Math.min(1, watermarkOpacity));
    const margin = Math.round(W * 0.045);

    if (watermarkImage) {
      const imgW = watermarkImage.width || 120;
      const imgH = watermarkImage.height || 120;
      const targetLogoW = Math.round(W * 0.16);
      const targetLogoH = Math.round(targetLogoW * (imgH / imgW));
      let wx = W - targetLogoW - margin;
      let wy = margin;
      if (watermarkPos === 'top-left') {
        wx = margin;
        wy = margin;
      } else if (watermarkPos === 'bottom-right') {
        wx = W - targetLogoW - margin;
        wy = Math.round(H * 0.88) - targetLogoH;
      }
      ctx.drawImage(watermarkImage, wx, wy, targetLogoW, targetLogoH);
    } else {
      const wmFont = Math.round(W * 0.03);
      ctx.font = `700 ${wmFont}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const label = watermarkText.trim();
      const tw = ctx.measureText(label).width;
      const px = Math.round(W * 0.024);
      const py = Math.round(W * 0.012);
      const bw = tw + px * 2;
      const bh = wmFont + py * 2;
      let wx = W - bw - margin;
      let wy = margin;
      if (watermarkPos === 'top-left') {
        wx = margin;
      } else if (watermarkPos === 'bottom-right') {
        wy = Math.round(H * 0.88) - bh;
      }
      drawRoundedRect(ctx, wx, wy, bw, bh, Math.round(bh / 2));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, wx + bw / 2, wy + bh / 2 + 1);
    }
    ctx.restore();
  }

  // 4. Gambar Caption Besar Per Kata yang Sinkron dengan Suara
  const activeGroup = phraseGroups.find(
    (g) => currentTimeSec >= g.start - 0.06 && currentTimeSec <= g.end + 0.18
  );

  if (activeGroup && activeGroup.words.length > 0) {
    const fontSize = Math.round(W * preset.fontSizeRatio);
    ctx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const maxCaptionWidth = W * 0.84;
    const spaceMultiplier = preset.activePillColor ? 1.62 : 1.18;
    const spaceWidth = ctx.measureText(' ').width * spaceMultiplier;

    // Susun kata dalam grup menjadi 1–2 baris terpusat
    const tokens = activeGroup.words.map((w, idx) => {
      const displayWord = preset.uppercase ? String(w.word).toUpperCase() : String(w.word);
      const isActive =
        currentTimeSec >= w.start - 0.03 &&
        (currentTimeSec <= w.end + 0.05 ||
          (idx === activeGroup.words.length - 1 && currentTimeSec <= activeGroup.end + 0.15));
      return {
        raw: w,
        text: displayWord,
        width: ctx.measureText(displayWord).width,
        isActive
      };
    });

    // Kalau sedang di celah jeda antar kata di dalam satu frasa, sorot kata terakhir yang sudah lewat
    if (!tokens.some((t) => t.isActive)) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (currentTimeSec >= tokens[i].raw.start) {
          tokens[i].isActive = true;
          break;
        }
      }
    }

    const lines = [];
    let curLine = [];
    let curW = 0;
    for (const tok of tokens) {
      const addedW = curLine.length === 0 ? tok.width : curW + spaceWidth + tok.width;
      if (curLine.length > 0 && addedW > maxCaptionWidth) {
        lines.push({ tokens: curLine, width: curW });
        curLine = [tok];
        curW = tok.width;
      } else {
        curLine.push(tok);
        curW = addedW;
      }
    }
    if (curLine.length > 0) {
      lines.push({ tokens: curLine, width: curW });
    }

    const lineHeight = Math.round(fontSize * 1.34);
    const totalTextH = lines.length * lineHeight;
    const centerY = Math.round(H * preset.yPositionRatio);
    const startY = centerY - totalTextH / 2 + lineHeight / 2;

    // Kotak latar belakang grup (untuk preset neon / berita / minimalis)
    if (preset.backdropColor && preset.backdropColor !== 'gradient-bottom') {
      const widestLine = Math.max(...lines.map((l) => l.width));
      const padX = Math.round(W * 0.042);
      const padY = Math.round(W * 0.022);
      const boxW = Math.min(W * 0.92, widestLine + padX * 2);
      const boxH = totalTextH + padY * 2;
      const boxX = (W - boxW) / 2;
      const boxY = centerY - boxH / 2;

      ctx.save();
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, Math.round(W * 0.024));
      ctx.fillStyle = preset.backdropColor;
      ctx.fill();

      if (preset.accentBarColor) {
        drawRoundedRect(ctx, boxX, boxY, Math.round(W * 0.012), boxH, Math.round(W * 0.01));
        ctx.fillStyle = preset.accentBarColor;
        ctx.fill();
      }
      ctx.restore();
    }

    // Gambar tiap kata pada tiap baris
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const y = startY + li * lineHeight;
      let cursorX = (W - line.width) / 2;

      for (let ti = 0; ti < line.tokens.length; ti++) {
        const tok = line.tokens[ti];
        const wordCenterX = cursorX + tok.width / 2;

        ctx.save();
        ctx.translate(wordCenterX, y);
        if (tok.isActive && preset.popScale && preset.popScale !== 1) {
          ctx.scale(preset.popScale, preset.popScale);
        }

        // Kotak sorot pada kata aktif (preset sorot-kotak / berita-tegas)
        if (tok.isActive && preset.activePillColor) {
          const pillPadX = Math.round(fontSize * 0.24);
          const pillPadY = Math.round(fontSize * 0.14);
          drawRoundedRect(
            ctx,
            -tok.width / 2 - pillPadX,
            -fontSize / 2 - pillPadY,
            tok.width + pillPadX * 2,
            fontSize + pillPadY * 2,
            Math.round(fontSize * 0.22)
          );
          ctx.fillStyle = preset.activePillColor;
          ctx.fill();
        }

        ctx.textAlign = 'center';
        ctx.shadowColor = preset.shadowColor || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = tok.isActive ? Math.round(fontSize * 0.28) : Math.round(fontSize * 0.16);
        ctx.shadowOffsetY = Math.round(fontSize * 0.06);

        if (preset.strokeWidthRatio > 0 && preset.strokeColor !== 'transparent') {
          ctx.strokeStyle = preset.strokeColor;
          ctx.lineWidth = Math.max(2, Math.round(fontSize * preset.strokeWidthRatio));
          ctx.strokeText(tok.text, 0, 0);
        }

        ctx.fillStyle = tok.isActive ? preset.activeColor : preset.baseColor;
        ctx.fillText(tok.text, 0, 0);
        ctx.restore();

        cursorX += tok.width + spaceWidth;
      }
    }
  }

  ctx.restore();
}

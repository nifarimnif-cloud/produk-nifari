/**
 * Klip Auto — Preset Gaya Caption Sinkron Vokal & Compositor Kanvas 9:16 Multi-Framing
 * Mendukung:
 * - 4 Mode Framing Inti + 1 Mode Pro: Otomatis (1/2 Wajah), Fullscreen Tengah, Podcast Split (Atas-Bawah tanpa keyframe),
 *   Cinema Blur (16:9 utuh latar blur), dan Gaming Split (Facecam + Gameplay untuk Paket Pro)
 * - Judul Pembuka 3 Detik (default) yang bisa diedit, dengan opsi tampil penuh
 * - 6 Gaya Caption Paket Inti + 2 Gaya Caption Ekstra Paket Tambahan
 * - Sinkronisasi sorotan kata presisi milidetik mengikuti pulau vokal & jeda napas pembicara
 */

export const CAPTION_PRESETS = [
  {
    id: 'kreator-kuning',
    name: 'Kreator Tebal',
    tier: 'inti',
    desc: 'Putih tebal ber-outline hitam pekat, kata aktif menyala kuning cerah.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 900,
    uppercase: true,
    fontSizeRatio: 0.064,
    yPositionRatio: 0.75,
    baseColor: '#FFFFFF',
    activeColor: '#FACC15',
    strokeColor: '#09090B',
    strokeWidthRatio: 0.16,
    shadowColor: 'rgba(0,0,0,0.65)',
    activePillColor: null,
    backdropColor: null,
    popScale: 1.11
  },
  {
    id: 'sorot-kotak',
    name: 'Kotak Sorot',
    tier: 'inti',
    desc: 'Kata yang sedang diucapkan diberi kotak latar oranye tegas.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: true,
    fontSizeRatio: 0.058,
    yPositionRatio: 0.75,
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
    tier: 'inti',
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
    tier: 'inti',
    desc: 'Kotak latar gelap transparan dengan efek cahaya hijau limau.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: true,
    fontSizeRatio: 0.056,
    yPositionRatio: 0.75,
    baseColor: '#E2E8F0',
    activeColor: '#BEFF50',
    strokeColor: '#020617',
    strokeWidthRatio: 0.08,
    shadowColor: 'rgba(190,255,80,0.50)',
    activePillColor: null,
    backdropColor: 'rgba(9, 13, 22, 0.80)',
    popScale: 1.09
  },
  {
    id: 'berita-tegas',
    name: 'Tegas Berita',
    tier: 'inti',
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
    tier: 'inti',
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
  },
  {
    id: 'emas-eksklusif',
    name: 'Emas Eksklusif',
    tier: 'tambahan',
    desc: 'Paket Tambahan: Pita hitam pekat premium dengan sorotan emas tajam.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: true,
    fontSizeRatio: 0.056,
    yPositionRatio: 0.75,
    baseColor: '#FAFAF9',
    activeColor: '#14140F',
    strokeColor: 'transparent',
    strokeWidthRatio: 0,
    shadowColor: 'rgba(0,0,0,0.45)',
    activePillColor: '#FDE047',
    backdropColor: 'rgba(20, 20, 15, 0.86)',
    accentBarColor: '#FDE047',
    popScale: 1.07
  },
  {
    id: 'kapsul-ungu',
    name: 'Kapsul Studio',
    tier: 'tambahan',
    desc: 'Paket Tambahan: Sorotan kapsul nila modern untuk klip opini & cerita.',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    uppercase: false,
    fontSizeRatio: 0.056,
    yPositionRatio: 0.75,
    baseColor: '#FFFFFF',
    activeColor: '#FFFFFF',
    strokeColor: '#09090B',
    strokeWidthRatio: 0.11,
    shadowColor: 'rgba(0,0,0,0.55)',
    activePillColor: '#7C3AED',
    backdropColor: null,
    popScale: 1.08
  }
];

export function getPresetById(id) {
  return CAPTION_PRESETS.find((p) => p.id === id) || CAPTION_PRESETS[0];
}

/**
 * Mengelompokkan daftar kata [{ word, start, end }] menjadi grup pendek (maks 4 kata)
 * dan langsung memutus grup pada jeda napas nyata (>= 0.24 detik) agar teks hilang bersih saat pembicara diam!
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
    const wordStr = String(w.word);
    const endsSentence = /[.!?]$/.test(wordStr);
    const endsClause = /[,;:]$/.test(wordStr);
    const gapToNext = next ? next.start - w.end : 999;
    const breathPause = gapToNext >= 0.24 || (endsClause && gapToNext >= 0.13);
    const charLen = current.reduce((acc, item) => acc + String(item.word).length, 0);

    if (current.length >= maxWordsPerGroup || charLen >= 23 || endsSentence || breathPause || !next) {
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
 * Menggambar potongan sumber (crop) berfokus di titik (normX, normY) ke kotak tujuan (dx, dy, dw, dh) tanpa gepeng.
 */
function drawCenteredCrop(ctx, source, srcW, srcH, normX, normY, dx, dy, dw, dh, zoomFactor = 1.0) {
  const dstAspect = dw / dh;
  const srcAspect = srcW / srcH;

  let cropW;
  let cropH;
  if (srcAspect > dstAspect) {
    cropH = srcH / Math.max(1, zoomFactor);
    cropW = cropH * dstAspect;
  } else {
    cropW = srcW / Math.max(1, zoomFactor);
    cropH = cropW / dstAspect;
  }

  const cx = Math.max(0, Math.min(1, normX)) * srcW;
  const cy = Math.max(0, Math.min(1, normY)) * srcH;
  const sx = Math.max(0, Math.min(srcW - cropW, cx - cropW / 2));
  const sy = Math.max(0, Math.min(srcH - cropH, cy - cropH / 2));

  ctx.drawImage(source, sx, sy, cropW, cropH, dx, dy, dw, dh);
}

/**
 * Menggambar 1 frame utuh klip 9:16 ke canvas tujuan.
 */
export function drawClipFrame(ctx, opts) {
  const {
    source,
    sourceWidth,
    sourceHeight,
    targetWidth: W,
    targetHeight: H,
    currentTimeSec,
    clipStartSec = 0,
    centerX = 0.5,
    frameMode = 'crop-fill',
    cameraMeta = null,
    presetId = 'kreator-kuning',
    phraseGroups = [],
    captionOffsetSec = 0,
    hookTitle = '',
    hookStyle = 'white',
    hookDurationSec = 3.0,
    watermarkImage = null,
    watermarkPos = 'top-right',
    watermarkOpacity = 0.85,
    watermarkText = ''
  } = opts;

  const effectiveMode =
    frameMode === 'auto'
      ? cameraMeta && cameraMeta.detectedFaces >= 2
        ? 'podcast-split'
        : 'crop-fill'
      : frameMode || 'crop-fill';

  ctx.save();
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, W, H);

  // 1. Gambar Video 9:16 Sesuai Mode Framing (Fullscreen / Podcast Split / Cinema Blur / Gaming Split)
  if (source && sourceWidth > 0 && sourceHeight > 0) {
    const targetAspect = W / H;
    const sourceAspect = sourceWidth / sourceHeight;

    if (effectiveMode === 'podcast-split' && sourceAspect > targetAspect) {
      // Podcast Split: 2 orang atas-bawah otomatis tanpa keyframe manual!
      const halfH = Math.floor(H / 2);
      const leftX = cameraMeta?.leftSpeakerX ?? 0.28;
      const leftY = cameraMeta?.leftSpeakerY ?? 0.36;
      const rightX = cameraMeta?.rightSpeakerX ?? 0.72;
      const rightY = cameraMeta?.rightSpeakerY ?? 0.36;

      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, leftX, leftY, 0, 0, W, halfH, 1.06);
      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, rightX, rightY, 0, halfH, W, H - halfH, 1.06);

      // Garis pemisah tipis bersih di tengah antara pembicara atas & bawah
      ctx.fillStyle = '#14140F';
      ctx.fillRect(0, halfH - 2, W, 4);
    } else if (effectiveMode === 'gaming-split' && sourceAspect > targetAspect) {
      // Gaming Split (Pro): Panel atas 35% facecam pembicara, panel bawah 65% layar permainan utama
      const topH = Math.floor(H * 0.35);
      const botH = H - topH;
      const camX = cameraMeta?.facecamBox?.centerX ?? 0.84;
      const camY = cameraMeta?.facecamBox?.centerY ?? 0.76;
      const zoom = cameraMeta?.facecamBox ? 2.25 : 1.55;

      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, camX, camY, 0, 0, W, topH, zoom);
      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, 0.5, 0.5, 0, topH, W, botH, 1.0);

      ctx.fillStyle = '#BEFF50';
      ctx.fillRect(0, topH - 2, W, 3);
    } else if (effectiveMode === 'blur-fit' && sourceAspect > targetAspect) {
      // Cinema Blur: Video 16:9 utuh di tengah dengan latar blur gelap untuk slide/presentasi
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
      // Fullscreen: 1 pembicara, wajah tetap di tengah 9:16
      const cropH = sourceHeight;
      const cropW = sourceHeight * targetAspect;
      const desiredCenterPx = Math.max(0, Math.min(1, centerX)) * sourceWidth;
      const maxX = Math.max(0, sourceWidth - cropW);
      const sx = Math.max(0, Math.min(maxX, desiredCenterPx - cropW / 2));
      ctx.drawImage(source, sx, 0, cropW, cropH, 0, 0, W, H);
    } else {
      const cropW = sourceWidth;
      const cropH = sourceWidth / targetAspect;
      const sy = Math.max(0, (sourceHeight - cropH) / 2);
      ctx.drawImage(source, 0, sy, cropW, cropH, 0, 0, W, H);
    }
  }

  const preset = getPresetById(presetId);

  if (preset.backdropColor === 'gradient-bottom' && effectiveMode !== 'podcast-split') {
    const grad = ctx.createLinearGradient(0, H * 0.58, 0, H);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.58, W, H * 0.42);
  }

  // 2. Gambar Judul Pembuka 3 Detik (atau Sepanjang Klip jika hookDurationSec === 0 / 'full')
  const cleanTitle = String(hookTitle || '').trim();
  const relTimeInClip = Math.max(0, currentTimeSec - (Number(clipStartSec) || 0));
  const numericHookDur =
    hookDurationSec === 'full' || hookDurationSec === 0 ? Infinity : Number(hookDurationSec) || 3.0;
  const showHook = cleanTitle && hookStyle !== 'none' && relTimeInClip <= numericHookDur;

  if (showHook) {
    let hookAlpha = 1.0;
    if (Number.isFinite(numericHookDur) && numericHookDur - relTimeInClip < 0.25) {
      hookAlpha = Math.max(0, (numericHookDur - relTimeInClip) / 0.25);
    }

    const titleFontSize = Math.round(W * 0.043);
    ctx.save();
    ctx.globalAlpha = hookAlpha;
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
      const padY = Math.round(W * 0.025);
      const boxW = Math.min(W * 0.9, widest + padX * 2);
      const boxH = lines.length * lineHeight + padY * 2;
      const boxX = (W - boxW) / 2;
      const boxY = effectiveMode === 'podcast-split' ? Math.round(H * 0.055) : Math.round(H * 0.085);

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
    ctx.restore();
  }

  // 3. Gambar Watermark Nama Sendiri / Logo Pembeli
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
        wy = Math.round(H * 0.90) - targetLogoH;
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
        wy = Math.round(H * 0.90) - bh;
      }
      drawRoundedRect(ctx, wx, wy, bw, bh, Math.round(bh / 2));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, wx + bw / 2, wy + bh / 2 + 1);
    }
    ctx.restore();
  }

  // 4. Gambar Caption Per Kata yang Terkunci Presisi ke Getaran Vokal
  const syncedTimeSec = currentTimeSec - (Number(captionOffsetSec) || 0);
  const activeGroup = phraseGroups.find(
    (g) => syncedTimeSec >= g.start - 0.018 && syncedTimeSec <= g.end + 0.065
  );

  if (activeGroup && activeGroup.words.length > 0) {
    const fontSize = Math.round(W * preset.fontSizeRatio);
    ctx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const maxCaptionWidth = W * 0.86;
    const baseSpace = Math.max(ctx.measureText(' ').width, fontSize * 0.28);
    const spaceWidth = Math.round(baseSpace * (preset.activePillColor ? 1.78 : 1.46));

    // Tentukan kata mana yang tepat sedang diucapkan pada milidetik ini:
    // - Bila celah antar kata <= 120ms (sambungan konsonan), jembatani mulus di titik tengah celah
    // - Bila celah > 120ms (jeda ekspresif), matikan sorotan tepat saat suara berhenti!
    const gWords = activeGroup.words;
    let activeWordIdx = -1;
    for (let i = 0; i < gWords.length; i++) {
      const w = gWords[i];
      const prev = i > 0 ? gWords[i - 1] : null;
      const next = i + 1 < gWords.length ? gWords[i + 1] : null;

      const gapBefore = prev ? w.start - prev.end : 1;
      const gapAfter = next ? next.start - w.end : 1;

      const effStart = gapBefore <= 0.12 && prev ? (prev.end + w.start) * 0.5 : w.start - 0.015;
      const effEnd = gapAfter <= 0.12 && next ? (w.end + next.start) * 0.5 : w.end + 0.045;

      if (syncedTimeSec >= effStart && syncedTimeSec <= effEnd) {
        activeWordIdx = i;
        break;
      }
    }

    const tokens = gWords.map((w, idx) => {
      const displayWord = preset.uppercase ? String(w.word).toUpperCase() : String(w.word);
      return {
        raw: w,
        text: displayWord,
        width: ctx.measureText(displayWord).width,
        isActive: idx === activeWordIdx
      };
    });

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
    // Pada Podcast Split 2 pembicara atas-bawah, tempatkan caption tepat di garis sabuk tengah (0.50 H)
    // agar wajah pembicara atas maupun bawah 100% utuh tidak tertutup!
    const yRatio = effectiveMode === 'podcast-split' ? 0.50 : preset.yPositionRatio;
    const centerY = Math.round(H * yRatio);
    const startY = centerY - totalTextH / 2 + lineHeight / 2;

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

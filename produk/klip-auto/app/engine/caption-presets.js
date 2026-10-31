/**
 * Klip Auto — Preset Gaya Caption, Pemilih 9 Font Subtitle Kustom, & Compositor Kanvas 9:16 (v2.2)
 * Mendukung:
 * - 9 Pilihan Font Subtitle Kreator (Plus Jakarta Sans, Montserrat, Anton, Bebas Neue, Poppins,
 *   Rubik, Space Grotesk, Fredoka, Merriweather) + pengatur ukuran & kapitalisasi huruf
 * - Preloader `ensureCaptionFontLoaded()` agar render MP4 selalu memakai font asli sejak frame pertama
 * - Penampilan Subtitle Anti-Miss (Zero-Blink): menjembatani celah mikro antar-frasa (< 420ms) tanpa kedipan kosong,
 *   namun tetap menyembunyikan teks secara bersih pada jeda napas nyata (>= 420ms)
 * - 4 Mode Framing Inti + 1 Mode Pro: Otomatis (1/2 Wajah), Fullscreen Tengah, Podcast Split, Cinema Blur, Gaming Split
 */

export const CAPTION_FONTS = [
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    styleLabel: 'Modern Tebal (Bawaan)',
    sampleText: 'Kata Tajam',
    googleFamily: 'Plus Jakarta Sans',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fixedWeight: null,
    loadWeight: 800,
    sizeScale: 1.0
  },
  {
    id: 'montserrat',
    name: 'Montserrat Black',
    styleLabel: 'Geometris Klip Viral',
    sampleText: 'KATA TEGAS',
    googleFamily: 'Montserrat',
    fontFamily: '"Montserrat", "Plus Jakarta Sans", system-ui, sans-serif',
    fixedWeight: 900,
    loadWeight: 900,
    sizeScale: 0.98
  },
  {
    id: 'anton',
    name: 'Anton Display',
    styleLabel: 'Headline Sinematik',
    sampleText: 'POIN UTAMA',
    googleFamily: 'Anton',
    fontFamily: '"Anton", Impact, "Arial Black", sans-serif',
    fixedWeight: 400,
    loadWeight: 400,
    sizeScale: 1.06
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    styleLabel: 'Poster Tinggi Ringkas',
    sampleText: 'CEPAT & PADAT',
    googleFamily: 'Bebas Neue',
    fontFamily: '"Bebas Neue", Impact, sans-serif',
    fixedWeight: 400,
    loadWeight: 400,
    sizeScale: 1.15
  },
  {
    id: 'poppins',
    name: 'Poppins ExtraBold',
    styleLabel: 'Bulat Bersih Podcast',
    sampleText: 'Obrolan Jernih',
    googleFamily: 'Poppins',
    fontFamily: '"Poppins", "Plus Jakarta Sans", sans-serif',
    fixedWeight: 800,
    loadWeight: 800,
    sizeScale: 0.98
  },
  {
    id: 'rubik',
    name: 'Rubik Bold',
    styleLabel: 'Sudut Halus Edukasi',
    sampleText: 'Tips Praktis',
    googleFamily: 'Rubik',
    fontFamily: '"Rubik", "Plus Jakarta Sans", sans-serif',
    fixedWeight: 800,
    loadWeight: 800,
    sizeScale: 1.0
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    styleLabel: 'Teknologi & Bisnis',
    sampleText: 'Data & Angka',
    googleFamily: 'Space Grotesk',
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    fixedWeight: 700,
    loadWeight: 700,
    sizeScale: 1.0
  },
  {
    id: 'fredoka',
    name: 'Fredoka Bold',
    styleLabel: 'Santai & Cerita Seru',
    sampleText: 'Cerita Seru',
    googleFamily: 'Fredoka',
    fontFamily: '"Fredoka", "Plus Jakarta Sans", sans-serif',
    fixedWeight: 700,
    loadWeight: 700,
    sizeScale: 1.03
  },
  {
    id: 'merriweather',
    name: 'Merriweather Heavy',
    styleLabel: 'Editorial & Kajian',
    sampleText: 'Kutipan Buku',
    googleFamily: 'Merriweather',
    fontFamily: '"Merriweather", Georgia, serif',
    fixedWeight: 900,
    loadWeight: 900,
    sizeScale: 0.93
  }
];

export function getCaptionFontById(fontId) {
  if (!fontId) return CAPTION_FONTS[0];
  return CAPTION_FONTS.find((f) => f.id === fontId) || CAPTION_FONTS[0];
}

/**
 * Memastikan font web pilihan pengguna sudah termuat di memori `document.fonts`
 * sebelum kanvas pratinjau atau encoder MP4 menggambar frame pertama.
 */
export async function ensureCaptionFontLoaded(fontId = 'jakarta', pxSize = 48) {
  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') {
    return;
  }
  const fontObj = getCaptionFontById(fontId);
  const spec = `${fontObj.loadWeight || 800} ${Math.max(24, Math.round(pxSize))}px "${fontObj.googleFamily}"`;
  try {
    await Promise.race([
      document.fonts.load(spec, 'KATA AKTIF 123 Halo Kreator'),
      new Promise((resolve) => setTimeout(resolve, 2200))
    ]);
  } catch {
    // Bila offline penuh dan font belum di-cache, otomatis gunakan fallback sistem dengan rapi
  }
}

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
 * Mengelompokkan daftar kata [{ word, start, end }] menjadi grup pendek (maks 4 kata),
 * memutus grup pada jeda napas nyata (>= 0.30 detik), DAN menjembatani celah mikro (< 0.42 detik)
 * antar-grup berurutan (`displayStart` / `displayEnd`) agar subtitle TIDAK PERNAH berkedip kosong (zero-miss)!
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
    const breathPause = gapToNext >= 0.30 || (endsClause && gapToNext >= 0.16);
    const charLen = current.reduce((acc, item) => acc + String(item.word).length, 0);

    if (current.length >= maxWordsPerGroup || charLen >= 24 || endsSentence || breathPause || !next) {
      groups.push({
        start: current[0].start,
        end: current[current.length - 1].end,
        displayStart: current[0].start - 0.035,
        displayEnd: current[current.length - 1].end + 0.14,
        words: current
      });
      current = [];
    }
  }

  // Jembatani celah mikro (< 420ms) saat pembicara masih berbicara sambung-menyambung
  // sehingga pergantian grup 4 kata berlangsung mulus tanpa frame kosong!
  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const g = groups[gIdx];
    const nextG = groups[gIdx + 1] || null;
    if (gIdx === 0) {
      g.displayStart = Math.max(0, g.start - 0.04);
    }
    if (nextG) {
      const interGroupGap = nextG.start - g.end;
      if (interGroupGap >= -0.02 && interGroupGap < 0.42) {
        const handoff = Number(nextG.start.toFixed(4));
        g.displayEnd = handoff;
        nextG.displayStart = handoff;
      } else {
        g.displayEnd = g.end + 0.14;
        nextG.displayStart = Math.max(g.displayEnd + 0.01, nextG.start - 0.035);
      }
    } else {
      g.displayEnd = g.end + 0.16;
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
 * Menggambar 1 frame utuh klip 9:16 ke canvas tujuan (termasuk kustomisasi Font, Ukuran, & Format Kapital).
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
    fontFamilyId = 'jakarta',
    fontScale = 1.0,
    textCase = 'auto', // 'auto' | 'uppercase' | 'normal'
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
      const halfH = Math.floor(H / 2);
      const leftX = cameraMeta?.leftSpeakerX ?? 0.28;
      const leftY = cameraMeta?.leftSpeakerY ?? 0.36;
      const rightX = cameraMeta?.rightSpeakerX ?? 0.72;
      const rightY = cameraMeta?.rightSpeakerY ?? 0.36;

      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, leftX, leftY, 0, 0, W, halfH, 1.06);
      drawCenteredCrop(ctx, source, sourceWidth, sourceHeight, rightX, rightY, 0, halfH, W, H - halfH, 1.06);

      ctx.fillStyle = '#14140F';
      ctx.fillRect(0, halfH - 2, W, 4);
    } else if (effectiveMode === 'gaming-split' && sourceAspect > targetAspect) {
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
  const fontChoice = getCaptionFontById(fontFamilyId);

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

  // 4. Gambar Caption Per Kata Anti-Miss + Font Kustom Pilihan Pengguna
  const syncedTimeSec = currentTimeSec - (Number(captionOffsetSec) || 0);
  const activeGroup = phraseGroups.find(
    (g) =>
      syncedTimeSec >= (g.displayStart ?? g.start - 0.035) &&
      syncedTimeSec <= (g.displayEnd ?? g.end + 0.12)
  );

  if (activeGroup && activeGroup.words.length > 0) {
    const safeScale = Math.max(0.75, Math.min(1.4, Number(fontScale) || 1.0));
    const effectiveFontFamily = fontChoice ? fontChoice.fontFamily : preset.fontFamily;
    const effectiveFontWeight = fontChoice?.fixedWeight ? fontChoice.fixedWeight : preset.fontWeight;
    const fontIntrinsicScale = fontChoice?.sizeScale || 1.0;
    const fontSize = Math.max(16, Math.round(W * preset.fontSizeRatio * fontIntrinsicScale * safeScale));

    const useUppercase =
      textCase === 'uppercase' || fontChoice?.id === 'bebas'
        ? true
        : textCase === 'normal'
        ? false
        : Boolean(preset.uppercase);

    ctx.font = `${effectiveFontWeight} ${fontSize}px ${effectiveFontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const maxCaptionWidth = W * 0.86;
    const baseSpace = Math.max(ctx.measureText(' ').width, fontSize * 0.27);
    const spaceWidth = Math.round(baseSpace * (preset.activePillColor ? 1.76 : 1.44));

    const gWords = activeGroup.words;
    let activeWordIdx = -1;
    for (let i = 0; i < gWords.length; i++) {
      const w = gWords[i];
      const prev = i > 0 ? gWords[i - 1] : null;
      const next = i + 1 < gWords.length ? gWords[i + 1] : null;

      const gapBefore = prev ? w.start - prev.end : 1;
      const gapAfter = next ? next.start - w.end : 1;

      const effStart = gapBefore <= 0.20 && prev ? (prev.end + w.start) * 0.5 : w.start - 0.025;
      const effEnd = gapAfter <= 0.20 && next ? (w.end + next.start) * 0.5 : w.end + 0.08;

      if (syncedTimeSec >= effStart && syncedTimeSec <= effEnd) {
        activeWordIdx = i;
        break;
      }
    }

    // Proteksi Anti-Kedip: jika grup sedang aktif namun di sela konsonan tipis, tetap sorot kata yang baru saja diucapkan!
    if (activeWordIdx === -1 && gWords.length > 0) {
      for (let i = gWords.length - 1; i >= 0; i--) {
        if (syncedTimeSec >= gWords[i].start - 0.04) {
          activeWordIdx = i;
          break;
        }
      }
      if (activeWordIdx === -1) activeWordIdx = 0;
    }

    const tokens = gWords.map((w, idx) => {
      const displayWord = useUppercase ? String(w.word).toUpperCase() : String(w.word);
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

    const lineHeight = Math.round(fontSize * 1.32);
    const totalTextH = lines.length * lineHeight;
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

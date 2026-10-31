/**
 * Klip Auto — Pemeriksa Kesiapan Perangkat Sebelum Beli & Diagnostik Ruang Disk
 * Memeriksa OS, browser yang didukung, RAM, akselerasi GPU/CPU WebCodecs, WebGPU, dan sisa ruang disk.
 */

export const SUPPORTED_BROWSERS_TEXT =
  'Google Chrome 94+, Microsoft Edge 94+, Brave 1.32+, atau Opera 80+ di Windows 10/11 & macOS.';

function detectOsLabel(ua, platform) {
  const u = String(ua || '');
  const p = String(platform || '');
  if (/Windows NT 10\.0/i.test(u)) return 'Windows 10 / 11 (64-bit)';
  if (/Windows/i.test(u)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(u)) {
    return /Arm|Apple/i.test(p) ? 'macOS (Apple Silicon)' : 'macOS (Intel / Apple Silicon)';
  }
  if (/Android/i.test(u)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(u)) return 'iOS / iPadOS';
  if (/Linux/i.test(u)) return 'Linux Desktop';
  return p || 'Sistem Operasi Desktop';
}

function detectBrowserInfo(ua) {
  const u = String(ua || '');
  const isInApp = /FBAN|FBAV|Instagram|BytedanceWebview|TikTok|Line\//i.test(u);
  if (isInApp) {
    return {
      name: 'Browser Dalam Aplikasi (WebView)',
      supported: false,
      note: 'Buka lewat Google Chrome atau Microsoft Edge agar render MP4 berjalan penuh.'
    };
  }
  const edg = u.match(/Edg\/(\d+)/);
  if (edg) {
    const ver = Number(edg[1]);
    return {
      name: `Microsoft Edge ${ver}`,
      supported: ver >= 94,
      note: ver >= 94 ? 'Didukung penuh (WebCodecs aktif).' : 'Perbarui Edge ke versi 94 ke atas.'
    };
  }
  const opr = u.match(/OPR\/(\d+)/);
  if (opr) {
    const ver = Number(opr[1]);
    return {
      name: `Opera ${ver}`,
      supported: ver >= 80,
      note: ver >= 80 ? 'Didukung penuh.' : 'Perbarui Opera ke versi terbaru.'
    };
  }
  const chr = u.match(/Chrome\/(\d+)/);
  if (chr) {
    const ver = Number(chr[1]);
    return {
      name: `Google Chrome / Chromium ${ver}`,
      supported: ver >= 94,
      note: ver >= 94 ? 'Didukung penuh (direkomendasikan).' : 'Perbarui Chrome ke versi 94 ke atas.'
    };
  }
  const saf = u.match(/Version\/(\d+).*Safari/);
  if (saf && !/Chrome/i.test(u)) {
    const ver = Number(saf[1]);
    return {
      name: `Safari ${ver}`,
      supported: ver >= 16,
      note:
        ver >= 16
          ? 'Dukungan dasar tersedia; Google Chrome / Edge tetap paling disarankan untuk video 60+ menit.'
          : 'Gunakan Google Chrome atau Microsoft Edge terbaru.'
    };
  }
  if (/Firefox\//i.test(u)) {
    const ff = u.match(/Firefox\/(\d+)/);
    const ver = ff ? Number(ff[1]) : 0;
    return {
      name: `Mozilla Firefox ${ver || ''}`.trim(),
      supported: ver >= 130,
      note: 'Untuk kecepatan & kestabilan terbaik di video 1–2 jam, kami menyarankan Google Chrome atau Edge.'
    };
  }
  return {
    name: 'Browser Web',
    supported: typeof VideoEncoder !== 'undefined',
    note: SUPPORTED_BROWSERS_TEXT
  };
}

function detectWebGlRenderer() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return 'Tidak terdeteksi (Mode CPU)';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      const r = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      if (r) return String(r).replace(/\s+/g, ' ').trim();
    }
    return String(gl.getParameter(gl.RENDERER) || 'Grafis Terintegrasi');
  } catch {
    return 'Grafis Standar (Mode CPU)';
  }
}

export async function checkFreeDiskSpace() {
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const est = await navigator.storage.estimate();
      const quota = Number(est.quota || 0);
      const usage = Number(est.usage || 0);
      const freeBytes = Math.max(0, quota - usage);
      return {
        supported: quota > 0,
        freeBytes,
        freeGb: Number((freeBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usageMb: Number((usage / (1024 * 1024)).toFixed(1))
      };
    } catch {}
  }
  return { supported: false, freeBytes: 0, freeGb: null, usageMb: 0 };
}

/**
 * Memastikan ruang penyimpanan browser cukup sebelum merender klip MP4 baru.
 * Mendukung simulasi pengujian ruang disk penuh melalui `window.__KLIP_SIMULATE_DISK_FULL_BYTES`.
 */
export async function assertSufficientDiskForRender(requiredBytes = 80 * 1024 * 1024) {
  const simulatedFree =
    typeof window !== 'undefined' && typeof window.__KLIP_SIMULATE_DISK_FULL_BYTES === 'number'
      ? window.__KLIP_SIMULATE_DISK_FULL_BYTES
      : null;

  const disk = await checkFreeDiskSpace();
  const effectiveFree = simulatedFree != null ? simulatedFree : disk.supported ? disk.freeBytes : Infinity;

  if (effectiveFree < requiredBytes) {
    const freeMb = Math.max(0, Math.round(effectiveFree / (1024 * 1024)));
    const needMb = Math.round(requiredBytes / (1024 * 1024));
    const err = new Error(
      `Ruang penyimpanan disk perangkat/browser hampir penuh (tersisa ~${freeMb} MB, butuh minimal ${needMb} MB agar file MP4 utuh dan tidak rusak). Kosongkan ruang disk atau hapus file unduhan lama terlebih dahulu.`
    );
    err.code = 'DISK_FULL';
    throw err;
  }
  return disk;
}

/**
 * Menjalankan pemeriksaan perangkat menyeluruh (OS, Browser, RAM, GPU/CPU WebCodecs, Ruang Disk).
 */
export async function runDeviceReadinessCheck() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
  const os = detectOsLabel(ua, platform);
  const browser = detectBrowserInfo(ua);

  const rawMem = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory || 0) : 0;
  const cores = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency || 0) : 0;
  const ramLabel =
    rawMem >= 8
      ? `${rawMem}+ GB RAM (Optimal untuk video 60–120 menit)`
      : rawMem >= 4
      ? `${rawMem} GB RAM (Cukup — gunakan resolusi 720p untuk video panjang)`
      : rawMem > 0
      ? `${rawMem} GB RAM (Disarankan minimal 8 GB untuk video > 60 menit)`
      : `Tidak dilaporkan browser (${cores ? `${cores} inti CPU terdeteksi` : 'Standar Desktop'})`;

  const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
  let gpuEncode = false;
  let cpuEncode = false;

  if (hasWebCodecs && typeof VideoEncoder.isConfigSupported === 'function') {
    try {
      const hw = await VideoEncoder.isConfigSupported({
        codec: 'avc1.42001f',
        width: 720,
        height: 1280,
        framerate: 30,
        hardwareAcceleration: 'prefer-hardware'
      });
      gpuEncode = Boolean(hw?.supported);
    } catch {}
    try {
      const sw = await VideoEncoder.isConfigSupported({
        codec: 'avc1.42001f',
        width: 720,
        height: 1280,
        framerate: 30,
        hardwareAcceleration: 'prefer-software'
      });
      cpuEncode = Boolean(sw?.supported);
    } catch {}
  }

  let hasWebGpu = false;
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const ad = await navigator.gpu.requestAdapter();
      hasWebGpu = Boolean(ad);
    } catch {}
  }

  const gpuRenderer = detectWebGlRenderer();
  const disk = await checkFreeDiskSpace();

  const ready = hasWebCodecs && (gpuEncode || cpuEncode) && (disk.freeGb == null || disk.freeGb >= 0.5);
  let verdict = 'Perangkat Siap Dipakai Lancar';
  let verdictTone = 'ok';
  if (!hasWebCodecs || (!gpuEncode && !cpuEncode)) {
    verdict = 'Ganti Browser ke Google Chrome atau Microsoft Edge Terbaru';
    verdictTone = 'warn';
  } else if (disk.freeGb != null && disk.freeGb < 1.0) {
    verdict = 'Perangkat Didukung, Namun Ruang Disk Hampir Penuh (< 1 GB)';
    verdictTone = 'warn';
  } else if (!gpuEncode) {
    verdict = 'Perangkat Siap Dipakai (Otomatis Mode CPU Stabil)';
    verdictTone = 'ok';
  }

  return {
    checkedAt: new Date().toISOString(),
    verdict,
    verdictTone,
    ready,
    supportedBrowsersInfo: SUPPORTED_BROWSERS_TEXT,
    os,
    browser,
    ram: {
      gb: rawMem || null,
      cores: cores || null,
      label: ramLabel
    },
    gpu: {
      renderer: gpuRenderer,
      webCodecsSupported: hasWebCodecs,
      gpuHardwareEncode: gpuEncode,
      cpuFallbackEncode: cpuEncode,
      whisperWebGpu: hasWebGpu,
      label: gpuEncode
        ? `Akselerasi GPU Aktif + Fallback CPU Siaga (${gpuRenderer.slice(0, 48)})`
        : hasWebCodecs
        ? `Mode Render CPU Aktif (${gpuRenderer.slice(0, 48)})`
        : 'WebCodecs tidak tersedia di browser ini'
    },
    disk: {
      freeGb: disk.freeGb,
      label:
        disk.freeGb != null
          ? `${disk.freeGb} GB ruang kerja kosong tersedia`
          : 'Ruang disk dikelola otomatis oleh browser'
    }
  };
}

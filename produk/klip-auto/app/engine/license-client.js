/**
 * Klip Auto — Modul Tunggal Klien Lisensi, Paket Fitur, Mode Offline, & Laporan Error
 * PENTING (Sesuai GUIDE-KLIP-AUTO.md Bagian 5.6):
 * - TIDAK ADA kode lisensi, hash, maupun salt yang disimpan di kode aplikasi klien.
 * - Seluruh validasi lisensi & pembukaan paket (Inti / Tambahan / Pro) ditentukan oleh server.
 * - Satu modul terpusat sehingga mudah disambungkan ke sistem akses internal kapan saja.
 */

const DEVICE_ID_KEY = 'klip_auto_device_id_v2';
const LEASE_STORAGE_KEY = 'klip_auto_lease_v2';
export const APP_CLIENT_VERSION = '2.1.0';

export function getOrCreateDeviceId() {
  try {
    let existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length >= 12) return existing;
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const generated =
      'dev-' +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return 'dev-ephemeral-session';
  }
}

export function getDeviceReadableLabel() {
  try {
    const ua = navigator.userAgent || '';
    const os = /Windows/i.test(ua)
      ? 'Windows'
      : /Macintosh|Mac OS/i.test(ua)
      ? 'Mac'
      : /Linux/i.test(ua)
      ? 'Linux'
      : 'Perangkat';
    const br = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : 'Browser';
    return `${os} · ${br}`;
  } catch {
    return 'Laptop Pembeli';
  }
}

export function getStoredOfflineLease() {
  try {
    const raw = localStorage.getItem(LEASE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.leaseExpiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveOfflineLease(leaseObj) {
  try {
    localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(leaseObj));
  } catch {}
}

export function clearOfflineLease() {
  try {
    localStorage.removeItem(LEASE_STORAGE_KEY);
  } catch {}
}

export function notifyServiceWorkerAssetCache(action = 'WARM_AUTHENTICATED_ASSETS') {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: action });
    }
  } catch {}
}

/**
 * Mengaktifkan lisensi ke server (1 laptop untuk Inti/Tambahan, multi-laptop untuk Pro).
 */
export async function activateLicense({ name = '', email = '', code = '' }) {
  const deviceId = getOrCreateDeviceId();
  const deviceLabel = getDeviceReadableLabel();

  let res;
  try {
    res = await fetch('./api/license/activate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(name || '').trim(),
        email: String(email || '').trim(),
        code: String(code || '').trim(),
        deviceId,
        deviceLabel
      })
    });
  } catch {
    const err = new Error(
      'Aktivasi pertama kali memerlukan koneksi internet untuk memeriksa lisensi di server. Setelah aktif, Klip Auto tetap bisa dipakai offline hingga 7 hari.'
    );
    err.code = 'NETWORK_OFFLINE';
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || `Gagal memvalidasi lisensi (${res.status}).`);
    err.code = data.code || 'INVALID_LICENSE';
    err.canSelfTransfer = Boolean(data.canSelfTransfer);
    err.currentDeviceHint = data.currentDeviceHint || '';
    throw err;
  }

  const session = {
    user: data.user,
    tier: data.tier || 'inti',
    tierLabel: data.tierLabel || 'Paket Inti',
    features: data.features || {},
    deviceId,
    deviceLabel,
    activatedAt: data.activatedAt || Date.now(),
    leaseExpiresAt: data.leaseExpiresAt || Date.now() + 7 * 24 * 3600 * 1000,
    offlineMode: false
  };

  saveOfflineLease(session);
  notifyServiceWorkerAssetCache('WARM_AUTHENTICATED_ASSETS');
  return session;
}

/**
 * Pindah Perangkat Mandiri: memindahkan ikatan lisensi dari laptop lama ke laptop ini lewat server.
 */
export async function transferLicenseToThisDevice({ name = '', email = '', code = '' }) {
  const deviceId = getOrCreateDeviceId();
  const deviceLabel = getDeviceReadableLabel();

  const res = await fetch('./api/license/transfer', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      code: String(code || '').trim(),
      deviceId,
      deviceLabel
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || 'Gagal memindahkan perangkat.');
    err.code = data.code || 'TRANSFER_FAILED';
    throw err;
  }

  const session = {
    user: data.user,
    tier: data.tier || 'inti',
    tierLabel: data.tierLabel || 'Paket Inti',
    features: data.features || {},
    deviceId,
    deviceLabel,
    activatedAt: Date.now(),
    leaseExpiresAt: data.leaseExpiresAt || Date.now() + 7 * 24 * 3600 * 1000,
    offlineMode: false
  };

  saveOfflineLease(session);
  notifyServiceWorkerAssetCache('WARM_AUTHENTICATED_ASSETS');
  return session;
}

/**
 * Memeriksa status sesi aktif:
 * - Saat online: memvalidasi ke server & menyegarkan masa berlaku offline 7 hari + fitur paket terbaru.
 * - Saat offline: mengizinkan pemakaian selama masa sewa offline (7 hari sejak verifikasi terakhir) masih berlaku!
 */
export async function verifyCurrentLicense() {
  const deviceId = getOrCreateDeviceId();
  const cachedLease = getStoredOfflineLease();

  const useValidOfflineLease = () => {
    if (
      cachedLease &&
      cachedLease.deviceId === deviceId &&
      Number(cachedLease.leaseExpiresAt) > Date.now()
    ) {
      const daysLeft = Math.max(
        1,
        Math.ceil((Number(cachedLease.leaseExpiresAt) - Date.now()) / (24 * 3600 * 1000))
      );
      return {
        ok: true,
        session: {
          ...cachedLease,
          offlineMode: true,
          offlineDaysRemaining: daysLeft
        }
      };
    }
    return { ok: false, reason: 'NO_ACTIVE_SESSION' };
  };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return useValidOfflineLease();
  }

  try {
    const res = await fetch(`./api/license/verify?deviceId=${encodeURIComponent(deviceId)}`, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) {
        const refreshed = {
          user: data.user,
          tier: data.tier || 'inti',
          tierLabel: data.tierLabel || 'Paket Inti',
          features: data.features || {},
          deviceId,
          deviceLabel: getDeviceReadableLabel(),
          activatedAt: cachedLease?.activatedAt || Date.now(),
          leaseExpiresAt: data.leaseExpiresAt || Date.now() + 7 * 24 * 3600 * 1000,
          offlineMode: false
        };
        saveOfflineLease(refreshed);
        return { ok: true, session: refreshed };
      }
      clearOfflineLease();
      return {
        ok: false,
        reason: data?.code || 'NO_VALID_SESSION',
        message: data?.error || ''
      };
    }

    if (res.status === 401 || res.status === 403) {
      const errBody = await res.json().catch(() => ({}));
      clearOfflineLease();
      notifyServiceWorkerAssetCache('PURGE_AUTHENTICATED_ASSETS');
      return {
        ok: false,
        reason: errBody.code || 'SESSION_EXPIRED',
        message: errBody.error || ''
      };
    }
  } catch {
    // Jika server tidak terjangkau karena gangguan internet sementara, gunakan masa aktif offline!
    return useValidOfflineLease();
  }

  return { ok: false, reason: 'NO_SESSION' };
}

/**
 * Melepas ikatan perangkat ini secara mandiri (agar kode lisensi langsung bebas dipakai di laptop baru).
 */
export async function releaseCurrentDevice() {
  const deviceId = getOrCreateDeviceId();
  try {
    await fetch('./api/license/release', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
  } catch {}
  clearOfflineLease();
  notifyServiceWorkerAssetCache('PURGE_AUTHENTICATED_ASSETS');
}

export async function logoutLicenseSession() {
  try {
    await fetch('./api/license/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch {}
  clearOfflineLease();
  notifyServiceWorkerAssetCache('PURGE_AUTHENTICATED_ASSETS');
}

/**
 * Mengecek versi aplikasi terbaru & pembaruan konfigurasi alat penarik YouTube dari server.
 */
export async function checkServerVersionInfo() {
  try {
    const res = await fetch('./api/version', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      ...data,
      clientVersion: APP_CLIENT_VERSION,
      hasNewerVersion: Boolean(data.version && data.version !== APP_CLIENT_VERSION)
    };
  } catch {
    return null;
  }
}

/**
 * Mengirim laporan error teknis ke server TANPA video dan TANPA data pribadi (nama/email/path lokal disensor).
 */
export async function sendSanitizedErrorReport({ summary = '', diagnosticLogs = [], deviceSummary = null }) {
  const scrubText = (txt) =>
    String(txt || '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email-disensor]')
      .replace(/[A-Za-z]:\\[^\s"']+/g, '[path-lokal]')
      .replace(/\/Users\/[^\s"']+/g, '[path-lokal]')
      .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[disensor]')
      .slice(0, 600);

  const payload = {
    clientVersion: APP_CLIENT_VERSION,
    timestamp: new Date().toISOString(),
    summary: scrubText(summary || 'Laporan kendala teknis dari tombol aplikasi'),
    logs: (Array.isArray(diagnosticLogs) ? diagnosticLogs : []).slice(-25).map(scrubText),
    environment: deviceSummary
      ? {
          os: deviceSummary.os,
          browser: deviceSummary.browser?.name,
          ramGb: deviceSummary.ram?.gb,
          gpuEncode: deviceSummary.gpu?.gpuHardwareEncode,
          cpuEncode: deviceSummary.gpu?.cpuFallbackEncode,
          freeDiskGb: deviceSummary.disk?.freeGb
        }
      : {
          online: typeof navigator !== 'undefined' ? navigator.onLine : true,
          webCodecs: typeof VideoEncoder !== 'undefined'
        }
  };

  const res = await fetch('./api/error-report', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Gagal mengirim laporan error. Periksa koneksi internet kamu.');
  }
  return data;
}

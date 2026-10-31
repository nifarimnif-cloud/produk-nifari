/**
 * Klip Auto — Cloudflare Pages Edge Worker (Server Lisensi, Pengunci Aset Aplikasi, Info Versi, & Laporan Error)
 * Sesuai GUIDE-KLIP-AUTO.md Bagian 2, 3A, 4, 5, dan 6:
 * - 0% proxy video YouTube, 0% layanan pihak ketiga, biaya server per klip = nol.
 * - TIDAK ADA kode lisensi, hash, atau salt yang ditanam di file kode ini (semua dibaca dari
 *   rahasia terenkripsi server `env.KLIP_AUTO_LICENSE_CONFIG`).
 * - File mesin aplikasi (`/wizard-controller.js`, `/engine/*` inti, `/vendor/*`, `/data/*`)
 *   HANYA dikirim ke browser setelah lisensi dicek dan dinyatakan sah oleh server.
 */

const APP_VERSION = '2.1.0';
const SESSION_COOKIE_NAME = 'klip_lic_session';
const SEVEN_DAYS_SEC = 7 * 24 * 3600;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Registri ikatan perangkat dalam isolate + disinkronkan ke Cloudflare Edge Cache
const memoryDeviceRegistry = new Map();
const recentErrorReports = [];

const PUBLIC_ENGINE_FILES = new Set([
  '/engine/license-client.js',
  '/engine/device-checker.js'
]);

function isProtectedAppAsset(pathname) {
  if (pathname === '/wizard-controller.js') return true;
  if (pathname === '/klip-auto-jembatan-lokal-v2.1.zip') return true;
  if (pathname.startsWith('/companion-extension/')) return true;
  if (pathname.startsWith('/vendor/')) return true;
  if (pathname.startsWith('/data/')) return true;
  if (pathname.startsWith('/engine/') && !PUBLIC_ENGINE_FILES.has(pathname)) return true;
  return false;
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const padded = String(str || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(str || '').length / 4) * 4, '=');
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function sha256HexAsync(text) {
  const data = new TextEncoder().encode(String(text || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSignString(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parseLicenseServerConfig(env) {
  const raw = env?.KLIP_AUTO_LICENSE_CONFIG;
  if (!raw) return null;
  try {
    let parsed = null;
    if (typeof raw === 'object') {
      parsed = raw;
    } else {
      const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '');
      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        const decoded = new TextDecoder().decode(fromBase64Url(trimmed));
        parsed = JSON.parse(decoded);
      }
    }
    if (!parsed || !parsed.hmacSecret || !parsed.salt || !parsed.licenses) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildPackageFeatures(tier = 'inti') {
  const isTambahan = tier === 'tambahan' || tier === 'pro';
  const isPro = tier === 'pro';
  return {
    tier,
    extraPresets: isTambahan,
    customWatermark: isTambahan,
    descriptionHashtagGenerator: isTambahan,
    gamingSplit: isPro,
    multiVideoBatch: isPro,
    multiDevice: isPro
  };
}

function getTierLabel(tier = 'inti') {
  if (tier === 'pro') return 'Paket Pro (Multi-Video + Gaming Split)';
  if (tier === 'tambahan') return 'Paket Inti + Tambahan (Watermark & Generator)';
  return 'Paket Inti (9:16 Tanpa Kuota)';
}

async function readDeviceRegistry(licenseId) {
  const mem = memoryDeviceRegistry.get(licenseId);
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const req = new Request(`https://lic-registry.klipauto.internal/v2/${encodeURIComponent(licenseId)}`);
      const cached = await caches.default.match(req);
      if (cached) {
        const data = await cached.json();
        if (!mem || (data.updatedAt || 0) >= (mem.updatedAt || 0)) {
          memoryDeviceRegistry.set(licenseId, data);
          return data;
        }
      }
    }
  } catch {}
  return (
    mem || {
      licenseId,
      generation: 1,
      ownerEmail: '',
      devices: [],
      updatedAt: 0
    }
  );
}

async function writeDeviceRegistry(licenseId, record) {
  const next = { ...record, licenseId, updatedAt: Date.now() };
  memoryDeviceRegistry.set(licenseId, next);
  try {
    if (typeof caches !== 'undefined' && caches.default) {
      const req = new Request(`https://lic-registry.klipauto.internal/v2/${encodeURIComponent(licenseId)}`);
      const res = new Response(JSON.stringify(next), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000'
        }
      });
      await caches.default.put(req, res);
    }
  } catch {}
  return next;
}

async function createSignedSessionToken(payloadObj, hmacSecret) {
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const sigB64 = await hmacSignString(hmacSecret, payloadB64);
  return `${payloadB64}.${sigB64}`;
}

async function verifySignedSessionToken(tokenStr, hmacSecret) {
  if (!tokenStr || !tokenStr.includes('.')) return null;
  const [payloadB64, sigB64] = tokenStr.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = await hmacSignString(hmacSecret, payloadB64);
  if (!timingSafeEqualStr(sigB64, expectedSig)) return null;

  try {
    const jsonStr = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function readCookieValue(request, cookieName) {
  const raw = request.headers.get('Cookie') || '';
  const parts = raw.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === cookieName) {
      return part.slice(idx + 1).trim();
    }
  }
  return '';
}

function formatSessionCookieHeader(tokenValue, isHttps, maxAgeSec = SEVEN_DAYS_SEC) {
  const secureFlag = isHttps ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${tokenValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secureFlag}`;
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  /* 1. INFO VERSI APLIKASI & PEMBARUAN KONFIGURASI ALAT YOUTUBE LOKAL */
  if (url.pathname === '/api/version' && request.method === 'GET') {
    return jsonResponse({
      ok: true,
      version: APP_VERSION,
      releaseDate: '2026-10-31',
      supportedBrowsers: 'Google Chrome 94+, Microsoft Edge 94+, Brave 1.32+, Opera 80+',
      ytExtractorConfig: {
        androidVersion: '20.10.38',
        iosVersion: '20.10.4',
        bridgeMinVersion: '2.1.0'
      },
      notes:
        'Pembaruan v2.1: Penyelaras suku kata vokal 10ms, Whisper-Small Bahasa Indonesia + Inggris, Skor Jujur 4 Sinyal, dan Podcast Split 2 Wajah otomatis.'
    });
  }

  /* 2. LAPORAN ERROR TANPA VIDEO & TANPA DATA PRIBADI */
  if (url.pathname === '/api/error-report' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Format laporan tidak valid.' }, 400);
    }

    const reportId = `KLIP-ERR-${Date.now().toString(36).toUpperCase()}`;
    const safeSummary = String(body.summary || 'Laporan diagnostik')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[disensor]')
      .slice(0, 400);
    const safeLogs = (Array.isArray(body.logs) ? body.logs : [])
      .slice(0, 25)
      .map((l) => String(l || '').slice(0, 300));

    recentErrorReports.unshift({
      reportId,
      receivedAt: new Date().toISOString(),
      clientVersion: String(body.clientVersion || APP_VERSION).slice(0, 20),
      summary: safeSummary,
      logCount: safeLogs.length,
      environment: body.environment || {}
    });
    if (recentErrorReports.length > 50) recentErrorReports.pop();

    return jsonResponse({
      ok: true,
      reportId,
      receivedAt: new Date().toISOString(),
      message: 'Laporan log teknis (tanpa video & tanpa data pribadi) berhasil diterima.'
    });
  }

  const cfg = parseLicenseServerConfig(env);
  if (!cfg) {
    return jsonResponse(
      {
        ok: false,
        code: 'SERVER_CONFIG_MISSING',
        error: 'Konfigurasi rahasia server lisensi belum dipasang pada environment.'
      },
      503
    );
  }

  /* 3. AKTIVASI LISENSI (1 LAPTOP UNTUK INTI/TAMBAHAN, MULTI-LAPTOP UNTUK PRO) */
  if (url.pathname === '/api/license/activate' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Permintaan aktivasi tidak valid.' }, 400);
    }

    const rawCode = String(body.code || '').trim().toUpperCase();
    const rawName = String(body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const deviceId = String(body.deviceId || '').trim() || 'dev-default';
    const deviceLabel = String(body.deviceLabel || 'Laptop Pembeli').slice(0, 60);

    if (!rawCode) {
      return jsonResponse(
        { ok: false, code: 'EMPTY_CODE', error: 'Masukkan kode lisensi pembelian terlebih dahulu.' },
        400
      );
    }

    const computedHash = await sha256HexAsync(cfg.salt + rawCode);
    const licEntry = cfg.licenses[computedHash] || null;
    if (!licEntry) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_CODE',
          error: 'Kode lisensi tidak valid atau salah ketik. Periksa kembali kode pembelian resmimu.'
        },
        401
      );
    }

    const isDev = licEntry.role === 'developer';
    if (!isDev) {
      if (rawName.length < 2) {
        return jsonResponse(
          { ok: false, code: 'NAME_REQUIRED', error: 'Masukkan nama kreator atau nama channel (minimal 2 huruf).' },
          400
        );
      }
      if (!EMAIL_REGEX.test(rawEmail)) {
        return jsonResponse(
          {
            ok: false,
            code: 'EMAIL_REQUIRED',
            error: 'Masukkan alamat email aktif yang dipakai saat pembelian (penting untuk pindah perangkat mandiri).'
          },
          400
        );
      }
    }

    const finalName = rawName || (isDev ? 'Developer Klip Auto' : 'Kreator Klip Auto');
    const finalEmail = rawEmail || (isDev ? 'dev@klipauto.local' : '');
    const maxDevices = Number(licEntry.maxDevices || (licEntry.tier === 'pro' ? 3 : 1));
    const reg = await readDeviceRegistry(licEntry.id);

    const existingIdx = reg.devices.findIndex((d) => d.id === deviceId);
    if (existingIdx === -1 && reg.devices.length >= maxDevices) {
      return jsonResponse(
        {
          ok: false,
          code: 'DEVICE_LIMIT_REACHED',
          canSelfTransfer: true,
          currentDeviceHint: reg.devices[0]?.label || 'Perangkat sebelumnya',
          error: `Lisensi ini dibatasi untuk ${maxDevices} perangkat dan sedang aktif di perangkat lain (${
            reg.devices[0]?.label || 'laptop lama'
          }). Gunakan tombol "Pindah Perangkat Mandiri" di bawah untuk memindahkan akses ke laptop ini.`
        },
        409
      );
    }

    const nextDevices = [...reg.devices];
    if (existingIdx >= 0) {
      nextDevices[existingIdx] = { id: deviceId, label: deviceLabel, boundAt: Date.now() };
    } else {
      nextDevices.push({ id: deviceId, label: deviceLabel, boundAt: Date.now() });
    }

    const savedReg = await writeDeviceRegistry(licEntry.id, {
      ...reg,
      ownerEmail: reg.ownerEmail || finalEmail,
      devices: nextDevices
    });

    const exp = Date.now() + SEVEN_DAYS_SEC * 1000;
    const tokenPayload = {
      sub: licEntry.id,
      tier: licEntry.tier || 'inti',
      role: licEntry.role || 'buyer',
      name: finalName,
      email: finalEmail,
      deviceId,
      gen: savedReg.generation || 1,
      exp
    };
    const token = await createSignedSessionToken(tokenPayload, cfg.hmacSecret);

    return jsonResponse(
      {
        ok: true,
        user: {
          name: finalName,
          email: finalEmail,
          role: tokenPayload.role
        },
        tier: tokenPayload.tier,
        tierLabel: getTierLabel(tokenPayload.tier),
        features: buildPackageFeatures(tokenPayload.tier),
        activatedAt: Date.now(),
        leaseExpiresAt: exp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(token, isHttps) }
    );
  }

  /* 4. PINDAH PERANGKAT MANDIRI (MELEPAS LAPTOP LAMA & MENGIKAT LAPTOP BARU) */
  if (url.pathname === '/api/license/transfer' && request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Permintaan pindah perangkat tidak valid.' }, 400);
    }

    const rawCode = String(body.code || '').trim().toUpperCase();
    const rawName = String(body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const deviceId = String(body.deviceId || '').trim() || 'dev-transferred';
    const deviceLabel = String(body.deviceLabel || 'Laptop Baru').slice(0, 60);

    if (!rawCode) {
      return jsonResponse({ ok: false, error: 'Masukkan kode lisensi untuk memindahkan perangkat.' }, 400);
    }

    const computedHash = await sha256HexAsync(cfg.salt + rawCode);
    const licEntry = cfg.licenses[computedHash] || null;
    if (!licEntry) {
      return jsonResponse({ ok: false, code: 'INVALID_CODE', error: 'Kode lisensi tidak dikenali.' }, 401);
    }

    const isDev = licEntry.role === 'developer';
    const reg = await readDeviceRegistry(licEntry.id);

    if (!isDev) {
      if (!EMAIL_REGEX.test(rawEmail)) {
        return jsonResponse(
          { ok: false, error: 'Masukkan email pembelian untuk memverifikasi pindah perangkat mandiri.' },
          400
        );
      }
      if (reg.ownerEmail && reg.ownerEmail !== rawEmail) {
        return jsonResponse(
          {
            ok: false,
            code: 'EMAIL_MISMATCH',
            error: 'Email tidak sesuai dengan email yang terdaftar saat aktivasi pertama kode ini.'
          },
          403
        );
      }
    }

    const finalName = rawName || (isDev ? 'Developer Klip Auto' : 'Kreator Klip Auto');
    const finalEmail = rawEmail || reg.ownerEmail || (isDev ? 'dev@klipauto.local' : '');
    const nextGen = (reg.generation || 1) + 1;

    await writeDeviceRegistry(licEntry.id, {
      licenseId: licEntry.id,
      generation: nextGen,
      ownerEmail: finalEmail,
      devices: [{ id: deviceId, label: deviceLabel, boundAt: Date.now() }]
    });

    const exp = Date.now() + SEVEN_DAYS_SEC * 1000;
    const tokenPayload = {
      sub: licEntry.id,
      tier: licEntry.tier || 'inti',
      role: licEntry.role || 'buyer',
      name: finalName,
      email: finalEmail,
      deviceId,
      gen: nextGen,
      exp
    };
    const token = await createSignedSessionToken(tokenPayload, cfg.hmacSecret);

    return jsonResponse(
      {
        ok: true,
        transferred: true,
        user: { name: finalName, email: finalEmail, role: tokenPayload.role },
        tier: tokenPayload.tier,
        tierLabel: getTierLabel(tokenPayload.tier),
        features: buildPackageFeatures(tokenPayload.tier),
        leaseExpiresAt: exp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(token, isHttps) }
    );
  }

  /* 5. VERIFIKASI SESI AKTIF & PENYEGARAN PAKET TANPA INSTALL ULANG */
  if (url.pathname === '/api/license/verify' && request.method === 'GET') {
    const rawCookie = readCookieValue(request, SESSION_COOKIE_NAME);
    if (!rawCookie) {
      return jsonResponse({ ok: false, code: 'NO_VALID_SESSION' }, 200);
    }
    const verified = await verifySignedSessionToken(rawCookie, cfg.hmacSecret);
    if (!verified) {
      return jsonResponse(
        { ok: false, code: 'SESSION_EXPIRED' },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    const reqDeviceId = url.searchParams.get('deviceId') || verified.deviceId;
    if (reqDeviceId !== verified.deviceId) {
      return jsonResponse(
        {
          ok: false,
          code: 'DEVICE_MISMATCH',
          error: 'Sesi ini terikat pada perangkat lain.'
        },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    const reg = await readDeviceRegistry(verified.sub);
    if (
      reg.devices.length > 0 &&
      ((reg.generation && verified.gen && verified.gen < reg.generation) ||
        !reg.devices.some((d) => d.id === verified.deviceId))
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'REVOKED_TRANSFERRED',
          error: 'Lisensi ini telah dipindahkan ke perangkat lain.'
        },
        401,
        { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
      );
    }

    // Cek tier terbaru berdasarkan ID lisensi di server sehingga upgrade paket langsung terbuka tanpa install ulang!
    const liveEntry =
      Object.values(cfg.licenses).find((item) => item && item.id === verified.sub) || null;
    const currentTier = liveEntry?.tier || verified.tier || 'inti';
    const refreshedExp = Date.now() + SEVEN_DAYS_SEC * 1000;

    const refreshedToken = await createSignedSessionToken(
      { ...verified, tier: currentTier, exp: refreshedExp },
      cfg.hmacSecret
    );

    return jsonResponse(
      {
        ok: true,
        user: {
          name: verified.name,
          email: verified.email,
          role: verified.role
        },
        tier: currentTier,
        tierLabel: getTierLabel(currentTier),
        features: buildPackageFeatures(currentTier),
        leaseExpiresAt: refreshedExp
      },
      200,
      { 'Set-Cookie': formatSessionCookieHeader(refreshedToken, isHttps) }
    );
  }

  /* 6. LEPAS PERANGKAT SAAT INI / KELUAR */
  if (
    (url.pathname === '/api/license/release' || url.pathname === '/api/license/logout') &&
    request.method === 'POST'
  ) {
    const rawCookie = readCookieValue(request, SESSION_COOKIE_NAME);
    const verified = await verifySignedSessionToken(rawCookie, cfg.hmacSecret);

    if (verified && url.pathname === '/api/license/release') {
      const reg = await readDeviceRegistry(verified.sub);
      const remaining = reg.devices.filter((d) => d.id !== verified.deviceId);
      await writeDeviceRegistry(verified.sub, {
        ...reg,
        generation: (reg.generation || 1) + 1,
        devices: remaining
      });
    }

    return jsonResponse(
      { ok: true },
      200,
      { 'Set-Cookie': formatSessionCookieHeader('', isHttps, 0) }
    );
  }

  return jsonResponse({ ok: false, error: 'Endpoint server tidak ditemukan.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // Kunci kode aplikasi inti di belakang verifikasi sesi lisensi server!
    if (isProtectedAppAsset(url.pathname)) {
      const cfg = parseLicenseServerConfig(env);
      const cookieVal = readCookieValue(request, SESSION_COOKIE_NAME);
      const validSession = cfg ? await verifySignedSessionToken(cookieVal, cfg.hmacSecret) : null;

      if (!validSession) {
        return jsonResponse(
          {
            ok: false,
            code: 'AUTH_REQUIRED',
            error: 'Kode aplikasi Klip Auto hanya dikirim setelah lisensi tervalidasi di server.'
          },
          401
        );
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    if (isProtectedAppAsset(url.pathname)) {
      headers.set('Cache-Control', 'private, no-store');
    }

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers
    });
  }
};

/**
 * Klip Auto — Service Worker Pendukung Pemakaian Offline Pasca-Aktivasi
 * Hanya menyimpan cache mesin aplikasi SETELAH lisensi tervalidasi di server,
 * dan langsung menghapus cache mesin saat pengguna keluar atau memindahkan lisensi.
 */

const SHELL_CACHE = 'klip-auto-shell-v2';
const AUTH_ENGINE_CACHE = 'klip-auto-engine-v2';

const PUBLIC_SHELL_URLS = [
  './',
  './index.html',
  './styles.css',
  './auth-boot.js',
  './engine/license-client.js',
  './engine/device-checker.js'
];

const AUTHENTICATED_ENGINE_URLS = [
  './wizard-controller.js',
  './vendor/mediabunny.min.mjs',
  './data/creator-library.js',
  './data/sample-host.mp3',
  './data/sample-guest.mp3',
  './engine/audio-processor.js',
  './engine/vocal-aligner.js',
  './engine/transcriber-moments.js',
  './engine/caption-presets.js',
  './engine/face-tracker.js',
  './engine/mp4-exporter.js',
  './engine/ai-clip-agent.js',
  './engine/youtube-downloader.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PUBLIC_SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== AUTH_ENGINE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const type = event.data?.type;
  if (type === 'WARM_AUTHENTICATED_ASSETS') {
    event.waitUntil(
      caches.open(AUTH_ENGINE_CACHE).then(async (cache) => {
        for (const url of AUTHENTICATED_ENGINE_URLS) {
          try {
            const res = await fetch(url, { credentials: 'same-origin', cache: 'reload' });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch {}
        }
      })
    );
  } else if (type === 'PURGE_AUTHENTICATED_ASSETS') {
    event.waitUntil(caches.delete(AUTH_ENGINE_CACHE));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Network-first saat online agar update selalu segar; otomatis jatuh ke cache saat offline!
  event.respondWith(
    fetch(req)
      .then((netRes) => {
        if (netRes && netRes.ok) {
          const clone = netRes.clone();
          const targetCache =
            url.pathname.includes('/engine/') &&
            !url.pathname.endsWith('license-client.js') &&
            !url.pathname.endsWith('device-checker.js')
              ? AUTH_ENGINE_CACHE
              : url.pathname.endsWith('wizard-controller.js') ||
                url.pathname.includes('/vendor/') ||
                url.pathname.includes('/data/')
              ? AUTH_ENGINE_CACHE
              : SHELL_CACHE;
          caches.open(targetCache).then((c) => c.put(req, clone)).catch(() => {});
        }
        return netRes;
      })
      .catch(async () => {
        const fromEngine = await caches.open(AUTH_ENGINE_CACHE).then((c) => c.match(req));
        if (fromEngine) return fromEngine;
        const fromShell = await caches.open(SHELL_CACHE).then((c) => c.match(req));
        if (fromShell) return fromShell;
        if (req.mode === 'navigate') {
          const rootMatch = await caches.open(SHELL_CACHE).then((c) => c.match('./index.html'));
          if (rootMatch) return rootMatch;
        }
        throw new Error('Offline dan aset belum tersimpan.');
      })
  );
});

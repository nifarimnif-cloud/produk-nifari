/**
 * Klip Auto Companion Bridge — Content Script
 * Menyambungkan halaman web Klip Auto Studio dengan Service Worker ekstensi lokal
 * agar pembacaan link YouTube berjalan 100% lewat internet pembeli sendiri.
 */
(function () {
  const BRIDGE_VERSION = '2.1.0';
  try {
    document.documentElement.setAttribute('data-klip-yt-bridge', BRIDGE_VERSION);
  } catch {}

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.channel !== 'KLIP_AUTO_YT_REQ') {
      return;
    }

    const { requestId, action, payload } = event.data;
    if (action === 'PING') {
      window.postMessage(
        {
          channel: 'KLIP_AUTO_YT_RES',
          requestId,
          ok: true,
          version: BRIDGE_VERSION
        },
        '*'
      );
      return;
    }

    chrome.runtime.sendMessage({ action, payload }, (response) => {
      const runtimeErr = chrome.runtime.lastError;
      if (runtimeErr) {
        window.postMessage(
          {
            channel: 'KLIP_AUTO_YT_RES',
            requestId,
            ok: false,
            error: runtimeErr.message || 'Jembatan ekstensi tidak merespons.'
          },
          '*'
        );
        return;
      }
      window.postMessage(
        {
          channel: 'KLIP_AUTO_YT_RES',
          requestId,
          ...(response || { ok: false, error: 'Respons kosong dari ekstensi.' })
        },
        '*'
      );
    });
  });
})();

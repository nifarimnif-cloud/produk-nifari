/**
 * Klip Auto — Pemula Publik (Layar Aktivasi Lisensi, Pindah Perangkat, Cek Perangkat Sebelum Beli)
 * File aplikasi utama (`wizard-controller.js` beserta mesin pemotong) HANYA dimuat dari server
 * setelah lisensi pembeli dinyatakan sah oleh server.
 */

import { runDeviceReadinessCheck } from './engine/device-checker.js';
import {
  activateLicense,
  checkServerVersionInfo,
  transferLicenseToThisDevice,
  verifyCurrentLicense
} from './engine/license-client.js';

let studioBooted = false;
let pendingTransferCredentials = null;

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function registerOfflineServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw-offline.js', { scope: './' });
  } catch {
    // Abaikan jika browser membatasi Service Worker di mode penyamaran
  }
}

async function loadAndBootAuthenticatedStudio(session) {
  if (studioBooted) return;
  studioBooted = true;

  const submitBtn = document.querySelector('#login-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memuat Ruang Studio...';
  }

  try {
    const studioModule = await import('./wizard-controller.js');
    if (typeof studioModule.bootStudioWithSession === 'function') {
      await studioModule.bootStudioWithSession(session);
    }
  } catch (err) {
    studioBooted = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk ke Klip Auto Studio';
    }
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = `Gagal memuat modul aplikasi dari server: ${
        err?.message || 'Periksa koneksi internet lalu coba lagi.'
      }`;
    }
  }
}

export async function renderDeviceCheckIntoContainer(containerEl) {
  if (!containerEl) return null;
  containerEl.innerHTML = `<p class="muted-copy" style="font-size:13.5px;">Memeriksa sistem operasi, browser, RAM, GPU/CPU WebCodecs, dan ruang disk...</p>`;
  const report = await runDeviceReadinessCheck();

  const badgeBg =
    report.verdictTone === 'ok' ? 'var(--color-electric-lime)' : 'var(--surface-parchment)';
  containerEl.innerHTML = `
    <div style="padding:12px 14px;border-radius:10px;background:${badgeBg};color:#14140f;border:1px solid #14140f;margin-bottom:14px;font-weight:700;font-size:14px;">
      Status Kesiapan: ${esc(report.verdict)}
    </div>
    <div class="device-check-grid" style="display:grid;gap:10px;font-size:13.5px;">
      <div class="parchment-card" style="margin:0;padding:11px 13px;">
        <strong>Sistem Operasi:</strong> ${esc(report.os)}
      </div>
      <div class="parchment-card" style="margin:0;padding:11px 13px;">
        <strong>Browser Saat Ini:</strong> ${esc(report.browser.name)} — <span>${esc(report.browser.note)}</span>
      </div>
      <div class="parchment-card" style="margin:0;padding:11px 13px;">
        <strong>Memori (RAM):</strong> ${esc(report.ram.label)}
      </div>
      <div class="parchment-card" style="margin:0;padding:11px 13px;">
        <strong>Akselerasi GPU / CPU:</strong> ${esc(report.gpu.label)}
      </div>
      <div class="parchment-card" style="margin:0;padding:11px 13px;">
        <strong>Sisa Ruang Disk Kerja:</strong> ${esc(report.disk.label)}
      </div>
      <div style="font-size:12.5px;color:var(--color-graphite);line-height:1.5;">
        <strong>Daftar Browser yang Didukung Penuh:</strong> ${esc(report.supportedBrowsersInfo)}
      </div>
    </div>
  `;
  return report;
}

function setupLoginDeviceCheckModal() {
  const modal = document.getElementById('modal-device-check');
  const body = document.getElementById('device-check-results');
  const openBtn = document.getElementById('btn-open-device-check');
  const closeBtn = document.getElementById('btn-close-device-check');

  const openModal = async () => {
    if (!modal) return;
    modal.classList.add('open');
    await renderDeviceCheckIntoContainer(body);
  };

  if (openBtn) {
    openBtn.addEventListener('click', openModal);
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  if (window.location.hash === '#cek-perangkat') {
    openModal();
  }
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const transferBox = document.getElementById('login-transfer-box');
  const transferHint = document.getElementById('login-transfer-hint');
  const transferBtn = document.getElementById('btn-login-self-transfer');

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (errEl) errEl.style.display = 'none';
    if (transferBox) transferBox.style.display = 'none';

    const name = document.getElementById('login-name')?.value || '';
    const email = document.getElementById('login-email')?.value || '';
    const code = document.getElementById('login-code')?.value || '';

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memeriksa Lisensi di Server...';
    }

    try {
      const session = await activateLicense({ name, email, code });
      await loadAndBootAuthenticatedStudio(session);
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk ke Klip Auto Studio';
      }
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = err?.message || 'Gagal mengaktifkan lisensi.';
      }
      if (err?.canSelfTransfer && transferBox) {
        pendingTransferCredentials = { name, email, code };
        if (transferHint) {
          transferHint.textContent = err.currentDeviceHint
            ? `Perangkat terdaftar saat ini: ${err.currentDeviceHint}. Memindahkan akses akan menonaktifkan perangkat lama secara otomatis.`
            : 'Memindahkan akses akan menonaktifkan sesi pada laptop sebelumnya.';
        }
        transferBox.style.display = 'block';
      }
    }
  });

  if (transferBtn) {
    transferBtn.addEventListener('click', async () => {
      const name = document.getElementById('login-name')?.value || pendingTransferCredentials?.name || '';
      const email = document.getElementById('login-email')?.value || pendingTransferCredentials?.email || '';
      const code = document.getElementById('login-code')?.value || pendingTransferCredentials?.code || '';

      transferBtn.disabled = true;
      transferBtn.textContent = 'Memindahkan Lisensi ke Laptop Ini...';
      if (errEl) errEl.style.display = 'none';

      try {
        const session = await transferLicenseToThisDevice({ name, email, code });
        if (transferBox) transferBox.style.display = 'none';
        await loadAndBootAuthenticatedStudio(session);
      } catch (err) {
        transferBtn.disabled = false;
        transferBtn.textContent = 'Pindah Perangkat Mandiri ke Laptop Ini';
        if (errEl) {
          errEl.style.display = 'block';
          errEl.textContent = err?.message || 'Gagal memindahkan lisensi ke perangkat ini.';
        }
      }
    });
  }
}

async function initPublicBoot() {
  // Terapkan tema tersimpan lebih awal agar tidak berkedip
  try {
    const savedTheme = localStorage.getItem('klip_auto_theme_v2');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch {}

  await registerOfflineServiceWorker();
  setupLoginDeviceCheckModal();
  setupLoginForm();

  // Cek versi aplikasi dari server di latar belakang
  checkServerVersionInfo().then((vInfo) => {
    if (!vInfo) return;
    window.__KLIP_SERVER_VERSION_INFO = vInfo;
    const verEl = document.getElementById('login-version-note');
    if (verEl) {
      verEl.textContent = vInfo.hasNewerVersion
        ? `Pembaruan tersedia: v${vInfo.version} (Muat ulang halaman untuk memperbarui)`
        : `Versi aplikasi aktif: v${vInfo.version} · Mendukung Chrome & Edge`;
    }
  });

  // Periksa apakah sesi perangkat ini sudah tervalidasi di server (atau dalam masa aktif offline 7 hari)
  const check = await verifyCurrentLicense();
  if (check.ok && check.session) {
    await loadAndBootAuthenticatedStudio(check.session);
  } else if (check.message) {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = check.message;
    }
  }
}

initPublicBoot();

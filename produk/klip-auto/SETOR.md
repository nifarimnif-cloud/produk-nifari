# SETOR PRODUK #3 — Klip Auto Studio v2.1

## 1. Profil Produk & Skema Paket Harga
- **Nama Produk:** Klip Auto Studio — Tempel Link atau Pilih Video Panjang Jadi Klip 9:16 Sinkron Vokal di Browser (`v2.1.0`)
- **Siapa Pembelinya:** Kreator konten TikTok/Reels/Shorts, podcaster, tim dokumentasi webinar/kajian, pemilik UMKM, serta penyedia jasa *clipping* video pendek di Indonesia yang memakai laptop Windows maupun macOS (termasuk laptop kantor RAM 8 GB).
- **Masalah Utama yang Diselesaikan:**
  1. Memotong rekaman podcast atau diskusi berdurasi **60–120+ menit** menjadi klip vertikal 9:16 biasanya menyita waktu berjam-jam untuk mencari menit pembicaraan yang kuat, mengatur posisi 1 atau 2 wajah agar tidak terpotong di tengah, dan menggeser timing subtitle yang meleset dari suara pembicara.
  2. Alat lama mewajibkan instalasi terminal rumit (`FFmpeg` / `yt-dlp`) atau bergantung pada layanan unduh pihak ketiga yang sering mati, sementara layanan *cloud* luar memungut biaya langganan bulanan berulang dan membatasi kuota menit.
  3. **Klip Auto Studio v2.1** bekerja **100% di browser perangkat pembeli** (biaya server per klip mendekati nol): fitur **"Tempel link, jadi klip"** membaca video, subtitle, dan grafik Most-Replayed langsung lewat koneksi internet perangkat pembeli sendiri (dengan fallback ramah ke file lokal `.mp4`, `.mov`, `.mkv` kapan pun dibutuhkan), mentranskripsi video tanpa subtitle memakai **`Xenova/whisper-small`** (Bahasa Indonesia + istilah Inggris), mengunci tiap kata presisi **`10ms`** ke gelombang vokal pembicara (`165–3750 Hz`), mendeteksi otomatis 1 atau 2 wajah (**Fullscreen Tengah** & **Podcast Split atas-bawah** tanpa keyframe manual), serta mengekspor MP4 bersih tanpa watermark dengan akselerasi GPU dan cadangan CPU otomatis.
- **Skema Harga Sekali Bayar (Tanpa Kuota & Tanpa Langganan):**
  - **Paket Inti — Rp99.000 (Sekali Bayar):** Tempel link atau pilih file lokal hingga 60–120+ menit, pemotong batch 5–10 klip otomatis berisolasi error, skor jujur 4 sinyal, penyelaras vokal `10ms` + `Whisper-Small` (ID & EN), deteksi otomatis 1/2 wajah (Fullscreen, Podcast Split, Cinema Blur), 6 gaya caption populer, judul pembuka 3 detik yang bisa diedit, ekspor MP4 720p/1080p **tanpa watermark**, 140 pustaka referensi kreator, sewa offline 7 hari, dan pindah perangkat mandiri (1 laptop aktif).
  - **Paket Tambahan (Order Bump di Halaman Checkout) — +Rp49.000 (Total Rp148.000):** Membuka fitur pasang logo PNG / teks watermark channel sendiri + 2 gaya caption ekstra (* Sorot Elektrik* & * Fokus Kata*).
  - **Paket Pro (Kesiapan Ekspansi Agensi/Editor):** Mendukung antrean *Batch Multi-Video* sekaligus, mode framing *Gaming Split* (facecam atas + layar permainan bawah), dan aktivasi beberapa perangkat.

---

## 2. Link Live (Cloudflare Pages)
- **Link Landing Page (LP Jualan):** [https://nifari-klip-auto-lp.pages.dev](https://nifari-klip-auto-lp.pages.dev)
- **Link Web App (Aplikasi Pembeli):** [https://nifari-klip-auto-app.pages.dev](https://nifari-klip-auto-app.pages.dev)
  - *Keamanan Lisensi & Aset Server:* Kode lisensi, hash, maupun salt **tidak disimpan di kode sumber aplikasi atau repositori**, melainkan divalidasi di server melalui konfigurasi rahasia terenkripsi (`KLIP_AUTO_LICENSE_CONFIG`). File mesin aplikasi inti (`/wizard-controller.js`, `/engine/*`, `/vendor/*`, `/data/*`) dikunci oleh server (`401 AUTH_REQUIRED`) hingga lisensi dinyatakan sah, mengikat 1 perangkat aktif dengan fitur **Pindah Perangkat Mandiri**, serta menyediakan masa sewa kerja offline terenkripsi selama 7 hari.

---

## 3. Tangkapan Layar Aplikasi (Desktop + HP — Bebas Wajah Tokoh Publik)

### Desktop 1 — Beranda Studio, Status Paket, & Pintasan "Tempel Link, Jadi Klip"
![Beranda Klip Auto Studio](./screenshots/02-dashboard-desktop.png)

### Desktop 2 — Jembatan Link YouTube Lewat Internet Pembeli Sendiri + Pilihan File Lokal
![Tempel Link YouTube Lewat Internet Perangkat Sendiri](./screenshots/07-youtube-downloader-desktop.png)

### Desktop 3 — Pemotong Batch Klip 9:16 Otomatis dengan Isolasi Error Per Klip
![Hasil Batch Klip 9:16 Otomatis](./screenshots/08-ai-agent-results-desktop.png)

### Desktop 4 — Penyelaras Vokal Presisi 10ms (`165–3750 Hz`) & Kalibrasi Ketukan Kata
![Gelombang Sinkron Vokal 10ms dan Editor Teks](./screenshots/04-wizard-step2-desktop.png)

### Desktop 5 — Deteksi Otomatis 2 Wajah (Podcast Split Atas-Bawah) & Gaya Caption
![Deteksi Otomatis 2 Wajah Podcast Split](./screenshots/05-wizard-step3-desktop.png)

### Tampilan HP (`390×844`) — Navigasi Bawah Rapi & Presisi `scrollWidth = 390px`
![Tampilan Mobile 390px Klip Auto Studio](./screenshots/06-mobile-390px.png)

---

## 4. Ringkasan Pengujian Nyata & Bukti
Seluruh pengujian dijalankan di **Google Chrome 156** dan didokumentasikan secara jujur beserta file bukti asli di [`HASIL-TES.md`](./HASIL-TES.md) dan folder [`./bukti-tes/`](./bukti-tes/):
- **Podcast YouTube Asli 78,5 Menit (`4.710 detik`):** Diimpor lewat internet lokal dalam `59,88 dtk` (`JS Heap: 33,7 MB`), mengunci `25` pulau vokal `10ms`, dan merender 3 klip MP4 `720×1280` (GPU `4,46 dtk` & `3,09 dtk`, serta fallback CPU `prefer-software` `4,61 dtk` dengan puncak `JS Heap` `80,5 MB`).
- **Rekaman Lokal 22 Menit Tanpa Subtitle (Bahasa Indonesia + Istilah Inggris):** Ditranskripsi oleh **`Xenova/whisper-small` (`WebGPU`)**, dikunci ke gelombang suara vokal `10ms`, dan dirender ke mode **Podcast Split**, **Fullscreen**, serta **Cinema Blur** dengan judul pembuka hilang tepat setelah 3 detik.
- **Ketahanan Error, Lisensi Server, Pindah Laptop Mandiri, & Mode Offline:** Seluruh skenario gagal link, internet putus, disk hampir penuh (`< 65 MB`), laporan error tersanitasi (`POST /api/error-report`), penolakan kode salah, pindah perangkat mandiri, dan sewa offline 7 hari lulus verifikasi nyata.

# SETOR PRODUK #3 — Klip Auto Studio

## 1. Profil Produk & Usulan Harga
- **Nama Produk:** Klip Auto Studio — Pemotong Video Panjang & Link YouTube Jadi Klip 9:16 Siap Upload di Browser
- **Siapa Pembelinya:** Kreator konten TikTok/Reels/Shorts, podcaster, tim media masjid/kajian, penyelenggara webinar/kelas online, serta freelancer jasa *clipping* video pendek di Indonesia.
- **Masalah Apa yang Diselesaikan:**
  1. Mengubah rekaman podcast, wawancara, atau kajian 10–30 menit menjadi klip vertikal 9:16 biasanya memakan waktu berjam-jam untuk mencari menit menarik, menggeser wajah pembicara kiri-kanan, dan mengetik caption satu per satu.
  2. Alat pemotong lama mewajibkan instalasi Node.js, FFmpeg, dan `yt-dlp` lewat terminal yang rawan gagal atau diblokir antivirus laptop pembeli, sementara layanan cloud luar mematok langganan bulanan mahal.
  3. Di **Klip Auto Studio**, pembeli cukup membuka browser, **menempelkan link YouTube langsung** untuk mengunduh file `.MP4` utuh (`360p` s/d `1080p` bebas error `403`), lalu begitu file video dimasukkan ke Studio, **AI Agent Pemotong Klip 9:16 Otomatis** langsung bekerja sendiri dari awal sampai akhir: mencocokkan transkrip kata otomatis, mengkurasi momen skor tertinggi, mengunci fokus wajah di tengah, menjernihkan suara vokal podcast (`48 kHz Stereo`), hingga merender galeri klip `.MP4` vertikal siap tayang!
- **Harga Jual yang Diusulkan:** **Rp149.000** (sekali bayar untuk akses penuh Studio di browser tanpa biaya langganan bulanan & tanpa batas kuota render).

---

## 2. Link Live (Cloudflare Pages)
- **Link Landing Page (LP Jualan):** [https://nifari-klip-auto-lp.pages.dev](https://nifari-klip-auto-lp.pages.dev)
- **Link Web App (Aplikasi Pembeli):** [https://nifari-klip-auto-app.pages.dev](https://nifari-klip-auto-app.pages.dev)
  - *Cara masuk cepat untuk penguji:* Klik tombol **Isi Cepat Akun Contoh Pembeli** di layar masuk (atau gunakan kode lisensi `KLIP-AUTO-2026`), lalu klik **Masuk ke Klip Auto Studio**.

---

## 3. Tangkapan Layar Aplikasi (Desktop + HP)

### Desktop 1 — Beranda Komando Studio & Pintasan Link YouTube
![Beranda Klip Auto Studio](./screenshots/02-dashboard-desktop.png)

### Desktop 2 — Pengunduh & Pengimpor Link Video YouTube Langsung (MP4 Anti-403 + Transkrip Otomatis)
![Impor dan Unduh Video dari Link YouTube](./screenshots/07-youtube-downloader-desktop.png)

### Desktop 3 — AI Agent Pemotong Klip 9:16 Otomatis (Begitu Video Dimasukkan Langsung Render)
![AI Agent Pemotong Klip 9:16 Otomatis](./screenshots/08-ai-agent-results-desktop.png)

### Desktop 4 — Kurasi Momen Ber-Skor, Pemutar Suara Momen & Studio 9:16 + Penjernih Vokal 48 kHz
![Studio 9:16 dan Penjernih Suara Podcast](./screenshots/05-wizard-step3-desktop.png)

### Tampilan HP (Lebar 390px) — Navigasi Bawah Rapi & Tanpa Geser Samping
![Tampilan Mobile 390px Klip Auto Studio](./screenshots/06-mobile-390px.png)

---

## 4. Apa yang Sudah Dites & Hasilnya

Seluruh pengujian dijalankan di **Google Chrome asli** pada ukuran Desktop (`1366×860`) dan HP (`390×844`):

| Bagian yang Dites | Skenario Pengujian | Hasil |
| :--- | :--- | :--- |
| **Pengunduh MP4 Link YouTube Bebas Blokir (Anti-403)** | Tempel link YouTube berdurasi panjang (`youtu.be/n4noW5Skqgg`, `23:48`, `2.554` kata Bahasa Indonesia) maupun podcast HD, pilih `480p` / `720p HD`, klik **Simpan Video YouTube (.MP4)** ke perangkat & **Muat & Potong Otomatis** | **Lulus** — Aliran `.MP4` utuh (`video/mp4`, header `ftypisom`) terunduh lancar langsung lewat pengunduh browser dengan `0` error `403`. |
| **AI Agent Pemotong Klip 9:16 Otomatis (`ai-clip-agent.js`)** | Masukkan file `.MP4` hasil unduhan YouTube ke kotak unggah video tanpa klik tombol tambahan | **Lulus** — AI Agent otomatis aktif, mencocokkan cache transkrip `2.554` kata dalam `< 0,1 dtk`, memilih momen terbaik, melacak wajah ke tengah `9:16`, dan merender klip-klip `.MP4` `720×1280` siap tonton & unduh. |
| **Kualitas Suara Contoh & Penjernih Vokal 48 kHz** | Muat Video Contoh 2 Pembicara (`20 dtk`), putar suara di Langkah 2 & Langkah 3, atur Volume (`0%–200%`), aktifkan Penjernih Vokal (High-pass `85 Hz` + Presence `3.1 kHz` + Kompresor) & penyeimbang mic sebelah | **Lulus** — Suara percakapan Bahasa Indonesia asli 2 pembicara terdengar jernih (`48.000 Hz` Stereo, RMS vokal sehat, tanpa dengung/bunyi robotik). |
| **Render & Ekspor Klip `.MP4` 9:16** | Render potongan video YouTube menjadi `.MP4` vertikal `720×1280` dengan caption per kata, judul atas, watermark, & volume `125%` | **Lulus** — File `.MP4` (`H.264` + `AAC 48 kHz Stereo`, `audioPeak 0.898`) berhasil dibuat dalam ~4 detik dan siap diputar/diunduh. |
| **Pustaka 140 Koleksi Kreator** | Cari topik, filter ceruk kreator, buka detail contoh, salin teks, & pasang ke Judul Atas Klip | **Lulus** — 140 koleksi hook, pembuka, caption, & prompt berjalan responsif lengkap fitur favorit & riwayat. |
| **Responsif HP (`390px`) & Desain *Perk Electric Lime*** | Cek `scrollWidth` pada ukuran `390×844` (Mode Terang & Mode Gelap), audit warna (`#beff50`, `#f5f5eb`, `#14140f`), sudut `28px`, 0 bayangan, & 0 emoji | **Lulus** — `scrollWidth = 390px` presisi tanpa geser samping, `0` emoji, dan `0` error runtime. |

# Rencana Arsitektur Klip Auto

Dokumen ini menjelaskan cara kerja **Klip Auto** versi baru supaya pembeli bisa mengubah video panjang (10–30 menit) menjadi klip pendek vertikal **9:16** lengkap dengan caption per kata, wajah tetap di tengah, judul atas, dan logo/watermark — **langsung dari browser tanpa install aplikasi tambahan**.

---

## 1. Keputusan Utama: 100% Jalan di Browser (Tanpa Install)

Versi lama mengharuskan pembeli install Node.js, FFmpeg, dan `yt-dlp` di komputer. Akibatnya banyak pembeli gagal pakai karena terblokir antivirus Windows, salah versi Node, atau muncul error terminal.

Di versi baru ini, **Klip Auto berjalan 100% di dalam browser web** (Chrome / Edge / Safari modern):
- **Pembeli cukup buka link web**, login, pilih file video dari laptop/HP, lalu unduh hasil klip `.mp4`.
- **Tidak perlu install apa pun** — tidak ada file `.exe` / `.dmg` yang dicurigai antivirus.
- **Biaya server Rp0** — meskipun dipakai ratusan pembeli sekaligus, server tidak akan penuh karena pemrosesan video memakai tenaga perangkat pembeli sendiri.

*(Catatan cadangan: Jika di tengah pengujian nanti ada kendala pada browser lama, aplikasi web ini sudah berstandar PWA/web statis yang bisa dibungkus jadi aplikasi desktop sekali klik kapan saja, tapi target utama kita tetap 100% mulus langsung di browser).*

---

## 2. Pembagian Kerja: Apa yang di Browser vs Apa yang di Server

### A. Yang Jalan di Server (Cloudflare Pages)
Server **hanya menyajikan halaman web dan file aset aplikasi** lewat **Cloudflare Pages (`*.pages.dev`)**.

Kenapa video **tidak** diproses di server?
1. **Ukuran file besar:** Video podcast 10–30 menit biasanya berukuran **200 MB – 1,5 GB**. Kalau harus upload dulu ke server pakai internet Indonesia, pembeli bakal menunggu lama sebelum proses mulai.
2. **Batas server gratis & biaya:** Server gratis (seperti Cloudflare Workers) punya batas memori (128 MB) dan batas waktu eksekusi singkat, sehingga tidak mungkin merender video panjang. Menyewa server GPU khusus juga akan memakan biaya bulanan terus-menerus.
3. **Privasi pembeli:** Rekaman rapat, webinar berbayar, atau podcast yang belum rilis tetap aman di perangkat pembeli sendiri.

Di Cloudflare Pages kita cukup memasang pengaturan `_headers` (`Cross-Origin-Opener-Policy: same-origin` dan `Cross-Origin-Embedder-Policy: credentialless`) supaya fitur akselerasi cepat di browser (`WebAssembly` & `WebGPU`) aktif maksimal.

---

### B. Yang Jalan di Browser Pembeli (Mesin Utama)

Supaya browser **tidak berat atau kehabisan RAM** saat membuka video 10–30 menit, alurnya dibagi menjadi 5 tahap hemat memori:

#### Tahap 1 — Input Video Lokal, Pengunduh Link YouTube Anti-403 & AI Agent Pemotong Otomatis
- **Jalur Cepat Link YouTube Bebas Blokir (`_worker.js` + `youtube-downloader.js`):** Pembeli cukup menempelkan link YouTube (`watch?v=`, `youtu.be/`, `shorts/`, `live/`) untuk melihat thumbnail, durasi, pilihan kualitas MP4 (`360p Cepat`, `480p`, `720p HD`, `1080p Full HD`), serta menarik transkrip kata otomatis langsung dari YouTube. Menggabungkan konverter MP4 non-IP-locked + *streaming proxy* aman sehingga bebas dari error `403` CDN YouTube pada video panjang (20–60 menit) tanpa membebani RAM browser.
- **Cache Pintar Transkrip YouTube (`klip_auto_yt_cache_v1`):** Begitu pembeli memeriksa atau mengunduh video dari YouTube lalu memasukkan file `.MP4` hasil unduhannya ke kotak unggah video, sistem mengenali file tersebut dalam `< 0,1 detik` dan langsung memasang ribuan kata transkrip Bahasa Indonesia aslinya tanpa perlu transkrip ulang.
- **AI Agent Pemotong Klip 9:16 Otomatis (`ai-clip-agent.js`):** Begitu file video dimasukkan, **AI Agent** langsung bekerja sendiri dari awal hingga akhir (4 tahap otonom: *01 Pindai Transkrip* → *02 Kurasi Momen & Judul Hook* → *03 Kunci Wajah Tengah & Vokal 48 kHz* → *04 Render MP4 Berurutan*), menampilkan galeri klip vertikal `9:16` siap putar & siap simpan tanpa harus klik bolak-balik antar langkah.
- **Jalur File Video Lokal (`.mp4`, `.mov`, `.webm`, `.mkv`):** Browser membaca file langsung dari penyimpanan memakai *file pointer* (`BlobSource` + pembacaan per potong), **bukan** menyalin seluruh file bergiga-giga ke dalam RAM.
- **Penjernih Vokal Podcast 48 kHz Stereo (`audio-processor.js`):** Dilengkapi dekoder cadangan Web Audio API otomatis, penyeimbang mic sebelah (mono kiri/kanan ke stereo penuh), peredam dengung 85 Hz, *vocal presence* 3.1 kHz, kompresor dinamis, pengatur volume 0%–200% dengan pembatas lembut (*soft limiter*), serta contoh rekaman 2 pembicara berbahasa Indonesia asli.

#### Tahap 2 — Ambil Suara Ringan dari Video Panjang
- Untuk dianalisis AI, kita tidak perlu mengirim gambar video bergiga-giga — cukup suaranya saja.
- Mesin di browser mengekstrak jalur audio dari video 10–30 menit (tanpa mendekode gambar video) menjadi audio mono ringan 16 kHz (~3–7 MB untuk durasi 20 menit). Proses ini hanya memakan waktu beberapa detik.

#### Tahap 3 — Transkrip Otomatis & Pilih 5–10 Momen Menarik (Biaya AI Rp0 dari Kita)
Kita sediakan **2 pilihan mode** supaya pembeli tetap bisa pakai secara gratis dan kita tidak menanggung tagihan API:

1. **Mode Cepat — BYOK Gemini API Key Gratis (Rekomendasi Utama):**
   - Pembeli memasukkan API Key Gemini gratis dari Google AI Studio (disimpan **khusus di `localStorage` browser pembeli**, tidak pernah dikirim ke server kita).
   - Audio ringan dikirim langsung dari browser pembeli ke Gemini Flash.
   - Dalam ~15–30 detik untuk podcast 20 menit, Gemini langsung mengembalikan:
     - Transkrip lengkap per bagian waktu.
     - **5–10 momen paling menarik** lengkap dengan **skor (1–100)**, **usulan judul atas (hook)**, **alasan kenapa bagian ini menarik**, serta **titik waktu mulai & selesai** (durasi ideal 25–60 detik).
2. **Mode Mandiri Tanpa API Key — Whisper Web di Browser:**
   - Bagi pembeli yang belum mau membuat API key, transkrip suara dijalankan murni di dalam browser memakai model **Whisper Web (`@huggingface/transformers` via WebGPU/WASM)** untuk bahasa Indonesia.
   - Setelah teks transkrip keluar, sistem memilih momen menarik menggunakan rumus skor kepadatan kalimat pancingan (*hook*, kalimat tanya, penekanan angka/cerita), ditambah tombol **Hand-off 1-Klik** kalau pembeli ingin menempelkan transkripnya ke ChatGPT/Gemini biasa untuk dikurasi.

#### Tahap 4 — Geser Titik Potong & Sinkronisasi Caption Per Kata
- Pembeli melihat daftar 5–10 momen pilihan AI, memutar *preview*-nya langsung, dan **bisa menggeser titik awal maupun titik akhir** (slider detik per detik).
- Begitu 1 momen dipilih (misalnya durasi 45 detik), sistem menyelaraskan waktu **per kata** khusus pada potongan suara 45 detik tersebut (menggunakan *word-level timestamp* Whisper Web pada klip pendek + pembacaan jeda gelombang suara).
- Karena hanya memproses klip yang dipilih (30–60 detik, bukan 30 menit penuh), sinkronisasi per kata selesai dalam **hitungan detik** dan sangat akurat mengikuti ucapan mulut.
- Pembeli juga bisa mengedit teks per kata kalau ada nama orang atau istilah yang salah ketik.

#### Tahap 5 — Wajah Tetap di Tengah + Render Klip 9:16 Jadi MP4
Ini alasan kenapa kita **tidak** memakai encode software `ffmpeg.wasm` penuh untuk menggambar video (karena `ffmpeg.wasm` sangat lambat kalau harus merender video 9:16 dari awal):

1. **Deteksi Wajah Otomatis (MediaPipe Face Detector di Browser):**
   - Sebelum render, sistem memindai posisi wajah pembicara di sepanjang klip (misal tiap 0,25 detik).
   - Dipasang **peredam guncangan (*smoothing + deadzone*)**: bingkai 9:16 mengunci wajah tetap di tengah tanpa goyang-goyang kecil saat pembicara mengangguk, tapi sigap berpindah kalau pembicara berganti (misalnya podcast 2 orang kiri–kanan).
   - Kalau tidak ada wajah (misalnya sedang tampil slide), bingkai otomatis mengambil tengah layar dengan latar blur rapi atau bisa digeser manual oleh pembeli.
2. **Penggabungan Visual di `<canvas>` HD (720×1280 cepat / opsi 1080×1920 tajam):**
   - Menggambar potongan video 9:16 yang sudah mengikuti wajah.
   - Menempelkan **Judul Atas (Hook Banner)** yang bisa diatur teks & warnanya.
   - Menempelkan **Logo / Watermark** milik pembeli (upload PNG transparan, atur pojok & ukuran).
   - Menggambar **Caption Besar Per Kata** yang menyala sesuai kata yang sedang diucapkan, dengan minimal **6 Preset Gaya Caption**:
     1. *Kreator Tebal (Kuning–Putih)* — kata aktif menyala kuning tebal ber-outline hitam.
     2. *Kotak Sorot (Highlight Pill)* — kata yang sedang diucapkan diberi kotak latar warna mencolok.
     3. *Podcast Bersih* — putih modern dengan bayangan lembut di bawah tengah.
     4. *Neon Gelap* — efek menyala hijau/cyan cocok untuk klip teknologi atau gaming.
     5. *Tegas Berita* — bar latar gelap solid dengan kata kunci merah/oranye.
     6. *Minimalis Elegan* — huruf bersih untuk konten edukasi, bisnis, atau kajian.
3. **Encode Cepat ke File `.mp4` Asli (`WebCodecs` GPU + `mp4-muxer`):**
   - Frame dari `<canvas>` dan potongan audio asli di-encode langsung menggunakan **`WebCodecs API` (`VideoEncoder` H.264 + `AudioEncoder` AAC)** yang memakai akselerasi kartu grafis (GPU) bawaan laptop/HP, lalu dibungkus jadi file `.mp4` memakai `mp4-muxer`.
   - Kecepatan render untuk klip 45 detik diperkirakan hanya **15–40 detik** (jauh lebih cepat daripada `ffmpeg.wasm` murni yang bisa 5–10 menit).
   - *Jalur cadangan otomatis:* Kalau browser pembeli belum mendukung penuh `AudioEncoder`/`VideoEncoder`, sistem otomatis beralih ke perekaman kanvas + pembungkus MP4 `ffmpeg.wasm` supaya tombol **Unduh MP4** tetap menghasilkan file `.mp4` yang bisa diputar di semua HP, WhatsApp, TikTok, Reels, dan Shorts.

---

## 3. Kelengkapan Standar Web App (Sesuai `AGENTS.md`)

Selain mesin pemotong video di atas, aplikasi web `produk/klip-auto/app/` akan dibangun lengkap agar layak dijual:
- **Halaman Masuk (Login):** Masuk dengan nama, email, dan kode akses pembeli.
- **Sidebar & Dashboard:** Menyapa nama pembeli + kartu ringkasan pemakaian (total video diproses, jumlah klip MP4 selesai, rata-rata skor klip, dan estimasi waktu kerja yang dihemat).
- **Tool Utama (Wizard 3 Langkah):**
  1. *Pilih Video & Transkrip* → 2. *Pilih Momen AI & Atur Durasi* → 3. *Gaya Caption, Wajah Tengah, Logo & Unduh MP4*.
- **Library Siap Pakai (100+ Item Berkategori dengan Halaman Detail):**
  Koleksi **120+ Template Judul Atas (Hook), Kalimat Pembuka Klip, Pola Storytelling, & Ide Konten Pendek** dalam 6 kategori (Podcast Bisnis, Edukasi & Tips, Kajian & Motivasi, Obrolan & Hiburan, Rekaman Webinar, Jualan & Review). Tiap item punya halaman detail berisi penjelasan, contoh pemakaian nyata, tips, dan tombol **"Pakai jadi Judul Klip"**.
- **Riwayat Klip, Favorit, Pengaturan, & Tema Terang/Gelap:**
  Termasuk halaman pengaturan aman untuk menyimpan Gemini API Key di browser sendiri, menyimpan logo watermark tetap, dan memilih resolusi standar.
- **Landing Page (`produk/klip-auto/lp/index.html`):**
  1 file HTML utuh `< 1 MB`, 12 bagian urut sesuai standar, bahasa ngobrol natural, dan bagian **Demo "Coba Sekarang"** langsung memakai mesin preview caption & potong 9:16 asli dari app.

---

## 4. Rencana Tahap Pengerjaan & Pengujian

1. **Tahap 1 (Checkpoint 1 — Maks. 1 Nov):**
   - Review dan persetujuan `RENCANA.md` ini.
2. **Tahap 2 (Checkpoint 2 — Maks. 4 Nov):**
   - Mesin inti jalan: upload video panjang → potong durasi → deteksi wajah tengah 9:16 → pasang caption sinkron → berhasil unduh **1 klip MP4** yang lancar diputar di PC & HP.
3. **Tahap 3 (Final — Maks. 8 Nov):**
   - Integrasi penuh transkrip + pemilihan 5–10 momen AI berskor, 6 preset caption + logo watermark, dashboard + 120+ item library lengkap, serta Landing Page.
   - **Uji coba wajib pakai video podcast asli durasi 10–30 menit**, catat waktu proses setiap tahap, ukuran hasil, dan kualitasnya secara jujur di `produk/klip-auto/HASIL-TES.md` serta lengkapi `produk/klip-auto/SETOR.md`.

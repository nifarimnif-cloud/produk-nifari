# Rencana Arsitektur Klip Auto v2.1 (Rp99.000 Sekali Bayar · Tanpa Kuota)

Dokumen ini menjelaskan perbandingan arsitektur **Full Browser vs Hybrid** berdasarkan syarat wajib `GUIDE-KLIP-AUTO.md` Bagian 2, keputusan arsitektur yang dipilih beserta bukti teknisnya, serta pembagian kerja antara browser pembeli dan server lisensi.

---

## 1. Perbandingan Arsitektur: Full Browser vs Hybrid

| Kriteria Wajib (`GUIDE-KLIP-AUTO.md` Bagian 2) | Opsi A: Full Browser + Jembatan Ekstensi Lokal (DIPILIH) | Opsi B: Hybrid (`yt-dlp` + FFmpeg + `whisper.cpp` Lokal) |
| :--- | :--- | :--- |
| **Instalasi Pembeli (Windows & Mac)** | **Tanpa installer desktop (`.exe`/`.dmg`).** Pembeli langsung membuka aplikasi di Chrome/Edge. Untuk jalur link YouTube langsung, ekstensi ringan dipasang sekali di browser tanpa peringatan blokir SmartScreen/Gatekeeper antivirus. | Wajib membuat, mendistribusikan, dan menandatangani (*code-signing*) installer Windows 64-bit, Mac Apple Silicon, dan Mac Intel. Tanpa sertifikat berbayar (EV/Apple Developer), SmartScreen Windows & Gatekeeper Mac langsung memblokir file instalasi pembeli awam. |
| **Biaya Server per Klip** | **Nol rupiah per klip.** Pemindaian suara, transkrip `Whisper-Small`, pelacakan wajah, dan render MP4 `WebCodecs` berjalan 100% di perangkat pembeli. Server Cloudflare Pages hanya melayani aktivasi lisensi, cek paket, info versi, dan laporan error teks. | Nol rupiah per klip, namun membutuhkan infrastruktur hosting rilis installer ratusan MB (FFmpeg + `whisper.cpp` + runtime) setiap kali update versi. |
| **Ketahanan Video 60+ Menit di RAM 8 GB** | **Terbukti aman tanpa tab crash (puncak JS Heap < 400 MB).** Membaca file video per potong dari disk lewat `BlobSource` (`Mediabunny`), memindai gelombang vokal per jendela 3 menit (`scanLongVideoAudioFeatures`), dan mendekode frame hanya pada detik klip `[startSec, endSec]` yang sedang dirender. | Kuat di proses native OS, namun memakan ruang disk ratusan MB untuk binary + file sementara. |
| **Link YouTube Lewat Internet Pembeli Sendiri** | **100% lewat IP internet rumah/HP pembeli sendiri** memakai Ekstensi Jembatan Lokal MV3 (`companion-extension/`) — menarik aliran MP4 H.264/AAC (`206 Range`), subtitle kata asli (`srv3`), dan grafik *Most-Replayed* (`heatmap`) langsung dari koneksi pembeli tanpa layanan konverter pihak ketiga dan tanpa proxy server. | Lewat `yt-dlp` lokal, namun ketika YouTube mengubah skema klien perlu update binary di laptop pembeli. Di Full Browser + Ekstensi, konfigurasi versi klien (`ytExtractorConfig`) diperbarui otomatis dari endpoint `/api/version`. |
| **Keamanan Kode Aplikasi** | **Terkunci di server (`_worker.js`).** File inti (`/wizard-controller.js`, `/engine/*` utama, `/vendor/*`, `/data/*`) mengembalikan `401 AUTH_REQUIRED` sebelum lisensi dinyatakan sah oleh server dan diberi cookie sesi bertanda tangan HMAC-SHA256 (`HttpOnly`). | Disajikan dari mesin lokal `127.0.0.1` dengan token sesi, namun seluruh file kode/binary fisik berada langsung di folder instalasi komputer pembeli sehingga lebih mudah dibongkar (*reverse-engineered*). |

### Keputusan & Rekomendasi
Kami memilih **Arsitektur Full Browser (WebCodecs + WebGPU/WASM + Jembatan Ekstensi Lokal)** karena:
1. Menghilangkan sumber tiket komplain terbesar pembeli non-teknis di Indonesia (blokir antivirus Windows Defender/SmartScreen dan peringatan *unidentified developer* di macOS tanpa harus membeli sertifikat tanda tangan aplikasi yang mahal).
2. Pengujian nyata membuktikan video podcast **78,5 menit (`4.710 detik`)** berjalan stabil di tab Chrome dengan batas memori ketat tanpa *tab crash*, sementara render klip `9:16` berakselerasi GPU selesai dalam hitungan detik (dan otomatis berpindah ke mode CPU `prefer-software` bila GPU tidak mendukung).

---

## 2. Pembagian Kerja: Server vs Browser Pembeli

### A. Yang Berjalan di Server (`produk/klip-auto/app/_worker.js`)
Server Cloudflare Pages **sama sekali tidak pernah menerima unggahan video atau memproses frame/audio**. Tugas server dibatasi ketat pada 4 fungsi ringan:
1. **Validasi Lisensi & Paket (`POST /api/license/activate`, `GET /api/license/verify`):**
   - Tidak ada satu pun kode lisensi, *hash*, atau *salt* di dalam kode aplikasi maupun `_worker.js`. Seluruh rahasia disimpan terenkripsi di variabel server `KLIP_AUTO_LICENSE_CONFIG`.
   - Server menentukan paket yang aktif (**Paket Inti**, **Paket Tambahan**, atau **Paket Pro**) sehingga pembeli yang melakukan *upgrade* paket langsung mendapatkan fitur tambahan tanpa perlu instal ulang.
   - Mengikat aktivasi Paket Inti & Tambahan ke **1 laptop** (`deviceId`), dilengkapi fitur **Pindah Perangkat Mandiri** (`POST /api/license/transfer` & `POST /api/license/release`) yang otomatis mencabut sesi perangkat lama (`REVOKED_TRANSFERRED`).
2. **Pengunci Aset Aplikasi Inti (`401 AUTH_REQUIRED`):**
   - Permintaan ke `/wizard-controller.js`, `/engine/*` (selain modul login & cek perangkat pra-beli), `/vendor/*`, dan `/data/*` ditolak sebelum sesi lisensi tervalidasi.
   - Setelah tervalidasi, `sw-offline.js` menyimpan salinan terotentikasi di perangkat pembeli dengan masa sewa (*offline lease*) **7 hari**, sehingga aplikasi tetap jalan penuh saat internet mati beberapa hari setelah aktivasi.
3. **Info Versi & Konfigurasi Penarik YouTube (`GET /api/version`):**
   - Mengirim nomor versi terbaru aplikasi serta parameter versi klien ekstraktor YouTube agar jembatan lokal selalu mutakhir tanpa update manual.
4. **Laporan Error Aman Privasi (`POST /api/error-report`):**
   - Menerima catatan diagnostik teknis ringkas (versi browser, OS, mode encoder GPU/CPU, dan pesan kendala) **tanpa video, tanpa nama file pribadi, dan dengan penyensoran email otomatis**.

---

### B. Yang Berjalan 100% di Browser Pembeli (Mesin Utama)

#### 1. Masukin Video: Link YouTube (Internet Sendiri) & File Lokal (`.mp4`, `.mov`, `.mkv`)
- Seluruh ketergantungan pada layanan pengunduh pihak ketiga, kunci API tertanam, dan proxy YouTube di server telah **dihapus 100%**.
- **Link YouTube:** Jembatan Ekstensi Lokal (`companion-extension/`) mengambil daftar kualitas aliran MP4, subtitle kata asli (`srv3`), dan grafik *Most-Replayed* (`heatmap`) langsung lewat koneksi internet perangkat pembeli. Untuk video di atas 40 menit, sistem otomatis merekomendasikan aliran progresif hemat memori agar pemakaian RAM tetap ringan di laptop 8 GB.
- **Pemulihan Jelas Saat Link Gagal / Offline:** Bila video bersifat pribadi, dibatasi pemilik channel, ekstensi belum dipasang, atau internet sedang putus, layar menampilkan alasan berbahasa Indonesia sehari-hari yang mudah dipahami disertai tombol langsung **Pilih File Video Lokal (`.mp4`, `.mov`, `.mkv`)**.

#### 2. Transkrip Akurat Bahasa Indonesia + Inggris & Sinkronisasi Vokal Presisi (`10ms`)
- **Subtitle YouTube Berkualitas:** Jika video YouTube memiliki subtitle yang rapi, kata-katanya langsung diambil lalu diselaraskan ulang ke gelombang suara asli pembicara.
- **Model Lokal Akurat `Xenova/whisper-small` (`transcriber-moments.js`):** Jika rekaman lokal belum memiliki subtitle, sistem menjalankan **`whisper-small`** (244 juta parameter) langsung di browser — otomatis memakai akselerasi **WebGPU** bila tersedia atau jatuh ke **CPU WASM (`q8`)** bila tidak ada GPU kuat. Mampu mengenali percakapan Bahasa Indonesia sehari-hari yang bercampur istilah Bahasa Inggris (*Indlish*).
- **Penyelaras Suku Kata ke Gelombang Vokal (`engine/vocal-aligner.js`):**
  - Menyaring pita frekuensi vokal manusia (`165 Hz – 3750 Hz`, resolusi `10ms` / 100 frame per detik) untuk mendeteksi pulau-pulau bicara (*voiced islands*), lembah konsonan antar-kata, dan jeda napas alami (`>= 240ms` pemisah frase, `<= 120ms` jembatan penutup huruf mati *p/t/k*).
  - Mengunci waktu mulai dan selesai setiap kata secara proporsional terhadap bobot suku kata Bahasa Indonesia/Inggris dan puncak energi vokal nyata, sehingga teks *subtitle* menyala tepat mengikuti artikulasi mulut pembicara.
  - Dilengkapi **Kanvas Gelombang Sinkron Vokal (`#vocal-sync-canvas`)**, penggeser presisi `-0,40 dtk .. +0,40 dtk`, tombol **Rapatkan ke Jeda Napas**, dan tombol **Kunci Ulang Teks ke Suara** ketika pembeli mengoreksi ejaan kata.

#### 3. Pemilihan Momen Jujur dari 4 Sinyal Asli (Bukan Klaim Palsu)
Sistem tidak pernah melabeli rumus matematis sebagai `"AI"`. Skor tiap momen dihitung secara transparan dari 4 sinyal nyata:
1. **Grafik Most-Replayed YouTube (`heatmap`):** Puncak bagian yang paling sering diputar ulang penonton (35% bila tersedia).
2. **Lonjakan Suara & Dinamika Vokal:** Kenaikan energi suara, penekanan nada, atau tawa dibanding rata-rata rekaman.
3. **Kekuatan Kalimat Pembuka:** Pertanyaan langsung, angka konkret di 3 detik pertama, dan kata pemicu rasa ingin tahu.
4. **Akhir Kalimat & Jeda Napas Bersih:** Memastikan potongan berakhir di tanda baca akhir kalimat dan jeda napas agar klip tidak terputus di tengah omongan.
- Bila grafik *Most-Replayed* tidak tersedia (video baru atau file rekaman lokal), bobot otomatis dialihkan ke 3 sinyal lainnya (`40%` Lonjakan Vokal + `35%` Kalimat Pembuka + `25%` Jeda Napas) dan pita informasi `#scoring-weight-banner` memberi tahu pembeli secara jujur di layar. Skor selalu bervariasi secara alami sesuai kekuatan sinyal masing-masing segmen.

#### 4. Deteksi Otomatis 1 / 2 Wajah & 4 Mode Framing 9:16 (`engine/face-tracker.js`)
- Memindai klip menggunakan **MediaPipe Face Detector** beserta analisis rona wajah & gerak bicara:
  - **2 Wajah Terdeteksi → Podcast Split:** Pembicara kiri ditempatkan di panel atas dan pembicara kanan di panel bawah secara otomatis tanpa keyframe manual, dengan caption berada tepat di garis tengah agar kedua wajah tetap utuh tidak tertutup teks.
  - **1 Wajah Terdeteksi → Fullscreen Tengah:** Kamera `9:16` mengunci wajah pembicara aktif tetap di tengah dengan peredam guncangan (*deadzone*).
  - **Cinema Blur:** Menampilkan video `16:9` utuh di tengah dengan latar belakang *blur* lembut untuk presentasi slide atau demo layar.
  - **Gaming Split (Paket Pro):** Mengambil kotak *facecam* pojok ke bagian atas dan area permainan (*gameplay*) ke bagian bawah.

#### 5. Caption Per Kata, Judul Pembuka 3 Detik, Fallback CPU, & Isolasi Batch (`engine/mp4-exporter.js`)
- **8 Gaya Caption Sinkron** (6 gaya Paket Inti + 2 gaya Paket Tambahan), **Judul Pembuka 3 Detik** yang tampil tajam di awal klip lalu menghilang bersih setelah 3 detik (atau opsi sepanjang klip), serta penjernih vokal podcast `48 kHz` Stereo.
- **Pemeriksaan Ruang Disk Pra-Render (`assertSufficientDiskForRender`):** Mencegah file MP4 rusak apabila penyimpanan perangkat/browser hampir penuh.
- **Akselerasi GPU + Fallback CPU Otomatis:** Mencoba `VideoEncoder` mode `prefer-hardware` terlebih dahulu; jika kartu grafis atau driver menolak, otomatis berpindah ke mode software CPU (`prefer-software`) tanpa menghentikan proses.
- **Isolasi Kegagalan per Klip:** Dilengkapi *progress bar* nyata, tombol batal instan, dan pembungkus isolasi per klip sehingga jika 1 klip mengalami kendala dekode pada proses *batch*, klip lainnya dalam antrean tetap selesai dirender sampai tuntas.

# Rencana Arsitektur Klip Auto v2.2 (Rp99.000 Sekali Bayar · Tanpa Ekstensi · Tanpa Kuota)

Dokumen ini menjelaskan arsitektur **Klip Auto Studio v2.2**: Copy-Paste Link YouTube **Tanpa Ekstensi Tambahan**, fitur **Unduh Video YouTube Utuh (.MP4 360p–1080p)**, **Subtitle Anti-Miss 10ms**, serta **Pemilih 9 Jenis Font Subtitle Kreator**, lengkap pembagian kerja antara browser pembeli dan server lisensi.

---

## 1. Perbandingan Arsitektur: Full Browser Tanpa Ekstensi vs Hybrid

| Kriteria Wajib (`GUIDE-KLIP-AUTO.md` Bagian 2) | Opsi A: Full Browser + Edge Stream Tanpa Ekstensi (DIPILIH — v2.2) | Opsi B: Hybrid (`yt-dlp` + FFmpeg + `whisper.cpp` Lokal) |
| :--- | :--- | :--- |
| **Instalasi Pembeli (Windows & Mac)** | **Nol instalasi & nol ekstensi.** Pembeli langsung membuka aplikasi di Chrome/Edge, masuk dengan kode lisensi, dan langsung menempelkan link YouTube tanpa memasang installer `.exe`/`.dmg` maupun ekstensi browser tambahan. | Wajib membuat, mendistribusikan, dan menandatangani (*code-signing*) installer Windows 64-bit, Mac Apple Silicon, dan Mac Intel. Tanpa sertifikat berbayar (EV/Apple Developer), SmartScreen Windows & Gatekeeper Mac langsung memblokir file instalasi pembeli awam. |
| **Biaya Pemrosesan Video per Klip** | **Mendekati nol rupiah per klip.** Pemindaian suara, remuxing H.264/AAC (`mediabunny`), transkrip `Whisper-Small`, pelacakan wajah, dan render MP4 `WebCodecs` berjalan 100% di perangkat pembeli. Edge Worker hanya melayani lisensi dan meneruskan potongan *byte-range* ringan (`206 Partial Content`) tanpa menyimpan video. | Nol rupiah per klip, namun membutuhkan infrastruktur hosting rilis installer ratusan MB (FFmpeg + `whisper.cpp` + runtime) setiap kali update versi. |
| **Ketahanan Video 60+ Menit di RAM 8 GB** | **Terbukti aman tanpa tab crash (puncak JS Heap < 400 MB).** Membaca file video per potong (`5 MB` chunk) lewat `BlobSource` (`Mediabunny`), memindai gelombang vokal per jendela 3 menit (`scanLongVideoAudioFeatures`), dan mendekode frame hanya pada detik klip `[startSec, endSec]` yang sedang dirender. | Kuat di proses native OS, namun memakan ruang disk ratusan MB untuk binary + file sementara. |
| **Copy-Paste Link YouTube & Unduh MP4** | **Langsung jalan dari browser tanpa ekstensi tambahan** melalui endpoint terotentikasi `/api/youtube/info` & `/api/youtube/stream` (`ANDROID` -> `IOS` -> `WEB_EMBEDDED_PLAYER` InnerTube cascade + remux H.264+AAC `360p` hingga `1080p Full HD` di browser), dilengkapi tombol khusus **Unduh Video YouTube (.MP4)** ke perangkat pembeli. | Lewat `yt-dlp` lokal, namun ketika YouTube mengubah skema klien perlu update binary di laptop pembeli. |
| **Keamanan Kode Aplikasi & Endpoint** | **Terkunci di server (`_worker.js`).** Seluruh aset inti (`/wizard-controller.js`, `/engine/*`, `/vendor/*`, `/data/*`) maupun `/api/youtube/*` mengembalikan `401 AUTH_REQUIRED` sebelum lisensi dinyatakan sah oleh server dan diberi cookie sesi bertanda tangan HMAC-SHA256 (`HttpOnly`). | Disajikan dari mesin lokal `127.0.0.1` dengan token sesi, namun seluruh file kode/binary fisik berada langsung di folder instalasi komputer pembeli sehingga lebih mudah dibongkar (*reverse-engineered*). |

### Keputusan & Rekomendasi
Kami memilih **Arsitektur Full Browser + Edge Stream Tanpa Ekstensi Tambahan (`v2.2`)** karena:
1. Pembeli cukup membuka aplikasi di browser (Chrome/Edge), masuk dengan kode lisensi, dan **langsung copy-paste link YouTube tanpa memasang installer `.exe`/`.dmg` maupun ekstensi browser tambahan apa pun** — baik untuk langsung memotong klip `9:16` maupun untuk **mengunduh video YouTube utuh (`.MP4` 360p s/d 1080p Full HD)** ke perangkatnya.
2. Pengujian nyata membuktikan video podcast **78,5 menit (`4.710 detik`)** berjalan stabil di tab Chrome dengan batas memori ketat tanpa *tab crash*, sementara render klip `9:16` berakselerasi GPU selesai dalam hitungan detik (dan otomatis berpindah ke mode CPU `prefer-software` bila GPU tidak mendukung).

---

## 2. Pembagian Kerja: Server vs Browser Pembeli

### A. Yang Berjalan di Server (`produk/klip-auto/app/_worker.js`)
Server Cloudflare Pages **sama sekali tidak pernah menyimpan video pengguna, tidak me-render frame, dan tidak memuat satu pun kunci API rahasia di kode sumber**. Tugas server dibatasi ketat pada fungsi terotentikasi yang ringan:
1. **Validasi Lisensi & Paket (`POST /api/license/activate`, `GET /api/license/verify`):**
   - Tidak ada satu pun kode lisensi, *hash*, atau *salt* di dalam kode aplikasi maupun `_worker.js`. Seluruh rahasia disimpan terenkripsi di variabel server `KLIP_AUTO_LICENSE_CONFIG`.
   - Server menentukan paket yang aktif (**Paket Inti**, **Paket Tambahan**, atau **Paket Pro**) sehingga pembeli yang melakukan *upgrade* paket langsung mendapatkan fitur tambahan tanpa perlu instal ulang.
   - Mengikat aktivasi Paket Inti & Tambahan ke **1 laptop** (`deviceId`), dilengkapi fitur **Pindah Perangkat Mandiri** (`POST /api/license/transfer` & `POST /api/license/release`) yang otomatis mencabut sesi perangkat lama (`REVOKED_TRANSFERRED`).
2. **Pengunci Aset Aplikasi Inti & Jalur YouTube (`401 AUTH_REQUIRED`):**
   - Permintaan ke `/wizard-controller.js`, `/engine/*` (selain modul login & cek perangkat pra-beli), `/vendor/*`, `/data/*`, maupun `/api/youtube/*` ditolak (`401 AUTH_REQUIRED`) sebelum sesi lisensi tervalidasi.
   - Setelah tervalidasi, `sw-offline.js` menyimpan salinan terotentikasi di perangkat pembeli dengan masa sewa (*offline lease*) **7 hari**, sehingga aplikasi tetap jalan penuh untuk file video lokal saat internet mati.
3. **Jalur Copy-Paste Link YouTube & Pengunduh `.MP4` Tanpa Ekstensi (`/api/youtube/info`, `/api/youtube/stream`, `/api/youtube/download`):**
   - Mengambil metadata judul, channel, durasi, daftar resolusi (`360p Cepat`, `480p SD`, `720p HD`, `1080p Full HD`), subtitle kata asli (`srv3` yang sudah dibersihkan dari tumpang-tindih), dan grafik *Most-Replayed* (`heatmap`) lewat protokol InnerTube `ANDROID_VR` & `IOS` (`/youtubei/v1/visitor_id` + `/youtubei/v1/player` multi-host Anycast), lalu mengalirkan byte `.MP4` (H.264 + AAC) langsung ke browser berlisensi tanpa memerlukan ekstensi tambahan dan tanpa menyimpan file di server.
4. **Info Versi & Laporan Error Aman Privasi (`GET /api/version`, `POST /api/error-report`):**
   - Mengirim informasi rilis aplikasi serta menerima catatan diagnostik teknis ringkas (versi browser, OS, mode encoder GPU/CPU, dan pesan kendala) **tanpa video, tanpa nama file pribadi, dan dengan penyensoran email otomatis**.

---

### B. Yang Berjalan 100% di Browser Pembeli (Mesin Utama)

#### 1. Copy-Paste Link YouTube Tanpa Ekstensi, Pengunduh Video YouTube (`.MP4`), & File Lokal (`.mp4`, `.mov`, `.mkv`)
- **Langsung Copy-Paste Link YouTube Tanpa Ekstensi:** Begitu pengguna menempelkan link `youtube.com/watch?v=...`, `youtu.be/...`, atau `youtube.com/shorts/...` lalu menekan **Muat Video**, kartu pratinjau langsung menyajikan pilihan resolusi (`360p`, `480p`, `720p HD`, `1080p Full HD`) dengan **dua aksi langsung**:
  1. **Potong Jadi Klip 9:16 Sekarang (`#btn-yt-import-studio`):** Langsung memuat video beserta subtitle & kandidat momen ke Studio 9:16 (atau menjalankan Batch Otomatis 5–10 klip).
  2. **Unduh Video YouTube (`.MP4`) (`#btn-yt-download-mp4`):** Mengunduh file video YouTube `.MP4` utuh langsung ke folder *Downloads* laptop/HP lengkap dengan indikator progres nyata dan tombol Batal.
- **Pemakaian Ulang Memori Cerdas (`0` Kuota Ganda):** Jika pengguna sudah mengunduh `.MP4` lalu menekan *Potong Jadi Klip 9:16 Sekarang* (atau sebaliknya), sistem langsung memakai salinan `File` di memori tanpa mengunduh ulang.
- **Pemulihan Jelas Saat Video Privat / Offline:** Bila video bersifat pribadi, dibatasi usia/pemilik channel, atau internet sedang putus, layar menampilkan alasan berbahasa Indonesia sehari-hari disertai tombol langsung **Pilih File Video Lokal (`.mp4`, `.mov`, `.mkv`)**.

#### 2. Mesin Subtitle Anti-Miss (`Zero-Miss`) + Transkrip `Xenova/whisper-small` + Sinkron Vokal `10ms`
- **Penjepit Subtitle `srv3` & Jembatan Jeda Mikro (`caption-presets.js`):** Setiap kata dinormalisasi secara monotonik tanpa tumpang-tindih; celah antar-frase di bawah `0,42 detik` dijembatani mulus (`displayStart` / `displayEnd`) agar teks tidak berkedip hilang di tengah kalimat cepat, sementara jeda napas nyata (`>= 0,42 detik`) tetap bersih tanpa teks menggantung.
- **Pemeliharaan Kata Sumber Utuh (`fullSourceWords`):** Menggeser detik mulai/selesai klip atau menekan *Rapatkan ke Jeda Napas* tidak pernah membuang kata di pinggir klip karena daftar kata selalu diiris ulang dari transkrip sumber utuh.
- **Pemindai & Penambal Celah Bicara Otomatis (`ensureZeroMissClipSubtitles` di `transcriber-moments.js`):** Tombol **Cek & Tambal Subtitle Anti-Miss (`#btn-ensure-zero-miss`)** membandingkan pulau vokal aktif `10ms` (`165–3750 Hz`) dengan kata yang ada; jika ada rentang bicara aktif `>= 1,05 detik` yang terlewat tanpa teks, sistem otomatis mentranskripsi bagian yang bolong menggunakan **`Xenova/whisper-small`** (ditambah *overlap* jendela `1,2 detik` pada video panjang) dan menguncinya ke gelombang vokal pembicara.
- **Penyelaras Suku Kata ke Gelombang Vokal (`engine/vocal-aligner.js`):** Menyaring frekuensi vokal manusia (`165–3750 Hz`, resolusi `10ms`) dengan **Kanvas Gelombang Sinkron Vokal (`#vocal-sync-canvas`)**, kalibrasi `-0,40 dtk .. +0,40 dtk`, **Rapatkan ke Jeda Napas**, dan **Kunci Ulang Teks ke Suara**.

#### 3. Pemilihan Momen Jujur dari 4 Sinyal Asli (Bukan Klaim Palsu)
Sistem tidak pernah melabeli rumus matematis sebagai `"AI"`. Skor tiap momen dihitung secara transparan dari 4 sinyal nyata:
1. **Grafik Most-Replayed YouTube (`heatmap`):** Puncak bagian yang paling sering diputar ulang penonton (35% bila tersedia).
2. **Lonjakan Suara & Dinamika Vokal:** Kenaikan energi suara, penekanan nada, atau tawa dibanding rata-rata rekaman.
3. **Kekuatan Kalimat Pembuka:** Pertanyaan langsung, angka konkret di 3 detik pertama, dan kata pemicu rasa ingin tahu.
4. **Akhir Kalimat & Jeda Napas Bersih:** Memastikan potongan berakhir di tanda baca akhir kalimat dan jeda napas agar klip tidak terputus di tengah omongan.
- Bila grafik *Most-Replayed* tidak tersedia (video baru atau file rekaman lokal), bobot otomatis dialihkan ke 3 sinyal lainnya (`40%` Lonjakan Vokal + `35%` Kalimat Pembuka + `25%` Jeda Napas) dan pita informasi `#scoring-weight-banner` memberi tahu pembeli secara jujur di layar.

#### 4. Deteksi Otomatis 1 / 2 Wajah & 4 Mode Framing 9:16 (`engine/face-tracker.js`)
- Memindai klip menggunakan **MediaPipe Face Detector** beserta analisis rona wajah & gerak bicara:
  - **2 Wajah Terdeteksi → Podcast Split:** Pembicara kiri ditempatkan di panel atas dan pembicara kanan di panel bawah secara otomatis tanpa keyframe manual, dengan caption berada tepat di garis tengah agar kedua wajah tetap utuh tidak tertutup teks.
  - **1 Wajah Terdeteksi → Fullscreen Tengah:** Kamera `9:16` mengunci wajah pembicara aktif tetap di tengah dengan peredam guncangan (*deadzone*).
  - **Cinema Blur:** Menampilkan video `16:9` utuh di tengah dengan latar belakang *blur* lembut untuk presentasi slide atau demo layar.
  - **Gaming Split (Paket Pro):** Mengambil kotak *facecam* pojok ke bagian atas dan area permainan (*gameplay*) ke bagian bawah.

#### 5. Pemilih 9 Jenis Font Subtitle Kustom, 8 Gaya Warna, Judul Pembuka 3 Detik, & Ekspor MP4 (`engine/mp4-exporter.js`)
- **Pemilih 9 Jenis Font Subtitle Kustom (`CAPTION_FONTS` di `caption-presets.js`):** Pembeli bebas memilih karakter tipografi subtitle yang paling cocok dengan channel-nya: **Plus Jakarta Sans** (*Modern Bersih*), **Montserrat Black** (*Tegas Konten Viral*), **Anton Display** (*Tinggi Padat*), **Bebas Neue** (*Poster Sinematik*), **Poppins ExtraBold** (*Bulat Tegas*), **Rubik Bold** (*Sudut Halus*), **Space Grotesk** (*Teknologi & Edukasi*), **Fredoka Bold** (*Ceria & Ramah*), serta **Merriweather Heavy** (*Editorial Kutipan*), lengkap pengatur **Ukuran Font (`80%–135%`)** dan **Format Huruf (`Ikuti Gaya` / `HURUF BESAR` / `Huruf Normal`)**. Seluruh font dipramuat (`ensureCaptionFontLoaded`) sebelum frame pertama dikodekan ke `.MP4` agar hasil unduhan 100% identik dengan pratinjau kanvas.
- **8 Gaya Caption Sinkron** (6 gaya Paket Inti + 2 gaya Paket Tambahan), **Judul Pembuka 3 Detik** yang tampil tajam di awal klip lalu menghilang bersih setelah 3 detik (atau opsi sepanjang klip), serta penjernih vokal podcast `48 kHz` Stereo.
- **Pemeriksaan Ruang Disk Pra-Render (`assertSufficientDiskForRender`):** Mencegah file MP4 rusak apabila penyimpanan perangkat/browser hampir penuh.
- **Akselerasi GPU + Fallback CPU Otomatis & Isolasi Kegagalan per Klip:** Mencoba `VideoEncoder` mode `prefer-hardware` terlebih dahulu lalu jatuh mulus ke `prefer-software` bila dibutuhkan, dengan pembungkus isolasi per klip pada proses *batch*.

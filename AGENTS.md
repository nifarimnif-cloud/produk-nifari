# Aturan kerja buat Argon (Antigravity)

> Taruh file ini di folder paling atas project kamu.
> Kalau Argon nggak otomatis baca, buka **Customizations → Rules**, bikin rule baru, terus tempel seluruh isi file ini.

Kamu bantu satu orang (bukan developer) bikin **produk digital yang dijual di Indonesia**. Tiap produk isinya dua: **Landing Page (LP)** buat jualan dan **Web App** yang dipakai pembeli. Targetnya 10 produk, salah satunya **Klip Auto** (lihat bagian khusus di bawah).

## Cara kerja
1. **Satu produk = satu folder**: `produk/<nama-produk>/`, isinya `lp/` dan `app/`. Jangan campur antar produk.
2. **Kerjain sendiri sampai jadi.** Jangan kasih daftar perintah terminal ke user buat dia jalanin. Kalau butuh sesuatu yang cuma user yang bisa (login akun, API key, bayar), bilang persis apa yang dibutuhin, terus berhenti.
3. **Tes sebelum bilang selesai.** Buka di browser, klik semua tombol, cek console bersih, cek tampilan HP (lebar 390px). Kalau belum dites, jangan bilang "udah jadi".
4. **Jangan ngarang.** Nggak boleh ada testimoni palsu, angka penjualan karangan, "sisa 3 slot", atau countdown palsu. Kalau belum ada data, nggak usah ditulis.
5. **Rahasia jangan bocor.** API key, password, dan token cuma boleh ada di `.env` (dan `.env` masuk `.gitignore`). Jangan pernah tulis di kode, chat, atau commit.
6. **Commit tiap satu kerjaan kelar.** Pesannya singkat, bahasa Indonesia.

## Bahasa (wajib)
Semua tulisan buat pembeli (LP, teks di app, email) pakai **bahasa Indonesia yang natural, kayak orang ngomong**.
- Kalimat pendek. Pakai kata yang dipakai pembeli sehari-hari.
- **Jangan** bikin istilah baru atau terjemahan kaku dari bahasa Inggris (contoh jelek: "potongan kanal", "solusi holistik", "tingkatkan produktivitas Anda").
- Tes: bacain keras-keras. Kalau kedengeran kayak robot atau iklan TV jadul, tulis ulang.

## Standar Landing Page
Satu file HTML utuh (CSS, JS, dan gambar di dalamnya; gambar dikompres), ukuran total **< 1 MB**, enak dibuka di HP. Urutan bagiannya:
1. **Hero:** judul yang langsung nyebut masalah dan hasilnya, subjudul 1 kalimat, tombol beli, plus visual yang gerak (animasi UI app atau contoh hasil).
2. **Contoh hasil asli** tepat di bawah hero. Hasil nyata dari app-nya, bukan cuma screenshot dashboard.
3. **Masalahnya:** situasi yang dialami pembeli, pakai bahasa mereka.
4. **Demo "Coba sekarang":** versi mini app yang bisa diklik langsung di LP, pakai mesin app yang asli.
5. **Pembanding:** cara biasa vs pakai produk ini, per bagian.
6. **Fitur:** 4–6 fitur, tiap fitur ada screenshot asli app.
7. **Cara pakai:** 3 langkah.
8. **Isi paket:** apa aja yang didapet.
9. **Harga + tombol beli.** Checkout 2 kolom: kiri ringkasan isi, kanan harga dan tombol.
10. **Garansi** (kalau ada).
11. **FAQ:** jawab keberatan dengan positif.
12. **Penutup:** tombol beli sekali lagi.

**Larangan LP:**
- Jangan ada bagian "kekurangan", "keterbatasan", atau "produk ini nggak cocok buat kamu kalau…". Hal yang nggak ada di produk nggak usah disebut.
- Klaim di LP harus sama persis dengan isi app.

## Standar Web App ("layak dibeli")
App yang isinya cuma satu form polos **ditolak**. Minimal punya:
- **Login** pembeli. Paling gampang: login email + kode, atau akses lewat kode lisensi.
- **Sidebar + dashboard** yang nyapa nama pembeli, plus kartu angka (berapa kali dipakai, file yang udah jadi, dll.).
- **Library besar berkategori.** Misalnya 100+ template/contoh/prompt yang siap pakai, dan tiap item punya halaman detail (penjelasan, contoh, tips).
- **1 tool andalan berbentuk wizard** (langkah 1 → 2 → 3) yang ngeluarin **hasil jadi**, misalnya file Word/PDF/gambar/video, bukan cuma teks di layar.
- **Riwayat, favorit, pengaturan, tema terang/gelap.**
- **Logo berupa simbol** yang nyambung sama fungsi app. Bukan huruf awal di dalam kotak.
- **Biaya AI bukan dari kita.** Pilih salah satu:
  - **Hand-off:** app nyusun prompt lengkap, pembeli klik "Buka di ChatGPT/Gemini", terus tempel hasilnya balik ke app.
  - **BYOK:** pembeli masukin API key Gemini gratis punya sendiri. Key-nya cuma disimpan di browser pembeli, nggak dikirim ke server kita.
- Lebih bagus lagi kalau app bisa jalan **tanpa AI sama sekali** (template + logika).

**Teknis yang disarankan:** HTML/CSS/JS biasa atau framework ringan. Hosting di **Cloudflare Pages** (gratis). Data pembeli boleh di `localStorage` dulu. Kalau perlu server, pakai Cloudflare Functions + KV.

## Klip Auto (produk khusus)
Klip Auto = alat yang ngubah **video panjang** (podcast, live, webinar) jadi **klip pendek 9:16 siap upload** (Reels/TikTok/Shorts) lengkap dengan caption.

Versi lama jalan di komputer pakai Node + FFmpeg + yt-dlp, dan sering ribet buat pembeli (install Node, diblok antivirus, error di Windows). Tugas kamu: bikin versi yang **proper**.
- **Pembeli nggak perlu install apa-apa**, cukup buka di browser. Kalau nggak bisa 100% di browser, harus ada installer sekali klik buat Windows dan Mac.
- **Alurnya:** masukin video (upload file, atau link kalau memungkinkan) → transkrip otomatis → AI milih 5–10 momen paling menarik, tiap momen dikasih skor dan judul → pembeli bisa geser titik awal/akhir → **render klip 9:16** dengan wajah/subjek tetap di tengah, caption besar per kata yang sinkron, dan judul di atas → unduh MP4.
- **Gaya caption** bisa dipilih (minimal 5 preset), plus opsi logo/watermark punya pembeli.
- **Biaya AI tetap BYOK atau gratis.** Transkrip boleh pakai model yang jalan di browser (Whisper web) atau Gemini key punya pembeli.
- **Wajib dites ke video 10–30 menit beneran.** Kecepatan dan hasilnya dicatat di `produk/klip-auto/HASIL-TES.md`.
- Sebelum ngoding, tulis dulu rencana arsitekturnya di `produk/klip-auto/RENCANA.md` (apa yang jalan di browser, apa yang di server, kenapa), terus minta user baca.

## Setiap produk selesai, isi `produk/<nama>/SETOR.md`
- Nama produk, siapa pembelinya, masalah apa yang diselesaiin, harga yang diusulkan.
- Link LP + link app (yang udah live).
- 3 screenshot app (desktop) + 1 screenshot HP.
- Apa yang udah dites, dan hasilnya.

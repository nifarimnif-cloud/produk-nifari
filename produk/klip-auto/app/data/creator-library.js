/**
 * Pustaka 120 Koleksi Kreator Klip Pendek (9:16 Reels, TikTok & YouTube Shorts)
 * Terbagi ke dalam 6 kategori (masing-masing 20 item = 120 item siap pakai)
 * lengkap dengan penjelasan, contoh kalimat nyata, tips retensi, dan saran judul atas.
 */

const RAW_CREATOR_CATEGORIES = [
  {
    category: 'Hook Judul Atas',
    items: [
      {
        niche: 'Bisnis & UMKM',
        title: 'Kesalahan Harga Jual Pemula',
        hook: 'Kesalahan Hitung Harga yang Bikin Rugi',
        summary: 'Judul kotak atas untuk potongan obrolan soal margin tipis atau salah hitung modal.',
        explanation: 'Penonton pemilik usaha langsung berhenti ketika melihat kata "kesalahan hitung harga" karena takut mengalaminya sendiri.',
        example: 'Kotak Judul Atas: "Kesalahan Hitung Harga yang Bikin Rugi" — cocok dipasangkan di detik 00:00 saat narasumber membahas omzet ramai tapi kas kosong.',
        tips: 'Maksimal 6–7 kata di kotak judul atas supaya terbaca utuh dalam 1,5 detik pertama di layar HP.'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Jawaban Wawancara Gaji',
        hook: 'Cara Jawab Ekspektasi Gaji Tanpa Ragu',
        summary: 'Judul atas tajam untuk klip tips HRD atau negosiasi gaji.',
        explanation: 'Topik negosiasi gaji selalu disimpan (save) dan dibagikan ulang oleh pencari kerja maupun karyawan.',
        example: 'Kotak Judul Atas: "Cara Jawab Ekspektasi Gaji Tanpa Ragu" — gunakan kotak putih bersih agar kontras di atas video wawancara.',
        tips: 'Potong jeda napas di awal kalimat supaya narasumber langsung masuk ke contoh kalimat jawabannya.'
      },
      {
        niche: 'Keuangan Pribadi',
        title: 'Bocor Halus Gaji Bulanan',
        hook: '3 Kebiasaan Kecil Penguras Gaji',
        summary: 'Judul angka spesifik untuk bahasan pengeluaran harian yang sering tak terasa.',
        explanation: 'Angka ganjil seperti 3 atau 5 memberi sinyal bahwa isi video padat, jelas, dan cepat selesai ditonton.',
        example: 'Kotak Judul Atas: "3 Kebiasaan Kecil Penguras Gaji" — pas untuk klip berdurasi 25–40 detik.',
        tips: 'Pastikan ketiga poin benar-benar terucap sampai akhir klip agar penonton merasa puas dan tidak merasa digantung.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Cara Cepat Paham Materi Baru',
        hook: 'Teknik Belajar 20 Menit Langsung Paham',
        summary: 'Judul ringkas dengan ukuran waktu jelas untuk segmen pelajar dan mahasiswa.',
        explanation: 'Janji waktu singkat ("20 Menit") menurunkan rasa malas penonton untuk menyimak tips belajar.',
        example: 'Kotak Judul Atas: "Teknik Belajar 20 Menit Langsung Paham" — padukan dengan preset caption Kreator Kuning.',
        tips: 'Mulai klip tepat ketika pembicara mengucapkan langkah pertama, bukan saat masih basa-basi sapaan.'
      },
      {
        niche: 'Kesehatan & Pola Hidup',
        title: 'Tanda Tubuh Kurang Istirahat',
        hook: 'Tanda Badan Butuh Istirahat Meski Tidur Cukup',
        summary: 'Judul paradoks ringan untuk obrolan dokter atau praktisi kesehatan.',
        explanation: 'Kontras antara "tidur cukup" tapi "masih lelah" sangat dekat dengan pengalaman pekerja harian.',
        example: 'Kotak Judul Atas: "Tanda Badan Butuh Istirahat Meski Tidur Cukup".',
        tips: 'Gunakan mode bingkai Potong Penuh 9:16 agar ekspresi wajah dokter/narasumber terlihat jelas dan meyakinkan.'
      },
      {
        niche: 'Parenting & Keluarga',
        title: 'Menghadapi Anak Tantrum di Umum',
        hook: 'Kalimat Tenang Saat Anak Mulai Tantrum',
        summary: 'Judul solutif tanpa menghakimi untuk klip obrolan psikolog anak.',
        explanation: 'Orang tua mencari contoh kalimat praktis yang bisa langsung ditiru, bukan teori panjang.',
        example: 'Kotak Judul Atas: "Kalimat Tenang Saat Anak Mulai Tantrum".',
        tips: 'Pilih preset caption Minimalis Bersih atau Kotak Kontras agar nuansa video tetap hangat dan nyaman.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Kenapa Views Mentok di 200',
        hook: 'Alasan Video Bagus Sepi Penonton',
        summary: 'Judul pemecah rasa penasaran bagi kreator pemula.',
        explanation: 'Menyentuh masalah klasik kreator baru yang merasa sudah edit lama namun belum dapat jangkauan.',
        example: 'Kotak Judul Atas: "Alasan Video Bagus Sepi Penonton".',
        tips: 'Jaga durasi klip di kisaran 22–35 detik supaya rasio tonton sampai habis (completion rate) tinggi.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Cek Ini Sebelum Renovasi Rumah',
        hook: 'Wajib Cek Ini Sebelum Mulai Renovasi',
        summary: 'Judul peringatan praktis untuk podcast arsitek atau kontraktor.',
        explanation: 'Kata "Sebelum Mulai" memicu penonton menyimpan video untuk berjaga-jaga di masa depan.',
        example: 'Kotak Judul Atas: "Wajib Cek Ini Sebelum Mulai Renovasi".',
        tips: 'Sertakan angka biaya jika narasumber menyebutkannya di dalam percakapan.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Rahasia Warung Kecil Awet Ramai',
        hook: 'Kenapa Warung Sederhana Ini Selalu Antre',
        summary: 'Judul cerita lapangan untuk bedah bisnis makanan dan minuman.',
        explanation: 'Studi kasus nyata selalu lebih kuat dibanding nasihat umum karena memancing rasa ingin tahu.',
        example: 'Kotak Judul Atas: "Kenapa Warung Sederhana Ini Selalu Antre".',
        tips: 'Biarkan kata kunci nama menu atau lokasi tetap tertulis jelas pada caption per kata.'
      },
      {
        niche: 'Mindset & Produktivitas',
        title: 'Berhenti Menunggu Sempurna',
        hook: 'Alasan Terlalu Perfeksionis Bikin Jalan di Tempat',
        summary: 'Judul reflektif untuk potongan cerita kegagalan dan kebangkitan tamu podcast.',
        explanation: 'Kalimat jujur dari pengalaman pribadi tamu podcast sering dibagikan ulang ke Story.',
        example: 'Kotak Judul Atas: "Alasan Terlalu Perfeksionis Bikin Jalan di Tempat".',
        tips: 'Sisakan jeda 0,4 detik di akhir kalimat penutup agar pesan emosionalnya mengendap.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Cara Pakai AI Tanpa Terlihat Kaku',
        hook: 'Cara Pakai AI Biar Hasilnya Tetap Natural',
        summary: 'Judul aplikatif untuk tutorial atau diskusi kerja zaman sekarang.',
        explanation: 'Orang tidak lagi sekadar cari nama alatnya, tapi cara memakainya agar hasilnya rapi dan manusiawi.',
        example: 'Kotak Judul Atas: "Cara Pakai AI Biar Hasilnya Tetap Natural".',
        tips: 'Gunakan preset Hijau Elektrik untuk memberi kesan modern dan segar.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Balas Chat Calon Pembeli yang PHP',
        hook: 'Cara Balas Chat "Tanya Dulu" Biar Jadi Beli',
        summary: 'Judul taktis untuk admin CS, agen, dan penjual online.',
        explanation: 'Masalah chat berhenti di "terima kasih infonya" dialami ribuan penjual online setiap hari.',
        example: 'Kotak Judul Atas: "Cara Balas Chat Tanya Dulu Biar Jadi Beli".',
        tips: 'Tinjau ejaan tanda kutip pada editor teks Langkah 2 agar tampil rapi saat dirender.'
      },
      {
        niche: 'Kepemimpinan & Tim',
        title: 'Menegur Staf Tanpa Menjatuhkan',
        hook: 'Cara Menegur Tim Tanpa Bikin Sakit Hati',
        summary: 'Judul manajemen tim untuk manajer baru dan pemilik usaha.',
        explanation: 'Topik komunikasi antarmanusia di kantor sangat sering memicu diskusi positif di kolom komentar.',
        example: 'Kotak Judul Atas: "Cara Menegur Tim Tanpa Bikin Sakit Hati".',
        tips: 'Pastikan wajah pembicara terkunci stabil di tengah menggunakan tombol Pindai Posisi Wajah.'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Menolak Revisi di Luar Kesepakatan',
        hook: 'Kalimat Sopan Saat Klien Minta Revisi Terus',
        summary: 'Judul penyelamat pekerja lepas desain, video, dan penulis.',
        explanation: 'Sangat relevan dan langsung memicu rasa senasib di kalangan pekerja kreatif.',
        example: 'Kotak Judul Atas: "Kalimat Sopan Saat Klien Minta Revisi Terus".',
        tips: 'Potong langsung pada bagian contoh kalimat yang diucapkan narasumber.'
      },
      {
        niche: 'Otomotif & Hobi',
        title: 'Gejala Awal Mesin Perlu Servis',
        hook: 'Suara Kecil di Mesin yang Jangan Diabaikan',
        summary: 'Judul edukasi perawatan kendaraan harian.',
        explanation: 'Pemilik kendaraan takut biaya turun mesin besar, sehingga informasi pencegahan sangat dicari.',
        example: 'Kotak Judul Atas: "Suara Kecil di Mesin yang Jangan Diabaikan".',
        tips: 'Gunakan resolusi 1080p bila klip menampilkan detail komponen kecil.'
      },
      {
        niche: 'Hukum & Kontrak Sederhana',
        title: 'Bahaya Kerja Sama Tanpa Hitam di Atas Putih',
        hook: 'Jangan Mulai Patungan Usaha Tanpa Klausul Ini',
        summary: 'Judul edukasi pencegahan sengketa bisnis pertemanan.',
        explanation: 'Cerita patungan usaha bareng teman hampir selalu mengundang ratusan komentar pengalaman pribadi.',
        example: 'Kotak Judul Atas: "Jangan Mulai Patungan Usaha Tanpa Klausul Ini".',
        tips: 'Pilih gaya kotak judul Gelap Elegan untuk kesan serius dan tepercaya.'
      },
      {
        niche: 'Pernikahan & Hubungan',
        title: 'Obrolan Keuangan Sebelum Menikah',
        hook: '5 Hal Soal Uang yang Wajib Dibahas Sebelum Nikah',
        summary: 'Judul diskusi dewasa yang sangat sering di-mention ke pasangan.',
        explanation: 'Konten yang memicu penonton menandai (tag) pasangannya punya jangkauan organik sangat kencang.',
        example: 'Kotak Judul Atas: "5 Hal Soal Uang yang Wajib Dibahas Sebelum Nikah".',
        tips: 'Pastikan volume suara asli jernih dan kata kunci poinnya tidak tertutup tombol kanan layar aplikasi.'
      },
      {
        niche: 'Olahraga & Kebugaran',
        title: 'Mulai Olahraga Buat yang Sibuk',
        hook: 'Cukup 15 Menit Sehari Buat Jaga Stamina Kerja',
        summary: 'Judul realistis untuk pekerja kantoran yang jarang sempat ke gym.',
        explanation: 'Target kecil yang masuk akal jauh lebih disukai daripada jadwal latihan ekstrem.',
        example: 'Kotak Judul Atas: "Cukup 15 Menit Sehari Buat Jaga Stamina Kerja".',
        tips: 'Gunakan tempo potongan yang cepat tanpa jeda hening lebih dari 0,5 detik.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Kalimat Meeting Lebih Profesional',
        hook: 'Ganti Kata "I Think" Pakai 3 Kalimat Ini',
        summary: 'Judul edukasi bahasa asing singkat yang langsung bisa dipraktikkan.',
        explanation: 'Format "Ganti X Pakai Y" adalah salah satu pola edukasi paling tinggi tingkat simpannya.',
        example: 'Kotak Judul Atas: "Ganti Kata I Think Pakai 3 Kalimat Ini".',
        tips: 'Periksa ejaan kata bahasa Inggris di kolom teks caption Langkah 2 sebelum klik Render MP4.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Titik Balik Setelah Gagal Pertama',
        hook: 'Pelajaran Mahal dari Usaha Pertama yang Tutup',
        summary: 'Judul jujur untuk segmen cerita jatuh-bangun narasumber.',
        explanation: 'Penonton Indonesia sangat menyukai kisah nyata yang apa adanya tanpa dibuat-buat.',
        example: 'Kotak Judul Atas: "Pelajaran Mahal dari Usaha Pertama yang Tutup".',
        tips: 'Pilih momen ketika intonasi suara tamu terdengar paling tulus dan tenang.'
      }
    ]
  },
  {
    category: 'Pembuka 3 Detik',
    items: [
      {
        niche: 'Bisnis & UMKM',
        title: 'Pola Membantah Asumsi Umum',
        hook: 'Ramai Pembeli Belum Tentu Untung',
        summary: 'Mulai klip tepat di kalimat yang mematahkan anggapan banyak orang.',
        explanation: 'Otak penonton langsung terjaga saat mendengar pernyataan yang berlawanan dengan kebiasaan umum.',
        example: '"Banyak yang kira toko ramai itu pasti untung besar, padahal di bulan ketiga justru di situ paling rawan boncos..."',
        tips: 'Buang kata sambung seperti "Jadi gini ya mas..." di awal rekaman; langsung masuk ke kata "Banyak yang kira...".'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Pola Pengakuan Pengalaman HRD',
        hook: 'Dari 500 CV, Ini yang Pertama Dilihat',
        summary: 'Membuka klip dengan angka pengalaman nyata pembicara.',
        explanation: 'Angka pengalaman langsung membangun kredibilitas tanpa perlu perkenalan panjang nama dan jabatan.',
        example: '"Selama sepuluh tahun memeriksa ratusan CV pelamar, hal pertama yang saya lihat sebenarnya cuma bagian tiga baris atas ini..."',
        tips: 'Tidak perlu memasukkan perkenalan host di klip pendek; biarkan penonton langsung mendengar intinya.'
      },
      {
        niche: 'Keuangan Pribadi',
        title: 'Pola Pertanyaan Tajam dari Host',
        hook: 'Gaji 8 Juta Bisa Beli Rumah Nggak?',
        summary: 'Memasukkan 2 detik pertanyaan singkat host sebelum jawaban narasumber.',
        explanation: 'Pertanyaan pendek mewakili suara hati penonton dan membuat mereka menunggu jawaban detik berikutnya.',
        example: 'Host: "Gaji delapan juta di kota besar masih mungkin nabung darurat nggak?" Narasumber: "Sangat mungkin asal urutannya dibalik..."',
        tips: 'Pastikan pertanyaan host tidak lebih dari 3 detik agar jawaban inti segera muncul.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Pola Perbandingan Lama vs Baru',
        hook: 'Jangan Menghafal Buku Pakai Cara Lama',
        summary: 'Membandingkan kebiasaan lama yang melelahkan dengan alternatif baru.',
        explanation: 'Menciptakan rasa penasaran instan terhadap cara kedua yang lebih ringan.',
        example: '"Kalau kamu masih baca ulang catatan berkali-kali malam sebelum ujian, coba ganti pakai teknik tutup-tulis selama sepuluh menit..."',
        tips: 'Gunakan preset Baris Fokus agar perhatian mata tertuju penuh ke tiap kata kunci.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Pola Angka Spesifik Hasil Uji Coba',
        hook: 'Hasil Upload 30 Klip Berturut-turut',
        summary: 'Membuka dengan eksperimen nyata yang sudah dijalani pembicara.',
        explanation: 'Penonton suka mendengar rangkuman eksperimen orang lain karena menghemat waktu coba-coba mereka.',
        example: '"Setelah saya tes upload tiga puluh klip pendek selama sebulan penuh, ternyata cuma dua hal ini yang benar-benar ngaruh..."',
        tips: 'Pastikan bagian kesimpulan "dua hal ini" tidak terpotong di tengah kalimat.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Pola Rahasia Dapur Usaha',
        hook: 'Bukan Resepnya, Ini yang Bikin Pelanggan Balik',
        summary: 'Menggeser fokus dari hal teknis ke faktor pelayanan/konsistensi.',
        explanation: 'Sudut pandang tak terduga membuat pemilik usaha kuliner menyimak sampai detik terakhir.',
        example: '"Rasa enak itu cuma tiket masuk pertama, tapi yang bikin orang balik minggu depannya justru kecepatan sajian lima menit pertama..."',
        tips: 'Cocok untuk durasi pendek 18–28 detik yang padat.'
      },
      {
        niche: 'Parenting & Keluarga',
        title: 'Pola Kalimat Pengganti Langsung',
        hook: 'Ubah Kalimat "Jangan Nangis" Jadi Ini',
        summary: 'Langsung menyebut kalimat yang sering keceplosan diucapkan orang tua.',
        explanation: 'Membuat penonton merasa dipahami tanpa digurui.',
        example: '"Waktu anak jatuh, daripada spontan bilang jangan nangis, jauh lebih menenangkan kalau kita bilang..."',
        tips: 'Geser titik selesai tepat setelah contoh kalimat pengganti selesai dijelaskan.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Pola Simulasi Dialog Pembeli',
        hook: 'Kalau Pembeli Bilang "Kemahalan"',
        summary: 'Membuka klip dengan kutipan keberatan pembeli yang sering terjadi.',
        explanation: 'Begitu mendengar keberatan yang akrab di telinga, penjual otomatis menunggu cara menjawabnya.',
        example: '"Kalau calon pembeli bilang harganya lebih mahal dari toko sebelah, jangan buru-buru kasih diskon, jawab pakai pertanyaan ini..."',
        tips: 'Beri penekanan judul atas singkat maksimal 6 kata.'
      },
      {
        niche: 'Kesehatan & Pola Hidup',
        title: 'Pola Kebiasaan Pagi Hari',
        hook: 'Satu Hal Keliru Saat Baru Bangun Pagi',
        summary: 'Mengangkat rutinitas 15 menit pertama setelah bangun tidur.',
        explanation: 'Semua penonton mengalami pagi hari, sehingga relevansinya mencakup audiens luas.',
        example: '"Begitu bangun tidur, kebiasaan langsung minum kopi manis sebelum air putih ternyata bikin tubuh cepat mengantuk jam sepuluh siang..."',
        tips: 'Sangat pas dipadukan dengan format Utuh 16:9 Latar Blur bila video asli menampilkan grafik/peraga.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Pola Biaya Tersembunyi',
        hook: 'Biaya Renovasi yang Sering Lupa Dihitung',
        summary: 'Membuka dengan peringatan pos anggaran yang sering terlewat.',
        explanation: 'Menyelamatkan uang penonton adalah salah satu pemicu tombol bagikan (share) terkuat.',
        example: '"Waktu nyusun anggaran bangun rumah, sembilan dari sepuluh orang lupa nyiapin cadangan sepuluh persen buat pekerjaan sambungan pipa dan listrik..."',
        tips: 'Pastikan angka persentase tertulis jelas di caption.'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Pola Batasan Profesional',
        hook: 'Tanda Klien yang Sebaiknya Ditolak Halus',
        summary: 'Membahas bendera merah (red flag) sebelum menerima proyek.',
        explanation: 'Membantu pekerja lepas merasa lebih percaya diri menjaga kualitas kerja.',
        example: '"Kalau sejak obrolan awal klien sudah bilang ini gampang kok cuma lima menit, biasanya justru proyek itu yang revisinya paling panjang..."',
        tips: 'Biarkan ekspresi senyum tipis atau anggukan pembicara masuk dalam frame 9:16.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Pola Hemat Waktu Kerja Harian',
        hook: 'Kerjaan 2 Jam Selesai 10 Menit',
        summary: 'Kontras penghematan waktu untuk tugas administrasi berulang.',
        explanation: 'Menarik perhatian pekerja kantoran, guru, dan pelaku UMKM yang sibuk.',
        example: '"Dulu rekap catatan rapat satu jam itu butuh dua jam sendiri, sekarang cukup tempel transkripnya pakai susunan instruksi tiga baris ini..."',
        tips: 'Pastikan tiga baris instruksinya terdengar utuh sebelum klip berakhir.'
      },
      {
        niche: 'Mindset & Produktivitas',
        title: 'Pola Aturan 2 Menit',
        hook: 'Cara Lawan Rasa Malas Mulai Kerja',
        summary: 'Tips psikologi sederhana yang bisa langsung dicoba detik itu juga.',
        explanation: 'Saran yang terlalu rumit hanya ditonton, sedangkan saran 2 menit langsung dicoba dan disimpan.',
        example: '"Kalau berat banget mau mulai ngerjain tugas besar, janji saja sama diri sendiri buat buka filenya selama dua menit pertama..."',
        tips: 'Cocok untuk klip pendek 20 detik sebagai pembuka akun baru.'
      },
      {
        niche: 'Kepemimpinan & Tim',
        title: 'Pola Kesalahan Bos Baru',
        hook: 'Kesalahan Saat Pertama Kali Punya Staf',
        summary: 'Cerita reflektif saat baru belajar mendelegasikan pekerjaan.',
        explanation: 'Pemilik usaha kecil yang baru merekrut 1–3 orang sangat membutuhkan panduan praktis ini.',
        example: '"Kesalahan saya waktu baru punya dua karyawan adalah berharap mereka langsung tahu standar rapi di kepala saya tanpa daftar cek tertulis..."',
        tips: 'Potong bagian cerita yang paling konkret dan jujur.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Pola Koreksi Pengucapan Ramah',
        hook: 'Kata Inggris yang Sering Salah Ucap di Kantor',
        summary: 'Membuka dengan kata populer sehari-hari di ruang rapat.',
        explanation: 'Cepat memancing rasa ingin mengecek cara baca diri sendiri.',
        example: '"Kata ini tulisannya memang mirip, tapi di rapat kerja bacanya bukan begitu melainkan..."',
        tips: 'Gunakan fitur Sinkronkan Ulang Suara (Whisper) agar perpindahan kata presisi.'
      },
      {
        niche: 'Hukum & Kontrak Sederhana',
        title: 'Pola Bukti Chat WhatsApp',
        hook: 'Apakah Janji di Chat WA Sah Secara Hukum?',
        summary: 'Pertanyaan praktis sehari-hari yang sering bikin orang penasaran.',
        explanation: 'Mengubah topik hukum yang berat menjadi sangat dekat dengan keseharian.',
        example: '"Banyak yang tanya, kalau kesepakatan kerja cuma lewat chat WhatsApp tanpa kertas meterai, apakah tetap punya kekuatan bukti? Jawabannya..."',
        tips: 'Pastikan jawaban jelas "bisa, dengan syarat..." tercakup penuh di dalam durasi klip.'
      },
      {
        niche: 'Pernikahan & Hubungan',
        title: 'Pola Komunikasi Tanpa Menyalahkan',
        hook: 'Bedanya Mengeluh vs Menyampaikan Kebutuhan',
        summary: 'Membedah dua kalimat mirip dengan dampak emosi berbeda.',
        explanation: 'Memberi contoh kalimat nyata yang membuat hubungan lebih adem.',
        example: '"Daripada bilang kamu nggak pernah bantu di rumah, coba ubah jadi aku butuh bantuanmu pegang bagian ini lima belas menit..."',
        tips: 'Jaga intonasi akhir klip tetap hangat.'
      },
      {
        niche: 'Otomotif & Hobi',
        title: 'Pola Mitos Panasin Mesin',
        hook: 'Masih Perlu Panasin Mobil 15 Menit Pagi Hari?',
        summary: 'Meluruskan kebiasaan turun-temurun dengan penjelasan teknologi mesin modern.',
        explanation: 'Topik mitos vs fakta otomotif selalu ramai diskusi di kolom komentar.',
        example: '"Mobil keluaran sepuluh tahun terakhir sebenarnya nggak perlu lagi dipanasin sampai lima belas menit diam di garasi, cukup..."',
        tips: 'Potong padat di bawah 35 detik.'
      },
      {
        niche: 'Olahraga & Kebugaran',
        title: 'Pola Jalan Kaki Setelah Makan',
        hook: 'Manfaat Jalan Santai 10 Menit Habis Makan Siang',
        summary: 'Kebiasaan ringan tanpa alat olahraga.',
        explanation: 'Semua orang bisa melakukannya di kantor maupun di rumah.',
        example: '"Jangan langsung duduk bungkuk atau rebahan habis makan siang, jalan santai sepuluh menit saja bantu jaga gula darah tetap stabil..."',
        tips: 'Tambahkan watermark akun tipis di pojok kanan atas.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Pola Nasihat Terbaik Orang Tua/Mentor',
        hook: 'Satu Kalimat Mentor yang Mengubah Cara Kerja Saya',
        summary: 'Mengutip satu pesan pendek yang berkesan mendalam.',
        explanation: 'Kutipan pengalaman hidup memiliki daya bagikan ulang paling awet.',
        example: '"Waktu usaha saya hampir tutup, mentor saya cuma bilang satu kalimat: jangan sibuk kelihatan besar, fokus saja tetap hidup enam bulan ke depan..."',
        tips: 'Gunakan preset Minimalis Bersih agar fokus penuh ke raut wajah dan cerita pembicara.'
      }
    ]
  },
  {
    category: 'Sudut Potong Podcast',
    items: [
      {
        niche: 'Semua Niche',
        title: 'Potong Saat Perubahan Intonasi Naik',
        hook: 'Deteksi Lonjakan Antusiasme Pembicara',
        summary: 'Cari menit ketika pembicara mulai condong ke depan atau berbicara lebih tegas.',
        explanation: 'Perubahan energi suara menandakan pembicara sedang menyampaikan poin yang paling ia yakini.',
        example: 'Pada rekaman 25 menit, tandai bagian saat tamu berkata "Nah, ini bagian yang jarang orang sadar..." lalu akhiri di kalimat simpulan.',
        tips: 'Durasi ideal 1 poin utuh biasanya 25–45 detik.'
      },
      {
        niche: 'Semua Niche',
        title: 'Satu Klip = Satu Gagasan Utuh',
        hook: 'Jangan Campur 2 Topik dalam 1 Klip',
        summary: 'Lebih baik jadi 2 klip terpisah daripada 1 klip 90 detik yang melebar ke mana-mana.',
        explanation: 'Penonton video vertikal menyukai kepastian satu masalah dan satu jawaban tuntas.',
        example: 'Jika tamu membahas cara rekrut staf lalu lanjut bahas pajak toko, potong tepat sebelum topik pajak dimulai.',
        tips: 'Gunakan penggeser Titik Selesai di Langkah 2 untuk memotong tepat di titik koma/titik akhir kalimat.'
      },
      {
        niche: 'Bisnis & UMKM',
        title: 'Angkat Bagian Angka & Contoh Rupiah',
        hook: 'Momen Saat Tamu Menyebut Hitungan Nyata',
        summary: 'Setiap kali pembicara menyebut simulasi angka modal, omzet, atau persentase, jadikan kandidat klip utama.',
        explanation: 'Angka membuat nasihat abstrak berubah jadi gambaran nyata di kepala penonton.',
        example: '"Modal bahan bakunya cuma empat ribu perak, tapi karena kemasannya rapi bisa dijual dua belas ribu..."',
        tips: 'Pastikan angka tertulis benar di kolom teks caption.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Urutan Langkah 1–2–3',
        hook: 'Potong Bagian Tutorial Berurutan',
        summary: 'Ambil segmen ketika narasumber merinci langkah pertama, kedua, dan ketiga.',
        explanation: 'Struktur berangka menjaga penonton bertahan sampai poin terakhir disebutkan.',
        example: '"Pertama catat arus keluar tujuh hari, kedua pisahkan rekening belanja stok, ketiga baru tentukan gaji sendiri..."',
        tips: 'Jangan potong poin ketiga supaya klip terasa memuaskan dan layak disimpan.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Kontras Kondisi Dulu vs Sekarang',
        hook: 'Cerita Titik Terendah Menuju Bangkit',
        summary: 'Ambil momen transisi dari kesulitan nyata menuju langkah perbaikan pertama.',
        explanation: 'Cerita manusiawi membangun kedekatan emosional jauh lebih kuat daripada sekadar pamer keberhasilan.',
        example: '"Waktu itu sisa saldo tinggal cukup buat bensin seminggu, akhirnya saya putuskan keliling tawarin sampel langsung ke sepuluh toko..."',
        tips: 'Hindari musik latar yang terlalu keras saat upload agar kejernihan suara tetap terjaga.'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Momen Bedah Kasus Sehari-hari di Kantor',
        hook: 'Contoh Situasi Nyata di Meja Kerja',
        summary: 'Pilih bagian ketika pembicara memberi ilustrasi kejadian sehari-hari.',
        explanation: 'Ilustrasi situasi membuat penonton membayangkan diri mereka berada di kejadian tersebut.',
        example: '"Misalnya atasan minta laporan mendadak jam empat sore padahal ada tugas lain yang belum kelar, kalimat konfirmasinya begini..."',
        tips: 'Gunakan bingkai Potong Penuh 9:16 mengikuti wajah pembicara utama.'
      },
      {
        niche: 'Semua Niche',
        title: 'Pangkas Basa-basi & Sapaan Awal',
        hook: 'Mulai Langsung di Kata Kunci',
        summary: 'Lewati kalimat "Terima kasih sudah mengundang saya" atau "Apa kabar semuanya".',
        explanation: 'Tiga detik pertama di Reels/TikTok menentukan apakah penonton lanjut menyimak atau geser ke video lain.',
        example: 'Geser Titik Mulai dari detik 04.2 langsung ke detik 09.8 saat kalimat inti dimulai.',
        tips: 'Cek hasilnya dengan tombol Putar Preview di Langkah 3.'
      },
      {
        niche: 'Semua Niche',
        title: 'Pertanyaan Tajam + Jawaban Singkat Padat',
        hook: 'Format Tanya-Jawab Cepat 30 Detik',
        summary: 'Gabungkan 3 detik pertanyaan host yang mewakili rasa penasaran awam dengan 25 detik jawaban tamu.',
        explanation: 'Pergantian dua suara pembicara di awal memberi dinamika ritme yang enak didengar.',
        example: 'Host bertanya singkat, lalu kamera fokus ke wajah tamu yang langsung menjawab lugas.',
        tips: 'Aktifkan Kunci Wajah Otomatis agar perpindahan fokus dari host ke tamu tetap mulus di tengah frame.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Cerita Kegagalan Produk Pertama',
        hook: 'Menu Pertama yang Gagal Laku & Pelajarannya',
        summary: 'Ambil bagian evaluasi jujur kenapa percobaan pertama kurang berhasil.',
        explanation: 'Pelajaran dari kesalahan nyata dinilai sangat mahal dan jujur oleh sesama pelaku usaha.',
        example: '"Dulu kami bikin lima belas varian rasa sekaligus, ternyata bahan banyak terbuang dan pembeli malah bingung memilih..."',
        tips: 'Beri judul atas yang menyoroti pelajarannya.'
      },
      {
        niche: 'Keuangan Pribadi',
        title: 'Analogi Sederhana yang Mudah Dicerna',
        hook: 'Penjelasan Istilah Rumit Pakai Bahasa Warung',
        summary: 'Potong saat narasumber menjelaskan istilah sulit dengan perumpamaan sehari-hari.',
        explanation: 'Analogi sederhana membuat penonton awam merasa pintar dan senang membagikannya ke keluarga.',
        example: '"Dana darurat itu ibarat ban serep di bagasi mobil; kita berharap nggak pernah pecah ban, tapi tenang waktu jalan jauh..."',
        tips: 'Klip analogi pendek 20–30 detik sangat cocok untuk semua platform vertikal.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Momen Bongkar Alat atau Cara Kerja',
        hook: 'Alur Kerja Sederhana di Balik Layar',
        summary: 'Pilih bagian saat tamu menyebutkan alur kerja atau perlengkapan praktis yang ia pakai.',
        explanation: 'Penonton selalu penasaran dengan dapur kerja praktis orang yang sudah jalan lebih dulu.',
        example: '"Rekamnya cukup dekat jendela pagi hari pakai mikrofon jepit murah, yang penting suaranya bersih nggak menggema..."',
        tips: 'Pastikan nama jenis alat tertulis jelas pada teks caption.'
      },
      {
        niche: 'Kesehatan & Pola Hidup',
        title: 'Meluruskan Kebiasaan Keliru Turun-Temurun',
        hook: 'Kebiasaan Sehari-hari yang Ternyata Kurang Tepat',
        summary: 'Cari segmen ketika dokter/ahli meluruskan kebiasaan umum dengan alasan ilmiah ringan.',
        explanation: 'Koreksi ramah yang disertai solusi mudah selalu mendapat banyak tanda suka dan simpan.',
        example: '"Saat anak demam ringan, kompresnya bukan pakai air es dingin, melainkan air hangat suam-suam kuku supaya..."',
        tips: 'Wajib sertakan bagian penjelasan alasannya agar informasi utuh dan tidak disalahpahami.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Perbandingan Kalimat Kaku vs Kalimat Luwes',
        hook: 'Contoh Before-After Cara Ngomong ke Pelanggan',
        summary: 'Potong segmen yang menyandingkan kalimat salah dan kalimat benar secara berdampingan.',
        explanation: 'Kontras dua contoh kalimat membuat nilai praktis klip langsung terasa nyata.',
        example: '"Jangan ketik: Barang habis kak. Ganti jadi: Warna hitamnya sedang diproduksi ulang kak, untuk kirim hari ini ready warna navy..."',
        tips: 'Gunakan preset Kotak Kontras agar pergantian kalimat terbaca tegas.'
      },
      {
        niche: 'Parenting & Keluarga',
        title: 'Sudut Pandang Anak yang Jarang Disadari',
        hook: 'Apa yang Sebenarnya Dirasakan Anak Saat Dimarahi',
        summary: 'Pilih momen empati yang mengajak orang tua melihat dari kacamata anak.',
        explanation: 'Momen reflektif yang lembut sering dibagikan antar-ibu di grup WhatsApp keluarga.',
        example: '"Waktu anak menumpahkan air dari gelas, ia bukan sengaja nakal, melainkan koordinasi jari tangannya memang sedang belajar..."',
        tips: 'Akhiri klip pada kalimat yang menenangkan dan menguatkan orang tua.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Tips Cek Fisik dalam 1 Menit',
        hook: 'Cara Cek Kualitas Bangunan Tanpa Alat Rumit',
        summary: 'Ambil bagian tips pengecekan visual yang bisa dipraktikkan orang awam.',
        explanation: 'Sangat berguna bagi calon pembeli rumah atau pemilik rumah yang sedang merenovasi.',
        example: '"Coba ketuk pelan sudut keramik kamar mandi pakai koin; kalau bunyinya nyaring kosong, berarti adukan semen di bawahnya belum rata..."',
        tips: 'Cocok dibuat seri klip Bagian 1, Bagian 2, dan Bagian 3.'
      },
      {
        niche: 'Kepemimpinan & Tim',
        title: 'Cara Rapat Singkat 15 Menit',
        hook: 'Format Briefing Pagi Biar Tim Fokus',
        summary: 'Potong penjelasan rutinitas koordinasi tim yang ringkas dan jelas.',
        explanation: 'Banyak pemilik usaha ingin rapat singkat yang efektif tanpa membuang jam kerja.',
        example: '"Briefing pagi cukup sepuluh menit bahas tiga hal: apa yang beres kemarin, target prioritas hari ini, dan satu kendala yang butuh dibantu..."',
        tips: 'Pastikan ketiga poin masuk utuh dalam satu klip.'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Cara Menentukan Harga Paket Jasa',
        hook: 'Jangan Jual Jam Kerja, Jual Paket Hasil',
        summary: 'Segmen obrolan tentang cara menaikkan nilai jasa secara wajar.',
        explanation: 'Membuka wawasan baru bagi pekerja jasa yang selama ini dibayar terlalu murah.',
        example: '"Kalau kamu jual per jam, makin cepat kamu mahir justru bayaranmu makin kecil. Kemas jadi paket hasil terima beres..."',
        tips: 'Durasi 25–35 detik sudah sangat kuat untuk pesan ini.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: '3 Frasa Penyelamat Saat Lupa Kosakata',
        hook: 'Kalimat Penyelamat Saat Blank Ngomong Inggris',
        summary: 'Potong bagian tips praktis mengatasi grogi saat berbicara bahasa asing.',
        explanation: 'Mengurangi rasa takut salah bagi pembelajar dewasa di Indonesia.',
        example: '"Kalau tiba-tiba lupa bahasa Inggrisnya suatu benda waktu rapat, jangan diam panik, pakai kalimat penghubung ini..."',
        tips: 'Tulis ejaan frasa bahasa Inggris dengan huruf yang tepat di editor teks.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Batasan Hal yang Jangan Diserahkan ke Mesin',
        hook: 'Bagian Kerja yang Tetap Harus Sentuhan Manusia',
        summary: 'Pandangan berimbang soal teknologi yang terasa dewasa dan bijak.',
        explanation: 'Opini berimbang mengundang komentar berkualitas dari para praktisi.',
        example: '"Biar kerangka awalnya dibantu mesin nggak masalah, tapi cerita pengalaman lapangan dan empati ke klien tetap harus kita sendiri yang tulis..."',
        tips: 'Gunakan mode Utuh 16:9 Latar Blur jika pembicara duduk agak berjauhan berdua.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kalimat Penutup yang Menggantung Manis (Loop)',
        hook: 'Akhiri Tepat di Puncak Kalimat Kesimpulan',
        summary: 'Potong detik akhir tepat setelah kata kunci penutup tanpa ekor kata "gitu sih mas".',
        explanation: 'Akhir yang tegas membuat penonton sering memutar ulang klip dari awal secara otomatis.',
        example: 'Hentikan tepat di kalimat "...dan itulah alasan kenapa konsistensi kecil selalu menang dari semangat musiman."',
        tips: 'Kurangi 0,2–0,3 detik terakhir bila terdengar gumaman setelah kalimat selesai.'
      }
    ]
  },
  {
    category: 'Gaya & Posisi Caption',
    items: [
      {
        niche: 'Semua Niche',
        title: 'Preset Kreator Kuning untuk Podcast Gelap',
        hook: 'Kontras Paling Tajam di Studio Redup',
        summary: 'Gunakan teks putih tebal dengan sorot kata aktif kuning cerah pada latar studio podcast gelap.',
        explanation: 'Kombinasi putih-kuning di atas latar gelap adalah standar tertinggi keterbacaan di layar HP luar ruangan.',
        example: 'Pilih preset "Kreator Kuning" di Langkah 3 saat baju pembicara atau latar sofa berwarna hitam/cokelat tua.',
        tips: 'Hindari meletakkan watermark di bawah karena area bawah dipakai untuk nama akun TikTok/Reels.'
      },
      {
        niche: 'Semua Niche',
        title: 'Preset Kotak Kontras untuk Latar Terang/Outdoor',
        hook: 'Tetap Terbaca Jelas Meski Baju Putih',
        summary: 'Pakai latar kotak gelap semi-transparan di belakang teks saat video direkam di ruangan terang.',
        explanation: 'Tanpa alas kotak gelap, huruf putih bisa menyatu dengan kemeja putih pembicara.',
        example: 'Pilih preset "Kotak Kontras" untuk rekaman seminar siang hari, ruang kelas, atau kafe terang.',
        tips: 'Pasangkan dengan kotak judul atas gaya "Gelap Elegan" agar serasi dari atas ke bawah.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Preset Hijau Elektrik untuk Topik Modern',
        hook: 'Aksen Segar untuk Konten Bisnis, Tech & Produktivitas',
        summary: 'Sorotan kata hijau elektrik memberi identitas visual khas yang cepat dikenali pengikut.',
        explanation: 'Konsistensi satu warna sorot kata membuat penonton langsung mengenali channel kamu bahkan sebelum melihat nama akun.',
        example: 'Pilih preset "Hijau Elektrik" untuk seri klip harian tips kerja, koding, desain, atau bisnis digital.',
        tips: 'Gunakan terus 1 preset yang sama minimal untuk 15 klip beruntun agar feed terlihat rapi.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Preset Minimalis Bersih untuk Cerita Emosional',
        hook: 'Tampilan Halus Tanpa Mengganggu Ekspresi',
        summary: 'Huruf bersih yang menonjolkan raut wajah pembicara pada cerita reflektif.',
        explanation: 'Untuk segmen renungan, psikologi, atau kisah hidup, tampilan bersih terasa lebih tulus dan sinematik.',
        example: 'Pilih preset "Minimalis Bersih" + sembunyikan judul atas bila 3 detik pertama sudah sangat emosional.',
        tips: 'Pastikan ejaan huruf besar-kecil rapi di kolom teks Langkah 2.'
      },
      {
        niche: 'Bisnis & UMKM',
        title: 'Preset Merah Podcast untuk Pernyataan Tegas',
        hook: 'Sorotan Kuat untuk Peringatan & Fakta Penting',
        summary: 'Cocok untuk klip peringatan anti-rugi, hukum bisnis, atau bedah kasus.',
        explanation: 'Aksen merah menarik fokus mata secara cepat pada kata kerja penting yang sedang diucapkan.',
        example: 'Pilih preset "Merah Podcast" saat membahas bahaya utang konsumtif atau kesalahan kontrak.',
        tips: 'Jangan gabungkan banyak stiker tambahan lagi saat upload agar layar tetap bersih.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Preset Baris Fokus untuk Materi Cepat',
        hook: 'Bantu Penonton Menyimak Tanpa Suara',
        summary: 'Banyak pengguna menonton video di tempat umum dengan volume kecil; baris fokus menjaga pemahaman 100%.',
        explanation: 'Empat kata per grup membuat mata tidak lelah melompat ke kiri dan kanan layar.',
        example: 'Pilih preset "Baris Fokus" untuk klip edukasi bahasa asing, keuangan, atau ringkasan buku.',
        tips: 'Klip Auto otomatis mengelompokkan 3–4 kata per baris sesuai ritme baca ideal.'
      },
      {
        niche: 'Semua Niche',
        title: 'Aturan Zona Aman Layar 9:16 (Safe Zone)',
        hook: 'Jangan Sampai Tertutup Tombol Like & Deskripsi',
        summary: 'Area 20% paling bawah dan sisi kanan bawah layar tertutup antarmuka TikTok/Reels/Shorts.',
        explanation: 'Mesin Klip Auto sudah menempatkan caption tepat di area tengah-bawah yang aman dari tertutup teks deskripsi aplikasi.',
        example: 'Letakkan logo/watermark di Pojok Kanan Atas atau Pojok Kiri Atas agar tidak bertabrakan dengan tombol kanan bawah.',
        tips: 'Cek posisi keseluruhan di kanvas pratinjau Langkah 3 sebelum klik Render.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kapan Pilih Potong Penuh vs Latar Blur 16:9',
        hook: 'Panduan Memilih Mode Bingkai Video',
        summary: 'Gunakan Potong Penuh 9:16 untuk 1 pembicara close-up; gunakan Latar Blur bila ada 2 orang berjauhan atau slide.',
        explanation: 'Jika 2 pembicara duduk di ujung kiri dan kanan dalam 1 frame lebar, mode Latar Blur menjaga keduanya tetap terlihat utuh.',
        example: 'Untuk webinar yang menampilkan tabel/presentasi layar, pilih "Utuh 16:9 di Tengah + Latar Belakang Blur".',
        tips: 'Untuk podcast kamera tunggal yang menyorot pembicara, pilih "Potong Penuh 9:16 (Ikuti Wajah)".'
      },
      {
        niche: 'Semua Niche',
        title: 'Koreksi Ejaan Singkatan & Istilah Lokal',
        hook: 'Rapikan 2–3 Kata Penting Sebelum Render',
        summary: 'Nama orang, merek lokal, atau istilah teknis kadang perlu dirapikan huruf besarnya.',
        explanation: 'Caption yang bebas salah ketik meningkatkan kesan profesional akun kreator maupun brand.',
        example: 'Ubah "umkm" menjadi "UMKM", "pph" menjadi "PPh", atau perbaiki ejaan nama narasumber di kotak teks Langkah 2.',
        tips: 'Waktu koreksi hanya butuh 15 detik tapi hasilnya jauh lebih meyakinkan.'
      },
      {
        niche: 'Semua Niche',
        title: 'Panjang Ideal Kotak Judul Atas',
        hook: '4 Sampai 7 Kata Paling Efektif',
        summary: 'Judul atas berfungsi sebagai papan nama cepat bagi penonton yang baru lewat di beranda.',
        explanation: 'Jika terlalu panjang sampai 3 baris, area dahi pembicara bisa tertutup.',
        example: 'Ringkas "Bagaimana Cara Kita Mengatur Arus Kas Usaha Kecil" menjadi "Cara Atur Kas Usaha Kecil".',
        tips: 'Lihat langsung proporsi kotaknya di kanvas pratinjau 9:16 secara real-time.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Konsistensi Watermark Nama Akun',
        hook: 'Gunakan @namaakun Tipis yang Elegan',
        summary: 'Teks watermark menjaga identitas sumber bila klip kamu diunduh dan dibagikan ke grup WhatsApp.',
        explanation: 'Banyak klip edukasi viral justru menyebar lewat terusan chat keluarga atau kantor.',
        example: 'Isi kolom Teks Watermark dengan "@ruangbisnis.id" di posisi Pojok Kanan Atas.',
        tips: 'Ukuran transparan 88% bawaan Klip Auto sudah pas: terbaca jelas tanpa merusak estetika video.'
      },
      {
        niche: 'Semua Niche',
        title: 'Pilih 720p untuk Tes Harian, 1080p untuk Konten Utama',
        hook: 'Strategi Kecepatan Render vs Ketajaman',
        summary: 'Resolusi 720×1280 sangat ringan dan cepat dirender saat memproduksi 5 klip sekaligus.',
        explanation: 'Di layar ponsel rata-rata, 720p sudah jernih; gunakan 1080p untuk klip unggulan dengan rekaman kamera asli 4K/1080p.',
        example: 'Saat menguji 5 sudut hook berbeda dari 1 podcast, render cepat di 720p lalu upload terjadwal.',
        tips: 'Kedua opsi menghasilkan file MP4 H.264 + AAC standar resmi semua platform sosial.'
      },
      {
        niche: 'Semua Niche',
        title: 'Geser Fokus Halus Saat Pembicara Menoleh',
        hook: 'Sentuhan Manual Offset untuk Komposisi Sinematik',
        summary: 'Gunakan penggeser Fokus Kamera bila pembicara duduk sedikit menyamping.',
        explanation: 'Memberi sedikit ruang pandang (looking room) ke arah hadap wajah membuat komposisi gambar lebih enak dilihat.',
        example: 'Jika pembicara menghadap agak ke kanan, geser slider tipis -0.05 agar posisi wajah seimbang.',
        tips: 'Perubahan langsung terlihat seketika pada kanvas pratinjau.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Tulis Angka dengan Digit agar Cepat Terbaca',
        hook: 'Gunakan "3 Langkah" daripada "Tiga Langkah"',
        summary: 'Mata manusia menangkap simbol angka lebih cepat saat caption bergerak dinamis.',
        explanation: 'Memudahkan penonton mengikuti poin ke-1, ke-2, dan ke-3 di tengah video.',
        example: 'Ubah kata "lima puluh persen" menjadi "50%" pada editor teks caption Langkah 2.',
        tips: 'Berlaku juga untuk nominal seperti "Rp500 ribu" atau "10 menit".'
      },
      {
        niche: 'Semua Niche',
        title: 'Gunakan Tanda Baca Koma & Titik untuk Jeda Alami',
        hook: 'Rahasia Ritme Caption yang Enak Diikuti',
        summary: 'Mesin penyusun kata Klip Auto memberi bobot jeda alami ketika bertemu tanda koma dan titik.',
        explanation: 'Tanda baca yang rapi membantu pembagian kelompok 4 kata jatuh tepat di jeda napas pembicara.',
        example: 'Tambahkan tanda titik di akhir kalimat dan tanda tanya pada kalimat tanya pembicara.',
        tips: 'Bila ingin sinkronisasi suara paling presisi, klik tombol Sinkronkan Ulang Kata dari Suara (Whisper).'
      },
      {
        niche: 'Bisnis & UMKM',
        title: 'Logo PNG Transparan untuk Akun Brand/Agensi',
        hook: 'Tampil Resmi dengan Logo Perusahaan',
        summary: 'Unggah file logo .PNG berlatar bening untuk klip edukasi resmi brand atau klien agensi.',
        explanation: 'Meningkatkan nilai jual jasa kelola konten bila kamu membuka jasa potong klip untuk klien.',
        example: 'Siapkan file logo putih/terang ukuran lebar 300px format PNG transparan, lalu unggah di Langkah 3.',
        tips: 'Posisi Pojok Kiri Atas sangat rapi bila dipadukan tanpa kotak judul atas.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kombinasi Judul Putih + Caption Kreator Kuning',
        hook: 'Pasangan Visual Paling Populer di Podcast Indonesia',
        summary: 'Kotak atas putih memberi pemberhentian mata di atas, sementara sorot kuning menuntun mata di tengah-bawah.',
        explanation: 'Menciptakan keseimbangan visual atas-bawah pada bingkai vertikal 9:16.',
        example: 'Gaya Kotak Judul: Putih Bersih + Preset Caption: Kreator Kuning.',
        tips: 'Cocok dipakai sebagai standar bawaan channel podcast wawancara.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kombinasi Judul Sembunyi + Caption Baris Fokus',
        hook: 'Gaya Sinematik ala Dokumenter Pendek',
        summary: 'Matikan kotak judul atas bila visual rekaman asli sudah sangat kuat dan bersih.',
        explanation: 'Memberi kesan dokumenter premium yang tidak ramai elemen kotak.',
        example: 'Gaya Kotak Judul: Sembunyikan Judul Atas + Preset Caption: Baris Fokus.',
        tips: 'Pastikan kalimat lisan 2 detik pertama benar-benar kuat karena tidak dibantu teks judul atas.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Sorot Nama Bahan atau Teknik Masak',
        hook: 'Pastikan Istilah Khas Tertulis Akurat',
        summary: 'Penonton kuliner sering mengulang video untuk mencatat takaran atau istilah teknik.',
        explanation: 'Penulisan takaran yang jelas membuat video sering disimpan ke koleksi favorit penonton.',
        example: 'Tulis jelas "api kecil 12 menit" atau "diamkan 30 menit di kulkas" pada teks caption.',
        tips: 'Cek ulang angka takaran sebelum mengunduh MP4.'
      },
      {
        niche: 'Semua Niche',
        title: 'Cek Ulang 3 Detik Pertama Lewat Tombol Putar Preview',
        hook: 'Audit Cepat Sebelum Klik Render MP4',
        summary: 'Biasakan memutar 5 detik awal di kanvas pratinjau untuk memastikan wajah, judul, dan kata pertama selaras.',
        explanation: 'Mencegah kerja dua kali dan memastikan kualitas klip siap langsung diunggah.',
        example: 'Klik "Putar Preview" di bawah bingkai HP Langkah 3, cek posisi dagu/dahi dan keterbacaan teks.',
        tips: 'Jika sudah pas, klik Render & Buat File MP4 Sekarang.'
      }
    ]
  },
  {
    category: 'Penutup Pemancing Diskusi',
    items: [
      {
        niche: 'Bisnis & UMKM',
        title: 'Tanya Pengalaman Lapangan Penonton',
        hook: 'Kalau di Tempatmu Lebih Sering Kejadian Mana?',
        summary: 'Tulis kalimat tanya ringan di deskripsi unggahan yang menyambung akhir klip.',
        explanation: 'Komentar panjang dari sesama pelaku usaha mendorong algoritma memperluas jangkauan video.',
        example: 'Teks deskripsi posting: "Kalau di usaha teman-teman, lebih menantang cari pelanggan baru atau jaga tim tetap awet? Cerita di kolom komentar ya."',
        tips: 'Balas 5 komentar pertama dalam 30 menit awal setelah video diunggah.'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Pilih Tim A atau Tim B',
        hook: 'Kamu Tim Gaji Tetap atau Tim Komisi?',
        summary: 'Pertanyaan dua pilihan sederhana yang tidak butuh mikir panjang untuk dijawab.',
        explanation: 'Semakin mudah pertanyaan dijawab dalam 2–3 kata, semakin banyak orang ikut berkomentar.',
        example: '"Kalau disuruh pilih sekarang: kerja dekat rumah gaji standar, atau gaji naik 40% tapi pulang pergi 3 jam?"',
        tips: 'Gunakan untuk klip yang membahas pilihan karier atau budaya kerja.'
      },
      {
        niche: 'Keuangan Pribadi',
        title: 'Ajakan Simpan untuk Gajian Berikutnya',
        hook: 'Simpan Dulu Biar Nggak Lupa Pas Tanggal Muda',
        summary: 'Mengingatkan penonton waktu kapan mereka akan membutuhkan informasi di klip tersebut.',
        explanation: 'Alasan spesifik ("pas tanggal muda") jauh lebih efektif dibanding sekadar bilang "jangan lupa like dan share".',
        example: '"Simpan video ini sekarang supaya pas gajian masuk minggu depan urutannya bisa langsung dicoba."',
        tips: 'Bisa ditaruh di baris pertama caption deskripsi TikTok/Reels.'
      },
      {
        niche: 'Parenting & Keluarga',
        title: 'Ajakan Kirim ke Pasangan Tanpa Menggurui',
        hook: 'Teruskan ke Pasangan Buat Bahan Ngobrol Malam Ini',
        summary: 'Mendorong fitur kirim pesan langsung (DM/WA share) antar-pasangan.',
        explanation: 'Metrik bagikan lewat pesan pribadi memiliki bobot tertinggi di algoritma video pendek saat ini.',
        example: '"Boleh kirim klip singkat ini ke pasangan buat bahan ngobrol santai sambil minum teh malam nanti."',
        tips: 'Gunakan bahasa hangat yang merangkul kedua belah pihak.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Tantangan Coba 1 Hari Ini',
        hook: 'Coba Praktikkan di 1 Tugas Sore Ini',
        summary: 'Mengajak aksi kecil yang bisa dibuktikan hari itu juga.',
        explanation: 'Penonton yang merasakan manfaat langsung biasanya kembali mengikuti akun untuk jangka panjang.',
        example: '"Malam ini coba pasang timer 20 menit pakai cara tadi, besok balik ke sini ceritain hasilnya ya."',
        tips: 'Cocok untuk klip tips belajar, membaca, atau fokus kerja.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Tawaran Bagian Lanjutan (Part 2)',
        hook: 'Mau Dibedah Juga Cara Bikin Judulnya?',
        summary: 'Mengukur minat audiens sebelum memotong segmen berikutnya dari podcast yang sama.',
        explanation: 'Satu video podcast 25 menit bisa menghasilkan 6–8 klip berseri yang saling terhubung.',
        example: '"Di menit berikutnya narasumber juga bongkar contoh skrip aslinya—ketik MAU kalau perlu kita potongkan bagian keduanya."',
        tips: 'Segera balas komentar teratas dengan fitur balas pakai video (video reply).'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Tanya Kebiasaan Pelanggan di Kota Masing-masing',
        hook: 'Kalau di Kotamu Harga Segini Masih Masuk Nggak?',
        summary: 'Memancing perbandingan harga wajar antarkota di Indonesia.',
        explanation: 'Perbedaan harga daerah (Jakarta vs Jogja vs Kalimantan) hampir selalu memicu ratusan balasan seru.',
        example: '"Kalau porsi seperti tadi dijual Rp15.000 di kota teman-teman, termasuk murah atau standar?"',
        tips: 'Sangat ampuh untuk klip bedah HPP dan harga jual kuliner.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Tanya Pengalaman Renovasi Penonton',
        hook: 'Bagian Rumah Mana yang Paling Bikin Bengkak Biaya?',
        summary: 'Mengundang pemilik rumah berbagi pengalaman nyata mereka.',
        explanation: 'Komentar berisi pengalaman nyata menjadi nilai tambah gratis bagi penonton lain yang membaca kolom komentar.',
        example: '"Buat yang sudah pernah renovasi rumah, bagian mana yang dulu paling meleset dari hitungan awal?"',
        tips: 'Sematkan (pin) satu komentar cerita penonton yang paling informatif.'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Validasi Rasa Senasib Pekerja Jasa',
        hook: 'Pernah Dapat Kalimat Persis Kayak Gini?',
        summary: 'Pertanyaan singkat yang memancing senyum dan curhat ringan sesama profesi.',
        explanation: 'Rasa kebersamaan satu profesi membuat akunmu menjadi tempat berkumpul komunitas yang loyal.',
        example: '"Siapa yang minggu ini baru saja dengar kalimat revisi kecil terakhir dari klien? Absen dulu di bawah."',
        tips: 'Jaga suasana komentar tetap santai dan sopan tanpa menyebut nama klien mana pun.'
      },
      {
        niche: 'Kesehatan & Pola Hidup',
        title: 'Cek Kebiasaan Harian Penonton',
        hook: 'Sudah Minum Berapa Gelas Air Putih Sampai Jam Segini?',
        summary: 'Pengingat langsung saat penonton sedang memegang ponsel.',
        explanation: 'Interaksi ringan yang memberi perhatian positif langsung terasa menyenangkan bagi penonton.',
        example: '"Coba jujur, dari pagi sampai jam kamu lihat klip ini, sudah masuk berapa gelas air putih?"',
        tips: 'Cocok untuk unggahan jam 11.00–14.00 siang.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Ajakan Simpan Skrip Balasan WA',
        hook: 'Simpan Kalimatnya Buat Diteruskan ke Tim Admin',
        summary: 'Menyasar pemilik toko yang ingin membagikan panduan ke admin CS mereka.',
        explanation: 'Mendorong pembagian video ke grup kerja internal toko/perusahaan.',
        example: '"Simpan klip ini atau kirim langsung ke grup admin CS toko supaya cara balas chatnya seragam."',
        tips: 'Pastikan kalimat skripnya terdengar jelas di dalam klip.'
      },
      {
        niche: 'Kepemimpinan & Tim',
        title: 'Diskusi Gaya Kepemimpinan Sehat',
        hook: 'Setuju atau Punya Cara Lain di Tim Kamu?',
        summary: 'Membuka ruang beda pendapat secara dewasa dan saling menghargai.',
        explanation: 'Diskusi dua arah yang santun membuat durasi baca komentar meningkat tajam (video berputar ulang di latar).',
        example: '"Setiap tim punya ritme berbeda. Kalau di tempatmu, aturan ini cocok diterapkan atau ada penyesuaian lain?"',
        tips: 'Selalu apresiasi komentar yang memberi sudut pandang tambahan.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Latihan Tulis 1 Kalimat di Komentar',
        hook: 'Coba Bikin 1 Contoh Kalimatmu di Bawah',
        summary: 'Mengubah penonton pasif menjadi peserta latihan aktif.',
        explanation: 'Pengikut akun belajar bahasa sangat senang bila contoh kalimat mereka diberi tanda suka atau dikoreksi ramah.',
        example: '"Sekarang giliranmu: coba tulis satu kalimat pakai pola di atas di kolom komentar, nanti kita cek bareng!"',
        tips: 'Koreksi 3–5 komentar pertama dengan bahasa yang menyemangati.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Tanya Pekerjaan Paling Menyita Waktu',
        hook: 'Tugas Harian Apa yang Paling Pengin Kamu Otomatiskan?',
        summary: 'Sekaligus menjadi riset ide konten dan produk digital berikutnya.',
        explanation: 'Jawaban penonton di komentar memberimu daftar masalah nyata untuk klip selanjutnya.',
        example: '"Kalau boleh pilih satu pekerjaan administrasi yang paling bikin capek tiap minggu, bagian apa yang pengin dibikin otomatis?"',
        tips: 'Catat jawaban yang paling sering muncul sebagai ide topik berikutnya.'
      },
      {
        niche: 'Hukum & Kontrak Sederhana',
        title: 'Pengingat Simpan Sebelum Tanda Tangan',
        hook: 'Simpan Buat Ceklis Sebelum Teken Kerja Sama',
        summary: 'Memosisikan klip sebagai referensi penyelamat di saat penting.',
        explanation: 'Konten ceklis punya rasio simpan per tayangan (save-to-view ratio) yang sangat tinggi.',
        example: '"Simpan dulu di koleksi favorit supaya mudah dibuka lagi waktu mau mulai kerja sama proyek baru."',
        tips: 'Gunakan poin ringkas 1–2–3 di deskripsi teks.'
      },
      {
        niche: 'Otomotif & Hobi',
        title: 'Tanya Usia Pakai & Pengalaman Servis',
        hook: 'Kendaraanmu Sekarang Sudah Kilometer Berapa?',
        summary: 'Pertanyaan spesifik yang senang dijawab oleh penghobi otomotif.',
        explanation: 'Pemilik kendaraan senang berbagi pengalaman perawatan rutin mereka.',
        example: '"Yang pakai motor atau mobil harian tiap hari, biasanya ganti oli patokannya bulan atau kilometer?"',
        tips: 'Cocok untuk akun bengkel, showroom, maupun edukator otomotif.'
      },
      {
        niche: 'Olahraga & Kebugaran',
        title: 'Ajakan Mulai dari Target Terkecil',
        hook: 'Siap Mulai 10 Menit Besok Pagi?',
        summary: 'Komitmen kecil di kolom komentar untuk membangun kebiasaan sehat.',
        explanation: 'Menulis niat di komentar membuat penonton merasa lebih termotivasi.',
        example: '"Ketik SIAP kalau besok pagi mau coba jalan kaki sepuluh menit sebelum buka laptop kerja."',
        tips: 'Unggah di malam hari sekitar pukul 19.30–21.00.'
      },
      {
        niche: 'Pernikahan & Hubungan',
        title: 'Tanya Hal Kecil yang Bikin Rumah Adem',
        hook: 'Kebiasaan Kecil Apa yang Paling Kamu Syukuri dari Pasangan?',
        summary: 'Memancing komentar positif dan hangat di bawah klip.',
        explanation: 'Suasana kolom komentar yang hangat membuat orang betah membaca lama.',
        example: '"Satu kebiasaan sederhana dari pasangan yang kelihatannya sepele tapi bikin hati tenang apa nih?"',
        tips: 'Cocok untuk klip podcast keluarga dan psikologi hubungan.'
      },
      {
        niche: 'Mindset & Produktivitas',
        title: 'Kutip 1 Kalimat Inti di Deskripsi',
        hook: 'Tulis Ulang Kutipan Terbaik Narasumber',
        summary: 'Menegaskan kembali satu kalimat emas yang baru saja didengar penonton.',
        explanation: 'Memperkuat ingatan dan memudahkan penonton menyalin kutipannya.',
        example: '"Kalimat favorit dari segmen ini: Lebih baik langkah kecil yang jalan tiap hari daripada rencana sempurna yang nggak pernah mulai."',
        tips: 'Sangat pas untuk YouTube Shorts dan Instagram Reels.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Doa & Semangat untuk Penonton yang Sedang Berjuang',
        hook: 'Buat yang Sedang Merintis dari Nol, Semangat Terus',
        summary: 'Penutup empatik di deskripsi untuk merangkul pejuang usaha dan keluarga.',
        explanation: 'Sentuhan tulus di deskripsi sering mengundang ucapan "Aamiin, terima kasih pengingatnya" yang tulus.',
        example: '"Semoga siapa pun yang sedang berjuang merapikan usaha dan rezekinya tahun ini dimudahkan jalannya satu per satu."',
        tips: 'Gunakan secukupnya pada klip cerita perjuangan yang tulus.'
      }
    ]
  },
  {
    category: 'Prompt AI Bedah Transkrip',
    items: [
      {
        niche: 'Semua Niche',
        title: 'Cari 7 Momen Retensi Tertinggi dari Transkrip',
        hook: 'Prompt Utama Pencari Klip 30–50 Detik',
        summary: 'Salin prompt ini ke ChatGPT/Gemini bila kamu punya teks transkrip panjang dan ingin daftar titik potong terbaik.',
        explanation: 'Membantu memilih bagian paling berbobot sebelum kamu menggeser slider detik di Klip Auto.',
        example: ' Berikut transkrip rekaman podcast saya. Tolong pilihkan 7 segmen berdurasi 25–50 detik yang paling menarik perhatian sejak kalimat pertama. Untuk tiap segmen tuliskan: (1) Estimasi kalimat awal & kalimat akhir yang utuh, (2) Saran judul atas maksimal 6 kata bahasa Indonesia natural, dan (3) Alasan kenapa segmen tersebut kuat.',
        tips: 'Tempel hasil judulnya langsung ke kolom Judul Atas Klip di Langkah 3.'
      },
      {
        niche: 'Bisnis & UMKM',
        title: 'Prompt Ekstrak Studi Kasus & Angka Bisnis',
        hook: 'Khusus Podcast Bisnis, Keuangan & Jualan',
        summary: 'Menyaring bagian obrolan yang mengandung contoh hitungan rupiah, strategi, atau kesalahan nyata.',
        explanation: 'Segmen berisi angka konkret hampir selalu mengalahkan nasihat motivasi umum.',
        example: 'Dari transkrip obrolan bisnis berikut, temukan semua bagian ketika pembicara menyebutkan contoh angka, modal, persentase, atau studi kasus nyata di lapangan. Urutkan dari yang paling praktis untuk pemilik UMKM dan buatkan judul kotak atas maksimal 6 kata per momen.',
        tips: 'Cek kesesuaian angka di editor caption Langkah 2.'
      },
      {
        niche: 'Semua Niche',
        title: 'Prompt Pembuat 10 Variasi Judul Atas (Hook)',
        hook: 'Ubah 1 Klip Jadi 10 Pilihan Judul Tajam',
        summary: 'Membuat alternatif judul kotak atas tanpa kata-kata clickbait berlebihan.',
        explanation: 'Judul yang natural kayak orang ngomong lebih dipercaya penonton Indonesia dibanding kalimat iklan kaku.',
        example: 'Ini isi kalimat klip pendek saya: "[TEMPEL TEKS KLIP]". Buatkan 10 pilihan judul kotak atas (maksimal 6 kata per judul) menggunakan bahasa Indonesia sehari-hari yang lugas, bikin penasaran, tanpa tanda seru berlebihan dan tanpa kata kaku.',
        tips: 'Pilih judul yang paling jujur mewakili isi jawaban pembicara.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Prompt Merapikan Teks Caption Tanpa Mengubah Makna',
        hook: 'Bersihkan Gumaman "Eee / Anu" di Teks Caption',
        summary: 'Merapikan tanda baca dan kata ulang berlebih pada teks transkrip sebelum dirender.',
        explanation: 'Teks caption yang bersih lebih cepat dibaca mata tanpa mengubah suara asli pembicara.',
        example: 'Rapikan tanda baca koma, titik, dan huruf kapital pada teks ucapan berikut tanpa menambah atau mengganti kosakata aslinya (cukup buang gumaman berulang seperti "eee" atau kata yang terketik dua kali): "[TEMPEL TEKS]".',
        tips: 'Setelah dirapikan, tempel kembali ke kotak Teks Caption Klip di Langkah 2.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Prompt Deskripsi Unggahan & Hashtag Relevan',
        hook: 'Siapkan Teks Posting TikTok, Reels & Shorts Sekaligus',
        summary: 'Menyusun 2 kalimat pengantar unggahan + 1 pertanyaan pemicu diskusi + 5 tagar spesifik topik.',
        explanation: 'Menghemat waktu saat klip MP4 selesai dirender dan siap dijadwalkan.',
        example: 'Saya baru selesai membuat klip video pendek tentang: "[TOPIK KLIP]". Tuliskan deskripsi unggahan singkat (maksimal 3 kalimat bahasa Indonesia santai), akhiri dengan 1 pertanyaan ringan untuk memancing cerita penonton di komentar, lalu beri 5 hashtag spesifik sesuai topik.',
        tips: 'Hindari memakai lebih dari 5 hashtag umum agar platform mengenali ceruk topik penontonmu.'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Prompt Cari Momen Kontra-Intuitif (Beda Sudut Pandang)',
        hook: 'Temukan Opini Segar yang Jarang Dibahas',
        summary: 'Menemukan kalimat narasumber yang meluruskan kesalahpahaman umum di dunia kerja.',
        explanation: 'Sudut pandang segar membuat akunmu menonjol di tengah ribuan konten serupa.',
        example: 'Baca transkrip berikut dan tunjukkan 5 bagian di mana pembicara menyampaikan pandangan yang berbeda dari anggapan umum masyarakat, lengkap dengan kutipan kalimat awal dan akhir yang pas dipotong jadi video 35 detik.',
        tips: 'Pastikan alasan pendukung pembicara ikut masuk ke dalam rentang detik klip.'
      },
      {
        niche: 'Cerita Inspiratif',
        title: 'Prompt Cari Momen Emosional & Titik Balik',
        hook: 'Temukan Bagian Cerita Paling Manusiawi',
        summary: 'Menyaring bagian kisah perjuangan, kegagalan awal, atau pelajaran hidup narasumber.',
        explanation: 'Sangat efektif untuk podcast wawancara tokoh atau perintis usaha.',
        example: 'Dari transkrip wawancara ini, carikan 5 bagian cerita pengalaman pribadi atau titik balik hidup narasumber yang paling jujur dan menyentuh, masing-masing berdurasi baca sekitar 30–45 detik.',
        tips: 'Gunakan preset caption Minimalis Bersih untuk hasil klipnya.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Prompt Ubah Klip Edukasi Jadi Seri 3 Bagian',
        hook: 'Rancang Urutan Upload Hari Senin–Rabu–Jumat',
        summary: 'Mengatur urutan rilis 3 klip dari 1 video panjang agar penonton mengikuti akunmu.',
        explanation: 'Urutan rilis yang terencana mengubah penonton lewat menjadi pengikut tetap.',
        example: 'Saya punya 5 momen klip dari satu rekaman podcast ini: [DAFTAR MOMEN]. Susunkan urutan jadwal upload terbaik dari hari ke-1 sampai hari ke-5, mulai dari topik paling memancing rasa penasaran umum hingga topik paling mendalam.',
        tips: 'Sebutkan keterkaitan antar-klip di kolom komentar yang disematkan.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Prompt Cari Tips Praktis Langsung Pakai',
        hook: 'Saring Bagian "Cara & Langkah" dari Obrolan Panjang',
        summary: 'Mengambil segmen obrolan yang berisi langkah kerja konkret.',
        explanation: 'Klip "cara melakukan sesuatu" selalu dicari lewat fitur pencarian TikTok & YouTube.',
        example: 'Temukan semua bagian di dalam transkrip ini yang menjelaskan langkah praktis "cara melakukan sesuatu" secara berurutan, lalu beri ide judul atas singkat yang diawali kata "Cara..." atau angka.',
        tips: 'Simpan kata kunci utamanya di judul file dan deskripsi unggahan.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Prompt Cek Ejaan Istilah Asing di Transkrip Indonesia',
        hook: 'Pastikan Istilah Inggris di Podcast Indonesia Tepat',
        summary: 'Memperbaiki kata bahasa Inggris yang kadang terdengar mirip ejaan Indonesia pada hasil transkrip suara.',
        explanation: 'Podcast Indonesia sering mencampur istilah kerja bahasa Inggris di tengah kalimat.',
        example: 'Periksa teks transkrip berbahasa Indonesia berikut. Jika ada istilah bahasa Inggris atau nama produk populer yang tertulis secara fonetik Indonesia, betulkan ejaannya ke istilah asli yang tepat tanpa mengubah kata lainnya: "[TEMPEL TEKS]".',
        tips: 'Sangat membantu untuk podcast bisnis startup, pemasaran, dan teknologi.'
      },
      {
        niche: 'Semua Niche',
        title: 'Prompt Pangkas Kalimat Pembuka yang Bertele-tele',
        hook: 'Temukan Detik Mulai yang Paling Tajam',
        summary: 'Menentukan kata pertama terbaik di dalam satu paragraf panjang.',
        explanation: 'Sering kali kalimat terbaik justru ada di kalimat ketiga, bukan kalimat pertama.',
        example: 'Lihat paragraf ucapan narasumber ini: "[TEMPEL PARAGRAF]". Kalimat mana yang paling kuat dijadikan detik 00:00 pembuka klip pendek agar penonton langsung tertarik menyimak tanpa kebingungan konteks?',
        tips: 'Sesuaikan angka Titik Mulai Klip (detik) mengikuti kalimat tersebut.'
      },
      {
        niche: 'Parenting & Keluarga',
        title: 'Prompt Saring Contoh Dialog Orang Tua & Anak',
        hook: 'Ambil Bagian Contoh Kalimat Nyata',
        summary: 'Menemukan segmen saat psikolog/narasumber mencontohkan dialog langsung.',
        explanation: 'Contoh dialog nyata adalah bagian yang paling sering diputar ulang oleh orang tua.',
        example: 'Dari transkrip berikut, carikan bagian-bagian ketika narasumber memberikan contoh kalimat dialog langsung (misal "katakan begini..."), lalu tuliskan rentang kalimat utuhnya.',
        tips: 'Beri tanda kutip yang rapi pada teks caption dialog tersebut.'
      },
      {
        niche: 'Keuangan Pribadi',
        title: 'Prompt Cek Kejelasan Pesan Agar Tidak Disalahpahami',
        hook: 'Pastikan Potongan Klip Tidak Kehilangan Konteks Penting',
        summary: 'Mengecek apakah potongan 35 detik sudah cukup jelas berdiri sendiri.',
        explanation: 'Menjaga kredibilitas narasumber dan akun kreator agar informasi tetap utuh serta bertanggung jawab.',
        example: 'Jika bagian teks ini dipotong berdiri sendiri menjadi klip 35 detik tanpa bagian sebelumnya, apakah pesannya sudah utuh atau ada 1 kalimat syarat penting yang wajib ikut dimasukkan? "[TEMPEL TEKS KLIP]".',
        tips: 'Tarik mundur atau majukan titik potong 3–5 detik bila diperlukan.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Prompt Rangkum Poin Ceklis di Deskripsi Video',
        hook: 'Tambahkan Ringkasan Poin di Bawah Video',
        summary: 'Membuat daftar poin rapi di caption deskripsi sebagai pendamping klip video.',
        explanation: 'Banyak penonton membuka deskripsi untuk membaca ulang daftar poin sambil video tetap berputar.',
        example: 'Berdasarkan isi klip pendek ini: "[TEMPEL TEKS]", buatkan ringkasan daftar ceklis 3–4 poin pendek yang enak dibaca di kolom deskripsi Instagram Reels/TikTok.',
        tips: 'Gunakan kalimat pendek satu baris per poin.'
      },
      {
        niche: 'Kesehatan & Pola Hidup',
        title: 'Prompt Buat Judul Edukasi yang Menenangkan (Bukan Menakut-nakuti)',
        hook: 'Edukasi Kesehatan yang Positif & Dipercaya',
        summary: 'Merangkai judul informatif tanpa menimbulkan kepanikan berlebihan.',
        explanation: 'Konten kesehatan yang tenang dan solutif lebih disukai keluarga serta aman dari pembatasan platform.',
        example: 'Buatkan 5 ide judul kotak atas (maksimal 6 kata) yang informatif, solutif, dan tidak menakut-nakuti untuk potongan penjelasan kesehatan berikut: "[TEMPEL TEKS]".',
        tips: 'Gunakan kata "Cara Jaga", "Tanda Awal", atau "Kebiasaan Baik".'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Prompt Ide Balasan Komentar pakai Klip Baru',
        hook: 'Hubungkan Pertanyaan Penonton ke Menit Podcast Lain',
        summary: 'Mencari bagian lain di dalam podcast yang menjawab pertanyaan di kolom komentar.',
        explanation: 'Membuat penonton merasa benar-benar didengarkan oleh pemilik channel.',
        example: 'Ada penonton bertanya di komentar: "[PERTANYAAN KOMENTAR]". Cek di dalam transkrip podcast lengkap ini apakah ada bagian menit yang membahas jawaban untuk pertanyaan tersebut.',
        tips: 'Potong bagian tersebut di Klip Auto lalu unggah sebagai balasan video.'
      },
      {
        niche: 'Kepemimpinan & Tim',
        title: 'Prompt Saring Kutipan Satu Kalimat Tajam (Punchline)',
        hook: 'Cari Kalimat Penutup Paling Berkesan',
        summary: 'Menemukan kalimat simpulan singkat yang kuat ditaruh di akhir klip.',
        explanation: 'Akhir klip yang kuat menentukan apakah penonton menekan tombol ikuti (follow).',
        example: 'Temukan 5 kalimat simpulan paling ringkas dan mengena dari transkrip berikut yang cocok dijadikan kalimat penutup terakhir sebuah klip pendek.',
        tips: 'Pastikan titik selesai klip berhenti bersih tepat setelah kalimat itu.'
      },
      {
        niche: 'Otomotif & Hobi',
        title: 'Prompt Kelompokkan Topik dari Rekaman Tanya-Jawab Live',
        hook: 'Ubah Rekaman Live 30 Menit Jadi Bank Klip Sebulan',
        summary: 'Memetakan seluruh pertanyaan yang dijawab selama sesi siaran langsung.',
        explanation: 'Rekaman live tanya-jawab adalah tambang emas puluhan klip pendek siap upload.',
        example: 'Ini transkrip sesi tanya-jawab live selama 30 menit. Daftar semua pertanyaan yang dijawab beserta kalimat awal dan akhir jawabannya agar mudah saya potong satu per satu menjadi klip terpisah.',
        tips: 'Satu jawaban 30 detik = satu konten harian baru.'
      },
      {
        niche: 'Teknologi & AI',
        title: 'Prompt Terjemahkan Istilah Teknis ke Bahasa Awam di Judul',
        hook: 'Bikin Topik Teknis Menarik Buat Penonton Umum',
        summary: 'Mengubah judul penuh jargon menjadi manfaat nyata sehari-hari.',
        explanation: 'Jangkauan video meningkat berkali-kali lipat saat judulnya dipahami orang non-teknis.',
        example: 'Ubah 5 topik teknis berikut menjadi judul kotak atas maksimal 6 kata yang langsung menyebut manfaat praktisnya bagi orang awam sehari-hari: "[DAFTAR TOPIK]".',
        tips: 'Biarkan istilah teknis dijelaskan di dalam isi pembicaraan klip.'
      },
      {
        niche: 'Semua Niche',
        title: 'Prompt Audit 3 Detik Pertama Sebelum Upload',
        hook: 'Uji Kekuatan Kalimat Awal Klip',
        summary: 'Meminta penilaian cepat apakah kalimat pembuka klip sudah cukup jelas dan memikat.',
        explanation: 'Membantu memilih kandidat momen terbaik jika kamu punya 5 pilihan klip dan ingin mengunggah yang terkuat lebih dulu.',
        example: 'Urutkan 5 draf pembuka klip berikut dari yang paling kuat menahan perhatian orang asing di 3 detik pertama, dan jelaskan alasannya secara singkat: [DAFTAR 5 PEMBUKA].',
        tips: 'Unggah peringkat ke-1 di jam aktif utama audiensmu.'
      }
    ]
  },
  {
    category: 'Checklist Produksi Cepat',
    items: [
      {
        niche: 'Semua Niche',
        title: 'Rekaman 10–30 Menit: Pilih Format MP4 H.264',
        hook: 'Format Paling Mulus Dibaca Browser Tanpa Konversi',
        summary: 'File MP4 standar dari kamera, HP, Zoom, atau OBS paling cepat dipindai langsung di browser.',
        explanation: 'Dekoder perangkat keras browser membaca MP4 H.264 berkali-kali lebih cepat dibanding format mentah tak terkompresi.',
        example: 'Simpan hasil rekaman OBS/Zoom langsung dalam format .MP4 sebelum dimasukkan ke Langkah 1 Klip Auto.',
        tips: 'Semua pemrosesan video tetap berjalan lokal di perangkatmu tanpa habis kuota upload besar.'
      },
      {
        niche: 'Semua Niche',
        title: 'Gunakan File .SRT jika Sudah Punya Subtitle YouTube',
        hook: 'Deteksi Momen Instan Kurang dari 1 Detik',
        summary: 'Jika videomu berasal dari arsip YouTube/CapCut yang sudah punya file .SRT/.VTT, unggah subtitlenya di Langkah 1.',
        explanation: 'Mengimpor file .SRT langsung melompati waktu tunggu transkrip suara dan langsung menyajikan daftar momen terbaik.',
        example: 'Klik tombol "Impor Subtitle .SRT / .VTT" di Langkah 1 setelah memilih file video.',
        tips: 'Kamu tetap bisa menyelaraskan ulang kata per kata memakai Whisper di Langkah 2 bila diperlukan.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kapan Pakai Gemini Key vs Whisper Browser',
        hook: 'Pilih Jalur Transkrip Sesuai Durasi Video',
        summary: 'Untuk video panjang 15–30 menit, Gemini API Key gratis pribadi jauh lebih cepat; untuk klip pendek tanpa akun apa pun, pakai Whisper Browser.',
        explanation: 'Gemini hanya mengunggah ekstrak suara ringan lalu memilih 5–10 momen kontekstual sekaligus dalam hitungan detik.',
        example: 'Masukkan kunci gratis AIza... dari Google AI Studio di Pengaturan sekali saja untuk membedah podcast panjang.',
        tips: 'Kunci API milikmu hanya disimpan di localStorage browser sendiri, tidak pernah dikirim ke server pihak lain.'
      },
      {
        niche: 'Semua Niche',
        title: 'Durasi Emas Klip Podcast: 24 sampai 48 Detik',
        hook: 'Rentang Durasi Paling Disukai Penonton Baru',
        summary: 'Tidak terlalu pendek sampai kehilangan isi, dan tidak terlalu panjang sampai penonton bosan.',
        explanation: 'Rentang 24–48 detik cukup untuk memuat 1 hook tajam, 1 penjelasan konkret, dan 1 kalimat kesimpulan.',
        example: 'Atur selisih Titik Mulai dan Titik Selesai di kisaran 30 detik pada Langkah 2.',
        tips: 'Indikator durasi klip otomatis tampil tepat di atas penggeser waktu.'
      },
      {
        niche: 'Semua Niche',
        title: 'Kunci Wajah Otomatis untuk Rekaman Landscape 16:9',
        hook: 'Ubah Video Mendatar Jadi Tegak Tanpa Kepala Terpotong',
        summary: 'Pemindai posisi subjek menjaga pembicara tetap berada di poros tengah bingkai 9:16.',
        explanation: 'Pada rekaman kamera mendatar 16:9, pembicara sering duduk di sepertiga kiri atau kanan layar, bukan tepat di tengah.',
        example: 'Klik "Pindai Posisi Wajah untuk Preview" di Langkah 3 untuk melihat pembingkaian otomatis sebelum render.',
        tips: 'Saat proses Render MP4 berjalan, pelacak memindai seluruh durasi klip secara otomatis.'
      },
      {
        niche: 'Bisnis & UMKM',
        title: 'Batching: Sekali Duduk Selesaikan 5 Klip',
        hook: 'Hemat Waktu Produksi Konten Seminggu Penuh',
        summary: 'Jangan tutup tab setelah render klip pertama; kembali ke Langkah 2 dan pilih momen kedua sampai kelima.',
        explanation: 'Karena video dan daftar momen sudah termuat di memori browser, klip ke-2 sampai ke-5 tinggal klik pilih dan render.',
        example: 'Dari 1 rekaman obrolan 20 menit di hari Minggu, hasilkan 5 file MP4 siap tayang untuk Senin–Jumat.',
        tips: 'Semua riwayat konfigurasi klip otomatis tercatat di menu Riwayat Render.'
      },
      {
        niche: 'Semua Niche',
        title: 'Cek Ruang Atas Kepala (Headroom) dengan Judul Hook',
        hook: 'Pastikan Kotak Judul Tidak Menutupi Mata Pembicara',
        summary: 'Jika kamera merekam wajah sangat dekat (extreme close-up), pilih kotak judul tipis atau sembunyikan judul atas.',
        explanation: 'Kontak mata pembicara sangat penting untuk membangun rasa percaya penonton.',
        example: 'Ubah dropdown Warna Kotak Judul Atas menjadi "Sembunyikan Judul Atas" bila wajah memenuhi bagian atas layar.',
        tips: 'Gunakan kanvas pratinjau Langkah 3 untuk mengeceknya dalam 2 detik.'
      },
      {
        niche: 'Semua Niche',
        title: 'Penamaan File Unduhan Biar Mudah Dijadwalkan',
        hook: 'Arsipkan Klip Berdasarkan Urutan Skor Momen',
        summary: 'Catat judul hook di Riwayat Render agar mudah membedakan klip saat memindahkan file ke HP.',
        explanation: 'Ketika memproduksi banyak klip sekaligus, riwayat yang rapi mencegah salah unggah file yang sama dua kali.',
        example: 'Kirim 5 file MP4 hasil render ke Google Drive atau Telegram Pribadi untuk diunggah dari HP.',
        tips: 'Format MP4 keluaran Klip Auto langsung kompatibel di galeri iPhone maupun Android.'
      },
      {
        niche: 'Konten & Kreator',
        title: 'Uji 2 Gaya Judul pada Momen Terbaik yang Sama',
        hook: 'Teknik A/B Testing Sederhana Tanpa Rekam Ulang',
        summary: 'Untuk momen berskor 90+, kamu bisa merender 2 versi dengan kalimat judul atas yang berbeda.',
        explanation: 'Kadang beda 3 kata pada judul atas bisa menghasilkan selisih tayangan berkali-kali lipat.',
        example: 'Versi A untuk TikTok memakai judul pertanyaan, Versi B untuk Reels memakai judul angka.',
        tips: 'Proses render ulang klip 30 detik di browser hanya butuh beberapa detik.'
      },
      {
        niche: 'Edukasi & Belajar',
        title: 'Pastikan Volume Rekaman Asli Jelas Sejak Awal',
        hook: 'Suara Bersih Lebih Penting dari Kamera Mahal',
        summary: 'Penonton memaafkan gambar kamera HP standar, tapi langsung melewati video yang suaranya kresek-kresek.',
        explanation: 'Suara jernih juga membuat akurasi transkrip otomatis kata demi kata meningkat pesat.',
        example: 'Saat merekam podcast atau materi kelas, dekatkan mikrofon 15–20 cm dari sumber suara.',
        tips: 'Klip Auto menjaga kualitas audio asli dikodekan bersih ke AAC di dalam file MP4.'
      },
      {
        niche: 'Semua Niche',
        title: 'Gunakan Mode Utuh 16:9 Latar Blur untuk Rekaman Zoom Berempat',
        hook: 'Solusi Rapi Saat Ada Banyak Kotak Pembicara',
        summary: 'Rapat online atau diskusi panel 3–4 orang lebih pas ditampilkan utuh dengan latar blur halus.',
        explanation: 'Memotong penuh 9:16 pada layar grid Zoom 4 orang akan memotong separuh peserta lainnya.',
        example: 'Pada Langkah 3, ubah Tampilan Bingkai Video ke "Utuh 16:9 di Tengah + Latar Belakang Blur".',
        tips: 'Kotak judul atas dan caption bawah otomatis mengapit video 16:9 di tengah dengan sangat proporsional.'
      },
      {
        niche: 'Penjualan & Closing',
        title: 'Simpan Template Watermark Usaha di Menu Pengaturan',
        hook: 'Tidak Perlu Ketik @akun Berulang Kali',
        summary: 'Atur nama akun dan posisi watermark bawaan di menu Pengaturan agar otomatis terisi setiap buka studio.',
        explanation: 'Mempercepat alur kerja harian admin konten maupun pemilik usaha.',
        example: 'Buka menu Pengaturan → isi Watermark Default "@tokokamu" → klik Simpan Pengaturan.',
        tips: 'Kamu tetap bisa menggantinya kapan saja khusus untuk klip tertentu di Langkah 3.'
      },
      {
        niche: 'Semua Niche',
        title: 'Jaga Tab Browser Tetap Aktif Saat Proses Render Berjalan',
        hook: 'Maksimalkan Kecepatan Encoder WebCodecs',
        summary: 'Browser modern memberi prioritas penuh kartu grafis (GPU) pada tab yang sedang terbuka di layar.',
        explanation: 'Jika tab diminimalkan ke belakang, browser kadang memperlambat laju frame demi hemat baterai.',
        example: 'Tunggu beberapa detik hingga bilah progres render mencapai 100% sebelum berpindah aplikasi.',
        tips: 'Kecepatan render 720p pada laptop/PC rata-rata lebih cepat dari durasi asli klipnya.'
      },
      {
        niche: 'Kuliner & F&B',
        title: 'Potong Demo Masak + Penjelasan Suara Jadi Satu',
        hook: 'Gabungan Visual Tangan Bekerja & Tips Inti',
        summary: 'Video ulasan makanan atau tips dapur tetap efektif diberi caption besar per kata di tengah-bawah.',
        explanation: 'Penonton bisa melihat tekstur makanan sekaligus membaca takaran bumbunya dengan jelas.',
        example: 'Matikan Kunci Wajah Otomatis bila video hanya menyorot meja masak/makanan, lalu atur fokus tengah manual.',
        tips: 'Sakelar Kunci Wajah Otomatis tersedia tepat di Langkah 3.'
      },
      {
        niche: 'Karier & Kerja',
        title: 'Simpan Koleksi Hook Terbaik di Menu Favorit',
        hook: 'Bangun Bank Judul Pribadi Sesuai Niche Akunmu',
        summary: 'Tandai 10–15 item pustaka yang paling cocok dengan gaya bahasamu ke Koleksi Favorit.',
        explanation: 'Saat sedang dikejar jadwal upload, kamu tinggal buka tab Favorit dan klik Pasang ke Judul Klip.',
        example: 'Klik tombol Lihat Detail pada kartu pustaka → klik Simpan Favorit.',
        tips: 'Data favorit dapat dicadangkan ke file .json lewat menu Pengaturan.'
      },
      {
        niche: 'Semua Niche',
        title: 'Periksa Akhir Kalimat Lewat Angka Detik Desimal',
        hook: 'Potongan Presisi 0,1 Detik Bikin Klip Terasa Pro',
        summary: 'Input angka titik mulai dan selesai mendukung ketelitian 0,1 detik untuk membuang jeda tanggung.',
        explanation: 'Memangkas 0,3 detik napas kosong di awal dan akhir membuat transisi video terasa sangat rapi.',
        example: 'Ubah Titik Mulai dari 12.0 menjadi 12.4 bila kata pertama baru terucap di 12.4 detik.',
        tips: 'Gunakan kombinasi slider cepat + koreksi halus 0,1 detik.'
      },
      {
        niche: 'Bahasa Inggris & Komunikasi',
        title: 'Manfaatkan Sinkronisasi Ulang Kata Whisper Setelah Geser Detik',
        hook: 'Selaraskan Ulang Ketukan Kata dengan Suara',
        summary: 'Jika kamu menggeser rentang detik jauh ke bagian lain yang belum ada transkripnya, klik Sinkronkan Ulang di Langkah 2.',
        explanation: 'Whisper hanya memproses potongan pendek klip tersebut (misal 30 detik), sehingga selesai dalam beberapa detik saja.',
        example: 'Geser ke detik 140.0 – 172.0 → klik "Sinkronkan Ulang Kata dari Suara (Whisper)" → lanjut ke Langkah 3.',
        tips: 'Sangat hemat waktu bila kamu sudah hafal menit menarik di rekamanmu sendiri.'
      },
      {
        niche: 'Properti & Bangunan',
        title: 'Gunakan Rekaman Survei Lapangan Jadi Konten Edukasi',
        hook: 'Ubah Dokumentasi Kerja Harian Jadi Magnet Klien',
        summary: 'Rekam penjelasan 5 menit saat mengecek proyek, lalu potong 2 poin terpentingnya di Klip Auto.',
        explanation: 'Calon klien lebih percaya melihat praktisi menjelaskan langsung di lokasi kerja nyata.',
        example: 'Pilih 2 segmen masing-masing 30 detik tentang pengecekan material dan rapi pengerjaan.',
        tips: 'Sertakan watermark nama usaha/kontraktor di pojok atas.'
      },
      {
        niche: 'Freelance & Jasa',
        title: 'Tawarkan Paket Jasa Potong 15 Klip Podcast ke Klien',
        hook: 'Peluang Penghasilan Tambahan dari Klip Auto',
        summary: 'Banyak podcaster, dosen, pelatih, dan pemilik bisnis punya video YouTube panjang tapi tidak sempat memotongnya.',
        explanation: 'Dengan alur 3 langkah di Klip Auto, kamu bisa menyelesaikan pesanan belasan klip 9:16 jauh lebih cepat.',
        example: 'Gunakan fitur upload Logo PNG di Langkah 3 untuk memasang logo masing-masing klien secara bergantian.',
        tips: 'Satu proyek klien bulanan sudah berkali-kali lipat menutup modal pembelian alat ini.'
      },
      {
        niche: 'Semua Niche',
        title: 'Cadangkan Pengaturan & Riwayat Secara Berkala',
        hook: 'Pindah Laptop Tetap Aman dengan Ekspor JSON',
        summary: 'Gunakan tombol Ekspor Data (.json) di Pengaturan untuk menyimpan seluruh riwayat klip dan koleksi favoritmu.',
        explanation: 'Karena seluruh data berjalan privat di browser tanpa server pelacak, file cadangan memudahkan pindah perangkat kapan saja.',
        example: 'Klik Ekspor Data di Pengaturan lalu impor kembali di browser komputer kantor atau rumah.',
        tips: 'Catatan: Kunci API pribadi sengaja tidak ikut diekspor keluar demi keamanan akunmu.'
      }
    ]
  }
];

export const CREATOR_CATEGORIES = [
  'Semua Kategori',
  ...RAW_CREATOR_CATEGORIES.map((c) => c.category)
];

export const CREATOR_LIBRARY_ITEMS = RAW_CREATOR_CATEGORIES.flatMap((group, gIdx) =>
  group.items.map((item, iIdx) => ({
    id: `klip-lib-${gIdx + 1}-${iIdx + 1}`,
    category: group.category,
    niche: item.niche,
    title: item.title,
    hook: item.hook,
    summary: item.summary,
    explanation: item.explanation,
    example: item.example,
    tips: item.tips
  }))
);

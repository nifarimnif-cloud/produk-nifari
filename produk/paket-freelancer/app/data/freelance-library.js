/**
 * TarifKarya Studio — Basis Data Preset Bidang Jasa, Penangkis Nawar WA, & 120 Pustaka Freelancer
 * Berjalan 100% mandiri di browser pembeli tanpa biaya API.
 */

export const SERVICE_PRESETS = [
  {
    id: 'sosmed-konten',
    name: 'Admin Sosmed & Konten IG/TikTok',
    unitLabel: 'bulan',
    defaultTurnaround: '30 Hari Kalender',
    defaultDp: 50,
    defaultRevisions: '2x Revisi per Konten',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Jaga akun tetap aktif & rapi setiap minggu',
        price: 1500000,
        days: '30 Hari',
        items: [
          '12 Desain Feed / Carousel siap unggah',
          '4 Video pendek Reels/TikTok durasi 15–30 detik',
          'Riset ide bahasan & penulisan caption harian',
          'Jadwal tayang rutin 3–4 kali seminggu'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Pertumbuhan jangkauan & interaksi calon pembeli',
        price: 2750000,
        days: '30 Hari',
        featured: true,
        items: [
          '18 Desain Feed / Carousel + sampul seragam',
          '8 Video pendek Reels/TikTok lengkap teks caption',
          'Kalender konten bulanan + riset kata kunci',
          'Laporan perkembangan akun di akhir bulan'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Terima beres produksi harian + optimasi jualan',
        price: 4500000,
        days: '30 Hari',
        items: [
          '24 Desain Feed / Carousel + Story harian',
          '12 Video pendek Reels/TikTok siap iklan',
          'Balas komentar dasar & arahkan ke tautan bio',
          'Evaluasi dua mingguan & penyesuaian strategi'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan 1 Video Reels/TikTok', price: 175000 },
      { name: 'Penyerahan File Mentah Canva/PSD', price: 350000 }
    ]
  },
  {
    id: 'edit-video-pendek',
    name: 'Edit Video Reels, TikTok & Shorts',
    unitLabel: 'paket',
    defaultTurnaround: '7–14 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '2x Revisi Minor per Video',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Uji coba kualitas potongan & gaya teks',
        price: 650000,
        days: '4 Hari Kerja',
        items: [
          '5 Video pendek vertikal 9:16 (maks 60 detik)',
          'Pemotongan jeda kosong & perapian suara',
          'Caption dinamis per kata + judul hook atas',
          'Musik latar bebas klaim hak cipta'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Stok konten setengah bulan tanpa pusing edit',
        price: 1650000,
        days: '10 Hari Kerja',
        featured: true,
        items: [
          '15 Video pendek vertikal 9:16 siap tayang',
          'Sisipan B-roll pendukung & efek suara transisi',
          'Caption per kata + warna identitas brand klien',
          'Sampul video (cover) rapi untuk tampilan profil'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Stok penuh 1 bulan dari rekaman podcast/panjang',
        price: 2950000,
        days: '18 Hari Kerja',
        items: [
          '30 Video pendek vertikal 9:16 kualitas 1080p',
          'Kurasi momen terbaik dari video panjang klien',
          'Grafis penjelas sederhana, B-roll & perapian warna',
          'Prioritas antrean pengerjaan 24–48 jam per batch'
        ]
      }
    ],
    addons: [
      { name: 'Pengerjaan Ekspres Selesai 24 Jam / Klip', price: 100000 },
      { name: 'File Proyek Premiere / CapCut Mentah', price: 300000 }
    ]
  },
  {
    id: 'desain-grafis',
    name: 'Desain Logo, Kemasan & Materi Promo',
    unitLabel: 'proyek',
    defaultTurnaround: '7–10 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '3x Revisi Terarah',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Identitas dasar rapi untuk usaha baru mulai',
        price: 850000,
        days: '5 Hari Kerja',
        items: [
          '2 Pilihan konsep logo orisinal',
          'Palet warna utama & rekomendasi pasangan huruf',
          'File siap cetak & transparan (.PNG, .JPG, .PDF)',
          '2x revisi pada 1 konsep logo terpilih'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Identitas usaha lengkap siap tampil meyakinkan',
        price: 1850000,
        days: '8 Hari Kerja',
        featured: true,
        items: [
          '3 Pilihan konsep logo + variasi horizontal/ikon',
          'Panduan pemakaian logo & warna ringkas (PDF)',
          'Desain kartu nama / stiker kemasan / kop surat',
          'File master vektor (.AI / .SVG / .EPS / .PNG)'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Paket peluncuran produk + kemasan siap produksi',
        price: 3400000,
        days: '12 Hari Kerja',
        items: [
          '3 Konsep logo + buku panduan identitas lengkap',
          '2 Desain kemasan / label produk siap naik cetak',
          '5 Template promosi media sosial seragam',
          'File master lengkap + simulasi mockup 3D produk'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan 1 Desain Varian Rasa / Ukuran Kemasan', price: 250000 },
      { name: 'Tambahan 1 Putaran Revisi di Luar Kuota', price: 150000 }
    ]
  },
  {
    id: 'landing-page-web',
    name: 'Pembuatan Landing Page & Website UMKM',
    unitLabel: 'proyek',
    defaultTurnaround: '7–14 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '2x Revisi Tampilan & Teks',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Halaman penawaran tunggal fokus klik WhatsApp',
        price: 1250000,
        days: '5 Hari Kerja',
        items: [
          '1 Halaman Landing Page cepat & rapi di layar HP',
          'Penyusunan kalimat jualan dari info produk klien',
          'Tombol langsung mengarah ke WhatsApp / Checkout',
          'Pemasangan ke domain milik klien sampai aktif'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Halaman jualan lengkap siap pasang iklan berbayar',
        price: 2400000,
        days: '9 Hari Kerja',
        featured: true,
        items: [
          'Landing Page lengkap 10 bagian penunjang konversi',
          'Penulisan copywriting persuasif + perapian gambar',
          'Pemasangan Meta Pixel / Google Tag dasar',
          'Garansi perbaikan teknis gratis 14 hari setelah tayang'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Website profil perusahaan / katalog multi-halaman',
        price: 4200000,
        days: '14 Hari Kerja',
        items: [
          'Hingga 5 halaman (Beranda, Layanan, Katalog, Profil, Kontak)',
          'Formulir pemesanan & integrasi peta lokasi usaha',
          'Optimasi kecepatan buka halaman & struktur SEO dasar',
          'Panduan video singkat cara ganti teks/gambar mandiri'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan 1 Halaman Produk Baru', price: 400000 },
      { name: 'Perawatan & Update Konten Bulanan', price: 350000 }
    ]
  },
  {
    id: 'foto-produk',
    name: 'Foto & Video Katalog Produk UMKM',
    unitLabel: 'sesi',
    defaultTurnaround: '5–7 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '1x Revisi Warna / Retouch',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Foto bersih latar polos untuk etalase marketplace',
        price: 750000,
        days: '4 Hari Kerja',
        items: [
          '10 Foto produk latar bersih pencahayaan studio',
          'Koreksi warna tajam & pembersihan debu produk',
          'Ukuran siap unggah Shopee, Tokopedia & katalog WA',
          'Pengiriman via folder Google Drive resolusi penuh'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Kombinasi foto katalog & foto tematik berproperti',
        price: 1600000,
        days: '6 Hari Kerja',
        featured: true,
        items: [
          '20 Foto produk (polos + penataan properti estetik)',
          '2 Video pendek produk sinematik durasi 15 detik',
          'Penataan gaya sesuai karakter produk (kuliner/fesyen/skincare)',
          'Lisensi pemakaian komersial untuk sosmed & marketplace'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Paket peluncuran koleksi baru lengkap foto + video',
        price: 2900000,
        days: '9 Hari Kerja',
        items: [
          '35 Foto katalog + konsep pemakaian harian',
          '5 Video pendek review/unboxing siap jadikan iklan',
          'Termasuk properti pendukung & penataan latar khusus',
          'Bonus potongan ukuran rasio 1:1, 4:5, dan 9:16'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan 5 Foto Produk Ekstra', price: 300000 },
      { name: 'Sewa Talent Tangan / Model Pendamping', price: 500000 }
    ]
  },
  {
    id: 'copywriting-artikel',
    name: 'Penulisan Copywriting, Skrip & Artikel SEO',
    unitLabel: 'paket',
    defaultTurnaround: '5–10 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '2x Revisi Gaya Bahasa',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Rangkaian teks jualan dasar untuk produk baru',
        price: 600000,
        days: '4 Hari Kerja',
        items: [
          '10 Naskah skrip video pendek / caption jualan',
          '3 Pilihan sudut pandang pembuka (hook) per naskah',
          'Gaya bahasa natural sesuai target pembeli klien',
          '100% tulisan manusia rapi bebas terjemahan kaku'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Paket naskah halaman jualan + pesan promosi WA',
        price: 1350000,
        days: '7 Hari Kerja',
        featured: true,
        items: [
          '1 Naskah penuh Landing Page penawaran produk',
          '5 Pesan berantai WhatsApp / email follow-up calon pembeli',
          '5 Naskah iklan singkat (Meta/TikTok Ads)',
          'Riset keunggulan produk dibanding pesaing sejenis'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Suplai artikel website rutin & naskah kampanye bulanan',
        price: 2450000,
        days: '14 Hari Kerja',
        items: [
          '10 Artikel website ramah pencarian Google (1.000 kata)',
          'Riset kata kunci potensial yang dicari calon pembeli',
          '15 Naskah skrip konten sosmed pendukung kampanye',
          'Judul meta & ringkasan siap tempel ke CMS website'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan 1 Artikel 1.000 Kata', price: 185000 },
      { name: 'Pengerjaan Kilat 48 Jam', price: 200000 }
    ]
  },
  {
    id: 'manajemen-iklan',
    name: 'Jasa Pasang & Optimasi Iklan Meta / TikTok Ads',
    unitLabel: 'bulan',
    defaultTurnaround: '30 Hari Pendampingan',
    defaultDp: 100,
    defaultRevisions: '2x Pergantian Materi Iklan',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Setup kampanye awal rapi untuk tes pasar',
        price: 1200000,
        days: '14 Hari Pantau',
        items: [
          'Penyiapan struktur kampanye & target pemirsa tepat',
          '3 Variasi teks iklan & pemasangan materi klien',
          'Pemantauan performa & matikan iklan boncos',
          'Biaya jasa di luar saldo iklan akun milik klien'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Pengelolaan penuh 1 bulan fokus biaya per hasil hemat',
        price: 2500000,
        days: '30 Hari Pantau',
        featured: true,
        items: [
          'Setup Pixel/konversi + pengujian hingga 6 materi iklan',
          'Optimasi rutin alokasi anggaran ke iklan pemenang',
          ' Kampanye tayangan ulang (retargeting) calon pembeli hangat',
          'Laporan mingguan ringkas & saran perbaikan materi'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Pengelolaan iklan + arahan produksi materi kreatif',
        price: 4250000,
        days: '30 Hari Pantau',
        items: [
          'Pengelolaan multi-kampanye hingga 12 variasi materi',
          '4 Brief skrip iklan baru setiap bulan berbasis data',
          'Audit halaman tujuan (LP/toko) agar konversi naik',
          'Sesi evaluasi online dua mingguan bersama pemilik usaha'
        ]
      }
    ],
    addons: [
      { name: 'Pembuatan 3 Video Materi Iklan Siap Pakai', price: 550000 },
      { name: 'Setup Awal Akun Bisnis & Pixel dari Nol', price: 350000 }
    ]
  },
  {
    id: 'admin-asisten-virtual',
    name: 'Jasa Input Data, Rekap Excel & Asisten Virtual',
    unitLabel: 'paket',
    defaultTurnaround: '7–30 Hari Kerja',
    defaultDp: 50,
    defaultRevisions: '2x Perapian Format Tabel',
    tiers: [
      {
        tier: 'Paket Hemat',
        subtitle: 'Bereskan tumpukan dokumen atau rekap mingguan',
        price: 700000,
        days: '20 Jam Kerja',
        items: [
          'Alokasi 20 jam kerja terfokus sesuai daftar tugas',
          'Perapian dokumen Word/PDF atau rekap tabel Excel',
          'Pemeriksaan ulang ketelitian angka & penamaan file',
          'Laporan jam kerja terpakai yang transparan'
        ]
      },
      {
        tier: 'Paket Populer',
        subtitle: 'Asisten operasional paruh waktu untuk pemilik bisnis',
        price: 1550000,
        days: '45 Jam Kerja',
        featured: true,
        items: [
          'Alokasi 45 jam kerja (sekitar 2 jam per hari kerja)',
          'Rekap pesanan, arsip nota, atau balas chat terjadwal',
          'Pembuatan template spreadsheet rapi siap pakai ulang',
          'Koordinasi harian singkat via grup WhatsApp kerja'
        ]
      },
      {
        tier: 'Paket Lengkap',
        subtitle: 'Dukungan administrasi rutin penuh selama sebulan',
        price: 2850000,
        days: '90 Jam Kerja',
        items: [
          'Alokasi 90 jam kerja (sekitar 4 jam per hari kerja)',
          'Pengelolaan jadwal, dokumen klien, & rekap keuangan dasar',
          'Penyusunan SOP tertulis untuk alur administrasi rutin',
          'Kerahasiaan data usaha klien dijamin tertulis'
        ]
      }
    ],
    addons: [
      { name: 'Tambahan Kuota 10 Jam Kerja Ekstra', price: 350000 },
      { name: 'Perapian Database Lama (>1.000 Baris)', price: 450000 }
    ]
  }
];

export const WA_OBJECTION_SCENARIOS = [
  {
    id: 'kemahalan-teman',
    label: 'Klien bilang: "Kemahalan kak, kenalan saya bisa setengah harga"',
    buildReply: ({ studio, client, pkgName, priceRp, dpPct }) =>
      `Halo Kak ${client}, terima kasih sudah terbuka soal anggarannya ya.\n\nKami sangat paham tiap penyedia jasa punya standar pengerjaan dan cakupan yang berbeda. Di ${studio}, untuk ${pkgName} senilai ${priceRp} sudah termasuk riset terarah, file siap pakai tanpa pusing merapikan ulang, serta jaminan jadwal selesai tepat waktu.\n\nKalau Kakak ingin menyesuaikan anggaran dulu, kita bisa mulai dari Paket Hemat dengan cakupan inti yang paling berdampak lebih dulu (cukup DP ${dpPct}% untuk kunci jadwal minggu ini). Mau saya bantu sesuaikan rinciannya, Kak?`
  },
  {
    id: 'minta-contoh-gratis',
    label: 'Klien minta: "Coba bikinin 1 contoh gratis dulu, kalau cocok baru lanjut"',
    buildReply: ({ studio, client, pkgName, dpPct }) =>
      `Halo Kak ${client}, terima kasih atas ketertarikannya bekerja sama dengan ${studio}.\n\nSupaya kualitas fokus tim kami terjaga penuh untuk klien yang sedang berjalan, kami belum menyediakan pembuatan sampel kustom sebelum pemesanan resmi. Sebagai gambaran kualitas hasil kerja kami, Kakak bisa mengecek portofolio hasil jadi yang sudah kami lampirkan.\n\nKalau Kakak ingin mencoba kecocokan alur kerja lebih dulu tanpa komitmen besar, Kakak bisa mengambil paket terkecil dulu dengan DP awal ${dpPct}%. Begitu pembayaran DP terkonfirmasi, draf pertama langsung kami jadwalkan. Bagaimana menurut Kakak?`
  },
  {
    id: 'revisi-lewat-kuota',
    label: 'Klien minta revisi terus padahal jatah revisi gratis sudah habis',
    buildReply: ({ studio, client, pkgName }) =>
      `Halo Kak ${client}, poin perubahan terbarunya sudah kami catat dengan baik.\n\nSekadar menginformasikan secara transparan sesuai kesepakatan awal pada ${pkgName}, jatah revisi gratis di dalam paket saat ini sudah terpakai penuh. Untuk pengerjaan tambahan perubahan baru ini tetap bisa kami bantu kerjakan dengan biaya penyesuaian revisi sebesar Rp150.000 per putaran (estimasi beres 1–2 hari kerja).\n\nSilakan kabari ya Kak apakah mau lanjut dengan tambahan putaran revisi tersebut atau kita finalisasi memakai versi terakhir yang sudah rapi kemarin.`
  },
  {
    id: 'minta-file-mentah',
    label: 'Klien tiba-tiba minta file mentahan (.PSD/.AI/Project) gratis di akhir',
    buildReply: ({ studio, client, pkgName }) =>
      `Halo Kak ${client}, senang sekali hasil akhir ${pkgName} sudah sesuai harapan Kakak!\n\nUntuk paket yang diambil saat ini mencakup penyerahan seluruh file hasil jadi siap tayang/cetak beresolusi tinggi. Adapun file kerja mentah (master editable layer) merupakan aset terpisah dengan biaya lisensi pelepasan file sebesar Rp350.000.\n\nApabila tim internal Kakak membutuhkan file mentahannya untuk diolah sendiri ke depannya, boleh kabari kami agar saya buatkan tagihan tambahannya ya Kak.`
  },
  {
    id: 'followup-belum-balas',
    label: 'Follow-up sopan setelah kirim Proposal/Rate Card 2 hari belum dibalas',
    buildReply: ({ studio, client, pkgName, dpPct }) =>
      `Halo Kak ${client}, semoga aktivitasnya minggu ini lancar ya.\n\nIzin menindaklanjuti dokumen penawaran ${pkgName} dari ${studio} yang saya kirimkan kemarin. Apakah ada bagian cakupan kerja atau pilihan paket yang ingin Kakak tanyakan atau sesuaikan dengan kebutuhan saat ini?\n\nKebetulan minggu ini kami masih menyisakan 1 slot pengerjaan yang bisa dikunci dengan DP ${dpPct}%. Kabari santai saja ya Kak, terima kasih banyak!`
  },
  {
    id: 'tagih-pelunasan',
    label: 'Mengingatkan Invoice pelunasan yang sudah jatuh tempo tanpa canggung',
    buildReply: ({ studio, client, pkgName, bankInfo }) =>
      `Halo Kak ${client}, semoga hari ini sehat dan lancar selalu.\n\nIzin mengingatkan kembali untuk tagihan pelunasan ${pkgName} dari ${studio} yang jatuh tempo pada hari ini. Seluruh file hasil akhir beresolusi penuh sudah kami siapkan rapi di folder serah terima dan siap kami kirimkan tautan aksesnya segera setelah pelunasan terkonfirmasi.\n\nPembayaran dapat ditransfer melalui ${bankInfo}. Setelah transfer, mohon bantu kirimkan bukti pembayarannya ke chat ini ya Kak. Terima kasih banyak atas kerja sama menyenangkannya!`
  }
];

export const LIBRARY_CATEGORIES = [
  'Semua Kategori',
  'Skrip Balas Klien Nawar',
  'Klausul Anti-Revisi Bocor',
  'Struktur Paket Jasa Laris',
  'Kalimat Follow-Up Proposal',
  'Penagihan Invoice Sopan',
  'Prompt AI Riset & Audit Klien'
];

const RAW_SEEDS = {
  'Skrip Balas Klien Nawar': [
    ['Tangkis "Harga Teman" Tanpa Merusak Hubungan', 'Semua Jasa', 'Menolak diskon berlebihan dari kenalan sambil menawarkan pengurangan lingkup kerja yang adil.', 'Justru karena sama teman sendiri saya nggak enak kalau ngasih hasil setengah-setengah. Kalau bujetnya di angka segitu, paling aman kita kurangi jumlah itemnya dari 12 jadi 6 dulu supaya kualitasnya tetap maksimal ya.', 'Jangan pernah memotong harga tanpa memotong jumlah item/fasilitas agar tarif standarmu tetap dihargai.'],
    ['Jawab "Kok Cuma Gitu Doang Mahal?"', 'Desain & Video', 'Mengalihkan fokus klien dari lama waktu mengetik/klik ke dampak hasil dan kepastian beres.', 'Betul Kak, pengerjaan teknisnya bisa cepat karena kami memakai sistem & pengalaman ratusan jam sebelumnya, jadi Kakak tidak perlu buang waktu coba-coba sendiri dan hasilnya langsung siap menghasilkan penjualan.', 'Klien membeli kepastian hasil dan waktu luang mereka, bukan sekadar jumlah menit kamu duduk di depan laptop.'],
    ['Hadapi "Nanti Kalau Ramai Saya Kasih Proyek Lagi"', ' Konten & Web', 'Menjawab janji proyek masa depan dengan skema paket bundel resmi di depan.', 'Siap Kak, senang sekali kalau bisa jalan jangka panjang! Untuk kerja sama rutin 3 bulan langsung di awal kami memang ada potongan khusus 10%, tapi kalau ambil satuan 1 proyek dulu tarifnya tetap mengikuti kartu harga standar ya Kak.', 'Diskon volume hanya berlaku jika klien membayar komitmen paket banyak di depan, bukan janji lisan.'],
    ['Respon "Bujet Kami Mentok di Angka X"', 'Semua Jasa', 'Mengubah negosiasi buntu menjadi penyesuaian ruang lingkup yang tetap menguntungkan jam kerjamu.', 'Terima kasih sudah menginfokan batas anggarannya ya Kak. Dengan anggaran Rp1.200.000 tersebut, cakupan yang paling pas adalah 8 konten inti tanpa fitur pengelolaan harian. Kalau setuju, langsung saya rapikan surat penawarannya.', 'Selalu gunakan kalimat "Dengan anggaran X, cakupan yang didapat adalah Y".'],
    ['Tolak Sistem Bagi Hasil Tanpa Biaya Awal', 'Iklan & Website', 'Menolak ajakan kerja gratis berbasis komisi murni pada bisnis yang belum teruji.', 'Untuk skema bagi hasil kami baru bisa terapkan setelah fase kerja sama berbayar bulan pertama berjalan dan data konversi tokonya sudah terukur jelas, Kak. Di bulan awal tetap menggunakan biaya jasa standar.', 'Jangan menanggung risiko bisnis klien seratus persen dengan jam kerjamu sendiri.'],
    ['Jawab "Di Marketplace Ada yang Jual Rp50 Ribu"', 'Desain & Logo', 'Membedakan jasa kustom terarah milikmu dari template massal.', 'Betul Kak, untuk kebutuhan cepat pakai template jadi memang banyak pilihan ekonomis. Layanan kami dikerjakan khusus dari nol menyesuaikan target pembeli Kakak supaya tampil beda dari toko sebelah dan aman dipakai jangka panjang.', 'Tetap tenang dan jangan menjelekkan penyedia lain; cukup tegaskan nilai kustomisasi jasamu.'],
    ['Klien Minta Bonus Tambahan di Luar Paket', 'Sosmed & Foto', 'Menjaga margin keuntungan saat klien menyelipkan permintaan ekstra menjelang deal.', 'Untuk tambahan pembuatan 3 desain banner marketplace bisa sekalian kami kerjakan Kak, nanti cukup tambah add-on Rp225.000 saja (lebih hemat dibanding pesan terpisah Rp300.000). Mau sekalian saya masukkan ke invoice?', 'Ubah permintaan gratisan menjadi penawaran add-on berharga khusus bundel.'],
    ['Tanggapi "Kami Bandingkan Dulu dengan Vendor Lain"', 'Proposal B2B', 'Memberi ruang berpikir pada klien sambil menegaskan keunggulan yang tidak dimiliki vendor murah.', 'Silakan sekali Kak, wajar banget kalau dibandingkan dulu agar mantap. Sebagai catatan pertimbangan, di paket kami seluruh file siap pakai plus garansi perbaikan teknis 14 hari sudah termasuk tanpa biaya tersembunyi.', 'Bantu klien melihat apa saja biaya tersembunyi yang biasanya muncul di tempat lain.'],
    ['Hadapi Klien Minta Potong DP Jadi Bayar Belakang', 'Semua Jasa', 'Mempertahankan aturan uang muka wajib sebelum mulai bekerja.', 'Mohon maaf belum bisa bayar penuh di akhir Kak, karena seluruh jadwal produksi di studio kami dikunci otomatis berdasarkan urutan DP 50% yang masuk. Kalau ingin lebih ringan, boleh dibagi 50% awal, 25% saat pratinjau draf, dan 25% sebelum serah terima.', 'Klien yang menolak DP kecil di awal hampir selalu bermasalah saat penagihan akhir.'],
    ['Balas "Bisa Selesai Besok Pagi Nggak? Harga Sama Ya"', 'Video & Desain', 'Menetapkan biaya layanan kilat (rush fee) untuk tenggat waktu mendadak.', 'Bisa kami prioritaskan selesai besok pagi pukul 09.00 Kak, dengan menggeser jadwal reguler ke lembur malam ini. Untuk pengerjaan ekspres <24 jam berlaku tambahan biaya prioritas 35% dari nilai paket ya Kak.', 'Tenggat mendadak wajib dikenakan tarif ekspres agar klien menghargai jadwal kerja normalmu.'],
    ['Jawab "Saya Cuma Butuh Revisi Sedikit Punya Desainer Lama"', 'Desain & Web', 'Menjelaskan bahwa membongkar file orang lain sering lebih rumit daripada buat baru.', 'Boleh kirimkan dulu file aslinya untuk kami cek selama 10 menit ya Kak. Kalau strukturnya rapi bisa masuk tarif penyesuaian ringan, namun bila harus susun ulang dari awal agar hasilnya tidak pecah akan kami infokan tarif paket pembuatan barunya.', 'Jangan pernah menyanggupi harga murah sebelum memeriksa kondisi file mentah kiriman klien.'],
    ['Tangkis "Kan Pakai AI Sekarang Cepat, Masa Masih segini?"', 'Penulisan & Konten', 'Menjelaskan bahwa alat bantu mempercepat riset, tapi kurasi strategi & akurasi tetap keahlian manusia.', 'Alat bantu memang mempercepat riset awal Kak, namun penyusunan sudut pandang jualan, pengecekan fakta produk Kakak, dan perapian kalimat agar enak dibaca pembeli Indonesia tetap kami kerjakan manual satu per satu.', 'Tekankan tanggung jawab kualitas akhir yang siap menghasilkan uang bagi klien.'],
    ['Klien Minta Rapat Offline Berulang Padahal Paket Kecil', 'Semua Jasa', 'Membatasi pertemuan tatap muka yang menghabiskan ongkos & waktu perjalanan.', 'Untuk menjaga harga Paket Hemat tetap terjangkau, seluruh diskusi & pemaparan draf dilakukan secara online via Google Meet / Zoom maksimal 30 menit ya Kak. Untuk kunjungan tatap muka langsung tersedia pada Paket Lengkap atau dengan biaya transport terpisah.', 'Satu kali rapat luar kantor bisa menghabiskan 4 jam produktifmu di jalan.'],
    ['Balas "Boleh Cicil 3 Bulan Tanpa DP?"', 'Website & Branding', 'Menawarkan pembagian tahapan kerja (milestone) sesuai pembayaran yang masuk.', 'Supaya cashflow Kakak tetap ringan, kita bisa bagi proyeknya jadi 2 tahap terpisah saja Kak: bulan ini kita selesaikan Halaman Utama dulu (Rp1.250.000), bulan depan baru lanjut halaman katalog tambahan.', 'Pecah proyek besar menjadi beberapa proyek kecil lunas bertahap, bukan memberi utang jasa.'],
    ['Jawab "Kalau Hasilnya Nggak Menaikkan Omzet, Uang Kembali?"', 'Iklan & Sosmed', 'Menetapkan batas tanggung jawab realistis antara kualitas materi vs faktor internal toko klien.', 'Kami menjamin seluruh materi iklan, penargetan, dan halaman penawaran dikerjakan sesuai standar terbaik dan tepat jadwal. Adapun angka penjualan akhir juga dipengaruhi harga produk Kakak, kecepatan admin membalas chat, serta stok barang di toko.', 'Janjikan indikator yang berada penuh di bawah kendalimu (jumlah konten, ketepatan waktu, kerapian setup).'],
    ['Tanggapi Klien yang Menawar Setelah Pekerjaan Selesai', 'Semua Jasa', 'Menolak keras pemotongan tagihan sepihak setelah draf disetujui.', 'Mohon maaf nominal pelunasan tetap mengacu pada Surat Penawaran & Invoice yang sudah disetujui bersama di awal sebesar Rp1.400.000 ya Kak. Begitu pelunasan masuk, tautan unduh file resolusi penuh langsung kami buka hari ini.', 'Selalu kirim pratinjau ber-watermark atau resolusi rendah sebelum pelunasan 100% diterima.'],
    ['Arahkan Klien dari Paket Eceran ke Paket Bulanan', 'Video & Sosmed', 'Menunjukkan penghematan per item jika mengambil paket rutin.', 'Kalau ambil eceran 1 video jatuhnya Rp175.000/video Kak. Tapi kalau langsung ambil Paket Populer 15 video, jatuhnya cuma Rp110.000/video plus sudah dapat desain cover profil gratis — jauh lebih hemat Rp975.000.', 'Perbandingan harga satuan vs paket selalu memudahkan klien memilih paket tengah.'],
    ['Jawab "Saya Tanya Suami / Partner Bisnis Dulu Ya"', 'UMKM & Jasa', 'Membekali calon klien dengan ringkasan PDF 1 halaman agar mudah disetujui rekannya.', 'Siap Kak, silakan didiskusikan dulu dengan partnernya. Ini saya lampirkan ringkasan PDF 1 halaman berisi rincian 3 pilihan paket, jadwal kerja, dan estimasi hasilnya supaya partner Kakak lebih mudah melihat gambarannya ya.', 'Klien yang harus izin pasangan/bos sangat terbantu oleh dokumen PDF proposal yang rapi.'],
    ['Hadapi Permintaan "Sekalian Tolong Buatin Akun & Balas Chat Pembeli"', 'Desain & Konten', 'Memisahkan dengan tegas tugas produksi kreatif vs tugas admin CS penjualan.', 'Untuk paket yang dipilih saat ini fokus penuh pada produksi desain & video siap unggah ya Kak. Untuk layanan balasan chat pembeli harian belum termasuk supaya tim kreatif bisa fokus menjaga kualitas visual akun Kakak.', 'Cegah melebarnya tugas (scope creep) sejak pertanyaan pertama muncul.'],
    ['Penutup Negosiasi Tegas Saat Harga Sudah Paling Mentok', 'Semua Jasa', 'Kalimat sopan terakhir ketika penawar tidak masuk hitungan modal kerja.', 'Terima kasih banyak sudah berdiskusi panjang Kak. Untuk menjaga standar kualitas pengerjaan di studio kami, angka Rp1.500.000 adalah penawaran terbaik yang bisa kami berikan. Jika suatu saat bujet Kakak sudah sesuai, kami akan sangat senang membantu!', 'Berani menolak klien di bawah standar membuat waktumu terbuka bagi klien yang membayar layak.']
  ],
  'Klausul Anti-Revisi Bocor': [
    ['Pasal Batas Kuota & Definisi Revisi Minor', 'Semua Jasa', 'Membedakan koreksi kecil vs ganti konsep total dari nol.', 'Paket mencakup maksimal 2 (dua) kali putaran revisi minor berupa penyesuaian teks, warna, atau tata letak ringan pada konsep yang telah disetujui. Perubahan arah konsep/naskah setelah draf dikerjakan dihitung sebagai pesanan baru.', 'Tanpa definisi revisi minor, "ganti konsep dari awal" sering dianggap klien sebagai "revisi ke-1".'],
    ['Pasal Masa Berlaku Klaim Revisi (Maksimal 5 Hari)', 'Desain & Video', 'Mencegah klien menghilang 2 bulan lalu tiba-tiba datang minta revisi gratis.', 'Masukan revisi disampaikan dalam 1 daftar terangkum selambat-lambatnya 5 (lima) hari kerja sejak pratinjau draf dikirimkan. Apabila melewati batas waktu tersebut tanpa kabar, draf dianggap telah disetujui penuh.', 'Wajib minta klien merangkum revisi dalam 1 pesan utuh, bukan dicicil 15 chat terpisah.'],
    ['Pasal Uang Muka (DP) Pengunci Jadwal Tidak Dapat Dikembalikan', 'Semua Jasa', 'Melindungi waktu yang sudah kamu kosongkan bila klien batal sepihak.', 'Pembayaran Uang Muka (DP) sebesar 50% berfungsi mengunci slot waktu pengerjaan dan tidak dapat ditarik kembali (non-refundable) apabila terjadi pembatalan sepihak dari pihak Klien setelah proses riset/pengerjaan dimulai.', 'Ketika kamu menolak klien lain demi slot tersebut, DP mengganti kerugian waktu kosongmu.'],
    ['Pasal Serah Terima File Final Setelah Pelunasan 100%', 'Semua Jasa', 'Aturan emas agar tidak pernah kena ghosting setelah file dikirim.', 'Selama tahap pratinjau, hasil kerja dikirimkan dalam resolusi pratinjau atau ber-tanda air (watermark). Seluruh file akhir resolusi penuh tanpa tanda air diserahkan maksimal 1x24 jam setelah pembayaran pelunasan 100% diterima.', 'Jangan pernah melanggar aturan ini meski klien terlihat sangat terburu-buru.'],
    ['Pasal Kepemilikan File Mentah / Master Editable', 'Desain, Video & Web', 'Menjelaskan bahwa klien membeli hasil akhir siap pakai, bukan file dapur kerja.', 'Harga paket mencakup hak pakai komersial atas file hasil akhir siap tayang/cetak (.MP4, .PNG, .PDF). File proyek mentah (.PSD, .AI, .PRPROJ, komponen internal) tetap menjadi milik Studio kecuali dibeli melalui opsi pelepasan file master.', 'Klausul ini umum di industri kreatif dan bisa menjadi sumber pemasukan tambahan 20–30%.'],
    ['Pasal Keterlambatan Materi dari Pihak Klien', 'Web & Konten', 'Mencegahmu disalahkan atas mundurnya jadwal gara-gara klien lambat kirim foto/data.', 'Estimasi waktu pengerjaan terhitung sejak seluruh bahan pendukung (foto produk, logo, informasi harga) diterima lengkap dari Klien. Keterlambatan pengiriman bahan dari Klien secara otomatis menggeser tanggal selesai secara proporsional.', 'Selalu catat tanggal "seluruh bahan diterima lengkap" sebagai Hari Ke-1 proyek.'],
    ['Pasal Jeda Proyek Maksimal (Dormant Clause 14 Hari)', 'Web & Branding', 'Menangani proyek yang digantung klien berminggu-minggu tanpa respon.', 'Apabila Klien tidak memberikan respon atau kelanjutan materi selama lebih dari 14 (empat belas) hari kalender berturut-turut, proyek dinyatakan ditangguhkan dan pengaktifan kembali jadwal dikenakan biaya pembukaan slot sebesar 15%.', 'Menjaga arus kas agar pelunasan tidak nyangkut berbulan-bulan karena klien sibuk sendiri.'],
    ['Pasal Jam Operasional Komunikasi Kerja', 'Sosmed & Admin', 'Menjaga kesehatan mental agar tidak ditelepon klien tengah malam atau hari libur.', 'Koordinasi pekerjaan dan balasan pesan dilayani pada hari kerja Senin–Jumat pukul 09.00–17.30 WIB. Pesan yang masuk di luar jam operasional atau hari libur nasional akan ditindaklanjuti pada hari kerja berikutnya.', 'Cantumkan jam kerja resmi di bagian bawah proposal agar klien menghormati waktu istirahatmu.'],
    ['Pasal Lisensi Aset Pihak Ketiga (Font, Musik, Stok Foto)', 'Desain, Video & Web', 'Memperjelas siapa yang menanggung pembelian aset berbayar khusus permintaan klien.', 'Paket sudah mencakup penggunaan font dan musik berlisensi komersial bebas royalti bawaan Studio. Apabila Klien meminta penggunaan lagu komersial spesifik, font berbayar khusus, atau plugin premium tertentu, biaya lisensinya ditanggung oleh Klien.', 'Menghindarkanmu dari tuntutan hak cipta atau biaya langganan tak terduga.'],
    ['Pasal Persetujuan Naskah Sebelum Rekaman / Render Video', 'Edit Video & Animasi', 'Mencegah bongkar ulang video yang sudah selesai dirender hanya karena salah naskah awal.', 'Pihak Klien menyetujui teks naskah/struktur cerita terlebih dahulu sebelum proses penyuntingan visual penuh dilakukan. Perubahan isi kalimat setelah video selesai disunting akan dihitung sebagai biaya penyuntingan ulang.', 'Kunci persetujuan di tahap teks jauh lebih hemat tenaga dibanding bongkar timeline video.'],
    ['Pasal Izin Menampilkan Hasil Kerja di Portofolio Studio', 'Semua Jasa', 'Memastikan kamu boleh memajang karya tersebut untuk mencari klien berikutnya.', 'Studio berhak menampilkan cuplikan hasil kerja yang telah dipublikasikan sebagai portofolio karya Studio. Apabila Klien membutuhkan perjanjian rahasia penuh (NDA / White-Label), mohon diinformasikan di awal dengan penyesuaian tarif 20%.', 'Agensi yang memesan jasa sub-kontrak white-label wajar dikenakan tarif sedikit lebih tinggi.'],
    ['Pasal Batas Tanggung Jawab Platform Pihak Ketiga', 'Sosmed & Iklan', 'Melindungi penyedia jasa bila akun klien terkena gangguan kebijakan Meta/TikTok/Hosting.', 'Studio menjalankan pekerjaan sesuai pedoman resmi platform terkait, namun tidak bertanggung jawab atas gangguan teknis massal, perubahan algoritma, atau pembatasan akun yang disebabkan oleh riwayat pelanggaran akun Klien sebelumnya.', 'Penting dicantumkan untuk pengelola iklan dan admin media sosial.'],
    ['Pasal Garansi Perbaikan Kesalahan Teknis (Bug Fix 14 Hari)', 'Website & Excel', 'Memberi rasa aman pada klien sekaligus membatasi masa garansi gratis.', 'Studio memberikan garansi perbaikan gratis selama 14 (empat belas) hari kalender setelah serah terima apabila ditemukan fungsi yang tidak berjalan sesuai kesepakatan awal (tidak termasuk penambahan fitur baru atau perubahan akibat modifikasi mandiri Klien).', 'Garansi terukur justru meningkatkan kepercayaan klien untuk segera deal.'],
    ['Pasal Pembayaran Bertahap Proyek Nilai Besar (50-30-20)', 'Proyek >Rp5 Juta', 'Menjaga arus kas sehat untuk proyek berdurasi lebih dari 2 minggu.', 'Skema pembayaran proyek dibagi menjadi tiga termin: Termin 1 sebesar 50% saat penandatanganan kesepakatan, Termin 2 sebesar 30% saat pemaparan draf utama selesai, dan Termin 3 sebesar 20% sebelum penyerahan akses/file akhir.', 'Dengan 80% sudah masuk di tengah proyek, risiko gagal bayar turun drastis.'],
    ['Pasal Denda Keterlambatan Pelunasan Invoice Korporat', 'Klien Perusahaan/B2B', 'Mendorong bagian keuangan perusahaan memproses tagihan tepat waktu.', 'Tagihan pelunasan memiliki batas waktu pembayaran 7 (tujuh) hari kalender sejak tanggal terbit Invoice. Keterlambatan pembayaran melewati jatuh tempo dikenakan biaya administrasi keterlambatan sebesar 2% per minggu.', 'Perusahaan besar terbiasa memprioritaskan vendor yang memiliki klausul jatuh tempo resmi.'],
    ['Pasal Satu Pintu Pemberi Keputusan (Single PIC)', 'Klien Tim / Kantor', 'Mencegah revisi saling bertabrakan dari 4 orang berbeda di kantor klien.', 'Klien menunjuk 1 (satu) orang Penanggung Jawab (PIC) resmi yang berwenang mengumpulkan masukan internal dan memberikan persetujuan akhir kepada Studio. Masukan yang saling bertentangan antar anggota tim Klien diselesaikan secara internal terlebih dahulu.', 'Penyelamat utama saat menangani klien organisasi, panitia, atau perusahaan!'],
    ['Pasal Keaslian & Hak Pakai Materi Kiriman Klien', 'Semua Jasa', 'Melindungimu bila klien mengirim foto/logo comotan internet yang melanggar hak cipta.', 'Seluruh foto, logo, teks klaim produk, dan materi yang diserahkan Klien kepada Studio dijamin oleh Klien bebas dari pelanggaran hak cipta pihak lain dan telah sesuai dengan izin edar yang berlaku.', 'Klien bertanggung jawab penuh atas klaim produk mereka sendiri.'],
    ['Pasal Biaya Tambahan Perjalanan & Akomodasi Luar Kota', 'Foto & Produksi', 'Memperjelas ongkos transportasi lokasi syuting/pemotretan.', 'Harga paket berlaku untuk pengerjaan di studio dalam kota. Apabila pengambilan gambar dilakukan di lokasi pilihan Klien di luar radius 15 km, biaya transportasi, tol, dan sewa lokasi (jika ada) ditanggung sepenuhnya oleh Klien.', 'Hitung biaya bensin, parkir, dan waktu tempuh secara terpisah dari upah keahlianmu.'],
    ['Pasal Cadangan Penyimpanan File Maksimal 30 Hari', 'Video & Foto', 'Agar harddisk/Google Drive-mu tidak penuh menyimpan file klien bertahun-tahun lalu.', 'Tautan unduh hasil akhir di penyimpanan awan Studio dijamin aktif selama 30 (tiga puluh) hari kalender sejak tanggal serah terima. Klien disarankan segera mengunduh dan mencadangkan file ke perangkat pribadi masing-masing.', 'Setelah 30 hari, kamu bebas mengosongkan ruang penyimpanan tanpa rasa bersalah.'],
    ['Pasal Penyelesaian Secara Musyawarah & Penghentian Kerja Sama', 'Kontrak Bulanan', 'Cara mengakhiri kontrak bulanan secara profesional bila sudah tidak cocok.', 'Kerja sama bulanan dapat diakhiri oleh salah satu pihak dengan pemberitahuan tertulis minimal 7 (tujuh) hari sebelum periode bulan berikutnya dimulai, setelah seluruh kewajiban pekerjaan dan pembayaran pada bulan berjalan diselesaikan.', 'Memberi kepastian transisi yang damai baik bagi freelancer maupun pemilik usaha.']
  ],
  'Struktur Paket Jasa Laris': [
    ['Rumus Psikologi 3 Paket (Pengumpan, Jangkar Populer, Sultan)', 'Semua Jasa', 'Cara menyusun 3 harga agar 70% klien otomatis memilih paket tengah.', 'Paket 1: Rp900rb (6 item dasar) · Paket 2 Populer: Rp1,75jt (15 item + bonus cover — paling hemat per item!) · Paket 3 Lengkap: Rp3,2jt (30 item + prioritas).', 'Buat selisih fasilitas dari Paket 1 ke Paket 2 terasa dua kali lipat dengan kenaikan harga kurang dari dua kali lipat.'],
    ['Paket Bundel Peluncuran Usaha Kuliner Baru', 'Desain & Foto', 'Gabungan logo, daftar menu cetak, dan stiker kemasan yang dicari UMKM makanan.', 'Paket Siap Buka Warung/Kafe Rp1.650.000: 1 Logo Usaha + Desain Buku Menu A4 + Stiker Cup/Kemasan + Banner Depan Toko + 5 Template Promo IG.', 'Pemilik usaha kuliner lebih suka beli 1 paket siap buka daripada mencari 3 desainer terpisah.'],
    ['Paket Repurpose Rekaman Zoom/Podcast Jadi 20 Klip', 'Edit Video', 'Layanan langganan bulanan berkeuntungan tinggi dengan waktu kerja terukur.', 'Paket Mesin Klip Bulanan Rp2.200.000: Kirim 4 rekaman panjang/bulan → terima 20 klip vertikal 9:16 lengkap judul atas, caption per kata, & cover.', 'Dengan bantuan alat pemotong cepat, 20 klip bisa selesai dalam beberapa jam kerja bersih.'],
    ['Paket Audit & Perombakan Profil Instagram Jualan', 'Sosmed & Copywriting', 'Jasa cepat selesai 3 hari untuk merapikan toko online yang berantakan.', 'Paket Bedah Toko IG Rp750.000: Perapian kalimat Bio + 5 Ikon Sorotan (Highlight) + 3 Postingan Sematan (Pinned Post: Perkenalan, Katalog, Cara Pesan).', 'Produk pintu masuk (entry offer) yang sangat mudah dibeli klien baru sebelum lanjut kontrak bulanan.'],
    ['Paket Landing Page Siap Iklan + Copywriting Terima Beres', 'Website & Ads', 'Menghilangkan kebingungan klien yang disuruh menyiapkan kata-kata sendiri.', 'Paket LP Terima Beres Rp2.400.000: Wawancara singkat 15 menit via WA → Penulisan kalimat jualan penuh → Desain halaman responsif HP → Pasang domain & tombol WA.', 'Klien berani bayar mahal kalau tidak dibebani PR menulis teks sendiri.'],
    ['Paket Katalog Marketplace Anti-Tenggelam (10 Produk)', 'Desain & Foto', 'Merapikan foto sampul Shopee/Tokopedia dengan bingkai keunggulan produk.', 'Paket Etalase Laris Rp950.000: 10 Sampul Produk ber-highlight keunggulan + 3 Banner Dekorasi Toko + Perapian judul & deskripsi ramah pencarian.', 'Sangat dibutuhkan penjual marketplace menjelang tanggal kembar (9.9, 11.11, Ramadan).'],
    ['Paket Pembuatan Company Profile PDF + Slide Presentasi', 'Desain B2B', 'Layanan bernilai tinggi untuk kontraktor, distributor, dan vendor pengadaan.', 'Paket Profil Korporat Rp2.500.000: Buku Company Profile 12 halaman A4 siap cetak/kirim WA + versi Slide Presentasi PowerPoint/Canva bisa diedit.', 'Target klien B2B memiliki anggaran jauh lebih longgar dibanding ritel perorangan.'],
    ['Paket Setup Pembukuan & Dashboard Excel UMKM', 'Admin & Keuangan', 'Jasa sekali buat yang sangat dibutuhkan pemilik toko yang malas hitung manual.', 'Paket Rapikan Pembukuan Rp1.200.000: File Excel/Google Sheets kas masuk-keluar otomatis + stok barang + laporan laba rugi bulanan + video tutorial 10 menit.', 'Kamu cukup merancang master tabelnya sekali, lalu sesuaikan sedikit untuk tiap jenis toko.'],
    ['Paket Penulisan 15 Skrip Konten Affiliate / Keranjang Kuning', 'Copywriting', 'Menjual naskah siap baca ke brand yang punya tim host in-house.', 'Paket Amunisi Skrip Host Rp850.000: 15 Naskah video pendek lengkap 3 variasi kalimat pembuka per naskah + petunjuk pengambilan gambar.', 'Pemilik brand sering kehabisan ide sudut pandang konten harian untuk host mereka.'],
    ['Paket Pembuatan CV ATS + Profil LinkedIn Profesional', 'Jasa Karir', 'Paket jasa perorangan dengan perputaran uang tunai cepat selesai 2 hari.', 'Paket Siap Melamar Kerja Rp350.000: Perombakan CV 1 halaman standar HRD + Surat Lamaran Kerja Bahasa Indonesia & Inggris + Optimasi ringkasan LinkedIn.', 'Bisa dikerjakan lunas 100% di depan karena nominalnya terjangkau bagi pencari kerja.'],
    ['Paket Desain Menu Ojol + Penataan Harga Anti-Potongan', 'Kuliner & Konsultasi', 'Menggabungkan hitungan margin aman dengan foto/desain tampilan aplikasi.', 'Paket Optimasi Etalase Ojol Rp1.100.000: Hitung ulang harga aman potongan 20% + perapian nama & deskripsi 25 menu + 5 banner kategori menarik.', 'Langsung menyentuh keuntungan bersih pemilik warung/resto.'],
    ['Paket Dokumentasi Acara / Seminar 4 Jam + Video Highlight', 'Foto & Video', 'Struktur paket acara jelas dengan batas jam kerja tegas di lapangan.', 'Paket Liputan Acara Rp2.200.000: Maksimal 4 jam di lokasi + 100 foto pilihan sudah koreksi warna + 1 video rangkuman vertikal 60 detik selesai H+2.', 'Selalu cantumkan tarif kelebihan jam (overtime Rp350rb/jam) pada catatan kaki kartu harga.'],
    ['Paket Pembuatan Ebook / Lead Magnet PDF untuk Coach & Kreator', 'Desain & Penulisan', 'Mengubah rekaman suara/materi kasar klien menjadi buku digital rapi.', 'Paket Ebook Siap Jual Rp1.800.000: Perapian naskah hingga 25 halaman + tata letak buku profesional + desain sampul 3D mockup promosi.', 'Banyak praktisi punya ilmu bagus tapi tidak sempat mengetik dan menata halamannya.'],
    ['Paket Retainer Desain Grafis Sistem Kuota Poin Bulanan', 'Desain Grafis', 'Cara menjual langganan desain tanpa takut disuruh kerja tanpa batas.', 'Paket Desainer Siaga Rp2.800.000/bulan: Kuota 20 poin desain bebas tukar (1 desain feed = 1 poin, 1 banner cetak = 2 poin, 1 brosur lipat = 3 poin).', 'Sistem poin membuat permintaan klien terukur adil tanpa perdebatan setiap hari.'],
    ['Paket Pembuatan Skrip SOP Balasan Admin CS WhatsApp', 'Copywriting & Bisnis', 'Menyusun buku panduan chat untuk toko yang punya 2–5 admin CS.', 'Paket SOP Closing CS Rp1.450.000: Alur sapaan cepat, 20 template jawab keberatan harga, skrip follow-up bertahap, & aturan upsell paket hemat.', 'Sekali pakai langsung terasa dampaknya pada rasio chat yang berubah jadi transfer.'],
    ['Paket Pengelolaan Google Bisnis Lokal (Maps) Agar Muncul di Atas', 'Digital Marketing Lokal', 'Sangat laris untuk klinik gigi, bengkel, salon, kos-kosan, dan katering.', 'Paket Dominasi Peta Lokal Rp950.000: Optimasi profil lengkap, 15 foto berpenanda kata kunci, penataan daftar layanan, & template kartu minta ulasan bintang 5.', 'Hampir semua usaha jasa lokal butuh pelanggan sekitar lokasi mereka tanpa biaya iklan bulanan.'],
    ['Paket Pembuatan Slide Pitch Deck Investor / Kerjasama Sponsor', 'Desain Presentasi', 'Tarif premium untuk acara kampus, komunitas, maupun rintisan bisnis.', 'Paket Proposal Sponsor / Deck Rp1.950.000: Penyusunan alur 12–15 slide meyakinkan, infografis anggaran & paket sponsor, file PDF + PowerPoint.', 'Penyelenggara acara rela membayar layak karena proposal rapi mendatangkan uang sponsor puluhan juta.'],
    ['Paket Uji Coba Berbayar 7 Hari (Paid Trial)', 'Sosmed & Ads', 'Jembatan penutup penjualan bagi klien yang ragu langsung kontrak sebulan penuh.', 'Paket Coba 7 Hari Rp650.000: Produksi 4 konten unggulan + rencana konten 1 bulan. Jika lanjut ke Paket Bulanan dalam 3 hari, biaya Rp500rb langsung memotong tagihan bulan pertama!', 'Mengubah penolakan kontrak besar menjadi pemasukan tunai cepat minggu ini.'],
    ['Paket Pemeliharaan & Keamanan Website Tahunan', 'Web Developer', 'Pendapatan pasif berulang dari setiap klien website yang pernah kamu tangani.', 'Paket Jaga Website Tenang Rp1.200.000/tahun: Pencadangan rutin bulanan, pembaruan sistem keamanan, pantau uptime, & kuota ganti foto/teks ringan 4x setahun.', 'Dari 20 klien lama saja bisa menghasilkan Rp24 juta per tahun dengan waktu perawatan sangat ringan.'],
    ['Paket Konsultasi Tatap Layar 60 Menit + Rekaman & Rangkuman Aksi', 'Semua Keahlian', 'Menjual keahlianmu bagi klien yang ingin mengerjakan sendiri tapi butuh arahan tepat.', 'Sesi Bedah & Arahan 1-on-1 Rp450.000: Diskusi fokus 60 menit via Zoom + rekaman video sesi + lembar daftar langkah prioritas 1 halaman PDF.', 'Cara paling cerdas memonetisasi calon klien yang anggarannya belum cukup membeli jasa terima beresmu.']
  ],
  'Kalimat Follow-Up Proposal': [
    ['Follow-Up H+1: Pastikan Dokumen Terbuka dengan Baik', 'Semua Jasa', 'Chat ringan 24 jam setelah kirim kartu harga tanpa terkesan memaksa.', 'Halo Kak [Nama], izin memastikan apakah file PDF rincian paket & kartu harga yang saya kirim kemarin sudah bisa dibuka dengan jelas di HP Kakak? Kalau ada poin yang ingin ditanyakan, kabari santai saja ya Kak.', 'Sering kali klien bukannya menolak, melainkan chat-nya tertumpuk di WhatsApp saat sedang di jalan.'],
    ['Follow-Up H+3: Tawarkan Bantuan Pilih Paket Paling Efisien', 'Semua Jasa', 'Membantu klien yang bingung memilih di antara 3 opsi harga.', 'Halo Kak [Nama], menyambung penawaran kemarin — kalau melihat target Kakak bulan ini, sebenarnya Kakak belum perlu ambil Paket Lengkap dulu; mulai dari Paket Populer saja sudah menutup seluruh kebutuhan utamanya. Mau kita jadwalkan mulai minggu depan?', 'Klien langsung percaya ketika kamu menyarankan paket yang sesuai kebutuhan, bukan yang paling mahal.'],
    ['Follow-Up H+5: Kirim 1 Studi Kasus / Contoh Hasil Serupa', 'Desain, Video & Web', 'Memberi bukti visual relevan agar keraguan kualitas hilang.', 'Halo Kak [Nama], kebetulan kemarin kami baru merampungkan proyek yang bidang usahanya mirip dengan tempat Kakak. Saya izin lampirkan 1 cuplikan hasilnya sebagai gambaran ya. Kalau ingin hasil serupa untuk bulan ini, slot kami masih tersedia 1 kursi.', 'Bukti visual yang sejenis dengan bisnis klien jauh lebih kuat daripada sekadar tanya "jadi nggak?".'],
    ['Follow-Up H+7: Pengingat Kuota Jadwal Minggu Berjalan', 'Semua Jasa', 'Menciptakan kepastian jadwal yang jujur tanpa mengada-ada.', 'Halo Kak [Nama], izin mengabarkan minggu depan kami akan mulai mengunci jadwal produksi untuk proyek bulan berjalan. Apabila Kakak berencana mulai dalam waktu dekat, konfirmasi DP sebelum hari Jumat sore akan langsung mengamankan antrean pertama ya Kak.', 'Beri tenggat waktu keputusan yang sopan agar kamu bisa mengatur jadwal kerja dengan tenang.'],
    ['Follow-Up H+14: Penutup Ramah Tanpa Baper (Break-Up Message)', 'Semua Jasa', 'Pesan penutup elegan yang justru sering memancing klien langsung membalas.', 'Halo Kak [Nama], karena belum ada kabar lanjutan, saya asumsikan proyeknya mungkin belum menjadi prioritas minggu ini jadi izin saya tutup dulu antreansementara-nya ya Kak. Kapan pun ke depannya Kakak siap jalan, tinggal balas chat ini saja. Sukses terus untuk usahanya!', 'Banyak klien langsung membalas "Eh tunggu kak, jadi kok minggu ini!" saat menerima pesan sopan ini.'],
    ['Follow-Up Setelah Rapat Online / Telepon Pertama', 'Proposal B2B', 'Mengunci poin kesepakatan lisan menjadi dokumen tertulis dalam 2 jam setelah rapat.', 'Terima kasih untuk obrolan produktifnya tadi siang Pak/Bu [Nama]. Sesuai catatan diskusi kita, berikut saya lampirkan Proposal Resmi beserta 3 poin sasaran utama dan jadwal pengerjaannya. Jika sudah sesuai, kami siap mulai segera setelah konfirmasi Termin 1.', 'Kecepatan mengirim proposal di hari yang sama menaikkan peluang menang hingga dua kali lipat.'],
    ['Follow-Up Calon Klien yang Pernah Bilang "Tunggu Awal Bulan"', 'Semua Jasa', 'Menghubungi kembali tepat di tanggal 1–3 dengan alasan yang relevan.', 'Halo Kak [Nama], selamat awal bulan! Sesuai obrolan kita bulan lalu untuk rencana peluncuran konten di awal bulan ini, jadwal produksi minggu pertama kami sudah dibuka kembali. Apakah rincian paket kemarin masih sesuai atau ada tambahan baru Kak?', 'Simpan catatan tanggal pengingat setiap kali ada prospek berkata "bulan depan ya".'],
    ['Follow-Up Klien Lama yang Sudah 3 Bulan Selesai Proyek', 'Repeat Order', 'Mendapatkan proyek baru termudah dari klien yang sudah pernah puas.', 'Halo Kak [Nama], apa kabar? Senang melihat akun/usaha Kakak makin aktif belakangan ini! Sekadar mengabarkan bulan ini kami ada pembaruan layanan paket konten cepat — kalau Kakak butuh tambahan materi promosi untuk kampanye bulan depan, kabari saja ya Kak.', 'Menjual ke klien lama 5 kali lebih mudah daripada meyakinkan orang asing dari nol.'],
    ['Follow-Up Saat Klien Hanya Membaca (Centang Biru) Kartu Harga', 'Chat WhatsApp', 'Membuka percakapan kembali dengan pertanyaan pilihan ganda singkat.', 'Halo Kak [Nama], dari 3 pilihan paket di kartu harga kemarin, kira-kira yang paling mendekati kebutuhan Kakak saat ini nomor 1 (Hemat) atau nomor 2 (Populer) ya? Biar saya bantu hitungkan estimasi jadwal selesainya.', 'Pertanyaan pilihan A atau B jauh lebih mudah dijawab dalam 5 detik dibanding pertanyaan terbuka.'],
    ['Follow-Up Menjelang Momen Musiman (Ramadan / Tahun Baru / Harbolnas)', 'UMKM & Toko', 'Mengingatkan waktu persiapan produksi sebelum musim ramai tiba.', 'Halo Kak [Nama], mengingat 3 minggu lagi sudah masuk periode promo besar, biasanya antrean desain & video promosi mulai padat di pekan depan. Kalau Kakak ingin materi promonya siap lebih awal tanpa terburu-buru, kita bisa mulai cicil produksinya minggu ini ya Kak.', 'Bantu pemilik bisnis bersiap sebelum kompetitor mereka bergerak.'],
    ['Follow-Up Klien yang Sempat Meminta Revisi Anggaran di Proposal', 'Semua Jasa', 'Mengirimkan revisi proposal yang sudah dirampingkan dalam hitungan menit.', 'Halo Kak [Nama], ini sudah saya sesuaikan kembali Surat Penawarannya menjadi Rp1.350.000 dengan memfokuskan pada 10 item paling penting sesuai obrolan kita tadi. Silakan dicek halaman 2 ya Kak, kalau sudah pas bisa langsung kita jadwalkan.', 'Jangan biarkan jeda lebih dari 1 hari saat klien meminta penyesuaian isi proposal.'],
    ['Follow-Up Prospek dari Komentar / DM Media Sosial', 'Sosmed & Kreator', 'Memindahkan obrolan singkat di DM ke jalur profesional WhatsApp + Rate Card.', 'Halo Kak [Nama]! Terima kasih sudah mampir di pesan IG kami. Untuk layanan [Bidang Jasa], kisaran paket kami mulai dari Rp750rb sampai Rp2,5jt tergantung jumlah kebutuhannya. Boleh minta nomor WA aktifnya agar saya kirimkan Kartu Harga PDF lengkap contoh hasilnya?', 'Pindahkan percakapan serius ke WhatsApp agar dokumen PDF tidak tenggelam di DM.'],
    ['Follow-Up Penawaran Tambahan (Upsell) Saat Proyek Berjalan Mulus', 'Web & Desain', 'Menawarkan pelengkap yang relevan tepat ketika klien sedang senang melihat draf.', 'Senang sekali draf desain kemasannya langsung cocok Kak! Oiya, mumpung aset visualnya sudah jadi di meja kerja kami, apakah sekalian mau dibuatkan 5 foto mockup & banner katalog Shopee-nya sekalian? Khusus tambahan di proyek ini cukup Rp250rb saja.', 'Waktu terbaik menawarkan tambahan layanan adalah tepat saat klien memuji hasil drafmu.'],
    ['Follow-Up Perpanjangan Kontrak Bulanan (H-7 Sebelum Habis)', 'Retainer Bulanan', 'Memastikan kelanjutan bulan depan tanpa jeda kosong produksi.', 'Halo Kak [Nama], tidak terasa kerja sama bulan ini tinggal 1 minggu lagi dan seluruh 18 konten sudah terjadwal rapi. Untuk menjaga ritme tayang bulan depan tidak terputus, saya lampirkan rencana topik bulan depan beserta invoice perpanjangannya ya Kak.', 'Kirim rencana ide menarik bulan depan bersamaan dengan invoice perpanjangan agar klien antusias lanjut.'],
    ['Follow-Up Prospek yang Batal ke Vendor Murah Lalu Kecewa', 'Semua Jasa', 'Menyambut kembali klien dengan ramah tanpa menyindir keputusannya dulu.', 'Halo Kak [Nama], senang mendengar kabar dari Kakak lagi! Tidak masalah sama sekali Kak, kami siap bantu rapikan dan lanjutkan dari kondisi terakhir supaya target tayangnya minggu depan tetap terkejar. Boleh kirimkan materi yang sudah ada untuk kami petakan dulu?', 'Sikap dewasa dan solutif membuat klien tersebut menjadi pelanggan paling loyal bertahun-tahun.'],
    ['Follow-Up Pengiriman Draf Kontrak / SPK untuk Ditandatangani', 'Proyek Menengah', 'Memandu klien yang belum terbiasa menandatangani surat kesepakatan kerja.', 'Halo Kak [Nama], berikut draf Surat Kesepakatan Kerja singkat (2 halaman) yang merangkum jadwal, rincian item, dan jaminan hak kedua belah pihak. Cukup dibubuhkan tanda tangan di halaman 2 (bisa langsung coret di HP/PDF) lalu kita langsung jalan hari ini ya Kak.', 'Tegaskan bahwa surat kesepakatan melindungi kedua belah pihak secara seimbang.'],
    ['Follow-Up Minta Testimoni & Izin Portofolio Saat Klien Puas', 'Semua Jasa', 'Mengumpulkan ulasan asli yang jujur segera setelah file akhir diterima.', 'Alhamdulillah seluruh file final sudah diterima lengkap ya Kak [Nama]. Kalau berkenan, boleh minta 1–2 kalimat kesan selama bekerja sama dengan kami terkait kecepatan & kerapian hasilnya? Masukan Kakak sangat berarti bagi perkembangan studio kecil kami.', 'Minta ulasan spesifik tentang proses & hasil nyata saat rasa puas klien masih hangat.'],
    ['Follow-Up Program Referensi Teman Klien (Komisi / Bonus Jasa)', 'Semua Jasa', 'Mengubah 1 klien puas menjadi 2 klien baru lewat rekomendasi mulut ke mulut.', 'Terima kasih banyak atas ulasan hangatnya Kak [Nama]! Sekadar info, kalau ada rekan sesama pemilik usaha yang juga butuh bantuan [Bidang Jasa], setiap rekomendasi dari Kakak yang jadi bekerja sama akan memberi Kakak bonus 2 konten ekstra gratis di pesanan berikutnya ya.', 'Rekomendasi antar pemilik bisnis memiliki tingkat closing di atas 70%.'],
    ['Follow-Up Klien Korporat yang Menunggu Persetujuan Manajer/Direksi', 'B2B', 'Menanyakan jadwal rapat keputusan internal secara sopan dan profesional.', 'Selamat pagi Ibu/Bapak [Nama], izin menanyakan apakah dokumen penawaran dari kami sudah sempat dibahas pada rapat tinjauan minggu ini? Apabila tim manajemen membutuhkan penyesuaian format vendor atau kelengkapan NPWP untuk administrasi keuangan, kami siap melengkapi hari ini.', 'Tunjukkan kesiapan dokumen administrasi agar kamu dinilai setara vendor profesional.'],
    ['Follow-Up Reaktivasi Daftar Kontak Lama dengan Kartu Harga Baru', 'Semua Jasa', 'Menyapa prospek lama saat meluncurkan paket layanan yang lebih ringkas.', 'Halo Kak [Nama], semoga bisnisnya makin berkembang! Dulu kita sempat berdiskusi soal pembuatan konten, namun belum sempat berjodoh karena paket kami waktu itu cukup besar. Bulan ini kami baru membuka Paket Ringkas mingguan khusus UMKM — izin saya titipkan kartu harga terbarunya barangkali pas dengan rencana Kakak sekarang ya.', 'Paket kecil baru sering berhasil mencairkan puluhan prospek lama yang dulu terkendala bujet.']
  ],
  'Penagihan Invoice Sopan': [
    ['Pengantar Pengiriman Invoice DP 50% Pertama', 'Semua Jasa', 'Kalimat profesional saat mengirim tagihan uang muka agar cepat ditransfer.', 'Terima kasih atas kepercayaannya memilih [Nama Paket], Kak [Nama]. Berikut saya lampirkan Invoice DP 50% (Nomor: [No Invoice]) untuk mengunci jadwal pengerjaan mulai besok pagi. Setelah transfer, mohon kirimkan bukti bayarnya ke sini agar tim kami langsung mulai bergerak ya Kak.', 'Hubungkan kecepatan transfer DP dengan kecepatan dimulainya pekerjaan mereka.'],
    ['Pengingat Ramah H-2 Sebelum Jatuh Tempo Pelunasan', 'Kontrak & Korporat', 'Mengingatkan jadwal pembayaran sebelum terlambat tanpa kesan menagih keras.', 'Selamat siang Kak [Nama], sekadar menginformasikan bahwa pekerjaan telah memasuki tahap akhir serah terima dan Invoice Pelunasan akan jatuh tempo dalam 2 hari ke depan (Kamis, [Tanggal]). Seluruh file master siap kami kirimkan tepat saat pelunasan selesai.', 'Pengingat sebelum jatuh tempo terasa sebagai layanan administrasi yang rapi, bukan desakan.'],
    ['Penagihan Hari-H Jatuh Tempo Bersamaan Pengiriman Pratinjau Akhir', 'Semua Jasa', 'Mengirim bukti pekerjaan 100% beres bersamaan dengan rincian rekening pelunasan.', 'Halo Kak [Nama], kabar gembira — seluruh poin revisi sudah selesai 100% sesuai arahan Kakak (pratinjau lengkap terlampir). Untuk membuka tautan Google Drive berisi seluruh file resolusi tinggi tanpa watermark, silakan menyelesaikan pelunasan sesuai Invoice terlampir ya Kak.', 'Klien paling bersemangat melunasi ketika mereka sudah melihat hasil akhirnya tampak bagus di pratinjau.'],
    ['Pengingat H+2 Lewat Jatuh Tempo (Nada Santai & Positif)', 'UMKM & Personal', 'Menyikapi keterlambatan awal dengan asumsi klien sedang padat jadwal.', 'Halo Kak [Nama], semoga sehat selalu. Izin mengingatkan barangkali terlewat di tengah kesibukan minggu ini, untuk Invoice nomor [No Invoice] senilai [Nominal] sudah melewati tanggal jatuh tempo kemarin. Mohon bantuannya untuk konfirmasi apabila sudah terjadwal transfer hari ini ya Kak, terima kasih!', 'Hindari nada menuduh di H+2; beri ruang bagi klien untuk segera membayar tanpa malu.'],
    ['Pengingat H+5 Lewat Jatuh Tempo (Tegas & Minta Kepastian Tanggal)', 'Semua Jasa', 'Meminta tanggal pasti pembayaran ketika pesan pengingat pertama diabaikan.', 'Selamat pagi Kak [Nama], menindaklanjuti pengingat Invoice [No Invoice] yang telah jatuh tempo 5 hari lalu, mohon konfirmasi tanggal pasti rencana penyelesaian pembayarannya pada minggu ini agar dapat kami catat pada pembukuan kas studio kami. Terima kasih atas kerja samanya.', 'Jangan tanya "kapan bisa bayar?", melainkan minta "konfirmasi tanggal pasti minggu ini".'],
    ['Pengingat H+7 Kontrak Bulanan: Jeda Pengiriman Konten Sementara', 'Retainer Sosmed/Ads', 'Langkah tegas menghentikan kerja berjalan sampai tagihan bulan lalu lunas.', 'Halo Kak [Nama], berhubung Invoice bulan berjalan belum terselesaikan melewati 7 hari dari batas waktu, sesuai prosedur operasional kami jadwal pengunggahan & produksi batch berikutnya izin kami jeda sementara mulai besok hingga administrasi terkonfirmasi lunas. Terima kasih atas pengertiannya.', 'Jangan pernah menambah tumpukan kerja baru di atas tagihan lama yang belum dibayar.'],
    ['Penagihan ke Bagian Keuangan (Finance) Perusahaan B2B', 'Klien Perusahaan', 'Format pesan formal lengkap nomor referensi dokumen untuk staf akuntansi.', 'Yth. Tim Keuangan [Nama Perusahaan], izin mengonfirmasi status proses pembayaran atas Invoice Nomor [No Invoice] tertanggal [Tanggal] sebesar [Nominal] untuk pekerjaan [Nama Proyek] yang telah diserahterimakan dengan Berita Acara terlampir. Mohon informasi jadwal kliring pembayarannya. Terima kasih.', 'Staf keuangan perusahaan membutuhkan kelengkapan nomor invoice, berita acara, dan nominal persis.'],
    ['Konfirmasi Penerimaan Pembayaran & Pengiriman Kwitansi Lunas', 'Semua Jasa', 'Meninggalkan kesan profesional luar biasa tepat setelah uang masuk.', 'Terima kasih banyak Kak [Nama], pembayaran pelunasan sebesar [Nominal] telah kami terima dengan baik! Berikut saya lampirkan Kwitansi LUNAS resmi beserta tautan Google Drive berisi seluruh file akhir siap pakai. Senang sekali bisa membantu proyek Kakak!', 'Kwitansi bertanda LUNAS membuat klien merasa bertransaksi dengan bisnis resmi yang tepercaya.'],
    ['Penagihan Biaya Tambahan (Add-On) di Tengah Proyek', 'Semua Jasa', 'Memastikan permintaan tambahan dicatat ke invoice sebelum ikut diserahkan.', 'Halo Kak [Nama], untuk tambahan pembuatan 2 ukuran banner cetak sesuai permintaan barusan sudah kami masukkan ke daftar kerja hari ini. Biaya tambahannya sebesar Rp200.000 otomatis kami gabungkan ke baris Invoice Pelunasan akhir nanti ya Kak. Mohon balas "Oke" sebagai tanda setuju.', 'Konfirmasi kata "Oke" di chat adalah bukti tertulis yang sah saat menagih di akhir proyek.'],
    ['Solusi Cicilan 2 Tahap Saat Klien Mengalami Kendala Kas Mendadak', 'Penyelamatan Piutang', 'Mengamankan uang masuk ketika klien jujur sedang kesulitan bayar penuh sekaligus.', 'Terima kasih sudah mengabarkan kondisinya secara terbuka Kak [Nama]. Agar tetap terbantu, pelunasan Rp1.600.000 boleh dibagi menjadi 2 tahap: Rp800.000 hari ini (kami serahkan separuh batch file pertama), dan sisa Rp800.000 pada tanggal [Tanggal Minggu Depan] sekaligus serah terima sisa filenya.', 'Serahkan file secara proporsional mengikuti persentase uang yang sudah masuk.'],
    ['Penagihan Termin Kedua (Milestone Tengah Proyek)', 'Web & Branding', 'Menagih pembayaran tengah saat draf utama sudah dipresentasikan.', 'Halo Kak [Nama], tahap desain halaman utama & struktur navigasi telah selesai 100% sesuai jadwal tahap pertama. Sesuai kesepakatan pembayaran bertahap, berikut kami kirimkan Invoice Termin 2 (30%) sebagai syarat dimulainya tahap pemrograman & pengisian konten penuh.', 'Jadikan setiap termin sebagai gerbang pembuka menuju tahap pengerjaan berikutnya.'],
    ['Pesan Pengingat Saat Klien Salah Transfer Nominal Kurang Digit', 'Semua Jasa', 'Mengoreksi kekurangan nominal transfer secara sopan tanpa membuat canggung.', 'Terima kasih bukti transfernya Kak [Nama], dana sebesar Rp1.200.000 sudah masuk. Izin menginfokan sedikit, sesuai rincian pada Invoice total pelunasannya adalah Rp1.250.000 sehingga masih terdapat selisih Rp50.000. Boleh dibantu genapkan kapan saja hari ini sebelum tautan final kami kirimkan ya Kak.', 'Tetap teliti pada angka invoice agar pembukuan usahamu rapi.'],
    ['Format Catatan Rekening & QRIS Anti-Salah Kirim di Bawah Invoice', 'Administrasi', 'Susunan informasi pembayaran yang jelas agar klien tidak menunda gara-gara malas tanya.', 'Metode Pembayaran Resmi: Bank BCA 1234567890 a.n. [Nama Lengkap] (Kode Bank 014). Mohon cantumkan kode berita: [Nomor Invoice] dan kirimkan tangkapan layar bukti berhasil ke WhatsApp [Nomor WA].', 'Semakin mudah informasi rekening disalin, semakin cepat klien mentransfer hari itu juga.'],
    ['Penagihan Biaya Pembatalan / Kill Fee Saat Proyek Dihentikan Klien', 'Proyek Berjalan', 'Menagih proporsi pekerjaan yang sudah selesai di atas porsi DP.', 'Menindaklanjuti keputusan penghentian proyek dari pihak Klien pada saat progres pengerjaan telah mencapai 80%, maka sesuai klausul kesepakatan kerja berlaku penyelesaian proporsional sebesar 30% tambahan dari nilai proyek atas waktu dan draf yang telah diselesaikan.', 'Melindungi keringat kerjamu bila proyek hampir selesai namun rencana bisnis klien berubah mendadak.'],
    ['Penagihan Klien yang Berdalih "Menunggu Bos Pulang Luar Kota"', 'B2B & UMKM', 'Meminta pelimpahan persetujuan transfer mobile banking secara sopan.', 'Baik Kak [Nama], kami maklum Bapak/Ibu pimpinan sedang bertugas di luar kota. Mengingat file dibutuhkan tim Kakak untuk tayang besok pagi, apakah memungkinkan pengajuan transfernya diteruskan via persetujuan mobile banking hari ini agar jadwal tayang Kakak tidak tertunda?', 'Kaitkan kepentingan pelunasan dengan kelancaran jadwal tayang milik tim klien sendiri.'],
    ['Pengingat Akhir Sebelum Pencabutan Lisensi Pakai / Takedown', 'Kasus Nunggak Berat', 'Langkah profesional terakhir bila klien memakai hasil pratinjau tanpa melunasi.', 'Selamat siang [Nama], mengingat tagihan atas pekerjaan [Nama Proyek] telah melewati 21 hari sejak jatuh tempo tanpa penyelesaian, kami informasikan bahwa hak pakai komersial atas seluruh rancangan visual masih sepenuhnya milik Studio hingga pelunasan diselesaikan selambatnya Jumat pukul 17.00 WIB.', 'Tegas secara hukum dan etika bisnis tanpa perlu kata-kata kasar atau emosional.'],
    ['Template Berita Acara Serah Terima (BAST) Singkat Pendamping Invoice', 'Semua Jasa', 'Satu paragraf bukti pekerjaan selesai untuk melengkapi penagihan akhir.', 'Pada hari ini [Tanggal], telah diserahterimakan seluruh hasil pekerjaan [Nama Paket] dari [Nama Studio] kepada [Nama Klien] dalam kondisi lengkap dan sesuai spesifikasi penawaran, sehingga kewajiban pengerjaan dinyatakan selesai 100%.', 'Kalimat sederhana yang menutup celah komplain sepihak sebulan kemudian.'],
    ['Penagihan Uang Muka Pemesanan Ulang (Repeat Order) Klien Akrab', 'Klien Rutin', 'Tetap menjaga disiplin DP meski sudah kenal akrab dengan klien lama.', 'Siap Kak [Nama], langsung saya jadwalkan batch kedua untuk minggu ini ya! Seperti biasa, ini saya kirimkan dulu Invoice DP 50%-nya supaya tercatat rapi di antrean produksi kami minggu ini. Terima kasih selalu langganan Kak!', 'Kata "seperti biasa supaya tercatat rapi di sistem" menjaga aturan DP tetap berlaku nyaman pada klien akrab.'],
    ['Penjelasan Pajak Potong (PPh 23 / PPh 21) pada Invoice Perusahaan', 'Klien PT / Instansi', 'Mencegah kaget saat nominal transfer dari PT terpotong pajak resmi.', 'Catatan Penagihan Korporat: Nominal tertera adalah nilai bersih (netto) yang diterima Studio, atau apabila Perusahaan melakukan pemotongan PPh 23 (2%), mohon melampirkan Bukti Potong resmi paling lambat pada bulan pajak berikutnya.', 'Selalu tanyakan di awal kepada klien PT apakah anggaran mereka bersifat Gross atau Nett.'],
    ['Ucapan Akhir Tahun + Rekap Kerja Sama untuk Memancing Kontrak Baru', 'Loyalitas Klien', 'Mengubah rekap administrasi menjadi pembuka proyek awal tahun.', 'Terima kasih banyak atas kolaborasi sepanjang tahun ini Kak [Nama] — total sudah 4 proyek kita selesaikan bareng dengan lancar! Khusus untuk klien prioritas, tarif lama masih kami kunci hingga akhir bulan depan sebelum penyesuaian kartu harga tahun baru. Kabari bila ingin amankan slot awal tahun ya!', 'Strategi klasik mengunci omzet awal tahun sebelum kenaikan harga kartu tarif baru.']
  ],
  'Prompt AI Riset & Audit Klien': [
    ['Bedah Kelemahan Akun Sosmed Calon Klien Sebelum Kirim Proposal', 'Sosmed & Konten', 'Prompt siap tempel ke ChatGPT/Gemini untuk menemukan 3 celah perbaikan yang bikin klien langsung tertarik.', 'Saya ingin menawarkan jasa kelola konten ke usaha [Jenis Usaha Klien, misal: Klinik Kecantikan di Bandung]. Kondisi akun IG mereka saat ini: jarang upload, desain campur aduk, bio belum jelas cara pesannya. Tuliskan 3 temuan singkat yang sopan + dampak ruginya + bagaimana Paket Populer saya menyelesaikan ketiganya dalam 30 hari.', 'Tempel hasil poinnya ke halaman pembuka proposal agar klien merasa kamu benar-benar mempelajari bisnisnya.'],
    ['Susun Struktur Kalimat Landing Page dari Catatan Berantakan Klien', 'Website & Copy', 'Mengubah pesan suara/catatan singkat klien menjadi kerangka halaman jualan tajam.', 'Berikut informasi mentah produk dari klien saya: [Tempel Info Produk & Harga]. Susunkan kerangka Landing Page 8 bagian memakai bahasa Indonesia sehari-hari yang mengalir natural (tanpa kata kaku seperti solusi holistik/inovatif): 1. Judul Masalah+Hasil, 2. Situasi Pembeli, 3. Keunggulan, 4. Rincian Isi, 5. Perbandingan, 6. Harga, 7. Garansi, 8. Tanya Jawab.', 'Menghemat 2 jam kerja merangkai kata dari kertas kosong saat mengerjakan proyek web klien.'],
    ['Riset 15 Ide Judul Konten Reels/TikTok Spesifik Niche Klien', 'Video & Konten', 'Menyiapkan lampiran bonus "15 Ide Konten Pertama" saat mengirim proposal.', 'Klien saya menjual [Nama Produk/Jasa Klien] untuk target pembeli [Target Pembeli]. Buatkan 15 ide judul video pendek 30 detik yang memancing rasa penasaran di 3 detik pertama, dibagi menjadi: 5 konten masalah pembeli, 5 konten edukasi ringan, dan 5 konten bukti/cara pakai produk.', 'Melampirkan 5 contoh judul gratis di dalam proposal membuat peluang diterima naik pesat!'],
    ['Hitung Simulasi Balik Modal (ROI) Jasa bagi Pemilik Bisnis', 'Semua Jasa', 'Membantu klien melihat bahwa tarif jasamu sebenarnya murah dibanding potensi omzetnya.', 'Harga produk rata-rata klien saya adalah Rp[Harga Produk Klien] dengan perkiraan untung bersih Rp[Untung Bersih]/pembeli. Tarif jasa paket saya Rp[Tarif Paketmu]. Hitungkan berapa jumlah pembeli tambahan minimal yang dibutuhkan klien supaya biaya jasa saya balik modal 100%, lalu rangkum dalam 3 kalimat meyakinkan yang jujur.', 'Ketika klien sadar ia cukup dapat 8 pembeli untuk menutup biaya jasamu, harga Rp2 juta terasa sangat masuk akal.'],
    ['Ubah Pengalaman Kerja Kasar Jadi Deskripsi Portofolio Meyakinkan', 'Personal Branding', 'Merapikan cerita hasil kerjamu agar tampil berwibawa di halaman profil proposal.', 'Saya pernah mengerjakan [Ceritakan singkat proyekmu, misal: bantu toko kue rapikan foto menu dan pesanan naik]. Tolong tulis ulang menjadi 1 paragraf ringkasan studi kasus pendek yang konkret, rendah hati, dan fokus pada masalah awal → tindakan yang dikerjakan → hasil nyatanya.', 'Tiga studi kasus pendek jauh lebih meyakinkan daripada daftar panjang aplikasi yang kamu kuasai.'],
    ['Susun Pertanyaan Brief Awal Klien Agar Tidak Salah Tangkap Konsep', 'Desain, Video & Web', 'Menghasilkan 8 pertanyaan terarah sebelum mulai kerja supaya hemat revisi.', 'Saya baru menerima DP untuk proyek [Jenis Proyek] dari klien di bidang [Bidang Usaha]. Buatkan daftar 8 pertanyaan singkat, jelas, dan mudah dijawab orang awam lewat WhatsApp untuk menggali selera visual, target pembeli, larangan warna/kata, dan contoh referensi yang mereka sukai.', 'Brief awal yang tajam memangkas 80% drama revisi di tengah jalan.'],
    ['Rancang 3 Variasi Sudut Pandang Iklan (Ad Angles) untuk Klien Baru', 'Meta / TikTok Ads', 'Menyusun rencana tes materi iklan minggu pertama yang terstruktur.', 'Produk klien: [Nama Produk], harga Rp[Harga], masalah utama pembeli: [Masalah]. Buatkan 3 sudut pandang naskah iklan pendek yang berbeda (Sudut 1: Hemat Waktu/Uang, Sudut 2: Ketakutan Salah Pilih, Sudut 3: Bukti Kemudahan Pakai), masing-masing lengkap kalimat pembuka 3 detik dan ajakan bertindak.', 'Menunjukkan rencana pengujian 3 sudut pandang membuatmu terlihat jauh lebih ahli dibanding joki iklan biasa.'],
    ['Perhalus Kalimat Penolakan / Teguran ke Klien Tanpa Terkesan Kasar', 'Komunikasi Klien', 'Mengubah kekesalanmu saat klien melanggar batas menjadi pesan elegan berkelas.', 'Situasi saya: [Ceritakan kondisi, misal: klien kirim revisi jam 11 malam minta besok pagi jadi padahal kuota revisi sudah 2x]. Tolong ubah maksud saya menjadi pesan WhatsApp bahasa Indonesia yang sangat sopan, tenang, tidak emosional, namun tetap tegas menolak lembur gratis dan mengarahkan ke opsi biaya tambahan resmi.', 'Jangan pernah membalas chat klien saat sedang emosi; saring dulu lewat prompt ini selama 30 detik.'],
    ['Buat Rincian Jadwal Kerja (Timeline Mingguan) untuk Lampiran Proposal', 'Proyek >2 Minggu', 'Memecah durasi pengerjaan 14 hari menjadi tahapan yang jelas dan menenangkan klien.', 'Saya mengerjakan proyek [Nama Proyek] dengan total waktu [Jumlah Hari] hari kerja, mencakup [Daftar Item]. Pecahkan menjadi tabel jadwal tahapan dari Hari 1 sampai serah terima akhir, lengkap kapan klien perlu menyerahkan bahan dan kapan jadwal peninjauan draf.', 'Klien bersedia membayar lebih mahal kepada freelancer yang punya jadwal tahapan tertulis rapi.'],
    ['Riset Kata Kunci Pencarian Pembeli untuk Artikel / Toko Klien', 'SEO & Marketplace', 'Menemukan istilah sehari-hari yang diketik orang Indonesia saat mau membeli.', 'Klien saya berjualan [Produk/Jasa] di Indonesia. Daftarkan 20 frasa pencarian panjang (3–5 kata) yang biasa diketik calon pembeli yang sudah siap membeli (bukan sekadar cari pengertian umum), lalu kelompokkan menurut niat belinya.', 'Kata kunci berniat beli tinggi membuat artikel atau judul produk klien cepat menghasilkan transaksi.'],
    ['Susun Paket Bundel Baru dari Gabungan 2 Keahlian Sederhana', 'Strategi Jasa', 'Menciptakan penawaran unik agar tidak perang harga dengan ribuan pesaing umum.', 'Keahlian yang saya bisa saat ini: [Keahlian 1, misal Canva] dan [Keahlian 2, misal rapiin tabel Excel/tulis caption]. Buatkan 3 ide paket jasa gabungan siap pakai untuk pemilik UMKM lokal dengan harga jual Rp1 juta – Rp2,5 juta yang memecahkan masalah spesifik mereka.', 'Menggabungkan 2 skill dasar menciptakan paket unik yang sulit dibanding-bandingkan harganya per biji.'],
    ['Audit Kejelasan Halaman Penawaran Klien & Daftar Perbaikannya', 'Website & Toko', 'Memberi nilai tambah cepat saat menawarkan jasa perombakan landing page.', 'Ini teks halaman jualan milik calon klien saya: [Tempel Teks LP Klien]. Temukan 5 bagian yang membingungkan pembeli atau membuat orang ragu transfer, lalu tuliskan kalimat penggantinya yang lebih jernih dan langsung ke inti manfaat.', 'Klien hampir pasti memesan jasa perombakanmu kalau kamu sudah menunjukkan letak kebocorannya dengan tepat.'],
    ['Susun Daftar Periksa Serah Terima Akhir (Handover Checklist)', 'Semua Jasa', 'Memastikan tidak ada file atau akses yang terlewat saat menutup proyek.', 'Buatkan daftar periksa serah terima akhir profesional untuk proyek [Jenis Jasa] agar klien merasa dilayani tuntas, mencakup urutan folder file, panduan singkat cara pakai hasil akhirnya, serta pengingat masa simpan cadangan file 30 hari.', 'Pengalaman serah terima yang rapi adalah kunci utama klien memesan ulang bulan depan.'],
    ['Buat Skrip Presentasi Singkat 5 Menit Saat Zoom Bareng Calon Klien', 'Penjualan B2B', 'Panduan urutan bicara agar tidak gugup saat diajak meeting online sebelum deal.', 'Besok saya akan meeting online 15 menit dengan pemilik [Jenis Bisnis Klien] yang tertarik pada jasa [Bidang Jasa]. Susunkan alur bicara 5 menit yang terarah: 1 menit pembuka & konfirmasi masalah mereka, 2 menit cara kerja singkat saya, 1 menit pilihan paket, dan 1 menit ajakan kunci jadwal.', 'Lebih banyak bertanya & mendengarkan masalah klien di 5 menit awal jauh lebih efektif daripada bicara sendiri.'],
    ['Terjemahkan Istilah Teknis Rumit Jadi Bahasa Pemilik Usaha Awam', 'Web, Ads & Desain', 'Agar proposalmu dimengerti pemilik bisnis tanpa membuat mereka pusing istilah asing.', 'Ubah daftar pekerjaan teknis ini: [Misal: responsive breakpoint, image compression WebP, CTA hierarchy, copywriting hook] menjadi bahasa manfaat sehari-hari yang langsung dipahami pemilik toko/bisnis di Indonesia (contoh: cepat dibuka di HP sinyal pas-pasan).', 'Pemilik usaha membeli manfaat bisnis, bukan istilah teknis pemrograman atau desain.'],
    ['Susun Rencana Konten 30 Hari Pertama untuk Klien Retainer Baru', 'Admin Sosmed', 'Menyelesaikan perencanaan sebulan penuh dalam 15 menit setelah DP masuk.', 'Klien baru saya adalah [Jenis Usaha] dengan keunggulan [Keunggulan Utama] dan target pasar [Target]. Susunkan tabel rencana 16 konten selama 4 minggu (4 konten/minggu) berisi: Hari, Pilar Konten, Judul Utama di Layar, Isi Singkat, dan Kalimat Ajakan di Akhir.', 'Kirim tabel rencana ini di Hari ke-2 setelah DP masuk untuk langsung membangun kepercayaan tinggi!'],
    ['Rancang Penawaran "Pintu Masuk" Rp300rb–Rp500rb untuk Cari Klien Cepat', 'Pemula Freelance', 'Produk jasa mikro yang beres dalam 2–3 jam untuk mengumpulkan kas & portofolio nyata.', 'Saya ingin membuka jasa cepat beres dalam 1 hari kerja di bidang [Keahlianmu] dengan harga Rp350.000 agar pemilik UMKM mudah mencoba tanpa mikir panjang. Buatkan 3 ide paket kilat yang hasilnya konkret (file jadi), batas pekerjaannya jelas, dan mudah dilanjutkan ke paket bulanan Rp1,5 juta.', 'Strategi terbaik mendapatkan 5 klien berbayar pertama tanpa harus banting harga paket utama!'],
    ['Evaluasi Kenaikan Tarif Kartu Harga untuk Klien Baru Bulan Depan', 'Manajemen Bisnis', 'Menghitung kapan dan berapa persen menaikkan harga saat antrean mulai penuh.', 'Saat ini saya menangani [Jumlah Klien] klien dengan tarif rata-rata Rp[Tarif Sekarang] dan jam kerja saya sudah terpakai sekitar [Jam/Hari] jam sehari. Bantu saya menyusun skema kenaikan tarif 25% pada kartu harga baru bulan depan beserta peningkatan kecil layanan yang membuat harga baru tersebut terasa layak.', 'Setiap 3–4 klien yang langsung setuju tanpa menawar adalah sinyal bahwa tarifmu sudah saatnya naik 20–25%.'],
    ['Susun Pesan Penawaran Dingin (Cold Outreach) Personal Anti-Spam', 'Cari Klien Baru', 'Menghubungi usaha potensial di Instagram/Google Maps secara sopan & relevan.', 'Saya menemukan usaha [Nama & Jenis Usaha, misal: Katering Sehat] di kota saya yang produknya terlihat enak tapi tampilan menu & profil pemesanannya masih membingungkan pembeli baru. Buatkan pesan perkenalan singkat 4 kalimat yang memuji produk mereka secara tulus, menyebutkan 1 ide perbaikan spesifik, dan menawarkan izin kirim contoh konsep gratis 1 halaman.', 'Jangan pernah kirim pesan massal salin-tempel tanpa menyebut nama & detail asli usaha mereka.'],
    ['Buat Ringkasan Laporan Bulanan Klien yang Menonjolkan Hasil Kerjamu', 'Retainer Bulanan', 'Agar klien bulanan merasakan progres nyata dan terus memperpanjang kontrak.', 'Data hasil pekerjaan bulan ini untuk klien [Nama Klien]: [Masukkan jumlah konten terbit, pertumbuhan jangkauan/klik WA, konten paling ramai]. Susunkan ringkasan laporan bulanan 1 halaman yang jujur, mudah dibaca dalam 1 menit oleh pemilik bisnis sibuk, serta diakhiri 3 rekomendasi fokus untuk bulan depan.', 'Laporan singkat yang rapi membuat klien sadar betapa berharganya peranmu setiap bulan.']
  ]
};

export const FREELANCE_LIBRARY_ITEMS = [];
let runningIdx = 1;
for (const [category, rows] of Object.entries(RAW_SEEDS)) {
  for (const [title, niche, summary, example, tips] of rows) {
    FREELANCE_LIBRARY_ITEMS.push({
      id: `fk-${String(runningIdx).padStart(3, '0')}`,
      category,
      niche,
      title,
      summary,
      explanation: `${summary} Dirancang khusus untuk pelaku jasa & pekerja lepas di Indonesia agar siap dipakai langsung tanpa perlu ikut kelas teori panjang.`,
      example,
      tips
    });
    runningIdx++;
  }
}

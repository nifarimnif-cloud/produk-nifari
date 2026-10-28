/**
 * Koleksi 120 Item Siap Pakai — Perangkat Ajar & Rapor Kurikulum Merdeka
 * Terbagi dalam 6 kategori (masing-masing 20 item = 120 item lengkap dengan
 * penjelasan, teks contoh siap salin/pakai, dan tips penerapan di kelas).
 */

const RAW_CATEGORIES = [
  {
    category: 'Tujuan Pembelajaran',
    wizardField: 'tujuanPembelajaran',
    items: [
      {
        title: 'Matematika SD Fase A — Penjumlahan Benda Konkret',
        jenjang: 'SD',
        summary: 'Murid mampu menghitung penjumlahan bilangan sampai 20 memakai benda di sekitar kelas.',
        explanation: 'Cocok untuk kelas 1–2 SD agar konsep tambah tidak sekadar hafalan angka, melainkan paham arti menggabungkan dua kelompok benda.',
        example: 'Melalui kegiatan menghitung kancing atau stik es krim secara berkelompok, peserta didik dapat menentukan hasil penjumlahan dua bilangan cacah sampai 20 dengan tepat serta menceritakan cara menghitungnya dengan percaya diri.',
        tips: 'Siapkan benda nyata (batu kecil, sedotan, atau stik kayu) minimal 20 buah per meja sebelum pelajaran dimulai.'
      },
      {
        title: 'Matematika SD Fase B — Pecahan Senilai Lewat Lipatan Kertas',
        jenjang: 'SD',
        summary: 'Murid menemukan konsep pecahan senilai menggunakan peraga lipatan kertas warna.',
        explanation: 'Membantu murid kelas 3–4 SD melihat secara visual bahwa 1/2 sama besarnya dengan 2/4 dan 4/8.',
        example: 'Melalui praktik melipat dan mengarsir kertas origami, peserta didik mampu membandingkan dua pecahan sederhana dan menunjukkan pasangan pecahan yang senilai secara akurat.',
        tips: 'Minta murid menempelkan hasil lipatan kertas langsung di buku catatan sebagai bukti karya.'
      },
      {
        title: 'Matematika SD Fase C — Bangun Ruang & Volume Kubus-Balok',
        jenjang: 'SD',
        summary: 'Menghitung volume kemasan kardus bekas di sekitar rumah dan sekolah.',
        explanation: 'Mengaitkan rumus panjang × lebar × tinggi dengan benda nyata yang sering dilihat murid kelas 5–6 SD.',
        example: 'Setelah mengukur panjang rusuk beberapa kotak kemasan bekas menggunakan penggaris, peserta didik dapat menghitung volume kubus dan balok serta menyelesaikan masalah sehari-hari yang berkaitan dengan kapasitas ruang.',
        tips: 'Tugaskan tiap kelompok membawa 1 kardus pasta gigi atau kotak susu kosong sehari sebelumnya.'
      },
      {
        title: 'Bahasa Indonesia SD Fase A — Membaca Nyaring & Kosakata Baru',
        jenjang: 'SD',
        summary: 'Membaca cerita bergambar pendek dengan lafal dan intonasi yang jelas.',
        explanation: 'Melatih kelancaran membaca awal sekaligus keberanian tampil di depan teman sebaya.',
        example: 'Melalui kegiatan membaca bersama cerita bergambar bertema kebersihan diri, peserta didik dapat melafalkan kata dengan jelas, menemukan arti 3 kosakata baru, dan menjawab pertanyaan isi bacaan secara lisan.',
        tips: 'Gunakan tanda jeda garis miring pada kalimat panjang untuk membantu murid yang masih mengeja.'
      },
      {
        title: 'Bahasa Indonesia SD Fase C — Menulis Teks Eksplanasi Fenomena Alam',
        jenjang: 'SD',
        summary: 'Menyusun urutan sebab-akibat terjadinya hujan, banjir, atau pelangi.',
        explanation: 'Melatih penalaran runtut murid kelas 5–6 SD dalam menulis paragraf informasi.',
        example: 'Melalui pengamatan bagan alur peristiwa alam, peserta didik mampu menulis teks eksplanasi singkat 3 paragraf yang memuat pernyataan umum, deretan penjelas sebab-akibat, dan simpulan menggunakan ejaan yang rapi.',
        tips: 'Berikan kerangka kalimat penghubung seperti "Hal ini disebabkan oleh..." dan "Akibatnya...".'
      },
      {
        title: 'IPAS SD Fase B — Perubahan Wujud Benda di Dapur',
        jenjang: 'SD',
        summary: 'Mengamati peristiwa mencair, membeku, dan menguap lewat percobaan sederhana.',
        explanation: 'Materi IPAS kelas 4 SD yang sangat mudah dipraktikkan langsung memakai es batu dan air hangat.',
        example: 'Melalui percobaan mengamati es batu di ruang terbuka dan uap air hangat pada tutup gelas, peserta didik dapat mengidentifikasi perubahan wujud benda karena pengaruh kalor beserta contohnya di rumah.',
        tips: 'Pastikan air hangat disiapkan oleh guru agar tetap aman bagi murid.'
      },
      {
        title: 'IPAS SD Fase C — Rantai Makanan & Keseimbangan Ekosistem Sawah',
        jenjang: 'SD',
        summary: 'Menganalisis peran produsen, konsumen, dan pengurai pada ekosistem lokal.',
        explanation: 'Membantu murid memahami dampak bila salah satu makhluk hidup berkurang drastis.',
        example: 'Melalui diskusi studi kasus hama wereng di sawah, peserta didik dapat menggambar skema jaring-jaring makanan dan menjelaskan dampak terganggunya satu populasi terhadap keseimbangan ekosistem.',
        tips: 'Gunakan kartu gambar hewan dan panah tali rafia agar murid bisa merangkai rantai makanan di depan kelas.'
      },
      {
        title: 'Pendidikan Pancasila Semua Fase — Musyawarah & Kesepakatan Kelas',
        jenjang: 'Semua Jenjang',
        summary: 'Mempraktikkan pengambilan keputusan bersama dan menghargai perbedaan pendapat.',
        explanation: 'Penerapan langsung sila keempat Pancasila dalam kehidupan nyata di ruang kelas.',
        example: 'Melalui simulasi pemilihan pengurus dan penyusunan kesepakatan kelas, peserta didik mampu menyampaikan pendapat dengan santun, mendengarkan usulan teman, serta menerima hasil keputusan bersama dengan tanggung jawab.',
        tips: 'Catat kesepakatan di karton besar dan minta seluruh murid membubuhkan tanda tangan komitmen.'
      },
      {
        title: 'IPA SMP Fase D — Sistem Pencernaan & Label Gizi Kemasan Jajanan',
        jenjang: 'SMP',
        summary: 'Menghubungkan kandungan gula/garam pada kemasan jajanan dengan kesehatan organ pencernaan.',
        explanation: 'Sangat relevan dengan kebiasaan jajan minuman manis pada remaja SMP.',
        example: 'Setelah membaca tabel informasi nilai gizi pada 3 bungkus makanan/minuman ringan, peserta didik dapat menghitung takaran gula harian dan menjelaskan dampaknya bagi kesehatan sistem pencernaan manusia.',
        tips: 'Bawa contoh kemasan minuman kemasan populer agar murid langsung kaget melihat gram gulanya.'
      },
      {
        title: 'IPA SMP Fase D — Suhu, Kalor & Pemilihan Bahan Isolator',
        jenjang: 'SMP',
        summary: 'Merancang wadah sederhana penahan panas/dingin dari bahan bekas.',
        explanation: 'Cocok untuk model Project Based Learning (PjBL) pengantar rekayasa sederhana.',
        example: 'Melalui proyek pembuatan termos sederhana dari botol plastik dan bahan pelapis rumah tangga, peserta didik dapat membedakan sifat konduktor serta isolator kalor berdasarkan data pengukuran penurunan suhu.',
        tips: 'Bandingkan suhu air setelah 15 menit antar kelompok untuk melihat rancangan siapa yang paling efektif.'
      },
      {
        title: 'IPS SMP Fase D — Kegiatan Ekonomi, Permintaan, Penawaran & Pasar Lokal',
        jenjang: 'SMP',
        summary: 'Menganalisis penyebab naik-turunnya harga bahan pokok di pasar sekitar.',
        explanation: 'Melatih literasi ekonomi kontekstual dari kejadian harga cabai atau beras di lingkungan rumah.',
        example: 'Melalui wawancara singkat dengan orang tua atau pedagang sekitar rumah dan diskusi kelompok, peserta didik mampu menjelaskan hubungan permintaan, penawaran, dan terbentuknya harga pasar secara runtut.',
        tips: 'Bisa disimulasikan lewat permainan jual-beli kupon barang di dalam kelas selama 10 menit.'
      },
      {
        title: 'Bahasa Indonesia SMP Fase D — Menulis Teks Persuasi Bijak Bermedia Sosial',
        jenjang: 'SMP',
        summary: 'Menyusun tulisan ajakan positif lengkap fakta pendukung dan kalimat bujukan.',
        explanation: 'Mengasah kemampuan berpikir kritis remaja terhadap etika komentar dan saring informasi.',
        example: 'Setelah menganalisis contoh poster dan artikel pendek tentang etika digital, peserta didik dapat menulis teks persuasi 4 paragraf berisi argumen logis, data sederhana, dan kalimat ajakan yang santun.',
        tips: 'Pajang karya terbaik murid di mading sekolah atau grup kelas.'
      },
      {
        title: 'Bahasa Inggris SMP Fase D — Asking & Giving Opinion / Daily Routine',
        jenjang: 'SMP',
        summary: 'Berdialog singkat menyatakan pendapat sederhana dan kegiatan sehari-hari.',
        explanation: 'Fokus pada keberanian berbicara berpasangan tanpa takut salah pengucapan.',
        example: 'Melalui kegiatan bermain peran berpasangan (pair-work), peserta didik dapat menanyakan dan mengungkapkan pendapat sederhana menggunakan ungkapan "I think..." dan "In my opinion..." dengan keberanian dan pelafalan yang dapat dipahami.',
        tips: 'Latih pelafalan serempak satu kelas dulu sebelum murid berlatih berdua.'
      },
      {
        title: 'Informatika SMP/SMA — Berpikir Komputasional & Algoritma Urutan Kerja',
        jenjang: 'SMP',
        summary: 'Memecah masalah rumit menjadi langkah-langkah logis berurutan tanpa harus pakai komputer.',
        explanation: 'Bisa dijalankan dengan metode unplugged (tanpa lab komputer sekalipun).',
        example: 'Melalui studi kasus pengaturan antrean kantin atau rute tercepat ke sekolah, peserta didik mampu menerapkan dekomposisi masalah dan menuliskan urutan langkah solusi (algoritma) dalam bentuk diagram alir yang jelas.',
        tips: 'Uji diagram alir satu kelompok dengan meminta kelompok lain menjalankannya persis sesuai instruksi.'
      },
      {
        title: 'Matematika SMA Fase E — Barisan, Deret & Simulasi Tabungan/Cicilan',
        jenjang: 'SMA/SMK',
        summary: 'Menerapkan barisan aritmetika dan geometri pada perhitungan tabungan rutin dan bunga.',
        explanation: 'Menjawab pertanyaan klasik murid SMA "Rumus ini dipakai buat apa di dunia nyata?".',
        example: 'Melalui studi kasus target menabung bulanan dan simulasi pertumbuhan modal usaha, peserta didik dapat menentukan suku ke-n serta jumlah deret aritmetika/geometri untuk mengambil keputusan finansial yang tepat.',
        tips: 'Gunakan angka rupiah nyata seperti menabung Rp50.000 per minggu untuk membeli perlengkapan sekolah.'
      },
      {
        title: 'Biologi SMA Fase E — Keanekaragaman Hayati & Konservasi Tanaman Lokal',
        jenjang: 'SMA/SMK',
        summary: 'Mengklasifikasikan tingkat keanekaragaman hayati dari observasi tanaman halaman sekolah.',
        explanation: 'Memanfaatkan taman sekolah sebagai laboratorium alami tanpa biaya.',
        example: 'Melalui observasi langsung tanaman di lingkungan sekolah, peserta didik mampu membedakan keanekaragaman tingkat gen, jenis, dan ekosistem serta menyusun poster ajakan pelestarian flora lokal.',
        tips: 'Batasi area pengamatan per kelompok agar waktu keluar kelas tetap terkendali 20 menit.'
      },
      {
        title: 'Ekonomi / PKK SMA-SMK Fase F — Menghitung HPP & Titik Impas Usaha Kecil',
        jenjang: 'SMA/SMK',
        summary: 'Menyusun rincian modal produksi, harga jual per unit, dan Break Even Point (BEP).',
        explanation: 'Wajib untuk mata pelajaran Ekonomi maupun Proyek Kreatif dan Kewirausahaan (PKK) SMK.',
        example: 'Melalui perencanaan produk usaha kelompok, peserta didik mampu menghitung biaya tetap, biaya variabel, Harga Pokok Produksi (HPP), serta menentukan harga jual dan titik impas (BEP) secara tepat.',
        tips: 'Minta murid memakai harga bahan asli dari warung atau toko online agar perhitungannya realistis.'
      },
      {
        title: 'Sejarah SMA Fase E — Menelusuri Jejak Sejarah Lokal & Sumber Lisan',
        jenjang: 'SMA/SMK',
        summary: 'Memahami konsep berpikir kronologis dan verifikasi sumber sejarah di daerah sendiri.',
        explanation: 'Membuat pelajaran sejarah terasa dekat dengan asal-usul kampung, jalan, atau bangunan tua di kota murid.',
        example: 'Melalui penelusuran foto lama dan cerita tokoh masyarakat setempat, peserta didik dapat menyusun lini masa perkembangan suatu tempat bersejarah di daerahnya dengan memperhatikan kesahihan sumber.',
        tips: 'Boleh berupa sejarah berdirinya sekolah sendiri jika akses keluar sekolah terbatas.'
      },
      {
        title: 'PAI & Budi Pekerti Semua Jenjang — Kejujuran & Amanah dalam Pergaulan',
        jenjang: 'Semua Jenjang',
        summary: 'Menghubungkan nilai amanah dan jujur dengan perilaku nyata saat ujian maupun bermedia sosial.',
        explanation: 'Menitikberatkan pembiasaan akhlak sehari-hari, bukan sekadar hafalan definisi.',
        example: 'Melalui telaah kisah teladan dan diskusi dilema keseharian di sekolah, peserta didik dapat menjelaskan hikmah perilaku jujur serta menunjukkan sikap amanah dalam mengerjakan tugas dan menjaga kepercayaan teman.',
        tips: 'Hindari menghakimi murid saat diskusi; ajak mereka mencari solusi bersama atas godaan menyontek.'
      },
      {
        title: 'PJOK Semua Jenjang — Kebugaran Jasmani & Pemantauan Denyut Nadi',
        jenjang: 'Semua Jenjang',
        summary: 'Mempraktikkan latihan daya tahan sederhana dan menghitung denyut nadi sebelum-sesudah gerak.',
        explanation: 'Menggabungkan aktivitas fisik lapangan dengan kesadaran kesehatan tubuh masing-masing.',
        example: 'Setelah melakukan rangkaian sirkuit kebugaran jasmani 4 pos secara bertahap, peserta didik dapat mempraktikkan gerak pemanasan-inti-pendinginan yang aman serta mencatat perubahan denyut nadi istirahat dan latihan.',
        tips: 'Sediakan opsi intensitas ringan bagi murid yang baru pulih dari sakit.'
      }
    ]
  },
  {
    category: 'Pertanyaan Pemantik',
    wizardField: 'pertanyaanPemantik',
    items: [
      {
        title: 'Pemantik Pecahan & Pembagian Adil (SD)',
        jenjang: 'SD',
        summary: 'Memancing rasa keadilan murid lewat cerita membagi 1 martabak untuk 4 saudara.',
        explanation: 'Pertanyaan dekat keseharian yang langsung membuat murid kelas rendah-tengah berdebat seru.',
        example: '1) Kalau Ibu membawa pulang 1 loyang martabak manis untuk 4 orang di rumah, bagaimana cara memotongnya supaya tidak ada yang merasa dapat bagian lebih kecil?\n2) Lebih besar mana potongan 1 dibagi 2 atau 1 dibagi 4? Kenapa bisa begitu?',
        tips: 'Gambar lingkaran di papan tulis dan minta 2 murid maju mencoba menarik garis potongnya.'
      },
      {
        title: 'Pemantik Hemat Energi Listrik di Rumah (SD/SMP)',
        jenjang: 'SD',
        summary: 'Mengajak murid membayangkan sehari penuh tanpa listrik dan baterai HP habis.',
        explanation: 'Membangun kesadaran pentingnya energi sebelum masuk ke teori perubahan bentuk energi.',
        example: '1) Apa hal pertama yang paling bikin kalian bingung kalau tiba-tiba listrik di rumah mati seharian penuh?\n2) Alat elektronik apa di rumah kalian yang sering menyala terus padahal sedang tidak dipakai siapa-apa?',
        tips: 'Tampung semua jawaban lucu murid tanpa disalahkan untuk mencairkan suasana awal jam.'
      },
      {
        title: 'Pemantik Sampah Plastik Jajanan Sekolah (Semua Jenjang)',
        jenjang: 'Semua Jenjang',
        summary: 'Menghitung kira-kira tumpukan bungkus plastik satu sekolah dalam sebulan.',
        explanation: 'Cocok untuk pembuka materi Lingkungan Hidup, Teks Persuasi, maupun Proyek P5/Kokurikuler.',
        example: '1) Coba ingat dari pagi tadi, sudah berapa bungkus plastik atau gelas sekali pakai yang kalian buang ke tempat sampah?\n2) Kalau satu sekolah ada 300 murid dan tiap anak membuang 2 plastik sehari, kira-kira ke mana perginya ribuan sampah itu akhir bulan nanti?',
        tips: 'Tunjuk tempat sampah kelas secara nyata agar murid langsung berefleksi.'
      },
      {
        title: 'Pemantik Cuaca & Siklus Air (SD)',
        jenjang: 'SD',
        summary: 'Menanyakan ke mana hilangnya genangan air di halaman sekolah saat siang terik.',
        explanation: 'Mengubah hal biasa yang dilihat tiap hari menjadi rasa ingin tahu ilmiah.',
        example: '1) Waktu pagi habis hujan halaman sekolah basah menggenang, tapi siang hari tiba-tiba kering sendiri — kira-kira airnya pindah ke mana ya?\n2) Kenapa air laut tidak pernah habis meskipun menguap kena panas matahari setiap hari?',
        tips: 'Beri waktu 30 detik murid berbisik dengan teman sebangku sebelum tunjuk tangan.'
      },
      {
        title: 'Pemantik Literasi Keuangan: Kebutuhan vs Keinginan (SD/SMP)',
        jenjang: 'SMP',
        summary: 'Membedakan barang yang benar-benar dibutuhkan dengan yang dibeli karena ikut tren.',
        explanation: 'Sangat efektif membuka pelajaran IPS, Ekonomi, maupun Bimbingan Klasikal.',
        example: '1) Pernahkah kalian membeli sesuatu karena sedang viral di media sosial, lalu seminggu kemudian barangnya menganggur di pojok kamar?\n2) Kalau kalian diberi uang saku Rp50.000 untuk 3 hari, apa yang wajib diamankan lebih dulu sebelum beli jajanan?',
        tips: 'Jaga privasi murid; fokuskan diskusi pada cara mengatur prioritas, bukan besar uang saku.'
      },
      {
        title: 'Pemantik Gaya, Gesekan & Ban Kendaraan Gundul (SD/SMP)',
        jenjang: 'SMP',
        summary: 'Mengaitkan alur kembangan sepatu dan ban motor dengan konsep gaya gesek.',
        explanation: 'Membuat topik Fisika/IPAS langsung masuk akal dalam 2 menit pertama.',
        example: '1) Kenapa bagian bawah sepatu olahraga kalian dibuat bergaris-garis kasar, bukan licin rata seperti kaca?\n2) Apa bahayanya kalau motor dipakai saat hujan deras dengan kondisi ban yang sudah gundul halus?',
        tips: 'Minta murid melirik alas sepatu masing-masing selama 10 detik.'
      },
      {
        title: 'Pemantik Berita Bohong (Hoaks) & Judul Heboh (SMP/SMA)',
        jenjang: 'SMP',
        summary: 'Menguji reaksi pertama murid saat mendapat pesan berantai yang mengagetkan di grup WA.',
        explanation: 'Pembuka tajam untuk Bahasa Indonesia (Teks Berita/Tanggapan), Informatika, dan Pancasila.',
        example: '1) Kalau ada pesan berantai di grup keluarga bertuliskan "SEBARKAN SEGERA!", apa tanda-tanda yang bikin kalian curiga pesan itu belum tentu benar?\n2) Mengapa berita bohong sering lebih cepat menyebar dibandingkan penjelasan resminya?',
        tips: 'Tampilkan 1 contoh judul clickbait fiktif yang aman di papan tulis untuk dibedah bareng.'
      },
      {
        title: 'Pemantik Makanan Manis & Tubuh Cepat Mengantuk (SMP/SMA)',
        jenjang: 'SMP',
        summary: 'Menghubungkan sarapan/jajanan tinggi gula dengan rasa kantuk di jam pelajaran siang.',
        explanation: 'Pas untuk materi Sistem Pencernaan, Zat Aditif, atau PJOK Pola Hidup Sehat.',
        example: '1) Siapa yang habis minum es manis segar di jam istirahat merasa berenergi sebentar, tapi 30 menit kemudian malah menguap mengantuk?\n2) Sebenarnya apa yang dilakukan tubuh kita saat menerima gula dalam jumlah banyak sekaligus?',
        tips: 'Gunakan nada santai dan penuh rasa ingin tahu, bukan menceramahi jajanan murid.'
      },
      {
        title: 'Pemantik Diskon Toko Online & Persentase Matematika (SMP/SMA)',
        jenjang: 'SMP',
        summary: 'Membandingkan dua promo diskon yang sering mengecoh pembeli.',
        explanation: 'Pemicu hitung cepat yang seru untuk materi Persen dan Aritmetika Sosial.',
        example: '1) Toko A memberi diskon 50% untuk barang seharga Rp100.000, sedangkan Toko B memberi diskon "50% + 20%" untuk barang Rp120.000 — menurut kalian mana yang bayarnya lebih murah?\n2) Kenapa diskon "50% + 20%" itu hasilnya bukan diskon 70%?',
        tips: 'Tulis tebakan awal murid di pojok papan tulis, lalu buktikan jawabannya di akhir jam pelajaran.'
      },
      {
        title: 'Pemantik Aturan & Ketertiban Tanpa Pengawas (Semua Jenjang)',
        jenjang: 'Semua Jenjang',
        summary: 'Merefleksikan kenapa lampu merah tetap perlu ditaati saat jalanan sepi malam hari.',
        explanation: 'Membangun nalar moral untuk Pendidikan Pancasila dan PAI.',
        example: '1) Bayangkan perempatan jalan raya tanpa lampu lalu lintas di jam berangkat sekolah — apa yang akan terjadi dalam 5 menit pertama?\n2) Kita menaati aturan karena takut ditegur atau karena kita butuh keselamatan bersama?',
        tips: 'Ajak 2 murid yang berbeda alasan untuk menyampaikan pandangannya singkat.'
      },
      {
        title: 'Pemantik Peluang & Cuaca / Pengambilan Keputusan (SMA/SMK)',
        jenjang: 'SMA/SMK',
        summary: 'Membaca arti "Peluang Hujan 70%" di aplikasi cuaca HP.',
        explanation: 'Meluruskan miskonsepsi umum sekaligus membuka materi Peluang Matematika.',
        example: '1) Saat aplikasi cuaca di HP menulis "Peluang hujan siang ini 75%", kalian tetap bawa jas hujan atau nekat berangkat tanpa payung?\n2) Dalam hidup sehari-hari, keputusan apa lagi yang kita ambil berdasarkan perkiraan peluang?',
        tips: 'Cocok dilanjutkan dengan eksperimen lempar dua koin 20 kali.'
      },
      {
        title: 'Pemantik Komunikasi Bahasa Inggris: Takut Salah Grammar (SMP/SMA)',
        jenjang: 'SMA/SMK',
        summary: 'Meruntuhkan rasa malu bicara bahasa Inggris di depan teman.',
        explanation: 'Menurunkan kecemasan murid sebelum sesi praktik berbicara (Speaking).',
        example: '1) Kalau ada turis asing bertanya arah jalan ke kalian dengan bahasa Indonesia yang terbata-bata, apakah kalian menertawakannya atau justru senang membantunya?\n2) Lalu kenapa kita sering takut duluan saat belajar bicara bahasa Inggris?',
        tips: 'Tegaskan aturan emas kelas: tidak boleh menertawakan teman yang sedang mencoba bicara.'
      },
      {
        title: 'Pemantik Kewirausahaan: Kenapa Warung Sebelah Lebih Ramai? (SMA/SMK)',
        jenjang: 'SMA/SMK',
        summary: 'Mengamati faktor pembeda dua usaha serupa yang berdampingan.',
        explanation: 'Membuka materi Pemasaran, Ekonomi, atau PKK dengan pengamatan nyata.',
        example: '1) Pernah lihat dua penjual makanan yang menunya mirip dan harganya sama, tapi yang satu antre panjang sementara sebelahnya sepi?\n2) Selain rasa, hal kecil apa dari pelayanan atau tampilan yang bikin pembeli betah balik lagi?',
        tips: 'Catat kata kunci jawaban murid di papan: ramah, bersih, cepat, porsi jelas.'
      },
      {
        title: 'Pemantik Sejarah: Benda Paling Tua di Rumahmu (SMP/SMA)',
        jenjang: 'SMA/SMK',
        summary: 'Mengenalkan konsep sumber benda (artefak) lewat barang peninggalan kakek-nenek.',
        explanation: 'Menghubungkan sejarah keluarga kecil dengan sejarah masyarakat luas.',
        example: '1) Benda paling tua apa yang masih tersimpan di rumah kalian sampai hari ini, dan cerita apa yang pernah diceritakan orang tua tentang benda itu?\n2) Bagaimana sejarawan tahu kehidupan ratusan tahun lalu kalau tidak ada rekaman video?',
        tips: 'Sangat hangat untuk membangun kedekatan cerita antar murid di awal semester.'
      },
      {
        title: 'Pemantik Geografi / IPS: Kenapa Harga Barang di Pegunungan Berbeda? (SMP/SMA)',
        jenjang: 'SMP',
        summary: 'Menghubungkan kondisi geografis dan akses jalan dengan distribusi barang.',
        explanation: 'Melatih cara pandang keruangan dan konektivitas antarwilayah.',
        example: '1) Mengapa harga sayur kol di daerah pegunungan bisa murah sekali, sedangkan harga ikan laut segar di sana justru lebih mahal dibanding di pesisir?\n2) Apa jadinya jika jembatan penghubung dua kabupaten terputus selama seminggu?',
        tips: 'Tampilkan peta sederhana wilayah kabupaten setempat bila tersedia.'
      },
      {
        title: 'Pemantik Teks Prosedur: Resep Gagal Walau Bahan Sama (SD/SMP)',
        jenjang: 'SD',
        summary: 'Menyadari pentingnya urutan langkah dan takaran yang jelas.',
        explanation: 'Pembuka menyenangkan untuk materi Teks Prosedur Bahasa Indonesia atau Bahasa Inggris.',
        example: '1) Pernahkah kalian membuat mi instan atau minuman sendiri tapi rasanya aneh gara-gara ada langkah yang terlewat?\n2) Mengapa petunjuk di bungkus makanan harus ditulis berurutan dari nomor 1, tidak boleh diacak?',
        tips: 'Minta satu murid menyebutkan cara membuat teh manis, lalu cek apakah ada langkah yang terlupa.'
      },
      {
        title: 'Pemantik Biologi Sel & Penyembuhan Luka Gores (SMP/SMA)',
        jenjang: 'SMA/SMK',
        summary: 'Menanyakan bagaimana kulit yang tergores bisa menutup kembali sendiri dalam beberapa hari.',
        explanation: 'Membawa materi abstrak Pembelahan Sel dan Jaringan langsung ke tubuh murid sendiri.',
        example: '1) Waktu jari kalian tidak sengaja tergores kertas, tanpa dijahit pun seminggu kemudian kulitnya rapat kembali — siapa yang bekerja memperbaiki kulit itu dari dalam?\n2) Apakah sel di tubuh kita ukurannya membesar atau jumlahnya yang bertambah?',
        tips: 'Jembatani jawaban murid menuju konsep pembelahan mitosis.'
      },
      {
        title: 'Pemantik Seni & Desain: Warna yang Mengubah Suasana Hati (Semua Jenjang)',
        jenjang: 'Semua Jenjang',
        summary: 'Merasakan perbedaan kesan warna merah-oranye pada rumah makan vs hijau-biru di ruang rawat.',
        explanation: 'Cocok untuk Seni Rupa maupun Desain Komunikasi Visual.',
        example: '1) Pernah perhatikan kenapa hampir semua logo tempat makan cepat saji memakai warna merah dan kuning cerah?\n2) Kalau kamar tidur kalian dicat merah menyala seluruh dindingnya, kira-kira rasanya tenang atau malah gelisah?',
        tips: 'Bawa 3 lembar kertas warna berbeda dan tanyakan kata pertama yang terlintas di benak murid.'
      },
      {
        title: 'Pemantik Kimia / IPA: Kenapa Besi Pagar Berkarat? (SMP/SMA)',
        jenjang: 'SMA/SMK',
        summary: 'Mengamati reaksi oksidasi pada pagar besi dan potongan apel yang berubah cokelat.',
        explanation: 'Membuat reaksi kimia tidak terasa asing dan menakutkan.',
        example: '1) Kenapa buah apel yang sudah dikupas kalau dibiarkan 10 menit di meja warnanya berubah kecokelatan?\n2) Apa hubungannya peristiwa apel kecokelatan itu dengan pagar besi luar rumah yang lama-lama berkarat?',
        tips: 'Bisa bawa 1 potong apel asli di awal jam dan lihat perubahannya di akhir jam.'
      },
      {
        title: 'Pemantik Kerja Kelompok & Pembagian Peran (Semua Jenjang)',
        jenjang: 'Semua Jenjang',
        summary: 'Membahas cara kerja tim yang kompak supaya tidak cuma 1 orang yang bekerja.',
        explanation: 'Sangat ampuh ditanyakan sebelum memulai tugas proyek kelompok.',
        example: '1) Dalam tim sepak bola atau dapur rumah makan yang sibuk, apa jadinya kalau semua orang berebut mengerjakan hal yang sama?\n2) Supaya tugas kelompok hari ini selesai tepat waktu tanpa ada yang cuma menumpang nama, peran apa saja yang harus dibagi sejak menit pertama?',
        tips: 'Wajibkan setiap kelompok menulis pembagian peran (Ketua, Pencatat, Pemeriksa Waktu, Penyaji) di atas LKPD.'
      }
    ]
  },
  {
    category: 'Ice Breaking Kelas',
    wizardField: 'iceBreaking',
    items: [
      {
        title: 'Tepuk Pagi – Siang – Malam (Tanpa Alat, 3 Menit)',
        jenjang: 'Semua Jenjang',
        summary: 'Melatih kefokusan pendengaran saat jam pelajaran rawan mengantuk.',
        explanation: 'Pagi = tepuk 1x, Siang = tepuk 2x, Malam = setengah tepuk (tangan berhenti di udara tanpa suara karena orang sudah tidur!).',
        example: 'Guru memberi aba-aba acak "Pagi! Siang! Pagi! Malam!" dengan tempo makin cepat. Saat kata "Malam", kelas harus hening total tanpa bunyi tepukan.',
        tips: 'Akhiri dengan aba-aba "Malam!" agar suasana kelas langsung tenang dan siap lanjut materi.'
      },
      {
        title: 'Gajah – Semut Terbalik (Melatih Fokus Otak Kanan-Kiri)',
        jenjang: 'Semua Jenjang',
        summary: 'Gerakan tangan berkebalikan dengan ukuran hewan yang disebutkan.',
        explanation: 'Saat guru bilang "Gajah besar", tangan murid justru membentuk lingkaran kecil; saat "Semut kecil", tangan merentang lebar.',
        example: '1 putaran latihan normal dulu, lalu putaran kedua instruksi dibalik. Murid yang salah gerak diberi tantangan ringan menjawab 1 pertanyaan ulasan materi kemarin.',
        tips: 'Jangan dijadikan hukuman memalukan; buat suasana tertawa santai maksimal 4 menit.'
      },
      {
        title: 'Sambung Kata Berantai Sesuai Topik Pelajaran',
        jenjang: 'SD',
        summary: 'Menyebutkan kata yang berhubungan dengan materi hari ini secara bergilir cepat.',
        explanation: 'Sekaligus mengaktifkan kosakata awal murid tentang bab yang akan dipelajari.',
        example: 'Guru menyebut tema misalnya "Ekosistem Laut". Murid bangku depan sampai belakang bergantian dalam 3 detik menyebut 1 kata terkait tanpa boleh mengulang kata yang sudah disebut.',
        tips: 'Hitung rekor jumlah kata terbanyak yang berhasil dicapai kelas tanpa terputus.'
      },
      {
        title: 'Bos Berkata / Guru Berkata (Instruksi Selektif)',
        jenjang: 'SD',
        summary: 'Murid hanya mengikuti gerakan jika diawali kalimat "Guru berkata...".',
        explanation: 'Sangat ampuh mengembalikan perhatian murid SD yang sedang gaduh habis istirahat.',
        example: '"Guru berkata pegang telinga! Guru berkata angkat tangan kanan! Sekarang pegang hidung!" — murid yang memegang hidung berarti kurang menyimak kata kunci.',
        tips: 'Tutup dengan kalimat "Guru berkata duduk tegak dan siapkan buku catatan di meja."'
      },
      {
        title: 'Hitung Kelipatan "DOR!" (Fokus Matematika & Konsentrasi)',
        jenjang: 'SMP',
        summary: 'Berhitung berurutan namun setiap kelipatan 3 atau angka mengandung 3 diganti kata "BISA!".',
        explanation: 'Mengasah kecepatan berhitung sekaligus membangunkan energi kelas siang hari.',
        example: 'Murid berhitung berantai: 1, 2, "BISA!", 4, 5, "BISA!", 7... Untuk tingkat SMA bisa dinaikkan ke kelipatan 4 atau 7.',
        tips: 'Mulai dari barisan meja yang berbeda tiap pertemuan agar semua kebagian giliran awal.'
      },
      {
        title: 'Tebak Gaya Konsep Pelajaran 30 Detik',
        jenjang: 'SMP',
        summary: 'Satu perwakilan maju memperagakan istilah materi tanpa suara untuk ditebak kelas.',
        explanation: 'Mengubah ulasan kosakata materi sebelumnya menjadi permainan yang hidup.',
        example: 'Guru membisikkan 3 istilah materi minggu lalu (misal: Gunung Meletus, Fotosintesis, atau Musyawarah) kepada 1 relawan untuk diperagakan tanpa bicara.',
        tips: 'Pilih istilah yang memang mudah digerakkan tubuh agar cepat tertebak.'
      },
      {
        title: 'Senam Jari Otak: Tembak – Kelinci (Koordinasi Tangan)',
        jenjang: 'Semua Jenjang',
        summary: 'Tangan kiri membentuk dua jari kelinci, tangan kanan mengarah, lalu bertukar posisi.',
        explanation: 'Dapat dilakukan sambil duduk tenang tanpa membuat kelas berlarian.',
        example: 'Murid merentangkan dua tangan di depan dada dan menukar bentuk jari kiri-kanan mengikuti hitungan 1 sampai 8 sambil menarik napas teratur.',
        tips: 'Cocok dipakai di jeda tengah pelajaran blok 2–3 jam pelajaran berturut-turut.'
      },
      {
        title: 'Dua Fakta Satu Cerita Unik (Kenalan Awal Semester)',
        jenjang: 'SMA/SMK',
        summary: 'Menebak satu pernyataan karangan di antara dua fakta nyata terkait topik.',
        explanation: 'Bisa dipakai untuk perkenalan awal tahun ajaran maupun cek pemahaman fakta pelajaran.',
        example: 'Guru membacakan 3 kalimat tentang topik materi hari ini (2 fakta benar, 1 mitos keliru). Murid mengangkat 1, 2, atau 3 jari memilih mana yang keliru.',
        tips: 'Cara cepat mengecek miskonsepsi seisi kelas sekaligus dalam 2 menit!'
      },
      {
        title: 'Peregangan Bahu & Napas Kotak 4-4-4 (Sebelum Ujian/Asesmen)',
        jenjang: 'Semua Jenjang',
        summary: 'Menurunkan ketegangan murid sebelum kuis atau presentasi.',
        explanation: 'Membantu murid yang cemas menjadi lebih tenang dan fokus membaca soal.',
        example: 'Berdiri di samping kursi, putar bahu ke belakang 4 kali, lalu tarik napas 4 hitungan, tahan 4 hitungan, embuskan perlahan 4 hitungan sebanyak 3 siklus.',
        tips: 'Gunakan suara guru yang tenang dan pelan saat memandu hitungan.'
      },
      {
        title: 'Hujan Rintik ke Hujan Deras (Irama Jari & Tepuk Paha)',
        jenjang: 'SD',
        summary: 'Membuat efek suara hujan dari gesekan telapak tangan hingga reda kembali.',
        explanation: 'Transisi akustik yang indah dari suasana ramai menuju hening fokus.',
        example: 'Mulai dari menggosok telapak tangan (angin), petik jari (gerimis), tepuk paha (hujan deras), lalu turun kembali ke gerimis, angin, dan hening.',
        tips: 'Begitu tangan berhenti di posisi hening, langsung mulai kalimat pertama penjelasan inti.'
      },
      {
        title: 'Berdiri Kalau Setuju / Duduk Kalau Tidak Setuju',
        jenjang: 'SMP',
        summary: 'Jajak pendapat cepat memakai gerakan berdiri dan duduk.',
        explanation: 'Mengajak murid yang pemalu ikut berpendapat lewat gerak fisik ringan.',
        example: 'Guru melontarkan 3 pernyataan pemantik. Murid yang setuju langsung berdiri tegak, yang kurang setuju tetap duduk, lalu guru menunjuk 1 wakil tiap kubu.',
        tips: 'Pilih pernyataan yang memang punya dua sisi menarik untuk didiskusikan.'
      },
      {
        title: 'Cermin Berpasangan Sebangku (2 Menit)',
        jenjang: 'SD',
        summary: 'Teman sebangku menirukan gerakan tangan lambat pasangannya seperti bayangan cermin.',
        explanation: 'Membangun keakraban dan empati sebelum kerja berpasangan.',
        example: 'Murid A menggerakkan tangan perlahan selama 30 detik dan Murid B mengikuti persis, lalu bergantian peran.',
        tips: 'Ingatkan gerakan harus lambat agar temannya berhasil mengikuti.'
      },
      {
        title: 'Tebak Suara / Kata Kunci Mata Tertutup',
        jenjang: 'SD',
        summary: 'Melatih kepekaan menyimak instruksi lisan di kelas rendah.',
        explanation: 'Membiasakan murid mendengarkan satu sumber suara dengan tertib.',
        example: 'Murid memejamkan mata 20 detik, guru mengetuk benda di kelas (meja kayu, papan tulis, buku) dengan jumlah ketukan tertentu dan murid menebak jumlah serta asal suaranya.',
        tips: 'Sekaligus bisa menyambung ke materi Sumber Bunyi pada pelajaran IPAS.'
      },
      {
        title: 'Tiga Kata Rangkuman Cepat Sebangku',
        jenjang: 'SMA/SMK',
        summary: 'Menyimpulkan materi yang baru dibahas hanya dalam tepat 3 kata bersama teman.',
        explanation: 'Ice breaking intelektual singkat untuk SMA/SMK yang tidak suka permainan kekanak-kanakan.',
        example: 'Dalam 45 detik, tiap pasangan sebangku harus sepakat memilih tepat 3 kata paling mewakili materi barusan dan meneriakkannya saat ditunjuk.',
        tips: 'Sangat efektif menjaga kewaspadaan murid di tengah penjelasan konsep padat.'
      },
      {
        title: 'Cari Pasangan Kartu Soal – Jawaban (Mix & Match)',
        jenjang: 'Semua Jenjang',
        summary: 'Setengah kelas memegang potongan istilah, setengahnya memegang artinya, lalu mencari pasangannya.',
        explanation: 'Mengajak murid bergerak dari kursi secara terarah sambil belajar.',
        example: 'Bagikan kertas kecil acak; dalam waktu 2 menit murid berkeliling tenang mencari pasangan kartu yang cocok dan berdiri berdampingan.',
        tips: 'Pasangan yang terbentuk bisa langsung dijadikan pasangan kerja tugas berikutnya!'
      },
      {
        title: 'Ikuti yang Saya Ucapkan, Bukan yang Saya Pegang',
        jenjang: 'SMP',
        summary: 'Guru menyebut anggota tubuh tetapi sengaja memegang bagian yang berbeda.',
        explanation: 'Menguji konsentrasi menyimak instruksi lisan dibanding distraksi visual.',
        example: 'Guru mengucap "Pegang dagu!" sambil tangan guru sengaja memegang dahi. Murid harus fokus mengikuti ucapan suara guru.',
        tips: 'Cukup 4–5 putaran cepat agar waktu belajar inti tetap utuh.'
      },
      {
        title: 'Kuis Kilat Jempol Atas – Jempol Bawah (Benar/Salah)',
        jenjang: 'Semua Jenjang',
        summary: 'Cek pemahaman kilat seluruh kelas tanpa kertas.',
        explanation: 'Semua murid berpartisipasi serentak hanya dengan isyarat ibu jari di depan dada.',
        example: 'Guru membacakan 4 kalimat pernyataan terkait materi. Hitungan "1-2-3!", seluruh murid menunjukkan jempol ke atas (Benar) atau ke bawah (Salah).',
        tips: 'Minta murid mengangkat jempol di depan dada sendiri supaya tidak mencontek tengok kiri-kanan.'
      },
      {
        title: 'Bentuk Kelompok Sesuai Jumlah Hitungan Angka',
        jenjang: 'SD',
        summary: 'Membagi kelompok secara acak dan adil lewat permainan berhitung.',
        explanation: 'Menghindari drama murid hanya mau berkelompok dengan sahabat dekatnya terus-menerus.',
        example: 'Murid berdiri di ruang tengah/samping, guru menyebut operasi hitung sederhana "6 dikurangi 2!", murid segera berkumpul tepat berempat.',
        tips: 'Jika ada sisa murid yang belum dapat kelompok, jadikan tim pengamat kehormatan atau gabungkan merata.'
      },
      {
        title: 'Lanjutkan Cerita Satu Kalimat (Kreativitas Bahasa)',
        jenjang: 'SMP',
        summary: 'Menyusun cerita singkat bersama-sama dari satu kalimat pembuka guru.',
        explanation: 'Sangat cocok untuk pelajaran Bahasa Indonesia, Bahasa Inggris, atau Seni Peran.',
        example: 'Guru memulai: "Pagi itu saat membuka tas di sekolah, Budi terkejut melihat..." lalu menunjuk 5 murid secara acak melanjutkan masing-masing 1 kalimat.',
        tips: 'Arahkan kalimat terakhir agar nyambung ke topik bacaan hari itu.'
      },
      {
        title: 'Apresiasi Tepuk "Mantap Sekali!" untuk Penyaji',
        jenjang: 'Semua Jenjang',
        summary: 'Tepuk kompak 5 ketukan penyemangat seusai teman selesai presentasi di depan kelas.',
        explanation: 'Membangun budaya kelas yang saling menghargai keberanian teman.',
        example: 'Prok-prok-prok (kanan), prok-prok-prok (kiri), dua jempol ke depan sambil serempak mengucap "Keren, terima kasih!".',
        tips: 'Gunakan konsisten sepanjang semester setiap kali ada kelompok yang selesai tampil.'
      }
    ]
  },
  {
    category: 'Kegiatan Inti & Model',
    wizardField: 'kegiatanInti',
    items: [
      {
        title: 'Problem Based Learning (PBL) — 5 Sintaks Lengkap',
        jenjang: 'Semua Jenjang',
        summary: 'Pembelajaran berbasis pemecahan masalah nyata dari orientasi kasus hingga evaluasi solusi.',
        explanation: 'Model andalan Kurikulum Merdeka untuk melatih bernalar kritis dan gotong royong.',
        example: '1) Orientasi Masalah: Guru menampilkan kasus nyata terkait topik dan memantik tanya jawab.\n2) Mengorganisasi Murid: Murid duduk berkelompok 4–5 orang dan membagi tugas pada LKPD.\n3) Membimbing Penyelidikan: Kelompok mengumpulkan informasi dari buku/sumber belajar untuk menguji solusi.\n4) Mengembangkan & Menyajikan Hasil: Perwakilan kelompok mempresentasikan solusi dan ditanggapi kelompok lain.\n5) Analisis & Evaluasi: Guru bersama murid meluruskan konsep dan menyimpulkan solusi terbaik.',
        tips: 'Pilih masalah yang tidak bisa dijawab hanya dengan menyalin 1 kalimat dari buku paket.'
      },
      {
        title: 'Project Based Learning (PjBL) — Karya Nyata 1–2 Pertemuan',
        jenjang: 'Semua Jenjang',
        summary: 'Menghasilkan produk nyata (poster, prototipe, laporan, media) secara terjadwal.',
        explanation: 'Membuat murid merasa memiliki tujuan jelas dari awal sampai pameran hasil karya.',
        example: '1) Pertanyaan Mendasar: Menyepakati tantangan pembuatan karya yang bermanfaat.\n2) Desain Perencanaan Proyek: Kelompok menyusun sketsa rancangan serta daftar alat-bahan.\n3) Menyusun Jadwal: Menyepakati batas waktu tiap tahap pengerjaan di kelas.\n4) Memantau Kemajuan Proyek: Murid berkarya aktif sementara guru berkeliling memberi umpan balik.\n5) Menguji Hasil & Refleksi: Pameran karya di meja kelompok dan evaluasi pengalaman kerja.',
        tips: 'Gunakan bahan sederhana yang murah dan mudah dibawa murid agar tidak membebani biaya orang tua.'
      },
      {
        title: 'Discovery Learning — Menemukan Konsep Sendiri dari Pola/Contoh',
        jenjang: 'Semua Jenjang',
        summary: 'Murid mengamati contoh lebih dulu, lalu menyimpulkan rumus atau aturannya sendiri.',
        explanation: 'Konsep yang ditemukan sendiri jauh lebih awet diingat daripada langsung didikte rumusnya di awal.',
        example: '1) Pemberian Rangsangan (Stimulation): Mengamati 3 contoh fenomena/pola menarik.\n2) Identifikasi Masalah: Merumuskan pertanyaan "Mengapa polanya selalu begitu?".\n3) Pengumpulan Data: Mencoba sendiri pada lembar kerja terbimbing.\n4) Pengolahan Data & Pembuktian: Membandingkan temuan kelompok dengan konsep di buku.\n5) Menarik Simpulan: Menuliskan kesimpulan dengan bahasa murid sendiri.',
        tips: 'Tahan diri untuk tidak langsung membocorkan rumus sebelum kelompok selesai mencoba.'
      },
      {
        title: 'Think – Pair – Share (Berpikir Mandiri, Berpasangan, Berbagi)',
        jenjang: 'Semua Jenjang',
        summary: 'Metode sederhana tanpa pindah meja jauh yang menjamin 100% murid ikut berpikir.',
        explanation: 'Cocok untuk ruang kelas sempit yang sulit menggeser bangku berkelompok besar.',
        example: '1) Think (3 menit): Setiap murid memikirkan dan menulis jawaban singkat secara mandiri di bukunya.\n2) Pair (5 menit): Berdiskusi dengan teman sebangku untuk menggabungkan atau mempertajam jawaban.\n3) Share (10 menit): Beberapa pasangan memaparkan hasil diskusinya kepada seluruh kelas dan disimpulkan bersama.',
        tips: 'Tahap hening mandiri 3 menit di awal sangat penting agar murid pendiam punya modal bicara.'
      },
      {
        title: 'Pembelajaran Berdiferensiasi Konten (Teks, Gambar/Bagan, Peraga)',
        jenjang: 'Semua Jenjang',
        summary: 'Menyediakan 2–3 ragam sumber belajar sesuai kesiapan dan gaya tangkap murid.',
        explanation: 'Penerapan diferensiasi yang realistis tanpa harus membuat 30 rencana ajar berbeda.',
        example: '1) Guru menyiapkan materi inti dalam 3 pojok sumber: ringkasan bacaan bergambar, bagan alur langkah, dan benda/contoh konkret.\n2) Murid mempelajari konsep dari sumber yang paling membantunya paham, lalu kembali ke kelompok campuran untuk saling menjelaskan.\n3) Seluruh murid mengerjakan tantangan pemahaman inti yang setara dengan pendampingan bertahap dari guru.',
        tips: 'Beri pendampingan lebih dekat (scaffolding) pada meja murid yang masih butuh bimbingan dasar.'
      },
      {
        title: 'Pembelajaran Berdiferensiasi Produk (Pilihan Bentuk Tugas Akhir)',
        jenjang: 'Semua Jenjang',
        summary: 'Tujuan belajar tetap sama, namun murid bebas memilih wujud karyanya.',
        explanation: 'Meningkatkan semangat murid karena mereka mengekspresikan pemahaman lewat kekuatan terbaiknya.',
        example: '1) Setelah memahami konsep inti materi, guru menjelaskan 1 rubrik kriteria ketercapaian yang sama.\n2) Murid memilih bentuk sajian tugas: menulis esai/cerita singkat, menggambar peta konsep/komik 4 panel, atau memaparkan secara lisan 2 menit.\n3) Pengumpulan dan apresiasi lintas bentuk karya di depan kelas.',
        tips: 'Pastikan rubrik menilai ketepatan isi konsepnya, bukan kemewahan hiasan gambarnya.'
      },
      {
        title: 'Gallery Walk (Belanja Ilmu Keliling Meja Kelompok)',
        jenjang: 'SMP',
        summary: 'Karya kelompok ditempel di dinding/meja, kelompok lain berkeliling memberi catatan apresiasi.',
        explanation: 'Mengubah sesi presentasi yang membosankan menjadi pameran aktif di mana semua murid bergerak.',
        example: '1) Tiap kelompok menuliskan hasil analisis di kertas plano/HVS dan menempelkannya di dinding.\n2) Satu anggota berjaga sebagai tuan rumah penjelas, sementara anggota lain berkeliling mengunjungi pos kelompok teman.\n3) Pengunjung menempelkan kertas catatan berisi 1 pujian dan 1 pertanyaan/masukan, lalu kembali ke kelompok asal untuk merangkum.',
        tips: 'Gunakan tepuk tangan atau bel tiap 3 menit sebagai tanda geser ke pos berikutnya.'
      },
      {
        title: 'Jigsaw (Kelompok Asal & Kelompok Ahli)',
        jenjang: 'SMP',
        summary: 'Membagi materi panjang menjadi 4 sub-bab agar tiap anggota kelompok menjadi ahli.',
        explanation: 'Setiap murid punya tanggung jawab nyata karena kelompok asalnya bergantung pada penjelasannya.',
        example: '1) Murid duduk di Kelompok Asal (beranggotakan 4 orang bernomor 1–4).\n2) Anggota bernomor sama berkumpul di Kelompok Ahli untuk mendalami 1 sub-materi khusus sampai benar-benar paham.\n3) Para ahli kembali ke Kelompok Asal dan bergantian mengajarkan sub-materinya kepada ketiga temannya.',
        tips: 'Berikan lembar poin kunci singkat di Kelompok Ahli agar yang dibawa pulang ke kelompok asal akurat.'
      },
      {
        title: 'Praktikum / Eksperimen Sederhana Berbasis Pengamatan',
        jenjang: 'SD',
        summary: 'Dugaan awal (hipotesis) → uji coba alat sederhana → catat tabel pengamatan → simpulan.',
        explanation: 'Menumbuhkan sikap ilmiah jujur mencatat apa yang benar-benar terjadi.',
        example: '1) Guru memperagakan prosedur keselamatan kerja dan membagikan lembar tabel pengamatan.\n2) Murid menuliskan dugaan awal sebelum mencoba.\n3) Kelompok melakukan percobaan langkah demi langkah dan mencatat perubahan yang teramati.\n4) Membandingkan dugaan awal dengan hasil nyata serta menarik simpulan ilmiah.',
        tips: 'Selalu uji coba alat oleh guru 1 hari sebelumnya agar tidak macet di tengah jam.'
      },
      {
        title: 'Bermain Peran / Simulasi Situasi Nyata (Role Play)',
        jenjang: 'Semua Jenjang',
        summary: 'Memerankan tokoh atau situasi sosial/pekerjaan untuk menghayati materi secara hidup.',
        explanation: 'Sangat cocok untuk Bahasa, IPS, Pendidikan Pancasila, Sejarah, dan Layanan Pelanggan SMK.',
        example: '1) Guru membagikan kartu skenario situasi dan peran masing-masing anggota.\n2) Kelompok berlatih singkat selama 7 menit menyusun dialog dan tindakan penyelesaian.\n3) Penampilan simulasi di depan kelas (3 menit per tim) diikuti refleksi makna dari kejadian yang diperankan.',
        tips: 'Fokuskan evaluasi pada ketepatan isi pesan dan sikap, bukan bakat akting.'
      },
      {
        title: 'Tutor Sebaya Terstruktur (Peer Teaching)',
        jenjang: 'SMP',
        summary: 'Murid yang sudah mahir mendampingi teman kelompoknya menyelesaikan latihan bertingkat.',
        explanation: 'Sering kali penjelasan bahasa teman sebaya lebih cepat nyambung bagi murid yang malu bertanya ke guru.',
        example: '1) Guru memberi penjelasan konsep dasar dan mengecek pemahaman cepat 2 soal awal.\n2) Murid yang tuntas lebih dulu ditetapkan sebagai pendamping meja bagi 2–3 rekannya.\n3) Pendamping membantu menjelaskan cara pengerjaan (bukan memberi jawaban jadi), sementara guru memantau dan menangani kesulitan khusus.',
        tips: 'Beri pengarahan tegas pada tutor sebaya: dilarang menuliskan jawaban di buku teman.'
      },
      {
        title: 'Pembelajaran Kontekstual Luar Kelas (Observasi Lingkungan Sekolah)',
        jenjang: 'SD',
        summary: 'Keluar ruang kelas 20 menit mengamati objek nyata di halaman/kantin/perpustakaan.',
        explanation: 'Menyegarkan suasana belajar tanpa perlu biaya karyawisata keluar sekolah.',
        example: '1) Di dalam kelas guru menjelaskan target pengamatan, batas area, dan batas waktu 20 menit.\n2) Murid berkelompok membawa papan jalan/buku mencatat data nyata di lingkungan sekolah.\n3) Kembali ke kelas tepat waktu untuk mengolah temuan lapangan dan menyajikannya.',
        tips: 'Pastikan kelompok tidak mengganggu kelas lain yang sedang belajar tenang.'
      },
      {
        title: 'Studi Kasus Berita & Debat Santun Dua Sudut Pandang',
        jenjang: 'SMA/SMK',
        summary: 'Menganalisis kliping artikel aktual dan melatih adu argumen berbasis bukti dengan sopan.',
        explanation: 'Mengasah kemampuan berpikir tingkat tinggi (HOTS) untuk jenjang SMA/SMK.',
        example: '1) Murid membaca 1 artikel kasus nyata dan menandai fakta utama serta masalah pokok.\n2) Kelas dibagi menjadi tim pendukung solusi A, tim pendukung solusi B, dan tim penilai netral.\n3) Penyampaian argumen bergilir memakai data dan bahasa santun tanpa memotong pembicaraan.\n4) Sintesis jalan tengah terbaik bersama guru.',
        tips: 'Wajibkan kalimat pembuka "Kami menghargai poin tim lawan, namun berdasarkan data...".'
      },
      {
        title: 'Latihan Bertingkat (Tangga Level Dasar – Menengah – Tantangan)',
        jenjang: 'Semua Jenjang',
        summary: 'Menyediakan latihan 3 level kesulitan agar murid lambat tidak putus asa dan murid cepat tertantang.',
        explanation: 'Diferensiasi proses yang sangat cocok untuk Matematika, Fisika, Kimia, dan Akuntansi.',
        example: '1) Guru mencontohkan penyelesaian konsep dasar secara runtut di papan tulis.\n2) Murid mulai mengerjakan Pos Level 1 (Dasar). Setelah dicek benar, lanjut ke Pos Level 2 (Penerapan Cerita), dan Pos Level 3 (Soal Tantangan).\n3) Pembahasan bersama soal yang paling banyak ditanyakan murid.',
        tips: 'Target minimal seluruh kelas adalah tuntas Level 2; Level 3 memberi apresiasi pengayaan.'
      },
      {
        title: 'Membaca Terbimbing & Peta Pikiran (Mind Mapping)',
        jenjang: 'SD',
        summary: 'Mengubah bacaan panjang menjadi cabang peta pikiran berwarna yang mudah diingat.',
        explanation: 'Melatih keterampilan literasi menemukan gagasan pokok tanpa menyalin ulang buku.',
        example: '1) Murid membaca teks secara senyap sambil menggarisbawahi kata kunci penting tiap paragraf.\n2) Bersama kelompok, murid meletakkan topik utama di tengah kertas dan menarik cabang subtopik beserta contohnya.\n3) Saling menukarkan peta pikiran antar meja untuk dicek kelengkapannya.',
        tips: 'Batasi tiap cabang hanya berisi kata kunci 1–3 kata, bukan kalimat panjang.'
      },
      {
        title: 'Demonstrasi Langsung & Praktik Terbimbing (I Do – We Do – You Do)',
        jenjang: 'Semua Jenjang',
        summary: 'Guru mencontohkan utuh, mengerjakan bersama-sama, lalu murid mandiri.',
        explanation: 'Paling efektif untuk keterampilan teknis, olahraga, seni, komputer, bengkel SMK, dan menulis.',
        example: '1) I Do: Guru memperagakan langkah kerja dari awal sampai jadi sambil menjelaskan alasan tiap langkah.\n2) We Do: Guru dan murid mempraktikkan langkah kedua secara bersama-sama sambil tanya jawab.\n3) You Do: Murid mempraktikkan secara mandiri dengan daftar tilik langkah kerja di mejanya.',
        tips: 'Jangan melompat ke tugas mandiri sebelum mayoritas kelas berhasil di tahap latihan bersama.'
      },
      {
        title: 'Stasiun Belajar Berputar (4 Pos Aktivitas 10 Menitan)',
        jenjang: 'SD',
        summary: 'Ruang kelas dibagi 4 pos tugas pendek berbeda yang dikunjungi bergilir.',
        explanation: 'Menjaga energi murid tetap tinggi karena aktivitas berganti setiap 10–12 menit.',
        example: 'Pos 1: Membaca kartu kasus singkat.\nPos 2: Mengamati gambar/peraga dan menjawab 2 pertanyaan.\nPos 3: Menyusun kartu urutan konsep.\nPos 4: Menulis simpulan kelompok. Tiap 10 menit kelompok berpindah searah jarum jam hingga tuntas semua pos.',
        tips: 'Siapkan instruksi tertulis singkat dan jelas di tiap meja pos.'
      },
      {
        title: 'Inkuiri Terbimbing — Menguji Pertanyaan Sendiri',
        jenjang: 'SMA/SMK',
        summary: 'Murid merumuskan pertanyaan penyelidikan, mengumpulkan bukti, dan mempertahankan argumen.',
        explanation: 'Mengembangkan kemandirian akademik murid fase E dan F.',
        example: '1) Menyajikan fenomena pemicu yang menimbulkan teka-teki ilmiah/sosial.\n2) Murid merumuskan pertanyaan fokus dan variabel yang ingin ditelusuri.\n3) Mengumpulkan data dari tabel statistik, literatur, atau pengamatan.\n4) Menyusun klaim disertai bukti dan alasan logis (Claim – Evidence – Reasoning).',
        tips: 'Latih murid membedakan mana bukti data nyata dan mana sekadar asumsi pribadi.'
      },
      {
        title: 'Lokakarya Menulis Bertahap (Kerangka → Draf → Sunting Sebaya)',
        jenjang: 'SMP',
        summary: 'Menulis karya tidak langsung jadi sekaligus, melainkan melalui umpan balik teman.',
        explanation: 'Mengurangi beban murid yang sering bingung harus mulai menulis dari kalimat apa.',
        example: '1) Menyusun kerangka ide pokok (10 menit).\n2) Mengembangkan draf tulisan pertama tanpa takut salah dulu (20 menit).\n3) Tukar draf dengan teman sebangku menggunakan daftar cek ejaan dan kejelasan isi (10 menit).\n4) Merapikan tulisan akhir berdasarkan masukan teman.',
        tips: 'Ajarkan cara memberi komentar sopan: sebutkan 1 bagian yang sudah bagus sebelum memberi saran perbaikan.'
      },
      {
        title: 'Refleksi Kritis Studi Video / Gambar Dokumenter Pendek',
        jenjang: 'Semua Jenjang',
        summary: 'Menyimak tayangan/seri gambar 3–5 menit dengan lembar panduan amatan terfokus.',
        explanation: 'Mencegah murid menonton secara pasif tanpa menangkap inti pelajaran.',
        example: '1) Sebelum tayangan/gambar dibuka, murid membaca 3 pertanyaan fokus yang harus ditemukan jawabannya.\n2) Menyimak media dengan tenang sambil mencatat poin penting.\n3) Diskusi kelompok mengaitkan isi tayangan dengan konsep materi dan kehidupan sekitar.',
        tips: 'Potong tayangan maksimal 4–5 menit saja agar sisa waktu dipakai murid berdiskusi aktif.'
      }
    ]
  },
  {
    category: 'Asesmen & LKPD',
    wizardField: 'asesmen',
    items: [
      {
        title: 'Asesmen Awal (Diagnostik Kognitif) 3 Soal Prasyarat Cepat',
        jenjang: 'Semua Jenjang',
        summary: 'Mengecek kesiapan materi dasar murid di 5 menit awal bab baru.',
        explanation: 'Digunakan untuk memetakan siapa yang siap lanjut cepat dan siapa yang perlu penguatan dasar, bukan untuk nilai rapor.',
        example: 'Instrumen: 3 soal singkat di kertas kecil/papan (1 soal materi kelas sebelumnya, 1 soal konsep dasar hari ini, 1 soal penerapan). Pemetaan: Paham Utuh (benar 3), Paham Sebagian (benar 1–2), Perlu Pendampingan Awal (benar 0).',
        tips: 'Koreksi cepat bersama di awal sehingga guru langsung tahu bagian mana yang harus ditekankan.'
      },
      {
        title: 'Tiket Keluar Kelas (Exit Ticket) 3-2-1 di Akhir Pelajaran',
        jenjang: 'Semua Jenjang',
        summary: 'Asesmen formatif 3 menit terakhir untuk mengukur daya serap nyata hari itu.',
        explanation: 'Membantu guru merencanakan apakah pertemuan besok bisa lanjut atau perlu ulasan 10 menit.',
        example: 'Di secarik kertas kecil sebelum keluar kelas, murid menuliskan:\n- 3 hal baru yang saya pahami hari ini\n- 2 contoh penerapannya\n- 1 bagian yang masih ingin saya tanyakan.',
        tips: 'Baca tumpukan kertas yang ada pertanyaannya saja; cukup butuh 5 menit di ruang guru!'
      },
      {
        title: 'Rubrik Penilaian Diskusi & Gotong Royong 4 Skala',
        jenjang: 'Semua Jenjang',
        summary: 'Lembar ceklis observasi keaktifan, kerja sama, dan sikap menghargai teman.',
        explanation: 'Praktis dibawa guru berkeliling meja saat kegiatan kelompok berlangsung.',
        example: 'Aspek Dinilai: (1) Kontribusi ide dalam kelompok, (2) Menyimak pendapat teman tanpa memotong, (3) Tanggung jawab menyelesaikan bagian tugas. Skala: 4 = Sangat Konsisten, 3 = Berkembang Sesuai Harapan, 2 = Mulai Terlihat, 1 = Perlu Bimbingan.',
        tips: 'Fokus mengamati 3–4 kelompok per pertemuan secara bergilir agar pengamatan benar-benar akurat.'
      },
      {
        title: 'Rubrik Presentasi Lisan & Kejelasan Penyampaian',
        jenjang: 'SMP',
        summary: 'Menilai ketepatan konsep, runtut penjelasan, kontak mata, dan kemampuan menjawab.',
        explanation: 'Membuat penilaian tampil di depan kelas objektif dan transparan bagi murid.',
        example: 'Kriteria Presentasi:\n1) Ketepatan Isi Materi (40%): Konsep akurat dan disertai contoh.\n2) Sistematika Bahasa (30%): Kalimat runtut, suara jelas terdengar sampai belakang.\n3) Kerja Sama & Tanya Jawab (30%): Anggota berbagi peran adil dan menanggapi pertanyaan dengan santun.',
        tips: 'Bacakan kriteria ini sebelum kelompok maju supaya murid tahu apa yang diharapkan.'
      },
      {
        title: 'Rubrik Penilaian Produk / Poster / Peta Konsep',
        jenjang: 'Semua Jenjang',
        summary: 'Menilai karya visual murid dengan porsi utama tetap pada kebenaran isi materi.',
        explanation: 'Menghindari kesalahan menilai poster bagus gambarnya padahal konsepnya keliru.',
        example: 'Kriteria Karya:\n1) Kelengkapan & Kebenaran Konsep (50%)\n2) Kejelasan Pesan & Keterbacaan Informasi (30%)\n3) Kreativitas Tata Letak & Kerapian Waktu Kumpul (20%).',
        tips: 'Izinkan murid menggunakan pensil warna sederhana atau tulisan tangan rapi tanpa harus cetak mahal.'
      },
      {
        title: 'Template Struktur LKPD Penyelidikan Kelompok 1 Halaman',
        jenjang: 'Semua Jenjang',
        summary: 'Kerangka Lembar Kerja Peserta Didik hemat kertas yang padat dan jelas langkahnya.',
        explanation: 'Cukup 1 halaman bolak-balik per kelompok namun memandu proses berpikir utuh.',
        example: 'Struktur LKPD:\n- Identitas Kelompok & Pembagian Peran Anggota\n- Tujuan Kegiatan (1 kalimat jelas)\n- Kasus / Pengamatan Pemicu\n- Tabel Data / Pertanyaan Diskusi Bertahap (3 pertanyaan menanjak)\n- Kotak Simpulan Kelompok.',
        tips: 'Susun pertanyaan nomor 1 mudah (mengamati), nomor 2 menghubungkan, nomor 3 menyimpulkan.'
      },
      {
        title: 'Asesmen Sumatif Lingkup Materi (Uraian Kontekstual 5 Soal)',
        jenjang: 'SMP',
        summary: 'Format soal akhir bab berbasis cerita keseharian lengkap pedoman penskoran.',
        explanation: 'Mengukur pemahaman konsep utuh, bukan sekadar tebak pilihan ganda.',
        example: 'Komposisi 5 Soal Uraian:\n- Soal 1–2: Pemahaman konsep dasar & istilah (skor @15)\n- Soal 3–4: Penerapan konsep pada kasus sehari-hari (skor @20)\n- Soal 5: Analisis masalah & pemilihan solusi disertai alasan (skor 30). Total Skor = 100.',
        tips: 'Tulis rincian skor parsial agar murid yang caranya benar namun selip hitung akhir tetap dihargai prosesnya.'
      },
      {
        title: 'Penilaian Antar-Teman (Peer Assessment) Kontribusi Kelompok',
        jenjang: 'SMA/SMK',
        summary: 'Mencegah anggota kelompok menumpang nama pada proyek jangka panjang.',
        explanation: 'Melatih kejujuran dan tanggung jawab murid SMA/SMK dalam tim kerja.',
        example: 'Setiap anggota menilai rekan satu timnya (skala 1–4) pada 3 butir: (1) Hadir & ikut mengerjakan bagiannya, (2) Mengumpulkan tugas tepat kesepakatan tim, (3) Membantu teman saat ada kendala.',
        tips: 'Hasil penilaian teman bersifat rahasia untuk pertimbangan guru, bukan diumumkan terbuka.'
      },
      {
        title: 'Lembar Refleksi Diri Murid Akhir Bab (Metakognisi)',
        jenjang: 'Semua Jenjang',
        summary: 'Murid menilai sendiri bagian yang sudah dikuasai dan cara belajarnya yang paling cocok.',
        explanation: 'Inti dari pembelajar sepanjang hayat dalam Kurikulum Merdeka.',
        example: 'Daftar Cek Mandiri Murid:\n[ ] Saya sudah bisa menjelaskan kembali materi ini dengan kata-kata sendiri.\n[ ] Bagian yang paling menantang buat saya adalah: ....\n[ ] Usaha yang akan saya lakukan agar lebih paham: ....',
        tips: 'Beri apresiasi pada murid yang jujur mengakui bagian yang belum dipahaminya.'
      },
      {
        title: 'Lembar Refleksi Guru Seusai Mengajar',
        jenjang: 'Semua Jenjang',
        summary: '4 pertanyaan evaluasi cepat bagi guru untuk perbaikan pertemuan berikutnya.',
        explanation: 'Bagian kelengkapan wajib di bagian penutup Modul Ajar.',
        example: 'Refleksi Pendidik:\n1) Apakah seluruh tahapan kegiatan terlaksana sesuai alokasi waktu?\n2) Bagian kegiatan mana yang membuat peserta didik paling antusias?\n3) Siapa peserta didik yang masih memerlukan pendampingan khusus pada pertemuan berikutnya?\n4) Apa satu hal yang perlu diperbaiki pada strategi mengajar hari ini?',
        tips: 'Isi langsung dalam 2 menit sebelum meninggalkan kelas selagi ingatan masih segar.'
      },
      {
        title: 'Program Remedial Terfokus (Bukan Sekadar Ulang Soal Sama)',
        jenjang: 'Semua Jenjang',
        summary: 'Pendampingan ulang pada indikator spesifik yang belum tuntas baru diuji kembali.',
        explanation: 'Sesuai prinsip asesmen Kurikulum Merdeka: remedial memperbaiki pemahaman dulu, baru mengetes.',
        example: 'Tahapan Remedial:\n1) Mengelompokkan murid berdasarkan nomor tujuan pembelajaran yang belum tercapai.\n2) Bimbingan kelompok kecil / tutor sebaya menggunakan contoh yang lebih sederhana pada bagian tersebut.\n3) Pengerjaan ulang 2–3 soal setara khusus pada indikator yang belum tuntas.',
        tips: 'Tidak perlu mengulang seluruh soal dari awal jika murid hanya kesulitan di 1 sub-materi.'
      },
      {
        title: 'Program Pengayaan Tantangan Kontekstual',
        jenjang: 'Semua Jenjang',
        summary: 'Aktivitas lanjutan bermakna bagi murid yang sudah melampaui target lebih cepat.',
        explanation: 'Menjaga murid cepat tetap tertantang tanpa membebani dengan tumpukan PR tambahan.',
        example: 'Bentuk Pengayaan:\nMurid yang telah mencapai kriteria ketercapaian tinggi diberikan studi kasus tingkat lanjut / artikel pengayaan singkat atau peran sebagai pendamping sebaya (mentor meja) bagi rekannya.',
        tips: 'Pastikan pengayaan terasa sebagai penghargaan menarik, bukan hukuman karena cepat selesai.'
      },
      {
        title: 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) Deskripsi Interval',
        jenjang: 'Semua Jenjang',
        summary: 'Pengganti KKM angka kaku menjadi rentang tindak lanjut pembinaan yang jelas.',
        explanation: 'Memudahkan guru menentukan kapan murid siap lanjut dan kapan butuh intervensi.',
        example: 'Interval KKTP:\n- 0% – 40% (Belum Mencapai): Remedial di seluruh bagian inti dengan pendampingan langsung.\n- 41% – 69% (Belum Mencapai Ketuntasan Penuh): Remedial khusus pada bagian indikator yang masih keliru.\n- 70% – 85% (Sudah Mencapai): Lanjut materi berikutnya.\n- 86% – 100% (Melampaui): Diberikan tantangan pengayaan.',
        tips: 'Rentang persentase bebas disesuaikan dengan kesepakatan kurikulum satuan pendidikan masing-masing.'
      },
      {
        title: 'Rubrik Praktikum / Unjuk Kerja Bengkel & Laboratorium',
        jenjang: 'SMA/SMK',
        summary: 'Menilai persiapan K3, ketepatan prosedur alat, hasil kerja, dan kebersihan akhir.',
        explanation: 'Wajib untuk mata pelajaran IPA praktikum, PJOK, Seni, dan Kejuruan SMK.',
        example: 'Aspek Unjuk Kerja:\n1) Persiapan & Keselamatan Kerja (20%)\n2) Ketepatan Langkah Penggunaan Alat (40%)\n3) Akurasi Hasil / Produk Kerja (25%)\n4) Pengembalian & Kebersihan Area Kerja (15%).',
        tips: 'Poin kebersihan akhir efektif mendisiplinkan murid merapikan meja praktik tanpa disuruh berulang.'
      },
      {
        title: 'Rubrik Menulis Karangan / Laporan Bahasa',
        jenjang: 'SD',
        summary: 'Menilai kesesuaian isi, keruntutan gagasan, kosakata, serta penggunaan huruf kapital & titik.',
        explanation: 'Memudahkan guru memberi umpan balik jelas bagian mana dari tulisan murid yang perlu diperbaiki.',
        example: 'Kriteria Menulis:\n1) Kesesuaian isi dengan topik (35%)\n2) Keruntutan awal–tengah–akhir cerita/gagasan (30%)\n3) Pilihan kata yang tepat (20%)\n4) Kerapian huruf kapital & tanda baca dasar (15%).',
        tips: 'Gunakan tinta hijau atau biru saat memberi catatan penyemangat di buku tulis murid.'
      },
      {
        title: 'Jurnal Catatan Anekdot Sikap Harian Guru',
        jenjang: 'SD',
        summary: 'Mencatat kejadian perilaku menonjol (sangat baik atau perlu bimbingan) secara singkat.',
        explanation: 'Lebih realistis daripada mengisi puluhan kolom angka sikap untuk setiap murid tiap hari.',
        example: 'Format Jurnal: Tanggal | Nama Murid | Kejadian Nyata yang Teramati (misal: berinisiatif merapikan alat peraga teman yang jatuh / perlu diingatkan mengantre) | Tindak Lanjut Pembinaan.',
        tips: 'Murid yang tidak tercatat kejadian khusus diasumsikan berkembang baik sesuai harapan.'
      },
      {
        title: 'Daftar Cek (Checklist) Ketercapaian Membaca/Berbicara',
        jenjang: 'SD',
        summary: 'Instrumen cepat Ya/Belum untuk keterampilan lisan individu.',
        explanation: 'Sangat cepat diisi saat murid maju membaca atau berdialog satu per satu.',
        example: 'Indikator Ceklis:\n[ ] Suara terdengar jelas oleh kelas\n[ ] Pelafalan kata tepat tanpa terburu-buru\n[ ] Berani menatap pendengar\n[ ] Mampu menjawab 1 pertanyaan tentang isi yang dibaca.',
        tips: 'Beri kesempatan kedua di hari lain bagi murid yang hari itu sedang grogi.'
      },
      {
        title: 'Portofolio Karya Terbaik Semester',
        jenjang: 'Semua Jenjang',
        summary: 'Kumpulan 3–4 karya terpilih murid sepanjang semester untuk bahan pembagian rapor.',
        explanation: 'Bukti autentik perkembangan belajar murid saat diskusi dengan orang tua.',
        example: 'Map Portofolio Murid memuat: 1 LKPD terbaik awal semester, 1 karya proyek tengah semester, 1 hasil perbaikan tulisan/latihan, dan komentar kebanggaan murid sendiri atas kemajuannya.',
        tips: 'Gunakan map plastik/kertas sederhana yang disimpan di lemari sudut kelas.'
      },
      {
        title: 'Kuis Lisan Berantai Pemerataan Kelas',
        jenjang: 'Semua Jenjang',
        summary: 'Teknik tanya jawab acak memakai stik nama agar bukan itu-itu saja yang menjawab.',
        explanation: 'Menghilangkan dominasi 3–4 murid vokal sekaligus menjaga kesiapan semua bangku.',
        example: 'Guru menyiapkan gelas berisi stik es krim bertuliskan nama seluruh murid. Stik yang sudah terambil dipisahkan ke gelas "Sudah Berbagi" sehingga semua murid kebagian giliran merata.',
        tips: 'Jika murid yang terpilih belum tahu jawabannya, izinkan fitur "Bantuan Teman Sebelah" lalu ia mengulang jawabannya sendiri.'
      },
      {
        title: 'Lembar Umpan Balik Dua Bintang Satu Harapan',
        jenjang: 'Semua Jenjang',
        summary: 'Format komentar koreksi tugas yang membangun semangat belajar murid.',
        explanation: 'Murid jauh lebih mau memperbaiki tugas ketika usahanya diakui lebih dulu.',
        example: 'Format Catatan Guru:\n★ Bintang 1 (Hal yang sudah sangat baik): ....\n★ Bintang 2 (Kemajuan yang terlihat): ....\n➔ Harapan (1 langkah perbaikan spesifik berikutnya): ....',
        tips: 'Kalimat harapan harus konkret, misalnya "Tambahkan satuan cm pada hasil akhir nomor 3".'
      }
    ]
  },
  {
    category: 'Kalimat Deskripsi Rapor',
    wizardField: 'catatanRapor',
    items: [
      {
        title: 'Capaian Sangat Baik — Pemahaman Konsep & Kemandirian',
        jenjang: 'Semua Jenjang',
        summary: 'Kalimat apresiasi untuk murid yang tuntas melampaui target pada kompetensi utama.',
        explanation: 'Sesuai format aplikasi e-Rapor Kurikulum Merdeka (menyebut capaian tertinggi secara spesifik).',
        example: 'Menunjukkan penguasaan yang sangat baik dalam memahami konsep inti pembelajaran serta mampu menerapkannya secara mandiri untuk menyelesaikan permasalahan sehari-hari dengan teliti dan runtut.',
        tips: 'Ganti kata "konsep inti pembelajaran" dengan topik spesifik mapel, misal "operasi hitung pecahan".'
      },
      {
        title: 'Capaian Baik — Aktif Diskusi & Mampu Menjelaskan Ulang',
        jenjang: 'Semua Jenjang',
        summary: 'Kalimat capaian positif untuk murid yang aktif bekerja sama dan komunikatif.',
        explanation: 'Menyoroti kemampuan menjelaskan gagasan secara lisan maupun tertulis.',
        example: 'Mampu memahami materi dengan baik, aktif menyampaikan gagasan saat diskusi kelompok, serta dapat menyajikan hasil kerja menggunakan bahasa sendiri yang jelas dan mudah dipahami.',
        tips: 'Cocok dipadukan pada mata pelajaran Bahasa, IPS, maupun IPAS.'
      },
      {
        title: 'Perlu Bimbingan Halus — Ketelitian & Langkah Pengerjaan',
        jenjang: 'Semua Jenjang',
        summary: 'Kalimat santun dan konstruktif untuk aspek yang masih butuh pendampingan.',
        explanation: 'Menghindari kata negatif menghakimi seperti "malas" atau "tidak mampu"; fokus pada arah bantuan.',
        example: 'Perlu bimbingan lebih lanjut dan latihan bertahap dalam memeriksa kembali ketelitian langkah pengerjaan soal cerita agar hasil akhir semakin tepat.',
        tips: 'Selalu pasangkan kalimat perlu bimbingan setelah menyebutkan minimal satu kekuatan murid.'
      },
      {
        title: 'Perlu Bimbingan Halus — Keberanian Bertanya & Tampil',
        jenjang: 'SD',
        summary: 'Dorongan positif bagi murid pendiam yang paham namun masih ragu tampil di depan.',
        explanation: 'Memberi sinyal kerja sama bagi orang tua di rumah untuk ikut membesarkan hati anak.',
        example: 'Perlu terus didorong dan diberi penguatan kepercayaan diri saat menyampaikan pendapat secara lisan di depan kelas maupun bertanya ketika menemui kesulitan.',
        tips: 'Sangat disukai orang tua karena bahasanya hangat dan peduli.'
      },
      {
        title: 'Deskripsi Rapor Matematika — Hitung & Pemecahan Masalah',
        jenjang: 'SD',
        summary: 'Paket kalimat capaian tertinggi dan bimbingan khusus pelajaran Matematika.',
        explanation: 'Membedakan kelancaran hitung dasar dengan penerjemahan soal cerita.',
        example: 'Menunjukkan penguasaan yang baik dalam melakukan operasi hitung bilangan dan pengukuran bangun datar. Perlu pendampingan rutin melalui latihan soal bertahap dalam menerjemahkan informasi soal cerita menjadi kalimat matematika.',
        tips: 'Sesuaikan topik bangun datar/pecahan/aljabar sesuai semester berjalan.'
      },
      {
        title: 'Deskripsi Rapor Bahasa Indonesia — Membaca & Menulis Rapi',
        jenjang: 'SD',
        summary: 'Paket kalimat literasi pemahaman bacaan dan penulisan ejaan dasar.',
        explanation: 'Mencakup keterampilan reseptif (membaca/menyimak) dan produktif (menulis/berbicara).',
        example: 'Sangat baik dalam menemukan informasi penting dari teks bacaan dan menceritakannya kembali secara lisan. Perlu pembiasaan lebih konsisten dalam penggunaan huruf kapital serta tanda baca titik pada penulisan karangan.',
        tips: 'Jelas memberi tahu orang tua bagian mana yang bisa dilatih ringan di rumah.'
      },
      {
        title: 'Deskripsi Rapor IPAS / IPA — Pengamatan & Penalaran Ilmiah',
        jenjang: 'SMP',
        summary: 'Menyoroti antusiasme praktikum dan kemampuan menghubungkan sebab-akibat.',
        explanation: 'Tepat untuk murid yang senang praktik langsung namun masih belajar merangkum simpulan.',
        example: 'Menunjukkan keaktifan dan penguasaan yang baik saat melakukan pengamatan percobaan serta mengidentifikasi fenomena alam sekitar. Perlu penguatan dalam menuliskan simpulan hubungan sebab-akibat secara lengkap menggunakan istilah ilmiah yang tepat.',
        tips: 'Apresiasi keterampilan praktik sangat memotivasi murid kinestetik.'
      },
      {
        title: 'Deskripsi Rapor Bahasa Inggris — Kosakata & Percakapan Pendek',
        jenjang: 'SMP',
        summary: 'Menyeimbangkan capaian pemahaman kosakata dengan kelancaran pengucapan.',
        explanation: 'Mendorong murid terus berlatih tanpa takut salah.',
        example: 'Mampu mengidentifikasi kosakata dan makna ungkapan pendek dalam teks fungsional sehari-hari dengan baik. Perlu latihan pembiasaan pelafalan dan penyusunan kalimat sederhana agar semakin lancar saat berdialog.',
        tips: 'Cocok untuk SMP Fase D dan SMA Fase E.'
      },
      {
        title: 'Deskripsi Rapor Pendidikan Pancasila — Sikap & Pemahaman Norma',
        jenjang: 'Semua Jenjang',
        summary: 'Mengaitkan pemahaman materi aturan/keberagaman dengan praktik keseharian di sekolah.',
        explanation: 'Menyatukan aspek pengetahuan kewarganegaraan dan pengamalan nyata.',
        example: 'Menunjukkan pemahaman yang sangat baik mengenai pentingnya kesepakatan bersama serta menghargai keberagaman teman di sekolah. Perlu terus mempertahankan konsistensi kedisiplinan waktu dan ketelitian dalam menguraikan contoh penerapan norma.',
        tips: 'Pastikan selaras dengan pengamatan keseharian murid di kelas.'
      },
      {
        title: 'Deskripsi Rapor PJOK — Gerak Lokomotor, Kebugaran & Sportivitas',
        jenjang: 'Semua Jenjang',
        summary: 'Menilai keterampilan praktik olahraga sekaligus kerja sama tim.',
        explanation: 'Menghargai usaha kebugaran dan sikap jujur bermain sportif.',
        example: 'Sangat antusias dan terampil dalam mempraktikkan variasi gerak dasar permainan bola serta menjaga sportivitas bersama teman. Perlu latihan rutin dalam menjaga daya tahan kebugaran jasmani dan kelentukan saat pemanasan.',
        tips: 'Sesuaikan cabang olahraga yang dipelajari pada semester tersebut.'
      },
      {
        title: 'Deskripsi Rapor Seni Budaya — Ekspresi Karya & Apresiasi',
        jenjang: 'Semua Jenjang',
        summary: 'Kalimat positif untuk kreativitas berkarya seni rupa, musik, tari, atau prakarya.',
        explanation: 'Mengapresiasi keunikan ide dan ketekunan menyelesaikan karya.',
        example: 'Menunjukkan kreativitas yang baik dalam memadukan warna dan bentuk saat berkarya seni rupa sesuai tema. Perlu ketelatenan lebih pada tahap penyelesaian akhir (finishing) agar hasil karya semakin rapi.',
        tips: 'Hindari membandingkan bakat alami antar murid.'
      },
      {
        title: 'Deskripsi Rapor Informatika / Kejuruan SMK — Praktik Digital & Proyek',
        jenjang: 'SMA/SMK',
        summary: 'Menilai ketepatan prosedur teknis, pemecahan masalah, dan kerapian hasil kerja.',
        explanation: 'Relevan untuk mata pelajaran komputer maupun kompetensi keahlian SMK.',
        example: 'Mampu mengoperasikan perangkat kerja dan menyusun logika langkah penyelesaian proyek praktik sesuai prosedur keselamatan dengan baik. Perlu peningkatan ketelitian saat melakukan pemeriksaan ulang (troubleshooting) hasil kerja sebelum dikumpulkan.',
        tips: 'Sebutkan nama aplikasi atau unit kompetensi spesifik agar rapor SMK informatif bagi dunia kerja.'
      },
      {
        title: 'Catatan Wali Kelas — Murid Berprestasi & Rendah Hati',
        jenjang: 'Semua Jenjang',
        summary: 'Catatan penutup rapor yang mengapresiasi ketekunan sekaligus sikap sosial murid.',
        explanation: 'Kolom yang selalu paling pertama dibaca orang tua saat membuka rapor.',
        example: 'Terima kasih atas semangat belajar, kedisiplinan, dan sikap ringan tangan membantu teman sepanjang semester ini. Pertahankan kebiasaan baikmu, teruslah rendah hati, dan jangan ragu mencoba tantangan baru di semester depan!',
        tips: 'Tambahkan sapaan nama panggilan positif bila kebijakan sekolah mengizinkan.'
      },
      {
        title: 'Catatan Wali Kelas — Murid Mengalami Kemajuan Pesat',
        jenjang: 'Semua Jenjang',
        summary: 'Penghargaan tulus bagi murid yang berproses naik dibanding awal semester.',
        explanation: 'Walaupun nilainya belum tertinggi di kelas, pengakuan atas kemajuannya berdampak luar biasa.',
        example: 'Ibu/Bapak sangat bangga melihat perubahan positif dan kesungguhanmu memperbaiki ketertiban tugas di paruh kedua semester ini. Terus jaga ritme belajarmu ya, usaha kerasmu sudah mulai membuahkan hasil yang membanggakan!',
        tips: 'Sangat ampuh meningkatkan motivasi murid menengah di semester genap.'
      },
      {
        title: 'Catatan Wali Kelas — Penguatan Kehadiran & Manajemen Waktu',
        jenjang: 'Semua Jenjang',
        summary: 'Teguran hangat dan solutif terkait ketepatan waktu hadir serta pengumpulan tugas.',
        explanation: 'Mengajak kolaborasi orang tua tanpa nada menyudutkan.',
        example: 'Kamu memiliki potensi pemahaman yang baik saat menyimak pelajaran di kelas. Mari bersama-sama mengatur jadwal istirahat malam dan rutinitas pagi yang lebih teratur di semester depan agar kehadiran serta ketuntasan tugasmu semakin optimal.',
        tips: 'Komunikasikan juga secara lisan saat orang tua mengambil rapor.'
      },
      {
        title: 'Catatan Wali Kelas — Murid Aktif Organisasi / Ekstrakurikuler',
        jenjang: 'SMP',
        summary: 'Mengapresiasi kepemimpinan non-akademik sambil mengingatkan keseimbangan belajar.',
        explanation: 'Menghargai bakat kepemimpinan pengurus OSIS, Pramuka, atau tim olahraga sekolah.',
        example: 'Semangat kepemimpinan dan keaktifanmu dalam kegiatan sekolah patut diapresiasi. Terus latih pengaturan prioritas waktu antara kegiatan organisasi dan penyelesaian tugas kelas agar keduanya berjalan sama-sama gemilang.',
        tips: 'Murid aktif organisasi merasa dihargai ketika kontribusinya disadari wali kelas.'
      },
      {
        title: 'Catatan Wali Kelas — Dorongan Keberanian & Sosialisasi Kelas',
        jenjang: 'SD',
        summary: 'Catatan hangat untuk murid yang santun namun masih pemalu bergaul luas.',
        explanation: 'Menonjolkan kesantunan lebih dulu sebelum mengajak lebih berani berinteraksi.',
        example: 'Sikapmu yang santun, tertib, dan tekun menyimak pelajaran menjadi teladan yang menyejukkan di kelas. Di semester berikutnya, jangan ragu untuk lebih berani mengangkat tangan dan mencoba bekerja sama dengan lebih banyak teman ya!',
        tips: 'Bantu wujudkan di semester depan dengan merotasi teman sebangkunya secara bijak.'
      },
      {
        title: 'Catatan Wali Kelas — Penguatan Fokus & Mengurangi Ngobrol Saat Jam Inti',
        jenjang: 'Semua Jenjang',
        summary: 'Mengarahkan energi murid yang ceria/ramai menjadi partisipasi diskusi yang tepat waktu.',
        explanation: 'Mengakui sisi ceria murid sambil memberi batas kapan waktunya menyimak.',
        example: 'Keceriaan dan keberanianmu bertanya selalu menghidupkan suasana kelas kita. Mari latih kemampuan memilih waktu kapan berdiskusi aktif dan kapan menyimak penjelasan dengan tenang agar pemahaman materimu makin tajam.',
        tips: 'Kalimat membingkai ulang (reframing) seperti ini membuat murid menerima masukan dengan senang hati.'
      },
      {
        title: 'Catatan Kokurikuler / Proyek Penguatan Karakter (Gotong Royong & Kreatif)',
        jenjang: 'Semua Jenjang',
        summary: 'Deskripsi keterlibatan murid dalam proyek lintas mata pelajaran bertema lingkungan/kewirausahaan.',
        explanation: 'Siap pakai untuk rapor proyek / kegiatan kokurikuler satuan pendidikan.',
        example: 'Berkembang sesuai harapan dalam berkolaborasi membagi peran bersama anggota tim serta mampu menghasilkan gagasan kreatif memanfaatkan bahan di sekitar menjadi karya yang bermanfaat bagi warga sekolah.',
        tips: 'Sebutkan tema proyek sekolah secara spesifik agar tampak personal.'
      },
      {
        title: 'Catatan Kenaikan Kelas / Kelulusan Akhir Tahun Ajaran',
        jenjang: 'Semua Jenjang',
        summary: 'Pesan penutup tahun ajaran yang berkesan dan memacu kesiapan di tingkat berikutnya.',
        explanation: 'Menutup perjalanan satu tahun penuh dengan rasa optimis.',
        example: 'Selamat melanjutkan langkah ke jenjang kelas berikutnya! Bekal kemandirian, kejujuran, dan pantang menyerah yang telah kamu latih tahun ini adalah modal berharga untuk menghadapi materi baru yang lebih menantang. Teruslah bertumbuh!',
        tips: 'Cocok dipakai pada pembagian rapor semester genap.'
      }
    ]
  }
];

export const LIBRARY_CATEGORIES = RAW_CATEGORIES.map((c) => c.category);

export const LIBRARY_ITEMS = RAW_CATEGORIES.flatMap((group, gIdx) =>
  group.items.map((item, iIdx) => ({
    id: `item-${gIdx + 1}-${iIdx + 1}`,
    category: group.category,
    wizardField: group.wizardField,
    jenjang: item.jenjang,
    title: item.title,
    summary: item.summary,
    explanation: item.explanation,
    example: item.example,
    tips: item.tips
  }))
);

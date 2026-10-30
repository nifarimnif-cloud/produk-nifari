// Data Preset 8 Jenis Usaha UMKM & Pustaka 120 SOP Keuangan & Penggajian GajiKas Studio
// 100% Logika & Aturan Operasional Mandiri — Tanpa AI, Tanpa Emoji

(function () {
  const GAJIKAS_PRESETS = [
    {
      id: 'ritel-minimarket',
      label: 'Toko Ritel / Minimarket',
      businessName: 'Toko Harian & Sembako Berkah Jaya',
      city: 'Sleman, DI Yogyakarta',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 64500000,
        nonCashRevenue: 28500000,
        hppCost: 66800000,
        rentCost: 3500000,
        utilityCost: 1650000,
        suppliesCost: 650000,
        transportCost: 750000,
        marketingCost: 350000,
        otherCost: 300000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Hendra Saputra',
          role: 'Kepala Toko & Gudang',
          tenureMonths: 28,
          daysPresent: 26,
          baseSalary: 2850000,
          dailyAllowanceRate: 25000,
          overtimeHours: 8,
          overtimeMethod: 'depnaker',
          overtimeRate: 20000,
          bonus: 350000,
          includeThr: false,
          kasbonCut: 250000,
          lateCut: 0,
          bpjsCut: 57000
        },
        {
          id: 'emp-2',
          name: 'Siti Nurhaliza',
          role: 'Kasir Shift Pagi',
          tenureMonths: 16,
          daysPresent: 26,
          baseSalary: 2350000,
          dailyAllowanceRate: 20000,
          overtimeHours: 6,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 200000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 25000,
          bpjsCut: 47000
        },
        {
          id: 'emp-3',
          name: 'Rizky Pratama',
          role: 'Pramuniaga & Kurir Antar',
          tenureMonths: 7,
          daysPresent: 25,
          baseSalary: 2100000,
          dailyAllowanceRate: 20000,
          overtimeHours: 10,
          overtimeMethod: 'depnaker',
          overtimeRate: 16000,
          bonus: 150000,
          includeThr: false,
          kasbonCut: 100000,
          lateCut: 0,
          bpjsCut: 42000
        }
      ]
    },
    {
      id: 'bengkel',
      label: 'Bengkel Motor / Mobil',
      businessName: 'Bengkel Servis & Suku Cadang Prima Motor',
      city: 'Bekasi, Jawa Barat',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 36500000,
        nonCashRevenue: 21000000,
        hppCost: 27400000,
        rentCost: 4000000,
        utilityCost: 1150000,
        suppliesCost: 850000,
        transportCost: 600000,
        marketingCost: 450000,
        otherCost: 350000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Agus Setiawan',
          role: 'Kepala Mekanik',
          tenureMonths: 36,
          daysPresent: 26,
          baseSalary: 3400000,
          dailyAllowanceRate: 30000,
          overtimeHours: 9,
          overtimeMethod: 'depnaker',
          overtimeRate: 25000,
          bonus: 650000,
          includeThr: false,
          kasbonCut: 300000,
          lateCut: 0,
          bpjsCut: 68000
        },
        {
          id: 'emp-2',
          name: 'Dedi Kurniawan',
          role: 'Mekanik Servis & Injeksi',
          tenureMonths: 14,
          daysPresent: 25,
          baseSalary: 2650000,
          dailyAllowanceRate: 25000,
          overtimeHours: 7,
          overtimeMethod: 'depnaker',
          overtimeRate: 20000,
          bonus: 450000,
          includeThr: false,
          kasbonCut: 200000,
          lateCut: 30000,
          bpjsCut: 53000
        },
        {
          id: 'emp-3',
          name: 'Nadia Putri',
          role: 'Kasir & Admin Sparepart',
          tenureMonths: 11,
          daysPresent: 26,
          baseSalary: 2400000,
          dailyAllowanceRate: 22000,
          overtimeHours: 4,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 200000,
          includeThr: false,
          kasbonCut: 0,
          lateCut: 0,
          bpjsCut: 48000
        }
      ]
    },
    {
      id: 'laundry',
      label: 'Laundry Kiloan',
      businessName: 'BersihWangi Laundry Express',
      city: 'Tangerang Selatan, Banten',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 15800000,
        nonCashRevenue: 13400000,
        hppCost: 5900000,
        rentCost: 2800000,
        utilityCost: 2150000,
        suppliesCost: 700000,
        transportCost: 550000,
        marketingCost: 300000,
        otherCost: 250000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Wulan Sari',
          role: 'Kasir & QC Timbangan',
          tenureMonths: 20,
          daysPresent: 26,
          baseSalary: 2300000,
          dailyAllowanceRate: 20000,
          overtimeHours: 6,
          overtimeMethod: 'flat',
          overtimeRate: 15000,
          bonus: 220000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 0,
          bpjsCut: 46000
        },
        {
          id: 'emp-2',
          name: 'Rina Marlina',
          role: 'Spesialis Setrika Uap & Lipat',
          tenureMonths: 15,
          daysPresent: 26,
          baseSalary: 2200000,
          dailyAllowanceRate: 20000,
          overtimeHours: 10,
          overtimeMethod: 'flat',
          overtimeRate: 15000,
          bonus: 280000,
          includeThr: false,
          kasbonCut: 100000,
          lateCut: 0,
          bpjsCut: 44000
        },
        {
          id: 'emp-3',
          name: 'Bayu Nugroho',
          role: 'Operator Cuci & Kurir Jemput',
          tenureMonths: 8,
          daysPresent: 25,
          baseSalary: 2150000,
          dailyAllowanceRate: 20000,
          overtimeHours: 5,
          overtimeMethod: 'flat',
          overtimeRate: 15000,
          bonus: 180000,
          includeThr: false,
          kasbonCut: 0,
          lateCut: 20000,
          bpjsCut: 43000
        }
      ]
    },
    {
      id: 'barbershop',
      label: 'Barbershop / Salon',
      businessName: 'RapiJaya Barbershop & Grooming',
      city: 'Bandung, Jawa Barat',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 17200000,
        nonCashRevenue: 21800000,
        hppCost: 4100000,
        rentCost: 3800000,
        utilityCost: 1450000,
        suppliesCost: 650000,
        transportCost: 250000,
        marketingCost: 600000,
        otherCost: 250000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Fajar Ramadhan',
          role: 'Kapster Senior',
          tenureMonths: 24,
          daysPresent: 26,
          baseSalary: 2600000,
          dailyAllowanceRate: 25000,
          overtimeHours: 6,
          overtimeMethod: 'flat',
          overtimeRate: 20000,
          bonus: 1150000,
          includeThr: false,
          kasbonCut: 200000,
          lateCut: 0,
          bpjsCut: 52000
        },
        {
          id: 'emp-2',
          name: 'Ilham Maulana',
          role: 'Kapster Reguler',
          tenureMonths: 13,
          daysPresent: 25,
          baseSalary: 2300000,
          dailyAllowanceRate: 25000,
          overtimeHours: 4,
          overtimeMethod: 'flat',
          overtimeRate: 20000,
          bonus: 850000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 25000,
          bpjsCut: 46000
        },
        {
          id: 'emp-3',
          name: 'Putri Ayu',
          role: 'Kasir & Frontdesk',
          tenureMonths: 9,
          daysPresent: 26,
          baseSalary: 2150000,
          dailyAllowanceRate: 20000,
          overtimeHours: 3,
          overtimeMethod: 'flat',
          overtimeRate: 15000,
          bonus: 250000,
          includeThr: false,
          kasbonCut: 0,
          lateCut: 0,
          bpjsCut: 43000
        }
      ]
    },
    {
      id: 'konveksi',
      label: 'Konveksi / Sablon',
      businessName: 'KaryaSandang Konveksi & Sablon',
      city: 'Surakarta, Jawa Tengah',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 24000000,
        nonCashRevenue: 54000000,
        hppCost: 42500000,
        rentCost: 3200000,
        utilityCost: 1750000,
        suppliesCost: 1100000,
        transportCost: 950000,
        marketingCost: 650000,
        otherCost: 400000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Slamet Widodo',
          role: 'Kepala Produksi & Pola',
          tenureMonths: 32,
          daysPresent: 26,
          baseSalary: 3200000,
          dailyAllowanceRate: 25000,
          overtimeHours: 12,
          overtimeMethod: 'depnaker',
          overtimeRate: 22000,
          bonus: 500000,
          includeThr: false,
          kasbonCut: 250000,
          lateCut: 0,
          bpjsCut: 64000
        },
        {
          id: 'emp-2',
          name: 'Sri Wahyuni',
          role: 'Penjahit Halus & Obras',
          tenureMonths: 19,
          daysPresent: 26,
          baseSalary: 2550000,
          dailyAllowanceRate: 20000,
          overtimeHours: 14,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 420000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 0,
          bpjsCut: 51000
        },
        {
          id: 'emp-3',
          name: 'Danang Prasetyo',
          role: 'Operator Sablon Plastisol & QC',
          tenureMonths: 10,
          daysPresent: 25,
          baseSalary: 2450000,
          dailyAllowanceRate: 20000,
          overtimeHours: 10,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 350000,
          includeThr: false,
          kasbonCut: 100000,
          lateCut: 20000,
          bpjsCut: 49000
        }
      ]
    },
    {
      id: 'warung-kafe',
      label: 'Warung Makan / Kafe',
      businessName: 'Kedai Kopi & Makan Selera Kita',
      city: 'Malang, Jawa Timur',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 31500000,
        nonCashRevenue: 38500000,
        hppCost: 30800000,
        rentCost: 4200000,
        utilityCost: 2250000,
        suppliesCost: 1350000,
        transportCost: 650000,
        marketingCost: 750000,
        otherCost: 350000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Budi Santoso',
          role: 'Juru Masak Utama',
          tenureMonths: 22,
          daysPresent: 26,
          baseSalary: 3100000,
          dailyAllowanceRate: 25000,
          overtimeHours: 8,
          overtimeMethod: 'depnaker',
          overtimeRate: 20000,
          bonus: 400000,
          includeThr: false,
          kasbonCut: 200000,
          lateCut: 0,
          bpjsCut: 62000
        },
        {
          id: 'emp-2',
          name: 'Dimas Arya',
          role: 'Barista & Racik Minuman',
          tenureMonths: 14,
          daysPresent: 26,
          baseSalary: 2500000,
          dailyAllowanceRate: 22000,
          overtimeHours: 6,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 300000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 25000,
          bpjsCut: 50000
        },
        {
          id: 'emp-3',
          name: 'Lestari Handayani',
          role: 'Kasir & Pramusaji',
          tenureMonths: 6,
          daysPresent: 25,
          baseSalary: 2250000,
          dailyAllowanceRate: 20000,
          overtimeHours: 5,
          overtimeMethod: 'depnaker',
          overtimeRate: 16000,
          bonus: 225000,
          includeThr: false,
          kasbonCut: 0,
          lateCut: 0,
          bpjsCut: 45000
        }
      ]
    },
    {
      id: 'ekspedisi-kurir',
      label: 'Ekspedisi / Kurir Lokal',
      businessName: 'KilatLokal Agen Paket & Kurir Kota',
      city: 'Semarang, Jawa Tengah',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 19800000,
        nonCashRevenue: 26700000,
        hppCost: 10200000,
        rentCost: 2900000,
        utilityCost: 950000,
        suppliesCost: 1150000,
        transportCost: 2850000,
        marketingCost: 350000,
        otherCost: 300000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'Arif Hidayat',
          role: 'Koordinator Loket & Manifest',
          tenureMonths: 25,
          daysPresent: 26,
          baseSalary: 2800000,
          dailyAllowanceRate: 25000,
          overtimeHours: 7,
          overtimeMethod: 'depnaker',
          overtimeRate: 20000,
          bonus: 350000,
          includeThr: false,
          kasbonCut: 200000,
          lateCut: 0,
          bpjsCut: 56000
        },
        {
          id: 'emp-2',
          name: 'Taufik Rahman',
          role: 'Kurir Motor Rute Barat',
          tenureMonths: 15,
          daysPresent: 26,
          baseSalary: 2350000,
          dailyAllowanceRate: 30000,
          overtimeHours: 8,
          overtimeMethod: 'flat',
          overtimeRate: 18000,
          bonus: 520000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 0,
          bpjsCut: 47000
        },
        {
          id: 'emp-3',
          name: 'Wahyu Saputro',
          role: 'Kurir Motor Rute Timur',
          tenureMonths: 9,
          daysPresent: 25,
          baseSalary: 2350000,
          dailyAllowanceRate: 30000,
          overtimeHours: 6,
          overtimeMethod: 'flat',
          overtimeRate: 18000,
          bonus: 460000,
          includeThr: false,
          kasbonCut: 100000,
          lateCut: 25000,
          bpjsCut: 47000
        }
      ]
    },
    {
      id: 'apotek-klinik',
      label: 'Apotek / Klinik',
      businessName: 'Apotek Sehat Sentosa',
      city: 'Sidoarjo, Jawa Timur',
      periodLabel: 'Oktober 2026',
      payDate: '2026-10-31',
      cashflow: {
        cashRevenue: 47500000,
        nonCashRevenue: 41500000,
        hppCost: 57400000,
        rentCost: 4500000,
        utilityCost: 1850000,
        suppliesCost: 750000,
        transportCost: 450000,
        marketingCost: 350000,
        otherCost: 400000
      },
      employees: [
        {
          id: 'emp-1',
          name: 'apt. Ratna Dewi, S.Farm.',
          role: 'Apoteker Penanggung Jawab',
          tenureMonths: 30,
          daysPresent: 26,
          baseSalary: 4200000,
          dailyAllowanceRate: 30000,
          overtimeHours: 4,
          overtimeMethod: 'depnaker',
          overtimeRate: 30000,
          bonus: 450000,
          includeThr: false,
          kasbonCut: 0,
          lateCut: 0,
          bpjsCut: 84000
        },
        {
          id: 'emp-2',
          name: 'Mei Wulandari',
          role: 'Tenaga Teknis Kefarmasian',
          tenureMonths: 18,
          daysPresent: 26,
          baseSalary: 2950000,
          dailyAllowanceRate: 25000,
          overtimeHours: 6,
          overtimeMethod: 'depnaker',
          overtimeRate: 22000,
          bonus: 300000,
          includeThr: false,
          kasbonCut: 200000,
          lateCut: 0,
          bpjsCut: 59000
        },
        {
          id: 'emp-3',
          name: 'Bagas Adi',
          role: 'Kasir & Admin Stok PBF',
          tenureMonths: 11,
          daysPresent: 26,
          baseSalary: 2450000,
          dailyAllowanceRate: 22000,
          overtimeHours: 5,
          overtimeMethod: 'depnaker',
          overtimeRate: 18000,
          bonus: 200000,
          includeThr: false,
          kasbonCut: 150000,
          lateCut: 0,
          bpjsCut: 49000
        }
      ]
    }
  ];

  const GAJIKAS_LIBRARY = [
    // =========================================================================
    // KATEGORI 1: SOP Absensi & Jam Kerja (20 Item)
    // =========================================================================
    {
      id: 'sop-001',
      code: 'ABS-01',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Toleransi Keterlambatan 10 Menit & Potong Uang Makan Bertingkat',
      summary: 'Mengatur batas toleransi telat masuk agar adil bagi karyawan yang rajin tanpa langsung memotong gaji pokok.',
      formulaOrRule: 'Telat <= 10 menit: Peringatan (Maks 3x/bln) | Telat 11-30 menit: Potong 50% Uang Makan Harian | Telat > 30 menit: Hangus 100% Uang Makan Harian',
      readyText: 'ATURAN JAM MASUK TIM:\n1. Karyawan wajib siap bekerja 5 menit sebelum jam buka toko.\n2. Toleransi keterlambatan darurat maksimal 10 menit sebanyak 3 kali dalam sebulan.\n3. Keterlambatan 11-30 menit dikenakan pemotongan 50% tunjangan makan/transport hari tersebut.\n4. Keterlambatan di atas 30 menit tanpa kabar sebelumnya menghanguskan tunjangan makan/transport hari tersebut.',
      tip: 'Jangan memotong Gaji Pokok untuk keterlambatan ringan; potong dari komponen Tunjangan Kehadiran Harian agar secara hukum dan psikologis lebih diterima tim.'
    },
    {
      id: 'sop-002',
      code: 'ABS-02',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Wajib Absen Foto Timestamp & Titik Lokasi Saat Buka Outlet',
      summary: 'Mencegah titip absen pada usaha cabang atau toko yang buka pagi sebelum pemilik datang.',
      formulaOrRule: 'Foto selfie di dalam toko berlatar laci kasir/rolling door terbuka + Timestamp jam & GPS dikirim ke grup WA Absensi',
      readyText: 'PROSEDUR ABSEN BUKA OUTLET:\nPetugas shift pagi wajib mengirim 1 foto di dalam area kerja dengan aplikasi kamera berpenanda waktu (Timestamp) ke grup WhatsApp Absensi maksimal pada jam masuk kerja. Absen dari luar pagar atau titip foto dianggap belum hadir.',
      tip: 'Gunakan satu grup WhatsApp khusus absensi dan serah-terima shift tanpa obrolan campuran agar rekap akhir bulan selesai dalam 10 menit.'
    },
    {
      id: 'sop-003',
      code: 'ABS-03',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Aturan Tukar Shift Wajib Lapor H-1 dan Tanggung Jawab Penuh',
      summary: 'Menghindari kekosongan penjaga toko akibat tukar jadwal diam-diam antar karyawan.',
      formulaOrRule: 'Konfirmasi tertulis H-1 sebelum pukul 19.00 WIB oleh kedua belah pihak di grup resmi',
      readyText: 'KETENTUAN TUKAR JADWAL SHIFT:\nTukar shift antar rekan kerja diperbolehkan maksimal 2 kali sebulan dengan syarat kedua karyawan menulis konfirmasi di grup paling lambat H-1 pukul 19.00 WIB. Setelah disetujui Kepala Toko, tanggung jawab kehadiran pindah penuh ke penerima shift.',
      tip: 'Batasi maksimal 2 kali tukar shift per bulan agar tidak ada karyawan yang bekerja double shift terus-menerus hingga kelelahan dan salah hitung kasir.'
    },
    {
      id: 'sop-004',
      code: 'ABS-04',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Standar 6 Hari Kerja (40 Jam Seminggu) untuk Usaha Harian',
      summary: 'Pembagian jam kerja standar toko, bengkel, dan laundry agar selaras dengan aturan ketenagakerjaan.',
      formulaOrRule: '6 hari kerja x 7 jam/hari (5 hari) + 5 jam (1 hari pendek) atau 7 jam rata dengan istirahat bergilir 60 menit',
      readyText: 'JAM KERJA REGULER USAHA:\nSistem kerja menggunakan pola 6 hari kerja dan 1 hari libur bergilir (off-day) per minggu. Jam kerja aktif adalah 7 jam per hari di luar 1 jam istirahat makan dan ibadah yang diambil secara bergantian agar layanan pelanggan tidak pernah kosong.',
      tip: 'Jangan menaruh hari libur karyawan terbaik di akhir pekan atau tanggal gajian; jadwalkan libur rutin pada hari Selasa, Rabu, atau Kamis.'
    },
    {
      id: 'sop-005',
      code: 'ABS-05',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Prosedur Izin Sakit dengan Surat Dokter vs Izin Sakit Tanpa Surat',
      summary: 'Membedakan hak gaji pokok dan uang makan saat karyawan berhalangan hadir karena sakit.',
      formulaOrRule: 'Sakit + Surat Dokter: Gaji Pokok utuh, Uang Makan Harian tidak keluar | Sakit tanpa surat (>1 hari): Potong proporsional hari kerja atau potong kuota cuti',
      readyText: 'ATURAN IZIN SAKIT:\n1. Kabar sakit wajib disampaikan minimal 2 jam sebelum shift dimulai melalui telepon/WA ke penanggung jawab toko.\n2. Izin sakit 1 hari cukup konfirmasi istirahat; gaji pokok tetap utuh namun uang makan/transport harian tidak dibayarkan.\n3. Izin sakit 2 hari berturut-turut atau lebih wajib melampirkan surat keterangan dokter klinik/puskesmas saat masuk kembali.',
      tip: 'Memisahkan Gaji Pokok (bulanan) dan Uang Makan/Transport (dibayar per hari hadir nyata) otomatis menghemat kas saat ada yang izin tanpa perlu debat.'
    },
    {
      id: 'sop-006',
      code: 'ABS-06',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Sanksi Mangkir Tanpa Kabar (Alpha) dan Rumus Potong Harian',
      summary: 'Penanganan tegas terhadap ketidakhadiran tanpa pemberitahuan sama sekali yang mengganggu operasional toko.',
      formulaOrRule: 'Potongan Alpha per hari = (Gaji Pokok / 26 hari kerja) + Uang Makan Harian hangus + Surat Peringatan jika >= 2 hari',
      readyText: 'KETENTUAN MANGKIR TANPA KABAR (ALPHA):\nKaryawan yang tidak hadir dan tidak memberikan kabar hingga 2 jam setelah jam kerja dimulai tercatat Alpha. Setiap 1 hari Alpha dikenakan pemotongan upah harian proporsional (1/26 Gaji Pokok) dan kehilangan tunjangan harian.',
      tip: 'Selalu konfirmasi via telepon lebih dulu sebelum mencatat Alpha, untuk memastikan karyawan tidak mengalami kendala darurat di jalan.'
    },
    {
      id: 'sop-007',
      code: 'ABS-07',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Pengaturan Jam Istirahat Siang Bergilir (Toko Tetap Buka)',
      summary: 'Menjaga konter kasir dan area pelayanan tetap terjaga penuh pada jam ramai makan siang.',
      formulaOrRule: 'Gelombang 1: 11.30 - 12.30 | Gelombang 2: 12.30 - 13.30 (Maksimal 50% staf istirahat bersamaan)',
      readyText: 'JADWAL ISTIRAHAT BERGILIR:\nJam istirahat berlangsung 60 menit secara bergantian:\n- Kloter 1: Pukul 11.30 s/d 12.30\n- Kloter 2: Pukul 12.30 s/d 13.30\nDilarang meninggalkan meja kasir tanpa serah-terima kunci/laci kepada rekan yang bertugas.',
      tip: 'Untuk warung makan dan kafe yang justru paling ramai jam 12.00-13.30, geser jam istirahat staf ke pukul 10.30 dan 14.00.'
    },
    {
      id: 'sop-008',
      code: 'ABS-08',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Masa Percobaan Karyawan Baru (Probation 3 Bulan) yang Jelas',
      summary: 'Menguji kejujuran, kerapian kerja, dan kecocokan budaya sebelum mengangkat staf tetap.',
      formulaOrRule: 'Evaluasi 3 bulan pertama: Gaji Pokok 90%-100% + Uang Makan Harian penuh, belum berhak Kasbon sebelum lulus 3 bulan',
      readyText: 'KETENTUAN MASA EVALUASI AWAL (3 BULAN):\nSelama 3 bulan pertama bekerja, karyawan menjalani evaluasi kedisiplinan jam hadir, ketelitian kas/barang, dan keramahan pelayanan. Fasilitas kasbon dan bonus tahunan baru aktif setelah dinyatakan lulus masa evaluasi 3 bulan.',
      tip: 'Kunci utama masa 3 bulan di UMKM adalah melarang kasbon bagi karyawan baru; banyak kasus karyawan baru pinjam uang di bulan ke-1 lalu berhenti.'
    },
    {
      id: 'sop-009',
      code: 'ABS-09',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Overlap Serah-Terima Shift 15 Menit Antara Pagi dan Sore',
      summary: 'Menyediakan waktu hitung uang kasir dan operan pesanan yang belum selesai.',
      formulaOrRule: 'Shift Pagi: 07.45 - 15.45 | Shift Sore: 15.30 - 22.30 (15 menit irisan serah-terima wajib)',
      readyText: 'IRISAN WAKTU SERAH-TERIMA SHIFT:\nJadwal shift pagi dan sore memiliki waktu temu 15 menit (pukul 15.30 - 15.45). Petugas shift pagi dilarang pulang sebelum uang modal kasir dihitung bersama petugas shift sore dan buku operan ditandatangani berdua.',
      tip: 'Tanpa overlap 15 menit, bila malam hari uang kasir kurang Rp 50.000, shift pagi dan shift sore pasti saling menyalahkan.'
    },
    {
      id: 'sop-010',
      code: 'ABS-10',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Kuota Cuti Tahunan 12 Hari setelah Genap 12 Bulan Kerja',
      summary: 'Cara sederhana mengelola hak cuti berbayar karyawan UMKM agar tidak menumpuk di musim ramai.',
      formulaOrRule: '12 hari cuti/tahun (maksimal diambil 3 hari berturut-turut di luar pekan Lebaran/tahun baru), pengajuan H-7',
      readyText: 'ATURAN CUTI TAHUNAN:\nKaryawan dengan masa kerja minimal 12 bulan mendapatkan hak cuti 12 hari kerja per tahun (Gaji Pokok tetap utuh). Pengajuan cuti wajib diajukan minimal 7 hari sebelumnya dan maksimal diambil 3 hari berturut-turut agar jadwal tim tetap berjalan.',
      tip: 'Catat sisa cuti tiap staf pada lembar rekap absensi bulanan agar tidak ada klaim mendadak di akhir tahun.'
    },
    {
      id: 'sop-011',
      code: 'ABS-11',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Izin Khusus Keluarga Inti Tanpa Potong Gaji Pokok',
      summary: 'Daftar kejadian penting keluarga (menikah, kelahiran anak, duka cita) yang tetap dibayar penuh.',
      formulaOrRule: 'Karyawan menikah: 3 hari | Anak lahir/khitan: 2 hari | Keluarga inti wafat: 2 hari',
      readyText: 'IZIN KHUSUS BERBAYAR:\nUsaha memberikan izin khusus tanpa pemotongan Gaji Pokok untuk:\n- Pernikahan karyawan sendiri: 3 hari\n- Kelahiran anak / khitanan anak: 2 hari\n- Orang tua, mertua, pasangan, atau anak kandung meninggal dunia: 2 hari.',
      tip: 'Perhatian tulus pemilik usaha di momen suka-duka keluarga membuat loyalitas karyawan UMKM jauh lebih kuat.'
    },
    {
      id: 'sop-012',
      code: 'ABS-12',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Aturan Penggunaan HP Pribadi Selama Jam Jaga Pelanggan',
      summary: 'Menjaga fokus pelayanan pelanggan tanpa menyita HP pribadi karyawan secara berlebihan.',
      formulaOrRule: 'Mode getar selama bertugas; dilarang main game/menonton video dengan earphone saat di area depan toko',
      readyText: 'ETIKA PENGGUNAAN HP SAAT BERTUGAS:\n1. HP pribadi wajib diatur dalam mode getar dan disimpan di laci loker atau saku.\n2. Dilarang bermain game, live media sosial pribadi, atau memakai headset saat berada di area pelayanan pelanggan.\n3. Panggilan darurat keluarga boleh diangkat maksimal 3 menit di ruang belakang setelah izin ke rekan jaga.',
      tip: 'Sediakan 1 HP operasional khusus toko untuk membalas WA pelanggan dan cek mutasi QRIS sehingga staf tidak beralasan membuka HP pribadi.'
    },
    {
      id: 'sop-013',
      code: 'ABS-13',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Tanggal Cut-Off Rekap Absensi (Tanggal 26 s/d 25 Bulan Berikutnya)',
      summary: 'Memberi waktu longgar 3-5 hari bagi pemilik usaha untuk menghitung lembur, bonus, dan slip gaji tanpa terburu-buru.',
      formulaOrRule: 'Periode Absen & Lembur: Tgl 26 bulan lalu s/d Tgl 25 bulan berjalan -> Pembayaran Gaji tetap tepat Tgl 28 atau akhir bulan',
      readyText: 'PERIODE REKAP KEHADIRAN & LEMBUR:\nPerhitungan hari hadir, uang makan harian, jam lembur, dan insentif dihitung dari tanggal 26 bulan sebelumnya sampai tanggal 25 bulan berjalan. Pencairan gaji dilakukan tepat waktu setiap akhir bulan.',
      tip: 'Jika cut-off absen ditutup tanggal 30 padahal gajian tanggal 30 juga, Anda pasti pusing bila ada yang absen atau lembur di tanggal 29 malam.'
    },
    {
      id: 'sop-014',
      code: 'ABS-14',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Kewajiban Pemberitahuan Resign Minimal 30 Hari Sebelumnya (One-Month Notice)',
      summary: 'Mencegah karyawan keluar mendadak besok pagi setelah menerima gajian atau THR.',
      formulaOrRule: 'Pengajuan pengunduran diri tertulis H-30 + wajib serah-terima pekerjaan, kunci, seragam & pelunasan sisa kasbon',
      readyText: 'PROSEDUR PENGUNDURAN DIRI BAIK-BAIK:\nKaryawan yang berencana mengundurkan diri wajib menyampaikan pemberitahuan tertulis minimal 30 hari sebelumnya agar usaha dapat menyiapkan pengganti dan pelatihan. Serah-terima seragam, inventaris, serta pelunasan kasbon diselesaikan pada hari kerja terakhir.',
      tip: 'Berikan surat keterangan pengalaman kerja (paklaring) hanya bagi karyawan yang menyelesaikan prosedur H-30 dengan tertib.'
    },
    {
      id: 'sop-015',
      code: 'ABS-15',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Aturan Pulang Cepat atas Permintaan Sendiri (Half-Day)',
      summary: 'Cara adil menghitung tunjangan harian jika karyawan masuk pagi namun izin pulang siang karena urusan pribadi.',
      formulaOrRule: 'Kerja < 4 jam: Dihitung izin (Uang Makan 0%) | Kerja >= 4 jam dengan izin sah: Uang Makan dibayar 50%, Gaji Pokok aman',
      readyText: 'KETENTUAN IZIN PULANG LEBIH AWAL:\nApabila karyawan sudah bekerja minimal 4 jam lalu perlu pulang lebih awal karena keperluan mendesak atas persetujuan pemilik, Gaji Pokok tidak dipotong dan tunjangan harian dibayarkan 50%.',
      tip: 'Catat jam keluar aktual pada kolom keterangan absensi agar adil dibandingkan rekan yang bekerja penuh hingga tutup toko.'
    },
    {
      id: 'sop-016',
      code: 'ABS-16',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Standar Seragam, Kerapian & Kebersihan Area Kerja 15 Menit Awal-Akhir',
      summary: 'Memastikan sapu, pel, lap etalase, dan buang sampah masuk ke dalam rutinitas wajib shift.',
      formulaOrRule: '15 menit awal shift pagi = bersih-bersih buka | 15 menit akhir shift malam = bersih-bersih tutup & cek listrik/kompor',
      readyText: 'DAFTAR CEK KEBERSIHAN & KEAMANAN SHIFT:\n- Shift Pagi: Buka pintu, nyalakan lampu etalase, sapu-pel lantai, lap kaca kasir, dan siapkan uang kembalian.\n- Shift Malam: Cuci peralatan kotor, ikat dan buang sampah keluar, cabut regulator gas/listrik non-kulkas, kunci ganda, dan foto gembok terkunci di grup WA.',
      tip: 'Tempel daftar cek 5 baris yang dilaminating tepat di dekat saklar lampu utama toko.'
    },
    {
      id: 'sop-017',
      code: 'ABS-17',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Upah Karyawan Harian Lepas / Part-Time Akhir Pekan',
      summary: 'Struktur bayaran praktis untuk tenaga tambahan mahasiswa atau pekerja lepas saat toko ramai Sabtu-Minggu.',
      formulaOrRule: 'Upah bersih per shift (6-8 jam) termasuk makan, dibayar mingguan setiap Senin atau per 2 minggu',
      readyText: 'KETENTUAN TENAGA PART-TIME / HARIAN LEPAS:\nTenaga bantuan akhir pekan dibayar berdasarkan jumlah shift hadir aktual dengan tarif tetap per shift sudah termasuk uang makan. Pembayaran direkap setiap hari Minggu malam dan ditransfer setiap hari Senin siang.',
      tip: 'Membayar part-time tiap hari Senin mencegah mereka batal datang mendadak di hari Minggu.'
    },
    {
      id: 'sop-018',
      code: 'ABS-18',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Insentif Kehadiran Penuh (Zero Telat & Zero Izin Sebulan)',
      summary: 'Mengubah kebiasaan telat menjadi lomba positif antar staf lewat premi disiplin bulanan.',
      formulaOrRule: 'Premi Disiplin Rp 100.000 - Rp 150.000/bulan khusus staf dengan 100% hadir tepat waktu tanpa telat > 5 menit',
      readyText: 'BONUS DISIPLIN KEHADIRAN PENUH:\nSetiap karyawan yang selama 1 periode penuh hadir 100% sesuai jadwal tanpa izin mendadak, tanpa alpha, dan tanpa keterlambatan melebihi 5 menit berhak menerima Premi Disiplin sebesar Rp 150.000 pada slip gaji bulan tersebut.',
      tip: 'Premi kehadiran Rp 150.000 jauh lebih efektif membuat staf berangkat lebih pagi daripada omelan setiap hari.'
    },
    {
      id: 'sop-019',
      code: 'ABS-19',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Jadwal Piket Hari Libur Nasional untuk Usaha Layanan Publik',
      summary: 'Pengaturan adil bagi warung makan, apotek, minimarket, dan barbershop yang justru panen omzet saat tanggal merah.',
      formulaOrRule: 'Opsi A: Tambahan Insentif Tanggal Merah / Lembur Resmi | Opsi B: Tukar Hari Libur Pengganti (Off Pengganti) di pekan berikutnya',
      readyText: 'ATURAN JAGA TANGGAL MERAH:\nKarena usaha tetap melayani pelanggan pada hari libur nasional tertentu, jadwal piket dibagi merata bergiliran. Staf yang bertugas pada tanggal merah berhak atas Insentif Piket Hari Libur sesuai rumus lembur atau 1 hari libur pengganti pada hari biasa.',
      tip: 'Umumkan jadwal piket tanggal merah minimal 2 minggu sebelumnya agar staf bisa mengatur acara keluarga.'
    },
    {
      id: 'sop-020',
      code: 'ABS-20',
      category: 'SOP Absensi & Jam Kerja',
      title: 'Tahapan Teguran Lisan hingga Surat Peringatan (SP 1, SP 2, SP 3)',
      summary: 'Dokumentasi pembinaan karyawan yang bermasalah agar tertib administrasi dan tidak emosional.',
      formulaOrRule: 'Teguran Lisan tercatat -> SP 1 (berlaku 3 bln) -> SP 2 (tunda bonus/insentif) -> SP 3 / Pemutusan Kerja',
      readyText: 'TAHAPAN PEMBINAAN KEDISIPLINAN:\n1. Pelanggaran pertama: Pembinaan lisan empat mata dan dicatat di buku pembinaan.\n2. Pelanggaran berulang: Surat Peringatan 1 (SP 1) berlaku 3 bulan.\n3. Belum ada perbaikan: SP 2 disertai penangguhan bonus bulanan.\n4. Pelanggaran berat (pencurian kas/barang, manipulasi nota): Pemberhentian langsung.',
      tip: 'Selalu ajak bicara empat mata di ruang tertutup saat memberi teguran; jangan pernah mempermalukan karyawan di depan pelanggan atau staf lain.'
    },

    // =========================================================================
    // KATEGORI 2: Aturan Kasbon & Potongan (20 Item)
    // =========================================================================
    {
      id: 'sop-021',
      code: 'KSB-01',
      category: 'Aturan Kasbon & Potongan',
      title: 'Batas Plafon Maksimal Kasbon 20% - 30% dari Gaji Pokok',
      summary: 'Aturan emas agar gaji bersih karyawan saat akhir bulan tidak habis terpotong utang hingga membuat mereka malas bekerja.',
      formulaOrRule: 'Plafon Cicilan Kasbon Maksimal per Bulan <= 20% x Gaji Pokok | Total Saldo Kasbon <= 50% x Gaji Pokok',
      readyText: 'ATURAN BATAS AMAN KASBON KARYAWAN:\nDemi menjaga kecukupan gaji bulanan keluarga karyawan, total potongan cicilan kasbon dibatasi maksimal 20% dari Gaji Pokok setiap bulan, dan total pinjaman berjalan tidak melebihi 50% dari 1 bulan Gaji Pokok.',
      tip: 'Ketika potongan kasbon melewati 35% gaji, karyawan sering merasa bekerja hanya untuk bayar utang lalu tiba-tiba menghilang.'
    },
    {
      id: 'sop-022',
      code: 'KSB-02',
      category: 'Aturan Kasbon & Potongan',
      title: 'Dilarang Keras Ambil Kasbon Langsung dari Laci Kasir Harian',
      summary: 'Memisahkan 100% uang omzet harian toko dari pencairan pinjaman karyawan.',
      formulaOrRule: 'Semua kasbon hanya dicairkan lewat transfer/kas pemilik setiap tanggal 15, BUKAN ambil tunai dari laci kasir penjualan',
      readyText: 'LARANGAN AMBIL KASBON DARI LACI KASIR:\nKasir dan seluruh karyawan dilarang keras mengambil uang kasbon dari laci penjualan harian maupun menyelipkan kertas bon di laci. Seluruh pengajuan kasbon hanya diproses langsung oleh Pemilik Usaha melalui transfer bank.',
      tip: 'Kertas bon kecil di dalam laci kasir adalah sumber kebocoran kas nomor satu di toko kelontong, bengkel, dan warung makan.'
    },
    {
      id: 'sop-023',
      code: 'KSB-03',
      category: 'Aturan Kasbon & Potongan',
      title: 'Syarat Masa Kerja Minimal 6 Bulan untuk Fasilitas Kasbon',
      summary: 'Melindungi modal usaha dari risiko kasbon macet pada karyawan yang belum teruji.',
      formulaOrRule: 'Masa kerja < 6 bulan: Kasbon belum dibuka | Masa kerja >= 6 bulan & rekam jejak disiplin baik: Berhak ajukan kasbon',
      readyText: 'SYARAT MASA KERJA PENGAJUAN KASBON:\nFasilitas pinjaman sementara (kasbon tanpa bunga) hanya diberikan kepada karyawan tetap yang telah bekerja minimal 6 bulan penuh dengan catatan kehadiran yang baik.',
      tip: 'Jika staf baru (<6 bulan) benar-benar butuh dana darurat hari ini, tawarkan pencairan upah hari kerja yang sudah dijalani minggu itu (gaji berjalan), bukan utang di muka.'
    },
    {
      id: 'sop-024',
      code: 'KSB-04',
      category: 'Aturan Kasbon & Potongan',
      title: 'Sistem Satu Kasbon Lunas Dulu Baru Boleh Ajukan Lagi',
      summary: 'Mencegah kasbon gali lubang tutup lubang yang terus membengkak sepanjang tahun.',
      formulaOrRule: 'Saldo Kasbon Berjalan wajib Rp 0 sebelum pengajuan kasbon berikutnya dapat diproses',
      readyText: 'PRINSIP SATU PINJAMAN BERJALAN:\nKaryawan yang masih memiliki sisa cicilan kasbon aktif belum dapat mengajukan kasbon tambahan (top-up) sebelum cicilan sebelumnya lunas 100% pada slip gaji.',
      tip: 'Tampilkan sisa saldo kasbon secara transparan pada catatan slip gaji tiap bulan agar karyawan tahu persis kapan utangnya lunas.'
    },
    {
      id: 'sop-025',
      code: 'KSB-05',
      category: 'Aturan Kasbon & Potongan',
      title: 'Jadwal Pengajuan Kasbon Hanya 1 Tanggal Tetap (Tanggal 14-15)',
      summary: 'Menghilangkan gangguan chat pinjam uang hampir setiap malam kepada pemilik usaha.',
      formulaOrRule: 'Jendela pengajuan: Tanggal 13-14 | Pencairan serentak: Tanggal 15 siang',
      readyText: 'JADWAL PENGAJUAN KASBON TENGAH BULAN:\nPengajuan kasbon rutin hanya dibuka satu kali setiap bulan pada tanggal 13-14 dan dicairkan serentak pada tanggal 15. Di luar tanggal tersebut, pengajuan hanya dilayani untuk kondisi darurat medis yang dapat dibuktikan.',
      tip: 'Dengan jadwal tunggal tanggal 15, arus kas usaha jauh lebih terencana dan tidak mengganggu uang belanja stok barang.'
    },
    {
      id: 'sop-026',
      code: 'KSB-06',
      category: 'Aturan Kasbon & Potongan',
      title: 'Pagu Anggaran Total Kasbon Usaha Maksimal 5% dari Kas Cadangan',
      summary: 'Membatasi total uang pemilik yang dipinjamkan ke seluruh staf agar belanja HPP barang dagangan tidak terganggu.',
      formulaOrRule: 'Total seluruh kasbon tim aktif <= Rp 3.000.000 (atau maks 5% kas cadangan operasional toko)',
      readyText: 'KUOTA ANGGARAN KASBON TIM:\nUsaha menyediakan plafon dana kasbon kolektif terbatas setiap bulannya agar perputaran belanja bahan baku dan barang dagangan tetap aman. Bila kuota kasbon tim bulan ini sudah penuh, pengajuan baru masuk antrean bulan depan.',
      tip: 'Alasan "kuota plafon kasbon tim bulan ini sudah penuh" sangat sopan dan objektif ketika Anda perlu menolak pinjaman tanpa menyinggung perasaan staf.'
    },
    {
      id: 'sop-027',
      code: 'KSB-07',
      category: 'Aturan Kasbon & Potongan',
      title: 'Formulir Berita Acara Kasbon & Kuasa Potong Gaji Otomatis',
      summary: 'Bukti tertulis singkat yang ditandatangani karyawan sebelum dana kasbon ditransfer.',
      formulaOrRule: 'Memuat Nominal Pinjaman, Tenor Cicilan (1-3 bln), Nominal Potong/Bln, dan Klausul Pelunasan bila Resign',
      readyText: 'SURAT PERNYATAAN KASBON KARYAWAN:\nSaya yang bertanda tangan di bawah ini menyatakan telah menerima pinjaman kasbon tanpa bunga sebesar Rp [Nominal] dari [Nama Usaha]. Saya menyetujui pemotongan gaji otomatis sebesar Rp [Cicilan]/bulan selama [Tenor] bulan, serta bersedia melunasi sisa saldo penuh dari hak gaji terakhir apabila mengundurkan diri sebelum cicilan selesai.',
      tip: 'Foto bukti tanda tangan dan bukti transfer bank dalam satu folder khusus agar tidak ada sengketa jumlah sisa cicilan.'
    },
    {
      id: 'sop-028',
      code: 'KSB-08',
      category: 'Aturan Kasbon & Potongan',
      title: 'Tenor Maksimal Cicilan Kasbon 3 Bulan untuk Skala UMKM',
      summary: 'Menjaga perputaran kas tetap pendek dan menurunkan risiko gagal bayar.',
      formulaOrRule: 'Kasbon <= Rp 500.000: Lunas 1x gajian | Kasbon Rp 500.001 - Rp 1.500.000: Cicil maksimal 2-3x gajian',
      readyText: 'KETENTUAN TENOR CICILAN KASBON:\n- Pinjaman s/d Rp 500.000 dipotong lunas pada gajian akhir bulan berjalan.\n- Pinjaman di atas Rp 500.000 s/d Rp 1.500.000 dicicil merata maksimal 3 kali periode gajian tanpa bunga.',
      tip: 'Hindari memberi pinjaman dengan tenor 10-12 bulan di usaha kecil karena tingkat pergantian karyawan sektor ritel dan kuliner cukup cepat.'
    },
    {
      id: 'sop-029',
      code: 'KSB-09',
      category: 'Aturan Kasbon & Potongan',
      title: 'Aturan Belanja Barang/Makanan Toko oleh Karyawan Sendiri',
      summary: 'Mencegah karyawan mengambil minuman, rokok, atau sembako toko dengan sistem catat suka-suka.',
      formulaOrRule: 'Wajib diinput di POS/nota khusus Karyawan dengan diskon staf (mis. harga HPP + 5%), plafon maks Rp 200.000/bulan potong gaji',
      readyText: 'PROSEDUR BELANJA PRODUK TOKO OLEH STAF:\nSetiap pengambilan barang dagangan atau menu untuk konsumsi pribadi di luar jatah makan wajib diinput melalui kasir dan dicetak struknya oleh rekan kerja lain (bukan menginput sendiri). Nota dikumpulkan pada map khusus staf dengan batas maksimal Rp 200.000/bulan untuk dipotong saat gajian.',
      tip: 'Larang staf menginput transaksi belanjanya sendiri; wajib diinput oleh kasir/rekan lain atau difoto ke grup WA saat barang diambil.'
    },
    {
      id: 'sop-030',
      code: 'KSB-10',
      category: 'Aturan Kasbon & Potongan',
      title: 'Tanggung Jawab Selisih Kasir Kurang (Shortage) vs Kasir Lebih',
      summary: 'Cara adil menangani selisih uang laci kasir harian agar kasir ekstra teliti saat memberi kembalian.',
      formulaOrRule: 'Toleransi selisih receh <= Rp 2.000/hari | Selisih kurang > Rp 2.000 menjadi tanggung jawab petugas kasir shift tersebut; uang lebih masuk kas koreksi toko',
      readyText: 'ATURAN SELISIH HITUNG KASIR:\n1. Setiap akhir shift, uang tunai dihitung bersama laporan penjualan.\n2. Apabila uang fisik kurang lebih dari Rp 2.000 dibanding catatan transaksi tunai, kekurangan dicatat atas nama pemegang laci shift tersebut untuk direkonsiliasi atau dipotong akhir bulan.\n3. Apabila terdapat kelebihan uang, wajib dicatat sebagai Kas Lebih untuk cadangan klaim pelanggan yang salah kembalian.',
      tip: 'Sediakan Tunjangan Risiko Kasir Rp 100.000/bulan khusus pemegang laci kasir; jika sebulan penuh nol selisih, tunjangan itu utuh menjadi miliknya!'
    },
    {
      id: 'sop-031',
      code: 'KSB-11',
      category: 'Aturan Kasbon & Potongan',
      title: 'Ganti Rugi Kerusakan Alat atau Barang Akibat Kelalaian Jelas',
      summary: 'Membedakan risiko aus normal usaha dengan kecerobohan berulang saat bekerja.',
      formulaOrRule: 'Rusak aus normal pemakaian: 100% beban toko | Lalai melanggar SOP jelas: Ganti 50% harga pokok barang dicicil ringan',
      readyText: 'KETENTUAN KERUSAKAN ALAT & BARANG:\nKerusakan peralatan akibat usia pakai normal sepenuhnya ditanggung usaha. Namun kerusakan barang pelanggan atau alat kerja akibat melanggar SOP secara nyata (misalnya pakaian luntur karena tidak dipisah warna di laundry) dikenakan tanggung jawab penggantian 50% nilai ganti rugi yang dicicil ringan.',
      tip: 'Jangan membebankan 100% harga jual ke karyawan karena membuat mereka menyembunyikan barang rusak daripada jujur melapor.'
    },
    {
      id: 'sop-032',
      code: 'KSB-12',
      category: 'Aturan Kasbon & Potongan',
      title: 'Perhitungan Iuran BPJS Ketenagakerjaan & Kesehatan Skala UMKM',
      summary: 'Rincian persentase standar iuran BPJS yang ditanggung pemberi kerja vs dipotong dari slip gaji staf.',
      formulaOrRule: 'JKK (0,24%) + JKM (0,30%) ditanggung usaha (~Rp 13rb-18rb/org) | JHT bila ikut: 3,7% usaha & 2% potong gaji karyawan',
      readyText: 'INFORMASI PERLINDUNGAN BPJS KARYAWAN:\nProgram Jaminan Kecelakaan Kerja (JKK) dan Jaminan Kematian (JKM) didaftarkan untuk perlindungan kerja selama bertugas dan perjalanan pergi-pulang kerja. Rincian porsi iuran yang dipotong dari karyawan tercantum transparan pada kolom Potongan BPJS di slip gaji.',
      tip: 'Paket dasar JKK + JKM BPJS Ketenagakerjaan biayanya sangat terjangkau (sekitar Rp 16.800/bulan per orang) namun melindungi pemilik UMKM jika staf mengalami kecelakaan saat antar barang.'
    },
    {
      id: 'sop-033',
      code: 'KSB-13',
      category: 'Aturan Kasbon & Potongan',
      title: 'Batas Total Seluruh Potongan Gaji Maksimal 40% (Aturan Perlindungan Upah)',
      summary: 'Menjaga kepatuhan agar total potongan kasbon, denda telat, dan iuran tidak pernah memangkas separuh gaji.',
      formulaOrRule: 'Total Potongan (Kasbon + Absen + Lainnya) <= 40% dari Total Pendapatan Gaji bulan tersebut',
      readyText: 'BATAS MAKSIMUM PEMOTONGAN SLIP GAJI:\nSesuai prinsip perlindungan upah, jumlah keseluruhan potongan pada satu periode slip gaji tidak boleh melebihi 40% dari penghasilan bulanan karyawan. Jika terdapat sisa kewajiban di atas batas tersebut, sisanya dijadwalkan ulang ke bulan berikutnya.',
      tip: 'GajiKas Studio otomatis memberi tanda peringatan bila rasio kasbon dan potongan staf terlalu tinggi.'
    },
    {
      id: 'sop-034',
      code: 'KSB-14',
      category: 'Aturan Kasbon & Potongan',
      title: 'Larangan Potong THR untuk Cicilan Kasbon Tanpa Kesepakatan Awal',
      summary: 'Mencegah kesalahpahaman menjelang Lebaran/hari raya ketika karyawan mengharapkan THR utuh untuk keluarga.',
      formulaOrRule: 'THR dibayarkan terpisah utuh; cicilan kasbon tetap memotong Gaji Bulanan reguler kecuali disepakati tertulis',
      readyText: 'KETENTUAN PENCAIRAN THR & CICILAN KASBON:\nTunjangan Hari Raya (THR) Keagamaan dibayarkan sesuai hak masa kerja tanpa pemotongan cicilan kasbon reguler, kecuali karyawan sendiri yang meminta pelunasan dipercepat secara tertulis.',
      tip: 'Pisahkan tanggal transfer THR (H-10 Lebaran) dengan tanggal transfer Gaji Bulanan agar pembukuan kas tetap rapi.'
    },
    {
      id: 'sop-035',
      code: 'KSB-15',
      category: 'Aturan Kasbon & Potongan',
      title: 'Jaminan Seragam & Alat Kerja (Deposit Dikembalikan Saat Lulus/Keluar Baik)',
      summary: 'Mengatasi masalah seragam toko atau apron yang baru dibagikan langsung hilang ketika staf keluar sebulan kemudian.',
      formulaOrRule: '2 stel seragam gratis setelah lulus 3 bulan; jika keluar < 3 bulan tanpa mengembalikan seragam layak, potong biaya pengganti',
      readyText: 'INVENTARIS SERAGAM & ATRIBUT KERJA:\nSetiap karyawan dipinjamkan 2 stel seragam kerja resmi milik usaha. Apabila karyawan mengundurkan diri, seragam yang telah dicuci bersih wajib dikembalikan saat pengambilan gaji terakhir.',
      tip: 'Catat ukuran dan jumlah seragam pada tanda terima inventaris di hari pertama masuk kerja.'
    },
    {
      id: 'sop-036',
      code: 'KSB-16',
      category: 'Aturan Kasbon & Potongan',
      title: 'Penanganan Permintaan Gaji Dibayar Mingguan vs Bulanan',
      summary: 'Menyusun transisi sehat dari bayaran mingguan ke sistem uang makan mingguan + gaji pokok bulanan.',
      formulaOrRule: 'Uang Makan & Transport boleh cair tiap Sabtu sore; Gaji Pokok + Bonus cair tetap setiap akhir bulan',
      readyText: 'SKEMA PENCAIRAN UANG MAKAN MINGGUAN & GAJI BULANAN:\nUntuk membantu kebutuhan harian tim, Tunjangan Makan & Transport dibayarkan setiap hari Sabtu sore sesuai jumlah hari hadir minggu tersebut, sedangkan Gaji Pokok, Lembur, dan Bonus dibayarkan setiap akhir bulan beserta Slip Gaji Resmi.',
      tip: 'Skema hibrida ini sangat disukai pekerja bengkel, konveksi, dan laundry sehingga angka pengajuan kasbon turun drastis hingga 80%!'
    },
    {
      id: 'sop-037',
      code: 'KSB-17',
      category: 'Aturan Kasbon & Potongan',
      title: 'Larangan Pinjam-Meminjam Uang Antar Karyawan di Tempat Kerja',
      summary: 'Menjaga suasana kerja tim tetap rukun tanpa konflik tagih-menagih utang pribadi saat melayani pembeli.',
      formulaOrRule: 'Transaksi utang pribadi antar staf di lingkungan kerja tidak diperkenankan dan bukan tanggung jawab manajemen',
      readyText: 'ETIKA KEUANGAN ANTAR REKAN KERJA:\nDemi menjaga kekompakan dan kenyamanan kerja tim, karyawan dilarang melakukan pinjam-meminjam uang pribadi, arisan berisiko, atau menagih piutang pribadi di lingkungan jam kerja.',
      tip: 'Banyak karyawan bagus tiba-tiba resign hanya karena malu ditagih utang pribadi oleh seniornya di toko.'
    },
    {
      id: 'sop-038',
      code: 'KSB-18',
      category: 'Aturan Kasbon & Potongan',
      title: 'Dana Darurat Sosial Tim (Kotak Kebersamaan Sukarela Tanpa Utang)',
      summary: 'Alternatif santunan jenguk staf sakit atau musibah ringan tanpa mencampuradukkan kas operasional usaha.',
      formulaOrRule: 'Kontribusi pemilik Rp 100.000 - Rp 200.000/bulan di amplop sosial terpisah untuk jenguk staf/keluarga sakit',
      readyText: 'DANA SOSIAL KEBERSAMAAN TIM:\nUsaha menyisihkan dana sosial khusus setiap bulan untuk santunan kunjungan sakit, kelahiran, atau duka cita anggota tim. Dana ini bersifat bantuan kekeluargaan dan bukan pinjaman kasbon.',
      tip: 'Mencatat pengeluaran santunan ini di pos Biaya Operasional Lain-lain menjaga Buku Kas tetap akurat serupiah pun.'
    },
    {
      id: 'sop-039',
      code: 'KSB-19',
      category: 'Aturan Kasbon & Potongan',
      title: 'Rekonsiliasi Sisa Kasbon pada Slip Gaji Setiap Bulan',
      summary: 'Format pencatatan cicilan ke-berapa pada slip gaji agar tidak pernah lupa potong atau kelebihan potong.',
      formulaOrRule: 'Format catatan: Potongan Kasbon Rp 200.000 (Cicilan ke-2 dari 3, Sisa Saldo Rp 200.000)',
      readyText: 'TRANSPARANSI POTONGAN SLIP GAJI:\nSetiap potongan kasbon yang tertera di slip gaji selalu disertai rincian cicilan berjalan. Karyawan berhak memeriksa kesesuaian nominal potongan sebelum menandatangani tanda terima gaji.',
      tip: 'Kirim Kartu Slip Gaji Digital (.PNG) lewat WhatsApp pribadi masing-masing karyawan, jangan pernah kirim di grup umum!'
    },
    {
      id: 'sop-040',
      code: 'KSB-20',
      category: 'Aturan Kasbon & Potongan',
      title: 'Prosedur Pelunasan Akhir (Clearance) Saat Karyawan Berhenti Bekerja',
      summary: 'Urutan cek inventaris, kunci toko, akun admin HP, dan sisa kasbon sebelum transfer gaji penutup.',
      formulaOrRule: 'Gaji Hari Kerja Terakhir + Lembur - Sisa Saldo Kasbon = Nilai Transfer Penutup setelah kunci & seragam kembali',
      readyText: 'DAFTAR CEK PENYELESAIAN AKHIR KERJA:\n1. Pengembalian kunci pintu/laci, kartu akses, dan 2 stel seragam.\n2. Logout akun kasir/marketplace dan serah-terima HP operasional.\n3. Perhitungan prorata hari kerja berjalan dikurangi sisa saldo kasbon yang belum lunas.\n4. Penandatanganan bukti terima gaji akhir dan surat keterangan kerja.',
      tip: 'Segera ganti PIN aplikasi kasir dan password Wi-Fi admin setiap kali ada pergantian staf pemegang kasir.'
    },

    // =========================================================================
    // KATEGORI 3: Skema Bonus & Komisi Tim (20 Item)
    // =========================================================================
    {
      id: 'sop-041',
      code: 'BNS-01',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bonus Target Omzet Bertingkat Toko Ritel & Warung Makan',
      summary: 'Membuat seluruh staf semangat menawarkan menu tambahan tanpa menaikkan beban gaji tetap saat toko sepi.',
      formulaOrRule: 'Omzet >= Target Dasar (100%): Bonus Tim 1,5% dari selisih lebih | Omzet >= 120% Target: Bonus Tim 2,5% dari selisih lebih',
      readyText: 'SKEMA BONUS TEMBUS TARGET OMZET BULANAN:\nApabila total omzet bersih toko melewati Target Dasar Rp [Target] dalam satu bulan, manajemen membagikan kolam bonus sebesar 2% dari selisih kelebihan omzet untuk dibagi proporsional kepada seluruh staf aktif yang hadir >= 24 hari.',
      tip: 'Selalu hitung bonus dari kelebihan di atas titik impas (Break-Even), sehingga bonus hanya keluar saat pemilik benar-benar sudah untung.'
    },
    {
      id: 'sop-042',
      code: 'BNS-02',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Komisi Jasa Per Kepala untuk Kapster Barbershop & Terapis Salon',
      summary: 'Rumus bagi hasil sehat antara gaji pokok pengaman dan komisi per pelanggan yang dilayani.',
      formulaOrRule: 'Gaji Pokok Tetap + Komisi Rp 5.000 - Rp 8.000 per kepala cukur + Komisi 10% penjualan pomade/vitamin rambut',
      readyText: 'KOMISI LAYANAN & PRODUK KAPSTER:\nSelain Gaji Pokok dan Uang Makan Harian, setiap kapster memperoleh:\n- Komisi layanan Rp 6.000 per pelanggan pangkas reguler.\n- Komisi Rp 10.000 untuk paket grooming lengkap/semir.\n- Komisi 10% dari setiap produk perawatan rambut yang berhasil direkomendasikan di kasir.',
      tip: 'Kombinasi Gaji Pokok + Komisi membuat kapster tidak kabur saat musim hujan sepi, namun tetap giat kejar pelanggan saat akhir pekan.'
    },
    {
      id: 'sop-043',
      code: 'BNS-03',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bagi Hasil Jasa Servis Mekanik Bengkel Motor & Mobil',
      summary: 'Membedakan margin penjualan suku cadang (milik bengkel) dengan ongkos jasa pasang/servis (dibagi dengan mekanik).',
      formulaOrRule: 'Gaji Pokok + Uang Makan + 20% s/d 30% dari Ongkos Jasa Servis Murni (di luar harga oli & sparepart)',
      readyText: 'INSENTIF JASA SERVIS MEKANIK:\nSetiap nota pengerjaan servis mencantumkan pemisahan harga suku cadang dan ongkos jasa. Mekanik pelaksana menerima insentif 25% dari total ongkos jasa servis yang dikerjakan tuntas tanpa komplain garansi ulang dalam 7 hari.',
      tip: 'Syarat "tanpa klaim garansi ulang 7 hari" memastikan mekanik bekerja teliti dan tidak asal cepat selesai.'
    },
    {
      id: 'sop-044',
      code: 'BNS-04',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Premi Produktivitas Kiloan untuk Bagian Setrika & Lipat Laundry',
      summary: 'Menghilangkan tumpukan cucian telat selesai saat orderan laundry melonjak sehabis liburan.',
      formulaOrRule: 'Kuota dasar harian: 35 kg/hari sudah termasuk Gaji Pokok | Kelebihan di atas 35 kg dibayar premi Rp 600 - Rp 800 per kg',
      readyText: 'PREMI KELEBIHAN KUOTA SETRIKA RAPI:\nTarget kerja standar bagian setrika uap dan lipat adalah 35 kg per shift. Setiap kilogram cucian rapi di atas 35 kg pada hari tersebut dicatat di kartu produksi dan mendapatkan tambahan premi Rp 750/kg tanpa komplain kusut/tertukar.',
      tip: 'Tetapkan kuota dasar harian dulu sebelum menghitung premi per kilo agar karyawan tidak mendapat bayaran ganda untuk pekerjaan dasar.'
    },
    {
      id: 'sop-045',
      code: 'BNS-05',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Insentif Up-Selling Paket Tambahan di Kasir Kafe & Kuliner',
      summary: 'Melatih kasir ramah menawarkan upgrade ukuran cup, ekstra topping, atau camilan pendamping.',
      formulaOrRule: 'Insentif Rp 500 - Rp 1.000 per item menu pendamping/add-on yang tercatat di laporan POS kasir',
      readyText: 'PROGRAM INSENTIF TAWARKAN MENU PENDAMPING:\nKasir wajib menawarkan 1 pilihan tambahan sopan di akhir pesanan ("Mau sekalian tambah es teh jumbo atau tahu crispy hangatnya, Kak?"). Setiap penjualan item add-on terhitung poin insentif Rp 750 untuk kolam bonus tim shift.',
      tip: 'Satu kalimat tawar sopan di kasir rata-rata menaikkan nilai struk pelanggan sebesar 12% sampai 18%.'
    },
    {
      id: 'sop-046',
      code: 'BNS-06',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bonus Nol Selisih Stok Opname Bulanan (Anti Barang Hilang)',
      summary: 'Membuat seluruh penjaga toko ikut saling mengawasi barang rawan hilang seperti rokok, susu, oli, dan kosmetik.',
      formulaOrRule: 'Kolam Bonus Rp 300.000/toko dibagi rata tim jika selisih stok opname bulanan < 0,15% dari omzet',
      readyText: 'BONUS JAGA STOK AMAN (ZERO SHRINKAGE):\nApabila hasil hitung fisik stok opname akhir bulan menunjukkan tingkat kehilangan/selisih barang di bawah 0,15%, seluruh staf toko berhak menerima pembagian Bonus Jaga Stok sebesar Rp 300.000.',
      tip: 'Biaya memberi bonus Rp 300.000 jauh lebih murah dibanding kehilangan 2 slop rokok atau 5 botol oli setiap bulan.'
    },
    {
      id: 'sop-047',
      code: 'BNS-07',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Insentif Pengantaran Tepat Waktu per Titik untuk Kurir Lokal',
      summary: 'Menggabungkan gaji pokok kurir dengan insentif jumlah titik pengantaran berhasil (POD foto penerima).',
      formulaOrRule: 'Kuota dasar 20 titik/hari termasuk gaji | Titik ke-21 dst mendapat insentif Rp 2.000 - Rp 3.000 per paket terkirim sukses',
      readyText: 'SKEMA INSENTIF TITIK ANTAR KURIR:\nSetiap kurir memiliki kuota pengantaran dasar 20 alamat per hari kerja. Pengantaran sukses di atas titik ke-20 (dibuktikan foto serah-terima paket dan pelunasan uang COD tepat hari yang sama) mendapatkan insentif Rp 2.500 per titik.',
      tip: 'Wajibkan setoran uang tunai COD lunas sore itu juga sebagai syarat cairnya poin insentif kurir.'
    },
    {
      id: 'sop-048',
      code: 'BNS-08',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Premi Kualitas Jahit & Sablon Nol Reject (Konveksi)',
      summary: 'Mencegah operator produksi kejar kuantitas potongan tetapi banyak jahitan miring atau sablon meleset.',
      formulaOrRule: 'Bonus Kualitas Rp 200.000/bulan bila tingkat cacat produksi (reject) < 1% dari total pcs pesanan',
      readyText: 'PREMI KUALITAS PRODUKSI LOLOS QC:\nTim jahit dan sablon yang menyelesaikan target pesanan tepat tenggat dengan angka perbaikan/reject di bawah 1% hasil pemeriksaan QC menerima Premi Kualitas sebesar Rp 200.000 pada slip gaji.',
      tip: 'Satu kaos sablon gagal bernilai Rp 45.000-Rp 60.000 HPP; mencegah 5 kaos gagal saja sudah menutup biaya premi kualitas.'
    },
    {
      id: 'sop-049',
      code: 'BNS-09',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Komisi Penjualan Produk Margin Tinggi di Apotek & Toko Kosmetik',
      summary: 'Mengarahkan staf merekomendasikan vitamin, suplemen, dan alat kesehatan bermargin sehat sesuai kebutuhan pembeli.',
      formulaOrRule: 'Produk Kategori Hijau (Margin >= 25%): Insentif 2% - 3% per item terjual tercatat nama petugas',
      readyText: 'INSENTIF EDUKASI VITAMIN & ALAT KESEHATAN:\nPetugas yang memberikan konsultasi ramah dan melayani penjualan produk kategori suplemen/alat kesehatan bertanda khusus memperoleh poin insentif 2,5% yang direkap otomatis setiap tutup buku bulanan.',
      tip: 'Tetap utamakan ketepatan indikasi kebutuhan pelanggan agar kepercayaan jangka panjang warga sekitar terjaga.'
    },
    {
      id: 'sop-050',
      code: 'BNS-10',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bonus Ulasan Bintang 5 Google Maps dari Pelanggan Asli',
      summary: 'Cara murah menaikkan peringkat pencarian lokal bengkel, laundry, salon, dan rumah makan tanpa iklan mahal.',
      formulaOrRule: 'Insentif Rp 5.000 per ulasan positif asli pelanggan yang menyebut pelayanan ramah staf (maks 20 ulasan/bln)',
      readyText: 'PROGRAM APRESIASI PELAYANAN RAMAH:\nStaf dapat mengarahkan pelanggan puas untuk memindai QR Google Profil Bisnis di meja kasir. Setiap ulasan asli pelanggan yang mencerminkan pelayanan memuaskan mengumpul ke kolam apresiasi tim sebesar Rp 5.000 per ulasan.',
      tip: 'Dilarang membuat ulasan palsu dari HP sendiri karena mudah terdeteksi Google; cukup minta sopan ke pelanggan langganan yang puas.'
    },
    {
      id: 'sop-051',
      code: 'BNS-11',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Tunjangan Jabatan Penanggung Jawab Kunci & Tutup Buku (Kepala Toko)',
      summary: 'Memberi kompensasi sepadan bagi 1 orang staf senior yang dipercaya memegang kunci toko dan rekap setoran.',
      formulaOrRule: 'Tunjangan Tanggung Jawab Rp 250.000 - Rp 400.000/bulan melekat selama memegang amanah Kepala Outlet',
      readyText: 'TUNJANGAN KOORDINATOR OUTLET:\nStaf yang ditunjuk sebagai Penanggung Jawab Outlet menerima Tunjangan Jabatan bulanan atas tugas pengawasan jadwal tim, pemeriksaan stok harian, serta verifikasi setoran kasir sebelum dikirim ke rekening pemilik.',
      tip: 'Tunjangan jabatan melekat pada tugasnya (bukan gaji pokok), sehingga bila suatu saat dipindah posisi tidak menimbulkan masalah struktur upah.'
    },
    {
      id: 'sop-052',
      code: 'BNS-12',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Insentif Penghematan Listrik, Gas & Bahan Habis Pakai',
      summary: 'Mengajak tim dapur, laundry, dan kafe mematikan AC/kompor/lampu yang tidak terpakai tanpa harus diawasi CCTV terus.',
      formulaOrRule: 'Jika rasio biaya listrik+gas+plastik turun di bawah patokan historis (mis. < 6% omzet), 25% penghematannya masuk kas makan bersama tim',
      readyText: 'BONUS HEMAT ENERGI & BAHAN PAKAI:\nApabila pemakaian listrik, LPG, dan bahan habis pakai bulan ini lebih efisien dibanding standar rasio bulanan tanpa mengurangi kualitas takaran pelanggan, seperempat nilai penghematannya diberikan sebagai bonus kas makan bersama tim.',
      tip: 'Pasang patokan takaran sendok/gelas ukur untuk deterjen laundry dan sirup kafe agar HPP selalu konsisten.'
    },
    {
      id: 'sop-053',
      code: 'BNS-13',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Komisi Admin Chat WhatsApp / Sosial Media yang Closing Order',
      summary: 'Rumus insentif admin pembalas pesan untuk usaha katering, konveksi custom, parcel, dan grosir.',
      formulaOrRule: 'Balas cepat < 5 menit + Konversi lunas DP: Komisi Rp 3.000 - Rp 10.000 per nota lunas sesuai nilai transaksi',
      readyText: 'INSENTIF ADMIN PENJUALAN CHAT:\nAdmin pelayanan WhatsApp wajib merespons chat masuk maksimal dalam 5 menit pada jam kerja. Setiap pesanan yang terkonfirmasi lunas pembayaran tercatat mendapatkan komisi bertingkat sesuai kategori nilai nota.',
      tip: 'Hitung komisi hanya dari nota yang sudah LUNAS dibayar pelanggan, bukan dari pesanan yang baru tanya atau belum transfer.'
    },
    {
      id: 'sop-054',
      code: 'BNS-14',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Pembagian Uang Tip Pelanggan yang Adil antara Depan & Belakang',
      summary: 'Mencegah kecemburuan antara kasir/pramusaji di depan dengan juru masak/pencuci di dapur belakang.',
      formulaOrRule: 'Kotak Tip Bersama dibuka tiap akhir pekan: 60% staf pelayanan depan & 40% staf produksi/dapur belakang',
      readyText: 'ATURAN KOTAK TIP BERSAMA:\nSeluruh uang tip sukarela dari pelanggan dimasukkan ke Kotak Tip Terkunci di samping kasir dan dibuka bersama setiap hari Sabtu malam untuk dibagikan dengan proporsi 60% tim layanan depan dan 40% tim dapur/produksi.',
      tip: 'Kejelasan pembagian tip membuat juru masak di belakang tetap bersemangat menyajikan pesanan cepat dan enak.'
    },
    {
      id: 'sop-055',
      code: 'BNS-15',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bonus Retensi Masa Kerja 1 Tahun & 2 Tahun (Loyalitas Staf Inti)',
      summary: 'Menekan biaya rekrutmen dan salah kerja akibat keluar-masuk karyawan terampil.',
      formulaOrRule: 'Genap 12 bulan kerja baik: Apresiasi Loyalitas Rp 300.000 | Genap 24 bulan: Rp 600.000 + penyesuaian gaji pokok',
      readyText: 'APRESIASI MASA KERJA TAHUNAN:\nSebagai penghargaan atas kesetiaan dan kontribusi kerja, karyawan yang genap mencapai masa kerja penuh 1 tahun dan 2 tahun dengan penilaian kinerja baik menerima Bonus Loyalitas pada slip gaji bulan ulang tahun kerjanya.',
      tip: 'Melatih 1 karyawan baru sampai mahir rata-rata memakan waktu 1-2 bulan; menjaga staf jujur tetap betah jauh lebih menguntungkan.'
    },
    {
      id: 'sop-056',
      code: 'BNS-16',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Insentif Cuci Gudang Stok Lama (Deadstock Clearance)',
      summary: 'Mengubah stok barang lambat laku menjadi uang tunai kembali dengan bantuan penawaran aktif staf toko.',
      formulaOrRule: 'Daftar barang pita kuning (stok > 90 hari): Komisi khusus Rp 2.000 - Rp 5.000 per pcs bagi staf yang berhasil menjualnya',
      readyText: 'INSENTIF PENJUALAN STOK PRIORITAS:\nBarang pada daftar Prioritas Keluar (label kuning) memiliki komisi tunai langsung per pcs terjual. Staf didorong menawarkan produk tersebut sebagai paket hemat kepada pelanggan yang relevan.',
      tip: 'Uang modal yang macet di rak berdebu tidak menghasilkan apa-apa; cairkan jadi kas segar meski margin tipis agar bisa diputar ke barang laris.'
    },
    {
      id: 'sop-057',
      code: 'BNS-17',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Bonus Musim Puncak (Ramadan, Lebaran & Tahun Ajaran Baru)',
      summary: 'Menjaga tenaga dan kehadiran penuh tim saat omzet toko naik 2x lipat menjelang musim ramai.',
      formulaOrRule: 'Bonus Peak Season cair bersama gaji pasca-musim ramai khusus staf yang masuk penuh pada H-7 s/d H+3 periode puncak',
      readyText: 'INSENTIF SIAGA MUSIM RAMAI:\nSelain THR resmi, staf yang menyelesaikan jadwal kerja penuh selama pekan puncak ramai (tanpa izin mendadak pada hari krusial) berhak menerima Insentif Siaga Musim Ramai yang dibayarkan pada gajian berikutnya.',
      tip: 'Mencairkan bonus musim ramai pada gajian bulan setelah Lebaran efektif memastikan seluruh karyawan kembali masuk kerja tepat waktu sehabis mudik!'
    },
    {
      id: 'sop-058',
      code: 'BNS-18',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Batas Aman Total Gaji + Bonus Tidak Melebihi 25%-30% Omzet UMKM',
      summary: 'Rambu keuangan pemilik usaha saat merancang rumus komisi agar toko tidak besar pasak daripada tiang.',
      formulaOrRule: 'Rasio Sehat Beban Gaji Total:\n- Ritel/Minimarket: 6% - 12% dari Omzet\n- Kuliner/Kafe: 15% - 22% dari Omzet\n- Jasa (Salon/Bengkel/Laundry): 22% - 32% dari Omzet',
      readyText: 'PATOKAN RASIO BEBAN GAJI SEHAT UMKM:\nSebelum menambah karyawan baru atau menaikkan skema komisi, periksa Rasio Total Beban Gaji terhadap Omzet Kotor di Langkah 2 GajiKas Studio. Pastikan total gaji + tunjangan + bonus masih berada di zona hijau sesuai karakter margin sektor usaha.',
      tip: 'Toko ritel sembako punya margin kotor tipis (15%-22%), sehingga rasio gajinya wajib jauh lebih kecil (<10%) dibanding barbershop yang margin kotornya 80%+.'
    },
    {
      id: 'sop-059',
      code: 'BNS-19',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Insentif Rekrutmen Teman Jujur (Referral Staf Lama)',
      summary: 'Mendapatkan kandidat karyawan baru yang sudah dikenal karakternya tanpa biaya pasang iklan lowongan.',
      formulaOrRule: 'Hadiah Referral Rp 150.000 cair kepada staf pengusul apabila kandidat yang direkomendasikan lulus 3 bulan masa percobaan',
      readyText: 'BONUS REKOMENDASI KARYAWAN BARU:\nStaf tetap yang merekomendasikan calon karyawan baru yang jujur dan rajin berhak menerima insentif Rp 150.000 setelah karyawan baru tersebut berhasil lulus masa evaluasi 3 bulan penuh.',
      tip: 'Hindari menempatkan pasangan suami-istri atau kakak-adik kandung memegang bagian kasir dan bagian gudang pada shift yang sama.'
    },
    {
      id: 'sop-060',
      code: 'BNS-20',
      category: 'Skema Bonus & Komisi Tim',
      title: 'Papan Skor Target Harian Sederhana di Ruang Belakang Staf',
      summary: 'Membuat target bonus terlihat setiap hari, bukan kejutan yang baru dihitung di akhir bulan.',
      formulaOrRule: 'Target Bulanan dibagi 30 hari = Target Harian; diupdate tiap tutup toko malam di papan tulis ruang staf',
      readyText: 'PEMANTAUAN TARGET HARIAN TIM:\nKoordinator shift malam menuliskan capaian omzet harian pada papan progres internal di ruang belakang. Dengan demikian seluruh anggota tim mengetahui sisa target yang perlu dikejar bersama untuk membuka Bonus Bulanan.',
      tip: 'Jangan memajang papan angka rupiah omzet di tempat yang terbaca pengunjung umum; cukup pasang di ruang loker karyawan.'
    }
  ];

  window.__GAJIKAS_PART1 = { GAJIKAS_PRESETS, GAJIKAS_LIBRARY };
})();
(function () {
  const part2 = [
    // =========================================================================
    // KATEGORI 4: Rumus Lembur & THR (20 Item)
    // =========================================================================
    {
      id: 'sop-061',
      code: 'THR-01',
      category: 'Rumus Lembur & THR',
      title: 'Rumus Standar Upah Lembur Sejam Depnaker (1/173 x Gaji Sebulan)',
      summary: 'Acuan resmi pembagi 173 jam kerja rata-rata sebulan untuk menghitung dasar tarif lembur per jam.',
      formulaOrRule: 'Upah Dasar Sejam = (Gaji Pokok + Tunjangan Tetap) / 173',
      readyText: 'DASAR PERHITUNGAN UPAH LEMBUR RESMI:\nTarif dasar 1 jam lembur dihitung menggunakan pembagi standar 173 jam per bulan:\nUpah Sejam = Gaji Pokok Bulanan / 173.\nContoh: Gaji Pokok Rp 2.595.000 / 173 = Rp 15.000 per jam dasar.',
      tip: 'Tunjangan Makan Harian yang hanya dibayar kalau karyawan hadir termasuk Tunjangan Tidak Tetap, sehingga tidak wajib dimasukkan ke pembagi 173.'
    },
    {
      id: 'sop-062',
      code: 'THR-02',
      category: 'Rumus Lembur & THR',
      title: 'Pengali Lembur Hari Kerja Biasa (Jam Pertama 1,5x & Jam Kedua 2x)',
      summary: 'Cara menghitung tambahan lembur sore/malam setelah jam kerja normal selesai pada hari biasa.',
      formulaOrRule: 'Jam lembur ke-1 = 1,5 x (Gaji / 173) | Jam lembur ke-2 dan seterusnya = 2,0 x (Gaji / 173)',
      readyText: 'PERHITUNGAN LEMBUR HARI KERJA:\nApabila atas perintah tertulis/persetujuan pemilik karyawan bekerja melebihi jam kerja harian:\n- Jam lembur pertama dibayar 1,5 kali tarif dasar sejam.\n- Jam lembur kedua dan berikutnya dibayar 2 kali tarif dasar sejam.',
      tip: 'Di Alat Kalkulator THR & Lembur GajiKas Studio, pengali 1,5x dan 2x ini sudah dihitung otomatis tanpa perlu kalkulator manual.'
    },
    {
      id: 'sop-063',
      code: 'THR-03',
      category: 'Rumus Lembur & THR',
      title: 'Rumus Lembur pada Hari Libur Mingguan atau Tanggal Merah Resmi',
      summary: 'Perhitungan upah lembur bagi staf yang diminta masuk penuh saat jatah hari liburnya.',
      formulaOrRule: 'Sistem 6 hari kerja: 7 jam pertama = 2x tarif sejam | Jam ke-8 = 3x | Jam ke-9 s/d 10 = 4x tarif sejam',
      readyText: 'KETENTUAN LEMBUR HARI ISTIRAHAT MINGGUAN:\nKaryawan yang ditugaskan bekerja pada hari libur mingguannya tanpa hari libur pengganti menerima upah lembur hari libur sebesar 2 kali tarif sejam untuk 7 jam pertama kerja.',
      tip: 'Untuk menghemat kas di bulan sepi, gunakan skema Tukar Hari Libur Pengganti (Off Pengganti) pada hari Selasa/Rabu daripada lembur tunai.'
    },
    {
      id: 'sop-064',
      code: 'THR-04',
      category: 'Rumus Lembur & THR',
      title: 'Wajib Surat Perintah / Persetujuan Chat Sebelum Klaim Jam Lembur',
      summary: 'Mencegah karyawan sengaja mengulur-ulur pekerjaan sore hari demi mengklaim uang lembur.',
      formulaOrRule: 'Lembur sah HANYA jika disetujui Pemilik/Kepala Toko via WA sebelum jam pulang reguler berakhir',
      readyText: 'SYARAT SAH KLAIM JAM LEMBUR:\nJam kerja tambahan hanya dihitung sebagai lembur berbayar apabila terdapat instruksi atau persetujuan tertulis di grup WA sebelum jam kerja normal berakhir (misal karena pesanan membludak atau bongkar muat barang). Nongkrong di toko sehabis jam kerja tidak terhitung lembur.',
      tip: 'Satu kalimat aturan persetujuan awal ini mampu memangkas klaim lembur semu hingga separuhnya.'
    },
    {
      id: 'sop-065',
      code: 'THR-05',
      category: 'Rumus Lembur & THR',
      title: 'Kesepakatan Tarif Lembur Nominal Bulat UMKM + Ekstra Makan Malam',
      summary: 'Alternatif praktis tarif lembur bulat (di atas nilai dasar) yang mudah dipahami staf produksi & toko.',
      formulaOrRule: 'Tarif bulat per jam (misal Rp 15.000 - Rp 25.000/jam) + Jatah Makan Malam jika lembur >= 3 jam',
      readyText: 'TARIF LEMBUR PRAKTIS & JATAH MAKAN MALAM:\nUntuk kemudahan transparansi hitungan harian, jam lembur yang disetujui dibayarkan dengan tarif tetap Rp [Nominal]/jam. Apabila durasi lembur mencapai 3 jam atau lebih pada malam hari, usaha menyediakan tambahan konsumsi makan malam.',
      tip: 'Di Langkah 1 Wizard GajiKas Studio, Anda bebas memilih tombol "Otomatis Depnaker 1/173" maupun "Nominal per Jam" untuk tiap staf.'
    },
    {
      id: 'sop-066',
      code: 'THR-06',
      category: 'Rumus Lembur & THR',
      title: 'Hak THR Penuh (1x Gaji) bagi Karyawan Masa Kerja >= 12 Bulan',
      summary: 'Ketentuan Tunjangan Hari Raya bagi karyawan yang sudah mengabdi satu tahun penuh atau lebih.',
      formulaOrRule: 'Masa Kerja >= 12 bulan terus-menerus: THR = 1 x (Gaji Pokok + Tunjangan Tetap)',
      readyText: 'HAK THR MASA KERJA 1 TAHUN KE ATAS:\nKaryawan yang telah mempunyai masa kerja 12 bulan secara terus-menerus atau lebih berhak menerima Tunjangan Hari Raya (THR) Keagamaan sebesar 1 bulan Gaji Pokok (ditambah tunjangan tetap bila ada).',
      tip: 'Cukup centang kotak "Hitung THR" di Langkah 1 Wizard GajiKas Studio saat bulan Hari Raya tiba; nominalnya otomatis masuk ke slip gaji!'
    },
    {
      id: 'sop-067',
      code: 'THR-07',
      category: 'Rumus Lembur & THR',
      title: 'Rumus THR Proporsional bagi Karyawan Baru (Masa Kerja 1 - 11 Bulan)',
      summary: 'Cara tepat menghitung THR staf yang belum genap setahun agar tidak lebih bayar maupun kurang bayar.',
      formulaOrRule: 'THR Proporsional = (Jumlah Bulan Masa Kerja / 12) x 1 Bulan Gaji Pokok',
      readyText: 'PERHITUNGAN THR PROPORSIONAL STAF BARU:\nKaryawan dengan masa kerja minimal 1 bulan penuh tetapi kurang dari 12 bulan menerima THR secara proporsional:\nRumus: (Masa Kerja dalam Bulan / 12) x Gaji Pokok.\nContoh: Kerja 5 bulan dengan Gaji Pokok Rp 2.400.000 -> (5/12) x Rp 2.400.000 = Rp 1.000.000.',
      tip: 'Masa kerja di bawah 1 bulan (misal baru masuk 15 hari menjelang Lebaran) belum wajib THR proporsional, cukup beri bingkisan sembako sukarela.'
    },
    {
      id: 'sop-068',
      code: 'THR-08',
      category: 'Rumus Lembur & THR',
      title: 'Cara Menabung Cadangan THR Bulanan (8,33% Gaji Tim Tiap Bulan)',
      summary: 'Rahasia kas UMKM tetap tenang menjelang Lebaran tanpa perlu berutang atau menguras modal belanja barang.',
      formulaOrRule: 'Tabungan Wajib THR per Bulan = Total Gaji Pokok Tim / 12 (atau 8,33% disisihkan tiap tutup buku bulanan)',
      readyText: 'SOP DANA CADANGAN THR BULANAN:\nSetiap tanggal tutup buku bulanan, pemilik menyisihkan 1/12 (8,33%) dari total Gaji Pokok seluruh karyawan ke rekening kantong terpisah bernama "Cadangan THR Tim". Dengan cara ini beban 12 bulan terbagi rata ringan.',
      tip: 'Jika total gaji pokok 3 staf adalah Rp 7.500.000, cukup tabung Rp 625.000/bulan; saat H-10 Lebaran uang Rp 7.500.000 sudah siap 100% tanpa pusing!'
    },
    {
      id: 'sop-069',
      code: 'THR-09',
      category: 'Rumus Lembur & THR',
      title: 'Batas Waktu Pencairan THR Maksimal H-7 Sebelum Hari Raya',
      summary: 'Jadwal pembayaran THR agar karyawan sempat berbelanja kebutuhan mudik dan keluarga.',
      formulaOrRule: 'Wajib dibayarkan penuh (tidak dicicil) paling lambat 7 hari sebelum Hari Raya Keagamaan masing-masing karyawan',
      readyText: 'JADWAL PENCAIRAN THR KEAGAMAAN:\nTHR dibayarkan dalam bentuk uang rupiah melalui transfer/tunai dengan tanda terima slip resmi selambat-lambatnya H-7 sebelum Hari Raya Keagamaan yang dianut masing-masing karyawan.',
      tip: 'Jika Anda punya staf berbeda agama (mis. Idulfitri dan Natal), sesuaikan pencairan H-7 mengikuti hari raya masing-masing staf.'
    },
    {
      id: 'sop-070',
      code: 'THR-10',
      category: 'Rumus Lembur & THR',
      title: 'Cara Hitung THR Pekerja Harian Lepas / Borongan Konveksi & Sablon',
      summary: 'Acuan rata-rata penghasilan 12 bulan terakhir untuk menentukan dasar 1 bulan upah pekerja borongan.',
      formulaOrRule: 'Kerja >= 12 bln: Rata-rata upah bulanan 12 bulan terakhir | Kerja < 12 bln: Rata-rata upah tiap bulan selama bekerja, dikali (masa kerja/12)',
      readyText: 'PERHITUNGAN THR PEKERJA BORONGAN / HARIAN:\nBagi pekerja dengan penghasilan berubah-ubah berdasarkan hasil satuan/borongan, dasar 1 bulan upah untuk perhitungan THR diambil dari nilai rata-rata penghasilan bersih bulanan selama masa kerja berjalan (maksimal 12 bulan terakhir).',
      tip: 'Karena itu menyimpan Riwayat Laporan setiap bulan di GajiKas Studio sangat berguna saat menghitung rata-rata upah tahunan.'
    },
    {
      id: 'sop-071',
      code: 'THR-11',
      category: 'Rumus Lembur & THR',
      title: 'Pembulatan Menit Lembur (Minimal 30 Menit Penuh untuk Dihitung)',
      summary: 'Aturan rapi menghitung kelebihan menit tutup toko agar tidak ribet menghitung 7 menit atau 12 menit.',
      formulaOrRule: '< 30 menit: Masuk toleransi beres-beres tutup toko | 30 - 59 menit: Dihitung 0,5 jam | >= 60 menit: Dihitung 1 jam penuh',
      readyText: 'PEMBULATAN DURASI WAKTU LEMBUR:\nPerhitungan durasi lembur dimulai setelah melewati minimal 30 menit penuh dari jam pulang normal:\n- 30 s/d 59 menit dihitung 0,5 jam lembur.\n- 60 menit penuh dihitung 1,0 jam lembur.',
      tip: 'Jelaskan sejak hari pertama bahwa beres-beres tutup kasir 10-15 menit adalah bagian normal jam kerja shift.'
    },
    {
      id: 'sop-072',
      code: 'THR-12',
      category: 'Rumus Lembur & THR',
      title: 'Batas Maksimal Jam Lembur agar Karyawan Tidak Kelelahan & Salah Kerja',
      summary: 'Menjaga kesehatan fisik kurir, mekanik, dan operator mesin setrika uap dari kecelakaan kerja.',
      formulaOrRule: 'Maksimal anjuran lembur: 3 - 4 jam per hari atau 18 jam per minggu',
      readyText: 'BATAS AMAN DURASI LEMBUR MINGGUAN:\nDemi keselamatan kerja dan ketelitian layanan, jam lembur dibatasi maksimal 4 jam dalam sehari. Apabila volume pesanan terus melebihi kapasitas lebih dari 2 minggu berturut-turut, manajemen akan menambah tenaga part-time.',
      tip: 'Jika biaya lembur 3 staf sudah melebihi harga gaji 1 staf part-time baru, itu sinyal pasti Anda harus rekrut tenaga bantuan.'
    },
    {
      id: 'sop-073',
      code: 'THR-13',
      category: 'Rumus Lembur & THR',
      title: 'Perbedaan Gaji Pokok, Tunjangan Tetap & Tunjangan Tidak Tetap',
      summary: 'Struktur komponen slip gaji cerdas agar kewajiban lembur dan THR tetap proporsional dan sehat bagi UMKM.',
      formulaOrRule: 'Ideal UMKM: 75% Gaji Pokok + 25% Tunjangan Tidak Tetap (Makan & Transport berbasis hari hadir nyata)',
      readyText: 'STRUKTUR KOMPONEN PENGHASILAN KARYAWAN:\n1. Gaji Pokok: Dibayarkan tetap setiap bulan.\n2. Tunjangan Jabatan (bila ada): Tunjangan tetap penanggung jawab.\n3. Tunjangan Makan & Transport: Tunjangan tidak tetap yang dihitung berdasarkan jumlah hari kehadiran aktual di lokasi kerja.',
      tip: 'Komposisi 75% Gaji Pokok + 25% Tunjangan Kehadiran Harian adalah struktur paling sehat dan adil untuk skala UMKM Indonesia.'
    },
    {
      id: 'sop-074',
      code: 'THR-14',
      category: 'Rumus Lembur & THR',
      title: 'Hak THR Saat Karyawan Resign Mendekati Hari Raya',
      summary: 'Memahami aturan karyawan tetap vs kontrak apabila hubungan kerja berakhir dalam 30 hari sebelum Lebaran.',
      formulaOrRule: 'Karyawan Kontrak (PKWT) yang masa kontraknya habis sebelum Hari Raya tidak berhak THR; Karyawan Tetap yang diberhentikan < H-30 tetap berhak',
      readyText: 'KETENTUAN MASA AKTIF PENERIMA THR:\nTHR diberikan kepada karyawan yang masih berstatus aktif bekerja pada saat periode Hari Raya, dengan memperhatikan ketentuan perjanjian kerja kontrak (PKWT) maupun tetap yang berlaku.',
      tip: 'Buat perjanjian kontrak kerja tertulis 6 atau 12 bulan dengan tanggal berakhir yang jelas sehingga status hubungan kerja selalu terang.'
    },
    {
      id: 'sop-075',
      code: 'THR-15',
      category: 'Rumus Lembur & THR',
      title: 'Lembur Stok Opname Tengah Malam / Bongkar Barang Grosir',
      summary: 'Paket kompensasi khusus saat tim diminta bantu hitung gudang atau bongkar kiriman kontainer/truk.',
      formulaOrRule: 'Upah Lembur Jam Aktual + Konsumsi Makan Berat + Libur Masuk Siang (geser jam masuk 2 jam) esok paginya',
      readyText: 'PROSEDUR LEMBUR STOK OPNAME & BONGKAR BARANG:\nKegiatan stok opname raya atau bongkar barang kiriman besar di luar jam operasional dihitung sebagai jam lembur resmi, disertai penyediaan makan malam dan kelonggaran jam masuk shift pagi keesokan harinya.',
      tip: 'Memberi kelonggaran masuk 2 jam lebih siang besoknya menjaga kasir tetap segar dan tidak salah hitung uang.'
    },
    {
      id: 'sop-076',
      code: 'THR-16',
      category: 'Rumus Lembur & THR',
      title: 'Bingkisan Parcel Sembako vs Uang Tunai THR (Jangan Dicampur!)',
      summary: 'Aturan penting bahwa parcel sirup/biskuit Lebaran tidak boleh menggantikan atau mengurangi nilai uang THR.',
      formulaOrRule: 'THR Wajib = 100% Uang Rupiah | Parcel Lebaran = Apresiasi tambahan sukarela sesuai kemampuan toko',
      readyText: 'PEMISAHAN THR TUNAI & BINGKISAN HARI RAYA:\nHak THR Keagamaan dibayarkan penuh dalam bentuk uang rupiah sesuai perhitungan masa kerja. Adapun bingkisan sembako/kue Lebaran (apabila ada) merupakan tanda kasih tambahan dari pemilik usaha di luar hak THR.',
      tip: 'Jangan memotong nilai uang THR dengan alasan sudah dibelikan sembako; lebih baik beri uang THR pas sesuai rumus.'
    },
    {
      id: 'sop-077',
      code: 'THR-17',
      category: 'Rumus Lembur & THR',
      title: 'Cara Hitung Gaji Prorata Karyawan Baru Masuk di Tengah Bulan',
      summary: 'Rumus akurat menghitung gaji pertama staf yang baru mulai bekerja pada tanggal 10 atau tanggal 18.',
      formulaOrRule: 'Gaji Prorata = (Jumlah Hari Kerja Aktual / 26 Hari Kerja Standar) x Gaji Pokok + (Hari Hadir x Uang Makan Harian)',
      readyText: 'PERHITUNGAN GAJI PRORATA BULAN PERTAMA & TERAKHIR:\nBagi karyawan yang mulai bekerja atau mengakhiri masa kerja di pertengahan periode bulan, Gaji Pokok dihitung secara prorata: (Jumlah Hari Kerja Efektif yang Dijalani / 26) x Gaji Pokok Bulanan.',
      tip: 'Gunakan pembagi konsisten 26 hari (untuk usaha 6 hari kerja seminggu) atau 22 hari (untuk usaha 5 hari kerja seminggu).'
    },
    {
      id: 'sop-078',
      code: 'THR-18',
      category: 'Rumus Lembur & THR',
      title: 'Slip Gaji Khusus Periode THR (Digabung vs Dipisah dari Slip Bulanan)',
      summary: 'Kapan sebaiknya mencetak slip THR tersendiri dan kapan boleh digabung di satu slip gaji.',
      formulaOrRule: 'Jika Hari Raya jatuh tanggal 5-20: Cetak Slip THR terpisah | Jika Hari Raya jatuh tanggal 25-31: Boleh digabung 1 Slip Gaji + THR',
      readyText: 'PENCATATAN BUKTI TERIMA THR:\nSetiap pencairan THR wajib disertai bukti tanda terima atau Slip Gaji Resmi yang mencantumkan masa kerja karyawan dan nilai Terbilang Rupiah untuk ditandatangani kedua belah pihak.',
      tip: 'Di GajiKas Studio Anda bisa membuat periode khusus bernama "THR Idulfitri 2026" atau mencentang toggle THR langsung pada slip bulanan.'
    },
    {
      id: 'sop-079',
      code: 'THR-19',
      category: 'Rumus Lembur & THR',
      title: 'Insentif Buka Toko Hari ke-2 / ke-3 Lebaran (Saat Kompetitor Tutup)',
      summary: 'Strategi warung makan, bengkel, dan barbershop meraih omzet tinggi pasca-Lebaran dengan sukarelawan tim.',
      formulaOrRule: 'Tarif Piket Khusus Lebaran: Upah Harian 2x lipat dibayar tunai langsung sore hari saat tutup toko',
      readyText: 'INSENTIF KHUSUS PIKET HARI RAYA:\nBagi staf tidak mudik yang bersedia bertugas sukarela pada H+2 s/d H+4 Lebaran, manajemen memberikan Insentif Piket Lebaran sebesar 2 kali lipat upah harian ditambah jatah makan khusus yang dibayarkan langsung setiap sore.',
      tip: 'Pada H+2 Lebaran banyak warung tutup sehingga omzet bisa melonjak tajam; bayaran 2x harian tertutup sangat mudah dari omzet hari itu.'
    },
    {
      id: 'sop-080',
      code: 'THR-20',
      category: 'Rumus Lembur & THR',
      title: 'Evaluasi Kenaikan Gaji Tahunan Berdasarkan Inflasi & Laba Usaha',
      summary: 'Rumus sehat menaikkan gaji pokok tahunan staf lama tanpa membuat arus kas toko tercekik.',
      formulaOrRule: 'Kenaikan tahunan sehat: 5% - 8% (mengikuti pertumbuhan laba bersih toko & penilaian kedisiplinan)',
      readyText: 'EVALUASI PENYESUAIAN UPAH TAHUNAN:\nPeninjauan Gaji Pokok dilakukan setiap awal tahun berdasarkan 2 faktor utama: (1) Pertumbuhan laba bersih operasional usaha, dan (2) Rekam jejak kehadiran, kejujuran, serta produktivitas individu selama 12 bulan terakhir.',
      tip: 'Jika kondisi ekonomi sedang menantang dan belum bisa menaikkan gaji pokok tinggi, naikkan skema Bonus Target Omzet agar risiko tetap terkendali.'
    },

    // =========================================================================
    // KATEGORI 5: Kontrol Bocor Kas Harian (20 Item)
    // =========================================================================
    {
      id: 'sop-081',
      code: 'KAS-01',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Pisahkan Mutlak Rekening Pribadi Pemilik & Rekening Operasional Usaha',
      summary: 'Aturan pertama dan paling krusial agar uang belanja toko tidak habis terpakai kebutuhan dapur rumah tangga.',
      formulaOrRule: '1 Rekening Khusus Usaha (semua QRIS & transfer masuk ke sini) -> Pemilik ambil Gaji Pemilik tetap 1x sebulan',
      readyText: 'ATURAN PEMISAHAN REKENING USAHA:\n1. Seluruh pembayaran pelanggan non-tunai (QRIS, transfer, debit) dan setoran kasir tunai wajib masuk ke Rekening Operasional Usaha.\n2. Pemilik usaha dilarang menggesek/mentransfer belanja pribadi keluarga dari rekening usaha.\n3. Pemilik mengambil penghasilan tetap bulanan layaknya gaji direktur setiap akhir bulan.',
      tip: 'Analis kredit KUR Bank langsung menilai usaha jauh lebih profesional ketika mutasi rekening tidak tercampur belanja pribadi acak.'
    },
    {
      id: 'sop-082',
      code: 'KAS-02',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Modal Kembalian Kasir Tetap (Float Money Rp 300.000 - Rp 500.000)',
      summary: 'Cara paling cepat menghitung setoran penjualan tunai malam hari tanpa bingung mana uang modal receh.',
      formulaOrRule: 'Uang Tunai Akhir di Laci - Modal Awal Tetap (Rp 300.000) = Wajib Sama Persis dengan Penjualan Tunai Hari Itu',
      readyText: 'SOP MODAL KEMBALIAN LACI KASIR (FLOAT):\nSetiap pagi laci kasir dimulai dengan uang kembalian pas sebesar Rp 300.000 (pecahan Rp 2.000, Rp 5.000, Rp 10.000, Rp 20.000). Saat tutup toko malam, pisahkan kembali Rp 300.000 untuk modal besok; sisanya adalah 100% setoran omzet tunai bersih hari ini.',
      tip: 'Jangan pernah membiarkan uang penjualan menginap menumpuk berhari-hari di laci kasir.'
    },
    {
      id: 'sop-083',
      code: 'KAS-03',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Larangan Keras Ambil Uang Kasir untuk Belanja Kecil (Gunakan Kas Kecil Terpisah)',
      summary: 'Menghentikan kebiasaan ambil uang kasir untuk beli galon, bensin, lakban, atau es batu yang bikin hitungan kacau.',
      formulaOrRule: 'Dompet Kas Kecil (Petty Cash) Rp 500.000 terpisah dari Laci Kasir -> Setiap keluar wajib tukar nota fisik',
      readyText: 'PEMISAHAN KAS KECIL & UANG OMZET KASIR:\nLaci kasir hanya untuk menerima uang pembeli dan memberi kembalian. Pengeluaran operasional harian seperti beli gas LPG, air galon, parkir kurir, atau alat tulis WAJIB diambil dari Dompet Kas Kecil terpisah dengan melampirkan nota/kwitansi.',
      tip: 'Isi ulang (top-up) Dompet Kas Kecil seminggu sekali persis sebesar total kumpulan nota pengeluaran minggu itu (sistem Imprest).'
    },
    {
      id: 'sop-084',
      code: 'KAS-04',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Rekonsiliasi Pencairan QRIS Statis/Dinamis setiap H+1 Pagi',
      summary: 'Mencegah penipuan screenshot bukti bayar QRIS palsu dan memastikan dana settlement benar-benar masuk bank.',
      formulaOrRule: 'Total Nota QRIS di Kasir Kemarin = Nilai Settlement Masuk Rekening Bank Pagi Ini (dikurangi MDR 0,7% bila berlaku)',
      readyText: 'VERIFIKASI PEMBAYARAN QRIS & TRANSFER:\n1. Kasir dilarang menyerahkan barang hanya melihat layar HP pembeli; wajib cek notifikasi suara/mutasi masuk di perangkat kasir toko.\n2. Setiap pagi pukul 09.00, admin/pemilik mencocokkan total penjualan QRIS kemarin dengan dana pencairan yang masuk ke mutasi rekening bank.',
      tip: 'Aktifkan fitur speaker notifikasi suara QRIS di meja kasir agar saat antrean ramai kasir langsung mendengar nominal uang masuk.'
    },
    {
      id: 'sop-085',
      code: 'KAS-05',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Pengumuman "Gratis Pesanan Anda Jika Kasir Tidak Memberi Struk/Nota"',
      summary: 'Sistem kontrol otomatis gratis yang melibatkan pembeli agar setiap uang masuk pasti terinput di catatan.',
      formulaOrRule: 'Setiap transaksi sekecil apa pun wajib terbit struk/nota bernomor urut sebelum barang diserahkan',
      readyText: 'STANDAR PENERBITAN NOTA TRANSAKSI:\nSeluruh transaksi wajib dicatat pada aplikasi kasir atau buku nota rangkap bernomor urut. Pasang stiker ramah di depan kasir: "Mohon terima struk Anda. Hubungi nomor WA Pemilik jika petugas lupa menyerahkan struk."',
      tip: 'Celah kebocoran terbesar di UMKM adalah uang tunai pas dari pembeli yang langsung masuk kantong tanpa pernah diketik di kasir.'
    },
    {
      id: 'sop-086',
      code: 'KAS-06',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Otorisasi Pembatalan Nota (Void / Refund) Hanya oleh Pemilik/Kepala Toko',
      summary: 'Menutup modus nakal cetak struk ke pembeli lalu membatalkan transaksi (void) setelah pembeli pergi.',
      formulaOrRule: 'PIN Void/Hapus Transaksi dikunci khusus Pemilik + Struk batal wajib disimpan fisik dan ditulis alasan batal',
      readyText: 'PROSEDUR PEMBATALAN TRANSAKSI (VOID):\nKasir tidak diperkenankan menghapus transaksi yang sudah tersimpan tanpa PIN otorisasi Kepala Toko/Pemilik. Kertas struk salah ketik wajib distaples di buku laporan harian beserta tanda tangan pembeli atau foto barang batal.',
      tip: 'Cek angka "Jumlah Transaksi Batal/Void" seminggu sekali; jika angkanya mencurigakan pada shift tertentu, segera audit CCTV.'
    },
    {
      id: 'sop-087',
      code: 'KAS-07',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Cek Fisik Harian 10 Barang Cepat Laku & Mahal (Daily Spot Check)',
      summary: 'Tidak perlu tunggu akhir bulan untuk tahu rokok, oli mesin, parfum, atau daging beku berkurang misterius.',
      formulaOrRule: 'Stok Awal Pagi + Barang Masuk - Terjual Hari Ini = Wajib cocok dengan Hitung Fisik Malam pada 10 item kunci',
      readyText: 'HITUNG CEPAT 10 BARANG UTAMA SETIAP TUTUP TOKO:\nSelain stok opname bulanan menyeluruh, petugas tutup toko wajib menghitung fisik 10 item bernilai tinggi/rawan selisih pada kartu kontrol harian (waktu hitung cukup 5 menit).',
      tip: 'Pilih 10 barang paling mahal dan mudah diselipkan (misal rokok, susu kaleng, oli sintetis, obat paten, biji kopi) untuk dicek tiap malam.'
    },
    {
      id: 'sop-088',
      code: 'KAS-08',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Pemeriksaan Barang Datang dari Supplier (Timbang & Hitung Ulang!)',
      summary: 'Mencegah bocor HPP akibat kiriman supplier yang kurang jumlah pcs atau timbangan bahan baku menyusut.',
      formulaOrRule: 'Dilarang tanda tangan Faktur Terima Barang sebelum kardus dibuka, dihitung pcs, dan dicek tanggal kedaluwarsa',
      readyText: 'SOP PENERIMAAN BARANG SUPPLIER:\n1. Cocokkan nama barang, jumlah pcs/kg, dan harga satuan di faktur dengan pesanan awal.\n2. Timbang ulang bahan curah (ayam, daging, tepung, deterjen) dan periksa masa kedaluwarsa (minimal > 6 bulan untuk ritel/apotek).\n3. Barang penyok atau kurang wajib langsung dipotong di nota di hadapan pengantar.',
      tip: 'Jangan menugaskan orang yang sama untuk memesan barang ke sales, menerima fisik barang, sekaligus membayar tagihan tanpa cek silang.'
    },
    {
      id: 'sop-089',
      code: 'KAS-09',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Jadwal Setor Tunai ke Bank / ATM Setor Tunai Maksimal 2 Hari Sekali',
      summary: 'Mengamankan uang tunai dari risiko pencurian sekaligus mempercantik rekam mutasi rekening untuk KUR Bank.',
      formulaOrRule: 'Semua setoran omzet tunai wajib masuk rekening bank usaha setiap sore atau minimal 2 hari sekali persis sesuai angka rekap',
      readyText: 'DISIPLIN SETOR TUNAI OMZET KE REKENING:\nUang tunai hasil penjualan bersih (di luar modal kembalian kasir) wajib disetorkan ke mesin ATM Setor Tunai (CRM) rekening usaha paling lambat setiap 2 hari sekali dengan nominal sama persis sesuai buku kas.',
      tip: 'Kebiasaan setor omzet tunai rutin ke bank adalah kunci emas agar plafon pinjaman KUR Bank Anda disetujui besar!'
    },
    {
      id: 'sop-090',
      code: 'KAS-10',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Pencatatan Jatah Makan/Minum Karyawan & Jamuan Tamu (Complimentary)',
      summary: 'Memastikan kopi staf, makan siang dapur, atau sampel gratis tercatat jelas agar stok tidak terlihat hilang.',
      formulaOrRule: 'Buku Catatan Konsumsi Internal harian: Tulis item & jumlah porsi yang dipakai untuk staf/sampel',
      readyText: 'ATURAN KONSUMSI INTERNAL & SAMPEL:\nSetiap bahan atau produk jual yang digunakan untuk jatah minuman/makan staf maupun sampel uji kualitas wajib dicatat pada lembar Pemakaian Internal agar stok gudang tetap sinkron 100%.',
      tip: 'Bocor kecil 4 gelas es kopi susu sehari tanpa dicatat setara kehilangan bahan baku Rp 1,5 juta lebih dalam setahun.'
    },
    {
      id: 'sop-091',
      code: 'KAS-11',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Batas Piutang Pelanggan / Bon Tetangga & Tempo Tagihan Grosir',
      summary: 'Menyelamatkan warung, bengkel, dan konveksi dari macetnya modal gara-gara piutang pelanggan tak tertagih.',
      formulaOrRule: 'Eceran ritel/kuliner/jasa: 100% Tunai/QRIS (Nol Bon) | Pesanan B2B/Konveksi: Wajib DP minimal 50% & Lunas 100% saat barang diambil',
      readyText: 'KEBIJAKAN PEMBAYARAN & UANG MUKA PESANAN:\n1. Transaksi harian berlaku tunai/non-tunai lunas.\n2. Untuk pesanan partai/custom (konveksi, katering, bengkel besar), pengerjaan dimulai setelah Uang Muka (DP) 50% masuk, dan pelunasan 50% diselesaikan sebelum barang diserahkan.',
      tip: 'Omzet besar di atas kertas piutang tidak bisa dipakai membayar gaji karyawan tanggal 30; jaga arus kas tunai di atas segalanya.'
    },
    {
      id: 'sop-092',
      code: 'KAS-12',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Alokasi Rutin Sewa Ruko Tahunan ke Pos Tabungan Bulanan',
      summary: 'Mencegah kepanikan cari pinjaman mendadak setiap kali kontrak sewa ruko/kios jatuh tempo 1-2 tahun sekali.',
      formulaOrRule: 'Beban Sewa Bulanan = Nilai Kontrak Sewa Setahun / 12 bulan (ditransfer ke rekening tabungan sewa tiap bulan)',
      readyText: 'PENYISIHAN DANA SEWA TEMPAT BULANAN:\nMeskipun sewa ruko dibayar tahunan di muka, setiap bulan Buku Kas Laba-Rugi wajib membebankan 1/12 nilai sewa dan menyimpannya ke rekening khusus perpanjangan sewa.',
      tip: 'Banyak pemilik UMKM merasa untung Rp 8 juta/bulan padahal lupa menyisihkan sewa ruko Rp 36 juta/tahun (Rp 3 juta/bulan)!'
    },
    {
      id: 'sop-093',
      code: 'KAS-13',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Kontrol Uang Kembalian Receh & Pembulatan Harga Menu/Barang',
      summary: 'Menetapkan harga jual bulat kelipatan Rp 500 atau Rp 1.000 agar kasir cepat dan bebas selisih koin.',
      formulaOrRule: 'Setel seluruh harga tunai dalam kelipatan Rp 500 atau Rp 1.000 + Tukar stok uang pecahan kecil seminggu sekali',
      readyText: 'STANDARISASI HARGA TUNAI & PECAHAN KEMBALIAN:\nHarga jual tunai ditetapkan dalam kelipatan bulat minimal Rp 500 untuk menghindari kekurangan uang koin kembalian. Koordinator kasir menukarkan persediaan uang pecahan kecil setiap hari Kamis sebelum akhir pekan.',
      tip: 'Jangan pernah mengganti kembalian pelanggan dengan permen tanpa izin; lebih baik bulatkan harga sejak awal.'
    },
    {
      id: 'sop-094',
      code: 'KAS-14',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Pencatatan Barang Rusak, Basi & Kedaluwarsa (Waste Log)',
      summary: 'Mengukur berapa persen bahan makanan atau obat/kosmetik yang terbuang percuma tiap bulan.',
      formulaOrRule: 'Batas aman waste kuliner <= 3% HPP | Ritel/Apotek <= 0,5% HPP (Sistem FEFO: First Expired First Out)',
      readyText: 'PROSEDUR FEFO & PENCATATAN BARANG RUSAK:\nSaat menata stok baru di rak/kulkas, barang dengan masa kedaluwarsa lebih dekat WAJIB ditaruh paling depan (FEFO). Barang rusak atau basi wajib difoto dan dicatat di Buku Waste sebelum dibuang.',
      tip: 'Mewajibkan foto fisik barang basi sebelum dibuang mencegah oknum membawa pulang barang bagus dengan alasan "sudah basi".'
    },
    {
      id: 'sop-095',
      code: 'KAS-15',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Bandingkan minimal 2 Supplier Utama Setiap 3 Bulan Sekali',
      summary: 'Menjaga harga beli HPP tetap kompetitif dan mencegah kenaikan harga diam-diam dari pemasok tunggal.',
      formulaOrRule: 'Evaluasi daftar harga 20 item belanja terbesar setiap kuartal ke minimal 2 grosir/distributor berbeda',
      readyText: 'EVALUASI BERKALA HARGA BELI PEMASOK (HPP):\nSetiap 3 bulan sekali, pemilik membandingkan harga beli 20 bahan baku/barang terlaris terhadap minimal 2 pemasok resmi untuk menjaga Margin Laba Kotor tetap sehat.',
      tip: 'Turunnya HPP sebesar 2% saja pada barang laris langsung menambah laba bersih jutaan rupiah tanpa perlu menaikkan harga jual.'
    },
    {
      id: 'sop-096',
      code: 'KAS-16',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Kontrol Kupon Diskon Manual & Harga Teman Pemilik',
      summary: 'Menghentikan kebocoran margin gara-gara teman atau kerabat minta gratis/diskon besar terus-menerus.',
      formulaOrRule: 'Semua pemberian gratis/diskon relasi pemilik wajib tetap diinput kasir menggunakan kode "Voucher Pemilik" berkuota bulanan',
      readyText: 'PENCATATAN DISKON KHUSUS & JAMUAN RELASI:\nStaf kasir dilarang memberikan potongan harga sendiri. Apabila terdapat kerabat/relasi atas instruksi langsung Pemilik, transaksi tetap diinput penuh lalu dipotong memakai pos Biaya Promosi/Jamuan.',
      tip: 'Saat Anda melihat angka rupiah nyata "jamuan gratis" di laporan bulanan, Anda akan jauh lebih disiplin menjaga margin usaha.'
    },
    {
      id: 'sop-097',
      code: 'KAS-17',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Audit Kejutan Kasir (Surprise Cash Count) Sebulan 2 Kali',
      summary: 'Hitung laci kasir secara acak di tengah hari oleh pemilik untuk memastikan ketertiban kasir setiap jam.',
      formulaOrRule: 'Waktu acak 10 menit di siang hari: Hitung uang tunai di laci vs angka penjualan berjalan di aplikasi/nota',
      readyText: 'PEMERIKSAAN BERKALA KAS BERJALAN:\nPemilik usaha sewaktu-waktu melakukan pencocokan cepat saldo uang laci kasir terhadap catatan penjualan jam berjalan untuk memastikan kedisiplinan input struk secara real-time.',
      tip: 'Cukup lakukan dengan santai sambil tersenyum 2 kali sebulan; efek pencegahannya luar biasa kuat.'
    },
    {
      id: 'sop-098',
      code: 'KAS-18',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Penyisihan Dana Penyusutan & Servis Alat Kerja (2% - 3% Omzet)',
      summary: 'Menyiapkan dana ganti kompresor kulkas, mesin cuci laundry, AC, atau komputer kasir sebelum rusak mendadak.',
      formulaOrRule: 'Cadangan Perawatan Alat = 2% dari Omzet (atau nominal tetap Rp 300.000 - Rp 750.000/bulan)',
      readyText: 'POS PERAWATAN & PEREMAJAAN ALAT KERJA:\nSetiap bulan disisihkan anggaran pemeliharaan rutin (cuci AC, servis mesin cuci/boiler, ganti oli motor kurir) agar mesin produksi awet dan tidak berhenti beroperasi di hari ramai.',
      tip: 'Cuci AC dan bersihkan filter mesin cuci rutin Rp 75.000 tiap 3 bulan mencegah kerusakan kompresor seharga Rp 2,5 juta.'
    },
    {
      id: 'sop-099',
      code: 'KAS-19',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Format Laporan Tutup Kasir Malam 5 Angka di Grup WA Inti',
      summary: 'Template ringkas 30 detik yang dikirim Kepala Shift sebelum gembok toko dikunci.',
      formulaOrRule: '5 Angka Wajib: (1) Penjualan Tunai, (2) Penjualan QRIS/Transfer, (3) Total Omzet, (4) Pengeluaran Kas Kecil, (5) Fisik Setoran Tunai',
      readyText: 'FORMAT LAPORAN TUTUP TOKO HARIAN:\nTanggal: [Tgl/Bln/Thn]\nShift/Petugas: [Nama]\n1. Omzet Tunai: Rp ...\n2. Omzet QRIS/Transfer: Rp ...\n3. Total Omzet Hari Ini: Rp ...\n4. Kas Kecil Terpakai (Nota terlampir): Rp ...\n5. Uang Setoran Tunai Siap Setor (di luar modal laci): Rp ...',
      tip: 'Rekap harian 5 baris ini membuat pengisian Buku Kas Bulanan di Langkah 2 GajiKas Studio selesai hanya dalam 3 menit!'
    },
    {
      id: 'sop-100',
      code: 'KAS-20',
      category: 'Kontrol Bocor Kas Harian',
      title: 'Dana Darurat Operasional Usaha Minimal 3x Beban Tetap Bulanan',
      summary: 'Sabuk pengaman agar UMKM tetap sanggup bayar gaji dan listrik penuh walau omzet sempat turun mendadak.',
      formulaOrRule: 'Target Dana Cadangan Aman = 3 x (Total Beban Gaji Tim + Sewa + Listrik/Internet Bulanan)',
      readyText: 'TARGET DANA CADANGAN KESEHATAN USAHA:\nSebelum mengambil pembagian dividen besar atau membuka cabang baru, pastikan rekening cadangan usaha telah memiliki saldo aman minimal setara 3 bulan biaya tetap operasional dan gaji karyawan.',
      tip: 'Kumpulkan bertahap dengan menyisihkan 10%-15% dari Laba Bersih setiap bulan.'
    },

    // =========================================================================
    // KATEGORI 6: Syarat & Rasio KUR Bank (20 Item)
    // =========================================================================
    {
      id: 'sop-101',
      code: 'KUR-01',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Rumus Repayment Capacity (RPC 30% - 35% dari Laba Bersih Bulanan)',
      summary: 'Rumus inti yang dipakai analis kredit BRI, Mandiri, BNI, dan BCA saat menghitung berapa cicilan maksimal Anda.',
      formulaOrRule: 'Batas Aman Angsuran Bulanan = 30% x Laba Bersih Usaha (setelah dikurangi HPP, Gaji, Opex & biaya hidup wajar)',
      readyText: 'ACUAN KAPASITAS ANGSURAN BANK (RPC 30%):\nAnalis perbankan umumnya menyetujui besaran angsuran kredit modal kerja/investasi maksimal sebesar 30% s/d 35% dari sisa laba bersih bulanan usaha agar arus kas usaha tetap aman saat terjadi fluktuasi omzet.',
      tip: 'Jika Laba Bersih usaha Anda Rp 10.000.000/bulan, maka cicilan KUR yang paling mudah disetujui adalah maksimal sekitar Rp 3.000.000/bulan.'
    },
    {
      id: 'sop-102',
      code: 'KUR-02',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Syarat Usaha Aktif Berjalan Minimal 6 Bulan Berturut-turut',
      summary: 'Ketentuan dasar kelayakan usia usaha produktif untuk pengajuan Kredit Usaha Rakyat (KUR).',
      formulaOrRule: 'Usia usaha aktif >= 6 bulan di lokasi jelas/toko aktif + memiliki bukti pencatatan penjualan dan belanja stok',
      readyText: 'KELAYAKAN USIA USAHA PRODUKTIF:\nPastikan usaha telah berjalan aktif secara kontinu minimal 6 bulan dengan bukti nota belanja supplier, catatan omzet bulanan, serta Laporan Laba-Rugi rapi dari GajiKas Studio selama minimal 3-6 bulan terakhir.',
      tip: 'Simpan bundel nota belanja stok dari grosir/distributor dalam 1 map urut bulan; mantri survei bank sangat menyukai bukti fisik ini!'
    },
    {
      id: 'sop-103',
      code: 'KUR-03',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Dokumen Legalitas Wajib: NIB OSS Gratis atau Surat Keterangan Usaha (SKU)',
      summary: 'Cara mengurus izin usaha resmi dalam 15 menit secara daring tanpa biaya calo untuk syarat administrasi bank.',
      formulaOrRule: 'KTP Elektronik + KK + NPWP (untuk plafon > Rp 50 juta) + Nomor Induk Berusaha (NIB) dari oss.go.id / SKU Kelurahan',
      readyText: 'DAFTAR DOKUMEN ADMINISTRASI PENGAJUAN KUR:\n1. e-KTP Pemohon & Pasangan (serta Surat Nikah bila sudah menikah).\n2. Kartu Keluarga (KK).\n3. Nomor Induk Berusaha (NIB) OSS atau Surat Keterangan Usaha (SKU) Desa/Kelurahan.\n4. NPWP Aktif (wajib untuk pengajuan plafon di atas Rp 50.000.000).\n5. Laporan Laba-Rugi Operasional & Rekap Gaji Karyawan (.PDF GajiKas Studio).',
      tip: 'Membuat NIB Perorangan UMK di situs resmi oss.go.id 100% gratis dan terbit instan dalam hitungan menit!'
    },
    {
      id: 'sop-104',
      code: 'KUR-04',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Menjaga Skor SLIK OJK (BI Checking) Kol-1 Lancar Termasuk Paylater!',
      summary: 'Penyebab nomor satu pengajuan KUR UMKM ditolak sistem meski omzet toko ramai.',
      formulaOrRule: 'Status SLIK OJK Pemohon & Pasangan WAJIB Kolektibilitas 1 (Lancar) tanpa tunggakan Paylater/Pinjol Rp 50.000 sekali pun',
      readyText: 'PEMERIKSAAN KEBERSIHAN RIWAYAT KREDIT (SLIK OJK):\nSebelum mengajukan KUR Bank, pastikan baik suami maupun istri tidak memiliki tunggakan cicilan HP, kartu kredit, pinjaman daring resmi, maupun tagihan Paylater belanja online sekecil apa pun.',
      tip: 'Cek mandiri riwayat SLIK OJK Anda secara gratis lewat laman resmi idebku.ojk.go.id sebelum datang ke kantor cabang bank.'
    },
    {
      id: 'sop-105',
      code: 'KUR-05',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Perbedaan Plafon KUR Super Mikro, KUR Mikro (s/d Rp 100 Juta) & KUR Kecil',
      summary: 'Memilih kategori plafon KUR yang tepat terkait syarat agunan tambahan dan suku bunga.',
      formulaOrRule: 'KUR Mikro (Rp 10 jt - Rp 100 jt): Tanpa agunan tambahan (cukup kelayakan usaha) | KUR Kecil (> Rp 100 jt - Rp 500 jt): Wajib agunan tambahan (SHM/BPKB)',
      readyText: 'KATEGORI PLAFON KUR PERBANKAN:\n- KUR Super Mikro: Plafon s/d Rp 10 juta bagi usaha rintisan.\n- KUR Mikro: Plafon di atas Rp 10 juta s/d Rp 100 juta tanpa kewajiban agunan tambahan fisik selain usaha yang dibiayai.\n- KUR Kecil: Plafon di atas Rp 100 juta s/d Rp 500 juta dengan agunan tambahan sesuai penilaian bank.',
      tip: 'Jika baru pertama kali meminjam ke bank, ajukan di rentang KUR Mikro (misal Rp 35 juta - Rp 75 juta) agar proses persetujuan jauh lebih cepat.'
    },
    {
      id: 'sop-106',
      code: 'KUR-06',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Cara Merapikan Mutasi Rekening Koran 3-6 Bulan Sebelum Ajukan KUR',
      summary: 'Membuktikan kebenaran angka omzet di Laporan Laba-Rugi melalui aliran uang masuk rekening bank.',
      formulaOrRule: 'Total Kredit Masuk di Mutasi Rekening >= 60% - 80% dari klaim Omzet Bulanan di Laporan Laba-Rugi',
      readyText: 'PERSIAPAN REKENING KORAN 3 BULAN:\nMulai minimal 3 bulan sebelum pengajuan kredit, biasakan menyetorkan uang penjualan tunai harian ke rekening usaha dan menerima pembayaran QRIS di rekening yang sama agar total mutasi kredit tercermin nyata di rekening koran.',
      tip: 'Uang tunai yang langsung dibelanjakan lagi ke pasar tanpa mampir ke rekening bank membuat omzet Anda tidak terbaca di mutasi koran.'
    },
    {
      id: 'sop-107',
      code: 'KUR-07',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Memilih Kredit Modal Kerja (KMK 3 Tahun) vs Kredit Investasi (KI 5 Tahun)',
      summary: 'Menyesuaikan tujuan penggunaan dana pinjaman dengan tenor cicilan yang diizinkan bank.',
      formulaOrRule: 'Tambah stok barang dagangan/bahan baku = KMK (tenor maks 36 bln) | Beli mesin baru/renovasi ruko = KI (tenor maks 60 bln)',
      readyText: 'TUJUAN PENGGUNAAN DANA PINJAMAN:\n- Pilih Kredit Modal Kerja (KMK) bila dana dipakai memperbesar stok barang cepat berputar.\n- Pilih Kredit Investasi (KI) bila dana dipakai membeli aset jangka panjang seperti mesin cuci industri, oven besar, komputer, atau renovasi tempat usaha.',
      tip: 'Jangan pernah menggunakan dana KUR Modal Kerja untuk uang muka beli kendaraan konsumtif pribadi yang tidak menghasilkan omzet!'
    },
    {
      id: 'sop-108',
      code: 'KUR-08',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Simulasi Angsuran KUR Bunga 6% Efektif per Tahun (Setara ~0,27% Flat/Bulan)',
      summary: 'Cara cepat memperkirakan cicilan bulanan KUR per Rp 10 juta pinjaman agar tidak tertipu pinjaman bunga tinggi.',
      formulaOrRule: 'Estimasi kasar per Rp 10.000.000 (Bunga 6% efektif/thn):\n- Tenor 12 bln: ~Rp 860.700/bln\n- Tenor 24 bln: ~Rp 443.200/bln\n- Tenor 36 bln: ~Rp 304.200/bln',
      readyText: 'PATOKAN ESTIMASI ANGSURAN KUR (6% EFEKTIF P.A.):\nUntuk pinjaman pertama bersubsidi bunga 6% efektif per tahun:\n- Plafon Rp 25 Juta (36 bln): sekitar Rp 760.500 / bulan.\n- Plafon Rp 50 Juta (36 bln): sekitar Rp 1.521.100 / bulan.\n- Plafon Rp 100 Juta (36 bln): sekitar Rp 3.042.200 / bulan.',
      tip: 'Perhatikan bahwa pengajuan KUR berulang (pinjaman ke-2, ke-3, ke-4) memiliki skema bunga berjenjang (7%, 8%, 9% efektif per tahun).'
    },
    {
      id: 'sop-109',
      code: 'KUR-09',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Rasio Margin Laba Bersih Sehat per Sektor di Mata Analis Bank',
      summary: 'Jangan menulis persentase untung terlalu tinggi tidak masuk akal atau terlalu tipis saat diwawancara mantri bank.',
      formulaOrRule: 'Patokan wajar: Sembako/Grosir 5%-10% | Ritel Umum/Apotek 12%-20% | Kuliner/Kafe 18%-30% | Jasa Bengkel/Laundry/Salon 25%-45%',
      readyText: 'KEWAJARAN RASIO LABA BERSIH SEKTOR UMKM:\nAnalis bank memiliki tabel pembanding margin rata-rata tiap bidang usaha. Laporan Laba-Rugi yang disusun jujur dan wajar sesuai karakter sektor usaha jauh lebih dipercaya daripada angka laba yang dilebih-lebihkan.',
      tip: 'Cetak PDF Laporan Laba-Rugi dari Langkah 3 GajiKas Studio karena sudah mencantumkan rincian HPP, Gaji Karyawan, dan Rasio Margin secara proporsional!'
    },
    {
      id: 'sop-110',
      code: 'KUR-10',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Checklist Persiapan Saat Mantri / Analis Bank Datang Survei ke Lokasi Usaha',
      summary: '7 hal fisik yang dilihat petugas survei bank dalam 15 menit kunjungan ke toko atau bengkel Anda.',
      formulaOrRule: 'Stok rak tampak terisi rapi + Papan nama jelas + Buku Kas/PDF Laba-Rugi siap + Nota belanja supplier + Aktivitas staf melayani',
      readyText: 'DAFTAR SIAP SURVEI LOKASI USAHA:\n1. Papan nama usaha terpasang jelas di depan lokasi.\n2. Etalase dan gudang tertata rapi penuh barang aktif (bukan kardus kosong).\n3. Siapkan cetak PDF Laporan Laba-Rugi & Daftar Gaji 3 bulan terakhir.\n4. Tunjukkan tumpukan nota belanja supplier dan buku setoran harian.\n5. Jawab lugas harga jual dan HPP 5 produk terlaris di luar kepala.',
      tip: 'Analis bank sering mengetes spontan: "Barang ini kulakannya berapa, dijual berapa, sehari laku berapa?" — pastikan jawaban Anda konsisten dengan laporan!'
    },
    {
      id: 'sop-111',
      code: 'KUR-11',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Larangan Mempunyai Kredit Produktif Komersial Lain Saat Mengajukan KUR',
      summary: 'Aturan bahwa penerima KUR tidak boleh sedang memiliki kredit modal kerja komersial aktif di bank lain.',
      formulaOrRule: 'Boleh punya KPR Rumah, KKB Kendaraan pribadi, atau Kartu Kredit lancar; TIDAK BOLEH sedang punya kredit modal kerja usaha lain',
      readyText: 'ATURAN KREDIT PENDAMPING PENERIMA KUR:\nCalon debitur KUR diperbolehkan sedang memiliki kredit konsumtif seperti KPR rumah tinggal atau cicilan motor selama berstatus Lancar (Kol-1), namun tidak sedang menerima fasilitas kredit modal kerja/investasi produktif dari perbankan lain.',
      tip: 'Jika Anda masih punya sisa cicilan modal kerja kecil di koperasi/bank lain yang tinggal 2 bulan, lunasi dulu baru ajukan KUR plafon penuh.'
    },
    {
      id: 'sop-112',
      code: 'KUR-12',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Pentingnya Bukti Daftar Gaji & Jumlah Karyawan saat Pengajuan Kredit',
      summary: 'Mengapa usaha yang memiliki pencatatan gaji karyawan rapi dinilai lebih mapan oleh bank.',
      formulaOrRule: 'Daftar Gaji Resmi + Slip Gaji membuktikan skala operasional nyata dan memisahkan beban upah dari laba bersih pemilik',
      readyText: 'BUKTI STRUKTUR TIM OPERASIONAL:\nLampirkan Rekap Penggajian dan contoh Slip Gaji Resmi dari GajiKas Studio saat pengajuan pembiayaan. Hal ini membuktikan usaha memiliki sistem manajemen yang tertib dan berkelanjutan.',
      tip: 'Program KUR pemerintah juga menilai positif UMKM yang menyerap tenaga kerja warga sekitar.'
    },
    {
      id: 'sop-113',
      code: 'KUR-13',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Menghitung Biaya Hidup Rumah Tangga Pemilik di Luar Laporan Usaha',
      summary: 'Analis bank selalu mengurangi Laba Bersih Toko dengan estimasi biaya hidup keluarga pemilik sebelum menghitung RPC!',
      formulaOrRule: 'Sisa Kas Bersih Siap Angsur = Laba Bersih Usaha - Estimasi Kebutuhan Rumah Tangga Pemilik (dikurangi penghasilan pasangan bila ada)',
      readyText: 'PERHITUNGAN PENGHASILAN BERSIH KELUARGA:\nApabila pemilik belum memasukkan gaji dirinya sendiri di dalam Beban Gaji Toko, analis kredit akan mengurangi Laba Bersih Usaha dengan estimasi biaya hidup rumah tangga (listrik rumah, sekolah anak, konsumsi) untuk mencari sisa kemampuan angsur murni.',
      tip: 'Bila pasangan Anda memiliki slip gaji kerja tetap terpisah, lampirkan juga karena itu menutup pos biaya rumah tangga sehingga kapasitas KUR toko naik!'
    },
    {
      id: 'sop-114',
      code: 'KUR-14',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Bukti Kontrak Sewa Tempat Usaha Minimal Sisa 1 Tahun Aktif',
      summary: 'Mengantisipasi keraguan bank apabila lokasi toko/bengkel berstatus sewa atau kontrak.',
      formulaOrRule: 'Lampirkan kuitansi/surat perjanjian sewa ruko/kios + surat keterangan domisili usaha bila sewa dari pemilik lokal',
      readyText: 'KELENGKAPAN BUKTI TEMPAT USAHA SEWA:\nBagi usaha yang menempati ruko atau kios sewa, siapkan fotokopi perjanjian sewa-menyewa yang masih berlaku aktif serta kuitansi pembayaran sewa terakhir untuk meyakinkan bank atas keberlanjutan lokasi usaha.',
      tip: 'Jika masa sewa tinggal sisa 2 bulan lagi, perpanjang atau buat surat kesepakatan perpanjangan dulu sebelum disurvei bank.'
    },
    {
      id: 'sop-115',
      code: 'KUR-15',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Rumus Perputaran Persediaan (Inventory Turnover) yang Sehat untuk KMK',
      summary: 'Menentukan berapa jumlah stok ideal yang layak dibiayai pinjaman modal kerja agar tidak menumpuk kedaluwarsa.',
      formulaOrRule: 'Hari Perputaran Stok = (Nilai Stok Rata-rata / HPP Bulanan) x 30 hari (Ideal ritel: 15-35 hari; kuliner segar: 3-7 hari)',
      readyText: 'EFEKTIVITAS PERPUTARAN MODAL STOK:\nDana tambahan modal kerja diprioritaskan untuk menambah stok barang kategori Cepat Laku (Fast Moving) yang berputar kembali menjadi kas tunai dalam 7 s/d 30 hari, sehingga keuntungan perputarannya berkali-kali lipat dari bunga bank 0,5% sebulan.',
      tip: 'Bunga KUR hanya ~0,5%/bulan; jika barang Anda berputar tiap 2 minggu dengan margin bersih 8%, modal itu menghasilkan 16%/bulan — sangat sehat!'
    },
    {
      id: 'sop-116',
      code: 'KUR-16',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Disiplin Rekening Autodebet Angsuran H-3 Sebelum Tanggal Jatuh Tempo',
      summary: 'Menjaga rekor pembayaran 100% tepat waktu agar tahun depan otomatis ditawari kenaikan plafon (Top-Up/Naik Kelas).',
      formulaOrRule: 'Saldo khusus cicilan wajib sudah mengendap di rekening autodebet minimal 3 hari sebelum tanggal jatuh tempo setiap bulan',
      readyText: 'SOP PENGAMANAN ANGSURAN BULANAN:\nSisihkan 1/4 nilai cicilan bank setiap minggu dari omzet berjalan dan pastikan saldo angsuran penuh telah tersedia di rekening autodebet paling lambat H-3 sebelum tanggal pendebetan sistem bank.',
      tip: 'Telat saldo 1 hari saja karena lupa hari Minggu/libur bisa terekam Kol-2 Dalam Perhatian Khusus di SLIK OJK!'
    },
    {
      id: 'sop-117',
      code: 'KUR-17',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Rasio Utang terhadap Modal & Aset Usaha (Jangan Over-Leverage)',
      summary: 'Batas sehat total utang usaha dibanding nilai stok, alat, dan kas yang dimiliki sendiri.',
      formulaOrRule: 'Total Pinjaman Bank <= 70% dari Total Nilai Aset Produktif Usaha (Stok Barang + Mesin/Peralatan + Kas)',
      readyText: 'PRINSIP KESEIMBANGAN MODAL SENDIRI & PINJAMAN:\nPinjaman bank berfungsi sebagai pengungkit usaha yang sudah terbukti jalan, bukan 100% modal awal. Jaga agar nilai stok barang dagangan dan peralatan produktif di toko selalu lebih besar daripada sisa pokok pinjaman.',
      tip: 'Setiap kali selesai mencicil, pastikan jumlah barang di rak toko Anda bertambah tebal, bukan berkurang.'
    },
    {
      id: 'sop-118',
      code: 'KUR-18',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Pemanfaatan Mesin EDC / QRIS Resmi dari Bank Penyalur KUR',
      summary: 'Trik praktis menjadi nasabah prioritas mantri KUR lewat pemasangan QRIS merchant resmi bank tersebut.',
      formulaOrRule: 'Daftar QRIS Merchant atas nama Usaha di bank target penyalur KUR minimal 2-3 bulan sebelum pengajuan',
      readyText: 'STRATEGI MERCHANT QRIS PERBANKAN:\nGunakan QRIS resmi beridentitas nama toko dari bank tempat Anda berencana mengajukan KUR. Riwayat transaksi harian pelanggan yang terekam langsung di sistem internal bank menjadi bukti omzet paling valid tanpa keraguan.',
      tip: 'Sering kali UMKM pengguna aktif QRIS bank pemerintah justru ditawari fasilitas KUR lebih dulu oleh petugas cabang setempat!'
    },
    {
      id: 'sop-119',
      code: 'KUR-19',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Cara Menghitung ROI (Balik Modal) Sebelum Beli Mesin Baru Pakai KUR',
      summary: 'Rumus sederhana menguji apakah mesin baru benar-benar mampu membayar cicilannya sendiri.',
      formulaOrRule: 'Tambahan Laba Bersih Bulanan dari Mesin Baru WAJIB >= 2 x Cicilan Bulanan KUR atas mesin tersebut',
      readyText: 'UJI KELAYAKAN BELI ALAT / EKSPANSI:\nSebelum mengambil pinjaman untuk membeli mesin baru (misal pengering laundry, mesin kopi espresso, atau mesin obras), pastikan tambahan laba bersih realistis dari alat tersebut minimal 2 kali lipat besaran cicilan bulanannya.',
      tip: 'Jika cicilan mesin Rp 900.000/bulan, mesin itu wajib menghasilkan tambahan laba bersih minimal Rp 1.800.000/bulan.'
    },
    {
      id: 'sop-120',
      code: 'KUR-20',
      category: 'Syarat & Rasio KUR Bank',
      title: 'Paket Bundel 3 Dokumen Siap Map saat Mengajukan KUR ke Bank',
      summary: 'Urutan susunan berkas rapi di dalam map plastik yang langsung membuat analis kredit terkesan pada menit pertama.',
      formulaOrRule: 'Map 1: Legalitas (KTP, KK, NIB, NPWP) | Map 2: Laporan Laba-Rugi & Rekap Gaji 3 Bulan (.PDF GajiKas) | Map 3: Rekening Koran & Foto Usaha',
      readyText: 'SUSUNAN BERKAS PENGAJUAN PEMBIAYAAN UMKM:\n1. Lembar Ringkasan Usaha & Tujuan Penggunaan Dana.\n2. Fotokopi KTP Suami-Istri, KK, Buku Nikah, NPWP, dan NIB OSS.\n3. Cetakan Laporan Laba-Rugi & Rasio Kas 3 bulan terakhir dari GajiKas Studio.\n4. Cetakan Rekap Penggajian Karyawan.\n5. Rekening Koran 3-6 bulan terakhir & 4 lembar foto aktivitas usaha.',
      tip: 'Membawa Laporan Laba-Rugi cetakan rapi berformat standar akuntansi dari GajiKas Studio langsung membedakan Anda dari 90% pemohon lain yang datang tanpa catatan.'
    }
  ];

  const base = window.__GAJIKAS_PART1 || { GAJIKAS_PRESETS: [], GAJIKAS_LIBRARY: [] };
  window.GAJIKAS_PRESETS = base.GAJIKAS_PRESETS;
  window.GAJIKAS_LIBRARY = base.GAJIKAS_LIBRARY.concat(part2);
  window.GAJIKAS_CATEGORIES = [
    'SOP Absensi & Jam Kerja',
    'Aturan Kasbon & Potongan',
    'Skema Bonus & Komisi Tim',
    'Rumus Lembur & THR',
    'Kontrol Bocor Kas Harian',
    'Syarat & Rasio KUR Bank'
  ];
  delete window.__GAJIKAS_PART1;
})();

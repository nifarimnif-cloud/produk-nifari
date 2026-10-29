/**
 * Mesin Perhitungan RAB Konstruksi, Estimasi Material Toko Bangunan,
 * serta Pembuat File Jadi Asli:
 * 1) PDF Surat Penawaran & Tabel RAB Resmi (.pdf)
 * 2) Microsoft Excel Rincian RAB Ber-Rumus (.xlsx OOXML)
 * 3) Microsoft Word Kontrak Kerja Borongan / SPK (.docx OOXML)
 */

import { jsPDF, strToU8, zipSync } from '../vendor/doc-libs.min.mjs';

export const ZONA_WILAYAH = {
  'Jawa Barat, Jawa Tengah, DIY & Jawa Timur': 1.0,
  'DKI Jakarta, Bodetabek & Banten': 1.08,
  'Sumatera (Medan, Palembang, Pekanbaru, Lampung)': 1.09,
  'Bali, NTB & NTT': 1.12,
  'Kalimantan & Sulawesi': 1.16,
  'Maluku & Papua': 1.32
};

export const PROJECT_PRESETS = {
  'bangun-rumah-1lt': {
    id: 'bangun-rumah-1lt',
    label: 'Bangun Rumah 1 Lantai Standar Rapi',
    defaultLuas: 36,
    defaultDurasiHari: 90,
    satuanAcuan: 'm² Bangunan',
    buildRows: (luas, mult) => {
      const L = Math.max(12, Number(luas) || 36);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Persiapan & Pondasi', uraian: 'Pembersihan lahan & pemasangan bowplank siku', volume: +(L * 1.1).toFixed(1), satuan: 'm²', hargaMaterial: r(18000), hargaUpah: r(16000) },
        { group: 'A. Persiapan & Pondasi', uraian: 'Galian tanah & pasangan pondasi batu kali 1:5', volume: +(L * 0.34).toFixed(1), satuan: 'm³', hargaMaterial: r(640000), hargaUpah: r(260000) },
        { group: 'B. Struktur Beton & Dinding', uraian: 'Sloof 15×20, kolom praktis & ring balk beton bertulang', volume: +(L * 1.45).toFixed(1), satuan: 'm\'', hargaMaterial: r(118000), hargaUpah: r(56000) },
        { group: 'B. Struktur Beton & Dinding', uraian: 'Pasangan dinding bata ringan hebel 10 cm + mortar', volume: +(L * 2.85).toFixed(1), satuan: 'm²', hargaMaterial: r(82000), hargaUpah: r(38000) },
        { group: 'B. Struktur Beton & Dinding', uraian: 'Plesteran + acian halus dinding luar & dalam', volume: +(L * 5.2).toFixed(1), satuan: 'm²', hargaMaterial: r(48000), hargaUpah: r(58000) },
        { group: 'C. Lantai, Keramik & Plafon', uraian: 'Lantai granit tile 60×60 ruang utama + rabat bawah', volume: +(L * 0.88).toFixed(1), satuan: 'm²', hargaMaterial: r(195000), hargaUpah: r(85000) },
        { group: 'C. Lantai, Keramik & Plafon', uraian: 'Keramik lantai & dinding kamar mandi + waterproofing', volume: +(L * 0.35).toFixed(1), satuan: 'm²', hargaMaterial: r(138000), hargaUpah: r(74000) },
        { group: 'C. Lantai, Keramik & Plafon', uraian: 'Plafon gypsum 9 mm rangka hollow galvalum terpasang', volume: +(L * 1.05).toFixed(1), satuan: 'm²', hargaMaterial: r(82000), hargaUpah: r(48000) },
        { group: 'D. Atap & Kusen Pintu Jendela', uraian: 'Rangka atap baja ringan C75 + genteng metal pasir', volume: +(L * 1.32).toFixed(1), satuan: 'm²', hargaMaterial: r(225000), hargaUpah: r(85000) },
        { group: 'D. Atap & Kusen Pintu Jendela', uraian: 'Paket kusen aluminium, pintu utama, pintu kamar & KM', volume: Math.max(1, Math.round(L / 12)), satuan: 'paket', hargaMaterial: r(3450000), hargaUpah: r(650000) },
        { group: 'E. Listrik, Pipa Air & Cat', uraian: 'Instalasi listrik SNI, lampu LED, saklar, stop kontak & MCB', volume: Math.max(6, Math.round(L * 0.35)), satuan: 'titik', hargaMaterial: r(215000), hargaUpah: r(95000) },
        { group: 'E. Listrik, Pipa Air & Cat', uraian: 'Instalasi pipa air bersih/kotor, kloset duduk & septic tank', volume: 1, satuan: 'ls', hargaMaterial: r(5400000), hargaUpah: r(1850000) },
        { group: 'E. Listrik, Pipa Air & Cat', uraian: 'Pengecatan dinding interior, eksterior weatherproof & plafon', volume: +(L * 5.8).toFixed(1), satuan: 'm²', hargaMaterial: r(29000), hargaUpah: r(19000) }
      ];
    }
  },
  'renovasi-kamar-mandi': {
    id: 'renovasi-kamar-mandi',
    label: 'Renovasi Total Kamar Mandi Anti-Bocor',
    defaultLuas: 4,
    defaultDurasiHari: 14,
    satuanAcuan: 'm² Lantai KM',
    buildRows: (luas, mult) => {
      const L = Math.max(2, Number(luas) || 4);
      const dinding = +(Math.sqrt(L) * 4 * 2.4).toFixed(1);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Bongkaran & Persiapan', uraian: 'Bongkar keramik lantai & dinding lama + angkut puing', volume: +(L + dinding).toFixed(1), satuan: 'm²', hargaMaterial: r(8000), hargaUpah: r(38000) },
        { group: 'B. Waterproofing & Pipa', uraian: 'Peremajaan jalur pipa air bersih AW, floor drain & kloset', volume: 1, satuan: 'ls', hargaMaterial: r(950000), hargaUpah: r(550000) },
        { group: 'B. Waterproofing & Pipa', uraian: 'Waterproofing coating 2 lapis lantai & sudut dinding + tes rendam', volume: +(L + 3.5).toFixed(1), satuan: 'm²', hargaMaterial: r(48000), hargaUpah: r(26000) },
        { group: 'C. Keramik & Plafon', uraian: 'Pasang keramik lantai anti-slip 30×30 cm kemiringan ke drain', volume: L, satuan: 'm²', hargaMaterial: r(105000), hargaUpah: r(65000) },
        { group: 'C. Keramik & Plafon', uraian: 'Pasang keramik/granit dinding full plafon + nat anti-jamur', volume: dinding, satuan: 'm²', hargaMaterial: r(145000), hargaUpah: r(75000) },
        { group: 'C. Keramik & Plafon', uraian: 'Plafon PVC tahan lembap + lampu downlight LED + exhaust', volume: L, satuan: 'm²', hargaMaterial: r(185000), hargaUpah: r(65000) },
        { group: 'D. Saniter & Pintu', uraian: 'Pasang kloset duduk monoblok, jet shower & kran shower set', volume: 1, satuan: 'paket', hargaMaterial: r(2650000), hargaUpah: r(420000) },
        { group: 'D. Saniter & Pintu', uraian: 'Pintu kamar mandi aluminium/UPVC tahan air komplit', volume: 1, satuan: 'unit', hargaMaterial: r(1280000), hargaUpah: r(220000) }
      ];
    }
  },
  'renovasi-dapur': {
    id: 'renovasi-dapur',
    label: 'Renovasi Dapur + Meja Cor Granit',
    defaultLuas: 9,
    defaultDurasiHari: 18,
    satuanAcuan: 'm² Area Dapur',
    buildRows: (luas, mult) => {
      const L = Math.max(4, Number(luas) || 9);
      const panjangMeja = +(Math.max(2.4, Math.sqrt(L) * 1.2)).toFixed(1);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Persiapan & Meja Beton', uraian: 'Bongkar meja lama, perapian jalur dinding & buang puing', volume: 1, satuan: 'ls', hargaMaterial: r(350000), hargaUpah: r(550000) },
        { group: 'A. Persiapan & Meja Beton', uraian: 'Cor meja dapur beton bertulang lebar 60 cm + kaki penyangga', volume: panjangMeja, satuan: 'm\'', hargaMaterial: r(265000), hargaUpah: r(145000) },
        { group: 'B. Pelapis Granit & Backsplash', uraian: 'Lapis top table meja dapur granit tile 60×60 + bibir rapi', volume: +(panjangMeja * 0.85).toFixed(1), satuan: 'm²', hargaMaterial: r(210000), hargaUpah: r(95000) },
        { group: 'B. Pelapis Granit & Backsplash', uraian: 'Pasang keramik dinding backsplash mudah dilap anti-minyak', volume: +(panjangMeja * 0.9).toFixed(1), satuan: 'm²', hargaMaterial: r(145000), hargaUpah: r(75000) },
        { group: 'B. Pelapis Granit & Backsplash', uraian: 'Pasang lantai granit 60×60 area dapur', volume: L, satuan: 'm²', hargaMaterial: r(175000), hargaUpah: r(70000) },
        { group: 'C. Sink, Pipa & Listrik Dapur', uraian: 'Pasang kitchen sink stainless SUS 304 + kran angsa + pipa buang', volume: 1, satuan: 'paket', hargaMaterial: r(1150000), hargaUpah: r(280000) },
        { group: 'C. Sink, Pipa & Listrik Dapur', uraian: 'Instalasi 3 stop kontak alat dapur NYM 3×2,5 + lampu kerja', volume: 4, satuan: 'titik', hargaMaterial: r(185000), hargaUpah: r(90000) },
        { group: 'D. Pengecatan & Perapian', uraian: 'Pengecatan ulang dinding & plafon ruang dapur bersih', volume: +(L * 2.8).toFixed(1), satuan: 'm²', hargaMaterial: r(28000), hargaUpah: r(20000) }
      ];
    }
  },
  'atap-baja-ringan': {
    id: 'atap-baja-ringan',
    label: 'Ganti Rangka Atap Baja Ringan + Genteng',
    defaultLuas: 54,
    defaultDurasiHari: 12,
    satuanAcuan: 'm² Bidang Atap',
    buildRows: (luas, mult) => {
      const L = Math.max(15, Number(luas) || 54);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Bongkar & Pengaman', uraian: 'Bongkar genteng & kayu lapuk lama + proteksi terpal hujan', volume: L, satuan: 'm²', hargaMaterial: r(9000), hargaUpah: r(44000) },
        { group: 'B. Struktur Atap Baru', uraian: 'Perbaikan/perataan dudukan ring balk beton tumpuan kuda-kuda', volume: +(Math.sqrt(L) * 4).toFixed(1), satuan: 'm\'', hargaMaterial: r(65000), hargaUpah: r(45000) },
        { group: 'B. Struktur Atap Baru', uraian: 'Rangka atap baja ringan C75.075 SNI + reng terpasang', volume: L, satuan: 'm²', hargaMaterial: r(135000), hargaUpah: r(55000) },
        { group: 'B. Struktur Atap Baru', uraian: 'Insulasi peredam panas aluminium foil bubble bawah reng', volume: L, satuan: 'm²', hargaMaterial: r(28000), hargaUpah: r(12000) },
        { group: 'C. Penutup Atap & Anti-Bocor', uraian: 'Penutup atap genteng metal pasir peredam bising hujan', volume: L, satuan: 'm²', hargaMaterial: r(92000), hargaUpah: r(32000) },
        { group: 'C. Penutup Atap & Anti-Bocor', uraian: 'Nok bubungan + flashing waterproofing sambungan dinding', volume: +(Math.sqrt(L) * 1.8).toFixed(1), satuan: 'm\'', hargaMaterial: r(74000), hargaUpah: r(36000) },
        { group: 'C. Penutup Atap & Anti-Bocor', uraian: 'Lisplank GRC 20 cm keliling + pengecatan tahan cuaca', volume: +(Math.sqrt(L) * 4).toFixed(1), satuan: 'm\'', hargaMaterial: r(54000), hargaUpah: r(28000) }
      ];
    }
  },
  'kanopi-carport': {
    id: 'kanopi-carport',
    label: 'Kanopi Carport Minimalis + Lantai Parkir',
    defaultLuas: 18,
    defaultDurasiHari: 7,
    satuanAcuan: 'm² Carport',
    buildRows: (luas, mult) => {
      const L = Math.max(9, Number(luas) || 18);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Kanopi Besi Galvanis', uraian: 'Rangka kanopi hollow galvanis 4×8 & 4×6 cat duco hitam anti-karat', volume: L, satuan: 'm²', hargaMaterial: r(320000), hargaUpah: r(115000) },
        { group: 'A. Kanopi Besi Galvanis', uraian: 'Atap dingin UPVC twinwall (setara Alderon) + baut seal karet', volume: L, satuan: 'm²', hargaMaterial: r(245000), hargaUpah: r(42000) },
        { group: 'A. Kanopi Besi Galvanis', uraian: 'Talang air depan kanopi + pipa buang PVC 3 inch rapi', volume: +(Math.sqrt(L) * 1.2).toFixed(1), satuan: 'm\'', hargaMaterial: r(72000), hargaUpah: r(32000) },
        { group: 'B. Perkerasan Lantai Carport', uraian: 'Perataan tanah dasar + lantai koral sikat / paving K-300', volume: L, satuan: 'm²', hargaMaterial: r(140000), hargaUpah: r(75000) }
      ];
    }
  },
  'cat-plafon-rumah': {
    id: 'cat-plafon-rumah',
    label: 'Peremajaan Plafon Gypsum & Cat Full Rumah',
    defaultLuas: 45,
    defaultDurasiHari: 10,
    satuanAcuan: 'm² Luas Rumah',
    buildRows: (luas, mult) => {
      const L = Math.max(18, Number(luas) || 45);
      const r = (n) => Math.round((n * mult) / 500) * 500;
      return [
        { group: 'A. Pekerjaan Plafon', uraian: 'Plafon gypsum 9 mm rangka hollow galvalum + kompon rata', volume: L, satuan: 'm²', hargaMaterial: r(82000), hargaUpah: r(48000) },
        { group: 'A. Pekerjaan Plafon', uraian: 'List shadow line / profil tepi plafon rapi', volume: +(L * 1.1).toFixed(1), satuan: 'm\'', hargaMaterial: r(18000), hargaUpah: r(16000) },
        { group: 'B. Pekerjaan Pengecatan', uraian: 'Kerok bagian terkelupas, perapian retak rambut & cat interior 2 lapis', volume: +(L * 2.9).toFixed(1), satuan: 'm²', hargaMaterial: r(26000), hargaUpah: r(20000) },
        { group: 'B. Pekerjaan Pengecatan', uraian: 'Pengecatan fasad luar tahan cuaca (weatherproof)', volume: +(L * 0.8).toFixed(1), satuan: 'm²', hargaMaterial: r(38000), hargaUpah: r(20000) },
        { group: 'B. Pekerjaan Pengecatan', uraian: 'Pengecatan plafon putih doff 2 lapis bersih', volume: L, satuan: 'm²', hargaMaterial: r(21000), hargaUpah: r(17000) }
      ];
    }
  }
};

export function formatRupiah(num) {
  const n = Math.round(Number(num) || 0);
  return 'Rp' + n.toLocaleString('id-ID');
}

export function parseMasaGaransi(val) {
  if (val === '' || val === null || val === undefined) return 60;
  const parsed = Number(val);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(3650, Math.round(parsed))) : 60;
}

export function formatSpkNumber(nomorDokumen) {
  const raw = String(nomorDokumen ?? '').trim();
  if (!raw) return 'SPK/2026/001';
  if (/^SPK\//i.test(raw)) return raw.replace(/^spk\//i, 'SPK/');
  if (/^RAB[-/]/i.test(raw)) return raw.replace(/^RAB[-/]/i, 'SPK/');
  return `SPK/${raw.replace(/^\/+/, '')}`;
}

export function formatTanggalIndo(dateInput) {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
  }
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Menghitung seluruh rekapitulasi biaya fisik, material vs upah, fee pemborong,
 * pembulatan penawaran, harga per m², dan tahapan termin pembayaran.
 * Rumus baris diseragamkan: Math.round(vol * (mat + upah)) di Step 2, PDF, dan Excel.
 */
export function calculateRabSummary(project) {
  const rows = Array.isArray(project.rows) ? project.rows : [];
  let subtotalMaterial = 0;
  let subtotalUpah = 0;

  const computedRows = rows.map((row, idx) => {
    const vol = Math.max(0, Number(row.volume) || 0);
    const mat = Math.max(0, Number(row.hargaMaterial) || 0);
    const upah = Math.max(0, Number(row.hargaUpah ?? row.upahKerja) || 0);
    const hargaSatuan = mat + upah;
    const jumlahMaterial = Math.round(vol * mat);
    const jumlahUpah = Math.round(vol * upah);
    const jumlahTotal = Math.round(vol * hargaSatuan);

    subtotalMaterial += jumlahMaterial;
    subtotalUpah += jumlahUpah;

    return {
      no: idx + 1,
      group: row.group || 'Pekerjaan Konstruksi',
      uraian: row.uraian || 'Item Pekerjaan',
      volume: vol,
      satuan: row.satuan || 'ls',
      hargaMaterial: mat,
      hargaUpah: upah,
      hargaSatuan,
      jumlahTotal
    };
  });

  const subtotalFisik = computedRows.reduce((acc, r) => acc + r.jumlahTotal, 0);
  const rawFee = project.feePersen;
  const parsedFee = rawFee === '' || rawFee === null || rawFee === undefined ? 10 : Number(rawFee);
  const feePersen = Number.isFinite(parsedFee) ? Math.max(0, Math.min(35, parsedFee)) : 10;
  const feeNominal = Math.round(subtotalFisik * (feePersen / 100));
  const rawGrandTotal = subtotalFisik + feeNominal;
  const grandTotal = Math.round(rawGrandTotal / 1000) * 1000;
  const luas = Math.max(1, Number(project.luasM2) || 1);
  const hargaPerM2 = Math.round(grandTotal / luas);

  const terminList = [
    {
      tahap: 'Termin I — Uang Muka / DP',
      syarat: 'Saat SPK disepakati & pengiriman material awal ke lokasi',
      persen: 30,
      nominal: Math.round((grandTotal * 0.3) / 1000) * 1000
    },
    {
      tahap: 'Termin II — Progres Fisik 50%',
      syarat: 'Saat pekerjaan fisik lapangan mencapai bobot 50%',
      persen: 35,
      nominal: Math.round((grandTotal * 0.35) / 1000) * 1000
    },
    {
      tahap: 'Termin III — Progres Fisik 90%',
      syarat: 'Saat pekerjaan finishing utama mencapai bobot 90%',
      persen: 30,
      nominal: Math.round((grandTotal * 0.3) / 1000) * 1000
    }
  ];
  const sumFirst3 = terminList.reduce((acc, t) => acc + t.nominal, 0);
  terminList.push({
    tahap: 'Termin IV — Serah Terima 100%',
    syarat: 'Setelah pemeriksaan bersama (checklist akhir) & serah terima kunci',
    persen: 5,
    nominal: Math.max(0, grandTotal - sumFirst3)
  });

  return {
    computedRows,
    subtotalMaterial,
    subtotalUpah,
    subtotalFisik,
    feePersen,
    feeNominal,
    grandTotal,
    hargaPerM2,
    terminList
  };
}

/**
 * Kalkulator Belanja Material Fisik Toko Bangunan (Semen, Bata, Pasir, Granit, Cat, Beton)
 */
export function calculateMaterialShoppingList({
  luasDindingM2 = 40,
  jenisBata = 'hebel',
  luasLantaiM2 = 36,
  luasCatM2 = 90,
  volumeBetonM3 = 2.5
}) {
  const dinding = Math.max(0, Number(luasDindingM2) || 0);
  const lantai = Math.max(0, Number(luasLantaiM2) || 0);
  const cat = Math.max(0, Number(luasCatM2) || 0);
  const beton = Math.max(0, Number(volumeBetonM3) || 0);

  const list = [];

  if (dinding > 0) {
    if (jenisBata === 'hebel') {
      const kubikHebel = +(dinding * 0.105).toFixed(1);
      const buahHebel = Math.ceil(dinding * 8.6);
      const sakPerekat = Math.ceil(dinding * 0.12);
      const sakPlesterAcian = Math.ceil(dinding * 2 * 0.35);
      list.push({ nama: 'Bata Ringan Hebel 10×20×60 cm', qty: `${buahHebel} buah (±${kubikHebel} m³)`, catatan: 'Sudah termasuk cadangan potong 5%' });
      list.push({ nama: 'Mortar Perekat Bata Ringan (40 kg)', qty: `${sakPerekat} sak`, catatan: 'Adukan tipis thinbed 3 mm' });
      list.push({ nama: 'Semen Plester & Acian Dinding 2 Sisi (40 kg)', qty: `${sakPlesterAcian} sak`, catatan: 'Untuk plester + aci luar-dalam' });
    } else {
      const buahBata = Math.ceil(dinding * 73);
      const sakSemenPasang = Math.ceil(dinding * 0.72);
      const m3PasirPasang = +(dinding * 0.095).toFixed(1);
      list.push({ nama: 'Bata Merah Bakar Standar', qty: `${buahBata.toLocaleString('id-ID')} buah`, catatan: 'Termasuk cadangan patah 5%' });
      list.push({ nama: 'Semen Portland 40 kg (Pasang + Plester)', qty: `${sakSemenPasang} sak`, catatan: 'Campuran spesi 1 PC : 5 PP' });
      list.push({ nama: 'Pasir Pasang Ayak', qty: `${m3PasirPasang} m³`, catatan: 'Untuk pasangan bata & plesteran' });
    }
  }

  if (lantai > 0) {
    const dusGranit = Math.ceil((lantai * 1.06) / 1.44);
    const sakSemenLantai = Math.ceil(lantai * 0.28);
    list.push({ nama: 'Granit Tile 60×60 cm (1,44 m²/dus)', qty: `${dusGranit} dus`, catatan: 'Sudah lebihkan 6% untuk potongan pinggir' });
    list.push({ nama: 'Semen / Perekat Keramik Lantai (40 kg)', qty: `${sakSemenLantai} sak`, catatan: 'Termasuk nat keramik' });
  }

  if (cat > 0) {
    const galonSealer = Math.ceil(cat / 28);
    const galonCatUtama = Math.ceil((cat * 2) / 26);
    list.push({ nama: 'Cat Dasar Alkali Sealer (Galon 4–5 kg)', qty: `${galonSealer} galon`, catatan: '1 lapis dasar penahan lembap' });
    list.push({ nama: 'Cat Tembok Utama (Galon 5 kg / setara Pail)', qty: `${galonCatUtama} galon`, catatan: 'Untuk 2 lapis tutup rata' });
  }

  if (beton > 0) {
    const sakSemenCor = Math.ceil(beton * 8.2);
    const pasirCor = +(beton * 0.56).toFixed(1);
    const splitCor = +(beton * 0.82).toFixed(1);
    list.push({ nama: 'Semen Cor Struktur Beton (40 kg)', qty: `${sakSemenCor} sak`, catatan: 'Mutu setara K-225 (1:2:3)' });
    list.push({ nama: 'Pasir Beton & Batu Split 1/2', qty: `${pasirCor} m³ pasir + ${splitCor} m³ split`, catatan: 'Material cor sloof/kolom/dak' });
  }

  return list;
}

/**
 * 1) GENERATOR PDF RESMI: Surat Penawaran Harga + Tabel RAB + Termin + Tanda Tangan
 */
export function generateRabPdfBlob(project, summary) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;
  const bottomLimit = pageH - 18;
  let y = 16;

  const ensureSpace = (needed = 16) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 18;
      return true;
    }
    return false;
  };

  // Kop Kontraktor
  const kopTitle = (project.namaUsaha || project.namaPelaksana || 'PELAKSANA KONSTRUKSI & BORONGAN').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  const kopTitleLines = doc.splitTextToSize(kopTitle, contentW - 8);
  const kopBarH = Math.max(15, kopTitleLines.length * 5 + 9.5);

  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y, 4, kopBarH, 'F');
  doc.setTextColor(20, 20, 18);
  doc.text(kopTitleLines, margin + 7, y + 5);

  const subKopY = y + kopTitleLines.length * 5 + 1.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(90, 90, 84);
  const kopContact = doc.splitTextToSize(
    `Penanggung Jawab: ${project.namaPelaksana || 'Pelaksana Proyek'}  |  Telp/WA: ${project.teleponUsaha || '-'}`,
    contentW - 8
  );
  doc.text(kopContact[0] || '', margin + 7, subKopY + 3.5);
  doc.text(`Alamat / Domisili: ${project.kota || 'Indonesia'}`, margin + 7, subKopY + 7.5);

  y += kopBarH + 4;
  doc.setDrawColor(220, 220, 214);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(20, 20, 18);
  doc.text('SURAT PENAWARAN HARGA & RENCANA ANGGARAN BIAYA (RAB)', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 84);
  doc.text(
    `Nomor: ${project.nomorDokumen || 'RAB/2026/001'}   •   Tanggal: ${formatTanggalIndo(project.tanggal)}`,
    pageW / 2,
    y,
    { align: 'center' }
  );
  y += 6;

  // Kotak Info Proyek (tanpa pemotongan .slice(0, 32), dibungkus rapi memakai splitTextToSize)
  doc.setFontSize(8.6);
  const colMid = margin + 96;
  const leftValW = 55;
  const rightValW = contentW - 96 - 44 - 3;
  const garansiHari = parseMasaGaransi(project.masaGaransiHari);

  const klienLines = doc.splitTextToSize(String(project.namaKlien || '-'), leftValW);
  const judulLines = doc.splitTextToSize(String(project.judulProyek || 'Pekerjaan Konstruksi'), leftValW);
  const lokasiLines = doc.splitTextToSize(String(project.lokasiProyek || '-'), leftValW);

  const luasLines = doc.splitTextToSize(`${project.luasM2 || 36} m²`, rightValW);
  const durasiLines = doc.splitTextToSize(`${project.durasiHari || 30} Hari Kalender`, rightValW);
  const garansiLines = doc.splitTextToSize(`${garansiHari} Hari Kalender`, rightValW);

  const r1H = Math.max(5.5, Math.max(klienLines.length, luasLines.length) * 4);
  const r2H = Math.max(5.5, Math.max(judulLines.length, durasiLines.length) * 4);
  const r3H = Math.max(5.5, Math.max(lokasiLines.length, garansiLines.length) * 4);
  const infoBoxH = 5 + r1H + r2H + r3H + 2.5;

  doc.setFillColor(250, 249, 245);
  doc.setDrawColor(225, 222, 212);
  doc.roundedRect(margin, y, contentW, infoBoxH, 2, 2, 'FD');

  let infoY = y + 5.5;
  doc.setTextColor(30, 30, 28);

  // Baris 1 Info
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada Yth (Klien):', margin + 4, infoY);
  doc.text('Volume / Luas Acuan:', colMid, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(klienLines, margin + 36, infoY);
  doc.text(luasLines, colMid + 44, infoY);
  infoY += r1H;

  // Baris 2 Info
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Pekerjaan:', margin + 4, infoY);
  doc.text('Estimasi Waktu Kerja:', colMid, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(judulLines, margin + 36, infoY);
  doc.text(durasiLines, colMid + 44, infoY);
  infoY += r2H;

  // Baris 3 Info
  doc.setFont('helvetica', 'bold');
  doc.text('Lokasi Proyek:', margin + 4, infoY);
  doc.text('Garansi Pemeliharaan:', colMid, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(lokasiLines, margin + 36, infoY);
  doc.text(garansiLines, colMid + 44, infoY);

  y += infoBoxH + 6;

  // Header Tabel RAB
  const drawTableHeader = () => {
    doc.setFillColor(28, 25, 23);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('No', margin + 2, y + 5.3);
    doc.text('Uraian Pekerjaan & Spesifikasi', margin + 10, y + 5.3);
    doc.text('Vol', margin + 104, y + 5.3, { align: 'right' });
    doc.text('Sat', margin + 108, y + 5.3);
    doc.text('Harga Satuan', margin + 146, y + 5.3, { align: 'right' });
    doc.text('Jumlah Harga', margin + contentW - 2, y + 5.3, { align: 'right' });
    y += 8;
  };

  drawTableHeader();

  let lastGroup = '';
  for (const r of summary.computedRows) {
    const wrappedUraian = doc.splitTextToSize(String(r.uraian), 84);
    const rowH = Math.max(6.8, wrappedUraian.length * 4.2 + 2.4);

    if (r.group !== lastGroup) {
      // Cegah subjudul kelompok menggantung sendirian di bawah halaman (minimal muat header grup + baris pertama)
      if (y + Math.max(22, 6.5 + rowH) > bottomLimit) {
        doc.addPage();
        y = 18;
        drawTableHeader();
      }
      doc.setFillColor(255, 244, 234);
      doc.rect(margin, y, contentW, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(180, 68, 10);
      doc.text(String(r.group), margin + 3, y + 4.5);
      y += 6.5;
      lastGroup = r.group;
    } else if (y + rowH > bottomLimit) {
      doc.addPage();
      y = 18;
      drawTableHeader();
    }

    doc.setDrawColor(232, 230, 224);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(28, 28, 26);
    doc.text(String(r.no), margin + 2.5, y + 4.5);
    doc.text(wrappedUraian, margin + 10, y + 4.5);
    doc.text(String(r.volume), margin + 104, y + 4.5, { align: 'right' });
    doc.text(String(r.satuan), margin + 108, y + 4.5);
    doc.text(formatRupiah(r.hargaSatuan), margin + 146, y + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatRupiah(r.jumlahTotal), margin + contentW - 2, y + 4.5, { align: 'right' });
    y += rowH;
  }

  // Rekapitulasi Total
  ensureSpace(34);
  y += 4;
  const sumBoxX = margin + 88;
  const sumBoxW = contentW - 88;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(70, 70, 65);
  doc.text('Subtotal Biaya Fisik (Material + Upah):', sumBoxX, y + 4);
  doc.text(formatRupiah(summary.subtotalFisik), margin + contentW - 2, y + 4, { align: 'right' });
  y += 5.5;

  doc.text(`Jasa Pengelolaan & Pengawasan (${summary.feePersen}%):`, sumBoxX, y + 4);
  doc.text(formatRupiah(summary.feeNominal), margin + contentW - 2, y + 4, { align: 'right' });
  y += 6.5;

  doc.setFillColor(249, 115, 22);
  doc.roundedRect(sumBoxX - 2, y, sumBoxW + 2, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PENAWARAN (DIBULATKAN)', sumBoxX + 1, y + 6);
  doc.text(formatRupiah(summary.grandTotal), margin + contentW - 2, y + 6, { align: 'right' });
  y += 14;

  // Tahapan Termin Pembayaran (tanpa kurung ganda & tanpa tumpang tindih kolom)
  ensureSpace(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(20, 20, 18);
  doc.text('TAHAPAN PEMBAYARAN TERMIN PROGRES:', margin, y);
  y += 5;

  for (const t of summary.terminList) {
    doc.setFontSize(8.1);
    const syaratWrapped = doc.splitTextToSize(`Syarat pencairan: ${t.syarat}`, contentW - 8);
    const itemBlockH = 4.4 + syaratWrapped.length * 3.8 + 1.8;
    ensureSpace(itemBlockH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.3);
    doc.setTextColor(32, 32, 29);
    doc.text(`• ${t.tahap} (${t.persen}%): ${formatRupiah(t.nominal)}`, margin + 2, y + 3.4);
    y += 4.3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.9);
    doc.setTextColor(95, 95, 88);
    doc.text(syaratWrapped, margin + 6, y + 3.1);
    y += syaratWrapped.length * 3.8 + 1.4;
  }

  // Catatan Penawaran (dipaginasi baris demi baris dengan ensureSpace(7))
  ensureSpace(15);
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.6);
  doc.setTextColor(20, 20, 18);
  doc.text('CATATAN & KETENTUAN PENAWARAN:', margin, y);
  y += 4.5;

  const catatanRaw =
    (project.catatanPenawaran && project.catatanPenawaran.trim()) ||
    'Harga berlaku 14 hari kalender sejak diterbitkan. Pekerjaan tambah/kurang di luar rincian RAB dihitung secara tertulis melalui Addendum yang disetujui bersama.';
  const catatanParagraphs = catatanRaw
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.1);
  doc.setTextColor(75, 75, 70);

  for (let pIdx = 0; pIdx < catatanParagraphs.length; pIdx++) {
    const wrappedPara = doc.splitTextToSize(catatanParagraphs[pIdx], contentW);
    for (const line of wrappedPara) {
      ensureSpace(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.1);
      doc.setTextColor(75, 75, 70);
      doc.text(line, margin, y + 3.2);
      y += 4.2;
    }
    if (pIdx < catatanParagraphs.length - 1) {
      y += 1.6;
    }
  }
  y += 6;

  // Blok Tanda Tangan
  ensureSpace(36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(25, 25, 22);
  doc.text('Menyetujui Pemberi Tugas,', margin + 8, y);
  doc.text(`${project.kota || 'Indonesia'}, ${formatTanggalIndo(project.tanggal)}`, margin + 108, y);
  doc.text('Hormat Kami, Pelaksana', margin + 108, y + 4.5);

  y += 22;
  doc.setFont('helvetica', 'bold');
  const signKlien = doc.splitTextToSize(`(${project.namaKlien || 'Pemilik Proyek'})`, 78);
  const signPelaksana = doc.splitTextToSize(
    `(${project.namaPelaksana || project.namaUsaha || 'Pelaksana'})`,
    72
  );
  doc.text(signKlien, margin + 8, y);
  doc.text(signPelaksana, margin + 108, y);

  // Nomor Halaman Footer di Setiap Halaman
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(232, 230, 224);
    doc.line(margin, pageH - 13, pageW - margin, pageH - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(120, 120, 112);
    doc.text(
      `RancangRAB Studio  •  ${project.nomorDokumen || 'RAB'}  •  Halaman ${p} dari ${totalPages}`,
      pageW / 2,
      pageH - 8.5,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 2) GENERATOR MICROSOFT EXCEL ASLI (.xlsx OOXML) LENGKAP RUMUS PERKALIAN, SUM & BORDER RAPI
 */
export function generateRabXlsxBlob(project, summary) {
  const xmlRows = [];
  let rowNum = 1;

  const addTitleRow = (text, styleIdx = 1) => {
    xmlRows.push(
      `<row r="${rowNum}"><c r="A${rowNum}" s="${styleIdx}" t="inlineStr"><is><t>${escapeXml(text)}</t></is></c></row>`
    );
    rowNum += 1;
  };

  addTitleRow(`RENCANA ANGGARAN BIAYA (RAB) — ${project.judulProyek || 'PROYEK KONSTRUKSI'}`, 1);
  addTitleRow(
    `Klien: ${project.namaKlien || '-'} | Lokasi: ${project.lokasiProyek || '-'} | Pelaksana: ${project.namaUsaha || project.namaPelaksana || '-'}`,
    0
  );
  rowNum += 1; // baris kosong

  // Header Tabel di baris 4 (style 2 = header oranye huruf putih + border tipis)
  const headerRowIdx = rowNum;
  const headers = [
    'No',
    'Kelompok',
    'Uraian Pekerjaan',
    'Volume',
    'Satuan',
    'Harga Material (Rp)',
    'Upah Tukang (Rp)',
    'Harga Satuan (Rp)',
    'Jumlah Total (Rp)'
  ];
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  xmlRows.push(
    `<row r="${headerRowIdx}">` +
      headers
        .map((h, i) => `<c r="${colLetters[i]}${headerRowIdx}" s="2" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`)
        .join('') +
      `</row>`
  );
  rowNum += 1;

  const hasRows = summary.computedRows.length > 0;
  const firstDataRow = rowNum;

  for (const r of summary.computedRows) {
    const rn = rowNum;
    xmlRows.push(
      `<row r="${rn}">` +
        `<c r="A${rn}" s="5"><v>${r.no}</v></c>` +
        `<c r="B${rn}" s="5" t="inlineStr"><is><t>${escapeXml(r.group)}</t></is></c>` +
        `<c r="C${rn}" s="5" t="inlineStr"><is><t>${escapeXml(r.uraian)}</t></is></c>` +
        `<c r="D${rn}" s="5"><v>${r.volume}</v></c>` +
        `<c r="E${rn}" s="5" t="inlineStr"><is><t>${escapeXml(r.satuan)}</t></is></c>` +
        `<c r="F${rn}" s="3"><v>${r.hargaMaterial}</v></c>` +
        `<c r="G${rn}" s="3"><v>${r.hargaUpah}</v></c>` +
        `<c r="H${rn}" s="3"><f>F${rn}+G${rn}</f><v>${r.hargaSatuan}</v></c>` +
        `<c r="I${rn}" s="3"><f>ROUND(D${rn}*H${rn},0)</f><v>${r.jumlahTotal}</v></c>` +
        `</row>`
    );
    rowNum += 1;
  }

  const lastDataRow = rowNum - 1;
  const emptySummaryBorders = (rn, styleIdx = 5) =>
    ['A', 'B']
      .map((c) => `<c r="${c}${rn}" s="${styleIdx}"/>`)
      .join('');
  const midSummaryBorders = (rn, styleIdx = 5) =>
    ['D', 'E', 'F', 'G', 'H']
      .map((c) => `<c r="${c}${rn}" s="${styleIdx}"/>`)
      .join('');

  // Baris Subtotal, Jasa & Grand Total (aman terhadap tabel kosong tanpa circular SUM)
  const subRow = rowNum;
  const subFormulaCell = hasRows
    ? `<c r="I${subRow}" s="4"><f>SUM(I${firstDataRow}:I${lastDataRow})</f><v>${summary.subtotalFisik}</v></c>`
    : `<c r="I${subRow}" s="4"><v>0</v></c>`;

  xmlRows.push(
    `<row r="${subRow}">` +
      emptySummaryBorders(subRow, 6) +
      `<c r="C${subRow}" s="6" t="inlineStr"><is><t>SUBTOTAL BIAYA FISIK (MATERIAL + UPAH)</t></is></c>` +
      midSummaryBorders(subRow, 6) +
      subFormulaCell +
      `</row>`
  );
  rowNum += 1;

  const feeRow = rowNum;
  xmlRows.push(
    `<row r="${feeRow}">` +
      emptySummaryBorders(feeRow, 5) +
      `<c r="C${feeRow}" s="5" t="inlineStr"><is><t>Jasa Pengelolaan &amp; Pengawasan (${summary.feePersen}%)</t></is></c>` +
      midSummaryBorders(feeRow, 5) +
      `<c r="I${feeRow}" s="3"><f>ROUND(I${subRow}*${summary.feePersen / 100},0)</f><v>${summary.feeNominal}</v></c>` +
      `</row>`
  );
  rowNum += 1;

  const grandRow = rowNum;
  xmlRows.push(
    `<row r="${grandRow}">` +
      emptySummaryBorders(grandRow, 2) +
      `<c r="C${grandRow}" s="2" t="inlineStr"><is><t>TOTAL NILAI PENAWARAN (DIBULATKAN)</t></is></c>` +
      midSummaryBorders(grandRow, 2) +
      `<c r="I${grandRow}" s="7"><f>ROUND(I${subRow}+I${feeRow},-3)</f><v>${summary.grandTotal}</v></c>` +
      `</row>`
  );

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="46" customWidth="1"/>
    <col min="4" max="4" width="10" customWidth="1"/>
    <col min="5" max="5" width="10" customWidth="1"/>
    <col min="6" max="9" width="18" customWidth="1"/>
  </cols>
  <sheetData>${xmlRows.join('')}</sheetData>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF97316"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Rincian RAB" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const zipped = zipSync({
    '[Content_Types].xml': strToU8(contentTypesXml),
    '_rels/.rels': strToU8(rootRelsXml),
    'xl/workbook.xml': strToU8(workbookXml),
    'xl/_rels/workbook.xml.rels': strToU8(wbRelsXml),
    'xl/styles.xml': strToU8(stylesXml),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml)
  });

  return new Blob([zipped], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * 3) GENERATOR MICROSOFT WORD ASLI (.docx OOXML): Draf Surat Perjanjian Kerja Borongan (SPK)
 */
export function generateSpkDocxBlob(project, summary) {
  const spkNomor = formatSpkNumber(project.nomorDokumen);
  const garansiHari = parseMasaGaransi(project.masaGaransiHari);

  const pCenterBold = (t, sz = 26) =>
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="${sz}"/></w:rPr><w:t>${escapeXml(t)}</w:t></w:r></w:p>`;

  const pPasal = (t) =>
    `<w:p><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="C2410C"/><w:sz w:val="23"/></w:rPr><w:t>${escapeXml(t)}</w:t></w:r></w:p>`;

  const pText = (t, keepWithNext = false) =>
    `<w:p><w:pPr>${keepWithNext ? '<w:keepNext/>' : ''}<w:spacing w:after="90" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(t)}</w:t></w:r></w:p>`;

  const terminParagraphs = summary.terminList
    .map((t, idx) => pText(`${idx + 1}. ${t.tahap} (${t.persen}%) sebesar ${formatRupiah(t.nominal)} — ${t.syarat}.`))
    .join('');

  const catatanRaw =
    (project.catatanPenawaran && project.catatanPenawaran.trim()) ||
    'Setiap penambahan atau pengurangan item pekerjaan di luar rincian RAB wajib disepakati secara tertulis melalui Addendum Pekerjaan Tambah-Kurang.';
  const catatanParagraphs = catatanRaw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => pText(line))
    .join('');

  const cellPara = (text, { bold = false, italic = false, color = '1C1917', sz = 21, after = 40 } = {}) =>
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="${after}"/></w:pPr><w:r><w:rPr>${bold ? '<w:b/>' : ''}${italic ? '<w:i/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;

  const signatureTableXml = `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9026" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="140" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="140" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="4513"/>
        <w:gridCol w:w="4513"/>
      </w:tblGrid>
      <w:tr>
        <w:trPr><w:cantSplit/></w:trPr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4513" w:type="dxa"/></w:tcPr>
          ${cellPara('PIHAK PERTAMA', { bold: true, sz: 22, after: 20 })}
          ${cellPara('Pemberi Tugas / Pemilik Proyek', { color: '57534E', sz: 19, after: 260 })}
          ${cellPara('[ Meterai Rp10.000 ]', { italic: true, color: '78716C', sz: 18, after: 260 })}
          ${cellPara(`( ${project.namaKlien || '........................................'} )`, { bold: true, sz: 21, after: 20 })}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4513" w:type="dxa"/></w:tcPr>
          ${cellPara('PIHAK KEDUA', { bold: true, sz: 22, after: 20 })}
          ${cellPara(project.namaUsaha || 'Pelaksana Konstruksi', { color: '57534E', sz: 19, after: 260 })}
          ${cellPara('[ Meterai Rp10.000 ]', { italic: true, color: '78716C', sz: 18, after: 260 })}
          ${cellPara(`( ${project.namaPelaksana || project.namaUsaha || '........................................'} )`, { bold: true, sz: 21, after: 20 })}
        </w:tc>
      </w:tr>
    </w:tbl>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pCenterBold('SURAT PERJANJIAN KERJA BORONGAN (SPK)', 28)}
    ${pCenterBold(`Nomor: ${spkNomor}`, 21)}
    ${pText(`Pada tanggal ${formatTanggalIndo(project.tanggal)}, bertempat di ${project.kota || 'Indonesia'}, kami yang bertanda tangan di bawah ini:`)}
    ${pText(`1. PIHAK PERTAMA (Pemberi Tugas): ${project.namaKlien || 'Pemilik Proyek'}, selaku pemilik bangunan di lokasi ${project.lokasiProyek || '-'}.`)}
    ${pText(`2. PIHAK KEDUA (Pelaksana Konstruksi): ${project.namaPelaksana || '-'} (${project.namaUsaha || 'Pelaksana Borongan'}), Kontak: ${project.teleponUsaha || '-'}.`)}
    ${pText('Kedua belah pihak sepakat mengikatkan diri dalam Perjanjian Kerja Borongan dengan ketentuan pasal-pasal berikut:')}

    ${pPasal('PASAL 1 — LINGKUP PEKERJAAN')}
    ${pText(`PIHAK PERTAMA memberikan tugas kepada PIHAK KEDUA untuk melaksanakan "${project.judulProyek || 'Pekerjaan Konstruksi'}" dengan volume acuan ${project.luasM2 || 36} m² sesuai rincian item dan spesifikasi pada lampiran Rencana Anggaran Biaya (RAB) yang menjadi satu kesatuan tak terpisahkan dari perjanjian ini.`)}

    ${pPasal('PASAL 2 — NILAI BORONGAN & TAHAPAN PEMBAYARAN')}
    ${pText(`Total nilai borongan yang disepakati kedua belah pihak adalah sebesar ${formatRupiah(summary.grandTotal)} (sudah mencakup material sesuai RAB, upah kerja, dan jasa pengawasan lapangan), dengan jadwal pembayaran sebagai berikut:`)}
    ${terminParagraphs}
    ${project.rekeningPembayaran ? pText(`Pembayaran dilakukan melalui transfer ke rekening resmi: ${project.rekeningPembayaran}.`) : ''}

    ${pPasal('PASAL 3 — JANGKA WAKTU PELAKSANAAN')}
    ${pText(`Jangka waktu pelaksanaan pekerjaan disepakati selama ${project.durasiHari || 30} hari kalender terhitung sejak Uang Muka (Termin I) diterima dan lokasi siap dikerjakan.`)}

    ${pPasal('PASAL 4 — PEKERJAAN TAMBAH-KURANG & KETENTUAN LAPANGAN')}
    ${catatanParagraphs}

    ${pPasal('PASAL 5 — MASA PEMELIHARAAN (GARANSI PEKERJAAN)')}
    ${pText(`PIHAK KEDUA memberikan jaminan masa pemeliharaan hasil pekerjaan selama ${garansiHari} hari kalender terhitung sejak Berita Acara Serah Terima ditandatangani kedua belah pihak.`)}

    ${pText('Demikian Surat Perjanjian Kerja Borongan ini dibuat dalam rangkap 2 (dua) bermeterai cukup dan memiliki kekuatan hukum yang sama.', true)}
    ${signatureTableXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const wordStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:lang w:val="id-ID"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="100" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const zipped = zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rootRels),
    'word/document.xml': strToU8(documentXml),
    'word/styles.xml': strToU8(wordStylesXml),
    'word/_rels/document.xml.rels': strToU8(docRelsXml)
  });

  return new Blob([zipped], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

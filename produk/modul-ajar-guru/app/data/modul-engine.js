/**
 * Mesin Penyusun Otomatis Modul Ajar Kurikulum Merdeka, Deskripsi Rapor,
 * serta Generator File Jadi Asli: Word (.docx OOXML) & PDF Resmi (A4) & CSV e-Rapor.
 * Jalan 100% di browser tanpa butuh API Key.
 */

import { jsPDF, strToU8, zipSync } from '../vendor/doc-libs.min.mjs';

export const FASE_MAP = {
  'SD Kelas 1 (Fase A)': { jenjang: 'SD', fase: 'Fase A', jpMenit: 35 },
  'SD Kelas 2 (Fase A)': { jenjang: 'SD', fase: 'Fase A', jpMenit: 35 },
  'SD Kelas 3 (Fase B)': { jenjang: 'SD', fase: 'Fase B', jpMenit: 35 },
  'SD Kelas 4 (Fase B)': { jenjang: 'SD', fase: 'Fase B', jpMenit: 35 },
  'SD Kelas 5 (Fase C)': { jenjang: 'SD', fase: 'Fase C', jpMenit: 35 },
  'SD Kelas 6 (Fase C)': { jenjang: 'SD', fase: 'Fase C', jpMenit: 35 },
  'SMP Kelas 7 (Fase D)': { jenjang: 'SMP', fase: 'Fase D', jpMenit: 40 },
  'SMP Kelas 8 (Fase D)': { jenjang: 'SMP', fase: 'Fase D', jpMenit: 40 },
  'SMP Kelas 9 (Fase D)': { jenjang: 'SMP', fase: 'Fase D', jpMenit: 40 },
  'SMA/SMK Kelas 10 (Fase E)': { jenjang: 'SMA/SMK', fase: 'Fase E', jpMenit: 45 },
  'SMA/SMK Kelas 11 (Fase F)': { jenjang: 'SMA/SMK', fase: 'Fase F', jpMenit: 45 },
  'SMA/SMK Kelas 12 (Fase F)': { jenjang: 'SMA/SMK', fase: 'Fase F', jpMenit: 45 }
};

export const MODEL_BELAJAR_TEMPLATES = {
  'Problem Based Learning (PBL)': {
    label: 'Problem Based Learning (Berbasis Pemecahan Masalah)',
    steps: (topik, mapel) => [
      `Orientasi Peserta Didik pada Masalah: Guru menyajikan kasus nyata sehari-hari yang berkaitan dengan "${topik}" pada mata pelajaran ${mapel}, lalu mengajak murid mengamati dan mengidentifikasi persoalan utamanya.`,
      `Mengorganisasikan Peserta Didik: Murid dibagi ke dalam kelompok kolaboratif beranggotakan 4–5 orang, menerima Lembar Kerja Peserta Didik (LKPD), dan membagi peran kerja secara adil.`,
      `Membimbing Penyelidikan Kelompok: Setiap kelompok menggali informasi dari buku bacaan/peraga untuk menguji alternatif pemecahan masalah terkait "${topik}" dengan bimbingan keliling dari guru.`,
      `Mengembangkan dan Menyajikan Hasil Karya: Kelompok menuliskan simpulan solusinya secara runtut, kemudian perwakilan kelompok memaparkan hasil diskusi di depan kelas untuk ditanggapi kelompok lain secara santun.`,
      `Menganalisis dan Mengevaluasi Proses: Guru bersama murid memberikan penguatan konsep yang tepat tentang "${topik}" serta meluruskan kekeliruan pemahaman yang muncul selama diskusi.`
    ]
  },
  'Project Based Learning (PjBL)': {
    label: 'Project Based Learning (Berbasis Karya/Proyek)',
    steps: (topik, mapel) => [
      `Pertanyaan Mendasar: Guru mengaitkan materi "${topik}" (${mapel}) dengan kebutuhan nyata di lingkungan sekitar dan menyepakati tantangan produk karya yang akan dibuat murid.`,
      `Mendesain Perencanaan Proyek: Kelompok menyusun rancangan karya sederhana, pembagian tugas anggota, serta daftar alat dan bahan yang digunakan.`,
      `Menyusun Jadwal Pembuatan: Guru dan murid menyepakati batas waktu tiap tahapan pengerjaan agar proyek selesai tepat sesuai alokasi jam pelajaran.`,
      `Memonitor Keaktifan dan Perkembangan Proyek: Murid mengerjakan karya terkait "${topik}" secara aktif, sementara guru memantau kemajuan dan memberi umpan balik perbaikan di tiap meja.`,
      `Menguji Hasil dan Evaluasi Pengalaman: Setiap kelompok memamerkan hasil karyanya, saling memberi apresiasi antarkelompok, dan merefleksikan konsep "${topik}" yang telah dipelajari.`
    ]
  },
  'Discovery Learning': {
    label: 'Discovery Learning (Penemuan Konsep Terbimbing)',
    steps: (topik, mapel) => [
      `Pemberian Rangsangan (Stimulation): Guru menampilkan contoh konkret, gambar, atau peraga menarik mengenai "${topik}" untuk memancing rasa ingin tahu murid.`,
      `Identifikasi Masalah: Murid didorong mengajukan pertanyaan mengapa pola atau peristiwa pada "${topik}" tersebut terjadi dan menuliskan dugaan sementara.`,
      `Pengumpulan Data: Secara berpasangan atau berkelompok, murid melakukan pengamatan dan mencoba langkah-langkah pada LKPD ${mapel}.`,
      `Pengolahan Data dan Pembuktian: Murid membandingkan hasil temuannya dengan konsep pada sumber belajar untuk menguji kebenaran dugaan awal.`,
      `Menarik Simpulan (Generalization): Murid menyimpulkan aturan atau konsep inti "${topik}" menggunakan kalimat mereka sendiri dengan penguatan dari guru.`
    ]
  },
  'Pembelajaran Berdiferensiasi': {
    label: 'Pembelajaran Berdiferensiasi (Konten, Proses & Produk)',
    steps: (topik, mapel) => [
      `Pemetaan & Penyajian Ragam Sumber (Diferensiasi Konten): Guru menyajikan materi "${topik}" melalui bacaan ringkas, bagan visual, serta contoh konkret agar mudah diakses sesuai kesiapan belajar murid.`,
      ` Eksplorasi Bertahap (Diferensiasi Proses): Murid bekerja dalam kelompok dengan panduan bertingkat; guru memberi pendampingan lebih dekat (scaffolding) bagi meja yang masih membutuhkan penguatan konsep dasar.`,
      `Diskusi Silang & Penguatan Sebaya: Murid saling berbagi pemahaman tentang "${topik}" dan menyelesaikan latihan penerapan kontekstual ${mapel}.`,
      `Ekspresi Pemahaman (Diferensiasi Produk): Murid menyajikan hasil pemahamannya sesuai pilihan bentuk yang disepakati (ringkasan tertulis, peta konsep visual, atau paparan lisan singkat) mengacu pada satu rubrik kriteria yang sama.`
    ]
  },
  'Praktik Langsung (I Do – We Do – You Do)': {
    label: 'Demonstrasi & Praktik Bertahap (I Do – We Do – You Do)',
    steps: (topik, mapel) => [
      `Pemodelan oleh Guru (I Do): Guru memperagakan secara utuh dan perlahan langkah penguasaan "${topik}" pada mata pelajaran ${mapel} sambil menjelaskan alasan setiap langkah.`,
      `Praktik Terbimbing Bersama (We Do): Guru mengajak murid mempraktikkan contoh berikutnya secara bersama-sama sambil mengecek bagian yang masih membingungkan.`,
      `Latihan Berpasangan: Murid mencoba menyelesaikan latihan "${topik}" bersama teman sebangku untuk saling memeriksa ketelitian prosedur.`,
      `Praktik Mandiri (You Do): Setiap murid mengerjakan tantangan mandiri pada LKPD sebagai bukti ketercapaian tujuan pembelajaran hari itu.`
    ]
  }
};

export function formatTanggalIndonesia(dateInput) {
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
 * Menyusun objek Modul Ajar utuh siap pratinjau maupun ekspor ke Word (.docx) & PDF (.pdf).
 */
export function composeFullModulAjar(form) {
  const kelasInfo = FASE_MAP[form.kelasFase] || { jenjang: 'SD', fase: 'Fase B', jpMenit: 35 };
  const jumlahJp = Math.max(1, Number(form.jumlahJp) || 2);
  const totalMenit = jumlahJp * kelasInfo.jpMenit;
  const menitAwal = Math.max(10, Math.round(totalMenit * 0.15));
  const menitPenutup = Math.max(10, Math.round(totalMenit * 0.15));
  const menitInti = Math.max(20, totalMenit - menitAwal - menitPenutup);

  const mapel = (form.mapel || 'Ilmu Pengetahuan Alam dan Sosial (IPAS)').trim();
  const topik = (form.topik || 'Perubahan Wujud Benda di Sekitar Kita').trim();
  const modelKey = MODEL_BELAJAR_TEMPLATES[form.modelBelajar]
    ? form.modelBelajar
    : 'Problem Based Learning (PBL)';
  const modelData = MODEL_BELAJAR_TEMPLATES[modelKey];

  const tujuanPembelajaran = (form.tujuanPembelajaran || '').trim() ||
    `Melalui kegiatan pembelajaran menggunakan pendekatan ${modelKey}, peserta didik mampu memahami konsep inti "${topik}" pada mata pelajaran ${mapel}, mengaitkannya dengan permasalahan nyata sehari-hari, serta menyajikan hasil pemahamannya secara tepat dan bertanggung jawab.`;

  const pemahamanBermakna = (form.pemahamanBermakna || '').trim() ||
    `Memahami materi "${topik}" membantu peserta didik memecahkan persoalan nyata yang ditemui dalam kehidupan sehari-hari di rumah, sekolah, maupun masyarakat secara bijak dan bernalar kritis.`;

  const pertanyaanPemantik = (form.pertanyaanPemantik || '').trim() ||
    `1. Pernahkah kalian menjumpai peristiwa di rumah atau perjalanan ke sekolah yang berhubungan dengan ${topik}?\n2. Mengapa memahami ${topik} penting bagi kehidupan kita sehari-hari?`;

  const iceBreaking = (form.iceBreaking || '').trim() ||
    `Tepuk Fokus Pagi–Siang–Malam selama 3 menit untuk mengembalikan konsentrasi dan kesiapan menyimak seluruh peserta didik.`;

  const customInti = (form.kegiatanInti || '').trim();
  const langkahIntiList = customInti
    ? customInti.split(/\n+/).map((s) => s.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
    : modelData.steps(topik, mapel);

  const asesmenText = (form.asesmen || '').trim() ||
    `1. Asesmen Awal (Diagnostik): Tanya jawab lisan 2 pertanyaan prasyarat di awal pelajaran untuk memetakan kesiapan dasar murid.\n2. Asesmen Formatif (Proses): Observasi keaktifan diskusi kelompok, sikap kerja sama, serta pemeriksaan hasil pengerjaan LKPD "${topik}".\n3. Asesmen Sumatif (Lingkup Materi): Tes tertulis/unjuk kerja kontekstual untuk memastikan ketercapaian Tujuan Pembelajaran.`;

  const dimensiKarakter = Array.isArray(form.dimensiKarakter) && form.dimensiKarakter.length > 0
    ? form.dimensiKarakter.join(', ')
    : 'Penalaran Kritis, Kolaborasi (Gotong Royong), Kemandirian, dan Komunikasi';

  const sarana = (form.sarana || '').trim() ||
    `Buku teks ${mapel}, papan tulis, Lembar Kerja Peserta Didik (LKPD), serta benda/contoh nyata di sekitar ruang kelas.`;

  return {
    id: form.id || `modul-${Date.now()}`,
    createdAt: form.createdAt || new Date().toISOString(),
    identitas: {
      namaSekolah: (form.namaSekolah || 'SD Negeri 1 Nusantara').trim(),
      namaGuru: (form.namaGuru || 'Nama Guru Pengampu, S.Pd.').trim(),
      nipGuru: (form.nipGuru || '-').trim(),
      namaKepsek: (form.namaKepsek || 'Nama Kepala Sekolah, M.Pd.').trim(),
      nipKepsek: (form.nipKepsek || '-').trim(),
      kota: (form.kota || 'Jakarta').trim(),
      tanggalDokumen: formatTanggalIndonesia(form.tanggalDokumen),
      tahunAjaran: (form.tahunAjaran || '2026/2027').trim(),
      semester: form.semester || 'Ganjil',
      kelasFase: form.kelasFase || 'SD Kelas 4 (Fase B)',
      fase: kelasInfo.fase,
      jenjang: kelasInfo.jenjang,
      mapel,
      topik,
      alokasiWaktu: `${jumlahJp} JP (${jumlahJp} × ${kelasInfo.jpMenit} Menit = ${totalMenit} Menit)`,
      modelBelajar: modelData.label,
      dimensiKarakter,
      sarana
    },
    komponenInti: {
      tujuanPembelajaran,
      pemahamanBermakna,
      pertanyaanPemantik,
      iceBreaking,
      pendahuluan: {
        durasi: `${menitAwal} Menit`,
        langkah: [
          'Guru membuka kelas dengan salam hangat, menanyakan kabar, mengajak berdoa bersama, dan memeriksa kehadiran peserta didik.',
          'Guru melakukan apersepsi dengan mengaitkan materi pertemuan sebelumnya terhadap topik "' + topik + '" yang akan dipelajari hari ini.',
          'Guru menyampaikan pertanyaan pemantik serta Tujuan Pembelajaran dan manfaat praktis yang akan dikuasai peserta didik.',
          'Pengkondisian Fokus (Ice Breaking): ' + iceBreaking
        ]
      },
      inti: {
        durasi: `${menitInti} Menit`,
        langkah: langkahIntiList
      },
      penutup: {
        durasi: `${menitPenutup} Menit`,
        langkah: [
          'Peserta didik bersama guru merangkum poin-poin kunci yang telah dipelajari mengenai "' + topik + '".',
          'Peserta didik menuliskan refleksi singkat tentang bagian yang paling dipahami dan hal yang masih ingin ditanyakan.',
          'Guru memberikan apresiasi atas keaktifan kelompok, menyampaikan gambaran materi pertemuan selanjutnya, dan menutup kelas dengan doa serta salam.'
        ]
      },
      asesmen: asesmenText,
      rubrik: [
        {
          aspek: 'Pemahaman Konsep Materi',
          sangatBaik: `Mampu menjelaskan konsep "${topik}" secara tepat, runtut, dan disertai contoh nyata.`,
          baik: `Mampu menjelaskan konsep inti "${topik}" dengan benar namun contoh masih sederhana.`,
          cukup: 'Memahami sebagian konsep dasar namun masih memerlukan arahan guru.',
          perluBimbingan: 'Belum memahami konsep dasar dan memerlukan pendampingan khusus.'
        },
        {
          aspek: 'Kolaborasi & Keaktifan LKPD',
          sangatBaik: 'Sangat aktif berkontribusi ide, menghargai teman, dan menuntaskan LKPD tepat waktu.',
          baik: 'Ikut bekerja sama dengan baik dalam kelompok dan menyelesaikan tugas.',
          cukup: 'Terlibat dalam kelompok namun masih perlu diingatkan fokus pada tugas.',
          perluBimbingan: 'Pasif dalam kegiatan kelompok dan membutuhkan motivasi langsung.'
        },
        {
          aspek: 'Penyajian / Komunikasi Hasil',
          sangatBaik: 'Menyajikan hasil kerja dengan bahasa jelas, percaya diri, dan mampu menanggapi pertanyaan.',
          baik: 'Menyajikan hasil kerja dengan cukup jelas dan dapat dipahami kelas.',
          cukup: 'Masih membaca catatan penuh dengan suara yang perlu diperkeras.',
          perluBimbingan: 'Belum berani menyampaikan hasil kerja tanpa bantuan penuh dari guru.'
        }
      ],
      pengayaanRemedial: {
        pengayaan: `Peserta didik yang telah melampaui kriteria ketercapaian tujuan pembelajaran diberikan tantangan studi kasus lanjutan seputar "${topik}" atau berperan sebagai pendamping sebaya (mentor meja) bagi rekannya.`,
        remedial: `Peserta didik yang belum mencapai ketuntasan diberikan bimbingan ulang secara terfokus menggunakan peraga/contoh lebih sederhana khusus pada bagian indikator "${topik}" yang belum dikuasai, kemudian mengerjakan 2–3 soal setara.`
      },
      refleksi: {
        refleksiGuru: [
          'Apakah seluruh alur kegiatan berjalan sesuai rencana waktu dan membuat peserta didik terlibat aktif?',
          'Siapa peserta didik yang membutuhkan perhatian atau pendampingan lebih lanjut di pertemuan berikutnya?',
          'Langkah pengajaran mana yang paling efektif dan bagian mana yang perlu disempurnakan?'
        ],
        refleksiMurid: [
          `Apa hal paling menarik yang saya pahami hari ini tentang ${topik}?`,
          'Bagian mana yang menurut saya masih menantang dan perlu saya tanyakan lagi?',
          'Bagaimana sikap kerja sama saya bersama teman kelompok hari ini?'
        ]
      }
    },
    lkpd: {
      judul: `LEMBAR KERJA PESERTA DIDIK (LKPD) — ${topik.toUpperCase()}`,
      petunjuk: [
        'Tuliskan nama kelompok dan pembagian peran anggota di bagian atas lembar kerja.',
        `Bacalah permasalahan/pengamatan tentang "${topik}" dengan teliti bersama teman satu tim.`,
        'Diskusikan jawaban secara musyawarah dan siapkan 1 juru bicara untuk berbagi hasil.'
      ],
      tugas: [
        `Amatilah contoh kasus/fenomena yang berkaitan dengan "${topik}" di lingkungan sekitarmu, lalu catat 2 hal penting yang kamu temukan!`,
        `Jelaskan mengapa hal tersebut dapat terjadi berdasarkan konsep ${mapel} yang sedang kita pelajari hari ini!`,
        `Tuliskan 1 kesimpulan praktis atau solusi yang dapat diterapkan kelompokmu terkait "${topik}"!`
      ]
    }
  };
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
 * Menghasilkan File Microsoft Word (.docx) OOXML Asli (bukan HTML rename!)
 * lengkap dengan tabel berbingkai, heading rapi, daftar bernomor, lampiran LKPD,
 * dan tabel tanda tangan 2 kolom Kepala Sekolah & Guru.
 */
export function generateModulDocxBlob(modul) {
  const id = modul.identitas;
  const ki = modul.komponenInti;

  const pHeadingCenter = (text, sizeHalfPt = 28) => `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="${sizeHalfPt}"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
    </w:p>`;

  const pSectionTitle = (text) => `
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="100"/>
        <w:shd w:val="clear" w:color="auto" w:fill="E6F4F1"/>
      </w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="0F524C"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
    </w:p>`;

  const pSubTitle = (text) => `
    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
    </w:p>`;

  const pBody = (text, bold = false) =>
    String(text || '')
      .split(/\n+/)
      .map(
        (line) => `
    <w:p>
      <w:pPr><w:spacing w:before="40" w:after="80" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:r>${bold ? '<w:rPr><w:b/><w:sz w:val="22"/></w:rPr>' : '<w:rPr><w:sz w:val="22"/></w:rPr>'}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>
    </w:p>`
      )
      .join('');

  const pNumberedList = (items) =>
    items
      .map(
        (item, idx) => `
    <w:p>
      <w:pPr><w:ind w:left="360" w:hanging="360"/><w:spacing w:before="30" w:after="60" w:line="264" w:lineRule="auto"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${idx + 1}. </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(item)}</w:t></w:r>
    </w:p>`
      )
      .join('');

  const borderXml = `
    <w:tblBorders>
      <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
    </w:tblBorders>`;

  const infoRows = [
    ['Nama Penyusun', `${id.namaGuru}${id.nipGuru && id.nipGuru !== '-' ? ' (NIP. ' + id.nipGuru + ')' : ''}`],
    ['Satuan Pendidikan', id.namaSekolah],
    ['Tahun Pelajaran / Semester', `${id.tahunAjaran} — Semester ${id.semester}`],
    ['Jenjang / Kelas / Fase', `${id.kelasFase}`],
    ['Mata Pelajaran', id.mapel],
    ['Topik / Materi Pokok', id.topik],
    ['Alokasi Waktu', id.alokasiWaktu],
    ['Model Pembelajaran', id.modelBelajar],
    ['Dimensi Karakter Lulusan', id.dimensiKarakter],
    ['Sarana & Sumber Belajar', id.sarana]
  ]
    .map(
      ([k, v]) => `
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="3100" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>
          <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="21"/></w:rPr><w:t>${escapeXml(k)}</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="6260" w:type="dxa"/></w:tcPr>
          <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t>${escapeXml(v)}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>`
    )
    .join('');

  const rubrikHeader = `
    <w:tr>
      ${['Aspek Penilaian', 'Sangat Baik (4)', 'Baik (3)', 'Cukup (2)', 'Perlu Bimbingan (1)']
        .map(
          (h) => `
        <w:tc>
          <w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F766E"/></w:tcPr>
          <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(h)}</w:t></w:r></w:p>
        </w:tc>`
        )
        .join('')}
    </w:tr>`;

  const rubrikRows = ki.rubrik
    .map(
      (r) => `
    <w:tr>
      <w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(r.aspek)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(r.sangatBaik)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(r.baik)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(r.cukup)}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:rPr><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(r.perluBimbingan)}</w:t></w:r></w:p></w:tc>
    </w:tr>`
    )
    .join('');

  const signatureTable = `
    <w:tbl>
      <w:tblPr><w:tblW w:w="9360" w:type="dxa"/></w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4680" w:type="dxa"/></w:tcPr>
          ${pBody('Mengetahui,')}
          ${pBody('Kepala ' + id.namaSekolah, true)}
          <w:p><w:pPr><w:spacing w:before="720" w:after="60"/></w:pPr></w:p>
          ${pBody(id.namaKepsek, true)}
          ${pBody('NIP. ' + id.nipKepsek)}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4680" w:type="dxa"/></w:tcPr>
          ${pBody(`${id.kota}, ${id.tanggalDokumen}`)}
          ${pBody('Guru Pengampu,', true)}
          <w:p><w:pPr><w:spacing w:before="720" w:after="60"/></w:pPr></w:p>
          ${pBody(id.namaGuru, true)}
          ${pBody('NIP. ' + id.nipGuru)}
        </w:tc>
      </w:tr>
    </w:tbl>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pHeadingCenter('MODUL AJAR KURIKULUM MERDEKA', 30)}
    ${pHeadingCenter(id.namaSekolah.toUpperCase(), 24)}

    ${pSectionTitle('A. INFORMASI UMUM PERANGKAT AJAR')}
    <w:tbl>
      <w:tblPr><w:tblW w:w="9360" w:type="dxa"/>${borderXml}</w:tblPr>
      ${infoRows}
    </w:tbl>

    ${pSectionTitle('B. KOMPONEN INTI PEMBELAJARAN')}
    ${pSubTitle('1. Tujuan Pembelajaran')}
    ${pBody(ki.tujuanPembelajaran)}

    ${pSubTitle('2. Pemahaman Bermakna')}
    ${pBody(ki.pemahamanBermakna)}

    ${pSubTitle('3. Pertanyaan Pemantik')}
    ${pBody(ki.pertanyaanPemantik)}

    ${pSubTitle(`4. Kegiatan Pembelajaran (${id.alokasiWaktu})`)}
    ${pBody(`a) Kegiatan Pendahuluan (${ki.pendahuluan.durasi})`, true)}
    ${pNumberedList(ki.pendahuluan.langkah)}
    ${pBody(`b) Kegiatan Inti — ${id.modelBelajar} (${ki.inti.durasi})`, true)}
    ${pNumberedList(ki.inti.langkah)}
    ${pBody(`c) Kegiatan Penutup (${ki.penutup.durasi})`, true)}
    ${pNumberedList(ki.penutup.langkah)}

    ${pSubTitle('5. Rencana Asesmen & Rubrik Ketercapaian')}
    ${pBody(ki.asesmen)}
    <w:tbl>
      <w:tblPr><w:tblW w:w="9360" w:type="dxa"/>${borderXml}</w:tblPr>
      ${rubrikHeader}
      ${rubrikRows}
    </w:tbl>

    ${pSubTitle('6. Pengayaan dan Remedial')}
    ${pBody('Pengayaan: ' + ki.pengayaanRemedial.pengayaan)}
    ${pBody('Remedial: ' + ki.pengayaanRemedial.remedial)}

    ${pSubTitle('7. Refleksi Pendidik dan Peserta Didik')}
    ${pBody('Refleksi Pendidik:', true)}
    ${pNumberedList(ki.refleksi.refleksiGuru)}
    ${pBody('Refleksi Peserta Didik:', true)}
    ${pNumberedList(ki.refleksi.refleksiMurid)}

    ${pSectionTitle('C. LAMPIRAN LEMBAR KERJA PESERTA DIDIK (LKPD)')}
    ${pSubTitle(modul.lkpd.judul)}
    ${pBody('Nama Kelompok : .................................................................')}
    ${pBody('Anggota         : 1) ....................  2) ....................  3) ....................  4) ....................')}
    ${pBody('Petunjuk Pengerjaan:', true)}
    ${pNumberedList(modul.lkpd.petunjuk)}
    ${pBody('Tugas Diskusi & Pengamatan:', true)}
    ${pNumberedList(modul.lkpd.tugas)}

    <w:p><w:pPr><w:spacing w:before="280" w:after="120"/></w:pPr></w:p>
    ${signatureTable}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

  const zipped = zipSync({
    '[Content_Types].xml': strToU8(contentTypesXml),
    '_rels/.rels': strToU8(relsXml),
    'word/_rels/document.xml.rels': strToU8(wordRelsXml),
    'word/styles.xml': strToU8(stylesXml),
    'word/document.xml': strToU8(documentXml)
  });

  return new Blob([zipped], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

/**
 * Menghasilkan File PDF Resmi Ukuran A4 (multi-halaman otomatis + nomor halaman + blok tanda tangan).
 */
export function generateModulPdfBlob(modul) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const ensureSpace = (neededMm = 14) => {
    if (y + neededMm > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const id = modul.identitas;
  const ki = modul.komponenInti;

  // Header Dokumen
  doc.setFillColor(15, 118, 110);
  doc.rect(marginL, y - 6, contentW, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MODUL AJAR KURIKULUM MERDEKA', pageW / 2, y + 1, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${id.namaSekolah.toUpperCase()} • TAHUN PELAJARAN ${id.tahunAjaran}`, pageW / 2, y + 7, {
    align: 'center'
  });
  y += 17;

  const drawSectionBar = (title) => {
    ensureSpace(14);
    y += 3;
    doc.setFillColor(230, 244, 241);
    doc.rect(marginL, y - 4.5, contentW, 7.5, 'F');
    doc.setTextColor(15, 82, 76);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title, marginL + 3, y + 0.8);
    doc.setTextColor(15, 23, 42);
    y += 7;
  };

  const drawSubHeading = (title) => {
    ensureSpace(10);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginL, y);
    y += 5;
  };

  const drawParagraph = (text, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(String(text || ''), contentW - indent);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, marginL + indent, y);
      y += 4.8;
    }
    y += 1.2;
  };

  const drawNumbered = (arr) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    arr.forEach((item, idx) => {
      const wrapped = doc.splitTextToSize(String(item), contentW - 7);
      ensureSpace(wrapped.length * 4.8 + 2);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}.`, marginL, y);
      doc.setFont('helvetica', 'normal');
      wrapped.forEach((ln) => {
        doc.text(ln, marginL + 6, y);
        y += 4.7;
      });
      y += 1;
    });
  };

  // A. Informasi Umum
  drawSectionBar('A. INFORMASI UMUM PERANGKAT AJAR');
  const infoPairs = [
    ['Nama Penyusun', `${id.namaGuru}${id.nipGuru && id.nipGuru !== '-' ? ' (NIP. ' + id.nipGuru + ')' : ''}`],
    ['Satuan Pendidikan', id.namaSekolah],
    ['Kelas / Fase / Semester', `${id.kelasFase} — Semester ${id.semester}`],
    ['Mata Pelajaran', id.mapel],
    ['Topik / Materi Pokok', id.topik],
    ['Alokasi Waktu', id.alokasiWaktu],
    ['Model Pembelajaran', id.modelBelajar],
    ['Dimensi Karakter', id.dimensiKarakter],
    ['Sarana & Sumber', id.sarana]
  ];

  for (const [label, val] of infoPairs) {
    const valLines = doc.splitTextToSize(String(val), contentW - 50);
    const rowH = Math.max(6.2, valLines.length * 4.6 + 2);
    ensureSpace(rowH + 2);
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginL, y - 4, 48, rowH);
    doc.rect(marginL + 48, y - 4, contentW - 48, rowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, marginL + 2, y + 0.5);
    doc.setFont('helvetica', 'normal');
    valLines.forEach((vl, idx) => {
      doc.text(vl, marginL + 50, y + 0.5 + idx * 4.5);
    });
    y += rowH;
  }
  y += 3;

  // B. Komponen Inti
  drawSectionBar('B. KOMPONEN INTI PEMBELAJARAN');
  drawSubHeading('1. Tujuan Pembelajaran');
  drawParagraph(ki.tujuanPembelajaran);

  drawSubHeading('2. Pemahaman Bermakna');
  drawParagraph(ki.pemahamanBermakna);

  drawSubHeading('3. Pertanyaan Pemantik');
  drawParagraph(ki.pertanyaanPemantik);

  drawSubHeading(`4. Langkah-Langkah Kegiatan Pembelajaran (${id.alokasiWaktu})`);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  ensureSpace(8);
  doc.text(`a. Kegiatan Pendahuluan (${ki.pendahuluan.durasi})`, marginL, y);
  y += 5;
  drawNumbered(ki.pendahuluan.langkah);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  ensureSpace(8);
  doc.text(`b. Kegiatan Inti — ${id.modelBelajar} (${ki.inti.durasi})`, marginL, y);
  y += 5;
  drawNumbered(ki.inti.langkah);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  ensureSpace(8);
  doc.text(`c. Kegiatan Penutup (${ki.penutup.durasi})`, marginL, y);
  y += 5;
  drawNumbered(ki.penutup.langkah);

  drawSubHeading('5. Rencana Asesmen & Kriteria Penilaian');
  drawParagraph(ki.asesmen);
  for (const r of ki.rubrik) {
    drawParagraph(
      `• ${r.aspek}: Sangat Baik = ${r.sangatBaik} | Perlu Bimbingan = ${r.perluBimbingan}`,
      2
    );
  }

  drawSubHeading('6. Pengayaan dan Remedial');
  drawParagraph(`Pengayaan: ${ki.pengayaanRemedial.pengayaan}`);
  drawParagraph(`Remedial: ${ki.pengayaanRemedial.remedial}`);

  // C. Lampiran LKPD
  drawSectionBar('C. LAMPIRAN LEMBAR KERJA PESERTA DIDIK (LKPD)');
  drawSubHeading(modul.lkpd.judul);
  drawParagraph('Nama Kelompok : .................................................    Kelas : .........................');
  drawNumbered(modul.lkpd.tugas);

  // Blok Pengesahan Tanda Tangan
  ensureSpace(46);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Mengetahui,', marginL + 8, y);
  doc.text(`${id.kota}, ${id.tanggalDokumen}`, marginL + 104, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Kepala ${id.namaSekolah}`, marginL + 8, y);
  doc.text('Guru Pengampu,', marginL + 104, y);
  y += 22;
  doc.text(id.namaKepsek, marginL + 8, y);
  doc.text(id.namaGuru, marginL + 104, y);
  y += 4.8;
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${id.nipKepsek}`, marginL + 8, y);
  doc.text(`NIP. ${id.nipGuru}`, marginL + 104, y);

  // Nomor halaman di bagian bawah tiap lembar
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Modul Ajar ${id.mapel} — ${id.namaSekolah} | Halaman ${p} dari ${pageCount}`,
      pageW / 2,
      pageH - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/**
 * Menyusun kalimat deskripsi capaian e-Rapor Kurikulum Merdeka secara otomatis & santun
 * untuk daftar siswa satu kelas, serta ekspor ke CSV (buka di Excel) & PDF.
 */
export function buildRaporDescriptionForStudent({ nama, nilai, tpTercapai, tpBimbingan }) {
  const n = Number(nilai) || 80;
  let predikatAwal = 'Menunjukkan penguasaan yang baik dalam';
  if (n >= 90) {
    predikatAwal = 'Menunjukkan penguasaan yang sangat baik dan konsisten dalam';
  } else if (n < 75) {
    predikatAwal = 'Mulai menunjukkan perkembangan dalam';
  }

  const kalimatCapai = tpTercapai && tpTercapai.trim()
    ? `${predikatAwal} ${tpTercapai.trim()}.`
    : `${predikatAwal} memahami materi pokok semester ini dengan sungguh-sungguh.`;

  const kalimatBimbing = tpBimbingan && tpBimbingan.trim()
    ? ` Perlu bimbingan lebih lanjut dan latihan bertahap dalam ${tpBimbingan.trim()} agar pemahaman semakin utuh.`
    : ' Pertahankan ketelitian serta semangat belajar aktif pada materi berikutnya.';

  return {
    nama: (nama || 'Peserta Didik').trim(),
    nilai: n,
    deskripsi: kalimatCapai + kalimatBimbing
  };
}

export function generateRaporCsvBlob(rows, mapel = 'Mata Pelajaran') {
  const header = ['No', 'Nama Peserta Didik', 'Mata Pelajaran', 'Nilai Akhir', 'Deskripsi Capaian Rapor'];
  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    header.map(escapeCsv).join(','),
    ...rows.map((r, idx) =>
      [idx + 1, r.nama, mapel, r.nilai, r.deskripsi].map(escapeCsv).join(',')
    )
  ];
  // BOM UTF-8 supaya Microsoft Excel Indonesia langsung membaca kolom dengan rapi
  return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
}

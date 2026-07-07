// Daftar jenis regulasi berdasarkan hierarki peraturan perundang-undangan
// Indonesia (UU No. 13 Tahun 2022 tentang Perubahan Kedua atas UU No. 12
// Tahun 2011), diperluas sampai tingkat desa agar relevan dengan audit
// Pengelolaan Keuangan Desa.
//
// Struktur: { tingkat: [ {value, label}, ... ] }

export const TINGKAT_REGULASI = ["Pusat", "Provinsi", "Kabupaten/Kota", "Desa"];

export const JENIS_REGULASI_BY_TINGKAT = {
  Pusat: [
    "UUD 1945",
    "Ketetapan MPR (TAP MPR)",
    "Undang-Undang (UU)",
    "Peraturan Pemerintah Pengganti UU (Perppu)",
    "Peraturan Pemerintah (PP)",
    "Peraturan Presiden (Perpres)",
    "Peraturan Menteri (Permen)",
    "Peraturan Menteri Dalam Negeri (Permendagri)",
    "Peraturan Menteri Desa PDTT (Permendesa)",
    "Peraturan Menteri Keuangan (Permenkeu)",
    "Keputusan Menteri (Kepmen)",
    "Peraturan Lembaga Pemerintah Non-Kementerian",
    "Peraturan Badan Pemeriksa Keuangan (BPK)",
    "Peraturan/Surat Edaran Kepala LKPP",
    "Surat Edaran Menteri",
  ],
  Provinsi: [
    "Peraturan Daerah Provinsi (Perda Provinsi)",
    "Peraturan Gubernur (Pergub)",
    "Keputusan Gubernur",
    "Surat Edaran Gubernur",
  ],
  "Kabupaten/Kota": [
    "Peraturan Daerah Kabupaten/Kota (Perda Kab/Kota)",
    "Peraturan Bupati/Wali Kota (Perbup/Perwali)",
    "Keputusan Bupati/Wali Kota",
    "Peraturan Inspektur / Surat Edaran Inspektorat",
    "Keputusan Kepala Dinas/Badan Daerah",
  ],
  Desa: [
    "Peraturan Desa (Perdes)",
    "Peraturan Bersama Kepala Desa",
    "Peraturan Kepala Desa",
    "Keputusan Kepala Desa",
  ],
};

// Daftar datar (flat) semua jenis regulasi — dipakai untuk validasi &
// untuk opsi filter "Semua Jenis" di Bank Regulasi.
export const SEMUA_JENIS_REGULASI = Object.values(JENIS_REGULASI_BY_TINGKAT).flat();

export const JENIS_PEMERIKSAAN = ["APBDes", "BUMDes", "Aset Desa", "Keuangan Desa Lainnya"];

export const STATUS_KEBERLAKUAN = ["berlaku", "dalam revisi", "dicabut/tidak berlaku"];

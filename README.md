# SIBAREG — Sistem Informasi Bank Regulasi Digital Terintegrasi

Aplikasi web untuk Inspektorat Kabupaten Sumba Barat dalam mengelola dan
menelusuri referensi peraturan perundang-undangan Pengelolaan Keuangan Desa.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Supabase (Auth, Database, Storage) · Vercel (hosting)

## Menu Aplikasi
1. Login / Autentikasi
2. Dashboard
3. Bank Regulasi (pencarian & filter)
4. Unggah Dokumen
5. Manajemen Pengguna (khusus Admin)
6. Statistik & Laporan

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi dengan kredensial Supabase Anda
npm run dev
```

Buka http://localhost:3000

## Struktur Folder

```
sibareg/
├─ app/                  # Halaman (App Router Next.js)
│  ├─ login/
│  ├─ dashboard/
│  ├─ bank-regulasi/
│  ├─ unggah-dokumen/
│  ├─ manajemen-pengguna/
│  └─ statistik-laporan/
├─ components/           # Sidebar, Topbar, dll.
├─ lib/                  # Koneksi Supabase & hook profil pengguna
├─ supabase/
│  ├─ schema.sql                          # Skema tabel + Row Level Security (instalasi baru)
│  ├─ storage-policy.sql                  # Kebijakan akses Storage
│  └─ migration-jenis-regulasi-lengkap.sql # Migrasi untuk proyek yang sudah berjalan
├─ .env.example
└─ package.json
```

## Cakupan Jenis Regulasi

Menu **Unggah Dokumen** dan **Bank Regulasi** mendukung seluruh hierarki
peraturan perundang-undangan Indonesia, dikelompokkan per tingkat:

- **Pusat** — UUD 1945, TAP MPR, UU, Perppu, PP, Perpres, Permen (termasuk
  Permendagri, Permendesa, Permenkeu), Kepmen, Peraturan BPK, dll.
- **Provinsi** — Perda Provinsi, Pergub, Keputusan Gubernur, Surat Edaran Gubernur.
- **Kabupaten/Kota** — Perda Kab/Kota, Perbup/Perwali, Keputusan Bupati/Wali
  Kota, Surat Edaran Inspektorat.
- **Desa** — Perdes, Peraturan Kepala Desa, Keputusan Kepala Desa.

Daftar lengkap dapat dilihat/diubah di `lib/jenisRegulasi.js`. Jika proyek
Supabase Anda sudah pernah dijalankan dengan skema versi awal (jenis
regulasi terbatas), jalankan `supabase/migration-jenis-regulasi-lengkap.sql`
untuk memperbarui database tanpa kehilangan data.

## Menu Edit Status (khusus Admin Utama)

Di halaman **Bank Regulasi**, akun dengan peran **Admin** memiliki tombol
**Edit** pada setiap baris hasil pencarian untuk mengubah status keberlakuan
dokumen (mis. menandai "dicabut/tidak berlaku") beserta catatan alasannya.
Fitur ini diberlakukan baik di sisi tampilan maupun di database (Row Level
Security) — hanya Admin yang diizinkan memperbarui data regulasi.

Jika proyek Supabase Anda sudah pernah dijalankan sebelumnya, jalankan
`supabase/migration-edit-status-admin.sql` agar kolom pendukung (`catatan_status`,
`diperbarui_oleh`, `updated_at`) tersedia dan kebijakan akses diperbarui.

## Panduan Lengkap

Lihat dokumen **Panduan_Pembuatan_Aplikasi_SIBAREG.docx** yang menyertai
proyek ini untuk langkah-langkah detail: membuat repo GitHub, mengatur
proyek Supabase, deploy ke Vercel, hingga pembuatan akun Admin pertama.

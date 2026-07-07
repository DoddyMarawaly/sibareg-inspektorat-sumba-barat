-- =========================================================
-- SIBAREG - Migrasi: Perluasan Jenis Regulasi (Pusat s.d. Desa)
-- =========================================================
-- Jalankan skrip ini di SQL Editor Supabase jika proyek Anda
-- SUDAH PERNAH menjalankan schema.sql versi awal (dengan jenis
-- regulasi terbatas: UU, PP, Permendagri, Perbup, Surat Edaran).
--
-- Skrip ini AMAN dijalankan berkali-kali (idempotent) dan TIDAK
-- menghapus data regulasi yang sudah ada.
-- =========================================================

-- 1. Tambah kolom baru jika belum ada
alter table public.regulasi add column if not exists tingkat text;
alter table public.regulasi add column if not exists instansi_penerbit text;

-- 2. Isi nilai default kolom "tingkat" untuk data lama berdasarkan jenis_regulasi
--    yang sudah tersimpan sebelumnya, agar tidak ada nilai kosong (null).
update public.regulasi set tingkat = 'Pusat'
  where tingkat is null and jenis_regulasi in ('UU', 'PP', 'Permendagri', 'Surat Edaran');
update public.regulasi set tingkat = 'Kabupaten/Kota'
  where tingkat is null and jenis_regulasi = 'Perbup';
update public.regulasi set tingkat = 'Pusat'
  where tingkat is null; -- sisanya, jika ada, diarahkan ke Pusat sebagai default aman

-- 3. Terapkan default & NOT NULL setelah data lama terisi
alter table public.regulasi alter column tingkat set default 'Pusat';
alter table public.regulasi alter column tingkat set not null;

-- 4. Ganti nama jenis_regulasi lama ke format baru yang lebih lengkap,
--    supaya lolos pengecekan (check constraint) yang baru.
update public.regulasi set jenis_regulasi = 'Undang-Undang (UU)' where jenis_regulasi = 'UU';
update public.regulasi set jenis_regulasi = 'Peraturan Pemerintah (PP)' where jenis_regulasi = 'PP';
update public.regulasi set jenis_regulasi = 'Peraturan Menteri Dalam Negeri (Permendagri)' where jenis_regulasi = 'Permendagri';
update public.regulasi set jenis_regulasi = 'Peraturan Bupati/Wali Kota (Perbup/Perwali)' where jenis_regulasi = 'Perbup';
update public.regulasi set jenis_regulasi = 'Surat Edaran Menteri' where jenis_regulasi = 'Surat Edaran';

-- 5. Hapus check constraint lama pada jenis_regulasi & status (nama constraint
--    default Postgres mengikuti pola <tabel>_<kolom>_check)
alter table public.regulasi drop constraint if exists regulasi_jenis_regulasi_check;
alter table public.regulasi drop constraint if exists regulasi_status_check;
alter table public.regulasi drop constraint if exists regulasi_tingkat_check;
alter table public.regulasi drop constraint if exists regulasi_jenis_pemeriksaan_check;

-- 6. Buat ulang check constraint dengan daftar lengkap Pusat s.d. Desa
alter table public.regulasi add constraint regulasi_tingkat_check
  check (tingkat in ('Pusat', 'Provinsi', 'Kabupaten/Kota', 'Desa'));

alter table public.regulasi add constraint regulasi_jenis_regulasi_check
  check (jenis_regulasi in (
    'UUD 1945', 'Ketetapan MPR (TAP MPR)', 'Undang-Undang (UU)',
    'Peraturan Pemerintah Pengganti UU (Perppu)', 'Peraturan Pemerintah (PP)',
    'Peraturan Presiden (Perpres)', 'Peraturan Menteri (Permen)',
    'Peraturan Menteri Dalam Negeri (Permendagri)',
    'Peraturan Menteri Desa PDTT (Permendesa)',
    'Peraturan Menteri Keuangan (Permenkeu)', 'Keputusan Menteri (Kepmen)',
    'Peraturan Lembaga Pemerintah Non-Kementerian',
    'Peraturan Badan Pemeriksa Keuangan (BPK)',
    'Peraturan/Surat Edaran Kepala LKPP', 'Surat Edaran Menteri',
    'Peraturan Daerah Provinsi (Perda Provinsi)', 'Peraturan Gubernur (Pergub)',
    'Keputusan Gubernur', 'Surat Edaran Gubernur',
    'Peraturan Daerah Kabupaten/Kota (Perda Kab/Kota)',
    'Peraturan Bupati/Wali Kota (Perbup/Perwali)', 'Keputusan Bupati/Wali Kota',
    'Peraturan Inspektur / Surat Edaran Inspektorat',
    'Keputusan Kepala Dinas/Badan Daerah',
    'Peraturan Desa (Perdes)', 'Peraturan Bersama Kepala Desa',
    'Peraturan Kepala Desa', 'Keputusan Kepala Desa'
  ));

alter table public.regulasi add constraint regulasi_status_check
  check (status in ('berlaku', 'dalam revisi', 'dicabut/tidak berlaku'));

alter table public.regulasi add constraint regulasi_jenis_pemeriksaan_check
  check (jenis_pemeriksaan in ('APBDes', 'BUMDes', 'Aset Desa', 'Keuangan Desa Lainnya'));

-- 7. Tambah index untuk kolom tingkat (mempercepat filter di Bank Regulasi)
create index if not exists idx_regulasi_tingkat on public.regulasi (tingkat);

-- 8. Tambah fungsi penghitung akses/unduhan (dipakai tombol "Lihat/Unduh")
create or replace function public.increment_jumlah_akses(regulasi_id uuid)
returns void as $$
  update public.regulasi set jumlah_akses = jumlah_akses + 1 where id = regulasi_id;
$$ language sql security definer;

-- Selesai. Setelah migrasi ini berhasil, tarik (pull) juga pembaruan kode
-- aplikasi (unggah-dokumen & bank-regulasi) dari repositori GitHub agar
-- tampilan form dan filter ikut menampilkan seluruh jenis regulasi baru.

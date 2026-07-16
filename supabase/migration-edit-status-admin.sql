-- =========================================================
-- SIBAREG - Migrasi: Menu Edit Status Regulasi (khusus Admin Utama)
-- =========================================================
-- Jalankan skrip ini di SQL Editor Supabase agar fitur "Edit" pada
-- Bank Regulasi (menandai dokumen sudah tidak berlaku/dicabut) dapat
-- berfungsi. Skrip ini AMAN dijalankan berkali-kali (idempotent) dan
-- TIDAK menghapus data yang sudah ada.
-- =========================================================

-- 1. Tambah kolom untuk mencatat alasan/keterangan perubahan status,
--    serta jejak siapa & kapan terakhir mengubah data regulasi.
alter table public.regulasi add column if not exists catatan_status text;
alter table public.regulasi add column if not exists diperbarui_oleh uuid references public.profiles (id);
alter table public.regulasi add column if not exists updated_at timestamptz;

-- 2. Perketat kebijakan UPDATE: sebelumnya Admin & Sekretariat sama-sama
--    bisa memperbarui regulasi. Mulai sekarang, HANYA Admin Utama yang
--    berwenang mengubah data regulasi (termasuk menandai dokumen tidak
--    berlaku lewat menu Edit).
drop policy if exists "Admin dan sekretariat dapat memperbarui regulasi" on public.regulasi;
drop policy if exists "Hanya admin dapat memperbarui regulasi" on public.regulasi;

create policy "Hanya admin dapat memperbarui regulasi"
  on public.regulasi for update
  using (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

-- Selesai. Setelah migrasi ini berhasil, tarik (pull) juga pembaruan
-- kode aplikasi (Bank Regulasi) dari repositori agar tombol "Edit"
-- muncul untuk akun dengan peran Admin.

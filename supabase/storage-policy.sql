-- =========================================================
-- SIBAREG - Kebijakan Supabase Storage
-- Jalankan SETELAH membuat bucket "dokumen-regulasi"
-- melalui Dashboard > Storage > New Bucket (set Public = ON
-- jika ingin file bisa diunduh langsung via link publik,
-- atau OFF jika ingin akses selalu lewat aplikasi/RLS).
-- =========================================================

-- ---------------------------------------------------------
-- PENGATURAN BUCKET (WAJIB agar unggah PDF hingga 100MB berhasil)
-- ---------------------------------------------------------
-- Supabase Storage menolak unggahan jika ukuran berkas melebihi
-- file_size_limit bucket, atau jika tipe berkas tidak ada dalam
-- allowed_mime_types bucket. Nilai bawaan Supabase untuk bucket baru
-- seringkali hanya 50MB dan/atau membatasi tipe berkas. Jalankan
-- perintah berikut di SQL Editor (atau atur manual di Dashboard >
-- Storage > dokumen-regulasi > Edit bucket) supaya PDF hingga 100MB
-- dapat diunggah:
update storage.buckets
set
  file_size_limit = 104857600, -- 100 MB dalam bytes
  allowed_mime_types = array['application/pdf']
where id = 'dokumen-regulasi';

-- Jika bucket "dokumen-regulasi" belum pernah dibuat, jalankan ini
-- terlebih dahulu (menggantikan pembuatan lewat Dashboard):
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('dokumen-regulasi', 'dokumen-regulasi', false, 104857600, array['application/pdf'])
-- on conflict (id) do update set
--   file_size_limit = excluded.file_size_limit,
--   allowed_mime_types = excluded.allowed_mime_types;

-- Catatan: proyek Supabase pada paket Free memiliki batas ukuran
-- unggahan global (Project Settings > Storage). Pastikan batas
-- tersebut juga sudah diset ke minimal 100MB, jika tidak maka
-- pengaturan bucket di atas tidak akan berpengaruh.

-- Menghapus kebijakan lama (jika sebelumnya pernah dijalankan) agar
-- skrip ini aman dijalankan ulang tanpa muncul error "already exists"
drop policy if exists "Pengguna login dapat membaca dokumen regulasi" on storage.objects;
drop policy if exists "Admin dan sekretariat dapat mengunggah dokumen" on storage.objects;
drop policy if exists "Admin dapat menghapus dokumen" on storage.objects;

-- Izinkan pengguna yang sudah login untuk melihat/mengunduh file
create policy "Pengguna login dapat membaca dokumen regulasi"
  on storage.objects for select
  using (bucket_id = 'dokumen-regulasi' and auth.role() = 'authenticated');

-- Izinkan admin & sekretariat mengunggah file baru
create policy "Admin dan sekretariat dapat mengunggah dokumen"
  on storage.objects for insert
  with check (
    bucket_id = 'dokumen-regulasi'
    and auth.role() = 'authenticated'
    and public.current_role_name() in ('admin', 'sekretariat')
  );

-- Izinkan admin menghapus file
create policy "Admin dapat menghapus dokumen"
  on storage.objects for delete
  using (
    bucket_id = 'dokumen-regulasi'
    and public.current_role_name() = 'admin'
  );

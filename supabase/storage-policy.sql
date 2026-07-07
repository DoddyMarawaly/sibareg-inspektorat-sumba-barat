-- =========================================================
-- SIBAREG - Kebijakan Supabase Storage
-- Jalankan SETELAH membuat bucket "dokumen-regulasi"
-- melalui Dashboard > Storage > New Bucket (set Public = ON
-- jika ingin file bisa diunduh langsung via link publik,
-- atau OFF jika ingin akses selalu lewat aplikasi/RLS).
-- =========================================================

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

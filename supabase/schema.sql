-- =========================================================
-- SIBAREG - Skema Database Supabase
-- Sistem Informasi Bank Regulasi Digital Terintegrasi
-- Inspektorat Kabupaten Sumba Barat
-- =========================================================
-- CARA PAKAI:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Salin seluruh isi file ini, tempel, lalu klik "Run"
-- =========================================================

-- Ekstensi yang dibutuhkan
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. TABEL PROFILES (data tambahan untuk setiap pengguna)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nama_lengkap text,
  unit_kerja text,
  role text not null default 'auditor' check (role in ('admin', 'auditor', 'sekretariat')),
  status text not null default 'menunggu' check (status in ('aktif', 'menunggu', 'nonaktif')),
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. TABEL KATEGORI (opsional, untuk pengelompokan tambahan)
-- ---------------------------------------------------------
create table if not exists public.kategori (
  id uuid primary key default uuid_generate_v4(),
  nama text not null unique,
  deskripsi text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. TABEL REGULASI (data utama Bank Regulasi)
-- ---------------------------------------------------------
create table if not exists public.regulasi (
  id uuid primary key default uuid_generate_v4(),
  judul text not null,
  nomor text not null unique,
  jenis_regulasi text not null check (jenis_regulasi in ('UU', 'PP', 'Permendagri', 'Perbup', 'Surat Edaran')),
  tahun int not null,
  jenis_pemeriksaan text check (jenis_pemeriksaan in ('APBDes', 'BUMDes', 'Aset Desa')),
  status text not null default 'berlaku' check (status in ('berlaku', 'dalam revisi')),
  tag text,
  file_path text not null,
  status_persetujuan text not null default 'menunggu' check (status_persetujuan in ('menunggu', 'disetujui', 'ditolak')),
  jumlah_akses int not null default 0,
  diunggah_oleh uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_regulasi_judul on public.regulasi using gin (to_tsvector('simple', judul));
create index if not exists idx_regulasi_jenis on public.regulasi (jenis_regulasi);
create index if not exists idx_regulasi_tahun on public.regulasi (tahun);

-- ---------------------------------------------------------
-- 4. TABEL LOG AKTIVITAS
-- ---------------------------------------------------------
create table if not exists public.log_aktivitas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles (id),
  aksi text not null, -- contoh: 'unggah', 'unduh', 'pencarian', 'ubah_status'
  keterangan text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. TABEL UMPAN BALIK / KEPUASAN PENGGUNA
-- ---------------------------------------------------------
create table if not exists public.umpan_balik (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles (id),
  skor int check (skor between 1 and 5),
  komentar text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TRIGGER: otomatis membuat baris profiles saat user baru
-- mendaftar melalui Supabase Auth
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nama_lengkap, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nama_lengkap', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'auditor'),
    'menunggu'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.kategori enable row level security;
alter table public.regulasi enable row level security;
alter table public.log_aktivitas enable row level security;
alter table public.umpan_balik enable row level security;

-- Fungsi bantu: mengambil role pengguna yang sedang login
create or replace function public.current_role_name()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Menghapus kebijakan lama (jika sebelumnya pernah dijalankan) agar
-- skrip ini aman dijalankan ulang tanpa muncul error "already exists"
drop policy if exists "Profil terlihat oleh pengguna yang sudah login" on public.profiles;
drop policy if exists "Pengguna dapat memperbarui profil miliknya sendiri" on public.profiles;
drop policy if exists "Admin dapat memperbarui profil siapa saja" on public.profiles;
drop policy if exists "Kategori terlihat oleh pengguna yang sudah login" on public.kategori;
drop policy if exists "Hanya admin dapat mengelola kategori" on public.kategori;
drop policy if exists "Regulasi terlihat oleh pengguna yang sudah login" on public.regulasi;
drop policy if exists "Admin dan sekretariat dapat menambah regulasi" on public.regulasi;
drop policy if exists "Admin dan sekretariat dapat memperbarui regulasi" on public.regulasi;
drop policy if exists "Hanya admin dapat menghapus regulasi" on public.regulasi;
drop policy if exists "Log terlihat oleh pengguna yang sudah login" on public.log_aktivitas;
drop policy if exists "Pengguna yang login dapat menambah log" on public.log_aktivitas;
drop policy if exists "Umpan balik terlihat oleh pengguna yang sudah login" on public.umpan_balik;
drop policy if exists "Pengguna yang login dapat mengirim umpan balik" on public.umpan_balik;

-- ---------- PROFILES ----------
create policy "Profil terlihat oleh pengguna yang sudah login"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Pengguna dapat memperbarui profil miliknya sendiri"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin dapat memperbarui profil siapa saja"
  on public.profiles for update
  using (public.current_role_name() = 'admin');

-- ---------- KATEGORI ----------
create policy "Kategori terlihat oleh pengguna yang sudah login"
  on public.kategori for select
  using (auth.role() = 'authenticated');

create policy "Hanya admin dapat mengelola kategori"
  on public.kategori for all
  using (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

-- ---------- REGULASI ----------
create policy "Regulasi terlihat oleh pengguna yang sudah login"
  on public.regulasi for select
  using (auth.role() = 'authenticated');

create policy "Admin dan sekretariat dapat menambah regulasi"
  on public.regulasi for insert
  with check (public.current_role_name() in ('admin', 'sekretariat'));

create policy "Admin dan sekretariat dapat memperbarui regulasi"
  on public.regulasi for update
  using (public.current_role_name() in ('admin', 'sekretariat'));

create policy "Hanya admin dapat menghapus regulasi"
  on public.regulasi for delete
  using (public.current_role_name() = 'admin');

-- ---------- LOG AKTIVITAS ----------
create policy "Log terlihat oleh pengguna yang sudah login"
  on public.log_aktivitas for select
  using (auth.role() = 'authenticated');

create policy "Pengguna yang login dapat menambah log"
  on public.log_aktivitas for insert
  with check (auth.role() = 'authenticated');

-- ---------- UMPAN BALIK ----------
create policy "Umpan balik terlihat oleh pengguna yang sudah login"
  on public.umpan_balik for select
  using (auth.role() = 'authenticated');

create policy "Pengguna yang login dapat mengirim umpan balik"
  on public.umpan_balik for insert
  with check (auth.uid() = user_id);

-- =========================================================
-- DATA AWAL (opsional) - kategori & jenis pemeriksaan dasar
-- =========================================================
insert into public.kategori (nama, deskripsi) values
  ('APBDes', 'Regulasi terkait Anggaran Pendapatan dan Belanja Desa'),
  ('BUMDes', 'Regulasi terkait Badan Usaha Milik Desa'),
  ('Aset Desa', 'Regulasi terkait pengelolaan aset dan kekayaan desa')
on conflict (nama) do nothing;

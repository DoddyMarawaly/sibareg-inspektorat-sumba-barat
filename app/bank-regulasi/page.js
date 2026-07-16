"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";
import { TINGKAT_REGULASI, JENIS_REGULASI_BY_TINGKAT, JENIS_PEMERIKSAAN, STATUS_KEBERLAKUAN } from "../../lib/jenisRegulasi";

export default function BankRegulasiPage() {
  const { loading, profile } = useProfile();
  const [keyword, setKeyword] = useState("");
  const [tingkat, setTingkat] = useState("Semua");
  const [jenisRegulasi, setJenisRegulasi] = useState("Semua");
  const [jenisPemeriksaan, setJenisPemeriksaan] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [tahun, setTahun] = useState("");
  const [hasil, setHasil] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // State untuk modal "Edit Status" (khusus Admin Utama)
  const [editTarget, setEditTarget] = useState(null); // baris regulasi yang sedang diedit
  const [editStatus, setEditStatus] = useState("berlaku");
  const [editCatatan, setEditCatatan] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const isAdminUtama = profile?.role === "admin";

  // Opsi jenis regulasi mengikuti tingkat yang dipilih (atau semua jika "Semua")
  const opsiJenisRegulasi =
    tingkat === "Semua"
      ? Object.values(JENIS_REGULASI_BY_TINGKAT).flat()
      : JENIS_REGULASI_BY_TINGKAT[tingkat];

  function handleTingkatChange(value) {
    setTingkat(value);
    setJenisRegulasi("Semua"); // reset jenis saat tingkat berubah
  }

  async function cariRegulasi() {
    setLoadingData(true);
    let query = supabase.from("regulasi").select("*").order("created_at", { ascending: false });

    if (keyword) query = query.ilike("judul", `%${keyword}%`);
    if (tingkat !== "Semua") query = query.eq("tingkat", tingkat);
    if (jenisRegulasi !== "Semua") query = query.eq("jenis_regulasi", jenisRegulasi);
    if (jenisPemeriksaan !== "Semua") query = query.eq("jenis_pemeriksaan", jenisPemeriksaan);
    if (status !== "Semua") query = query.eq("status", status);
    if (tahun) query = query.eq("tahun", Number(tahun));

    const { data } = await query;
    setHasil(data || []);
    setLoadingData(false);

    await supabase.from("log_aktivitas").insert({
      aksi: "pencarian",
      keterangan: keyword ? `Mencari regulasi: "${keyword}"` : "Menerapkan filter pencarian regulasi",
    });
  }

  useEffect(() => {
    cariRegulasi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unduhDokumen(fileUrl, judul, regulasiId) {
    if (!fileUrl) return;

    const { data, error } = await supabase.storage
      .from("dokumen-regulasi")
      .createSignedUrl(fileUrl, 300); // tautan berlaku 5 menit

    if (error || !data?.signedUrl) {
      alert(
        `Gagal membuka dokumen: ${error?.message || "berkas tidak ditemukan di Storage."}\n\n` +
          "Pastikan bucket 'dokumen-regulasi' dan kebijakan Storage (storage-policy.sql) sudah diterapkan dengan benar di Supabase."
      );
      return;
    }

    window.open(data.signedUrl, "_blank");

    await supabase.from("log_aktivitas").insert({
      aksi: "unduh",
      keterangan: `Mengunduh dokumen: ${judul}`,
    });

    if (regulasiId) {
      await supabase.rpc("increment_jumlah_akses", { regulasi_id: regulasiId }).catch(() => {});
    }
  }

  function bukaEditStatus(regulasi) {
    setEditTarget(regulasi);
    setEditStatus(regulasi.status);
    setEditCatatan(regulasi.catatan_status || "");
    setEditError("");
  }

  function tutupEditStatus() {
    setEditTarget(null);
    setEditError("");
  }

  async function simpanEditStatus(e) {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    setEditError("");

    const { data, error } = await supabase
      .from("regulasi")
      .update({
        status: editStatus,
        catatan_status: editCatatan || null,
        diperbarui_oleh: profile?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editTarget.id)
      .select()
      .single();

    setSavingEdit(false);

    if (error) {
      setEditError(
        `Gagal menyimpan perubahan: ${error.message}. Pastikan akun Anda berperan Admin dan migrasi database ` +
          "'migration-edit-status-admin.sql' sudah dijalankan."
      );
      return;
    }

    // Perbarui data di tabel hasil pencarian tanpa perlu memuat ulang dari server
    setHasil((list) => list.map((r) => (r.id === editTarget.id ? { ...r, ...data } : r)));

    await supabase.from("log_aktivitas").insert({
      aksi: "ubah_status",
      keterangan: `Mengubah status regulasi "${editTarget.judul}" menjadi "${editStatus}"${
        editCatatan ? ` — Catatan: ${editCatatan}` : ""
      }`,
    });

    setEditTarget(null);
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1">
        <Topbar title="Bank Regulasi" profile={profile} />

        <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="bg-white rounded-xl shadow-sm p-5 h-fit space-y-4">
            <h2 className="font-semibold text-sibareg-navy">Filter</h2>

            <div>
              <label className="text-sm text-gray-600">Kata Kunci</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari judul regulasi..."
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Tingkat Peraturan</label>
              <select
                value={tingkat}
                onChange={(e) => handleTingkatChange(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                <option>Semua</option>
                {TINGKAT_REGULASI.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Pusat → Provinsi → Kabupaten/Kota → Desa</p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Jenis Regulasi</label>
              <select
                value={jenisRegulasi}
                onChange={(e) => setJenisRegulasi(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                <option>Semua</option>
                {opsiJenisRegulasi.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Jenis Pemeriksaan</label>
              <select
                value={jenisPemeriksaan}
                onChange={(e) => setJenisPemeriksaan(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                <option>Semua</option>
                {JENIS_PEMERIKSAAN.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Tahun Terbit</label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="cth. 2023"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                <option>Semua</option>
                {STATUS_KEBERLAKUAN.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={cariRegulasi}
              className="w-full bg-sibareg-blue text-white rounded-lg py-2 text-sm font-medium hover:bg-sibareg-navy"
            >
              Terapkan Filter
            </button>
          </aside>

          <section className="lg:col-span-3 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-sibareg-navy mb-4">
              Hasil Pencarian {loadingData ? "..." : `(${hasil.length})`}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3">Judul</th>
                    <th className="py-2 pr-3">Tingkat</th>
                    <th className="py-2 pr-3">Jenis</th>
                    <th className="py-2 pr-3">Nomor</th>
                    <th className="py-2 pr-3">Tahun</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium text-gray-800">{r.judul}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.tingkat}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.jenis_regulasi}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.nomor}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.tahun}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            r.status === "berlaku"
                              ? "bg-green-100 text-green-700"
                              : r.status === "dalam revisi"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.catatan_status && (
                          <p className="text-[11px] text-gray-400 mt-1 max-w-[180px]">{r.catatan_status}</p>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => unduhDokumen(r.file_path, r.judul, r.id)}
                            className="text-sibareg-blue hover:underline"
                          >
                            Lihat / Unduh
                          </button>
                          {isAdminUtama && (
                            <button
                              onClick={() => bukaEditStatus(r)}
                              className="text-sibareg-gold hover:underline"
                              title="Ubah status keberlakuan (khusus Admin Utama)"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hasil.length === 0 && !loadingData && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-400 py-6">
                        Tidak ada regulasi yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* Modal Edit Status Regulasi — khusus Admin Utama */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <h3 className="font-semibold text-sibareg-navy text-lg">Edit Status Regulasi</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{editTarget.judul}</p>

              <form onSubmit={simpanEditStatus} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Status Keberlakuan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  >
                    {STATUS_KEBERLAKUAN.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Catatan / Alasan Perubahan Status <span className="text-gray-400">(opsional)</span>
                  </label>
                  <textarea
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    rows={4}
                    placeholder="cth. Dicabut karena digantikan oleh Peraturan Bupati Nomor 12 Tahun 2026"
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {editError && <p className="text-sm text-red-600">{editError}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={tutupEditStatus}
                    className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 text-sm rounded-lg bg-sibareg-blue text-white font-medium hover:bg-sibareg-navy disabled:opacity-60"
                  >
                    {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    const { data } = supabase.storage.from("dokumen-regulasi").getPublicUrl(fileUrl);
    window.open(data.publicUrl, "_blank");

    await supabase.from("log_aktivitas").insert({
      aksi: "unduh",
      keterangan: `Mengunduh dokumen: ${judul}`,
    });

    if (regulasiId) {
      await supabase.rpc("increment_jumlah_akses", { regulasi_id: regulasiId }).catch(() => {});
    }
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
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          onClick={() => unduhDokumen(r.file_path, r.judul, r.id)}
                          className="text-sibareg-blue hover:underline"
                        >
                          Lihat / Unduh
                        </button>
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
      </div>
    </div>
  );
}

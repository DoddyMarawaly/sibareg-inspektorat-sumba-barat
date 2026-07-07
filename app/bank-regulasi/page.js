"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";

const JENIS_REGULASI = ["Semua", "UU", "PP", "Permendagri", "Perbup", "Surat Edaran"];
const JENIS_PEMERIKSAAN = ["Semua", "APBDes", "BUMDes", "Aset Desa"];
const STATUS_OPTIONS = ["Semua", "berlaku", "dalam revisi"];

export default function BankRegulasiPage() {
  const { loading, profile } = useProfile();
  const [keyword, setKeyword] = useState("");
  const [jenisRegulasi, setJenisRegulasi] = useState("Semua");
  const [jenisPemeriksaan, setJenisPemeriksaan] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [tahun, setTahun] = useState("");
  const [hasil, setHasil] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  async function cariRegulasi() {
    setLoadingData(true);
    let query = supabase.from("regulasi").select("*").order("created_at", { ascending: false });

    if (keyword) query = query.ilike("judul", `%${keyword}%`);
    if (jenisRegulasi !== "Semua") query = query.eq("jenis_regulasi", jenisRegulasi);
    if (jenisPemeriksaan !== "Semua") query = query.eq("jenis_pemeriksaan", jenisPemeriksaan);
    if (status !== "Semua") query = query.eq("status", status);
    if (tahun) query = query.eq("tahun", Number(tahun));

    const { data } = await query;
    setHasil(data || []);
    setLoadingData(false);
  }

  useEffect(() => {
    cariRegulasi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unduhDokumen(fileUrl, judul) {
    if (!fileUrl) return;
    const { data } = supabase.storage.from("dokumen-regulasi").getPublicUrl(fileUrl);
    window.open(data.publicUrl, "_blank");

    await supabase.from("log_aktivitas").insert({
      aksi: "unduh",
      keterangan: `Mengunduh dokumen: ${judul}`,
    });
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
              <label className="text-sm text-gray-600">Jenis Regulasi</label>
              <select
                value={jenisRegulasi}
                onChange={(e) => setJenisRegulasi(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                {JENIS_REGULASI.map((j) => (
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
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
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
                      <td className="py-2 pr-3 text-gray-500">{r.nomor}</td>
                      <td className="py-2 pr-3 text-gray-500">{r.tahun}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            r.status === "berlaku" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          onClick={() => unduhDokumen(r.file_path, r.judul)}
                          className="text-sibareg-blue hover:underline"
                        >
                          Lihat / Unduh
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hasil.length === 0 && !loadingData && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-6">
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

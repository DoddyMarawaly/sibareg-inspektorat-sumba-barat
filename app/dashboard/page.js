"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";

export default function DashboardPage() {
  const { loading, profile } = useProfile();
  const [stats, setStats] = useState({
    totalRegulasi: 0,
    totalKategori: 0,
    penggunaAktif: 0,
    unduhanBulanIni: 0,
  });
  const [terbaru, setTerbaru] = useState([]);
  const [aktivitas, setAktivitas] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [{ count: totalRegulasi }, { count: totalKategori }, { count: penggunaAktif }, { data: terbaruData }, { data: logData }] =
        await Promise.all([
          supabase.from("regulasi").select("*", { count: "exact", head: true }),
          supabase.from("kategori").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "aktif"),
          supabase.from("regulasi").select("id, judul, jenis_regulasi, tahun, status").order("created_at", { ascending: false }).limit(5),
          supabase.from("log_aktivitas").select("id, aksi, keterangan, created_at").order("created_at", { ascending: false }).limit(6),
        ]);

      setStats((s) => ({
        ...s,
        totalRegulasi: totalRegulasi || 0,
        totalKategori: totalKategori || 0,
        penggunaAktif: penggunaAktif || 0,
      }));
      setTerbaru(terbaruData || []);
      setAktivitas(logData || []);
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;
  }

  const cards = [
    { label: "Total Regulasi", value: stats.totalRegulasi, icon: "📚" },
    { label: "Kategori Aktif", value: stats.totalKategori, icon: "🗂️" },
    { label: "Pengguna Aktif", value: stats.penggunaAktif, icon: "👥" },
    { label: "Unduhan Bulan Ini", value: stats.unduhanBulanIni, icon: "⬇️" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1">
        <Topbar title="Dashboard" profile={profile} />

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm p-5">
                <div className="text-2xl">{c.icon}</div>
                <p className="text-2xl font-bold text-sibareg-navy mt-2">{c.value}</p>
                <p className="text-sm text-gray-500">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-sibareg-navy mb-3">Regulasi Terbaru</h2>
              {terbaru.length === 0 && <p className="text-sm text-gray-400">Belum ada data regulasi.</p>}
              <ul className="divide-y">
                {terbaru.map((r) => (
                  <li key={r.id} className="py-2 flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{r.judul}</p>
                      <p className="text-gray-400">{r.jenis_regulasi} • {r.tahun}</p>
                    </div>
                    <span
                      className={`h-fit px-2 py-0.5 rounded-full text-xs ${
                        r.status === "berlaku" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-sibareg-navy mb-3">Aktivitas Tim</h2>
              {aktivitas.length === 0 && <p className="text-sm text-gray-400">Belum ada aktivitas tercatat.</p>}
              <ul className="space-y-2">
                {aktivitas.map((a) => (
                  <li key={a.id} className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{a.aksi}</span> — {a.keterangan}
                    <span className="block text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

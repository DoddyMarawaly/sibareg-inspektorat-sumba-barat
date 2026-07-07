"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";

const COLORS = ["#1F5CA8", "#C9A227", "#0F2C4C", "#7C9CBF", "#E3B23C"];

export default function StatistikLaporanPage() {
  const { loading, profile } = useProfile();
  const [trenBulanan, setTrenBulanan] = useState([]);
  const [komposisiKategori, setKomposisiKategori] = useState([]);
  const [terpopuler, setTerpopuler] = useState([]);

  useEffect(() => {
    async function loadStats() {
      const { data: logs } = await supabase
        .from("log_aktivitas")
        .select("aksi, created_at")
        .in("aksi", ["pencarian", "unduh"]);

      const bulanMap = {};
      (logs || []).forEach((l) => {
        const bulan = new Date(l.created_at).toLocaleString("id-ID", { month: "short", year: "2-digit" });
        bulanMap[bulan] = bulanMap[bulan] || { bulan, pencarian: 0, unduhan: 0 };
        if (l.aksi === "pencarian") bulanMap[bulan].pencarian += 1;
        if (l.aksi === "unduh") bulanMap[bulan].unduhan += 1;
      });
      setTrenBulanan(Object.values(bulanMap));

      const { data: regulasi } = await supabase.from("regulasi").select("jenis_regulasi");
      const kategoriMap = {};
      (regulasi || []).forEach((r) => {
        kategoriMap[r.jenis_regulasi] = (kategoriMap[r.jenis_regulasi] || 0) + 1;
      });
      setKomposisiKategori(Object.entries(kategoriMap).map(([name, value]) => ({ name, value })));

      const { data: popular } = await supabase
        .from("regulasi")
        .select("judul, jumlah_akses")
        .order("jumlah_akses", { ascending: false })
        .limit(5);
      setTerpopuler(popular || []);
    }
    loadStats();
  }, []);

  if (loading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1">
        <Topbar title="Statistik & Laporan" profile={profile} />

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-sibareg-navy mb-4">Tren Pencarian & Unduhan Bulanan</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trenBulanan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bulan" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="pencarian" fill="#1F5CA8" name="Pencarian" />
                  <Bar dataKey="unduhan" fill="#C9A227" name="Unduhan" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-sibareg-navy mb-4">Komposisi Kategori Regulasi</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={komposisiKategori} dataKey="value" nameKey="name" outerRadius={100} label>
                    {komposisiKategori.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-sibareg-navy mb-4">Regulasi Paling Sering Diakses</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {terpopuler.map((r, i) => (
                <li key={i}>
                  {r.judul} <span className="text-gray-400">— {r.jumlah_akses || 0}x diakses</span>
                </li>
              ))}
              {terpopuler.length === 0 && <p className="text-gray-400">Belum ada data akses.</p>}
            </ol>
          </div>
        </main>
      </div>
    </div>
  );
}

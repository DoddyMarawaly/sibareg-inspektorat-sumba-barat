"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";

export default function ManajemenPenggunaPage() {
  const { loading, profile } = useProfile();
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, unit_kerja, role, status, last_sign_in_at")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoadingData(false);
    }
    loadUsers();
  }, []);

  async function updateRole(userId, newRole) {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers((u) => u.map((usr) => (usr.id === userId ? { ...usr, role: newRole } : usr)));
  }

  async function updateStatus(userId, newStatus) {
    await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);
    setUsers((u) => u.map((usr) => (usr.id === userId ? { ...usr, status: newStatus } : usr)));
  }

  if (loading) return null;

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen">
        <Sidebar role={profile?.role} />
        <div className="flex-1">
          <Topbar title="Manajemen Pengguna" profile={profile} />
          <main className="p-6">
            <p className="text-red-600">Menu ini hanya dapat diakses oleh Admin.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1">
        <Topbar title="Manajemen Pengguna" profile={profile} />

        <main className="p-6">
          <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
            <h2 className="font-semibold text-sibareg-navy mb-4">Daftar Pengguna</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Unit Kerja</th>
                  <th className="py-2 pr-3">Peran</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Login Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{u.nama_lengkap || "-"}</td>
                    <td className="py-2 pr-3 text-gray-500">{u.email}</td>
                    <td className="py-2 pr-3 text-gray-500">{u.unit_kerja || "-"}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="auditor">Auditor / P2UPD</option>
                        <option value="sekretariat">Sekretariat</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.status}
                        onChange={(e) => updateStatus(u.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="menunggu">Menunggu Persetujuan</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3 text-gray-400">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loadingData && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-6">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Catatan: pembuatan akun baru dilakukan melalui Supabase Dashboard &gt; Authentication, kemudian
            lengkapi data pada tabel <code>profiles</code>. Lihat panduan implementasi untuk detail langkahnya.
          </p>
        </main>
      </div>
    </div>
  );
}

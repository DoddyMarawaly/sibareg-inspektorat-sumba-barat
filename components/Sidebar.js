"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const MENUS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["admin", "auditor", "sekretariat"] },
  { href: "/bank-regulasi", label: "Bank Regulasi", icon: "📚", roles: ["admin", "auditor", "sekretariat"] },
  { href: "/unggah-dokumen", label: "Unggah Dokumen", icon: "⬆️", roles: ["admin", "sekretariat"] },
  { href: "/manajemen-pengguna", label: "Manajemen Pengguna", icon: "👥", roles: ["admin"] },
  { href: "/statistik-laporan", label: "Statistik & Laporan", icon: "📊", roles: ["admin", "auditor", "sekretariat"] },
];

export default function Sidebar({ role = "auditor" }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visibleMenus = MENUS.filter((m) => m.roles.includes(role));

  return (
    <aside className="w-64 min-h-screen bg-sibareg-navy text-white flex flex-col">
      <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center overflow-hidden">
          <Image
            src="/logo-sumba-barat.jpeg"
            alt="Logo Kabupaten Sumba Barat"
            width={44}
            height={44}
            className="object-contain w-9 h-9"
            priority
          />
        </div>
        <div>
          <p className="text-lg font-bold tracking-wide leading-tight">SIBAREG</p>
          <p className="text-xs text-white/60">Bank Regulasi Digital Terintegrasi</p>
          <p className="text-[11px] text-white/40 mt-1">Inspektorat Kab. Sumba Barat</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleMenus.map((menu) => {
          const active = pathname === menu.href;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-sibareg-blue text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span>{menu.icon}</span>
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10"
        >
          🚪 Keluar
        </button>
      </div>
    </aside>
  );
}

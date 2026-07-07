"use client";

const ROLE_LABEL = {
  admin: "Admin",
  auditor: "Auditor / P2UPD",
  sekretariat: "Sekretariat",
};

export default function Topbar({ title, profile }) {
  return (
    <header className="flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
      <h1 className="text-xl font-semibold text-sibareg-navy">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{profile?.nama_lengkap || profile?.email || "Pengguna"}</p>
          <p className="text-xs text-gray-500">{ROLE_LABEL[profile?.role] || "-"}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-sibareg-gold text-sibareg-navy flex items-center justify-center font-bold">
          {(profile?.nama_lengkap || profile?.email || "?").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

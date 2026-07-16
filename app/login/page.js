"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg("Email atau kata sandi salah. Silakan coba lagi.");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sibareg-navy px-4 relative overflow-hidden">
      {/* Aksen dekoratif latar belakang */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-sibareg-blue/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-sibareg-gold/20 blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* Lencana logo dengan efek glassmorphism, melayang di atas kartu login */}
        <div className="relative z-10 flex justify-center -mb-10">
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 shadow-lg flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-inner">
              <Image
                src="/logo-sumba-barat.jpeg"
                alt="Logo Kabupaten Sumba Barat"
                width={64}
                height={64}
                className="object-contain w-14 h-14"
                priority
              />
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-xl p-8 pt-14">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-sibareg-navy">SIBAREG</h1>
            <p className="text-sm text-gray-500 mt-1">Sistem Informasi Bank Regulasi</p>
            <p className="text-xs text-gray-400 mt-1">Inspektorat Kabupaten Sumba Barat</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Dinas</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sibareg-blue"
                placeholder="nama@sumbabaratkab.go.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sibareg-blue"
                placeholder="••••••••"
              />
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sibareg-blue text-white rounded-lg py-2 font-medium hover:bg-sibareg-navy transition disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Akun hanya dapat dibuat oleh Admin. Hubungi Sekretariat Inspektorat jika belum memiliki akun.
          </p>
        </div>
      </div>
    </div>
  );
}

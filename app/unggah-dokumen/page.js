"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";

const JENIS_REGULASI = ["UU", "PP", "Permendagri", "Perbup", "Surat Edaran"];
const JENIS_PEMERIKSAAN = ["APBDes", "BUMDes", "Aset Desa"];

export default function UnggahDokumenPage() {
  const { loading, profile } = useProfile();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    judul: "",
    nomor: "",
    jenis_regulasi: JENIS_REGULASI[0],
    tahun: "",
    jenis_pemeriksaan: JENIS_PEMERIKSAAN[0],
    status: "berlaku",
    tag: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: "error", text: "Silakan pilih berkas PDF terlebih dahulu." });
      return;
    }
    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Berkas harus berformat PDF." });
      return;
    }

    setSubmitting(true);

    const filePath = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error: uploadError } = await supabase.storage
      .from("dokumen-regulasi")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setSubmitting(false);
      setMessage({ type: "error", text: `Gagal mengunggah berkas: ${uploadError.message}` });
      return;
    }

    // Cek duplikasi nomor regulasi
    const { data: existing } = await supabase
      .from("regulasi")
      .select("id")
      .eq("nomor", form.nomor)
      .maybeSingle();

    if (existing) {
      setSubmitting(false);
      setMessage({ type: "error", text: "Nomor regulasi ini sudah terdaftar sebelumnya." });
      return;
    }

    const { error: insertError } = await supabase.from("regulasi").insert({
      judul: form.judul,
      nomor: form.nomor,
      jenis_regulasi: form.jenis_regulasi,
      tahun: Number(form.tahun),
      jenis_pemeriksaan: form.jenis_pemeriksaan,
      status: form.status,
      tag: form.tag,
      file_path: filePath,
      status_persetujuan: "menunggu",
      diunggah_oleh: profile?.id,
    });

    setSubmitting(false);

    if (insertError) {
      setMessage({ type: "error", text: `Gagal menyimpan metadata: ${insertError.message}` });
      return;
    }

    await supabase.from("log_aktivitas").insert({
      aksi: "unggah",
      keterangan: `Mengunggah regulasi baru: ${form.judul}`,
    });

    setMessage({ type: "success", text: "Dokumen berhasil diunggah dan menunggu persetujuan." });
    setForm({ judul: "", nomor: "", jenis_regulasi: JENIS_REGULASI[0], tahun: "", jenis_pemeriksaan: JENIS_PEMERIKSAAN[0], status: "berlaku", tag: "" });
    setFile(null);
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile?.role} />
      <div className="flex-1">
        <Topbar title="Unggah Dokumen" profile={profile} />

        <main className="p-6 max-w-3xl">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <label className="text-sm text-gray-600">Berkas PDF Regulasi</label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                {file && <p className="mt-2 text-sm text-gray-600">Berkas dipilih: {file.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Judul Regulasi</label>
                <input
                  required
                  value={form.judul}
                  onChange={(e) => updateForm("judul", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Nomor Regulasi</label>
                <input
                  required
                  value={form.nomor}
                  onChange={(e) => updateForm("nomor", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Jenis Regulasi</label>
                <select
                  value={form.jenis_regulasi}
                  onChange={(e) => updateForm("jenis_regulasi", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  {JENIS_REGULASI.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tahun Terbit</label>
                <input
                  type="number"
                  required
                  value={form.tahun}
                  onChange={(e) => updateForm("tahun", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Jenis Pemeriksaan Terkait</label>
                <select
                  value={form.jenis_pemeriksaan}
                  onChange={(e) => updateForm("jenis_pemeriksaan", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  {JENIS_PEMERIKSAAN.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status Keberlakuan</label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="berlaku">Berlaku</option>
                  <option value="dalam revisi">Dalam Revisi</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Tag Pencarian (pisahkan dengan koma)</label>
                <input
                  value={form.tag}
                  onChange={(e) => updateForm("tag", e.target.value)}
                  placeholder="cth. apbdes, siltap, dana desa"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-sibareg-blue text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-sibareg-navy disabled:opacity-60"
            >
              {submitting ? "Mengunggah..." : "Unggah Dokumen"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

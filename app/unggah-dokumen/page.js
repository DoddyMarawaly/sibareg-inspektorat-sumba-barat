"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { supabase } from "../../lib/supabaseClient";
import { useProfile } from "../../lib/useProfile";
import { TINGKAT_REGULASI, JENIS_REGULASI_BY_TINGKAT, JENIS_PEMERIKSAAN, STATUS_KEBERLAKUAN } from "../../lib/jenisRegulasi";

// Batas maksimum ukuran berkas yang diizinkan untuk diunggah (100 MB).
// Catatan: batas ini juga harus diselaraskan dengan pengaturan bucket
// Supabase Storage "dokumen-regulasi" (file_size_limit). Lihat
// supabase/storage-policy.sql bagian "PENGATURAN BUCKET" untuk perintah SQL-nya.
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE_LABEL = "100 MB";

function isPdfFile(f) {
  if (!f) return false;
  const validMime = ["application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf"];
  const nameLower = (f.name || "").toLowerCase();
  return validMime.includes(f.type) || nameLower.endsWith(".pdf");
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function UnggahDokumenPage() {
  const { loading, profile } = useProfile();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    judul: "",
    nomor: "",
    tingkat: TINGKAT_REGULASI[0],
    jenis_regulasi: JENIS_REGULASI_BY_TINGKAT[TINGKAT_REGULASI[0]][0],
    instansi_penerbit: "",
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

  function handleTingkatChange(tingkat) {
    setForm((f) => ({
      ...f,
      tingkat,
      jenis_regulasi: JENIS_REGULASI_BY_TINGKAT[tingkat][0],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: "error", text: "Silakan pilih berkas PDF terlebih dahulu." });
      return;
    }
    if (!isPdfFile(file)) {
      setMessage({ type: "error", text: "Berkas harus berformat PDF (.pdf)." });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `Ukuran berkas (${formatBytes(file.size)}) melebihi batas maksimum ${MAX_FILE_SIZE_LABEL}.`,
      });
      return;
    }

    setSubmitting(true);

    // Nama berkas dibersihkan dari karakter yang tidak aman untuk path Storage
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filePath = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("dokumen-regulasi")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    if (uploadError) {
      setSubmitting(false);
      const hint = /size|besar|payload|exceed/i.test(uploadError.message)
        ? " Pastikan pengaturan bucket Storage 'dokumen-regulasi' (file_size_limit) sudah diatur ke minimal 100MB."
        : /mime|type|format/i.test(uploadError.message)
        ? " Pastikan bucket Storage 'dokumen-regulasi' mengizinkan tipe berkas application/pdf."
        : "";
      setMessage({ type: "error", text: `Gagal mengunggah berkas: ${uploadError.message}.${hint}` });
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
      tingkat: form.tingkat,
      jenis_regulasi: form.jenis_regulasi,
      instansi_penerbit: form.instansi_penerbit,
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
      keterangan: `Mengunggah regulasi baru: ${form.judul} (${form.jenis_regulasi})`,
    });

    setMessage({ type: "success", text: "Dokumen berhasil diunggah dan menunggu persetujuan." });
    setForm({
      judul: "",
      nomor: "",
      tingkat: TINGKAT_REGULASI[0],
      jenis_regulasi: JENIS_REGULASI_BY_TINGKAT[TINGKAT_REGULASI[0]][0],
      instansi_penerbit: "",
      tahun: "",
      jenis_pemeriksaan: JENIS_PEMERIKSAAN[0],
      status: "berlaku",
      tag: "",
    });
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
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setMessage(null);
                    if (f && !isPdfFile(f)) {
                      setFile(null);
                      setMessage({ type: "error", text: "Berkas harus berformat PDF (.pdf)." });
                      return;
                    }
                    if (f && f.size > MAX_FILE_SIZE_BYTES) {
                      setFile(null);
                      setMessage({
                        type: "error",
                        text: `Ukuran berkas (${formatBytes(f.size)}) melebihi batas maksimum ${MAX_FILE_SIZE_LABEL}.`,
                      });
                      return;
                    }
                    setFile(f);
                  }}
                  className="w-full text-sm"
                />
                <p className="mt-2 text-xs text-gray-400">Format PDF, ukuran maksimum {MAX_FILE_SIZE_LABEL}.</p>
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Berkas dipilih: {file.name} ({formatBytes(file.size)})
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Judul Regulasi</label>
                <input
                  required
                  value={form.judul}
                  onChange={(e) => updateForm("judul", e.target.value)}
                  placeholder="cth. Peraturan Bupati Sumba Barat tentang Pengelolaan Keuangan Desa"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Nomor Regulasi</label>
                <input
                  required
                  value={form.nomor}
                  onChange={(e) => updateForm("nomor", e.target.value)}
                  placeholder="cth. 8 Tahun 2024"
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
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
                <label className="text-sm text-gray-600">Tingkat Peraturan</label>
                <select
                  value={form.tingkat}
                  onChange={(e) => handleTingkatChange(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  {TINGKAT_REGULASI.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Jenis Regulasi</label>
                <select
                  value={form.jenis_regulasi}
                  onChange={(e) => updateForm("jenis_regulasi", e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  {JENIS_REGULASI_BY_TINGKAT[form.tingkat].map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Instansi/Lembaga Penerbit</label>
                <input
                  value={form.instansi_penerbit}
                  onChange={(e) => updateForm("instansi_penerbit", e.target.value)}
                  placeholder="cth. Kementerian Dalam Negeri / Pemerintah Kabupaten Sumba Barat / Pemerintah Desa..."
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
                  {STATUS_KEBERLAKUAN.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
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

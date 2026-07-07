import "./globals.css";

export const metadata = {
  title: "SIBAREG - Sistem Informasi Bank Regulasi",
  description:
    "Bank Regulasi Digital Terintegrasi untuk Pengelolaan Keuangan Desa, Inspektorat Kabupaten Sumba Barat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-sibareg-bg text-gray-900">{children}</body>
    </html>
  );
}

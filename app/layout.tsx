import type {Metadata} from 'next';
import './globals.css';
import { InspectProtection } from '../components/InspectProtection';

export const metadata: Metadata = {
  title: 'E-Rapor Kurikulum Merdeka - Aplikasi Penilaian Hasil Belajar',
  description: 'Aplikasi Penilaian Hasil Belajar dan E-Rapor Kurikulum Merdeka berbasis web dengan Dashboard Guru & Orang Tua, Manajemen Data Siswa, dan Cetak PDF Resmi.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-900 min-h-screen antialiased selection:bg-amber-500 selection:text-white" suppressHydrationWarning>
        <InspectProtection />
        {children}
      </body>
    </html>
  );
}

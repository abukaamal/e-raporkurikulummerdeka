'use client';

import React from 'react';
import {
  School,
  Users,
  Target,
  FileSpreadsheet,
  Calculator,
  Award,
  BookMarked,
  Printer,
  ArrowRightLeft,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { SchoolProfile, Student, ViewTab, AuthUser } from '../types/raport';

interface MainMenuGridProps {
  onSelectTab: (tab: ViewTab) => void;
  schoolProfile: SchoolProfile;
  students: Student[];
  currentUser?: AuthUser;
}

export const MainMenuGrid: React.FC<MainMenuGridProps> = ({
  onSelectTab,
  schoolProfile,
  students,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isGuru = currentUser?.role === 'guru';

  return (
    <div className="space-y-6">
      {/* Header Banner - Kurikulum Merdeka Style matching Reference Page 1 */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-rose-700 p-0.5 rounded-2xl shadow-xl">
        <div className="bg-gradient-to-b from-amber-50 to-orange-100/70 p-5 sm:p-7 rounded-[15px] border border-amber-200/80">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-amber-100 flex items-center justify-center shadow-md shrink-0 p-1.5 border border-amber-200 overflow-hidden">
                {schoolProfile.logoUrl ? (
                  <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <School className="w-8 h-8 text-amber-800" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight uppercase">
                    Penilaian Hasil Belajar Kurikulum Merdeka
                  </h1>
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      Mode Administrator
                    </span>
                  )}
                  {isGuru && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white shadow-xs">
                      Mode Guru / Wali Kelas
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-amber-800 mt-0.5">
                  {schoolProfile.namaSekolah} • Fase {schoolProfile.fase} • Kelas {schoolProfile.kelas}
                </p>
                <p className="text-xs text-amber-700 font-medium mt-1">
                  Semester: {schoolProfile.semester} | Tahun Pelajaran: {schoolProfile.tahunPelajaran} {currentUser?.name ? `| Pengguna: ${currentUser.name}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {students.length}
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">Total Peserta Didik</p>
                <p className="text-slate-500">Tersinkronisasi Realtime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Interactive Grid matching Reference Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Data Master (Orange/Brown Theme) */}
        <div className="space-y-3.5 bg-gradient-to-b from-orange-50/80 to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-orange-200 shadow-sm">
          <div className="border-b border-orange-200 pb-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
              <School className="w-4 h-4 text-orange-600" />
              Data Master & Kurikulum
            </h2>
          </div>

          {/* Hanya ditampilkan untuk Administrator */}
          {isAdmin && (
            <button
              id="menu-btn-identitas"
              onClick={() => onSelectTab('identitas-sekolah')}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group ring-2 ring-amber-400/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/15">
                  <School className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-base leading-tight">Identitas Sekolah</p>
                    <span className="text-[10px] font-bold bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-200">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-normal">Profil sekolah, database guru & kata sandi admin</p>
                </div>
              </div>
              <span className="text-amber-300 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          )}

          <button
            id="menu-btn-siswa"
            onClick={() => onSelectTab('data-siswa')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Users className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Data Siswa</p>
                <p className="text-xs text-amber-200/90 font-normal">Tambah, Ubah, Hapus & Cari {students.length} Siswa</p>
              </div>
            </div>
            <span className="text-amber-300 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            id="menu-btn-tp"
            onClick={() => onSelectTab('tujuan-pembelajaran')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Target className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Tujuan Pembelajaran</p>
                <p className="text-xs text-amber-200/90 font-normal">Alur TP & Lingkup Materi (LM) tiap mapel</p>
              </div>
            </div>
            <span className="text-amber-300 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Center Column: Input Nilai (Red / Blue / Purple Accent) */}
        <div className="space-y-3.5 bg-gradient-to-b from-rose-50/80 to-pink-50/30 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="border-b border-rose-200 pb-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-rose-600" />
              Input Nilai & Penilaian
            </h2>
          </div>

          <button
            id="menu-btn-formatif"
            onClick={() => onSelectTab('nilai-formatif')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <FileSpreadsheet className="w-5 h-5 text-rose-100" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Nilai Asesmen Formatif</p>
                <p className="text-xs text-rose-100/90 font-normal">Input skor TP + Deskripsi Capaian Otomatis</p>
              </div>
            </div>
            <span className="text-rose-200 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            id="menu-btn-sumatif"
            onClick={() => onSelectTab('nilai-sumatif')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Calculator className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Nilai Asesmen Sumatif</p>
                <p className="text-xs text-blue-100/90 font-normal">Sumatif Lingkup Materi & Akhir Semester</p>
              </div>
            </div>
            <span className="text-blue-200 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            id="menu-btn-rekap"
            onClick={() => onSelectTab('rekap-nilai')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Award className="w-5 h-5 text-pink-100" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Rekap Nilai Akhir</p>
                <p className="text-xs text-pink-100/90 font-normal">Tabel Nilai Seluruh Mapel, Ranking & Kenaikan</p>
              </div>
            </div>
            <span className="text-pink-200 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Right Column: Output & Dokumen Rapor (Green Theme) */}
        <div className="space-y-3.5 bg-gradient-to-b from-emerald-50/80 to-teal-50/30 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="border-b border-emerald-200 pb-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-emerald-600" />
              Cetak Dokumen & Rapor
            </h2>
          </div>

          <button
            id="menu-btn-sampul"
            onClick={() => onSelectTab('sampul-rapor')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <BookMarked className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Sampul Rapor</p>
                <p className="text-xs text-emerald-100/90 font-normal">Cover resmi Rapor & Identitas Peserta Didik</p>
              </div>
            </div>
            <span className="text-emerald-200 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            id="menu-btn-lhb"
            onClick={() => onSelectTab('nilai-rapor')}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-between group ring-2 ring-emerald-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Printer className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Nilai Rapor (LHB) & PDF</p>
                <p className="text-xs text-emerald-100/90 font-normal">Laporan Hasil Belajar lengkap & Cetak PDF</p>
              </div>
            </div>
            <span className="text-emerald-200 opacity-80 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="menu-btn-mutasi"
              onClick={() => onSelectTab('mutasi')}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-200 shrink-0" />
              <div className="text-left">
                <p className="font-bold leading-tight">Mutasi</p>
                <p className="text-[10px] text-emerald-200">Keterangan Pindah</p>
              </div>
            </button>

            <button
              id="menu-btn-buku-induk"
              onClick={() => onSelectTab('buku-induk')}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-200 shrink-0" />
              <div className="text-left">
                <p className="font-bold leading-tight">Buku Induk</p>
                <p className="text-[10px] text-emerald-200">Lembar Nilai Induk</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Parent & Student Portal Quick Access Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 text-white p-5 sm:p-6 rounded-2xl border border-indigo-700/50 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Dashboard Pelaporan Berbasis Web untuk Orang Tua
            </div>
            <h3 className="text-lg font-bold text-white">Portal Mandiri Siswa & Wali Murid</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Akses transparan untuk orang tua memantau capaian belajar anak, grafik perkembangan kompetensi, catatan perkembangan wali kelas, kehadiran, dan unduh salinan PDF Rapor secara real-time.
            </p>
          </div>

          <button
            id="btn-quick-parent-portal"
            onClick={() => onSelectTab('portal-ortu')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Buka Portal Orang Tua</span>
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Download,
  Printer,
  FileText,
  BookOpen,
  User,
  Calendar,
  Award,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  LogOut,
  ChevronRight,
  School,
  IdCard,
} from 'lucide-react';
import {
  Student,
  Subject,
  SchoolProfile,
  LearningObjective,
  MaterialScope,
  FormatifAssessment,
  SumatifAssessment,
  AuthUser,
} from '../types/raport';
import { NilaiRaporView } from './NilaiRaporView';
import { SampulRaporView } from './SampulRaporView';
import { downloadElementAsPdf, triggerPrint } from '../lib/printUtils';
import { swalConfirm, swalToast } from '../lib/sweetAlert';

interface StudentPortalDashboardProps {
  currentUser: AuthUser;
  student: Student;
  schoolProfile: SchoolProfile;
  subjects: Subject[];
  learningObjectives: LearningObjective[];
  materialScopes?: MaterialScope[];
  formatifAssessments: Record<string, FormatifAssessment>;
  sumatifAssessments: Record<string, SumatifAssessment>;
  onLogout: () => void;
}

export const StudentPortalDashboard: React.FC<StudentPortalDashboardProps> = ({
  currentUser,
  student,
  schoolProfile,
  subjects,
  learningObjectives,
  materialScopes = [],
  formatifAssessments,
  sumatifAssessments,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'rapor' | 'sampul' | 'ringkasan'>('rapor');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      swalToast('Menyiapkan file PDF rapor...', 'info');
      const fileName = `Rapor_${student.name.replace(/\s+/g, '_')}_${schoolProfile.semester}_${schoolProfile.tahunPelajaran.replace(/\//g, '-')}`;
      await downloadElementAsPdf('raport-sheet', fileName);
      swalToast('Rapor PDF berhasil diunduh', 'success');
    } catch (err) {
      console.error(err);
      swalToast('Gagal memproses PDF. Silakan gunakan tombol Cetak.', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    triggerPrint('raport-sheet', `Rapor_${student.name}`);
  };

  const handleLogoutClick = async () => {
    const confirmed = await swalConfirm({
      title: 'Konfirmasi Keluar',
      text: `Apakah Anda ingin keluar dari sesi rapor siswa ${student.name}?`,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      icon: 'question',
    });
    if (confirmed) {
      swalToast('Anda telah keluar dari akun siswa', 'info');
      onLogout();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Student Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white/10 shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Portal Resmi Peserta Didik & Wali Murid</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-200 mt-1 font-medium">
                <span>NISN: <strong>{student.nisn}</strong></span>
                <span>•</span>
                <span>NIS: <strong>{student.nis}</strong></span>
                <span>•</span>
                <span>Kelas: <strong>{schoolProfile.kelas}</strong></span>
                <span>•</span>
                <span>Fase: <strong>{schoolProfile.fase}</strong></span>
              </div>
              <p className="text-xs text-indigo-300/80 mt-1">
                {schoolProfile.namaSekolah} • Semester {schoolProfile.semester} ({schoolProfile.tahunPelajaran})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="btn-download-pdf-student"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses PDF...' : 'Unduh Rapor PDF'}</span>
            </button>

            <button
              id="btn-print-student"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              id="btn-logout-student"
              onClick={handleLogoutClick}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white font-semibold text-xs border border-rose-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Keluar Akun Siswa"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Inner Nav Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-700/50">
          <button
            onClick={() => setActiveTab('rapor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rapor'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dokumen Rapor Lengkap (LHB)</span>
          </button>

          <button
            onClick={() => setActiveTab('sampul')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sampul'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sampul & Biodata Rapor</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'rapor' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <NilaiRaporView
            schoolConfig={schoolProfile}
            students={[student]}
            subjects={subjects}
            learningObjectives={learningObjectives}
            materialScopes={materialScopes}
            formatifAssessments={formatifAssessments}
            sumatifAssessments={sumatifAssessments}
            onBack={() => {}}
          />
        </div>
      )}

      {activeTab === 'sampul' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <SampulRaporView
            schoolConfig={schoolProfile}
            students={[student]}
            onBack={() => {}}
          />
        </div>
      )}
    </div>
  );
};

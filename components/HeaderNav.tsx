'use client';

import React from 'react';
import {
  GraduationCap,
  Users,
  Printer,
  School,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  LogIn,
  LogOut,
  IdCard,
} from 'lucide-react';
import { SchoolProfile, ViewTab, AuthUser } from '../types/raport';
import { swalConfirm, swalToast } from '../lib/sweetAlert';

interface HeaderNavProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  schoolProfile: SchoolProfile;
  currentUser: AuthUser;
  onOpenLoginModal: () => void;
  onLogout?: () => void;
  currentSemester?: string;
  onResetData?: () => void;
  onSemesterChange?: (semester: '1 (Ganjil)' | '2 (Genap)') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  setCurrentTab,
  schoolProfile,
  currentUser,
  onOpenLoginModal,
  onLogout,
  currentSemester,
  onResetData,
  onSemesterChange,
}) => {
  const activeSemester = currentSemester || schoolProfile.semester;
  const isSemester1 = activeSemester?.includes('1') || activeSemester?.toLowerCase().includes('ganjil');

  const handleLogoutClick = async () => {
    const confirmed = await swalConfirm({
      title: 'Konfirmasi Keluar Akun',
      text: `Apakah Anda yakin ingin keluar dari akun ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'guru' ? 'Guru / Wali' : 'Peserta Didik'})?`,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      icon: 'question',
    });

    if (confirmed) {
      swalToast('Anda telah keluar dari akun', 'info');
      if (onLogout) {
        onLogout();
      } else {
        onOpenLoginModal();
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md w-full">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 py-2.5 gap-2.5">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              onClick={() => {
                if (currentUser.role === 'siswa') {
                  setCurrentTab('portal-ortu');
                } else {
                  setCurrentTab('home');
                }
              }}
              className="flex items-center space-x-2.5 text-left focus:outline-none min-w-0 cursor-pointer group"
              title="Beranda E-Rapor"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                {schoolProfile.logoUrl ? (
                  <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 bg-white" />
                ) : (
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap group-hover:text-amber-400 transition-colors">
                    E-Rapor Merdeka
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="hidden xs:inline-flex px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Admin
                    </span>
                  )}
                  {currentUser.role === 'guru' && (
                    <span className="hidden xs:inline-flex px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 items-center gap-1 shrink-0">
                      <GraduationCap className="w-3 h-3 text-amber-400" />
                      Guru {currentUser.isBelajarId ? '• Belajar.id' : ''}
                    </span>
                  )}
                  {currentUser.role === 'siswa' && (
                    <span className="hidden xs:inline-flex px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 items-center gap-1 shrink-0">
                      <IdCard className="w-3 h-3 text-blue-400" />
                      Siswa
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-normal truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm">
                  {schoolProfile.namaSekolah}
                </p>
              </div>
            </button>
          </div>

          {/* Controls: Semester Switcher, User Account Info, Logout, Reset */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5">
            {/* Semester Switcher Pill (for Guru & Admin) */}
            {onSemesterChange && currentUser.role !== 'siswa' && (
              <div className="bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700 flex items-center text-[11px] sm:text-xs font-semibold shrink-0">
                <button
                  id="btn-switch-sem-1"
                  onClick={() => onSemesterChange('1 (Ganjil)')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isSemester1
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Pilih Semester 1 (Ganjil)"
                >
                  Sem 1
                </button>
                <button
                  id="btn-switch-sem-2"
                  onClick={() => onSemesterChange('2 (Genap)')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    !isSemester1
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Pilih Semester 2 (Genap)"
                >
                  Sem 2
                </button>
              </div>
            )}

            {/* Quick Link to Rapor (Admin / Guru) */}
            {currentUser.role !== 'siswa' && (
              <button
                id="btn-nav-print-rapor"
                onClick={() => setCurrentTab('nilai-rapor')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors text-xs font-medium cursor-pointer"
                title="Buka Cetak Rapor"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rapor</span>
              </button>
            )}

            {/* Active User Account Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white shadow-sm text-xs">
              {currentUser.role === 'admin' && (
                <div className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                  AD
                </div>
              )}
              {currentUser.role === 'guru' && (
                <div className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                  GR
                </div>
              )}
              {currentUser.role === 'siswa' && (
                <div className="w-5 h-5 rounded-md bg-blue-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                  SW
                </div>
              )}
              
              <div className="text-left hidden sm:block max-w-[120px] md:max-w-[160px] truncate">
                <p className="font-semibold text-[11px] leading-tight text-slate-200 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[9px] text-slate-400 leading-none truncate">
                  {currentUser.role === 'admin'
                    ? 'Administrator'
                    : currentUser.role === 'guru'
                    ? currentUser.email || 'Guru / Wali'
                    : `NISN: ${currentUser.nisn || '-'}`}
                </p>
              </div>

              {/* Logout Button */}
              <button
                id="btn-nav-user-logout"
                onClick={handleLogoutClick}
                className="ml-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                title="Keluar dari akun saat ini"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>

            {/* Reset / Reseed data (Admin only) */}
            {onResetData && currentUser.role === 'admin' && (
              <button
                id="btn-nav-reset-data"
                onClick={onResetData}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Muat Ulang / Reset Data Contoh (Admin)"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

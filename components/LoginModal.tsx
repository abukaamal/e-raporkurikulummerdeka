'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  User,
  LogIn,
  X,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  IdCard,
  Lock,
} from 'lucide-react';
import { AuthUser, Student, Teacher, UserRole } from '../types/raport';
import { swalToast, swalError, swalSuccess } from '../lib/sweetAlert';
import { RaportService } from '../lib/raportDb';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onLogin: (user: AuthUser) => void;
  students: Student[];
  schoolName: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  students,
  schoolName,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentUser.role || 'guru');
  
  // Guru / Belajar.id State - Empty by default as requested
  const [guruEmail, setGuruEmail] = useState('');
  const [guruName, setGuruName] = useState('');
  
  // Admin State - Empty by default
  const [adminPassword, setAdminPassword] = useState('');
  
  // Siswa State - Empty by default
  const [nisnInput, setNisnInput] = useState('');
  const [studentError, setStudentError] = useState('');
  
  // Registered teachers list from database
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const unsub = RaportService.subscribeTeachers((tList) => {
      setTeachers(tList);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGuruLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = guruEmail.trim().toLowerCase();
    const name = guruName.trim().toLowerCase();
    
    if (!name && !email) {
      await swalError('Data Belum Lengkap', 'Silakan masukkan Nama Lengkap dan Alamat Email pendidik.');
      return;
    }

    // Check against registered teachers database
    const dbTeachers = teachers.length > 0 ? teachers : RaportService.getTeachersSync();
    
    const matchedTeacher = dbTeachers.find((t) => {
      const tEmail = (t.email || '').trim().toLowerCase();
      const tName = (t.name || '').trim().toLowerCase();
      return (email && tEmail === email) || (name && (tName.includes(name) || name.includes(tName)));
    });

    if (!matchedTeacher) {
      await swalError(
        'Akun Guru Tidak Terdaftar',
        `Pendidik dengan email "${guruEmail}" atau nama "${guruName}" tidak ditemukan dalam database resmi sekolah.\n\nHanya pendidik yang terdaftar di database yang dapat masuk. Silakan hubungi Administrator Kurikulum untuk didaftarkan.`
      );
      return;
    }

    const isBelajar = matchedTeacher.email.includes('.belajar.id') || matchedTeacher.email.includes('@guru.') || matchedTeacher.email.includes('@admin.');

    const user: AuthUser = {
      id: matchedTeacher.id,
      name: matchedTeacher.name,
      email: matchedTeacher.email,
      role: 'guru',
      isBelajarId: isBelajar,
      schoolName: schoolName,
      className: matchedTeacher.assignedClass || 'Kelas VII-A',
      assignedClass: matchedTeacher.assignedClass,
      isWaliKelas: matchedTeacher.isWaliKelas !== false && (matchedTeacher.role === 'wali_kelas' || matchedTeacher.isWaliKelas === true),
    };

    swalToast(`Selamat datang, ${user.name} (${user.isWaliKelas ? `Wali Kelas ${user.assignedClass}` : 'Guru Mata Pelajaran'})!`, 'success');
    onLogin(user);
    onClose();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwd = adminPassword.trim();
    if (!pwd) {
      await swalError('Kata Sandi Diperlukan', 'Silakan masukkan kata sandi administrator.');
      return;
    }

    // Verify against database admin password
    const validPassword = await RaportService.getAdminPassword();
    
    if (pwd !== validPassword) {
      await swalError(
        'Kata Sandi Salah',
        'Kata sandi administrator yang Anda masukkan tidak sesuai dengan database. Silakan periksa kembali kata sandi Anda.'
      );
      return;
    }

    const user: AuthUser = {
      id: 'admin-user-1',
      name: 'Administrator Kurikulum',
      email: 'admin@kurikulum.merdeka.id',
      role: 'admin',
      isBelajarId: true,
      schoolName: schoolName,
      assignedClass: 'Semua',
      isWaliKelas: true,
    };

    swalToast('Berhasil masuk sebagai Administrator Kurikulum', 'success');
    onLogin(user);
    onClose();
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const q = nisnInput.trim().toLowerCase();
    if (!q) {
      await swalError('NISN Wajib Diisi', 'Silakan masukkan 10 digit NISN atau nomor NIS peserta didik.');
      return;
    }

    // Check strictly against students database
    const matched = students.find(
      (s) => s.nisn.trim().toLowerCase() === q || s.nis.trim().toLowerCase() === q
    );

    if (!matched) {
      setStudentError(`Nomor NISN/NIS "${nisnInput}" tidak ditemukan.`);
      await swalError(
        'Data Siswa Tidak Ditemukan',
        `Peserta didik dengan NISN/NIS "${nisnInput}" tidak terdaftar dalam database sekolah.\n\nHanya siswa yang terdaftar di database yang dapat mengakses portal rapor.`
      );
      return;
    }

    const user: AuthUser = {
      id: matched.id,
      name: matched.name,
      nisn: matched.nisn,
      nis: matched.nis,
      studentId: matched.id,
      role: 'siswa',
      schoolName: schoolName,
      className: matched.kelas || 'Kelas VII-A',
      assignedClass: matched.kelas,
      isWaliKelas: false,
    };

    swalToast(`Selamat datang di Portal Rapor Siswa, ${matched.name}!`, 'success');
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Autentikasi Hak Akses E-Rapor</h2>
              <p className="text-xs text-slate-300 mt-0.5">{schoolName} • Kurikulum Merdeka</p>
            </div>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 bg-slate-800/80 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('guru')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'guru'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Guru / Wali</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('siswa')}
              className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'siswa'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Siswa (NISN)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* TAB 1: GURU / BELAJAR.ID */}
          {activeTab === 'guru' && (
            <form onSubmit={handleGuruLogin} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-xs text-blue-950">
                  <p className="font-bold">Login Akun Guru / Belajar.id</p>
                  <p className="text-blue-800 mt-0.5">
                    Masukkan nama atau email yang telah terdaftar dalam database guru & wali kelas sekolah.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Lengkap Guru / Pendidik
                  </label>
                  <input
                    type="text"
                    value={guruName}
                    onChange={(e) => setGuruName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="Masukkan nama lengkap guru..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Akun Google / Belajar.id
                  </label>
                  <input
                    type="email"
                    value={guruEmail}
                    onChange={(e) => setGuruEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="contoh: nama@guru.smp.belajar.id"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk sebagai Guru / Pendidik</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADMIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs text-emerald-950">
                  <p className="font-bold">Autentikasi Administrator Kurikulum</p>
                  <p className="text-emerald-800 mt-0.5">
                    Masukkan kata sandi administrator untuk mengelola identitas sekolah, kata sandi sistem, dan data rombel.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kata Sandi Administrator
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan kata sandi administrator..."
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dapat mengubah Kata Sandi Administrator di Pengaturan</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dapat mendaftarkan akun Guru & Wali Kelas baru</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akses penuh konfigurasi identitas sekolah dan rapor</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi & Masuk Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SISWA / NISN */}
          {activeTab === 'siswa' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <IdCard className="w-4 h-4" />
                </div>
                <div className="text-xs text-amber-950">
                  <p className="font-bold">Masuk Portal Siswa dengan NISN</p>
                  <p className="text-amber-800 mt-0.5">
                    Masukkan 10 digit NISN resmi untuk melihat nilai capaian kompetensi dan mengunduh salinan PDF Rapor.
                  </p>
                </div>
              </div>

              {studentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nomor Induk Siswa Nasional (NISN)
                  </label>
                  <input
                    type="text"
                    value={nisnInput}
                    onChange={(e) => {
                      setNisnInput(e.target.value);
                      setStudentError('');
                    }}
                    required
                    placeholder="Masukkan 10 digit NISN peserta didik..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hanya siswa yang telah terdata dalam database sekolah yang dapat login.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Buka Rapor Siswa</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Sistem Penilaian e-Rapor Terpadu Berbasis Kurikulum Merdeka
        </div>
      </div>
    </div>
  );
};

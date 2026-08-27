'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  User,
  LogIn,
  School,
  Lock,
  Mail,
  IdCard,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  ArrowRight,
  BookOpen,
  Info,
} from 'lucide-react';
import { AuthUser, SchoolProfile, Student, Teacher, UserRole } from '../types/raport';
import { RaportService } from '../lib/raportDb';
import { swalError, swalSuccess, swalToast, swalWarning } from '../lib/sweetAlert';

interface LandingLoginViewProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LandingLoginView: React.FC<LandingLoginViewProps> = ({
  schoolProfile,
  students,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('guru');
  
  // Form inputs
  const [adminPassword, setAdminPassword] = useState('');
  const [guruName, setGuruName] = useState('');
  const [guruEmail, setGuruEmail] = useState('');
  const [nisnInput, setNisnInput] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Subscribe to teachers in database for real-time validation
  useEffect(() => {
    const unsub = RaportService.subscribeTeachers((list) => {
      setTeachers(list);
    });
    return () => unsub();
  }, []);

  // Handle Administrator Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = adminPassword.trim();
    if (!pwd) {
      await swalWarning('Kata Sandi Wajib Diisi', 'Silakan masukkan kata sandi Administrator Kurikulum.');
      return;
    }

    setIsVerifying(true);
    try {
      const validPassword = await RaportService.getAdminPassword();

      if (pwd !== validPassword) {
        setIsVerifying(false);
        await swalError(
          'Akses Ditolak: Kata Sandi Tidak Sesuai',
          'Kata sandi Administrator yang Anda masukkan tidak cocok dengan data di database sekolah. Aplikasi tidak dapat dibuka.'
        );
        return;
      }

      // Valid in database!
      const adminUser: AuthUser = {
        id: 'admin-main',
        name: 'Administrator Kurikulum',
        email: 'admin@kurikulum.merdeka.id',
        role: 'admin',
        isBelajarId: true,
        schoolName: schoolProfile.namaSekolah || 'SMP MEFENG',
        assignedClass: 'Semua',
        isWaliKelas: true,
      };

      swalToast('Verifikasi Berhasil! Selamat datang, Administrator.', 'success');
      onLoginSuccess(adminUser);
    } catch (err) {
      console.error('Admin login error', err);
      await swalError('Terjadi Kendala', 'Gagal memverifikasi ke database. Silakan coba kembali.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Guru / Wali Kelas Login
  const handleGuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameQuery = guruName.trim().toLowerCase();
    const emailQuery = guruEmail.trim().toLowerCase();

    if (!nameQuery && !emailQuery) {
      await swalWarning('Data Belum Lengkap', 'Silakan masukkan Nama Lengkap dan/atau Email Akun Pendidik Anda.');
      return;
    }

    setIsVerifying(true);
    try {
      const dbTeachers = teachers.length > 0 ? teachers : RaportService.getTeachersSync();

      const matchedTeacher = dbTeachers.find((t) => {
        const tEmail = (t.email || '').trim().toLowerCase();
        const tName = (t.name || '').trim().toLowerCase();
        const matchEmail = emailQuery && tEmail === emailQuery;
        const matchName = nameQuery && (tName.includes(nameQuery) || nameQuery.includes(tName));
        return matchEmail || matchName;
      });

      if (!matchedTeacher) {
        setIsVerifying(false);
        await swalError(
          'Akun Guru Tidak Terdaftar di Database',
          `Pendidik dengan Nama: "${guruName}" atau Email: "${guruEmail}" tidak ditemukan dalam database resmi sekolah.\n\nHanya guru dan wali kelas yang terdaftar di database yang dapat mengakses sistem e-Rapor.`
        );
        return;
      }

      const isBelajar =
        matchedTeacher.email.includes('.belajar.id') ||
        matchedTeacher.email.includes('@guru.') ||
        matchedTeacher.email.includes('@admin.');

      const guruUser: AuthUser = {
        id: matchedTeacher.id,
        name: matchedTeacher.name,
        email: matchedTeacher.email,
        role: 'guru',
        isBelajarId: isBelajar,
        schoolName: schoolProfile.namaSekolah || 'SMP MEFENG',
        className: matchedTeacher.assignedClass || 'Kelas VII-A',
        assignedClass: matchedTeacher.assignedClass,
        isWaliKelas:
          matchedTeacher.isWaliKelas !== false &&
          (matchedTeacher.role === 'wali_kelas' || matchedTeacher.isWaliKelas === true),
      };

      swalToast(
        `Verifikasi Berhasil! Selamat datang, ${guruUser.name} (${
          guruUser.isWaliKelas ? `Wali Kelas ${guruUser.assignedClass}` : 'Guru Mata Pelajaran'
        })`,
        'success'
      );
      onLoginSuccess(guruUser);
    } catch (err) {
      console.error('Guru login error', err);
      await swalError('Terjadi Kendala', 'Gagal memverifikasi data guru ke database.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Siswa (NISN) Login
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = nisnInput.trim().toLowerCase();

    if (!q) {
      await swalWarning('NISN / NIS Wajib Diisi', 'Silakan masukkan 10 digit Nomor Induk Siswa Nasional (NISN) atau NIS.');
      return;
    }

    setIsVerifying(true);
    try {
      const matchedStudent = students.find(
        (s) => (s.nisn && s.nisn.trim().toLowerCase() === q) || (s.nis && s.nis.trim().toLowerCase() === q)
      );

      if (!matchedStudent) {
        setIsVerifying(false);
        await swalError(
          'NISN Tidak Ditemukan di Database',
          `Nomor NISN/NIS "${nisnInput}" tidak terdaftar dalam database peserta didik sekolah.\n\nSilakan periksa kembali nomor NISN Anda atau hubungi Wali Kelas jika data belum terdaftar.`
        );
        return;
      }

      const studentUser: AuthUser = {
        id: matchedStudent.id,
        name: matchedStudent.name,
        nisn: matchedStudent.nisn,
        nis: matchedStudent.nis,
        studentId: matchedStudent.id,
        role: 'siswa',
        schoolName: schoolProfile.namaSekolah || 'SMP MEFENG',
        className: matchedStudent.kelas || schoolProfile.kelas || 'Kelas VII-A',
        assignedClass: matchedStudent.kelas || schoolProfile.kelas,
        isWaliKelas: false,
      };

      swalToast(`Verifikasi Berhasil! Selamat datang di Portal Rapor, ${matchedStudent.name}`, 'success');
      onLoginSuccess(studentUser);
    } catch (err) {
      console.error('Student login error', err);
      await swalError('Terjadi Kendala', 'Gagal memverifikasi data siswa ke database.');
    } finally {
      setIsVerifying(false);
    }
  };

  const schoolDisplayName = schoolProfile.namaSekolah || 'SMP MEFENG';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center overflow-hidden">
            {schoolProfile.logoUrl ? (
              <img
                src={schoolProfile.logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain p-0.5 bg-white rounded-xl"
              />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              {schoolDisplayName}
            </h1>
            <p className="text-[11px] text-amber-400 font-medium">
              E-Rapor Kurikulum Merdeka &bull; TP {schoolProfile.tahunPelajaran || '2026/2027'} ({schoolProfile.semester || 'Semester 1'})
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Database Terintegrasi</span>
        </div>
      </header>

      {/* Main Content Area: Hero & Authentication Portal */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Branding, Logo & School Identity */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerbang Akses Resmi Satuan Pendidikan</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center lg:justify-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-[22px] p-2 flex items-center justify-center overflow-hidden">
                    {schoolProfile.logoUrl ? (
                      <img
                        src={schoolProfile.logoUrl}
                        alt="Logo Sekolah"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <School className="w-14 h-14 text-amber-400" />
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {schoolDisplayName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sistem Penilaian Capaian Pembelajaran, Asesmen Formatif & Sumatif, Buku Induk, Mutasi Siswa, dan Pengelolaan Rapor Kurikulum Merdeka.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Pemeriksaan Keamanan & Database Aktif</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Aplikasi hanya dapat dibuka jika data akun (Admin, Pendidik, atau Siswa) terdaftar dan terverifikasi secara sah dalam database sekolah.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Login Container with 3 Role Selector */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Decorative Accent Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                
                {/* 3 Role Selection Buttons */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Pilih Peran Pengguna :
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      id="btn-role-guru"
                      onClick={() => setSelectedRole('guru')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'guru'
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>Guru / Wali</span>
                    </button>

                    <button
                      type="button"
                      id="btn-role-admin"
                      onClick={() => setSelectedRole('admin')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'admin'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Admin</span>
                    </button>

                    <button
                      type="button"
                      id="btn-role-siswa"
                      onClick={() => setSelectedRole('siswa')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'siswa'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>Siswa</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: FORM WALI KELAS / GURU */}
                {selectedRole === 'guru' && (
                  <form onSubmit={handleGuruSubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Login Pendidik (Wali Kelas / Guru Mapel)</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Masukkan Nama Lengkap atau Email Akun Belajar.id Anda yang sudah terdaftar di database guru.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Nama Lengkap Guru / Pendidik
                        </label>
                        <input
                          type="text"
                          value={guruName}
                          onChange={(e) => setGuruName(e.target.value)}
                          placeholder="Masukkan nama guru (misal: Imat Rohimat)"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Email Akun Google / Belajar.id
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={guruEmail}
                            onChange={(e) => setGuruEmail(e.target.value)}
                            placeholder="nama@guru.smp.belajar.id"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      id="btn-submit-login-guru"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isVerifying ? 'Memverifikasi Database...' : 'Verifikasi & Masuk Sebagai Guru'}</span>
                    </button>
                  </form>
                )}

                {/* TAB 2: FORM ADMINISTRATOR */}
                {selectedRole === 'admin' && (
                  <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Autentikasi Administrator Kurikulum</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Masukkan kata sandi Administrator untuk mengelola profil sekolah, data guru, rombel, dan pengaturan sistem.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Kata Sandi Administrator
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Masukkan kata sandi administrator..."
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      id="btn-submit-login-admin"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isVerifying ? 'Memverifikasi Database...' : 'Verifikasi & Buka Akses Admin'}</span>
                    </button>
                  </form>
                )}

                {/* TAB 3: FORM SISWA / NISN */}
                {selectedRole === 'siswa' && (
                  <form onSubmit={handleStudentSubmit} className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-3">
                      <IdCard className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Portal Rapor Peserta Didik</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Masukkan 10 digit NISN atau NIS Anda yang tercantum dalam data siswa sekolah untuk melihat hasil capaian belajar.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Nomor Induk Siswa Nasional (NISN) / NIS
                      </label>
                      <div className="relative">
                        <IdCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={nisnInput}
                          onChange={(e) => setNisnInput(e.target.value)}
                          placeholder="Masukkan 10 digit NISN peserta didik..."
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono font-bold tracking-wider"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      id="btn-submit-login-siswa"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isVerifying ? 'Memverifikasi Database...' : 'Verifikasi & Buka Rapor Siswa'}</span>
                    </button>
                  </form>
                )}

                {/* Footer notes */}
                <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-800/80">
                  <p>
                    {schoolDisplayName} &bull; E-Rapor Digital Kurikulum Merdeka Terpadu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-500 py-3 border-t border-white/5">
        &copy; {new Date().getFullYear()} {schoolDisplayName} &bull; Hak Cipta Terlindungi &bull; Berbasis Standar Kurikulum Merdeka Kemendikbudristek
      </footer>
    </div>
  );
};

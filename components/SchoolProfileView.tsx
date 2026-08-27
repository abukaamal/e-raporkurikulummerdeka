'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  School,
  Save,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  KeyRound,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { AuthUser, SchoolProfile, Teacher, ClassRoom } from '../types/raport';
import { initialSchoolProfile, defaultTeachers, defaultClasses } from '../lib/initialData';
import { RaportService } from '../lib/raportDb';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { swalSuccess, swalError, swalConfirm, swalToast } from '../lib/sweetAlert';

interface SchoolProfileViewProps {
  profile: SchoolProfile;
  currentUser?: AuthUser;
  onSave: (profile: SchoolProfile) => Promise<void>;
  onBack: () => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  profile,
  currentUser,
  onSave,
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'classes' | 'teachers' | 'security'>('profile');
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Classes State (Admin CRUD Kelas)
  const [classes, setClasses] = useState<ClassRoom[]>(defaultClasses);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classForm, setClassForm] = useState<Partial<ClassRoom>>({
    name: 'VII-A',
    tingkat: 'VII',
    fase: 'D',
    waliKelas: '',
    nipWaliKelas: '',
    ruangan: 'Ruang 01',
    tahunAjaran: profile.tahunPelajaran || '2023/2024',
    semester: profile.semester || '1 (Ganjil)',
  });

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>(defaultTeachers);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    name: '',
    nip: '',
    email: '',
    role: 'wali_kelas',
    assignedClass: 'VII-A',
    isWaliKelas: true,
  });

  // Admin Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setFormData({ ...profile });
  }

  useEffect(() => {
    const unsubTeachers = RaportService.subscribeTeachers((tList) => {
      if (tList && tList.length > 0) setTeachers(tList);
    });
    const unsubClasses = RaportService.subscribeClasses((cList) => {
      if (cList && cList.length > 0) setClasses(cList);
    });

    return () => {
      unsubTeachers();
      unsubClasses();
    };
  }, []);

  const handleChange = (field: keyof SchoolProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setSavedSuccess(true);
      swalToast('Identitas sekolah berhasil diperbarui', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      swalError('Gagal Menyimpan', 'Terjadi kendala saat menyimpan profil sekolah.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await swalConfirm({
      title: 'Kembalikan ke Nilai Default?',
      text: 'Data identitas sekolah akan diatur ulang ke profil standar.',
      confirmButtonText: 'Ya, Reset',
      icon: 'question',
    });
    if (confirmed) {
      setFormData({ ...initialSchoolProfile });
      await onSave({ ...initialSchoolProfile });
      swalToast('Profil dikembalikan ke default', 'info');
    }
  };

  // Logo Upload Handlers
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingLogo(true);
    try {
      const dataUrl = await compressAndEncodeImage(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.9,
        mimeType: 'image/png',
      });

      const updated = { ...formData, logoUrl: dataUrl };
      setFormData(updated);
      await onSave(updated);
      swalToast('Logo sekolah berhasil diunggah dan disimpan.', 'success');
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      swalError('Gagal Mengunggah Logo', err.message || 'Format berkas tidak didukung.');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    const confirmed = await swalConfirm({
      title: 'Hapus Logo Sekolah?',
      text: 'Logo sekolah akan dihapus dan kembali menggunakan lambang standar.',
      confirmButtonText: 'Ya, Hapus Logo',
      icon: 'warning',
    });
    if (confirmed) {
      const updated = { ...formData, logoUrl: '' };
      setFormData(updated);
      await onSave(updated);
      swalToast('Logo sekolah telah dihapus.', 'info');
    }
  };

  // ================= CLASS MANAGEMENT HANDLERS (ADMIN) =================
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({
      name: '',
      tingkat: 'VII',
      fase: 'D',
      waliKelas: teachers[0]?.name || '',
      nipWaliKelas: teachers[0]?.nip || '',
      ruangan: `Ruang 0${classes.length + 1}`,
      tahunAjaran: formData.tahunPelajaran || '2023/2024',
      semester: formData.semester || '1 (Ganjil)',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassForm({ ...cls });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name?.trim()) {
      await swalError('Validasi Gagal', 'Nama kelas (contoh: VII-A) wajib diisi.');
      return;
    }

    const classNameClean = classForm.name.trim();
    const classData: ClassRoom = {
      id: editingClass ? editingClass.id : `class-${Date.now()}`,
      name: classNameClean,
      tingkat: classForm.tingkat?.trim() || 'VII',
      fase: classForm.fase?.trim() || 'D',
      waliKelas: classForm.waliKelas?.trim() || formData.namaGuruKelas || '-',
      nipWaliKelas: classForm.nipWaliKelas?.trim() || formData.nipGuruKelas || '-',
      ruangan: classForm.ruangan?.trim() || 'Ruang Kelas',
      tahunAjaran: classForm.tahunAjaran?.trim() || formData.tahunPelajaran,
      semester: classForm.semester?.trim() || formData.semester,
    };

    if (editingClass) {
      await RaportService.updateClass(classData);
      swalToast(`Kelas "${classData.name}" berhasil diperbarui.`);
    } else {
      // Cek duplikasi nama kelas
      const exists = classes.some((c) => c.name.toLowerCase() === classNameClean.toLowerCase());
      if (exists) {
        await swalError('Kelas Sudah Ada', `Kelas dengan nama "${classNameClean}" sudah terdaftar.`);
        return;
      }
      await RaportService.addClass(classData);
      swalToast(`Kelas baru "${classData.name}" berhasil ditambahkan.`);
    }

    setIsClassModalOpen(false);
  };

  const handleDeleteClass = async (cls: ClassRoom) => {
    if (classes.length <= 1) {
      await swalError('Tidak Dapat Dihapus', 'Minimal harus ada 1 kelas aktif di sistem.');
      return;
    }

    const confirmed = await swalConfirm({
      title: `Hapus Kelas ${cls.name}?`,
      text: `Apakah Anda yakin ingin menghapus kelas "${cls.name}"? Data kelas ini akan dihapus dari daftar rombel.`,
      confirmButtonText: 'Ya, Hapus Kelas',
      isDangerous: true,
    });

    if (confirmed) {
      await RaportService.deleteClass(cls.id);
      swalToast(`Kelas "${cls.name}" berhasil dihapus.`);
    }
  };

  const handleSetActiveClass = async (cls: ClassRoom) => {
    const confirmed = await swalConfirm({
      title: `Jadikan Kelas ${cls.name} Rombel Utama?`,
      text: `Profil sekolah akan otomatis diperbarui: Kelas "${cls.name}", Fase "${cls.fase}", dan Wali Kelas "${cls.waliKelas}".`,
      confirmButtonText: 'Ya, Terapkan',
      icon: 'question',
    });

    if (confirmed) {
      const updated: SchoolProfile = {
        ...formData,
        kelas: cls.name,
        fase: cls.fase || cls.phase || 'D',
        namaGuruKelas: cls.waliKelas || cls.waliKelasName || formData.namaGuruKelas || '-',
        nipGuruKelas: cls.nipWaliKelas || cls.waliKelasNip || formData.nipGuruKelas || '-',
      };
      setFormData(updated);
      await onSave(updated);
      swalToast(`Rombel aktif diubah menjadi Kelas ${cls.name}`, 'success');
    }
  };

  // ================= TEACHER HANDLERS =================
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      name: '',
      nip: '',
      email: '',
      role: 'wali_kelas',
      assignedClass: classes[0]?.name || 'VII-A',
      isWaliKelas: true,
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherForm({ ...t });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name?.trim() || !teacherForm.email?.trim()) {
      await swalError('Data Tidak Lengkap', 'Nama dan email guru wajib diisi.');
      return;
    }

    const isWali = teacherForm.role === 'wali_kelas' || teacherForm.isWaliKelas === true;
    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `teacher-${Date.now()}`,
      name: teacherForm.name.trim(),
      nip: teacherForm.nip?.trim() || '-',
      email: teacherForm.email.trim().toLowerCase(),
      role: isWali ? 'wali_kelas' : 'guru_mapel',
      assignedClass: teacherForm.assignedClass || classes[0]?.name || 'VII-A',
      isWaliKelas: isWali,
    };

    if (editingTeacher) {
      await RaportService.updateTeacher(teacherData);
      swalToast(`Data guru "${teacherData.name}" berhasil diperbarui.`);
    } else {
      await RaportService.addTeacher(teacherData);
      swalToast(`Guru "${teacherData.name}" berhasil ditambahkan ke database.`);
    }

    setIsTeacherModalOpen(false);
  };

  const handleDeleteTeacher = async (t: Teacher) => {
    const confirmed = await swalConfirm({
      title: 'Hapus Akses Guru?',
      text: `Guru "${t.name}" (${t.email}) tidak akan dapat lagi masuk ke sistem jika dihapus dari database.`,
      confirmButtonText: 'Ya, Hapus',
      isDangerous: true,
    });

    if (confirmed) {
      await RaportService.deleteTeacher(t.id);
      swalToast(`Guru "${t.name}" telah dihapus dari database.`);
    }
  };

  // ================= ADMIN PASSWORD HANDLER =================
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      await swalError('Validasi Gagal', 'Masukkan kata sandi administrator saat ini.');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      await swalError('Kata Sandi Lemah', 'Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      await swalError('Konfirmasi Tidak Cocok', 'Kata sandi baru dan konfirmasi kata sandi tidak sama.');
      return;
    }

    setIsChangingPwd(true);
    try {
      const currentPwd = await RaportService.getAdminPassword();
      if (oldPassword !== currentPwd) {
        await swalError('Kata Sandi Lama Salah', 'Kata sandi saat ini yang Anda masukkan tidak cocok.');
        setIsChangingPwd(false);
        return;
      }

      await RaportService.setAdminPassword(newPassword.trim());
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await swalSuccess('Kata Sandi Diperbarui', 'Kata sandi administrator berhasil diubah dan disimpan di database.');
    } catch (err) {
      console.error(err);
      await swalError('Gagal Mengubah Kata Sandi', 'Terjadi kesalahan sistem saat menyimpan kata sandi baru.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  // PROTEKSI KETAT: Hanya Administrator yang boleh mengakses halaman ini
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Akses Terbatas — Khusus Administrator</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Halaman <strong>Identitas Sekolah, Manajemen Kelas & Pengaturan Sistem</strong> hanya dapat diakses oleh akun dengan peran <strong>Administrator Kurikulum</strong>.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
          <p className="font-bold text-slate-800">Status Akun Anda Saat Ini:</p>
          <p>• Nama: <span className="font-semibold text-slate-900">{currentUser?.name || 'Pendidik'}</span></p>
          <p>• Peran: <span className="font-semibold text-amber-700 uppercase">{currentUser?.role || 'Guru'}</span></p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 mt-2">
            Silakan masuk dengan akun Administrator untuk mengelola identitas sekolah, rombel/kelas, dan database pendidik.
          </p>
        </div>
        <div>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <School className="w-6 h-6 text-amber-700" />
              Identitas Sekolah & Pengaturan Admin
            </h1>
            <p className="text-xs text-slate-500">
              Kelola profil sekolah, upload logo, manajemen kelas/rombel, database pendidik, dan kata sandi admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeSubTab === 'profile' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-4xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Profil & Logo Sekolah</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('classes')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'classes'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manajemen Kelas ({classes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('teachers')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'teachers'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Database Guru ({teachers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Kata Sandi Admin</span>
        </button>
      </div>

      {/* ================= TAB 1: PROFIL & UPLOAD LOGO SEKOLAH ================= */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Upload Logo Sekolah */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-700" />
                  Logo Resmi Satuan Pendidikan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logo ini akan ditampilkan di sampul cover depan rapor, lembar buku induk, kop surat, dan navbar sistem.
                </p>
              </div>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Logo
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              {/* Preview Box */}
              <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-2.5 overflow-hidden shrink-0 relative group">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Sekolah"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <School className="w-12 h-12 mx-auto text-amber-800/40 mb-1" />
                    <span className="text-[10px] font-semibold block">Logo Standar</span>
                  </div>
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-[11px] font-bold">
                    Memproses...
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 text-left space-y-2.5 w-full">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  id="school-logo-input"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{formData.logoUrl ? 'Ganti Berkas Logo' : 'Pilih & Upload Logo Sekolah'}</span>
                  </button>

                  <span className="text-xs text-slate-500">
                    Format: PNG, JPG, WebP, SVG (Maks. 5MB, otomatis dikompresi)
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-0.5">Petunjuk Logo:</p>
                  <p>Gunakan gambar logo berlatar transparan (PNG) atau beresolusi jelas agar tampilan rapor peserta didik tampak formal dan tajam.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Profil Satuan Pendidikan */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              A. Identitas Satuan Pendidikan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  id="input-school-name"
                  type="text"
                  value={formData.namaSekolah}
                  onChange={(e) => handleChange('namaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
                <input
                  id="input-school-npsn"
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NSS</label>
                <input
                  id="input-school-nss"
                  type="text"
                  value={formData.nss}
                  onChange={(e) => handleChange('nss', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Alamat Sekolah</label>
                <input
                  id="input-school-address"
                  type="text"
                  value={formData.alamatSekolah}
                  onChange={(e) => handleChange('alamatSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
                <input
                  id="input-school-postal"
                  type="text"
                  value={formData.kodePos}
                  onChange={(e) => handleChange('kodePos', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan</label>
                <input
                  id="input-school-village"
                  type="text"
                  value={formData.desaKelurahan}
                  onChange={(e) => handleChange('desaKelurahan', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                <input
                  id="input-school-subdistrict"
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) => handleChange('kecamatan', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                <input
                  id="input-school-city"
                  type="text"
                  value={formData.kabupatenKota}
                  onChange={(e) => handleChange('kabupatenKota', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                <input
                  id="input-school-province"
                  type="text"
                  value={formData.provinsi}
                  onChange={(e) => handleChange('provinsi', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website Sekolah</label>
                <input
                  id="input-school-website"
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Sekolah</label>
                <input
                  id="input-school-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pimpinan & Wali Kelas Aktif */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              B. Kepala Sekolah & Wali Kelas Rapor
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input
                  id="input-principal-name"
                  type="text"
                  value={formData.namaKepalaSekolah}
                  onChange={(e) => handleChange('namaKepalaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  id="input-principal-nip"
                  type="text"
                  value={formData.nipKepalaSekolah}
                  onChange={(e) => handleChange('nipKepalaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nama Guru / Wali Kelas Utama</label>
                <input
                  id="input-teacher-name"
                  type="text"
                  value={formData.namaGuruKelas}
                  onChange={(e) => handleChange('namaGuruKelas', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">NIP Guru / Wali Kelas</label>
                <input
                  id="input-teacher-nip"
                  type="text"
                  value={formData.nipGuruKelas}
                  onChange={(e) => handleChange('nipGuruKelas', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pengaturan Rapor, Kelas & Titimangsa */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              C. Rombel, Kurikulum & Titimangsa Rapor
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rombongan Belajar (Kelas Default)</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const matchedClass = classes.find((c) => c.name === selName);
                    handleChange('kelas', selName);
                    if (matchedClass) {
                      handleChange('fase', matchedClass.fase || matchedClass.phase || 'D');
                      if (matchedClass.waliKelas && matchedClass.waliKelas !== '-') {
                        handleChange('namaGuruKelas', matchedClass.waliKelas);
                        handleChange('nipGuruKelas', matchedClass.nipWaliKelas || '-');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-bold bg-white"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      Kelas {cls.name} (Tingkat {cls.tingkat} - Fase {cls.fase})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fase Kurikulum</label>
                <select
                  id="input-fase"
                  value={formData.fase}
                  onChange={(e) => handleChange('fase', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 bg-white font-medium"
                >
                  <option value="D">Fase D (SMP / MTs)</option>
                  <option value="A">Fase A (SD Kelas 1-2)</option>
                  <option value="B">Fase B (SD Kelas 3-4)</option>
                  <option value="C">Fase C (SD Kelas 5-6)</option>
                  <option value="E">Fase E (SMA/SMK Kelas 10)</option>
                  <option value="F">Fase F (SMA/SMK Kelas 11-12)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester Aktif</label>
                <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('semester', '1 (Ganjil)');
                      handleChange('tanggalRapor', '22 Desember 2023');
                      handleChange('tempatTanggalRapor', `${formData.tempatRapor || 'Manado'}, 22 Desember 2023`);
                    }}
                    className={`py-1 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      formData.semester?.includes('1') || formData.semester?.toLowerCase().includes('ganjil')
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1 (Ganjil)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('semester', '2 (Genap)');
                      handleChange('tanggalRapor', '21 Juni 2024');
                      handleChange('tempatTanggalRapor', `${formData.tempatRapor || 'Manado'}, 21 Juni 2024`);
                    }}
                    className={`py-1 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      formData.semester?.includes('2') || formData.semester?.toLowerCase().includes('genap')
                        ? 'bg-amber-100 border-amber-600 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    2 (Genap)
                  </button>
                </div>
                <input
                  id="input-semester"
                  type="text"
                  value={formData.semester}
                  onChange={(e) => handleChange('semester', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  id="input-school-year"
                  type="text"
                  value={formData.tahunPelajaran}
                  onChange={(e) => handleChange('tahunPelajaran', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tempat Penerbitan Rapor</label>
                <input
                  id="input-rapor-place"
                  type="text"
                  value={formData.tempatRapor}
                  onChange={(e) => {
                    const place = e.target.value;
                    handleChange('tempatRapor', place);
                    handleChange('tempatTanggalRapor', `${place}, ${formData.tanggalRapor}`);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Titimangsa Rapor</label>
                <input
                  id="input-rapor-date"
                  type="text"
                  value={formData.tanggalRapor}
                  onChange={(e) => {
                    const date = e.target.value;
                    handleChange('tanggalRapor', date);
                    handleChange('tempatTanggalRapor', `${formData.tempatRapor}, ${date}`);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: MANAJEMEN KELAS & ROMBEL (ADMIN CRUD) ================= */}
      {activeSubTab === 'classes' && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                Manajemen Rombongan Belajar (Rombel / Kelas)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrator dapat <strong>menambah kelas baru</strong>, <strong>mengedit kelas</strong>, dan <strong>menghapus kelas</strong> serta menunjuk wali kelas.
              </p>
            </div>
            <button
              onClick={handleOpenAddClass}
              id="btn-tambah-kelas"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>

          {/* Quick Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const isCurrent = formData.kelas === cls.name;
              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-800 text-amber-100 font-black text-sm flex items-center justify-center">
                        {cls.tingkat || cls.name.split('-')[0] || 'VII'}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Kelas {cls.name}</h3>
                        <p className="text-[11px] text-slate-500">Fase {cls.fase} • {cls.ruangan || 'Ruang Kelas'}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p>
                      <span className="text-slate-400 font-medium">Wali Kelas:</span>{' '}
                      <strong className="text-slate-800">{cls.waliKelas || '-'}</strong>
                    </p>
                    {cls.nipWaliKelas && cls.nipWaliKelas !== '-' && (
                      <p className="text-[11px] text-slate-500">NIP: {cls.nipWaliKelas}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    {!isCurrent ? (
                      <button
                        onClick={() => handleSetActiveClass(cls)}
                        className="text-amber-800 hover:text-amber-900 font-bold hover:underline cursor-pointer"
                      >
                        Jadikan Rombel Aktif
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Rombel Aktif Rapor
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table View of Classes */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Nama Kelas / Rombel</th>
                  <th className="p-3">Jenjang & Fase</th>
                  <th className="p-3">Ruangan</th>
                  <th className="p-3">Wali Kelas</th>
                  <th className="p-3 text-center">Status Rapor</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      Kelas {cls.name}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        Tingkat {cls.tingkat} • Fase {cls.fase}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{cls.ruangan || '-'}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{cls.waliKelas || '-'}</div>
                      {cls.nipWaliKelas && cls.nipWaliKelas !== '-' && (
                        <div className="text-[10px] text-slate-400">NIP. {cls.nipWaliKelas}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {formData.kelas === cls.name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Rombel Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActiveClass(cls)}
                          className="text-[11px] text-slate-500 hover:text-amber-800 hover:underline cursor-pointer"
                        >
                          Pilih Rombel
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Edit Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DATABASE GURU & WALI KELAS ================= */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                Daftar Pendidik & Wali Kelas Terdaftar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hanya guru dan wali kelas yang terdaftar di database ini yang dapat login ke sistem.
              </p>
            </div>
            <button
              onClick={handleOpenAddTeacher}
              className="px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru / Wali Kelas</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Nama Lengkap & NIP</th>
                  <th className="p-3">Email (.belajar.id / Google)</th>
                  <th className="p-3">Peran Penilaian</th>
                  <th className="p-3">Kelas Binaan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">NIP: {t.nip || '-'}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {t.email}
                      </span>
                    </td>
                    <td className="p-3">
                      {t.isWaliKelas || t.role === 'wali_kelas' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Wali Kelas (Bisa Ubah Nilai)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Guru Mapel
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {t.assignedClass || 'Semua Kelas'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditTeacher(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Edit Guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: UBAH KATA SANDI ADMIN ================= */}
      {activeSubTab === 'security' && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Ubah Kata Sandi Administrator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin dapat memperbarui kata sandi untuk mengamankan hak akses konfigurasi sekolah dan rapor.
            </p>
          </div>

          <form onSubmit={handleChangeAdminPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showOldPwd ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi administrator saat ini"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPwd(!showOldPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi baru (minimal 6 karakter)"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi kata sandi baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Kata sandi baru akan langsung disimpan secara persisten di database. Pastikan Anda mengingat kata sandi baru tersebut.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isChangingPwd ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT KELAS (ADMIN) ================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                {editingClass ? 'Edit Rombongan Belajar (Kelas)' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel / Kelas</label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value.toUpperCase() })}
                  required
                  placeholder="Contoh: VII-A, VII-B, VIII-A, IX-B"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat / Jenjang</label>
                  <select
                    value={classForm.tingkat}
                    onChange={(e) => setClassForm({ ...classForm, tingkat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold"
                  >
                    <option value="VII">VII (Tujuh)</option>
                    <option value="VIII">VIII (Delapan)</option>
                    <option value="IX">IX (Sembilan)</option>
                    <option value="X">X (Sepuluh)</option>
                    <option value="XI">XI (Sebelas)</option>
                    <option value="XII">XII (Dua Belas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fase Kurikulum</label>
                  <select
                    value={classForm.fase}
                    onChange={(e) => setClassForm({ ...classForm, fase: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold"
                  >
                    <option value="D">Fase D (SMP)</option>
                    <option value="A">Fase A (SD 1-2)</option>
                    <option value="B">Fase B (SD 3-4)</option>
                    <option value="C">Fase C (SD 5-6)</option>
                    <option value="E">Fase E (SMA 10)</option>
                    <option value="F">Fase F (SMA 11-12)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wali Kelas yang Ditunjuk</label>
                <select
                  value={classForm.waliKelas}
                  onChange={(e) => {
                    const selTeacherName = e.target.value;
                    const matched = teachers.find((t) => t.name === selTeacherName);
                    setClassForm({
                      ...classForm,
                      waliKelas: selTeacherName,
                      nipWaliKelas: matched?.nip || '-',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                >
                  <option value="">-- Pilih Wali Kelas dari Database Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (NIP: {t.nip || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP Wali Kelas</label>
                <input
                  type="text"
                  value={classForm.nipWaliKelas || ''}
                  onChange={(e) => setClassForm({ ...classForm, nipWaliKelas: e.target.value })}
                  placeholder="NIP Wali Kelas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Ruangan / Gedung</label>
                <input
                  type="text"
                  value={classForm.ruangan || ''}
                  onChange={(e) => setClassForm({ ...classForm, ruangan: e.target.value })}
                  placeholder="Contoh: Ruang 01 / Gedung B"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT GURU ================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingTeacher ? 'Edit Data Pendidik' : 'Tambah Guru / Wali Kelas Baru'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  required
                  placeholder="Contoh: Imat Rohimat, S.Pd., M.Kom."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP Pendidik</label>
                <input
                  type="text"
                  value={teacherForm.nip}
                  onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
                  placeholder="Contoh: 198507202010011015"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (.belajar.id / Google)</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  required
                  placeholder="contoh: nama@guru.smp.belajar.id"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Email ini yang digunakan untuk login pendidik.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Penilaian</label>
                  <select
                    value={teacherForm.isWaliKelas ? 'wali_kelas' : 'guru_mapel'}
                    onChange={(e) => {
                      const isW = e.target.value === 'wali_kelas';
                      setTeacherForm({
                        ...teacherForm,
                        role: isW ? 'wali_kelas' : 'guru_mapel',
                        isWaliKelas: isW,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="wali_kelas">Wali Kelas (Bisa Ubah Nilai)</option>
                    <option value="guru_mapel">Guru Mapel (Hanya Lihat)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Binaan</label>
                  <select
                    value={teacherForm.assignedClass}
                    onChange={(e) => setTeacherForm({ ...teacherForm, assignedClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        Kelas {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  Filter,
  CheckCircle2,
  X,
  Printer,
  FileSpreadsheet,
  Download,
  School,
  Upload,
  Image as ImageIcon,
  Camera,
  UserCheck,
} from 'lucide-react';
import { Student, ClassRoom } from '../types/raport';
import { defaultClasses } from '../lib/initialData';
import { RaportService } from '../lib/raportDb';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { swalConfirm, swalSuccess, swalToast, swalError } from '../lib/sweetAlert';

interface StudentManagementViewProps {
  students: Student[];
  onAddStudent: (student: Student) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onBack: () => void;
  onOpenReportCard: (studentId: string) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBack,
  onOpenReportCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [religionFilter, setReligionFilter] = useState<string>('ALL');
  const [kelasFilter, setKelasFilter] = useState<string>('ALL');

  // Real-time Class Rooms from DB
  const [dbClasses, setDbClasses] = useState<ClassRoom[]>(defaultClasses);

  useEffect(() => {
    const unsub = RaportService.subscribeClasses((clsList) => {
      if (clsList && clsList.length > 0) setDbClasses(clsList);
    });
    return () => unsub();
  }, []);

  // Available classes combining DB classes and student references
  const availableClasses = useMemo(() => {
    const classList = dbClasses.map((c) => c.name);
    students.forEach((s) => {
      if (s.kelas && !classList.includes(s.kelas)) {
        classList.push(s.kelas);
      }
    });
    return Array.from(new Set(classList));
  }, [dbClasses, students]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    gender: 'L',
    religion: 'Kristen',
    kelas: availableClasses[0] || 'VII-A',
    photoUrl: '',
    attendanceSakit: 0,
    attendanceIzin: 0,
    attendanceAlpa: 0,
    decision: 'Naik Kelas',
    decisionTargetClass: 'VIII-A',
    ekskul1Name: 'Pramuka',
    ekskul1Grade: 'Berkembang',
    ekskul1Desc: 'Mampu menerapkan Dwi Darma maupun Dasa Darma, cakap memahami sejarah dan teknik kepramukaan.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter;
      const matchesReligion = religionFilter === 'ALL' || s.religion === religionFilter;
      const matchesKelas = kelasFilter === 'ALL' || (s.kelas || 'VII-A') === kelasFilter;

      return matchesSearch && matchesGender && matchesReligion && matchesKelas;
    });
  }, [students, searchQuery, genderFilter, religionFilter, kelasFilter]);

  const handleOpenAdd = () => {
    const nextNo = students.length > 0 ? Math.max(...students.map((s) => s.noUrut)) + 1 : 1;
    const nextNis = `232407${String(nextNo).padStart(3, '0')}`;
    const nextNisn = `010${Math.floor(1000000 + Math.random() * 9000000)}`;

    setFormData({
      noUrut: nextNo,
      nis: nextNis,
      nisn: nextNisn,
      name: '',
      gender: 'L',
      photoUrl: '',
      kelas: kelasFilter !== 'ALL' ? kelasFilter : (availableClasses[0] || 'VII-A'),
      birthPlace: 'Manado',
      birthDate: '2011-05-15',
      religion: 'Kristen',
      prevSchool: 'SD Negeri 01 Manado',
      studentAddress: 'Jl. Sam Ratulangi, Manado',
      parentFather: '',
      parentMother: '',
      jobFather: 'Wiraswasta',
      jobMother: 'Ibu Rumah Tangga',
      parentAddressRoad: 'Jl. Sam Ratulangi',
      parentAddressVillage: 'Wenang',
      parentAddressDistrict: 'Wenang',
      parentAddressCity: 'Manado',
      parentAddressProvince: 'Sulawesi Utara',
      phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      attendanceSakit: 0,
      attendanceIzin: 0,
      attendanceAlpa: 0,
      ekskul1Name: 'Pramuka',
      ekskul1Grade: 'Berkembang',
      ekskul1Desc: 'Mampu menerapkan Dwi Darma maupun Dasa Darma, cakap memahami sejarah dan teknik kepramukaan.',
      decision: 'Naik Kelas',
      decisionTargetClass: 'VIII-A',
      teacherNotes: 'Tunjukkan semangat belajar dan tingkatkan terus prestasimu!',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student, kelas: student.kelas || availableClasses[0] || 'VII-A' });
  };

  // Student Photo Upload Handler
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingPhoto(true);
    try {
      // Compress to 3x4 portrait aspect ratio (max width 300, max height 400)
      const dataUrl = await compressAndEncodeImage(file, {
        maxWidth: 300,
        maxHeight: 400,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });

      setFormData((prev) => ({
        ...prev,
        photoUrl: dataUrl,
      }));
      swalToast('Foto siswa berhasil dimuat.', 'success');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      swalError('Gagal Mengunggah Foto', err.message || 'Format gambar tidak didukung.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis || !formData.nisn) {
      await swalError('Data Belum Lengkap', 'Nama siswa, NIS, dan NISN wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await onUpdateStudent({
          ...(formData as Student),
          id: editingStudent.id,
          kelas: formData.kelas || 'VII-A',
        });
        setEditingStudent(null);
        await swalSuccess('Berhasil Diperbarui', `Data & foto peserta didik "${formData.name}" berhasil disimpan.`);
      } else {
        const newStudent: Student = {
          ...(formData as Student),
          id: `std-${Date.now()}`,
          noUrut: Number(formData.noUrut) || students.length + 1,
          kelas: formData.kelas || 'VII-A',
        };
        await onAddStudent(newStudent);
        setIsAddModalOpen(false);
        await swalSuccess('Berhasil Ditambahkan', `Peserta didik baru "${formData.name}" berhasil ditambahkan.`);
      }
    } catch (err) {
      console.error(err);
      await swalError('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (student: Student) => {
    const confirmed = await swalConfirm({
      title: 'Hapus Data Siswa?',
      text: `Apakah Anda yakin ingin menghapus data "${student.name}" (NISN: ${student.nisn})? Tindakan ini akan menghapus data siswa dan nilai terkait secara permanen.`,
      confirmButtonText: 'Ya, Hapus Sekarang',
      cancelButtonText: 'Batal',
      icon: 'warning',
      isDangerous: true,
    });

    if (confirmed) {
      try {
        await onDeleteStudent(student.id);
        swalToast(`Data siswa "${student.name}" berhasil dihapus`, 'success');
      } catch (err) {
        console.error(err);
        swalError('Gagal Menghapus', 'Tidak dapat menghapus data siswa.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
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
              <Users className="w-6 h-6 text-amber-700" />
              Manajemen Data Siswa & Foto Biodata
            </h1>
            <p className="text-xs text-slate-500">
              Kelola biodata siswa, upload pas foto 3x4 rapor, presensi, ekskul & penentuan kelas
            </p>
          </div>
        </div>

        <button
          id="btn-tambah-siswa"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-student"
            type="text"
            placeholder="Cari berdasarkan Nama Siswa, NIS, atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Class Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shrink-0">
            <School className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">Kelas:</span>
            <select
              id="filter-kelas"
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold">Gender:</span>
            <select
              id="filter-gender"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shrink-0">
            <span className="font-semibold">Agama:</span>
            <select
              id="filter-religion"
              value={religionFilter}
              onChange={(e) => setReligionFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Agama</option>
              <option value="Kristen">Kristen</option>
              <option value="Islam">Islam</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500 px-2 shrink-0">
            {filteredStudents.length} siswa {kelasFilter !== 'ALL' ? `(Kelas ${kelasFilter})` : ''}
          </span>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200 text-amber-950 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3 w-16 text-center">Foto</th>
                <th className="py-3.5 px-3 w-28">NIS / NISN</th>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Peserta Didik</th>
                <th className="py-3.5 px-2 text-center w-16">Kelas</th>
                <th className="py-3.5 px-2 text-center w-12">L/P</th>
                <th className="py-3.5 px-3">Agama</th>
                <th className="py-3.5 px-3 min-w-[140px]">Tempat, Tgl Lahir</th>
                <th className="py-3.5 px-3 text-center w-24">Kehadiran (S/I/A)</th>
                <th className="py-3.5 px-3">Ekstrakurikuler</th>
                <th className="py-3.5 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600">Tidak ada data siswa yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas/gender/agama</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-amber-50/40 transition-colors group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {student.noUrut || idx + 1}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="w-9 h-11 mx-auto rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-2xs">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-black text-white ${
                            student.gender === 'L' ? 'bg-blue-600' : 'bg-rose-500'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{student.nis}</p>
                      <p className="text-[11px] text-slate-500">{student.nisn}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{student.name}</span>
                        {student.photoUrl && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Foto Tersedia" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                        {student.kelas || 'VII-A'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-semibold">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                        student.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {student.religion}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <p className="truncate">{student.birthPlace}, {student.birthDate}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <span className="text-amber-600" title="Sakit">{student.attendanceSakit || 0}</span>/
                        <span className="text-blue-600" title="Izin">{student.attendanceIzin || 0}</span>/
                        <span className="text-rose-600 font-bold" title="Alpa">{student.attendanceAlpa || 0}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <p className="font-semibold text-slate-800 text-[11px] truncate max-w-[130px]">
                        {student.ekskul1Name || 'Pramuka'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        {student.ekskul1Grade || 'Berkembang'}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-view-${student.id}`}
                          onClick={() => setViewingStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Lihat Detail Biodata & Pas Foto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-edit-${student.id}`}
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                          title="Ubah Data & Upload Foto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-rapor-${student.id}`}
                          onClick={() => onOpenReportCard(student.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Buka Lembar Rapor Siswa"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-del-${student.id}`}
                          onClick={() => handleDeleteClick(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: TAMBAH / UBAH SISWA (WITH PHOTO UPLOAD) ================= */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 to-orange-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">
                  {editingStudent ? 'Ubah Data & Pas Foto Siswa' : 'Tambah Siswa & Pas Foto Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* PHOTO UPLOAD & PREVIEW SECTION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* 3x4 Portrait Photo Box */}
                  <div className="relative group shrink-0">
                    <div className="w-28 h-36 rounded-xl border-2 border-dashed border-amber-600/40 bg-white overflow-hidden flex flex-col items-center justify-center shadow-xs">
                      {formData.photoUrl ? (
                        <img
                          src={formData.photoUrl}
                          alt="Pas Foto Siswa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 space-y-1">
                          <Camera className="w-8 h-8 mx-auto text-amber-800/40" />
                          <span className="text-[10px] font-bold block text-slate-500">Pas Foto 3x4</span>
                          <span className="text-[9px] text-slate-400 block">Belum ada foto</span>
                        </div>
                      )}

                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center text-[10px] font-bold">
                          Memproses...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Actions & Instructions */}
                  <div className="space-y-2 text-left flex-1">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                      id="student-photo-input"
                    />

                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-700" />
                      Upload Pas Foto Peserta Didik (3x4 cm)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Foto ini akan dicetak pada lembar <strong>Biodata Rapor (Cover 3)</strong> dan <strong>Buku Induk Siswa</strong>.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{formData.photoUrl ? 'Ganti Foto' : 'Pilih / Unggah Foto Siswa'}</span>
                      </button>

                      {formData.photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 1: Identitas Pribadi Siswa */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-1">
                  1. Identitas Pribadi Siswa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Urut</label>
                    <input
                      type="number"
                      value={formData.noUrut || ''}
                      onChange={(e) => setFormData({ ...formData, noUrut: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rombel / Kelas</label>
                    <select
                      value={formData.kelas || 'VII-A'}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-amber-900"
                    >
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          Kelas {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
                    <input
                      type="text"
                      value={formData.nis || ''}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit)</label>
                    <input
                      type="text"
                      value={formData.nisn || ''}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender || 'L'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Agama</label>
                    <select
                      value={formData.religion || 'Kristen'}
                      onChange={(e) => setFormData({ ...formData, religion: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                    >
                      <option value="Kristen">Kristen</option>
                      <option value="Islam">Islam</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.birthPlace || ''}
                      onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status dalam Keluarga</label>
                    <input
                      type="text"
                      placeholder="Contoh: Anak Kandung"
                      value={formData.familyStatus || formData.statusKeluarga || 'Anak Kandung'}
                      onChange={(e) => setFormData({ ...formData, familyStatus: e.target.value, statusKeluarga: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Anak Ke-</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1"
                      value={formData.childOrder || formData.anakKe || '1'}
                      onChange={(e) => setFormData({ ...formData, childOrder: e.target.value, anakKe: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-center"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Sekolah Asal (SD/MI)</label>
                    <input
                      type="text"
                      value={formData.prevSchool || ''}
                      onChange={(e) => setFormData({ ...formData, prevSchool: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diterima di Kelas</label>
                    <input
                      type="text"
                      placeholder="Contoh: VII (Tujuh)"
                      value={formData.acceptedClass || formData.diterimaDiKelas || ''}
                      onChange={(e) => setFormData({ ...formData, acceptedClass: e.target.value, diterimaDiKelas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diterima pada Tanggal</label>
                    <input
                      type="text"
                      placeholder="Contoh: 15 Juli 2023"
                      value={formData.acceptedDate || formData.diterimaTanggal || ''}
                      onChange={(e) => setFormData({ ...formData, acceptedDate: e.target.value, diterimaTanggal: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan Peserta Didik</label>
                    <input
                      type="text"
                      value={formData.studentAddress || ''}
                      onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan Siswa</label>
                    <input
                      type="text"
                      value={formData.studentVillage || formData.desaKelurahan || ''}
                      onChange={(e) => setFormData({ ...formData, studentVillage: e.target.value, desaKelurahan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kecamatan Siswa</label>
                    <input
                      type="text"
                      value={formData.studentDistrict || formData.kecamatan || ''}
                      onChange={(e) => setFormData({ ...formData, studentDistrict: e.target.value, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">No. Telepon / HP Siswa / Ortu</label>
                    <input
                      type="text"
                      value={formData.phone || formData.studentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value, studentPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Data Orang Tua & Wali */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-1">
                  2. Data Orang Tua & Wali Siswa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Ayah</label>
                    <input
                      type="text"
                      value={formData.parentFather || ''}
                      onChange={(e) => setFormData({ ...formData, parentFather: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                    <input
                      type="text"
                      value={formData.jobFather || ''}
                      onChange={(e) => setFormData({ ...formData, jobFather: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Ibu</label>
                    <input
                      type="text"
                      value={formData.parentMother || ''}
                      onChange={(e) => setFormData({ ...formData, parentMother: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                    <input
                      type="text"
                      value={formData.jobMother || ''}
                      onChange={(e) => setFormData({ ...formData, jobMother: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Orang Tua (Jalan/No)</label>
                    <input
                      type="text"
                      value={formData.parentAddress || formData.parentAddressRoad || ''}
                      onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value, parentAddressRoad: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Desa/Kecamatan Ortu</label>
                    <input
                      type="text"
                      placeholder="Desa / Kecamatan"
                      value={formData.parentVillage ? `${formData.parentVillage} / ${formData.parentDistrict || ''}` : ''}
                      onChange={(e) => {
                        const parts = e.target.value.split('/');
                        setFormData({
                          ...formData,
                          parentVillage: parts[0]?.trim() || '',
                          parentDistrict: parts[1]?.trim() || '',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telepon / HP Orang Tua</label>
                    <input
                      type="text"
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Wali (Jika ada)</label>
                    <input
                      type="text"
                      value={formData.guardianName || ''}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pekerjaan Wali</label>
                    <input
                      type="text"
                      value={formData.guardianJob || ''}
                      onChange={(e) => setFormData({ ...formData, guardianJob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Wali</label>
                    <input
                      type="text"
                      value={formData.guardianAddress || ''}
                      onChange={(e) => setFormData({ ...formData, guardianAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telepon / HP Wali</label>
                    <input
                      type="text"
                      value={formData.guardianPhone || ''}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Kehadiran, Ekskul & Kenaikan Kelas */}
              <div className="space-y-3">
                <h4 className="font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-1">
                  3. Kehadiran, Ekstrakurikuler & Catatan Rapor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800 mb-2">Rekap Kehadiran (Hari)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600">Sakit</label>
                        <input
                          type="number"
                          value={formData.attendanceSakit ?? 0}
                          onChange={(e) => setFormData({ ...formData, attendanceSakit: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Izin</label>
                        <input
                          type="number"
                          value={formData.attendanceIzin ?? 0}
                          onChange={(e) => setFormData({ ...formData, attendanceIzin: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Alpa</label>
                        <input
                          type="number"
                          value={formData.attendanceAlpa ?? 0}
                          onChange={(e) => setFormData({ ...formData, attendanceAlpa: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center text-rose-600 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800 mb-2">Ekstrakurikuler Wajib / Pilihan</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600">Nama Ekskul</label>
                        <input
                          type="text"
                          value={formData.ekskul1Name || 'Pramuka'}
                          onChange={(e) => setFormData({ ...formData, ekskul1Name: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600">Predikat</label>
                        <select
                          value={formData.ekskul1Grade || 'Berkembang'}
                          onChange={(e) => setFormData({ ...formData, ekskul1Grade: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Sangat Berkembang">Sangat Berkembang</option>
                          <option value="Berkembang">Berkembang</option>
                          <option value="Mulai Berkembang">Mulai Berkembang</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-600">Keterangan Ekskul</label>
                        <input
                          type="text"
                          value={formData.ekskul1Desc || ''}
                          onChange={(e) => setFormData({ ...formData, ekskul1Desc: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-700 mb-1">Catatan Guru / Wali Kelas</label>
                    <textarea
                      rows={2}
                      value={formData.teacherNotes || ''}
                      onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Keputusan Kenaikan</label>
                    <select
                      value={formData.decision || 'Naik Kelas'}
                      onChange={(e) => setFormData({ ...formData, decision: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-slate-800"
                    >
                      <option value="Naik Kelas">Naik Kelas</option>
                      <option value="Tinggal di Kelas">Tinggal di Kelas</option>
                      <option value="Lulus">Lulus</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Target Kelas Kenaikan</label>
                    <input
                      type="text"
                      value={formData.decisionTargetClass || 'VIII-A'}
                      onChange={(e) => setFormData({ ...formData, decisionTargetClass: e.target.value })}
                      placeholder="Contoh: VIII-A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-student"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW DETAILS (WITH PHOTO) ================= */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-12 rounded-lg overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center shrink-0">
                  {viewingStudent.photoUrl ? (
                    <img
                      src={viewingStudent.photoUrl}
                      alt={viewingStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-amber-400 text-sm">
                      {viewingStudent.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base">{viewingStudent.name}</h3>
                  <p className="text-xs text-slate-400">
                    Kelas: {viewingStudent.kelas || 'VII-A'} • NIS: {viewingStudent.nis} • NISN: {viewingStudent.nisn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400">Rombongan Belajar (Kelas)</p>
                  <p className="font-bold text-amber-800">Kelas {viewingStudent.kelas || 'VII-A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Tempat, Tanggal Lahir</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.birthPlace}, {viewingStudent.birthDate}</p>
                </div>
                <div>
                  <p className="text-slate-400">Agama & Jenis Kelamin</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.religion} ({viewingStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</p>
                </div>
                <div>
                  <p className="text-slate-400">Sekolah Asal</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.prevSchool || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">Alamat Tempat Tinggal</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.studentAddress}</p>
                </div>
                <div>
                  <p className="text-slate-400">Nama Ayah / Ibu</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.parentFather || '-'} / {viewingStudent.parentMother || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400">No. Telepon / HP</p>
                  <p className="font-semibold text-slate-900">{viewingStudent.phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div>
                  <p className="font-bold text-amber-900">Keputusan Kenaikan Kelas</p>
                  <p className="text-amber-800 font-medium">
                    Siswa Ditetapkan: <span className="font-bold">{viewingStudent.decision} ke {viewingStudent.decisionTargetClass}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingStudent(null);
                    onOpenReportCard(viewingStudent.id);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Rapor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Download,
  Loader2,
  School,
  Edit3,
  Calendar,
  Layers,
} from 'lucide-react';
import { Student, SchoolConfig } from '../types/raport';
import { defaultSchoolConfig } from '../lib/initialData';
import { downloadElementAsPdf, triggerPrint } from '../lib/printUtils';

interface MutasiViewProps {
  students: Student[];
  schoolConfig: SchoolConfig;
  selectedStudentId?: string;
  onBack: () => void;
}

export const MutasiView: React.FC<MutasiViewProps> = ({
  students,
  schoolConfig = defaultSchoolConfig,
  selectedStudentId,
  onBack,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    if (selectedStudentId) {
      const found = students.findIndex((s) => s.id === selectedStudentId);
      return found >= 0 ? found : 0;
    }
    return 0;
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'surat' | 'buku'>('surat');

  // Interactive Form State for Surat Keterangan Pindah/Keluar
  const [nomorSurat, setNomorSurat] = useState<string>('421.3 / 024 / SMP-MF / 2026');
  const [tanggalSurat, setTanggalSurat] = useState<string>('18-08-2026');
  const [tanggalPindah, setTanggalPindah] = useState<string>('2025-11-08');
  const [alasanPindah, setAlasanPindah] = useState<string>('Permintaan Orang Tua');
  const [nomorIjazah, setNomorIjazah] = useState<string>('');
  const [catatanSurat, setCatatanSurat] = useState<string>('');

  const student = students[currentIdx] || students[0];

  const handlePrev = () => setCurrentIdx((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIdx((prev) => Math.min(students.length - 1, prev + 1));
  
  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const safeName = (student?.name || 'Siswa').replace(/\s+/g, '_');
      await downloadElementAsPdf('mutasi-sheet', `Surat_Pindah_${safeName}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const safeName = (student?.name || 'Siswa').replace(/\s+/g, '_');
    triggerPrint('mutasi-sheet', `Surat_Pindah_${safeName}`);
  };

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">Belum ada data siswa.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
          Kembali
        </button>
      </div>
    );
  }

  // Resolving school profile & student metadata
  const resolvedSchoolName = schoolConfig.namaSekolah || schoolConfig.schoolName || 'SMP MEFENG';
  const resolvedNpsn = schoolConfig.npsn || '60203264';
  const resolvedAlamat = schoolConfig.alamatSekolah || schoolConfig.schoolAddress || 'Jl.Poros no.1 Trans Lalubi';
  const resolvedKecamatan = schoolConfig.kecamatan || schoolConfig.schoolSubdistrict || 'Kec. Gane Timur';
  const resolvedKabupaten = schoolConfig.kabupatenKota || schoolConfig.schoolCity || 'Kab. Halmahera Selatan';
  const resolvedProvinsi = schoolConfig.provinsi || schoolConfig.schoolProvince || 'Maluku Utara';
  const resolvedTelp = schoolConfig.schoolPhone || '(0431) 852134';
  const resolvedEmail = schoolConfig.email || schoolConfig.schoolEmail || 'smpmefeng@gmail.com';
  const resolvedHeadmasterName = schoolConfig.namaKepalaSekolah || schoolConfig.headmasterName || schoolConfig.principalName || 'Rusdi Ishak';
  const resolvedHeadmasterNip = schoolConfig.nipKepalaSekolah || schoolConfig.headmasterNip || schoolConfig.principalNip || '-';
  const resolvedAcademicYear = schoolConfig.tahunPelajaran || schoolConfig.academicYear || '2026/2027';
  const resolvedLogo = schoolConfig.logoUrl || schoolConfig.schoolLogo;

  // Student Address formatting
  const studentFullAddress = student.studentAddress || student.address || 'SUMBER MAKMUR RT/RW 1/1';
  const studentVillage = student.studentVillage || student.desaKelurahan || 'Sumber Makmur';
  const studentDistrict = student.studentDistrict || student.kecamatan || resolvedKecamatan;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-700" />
              Surat Keterangan Pindah / Mutasi Siswa
            </h1>
            <p className="text-xs text-slate-500">
              Format Resmi Surat Pindah / Keluar & Buku Catatan Mutasi Siswa
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('surat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'surat'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Surat Keterangan
            </button>
            <button
              onClick={() => setViewMode('buku')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'buku'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buku Mutasi
            </button>
          </div>

          <select
            value={currentIdx}
            onChange={(e) => setCurrentIdx(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {students.map((st, i) => (
              <option key={st.id} value={i}>
                {st.noUrut || i + 1}. {st.name} ({st.nisn || st.nis})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-700">
              {currentIdx + 1} / {students.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIdx === students.length - 1}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30"
              title="Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            title="Ubah nomor surat & data kepindahan"
          >
            <Edit3 className="w-4 h-4 text-amber-700" />
            <span>Pengaturan Surat</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            id="btn-cetak-mutasi-pdf"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 disabled:opacity-75 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            title="Unduh Surat Keterangan Pindah Format PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-mutasi"
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            title="Cetak via dialog peramban"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Optional Surat Configuration Form */}
      {showOptions && viewMode === 'surat' && (
        <div className="bg-amber-50/70 border border-amber-200 p-4 sm:p-5 rounded-2xl print:hidden space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-700" />
              Kelola Isian Surat Keterangan Pindah / Keluar
            </h3>
            <button
              onClick={() => setShowOptions(false)}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Tutup Panel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Surat</label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                placeholder="421.3 / ... / ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat Terbit</label>
              <input
                type="text"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                placeholder="18-08-2026 atau 18 Agustus 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Pindah / Keluar</label>
              <input
                type="text"
                value={tanggalPindah}
                onChange={(e) => setTanggalPindah(e.target.value)}
                placeholder="2025-11-08"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alasan Pindah</label>
              <input
                type="text"
                value={alasanPindah}
                onChange={(e) => setAlasanPindah(e.target.value)}
                placeholder="Permintaan Orang Tua"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Ijazah / STTB (Jika ada)</label>
              <input
                type="text"
                value={nomorIjazah}
                onChange={(e) => setNomorIjazah(e.target.value)}
                placeholder="-"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
              <input
                type="text"
                value={catatanSurat}
                onChange={(e) => setCatatanSurat(e.target.value)}
                placeholder="-"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet */}
      <div 
        id="mutasi-sheet"
        className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-md rounded-2xl p-8 sm:p-12 print:p-0 print:border-none print:shadow-none min-h-[900px] text-slate-900 font-sans"
      >
        {viewMode === 'surat' ? (
          /* ================= MODE 1: SURAT KETERANGAN PINDAH/KELUAR (PERSIS CONTOH USER) ================= */
          <div className="flex flex-col justify-between min-h-[850px] text-xs leading-relaxed">
            <div>
              {/* Kop Surat Resmi */}
              <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-3 mb-3">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  {resolvedLogo ? (
                    <img
                      src={resolvedLogo}
                      alt="Logo Dinas/Sekolah"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    /* Default Tut Wuri Handayani Emblems */
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-slate-800 fill-current">
                      <polygon points="50,5 92,28 92,72 50,95 8,72 8,28" fill="none" stroke="currentColor" strokeWidth="4" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M 30,65 L 50,30 L 70,65 L 50,55 Z" fill="currentColor" />
                      <circle cx="50" cy="25" r="5" fill="currentColor" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 text-center pr-10">
                  <p className="font-bold text-xs uppercase tracking-wide">
                    PEMERINTAH {resolvedKabupaten.toUpperCase().startsWith('KAB') || resolvedKabupaten.toUpperCase().startsWith('KOTA') ? resolvedKabupaten.toUpperCase() : `KABUPATEN ${resolvedKabupaten.toUpperCase()}`}
                  </p>
                  <p className="font-bold text-xs uppercase tracking-wide">
                    DINAS PENDIDIKAN
                  </p>
                  <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900 mt-0.5">
                    {resolvedSchoolName}
                  </h2>
                  <p className="text-[10px] text-slate-700 leading-tight mt-0.5">
                    NPSN {resolvedNpsn}, {resolvedAlamat}, Kecamatan {resolvedKecamatan}
                  </p>
                  <p className="text-[10px] text-slate-700 leading-tight">
                    {resolvedKabupaten} - Prov. {resolvedProvinsi}. Telp {resolvedTelp}, Fax -, Email {resolvedEmail}
                  </p>
                </div>
              </div>

              {/* Kotak Judul Dokumen */}
              <div className="border border-slate-900 px-4 py-1.5 my-4">
                <h3 className="text-center font-bold text-xs sm:text-sm uppercase tracking-wide">
                  SURAT KETERANGAN PINDAH/KELUAR
                </h3>
                <p className="text-center text-[11px]">
                  Nomor : {nomorSurat || ''}
                </p>
              </div>

              {/* Kalimat Pembuka */}
              <p className="text-xs mb-3 text-justify">
                Yang bertanda tangan di bawah ini kepala sekolah {resolvedSchoolName} menerangkan bahwa :
              </p>

              {/* Baris Rincian Data Peserta Didik */}
              <div className="space-y-1.5 text-xs pl-4 sm:pl-8">
                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Nama</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8 font-bold uppercase">{student.name}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Tempat/Tanggal Lahir</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{student.birthPlace ? student.birthPlace.toUpperCase() : '-'} / {student.birthDate || '-'}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">NISN</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8 font-mono">{student.nisn || student.nis || '-'}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Tahun Akademik</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{resolvedAcademicYear}</span>
                </div>

                {/* Nama Orang Tua */}
                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Nama Orang Tua</span>
                  <span className="col-span-1 text-center font-bold"></span>
                  <span className="col-span-7 sm:col-span-8">
                    <span className="inline-block w-16">Ayah</span>: {student.parentFather || student.fatherName || '-'}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium"></span>
                  <span className="col-span-1 text-center font-bold"></span>
                  <span className="col-span-7 sm:col-span-8">
                    <span className="inline-block w-16">Ibu</span>: {student.parentMother || student.motherName || '-'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Pekerjaan Orang Tua</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{student.jobFather || student.fatherJob || 'Petani'}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2 items-start">
                  <span className="col-span-4 sm:col-span-3 font-medium">Alamat</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8 uppercase leading-snug">
                    {studentFullAddress}
                    <br />
                    {studentVillage} - {studentDistrict} - {resolvedKabupaten} - Prov. {resolvedProvinsi}, Kode Pos {schoolConfig.kodePos || '97783'}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Nomor Ijazah/STTB</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{nomorIjazah || ''}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Tanggal Pindah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8 font-mono">{tanggalPindah}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Alasan Pindah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{alasanPindah || 'Permintaan Orang Tua'}</span>
                </div>

                <div className="grid grid-cols-12 gap-x-2">
                  <span className="col-span-4 sm:col-span-3 font-medium">Catatan</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 sm:col-span-8">{catatanSurat || ''}</span>
                </div>
              </div>

              {/* Kalimat Penutup */}
              <p className="text-xs mt-6 text-justify">
                Demikian surat keterangan ini dibuat, untuk diketahui dan dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* Pengesahan Tanda Tangan */}
            <div className="pt-8">
              <div className="flex justify-end">
                <div className="w-64 text-center text-xs space-y-1">
                  <p>{resolvedKabupaten}, {tanggalSurat}</p>
                  <p className="font-medium">Mengetahui</p>
                  <p className="font-medium">Kepala Sekolah {resolvedSchoolName}</p>
                  <div className="h-20" />
                  <p className="font-bold text-slate-900">( {resolvedHeadmasterName} )</p>
                  <p className="text-[11px] text-slate-700">NIP : {resolvedHeadmasterNip || '-'}</p>
                </div>
              </div>

              {/* Catatan Kaki */}
              <div className="mt-8 pt-4 text-[10px] text-slate-700 italic border-t border-slate-200">
                <p className="font-bold not-italic">Catatan :</p>
                <p>
                  Dengan mencetak surat keterangan pindah/keluar ini maka peserta didik dinyatakan telah pindah/keluar dari {resolvedSchoolName}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE 2: BUKU CATATAN MUTASI (FORMAT INDUK KELUAR & MASUK) ================= */
          <div className="space-y-8 text-xs">
            <div className="text-center pb-3 border-b-2 border-slate-900">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
                BUKU CATATAN MUTASI PESERTA DIDIK
              </h2>
              <p className="text-xs font-bold text-slate-600 uppercase">
                {resolvedSchoolName} &bull; SISWA: {student.name} ({student.nisn || student.nis})
              </p>
            </div>

            {/* Bagian I: KELUAR */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3">
                I. KELUAR
              </h3>
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="py-2 px-2 border border-slate-400 w-24">Tanggal</th>
                    <th className="py-2 px-2 border border-slate-400 w-24">Kelas Ditinggalkan</th>
                    <th className="py-2 px-3 border border-slate-400 text-left">Sebab-sebab Keluar dan Sekolah yang Dituju</th>
                    <th className="py-2 px-3 border border-slate-400 w-44">Tanda Tangan Kepala Sekolah & Orang Tua</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-28">
                    <td className="py-2 px-2 border border-slate-400 text-center align-top font-mono text-[11px]">
                      {tanggalPindah}
                    </td>
                    <td className="py-2 px-2 border border-slate-400 text-center align-top font-semibold">
                      Kelas {student.kelas || schoolConfig.kelas || 'VII'}
                    </td>
                    <td className="py-2 px-3 border border-slate-400 align-top text-[11px] space-y-1">
                      <p><span className="font-semibold">Sebab:</span> {alasanPindah}</p>
                      <p><span className="font-semibold">Sekolah Tujuan:</span> ................................................</p>
                    </td>
                    <td className="py-2 px-3 border border-slate-400 text-center align-bottom text-[10px] pb-2">
                      Kepala Sekolah,<br />
                      <div className="h-10" />
                      <p className="font-bold underline">({resolvedHeadmasterName})</p>
                      <p>NIP. {resolvedHeadmasterNip}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bagian II: MASUK */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-2 rounded-lg border border-slate-300 mb-3">
                II. MASUK
              </h3>
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="py-2 px-2 border border-slate-400 w-10">No</th>
                    <th className="py-2 px-3 border border-slate-400 text-left min-w-[200px]">Keterangan Penerimaan Peserta Didik</th>
                    <th className="py-2 px-3 border border-slate-400 w-48">Tanda Tangan Kepala Sekolah & Stempel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-28">
                    <td className="py-2 px-2 border border-slate-400 text-center align-top">1</td>
                    <td className="py-2 px-3 border border-slate-400 align-top text-[11px] space-y-1">
                      <p>1. Nama Siswa : <span className="font-semibold">{student.name}</span></p>
                      <p>2. Masuk di Sekolah ini tanggal : {student.acceptedDate || '15 Juli 2023'}</p>
                      <p>3. Di Kelas : {student.acceptedClass || 'VII (Tujuh)'}</p>
                      <p>4. Dari Sekolah : {student.prevSchool || 'SD Negeri'}</p>
                    </td>
                    <td className="py-2 px-3 border border-slate-400 text-center align-bottom text-[10px] pb-2">
                      Kepala Sekolah,<br />
                      <div className="h-10" />
                      <p className="font-bold underline">({resolvedHeadmasterName})</p>
                      <p>NIP. {resolvedHeadmasterNip}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

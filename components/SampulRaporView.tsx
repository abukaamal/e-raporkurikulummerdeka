'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  School,
  Download,
  Loader2,
  Camera,
} from 'lucide-react';
import { Student, SchoolConfig } from '../types/raport';
import { defaultSchoolConfig } from '../lib/initialData';
import { downloadElementAsPdf, triggerPrint } from '../lib/printUtils';

interface SampulRaporViewProps {
  students: Student[];
  schoolConfig?: SchoolConfig;
  selectedStudentId?: string;
  onBack: () => void;
}

export const SampulRaporView: React.FC<SampulRaporViewProps> = ({
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
  const [coverType, setCoverType] = useState<'cover1' | 'cover2' | 'cover3'>('cover1');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const student = students[currentIdx] || students[0];

  // Resolved school profile fallbacks
  const resolvedSchoolName = schoolConfig.namaSekolah || schoolConfig.schoolName || defaultSchoolConfig.namaSekolah;
  const resolvedSchoolAddress = schoolConfig.alamatSekolah || schoolConfig.schoolAddress || defaultSchoolConfig.alamatSekolah;
  const resolvedNpsn = schoolConfig.npsn || defaultSchoolConfig.npsn;
  const resolvedNss = schoolConfig.nss || defaultSchoolConfig.nss;
  const resolvedVillage = schoolConfig.desaKelurahan || schoolConfig.schoolVillage || defaultSchoolConfig.desaKelurahan;
  const resolvedSubdistrict = schoolConfig.kecamatan || schoolConfig.schoolSubdistrict || defaultSchoolConfig.kecamatan;
  const resolvedCity = schoolConfig.kabupatenKota || schoolConfig.schoolCity || schoolConfig.tempatRapor || defaultSchoolConfig.kabupatenKota;
  const resolvedProvince = schoolConfig.provinsi || schoolConfig.schoolProvince || defaultSchoolConfig.provinsi;
  const resolvedPostalCode = schoolConfig.kodePos || schoolConfig.schoolPostalCode || defaultSchoolConfig.kodePos;
  const resolvedPhone = schoolConfig.schoolPhone || defaultSchoolConfig.schoolPhone || '-';
  const resolvedWebsite = schoolConfig.website || schoolConfig.schoolWebsite || defaultSchoolConfig.website;
  const resolvedEmail = schoolConfig.email || schoolConfig.schoolEmail || defaultSchoolConfig.email;
  const resolvedHeadmasterName = schoolConfig.namaKepalaSekolah || schoolConfig.headmasterName || schoolConfig.principalName || defaultSchoolConfig.namaKepalaSekolah;
  const resolvedHeadmasterNip = schoolConfig.nipKepalaSekolah || schoolConfig.headmasterNip || schoolConfig.principalNip || defaultSchoolConfig.nipKepalaSekolah;
  const resolvedReportDate = schoolConfig.tanggalRapor || schoolConfig.reportDate || defaultSchoolConfig.tanggalRapor;
  const resolvedLogo = schoolConfig.logoUrl;

  const handlePrev = () => setCurrentIdx((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIdx((prev) => Math.min(students.length - 1, prev + 1));
  
  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const safeName = (student?.name || 'Siswa').replace(/\s+/g, '_');
      const title = coverType === 'cover1' 
        ? `Sampul_Cover1_${safeName}`
        : coverType === 'cover2'
        ? `Sampul_Identitas_Sekolah`
        : `Sampul_Biodata_${safeName}`;
      await downloadElementAsPdf('cover-sheet', title);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const title = coverType === 'cover1' 
      ? `Sampul_Cover1_${student?.name || 'Siswa'}`
      : coverType === 'cover2'
      ? `Sampul_Identitas_Sekolah`
      : `Sampul_Biodata_${student?.name || 'Siswa'}`;
    triggerPrint('cover-sheet', title);
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

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
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
              <FileText className="w-6 h-6 text-amber-700" />
              Sampul & Identitas Rapor Siswa
            </h1>
            <p className="text-xs text-slate-500">
              Cetak Cover Luar Rapor & Lembar Identitas Resmi Kurikulum Merdeka
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCoverType('cover1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverType === 'cover1' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cover Depan (1)
            </button>
            <button
              onClick={() => setCoverType('cover2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverType === 'cover2' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Identitas Satuan Pendidikan (2)
            </button>
            <button
              onClick={() => setCoverType('cover3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                coverType === 'cover3' ? 'bg-amber-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Identitas Siswa (3)
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
              title="Siswa Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800">
              {currentIdx + 1} / {students.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIdx === students.length - 1}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
              title="Siswa Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            id="btn-cetak-sampul-pdf"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 disabled:opacity-75 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            title="Unduh Sampul Format PDF Menggunakan jsPDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PDF Sampul</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-sampul"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            title="Cetak via dialog peramban"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div 
        id="cover-sheet"
        className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-md rounded-2xl p-8 sm:p-12 print:p-0 print:border-none print:shadow-none min-h-[900px] flex flex-col justify-between"
      >
        
        {/* ================= COVER 1: COVER DEPAN UTAMA ================= */}
        {coverType === 'cover1' && (
          <div className="flex-1 flex flex-col justify-between items-center text-center py-6">
            <div className="space-y-4">
              <div className="w-28 h-28 mx-auto flex items-center justify-center bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                {resolvedLogo ? (
                  <img
                    src={resolvedLogo}
                    alt="Logo Sekolah"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-xl">
                    <School className="w-14 h-14 text-amber-800" />
                  </div>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 leading-snug">
                RAPOR PESERTA DIDIK
                <br />
                SEKOLAH MENENGAH PERTAMA
              </h2>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-600 uppercase">
                KURIKULUM MERDEKA
              </p>
            </div>

            {/* Middle Student Card Box */}
            <div className="my-10 w-full max-w-md bg-slate-50 border-2 border-dashed border-amber-700/30 p-6 rounded-2xl text-center space-y-3">
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nama Peserta Didik:</p>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase underline decoration-amber-600 underline-offset-4">
                {student.name}
              </h3>
              <div className="pt-2 text-xs font-mono text-slate-700">
                <p>NISN: <span className="font-bold">{student.nisn}</span></p>
                <p>NIS: <span className="font-bold">{student.nis}</span></p>
              </div>
            </div>

            {/* Bottom School Info */}
            <div className="space-y-2 uppercase font-bold text-slate-800 text-sm tracking-wide">
              <p className="text-base text-amber-900 font-black">{resolvedSchoolName}</p>
              <p className="text-xs font-semibold text-slate-600">NPSN: {resolvedNpsn}</p>
              <p className="text-xs font-semibold text-slate-600">{resolvedSchoolAddress}</p>
              <p className="text-xs font-semibold text-slate-600">
                {resolvedSubdistrict}, {resolvedCity}, {resolvedProvince}
              </p>
              <p className="text-xs font-bold text-slate-900 pt-3">
                KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                <br />
                REPUBLIK INDONESIA
              </p>
            </div>
          </div>
        )}

        {/* ================= COVER 2: IDENTITAS SEKOLAH ================= */}
        {coverType === 'cover2' && (
          <div className="flex-1 flex flex-col justify-between py-4 text-xs text-slate-900">
            <div className="text-center space-y-2 border-b pb-4 mb-6">
              {resolvedLogo && (
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <img src={resolvedLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                RAPOR PESERTA DIDIK
                <br />
                SEKOLAH MENENGAH PERTAMA
              </h2>
              <p className="text-xs text-slate-600 font-semibold">( Kurikulum Merdeka )</p>
            </div>

            <div className="space-y-4 max-w-xl mx-auto w-full flex-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-950 bg-amber-50 p-2 rounded-lg border border-amber-200">
                IDENTITAS SATUAN PENDIDIKAN
              </h3>

              <div className="grid grid-cols-12 gap-y-3 gap-x-2 text-xs">
                <span className="col-span-4 font-semibold text-slate-600">Nama Sekolah</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-bold uppercase">{resolvedSchoolName}</span>

                <span className="col-span-4 font-semibold text-slate-600">NPSN</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-mono font-bold">{resolvedNpsn}</span>

                <span className="col-span-4 font-semibold text-slate-600">NSS / NDS</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-mono font-bold">{resolvedNss || '-'}</span>

                <span className="col-span-4 font-semibold text-slate-600">Alamat Sekolah</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7">{resolvedSchoolAddress}</span>

                <span className="col-span-4 font-semibold text-slate-600">Kode Pos</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7">{resolvedPostalCode}</span>

                <span className="col-span-4 font-semibold text-slate-600">Telepon</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7">{resolvedPhone}</span>

                <span className="col-span-4 font-semibold text-slate-600">Kelurahan / Desa</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 uppercase">{resolvedVillage}</span>

                <span className="col-span-4 font-semibold text-slate-600">Kecamatan</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 uppercase">{resolvedSubdistrict}</span>

                <span className="col-span-4 font-semibold text-slate-600">Kabupaten / Kota</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 uppercase">{resolvedCity}</span>

                <span className="col-span-4 font-semibold text-slate-600">Provinsi</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 uppercase">{resolvedProvince}</span>

                <span className="col-span-4 font-semibold text-slate-600">Website</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-mono text-blue-700">{resolvedWebsite}</span>

                <span className="col-span-4 font-semibold text-slate-600">Email</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-mono text-slate-800">{resolvedEmail}</span>
              </div>
            </div>

            <div className="pt-8 text-center text-xs text-slate-500">
              Dokumen Resmi E-Rapor Kurikulum Merdeka Kemdikbudristek RI
            </div>
          </div>
        )}

        {/* ================= COVER 3: IDENTITAS PESERTA DIDIK ================= */}
        {coverType === 'cover3' && (
          <div className="flex-1 flex flex-col justify-between py-2 text-slate-900 font-sans text-xs">
            <div className="text-center pb-6">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider underline underline-offset-4 decoration-2">
                KETERANGAN TENTANG DIRI PESERTA DIDIK
              </h2>
            </div>

            <div className="space-y-1.5 max-w-2xl mx-auto w-full flex-1 text-[11.5px] leading-relaxed">
              {/* 1 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">1.</span>
                <span className="col-span-4">Nama Peserta Didik</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6 font-semibold uppercase">{student.name}</span>
              </div>

              {/* 2 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">2.</span>
                <span className="col-span-4">Nomor Induk / NISN</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6 font-mono font-medium">{student.nis} / {student.nisn}</span>
              </div>

              {/* 3 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">3.</span>
                <span className="col-span-4">Tempat, Tanggal Lahir</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.birthPlace}, {student.birthDate}</span>
              </div>

              {/* 4 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">4.</span>
                <span className="col-span-4">Jenis Kelamin</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>

              {/* 5 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">5.</span>
                <span className="col-span-4">Agama</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.religion}</span>
              </div>

              {/* 6 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">6.</span>
                <span className="col-span-4">Status dalam keluarga</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.familyStatus || student.statusKeluarga || 'Anak Kandung'}</span>
              </div>

              {/* 7 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">7.</span>
                <span className="col-span-4">Anak ke</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.childOrder || student.anakKe || '1'}</span>
              </div>

              {/* 8 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">8.</span>
                <span className="col-span-4">Alamat Peserta Didik</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.studentAddress || student.address || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Desa / Kelurahan</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.studentVillage || student.desaKelurahan || resolvedVillage || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Kecamatan</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.studentDistrict || student.kecamatan || resolvedSubdistrict || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Telepon / HP</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.studentPhone || student.phone || '-'}</span>
              </div>

              {/* 9 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">9.</span>
                <span className="col-span-4">Sekolah Asal</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.prevSchool || student.previousEducation || 'SD Negeri'}</span>
              </div>

              {/* 10 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">10.</span>
                <span className="col-span-4">Diterima di sekolah ini</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">-</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">a. Dikelas</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.acceptedClass || student.diterimaDiKelas || `${student.kelas || schoolConfig.kelas || 'VII'} (${(student.kelas || schoolConfig.kelas || 'VII').includes('VII') ? 'Tujuh' : (student.kelas || schoolConfig.kelas || '').includes('VIII') ? 'Delapan' : 'Sembilan'})`}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">b. Pada Tanggal</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.acceptedDate || student.diterimaTanggal || '15 Juli 2023'}</span>
              </div>

              {/* 11 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">11.</span>
                <span className="col-span-4">Nama Orang Tua</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">-</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">a. Ayah</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6 font-semibold">{student.fatherName || student.parentFather || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">b. Ibu</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6 font-semibold">{student.motherName || student.parentMother || '-'}</span>
              </div>

              {/* 12 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">12.</span>
                <span className="col-span-4">Alamat Orang Tua</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.parentAddress || student.parentAddressRoad || student.studentAddress || student.address || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Desa / Kecamatan</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.parentVillage || student.parentAddressVillage || student.studentVillage || student.desaKelurahan || resolvedVillage || '-'} / {student.parentDistrict || student.parentAddressDistrict || student.studentDistrict || student.kecamatan || resolvedSubdistrict || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Telepon / HP</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.parentPhone || student.phone || student.studentPhone || '-'}</span>
              </div>

              {/* 13 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">13.</span>
                <span className="col-span-4">Pekerjaan Orang Tua</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">-</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">a. Ayah</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.fatherJob || student.jobFather || 'Wiraswasta'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">b. Ibu</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.motherJob || student.jobMother || 'Ibu Rumah Tangga'}</span>
              </div>

              {/* 14 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">14.</span>
                <span className="col-span-4">Nama Wali</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.guardianName || '-'}</span>
              </div>

              {/* 15 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">15.</span>
                <span className="col-span-4">Alamat Wali</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.guardianAddress || '-'}</span>
              </div>
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1"></span>
                <span className="col-span-4 pl-4">Telepon / HP</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.guardianPhone || '-'}</span>
              </div>

              {/* 16 */}
              <div className="grid grid-cols-12 gap-x-1">
                <span className="col-span-1 text-right pr-2">16.</span>
                <span className="col-span-4">Pekerjaan Wali</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-6">{student.guardianJob || '-'}</span>
              </div>
            </div>

            {/* Photo frame + Signature Layout (Positioned closely for official school stamping) */}
            <div className="mt-6 pt-2 flex justify-end">
              <div className="w-88 max-w-full">
                <div className="text-center text-xs text-slate-900 mb-2 pl-24">
                  <p>{resolvedCity}, {resolvedReportDate}</p>
                  <p className="font-medium">Kepala Sekolah,</p>
                </div>

                <div className="flex items-center justify-end gap-5">
                  {/* Pas Foto 3x4 ditempatkan tepat di samping kiri tanda tangan agar stempel resmi mengenai foto */}
                  <div className="shrink-0">
                    {student.photoUrl ? (
                      <div className="w-24 h-32 border-2 border-slate-800 p-0.5 rounded overflow-hidden shadow-xs bg-white flex items-center justify-center">
                        <img
                          src={student.photoUrl}
                          alt={`Pas Foto ${student.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-32 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500 text-[10px] text-center p-1.5 rounded bg-slate-50">
                        <Camera className="w-5 h-5 mb-1 text-slate-400" />
                        Pas Foto
                        <br />
                        3 x 4 cm
                      </div>
                    )}
                  </div>

                  {/* Area Tanda Tangan & Nama Kepala Sekolah */}
                  <div className="w-48 text-center text-xs space-y-1">
                    <div className="h-20" />
                    <p className="font-bold underline uppercase text-slate-900 leading-tight">{resolvedHeadmasterName}</p>
                    <p className="text-[11px] text-slate-700">NIP. {resolvedHeadmasterNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

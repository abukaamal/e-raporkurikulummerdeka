'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
} from 'lucide-react';
import {
  Student,
  Subject,
  LearningObjective,
  MaterialScope,
  FormatifAssessment,
  SumatifAssessment,
  SchoolConfig,
} from '../types/raport';
import { defaultSubjects, defaultSchoolConfig } from '../lib/initialData';
import { calculateFormatifStats } from '../lib/calculations';
import { downloadElementAsPdf, triggerPrint } from '../lib/printUtils';

interface NilaiRaporViewProps {
  students: Student[];
  subjects?: Subject[];
  learningObjectives: LearningObjective[];
  materialScopes: MaterialScope[];
  formatifAssessments: Record<string, FormatifAssessment>;
  sumatifAssessments: Record<string, SumatifAssessment>;
  schoolConfig?: SchoolConfig;
  selectedStudentId?: string;
  onBack: () => void;
  onUpdateStudentAttendance?: (
    studentId: string,
    sick: number,
    permission: number,
    unexcused: number,
    teacherNote: string
  ) => void;
}

export const NilaiRaporView: React.FC<NilaiRaporViewProps> = ({
  students,
  subjects = defaultSubjects,
  learningObjectives,
  materialScopes,
  formatifAssessments,
  sumatifAssessments,
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

  const [activeSemester, setActiveSemester] = useState<'1 (Ganjil)' | '2 (Genap)'>(() => {
    return (schoolConfig.semester?.includes('2') || schoolConfig.semester?.toLowerCase().includes('genap'))
      ? '2 (Genap)'
      : '1 (Ganjil)';
  });

  const isSemester2 = activeSemester === '2 (Genap)';

  // Safe fallback resolution for school & personnel info
  const resolvedSchoolName =
    schoolConfig.namaSekolah || schoolConfig.schoolName || defaultSchoolConfig.namaSekolah;
  const resolvedSchoolAddress =
    schoolConfig.alamatSekolah || schoolConfig.schoolAddress || defaultSchoolConfig.alamatSekolah;
  const resolvedGrade =
    schoolConfig.kelas || schoolConfig.grade || defaultSchoolConfig.kelas;
  const resolvedPhase =
    schoolConfig.fase || schoolConfig.phase || defaultSchoolConfig.fase;
  const resolvedAcademicYear =
    schoolConfig.tahunPelajaran || schoolConfig.academicYear || defaultSchoolConfig.tahunPelajaran;
  const resolvedHeadmasterName =
    schoolConfig.namaKepalaSekolah ||
    schoolConfig.headmasterName ||
    schoolConfig.principalName ||
    defaultSchoolConfig.namaKepalaSekolah;
  const resolvedHeadmasterNip =
    schoolConfig.nipKepalaSekolah ||
    schoolConfig.headmasterNip ||
    schoolConfig.principalNip ||
    defaultSchoolConfig.nipKepalaSekolah;
  const resolvedTeacherName =
    schoolConfig.namaGuruKelas ||
    schoolConfig.teacherName ||
    defaultSchoolConfig.namaGuruKelas;
  const resolvedTeacherNip =
    schoolConfig.nipGuruKelas ||
    schoolConfig.teacherNip ||
    defaultSchoolConfig.nipGuruKelas;
  const resolvedCity =
    schoolConfig.tempatRapor ||
    schoolConfig.kabupatenKota ||
    schoolConfig.schoolCity ||
    defaultSchoolConfig.tempatRapor;

  const displayReportDate = isSemester2
    ? (schoolConfig.semester?.includes('2')
        ? schoolConfig.tanggalRapor || schoolConfig.reportDate || '21 Juni 2024'
        : '21 Juni 2024')
    : (schoolConfig.semester?.includes('1')
        ? schoolConfig.tanggalRapor || schoolConfig.reportDate || '22 Desember 2023'
        : '22 Desember 2023');

  const student = students[currentIdx] || students[0];
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const resolvedParentName =
    student?.parentFather ||
    student?.fatherName ||
    student?.parentMother ||
    student?.motherName ||
    student?.guardianName ||
    '...........................................';

  const handlePrev = () => setCurrentIdx((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIdx((prev) => Math.min(students.length - 1, prev + 1));

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const safeName = (student?.name || 'Siswa').replace(/\s+/g, '_');
      const safeNis = (student?.nis || '').replace(/\s+/g, '_');
      await downloadElementAsPdf(
        'raport-sheet',
        `Rapor_${safeName}_${safeNis}_Sem_${isSemester2 ? '2' : '1'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const safeName = (student?.name || 'Siswa').replace(/\s+/g, '_');
    triggerPrint('raport-sheet', `Rapor_${safeName}_Sem_${isSemester2 ? '2' : '1'}`);
  };

  // Filter subjects for student (match religion)
  const studentSubjects = useMemo(() => {
    return subjects.map((sub) => {
      let displayName = sub.name;
      if (sub.id === 'agama') {
        displayName = `Pendidikan Agama ${student?.religion || 'Kristen'} dan Budi Pekerti`;
      }
      return {
        ...sub,
        displayName,
      };
    });
  }, [subjects, student]);

  // Compute student scores & competencies
  const reportRows = useMemo(() => {
    if (!student) return [];

    return studentSubjects.map((sub, index) => {
      const formatifKey = `${student.id}_${sub.id}`;
      const sumatifKey = `${student.id}_${sub.id}`;

      const formatif = formatifAssessments[formatifKey];
      const sumatif = sumatifAssessments[sumatifKey];

      // Calculate final score
      let finalScore = 0;
      if (sumatif?.finalScore && sumatif.finalScore > 0) {
        finalScore = sumatif.finalScore;
      } else if (formatif?.finalScore && formatif.finalScore > 0) {
        finalScore = formatif.finalScore;
      } else {
        finalScore = 85 + (student.noUrut % 8);
      }

      // Compute TP descriptions
      const subjectTps = learningObjectives.filter((t) => {
        if (t.subjectId !== sub.id) return false;
        if (sub.id === 'agama') return t.religionTarget === student.religion;
        return true;
      });

      const stats = formatif?.scores
        ? calculateFormatifStats(formatif.scores, subjectTps, student.religion)
        : null;

      let highestDesc = formatif?.highestTpDesc || stats?.highestTpDesc;
      let lowestDesc = formatif?.lowestTpDesc || stats?.lowestTpDesc;

      if (!highestDesc && subjectTps.length > 0) {
        highestDesc = `Sangat menguasai dalam ${subjectTps[0].description.toLowerCase()}`;
      } else if (!highestDesc) {
        highestDesc = `Sangat menguasai dalam memahami materi pembelajaran ${sub.displayName.toLowerCase()}`;
      }

      if (!lowestDesc && subjectTps.length > 1) {
        lowestDesc = `Perlu bimbingan dalam ${subjectTps[subjectTps.length - 1].description.toLowerCase()}`;
      } else if (!lowestDesc) {
        lowestDesc = `Perlu bimbingan dalam meningkatkan ketelitian dan penyelesaian tugas.`;
      }

      return {
        no: index + 1,
        subjectName: sub.displayName,
        finalScore,
        highestDesc,
        lowestDesc,
      };
    });
  }, [student, studentSubjects, formatifAssessments, sumatifAssessments, learningObjectives]);

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">Belum ada siswa.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on print) */}
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
              Laporan Hasil Belajar (Rapor)
            </h1>
            <p className="text-xs text-slate-500">
              Format Resmi Rapor Hasil Belajar Siswa - Kurikulum Merdeka
            </p>
          </div>
        </div>

        {/* Student Switcher, Semester Toggle & Print */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Semester toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
            <button
              onClick={() => setActiveSemester('1 (Ganjil)')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                !isSemester2
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem 1 (Ganjil)
            </button>
            <button
              onClick={() => setActiveSemester('2 (Genap)')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isSemester2
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem 2 (Genap)
            </button>
          </div>

          <select
            value={currentIdx}
            onChange={(e) => setCurrentIdx(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
          >
            {students.map((st, i) => (
              <option key={st.id} value={i}>
                {st.noUrut || i + 1}. {st.name} ({st.nis})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
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
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
              title="Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Download PDF via jsPDF & Print Buttons */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            id="btn-cetak-rapor-pdf"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 disabled:opacity-75 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            title="Unduh Dokumen Rapor Format PDF Menggunakan jsPDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PDF Rapor</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-rapor"
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            title="Cetak langsung menggunakan dialog printer peramban"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document (A4 Multi-Page Styling) */}
      <div id="raport-sheet" className="space-y-8 max-w-4xl mx-auto">
        {/* ======================= HALAMAN 1: NILAI AKADEMIK ======================= */}
        <div
          id="raport-page-1"
          className="pdf-page bg-white border border-slate-300 shadow-md rounded-2xl p-6 sm:p-10 print:p-0 print:border-none print:shadow-none text-slate-900 min-h-[1050px] flex flex-col justify-between"
        >
          <div>
            {/* Student & School Information Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] pb-3 mb-3 border-b border-slate-400">
              {/* Left Column */}
              <div className="space-y-0.5">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Nama Peserta Didik</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold uppercase truncate">{student.name}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">NISN / NIS</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-mono font-medium">{student.nisn} / {student.nis}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Sekolah</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 uppercase font-semibold">{resolvedSchoolName}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Alamat</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 text-slate-800 truncate">{resolvedSchoolAddress}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-0.5">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Kelas</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold">{resolvedGrade}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Fase</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold">{resolvedPhase}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Semester</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold">{activeSemester}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 font-semibold text-slate-700">Tahun Ajaran</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 font-bold">{resolvedAcademicYear}</span>
                </div>
              </div>
            </div>

            {/* Subjects & Competency Descriptions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                    <th className="py-1.5 px-1.5 border border-slate-400 w-8">No</th>
                    <th className="py-1.5 px-2 border border-slate-400 text-left min-w-[150px]">Mata Pelajaran</th>
                    <th className="py-1.5 px-1.5 border border-slate-400 w-14 text-center">Nilai Akhir</th>
                    <th className="py-1.5 px-2.5 border border-slate-400 text-left">Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {reportRows.map((row) => (
                    <tr key={row.no} className="hover:bg-slate-50/50">
                      <td className="py-1 px-1.5 text-center font-bold border border-slate-400 text-slate-600 align-top">
                        {row.no}
                      </td>
                      <td className="py-1 px-2 font-semibold border border-slate-400 align-top text-slate-900">
                        {row.subjectName}
                      </td>
                      <td className="py-1 px-1.5 text-center font-bold text-xs border border-slate-400 align-top text-slate-900">
                        {row.finalScore}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-400 text-[10px] leading-snug space-y-1">
                        {row.highestDesc && (
                          <p className="text-slate-900">{row.highestDesc}</p>
                        )}
                        {row.lowestDesc && (
                          <p className="text-slate-800">{row.lowestDesc}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 text-right text-[10px] text-slate-400 font-medium">
            Halaman 1 dari 2
          </div>
        </div>

        {/* ======================= HALAMAN 2: EKSKUL, CATATAN & TTD ======================= */}
        <div
          id="raport-page-2"
          className="pdf-page bg-white border border-slate-300 shadow-md rounded-2xl p-6 sm:p-10 print:p-0 print:border-none print:shadow-none text-slate-900 min-h-[1050px] flex flex-col justify-between"
        >
          <div className="space-y-5">
            {/* Mini Student Header on Page 2 */}
            <div className="flex justify-between items-center text-[11px] pb-2.5 border-b border-slate-300 text-slate-700">
              <div>
                <span className="font-semibold">Nama: </span>
                <strong className="text-slate-900 uppercase">{student.name}</strong>
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-semibold">NISN: </span>
                <span className="font-mono text-slate-900">{student.nisn}</span>
              </div>
              <div>
                <span className="font-semibold">Kelas / Semester: </span>
                <strong className="text-slate-900">{resolvedGrade} / {activeSemester}</strong>
              </div>
            </div>

            {/* Extracurricular Activities Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-amber-600 rounded-sm"></span>
                Kegiatan Ekstrakurikuler
              </h4>
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-center">
                    <th className="py-2 px-2 border border-slate-400 w-10">No</th>
                    <th className="py-2 px-3 border border-slate-400 text-left w-56">Kegiatan Ekstrakurikuler</th>
                    <th className="py-2 px-2 border border-slate-400 w-24">Predikat</th>
                    <th className="py-2 px-3 border border-slate-400 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {student.extracurriculars && student.extracurriculars.length > 0 ? (
                    student.extracurriculars.map((ekskul, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 text-center border border-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold border border-slate-400">{ekskul.name}</td>
                        <td className="py-2 px-2 text-center font-bold border border-slate-400">{ekskul.predicate}</td>
                        <td className="py-2 px-3 text-[11px] border border-slate-400">{ekskul.description}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="py-2 px-2 text-center border border-slate-400">1</td>
                        <td className="py-2 px-3 font-semibold border border-slate-400">Praja Muda Karana (Pramuka)</td>
                        <td className="py-2 px-2 text-center font-bold border border-slate-400">Baik</td>
                        <td className="py-2 px-3 text-[11px] border border-slate-400">
                          Aktif dan disiplin dalam mengikuti latihan kepanduan serta kegiatan perkemahan.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-center border border-slate-400">2</td>
                        <td className="py-2 px-3 font-semibold border border-slate-400">Seni Musik & Tari</td>
                        <td className="py-2 px-2 text-center font-bold border border-slate-400">Amat Baik</td>
                        <td className="py-2 px-3 text-[11px] border border-slate-400">
                          Menunjukkan kreativitas dan apresiasi seni yang sangat baik.
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Attendance + Teacher Note + Decision */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              {/* Attendance Box */}
              <div className="sm:col-span-4 border border-slate-400 p-3.5 rounded-lg bg-slate-50/50">
                <h4 className="font-bold text-center uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-2.5 text-slate-800">
                  Ketidakhadiran
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                    <span className="text-slate-700">Sakit</span>
                    <span className="font-bold text-slate-900">{student.attendance?.sick || 0} hari</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                    <span className="text-slate-700">Izin</span>
                    <span className="font-bold text-slate-900">{student.attendance?.permission || 1} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Tanpa Keterangan</span>
                    <span className="font-bold text-slate-900">{student.attendance?.unexcused || 0} hari</span>
                  </div>
                </div>
              </div>

              {/* Teacher Note Box */}
              <div className="sm:col-span-8 border border-slate-400 p-3.5 rounded-lg flex flex-col justify-between bg-slate-50/50">
                <h4 className="font-bold uppercase tracking-wider border-b border-slate-300 pb-1.5 mb-1.5 text-slate-800">
                  Catatan Wali Kelas
                </h4>
                <p className="text-[11.5px] leading-relaxed italic text-slate-800 flex-1 py-1">
                  &ldquo;{student.notes ||
                    `${student.name} menunjukkan semangat belajar yang sangat baik, tingkatkan ketekunan serta partisipasi aktif dalam kegiatan diskusi kelas!`}&rdquo;
                </p>

                {/* Decision / Note */}
                {isSemester2 ? (
                  <div className="mt-2 pt-2 border-t border-slate-300 font-bold text-slate-900 text-xs">
                    <span className="text-slate-600">Keputusan: </span>
                    {student.decision === 'Lulus' || resolvedGrade?.includes('9') || resolvedGrade?.includes('IX') ? (
                      <span className="text-emerald-800">
                        Berdasarkan kriteria kelulusan, Peserta Didik dinyatakan: <u>LULUS DARI SATUAN PENDIDIKAN</u>
                      </span>
                    ) : student.decision === 'Tinggal di Kelas' ? (
                      <span className="text-rose-800">
                        Peserta Didik dinyatakan: <u>TINGGAL DI KELAS {resolvedGrade || 'VII'}</u>
                      </span>
                    ) : (
                      <span className="text-emerald-800">
                        Berdasarkan pencapaian seluruh tujuan pembelajaran, Peserta Didik dinyatakan:{' '}
                        <u>NAIK KE KELAS {student.decisionTargetClass || (resolvedGrade?.includes('7') || resolvedGrade?.includes('VII') ? 'VIII (DELAPAN)' : resolvedGrade?.includes('8') || resolvedGrade?.includes('VIII') ? 'IX (SEMBILAN)' : 'SELANJUTNYA')}</u>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10.5px] text-slate-500 italic">
                    * Laporan capaian hasil belajar Semester 1 (Ganjil). Keputusan kenaikan kelas ditetapkan pada akhir Semester 2 (Genap).
                  </div>
                )}
              </div>
            </div>

            {/* Official Signature Block */}
            {isSemester2 ? (
              /* Semester 2: 3 Kolom dengan Tanda Tangan Kepala Sekolah di Paling Kanan */
              <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-900 pt-6">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-medium">Orang Tua / Wali Siswa</p>
                  <div className="h-20" />
                  <p className="font-bold underline uppercase">{resolvedParentName}</p>
                  <p className="text-[11px] text-transparent select-none">NIP. -</p>
                </div>

                <div>
                  <p className="text-transparent select-none">Mengetahui,</p>
                  <p className="font-medium">Guru Kelas / Wali Kelas</p>
                  <div className="h-20" />
                  <p className="font-bold underline uppercase">{resolvedTeacherName}</p>
                  <p className="text-[11px] text-slate-700">NIP. {resolvedTeacherNip}</p>
                </div>

                <div>
                  <p>{resolvedCity}, {displayReportDate}</p>
                  <p className="font-medium">Kepala {resolvedSchoolName}</p>
                  <div className="h-20" />
                  <p className="font-bold underline uppercase">{resolvedHeadmasterName}</p>
                  <p className="text-[11px] text-slate-700">NIP. {resolvedHeadmasterNip}</p>
                </div>
              </div>
            ) : (
              /* Semester 1: 2 Kolom (Orang Tua di Kiri & Wali Kelas di Kanan, Tanpa Kepala Sekolah) */
              <div className="flex justify-between items-start text-center text-xs text-slate-900 pt-6 px-4">
                <div className="w-64">
                  <p>Mengetahui,</p>
                  <p className="font-medium">Orang Tua / Wali Siswa</p>
                  <div className="h-20" />
                  <p className="font-bold underline uppercase">{resolvedParentName}</p>
                  <p className="text-[11px] text-transparent select-none">NIP. -</p>
                </div>

                <div className="w-64">
                  <p>{resolvedCity}, {displayReportDate}</p>
                  <p className="font-medium">Guru Kelas / Wali Kelas</p>
                  <div className="h-20" />
                  <p className="font-bold underline uppercase">{resolvedTeacherName}</p>
                  <p className="text-[11px] text-slate-700">NIP. {resolvedTeacherNip}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 text-right text-[10px] text-slate-400 font-medium">
            Halaman 2 dari 2
          </div>
        </div>
      </div>
    </div>
  );
};

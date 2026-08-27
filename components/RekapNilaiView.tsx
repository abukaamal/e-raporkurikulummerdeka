'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  ArrowLeft,
  Printer,
  TrendingUp,
  Users,
  BookOpen,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react';
import {
  Student,
  Subject,
  FormatifAssessment,
  SumatifAssessment,
  SchoolConfig,
} from '../types/raport';
import { defaultSubjects, defaultSchoolConfig } from '../lib/initialData';
import { computeStudentRekap, calculateRankings } from '../lib/calculations';
import { downloadElementAsPdf, triggerPrint } from '../lib/printUtils';

interface RekapNilaiViewProps {
  students: Student[];
  subjects: Subject[];
  schoolConfig: SchoolConfig;
  formatifAssessments: Record<string, FormatifAssessment>;
  sumatifAssessments: Record<string, SumatifAssessment>;
  onBack: () => void;
  onSelectStudent?: (studentId: string) => void;
}

export const RekapNilaiView: React.FC<RekapNilaiViewProps> = ({
  students,
  subjects = defaultSubjects,
  schoolConfig = defaultSchoolConfig,
  formatifAssessments,
  sumatifAssessments,
  onBack,
  onSelectStudent,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<'1 (Ganjil)' | '2 (Genap)'>(() => {
    return (schoolConfig.semester?.includes('2') || schoolConfig.semester?.toLowerCase().includes('genap'))
      ? '2 (Genap)'
      : '1 (Ganjil)';
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compute rankings and summary
  const rankedStudents = useMemo(() => {
    return calculateRankings(
      students,
      subjects,
      formatifAssessments,
      sumatifAssessments
    );
  }, [students, subjects, formatifAssessments, sumatifAssessments]);

  // Overall class average
  const classAvg = useMemo(() => {
    if (rankedStudents.length === 0) return 0;
    const total = rankedStudents.reduce((acc, st) => acc + st.averageScore, 0);
    return Math.round((total / rankedStudents.length) * 10) / 10;
  }, [rankedStudents]);

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadElementAsPdf(
        'rekap-sheet',
        `Rekap_Nilai_Kelas_${schoolConfig.grade || 'VII'}_Sem_${selectedSemester.includes('2') ? '2' : '1'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    triggerPrint('rekap-sheet', `Rekap_Nilai_Kelas_${schoolConfig.grade || 'VII'}_Sem_${selectedSemester.includes('2') ? '2' : '1'}`);
  };

  const isSemester2 = selectedSemester === '2 (Genap)';
  const displayReportDate = isSemester2 ? '21 Juni 2024' : '22 Desember 2023';

  return (
    <div className="space-y-6">
      {/* Header bar */}
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
              <Award className="w-6 h-6 text-amber-700" />
              Rekapitulasi Nilai & Peringkat Kelas
            </h1>
            <p className="text-xs text-slate-500">
              {schoolConfig.schoolName} &bull; Kelas {schoolConfig.grade} &bull; Semester {selectedSemester} &bull; Tahun Ajaran {schoolConfig.academicYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Semester Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
            <button
              onClick={() => setSelectedSemester('1 (Ganjil)')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !isSemester2
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem 1 (Ganjil)
            </button>
            <button
              onClick={() => setSelectedSemester('2 (Genap)')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isSemester2
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem 2 (Genap)
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            id="btn-cetak-rekap-pdf"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-75 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            title="Unduh Dokumen Rekap Nilai Format PDF Menggunakan jsPDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Rekap PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-print-rekap"
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak via dialog printer peramban"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-900">Total Siswa Aktif</p>
            <p className="text-2xl font-black text-amber-950">{students.length} Siswa</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-900">Rata-Rata Kelas</p>
            <p className="text-2xl font-black text-emerald-950">{classAvg}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-900">Peringkat 1</p>
            <p className="text-sm font-black text-blue-950 truncate max-w-[180px]">
              {rankedStudents[0]?.student.name || '-'} ({rankedStudents[0]?.averageScore || 0})
            </p>
          </div>
        </div>
      </div>

      {/* Main Recap Table */}
      <div 
        id="rekap-sheet"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 print:p-0 print:border-none print:shadow-none"
      >
        <div className="text-center mb-6 border-b pb-4">
          <h2 className="font-bold text-base uppercase text-slate-900">
            DAFTAR REKAPITULASI NILAI HASIL BELAJAR SISWA
          </h2>
          <p className="text-xs text-slate-600">
            {(schoolConfig.namaSekolah || schoolConfig.schoolName || '').toUpperCase()} &bull; KELAS {schoolConfig.kelas || schoolConfig.grade} &bull; SEMESTER {selectedSemester.toUpperCase()} &bull; TAHUN AJARAN {schoolConfig.tahunPelajaran || schoolConfig.academicYear}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-amber-100 text-amber-950 font-bold border-b border-slate-300 text-center">
                <th rowSpan={2} className="py-2 px-2 border border-slate-300 w-10">No</th>
                <th rowSpan={2} className="py-2 px-3 border border-slate-300 w-24">NIS / NISN</th>
                <th rowSpan={2} className="py-2 px-4 border border-slate-300 text-left min-w-[200px]">NAMA SISWA</th>
                <th colSpan={subjects.length} className="py-1.5 px-2 border border-slate-300 bg-amber-200">
                  MATA PELAJARAN
                </th>
                <th rowSpan={2} className="py-2 px-2 border border-slate-300 w-16 bg-amber-300">
                  JUMLAH
                </th>
                <th rowSpan={2} className="py-2 px-2 border border-slate-300 w-16 bg-amber-400 font-black">
                  RATA-RATA
                </th>
                <th rowSpan={2} className="py-2 px-2 border border-slate-300 w-14 bg-emerald-200 text-emerald-950 font-black">
                  RANK
                </th>
              </tr>
              <tr className="bg-amber-50 text-amber-900 font-bold border-b border-slate-300 text-center">
                {subjects.map((sub) => (
                  <th key={sub.id} className="py-1 px-1 border border-slate-300 w-12" title={sub.name}>
                    <span className="text-[10px] uppercase">{sub.code}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {rankedStudents.map(({ student, subjectScores, totalScore, averageScore, rank }, idx) => (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent && onSelectStudent(student.id)}
                  className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                    rank <= 3 ? 'bg-amber-50/30 font-medium' : ''
                  }`}
                >
                  <td className="py-2 px-2 text-center border border-slate-300 text-slate-500 font-bold">
                    {student.noUrut || idx + 1}
                  </td>
                  <td className="py-2 px-2 text-center border border-slate-300 text-slate-600 font-mono text-[11px]">
                    {student.nis}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-slate-900">
                    <div className="flex items-center justify-between">
                      <span>{student.name}</span>
                      {rank === 1 && <span className="text-xs">🥇</span>}
                      {rank === 2 && <span className="text-xs">🥈</span>}
                      {rank === 3 && <span className="text-xs">🥉</span>}
                    </div>
                  </td>

                  {/* Subject Scores */}
                  {subjects.map((sub) => {
                    const score = subjectScores[sub.id] || 0;
                    return (
                      <td
                        key={sub.id}
                        className={`py-2 px-1 text-center border border-slate-300 text-xs ${
                          score < 75 ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-800'
                        }`}
                      >
                        {score || '-'}
                      </td>
                    );
                  })}

                  {/* Total & Average */}
                  <td className="py-2 px-2 text-center border border-slate-300 font-bold bg-amber-50 text-slate-900">
                    {totalScore}
                  </td>
                  <td className="py-2 px-2 text-center border border-slate-300 font-black bg-amber-100 text-amber-950">
                    {averageScore}
                  </td>
                  <td className="py-2 px-2 text-center border border-slate-300 font-black bg-emerald-50 text-emerald-900">
                    {rank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Box for Print */}
        <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-xs text-slate-800">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p>Kepala {schoolConfig.namaSekolah || schoolConfig.schoolName}</p>
            <div className="h-20" />
            <p className="font-bold underline">{schoolConfig.namaKepalaSekolah || schoolConfig.principalName}</p>
            <p>NIP. {schoolConfig.nipKepalaSekolah || schoolConfig.principalNip}</p>
          </div>
          <div className="text-center">
            <p>{schoolConfig.tempatRapor || schoolConfig.kabupatenKota || 'Manado'}, {displayReportDate}</p>
            <p>Guru Kelas / Wali Kelas</p>
            <div className="h-20" />
            <p className="font-bold underline">{schoolConfig.namaGuruKelas || schoolConfig.teacherName}</p>
            <p>NIP. {schoolConfig.nipGuruKelas || schoolConfig.teacherNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

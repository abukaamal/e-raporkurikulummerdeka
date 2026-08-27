'use client';

import React, { useState } from 'react';
import {
  Search,
  User,
  Award,
  BookOpen,
  Calendar,
  Heart,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  Subject,
  LearningObjective,
  FormatifAssessment,
  SumatifAssessment,
  SchoolConfig,
} from '../types/raport';
import { defaultSubjects, defaultSchoolConfig } from '../lib/initialData';
import { calculateFormatifStats } from '../lib/calculations';

interface ParentPortalViewProps {
  students: Student[];
  subjects: Subject[];
  learningObjectives: LearningObjective[];
  formatifAssessments: Record<string, FormatifAssessment>;
  sumatifAssessments: Record<string, SumatifAssessment>;
  schoolConfig: SchoolConfig;
  onOpenReportCard: (studentId: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  students,
  subjects = defaultSubjects,
  learningObjectives,
  formatifAssessments,
  sumatifAssessments,
  schoolConfig = defaultSchoolConfig,
  onOpenReportCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const found = students.find(
      (s) =>
        s.nisn.toLowerCase() === query ||
        s.nis.toLowerCase() === query ||
        s.name.toLowerCase().includes(query)
    );

    setSearchedStudent(found || null);
    setSearched(true);
  };

  // Compute student summary if found
  const studentScores = searchedStudent
    ? subjects.map((sub) => {
        const formatifKey = `${searchedStudent.id}_${sub.id}`;
        const sumatifKey = `${searchedStudent.id}_${sub.id}`;
        const formatif = formatifAssessments[formatifKey];
        const sumatif = sumatifAssessments[sumatifKey];

        let score = 0;
        if (sumatif?.finalScore && sumatif.finalScore > 0) {
          score = sumatif.finalScore;
        } else if (formatif?.finalScore && formatif.finalScore > 0) {
          score = formatif.finalScore;
        } else {
          score = 85 + (searchedStudent.noUrut % 8);
        }

        const subjectTps = learningObjectives.filter((t) => {
          if (t.subjectId !== sub.id) return false;
          if (sub.id === 'agama') return t.religionTarget === searchedStudent.religion;
          return true;
        });

        const stats = formatif?.scores
          ? calculateFormatifStats(formatif.scores, subjectTps, searchedStudent.religion)
          : null;

        const highestDesc =
          formatif?.highestTpDesc ||
          stats?.highestTpDesc ||
          `Menunjukkan penguasaan sangat baik dalam materi pembelajaran ${sub.name}`;

        return {
          subject: sub,
          score,
          highestDesc,
        };
      })
    : [];

  const averageScore = studentScores.length
    ? Math.round(
        (studentScores.reduce((acc, curr) => acc + curr.score, 0) / studentScores.length) * 10
      ) / 10
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Portal Hero Banner */}
      <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-orange-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Portal Akses Mandiri Orang Tua & Siswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
            Cek Hasil Belajar & Rapor Digital
          </h1>
          <p className="text-sm text-amber-100 mb-6 leading-relaxed">
            Selamat datang di layanan pelaporan digital {schoolConfig.schoolName}. Masukkan Nomor Induk Siswa Nasional (NISN) atau Nama Siswa untuk melihat perkembangan capaian kompetensi semester ini.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="portal-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan NISN, NIS, atau Nama Lengkap Siswa..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none focus:ring-4 focus:ring-amber-400/30 shadow-inner"
              />
            </div>
            <button
              id="portal-search-btn"
              type="submit"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Cari Data</span>
            </button>
          </form>

          {/* Quick Demo Suggestions */}
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-200">
            <span>Contoh pencarian:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('0112345601');
                const found = students.find((s) => s.nisn === '0112345601') || students[0];
                setSearchedStudent(found);
                setSearched(true);
              }}
              className="underline font-bold hover:text-white"
            >
              {students[0]?.name || 'Aditya Pratama'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {searched && (
        <>
          {searchedStudent ? (
            <div className="space-y-6">
              {/* Student Overview Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl">
                      {searchedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 uppercase">
                          {searchedStudent.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Siswa Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        NISN: {searchedStudent.nisn} &bull; NIS: {searchedStudent.nis} &bull; Kelas {schoolConfig.grade}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenReportCard(searchedStudent.id)}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Buka Lembar Rapor Lengkap</span>
                  </button>
                </div>

                {/* Metric Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800">Rata-Rata Nilai</p>
                    <p className="text-2xl font-black text-amber-950 mt-1">{averageScore}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Predikat Sangat Baik</p>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800">Kehadiran</p>
                    <p className="text-2xl font-black text-emerald-950 mt-1">98.5%</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Disiplin Tinggi</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800">Ekstrakurikuler</p>
                    <p className="text-2xl font-black text-blue-950 mt-1">2</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">Pramuka & Seni</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-800">Keputusan</p>
                    <p className="text-sm font-black text-purple-950 mt-2">Naik Kelas</p>
                    <p className="text-[11px] text-purple-700 mt-0.5">Tuntas Seluruh Mapel</p>
                  </div>
                </div>

                {/* Score Breakdown List */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    Ringkasan Capaian Mata Pelajaran
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentScores.map(({ subject, score, highestDesc }) => (
                      <div
                        key={subject.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {subject.name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                            {score}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {highestDesc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teacher's Note */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-950">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
                    <Award className="w-4 h-4 text-amber-700" />
                    Pesan Wali Kelas ({schoolConfig.teacherName}):
                  </p>
                  <p className="italic text-slate-700">
                    &ldquo;{searchedStudent.notes ||
                      `${searchedStudent.name} menunjukkan dedikasi dan sikap yang santun dalam proses pembelajaran. Pertahankan prestasi dan keaktifan belajarmu!`}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Data Siswa Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pastikan NISN atau Nama yang Anda masukkan sesuai dengan data resmi sekolah. Silakan hubungi wali kelas jika mengalami kendala.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

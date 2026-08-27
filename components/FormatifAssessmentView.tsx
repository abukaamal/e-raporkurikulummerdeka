'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  Student,
  Subject,
  LearningObjective,
  FormatifAssessment,
  AuthUser,
} from '../types/raport';
import { defaultSubjects } from '../lib/initialData';
import { calculateFormatifStats } from '../lib/calculations';

interface FormatifAssessmentViewProps {
  students: Student[];
  subjects: Subject[];
  learningObjectives: LearningObjective[];
  formatifAssessments: Record<string, FormatifAssessment>;
  currentUser?: AuthUser;
  onSaveAssessment: (assessment: FormatifAssessment) => Promise<void>;
  onBack: () => void;
}

export const FormatifAssessmentView: React.FC<FormatifAssessmentViewProps> = ({
  students,
  subjects = defaultSubjects,
  learningObjectives,
  formatifAssessments,
  currentUser,
  onSaveAssessment,
  onBack,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'agama');
  const [religionTab, setReligionTab] = useState<'Kristen' | 'Islam' | 'Katolik'>('Kristen');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Permission Check: Admin or Wali Kelas only
  const canEdit =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'guru' && (currentUser?.isWaliKelas || currentUser?.assignedClass === 'Semua'));

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Applicable TPs for this subject
  const currentTps = useMemo(() => {
    return learningObjectives
      .filter((tp) => {
        if (tp.subjectId !== selectedSubjectId) return false;
        if (selectedSubjectId === 'agama') {
          return tp.religionTarget === religionTab;
        }
        return true;
      })
      .sort((a, b) => a.tpNumber - b.tpNumber);
  }, [learningObjectives, selectedSubjectId, religionTab]);

  // Determine max TP count to show (at least 5, up to 10 or length)
  const tpCount = Math.max(5, Math.min(12, currentTps.length || 5));
  const tpNumbers = Array.from({ length: tpCount }, (_, i) => i + 1);

  // Filter students if religious studies
  const applicableStudents = useMemo(() => {
    if (selectedSubjectId === 'agama') {
      return students.filter((s) => s.religion === religionTab);
    }
    return students;
  }, [students, selectedSubjectId, religionTab]);

  const handleScoreChange = async (studentId: string, tpNum: number, value: string) => {
    const numVal = Math.min(100, Math.max(0, Number(value) || 0));
    const recordKey = `${studentId}_${selectedSubjectId}`;
    const existing = formatifAssessments[recordKey] || {
      id: recordKey,
      studentId,
      subjectId: selectedSubjectId,
      scores: {},
      finalScore: 0,
    };

    const updatedScores = {
      ...(existing.scores || {}),
      [tpNum]: numVal,
    };

    const stats = calculateFormatifStats(
      updatedScores,
      currentTps,
      religionTab
    );

    const updatedRecord: FormatifAssessment = {
      ...existing,
      scores: updatedScores,
      finalScore: stats.average,
      highestTpNum: stats.highestTpNum,
      highestTpDesc: stats.highestTpDesc,
      lowestTpNum: stats.lowestTpNum,
      lowestTpDesc: stats.lowestTpDesc,
    };

    await onSaveAssessment(updatedRecord);
  };

  const handleQuickFill = async () => {
    if (!confirm('Isi otomatis nilai formatif realistis (rentang 80 - 98) untuk seluruh siswa pada mapel ini?')) return;
    setIsSaving(true);
    try {
      for (const student of applicableStudents) {
        const recordKey = `${student.id}_${selectedSubjectId}`;
        const newScores: Record<number, number> = {};
        tpNumbers.forEach((num) => {
          const base = 85 + (student.noUrut % 10);
          const variation = ((num * 3 + student.noUrut) % 9) - 4;
          newScores[num] = Math.min(100, Math.max(75, base + variation));
        });

        const stats = calculateFormatifStats(newScores, currentTps, student.religion);
        await onSaveAssessment({
          id: recordKey,
          studentId: student.id,
          subjectId: selectedSubjectId,
          scores: newScores,
          finalScore: stats.average,
          highestTpNum: stats.highestTpNum,
          highestTpDesc: stats.highestTpDesc,
          lowestTpNum: stats.lowestTpNum,
          lowestTpDesc: stats.lowestTpDesc,
        });
      }
      setSaveStatus('Nilai berhasil diisi otomatis!');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate Column Averages
  const columnAverages = useMemo(() => {
    const avgs: Record<number, number> = {};
    tpNumbers.forEach((num) => {
      let sum = 0;
      let count = 0;
      applicableStudents.forEach((st) => {
        const key = `${st.id}_${selectedSubjectId}`;
        const val = formatifAssessments[key]?.scores?.[num];
        if (val !== undefined && val > 0) {
          sum += val;
          count++;
        }
      });
      avgs[num] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    });
    return avgs;
  }, [applicableStudents, selectedSubjectId, formatifAssessments, tpNumbers]);

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
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
              <FileSpreadsheet className="w-6 h-6 text-rose-600" />
              Daftar Nilai Asesmen Formatif
            </h1>
            <p className="text-xs text-slate-500">
              Input nilai asesmen formatif per Tujuan Pembelajaran (TP). Sistem otomatis menghitung nilai rapor dan merumuskan deskripsi capaian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleQuickFill}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Isi Contoh Nilai
          </button>
        </div>
      </div>

      {/* Access Permission Notice if not Wali Kelas or Admin */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
            !
          </div>
          <div>
            <p className="font-bold">Mode Hanya Lihat (Read-Only)</p>
            <p className="text-amber-800 mt-0.5">
              Anda masuk sebagai <strong>{currentUser?.role === 'siswa' ? 'Siswa' : 'Guru Mata Pelajaran'}</strong>. Sesuai kebijakan kurikulum, hanya <strong>Wali Kelas</strong> dan <strong>Administrator</strong> yang memiliki hak akses untuk mengubah nilai.
            </p>
          </div>
        </div>
      )}

      {/* Instruction Note matching Reference Page 26 */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Panduan Pengisian Asesmen Formatif:</p>
          <p className="text-slate-600 mt-0.5">
            Isilah nilai sesuai pada TP yang telah Anda input (tidak perlu diisi semua). Isikan nilai pada kolom berwarna putih. Jika siswa tidak mengerjakan, isikan dengan angka &quot;0&quot;.
          </p>
        </div>
      </div>

      {/* Subject selector tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSubjectId === sub.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 opacity-80" />
              <span>{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Religion Filter if Agama is selected */}
      {selectedSubjectId === 'agama' && (
        <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
          <span className="text-xs font-bold text-rose-900 px-2">Mata Pelajaran Agama:</span>
          {(['Kristen', 'Islam', 'Katolik'] as const).map((rel) => (
            <button
              key={rel}
              onClick={() => setReligionTab(rel)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                religionTab === rel
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-900 hover:bg-rose-100'
              }`}
            >
              Pendidikan Agama {rel} ({students.filter((s) => s.religion === rel).length} Siswa)
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet Table matching Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Top Banner Row */}
              <tr className="bg-amber-600 text-white font-bold">
                <th colSpan={2 + tpNumbers.length + 5} className="py-2.5 px-4 text-center text-sm uppercase tracking-wider">
                  {selectedSubject.name} {selectedSubjectId === 'agama' ? `(${religionTab})` : ''} - ASESMEN FORMATIF
                </th>
              </tr>
              {/* Header Columns */}
              <tr className="bg-amber-100 text-amber-950 font-bold border-b border-amber-300 text-center">
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-10">No</th>
                <th rowSpan={2} className="py-2 px-3 border-r border-amber-300 text-left min-w-[180px]">NAMA SISWA</th>
                <th colSpan={tpNumbers.length} className="py-1.5 px-2 border-r border-amber-300">
                  ASESMEN FORMATIF
                </th>
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-16 bg-amber-200">
                  NILAI RAPOR
                </th>
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-14 bg-emerald-100 text-emerald-900">
                  TP MAX
                </th>
                <th rowSpan={2} className="py-2 px-3 border-r border-amber-300 text-left min-w-[220px] bg-emerald-50 text-emerald-950">
                  DESKRIPSI CAPAIAN TERTINGGI
                </th>
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-14 bg-rose-100 text-rose-900">
                  TP MIN
                </th>
                <th rowSpan={2} className="py-2 px-3 text-left min-w-[220px] bg-rose-50 text-rose-950">
                  DESKRIPSI PERLU BIMBINGAN
                </th>
              </tr>
              {/* Sub TP Header Row */}
              <tr className="bg-amber-50 text-amber-900 font-bold border-b border-amber-300 text-center">
                {tpNumbers.map((num) => {
                  const tpObj = currentTps.find((t) => t.tpNumber === num);
                  return (
                    <th
                      key={num}
                      className="py-1 px-1 border-r border-amber-200 w-12 hover:bg-amber-100 transition-colors"
                      title={tpObj ? `${tpObj.tpCode}: ${tpObj.description}` : `TP ${num}`}
                    >
                      <span className="block text-[11px]">TP {num}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {applicableStudents.length === 0 ? (
                <tr>
                  <td colSpan={2 + tpNumbers.length + 5} className="py-10 text-center text-slate-400">
                    Tidak ada siswa untuk kategori ini.
                  </td>
                </tr>
              ) : (
                applicableStudents.map((student, idx) => {
                  const recordKey = `${student.id}_${selectedSubjectId}`;
                  const assessment = formatifAssessments[recordKey];
                  const scores = assessment?.scores || {};
                  const stats = calculateFormatifStats(scores, currentTps, student.religion);

                  return (
                    <tr key={student.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200 bg-slate-50/50">
                        {student.noUrut || idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{student.name}</span>
                        </div>
                      </td>

                      {/* TP Inputs */}
                      {tpNumbers.map((num) => {
                        const val = scores[num] !== undefined ? scores[num] : '';
                        return (
                          <td key={num} className={`p-0 border-r border-slate-200 text-center ${canEdit ? 'bg-white' : 'bg-slate-50'}`}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              placeholder="-"
                              disabled={!canEdit}
                              onChange={(e) => handleScoreChange(student.id, num, e.target.value)}
                              className={`w-full h-8 text-center text-xs font-semibold focus:outline-none transition-colors ${
                                canEdit
                                  ? 'focus:bg-amber-100 cursor-text'
                                  : 'cursor-not-allowed text-slate-500 bg-transparent'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Calculated Nilai Rapor */}
                      <td className="py-2 px-2 text-center font-bold text-sm bg-amber-100 text-amber-950 border-r border-amber-300">
                        {stats.average || '-'}
                      </td>

                      {/* TP Max */}
                      <td className="py-2 px-2 text-center font-bold bg-emerald-100/70 text-emerald-900 border-r border-slate-200">
                        {stats.highestTpNum ? `TP ${stats.highestTpNum}` : '-'}
                      </td>

                      {/* Deskripsi TP Max */}
                      <td className="py-2 px-3 text-[11px] bg-emerald-50/40 text-emerald-950 border-r border-slate-200 font-medium">
                        {stats.highestTpDesc || '-'}
                      </td>

                      {/* TP Min */}
                      <td className="py-2 px-2 text-center font-bold bg-rose-100/70 text-rose-900 border-r border-slate-200">
                        {stats.lowestTpNum ? `TP ${stats.lowestTpNum}` : '-'}
                      </td>

                      {/* Deskripsi TP Min */}
                      <td className="py-2 px-3 text-[11px] bg-rose-50/40 text-rose-950 font-medium">
                        {stats.lowestTpDesc || '-'}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* RATA-RATA KELAS ROW */}
              <tr className="bg-amber-100 font-bold text-amber-950 border-t-2 border-amber-300">
                <td colSpan={2} className="py-2.5 px-3 text-right border-r border-amber-300 uppercase">
                  RATA-RATA KELAS
                </td>
                {tpNumbers.map((num) => (
                  <td key={num} className="py-2 px-1 text-center border-r border-amber-300 text-xs">
                    {columnAverages[num] || '-'}
                  </td>
                ))}
                <td className="py-2 px-2 text-center bg-amber-200 border-r border-amber-300 text-xs">
                  {Math.round(
                    (Object.values(columnAverages).reduce((a, b) => a + b, 0) /
                      (Object.values(columnAverages).filter((v) => v > 0).length || 1)) *
                      10
                  ) / 10 || '-'}
                </td>
                <td colSpan={4} className="py-2 px-3 text-slate-500 font-normal italic text-[11px]">
                  Rata-rata otomatis dihitung dari seluruh siswa aktif
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

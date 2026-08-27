'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Save,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  Student,
  Subject,
  MaterialScope,
  SumatifAssessment,
  AuthUser,
} from '../types/raport';
import { defaultSubjects } from '../lib/initialData';
import { calculateSumatifFinal } from '../lib/calculations';

interface SumatifAssessmentViewProps {
  students: Student[];
  subjects: Subject[];
  materialScopes: MaterialScope[];
  sumatifAssessments: Record<string, SumatifAssessment>;
  currentUser?: AuthUser;
  onSaveAssessment: (assessment: SumatifAssessment) => Promise<void>;
  onBack: () => void;
}

export const SumatifAssessmentView: React.FC<SumatifAssessmentViewProps> = ({
  students,
  subjects = defaultSubjects,
  materialScopes,
  sumatifAssessments,
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

  // Current LMs
  const currentLms = useMemo(() => {
    return materialScopes
      .filter((lm) => lm.subjectId === selectedSubjectId)
      .sort((a, b) => a.lmNumber - b.lmNumber);
  }, [materialScopes, selectedSubjectId]);

  const lmCount = Math.max(2, Math.min(6, currentLms.length || 2));
  const lmNumbers = Array.from({ length: lmCount }, (_, i) => i + 1);

  // Applicable Students
  const applicableStudents = useMemo(() => {
    if (selectedSubjectId === 'agama') {
      return students.filter((s) => s.religion === religionTab);
    }
    return students;
  }, [students, selectedSubjectId, religionTab]);

  const handleLmScoreChange = async (
    studentId: string,
    lmNum: number,
    type: 'tes' | 'nonTes',
    value: string
  ) => {
    const numVal = Math.min(100, Math.max(0, Number(value) || 0));
    const recordKey = `${studentId}_${selectedSubjectId}`;
    const existing = sumatifAssessments[recordKey] || {
      id: recordKey,
      studentId,
      subjectId: selectedSubjectId,
      lmScores: {},
      sasTes: 85,
      sasNonTes: 85,
      finalScore: 0,
    };

    const currentLmRecord = existing.lmScores?.[lmNum] || { tes: 0, nonTes: 0 };
    const updatedLmScores = {
      ...(existing.lmScores || {}),
      [lmNum]: {
        ...currentLmRecord,
        [type]: numVal,
      },
    };

    const updatedRecord: SumatifAssessment = {
      ...existing,
      lmScores: updatedLmScores,
    };
    updatedRecord.finalScore = calculateSumatifFinal(updatedRecord);

    await onSaveAssessment(updatedRecord);
  };

  const handleSasScoreChange = async (
    studentId: string,
    type: 'sasTes' | 'sasNonTes',
    value: string
  ) => {
    const numVal = Math.min(100, Math.max(0, Number(value) || 0));
    const recordKey = `${studentId}_${selectedSubjectId}`;
    const existing = sumatifAssessments[recordKey] || {
      id: recordKey,
      studentId,
      subjectId: selectedSubjectId,
      lmScores: {},
      sasTes: 85,
      sasNonTes: 85,
      finalScore: 0,
    };

    const updatedRecord: SumatifAssessment = {
      ...existing,
      [type]: numVal,
    };
    updatedRecord.finalScore = calculateSumatifFinal(updatedRecord);

    await onSaveAssessment(updatedRecord);
  };

  const handleQuickFill = async () => {
    if (!confirm('Isi otomatis nilai sumatif realistis untuk seluruh siswa pada mapel ini?')) return;
    setIsSaving(true);
    try {
      for (const student of applicableStudents) {
        const recordKey = `${student.id}_${selectedSubjectId}`;
        const newLmScores: Record<number, { tes: number; nonTes: number }> = {};
        lmNumbers.forEach((num) => {
          const base = 84 + (student.noUrut % 8);
          newLmScores[num] = {
            tes: Math.min(100, Math.max(78, base + ((num * 2) % 6))),
            nonTes: Math.min(100, Math.max(80, base + ((num * 3) % 7))),
          };
        });

        const sasVal = Math.min(98, 85 + (student.noUrut % 10));
        const updatedRecord: SumatifAssessment = {
          id: recordKey,
          studentId: student.id,
          subjectId: selectedSubjectId,
          lmScores: newLmScores,
          sasTes: sasVal,
          sasNonTes: sasVal,
          finalScore: 0,
        };
        updatedRecord.finalScore = calculateSumatifFinal(updatedRecord);
        await onSaveAssessment(updatedRecord);
      }
      setSaveStatus('Nilai sumatif berhasil diisi!');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <Calculator className="w-6 h-6 text-blue-700" />
              Daftar Nilai Asesmen Sumatif
            </h1>
            <p className="text-xs text-slate-500">
              Input nilai Sumatif Akhir Lingkup Materi (LM) dan Sumatif Akhir Semester (SAS)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickFill}
          disabled={isSaving}
          className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Isi Contoh Nilai
        </button>
      </div>

      {/* Access Permission Notice if not Wali Kelas or Admin */}
      {!canEdit && (
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
            !
          </div>
          <div>
            <p className="font-bold">Mode Hanya Lihat (Read-Only)</p>
            <p className="text-blue-800 mt-0.5">
              Anda masuk sebagai <strong>{currentUser?.role === 'siswa' ? 'Siswa' : 'Guru Mata Pelajaran'}</strong>. Sesuai kebijakan kurikulum, hanya <strong>Wali Kelas</strong> dan <strong>Administrator</strong> yang memiliki hak akses untuk mengubah nilai sumatif.
            </p>
          </div>
        </div>
      )}

      {/* Guide Note matching Reference Page 32 */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Ketentuan Pengisian Asesmen Sumatif:</p>
          <p className="text-slate-600 mt-0.5">
            Isilah nilai sesuai Lingkup Materi yang telah diinput. Isikan nilai hanya pada kolom berwarna putih. Jika siswa tidak mengerjakan, isilah dengan &quot;0&quot;. Input nilai Asesmen Sumatif Akhir Lingkup Materi minimal 1 kolom. Asesmen Sumatif Semester tidak wajib diisi jika tidak melaksanakan.
          </p>
        </div>
      </div>

      {/* Subject Navigation */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSubjectId === sub.id
                  ? 'bg-blue-700 text-white shadow-sm'
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
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl border border-blue-200">
          <span className="text-xs font-bold text-blue-900 px-2">Mata Pelajaran Agama:</span>
          {(['Kristen', 'Islam', 'Katolik'] as const).map((rel) => (
            <button
              key={rel}
              onClick={() => setReligionTab(rel)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                religionTab === rel
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-blue-900 hover:bg-blue-100'
              }`}
            >
              Pendidikan Agama {rel} ({students.filter((s) => s.religion === rel).length} Siswa)
            </button>
          ))}
        </div>
      )}

      {/* Sumatif Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-500 text-white font-bold text-center">
                <th colSpan={2 + lmNumbers.length * 2 + 2 + 1} className="py-2.5 px-4 uppercase tracking-wider text-sm">
                  {selectedSubject.name} - DAFTAR NILAI ASESMEN SUMATIF
                </th>
              </tr>
              <tr className="bg-amber-100 text-amber-950 font-bold border-b border-amber-300 text-center">
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-10">No</th>
                <th rowSpan={2} className="py-2 px-3 border-r border-amber-300 text-left min-w-[180px]">NAMA SISWA</th>
                <th colSpan={lmNumbers.length * 2} className="py-1.5 px-2 border-r border-amber-300 bg-amber-200">
                  ASESMEN SUMATIF AKHIR LINGKUP MATERI
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-amber-300 bg-sky-200">
                  SUMATIF AKHIR SEMESTER (SAS) *
                </th>
                <th rowSpan={2} className="py-2 px-2 border-r border-amber-300 w-16 bg-amber-300 text-amber-950">
                  NILAI RAPOR
                </th>
              </tr>
              {/* Sub Columns: LM1 (Tes, Non Tes), SAS (Tes, Non Tes) */}
              <tr className="bg-amber-50 text-amber-900 font-bold border-b border-amber-300 text-center">
                {lmNumbers.map((num) => {
                  const lmObj = currentLms.find((l) => l.lmNumber === num);
                  return (
                    <React.Fragment key={num}>
                      <th className="py-1 px-1 border-r border-amber-200 w-12" title={lmObj?.title || `LM ${num}`}>
                        <div className="text-[10px] truncate max-w-[45px]">{lmObj?.lmCode || `LM ${num}`}</div>
                        <span className="text-[9px] text-slate-500">Tes</span>
                      </th>
                      <th className="py-1 px-1 border-r border-amber-200 w-12" title={lmObj?.title || `LM ${num}`}>
                        <div className="text-[10px] truncate max-w-[45px]">{lmObj?.lmCode || `LM ${num}`}</div>
                        <span className="text-[9px] text-slate-500">Non Tes</span>
                      </th>
                    </React.Fragment>
                  );
                })}
                <th className="py-1 px-1 border-r border-sky-200 w-12 bg-sky-50 text-[10px]">
                  <span>Tes</span>
                </th>
                <th className="py-1 px-1 border-r border-amber-300 w-12 bg-sky-50 text-[10px]">
                  <span>Non Tes</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {applicableStudents.length === 0 ? (
                <tr>
                  <td colSpan={2 + lmNumbers.length * 2 + 3} className="py-10 text-center text-slate-400">
                    Tidak ada data siswa untuk kategori ini.
                  </td>
                </tr>
              ) : (
                applicableStudents.map((student, idx) => {
                  const recordKey = `${student.id}_${selectedSubjectId}`;
                  const assessment = sumatifAssessments[recordKey];
                  const lmScores = assessment?.lmScores || {};
                  const finalScore = assessment?.finalScore || calculateSumatifFinal(assessment);

                  return (
                    <tr key={student.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200 bg-slate-50/50">
                        {student.noUrut || idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                        {student.name}
                      </td>

                      {/* LM Score Inputs */}
                      {lmNumbers.map((num) => {
                        const tesVal = lmScores[num]?.tes !== undefined ? lmScores[num].tes : '';
                        const nonTesVal = lmScores[num]?.nonTes !== undefined ? lmScores[num].nonTes : '';

                        return (
                          <React.Fragment key={num}>
                            <td className={`p-0 border-r border-slate-200 text-center ${canEdit ? 'bg-white' : 'bg-slate-50'}`}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={tesVal}
                                placeholder="-"
                                disabled={!canEdit}
                                onChange={(e) => handleLmScoreChange(student.id, num, 'tes', e.target.value)}
                                className={`w-full h-8 text-center text-xs font-semibold focus:outline-none ${
                                  canEdit ? 'focus:bg-blue-100 cursor-text' : 'cursor-not-allowed text-slate-500 bg-transparent'
                                }`}
                              />
                            </td>
                            <td className={`p-0 border-r border-slate-200 text-center ${canEdit ? 'bg-white' : 'bg-slate-50'}`}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={nonTesVal}
                                placeholder="-"
                                disabled={!canEdit}
                                onChange={(e) => handleLmScoreChange(student.id, num, 'nonTes', e.target.value)}
                                className={`w-full h-8 text-center text-xs font-semibold focus:outline-none ${
                                  canEdit ? 'focus:bg-blue-100 cursor-text' : 'cursor-not-allowed text-slate-500 bg-transparent'
                                }`}
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* SAS Inputs */}
                      <td className={`p-0 border-r border-slate-200 text-center ${canEdit ? 'bg-sky-50/30' : 'bg-slate-50'}`}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={assessment?.sasTes !== undefined ? assessment.sasTes : 85}
                          disabled={!canEdit}
                          onChange={(e) => handleSasScoreChange(student.id, 'sasTes', e.target.value)}
                          className={`w-full h-8 text-center text-xs font-semibold focus:outline-none ${
                            canEdit ? 'focus:bg-sky-100 cursor-text' : 'cursor-not-allowed text-slate-500 bg-transparent'
                          }`}
                        />
                      </td>
                      <td className={`p-0 border-r border-slate-200 text-center ${canEdit ? 'bg-sky-50/30' : 'bg-slate-50'}`}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={assessment?.sasNonTes !== undefined ? assessment.sasNonTes : 85}
                          disabled={!canEdit}
                          onChange={(e) => handleSasScoreChange(student.id, 'sasNonTes', e.target.value)}
                          className={`w-full h-8 text-center text-xs font-semibold focus:outline-none ${
                            canEdit ? 'focus:bg-sky-100 cursor-text' : 'cursor-not-allowed text-slate-500 bg-transparent'
                          }`}
                        />
                      </td>

                      {/* Final Score */}
                      <td className="py-2 px-2 text-center font-bold text-sm bg-amber-100 text-amber-950">
                        {finalScore || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

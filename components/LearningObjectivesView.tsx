'use client';

import React, { useState } from 'react';
import { Target, Save, CheckCircle2, ArrowLeft, Plus, Trash2, Info, BookOpen } from 'lucide-react';
import { LearningObjective, MaterialScope, Subject } from '../types/raport';
import { defaultSubjects } from '../lib/initialData';

interface LearningObjectivesViewProps {
  subjects: Subject[];
  learningObjectives: LearningObjective[];
  materialScopes: MaterialScope[];
  onSaveObjectives: (tps: LearningObjective[]) => Promise<void>;
  onSaveMaterialScopes: (lms: MaterialScope[]) => Promise<void>;
  onBack: () => void;
}

export const LearningObjectivesView: React.FC<LearningObjectivesViewProps> = ({
  subjects = defaultSubjects,
  learningObjectives,
  materialScopes,
  onSaveObjectives,
  onSaveMaterialScopes,
  onBack,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'agama');
  const [religionTab, setReligionTab] = useState<'Kristen' | 'Islam' | 'Katolik'>('Kristen');
  const [tpsState, setTpsState] = useState<LearningObjective[]>([...learningObjectives]);
  const [lmsState, setLmsState] = useState<MaterialScope[]>([...materialScopes]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Filter current subject's TPs and LMs
  const currentTps = tpsState.filter((tp) => {
    if (tp.subjectId !== selectedSubjectId) return false;
    if (selectedSubjectId === 'agama') {
      return tp.religionTarget === religionTab;
    }
    return true;
  }).sort((a, b) => a.tpNumber - b.tpNumber);

  const currentLms = lmsState.filter(
    (lm) => lm.subjectId === selectedSubjectId
  ).sort((a, b) => a.lmNumber - b.lmNumber);

  const handleUpdateTp = (tpId: string, description: string) => {
    setTpsState((prev) =>
      prev.map((t) => (t.id === tpId ? { ...t, description } : t))
    );
    setSaveSuccess(false);
  };

  const handleAddTp = () => {
    const nextNum = currentTps.length > 0 ? Math.max(...currentTps.map((t) => t.tpNumber)) + 1 : 1;
    const newTp: LearningObjective = {
      id: `tp-${selectedSubjectId}-${Date.now()}`,
      subjectId: selectedSubjectId,
      tpNumber: nextNum,
      tpCode: `TP ${nextNum}`,
      description: `Tujuan Pembelajaran ${nextNum} ${selectedSubject.name}`,
      religionTarget: selectedSubjectId === 'agama' ? religionTab : undefined,
    };
    setTpsState((prev) => [...prev, newTp]);
    setSaveSuccess(false);
  };

  const handleDeleteTp = (tpId: string) => {
    setTpsState((prev) => prev.filter((t) => t.id !== tpId));
    setSaveSuccess(false);
  };

  const handleUpdateLm = (lmId: string, title: string) => {
    setLmsState((prev) =>
      prev.map((l) => (l.id === lmId ? { ...l, title } : l))
    );
    setSaveSuccess(false);
  };

  const handleAddLm = () => {
    const nextNum = currentLms.length > 0 ? Math.max(...currentLms.map((l) => l.lmNumber)) + 1 : 1;
    const newLm: MaterialScope = {
      id: `lm-${selectedSubjectId}-${Date.now()}`,
      subjectId: selectedSubjectId,
      lmNumber: nextNum,
      lmCode: `LM ${nextNum}`,
      title: `Lingkup Materi ${nextNum}`,
    };
    setLmsState((prev) => [...prev, newLm]);
    setSaveSuccess(false);
  };

  const handleDeleteLm = (lmId: string) => {
    setLmsState((prev) => prev.filter((l) => l.id !== lmId));
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveObjectives(tpsState);
      await onSaveMaterialScopes(lmsState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
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
              <Target className="w-6 h-6 text-amber-700" />
              Alur Tujuan Pembelajaran (ATP) & Lingkup Materi (LM)
            </h1>
            <p className="text-xs text-slate-500">
              Tuliskan deskripsi Tujuan Pembelajaran yang diajarkan. Deskripsi ini otomatis menjadi kalimat Capaian Kompetensi di Lembar Rapor.
            </p>
          </div>
        </div>

        <button
          id="btn-save-tp"
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Tersimpan di Cloud!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </>
          )}
        </button>
      </div>

      {/* Subject Navigation Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSubjectId === sub.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 opacity-80" />
              <span>{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab for Religion if Agama is selected */}
      {selectedSubjectId === 'agama' && (
        <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-200">
          <span className="text-xs font-bold text-amber-900 px-2">Pilih Agama:</span>
          {(['Kristen', 'Islam', 'Katolik'] as const).map((rel) => (
            <button
              key={rel}
              onClick={() => setReligionTab(rel)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                religionTab === rel
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-amber-900 hover:bg-amber-100'
              }`}
            >
              Pendidikan Agama {rel}
            </button>
          ))}
        </div>
      )}

      {/* Side-by-side Table: TP on Left (Orange Header) & LM on Right (Yellow Header) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns: ALUR TUJUAN PEMBELAJARAN */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-amber-200 to-amber-100 px-4 py-3 border-b border-amber-300 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-800" />
                Alur Tujuan Pembelajaran ({selectedSubject.name})
              </h3>
              <p className="text-[11px] text-amber-800">
                Deskripsi TP yang dituliskan akan menjadi deskripsi otomatis di Rapor
              </p>
            </div>
            <button
              id="btn-add-tp"
              onClick={handleAddTp}
              className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah TP
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-950 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">No</th>
                    <th className="py-2.5 px-4">Tujuan Pembelajaran (TP)</th>
                    <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTps.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Belum ada Tujuan Pembelajaran untuk mata pelajaran ini.
                      </td>
                    </tr>
                  ) : (
                    currentTps.map((tp, idx) => (
                      <tr key={tp.id} className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200 bg-slate-50/50">
                          {tp.tpNumber || idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <textarea
                            rows={2}
                            value={tp.description}
                            onChange={(e) => handleUpdateTp(tp.id, e.target.value)}
                            placeholder={`Tuliskan Tujuan Pembelajaran ${idx + 1}...`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 text-xs outline-none resize-none font-medium"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleDeleteTp(tp.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus TP"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: LINGKUP MATERI */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-yellow-200 to-amber-100 px-4 py-3 border-b border-yellow-300 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-800" />
                Lingkup Materi (LM)
              </h3>
              <p className="text-[11px] text-amber-800">
                Pokok bahasan untuk Asesmen Sumatif
              </p>
            </div>
            <button
              id="btn-add-lm"
              onClick={handleAddLm}
              className="px-2.5 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah LM
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-yellow-50 text-amber-950 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">No</th>
                    <th className="py-2.5 px-4">Lingkup Materi Pelajaran</th>
                    <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLms.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Belum ada Lingkup Materi untuk mata pelajaran ini.
                      </td>
                    </tr>
                  ) : (
                    currentLms.map((lm, idx) => (
                      <tr key={lm.id} className="hover:bg-yellow-50/30">
                        <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200 bg-slate-50/50">
                          {lm.lmNumber || idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <input
                            type="text"
                            value={lm.title}
                            onChange={(e) => handleUpdateLm(lm.id, e.target.value)}
                            placeholder={`Contoh: Siklus Air / Aljabar ${idx + 1}...`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-800 text-xs outline-none font-medium"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleDeleteLm(lm.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus LM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Catatan Kurikulum Merdeka:</strong> Tuliskan lingkup materi pelajaran yang diajarkan pada semester ini. Contoh: <em>Bilangan Bulat, Siklus Air, Teks Deskripsi</em>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

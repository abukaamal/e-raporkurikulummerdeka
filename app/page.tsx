'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { HeaderNav } from '../components/HeaderNav';
import { MainMenuGrid } from '../components/MainMenuGrid';
import { SchoolProfileView } from '../components/SchoolProfileView';
import { StudentManagementView } from '../components/StudentManagementView';
import { LearningObjectivesView } from '../components/LearningObjectivesView';
import { FormatifAssessmentView } from '../components/FormatifAssessmentView';
import { SumatifAssessmentView } from '../components/SumatifAssessmentView';
import { RekapNilaiView } from '../components/RekapNilaiView';
import { SampulRaporView } from '../components/SampulRaporView';
import { NilaiRaporView } from '../components/NilaiRaporView';
import { BukuIndukView } from '../components/BukuIndukView';
import { MutasiView } from '../components/MutasiView';
import { ParentPortalView } from '../components/ParentPortalView';
import { LoginModal } from '../components/LoginModal';
import { StudentPortalDashboard } from '../components/StudentPortalDashboard';
import { LandingLoginView } from '../components/LandingLoginView';

import {
  SchoolProfile,
  Student,
  Subject,
  LearningObjective,
  MaterialScope,
  FormatifAssessment,
  SumatifAssessment,
  ViewTab,
  AuthUser,
} from '../types/raport';
import {
  initialSchoolProfile,
  defaultSubjects,
  defaultLearningObjectives,
  defaultMaterialScopes,
  sampleStudents,
} from '../lib/initialData';
import { RaportService } from '../lib/raportDb';
import { Sparkles, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { swalConfirm, swalSuccess, swalToast } from '../lib/sweetAlert';

const emptySubscribe = () => () => {};

export default function RaportApp() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  // Authentication & Role State (Admin, Guru, Siswa)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // App Data State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(initialSchoolProfile);
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [subjects] = useState<Subject[]>(defaultSubjects);
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>(defaultLearningObjectives);
  const [materialScopes, setMaterialScopes] = useState<MaterialScope[]>(defaultMaterialScopes);
  const [formatifAssessments, setFormatifAssessments] = useState<Record<string, FormatifAssessment>>({});
  const [sumatifAssessments, setSumatifAssessments] = useState<Record<string, SumatifAssessment>>({});
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize DB and subscribe to real-time streams
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initData = async () => {
      try {
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem('erapor_authenticated_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.role) {
                setCurrentUser(parsed);
              }
            }
          } catch {}
        }

        await RaportService.seedInitialData();

        // 1. Subscribe to School Profile
        const unsubProfile = RaportService.subscribeSchoolProfile((profile) => {
          if (profile) setSchoolProfile(profile);
        });
        unsubs.push(unsubProfile);

        // 2. Subscribe to Students
        const unsubStudents = RaportService.subscribeStudents((stList) => {
          if (stList && stList.length > 0) setStudents(stList);
        });
        unsubs.push(unsubStudents);

        // 3. Subscribe to Learning Objectives
        const unsubTps = RaportService.subscribeLearningObjectives((tpList) => {
          if (tpList && tpList.length > 0) setLearningObjectives(tpList);
        });
        unsubs.push(unsubTps);

        // 4. Subscribe to Material Scopes
        const unsubLms = RaportService.subscribeMaterialScopes((lmList) => {
          if (lmList && lmList.length > 0) setMaterialScopes(lmList);
        });
        unsubs.push(unsubLms);

        // 5. Subscribe to Formatif Assessments
        const unsubFormatif = RaportService.subscribeFormatifScores((formatifMap) => {
          if (formatifMap) setFormatifAssessments(formatifMap);
        });
        unsubs.push(unsubFormatif);

        // 6. Subscribe to Sumatif Assessments
        const unsubSumatif = RaportService.subscribeSumatifScores((sumatifMap) => {
          if (sumatifMap) setSumatifAssessments(sumatifMap);
        });
        unsubs.push(unsubSumatif);

        // 7. Subscribe to Classes
        const unsubClasses = RaportService.subscribeClasses((clsList) => {
          if (clsList && clsList.length > 0) {
            // Keep classes updated
          }
        });
        unsubs.push(unsubClasses);

      } catch (error) {
        console.error('Error during data initialization:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initData();

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  }, []);

  // Handlers for Data Mutation
  const handleSaveProfile = async (newProfile: SchoolProfile) => {
    setSchoolProfile(newProfile);
    await RaportService.updateSchoolProfile(newProfile);
    showToast('Identitas sekolah berhasil diperbarui secara real-time.');
  };

  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent].sort((a, b) => a.noUrut - b.noUrut));
    await RaportService.addStudent(newStudent);
    showToast(`Data siswa "${newStudent.name}" berhasil ditambahkan.`);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)).sort((a, b) => a.noUrut - b.noUrut)
    );
    await RaportService.updateStudent(updatedStudent);
    showToast(`Data siswa "${updatedStudent.name}" berhasil diperbarui.`);
  };

  const handleDeleteStudent = async (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    await RaportService.deleteStudent(studentId);
    showToast(`Data siswa "${target?.name || ''}" telah dihapus.`);
  };

  const handleSaveLearningObjectives = async (tps: LearningObjective[]) => {
    setLearningObjectives(tps);
    await RaportService.saveLearningObjectives(tps);
    showToast('Daftar Alur Tujuan Pembelajaran (TP) berhasil disimpan.');
  };

  const handleSaveMaterialScopes = async (lms: MaterialScope[]) => {
    setMaterialScopes(lms);
    await RaportService.saveMaterialScopes(lms);
    showToast('Daftar Lingkup Materi (LM) berhasil disimpan.');
  };

  const handleSaveFormatif = async (assessment: FormatifAssessment) => {
    setFormatifAssessments((prev) => ({
      ...prev,
      [assessment.id]: assessment,
    }));
    await RaportService.saveFormatifAssessment(assessment);
    showToast('Nilai Asesmen Formatif berhasil disimpan.');
  };

  const handleSaveSumatif = async (assessment: SumatifAssessment) => {
    setSumatifAssessments((prev) => ({
      ...prev,
      [assessment.id]: assessment,
    }));
    await RaportService.saveSumatifAssessment(assessment);
    showToast('Nilai Asesmen Sumatif berhasil disimpan.');
  };

  const handleOpenReportCard = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('nilai-rapor');
  };

  const handleResetData = async () => {
    const confirmed = await swalConfirm({
      title: 'Reset & Muat Ulang Data Contoh?',
      text: 'Seluruh data contoh awal (SMP MEFENG, daftar siswa, TP, LM, nilai formatif & sumatif) akan diset ulang ke kondisi awal.',
      confirmButtonText: 'Ya, Reset Data',
      cancelButtonText: 'Batal',
      icon: 'warning',
      isDangerous: true,
    });

    if (confirmed) {
      localStorage.clear();
      await RaportService.seedInitialData(true);
      swalToast('Data berhasil di-reset ke kondisi awal', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleUserLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('erapor_authenticated_user', JSON.stringify(user));
      } catch {}
    }
    if (user.role === 'siswa') {
      setCurrentTab('portal-ortu');
    } else {
      setCurrentTab('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('erapor_authenticated_user');
      } catch {}
    }
    setIsLoginModalOpen(false);
  };

  // Prevent SSR Hydration mismatch by rendering a matching placeholder on initial mount
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Memuat Sistem E-Rapor...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display the Landing Login Screen with School Logo, School Name, and Login Gate
  if (!currentUser) {
    return (
      <LandingLoginView
        schoolProfile={schoolProfile}
        students={students}
        onLoginSuccess={handleUserLogin}
      />
    );
  }

  // Find active student if in student role
  const activeStudent =
    currentUser.role === 'siswa'
      ? students.find(
          (s) => s.id === currentUser.studentId || s.nisn === currentUser.nisn || s.id === currentUser.id
        ) || students[0]
      : undefined;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-amber-500 selection:text-white print:bg-white print:min-h-0">
      {/* Top Navbar */}
      <div className="print:hidden sticky top-0 z-50">
        <HeaderNav
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
          }}
          schoolProfile={schoolProfile}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          currentSemester={schoolProfile.semester}
          onSemesterChange={(newSem) => {
            const defaultDate =
              newSem.includes('2') || newSem.toLowerCase().includes('genap')
                ? '21 Juni 2024'
                : '22 Desember 2023';
            handleSaveProfile({
              ...schoolProfile,
              semester: newSem,
              tanggalRapor: defaultDate,
              reportDate: defaultDate,
              tempatTanggalRapor: `${schoolProfile.tempatRapor || 'Halmahera Selatan'}, ${defaultDate}`,
            });
          }}
          onResetData={currentUser.role === 'admin' ? handleResetData : undefined}
        />
      </div>

      {/* Realtime Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        students={students}
        schoolName={schoolProfile.namaSekolah}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none">
        {/* TAMPILAN KHUSUS SISWA (NISN) */}
        {currentUser.role === 'siswa' && activeStudent ? (
          <StudentPortalDashboard
            currentUser={currentUser}
            student={activeStudent}
            schoolProfile={schoolProfile}
            subjects={subjects}
            learningObjectives={learningObjectives}
            materialScopes={materialScopes}
            formatifAssessments={formatifAssessments}
            sumatifAssessments={sumatifAssessments}
            onLogout={handleLogout}
          />
        ) : (
          /* TAMPILAN GURU & ADMINISTRATOR */
          <>
            {currentTab === 'home' && (
              <MainMenuGrid
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                }}
                schoolProfile={schoolProfile}
                students={students}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'identitas-sekolah' && (
              <SchoolProfileView
                profile={schoolProfile}
                currentUser={currentUser}
                onSave={handleSaveProfile}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'data-siswa' && (
              <StudentManagementView
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onBack={() => setCurrentTab('home')}
                onOpenReportCard={handleOpenReportCard}
              />
            )}

            {currentTab === 'tujuan-pembelajaran' && (
              <LearningObjectivesView
                subjects={subjects}
                learningObjectives={learningObjectives}
                materialScopes={materialScopes}
                onSaveObjectives={handleSaveLearningObjectives}
                onSaveMaterialScopes={handleSaveMaterialScopes}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'nilai-formatif' && (
              <FormatifAssessmentView
                students={students}
                subjects={subjects}
                learningObjectives={learningObjectives}
                formatifAssessments={formatifAssessments}
                currentUser={currentUser}
                onSaveAssessment={handleSaveFormatif}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'nilai-sumatif' && (
              <SumatifAssessmentView
                students={students}
                subjects={subjects}
                materialScopes={materialScopes}
                sumatifAssessments={sumatifAssessments}
                currentUser={currentUser}
                onSaveAssessment={handleSaveSumatif}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'rekap-nilai' && (
              <RekapNilaiView
                students={students}
                subjects={subjects}
                schoolConfig={schoolProfile}
                formatifAssessments={formatifAssessments}
                sumatifAssessments={sumatifAssessments}
                onBack={() => setCurrentTab('home')}
                onSelectStudent={(stId) => handleOpenReportCard(stId)}
              />
            )}

            {currentTab === 'sampul-rapor' && (
              <SampulRaporView
                students={students}
                schoolConfig={schoolProfile}
                selectedStudentId={selectedStudentId}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'nilai-rapor' && (
              <NilaiRaporView
                students={students}
                subjects={subjects}
                learningObjectives={learningObjectives}
                materialScopes={materialScopes}
                formatifAssessments={formatifAssessments}
                sumatifAssessments={sumatifAssessments}
                schoolConfig={schoolProfile}
                selectedStudentId={selectedStudentId}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'buku-induk' && (
              <BukuIndukView
                students={students}
                subjects={subjects}
                learningObjectives={learningObjectives}
                materialScopes={materialScopes}
                formatifAssessments={formatifAssessments}
                sumatifAssessments={sumatifAssessments}
                schoolConfig={schoolProfile}
                selectedStudentId={selectedStudentId}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'mutasi' && (
              <MutasiView
                students={students}
                schoolConfig={schoolProfile}
                selectedStudentId={selectedStudentId}
                onBack={() => setCurrentTab('home')}
              />
            )}

            {currentTab === 'portal-ortu' && (
              <ParentPortalView
                students={students}
                subjects={subjects}
                learningObjectives={learningObjectives}
                formatifAssessments={formatifAssessments}
                sumatifAssessments={sumatifAssessments}
                schoolConfig={schoolProfile}
                onOpenReportCard={(stId) => {
                  setSelectedStudentId(stId);
                  setCurrentTab('nilai-rapor');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-8 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              E-Rapor Kurikulum Merdeka Terintegrasi • Sesuai Panduan Pembelajaran & Asesmen (PPA) Kemendikbudristek
            </span>
          </div>
          <p className="text-slate-400">
            {schoolProfile.namaSekolah} • Tahun Pelajaran {schoolProfile.tahunPelajaran} (Semester {schoolProfile.semester})
          </p>
        </div>
      </footer>
    </div>
  );
}

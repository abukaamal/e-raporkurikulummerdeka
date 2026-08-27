import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SchoolProfile,
  Student,
  LearningObjective,
  MaterialScope,
  FormatifAssessment,
  SumatifAssessment,
  Subject,
  Teacher,
  ClassRoom,
} from '../types/raport';
import {
  initialSchoolProfile,
  defaultSubjects,
  defaultLearningObjectives,
  defaultMaterialScopes,
  sampleStudents,
  defaultTeachers,
  defaultClasses,
  initialSampleFormatifData,
  initialSampleSumatifData,
} from './initialData';

const LOCAL_STORAGE_KEYS = {
  PROFILE: 'erapor_school_profile',
  STUDENTS: 'erapor_students',
  CLASSES: 'erapor_classes',
  TPS: 'erapor_learning_objectives',
  LMS: 'erapor_material_scopes',
  FORMATIF: 'erapor_formatif_scores',
  SUMATIF: 'erapor_sumatif_scores',
  ADMIN_PWD: 'erapor_admin_password',
  TEACHERS: 'erapor_teachers',
  SEEDED: 'erapor_seeded_v1',
};

// Helper for local storage
const getLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
};

export class RaportService {
  // 1. Initial Seeding
  static async seedInitialData(force = false): Promise<void> {
    try {
      const isSeededLocal = getLocal(LOCAL_STORAGE_KEYS.SEEDED, false);
      if (isSeededLocal && !force) return;

      // Seed local storage first for instant render
      setLocal(LOCAL_STORAGE_KEYS.PROFILE, initialSchoolProfile);
      setLocal(LOCAL_STORAGE_KEYS.STUDENTS, sampleStudents);
      setLocal(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
      setLocal(LOCAL_STORAGE_KEYS.TPS, defaultLearningObjectives);
      setLocal(LOCAL_STORAGE_KEYS.LMS, defaultMaterialScopes);
      setLocal(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
      if (!getLocal(LOCAL_STORAGE_KEYS.ADMIN_PWD, '')) {
        setLocal(LOCAL_STORAGE_KEYS.ADMIN_PWD, 'admin123');
      }

      // Seed formatif & sumatif
      const formatifRecords: Record<string, FormatifAssessment> = {};
      sampleStudents.forEach((student) => {
        defaultSubjects.forEach((sub) => {
          const key = `${student.id}_${sub.id}`;
          const existingScores = initialSampleFormatifData[student.id]?.[sub.id] || { 1: 85, 2: 88, 3: 86, 4: 90, 5: 87 };
          const scoresArr = Object.values(existingScores);
          const avg = scoresArr.length ? Math.round(scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length) : 0;
          
          formatifRecords[key] = {
            id: key,
            studentId: student.id,
            subjectId: sub.id,
            scores: existingScores,
            finalScore: avg,
          };
        });
      });
      setLocal(LOCAL_STORAGE_KEYS.FORMATIF, formatifRecords);

      const sumatifRecords: Record<string, SumatifAssessment> = {};
      sampleStudents.forEach((student) => {
        defaultSubjects.forEach((sub) => {
          const key = `${student.id}_${sub.id}`;
          const existing = initialSampleSumatifData[student.id]?.[sub.id] || {
            lm: { 1: { tes: 85, nonTes: 88 }, 2: { tes: 86, nonTes: 89 } },
            sasTes: 88,
            sasNonTes: 88,
          };
          sumatifRecords[key] = {
            id: key,
            studentId: student.id,
            subjectId: sub.id,
            lmScores: existing.lm,
            sasTes: existing.sasTes,
            sasNonTes: existing.sasNonTes,
            finalScore: 88,
          };
        });
      });
      setLocal(LOCAL_STORAGE_KEYS.SUMATIF, sumatifRecords);

      setLocal(LOCAL_STORAGE_KEYS.SEEDED, true);

      // Try syncing to Firestore in background
      try {
        const profileRef = doc(db, 'settings', 'schoolProfile');
        await setDoc(profileRef, initialSchoolProfile, { merge: true });

        const adminRef = doc(db, 'settings', 'adminAuth');
        await setDoc(adminRef, { password: getLocal(LOCAL_STORAGE_KEYS.ADMIN_PWD, 'admin123') }, { merge: true });

        const batch = writeBatch(db);
        sampleStudents.forEach((st) => {
          const stRef = doc(db, 'students', st.id);
          batch.set(stRef, st, { merge: true });
        });
        defaultTeachers.forEach((t) => {
          const tRef = doc(db, 'teachers', t.id);
          batch.set(tRef, t, { merge: true });
        });
        await batch.commit();
      } catch (fErr) {
        console.warn('Firestore initial seeding sync skipped or failed (using offline local)', fErr);
      }
    } catch (err) {
      console.error('Error in seedInitialData', err);
    }
  }

  // 1b. Admin Password Management
  static async getAdminPassword(): Promise<string> {
    const cached = getLocal<string>(LOCAL_STORAGE_KEYS.ADMIN_PWD, 'admin123');
    try {
      const docRef = doc(db, 'settings', 'adminAuth');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.password) {
        const pwd = snap.data().password;
        setLocal(LOCAL_STORAGE_KEYS.ADMIN_PWD, pwd);
        return pwd;
      }
    } catch (e) {
      console.warn('Using cached admin password', e);
    }
    return cached;
  }

  static async setAdminPassword(newPassword: string): Promise<void> {
    setLocal(LOCAL_STORAGE_KEYS.ADMIN_PWD, newPassword);
    try {
      const docRef = doc(db, 'settings', 'adminAuth');
      await setDoc(docRef, { password: newPassword }, { merge: true });
    } catch (err) {
      console.warn('Firestore setAdminPassword fallback', err);
    }
  }

  // 1c. Teachers Management (Database Guru & Wali Kelas)
  static subscribeTeachers(callback: (teachers: Teacher[]) => void): () => void {
    const cached = getLocal<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
    callback(cached);

    try {
      const colRef = collection(db, 'teachers');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list: Teacher[] = [];
            snap.forEach((d) => list.push(d.data() as Teacher));
            setLocal(LOCAL_STORAGE_KEYS.TEACHERS, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore teachers onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static getTeachersSync(): Teacher[] {
    return getLocal<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
  }

  static async addTeacher(teacher: Teacher): Promise<void> {
    const current = getLocal<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
    const updated = [...current, teacher];
    setLocal(LOCAL_STORAGE_KEYS.TEACHERS, updated);

    try {
      const docRef = doc(db, 'teachers', teacher.id);
      await setDoc(docRef, teacher);
    } catch (err) {
      console.warn('Firestore addTeacher fallback', err);
    }
  }

  static async updateTeacher(teacher: Teacher): Promise<void> {
    const current = getLocal<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
    const updated = current.map((t) => (t.id === teacher.id ? teacher : t));
    setLocal(LOCAL_STORAGE_KEYS.TEACHERS, updated);

    try {
      const docRef = doc(db, 'teachers', teacher.id);
      await setDoc(docRef, teacher, { merge: true });
    } catch (err) {
      console.warn('Firestore updateTeacher fallback', err);
    }
  }

  static async deleteTeacher(teacherId: string): Promise<void> {
    const current = getLocal<Teacher[]>(LOCAL_STORAGE_KEYS.TEACHERS, defaultTeachers);
    const updated = current.filter((t) => t.id !== teacherId);
    setLocal(LOCAL_STORAGE_KEYS.TEACHERS, updated);

    try {
      const docRef = doc(db, 'teachers', teacherId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteTeacher fallback', err);
    }
  }

  // 1d. Class Rooms Management (Daftar Kelas & Rombongan Belajar)
  static subscribeClasses(callback: (classes: ClassRoom[]) => void): () => void {
    const cached = getLocal<ClassRoom[]>(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
    callback(cached);

    try {
      const colRef = collection(db, 'classes');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list: ClassRoom[] = [];
            snap.forEach((d) => list.push(d.data() as ClassRoom));
            setLocal(LOCAL_STORAGE_KEYS.CLASSES, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore classes onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static getClassesSync(): ClassRoom[] {
    return getLocal<ClassRoom[]>(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
  }

  static async addClass(newClass: ClassRoom): Promise<void> {
    const current = getLocal<ClassRoom[]>(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
    const updated = [...current, newClass];
    setLocal(LOCAL_STORAGE_KEYS.CLASSES, updated);

    try {
      const docRef = doc(db, 'classes', newClass.id);
      await setDoc(docRef, newClass);
    } catch (err) {
      console.warn('Firestore addClass fallback', err);
    }
  }

  static async updateClass(updatedClass: ClassRoom): Promise<void> {
    const current = getLocal<ClassRoom[]>(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
    const updated = current.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setLocal(LOCAL_STORAGE_KEYS.CLASSES, updated);

    try {
      const docRef = doc(db, 'classes', updatedClass.id);
      await setDoc(docRef, updatedClass, { merge: true });
    } catch (err) {
      console.warn('Firestore updateClass fallback', err);
    }
  }

  static async deleteClass(classId: string): Promise<void> {
    const current = getLocal<ClassRoom[]>(LOCAL_STORAGE_KEYS.CLASSES, defaultClasses);
    const updated = current.filter((c) => c.id !== classId);
    setLocal(LOCAL_STORAGE_KEYS.CLASSES, updated);

    try {
      const docRef = doc(db, 'classes', classId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteClass fallback', err);
    }
  }

  // 2. School Profile
  static subscribeSchoolProfile(callback: (profile: SchoolProfile) => void): () => void {
    let cached = getLocal<SchoolProfile>(LOCAL_STORAGE_KEYS.PROFILE, initialSchoolProfile);
    if (!cached || cached.namaSekolah === 'SMP NEGERI 14 MANADO' || cached.schoolName === 'SMP NEGERI 14 MANADO') {
      cached = { ...initialSchoolProfile, ...(cached || {}) };
      cached.namaSekolah = 'SMP MEFENG';
      cached.schoolName = 'SMP MEFENG';
      cached.npsn = '60203264';
      cached.alamatSekolah = 'JL. POROS NO.1 TRANS SP 2 LALUBI';
      cached.schoolAddress = 'JL. POROS NO.1 TRANS SP 2 LALUBI';
      cached.kecamatan = 'GANE TIMUR';
      cached.schoolSubdistrict = 'GANE TIMUR';
      cached.kabupatenKota = 'HALMAHERA SELATAN';
      cached.schoolCity = 'HALMAHERA SELATAN';
      cached.provinsi = 'MALUKU UTARA';
      cached.schoolProvince = 'MALUKU UTARA';
      cached.desaKelurahan = 'LALUBI';
      cached.schoolVillage = 'LALUBI';
      setLocal(LOCAL_STORAGE_KEYS.PROFILE, cached);
    }
    callback(cached);

    try {
      const docRef = doc(db, 'settings', 'schoolProfile');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as SchoolProfile;
            setLocal(LOCAL_STORAGE_KEYS.PROFILE, data);
            callback(data);
          }
        },
        (error) => {
          console.warn('Firestore schoolProfile onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async updateSchoolProfile(profile: SchoolProfile): Promise<void> {
    setLocal(LOCAL_STORAGE_KEYS.PROFILE, profile);
    try {
      const docRef = doc(db, 'settings', 'schoolProfile');
      await setDoc(docRef, profile, { merge: true });
    } catch (err) {
      console.warn('Firestore updateSchoolProfile offline fallback', err);
    }
  }

  // 3. Students (CRUD)
  static subscribeStudents(callback: (students: Student[]) => void): () => void {
    const cached = getLocal<Student[]>(LOCAL_STORAGE_KEYS.STUDENTS, sampleStudents);
    callback(cached.sort((a, b) => a.noUrut - b.noUrut));

    try {
      const colRef = collection(db, 'students');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list: Student[] = [];
            snap.forEach((d) => list.push(d.data() as Student));
            list.sort((a, b) => a.noUrut - b.noUrut);
            setLocal(LOCAL_STORAGE_KEYS.STUDENTS, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore students onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async addStudent(student: Student): Promise<void> {
    const current = getLocal<Student[]>(LOCAL_STORAGE_KEYS.STUDENTS, sampleStudents);
    const updated = [...current, student].sort((a, b) => a.noUrut - b.noUrut);
    setLocal(LOCAL_STORAGE_KEYS.STUDENTS, updated);

    try {
      const docRef = doc(db, 'students', student.id);
      await setDoc(docRef, student);
    } catch (err) {
      console.warn('Firestore addStudent offline fallback', err);
    }
  }

  static async updateStudent(student: Student): Promise<void> {
    const current = getLocal<Student[]>(LOCAL_STORAGE_KEYS.STUDENTS, sampleStudents);
    const updated = current.map((s) => (s.id === student.id ? student : s)).sort((a, b) => a.noUrut - b.noUrut);
    setLocal(LOCAL_STORAGE_KEYS.STUDENTS, updated);

    try {
      const docRef = doc(db, 'students', student.id);
      await setDoc(docRef, student, { merge: true });
    } catch (err) {
      console.warn('Firestore updateStudent offline fallback', err);
    }
  }

  static async deleteStudent(studentId: string): Promise<void> {
    const current = getLocal<Student[]>(LOCAL_STORAGE_KEYS.STUDENTS, sampleStudents);
    const updated = current.filter((s) => s.id !== studentId);
    setLocal(LOCAL_STORAGE_KEYS.STUDENTS, updated);

    try {
      const docRef = doc(db, 'students', studentId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteStudent offline fallback', err);
    }
  }

  // 4. Learning Objectives (TP)
  static subscribeLearningObjectives(callback: (tps: LearningObjective[]) => void): () => void {
    const cached = getLocal<LearningObjective[]>(LOCAL_STORAGE_KEYS.TPS, defaultLearningObjectives);
    callback(cached);

    try {
      const colRef = collection(db, 'learningObjectives');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list: LearningObjective[] = [];
            snap.forEach((d) => list.push(d.data() as LearningObjective));
            setLocal(LOCAL_STORAGE_KEYS.TPS, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore TPs onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async saveLearningObjectives(tps: LearningObjective[]): Promise<void> {
    setLocal(LOCAL_STORAGE_KEYS.TPS, tps);
    try {
      const batch = writeBatch(db);
      tps.forEach((tp) => {
        const docRef = doc(db, 'learningObjectives', tp.id);
        batch.set(docRef, tp, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore saveLearningObjectives offline fallback', err);
    }
  }

  // 5. Material Scopes (LM)
  static subscribeMaterialScopes(callback: (lms: MaterialScope[]) => void): () => void {
    const cached = getLocal<MaterialScope[]>(LOCAL_STORAGE_KEYS.LMS, defaultMaterialScopes);
    callback(cached);

    try {
      const colRef = collection(db, 'materialScopes');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const list: MaterialScope[] = [];
            snap.forEach((d) => list.push(d.data() as MaterialScope));
            setLocal(LOCAL_STORAGE_KEYS.LMS, list);
            callback(list);
          }
        },
        (error) => {
          console.warn('Firestore LMs onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async saveMaterialScopes(lms: MaterialScope[]): Promise<void> {
    setLocal(LOCAL_STORAGE_KEYS.LMS, lms);
    try {
      const batch = writeBatch(db);
      lms.forEach((lm) => {
        const docRef = doc(db, 'materialScopes', lm.id);
        batch.set(docRef, lm, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore saveMaterialScopes offline fallback', err);
    }
  }

  // 6. Formatif Assessments
  static subscribeFormatifScores(
    callback: (scores: Record<string, FormatifAssessment>) => void
  ): () => void {
    const cached = getLocal<Record<string, FormatifAssessment>>(LOCAL_STORAGE_KEYS.FORMATIF, {});
    callback(cached);

    try {
      const colRef = collection(db, 'formatifAssessments');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const map: Record<string, FormatifAssessment> = {};
            snap.forEach((d) => {
              const data = d.data() as FormatifAssessment;
              map[data.id] = data;
            });
            setLocal(LOCAL_STORAGE_KEYS.FORMATIF, map);
            callback(map);
          }
        },
        (error) => {
          console.warn('Firestore Formatif onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async saveFormatifAssessment(assessment: FormatifAssessment): Promise<void> {
    const current = getLocal<Record<string, FormatifAssessment>>(LOCAL_STORAGE_KEYS.FORMATIF, {});
    current[assessment.id] = assessment;
    setLocal(LOCAL_STORAGE_KEYS.FORMATIF, current);

    try {
      const docRef = doc(db, 'formatifAssessments', assessment.id);
      await setDoc(docRef, assessment, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFormatifAssessment offline fallback', err);
    }
  }

  // 7. Sumatif Assessments
  static subscribeSumatifScores(
    callback: (scores: Record<string, SumatifAssessment>) => void
  ): () => void {
    const cached = getLocal<Record<string, SumatifAssessment>>(LOCAL_STORAGE_KEYS.SUMATIF, {});
    callback(cached);

    try {
      const colRef = collection(db, 'sumatifAssessments');
      const unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const map: Record<string, SumatifAssessment> = {};
            snap.forEach((d) => {
              const data = d.data() as SumatifAssessment;
              map[data.id] = data;
            });
            setLocal(LOCAL_STORAGE_KEYS.SUMATIF, map);
            callback(map);
          }
        },
        (error) => {
          console.warn('Firestore Sumatif onSnapshot error', error);
        }
      );
      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  static async saveSumatifAssessment(assessment: SumatifAssessment): Promise<void> {
    const current = getLocal<Record<string, SumatifAssessment>>(LOCAL_STORAGE_KEYS.SUMATIF, {});
    current[assessment.id] = assessment;
    setLocal(LOCAL_STORAGE_KEYS.SUMATIF, current);

    try {
      const docRef = doc(db, 'sumatifAssessments', assessment.id);
      await setDoc(docRef, assessment, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSumatifAssessment offline fallback', err);
    }
  }
}

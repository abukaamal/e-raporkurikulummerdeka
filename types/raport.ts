export interface SchoolProfile {
  id?: string;
  namaSekolah: string;
  npsn: string;
  nss: string;
  alamatSekolah: string;
  kodePos: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  website: string;
  email: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaGuruKelas: string;
  nipGuruKelas: string;
  kelas: string;
  fase: string;
  semester: string;
  semesterAngka: number;
  tahunPelajaran: string;
  tempatTanggalRapor: string;
  tempatRapor: string;
  tanggalRapor: string;
  // Aliases for compatibility across views
  schoolName?: string;
  grade?: string;
  phase?: string;
  academicYear?: string;
  teacherName?: string;
  teacherNip?: string;
  principalName?: string;
  principalNip?: string;
  headmasterName?: string;
  headmasterNip?: string;
  schoolAddress?: string;
  schoolCity?: string;
  schoolSubdistrict?: string;
  schoolProvince?: string;
  schoolPostalCode?: string;
  schoolPhone?: string;
  schoolVillage?: string;
  schoolWebsite?: string;
  schoolEmail?: string;
  reportDate?: string;
  reportPlace?: string;
  logoUrl?: string;
  schoolLogo?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "VII-A"
  level?: string; // e.g. "VII", "7"
  phase?: string; // e.g. "Fase D"
  tingkat?: string;
  fase?: string;
  waliKelas?: string;
  nipWaliKelas?: string;
  ruangan?: string;
  tahunAjaran?: string;
  semester?: string;
  academicYear?: string;
  waliKelasId?: string;
  waliKelasName?: string;
  waliKelasNip?: string;
  roomName?: string;
  studentCount?: number;
}

export type SchoolConfig = SchoolProfile;

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'wajib' | 'pilihan' | 'mulok';
  subCategory?: string;
}

export interface LearningObjective {
  id: string;
  subjectId: string;
  tpNumber: number;
  tpCode: string;
  description: string;
  religionTarget?: 'Semua' | 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu';
}

export interface MaterialScope {
  id: string;
  subjectId: string;
  lmNumber: number;
  lmCode: string;
  title: string;
}

export interface Student {
  id: string;
  noUrut: number;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  birthPlace: string;
  birthDate: string;
  religion: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu';
  prevSchool: string;
  previousEducation?: string;
  studentAddress: string;
  kelas?: string;
  photoUrl?: string;
  avatar?: string;
  // Data Orang Tua
  parentFather: string;
  parentMother: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  jobFather: string;
  jobMother: string;
  fatherJob?: string;
  motherJob?: string;
  parentAddressRoad: string;
  parentAddressVillage: string;
  parentAddressDistrict: string;
  parentAddressCity: string;
  parentAddressProvince: string;
  // Detail Tambahan Biodata Resmi
  familyStatus?: string;
  statusKeluarga?: string;
  childOrder?: number | string;
  anakKe?: number | string;
  studentVillage?: string;
  desaKelurahan?: string;
  studentDistrict?: string;
  kecamatan?: string;
  studentPhone?: string;
  acceptedClass?: string;
  diterimaDiKelas?: string;
  acceptedDate?: string;
  diterimaTanggal?: string;
  parentAddress?: string;
  parentVillage?: string;
  parentDistrict?: string;
  parentPhone?: string;
  guardianPhone?: string;
  // Data Wali
  guardianName?: string;
  guardianJob?: string;
  guardianAddress?: string;
  phone?: string;
  // Kondisi Fisik & Kesehatan
  heightS1?: number;
  heightS2?: number;
  weightS1?: number;
  weightS2?: number;
  healthHearing?: string;
  healthVision?: string;
  healthTeeth?: string;
  // Prestasi
  achievementArt?: string;
  achievementSport?: string;
  achievementScience?: string;
  // Kehadiran
  attendanceSakit: number;
  attendanceIzin: number;
  attendanceAlpa: number;
  attendance?: { sick?: number; permission?: number; unexcused?: number };
  // Ekstrakurikuler
  ekskul1Name?: string;
  ekskul1Grade?: string;
  ekskul1Desc?: string;
  ekskul2Name?: string;
  ekskul2Grade?: string;
  ekskul2Desc?: string;
  ekskul3Name?: string;
  ekskul3Grade?: string;
  ekskul3Desc?: string;
  extracurriculars?: { name: string; predicate: string; description: string }[];
  // Catatan & Keputusan
  teacherNotes?: string;
  notes?: string;
  decision: 'Naik Kelas' | 'Tinggal di Kelas' | 'Lulus';
  decisionTargetClass: string;
}

export interface StudentScoreFormatif {
  [tpNumber: number]: number;
}

export interface FormatifAssessment {
  id: string;
  studentId: string;
  subjectId: string;
  scores: StudentScoreFormatif;
  finalScore: number;
  highestTpNum?: number;
  highestTpDesc?: string;
  lowestTpNum?: number;
  lowestTpDesc?: string;
}

export interface StudentScoreSumatifLM {
  [lmNumber: number]: {
    tes: number;
    nonTes: number;
  };
}

export interface SumatifAssessment {
  id: string;
  studentId: string;
  subjectId: string;
  lmScores: StudentScoreSumatifLM;
  sasTes: number;
  sasNonTes: number;
  finalScore: number;
}

export type ViewTab =
  | 'home'
  | 'identitas-sekolah'
  | 'data-siswa'
  | 'tujuan-pembelajaran'
  | 'nilai-formatif'
  | 'nilai-sumatif'
  | 'rekap-nilai'
  | 'sampul-rapor'
  | 'nilai-rapor'
  | 'buku-induk'
  | 'mutasi'
  | 'portal-ortu';

export type UserRole = 'admin' | 'guru' | 'siswa';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  nip: string;
  role: 'wali_kelas' | 'guru_mapel';
  assignedClass: string;
  subjectId?: string;
  isWaliKelas?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  nisn?: string;
  nis?: string;
  studentId?: string;
  isBelajarId?: boolean;
  schoolName?: string;
  className?: string;
  assignedClass?: string;
  isWaliKelas?: boolean;
}


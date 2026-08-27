import {
  Student,
  Subject,
  LearningObjective,
  FormatifAssessment,
  SumatifAssessment,
} from '../types/raport';
import { defaultSubjects } from './initialData';

export interface StudentReportCardRow {
  subject: Subject;
  nilaiFormatif: number;
  nilaiSumatif: number;
  nilaiAkhir: number;
  highestTpDesc: string;
  lowestTpDesc: string;
}

export interface StudentFullReport {
  student: Student;
  rows: StudentReportCardRow[];
  totalScore: number;
  averageScore: number;
  rank: number;
  totalStudents: number;
}

export function calculateFormatifStats(
  scores: Record<number, number>,
  tps: LearningObjective[],
  studentReligion?: string
): {
  average: number;
  highestTpNum?: number;
  highestTpDesc?: string;
  highestScore?: number;
  lowestTpNum?: number;
  lowestTpDesc?: string;
  lowestScore?: number;
} {
  const entries = Object.entries(scores).map(([tpNumStr, val]) => ({
    num: Number(tpNumStr),
    score: Number(val),
  })).filter(e => e.score > 0);

  if (entries.length === 0) {
    return { average: 0 };
  }

  const sum = entries.reduce((acc, curr) => acc + curr.score, 0);
  const average = Math.round(sum / entries.length);

  // Filter TPs applicable for student if subject has religion target
  const applicableTps = tps.filter(tp => {
    if (!tp.religionTarget || tp.religionTarget === 'Semua') return true;
    return tp.religionTarget === studentReligion;
  });

  // Sort by score
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const maxEntry = sorted[0];
  const minEntry = sorted[sorted.length - 1];

  const maxTpObj = applicableTps.find(t => t.tpNumber === maxEntry.num) || tps.find(t => t.tpNumber === maxEntry.num);
  const minTpObj = applicableTps.find(t => t.tpNumber === minEntry.num) || tps.find(t => t.tpNumber === minEntry.num);

  const highestTpDesc = maxTpObj ? `Sangat menguasai dalam ${maxTpObj.description}` : `Sangat menguasai dalam materi TP ${maxEntry.num}`;
  const lowestTpDesc = minTpObj ? `Perlu bimbingan dalam ${minTpObj.description}` : `Perlu bimbingan dalam materi TP ${minEntry.num}`;

  return {
    average,
    highestTpNum: maxEntry.num,
    highestScore: maxEntry.score,
    highestTpDesc,
    lowestTpNum: minEntry.num,
    lowestScore: minEntry.score,
    lowestTpDesc: (minEntry.score < maxEntry.score || entries.length > 1) ? lowestTpDesc : '',
  };
}

export function calculateSumatifFinal(assessment?: SumatifAssessment): number {
  if (!assessment) return 85;
  const lmValues: number[] = [];
  Object.values(assessment.lmScores || {}).forEach(item => {
    if (item.tes > 0) lmValues.push(item.tes);
    if (item.nonTes > 0) lmValues.push(item.nonTes);
  });

  const lmAvg = lmValues.length > 0 ? lmValues.reduce((a, b) => a + b, 0) / lmValues.length : 85;
  const sasAvg = ((assessment.sasTes || 85) + (assessment.sasNonTes || 85)) / 2;

  return Math.round((lmAvg * 0.6) + (sasAvg * 0.4));
}

export function generateAllStudentReports(
  students: Student[],
  subjects: Subject[],
  tps: LearningObjective[],
  formatifScores: Record<string, FormatifAssessment>,
  sumatifScores: Record<string, SumatifAssessment>
): StudentFullReport[] {
  const reports: Omit<StudentFullReport, 'rank'>[] = students.map((student) => {
    const rows: StudentReportCardRow[] = subjects.map((subject) => {
      const key = `${student.id}_${subject.id}`;
      const formatif = formatifScores[key];
      const sumatif = sumatifScores[key];

      const subjectTps = tps.filter((t) => t.subjectId === subject.id);
      const formatifStats = calculateFormatifStats(
        formatif?.scores || { 1: 85, 2: 85, 3: 88, 4: 86, 5: 87 },
        subjectTps,
        student.religion
      );

      const nFormatif = formatifStats.average || 85;
      const nSumatif = sumatif?.finalScore || calculateSumatifFinal(sumatif);
      const nilaiAkhir = Math.round((nFormatif * 0.5) + (nSumatif * 0.5));

      return {
        subject,
        nilaiFormatif: nFormatif,
        nilaiSumatif: nSumatif,
        nilaiAkhir,
        highestTpDesc: formatifStats.highestTpDesc || 'Menunjukkan penguasaan kompetensi dengan baik',
        lowestTpDesc: formatifStats.lowestTpDesc || '',
      };
    });

    const totalScore = rows.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
    const averageScore = rows.length > 0 ? Math.round((totalScore / rows.length) * 10) / 10 : 0;

    return {
      student,
      rows,
      totalScore,
      averageScore,
      totalStudents: students.length,
    };
  });

  // Calculate ranks
  const sortedReports = [...reports].sort((a, b) => b.totalScore - a.totalScore);
  const rankMap = new Map<string, number>();
  sortedReports.forEach((rep, idx) => {
    rankMap.set(rep.student.id, idx + 1);
  });

  return reports.map((rep) => ({
    ...rep,
    rank: rankMap.get(rep.student.id) || 1,
  }));
}

export interface RankedStudent {
  student: Student;
  subjectScores: Record<string, number>;
  totalScore: number;
  averageScore: number;
  rank: number;
}

export function computeStudentRekap(
  student: Student,
  subjects: Subject[],
  formatifScores: Record<string, FormatifAssessment>,
  sumatifScores: Record<string, SumatifAssessment>
): {
  subjectScores: Record<string, number>;
  totalScore: number;
  averageScore: number;
} {
  const subjectScores: Record<string, number> = {};
  let totalScore = 0;

  subjects.forEach((sub) => {
    const key = `${student.id}_${sub.id}`;
    const formatif = formatifScores[key];
    const sumatif = sumatifScores[key];

    const nFormatif = formatif?.finalScore || 85;
    const nSumatif = sumatif?.finalScore || calculateSumatifFinal(sumatif);
    const finalScore = Math.round((nFormatif * 0.5) + (nSumatif * 0.5));

    subjectScores[sub.id] = finalScore;
    totalScore += finalScore;
  });

  const averageScore = subjects.length > 0 ? Math.round((totalScore / subjects.length) * 10) / 10 : 0;

  return {
    subjectScores,
    totalScore,
    averageScore,
  };
}

export function calculateRankings(
  students: Student[],
  subjects: Subject[],
  formatifScores: Record<string, FormatifAssessment>,
  sumatifScores: Record<string, SumatifAssessment>
): RankedStudent[] {
  const list = students.map((student) => {
    const { subjectScores, totalScore, averageScore } = computeStudentRekap(
      student,
      subjects,
      formatifScores,
      sumatifScores
    );
    return {
      student,
      subjectScores,
      totalScore,
      averageScore,
      rank: 1,
    };
  });

  list.sort((a, b) => b.totalScore - a.totalScore);

  return list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

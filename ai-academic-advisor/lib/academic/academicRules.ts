// Academic Rule Engine — Deterministic calculations only
// No LLM calls here. Pure rule-based logic.

export interface SubjectData {
  id: string;
  name: string;
  marks: number;
  attendance: number;
  difficulty: 'Low' | 'Medium' | 'High';
  grade?: string;
}

export interface StudentProfileData {
  name: string;
  department: string;
  year: number;
  semester: number;
  studyHoursPerDay: number;
  targetGPA?: number;
  subjects: SubjectData[];
  interests: string[];
  careerGoal: string;
  learningStyle: string;
}

export type PerformanceStatus = 'Critical' | 'Needs Attention' | 'Average' | 'Strong';
export type AttendanceStatus = 'Critical' | 'Warning' | 'Good';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SubjectAnalysis {
  subject: SubjectData;
  performanceStatus: PerformanceStatus;
  attendanceStatus: AttendanceStatus;
  isWeak: boolean;
  isStrong: boolean;
  isCritical: boolean;
  hasAttendanceRisk: boolean;
  recommendedAction: string;
  strengthPoints: string[];
  weaknessPoints: string[];
}

export interface AcademicAnalysis {
  overallAverage: number;
  overallGrade: string;
  strongSubjects: SubjectData[];
  weakSubjects: SubjectData[];
  criticalSubjects: SubjectData[];
  attendanceRiskSubjects: SubjectData[];
  subjectAnalyses: SubjectAnalysis[];
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  riskSuggestions: string[];
  studyPriorities: StudyPriority[];
  aiInsight: string;
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  weight: number;
}

export interface StudyPriority {
  subject: string;
  hoursPerWeek: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
}

// ─── Configurable Thresholds ────────────────────────────────────────────────
export const THRESHOLDS = {
  marks: {
    critical: 50,
    needsAttention: 65,
    strong: 80,
  },
  attendance: {
    critical: 75,
    warning: 80,
  },
  risk: {
    medium: 30,
    high: 60,
  },
};

// ─── Mark Classification ─────────────────────────────────────────────────────
export function classifyMark(mark: number): PerformanceStatus {
  if (mark < THRESHOLDS.marks.critical) return 'Critical';
  if (mark < THRESHOLDS.marks.needsAttention) return 'Needs Attention';
  if (mark < THRESHOLDS.marks.strong) return 'Average';
  return 'Strong';
}

// ─── Attendance Classification ───────────────────────────────────────────────
export function classifyAttendance(attendance: number): AttendanceStatus {
  if (attendance < THRESHOLDS.attendance.critical) return 'Critical';
  if (attendance < THRESHOLDS.attendance.warning) return 'Warning';
  return 'Good';
}

// ─── Grade Calculation ───────────────────────────────────────────────────────
export function calculateGrade(mark: number): string {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B+';
  if (mark >= 60) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 40) return 'D';
  return 'F';
}

// ─── Overall Average ─────────────────────────────────────────────────────────
export function calculateOverallAverage(subjects: SubjectData[]): number {
  if (subjects.length === 0) return 0;
  const sum = subjects.reduce((acc, s) => acc + s.marks, 0);
  return Math.round((sum / subjects.length) * 10) / 10;
}

// ─── Subject Analysis ────────────────────────────────────────────────────────
export function analyzeSubject(subject: SubjectData): SubjectAnalysis {
  const performanceStatus = classifyMark(subject.marks);
  const attendanceStatus = classifyAttendance(subject.attendance);
  const isWeak = subject.marks < THRESHOLDS.marks.needsAttention;
  const isStrong = subject.marks >= THRESHOLDS.marks.strong;
  const isCritical = subject.marks < THRESHOLDS.marks.critical;
  const hasAttendanceRisk = subject.attendance < THRESHOLDS.attendance.warning;

  const strengthPoints: string[] = [];
  const weaknessPoints: string[] = [];
  let recommendedAction = '';

  // Determine strengths
  if (subject.marks >= THRESHOLDS.marks.strong) {
    strengthPoints.push(`Strong performance at ${subject.marks}%`);
  }
  if (subject.attendance >= 90) {
    strengthPoints.push(`Excellent attendance at ${subject.attendance}%`);
  } else if (subject.attendance >= THRESHOLDS.attendance.warning) {
    strengthPoints.push(`Good attendance at ${subject.attendance}%`);
  }

  // Determine weaknesses
  if (subject.marks < THRESHOLDS.marks.critical) {
    weaknessPoints.push(`Critical marks: ${subject.marks}% (below passing threshold)`);
  } else if (subject.marks < THRESHOLDS.marks.needsAttention) {
    weaknessPoints.push(`Below target marks: ${subject.marks}%`);
  }
  if (subject.attendance < THRESHOLDS.attendance.critical) {
    weaknessPoints.push(`Critical attendance: ${subject.attendance}% (below minimum ${THRESHOLDS.attendance.critical}%)`);
  } else if (subject.attendance < THRESHOLDS.attendance.warning) {
    weaknessPoints.push(`Attendance warning: ${subject.attendance}% (approaching minimum threshold)`);
  }
  if (subject.difficulty === 'High') {
    weaknessPoints.push('High difficulty subject requiring extra preparation');
  }

  // Recommended action
  if (isCritical && subject.attendance < THRESHOLDS.attendance.critical) {
    recommendedAction = `Urgently improve attendance and allocate significant daily study time to ${subject.name}. Consider seeking faculty guidance.`;
  } else if (isCritical) {
    recommendedAction = `Allocate maximum study priority to ${subject.name}. Practice previous exam questions and seek additional help.`;
  } else if (subject.attendance < THRESHOLDS.attendance.critical) {
    recommendedAction = `Prioritize attending all ${subject.name} classes to avoid shortage. Current attendance may affect exam eligibility.`;
  } else if (isWeak) {
    recommendedAction = `Allocate additional weekly study time and practice core ${subject.name} concepts. Focus on weak areas.`;
  } else if (hasAttendanceRisk) {
    recommendedAction = `Ensure consistent class attendance for ${subject.name} to maintain eligibility and reinforce learning.`;
  } else if (isStrong) {
    recommendedAction = `Maintain current performance in ${subject.name}. Consider exploring advanced topics to deepen expertise.`;
  } else {
    recommendedAction = `Continue steady effort in ${subject.name} and aim to strengthen conceptual understanding.`;
  }

  return {
    subject,
    performanceStatus,
    attendanceStatus,
    isWeak,
    isStrong,
    isCritical,
    hasAttendanceRisk,
    recommendedAction,
    strengthPoints,
    weaknessPoints,
  };
}

// ─── Academic Risk Calculation ───────────────────────────────────────────────
export function calculateAcademicRisk(subjects: SubjectData[]): {
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  riskSuggestions: string[];
} {
  let riskScore = 0;
  const riskFactors: RiskFactor[] = [];
  const riskSuggestions: string[] = [];

  const criticalAttendance = subjects.filter(s => s.attendance < THRESHOLDS.attendance.critical);
  const warningAttendance = subjects.filter(s => s.attendance >= THRESHOLDS.attendance.critical && s.attendance < THRESHOLDS.attendance.warning);
  const criticalMarks = subjects.filter(s => s.marks < THRESHOLDS.marks.critical);
  const weakMarks = subjects.filter(s => s.marks >= THRESHOLDS.marks.critical && s.marks < THRESHOLDS.marks.needsAttention);
  const overallAvg = calculateOverallAverage(subjects);

  // Attendance risk
  if (criticalAttendance.length > 0) {
    const weight = 30 * criticalAttendance.length;
    riskScore += weight;
    riskFactors.push({
      category: 'Attendance',
      description: `Critical attendance (below ${THRESHOLDS.attendance.critical}%) in: ${criticalAttendance.map(s => s.name).join(', ')}`,
      severity: 'high',
      weight,
    });
    riskSuggestions.push(`Attend all remaining classes for ${criticalAttendance.map(s => s.name).join(' and ')} to avoid exam debarment.`);
  }

  if (warningAttendance.length > 0) {
    const weight = 15 * warningAttendance.length;
    riskScore += weight;
    riskFactors.push({
      category: 'Attendance Warning',
      description: `Attendance approaching minimum threshold in: ${warningAttendance.map(s => s.name).join(', ')}`,
      severity: 'medium',
      weight,
    });
    riskSuggestions.push(`Improve attendance for ${warningAttendance.map(s => s.name).join(' and ')} to avoid critical zone.`);
  }

  // Performance risk
  if (criticalMarks.length > 0) {
    const weight = 35 * criticalMarks.length;
    riskScore += weight;
    riskFactors.push({
      category: 'Performance',
      description: `Marks below passing threshold in: ${criticalMarks.map(s => s.name).join(', ')}`,
      severity: 'high',
      weight,
    });
    riskSuggestions.push(`Prioritize intensive study for ${criticalMarks.map(s => s.name).join(' and ')}. Practice past exam questions.`);
  }

  if (weakMarks.length > 0) {
    const weight = 20 * Math.min(weakMarks.length, 2);
    riskScore += weight;
    riskFactors.push({
      category: 'Performance',
      description: `Below-target marks in: ${weakMarks.map(s => s.name).join(', ')}`,
      severity: 'medium',
      weight,
    });
    riskSuggestions.push(`Allocate additional study time for ${weakMarks.map(s => s.name).join(' and ')}.`);
  }

  // Overall average risk
  if (overallAvg < 50) {
    riskScore += 20;
    riskFactors.push({
      category: 'Overall Performance',
      description: `Overall academic average is critically low at ${overallAvg}%`,
      severity: 'high',
      weight: 20,
    });
    riskSuggestions.push('Develop a comprehensive study plan covering all subjects to improve overall performance.');
  } else if (overallAvg < 65) {
    riskScore += 10;
    riskFactors.push({
      category: 'Overall Performance',
      description: `Overall academic average of ${overallAvg}% is below target`,
      severity: 'medium',
      weight: 10,
    });
  }

  // Multiple weak subjects
  if (criticalMarks.length + weakMarks.length >= 3) {
    riskScore += 15;
    riskFactors.push({
      category: 'Multiple Weak Areas',
      description: 'Multiple subjects require immediate attention',
      severity: 'high',
      weight: 15,
    });
    riskSuggestions.push('Consider meeting with a faculty advisor to create a structured recovery plan.');
  }

  // General suggestions
  if (riskSuggestions.length === 0) {
    riskSuggestions.push('Maintain consistent study habits and class attendance.');
    riskSuggestions.push('Continue practicing in strong subjects and explore advanced topics.');
  }
  riskSuggestions.push('Consult with your faculty advisor for personalized academic guidance.');

  // Normalize score
  const normalizedScore = Math.min(100, riskScore);

  let riskLevel: RiskLevel;
  if (normalizedScore < THRESHOLDS.risk.medium) {
    riskLevel = 'LOW';
  } else if (normalizedScore < THRESHOLDS.risk.high) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  return { riskLevel, riskScore: normalizedScore, riskFactors, riskSuggestions };
}

// ─── Study Priority Generator ─────────────────────────────────────────────────
export function generateStudyPriorities(
  subjects: SubjectData[],
  hoursPerDay: number
): StudyPriority[] {
  const analyses = subjects.map(analyzeSubject);
  const weeklyHours = hoursPerDay * 7;

  // Sort by urgency: critical > attendance risk + weak > needs attention > average > strong
  const sorted = [...analyses].sort((a, b) => {
    const scoreA = getPriorityScore(a);
    const scoreB = getPriorityScore(b);
    return scoreB - scoreA;
  });

  const priorities: StudyPriority[] = [];
  let remainingHours = weeklyHours;

  for (const analysis of sorted) {
    if (remainingHours <= 0) break;

    const priorityLabel = getPriorityLabel(analysis);
    const hoursAllocation = getAllocationForPriority(priorityLabel, weeklyHours, sorted.length);
    const allocatedHours = Math.min(hoursAllocation, remainingHours);
    remainingHours -= allocatedHours;

    priorities.push({
      subject: analysis.subject.name,
      hoursPerWeek: Math.round(allocatedHours * 10) / 10,
      priority: priorityLabel,
      reason: getPriorityReason(analysis),
    });
  }

  return priorities;
}

function getPriorityScore(analysis: SubjectAnalysis): number {
  let score = 0;
  if (analysis.isCritical) score += 100;
  else if (analysis.isWeak) score += 60;
  else score += 20;
  if (analysis.hasAttendanceRisk) score += 30;
  if (analysis.subject.difficulty === 'High') score += 15;
  if (analysis.isStrong) score -= 30;
  return score;
}

function getPriorityLabel(analysis: SubjectAnalysis): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (analysis.isCritical || (analysis.isWeak && analysis.hasAttendanceRisk)) return 'Critical';
  if (analysis.isWeak || analysis.hasAttendanceRisk) return 'High';
  if (analysis.subject.marks < THRESHOLDS.marks.strong) return 'Medium';
  return 'Low';
}

function getAllocationForPriority(
  priority: 'Critical' | 'High' | 'Medium' | 'Low',
  weeklyHours: number,
  subjectCount: number
): number {
  const base = weeklyHours / subjectCount;
  switch (priority) {
    case 'Critical': return base * 2.0;
    case 'High': return base * 1.5;
    case 'Medium': return base * 1.0;
    case 'Low': return base * 0.5;
  }
}

function getPriorityReason(analysis: SubjectAnalysis): string {
  const { subject } = analysis;
  if (analysis.isCritical && analysis.hasAttendanceRisk) {
    return `${subject.name} requires urgent attention — both marks (${subject.marks}%) and attendance (${subject.attendance}%) are critically low.`;
  }
  if (analysis.isCritical) {
    return `${subject.name} marks (${subject.marks}%) are below the passing threshold and need immediate focused study.`;
  }
  if (analysis.isWeak && analysis.hasAttendanceRisk) {
    return `${subject.name} has below-target marks and attendance risk — consistent effort needed.`;
  }
  if (analysis.isWeak) {
    return `${subject.name} marks (${subject.marks}%) are below target — additional practice recommended.`;
  }
  if (analysis.hasAttendanceRisk) {
    return `${subject.name} attendance (${subject.attendance}%) is approaching the minimum threshold.`;
  }
  if (analysis.isStrong) {
    return `${subject.name} is performing well (${subject.marks}%) — maintain with light review.`;
  }
  return `${subject.name} is at an average level — consistent study will improve performance.`;
}

// ─── Full Academic Analysis ───────────────────────────────────────────────────
export function performFullAnalysis(profile: StudentProfileData): AcademicAnalysis {
  const { subjects } = profile;
  const overallAverage = calculateOverallAverage(subjects);
  const overallGrade = calculateGrade(overallAverage);

  const subjectAnalyses = subjects.map(analyzeSubject);

  const strongSubjects = subjects.filter(s => s.marks >= THRESHOLDS.marks.strong);
  const weakSubjects = subjects.filter(
    s => s.marks >= THRESHOLDS.marks.critical && s.marks < THRESHOLDS.marks.needsAttention
  );
  const criticalSubjects = subjects.filter(s => s.marks < THRESHOLDS.marks.critical);
  const attendanceRiskSubjects = subjects.filter(s => s.attendance < THRESHOLDS.attendance.warning);

  const { riskLevel, riskScore, riskFactors, riskSuggestions } = calculateAcademicRisk(subjects);
  const studyPriorities = generateStudyPriorities(subjects, profile.studyHoursPerDay);

  // Generate AI insight text (deterministic)
  let aiInsight = '';
  if (strongSubjects.length > 0) {
    aiInsight += `Your strongest area is ${strongSubjects.map(s => s.name).join(' and ')}. `;
  }
  if (criticalSubjects.length > 0) {
    aiInsight += `${criticalSubjects.map(s => s.name).join(' and ')} ${criticalSubjects.length === 1 ? 'requires' : 'require'} urgent attention with marks below the passing threshold. `;
  } else if (weakSubjects.length > 0) {
    aiInsight += `${weakSubjects.map(s => s.name).join(' and ')} ${weakSubjects.length === 1 ? 'needs' : 'need'} more attention. `;
  }
  if (attendanceRiskSubjects.length > 0) {
    aiInsight += `Attendance for ${attendanceRiskSubjects.map(s => s.name).join(' and ')} is approaching or below the minimum threshold — prioritize class attendance.`;
  }
  if (!aiInsight) {
    aiInsight = `Overall academic performance is ${overallGrade} with an average of ${overallAverage}%. Keep maintaining consistent study habits.`;
  }

  return {
    overallAverage,
    overallGrade,
    strongSubjects,
    weakSubjects,
    criticalSubjects,
    attendanceRiskSubjects,
    subjectAnalyses,
    riskLevel,
    riskScore,
    riskFactors,
    riskSuggestions,
    studyPriorities,
    aiInsight,
  };
}

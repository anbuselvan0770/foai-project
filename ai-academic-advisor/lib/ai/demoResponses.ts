// Demo Mode Responses — Deterministic fallbacks when no API key is configured
// These responses use real student data passed in and generate realistic responses

import {
  performFullAnalysis,
  type StudentProfileData,
  THRESHOLDS,
} from '../academic/academicRules'

export type ChatIntent =
  | 'PERFORMANCE_ANALYSIS'
  | 'STUDY_PLAN'
  | 'COURSE_RECOMMENDATION'
  | 'CAREER_GUIDANCE'
  | 'LEARNING_RESOURCE'
  | 'ATTENDANCE_RISK'
  | 'SUBJECT_ANALYSIS'
  | 'GENERAL_ACADEMIC_QUERY'

export function detectIntent(message: string): ChatIntent {
  const lower = message.toLowerCase()

  if (lower.match(/study plan|schedule|week|plan for|planning/)) return 'STUDY_PLAN'
  if (lower.match(/career|job|profession|become|work as/)) return 'CAREER_GUIDANCE'
  if (lower.match(/attend|class|absent|bunk|shortage/)) return 'ATTENDANCE_RISK'
  if (lower.match(/course|subject.*take|enroll|recommend.*course/)) return 'COURSE_RECOMMENDATION'
  if (lower.match(/resource|learn|video|tutorial|book|material/)) return 'LEARNING_RESOURCE'
  if (lower.match(/risk|danger|fail|struggling|at risk|academic risk/)) return 'PERFORMANCE_ANALYSIS'
  if (lower.match(/performance|marks|score|grade|average|gpa/)) return 'PERFORMANCE_ANALYSIS'
  if (lower.match(/focus|priorit|improve|weak|strength/)) return 'SUBJECT_ANALYSIS'

  return 'GENERAL_ACADEMIC_QUERY'
}

export function generateDemoResponse(
  message: string,
  profile: StudentProfileData
): string {
  const intent = detectIntent(message)
  const analysis = performFullAnalysis(profile)

  switch (intent) {
    case 'STUDY_PLAN':
      return generateStudyPlanResponse(profile, analysis)

    case 'CAREER_GUIDANCE':
      return generateCareerResponse(profile, analysis)

    case 'ATTENDANCE_RISK':
      return generateAttendanceResponse(profile, analysis)

    case 'COURSE_RECOMMENDATION':
      return generateCourseResponse(profile, analysis)

    case 'LEARNING_RESOURCE':
      return generateResourceResponse(profile, analysis)

    case 'PERFORMANCE_ANALYSIS':
      return generatePerformanceResponse(profile, analysis)

    case 'SUBJECT_ANALYSIS':
      return generateSubjectFocusResponse(profile, analysis)

    default:
      return generateGeneralResponse(profile, analysis)
  }
}

function generateStudyPlanResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  const priorities = analysis.studyPriorities.slice(0, 5)
  const hoursPerDay = profile.studyHoursPerDay

  let response = `📅 **Personalized Weekly Study Plan**\n\n`
  response += `Based on your ${hoursPerDay} hours/day availability and your current academic profile, here's what I recommend for this week:\n\n`

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  let dayIndex = 0

  for (const priority of priorities) {
    const day = days[dayIndex % days.length]
    const hours = Math.min(priority.hoursPerWeek / 2, hoursPerDay)
    response += `**${day}:** ${priority.subject} — ${hours} hours\n`
    response += `  _Priority: ${priority.priority}_ — ${priority.reason}\n\n`
    dayIndex++
  }

  response += `\n**Why this plan?**\n`
  if (analysis.criticalSubjects.length > 0) {
    response += `• ${analysis.criticalSubjects.map(s => s.name).join(', ')} need urgent attention with marks below passing threshold.\n`
  }
  if (analysis.weakSubjects.length > 0) {
    response += `• ${analysis.weakSubjects.map(s => s.name).join(', ')} require additional focus to reach your target performance.\n`
  }
  response += `\n> 📌 **Note:** Consult with your faculty advisor to validate this plan with your course schedule.`

  return response
}

function generateCareerResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  const career = profile.careerGoal || 'your chosen career'

  const careerSkills: Record<string, string[]> = {
    'Cloud Engineer': ['Linux', 'Networking', 'AWS/Azure/GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Python'],
    'AI Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'NLP', 'LLMs', 'Data Analysis'],
    'DevOps Engineer': ['Linux', 'CI/CD', 'Docker', 'Kubernetes', 'Infrastructure as Code', 'Monitoring'],
    'Software Engineer': ['Data Structures', 'System Design', 'OOP', 'Testing', 'Database Management'],
    'Data Scientist': ['Python/R', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL'],
    'Cyber Security Engineer': ['Networking', 'Linux', 'Cryptography', 'Ethical Hacking', 'Security Fundamentals'],
    'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Database Design', 'REST APIs'],
  }

  const skills = careerSkills[career] || ['Programming', 'Problem Solving', 'System Design', 'Communication']

  let response = `🎯 **Career Guidance: ${career}**\n\n`
  response += `Based on your academic profile and interests in ${profile.interests.join(', ')}, here's how your current studies align with your career goal:\n\n`

  response += `**Required Skills for ${career}:**\n`
  skills.forEach((skill, i) => {
    response += `${i + 1}. ${skill}\n`
  })

  response += `\n**Your Current Strengths:**\n`
  if (analysis.strongSubjects.length > 0) {
    analysis.strongSubjects.forEach(s => {
      response += `✅ ${s.name} (${s.marks}%) — Strong foundation\n`
    })
  } else {
    response += `Continue building your foundational knowledge.\n`
  }

  response += `\n**Areas to Improve:**\n`
  if (analysis.weakSubjects.length > 0 || analysis.criticalSubjects.length > 0) {
    ;[...analysis.criticalSubjects, ...analysis.weakSubjects].forEach(s => {
      response += `⚠️ ${s.name} (${s.marks}%) — Needs improvement\n`
    })
  }

  response += `\n**Next Steps:**\n`
  response += `1. Focus on strengthening weak academic subjects that are foundational to ${career} roles.\n`
  response += `2. Start building practical projects relevant to ${career}.\n`
  response += `3. Explore certifications aligned with ${career} (e.g., ${career === 'Cloud Engineer' ? 'AWS Cloud Practitioner, Google ACE' : career === 'AI Engineer' ? 'TensorFlow Certificate, Google ML Engineer' : 'relevant industry certifications'}).\n\n`
  response += `> 📌 **Disclaimer:** Career guidance is based on your academic data and general industry knowledge. Consult with your placement officer for institutional guidance.`

  return response
}

function generateAttendanceResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  const atRisk = analysis.attendanceRiskSubjects

  let response = `📊 **Attendance Analysis**\n\n`

  if (atRisk.length === 0) {
    response += `✅ **Good news!** Your attendance is above ${THRESHOLDS.attendance.warning}% in all subjects.\n\n`
    profile.subjects.forEach(s => {
      response += `• ${s.name}: ${s.attendance}% attendance\n`
    })
    response += `\nKeep maintaining consistent class attendance to maximize your learning and avoid eligibility issues.`
    return response
  }

  response += `⚠️ **Attendance Risk Detected in ${atRisk.length} subject(s)**\n\n`

  const critical = atRisk.filter(s => s.attendance < THRESHOLDS.attendance.critical)
  const warning = atRisk.filter(s => s.attendance >= THRESHOLDS.attendance.critical && s.attendance < THRESHOLDS.attendance.warning)

  if (critical.length > 0) {
    response += `🔴 **Critical Attendance (below ${THRESHOLDS.attendance.critical}%):**\n`
    critical.forEach(s => {
      response += `• ${s.name}: ${s.attendance}% — Risk of exam debarment\n`
    })
    response += `\n`
  }

  if (warning.length > 0) {
    response += `🟡 **Attendance Warning (${THRESHOLDS.attendance.critical}–${THRESHOLDS.attendance.warning}%):**\n`
    warning.forEach(s => {
      response += `• ${s.name}: ${s.attendance}% — Approaching minimum threshold\n`
    })
    response += `\n`
  }

  response += `**Immediate Actions:**\n`
  response += `1. Attend all remaining classes for the above subjects without exception.\n`
  response += `2. Check your institution's attendance policy for minimum eligibility rules.\n`
  response += `3. Speak with your class coordinator if you have medical or valid reasons for absences.\n`
  response += `4. Do not miss any upcoming labs or practicals as these are harder to recover.\n\n`
  response += `> 📌 **Important:** Consult your faculty advisor immediately regarding attendance shortage to understand your options.`

  return response
}

function generateCourseResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  const career = profile.careerGoal || 'your career goal'

  let response = `📚 **Course Recommendations**\n\n`
  response += `Based on your profile (Semester ${profile.semester}, ${career}), here are recommended courses:\n\n`

  const courseMap: Record<string, { next: string[]; reason: string }[]> = {
    'Cloud Engineer': [
      { next: ['Cloud Computing Fundamentals', 'AWS Solutions Architect'], reason: 'Direct alignment with your Cloud Engineer career goal' },
      { next: ['Linux Administration', 'Networking Fundamentals'], reason: 'Foundation for cloud infrastructure management' },
      { next: ['DevOps Engineering', 'CI/CD Pipelines'], reason: 'Essential for modern cloud deployments' },
    ],
    'AI Engineer': [
      { next: ['Machine Learning', 'Deep Learning'], reason: 'Core skills for AI engineering roles' },
      { next: ['Python for Data Science', 'Statistics'], reason: 'Foundation for AI development' },
      { next: ['Natural Language Processing', 'LLM Engineering'], reason: 'Cutting-edge AI specialization' },
    ],
  }

  const recommendations = courseMap[career] || [
    { next: ['Advanced Data Structures', 'Algorithm Design'], reason: 'Strengthen core CS fundamentals' },
    { next: ['System Design', 'Software Architecture'], reason: 'Build scalable system thinking' },
    { next: ['Database Advanced Topics', 'NoSQL Systems'], reason: 'Expand data management knowledge' },
  ]

  recommendations.forEach((rec, i) => {
    response += `**${i + 1}. ${rec.next[0]}**\n`
    response += `_Why:_ ${rec.reason}\n`
    if (rec.next[1]) response += `_Also consider:_ ${rec.next[1]}\n`
    response += `\n`
  })

  if (analysis.weakSubjects.length > 0) {
    response += `**Priority: Strengthen Current Weak Subjects First**\n`
    response += `Before adding new courses, focus on improving:\n`
    analysis.weakSubjects.forEach(s => {
      response += `• ${s.name} (${s.marks}%) — Below target\n`
    })
  }

  response += `\n> 📌 **Note:** Course availability depends on your institution's curriculum. Verify prerequisites and consult your academic advisor before enrolling.`

  return response
}

function generateResourceResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  const weakSubjects = [...analysis.criticalSubjects, ...analysis.weakSubjects]

  let response = `📖 **Learning Resources**\n\n`

  if (weakSubjects.length > 0) {
    response += `Based on your weak areas, here are targeted resources:\n\n`
    weakSubjects.slice(0, 3).forEach(subject => {
      const resources = getResourcesForSubject(subject.name)
      response += `**For ${subject.name} (${subject.marks}%):**\n`
      resources.forEach(r => {
        response += `• ${r}\n`
      })
      response += `\n`
    })
  }

  response += `**General Resources Aligned with ${profile.careerGoal || 'your goals'}:**\n`
  const careerResources = getCareerResources(profile.careerGoal || '')
  careerResources.forEach(r => {
    response += `• ${r}\n`
  })

  response += `\n**Best Practices for Learning:**\n`
  response += profile.learningStyle ? `Since you prefer ${profile.learningStyle}, focus on ${getLearningStyleAdvice(profile.learningStyle)}\n` : ''
  response += `• Use the Pomodoro technique: 25 min focused study + 5 min break\n`
  response += `• Practice active recall instead of passive re-reading\n`
  response += `• Build projects to apply concepts practically\n\n`
  response += `> 📌 **Note:** All resource recommendations are based on publicly available materials. Verify URLs and current availability.`

  return response
}

function generatePerformanceResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  let response = `📈 **Academic Performance Analysis**\n\n`
  response += `**Overall Average:** ${analysis.overallAverage}% (Grade: ${analysis.overallGrade})\n`
  response += `**Academic Risk Level:** ${analysis.riskLevel}\n\n`

  response += `**Subject Breakdown:**\n`
  profile.subjects.forEach(s => {
    const status = s.marks >= THRESHOLDS.marks.strong ? '✅' : s.marks >= THRESHOLDS.marks.needsAttention ? '🟡' : s.marks >= THRESHOLDS.marks.critical ? '🟠' : '🔴'
    response += `${status} ${s.name}: ${s.marks}% marks, ${s.attendance}% attendance\n`
  })

  if (analysis.criticalSubjects.length > 0) {
    response += `\n🔴 **Immediate Priority:**\n`
    analysis.criticalSubjects.forEach(s => {
      response += `• ${s.name}: ${s.marks}% — Below passing threshold. Needs urgent attention.\n`
    })
  }

  if (analysis.weakSubjects.length > 0) {
    response += `\n🟠 **Needs Improvement:**\n`
    analysis.weakSubjects.forEach(s => {
      response += `• ${s.name}: ${s.marks}% — Below target. Allocate additional study time.\n`
    })
  }

  if (analysis.strongSubjects.length > 0) {
    response += `\n✅ **Strong Areas:**\n`
    analysis.strongSubjects.forEach(s => {
      response += `• ${s.name}: ${s.marks}% — Performing well. Maintain and deepen knowledge.\n`
    })
  }

  response += `\n**Top Recommendations:**\n`
  analysis.studyPriorities.slice(0, 3).forEach((p, i) => {
    response += `${i + 1}. ${p.subject} — ${p.hoursPerWeek} hours/week (${p.priority} priority)\n`
  })

  response += `\n> 📌 **AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance.**`

  return response
}

function generateSubjectFocusResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  let response = `🎯 **Subject Focus Recommendations**\n\n`
  response += `This week, based on your marks, attendance, and available ${profile.studyHoursPerDay} hours/day, focus on:\n\n`

  analysis.studyPriorities.slice(0, 4).forEach((priority, i) => {
    response += `**${i + 1}. ${priority.subject}** — ${priority.hoursPerWeek} hrs/week\n`
    response += `_Priority: ${priority.priority}_ | ${priority.reason}\n\n`
  })

  response += `**Study Tips:**\n`
  if (analysis.criticalSubjects.length > 0) {
    response += `• Start each study session with ${analysis.criticalSubjects[0].name} when your focus is highest.\n`
  }
  response += `• Review previous exam papers to understand question patterns.\n`
  response += `• Form study groups for difficult topics like ${analysis.weakSubjects[0]?.name || 'your challenging subjects'}.\n`
  response += `• Take regular breaks and avoid cramming sessions.\n`

  return response
}

function generateGeneralResponse(profile: StudentProfileData, analysis: ReturnType<typeof performFullAnalysis>): string {
  return `👋 **Hello ${profile.name}!**\n\nI'm your AI Academic Advisor. Here's a quick snapshot of your academic status:\n\n📊 **Overall Average:** ${analysis.overallAverage}% (${analysis.overallGrade})\n🚦 **Risk Level:** ${analysis.riskLevel}\n✅ **Strong:** ${analysis.strongSubjects.map(s => s.name).join(', ') || 'Keep building your strengths'}\n⚠️ **Needs Attention:** ${[...analysis.criticalSubjects, ...analysis.weakSubjects].map(s => s.name).join(', ') || 'All subjects are performing adequately'}\n\nYou can ask me:\n• "What should I focus on this week?"\n• "Am I at academic risk?"\n• "What career skills should I learn?"\n• "Create a study plan for me"\n• "What resources should I use?"\n\n> 📌 **AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance.**`
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getResourcesForSubject(subjectName: string): string[] {
  const resourceMap: Record<string, string[]> = {
    'Operating Systems': [
      'MIT OCW: Operating Systems Engineering (Free)',
      'Silberschatz "Operating System Concepts" Textbook',
      'GeeksforGeeks OS Tutorials (Free)',
      'Neso Academy OS Playlist on YouTube (Free)',
    ],
    'Computer Networks': [
      '"Computer Networking: A Top-Down Approach" by Kurose & Ross',
      'Cisco Networking Academy — Free Courses',
      'Professor Messer Networking Videos (Free)',
      'GeeksforGeeks Computer Networks (Free)',
    ],
    'Data Structures': [
      'LeetCode — Practice Problems (Free)',
      'CS50 — Introduction to CS (Free)',
      'GeeksforGeeks Data Structures (Free)',
      '"Introduction to Algorithms" (CLRS) Textbook',
    ],
    'Database Management Systems': [
      'SQLZoo — Interactive SQL Practice (Free)',
      'W3Schools SQL Tutorial (Free)',
      'Stanford DB Course on Coursera (Free Audit)',
      'MySQL Documentation (Free)',
    ],
    'Software Engineering': [
      '"Clean Code" by Robert C. Martin',
      'Agile Manifesto and Scrum Guide (Free)',
      'GitHub Learning Lab (Free)',
      'freeCodeCamp Full Stack Curriculum (Free)',
    ],
  }

  // Try exact match first, then partial match
  for (const key of Object.keys(resourceMap)) {
    if (subjectName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subjectName.toLowerCase())) {
      return resourceMap[key]
    }
  }

  return [
    'GeeksforGeeks — Comprehensive Computer Science Tutorials (Free)',
    'Khan Academy — Free Educational Content (Free)',
    'YouTube — Subject-specific educational channels (Free)',
    'Your institution\'s digital library resources',
  ]
}

function getCareerResources(career: string): string[] {
  const resourceMap: Record<string, string[]> = {
    'Cloud Engineer': [
      'AWS Skill Builder — 500+ Free Courses',
      'Google Cloud Skills Boost — Free Labs',
      'Linux Foundation Free Courses',
      'Docker Official Documentation',
      'Kubernetes.io Learn Portal',
    ],
    'AI Engineer': [
      'fast.ai — Practical Deep Learning (Free)',
      'Coursera Machine Learning Specialization',
      'HuggingFace Course (Free)',
      'Google AI Education Resources (Free)',
    ],
    'Software Engineer': [
      'LeetCode — Algorithm Practice',
      'System Design Primer on GitHub (Free)',
      'freeCodeCamp (Free)',
      'The Odin Project (Free)',
    ],
  }

  for (const key of Object.keys(resourceMap)) {
    if (career.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(career.toLowerCase())) {
      return resourceMap[key]
    }
  }

  return [
    'Coursera — Professional Certificates',
    'edX — University Courses',
    'YouTube — Free Educational Channels',
    'GitHub — Open Source Projects to contribute to',
  ]
}

function getLearningStyleAdvice(style: string): string {
  const adviceMap: Record<string, string> = {
    Videos: 'YouTube educational channels, Coursera, edX, and NPTEL video lectures.',
    Articles: 'GeeksforGeeks, Medium, Dev.to, and official documentation.',
    'Coding Practice': 'LeetCode, HackerRank, CodeChef, and project building.',
    Projects: 'Build real projects from scratch, contribute to open source on GitHub.',
    Notes: 'Create detailed summaries, mind maps, and use spaced repetition flashcards.',
    'Interactive Learning': 'Codecademy, freeCodeCamp, KhanAcademy interactive exercises.',
  }
  return adviceMap[style] || 'diverse resources combining videos, practice problems, and projects.'
}

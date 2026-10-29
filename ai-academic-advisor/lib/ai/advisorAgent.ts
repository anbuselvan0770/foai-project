// LLM Academic Advisor Agent
// Implements the full pipeline: Intent Detection → Context Retrieval → Rule Evaluation → LLM → Validation → Response

import { callAI, isAIConfigured, type AIMessage } from './providers'
import { generateDemoResponse, detectIntent, type ChatIntent } from './demoResponses'
import {
  performFullAnalysis,
  type StudentProfileData,
} from '../academic/academicRules'
import careersData from '../../data/careers.json'
import coursesData from '../../data/courses.json'
import resourcesData from '../../data/resources.json'

export interface AdvisorRequest {
  message: string
  profile: StudentProfileData
  conversationHistory?: AIMessage[]
}

export interface AdvisorResponse {
  content: string
  intent: ChatIntent
  isDemo: boolean
  ruleAnalysis?: {
    overallAverage: number
    riskLevel: string
    weakSubjects: string[]
    strongSubjects: string[]
  }
}

const SYSTEM_PROMPT = `You are an AI Academic Advisor designed to provide personalized academic decision support to students.

You have access to the student's complete academic profile including marks, attendance, interests, career goals, and study availability.

You MUST:
- Provide personalized, empathetic, and actionable guidance based on the student's actual data
- Explain recommendations clearly with specific reasons tied to the student's profile
- Respect institutional academic rules and thresholds
- Identify academic risk indicators honestly
- Recommend realistic study priorities based on available time
- Align recommendations with the student's career goals
- Avoid making unsupported claims
- Never invent university policies not mentioned in the context
- Ask for clarification when student data is insufficient
- Clearly distinguish between facts (from the data) and suggestions
- Always encourage consultation with faculty for important academic decisions
- Never claim to replace a human academic advisor

You MUST NOT:
- Override the deterministic academic analysis provided in the context
- Expose internal chain-of-thought reasoning
- Make up marks, grades, or attendance data
- Give advice that contradicts the academic rules

Format your response in clear, readable markdown with appropriate headers, bullet points, and emphasis.
Use emojis sparingly and professionally.

DISCLAIMER: Always include at the end: "AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance."`

function buildContext(profile: StudentProfileData, intent: ChatIntent): string {
  const analysis = performFullAnalysis(profile)

  // Find relevant career data
  const careerKey = profile.careerGoal?.toLowerCase().replace(/\s+/g, '-')
  const careerData = (careersData as Array<{ id: string; skills: Array<{ name: string; priority: string; reason: string }> }>).find(
    c => careerKey?.includes(c.id) || c.id.includes(careerKey || '')
  )

  // Find relevant courses
  const relevantCourses = (coursesData as Array<{ name: string; relatedCareers: string[]; skills: string[] }>).filter(c =>
    c.relatedCareers.some(r => careerKey?.includes(r.replace(/-/g, ' ')) || r.includes(careerKey || ''))
  ).slice(0, 5)

  // Find relevant resources based on weak subjects
  const weakSubjectNames = [...analysis.criticalSubjects, ...analysis.weakSubjects].map(s => s.name.toLowerCase())
  const relevantResources = (resourcesData as Array<{ title: string; relatedSubjects: string[]; category: string; difficulty: string }>).filter(r =>
    r.relatedSubjects.some(rs => weakSubjectNames.some(ws => rs.toLowerCase().includes(ws) || ws.includes(rs.toLowerCase())))
  ).slice(0, 5)

  let context = `=== STUDENT ACADEMIC PROFILE ===
Name: ${profile.name}
Department: ${profile.department}
Year: ${profile.year}, Semester: ${profile.semester}
Career Goal: ${profile.careerGoal}
Interests: ${profile.interests.join(', ')}
Study Availability: ${profile.studyHoursPerDay} hours/day
Learning Style: ${profile.learningStyle}

=== ACADEMIC DATA (Current Semester) ===
`
  profile.subjects.forEach(s => {
    const status = analysis.subjectAnalyses.find(a => a.subject.id === s.id)
    context += `• ${s.name}: ${s.marks}% marks (${status?.performanceStatus || 'N/A'}), ${s.attendance}% attendance (${status?.attendanceStatus || 'N/A'}), Difficulty: ${s.difficulty}\n`
  })

  context += `
=== RULE-BASED ANALYSIS (DO NOT OVERRIDE) ===
Overall Average: ${analysis.overallAverage}% (Grade: ${analysis.overallGrade})
Academic Risk Level: ${analysis.riskLevel} (Score: ${analysis.riskScore}/100)
Strong Subjects: ${analysis.strongSubjects.map(s => s.name).join(', ') || 'None'}
Weak Subjects: ${analysis.weakSubjects.map(s => s.name).join(', ') || 'None'}
Critical Subjects: ${analysis.criticalSubjects.map(s => s.name).join(', ') || 'None'}
Attendance Risk: ${analysis.attendanceRiskSubjects.map(s => s.name).join(', ') || 'None'}

Risk Factors:
${analysis.riskFactors.map(f => `• [${f.severity.toUpperCase()}] ${f.description}`).join('\n') || '• No significant risk factors detected'}

Study Priorities (by urgency):
${analysis.studyPriorities.map(p => `• ${p.subject}: ${p.hoursPerWeek} hrs/week (${p.priority}) — ${p.reason}`).join('\n')}
`

  if (intent === 'CAREER_GUIDANCE' && careerData) {
    context += `
=== CAREER KNOWLEDGE BASE: ${profile.careerGoal} ===
Required Skills:
${careerData.skills.map(s => `• ${s.name} (${s.priority}): ${s.reason}`).join('\n')}
`
  }

  if ((intent === 'COURSE_RECOMMENDATION' || intent === 'CAREER_GUIDANCE') && relevantCourses.length > 0) {
    context += `
=== RELEVANT COURSES ===
${relevantCourses.map(c => `• ${c.name} (Skills: ${c.skills.join(', ')})`).join('\n')}
`
  }

  if (intent === 'LEARNING_RESOURCE' && relevantResources.length > 0) {
    context += `
=== RELEVANT LEARNING RESOURCES ===
${relevantResources.map(r => `• ${r.title} (${r.category}, ${r.difficulty})`).join('\n')}
`
  }

  return context
}

export async function runAdvisorAgent(request: AdvisorRequest): Promise<AdvisorResponse> {
  const { message, profile, conversationHistory = [] } = request
  const intent = detectIntent(message)
  const analysis = performFullAnalysis(profile)

  const ruleAnalysis = {
    overallAverage: analysis.overallAverage,
    riskLevel: analysis.riskLevel,
    weakSubjects: [...analysis.criticalSubjects, ...analysis.weakSubjects].map(s => s.name),
    strongSubjects: analysis.strongSubjects.map(s => s.name),
  }

  // Use demo mode if AI is not configured
  if (!isAIConfigured()) {
    const demoContent = generateDemoResponse(message, profile)
    return {
      content: demoContent,
      intent,
      isDemo: true,
      ruleAnalysis,
    }
  }

  // Build context for the LLM
  const context = buildContext(profile, intent)

  // Build message array for LLM
  const contextualSystemPrompt = `${SYSTEM_PROMPT}

=== CURRENT STUDENT CONTEXT ===
${context}

Intent detected: ${intent}
`

  const messages: AIMessage[] = [
    ...conversationHistory.slice(-6), // Last 6 messages for context
    { role: 'user', content: message },
  ]

  try {
    const aiResponse = await callAI(messages, contextualSystemPrompt)

    // Validate response - if empty or too short, use demo fallback
    if (!aiResponse.content || aiResponse.content.length < 50) {
      const demoContent = generateDemoResponse(message, profile)
      return { content: demoContent, intent, isDemo: true, ruleAnalysis }
    }

    return {
      content: aiResponse.content,
      intent,
      isDemo: false,
      ruleAnalysis,
    }
  } catch (error) {
    // Fallback to demo mode on any error
    console.error('AI provider error, falling back to demo mode:', error)
    const demoContent = generateDemoResponse(message, profile)
    return {
      content: demoContent,
      intent,
      isDemo: true,
      ruleAnalysis,
    }
  }
}

// Structured analysis request (for recommendations page, dashboard, etc.)
export async function generateStructuredAnalysis(profile: StudentProfileData): Promise<{
  summary: string
  riskLevel: string
  weakSubjects: string[]
  strongSubjects: string[]
  recommendations: Array<{
    title: string
    category: string
    priority: string
    reason: string
    benefit: string
    action: string
  }>
  studyPriorities: Array<{ subject: string; hoursPerWeek: number; priority: string; reason: string }>
  careerAdvice: string[]
  explanation: string
  isDemo: boolean
}> {
  const analysis = performFullAnalysis(profile)

  const baseResult = {
    riskLevel: analysis.riskLevel,
    weakSubjects: [...analysis.criticalSubjects, ...analysis.weakSubjects].map(s => s.name),
    strongSubjects: analysis.strongSubjects.map(s => s.name),
    studyPriorities: analysis.studyPriorities,
    isDemo: !isAIConfigured(),
  }

  if (!isAIConfigured()) {
    return {
      ...baseResult,
      summary: `Your overall academic average is ${analysis.overallAverage}% with ${analysis.riskLevel} risk level.`,
      recommendations: generateDeterministicRecommendations(profile, analysis),
      careerAdvice: generateDeterministicCareerAdvice(profile),
      explanation: analysis.aiInsight,
    }
  }

  const context = buildContext(profile, 'PERFORMANCE_ANALYSIS')
  const prompt = `Based on the student context below, generate a structured academic analysis.

${context}

Respond with ONLY a valid JSON object (no markdown, no explanation outside JSON) with this structure:
{
  "summary": "2-3 sentence overall academic summary",
  "recommendations": [
    {
      "title": "Recommendation title",
      "category": "Course|Skill|Resource|Career|Study",
      "priority": "Critical|High|Medium|Low",
      "reason": "Specific reason based on student data",
      "benefit": "Expected benefit",
      "action": "Specific suggested action"
    }
  ],
  "careerAdvice": ["advice 1", "advice 2", "advice 3"],
  "explanation": "2-3 sentence overall explanation of the student's academic situation"
}`

  try {
    const response = await callAI([{ role: 'user', content: prompt }])
    const jsonText = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonText)

    return {
      ...baseResult,
      summary: parsed.summary || '',
      recommendations: parsed.recommendations || generateDeterministicRecommendations(profile, analysis),
      careerAdvice: parsed.careerAdvice || [],
      explanation: parsed.explanation || analysis.aiInsight,
      isDemo: false,
    }
  } catch {
    // Fallback
    return {
      ...baseResult,
      summary: `Your overall academic average is ${analysis.overallAverage}% with ${analysis.riskLevel} risk level.`,
      recommendations: generateDeterministicRecommendations(profile, analysis),
      careerAdvice: generateDeterministicCareerAdvice(profile),
      explanation: analysis.aiInsight,
      isDemo: true,
    }
  }
}

function generateDeterministicRecommendations(
  profile: StudentProfileData,
  analysis: ReturnType<typeof performFullAnalysis>
) {
  const recs = []

  // Subject-based recommendations
  for (const subject of analysis.criticalSubjects) {
    recs.push({
      title: `Urgently Strengthen ${subject.name}`,
      category: 'Study',
      priority: 'Critical',
      reason: `${subject.name} marks (${subject.marks}%) are below the passing threshold of ${50}%.`,
      benefit: 'Avoid academic failure and ensure exam eligibility.',
      action: `Dedicate 2+ hours daily to ${subject.name}. Review fundamentals, practice past papers, seek faculty help.`,
    })
  }

  for (const subject of analysis.weakSubjects) {
    recs.push({
      title: `Improve Performance in ${subject.name}`,
      category: 'Study',
      priority: 'High',
      reason: `${subject.name} marks (${subject.marks}%) are below the target performance level.`,
      benefit: `Improving ${subject.name} will strengthen your overall GPA and career readiness.`,
      action: `Allocate extra weekly study time to ${subject.name} and practice concept applications.`,
    })
  }

  // Career-based recommendations
  const careerSkillMap: Record<string, string[]> = {
    'Cloud Engineer': ['Docker & Kubernetes', 'AWS/Azure Cloud Platform', 'Linux Administration'],
    'AI Engineer': ['Python for ML', 'Machine Learning Fundamentals', 'Deep Learning'],
    'Software Engineer': ['System Design', 'Data Structures & Algorithms', 'Testing'],
    'DevOps Engineer': ['CI/CD Pipelines', 'Infrastructure as Code', 'Container Orchestration'],
    'Data Scientist': ['Statistical Analysis', 'Python Data Science Libraries', 'Machine Learning'],
    'Cyber Security Engineer': ['Network Security', 'Ethical Hacking', 'Cryptography'],
    'Full Stack Developer': ['React/Next.js', 'Backend Development', 'Database Design'],
  }

  const careerSkills = careerSkillMap[profile.careerGoal] || ['Programming', 'Problem Solving', 'System Design']
  for (const skill of careerSkills.slice(0, 2)) {
    recs.push({
      title: `Learn ${skill}`,
      category: 'Skill',
      priority: 'High',
      reason: `${skill} is a critical skill for your ${profile.careerGoal} career goal.`,
      benefit: `Acquiring ${skill} will directly improve your employability for ${profile.careerGoal} roles.`,
      action: `Start with online courses or tutorials for ${skill}. Build a small project to demonstrate your skills.`,
    })
  }

  // Interest-based recommendation
  if (profile.interests.length > 0) {
    recs.push({
      title: `Explore ${profile.interests[0]} Deeper`,
      category: 'Course',
      priority: 'Medium',
      reason: `You expressed interest in ${profile.interests[0]}, which aligns with your ${profile.careerGoal} career goal.`,
      benefit: 'Deepening this interest builds practical expertise employers value.',
      action: `Look for projects or courses specifically in ${profile.interests[0]} to build hands-on experience.`,
    })
  }

  return recs.slice(0, 8)
}

function generateDeterministicCareerAdvice(profile: StudentProfileData): string[] {
  const advice = [
    `Your ${profile.careerGoal} career goal is well-aligned with your Computer Science education.`,
    `Focus on strengthening subjects that are foundational to ${profile.careerGoal} roles.`,
    `Begin building a portfolio of projects relevant to ${profile.careerGoal}.`,
    `Consider pursuing certifications in your area of interest to stand out in the job market.`,
    `Connect with professionals in ${profile.careerGoal} roles through LinkedIn or industry events.`,
  ]
  return advice
}

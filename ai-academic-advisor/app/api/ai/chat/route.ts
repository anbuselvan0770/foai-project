import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { runAdvisorAgent } from '@/lib/ai/advisorAgent'
import { type StudentProfileData } from '@/lib/academic/academicRules'
import { type AIMessage } from '@/lib/ai/providers'

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { message, sessionId } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Load student context
    const [profile, subjects, interests, careerGoals] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: auth.userId } }),
      prisma.subject.findMany({ where: { userId: auth.userId } }),
      prisma.interest.findMany({ where: { userId: auth.userId } }),
      prisma.careerGoal.findMany({ where: { userId: auth.userId } }),
    ])

    if (!profile || subjects.length === 0) {
      return NextResponse.json({
        content: "Please complete your academic profile and add your subjects before using the AI advisor. I need your academic data to provide personalized guidance.",
        intent: 'GENERAL_ACADEMIC_QUERY',
        isDemo: true,
      })
    }

    const studentProfile: StudentProfileData = {
      name: auth.name,
      department: profile.department,
      year: profile.year,
      semester: profile.semester,
      studyHoursPerDay: profile.studyHoursPerDay,
      targetGPA: profile.targetGPA,
      learningStyle: profile.learningStyle,
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        marks: s.marks,
        attendance: s.attendance,
        difficulty: s.difficulty as 'Low' | 'Medium' | 'High',
        grade: s.grade,
      })),
      interests: interests.map(i => i.name),
      careerGoal: careerGoals.find(g => g.isPrimary)?.title || careerGoals[0]?.title || '',
    }

    // Get conversation history
    let conversationHistory: AIMessage[] = []
    if (sessionId) {
      const history = await prisma.chatMessage.findMany({
        where: { chatSessionId: sessionId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      })
      conversationHistory = history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    }

    // Run the advisor agent
    const agentResponse = await runAdvisorAgent({
      message,
      profile: studentProfile,
      conversationHistory,
    })

    // Save messages to session safely
    if (sessionId) {
      try {
        await prisma.chatSession.upsert({
          where: { id: sessionId },
          update: { updatedAt: new Date() },
          create: {
            id: sessionId,
            userId: auth.userId,
            title: message.slice(0, 40) || 'Academic Advice',
          },
        })

        await prisma.chatMessage.createMany({
          data: [
            { chatSessionId: sessionId, role: 'user', content: message },
            { chatSessionId: sessionId, role: 'assistant', content: agentResponse.content },
          ],
        })
      } catch (sessionErr) {
        console.warn('Could not persist chat message to database:', sessionErr)
      }
    }

    return NextResponse.json({
      content: agentResponse.content,
      intent: agentResponse.intent,
      isDemo: agentResponse.isDemo,
      ruleAnalysis: agentResponse.ruleAnalysis,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      content: "I'm having trouble processing your request right now. Please try again.",
      intent: 'GENERAL_ACADEMIC_QUERY',
      isDemo: true,
    })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { performFullAnalysis, generateStudyPriorities, type StudentProfileData } from '@/lib/academic/academicRules'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const latestPlan = await prisma.studyPlan.findFirst({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      include: { tasks: { orderBy: { dayOfWeek: 'asc' } } },
    })

    return NextResponse.json({ studyPlan: latestPlan })
  } catch (error) {
    console.error('Study plan GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch study plan' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [profile, subjects, interests, careerGoals] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: auth.userId } }),
      prisma.subject.findMany({ where: { userId: auth.userId } }),
      prisma.interest.findMany({ where: { userId: auth.userId } }),
      prisma.careerGoal.findMany({ where: { userId: auth.userId } }),
    ])

    if (!profile || subjects.length === 0) {
      return NextResponse.json({ error: 'Complete your profile and add subjects first' }, { status: 422 })
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

    const analysis = performFullAnalysis(studentProfile)
    const priorities = analysis.studyPriorities

    // Delete existing plan
    await prisma.studyPlan.deleteMany({ where: { userId: auth.userId } })

    // Create new plan
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: auth.userId,
        weekStart: new Date(),
        title: `Weekly Study Plan — Semester ${profile.semester}`,
      },
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const tasks = []
    let dayIndex = 0

    for (const priority of priorities) {
      const hoursThisWeek = priority.hoursPerWeek
      const sessionsNeeded = Math.ceil(hoursThisWeek / 2)

      for (let i = 0; i < Math.min(sessionsNeeded, 3); i++) {
        const day = days[(dayIndex + i) % days.length]
        const duration = Math.min(hoursThisWeek / sessionsNeeded, 2)
        const timeSlots = ['Morning', 'Afternoon', 'Evening']

        tasks.push({
          studyPlanId: studyPlan.id,
          subject: priority.subject,
          duration: Math.round(duration * 10) / 10,
          priority: priority.priority,
          goal: `Focus on ${priority.subject} — ${priority.reason.slice(0, 100)}`,
          dayOfWeek: day,
          timeSlot: timeSlots[i % timeSlots.length],
          status: 'Pending',
        })
      }
      dayIndex = (dayIndex + 2) % days.length
    }

    // Add career-aligned skill task
    const careerGoal = careerGoals.find(g => g.isPrimary)?.title || ''
    if (careerGoal) {
      tasks.push({
        studyPlanId: studyPlan.id,
        subject: `${careerGoal} Skills`,
        duration: 1.5,
        priority: 'Medium',
        goal: `Explore and practice skills relevant to ${careerGoal}`,
        dayOfWeek: 'Saturday',
        timeSlot: 'Evening',
        status: 'Pending',
      })
    }

    await prisma.studyTask.createMany({ data: tasks })

    const fullPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlan.id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json({ success: true, studyPlan: fullPlan })
  } catch (error) {
    console.error('Study plan POST error:', error)
    return NextResponse.json({ error: 'Failed to generate study plan' }, { status: 500 })
  }
}

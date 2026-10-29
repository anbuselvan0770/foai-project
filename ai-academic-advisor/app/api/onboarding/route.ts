import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { calculateGrade } from '@/lib/academic/academicRules'

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { personal, subjects, interests, careerGoal, studyPreferences } = body

    // Update profile
    await prisma.studentProfile.upsert({
      where: { userId: auth.userId },
      update: {
        department: personal.department,
        year: Number(personal.year),
        semester: Number(personal.semester),
        studyHoursPerDay: Number(studyPreferences.hoursPerDay),
        learningStyle: studyPreferences.learningStyle,
        onboardingDone: true,
      },
      create: {
        userId: auth.userId,
        department: personal.department,
        year: Number(personal.year),
        semester: Number(personal.semester),
        studyHoursPerDay: Number(studyPreferences.hoursPerDay),
        learningStyle: studyPreferences.learningStyle,
        onboardingDone: true,
      },
    })

    // Update user name
    await prisma.user.update({
      where: { id: auth.userId },
      data: { name: personal.name },
    })

    // Save subjects
    await prisma.subject.deleteMany({ where: { userId: auth.userId } })
    for (const subject of subjects) {
      await prisma.subject.create({
        data: {
          userId: auth.userId,
          name: subject.name,
          marks: Number(subject.marks),
          attendance: Number(subject.attendance),
          difficulty: subject.difficulty || 'Medium',
          grade: calculateGrade(Number(subject.marks)),
          semester: Number(personal.semester),
        },
      })
    }

    // Save interests
    await prisma.interest.deleteMany({ where: { userId: auth.userId } })
    for (const name of interests) {
      await prisma.interest.create({ data: { userId: auth.userId, name } })
    }

    // Save career goal
    await prisma.careerGoal.deleteMany({ where: { userId: auth.userId } })
    await prisma.careerGoal.create({
      data: {
        userId: auth.userId,
        title: careerGoal,
        isPrimary: true,
        isCustom: !['Software Engineer', 'Cloud Engineer', 'DevOps Engineer', 'AI Engineer', 'Data Scientist', 'Cyber Security Engineer', 'Full Stack Developer', 'Mobile Developer', 'Researcher'].includes(careerGoal),
      },
    })

    return NextResponse.json({ success: true, redirect: '/dashboard' })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { performFullAnalysis, type StudentProfileData } from '@/lib/academic/academicRules'

export async function GET(request: Request) {
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
      return NextResponse.json({ error: 'Please complete your profile and add subjects first' }, { status: 422 })
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

    return NextResponse.json({ analysis, profile: studentProfile })
  } catch (error) {
    console.error('Analysis GET error:', error)
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 })
  }
}

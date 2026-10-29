import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import prisma from '@/lib/database/db'
import { performFullAnalysis, type StudentProfileData } from '@/lib/academic/academicRules'
import careersData from '@/data/careers.json'

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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const careerGoalTitle = careerGoals.find(g => g.isPrimary)?.title || careerGoals[0]?.title || ''
    const careerKey = careerGoalTitle.toLowerCase().replace(/\s+/g, '-')

    const careerInfo = (careersData as Array<{
      id: string
      title: string
      description: string
      skills: Array<{ name: string; priority: string; reason: string }>
      relatedSubjects: string[]
      certifications: string[]
      suggestedProjects: string[]
    }>).find(c => careerKey.includes(c.id) || c.id.includes(careerKey))

    const studentProfile: StudentProfileData | null = subjects.length > 0 ? {
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
      careerGoal: careerGoalTitle,
    } : null

    const analysis = studentProfile ? performFullAnalysis(studentProfile) : null

    // Calculate skill alignment
    const skillAlignment = careerInfo?.skills.map(skill => {
      const relatedSubject = subjects.find(s =>
        s.name.toLowerCase().includes(skill.name.toLowerCase().split(' ')[0]) ||
        skill.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
      )

      let currentStatus: 'Strong' | 'Average' | 'Needs Improvement' | 'Not Started' = 'Not Started'
      if (relatedSubject) {
        if (relatedSubject.marks >= 80) currentStatus = 'Strong'
        else if (relatedSubject.marks >= 65) currentStatus = 'Average'
        else currentStatus = 'Needs Improvement'
      }

      return {
        skill: skill.name,
        priority: skill.priority,
        reason: skill.reason,
        currentStatus,
        relatedSubject: relatedSubject?.name,
        marks: relatedSubject?.marks,
      }
    }) || []

    return NextResponse.json({
      careerGoal: careerGoalTitle,
      careerInfo,
      skillAlignment,
      analysis: analysis ? {
        overallAverage: analysis.overallAverage,
        strongSubjects: analysis.strongSubjects.map(s => s.name),
        weakSubjects: analysis.weakSubjects.map(s => s.name),
        riskLevel: analysis.riskLevel,
      } : null,
      interests: interests.map(i => i.name),
    })
  } catch (error) {
    console.error('Career guidance error:', error)
    return NextResponse.json({ error: 'Failed to fetch career guidance' }, { status: 500 })
  }
}

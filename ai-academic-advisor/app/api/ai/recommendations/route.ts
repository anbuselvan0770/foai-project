import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { generateStructuredAnalysis } from '@/lib/ai/advisorAgent'
import { type StudentProfileData } from '@/lib/academic/academicRules'

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

    const analysis = await generateStructuredAnalysis(studentProfile)

    // Save recommendations to database
    await prisma.recommendation.deleteMany({ where: { userId: auth.userId } })
    for (const rec of analysis.recommendations) {
      await prisma.recommendation.create({
        data: {
          userId: auth.userId,
          title: rec.title,
          category: rec.category,
          priority: rec.priority,
          reason: rec.reason,
          benefit: rec.benefit,
          suggestedAction: rec.action,
        },
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Recommendations POST error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

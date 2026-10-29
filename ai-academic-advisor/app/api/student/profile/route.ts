import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [profile, interests, careerGoals] = await Promise.all([
      prisma.studentProfile.findUnique({ where: { userId: auth.userId } }),
      prisma.interest.findMany({ where: { userId: auth.userId } }),
      prisma.careerGoal.findMany({ where: { userId: auth.userId } }),
    ])

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, isDemo: true, createdAt: true },
    })

    return NextResponse.json({
      user,
      profile,
      interests: interests.map(i => i.name),
      careerGoal: careerGoals.find(g => g.isPrimary)?.title || careerGoals[0]?.title || '',
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, department, year, semester, studyHoursPerDay, learningStyle, targetGPA, interests, careerGoal } = body

    // Update user name if provided
    if (name) {
      await prisma.user.update({ where: { id: auth.userId }, data: { name } })
    }

    // Update profile
    await prisma.studentProfile.upsert({
      where: { userId: auth.userId },
      update: {
        department,
        year: year ? Number(year) : undefined,
        semester: semester ? Number(semester) : undefined,
        studyHoursPerDay: studyHoursPerDay ? Number(studyHoursPerDay) : undefined,
        learningStyle,
        targetGPA: targetGPA ? Number(targetGPA) : undefined,
      },
      create: {
        userId: auth.userId,
        department: department || '',
        year: Number(year) || 1,
        semester: Number(semester) || 1,
        studyHoursPerDay: Number(studyHoursPerDay) || 2,
        learningStyle: learningStyle || 'Videos',
        targetGPA: Number(targetGPA) || 70,
      },
    })

    // Update interests
    if (interests) {
      await prisma.interest.deleteMany({ where: { userId: auth.userId } })
      for (const name of interests) {
        await prisma.interest.create({ data: { userId: auth.userId, name } })
      }
    }

    // Update career goal
    if (careerGoal) {
      await prisma.careerGoal.deleteMany({ where: { userId: auth.userId } })
      await prisma.careerGoal.create({
        data: { userId: auth.userId, title: careerGoal, isPrimary: true },
      })
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

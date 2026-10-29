import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { calculateGrade } from '@/lib/academic/academicRules'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Subjects GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, marks, attendance, difficulty, semester } = body

    if (!name) return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })

    const marksNum = Number(marks) || 0
    const grade = calculateGrade(marksNum)

    const subject = await prisma.subject.create({
      data: {
        userId: auth.userId,
        name,
        marks: marksNum,
        attendance: Number(attendance) || 0,
        difficulty: difficulty || 'Medium',
        grade,
        semester: Number(semester) || 1,
      },
    })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error('Subjects POST error:', error)
    return NextResponse.json({ error: 'Failed to add subject' }, { status: 500 })
  }
}

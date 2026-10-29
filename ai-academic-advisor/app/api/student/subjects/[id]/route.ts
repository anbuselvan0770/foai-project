import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import { calculateGrade } from '@/lib/academic/academicRules'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { name, marks, attendance, difficulty, semester } = body

    // Verify ownership
    const existing = await prisma.subject.findFirst({ where: { id, userId: auth.userId } })
    if (!existing) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const marksNum = marks !== undefined ? Number(marks) : existing.marks
    const grade = calculateGrade(marksNum)

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: name || existing.name,
        marks: marksNum,
        attendance: attendance !== undefined ? Number(attendance) : existing.attendance,
        difficulty: difficulty || existing.difficulty,
        grade,
        semester: semester !== undefined ? Number(semester) : existing.semester,
      },
    })

    return NextResponse.json({ success: true, subject })
  } catch (error) {
    console.error('Subject PUT error:', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const existing = await prisma.subject.findFirst({ where: { id, userId: auth.userId } })
    if (!existing) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    await prisma.subject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subject DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}

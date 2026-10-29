import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { status, duration, goal } = body

    // Verify ownership through study plan
    const task = await prisma.studyTask.findFirst({
      where: { id },
      include: { studyPlan: true },
    })

    if (!task || task.studyPlan.userId !== auth.userId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updated = await prisma.studyTask.update({
      where: { id },
      data: {
        status: status || task.status,
        duration: duration !== undefined ? Number(duration) : task.duration,
        goal: goal || task.goal,
      },
    })

    return NextResponse.json({ success: true, task: updated })
  } catch (error) {
    console.error('Study task PUT error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
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

    const task = await prisma.studyTask.findFirst({
      where: { id },
      include: { studyPlan: true },
    })

    if (!task || task.studyPlan.userId !== auth.userId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.studyTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Study task DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

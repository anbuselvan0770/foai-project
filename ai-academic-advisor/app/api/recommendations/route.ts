import { NextResponse } from 'next/server'
import prisma from '@/lib/database/db'
import { getAuthFromRequest } from '@/lib/auth/jwt'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const recommendations = await prisma.recommendation.findMany({
      where: { userId: auth.userId },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

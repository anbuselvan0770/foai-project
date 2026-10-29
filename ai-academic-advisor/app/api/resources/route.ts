import { NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/auth/jwt'
import resourcesData from '@/data/resources.json'

export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')
  const skill = searchParams.get('skill')

  let resources = resourcesData as Array<{
    id: string
    title: string
    description: string
    category: string
    difficulty: string
    relatedSkills: string[]
    relatedSubjects: string[]
    url: string | null
    provider: string
    type: string
  }>

  if (category) {
    resources = resources.filter(r => r.category.toLowerCase() === category.toLowerCase())
  }
  if (difficulty) {
    resources = resources.filter(r => r.difficulty.toLowerCase() === difficulty.toLowerCase())
  }
  if (skill) {
    resources = resources.filter(r =>
      r.relatedSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    )
  }

  return NextResponse.json({ resources })
}

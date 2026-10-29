import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/database/db'
import { signJWT } from '@/lib/auth/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, demo } = body

    // Demo login
    if (demo) {
      const demoUser = await prisma.user.findUnique({ where: { email: 'demo@academic.ai' } })
      if (!demoUser) {
        return NextResponse.json({ error: 'Demo account not found. Please run database seed.' }, { status: 404 })
      }

      const token = await signJWT({
        userId: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        isDemo: true,
      })

      const response = NextResponse.json({
        success: true,
        user: { id: demoUser.id, name: demoUser.name, email: demoUser.email, isDemo: true },
        redirect: '/dashboard',
      })

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return response
    }

    // Regular login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })
    const onboardingDone = profile?.onboardingDone ?? false

    const token = await signJWT({ userId: user.id, email: user.email, name: user.name })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      redirect: onboardingDone ? '/dashboard' : '/onboarding',
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

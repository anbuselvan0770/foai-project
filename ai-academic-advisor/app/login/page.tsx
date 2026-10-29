'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      handleDemoLogin()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push(data.redirect || '/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Demo login failed'); return }
      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left Panel */}
      <div style={{ flex: '0 0 45%', background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 60%, #112952 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '-5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px', textDecoration: 'none' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎓</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>AI Academic Advisor</span>
        </Link>
        <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '900', lineHeight: 1.2, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Welcome back, student</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.7, marginBottom: '48px' }}>Sign in to access your personalized academic dashboard and continue your learning journey.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '🎯', text: 'Personalized academic recommendations' },
            { icon: '📅', text: 'AI-generated study plans' },
            { icon: '💬', text: 'Conversational AI advisor' },
            { icon: '📊', text: 'Academic risk monitoring' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{f.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Sign In</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Don&apos;t have an account? <Link href="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Create one free</Link></p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', marginBottom: '12px' }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <button onClick={handleDemoLogin} disabled={demoLoading} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', border: '2px solid #6366f1', background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s', opacity: demoLoading ? 0.7 : 1 }}>
            {demoLoading ? 'Loading Demo...' : '🎓 Try Demo Login — Arun Kumar (CSE Sem 5)'}
          </button>

          <p style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
            Demo shows a pre-loaded student profile with full AI features.
          </p>

          <div style={{ marginTop: '32px', padding: '14px 18px', background: '#f0f4ff', borderRadius: '10px', border: '1px solid #c7d2fe', fontSize: '12px', color: '#4338ca', lineHeight: 1.6 }}>
            🔒 AI Academic Advisor provides decision support. Final academic decisions should follow institutional rules and faculty guidance.
          </div>
        </div>
      </div>
    </div>
  )
}

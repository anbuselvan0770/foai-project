'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = (p: string) => {
    if (p.length === 0) return { label: '', color: '#e2e8f0', pct: 0 }
    if (p.length < 6) return { label: 'Too Short', color: '#ef4444', pct: 25 }
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b', pct: 50 }
    if (p.length < 12) return { label: 'Good', color: '#3b82f6', pct: 75 }
    return { label: 'Strong', color: '#10b981', pct: 100 }
  }
  const strength = passwordStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      router.push('/onboarding')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Left Panel */}
      <div style={{ flex: '0 0 45%', background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 60%, #112952 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px', textDecoration: 'none' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎓</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>AI Academic Advisor</span>
        </Link>
        <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '900', lineHeight: 1.2, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>Start your AI-powered academic journey</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.7, marginBottom: '48px' }}>Create your free account and let AI analyze your academic profile to provide personalized guidance.</p>
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '20px 24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>✨ What happens next?</p>
          {['Complete a 6-step onboarding wizard', 'Add your subjects, marks & attendance', 'Get your personalized AI analysis', 'Start chatting with your AI advisor'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < 3 ? '10px' : 0 }}>
              <div style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: '800', flexShrink: 0 }}>{i+1}</div>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13.5px' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Create Account</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Already have an account? <Link href="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link></p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@university.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              {form.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strength.color, fontWeight: '600', marginTop: '4px', display: 'block' }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className="form-error">Passwords do not match</span>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              {loading ? 'Creating Account...' : 'Create Account & Continue →'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
            By creating an account, you agree that AI Academic Advisor provides guidance support, not official academic decisions.
          </p>
        </div>
      </div>
    </div>
  )
}

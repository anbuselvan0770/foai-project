'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface ProfileData {
  user: { id: string; name: string; email: string; isDemo?: boolean }
  profile: {
    department: string
    year: number
    semester: number
    studyHoursPerDay: number
    learningStyle: string
    targetGPA: number | null
    onboardingDone: boolean
  } | null
  interests: string[]
  careerGoal: string
}

const CAREER_OPTIONS = ['Software Engineer', 'Cloud Engineer', 'DevOps Engineer', 'AI Engineer', 'Data Scientist', 'Cyber Security Engineer', 'Full Stack Developer', 'Mobile Developer', 'Researcher']
const LEARNING_STYLES = ['Videos', 'Articles', 'Coding Practice', 'Projects', 'Notes', 'Interactive Learning']
const INTEREST_OPTIONS = ['Artificial Intelligence', 'Machine Learning', 'Cloud Computing', 'Cyber Security', 'Web Development', 'Mobile Development', 'Data Science', 'DevOps', 'Software Engineering', 'Networking', 'Database Systems']

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', department: '', year: '1', semester: '1',
    studyHoursPerDay: '2', learningStyle: 'Videos', careerGoal: '', interests: [] as string[],
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/profile')
        const d = await res.json()
        setData(d)
        setForm({
          name: d.user?.name || '',
          department: d.profile?.department || '',
          year: String(d.profile?.year || 1),
          semester: String(d.profile?.semester || 1),
          studyHoursPerDay: String(d.profile?.studyHoursPerDay || 2),
          learningStyle: d.profile?.learningStyle || 'Videos',
          careerGoal: d.careerGoal || '',
          interests: d.interests || [],
        })
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Failed to save'); return }
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest],
    }))
  }

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '200px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Academic Profile</h1>
            <p className="page-subtitle">Manage your personal and academic information</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {success && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#16a34a', fontSize: '14px' }}>✅ {success}</div>}
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>⚠️ {error}</div>}

        {/* Personal Info */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>👤 Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input className="form-input" value={data?.user.email || ''} disabled style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science and Engineering" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Year (1 - 4)</label>
              <select className="form-select" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Semester</label>
              <select className="form-select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Study Preferences */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>📚 Study Preferences</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Study Hours Per Day</label>
              <select className="form-select" value={form.studyHoursPerDay} onChange={e => setForm({ ...form, studyHoursPerDay: e.target.value })}>
                {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => <option key={h} value={h}>{h} hours/day</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Career Goal</label>
              <select className="form-select" value={CAREER_OPTIONS.includes(form.careerGoal) ? form.careerGoal : 'Other'} onChange={e => setForm({ ...form, careerGoal: e.target.value === 'Other' ? form.careerGoal : e.target.value })}>
                {CAREER_OPTIONS.map(c => <option key={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Preferred Learning Style</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {LEARNING_STYLES.map(style => (
                  <button key={style} onClick={() => setForm({ ...form, learningStyle: style })} style={{ padding: '8px 16px', borderRadius: '10px', border: form.learningStyle === style ? '2px solid #6366f1' : '2px solid #e2e8f0', background: form.learningStyle === style ? '#ede9fe' : 'white', color: form.learningStyle === style ? '#4f46e5' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {form.learningStyle === style ? '✓ ' : ''}{style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>🌟 Academic Interests</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {INTEREST_OPTIONS.map(interest => (
              <button key={interest} onClick={() => toggleInterest(interest)} style={{ padding: '8px 16px', borderRadius: '20px', border: form.interests.includes(interest) ? '2px solid #6366f1' : '2px solid #e2e8f0', background: form.interests.includes(interest) ? '#ede9fe' : 'white', color: form.interests.includes(interest) ? '#4f46e5' : '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                {form.interests.includes(interest) ? '✓ ' : ''}{interest}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>

        <div className="disclaimer" style={{ marginTop: '20px' }}>
          <span>ℹ️</span>
          <span>Your profile data is used only to generate personalized academic guidance. It is stored securely and never shared.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

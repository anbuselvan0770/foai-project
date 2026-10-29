'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
  marks: number
  attendance: number
  difficulty: string
  grade: string
}

interface SubjectAnalysis {
  subject: Subject
  performanceStatus: string
  attendanceStatus: string
  isWeak: boolean
  isStrong: boolean
  isCritical: boolean
  hasAttendanceRisk: boolean
  recommendedAction: string
  strengthPoints: string[]
  weaknessPoints: string[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Strong: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  Average: { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
  'Needs Attention': { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  Critical: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [analyses, setAnalyses] = useState<SubjectAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', marks: '', attendance: '', difficulty: 'Medium' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      const [subRes, anaRes] = await Promise.all([
        fetch('/api/student/subjects'),
        fetch('/api/student/analysis'),
      ])
      const subData = await subRes.json()
      setSubjects(subData.subjects || [])
      if (anaRes.ok) {
        const anaData = await anaRes.json()
        setAnalyses(anaData.analysis?.subjectAnalyses || [])
      }
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Subject name is required'); return }
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/student/subjects/${editingId}` : '/api/student/subjects'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      setSuccess(editingId ? 'Subject updated!' : 'Subject added!')
      setFormData({ name: '', marks: '', attendance: '', difficulty: 'Medium' })
      setShowAddForm(false)
      setEditingId(null)
      await load()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject?')) return
    await fetch(`/api/student/subjects/${id}`, { method: 'DELETE' })
    await load()
  }

  const handleEdit = (s: Subject) => {
    setEditingId(s.id)
    setFormData({ name: s.name, marks: s.marks.toString(), attendance: s.attendance.toString(), difficulty: s.difficulty })
    setShowAddForm(true)
  }

  const getAnalysis = (id: string) => analyses.find(a => a.subject.id === id)

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Subjects &amp; Marks</h1>
            <p className="page-subtitle">Manage your current semester subjects, marks, and attendance</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ name: '', marks: '', attendance: '', difficulty: 'Medium' }) }} className="btn btn-primary btn-sm">
              + Add Subject
            </button>
            {subjects.length > 0 && <Link href="/recommendations" className="btn btn-secondary btn-sm">✨ Get Recommendations</Link>}
          </div>
        </div>

        {success && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#16a34a', fontSize: '14px' }}>✅ {success}</div>}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
            {error && <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subject Name</label>
                <input className="form-input" placeholder="e.g. Operating Systems" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Marks (%)</label>
                <input className="form-input" type="number" min="0" max="100" placeholder="0-100" value={formData.marks} onChange={e => setFormData({ ...formData, marks: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Attendance (%)</label>
                <input className="form-input" type="number" min="0" max="100" placeholder="0-100" value={formData.attendance} onChange={e => setFormData({ ...formData, attendance: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Difficulty</label>
                <select className="form-select" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Saving...' : editingId ? 'Update Subject' : 'Add Subject'}</button>
              <button onClick={() => { setShowAddForm(false); setEditingId(null); setError('') }} className="btn btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Subject Cards */}
        {subjects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>No subjects added yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Add your current semester subjects to get personalized academic analysis.</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">+ Add Your First Subject</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {subjects.map(subject => {
              const analysis = getAnalysis(subject.id)
              const perfStyle = STATUS_STYLES[analysis?.performanceStatus || 'Average'] || STATUS_STYLES.Average
              const attColor = subject.attendance >= 80 ? '#10b981' : subject.attendance >= 75 ? '#f59e0b' : '#ef4444'

              return (
                <div key={subject.id} className="card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{subject.name}</h3>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{subject.difficulty} Difficulty</span>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Grade: {subject.grade}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEdit(subject)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>✏️</button>
                      <button onClick={() => handleDelete(subject.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#dc2626' }}>🗑</button>
                    </div>
                  </div>

                  {/* Marks */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Marks</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{subject.marks}%</span>
                        <span style={{ background: perfStyle.bg, color: perfStyle.color, border: `1px solid ${perfStyle.border}`, padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>{analysis?.performanceStatus || 'Average'}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${subject.marks}%`, background: `linear-gradient(90deg, ${perfStyle.color}, ${perfStyle.color}88)`, borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Attendance */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Attendance</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: attColor }}>{subject.attendance}%</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${subject.attendance}%`, background: `linear-gradient(90deg, ${attColor}, ${attColor}88)`, borderRadius: '3px' }} />
                    </div>
                    {subject.attendance < 75 && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>⚠️ Below minimum threshold (75%)</p>}
                    {subject.attendance >= 75 && subject.attendance < 80 && <p style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: '600' }}>⚠️ Attendance warning zone</p>}
                  </div>

                  {/* Recommended Action */}
                  {analysis?.recommendedAction && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                      <span style={{ fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '4px' }}>📌 Recommended Action</span>
                      {analysis.recommendedAction}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Subject {
  id: string
  name: string
  marks: number
  attendance: number
  difficulty: string
}

const MIN_THRESHOLD = 75
const WARNING_THRESHOLD = 80

export default function AttendancePage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/student/subjects')
      const d = await res.json()
      setSubjects(d.subjects || [])
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAttendanceChange = (id: string, val: string) => {
    setEditing(prev => ({ ...prev, [id]: val }))
  }

  const handleSave = async (subject: Subject) => {
    const newAtt = parseFloat(editing[subject.id] ?? subject.attendance.toString())
    if (isNaN(newAtt) || newAtt < 0 || newAtt > 100) return
    setSaving(subject.id)
    try {
      await fetch(`/api/student/subjects/${subject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: newAtt }),
      })
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, attendance: newAtt } : s))
      const e = { ...editing }
      delete e[subject.id]
      setEditing(e)
    } catch { /* silently fail */ }
    finally { setSaving(null) }
  }

  const overallAtt = subjects.length > 0 ? subjects.reduce((s, sub) => s + sub.attendance, 0) / subjects.length : 0
  const critical = subjects.filter(s => s.attendance < MIN_THRESHOLD)
  const warning = subjects.filter(s => s.attendance >= MIN_THRESHOLD && s.attendance < WARNING_THRESHOLD)
  const safe = subjects.filter(s => s.attendance >= WARNING_THRESHOLD)

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '120px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Attendance Tracker</h1>
          <p className="page-subtitle">Monitor your attendance across all subjects. Minimum 75% required.</p>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Overall Attendance', value: `${overallAtt.toFixed(1)}%`, icon: '📊', bg: overallAtt >= 80 ? '#dcfce7' : overallAtt >= 75 ? '#fef3c7' : '#fee2e2', color: overallAtt >= 80 ? '#16a34a' : overallAtt >= 75 ? '#d97706' : '#dc2626' },
            { label: 'Critical (< 75%)', value: critical.length.toString(), icon: '🔴', bg: '#fee2e2', color: '#dc2626' },
            { label: 'Warning (75–79%)', value: warning.length.toString(), icon: '⚠️', bg: '#fef3c7', color: '#d97706' },
            { label: 'Safe (≥ 80%)', value: safe.length.toString(), icon: '✅', bg: '#dcfce7', color: '#16a34a' },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-icon" style={{ background: card.bg }}><span style={{ fontSize: '22px' }}>{card.icon}</span></div>
              <div style={{ fontSize: '26px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {critical.length > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626', marginBottom: '8px' }}>🔴 Critical Attendance Alert</h3>
            <p style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.6 }}>
              <strong>{critical.map(s => s.name).join(', ')}</strong> — attendance below 75%. You may be barred from exams if this continues. Attend all upcoming classes immediately.
            </p>
          </div>
        )}
        {warning.length > 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#d97706', marginBottom: '8px' }}>⚠️ Attendance Warning</h3>
            <p style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
              <strong>{warning.map(s => s.name).join(', ')}</strong> — attendance in warning zone (75–79%). A few missed classes could push you below threshold.
            </p>
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>No subjects added yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Add your subjects to track attendance.</p>
            <a href="/subjects" className="btn btn-primary">Add Subjects →</a>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800' }}>Subject-wise Attendance</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Attendance %</th>
                    <th style={{ minWidth: '200px' }}>Progress</th>
                    <th>Status</th>
                    <th style={{ minWidth: '180px' }}>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const att = subject.attendance
                    const attColor = att >= 80 ? '#10b981' : att >= 75 ? '#f59e0b' : '#ef4444'
                    const statusLabel = att >= 80 ? 'Safe' : att >= 75 ? 'Warning' : 'Critical'
                    const statusBg = att >= 80 ? '#dcfce7' : att >= 75 ? '#fef3c7' : '#fee2e2'
                    const editVal = editing[subject.id]

                    return (
                      <tr key={subject.id}>
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>{subject.name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{subject.difficulty} difficulty</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: attColor, fontFamily: 'Outfit, sans-serif' }}>{att}%</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div style={{ height: '100%', width: `${att}%`, background: attColor, borderRadius: '3px', transition: 'width 0.5s' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>75%</span>
                          </div>
                          <div style={{ position: 'relative', height: '6px', marginTop: '-3px' }}>
                            <div style={{ position: 'absolute', left: '75%', width: '2px', height: '12px', background: '#94a3b8', top: '-6px' }} />
                          </div>
                        </td>
                        <td>
                          <span style={{ background: statusBg, color: attColor, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>{statusLabel}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editVal !== undefined ? editVal : att}
                              onChange={e => handleAttendanceChange(subject.id, e.target.value)}
                              style={{ width: '80px', padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                              onFocus={e => {
                                e.target.style.borderColor = '#6366f1'
                                if (editVal === undefined) handleAttendanceChange(subject.id, att.toString())
                              }}
                              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>%</span>
                            {editVal !== undefined && editVal !== att.toString() && (
                              <button
                                onClick={() => handleSave(subject)}
                                disabled={saving === subject.id}
                                style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                {saving === subject.id ? '...' : 'Save'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>Attendance data is self-reported. Official attendance is maintained by your institution. Check with your department for official records.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

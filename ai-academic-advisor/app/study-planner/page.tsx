'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface StudyTask {
  id: string
  subject: string
  duration: number
  priority: string
  goal: string
  status: string
  dayOfWeek: string
  timeSlot: string
}

interface StudyPlan {
  id: string
  title: string
  weekStart: string
  tasks: StudyTask[]
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#10b981',
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Pending: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
  InProgress: { bg: '#dbeafe', color: '#2563eb', label: 'In Progress' },
  Completed: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StudyPlannerPage() {
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/study-plan')
      const data = await res.json()
      setPlan(data.studyPlan)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generatePlan = async () => {
    setGenerating(true)
    setMessage('')
    try {
      const res = await fetch('/api/study-plan', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setPlan(data.studyPlan)
        setMessage('✅ Study plan generated successfully!')
      } else {
        setMessage(data.error || 'Failed to generate plan')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setGenerating(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/study-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setPlan(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
      } : null)
    } catch { /* silently fail */ }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await fetch(`/api/study-tasks/${taskId}`, { method: 'DELETE' })
      setPlan(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) } : null)
    } catch { /* silently fail */ }
  }

  const totalHours = plan?.tasks.reduce((s, t) => s + t.duration, 0) || 0
  const completedTasks = plan?.tasks.filter(t => t.status === 'Completed').length || 0
  const totalTasks = plan?.tasks.length || 0

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2].map(i => <div key={i} className="shimmer" style={{ height: '200px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Study Planner</h1>
            <p className="page-subtitle">AI-generated weekly study schedule based on your academic priorities</p>
          </div>
          <button onClick={generatePlan} disabled={generating} className="btn btn-primary">
            {generating ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="pulse-dot" />Generating...</span> : '🔄 Regenerate Plan'}
          </button>
        </div>

        {message && (
          <div style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2', border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: message.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '14px' }}>
            {message}
          </div>
        )}

        {!plan ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>No study plan yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Generate a personalized weekly study plan based on your weak subjects, available hours, and career goals.</p>
            <button onClick={generatePlan} disabled={generating} className="btn btn-primary">
              {generating ? 'Generating...' : '📅 Generate My Study Plan'}
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Study Hours', value: `${totalHours.toFixed(1)}h`, sub: 'This week', icon: '⏱️', bg: '#dbeafe' },
                { label: 'Tasks', value: `${completedTasks}/${totalTasks}`, sub: 'Completed', icon: '✅', bg: '#dcfce7' },
                { label: 'Progress', value: `${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%`, sub: 'Weekly completion', icon: '📊', bg: '#ede9fe' },
              ].map(card => (
                <div key={card.label} className="stat-card">
                  <div className="stat-icon" style={{ background: card.bg }}><span style={{ fontSize: '22px' }}>{card.icon}</span></div>
                  <div style={{ fontSize: '26px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: '#0f172a', marginBottom: '2px' }}>{card.value}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{card.sub}</div>
                </div>
              ))}
              <div className="stat-card">
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Weekly Progress</span>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '700' }}>{totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div className="progress-fill progress-fill-indigo" style={{ width: `${totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0}%` }} />
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{completedTasks} of {totalTasks} tasks completed</p>
              </div>
            </div>

            {/* Plan Title */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{plan.title}</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Week starting {new Date(plan.weekStart).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Daily Schedule */}
            {DAYS.map(day => {
              const dayTasks = plan.tasks.filter(t => t.dayOfWeek === day)
              if (dayTasks.length === 0) return null
              const dayHours = dayTasks.reduce((s, t) => s + t.duration, 0)

              return (
                <div key={day} className="card" style={{ padding: '22px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{day}</h3>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{dayHours.toFixed(1)} hours total</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dayTasks.map(task => {
                      const ss = STATUS_STYLES[task.status] || STATUS_STYLES.Pending
                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: task.status === 'Completed' ? '#f8fffe' : '#f8fafc', borderRadius: '12px', border: `1px solid ${task.status === 'Completed' ? '#dcfce7' : '#e2e8f0'}`, opacity: task.status === 'Completed' ? 0.75 : 1 }}>
                          <div style={{ width: '4px', height: '44px', background: PRIORITY_COLORS[task.priority] || '#94a3b8', borderRadius: '2px', flexShrink: 0, alignSelf: 'center' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.subject}</span>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{task.duration}h</span>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{task.timeSlot}</span>
                            </div>
                            {task.goal && <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>{task.goal}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ background: ss.bg, color: ss.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{ss.label}</span>
                            <select
                              value={task.status}
                              onChange={e => updateTaskStatus(task.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', background: 'white', color: '#475569' }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="InProgress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '16px' }}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>Study plan generated from academic rule-based analysis. Adjust based on your actual schedule and faculty guidance.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

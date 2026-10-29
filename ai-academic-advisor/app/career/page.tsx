'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface CareerData {
  careerGoal: string
  careerInfo: {
    title: string
    description: string
    skills: Array<{ name: string; priority: string; reason: string }>
    certifications: string[]
    suggestedProjects: string[]
  } | null
  skillAlignment: Array<{
    skill: string
    priority: string
    reason: string
    currentStatus: string
    relatedSubject?: string
    marks?: number
  }>
  interests: string[]
  analysis: {
    overallAverage: number
    strongSubjects: string[]
    weakSubjects: string[]
    riskLevel: string
  } | null
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Strong': { bg: '#dcfce7', color: '#16a34a' },
  'Average': { bg: '#dbeafe', color: '#2563eb' },
  'Needs Improvement': { bg: '#fef3c7', color: '#d97706' },
  'Not Started': { bg: '#f1f5f9', color: '#64748b' },
}

export default function CareerPage() {
  const [data, setData] = useState<CareerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/career-guidance').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  if (!data) return null

  const skills = data.skillAlignment || []
  const highPriority = skills.filter(s => s.priority === 'High' || s.priority === 'Critical')
  const needsWork = skills.filter(s => s.currentStatus === 'Needs Improvement' || s.currentStatus === 'Not Started')
  const strong = skills.filter(s => s.currentStatus === 'Strong')

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Career Guidance</h1>
          <p className="page-subtitle">How your academic profile aligns with your career goal</p>
        </div>

        {/* Career Goal Banner */}
        <div className="ai-insight-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '36px' }}>🎯</span>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Career Goal</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '900', fontFamily: 'Outfit, sans-serif' }}>{data.careerGoal || 'Not set'}</div>
            </div>
            {data.analysis && (
              <div style={{ marginLeft: 'auto', textAlign: 'right', position: 'relative', zIndex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>Overall Average</div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: '900' }}>{data.analysis.overallAverage}%</div>
              </div>
            )}
          </div>
          {data.careerInfo && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>{data.careerInfo.description}</p>}
          {data.interests.length > 0 && (
            <div style={{ marginTop: '12px', position: 'relative', zIndex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>Your Interests: </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{data.interests.join(' • ')}</span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Strong Skills', value: strong.length.toString(), icon: '💪', bg: '#dcfce7', color: '#16a34a' },
            { label: 'Needs Work', value: needsWork.length.toString(), icon: '📖', bg: '#fef3c7', color: '#d97706' },
            { label: 'High Priority', value: highPriority.length.toString(), icon: '🎯', bg: '#dbeafe', color: '#2563eb' },
            { label: 'Certifications', value: (data.careerInfo?.certifications?.length || 0).toString(), icon: '🏆', bg: '#ede9fe', color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: '22px' }}>{s.icon}</span></div>
              <div style={{ fontSize: '26px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skills Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>🔧 Required Skills for {data.careerGoal}</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Skill alignment with your academic profile</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {skills.slice(0, 8).map(skill => {
                const ss = STATUS_STYLES[skill.currentStatus] || STATUS_STYLES['Not Started']
                return (
                  <div key={skill.skill} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{skill.skill}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{skill.priority}</span>
                        <span style={{ background: ss.bg, color: ss.color, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{skill.currentStatus}</span>
                      </div>
                    </div>
                    {skill.relatedSubject && <p style={{ fontSize: '11px', color: '#94a3b8' }}>Related to: {skill.relatedSubject}{skill.marks !== undefined ? ` (${skill.marks}%)` : ''}</p>}
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginTop: '4px' }}>{skill.reason}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Certifications */}
            {data.careerInfo?.certifications && data.careerInfo.certifications.length > 0 && (
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>🏆 Recommended Certifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.careerInfo.certifications.map((cert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '18px' }}>🎖️</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {data.careerInfo?.suggestedProjects && data.careerInfo.suggestedProjects.length > 0 && (
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>💻 Suggested Projects</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.careerInfo.suggestedProjects.slice(0, 4).map((proj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>{i+1}</div>
                      <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{proj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="disclaimer">
          <span>ℹ️</span>
          <span>Career guidance is based on your academic data and general industry knowledge. Consult your placement officer and faculty advisor for institutional career guidance.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

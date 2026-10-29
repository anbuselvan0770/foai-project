'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

interface Recommendation {
  id: string
  title: string
  category: string
  priority: string
  reason: string
  benefit: string
  suggestedAction: string
  isAddedToPlan: boolean
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Critical: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  High: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' },
  Medium: { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
  Low: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
}

const CATEGORY_ICONS: Record<string, string> = {
  Study: '📚', Skill: '🔧', Course: '🎓', Resource: '📖', Career: '🏆',
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/recommendations')
      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const generateRecommendations = async () => {
    setGenerating(true)
    setMessage('')
    try {
      const res = await fetch('/api/ai/recommendations', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage('✅ Recommendations generated successfully!')
        await load()
      } else {
        setMessage(data.error || 'Failed to generate recommendations')
      }
    } catch {
      setMessage('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const categories = ['All', ...Array.from(new Set(recommendations.map(r => r.category)))]
  const filtered = activeCategory === 'All' ? recommendations : recommendations.filter(r => r.category === activeCategory)

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: '150px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">AI Recommendations</h1>
            <p className="page-subtitle">Personalized recommendations based on your academic profile and career goals</p>
          </div>
          <button onClick={generateRecommendations} disabled={generating} className="btn btn-primary">
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-dot" />
                Generating...
              </span>
            ) : '✨ Regenerate AI Recommendations'}
          </button>
        </div>

        {message && (
          <div style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2', border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: message.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize: '14px' }}>
            {message}
          </div>
        )}

        {recommendations.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💡</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>No recommendations yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Generate your first AI recommendations based on your academic profile.</p>
            <button onClick={generateRecommendations} disabled={generating} className="btn btn-primary">
              {generating ? 'Generating...' : '✨ Generate My Recommendations'}
            </button>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '7px 18px', borderRadius: '20px', border: activeCategory === cat ? '2px solid #6366f1' : '2px solid #e2e8f0', background: activeCategory === cat ? '#ede9fe' : 'white', color: activeCategory === cat ? '#4f46e5' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {cat === 'All' ? `All (${recommendations.length})` : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
                </button>
              ))}
            </div>

            {/* Recommendations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filtered.map(rec => {
                const ps = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Medium
                const isExpanded = expandedId === rec.id
                return (
                  <div key={rec.id} className="card" style={{ padding: '22px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '20px' }}>{CATEGORY_ICONS[rec.category] || '💡'}</span>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{rec.title}</h3>
                          <span style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>{rec.priority}</span>
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{rec.category}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{rec.reason}</p>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '18px', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.2s ease' }}>
                        {/* Why this */}
                        <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>🔍 Why this recommendation?</div>
                          <p style={{ fontSize: '14px', color: '#1e40af', lineHeight: 1.7 }}>{rec.reason}</p>
                        </div>

                        {rec.benefit && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>💎 Expected Benefit</div>
                            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>{rec.benefit}</p>
                          </div>
                        )}

                        {rec.suggestedAction && (
                          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>📌 Suggested Action</div>
                            <p style={{ fontSize: '14px', color: '#0f172a', lineHeight: 1.6 }}>{rec.suggestedAction}</p>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Link href="/study-planner" className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>+ Add to Study Plan</Link>
                          <Link href="/advisor" className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>Ask AI About This</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>AI Academic Advisor provides personalized decision support. Final academic decisions should follow institutional rules and faculty guidance.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

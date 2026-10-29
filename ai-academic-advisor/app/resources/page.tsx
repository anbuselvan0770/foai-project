'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Resource {
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
}

const DIFFICULTY_STYLES: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: '#dcfce7', color: '#16a34a' },
  Intermediate: { bg: '#dbeafe', color: '#2563eb' },
  Advanced: { bg: '#ede9fe', color: '#7c3aed' },
}

const TYPE_ICONS: Record<string, string> = {
  Course: '🎓', Book: '📚', Video: '📹', Practice: '💻', Tool: '🔧', Article: '📄', Tutorial: '📖',
}

const CATEGORIES = ['All', 'Programming', 'Data Science', 'Cloud', 'Security', 'Web', 'Mobile', 'AI', 'DevOps']

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeDifficulty, setActiveDifficulty] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch('/api/resources').then(r => r.json()).then(d => setResources(d.resources || [])).finally(() => setLoading(false))
  }, [])

  const filtered = resources.filter(r => {
    const matchCategory = activeCategory === 'All' || r.category.toLowerCase().includes(activeCategory.toLowerCase())
    const matchDifficulty = activeDifficulty === 'All' || r.difficulty === activeDifficulty
    const matchSearch = searchTerm === '' || r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.relatedSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchCategory && matchDifficulty && matchSearch
  })

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: '160px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Learning Resources</h1>
          <p className="page-subtitle">Curated resources aligned with your career goals and academic needs</p>
        </div>

        {/* Search + Filters */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <input
            className="form-input"
            placeholder="🔍 Search resources, skills..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 16px', borderRadius: '20px', border: activeCategory === cat ? '2px solid #6366f1' : '2px solid #e2e8f0', background: activeCategory === cat ? '#ede9fe' : 'white', color: activeCategory === cat ? '#4f46e5' : '#64748b', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
              <button key={diff} onClick={() => setActiveDifficulty(diff)} style={{ padding: '5px 14px', borderRadius: '20px', border: activeDifficulty === diff ? '2px solid #8b5cf6' : '2px solid #e2e8f0', background: activeDifficulty === diff ? '#f5f3ff' : 'white', color: activeDifficulty === diff ? '#7c3aed' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
          Showing <strong>{filtered.length}</strong> of <strong>{resources.length}</strong> resources
        </p>

        {/* Resources Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#475569' }}>No resources found</h3>
            <p style={{ color: '#94a3b8' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filtered.map(r => {
              const ds = DIFFICULTY_STYLES[r.difficulty] || DIFFICULTY_STYLES.Beginner
              return (
                <div key={r.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '28px' }}>{TYPE_ICONS[r.type] || '📄'}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{ background: ds.bg, color: ds.color, padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{r.difficulty}</span>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{r.type}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', lineHeight: 1.3 }}>{r.title}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '12px', flex: 1 }}>{r.description}</p>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>PROVIDER: </span>
                    <span style={{ fontSize: '12px', color: '#475569' }}>{r.provider}</span>
                  </div>
                  {r.relatedSkills.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {r.relatedSkills.slice(0, 3).map(skill => (
                        <span key={skill} style={{ background: '#f0f4ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', textAlign: 'center' }}>
                      Start Learning →
                    </a>
                  ) : (
                    <button className="btn btn-secondary btn-sm" disabled style={{ cursor: 'default', opacity: 0.6 }}>
                      Search on Google →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>Learning resources are curated recommendations. Always verify course quality and check your institution&apos;s recommended resources.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('gemini')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSaveApiKey = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, provider }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('✅ API key saved successfully! The AI advisor will now use your key.')
        setApiKey('')
      } else {
        setMessage(data.error || 'Failed to save API key')
      }
    } catch {
      setMessage('⚠️ Note: API key configuration is stored in environment variables. Please update your .env.local file directly for now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your AI Academic Advisor preferences</p>
        </div>

        {/* AI Configuration */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>🤖 AI Provider Configuration</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: 1.7 }}>
            Configure your LLM API key to enable full AI capabilities. Without an API key, the system operates in Demo Mode with pre-configured responses.
          </p>

          <div className="form-group">
            <label className="form-label">AI Provider</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[
                { id: 'gemini', label: '🌟 Google Gemini', sub: 'Recommended' },
                { id: 'openai', label: '⚡ OpenAI GPT', sub: 'GPT-4o-mini' },
                { id: 'demo', label: '🎓 Demo Mode', sub: 'No API key' },
              ].map(p => (
                <button key={p.id} onClick={() => setProvider(p.id)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: provider === p.id ? '2px solid #6366f1' : '2px solid #e2e8f0', background: provider === p.id ? '#ede9fe' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: provider === p.id ? '#4f46e5' : '#0f172a', marginBottom: '2px' }}>{p.label}</div>
                  <div style={{ fontSize: '11px', color: provider === p.id ? '#6366f1' : '#94a3b8' }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {provider !== 'demo' && (
            <div className="form-group">
              <label className="form-label">{provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}</label>
              <input className="form-input" type="password" placeholder={`Enter your ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key...`} value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                {provider === 'gemini' ? '→ Get your free API key at: ai.google.dev' : '→ Get your API key at: platform.openai.com'}
              </p>
            </div>
          )}

          {message && (
            <div style={{ background: message.startsWith('✅') ? '#dcfce7' : '#fef3c7', border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fcd34d'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: message.startsWith('✅') ? '#16a34a' : '#d97706', fontSize: '13px' }}>
              {message}
            </div>
          )}

          {provider !== 'demo' && (
            <button onClick={handleSaveApiKey} disabled={saving || !apiKey.trim()} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save API Configuration'}
            </button>
          )}
        </div>

        {/* How to configure */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>⚙️ Manual Configuration (Recommended)</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.7 }}>
            The most secure way to configure your API key is through the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>.env.local</code> file in the project root.
          </p>
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '16px' }}>
            <div><span style={{ color: '#64748b' }}># .env.local</span></div>
            <div><span style={{ color: '#22d3ee' }}>GOOGLE_GEMINI_API_KEY</span>=<span style={{ color: '#86efac' }}>your_gemini_api_key_here</span></div>
            <div><span style={{ color: '#22d3ee' }}>OPENAI_API_KEY</span>=<span style={{ color: '#86efac' }}>your_openai_key_here</span></div>
            <div><span style={{ color: '#22d3ee' }}>AI_PROVIDER</span>=<span style={{ color: '#86efac' }}>gemini</span> <span style={{ color: '#64748b' }}># or openai or demo</span></div>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
            After editing .env.local, restart the development server (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>npm run dev</code>) for changes to take effect.
          </p>
        </div>

        {/* About */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>ℹ️ About AI Academic Advisor</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['Application', 'AI Academic Advisor — Intelligent Student Guidance System'],
              ['Version', '1.0.0'],
              ['Architecture', 'Next.js 14 + Prisma + SQLite + AI Agent (Gemini/OpenAI)'],
              ['AI Pipeline', 'Intent Detection → Context Assembly → Rule Engine → LLM → Validation'],
              ['Demo Student', 'Arun Kumar (CSE, Year 3, Semester 5)'],
            ].map(([key, val]) => (
              <div key={key} style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '120px' }}>{key}</span>
                <span style={{ fontSize: '13px', color: '#0f172a' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="disclaimer" style={{ marginTop: '24px' }}>
          <span>ℹ️</span>
          <span>API keys are stored in environment variables only and never sent to third parties or stored in the database.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

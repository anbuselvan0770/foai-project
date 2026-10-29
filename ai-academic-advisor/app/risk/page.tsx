'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface RiskFactor {
  category: string
  description: string
  severity: string
  weight: number
}

interface Analysis {
  riskLevel: string
  riskScore: number
  riskFactors: RiskFactor[]
  riskSuggestions: string[]
  overallAverage: number
  subjectAnalyses: Array<{
    subject: { name: string; marks: number; attendance: number; difficulty: string }
    performanceStatus: string
    attendanceStatus: string
    isCritical: boolean
    hasAttendanceRisk: boolean
  }>
}

const RISK_CONFIGS = {
  LOW: { color: '#16a34a', bg: '#dcfce7', border: '#86efac', icon: '✅', label: 'LOW RISK', desc: 'Your academic standing is good. Keep maintaining your current performance.' },
  MEDIUM: { color: '#d97706', bg: '#fef3c7', border: '#fcd34d', icon: '⚠️', label: 'MEDIUM RISK', desc: 'Some areas need attention. Address the risk factors below to improve your academic standing.' },
  HIGH: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '🔴', label: 'HIGH RISK', desc: 'Immediate action required. Multiple risk factors detected that could affect your academic progress.' },
}

const SEVERITY_STYLES = {
  high: { bg: '#fee2e2', color: '#dc2626', label: 'High' },
  medium: { bg: '#fef3c7', color: '#d97706', label: 'Medium' },
  low: { bg: '#dcfce7', color: '#16a34a', label: 'Low' },
}

export default function RiskPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/analysis')
        if (res.status === 422) { setError('complete_profile'); return }
        if (!res.ok) { setError('Failed to load risk analysis'); return }
        const data = await res.json()
        setAnalysis(data.analysis)
      } catch { setError('Network error') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return <DashboardLayout><div className="page-container">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '160px', borderRadius: '16px', marginBottom: '16px' }} />)}</div></DashboardLayout>
  }

  if (error === 'complete_profile') {
    return (
      <DashboardLayout>
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Complete your profile first</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Add your subjects and marks to see your academic risk analysis.</p>
            <a href="/subjects" className="btn btn-primary">Add Subjects →</a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analysis) return null

  const riskConfig = RISK_CONFIGS[analysis.riskLevel as keyof typeof RISK_CONFIGS] || RISK_CONFIGS.LOW

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Academic Risk Analysis</h1>
          <p className="page-subtitle">Rule-based academic risk assessment using your marks, attendance, and performance patterns</p>
        </div>

        {/* Overall Risk Card */}
        <div style={{ background: riskConfig.bg, border: `2px solid ${riskConfig.border}`, borderRadius: '20px', padding: '28px 32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '36px' }}>{riskConfig.icon}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: riskConfig.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Overall Academic Risk</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: riskConfig.color, fontFamily: 'Outfit, sans-serif' }}>{riskConfig.label}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: riskConfig.color, fontWeight: '600', opacity: 0.7, marginBottom: '4px' }}>Risk Score</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: riskConfig.color, fontFamily: 'Outfit, sans-serif' }}>{Math.round(analysis.riskScore)}/100</div>
            </div>
          </div>
          <p style={{ color: riskConfig.color, fontSize: '14px', lineHeight: 1.7, opacity: 0.85 }}>{riskConfig.desc}</p>

          {/* Risk Score Bar */}
          <div style={{ marginTop: '16px' }}>
            <div className="progress-bar" style={{ height: '8px', background: 'rgba(255,255,255,0.5)' }}>
              <div style={{ height: '100%', width: `${analysis.riskScore}%`, background: riskConfig.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: riskConfig.color, opacity: 0.6 }}>0 — Low Risk</span>
              <span style={{ fontSize: '11px', color: riskConfig.color, opacity: 0.6 }}>100 — High Risk</span>
            </div>
          </div>
        </div>

        {/* Risk Factor Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Risk Factors */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>⚠️ Risk Factors Detected</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Deterministic rule-based analysis</p>
            {analysis.riskFactors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <p style={{ fontSize: '14px' }}>No significant risk factors detected!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analysis.riskFactors.map((factor, i) => {
                  const ss = SEVERITY_STYLES[factor.severity as keyof typeof SEVERITY_STYLES] || SEVERITY_STYLES.medium
                  return (
                    <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${ss.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{factor.category}</span>
                        <span style={{ background: ss.bg, color: ss.color, padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>{ss.label} ({factor.weight}pts)</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{factor.description}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Subject Risk Summary */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>📊 Subject Risk Summary</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Individual subject risk indicators</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.subjectAnalyses.map(sa => (
                <div key={sa.subject.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{sa.subject.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sa.subject.marks}% marks • {sa.subject.attendance}% attendance</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {sa.isCritical && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>Critical Marks</span>}
                    {sa.hasAttendanceRisk && <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>Attendance Risk</span>}
                    {!sa.isCritical && !sa.hasAttendanceRisk && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>OK</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>📌 Suggested Actions</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>Steps to reduce your academic risk</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {analysis.riskSuggestions.map((suggestion, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>{i+1}</div>
                <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, flex: 1 }}>{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="disclaimer">
          <span>ℹ️</span>
          <span>Academic Risk Indicator uses deterministic rule-based analysis — not an ML prediction. This is a decision support tool. Consult your faculty advisor for official academic guidance.</span>
        </div>
      </div>
    </DashboardLayout>
  )
}

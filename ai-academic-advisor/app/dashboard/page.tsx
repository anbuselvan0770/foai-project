'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

interface Analysis {
  overallAverage: number
  overallGrade: string
  strongSubjects: Array<{ name: string; marks: number }>
  weakSubjects: Array<{ name: string; marks: number }>
  criticalSubjects: Array<{ name: string; marks: number }>
  attendanceRiskSubjects: Array<{ name: string; attendance: number }>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string
  riskScore: number
  aiInsight: string
  subjectAnalyses: Array<{
    subject: { id?: string; name: string; marks: number; attendance: number; difficulty: string; grade?: string }
    performanceStatus: string
    attendanceStatus: string
  }>
  studyPriorities: Array<{ subject: string; hoursPerWeek: number; priority: string; reason?: string }>
}

interface ProfileDetails {
  department: string
  year: number
  semester: number
  studyHoursPerDay: number
  targetGPA: number
  learningStyle: string
}

interface UserInfo {
  id: string
  name: string
  email: string
  isDemo?: boolean
}

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

const RISK_BADGES: Record<string, { bg: string; color: string; border: string; glow: string }> = {
  LOW: { bg: '#dcfce7', color: '#15803d', border: '#86efac', glow: 'rgba(34, 197, 94, 0.2)' },
  MEDIUM: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', glow: 'rgba(245, 158, 11, 0.2)' },
  HIGH: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', glow: 'rgba(239, 68, 68, 0.2)' },
}

const STATUS_COLORS: Record<string, string> = {
  Strong: '#10b981',
  Average: '#6366f1',
  'Needs Attention': '#f59e0b',
  Critical: '#ef4444',
}

const PRIORITY_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fee2e2', color: '#dc2626' },
  High: { bg: '#fef3c7', color: '#d97706' },
  Medium: { bg: '#e0e7ff', color: '#4338ca' },
  Low: { bg: '#dcfce7', color: '#16a34a' },
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getTodayName() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

function formatDepartment(dept: string): string {
  if (!dept) return 'General Studies'
  const lower = dept.toLowerCase().trim()
  if (lower === 'cse' || lower === 'computer science') return 'Computer Science & Engineering'
  if (lower === 'ece') return 'Electronics & Communication Eng.'
  if (lower === 'eee') return 'Electrical & Electronics Eng.'
  if (lower === 'it') return 'Information Technology'
  if (lower === 'mech' || lower === 'me') return 'Mechanical Engineering'
  if (lower === 'civil') return 'Civil Engineering'
  return dept.toUpperCase() === dept ? dept : dept.charAt(0).toUpperCase() + dept.slice(1)
}

export default function DashboardPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [profile, setProfile] = useState<ProfileDetails | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [careerGoal, setCareerGoal] = useState<string>('')
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedUid, setCopiedUid] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>('All')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [chartView, setChartView] = useState<'both' | 'marks' | 'attendance'>('both')

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [analysisRes, profileRes, planRes] = await Promise.all([
          fetch('/api/student/analysis'),
          fetch('/api/student/profile'),
          fetch('/api/study-plan'),
        ])

        if (analysisRes.status === 401 || profileRes.status === 401) {
          router.push('/login')
          return
        }

        const profileData = await profileRes.json()
        if (profileData.user) setUser(profileData.user)
        if (profileData.profile) setProfile(profileData.profile)
        if (profileData.careerGoal) setCareerGoal(profileData.careerGoal)

        if (planRes.ok) {
          const planData = await planRes.json()
          if (planData.studyPlan) setStudyPlan(planData.studyPlan)
        }

        if (analysisRes.status === 422) {
          setError('complete_profile')
          setLoading(false)
          return
        }

        if (!analysisRes.ok) {
          setError('Failed to load analysis')
          setLoading(false)
          return
        }

        const analysisData = await analysisRes.json()
        setAnalysis(analysisData.analysis)
      } catch {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [router])

  // Set default day filter to today once loaded
  useEffect(() => {
    const today = getTodayName()
    if (DAYS_OF_WEEK.includes(today)) {
      setSelectedDay(today)
    }
  }, [])

  const handleToggleTask = async (task: StudyTask) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
    setUpdatingTaskId(task.id)

    // Optimistic UI update
    setStudyPlan(prev => {
      if (!prev) return null
      return {
        ...prev,
        tasks: prev.tasks.map(t => (t.id === task.id ? { ...t, status: newStatus } : t)),
      }
    })

    try {
      await fetch(`/api/study-tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      // Revert if error
      setStudyPlan(prev => {
        if (!prev) return null
        return {
          ...prev,
          tasks: prev.tasks.map(t => (t.id === task.id ? { ...t, status: task.status } : t)),
        }
      })
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true)
    try {
      const res = await fetch('/api/study-plan', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.studyPlan) {
        setStudyPlan(data.studyPlan)
      }
    } catch {
      /* silently fail */
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '24px' }}>
            <div className="shimmer" style={{ height: '240px', borderRadius: '20px' }} />
            <div className="shimmer" style={{ height: '240px', borderRadius: '20px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="shimmer" style={{ height: '110px', borderRadius: '16px' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="shimmer" style={{ height: '320px', borderRadius: '16px' }} />
            <div className="shimmer" style={{ height: '320px', borderRadius: '16px' }} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error === 'complete_profile') {
    return (
      <DashboardLayout>
        <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
          <div className="bento-card" style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 32px' }}>
            <div style={{ width: '68px', height: '68px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
              🎓
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: '#0f172a' }}>Activate Your Student Profile</h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
              Add your enrolled subjects, current marks, and attendance to unlock your digital Student UID card, academic health tracking, and AI guidance.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/subjects" className="btn btn-primary">Add Subjects →</Link>
              <Link href="/onboarding" className="btn btn-secondary">Run Setup Wizard</Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analysis) return null

  // Generated Official Student UID string
  const studentYear = profile?.year || 1
  const studentSem = profile?.semester || 1
  const deptCode = profile?.department ? profile.department.slice(0, 3).toUpperCase() : 'CSE'
  const userSuffix = user?.id ? user.id.slice(-4).toUpperCase() : '8942'
  const studentUID = `UID-${deptCode}-${2026 - (4 - studentYear)}-${userSuffix}`

  const overallAtt = analysis.subjectAnalyses.length > 0
    ? Math.round(analysis.subjectAnalyses.reduce((s, a) => s + a.subject.attendance, 0) / analysis.subjectAnalyses.length)
    : 0

  const targetGPA = profile?.targetGPA || 75
  const gpaDelta = Math.round(analysis.overallAverage - targetGPA)
  const gpaScale4 = ((analysis.overallAverage / 100) * 4).toFixed(2)
  const riskBadge = RISK_BADGES[analysis.riskLevel] || RISK_BADGES.LOW

  // Study tasks calculation
  const allTasks = studyPlan?.tasks || []
  const filteredTasks = selectedDay === 'All'
    ? allTasks
    : allTasks.filter(t => t.dayOfWeek.toLowerCase() === selectedDay.toLowerCase())

  const completedCount = allTasks.filter(t => t.status === 'Completed').length
  const totalTasksCount = allTasks.length
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0

  // Chart data with safe fallback formatting
  const chartData = analysis.subjectAnalyses.map(a => ({
    name: a.subject.name.length > 15 ? a.subject.name.slice(0, 15) + '…' : a.subject.name,
    fullName: a.subject.name,
    marks: a.subject.marks,
    attendance: a.subject.attendance,
    status: a.performanceStatus,
    grade: a.subject.grade || 'A',
    fill: STATUS_COLORS[a.performanceStatus] || '#6366f1',
  }))

  const copyUidToClipboard = () => {
    navigator.clipboard.writeText(studentUID)
    setCopiedUid(true)
    setTimeout(() => setCopiedUid(false), 2000)
  }

  // Radial calculation for Target GPA circle
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, analysis.overallAverage)) / 100) * circumference

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in" style={{ maxWidth: '1440px', padding: '24px 28px' }}>
        
        {/* ─── Top Greeting & Action Header ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#e0e7ff', color: '#4338ca', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
              <span>🏛️</span>
              <span>Academic Intelligence Hub</span>
              <span>•</span>
              <span>Semester {studentSem}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Good {getGreeting()}, {user?.name?.split(' ')[0] || 'Amirtha'} 👋
            </h1>
            <p className="page-subtitle" style={{ fontSize: '14px', color: '#64748b' }}>
              Your verified academic identity, performance metrics, and daily study planner.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/recommendations" className="btn btn-primary btn-sm" style={{ boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}>
              ✨ AI Recommendations
            </Link>
            <Link href="/advisor" className="btn btn-secondary btn-sm" style={{ border: '1px solid #cbd5e1' }}>
              💬 Ask AI Advisor
            </Link>
            <Link href="/subjects" className="btn btn-secondary btn-sm" style={{ border: '1px solid #cbd5e1' }}>
              📚 Enrolled Subjects
            </Link>
          </div>
        </div>

        {/* ─── Hero Section: Digital Student UID Card & Target GPA Bento ────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.4fr) minmax(320px, 1fr)', gap: '20px', marginBottom: '24px' }}>
          
          {/* DIGITAL STUDENT UID CARD */}
          <div className="student-uid-card">
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)' }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase' }}>
                    AI Academic Institution
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.04em', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                    DIGITAL STUDENT IDENTITY
                  </div>
                </div>
              </div>

              {/* Gold Chip & NFC Emblem */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="uid-chip" title="Smart Card Security Chip" />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              {/* Photo Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '18px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900', color: 'white', border: '2px solid rgba(255, 255, 255, 0.25)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)' }}>
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                </div>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#10b981', width: '18px', height: '18px', borderRadius: '50%', border: '3px solid #070d19', boxShadow: '0 0 8px #10b981' }} title="Status: Enrolled & Active" />
              </div>

              {/* Student Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.01em', fontFamily: 'Outfit, sans-serif' }}>
                    {user?.name || 'Amirtha'}
                  </h2>
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '600', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatDepartment(profile?.department || 'cse')}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                    Year {studentYear} • Sem {studentSem}
                  </span>
                  {careerGoal && (
                    <span style={{ fontSize: '12px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.25)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                      🎯 {careerGoal}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* UID Badge & Barcode Footer */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Official Student UID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '14px', fontWeight: '700', color: '#67e8f9', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                    {studentUID}
                  </code>
                  <button
                    onClick={copyUidToClipboard}
                    style={{ background: copiedUid ? '#10b981' : 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    title="Copy Student UID"
                  >
                    {copiedUid ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Barcode Graphic */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <div className="barcode-strip">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2].map((w, idx) => (
                    <div key={idx} className="barcode-bar" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                  VERIFIED • 2026
                </span>
              </div>
            </div>
          </div>

          {/* TARGET GPA & RADIAL PROGRESS METER */}
          <div className="bento-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                    🎯 Target GPA & Performance
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Semester goals vs current score</p>
                </div>
                <span style={{ background: gpaDelta >= 0 ? '#dcfce7' : '#fee2e2', color: gpaDelta >= 0 ? '#15803d' : '#b91c1c', border: `1px solid ${gpaDelta >= 0 ? '#86efac' : '#fca5a5'}`, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>
                  {gpaDelta >= 0 ? `+${gpaDelta}% Ahead` : `${gpaDelta}% Behind`}
                </span>
              </div>

              {/* Radial Meter & Quick Metrics */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '12px 0 18px' }}>
                {/* SVG Radial Meter */}
                <div style={{ position: 'relative', width: '104px', height: '104px', flexShrink: 0 }}>
                  <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle cx="52" cy="52" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    {/* Target indicator ring */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* Value ring */}
                    <circle
                      cx="52"
                      cy="52"
                      r={radius}
                      fill="none"
                      stroke="url(#gpaGradient)"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                    <defs>
                      <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      {analysis.overallAverage}%
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
                      Grade {analysis.overallGrade}
                    </span>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Current Average</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{analysis.overallAverage}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '5px' }}>
                      <div style={{ width: `${analysis.overallAverage}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Target Benchmark</span>
                      <span style={{ fontWeight: '700', color: '#6366f1' }}>{targetGPA}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '5px' }}>
                      <div style={{ width: `${targetGPA}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>GPA Estimate (4.0):</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      {gpaScale4} / 4.00
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick target status footer */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: '#475569', fontWeight: '500' }}>
                Daily study plan: <strong>{profile?.studyHoursPerDay || 2}h/day</strong>
              </span>
              <Link href="/profile" style={{ color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                Adjust Target →
              </Link>
            </div>
          </div>

        </div>

        {/* ─── 4 Bento Stat Cards ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Stat 1: Overall Average */}
          <div className="bento-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overall Average
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                📊
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                {analysis.overallAverage}%
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                Grade {analysis.overallGrade}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Based on {analysis.subjectAnalyses.length} enrolled {analysis.subjectAnalyses.length === 1 ? 'subject' : 'subjects'}
            </div>
          </div>

          {/* Stat 2: Attendance */}
          <div className="bento-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg Attendance
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: overallAtt >= 75 ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                📋
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                {overallAtt}%
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: overallAtt >= 75 ? '#16a34a' : '#dc2626', background: overallAtt >= 75 ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>
                {overallAtt >= 75 ? 'Safe (≥75%)' : 'Shortage Warning'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {overallAtt >= 75 ? `+${overallAtt - 75}% margin above minimum requirement` : 'Immediate attendance improvement required'}
            </div>
          </div>

          {/* Stat 3: Strong Subjects */}
          <div className="bento-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Strong Subjects
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                ⭐
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '30px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                {analysis.strongSubjects.length}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                Score ≥ 80%
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {analysis.strongSubjects.map(s => s.name).join(', ') || 'No subject at ≥80% yet'}
            </div>
          </div>

          {/* Stat 4: Needs Attention & Risk */}
          <div className="bento-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Academic Risk
              </span>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: riskBadge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                🛡️
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: riskBadge.color, fontFamily: 'Outfit, sans-serif' }}>
                {analysis.riskLevel}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                Score: {analysis.riskScore}/100
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {analysis.criticalSubjects.length + analysis.weakSubjects.length === 0
                ? 'All courses on healthy track'
                : `${analysis.criticalSubjects.length + analysis.weakSubjects.length} subjects require study focus`}
            </div>
          </div>

        </div>

        {/* ─── Middle Section: Study Planner Widget & Subject Analytics ─────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.15fr) minmax(360px, 1fr)', gap: '20px', marginBottom: '24px' }}>
          
          {/* UPCOMING TASKS / STUDY PLANNER QUICK WIDGET (USER REQUESTED FEATURE) */}
          <div className="bento-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                    📅 Study Schedule & Upcoming Tasks
                  </h3>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                    {completedCount}/{totalTasksCount} Done
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Click any task to check off completed study sessions</p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  title="Regenerate optimal study plan based on current subject marks"
                >
                  {isGeneratingPlan ? 'Generating...' : '✨ Regenerate'}
                </button>
                <Link href="/study-planner" className="btn btn-primary btn-sm" style={{ fontSize: '12px', padding: '4px 10px' }}>
                  Full Planner →
                </Link>
              </div>
            </div>

            {/* Task Progress Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>
                <span>Weekly Plan Completion</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{completionPercentage}%</span>
              </div>
              <div className="progress-bar" style={{ height: '6px' }}>
                <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Day Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setSelectedDay('All')}
                className={`tab-pill ${selectedDay === 'All' ? 'active' : ''}`}
              >
                All Days
              </button>
              {DAYS_OF_WEEK.map(d => {
                const count = allTasks.filter(t => t.dayOfWeek.toLowerCase() === d.toLowerCase()).length
                const isToday = d.toLowerCase() === getTodayName().toLowerCase()
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`tab-pill ${selectedDay === d ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                  >
                    {d.slice(0, 3)} {count > 0 ? `(${count})` : ''}
                    {isToday && (
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: selectedDay === d ? 'white' : '#6366f1', display: 'inline-block', marginLeft: '4px', verticalAlign: 'middle' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tasks List */}
            <div style={{ flex: 1, minHeight: '220px', maxHeight: '310px', overflowY: 'auto' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>No tasks scheduled for {selectedDay}</div>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>You have completed all items or have no session on this day.</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isDone = task.status === 'Completed'
                  const pStyle = PRIORITY_BADGE_STYLES[task.priority] || PRIORITY_BADGE_STYLES.Low
                  return (
                    <div
                      key={task.id}
                      className={`task-item-row ${isDone ? 'completed' : ''}`}
                      onClick={() => handleToggleTask(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div
                          className={`task-checkbox-custom ${isDone ? 'checked' : ''}`}
                          title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
                        >
                          {isDone && <span style={{ fontSize: '13px', lineHeight: 1 }}>✓</span>}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                            <span className="task-title" style={{ fontSize: '14px', fontWeight: '700', color: isDone ? '#94a3b8' : '#0f172a' }}>
                              {task.subject}
                            </span>
                            <span style={{ background: pStyle.bg, color: pStyle.color, padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                              {task.timeSlot} • {task.duration}h
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.goal || `Study session for ${task.subject}`}
                          </p>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '10px', whiteSpace: 'nowrap' }}>
                        {task.dayOfWeek.slice(0, 3)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick Action Footer */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
              <span>Total Scheduled: <strong>{allTasks.reduce((s, t) => s + t.duration, 0).toFixed(1)} hrs/week</strong></span>
              <span>Showing: {selectedDay}</span>
            </div>
          </div>

          {/* PERFORMANCE & ATTENDANCE CHARTS (FIXED SINGLE BAR BUG & STYLED) */}
          <div className="bento-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                  📊 Academic Mastery Analytics
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Marks vs Attendance breakdown per course</p>
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                <button
                  onClick={() => setChartView('both')}
                  style={{ border: 'none', background: chartView === 'both' ? 'white' : 'transparent', color: chartView === 'both' ? '#0f172a' : '#64748b', fontWeight: '700', fontSize: '11px', padding: '4px 10px', borderRadius: '7px', cursor: 'pointer', boxShadow: chartView === 'both' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  Dual View
                </button>
                <button
                  onClick={() => setChartView('marks')}
                  style={{ border: 'none', background: chartView === 'marks' ? 'white' : 'transparent', color: chartView === 'marks' ? '#0f172a' : '#64748b', fontWeight: '700', fontSize: '11px', padding: '4px 10px', borderRadius: '7px', cursor: 'pointer', boxShadow: chartView === 'marks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  Marks
                </button>
                <button
                  onClick={() => setChartView('attendance')}
                  style={{ border: 'none', background: chartView === 'attendance' ? 'white' : 'transparent', color: chartView === 'attendance' ? '#0f172a' : '#64748b', fontWeight: '700', fontSize: '11px', padding: '4px 10px', borderRadius: '7px', cursor: 'pointer', boxShadow: chartView === 'attendance' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  Attendance
                </button>
              </div>
            </div>

            {/* Recharts Bar Container */}
            <div style={{ width: '100%', height: 260, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                  barGap={8}
                >
                  <defs>
                    <linearGradient id="marksBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="attBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} ticks={[0, 25, 50, 75, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    formatter={(val, name, props) => [
                      `${val}%`,
                      name === 'marks' ? 'Marks Scored' : 'Attendance Rate',
                    ]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                  />
                  <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '75% Min', fill: '#d97706', fontSize: 10, position: 'right' }} />

                  {(chartView === 'both' || chartView === 'marks') && (
                    <Bar
                      dataKey="marks"
                      name="marks"
                      maxBarSize={44}
                      radius={[8, 8, 2, 2]}
                      fill="url(#marksBarGrad)"
                    />
                  )}

                  {(chartView === 'both' || chartView === 'attendance') && (
                    <Bar
                      dataKey="attendance"
                      name="attendance"
                      maxBarSize={44}
                      radius={[8, 8, 2, 2]}
                      fill="url(#attBarGrad)"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Status indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Marks Scored</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#6366f1' }} />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Attendance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '2px', background: '#f59e0b' }} />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>75% Requirement</span>
                </div>
              </div>

              <Link href="/attendance" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                Attendance Report →
              </Link>
            </div>
          </div>

        </div>

        {/* ─── Bottom Section: AI Insight & Academic Health Breakdown ───────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* AI ADVISOR INSIGHT CARD */}
          <div className="ai-insight-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
                  🤖
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', fontFamily: 'Outfit, sans-serif' }}>
                    AI Advisor Academic Intelligence
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                    Continuous diagnostic • Rule Engine + Neural Advisor
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ background: riskBadge.bg, color: riskBadge.color, padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', border: `1px solid ${riskBadge.border}` }}>
                    {analysis.riskLevel} RISK LEVEL
                  </span>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                {analysis.aiInsight}
              </p>

              {/* Study priorities recommendation chips */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Recommended Weekly Study Focus
                </div>
                {analysis.studyPriorities.slice(0, 3).map((p, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div>
                      <span style={{ color: 'white', fontSize: '13.5px', fontWeight: '600', marginRight: '8px' }}>
                        {p.subject}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11.5px' }}>
                        {p.hoursPerWeek} hrs/week
                      </span>
                    </div>
                    <span style={{ background: p.priority === 'Critical' ? '#fee2e2' : p.priority === 'High' ? '#fef3c7' : '#e0e7ff', color: p.priority === 'Critical' ? '#dc2626' : p.priority === 'High' ? '#d97706' : '#4338ca', padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                      {p.priority} Priority
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '22px', position: 'relative', zIndex: 1 }}>
              <Link
                href="/advisor"
                className="btn btn-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', flex: 1, justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
              >
                💬 Ask Advisor a Question
              </Link>
              <Link
                href="/risk"
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.18)', flex: 1, justifyContent: 'center' }}
              >
                View Risk Diagnostic
              </Link>
            </div>
          </div>

          {/* ACADEMIC HEALTH METRICS */}
          <div className="bento-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                🏥 Academic Health Index
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                Multi-dimensional academic stability evaluation
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Subject Performance', value: analysis.overallAverage, color: analysis.overallAverage >= 75 ? '#10b981' : analysis.overallAverage >= 60 ? '#f59e0b' : '#ef4444', desc: 'Average across tests' },
                  { label: 'Lecture Attendance', value: overallAtt, color: overallAtt >= 80 ? '#10b981' : overallAtt >= 75 ? '#f59e0b' : '#ef4444', desc: 'Required ≥ 75%' },
                  { label: 'Study Consistency', value: Math.max(0, 100 - analysis.riskScore), color: analysis.riskLevel === 'LOW' ? '#10b981' : analysis.riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444', desc: 'Inverse risk rating' },
                  { label: 'Goal Alignment', value: careerGoal ? 85 : 50, color: '#6366f1', desc: careerGoal ? `${careerGoal} path` : 'Set career path' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginRight: '6px' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({item.desc})</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: item.color }}>
                        {Math.round(item.value)}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '7px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, item.value)}%`, background: item.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Status: <strong>{analysis.overallAverage >= 75 ? 'Honors Track' : 'Standard'}</strong>
              </span>
              <Link href="/career" style={{ fontSize: '12px', color: '#6366f1', fontWeight: '700', textDecoration: 'none' }}>
                Career Roadmaps →
              </Link>
            </div>
          </div>

        </div>

        {/* ─── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="disclaimer" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
          <span>ℹ️</span>
          <span>
            <strong>AI Academic Advisor</strong> provides personalized planning and diagnostic support. Official grades, attendance criteria, and degree requirements are determined solely by your university faculty and academic board.
          </span>
        </div>

      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SubjectEntry {
  name: string
  marks: string
  attendance: string
  difficulty: string
}

const INTEREST_OPTIONS = [
  'Artificial Intelligence', 'Machine Learning', 'Cloud Computing',
  'Cyber Security', 'Web Development', 'Mobile Development',
  'Data Science', 'DevOps', 'Software Engineering', 'Networking', 'Database Systems'
]

const CAREER_OPTIONS = [
  'Software Engineer', 'Cloud Engineer', 'DevOps Engineer', 'AI Engineer',
  'Data Scientist', 'Cyber Security Engineer', 'Full Stack Developer',
  'Mobile Developer', 'Researcher', 'Other'
]

const LEARNING_STYLES = ['Videos', 'Articles', 'Coding Practice', 'Projects', 'Notes', 'Interactive Learning']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Personal
  const [personal, setPersonal] = useState({ name: '', department: '', year: '1', semester: '1' })

  useEffect(() => {
    fetch('/api/student/profile')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.name) {
          setPersonal(prev => ({
            ...prev,
            name: prev.name || data.user.name,
            department: prev.department || data.profile?.department || '',
            year: data.profile?.year ? String(data.profile.year) : prev.year,
            semester: data.profile?.semester ? String(data.profile.semester) : prev.semester,
          }))
        }
      })
      .catch(() => {})
  }, [])

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    { name: '', marks: '', attendance: '', difficulty: 'Medium' }
  ])

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')

  // Step 4: Career
  const [careerGoal, setCareerGoal] = useState('')
  const [customCareer, setCustomCareer] = useState('')

  // Step 5: Study Preferences
  const [studyPreferences, setStudyPreferences] = useState({ hoursPerDay: '2', learningStyle: 'Videos' })

  const totalSteps = 6

  const addSubject = () => {
    setSubjects([...subjects, { name: '', marks: '', attendance: '', difficulty: 'Medium' }])
  }

  const removeSubject = (i: number) => {
    setSubjects(subjects.filter((_, idx) => idx !== i))
  }

  const updateSubject = (i: number, field: keyof SubjectEntry, value: string) => {
    const updated = [...subjects]
    updated[i] = { ...updated[i], [field]: value }
    setSubjects(updated)
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()])
      setCustomInterest('')
    }
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      if (!personal.name.trim() || !personal.department.trim()) {
        setError('Please fill in your name and department.')
        return
      }
    }
    if (step === 2) {
      const validSubjects = subjects.filter(s => s.name.trim())
      if (validSubjects.length === 0) {
        setError('Please add at least one subject.')
        return
      }
      for (const s of validSubjects) {
        if (!s.marks || !s.attendance) {
          setError('Please fill marks and attendance for all subjects.')
          return
        }
      }
    }
    if (step === 3 && selectedInterests.length === 0) {
      setError('Please select at least one interest.')
      return
    }
    if (step === 4) {
      const goal = careerGoal === 'Other' ? customCareer : careerGoal
      if (!goal.trim()) {
        setError('Please select or enter your career goal.')
        return
      }
    }
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const finalCareer = careerGoal === 'Other' ? customCareer : careerGoal
    const validSubjects = subjects.filter(s => s.name.trim())

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal,
          subjects: validSubjects,
          interests: selectedInterests,
          careerGoal: finalCareer,
          studyPreferences,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save your profile.')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progressPct = ((step - 1) / (totalSteps - 1)) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎓</div>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '20px', fontFamily: 'Outfit, Inter, sans-serif' }}>AI Academic Advisor</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Let&apos;s set up your profile</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Step {step} of {totalSteps} — Tell us about yourself to get personalized guidance</p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div className="progress-bar" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
            <div className="progress-fill progress-fill-indigo" style={{ width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px', color: '#0f172a' }}>Personal Information</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Tell us who you are</p>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your full name" value={personal.name} onChange={e => setPersonal({ ...personal, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" placeholder="e.g. Computer Science and Engineering" value={personal.department} onChange={e => setPersonal({ ...personal, department: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Year (1 - 4)</label>
                  <select className="form-select" value={personal.year} onChange={e => setPersonal({ ...personal, year: e.target.value })}>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={personal.semester} onChange={e => setPersonal({ ...personal, semester: e.target.value })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Subjects */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Academic Information</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Add your current semester subjects with marks and attendance</p>

              {subjects.map((subject, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Subject {i + 1}</span>
                    {subjects.length > 1 && (
                      <button onClick={() => removeSubject(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 10px', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  <input className="form-input" placeholder="Subject name (e.g. Operating Systems)" value={subject.name} onChange={e => updateSubject(i, 'name', e.target.value)} style={{ marginBottom: '10px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>MARKS (%)</label>
                      <input className="form-input" type="number" min="0" max="100" placeholder="e.g. 78" value={subject.marks} onChange={e => updateSubject(i, 'marks', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>ATTENDANCE (%)</label>
                      <input className="form-input" type="number" min="0" max="100" placeholder="e.g. 86" value={subject.attendance} onChange={e => updateSubject(i, 'attendance', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>DIFFICULTY</label>
                      <select className="form-select" value={subject.difficulty} onChange={e => updateSubject(i, 'difficulty', e.target.value)}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addSubject} className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
                + Add Another Subject
              </button>
            </div>
          )}

          {/* STEP 3: Interests */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Your Interests</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Select topics you are passionate about (choose multiple)</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {INTEREST_OPTIONS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: selectedInterests.includes(interest) ? '2px solid #6366f1' : '2px solid #e2e8f0',
                      background: selectedInterests.includes(interest) ? '#ede9fe' : 'white',
                      color: selectedInterests.includes(interest) ? '#4f46e5' : '#475569',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {selectedInterests.includes(interest) ? '✓ ' : ''}{interest}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input className="form-input" placeholder="Add a custom interest..." value={customInterest} onChange={e => setCustomInterest(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomInterest()} />
                <button onClick={addCustomInterest} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add</button>
              </div>

              {selectedInterests.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0f4ff', borderRadius: '10px', fontSize: '13px', color: '#4338ca' }}>
                  ✅ Selected: {selectedInterests.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Career Goal */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Career Goal</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>What career are you aiming for? This helps align your recommendations.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {CAREER_OPTIONS.map(career => (
                  <button
                    key={career}
                    onClick={() => setCareerGoal(career)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: careerGoal === career ? '2px solid #6366f1' : '2px solid #e2e8f0',
                      background: careerGoal === career ? 'linear-gradient(135deg, #ede9fe, #ddd6fe)' : 'white',
                      color: careerGoal === career ? '#4f46e5' : '#475569',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    {careerGoal === career ? '🎯 ' : ''}{career}
                  </button>
                ))}
              </div>

              {careerGoal === 'Other' && (
                <input className="form-input" placeholder="Enter your career goal..." value={customCareer} onChange={e => setCustomCareer(e.target.value)} />
              )}
            </div>
          )}

          {/* STEP 5: Study Preferences */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Study Preferences</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Help us plan your schedule based on your availability</p>

              <div className="form-group">
                <label className="form-label">Available Study Hours Per Day</label>
                <select className="form-select" value={studyPreferences.hoursPerDay} onChange={e => setStudyPreferences({ ...studyPreferences, hoursPerDay: e.target.value })}>
                  {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map(h => (
                    <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''} per day</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Learning Style</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {LEARNING_STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => setStudyPreferences({ ...studyPreferences, learningStyle: style })}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: studyPreferences.learningStyle === style ? '2px solid #6366f1' : '2px solid #e2e8f0',
                        background: studyPreferences.learningStyle === style ? '#ede9fe' : 'white',
                        color: studyPreferences.learningStyle === style ? '#4f46e5' : '#475569',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {studyPreferences.learningStyle === style ? '✓ ' : ''}{style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Profile Summary</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Review your information before generating your academic analysis</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: '👤 Name', value: personal.name },
                  { label: '🏛️ Department', value: personal.department },
                  { label: '📅 Year / Semester', value: `Year ${personal.year}, Semester ${personal.semester}` },
                  { label: '📚 Subjects', value: subjects.filter(s => s.name).map(s => `${s.name} (${s.marks}%)`).join(', ') },
                  { label: '🌟 Interests', value: selectedInterests.join(', ') },
                  { label: '🎯 Career Goal', value: careerGoal === 'Other' ? customCareer : careerGoal },
                  { label: '⏰ Study Time', value: `${studyPreferences.hoursPerDay} hours/day` },
                  { label: '📖 Learning Style', value: studyPreferences.learningStyle },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '600', minWidth: '180px', fontSize: '13px', color: '#475569' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{item.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="disclaimer" style={{ marginBottom: '20px' }}>
                <span>ℹ️</span>
                <span>AI Academic Advisor provides personalized decision support and guidance. Final academic decisions should follow institutional rules and faculty guidance.</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
                ← Back
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button onClick={handleNext} className="btn btn-primary">
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
                style={{ minWidth: '200px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pulse-dot" /> Analyzing...
                  </span>
                ) : '🚀 Generate My Academic Analysis'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

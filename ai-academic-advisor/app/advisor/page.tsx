'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isDemo?: boolean
  intent?: string
}

const SUGGESTED_QUESTIONS = [
  'Which subjects should I focus on this week?',
  'Am I at academic risk?',
  'Create a study plan for me.',
  'What skills should I learn for my career?',
  'Why is my attendance critical?',
  'How can I improve my academic performance?',
  'Which course should I choose next?',
  'What resources should I use to study?',
]

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 6px;color:#0f172a">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:800;margin:14px 0 8px;color:#0f172a">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:16px;font-weight:900;margin:14px 0 8px;color:#0f172a">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#64748b">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#64748b;font-style:italic;margin:8px 0;font-size:13px">$1</blockquote>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="font-weight:700;color:#6366f1;min-width:20px">$1.</span><span>$2</span></div>')
    .replace(/^[•\-] (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#6366f1;font-weight:700">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create a chat session ID
    setSessionId(`session-${Date.now()}`)
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '👋 **Hello! I\'m your AI Academic Advisor.**\n\nI have access to your full academic profile — marks, attendance, interests, career goals, and study availability.\n\nAsk me anything about your academics! I can help with:\n- **Study plans** tailored to your schedule\n- **Performance analysis** and weak area identification\n- **Career guidance** aligned with your goals\n- **Learning resource** recommendations\n- **Academic risk** assessment\n\n> 📌 AI Academic Advisor provides decision support. Final academic decisions should follow institutional rules and faculty guidance.',
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })
      const data = await res.json()
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'I could not process your request. Please try again.',
        isDemo: data.isDemo,
        intent: data.intent,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please check your connection and try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 32px 16px', borderBottom: '1px solid #e2e8f0', background: 'white', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>AI Academic Advisor</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Context-aware • Uses your academic profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>AI Advisor</span>
                  {msg.isDemo && <span style={{ fontSize: '10px', background: '#f0f4ff', color: '#4338ca', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>DEMO</span>}
                </div>
              )}
              <div className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}>
                {msg.role === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <span style={{ fontSize: '14px' }}>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
              <div className="chat-message-assistant">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                  <span className="pulse-dot" />
                  <span className="pulse-dot" />
                  <span className="pulse-dot" />
                  <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '6px' }}>AI Advisor is analyzing your profile...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div style={{ padding: '8px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Suggested Questions</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '6px 14px', fontSize: '12.5px', color: '#475569', cursor: 'pointer', transition: 'all 0.15s', fontWeight: '500', whiteSpace: 'nowrap' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '16px 32px', background: 'white', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything about your academics..."
              disabled={loading}
              style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s', background: loading ? '#f8fafc' : 'white' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{ padding: '12px 20px', background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: loading || !input.trim() ? '#94a3b8' : 'white', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.15s', minWidth: '48px' }}
            >
              →
            </button>
          </form>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            AI Academic Advisor provides decision support. Final academic decisions should follow institutional rules and faculty guidance.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

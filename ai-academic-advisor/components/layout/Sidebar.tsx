'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/profile', label: 'Academic Profile', icon: '👤' },
  { href: '/subjects', label: 'Subjects & Marks', icon: '📚' },
  { href: '/attendance', label: 'Attendance', icon: '📋' },
  { href: '/recommendations', label: 'AI Recommendations', icon: '💡' },
  { href: '/study-planner', label: 'Study Planner', icon: '📅' },
  { href: '/advisor', label: 'AI Advisor Chat', icon: '💬' },
  { href: '/career', label: 'Career Guidance', icon: '🏆' },
  { href: '/resources', label: 'Learning Resources', icon: '🎓' },
  { href: '/risk', label: 'Academic Risk', icon: '⚠️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

interface SidebarProps {
  user: { name: string; email: string; isDemo?: boolean }
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay active"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎓</div>
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>AI Academic</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '500' }}>Advisor</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', padding: '8px 12px 6px', textTransform: 'uppercase' }}>Navigation</div>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user.isDemo && (
            <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '6px 10px', marginBottom: '12px', fontSize: '11px', color: '#a5b4fc', textAlign: 'center', fontWeight: '600' }}>
              🎓 DEMO MODE — Arun Kumar
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '8px 4px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ width: '100%', padding: '9px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
          >
            {loggingOut ? '...' : '→ Sign Out'}
          </button>
        </div>
      </aside>
    </>
  )
}

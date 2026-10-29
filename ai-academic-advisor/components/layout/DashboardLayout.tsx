'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface User {
  id: string
  name: string
  email: string
  isDemo?: boolean
}

const UserContext = createContext<User | null>(null)
export const useUser = () => useContext(UserContext)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/student/profile')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        if (data.user) setUser(data.user)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>🎓</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
            <span className="pulse-dot" />
            <span className="pulse-dot" />
            <span className="pulse-dot" />
          </div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Loading your academic dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <UserContext.Provider value={user}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main-content" style={{ flex: 1 }}>
          {/* Mobile Top Bar */}
          <div style={{ display: 'none', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 30 }} className="mobile-top-bar">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎓</div>
              <span style={{ fontWeight: '800', fontSize: '15px', fontFamily: 'Outfit, sans-serif' }}>AI Academic Advisor</span>
            </div>
          </div>

          <style>{`
            @media (max-width: 1024px) {
              .mobile-top-bar { display: flex !important; }
            }
          `}</style>

          {children}
        </div>
      </div>
    </UserContext.Provider>
  )
}

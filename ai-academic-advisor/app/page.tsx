import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #0d1f3c 100%)', color: 'white', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* ─── Ambient Glow Background Orbs ─────────────────────────────────── */}
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(34, 211, 238, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ─── Top Navigation Bar ────────────────────────────────────────────── */}
      <nav style={{ height: '72px', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)', background: 'rgba(5, 13, 26, 0.65)', position: 'relative', zIndex: 10 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
            🎓
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '17px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              AI Academic Advisor
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', fontWeight: '500' }}>
              Intelligent Student Guidance
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', padding: '9px 20px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)', transition: 'all 0.15s ease' }}
          >
            Log In
          </Link>
          <Link
            href="/register"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: '700', padding: '10px 22px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)', transition: 'all 0.15s ease' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero Center Section (Clean & Focused) ─────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          
          {/* Subtle Tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.28)', borderRadius: '24px', padding: '6px 18px', marginBottom: '28px' }}>
            <span style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #6366f1' }} />
            <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: '700', letterSpacing: '0.04em' }}>
              AI-Powered Academic Guidance System
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: '900', lineHeight: 1.08, letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
            AI ACADEMIC
          </h1>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: '900', lineHeight: 1.08, letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '24px' }}>
            ADVISOR
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', maxWidth: '640px', margin: '0 auto 12px', lineHeight: 1.6 }}>
            Your intelligent academic planning companion.
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.45)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Personalized guidance based on your performance, career goals, attendance, and study preferences.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                textDecoration: 'none',
                fontSize: '17px',
                fontWeight: '700',
                padding: '16px 42px',
                borderRadius: '14px',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span>🚀</span>
              <span>Get Started</span>
            </Link>

            <Link
              href="/login"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontSize: '17px',
                fontWeight: '600',
                padding: '16px 42px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(10px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🔑</span>
              <span>Log In</span>
            </Link>
          </div>

        </div>
      </main>

      {/* ─── Minimal Bottom Brand Bar ──────────────────────────────────────── */}
      <footer style={{ padding: '20px 24px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', position: 'relative', zIndex: 10 }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '13px', margin: 0 }}>
          AI Academic Advisor • Intelligent Student Guidance & Academic Planning System
        </p>
      </footer>

    </div>
  )
}

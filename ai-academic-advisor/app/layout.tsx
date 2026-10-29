import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Academic Advisor — Intelligent Student Guidance',
  description: 'Get personalized academic guidance based on your performance, interests, goals, and attendance. AI-powered study planning, career guidance, and academic risk analysis.',
  keywords: 'academic advisor, AI, study plan, career guidance, student, academic performance',
  openGraph: {
    title: 'AI Academic Advisor',
    description: 'Your intelligent academic planning companion',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

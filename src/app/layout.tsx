import type { Metadata } from 'next'
import { Space_Grotesk, Syne } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { LanguageProvider } from '@/contexts/LanguageContext'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['400', '500', '600', '700'],
})
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['700', '800'] })

export const metadata: Metadata = {
  title: 'Fantaid 2026',
  description: 'FIFA World Cup 2026 bracket prediction game — predict every match, build your bracket, and compete with friends.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={`${spaceGrotesk.variable} ${syne.variable} font-space bg-night text-slate-100 min-h-screen`}>
        <LanguageProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0D1E30',
                color: '#F1F5F9',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#60A5FA', secondary: '#030C1A' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#030C1A' },
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  )
}

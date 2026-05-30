import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fanta Mondiale 2026',
  description: 'FIFA World Cup 2026 bracket prediction game — predict every match, build your bracket, and compete with friends.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f2318] text-white min-h-screen`}>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a3d2b',
              color: '#f8f9fa',
              border: '1px solid #d4af37',
            },
            success: {
              iconTheme: { primary: '#d4af37', secondary: '#0f2318' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f2318' },
            },
          }}
        />
      </body>
    </html>
  )
}

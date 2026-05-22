'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, surname')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setUserName(`${profile.name} ${profile.surname}`)
        }
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserName('')
      } else {
        supabase
          .from('profiles')
          .select('name, surname')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUserName(`${profile.name} ${profile.surname}`)
          })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setMenuOpen(false)
  }

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMenuOpen(false)}
      className={cn(
        'text-sm font-medium transition-colors duration-150',
        pathname === href
          ? 'text-[#d4af37]'
          : 'text-gray-300 hover:text-[#d4af37]'
      )}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-[#07140e] border-b border-[#1a3d2b] h-16 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">🏆</span>
          <span className="font-bold text-[#d4af37] text-lg hidden sm:block">
            Fanta Mondiale 2026
          </span>
          <span className="font-bold text-[#d4af37] text-lg sm:hidden">FM26</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {!loading && (
            <>
              {user ? (
                <>
                  {navLink('/dashboard', 'Dashboard')}
                  {navLink('/predictions', 'My Predictions')}
                  {navLink('/predictions/bracket', 'Bracket')}
                  {navLink('/leaderboard', 'Leaderboard')}
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l border-[#2d5a3d]">
                    <span className="text-sm text-gray-400 max-w-[120px] truncate">
                      {userName}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-300 hover:text-red-400 transition-colors duration-150"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {navLink('/bracket', 'Bracket')}
                  {navLink('/leaderboard', 'Leaderboard')}
                  <Link
                    href="/auth/login"
                    className={cn(
                      'text-sm font-medium transition-colors duration-150',
                      pathname === '/auth/login'
                        ? 'text-[#d4af37]'
                        : 'text-gray-300 hover:text-[#d4af37]'
                    )}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-bold bg-[#d4af37] text-[#0f2318] px-4 py-1.5 rounded-lg hover:bg-[#f0d060] transition-colors duration-150"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-300 hover:text-[#d4af37] transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#07140e] border-b border-[#1a3d2b] px-4 pb-4 flex flex-col gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  {navLink('/dashboard', 'Dashboard')}
                  {navLink('/predictions', 'My Predictions')}
                  {navLink('/predictions/bracket', 'Bracket')}
                  {navLink('/leaderboard', 'Leaderboard')}
                  <div className="pt-2 border-t border-[#2d5a3d] flex items-center justify-between">
                    <span className="text-sm text-gray-400 truncate max-w-[180px]">{userName}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-red-400 hover:text-red-300"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {navLink('/bracket', 'Bracket')}
                  {navLink('/leaderboard', 'Leaderboard')}
                  {navLink('/auth/login', 'Login')}
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-block text-sm font-bold bg-[#d4af37] text-[#0f2318] px-4 py-2 rounded-lg text-center hover:bg-[#f0d060]"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  )
}

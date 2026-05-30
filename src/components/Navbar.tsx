'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useLang, type Lang } from '@/contexts/LanguageContext'
import { hasCompetitionStarted } from '@/lib/competition'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const { t, lang, setLang } = useLang()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = (supabaseRef.current ??= createClient())

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, surname')
          .eq('id', session.user.id)
          .single()
        if (profile) setUserName(`${profile.name} ${profile.surname}`)
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
    if (!supabaseRef.current) return
    await supabaseRef.current.auth.signOut()
    router.push('/')
    setMenuOpen(false)
  }

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMenuOpen(false)}
      className={cn(
        'text-sm font-medium transition-colors duration-150 px-1 py-0.5',
        pathname === href || (href !== '/' && pathname.startsWith(href))
          ? 'text-blue-light'
          : 'text-slate-400 hover:text-white'
      )}
    >
      {label}
    </Link>
  )

  const LangToggle = () => (
    <div className="flex items-center gap-1 bg-night-2 rounded-lg p-1">
      {(['it', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'text-xs font-bold px-2 py-1 rounded-md transition-all duration-150 uppercase tracking-wide',
            lang === l
              ? 'bg-blue-primary text-white shadow-blue-sm'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )

  // Before kick-off only the prediction surfaces matter; once live, the hub,
  // public bracket, results/stats and leaderboard come into play.
  const started = hasCompetitionStarted()
  const links: { href: string; label: string }[] = user
    ? started
      ? [
          { href: '/', label: t.nav_home },
          { href: '/bracket', label: t.nav_bracket },
          { href: '/results', label: t.nav_results },
          { href: '/leaderboard', label: t.nav_leaderboard },
          { href: '/predictions', label: t.nav_predictions },
        ]
      : [
          { href: '/predictions', label: t.nav_predictions },
          { href: '/predictions/bracket', label: t.nav_bracket },
        ]
    : started
    ? [
        { href: '/', label: t.nav_home },
        { href: '/bracket', label: t.nav_bracket },
        { href: '/results', label: t.nav_results },
        { href: '/leaderboard', label: t.nav_leaderboard },
      ]
    : []

  return (
    <nav className="bg-night-1/80 backdrop-blur-xl border-b border-white/[0.06] h-16 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 flex-shrink-0 group">
          <span className="font-syne font-black text-xl tracking-tight text-white">FANT</span>
          <span className="font-syne font-black text-xl tracking-tight gradient-text-ai">AI</span>
          <span className="font-syne font-black text-xl tracking-tight text-white">D</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 flex-1 justify-end">
          {!loading && (
            <>
              {links.map((l) => navLink(l.href, l.label))}
              {user ? (
                <div className="flex items-center gap-3 ml-1 pl-4 border-l border-white/10">
                  <span className="text-sm text-slate-400 max-w-[120px] truncate">{userName}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors duration-150"
                  >
                    {t.nav_logout}
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    {t.nav_login}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-bold bg-blue-primary text-white px-4 py-2 rounded-xl hover:bg-blue-hover transition-colors shadow-blue-sm"
                  >
                    {t.nav_register}
                  </Link>
                </>
              )}
              <LangToggle />
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="md:hidden flex items-center gap-2">
          <LangToggle />
          <button
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-night-1/95 backdrop-blur-xl border-b border-white/[0.06] px-4 pb-4 pt-2 flex flex-col gap-3">
          {!loading && (
            <>
              {links.map((l) => navLink(l.href, l.label))}
              {user ? (
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-sm text-slate-400 truncate max-w-[200px]">{userName}</span>
                  <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300">
                    {t.nav_logout}
                  </button>
                </div>
              ) : (
                <>
                  {navLink('/auth/login', t.nav_login)}
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="text-center text-sm font-bold bg-blue-primary text-white px-4 py-3 rounded-xl hover:bg-blue-hover transition-colors"
                  >
                    {t.nav_register}
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

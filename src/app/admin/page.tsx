export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export default async function AdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile || !profile.is_admin) {
    redirect('/dashboard')
  }

  // Fetch stats
  const [
    { count: totalMatches },
    { count: completedMatches },
    { count: liveMatches },
    { count: totalUsers },
    { count: totalGroupPreds },
    { count: totalBracketPreds },
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('group_predictions').select('*', { count: 'exact', head: true }),
    supabase.from('bracket_predictions').select('*', { count: 'exact', head: true }),
  ])

  const adminLinks = [
    {
      href: '/admin/results',
      icon: '⚽',
      title: 'Inserisci Risultati',
      description: 'Aggiorna punteggi e risultati per tutte le partite. I punti vengono ricalcolati automaticamente.',
      highlight: true,
    },
    {
      href: '/bracket',
      icon: '🏆',
      title: 'Bracket Pubblico',
      description: 'Visualizza il bracket pubblico come appare a tutti gli utenti.',
      highlight: false,
    },
    {
      href: '/leaderboard',
      icon: '📊',
      title: 'Classifica',
      description: 'Controlla le classifiche e i punteggi attuali.',
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-red-600/20 text-red-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <h1 className="text-3xl font-syne font-black text-ink">
            Dashboard <span className="gradient-text-ai">Admin</span>
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            Benvenuto, {profile.name}. Gestisci il torneo Fanta Mondiale 2026.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Partite Totali', value: totalMatches ?? 0, icon: '📋', color: 'text-ink' },
            { label: 'Completate', value: completedMatches ?? 0, icon: '✅', color: 'text-blue-light' },
            { label: 'Live', value: liveMatches ?? 0, icon: '🔴', color: 'text-red-500' },
            { label: 'Utenti', value: totalUsers ?? 0, icon: '👤', color: 'text-ink' },
            { label: 'Pick Gironi', value: totalGroupPreds ?? 0, icon: '⚽', color: 'text-ink' },
            { label: 'Pick Bracket', value: totalBracketPreds ?? 0, icon: '🏆', color: 'text-ink' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-4 text-center shadow-card"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl tabular-nums font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-xl font-syne font-black text-ink mb-4">Azioni Admin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group glass glass-hover rounded-2xl p-5 shadow-card transition-all duration-150 ${
                link.highlight ? 'shadow-blue-sm' : ''
              }`}
            >
              <div className="text-3xl mb-3">{link.icon}</div>
              <h3
                className={`font-bold mb-1 transition-colors ${
                  link.highlight
                    ? 'text-blue-light group-hover:text-ink'
                    : 'text-ink group-hover:text-blue-light'
                }`}
              >
                {link.title}
              </h3>
              <p className="text-sm text-ink-muted">{link.description}</p>
              <span className="mt-3 inline-block text-xs text-blue-light font-semibold">
                Vai →
              </span>
            </Link>
          ))}
        </div>

        {/* Match progress */}
        <div className="mt-8 glass rounded-2xl p-5 shadow-card">
          <h2 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3">
            Avanzamento Torneo
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-night-1 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-primary h-full rounded-full transition-all duration-500 shadow-blue-sm"
                style={{
                  width: totalMatches ? `${((completedMatches ?? 0) / totalMatches) * 100}%` : '0%',
                }}
              />
            </div>
            <span className="text-sm tabular-nums font-bold text-ink">
              {completedMatches ?? 0}/{totalMatches ?? 0}
            </span>
            <span className="text-sm text-ink-soft">partite completate</span>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      title: 'Enter Match Results',
      description: 'Update scores and results for all matches. Points are recomputed automatically.',
      highlight: true,
    },
    {
      href: '/bracket',
      icon: '🏆',
      title: 'View Public Bracket',
      description: 'See the current public bracket as it appears to all users.',
      highlight: false,
    },
    {
      href: '/leaderboard',
      icon: '📊',
      title: 'View Leaderboard',
      description: 'Check the current rankings and points standings.',
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0f2318]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Admin <span className="text-[#d4af37]">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome, {profile.name}. Manage the Fanta Mondiale 2026 tournament.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Matches', value: totalMatches ?? 0, icon: '📋' },
            { label: 'Completed', value: completedMatches ?? 0, icon: '✅', color: 'text-green-400' },
            { label: 'Live', value: liveMatches ?? 0, icon: '🔴', color: 'text-red-400' },
            { label: 'Users', value: totalUsers ?? 0, icon: '👤' },
            { label: 'Group Picks', value: totalGroupPreds ?? 0, icon: '⚽' },
            { label: 'Bracket Picks', value: totalBracketPreds ?? 0, icon: '🏆' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-2xl font-extrabold ${stat.color ?? 'text-white'}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-xl font-bold text-white mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group block rounded-xl p-5 transition-all duration-150 ${
                link.highlight
                  ? 'bg-[#d4af37]/10 border border-[#d4af37]/40 hover:bg-[#d4af37]/15 hover:border-[#d4af37]/70'
                  : 'bg-[#1a3d2b]/50 border border-[#2d5a3d] hover:border-[#d4af37]/50'
              }`}
            >
              <div className="text-3xl mb-3">{link.icon}</div>
              <h3
                className={`font-bold mb-1 group-hover:text-[#d4af37] transition-colors ${
                  link.highlight ? 'text-[#d4af37]' : 'text-white'
                }`}
              >
                {link.title}
              </h3>
              <p className="text-sm text-gray-500">{link.description}</p>
              <span className="mt-3 inline-block text-xs text-[#d4af37] font-semibold">
                Go →
              </span>
            </Link>
          ))}
        </div>

        {/* Match progress */}
        <div className="mt-8 bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Tournament Progress
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#0f2318] rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#d4af37] h-full rounded-full transition-all duration-500"
                style={{
                  width: totalMatches ? `${((completedMatches ?? 0) / totalMatches) * 100}%` : '0%',
                }}
              />
            </div>
            <span className="text-sm font-bold text-white">
              {completedMatches ?? 0}/{totalMatches ?? 0}
            </span>
            <span className="text-sm text-gray-400">matches completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

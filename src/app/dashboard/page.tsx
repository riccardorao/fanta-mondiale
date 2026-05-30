export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry, Profile } from '@/types/database'

const PREDICTIONS_DEADLINE = process.env.NEXT_PUBLIC_PREDICTIONS_DEADLINE

function isPredictionsLocked(): boolean {
  if (!PREDICTIONS_DEADLINE) return false
  return new Date() >= new Date(PREDICTIONS_DEADLINE)
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/auth/login')
  }

  // Fetch leaderboard entry
  const { data: leaderboardEntry } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('user_id', user.id)
    .single<LeaderboardEntry>()

  // Fetch rank: count users with more points
  let userRank: number | null = null
  if (leaderboardEntry) {
    const { count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', leaderboardEntry.total_points)

    userRank = (count ?? 0) + 1
  }

  // Count group predictions made
  const { count: groupPredCount } = await supabase
    .from('group_predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Count bracket predictions made
  const { count: bracketPredCount } = await supabase
    .from('bracket_predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch upcoming matches (next 5)
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id, match_number, stage, scheduled_at, venue, home_team:home_team_id(name, flag_emoji, code), away_team:away_team_id(name, flag_emoji, code)')
    .eq('status', 'upcoming')
    .order('scheduled_at', { ascending: true })
    .limit(5)

  const locked = isPredictionsLocked()

  return (
    <div className="min-h-screen bg-[#0f2318]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Locked banner */}
        {locked && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-amber-400 font-semibold text-sm">Predictions are now locked</p>
              <p className="text-amber-600 text-xs">The prediction deadline has passed. You can still view results and the leaderboard.</p>
            </div>
          </div>
        )}

        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Welcome back,{' '}
            <span className="text-[#d4af37]">{profile.name}!</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Here&apos;s your Fanta Mondiale 2026 overview.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Points */}
          <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Points</p>
            <p className="text-3xl font-extrabold text-[#d4af37]">
              {leaderboardEntry?.total_points ?? 0}
            </p>
          </div>

          {/* Rank */}
          <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Rank</p>
            <p className="text-3xl font-extrabold text-white">
              {userRank !== null ? (
                <>
                  {userRank}
                  <sup className="text-lg text-gray-400">{getRankSuffix(userRank)}</sup>
                </>
              ) : (
                <span className="text-gray-600 text-xl">—</span>
              )}
            </p>
          </div>

          {/* Group Predictions */}
          <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Group Picks</p>
            <p className="text-3xl font-extrabold text-white">
              {groupPredCount ?? 0}
              <span className="text-gray-500 text-lg font-medium">/72</span>
            </p>
          </div>

          {/* Bracket Predictions */}
          <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Bracket Picks</p>
            <p className="text-3xl font-extrabold text-white">
              {bracketPredCount ?? 0}
              <span className="text-gray-500 text-lg font-medium">/32</span>
            </p>
          </div>
        </div>

        {/* Points breakdown (if any) */}
        {leaderboardEntry && leaderboardEntry.total_points > 0 && (
          <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-5 mb-8">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Points Breakdown</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Group', value: leaderboardEntry.group_stage_points },
                { label: 'Exact', value: leaderboardEntry.exact_score_bonus },
                { label: 'R32', value: leaderboardEntry.r32_points },
                { label: 'R16', value: leaderboardEntry.r16_points },
                { label: 'QF', value: leaderboardEntry.qf_points },
                { label: 'SF', value: leaderboardEntry.sf_points },
                { label: 'Final', value: leaderboardEntry.final_points },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className={`text-xl font-bold ${item.value > 0 ? 'text-[#d4af37]' : 'text-gray-600'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/predictions"
            className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-5 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all duration-150 group"
          >
            <div className="text-3xl mb-3">⚽</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-[#d4af37] transition-colors">
              Predict Group Games
            </h3>
            <p className="text-sm text-gray-500">
              {groupPredCount ?? 0}/72 predictions made
            </p>
            {!locked && (
              <span className="mt-3 inline-block text-xs text-[#d4af37] font-semibold">
                {(groupPredCount ?? 0) < 72 ? 'Continue →' : 'Review →'}
              </span>
            )}
          </Link>

          <Link
            href="/predictions/bracket"
            className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-5 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all duration-150 group"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-[#d4af37] transition-colors">
              Build Bracket
            </h3>
            <p className="text-sm text-gray-500">
              {bracketPredCount ?? 0}/32 bracket picks made
            </p>
            {!locked && (
              <span className="mt-3 inline-block text-xs text-[#d4af37] font-semibold">
                {(bracketPredCount ?? 0) < 32 ? 'Continue →' : 'Review →'}
              </span>
            )}
          </Link>

          <Link
            href="/leaderboard"
            className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-5 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/5 transition-all duration-150 group"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-[#d4af37] transition-colors">
              View Leaderboard
            </h3>
            <p className="text-sm text-gray-500">
              {userRank !== null ? `You're ranked ${userRank}${getRankSuffix(userRank)}` : 'See where you stand'}
            </p>
            <span className="mt-3 inline-block text-xs text-[#d4af37] font-semibold">
              View →
            </span>
          </Link>
        </div>

        {/* Upcoming matches */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Upcoming Matches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4"
                >
                  <p className="text-xs text-gray-500 mb-2">
                    Match #{match.match_number} · {match.stage.toUpperCase()}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{(match.home_team as any)?.flag_emoji ?? '🏳️'}</span>
                      <span className="text-sm font-semibold text-white truncate">
                        {(match.home_team as any)?.code ?? 'TBD'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs font-medium px-2">vs</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-sm font-semibold text-white truncate">
                        {(match.away_team as any)?.code ?? 'TBD'}
                      </span>
                      <span className="text-lg">{(match.away_team as any)?.flag_emoji ?? '🏳️'}</span>
                    </div>
                  </div>
                  {match.scheduled_at && (
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      {new Date(match.scheduled_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin link */}
        {profile.is_admin && (
          <div className="mt-8 bg-[#1a3d2b]/30 border border-[#2d5a3d] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#d4af37]">Admin Panel</p>
              <p className="text-xs text-gray-500">Manage match results and user data</p>
            </div>
            <Link
              href="/admin"
              className="text-sm bg-[#d4af37] text-[#0f2318] font-bold px-4 py-2 rounded-lg hover:bg-[#f0d060] transition-colors"
            >
              Go to Admin →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

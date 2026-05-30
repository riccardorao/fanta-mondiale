export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry, Profile } from '@/types/database'

const PAGE_SIZE = 50

interface LeaderboardEntryWithProfile extends LeaderboardEntry {
  profile: Profile
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = createClient()
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: entries, count } = await supabase
    .from('leaderboard')
    .select('*, profile:user_id(id, name, surname, email, is_admin, created_at)', {
      count: 'exact',
    })
    .order('total_points', { ascending: false })
    .order('exact_score_bonus', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const rows = (entries as LeaderboardEntryWithProfile[]) ?? []

  // Current user's global rank
  let currentUserRank: number | null = null
  if (user) {
    const { count: aboveCount } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', rows.find((r) => r.user_id === user.id)?.total_points ?? 0)
    currentUserRank = (aboveCount ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-[#0f2318]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            🏆 <span className="text-[#d4af37]">Leaderboard</span>
          </h1>
          <p className="text-gray-400 text-sm">FIFA World Cup 2026 Prediction Game</p>
          {count !== null && (
            <p className="text-gray-600 text-xs mt-1">{count} participants</p>
          )}
        </div>

        {/* Current user highlight bar (if on different page) */}
        {user && currentUserRank && !rows.find((r) => r.user_id === user.id) && (
          <div className="bg-[#d4af37]/10 border border-[#d4af37]/40 rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-3">
            <span className="text-[#d4af37] font-bold">Your position</span>
            <span className="text-white font-bold">#{currentUserRank}</span>
            <a href="/leaderboard" className="text-[#d4af37] text-xs hover:underline ml-auto">
              View your page →
            </a>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No results yet.</p>
            <p className="text-gray-600 text-sm mt-2">The leaderboard will populate once matches are played.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f2318]/60 border-b border-[#2d5a3d]">
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold w-16">Rank</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-semibold">Player</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold">Total</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden md:table-cell">Group</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden md:table-cell">Exact</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden lg:table-cell">R32</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden lg:table-cell">R16</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden lg:table-cell">QF</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden lg:table-cell">SF</th>
                    <th className="text-center px-3 py-3 text-gray-400 font-semibold hidden lg:table-cell">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry, idx) => {
                    const rank = from + idx + 1
                    const isCurrentUser = user && entry.user_id === user.id
                    return (
                      <tr
                        key={entry.user_id}
                        className={cn(
                          'border-b border-[#2d5a3d]/50 transition-colors',
                          isCurrentUser
                            ? 'bg-[#d4af37]/10 border-[#d4af37]/30'
                            : rank <= 3
                            ? 'bg-[#d4af37]/5'
                            : 'hover:bg-[#1a3d2b]/30'
                        )}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                              rank === 1
                                ? 'bg-[#d4af37] text-[#0f2318]'
                                : rank === 2
                                ? 'bg-gray-400 text-[#0f2318]'
                                : rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-[#0f2318] border border-[#2d5a3d] text-gray-400'
                            )}
                          >
                            {rank <= 3 ? getRankIcon(rank) : rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {entry.profile?.name} {entry.profile?.surname}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] px-2 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn('text-lg font-extrabold', isCurrentUser ? 'text-[#d4af37]' : 'text-white')}>
                            {entry.total_points}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden md:table-cell">
                          {entry.group_stage_points}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden md:table-cell">
                          {entry.exact_score_bonus > 0 ? (
                            <span className="text-green-400">+{entry.exact_score_bonus}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden lg:table-cell">
                          {entry.r32_points}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden lg:table-cell">
                          {entry.r16_points}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden lg:table-cell">
                          {entry.qf_points}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden lg:table-cell">
                          {entry.sf_points}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-400 hidden lg:table-cell">
                          {entry.final_points}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {rows.map((entry, idx) => {
                const rank = from + idx + 1
                const isCurrentUser = user && entry.user_id === user.id
                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      'bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl px-4 py-3',
                      isCurrentUser && 'border-[#d4af37]/40 bg-[#d4af37]/5'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0',
                            rank === 1
                              ? 'bg-[#d4af37] text-[#0f2318]'
                              : rank === 2
                              ? 'bg-gray-400 text-[#0f2318]'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-[#0f2318] border border-[#2d5a3d] text-gray-400'
                          )}
                        >
                          {rank <= 3 ? getRankIcon(rank) : rank}
                        </span>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {entry.profile?.name} {entry.profile?.surname}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-[#d4af37]">(You)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Group: {entry.group_stage_points} + Exact: {entry.exact_score_bonus} + KO: {entry.r32_points + entry.r16_points + entry.qf_points + entry.sf_points + entry.final_points}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-2xl font-extrabold', isCurrentUser ? 'text-[#d4af37]' : 'text-white')}>
                        {entry.total_points}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                {page > 1 && (
                  <a
                    href={`/leaderboard?page=${page - 1}`}
                    className="px-4 py-2 bg-[#1a3d2b]/50 border border-[#2d5a3d] text-white rounded-lg hover:border-[#d4af37] text-sm font-medium transition-colors"
                  >
                    ← Previous
                  </a>
                )}
                <span className="text-gray-500 text-sm">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/leaderboard?page=${page + 1}`}
                    className="px-4 py-2 bg-[#1a3d2b]/50 border border-[#2d5a3d] text-white rounded-lg hover:border-[#d4af37] text-sm font-medium transition-colors"
                  >
                    Next →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

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
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-syne font-black text-white mb-2">
            🏆 <span className="gradient-text-ai">Classifica</span>
          </h1>
          <p className="text-slate-400 text-sm">FIFA World Cup 2026 Prediction Game</p>
          {count !== null && (
            <p className="text-slate-600 text-xs mt-1">{count} partecipanti</p>
          )}
        </div>

        {/* Current user highlight bar (if on different page) */}
        {user && currentUserRank && !rows.find((r) => r.user_id === user.id) && (
          <div className="bg-blue-dim rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-3 shadow-blue-sm">
            <span className="text-blue-light font-bold">La tua posizione</span>
            <span className="text-white font-bold">#{currentUserRank}</span>
            <a href="/leaderboard" className="text-blue-light text-xs hover:underline ml-auto">
              Vai alla tua pagina →
            </a>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">Nessun risultato ancora.</p>
            <p className="text-slate-600 text-sm mt-2">La classifica si popolerà quando le partite saranno giocate.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block glass rounded-2xl overflow-hidden shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-night-2/80 border-b border-night-3">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold w-16">Pos</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Giocatore</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold">Totale</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden md:table-cell">Gironi</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden md:table-cell">Esatti</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden lg:table-cell">R32</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden lg:table-cell">R16</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden lg:table-cell">QF</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden lg:table-cell">SF</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold hidden lg:table-cell">Finale</th>
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
                          'border-b border-night-3/50 transition-colors',
                          isCurrentUser
                            ? 'bg-blue-dim'
                            : rank <= 3
                            ? 'bg-amber-dim/30'
                            : 'hover:bg-night-2/40'
                        )}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold tabular-nums',
                              rank === 1
                                ? 'bg-amber-accent/20 text-amber-accent'
                                : rank === 2
                                ? 'bg-slate-400/20 text-slate-300'
                                : rank === 3
                                ? 'bg-amber-700/30 text-amber-600'
                                : 'bg-night-1 text-slate-400'
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
                              <span className="text-xs bg-blue-dim text-blue-light px-2 py-0.5 rounded-full font-medium">
                                Tu
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={cn('text-lg tabular-nums font-bold', isCurrentUser ? 'text-blue-light' : 'text-white')}>
                            {entry.total_points}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden md:table-cell">
                          {entry.group_stage_points}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden md:table-cell">
                          {entry.exact_score_bonus > 0 ? (
                            <span className="text-blue-light">+{entry.exact_score_bonus}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden lg:table-cell">
                          {entry.r32_points}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden lg:table-cell">
                          {entry.r16_points}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden lg:table-cell">
                          {entry.qf_points}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden lg:table-cell">
                          {entry.sf_points}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400 hidden lg:table-cell">
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
                      'glass rounded-2xl px-4 py-3 shadow-card',
                      isCurrentUser && 'bg-blue-dim shadow-blue-sm'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 tabular-nums',
                            rank === 1
                              ? 'bg-amber-accent/20 text-amber-accent'
                              : rank === 2
                              ? 'bg-slate-400/20 text-slate-300'
                              : rank === 3
                              ? 'bg-amber-700/30 text-amber-600'
                              : 'bg-night-1 text-slate-400'
                          )}
                        >
                          {rank <= 3 ? getRankIcon(rank) : rank}
                        </span>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {entry.profile?.name} {entry.profile?.surname}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-blue-light">(Tu)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            Gironi: {entry.group_stage_points} + Esatti: {entry.exact_score_bonus} + KO: {entry.r32_points + entry.r16_points + entry.qf_points + entry.sf_points + entry.final_points}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-2xl tabular-nums font-bold', isCurrentUser ? 'text-blue-light' : 'text-white')}>
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
                    className="px-4 py-2 bg-night-1 text-white rounded-xl hover:bg-night-2 text-sm font-medium transition-colors"
                  >
                    ← Precedente
                  </a>
                )}
                <span className="text-slate-500 text-sm">
                  Pagina {page} di {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/leaderboard?page=${page + 1}`}
                    className="px-4 py-2 bg-night-1 text-white rounded-xl hover:bg-night-2 text-sm font-medium transition-colors"
                  >
                    Successiva →
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

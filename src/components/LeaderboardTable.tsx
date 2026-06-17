'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry, Profile } from '@/types/database'

interface LeaderboardEntryWithProfile extends LeaderboardEntry {
  profile: Profile
}

interface Props {
  initialEntries: LeaderboardEntryWithProfile[]
  userId?: string
  from: number
  itemsPerPage: number
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

export default function LeaderboardTable({ initialEntries, userId, from, itemsPerPage }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntryWithProfile[]>(initialEntries)
  const [isLive, setIsLive] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    const supabase = (supabaseRef.current ??= createClient())

    // Subscribe to leaderboard changes (any row update)
    const subscription = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        async (payload) => {
          // On any change, refetch the current page of leaderboard
          const pageStart = from
          const pageEnd = from + itemsPerPage - 1

          const { data: updated } = await supabase
            .from('leaderboard')
            .select('*, profile:user_id(id, name, surname, email, is_admin, created_at)')
            .order('total_points', { ascending: false })
            .order('exact_score_bonus', { ascending: false })
            .range(pageStart, pageEnd)

          if (updated) {
            setEntries(updated as LeaderboardEntryWithProfile[])
            setIsLive(true)
            // Fade the "LIVE" indicator after a moment
            setTimeout(() => setIsLive(false), 1500)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [from, itemsPerPage])

  return (
    <>
      {/* Live indicator */}
      {isLive && (
        <div className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-red-500 animate-pulse">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          LIVE
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block glass rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-night-2/80 border-b border-night-3">
              <th className="text-left px-4 py-5 text-ink-soft font-semibold w-16">Pos</th>
              <th className="text-left px-4 py-5 text-ink-soft font-semibold">Giocatore</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold">Totale</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden md:table-cell">Gironi</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden md:table-cell">Esatti</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden lg:table-cell">R32</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden lg:table-cell">R16</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden lg:table-cell">QF</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden lg:table-cell">SF</th>
              <th className="text-center px-3 py-5 text-ink-soft font-semibold hidden lg:table-cell">Finale</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const rank = from + idx + 1
              const isCurrentUser = userId && entry.user_id === userId
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
                  <td className="px-4 py-5">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold tabular-nums',
                        rank === 1
                          ? 'bg-amber-accent/20 text-amber-accent'
                          : rank === 2
                          ? 'bg-slate-400/20 text-ink-soft'
                          : rank === 3
                          ? 'bg-amber-700/30 text-amber-600'
                          : 'bg-night-1 text-ink-soft'
                      )}
                    >
                      {rank <= 3 ? getRankIcon(rank) : rank}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">
                        {entry.profile?.name} {entry.profile?.surname}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-dim text-blue-light px-2 py-0.5 rounded-full font-medium">
                          Tu
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-5 text-center">
                    <span className={cn('text-lg tabular-nums font-bold', isCurrentUser ? 'text-blue-light' : 'text-ink')}>
                      {entry.total_points}
                    </span>
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden md:table-cell">
                    {entry.group_stage_points}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden md:table-cell">
                    {entry.exact_score_bonus > 0 ? (
                      <span className="text-blue-light">+{entry.exact_score_bonus}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden lg:table-cell">
                    {entry.r32_points}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden lg:table-cell">
                    {entry.r16_points}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden lg:table-cell">
                    {entry.qf_points}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden lg:table-cell">
                    {entry.sf_points}
                  </td>
                  <td className="px-3 py-5 text-center text-ink-soft hidden lg:table-cell">
                    {entry.final_points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden flex flex-col gap-4">
        {entries.map((entry, idx) => {
          const rank = from + idx + 1
          const isCurrentUser = userId && entry.user_id === userId
          return (
            <div
              key={entry.user_id}
              className={cn(
                'glass rounded-2xl px-4 py-5 shadow-card',
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
                        ? 'bg-slate-400/20 text-ink-soft'
                        : rank === 3
                        ? 'bg-amber-700/30 text-amber-600'
                        : 'bg-night-1 text-ink-soft'
                    )}
                  >
                    {rank <= 3 ? getRankIcon(rank) : rank}
                  </span>
                  <div>
                    <p className="font-semibold text-ink text-sm">
                      {entry.profile?.name} {entry.profile?.surname}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-light">(Tu)</span>}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Gironi: {entry.group_stage_points} + Esatti: {entry.exact_score_bonus} + KO:{' '}
                      {entry.r32_points + entry.r16_points + entry.qf_points + entry.sf_points + entry.final_points}
                    </p>
                  </div>
                </div>
                <span className={cn('text-2xl tabular-nums font-bold', isCurrentUser ? 'text-blue-light' : 'text-ink')}>
                  {entry.total_points}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

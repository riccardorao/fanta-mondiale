export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import LeaderboardTable from '@/components/LeaderboardTable'
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
          <h1 className="text-3xl sm:text-4xl font-syne font-black text-ink mb-2">
            🏆 <span className="gradient-text-ai">Classifica</span>
          </h1>
          <p className="text-ink-soft text-sm">FIFA World Cup 2026 Prediction Game</p>
          {count !== null && (
            <p className="text-ink-muted text-xs mt-1">{count} partecipanti</p>
          )}
        </div>

        {/* Current user highlight bar (if on different page) */}
        {user && currentUserRank && !rows.find((r) => r.user_id === user.id) && (
          <div className="bg-blue-dim rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-3 shadow-blue-sm">
            <span className="text-blue-light font-bold">La tua posizione</span>
            <span className="text-ink font-bold">#{currentUserRank}</span>
            <a href="/leaderboard" className="text-blue-light text-xs hover:underline ml-auto">
              Vai alla tua pagina →
            </a>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-muted text-lg">Nessun risultato ancora.</p>
            <p className="text-ink-muted text-sm mt-2">La classifica si popolerà quando le partite saranno giocate.</p>
          </div>
        ) : (
          <>
            <LeaderboardTable
              initialEntries={rows}
              userId={user?.id}
              from={from}
              itemsPerPage={PAGE_SIZE}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                {page > 1 && (
                  <a
                    href={`/leaderboard?page=${page - 1}`}
                    className="px-4 py-2 bg-night-1 text-ink rounded-xl hover:bg-night-2 text-sm font-medium transition-colors"
                  >
                    ← Precedente
                  </a>
                )}
                <span className="text-ink-muted text-sm">
                  Pagina {page} di {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`/leaderboard?page=${page + 1}`}
                    className="px-4 py-2 bg-night-1 text-ink rounded-xl hover:bg-night-2 text-sm font-medium transition-colors"
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

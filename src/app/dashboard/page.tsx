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
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Locked banner */}
        {locked && (
          <div className="bg-amber-dim rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-amber-accent font-semibold text-sm">Pronostici bloccati</p>
              <p className="text-amber-accent/60 text-xs">La scadenza è passata. Puoi ancora vedere i risultati e la classifica.</p>
            </div>
          </div>
        )}

        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-syne font-black text-white">
            Bentornato,{' '}
            <span className="gradient-text-ai">{profile.name}!</span>
          </h1>
          <p className="text-slate-400 mt-1">
            La tua panoramica Fanta Mondiale 2026.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Points */}
          <div className="glass rounded-2xl p-5 text-center shadow-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Punti Totali</p>
            <p className="text-4xl tabular-nums font-bold gradient-text-gold num-glow">
              {leaderboardEntry?.total_points ?? 0}
            </p>
          </div>

          {/* Rank */}
          <div className="glass rounded-2xl p-5 text-center shadow-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Posizione</p>
            <p className="text-4xl tabular-nums font-bold text-white num-glow">
              {userRank !== null ? (
                <>
                  {userRank}
                  <sup className="text-lg text-slate-400">{getRankSuffix(userRank)}</sup>
                </>
              ) : (
                <span className="text-slate-600 text-2xl">—</span>
              )}
            </p>
          </div>

          {/* Group Predictions */}
          <div className="glass rounded-2xl p-5 text-center shadow-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Gironi</p>
            <p className="text-4xl tabular-nums font-bold text-white num-glow">
              {groupPredCount ?? 0}
              <span className="text-slate-500 text-lg font-medium">/72</span>
            </p>
          </div>

          {/* Bracket Predictions */}
          <div className="glass rounded-2xl p-5 text-center shadow-card">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Bracket</p>
            <p className="text-4xl tabular-nums font-bold text-white num-glow">
              {bracketPredCount ?? 0}
              <span className="text-slate-500 text-lg font-medium">/32</span>
            </p>
          </div>
        </div>

        {/* Points breakdown (if any) */}
        {leaderboardEntry && leaderboardEntry.total_points > 0 && (
          <div className="glass rounded-2xl p-5 mb-8 shadow-card">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dettaglio Punti</h2>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
              {[
                { label: 'Gironi', value: leaderboardEntry.group_stage_points },
                { label: 'Esatti', value: leaderboardEntry.exact_score_bonus },
                { label: 'R32', value: leaderboardEntry.r32_points },
                { label: 'R16', value: leaderboardEntry.r16_points },
                { label: 'QF', value: leaderboardEntry.qf_points },
                { label: 'SF', value: leaderboardEntry.sf_points },
                { label: 'Finale', value: leaderboardEntry.final_points },
              ].map((item) => (
                <div key={item.label} className="bg-night-1 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-xl tabular-nums font-bold ${item.value > 0 ? 'text-blue-light' : 'text-slate-600'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-xl font-syne font-black text-white mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/predictions"
            className="glass glass-hover rounded-2xl p-5 group shadow-card"
          >
            <div className="text-3xl mb-3">⚽</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-blue-light transition-colors">
              Pronostica i Gironi
            </h3>
            <p className="text-sm text-slate-500">
              {groupPredCount ?? 0}/72 pronostici fatti
            </p>
            {!locked && (
              <span className="mt-3 inline-block text-xs text-blue-light font-semibold">
                {(groupPredCount ?? 0) < 72 ? 'Continua →' : 'Rivedi →'}
              </span>
            )}
          </Link>

          <Link
            href="/predictions/bracket"
            className="glass glass-hover rounded-2xl p-5 group shadow-card"
          >
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-blue-light transition-colors">
              Costruisci il Bracket
            </h3>
            <p className="text-sm text-slate-500">
              {bracketPredCount ?? 0}/32 pick bracket fatti
            </p>
            {!locked && (
              <span className="mt-3 inline-block text-xs text-blue-light font-semibold">
                {(bracketPredCount ?? 0) < 32 ? 'Continua →' : 'Rivedi →'}
              </span>
            )}
          </Link>

          <Link
            href="/leaderboard"
            className="glass glass-hover rounded-2xl p-5 group shadow-card"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-white mb-1 group-hover:text-blue-light transition-colors">
              Classifica
            </h3>
            <p className="text-sm text-slate-500">
              {userRank !== null ? `Sei in posizione ${userRank}${getRankSuffix(userRank)}` : 'Scopri dove sei'}
            </p>
            <span className="mt-3 inline-block text-xs text-blue-light font-semibold">
              Vedi →
            </span>
          </Link>
        </div>

        {/* Upcoming matches */}
        {upcomingMatches && upcomingMatches.length > 0 && (
          <div>
            <h2 className="text-xl font-syne font-black text-white mb-4">Prossime Partite</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="glass rounded-2xl p-4 shadow-card"
                >
                  <p className="text-xs text-slate-500 mb-2">
                    Partita #{match.match_number} · {match.stage.toUpperCase()}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{(match.home_team as any)?.flag_emoji ?? '🏳️'}</span>
                      <span className="text-sm font-semibold text-white truncate">
                        {(match.home_team as any)?.code ?? 'TBD'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs font-medium px-2">vs</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-sm font-semibold text-white truncate">
                        {(match.away_team as any)?.code ?? 'TBD'}
                      </span>
                      <span className="text-lg">{(match.away_team as any)?.flag_emoji ?? '🏳️'}</span>
                    </div>
                  </div>
                  {match.scheduled_at && (
                    <p className="text-xs text-slate-600 mt-2 text-center">
                      {new Date(match.scheduled_at).toLocaleDateString('it-IT', {
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
          <div className="mt-8 glass rounded-2xl p-4 flex items-center justify-between shadow-blue-sm">
            <div>
              <p className="text-sm font-semibold text-blue-light">Pannello Admin</p>
              <p className="text-xs text-slate-500">Gestisci risultati e dati utenti</p>
            </div>
            <Link
              href="/admin"
              className="text-sm bg-blue-primary hover:bg-blue-hover text-white font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Vai all&apos;Admin →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

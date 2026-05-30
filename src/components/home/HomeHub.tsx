'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useLang } from '@/contexts/LanguageContext'
import BracketMatchCard from '@/components/BracketMatchCard'
import type { Match, Stage } from '@/types/database'

interface Leader {
  user_id: string
  total_points: number
  name: string
  surname: string
}

interface HomeHubProps {
  matches: Match[]
  leaders: Leader[]
  participants: number
  currentUserId: string | null
  currentUserRank: number | null
  currentUserPoints: number | null
}

const STAGE_CONFIG: { stage: Stage; label: string }[] = [
  { stage: 'r32', label: 'R32' },
  { stage: 'r16', label: 'Ottavi' },
  { stage: 'qf', label: 'Quarti' },
  { stage: 'sf', label: 'Semifinali' },
  { stage: 'final', label: 'Finale' },
]

function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-accent/20 text-amber-accent'
  if (rank === 2) return 'bg-slate-400/20 text-slate-300'
  if (rank === 3) return 'bg-amber-700/30 text-amber-600'
  return 'bg-night-1 text-slate-400'
}

function rankIcon(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}

export default function HomeHub({
  matches,
  leaders,
  participants,
  currentUserId,
  currentUserRank,
  currentUserPoints,
}: HomeHubProps) {
  const { t } = useLang()

  const thirdPlace = matches.find((m) => m.stage === 'third_place')
  const userInTop = leaders.some((l) => l.user_id === currentUserId)

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Live badge */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-syne font-black text-2xl sm:text-3xl">
              <span className="text-white">FANT</span>
              <span className="gradient-text-ai">AI</span>
              <span className="text-white">D</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.hub_live_badge}
            </span>
          </div>
          <Link
            href="/results"
            className="text-sm font-semibold text-blue-light hover:text-white transition-colors"
          >
            {t.hub_results_cta}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Bracket — middle/main */}
          <section className="order-2 lg:order-1">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-xl font-syne font-black text-white">{t.hub_bracket_title}</h2>
                <p className="text-slate-500 text-sm">{t.hub_bracket_sub}</p>
              </div>
              <Link href="/bracket" className="text-xs font-semibold text-blue-light hover:text-white whitespace-nowrap">
                {t.hub_view_full_bracket}
              </Link>
            </div>

            <div className="glass rounded-2xl p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {STAGE_CONFIG.map(({ stage, label }) => {
                  const stageMatches = matches.filter((m) => m.stage === stage)
                  if (stageMatches.length === 0) return null
                  return (
                    <div key={stage} className="flex flex-col">
                      <div className="text-center mb-3">
                        <span className="text-xs font-bold text-blue-light uppercase tracking-wider">{label}</span>
                      </div>
                      <div
                        className="flex flex-col gap-3"
                        style={{ justifyContent: 'space-around', height: `${stageMatches.length * 150}px` }}
                      >
                        {stageMatches.map((match) => (
                          <BracketMatchCard key={match.id} match={match} locked compact />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {thirdPlace && (
              <div className="mt-5">
                <h3 className="text-sm font-syne font-black text-white mb-3">🥉 Terzo Posto</h3>
                <div className="max-w-xs">
                  <BracketMatchCard match={thirdPlace} locked compact />
                </div>
              </div>
            )}
          </section>

          {/* Leaderboard — right rail */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-20">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-xl font-syne font-black text-white">{t.hub_leaderboard_title}</h2>
                  <p className="text-slate-500 text-sm">{participants} {t.lb_participants}</p>
                </div>
                <Link href="/leaderboard" className="text-xs font-semibold text-blue-light hover:text-white whitespace-nowrap">
                  {t.hub_view_full_lb}
                </Link>
              </div>

              <div className="glass rounded-2xl p-2">
                {leaders.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">{t.hub_no_lb}</p>
                ) : (
                  <ol className="flex flex-col">
                    {leaders.map((entry, idx) => {
                      const rank = idx + 1
                      const isMe = entry.user_id === currentUserId
                      return (
                        <li
                          key={entry.user_id}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2.5 rounded-xl',
                            isMe && 'bg-blue-dim'
                          )}
                        >
                          <span className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold tabular-nums flex-shrink-0',
                            rankBadge(rank)
                          )}>
                            {rankIcon(rank)}
                          </span>
                          <span className={cn('flex-1 truncate text-sm font-medium', isMe ? 'text-blue-light' : 'text-white')}>
                            {entry.name} {entry.surname}
                          </span>
                          <span className={cn('text-base font-bold tabular-nums', isMe ? 'text-blue-light' : 'text-white')}>
                            {entry.total_points}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>

              {/* Your rank pill when outside the visible top list */}
              {currentUserId && currentUserRank && !userInTop && (
                <div className="mt-3 glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-blue-sm">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-night-1 text-slate-300 text-xs font-bold tabular-nums">
                    {currentUserRank}
                  </span>
                  <span className="flex-1 text-sm text-slate-400">{t.hub_your_rank}</span>
                  <span className="text-base font-bold tabular-nums text-blue-light">{currentUserPoints ?? 0}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

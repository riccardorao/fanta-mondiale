'use client'

import { cn, formatMatchDate } from '@/lib/utils'
import { useLang } from '@/contexts/LanguageContext'
import type { Stage, MatchStatus } from '@/types/database'

interface TeamLite {
  id: string
  code: string
  name: string
  flag: string
}

export interface MatchStat {
  id: string
  stage: Stage
  status: MatchStatus
  matchNumber: number
  scheduledAt: string | null
  groupName: string | null
  home: TeamLite | null
  away: TeamLite | null
  homeScore: number | null
  awayScore: number | null
  homePenalties: number | null
  awayPenalties: number | null
  winnerId: string | null
  isGroup: boolean
  totalPreds: number
  correctCount: number
  exactHits: number
  dist: { a: number; b: number; c: number }
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

export default function ResultsView({ stats }: { stats: MatchStat[] }) {
  const { t } = useLang()

  const stageLabel = (stage: Stage): string =>
    (({
      group: t.dash_group,
      r32: 'R32',
      r16: t.dash_r16,
      qf: t.dash_qf,
      sf: t.dash_sf,
      third_place: '3°/4°',
      final: t.dash_final,
    } as Record<Stage, string>)[stage] ?? stage)

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-syne font-black text-ink">
            <span className="gradient-text-ai">{t.results_title.split(' ')[0]}</span>{' '}
            {t.results_title.split(' ').slice(1).join(' ')}
          </h1>
          <p className="text-ink-muted text-sm mt-1">{t.results_subtitle}</p>
        </div>

        {stats.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-ink-soft font-semibold">{t.results_no_results}</p>
            <p className="text-ink-muted text-sm mt-1">{t.results_no_results_sub}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stats.map((s) => {
              const isLive = s.status === 'live'
              const correctLabel = s.isGroup ? t.results_correct_outcome : t.results_correct_winner
              const correctPct = pct(s.correctCount, s.totalPreds)
              const homeWinner = s.winnerId && s.home && s.winnerId === s.home.id
              const awayWinner = s.winnerId && s.away && s.winnerId === s.away.id

              return (
                <div key={s.id} className="glass rounded-2xl overflow-hidden">
                  {/* Header strip */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-night-2/50 text-xs">
                    <span className="bg-blue-dim text-blue-light font-bold px-2 py-0.5 rounded-full">
                      {stageLabel(s.stage)}
                    </span>
                    {s.groupName && <span className="text-amber-accent font-medium">Gruppo {s.groupName}</span>}
                    <span className="text-ink-muted ml-auto">{formatMatchDate(s.scheduledAt)}</span>
                    <span className={cn('font-bold', isLive ? 'text-red-500 animate-pulse' : 'text-emerald-600')}>
                      {isLive ? t.results_live : t.results_ft}
                    </span>
                  </div>

                  {/* Scoreline */}
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className={cn('text-sm font-semibold truncate', homeWinner ? 'text-ink' : 'text-ink-soft')}>
                        {s.home?.name ?? 'TBD'}
                      </span>
                      <span className="text-2xl leading-none flex-shrink-0">{s.home?.flag ?? '🏳️'}</span>
                    </div>
                    <div className="flex-shrink-0 text-center min-w-[72px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn('text-2xl font-syne font-black tabular-nums', homeWinner ? 'text-ink' : 'text-ink-soft')}>
                          {s.homeScore ?? '–'}
                        </span>
                        <span className="text-ink-muted">:</span>
                        <span className={cn('text-2xl font-syne font-black tabular-nums', awayWinner ? 'text-ink' : 'text-ink-soft')}>
                          {s.awayScore ?? '–'}
                        </span>
                      </div>
                      {s.homePenalties != null && s.awayPenalties != null && (
                        <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                          rig. {s.homePenalties}–{s.awayPenalties}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-2xl leading-none flex-shrink-0">{s.away?.flag ?? '🏳️'}</span>
                      <span className={cn('text-sm font-semibold truncate', awayWinner ? 'text-ink' : 'text-ink-soft')}>
                        {s.away?.name ?? 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-4 pb-4">
                    {s.totalPreds === 0 ? (
                      <p className="text-ink-muted text-xs text-center py-2">{t.results_no_preds}</p>
                    ) : (
                      <div className="bg-night-1/60 rounded-xl p-3.5 flex flex-col gap-3">
                        {/* Correct rate (only meaningful once completed) */}
                        {s.status === 'completed' && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5 text-xs">
                              <span className="text-ink-soft">
                                <span className="text-emerald-600 font-bold tabular-nums">{s.correctCount}</span>
                                <span className="text-ink-muted">/{s.totalPreds}</span>{' '}
                                {correctLabel}
                              </span>
                              <span className="font-bold tabular-nums text-emerald-600">{correctPct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-night-3 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500/80 rounded-full transition-all"
                                style={{ width: `${correctPct}%` }}
                              />
                            </div>
                            {s.isGroup && s.exactHits > 0 && (
                              <p className="text-xs text-blue-light mt-1.5">
                                🎯 {s.exactHits} {t.results_exact_hits}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Distribution */}
                        <div>
                          <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-1.5">
                            {t.results_distribution}
                          </p>
                          <div className="flex h-2.5 rounded-full overflow-hidden bg-night-3">
                            {s.isGroup ? (
                              <>
                                <div className="bg-blue-primary" style={{ width: `${pct(s.dist.a, s.totalPreds)}%` }} />
                                <div className="bg-slate-500" style={{ width: `${pct(s.dist.b, s.totalPreds)}%` }} />
                                <div className="bg-purple-primary" style={{ width: `${pct(s.dist.c, s.totalPreds)}%` }} />
                              </>
                            ) : (
                              <>
                                <div className="bg-blue-primary" style={{ width: `${pct(s.dist.a, s.totalPreds)}%` }} />
                                <div className="bg-purple-primary" style={{ width: `${pct(s.dist.c, s.totalPreds)}%` }} />
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                            {s.isGroup ? (
                              <>
                                <Legend color="bg-blue-primary" label={`${s.home?.code ?? t.results_home}`} value={pct(s.dist.a, s.totalPreds)} />
                                <Legend color="bg-slate-500" label={t.results_draw} value={pct(s.dist.b, s.totalPreds)} />
                                <Legend color="bg-purple-primary" label={`${s.away?.code ?? t.results_away}`} value={pct(s.dist.c, s.totalPreds)} />
                              </>
                            ) : (
                              <>
                                <Legend color="bg-blue-primary" label={`${s.home?.code ?? t.results_home}`} value={pct(s.dist.a, s.totalPreds)} />
                                <Legend color="bg-purple-primary" label={`${s.away?.code ?? t.results_away}`} value={pct(s.dist.c, s.totalPreds)} />
                              </>
                            )}
                            <span className="text-ink-muted ml-auto tabular-nums">{s.totalPreds} {t.results_players}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-soft">
      <span className={cn('w-2 h-2 rounded-full', color)} />
      {label} <span className="tabular-nums text-ink-muted">{value}%</span>
    </span>
  )
}

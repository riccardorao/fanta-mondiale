export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatMatchDate } from '@/lib/utils'
import { buildBracketFromResults, isGroupStageComplete, type GroupInput } from '@/lib/bracket'
import GroupStandings from '@/components/GroupStandings'
import BracketMatchCard from '@/components/BracketMatchCard'
import type { Match, Team, Group, Stage } from '@/types/database'

const KNOCKOUT_STAGES: { stage: Stage; label: string }[] = [
  { stage: 'r32', label: 'Round of 32' },
  { stage: 'r16', label: 'Round of 16' },
  { stage: 'qf', label: 'Quarter-Finals' },
  { stage: 'sf', label: 'Semi-Finals' },
  { stage: 'final', label: 'Final' },
]

export default async function BracketPage() {
  const supabase = createClient()

  const [groupsRes, teamsRes, matchesRes] = await Promise.all([
    supabase.from('groups').select('*').order('name'),
    supabase.from('teams').select('*').order('name'),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*),
        winner:winner_id(*),
        group:group_id(*)
      `)
      .order('match_number'),
  ])

  const groups: Group[] = groupsRes.data ?? []
  const teams: Team[] = teamsRes.data ?? []
  const allMatches: Match[] = (matchesRes.data as Match[]) ?? []

  const groupMatches = allMatches.filter((m) => m.stage === 'group')
  const knockoutMatches = allMatches.filter((m) => m.stage !== 'group')

  // Auto-derive knockout participants from real group standings + real winners.
  const groupInputs: GroupInput[] = groups.map((g) => ({
    name: g.name,
    teams: teams.filter((t) => t.group_id === g.id),
    matches: groupMatches.filter((m) => m.group_id === g.id),
  }))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const winnersByMatch: Record<number, string> = {}
  for (const m of knockoutMatches) if (m.winner_id) winnersByMatch[m.match_number] = m.winner_id
  // Seed the real bracket only once every group match is played (locks ~Jun 27).
  const participants = isGroupStageComplete(groupInputs)
    ? buildBracketFromResults(groupInputs, winnersByMatch).participants
    : ({} as Record<number, { home: string | null; away: string | null }>)

  // Merge resolved participants onto each knockout shell (DB values win if set).
  const resolveKo = (m: Match): Match => {
    const p = participants[m.match_number] ?? { home: null, away: null }
    return {
      ...m,
      home_team_id: m.home_team_id ?? p.home,
      away_team_id: m.away_team_id ?? p.away,
      home_team: m.home_team ?? (p.home ? teamMap.get(p.home) : undefined),
      away_team: m.away_team ?? (p.away ? teamMap.get(p.away) : undefined),
    }
  }

  const thirdPlaceMatch = knockoutMatches.find((m) => m.stage === 'third_place')

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-syne font-black text-white mb-2">
            World Cup <span className="gradient-text-gold">2026</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Risultati in tempo reale — aggiornati durante il torneo
          </p>
        </div>

        {/* Group Stage */}
        <section className="mb-12">
          <h2 className="text-lg font-syne font-black text-white mb-5 flex items-center gap-2">
            <span className="text-blue-light">⚽</span> Fase a Gironi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => {
              const groupTeams = teams.filter((t) => t.group_id === group.id)
              const gMatches = groupMatches.filter((m) => m.group_id === group.id)
              return (
                <div key={group.id} className="glass rounded-2xl p-4">
                  <GroupStandings
                    teams={groupTeams}
                    matches={gMatches}
                    groupName={group.name}
                    className="mb-4"
                  />
                  <div className="border-t border-white/[0.06] pt-3 flex flex-col gap-2">
                    {gMatches.map((match) => (
                      <div key={match.id} className="text-xs bg-night-1/50 rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-600">{formatMatchDate(match.scheduled_at)}</span>
                          <span className={
                            match.status === 'live'
                              ? 'text-red-400 font-bold animate-pulse'
                              : match.status === 'completed'
                              ? 'text-emerald-400 font-semibold'
                              : 'text-slate-600'
                          }>
                            {match.status === 'live' ? '● LIVE' : match.status === 'completed' ? 'FT' : 'vs'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <span>{match.home_team?.flag_emoji}</span>
                            <span>{match.home_team?.code ?? 'TBD'}</span>
                          </span>
                          {match.status === 'completed' ? (
                            <span className="font-bold text-white tabular-nums px-2">
                              {match.home_score} – {match.away_score}
                            </span>
                          ) : (
                            <span className="text-slate-700 px-2 text-xs">—</span>
                          )}
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <span>{match.away_team?.code ?? 'TBD'}</span>
                            <span>{match.away_team?.flag_emoji}</span>
                          </span>
                        </div>
                        {match.home_penalties !== null && match.away_penalties !== null && (
                          <div className="text-center text-slate-600 mt-0.5">
                            (rig. {match.home_penalties}–{match.away_penalties})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Knockout Bracket */}
        <section>
          <h2 className="text-lg font-syne font-black text-white mb-5 flex items-center gap-2">
            <span className="text-amber-accent">🏆</span> Knockout Bracket
          </h2>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {KNOCKOUT_STAGES.map(({ stage, label }) => {
                const stageMatches = knockoutMatches.filter((m) => m.stage === stage)
                if (stageMatches.length === 0) return null
                return (
                  <div key={stage} className="flex flex-col">
                    <div className="text-center mb-3">
                      <span className="text-xs font-bold text-blue-light uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <div
                      className="flex flex-col gap-4"
                      style={{ justifyContent: 'space-around', height: `${stageMatches.length * 160}px` }}
                    >
                      {stageMatches.map((match) => (
                        <BracketMatchCard
                          key={match.id}
                          match={resolveKo(match)}
                          locked
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Third place */}
          {thirdPlaceMatch && (
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <h3 className="text-base font-syne font-black text-white mb-4">🥉 Terzo Posto</h3>
              <div className="max-w-xs">
                <BracketMatchCard match={resolveKo(thirdPlaceMatch)} locked compact={false} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

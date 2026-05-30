export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatMatchDate } from '@/lib/utils'
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

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  live: '● LIVE',
  completed: 'FT',
}

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
  const thirdPlaceMatch = knockoutMatches.find((m) => m.stage === 'third_place')

  return (
    <div className="min-h-screen bg-[#0f2318]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            World Cup <span className="text-[#d4af37]">2026</span> Bracket
          </h1>
          <p className="text-gray-400 text-sm">
            Live results — updated as the tournament progresses
          </p>
        </div>

        {/* Group Stage */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-[#d4af37]">⚽</span> Group Stage
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => {
              const groupTeams = teams.filter((t) => t.group_id === group.id)
              const gMatches = groupMatches.filter((m) => m.group_id === group.id)
              return (
                <div
                  key={group.id}
                  className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4"
                >
                  <GroupStandings
                    teams={groupTeams}
                    matches={gMatches}
                    groupName={group.name}
                    className="mb-4"
                  />
                  <div className="border-t border-[#2d5a3d] pt-3 flex flex-col gap-2">
                    {gMatches.map((match) => (
                      <div
                        key={match.id}
                        className="text-xs bg-[#0f2318]/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">{formatMatchDate(match.scheduled_at)}</span>
                          <span
                            className={`font-semibold ${
                              match.status === 'live'
                                ? 'text-red-400'
                                : match.status === 'completed'
                                ? 'text-green-400'
                                : 'text-gray-600'
                            }`}
                          >
                            {STATUS_LABELS[match.status]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-medium text-gray-300">
                            <span>{match.home_team?.flag_emoji}</span>
                            <span>{match.home_team?.code ?? 'TBD'}</span>
                          </span>
                          {match.status === 'completed' ? (
                            <span className="font-bold text-white px-2">
                              {match.home_score} – {match.away_score}
                            </span>
                          ) : (
                            <span className="text-gray-600 px-2">vs</span>
                          )}
                          <span className="flex items-center gap-1 font-medium text-gray-300">
                            <span>{match.away_team?.code ?? 'TBD'}</span>
                            <span>{match.away_team?.flag_emoji}</span>
                          </span>
                        </div>
                        {match.home_penalties !== null && match.away_penalties !== null && (
                          <div className="text-center text-gray-600 mt-0.5">
                            ({match.home_penalties}–{match.away_penalties} pens)
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
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-[#d4af37]">🏆</span> Knockout Bracket
          </h2>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {KNOCKOUT_STAGES.map(({ stage, label }) => {
                const stageMatches = knockoutMatches.filter((m) => m.stage === stage)
                if (stageMatches.length === 0) return null
                return (
                  <div key={stage} className="flex flex-col">
                    <div className="text-center mb-3">
                      <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <div
                      className="flex flex-col gap-4"
                      style={{
                        justifyContent: 'space-around',
                        height: `${stageMatches.length * 160}px`,
                      }}
                    >
                      {stageMatches.map((match) => (
                        <BracketMatchCard
                          key={match.id}
                          match={match}
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
            <div className="mt-8 border-t border-[#2d5a3d] pt-6">
              <h3 className="text-base font-bold text-white mb-4">🥉 Third Place Match</h3>
              <div className="max-w-xs">
                <BracketMatchCard match={thirdPlaceMatch} locked compact={false} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

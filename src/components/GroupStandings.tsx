'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Team, Match, GroupPrediction } from '@/types/database'

interface StandingRow {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

interface GroupStandingsProps {
  teams: Team[]
  matches: Match[]
  groupName: string
  predictions?: GroupPrediction[]
  className?: string
}

function buildStandings(
  teams: Team[],
  matches: Match[],
  usePredictions: boolean,
  predictions?: GroupPrediction[]
): StandingRow[] {
  const rows: Record<string, StandingRow> = {}

  for (const team of teams) {
    rows[team.id] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  }

  for (const match of matches) {
    if (!match.home_team_id || !match.away_team_id) continue

    let homeScore: number | null = null
    let awayScore: number | null = null

    if (usePredictions && predictions) {
      const pred = predictions.find((p) => p.match_id === match.id)
      if (pred && pred.predicted_home_score !== null && pred.predicted_away_score !== null) {
        homeScore = pred.predicted_home_score
        awayScore = pred.predicted_away_score
      } else if (pred) {
        // Outcome only, no exact score
        if (pred.predicted_outcome === '1') { homeScore = 1; awayScore = 0 }
        else if (pred.predicted_outcome === 'X') { homeScore = 0; awayScore = 0 }
        else { homeScore = 0; awayScore = 1 }
      }
    } else if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
      homeScore = match.home_score
      awayScore = match.away_score
    }

    if (homeScore === null || awayScore === null) continue

    const home = rows[match.home_team_id]
    const away = rows[match.away_team_id]
    if (!home || !away) continue

    home.played++
    away.played++
    home.gf += homeScore
    home.ga += awayScore
    away.gf += awayScore
    away.ga += homeScore

    if (homeScore > awayScore) {
      home.won++; home.points += 3
      away.lost++
    } else if (homeScore === awayScore) {
      home.drawn++; home.points++
      away.drawn++; away.points++
    } else {
      away.won++; away.points += 3
      home.lost++
    }
  }

  const result = Object.values(rows).map((r) => ({ ...r, gd: r.gf - r.ga }))

  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.name.localeCompare(b.team.name)
  })

  return result
}

export default function GroupStandings({
  teams,
  matches,
  groupName,
  predictions,
  className,
}: GroupStandingsProps) {
  const actualStandings = useMemo(
    () => buildStandings(teams, matches, false),
    [teams, matches]
  )

  const predictedStandings = useMemo(
    () =>
      predictions && predictions.length > 0
        ? buildStandings(teams, matches, true, predictions)
        : null,
    [teams, matches, predictions]
  )

  const displayStandings = predictedStandings ?? actualStandings
  const isPredicted = !!predictedStandings

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-syne font-bold text-blue-light uppercase tracking-wide">
          Gruppo {groupName}
        </h3>
        {isPredicted && (
          <span className="text-xs text-ink-muted italic">Stima</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-muted uppercase">
              <th className="text-left pb-2 pr-2 font-medium w-6">#</th>
              <th className="text-left pb-2 font-medium">Squadra</th>
              <th className="text-center pb-2 w-7 font-medium">G</th>
              <th className="text-center pb-2 w-7 font-medium">V</th>
              <th className="text-center pb-2 w-7 font-medium">P</th>
              <th className="text-center pb-2 w-7 font-medium">S</th>
              <th className="text-center pb-2 w-8 font-medium">DR</th>
              <th className="text-center pb-2 w-8 font-bold text-ink-soft">Pt</th>
            </tr>
          </thead>
          <tbody>
            {displayStandings.map((row, idx) => (
              <tr key={row.team.id} className={cn(
                'transition-colors',
                idx < 2 && 'bg-blue-dim/30',
              )}>
                <td className="py-1.5 pr-2">
                  <span className={cn(
                    'inline-flex w-5 h-5 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                    idx === 0 ? 'bg-blue-primary text-white' :
                    idx === 1 ? 'bg-blue-dim text-blue-light' :
                    'text-ink-muted'
                  )}>
                    {idx + 1}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">{row.team.flag_emoji}</span>
                    <span className={cn('font-medium', idx < 2 ? 'text-ink' : 'text-ink-soft')}>
                      {row.team.code}
                    </span>
                  </span>
                </td>
                <td className="text-center py-1.5 text-ink-muted tabular-nums">{row.played}</td>
                <td className="text-center py-1.5 text-ink-soft tabular-nums">{row.won}</td>
                <td className="text-center py-1.5 text-ink-muted tabular-nums">{row.drawn}</td>
                <td className="text-center py-1.5 text-ink-muted tabular-nums">{row.lost}</td>
                <td className={cn('text-center py-1.5 tabular-nums',
                  row.gd > 0 ? 'text-emerald-600' : row.gd < 0 ? 'text-red-500' : 'text-ink-muted'
                )}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="text-center py-1.5 tabular-nums font-bold text-ink">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

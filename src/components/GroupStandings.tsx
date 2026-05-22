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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[#d4af37] uppercase tracking-wide">
          Group {groupName}
        </h3>
        {isPredicted && (
          <span className="text-xs text-gray-500 italic">Predicted standings</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase border-b border-[#2d5a3d]">
              <th className="text-left py-1.5 pr-2 font-medium w-6">#</th>
              <th className="text-left py-1.5 font-medium">Team</th>
              <th className="text-center py-1.5 w-8 font-medium">P</th>
              <th className="text-center py-1.5 w-8 font-medium">W</th>
              <th className="text-center py-1.5 w-8 font-medium">D</th>
              <th className="text-center py-1.5 w-8 font-medium">L</th>
              <th className="text-center py-1.5 w-10 font-medium hidden sm:table-cell">GF</th>
              <th className="text-center py-1.5 w-10 font-medium hidden sm:table-cell">GA</th>
              <th className="text-center py-1.5 w-10 font-medium">GD</th>
              <th className="text-center py-1.5 w-10 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {displayStandings.map((row, idx) => (
              <tr
                key={row.team.id}
                className={cn(
                  'border-b border-[#2d5a3d]/50 transition-colors',
                  idx < 2 && 'bg-[#d4af37]/5',
                  idx === 0 && 'bg-[#d4af37]/10'
                )}
              >
                <td className="py-1.5 pr-2">
                  <span
                    className={cn(
                      'inline-flex w-5 h-5 items-center justify-center rounded-full text-xs font-bold',
                      idx === 0
                        ? 'bg-[#d4af37] text-[#0f2318]'
                        : idx === 1
                        ? 'bg-[#1a3d2b] border border-[#d4af37]/40 text-[#d4af37]'
                        : 'text-gray-500'
                    )}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{row.team.flag_emoji}</span>
                    <span className={cn('font-medium', idx < 2 ? 'text-white' : 'text-gray-300')}>
                      {row.team.code}
                    </span>
                  </span>
                </td>
                <td className="text-center py-1.5 text-gray-400">{row.played}</td>
                <td className="text-center py-1.5 text-gray-300">{row.won}</td>
                <td className="text-center py-1.5 text-gray-400">{row.drawn}</td>
                <td className="text-center py-1.5 text-gray-400">{row.lost}</td>
                <td className="text-center py-1.5 text-gray-400 hidden sm:table-cell">{row.gf}</td>
                <td className="text-center py-1.5 text-gray-400 hidden sm:table-cell">{row.ga}</td>
                <td
                  className={cn(
                    'text-center py-1.5',
                    row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-gray-400'
                  )}
                >
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="text-center py-1.5 font-bold text-white">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

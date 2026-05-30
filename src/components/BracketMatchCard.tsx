'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatMatchDate } from '@/lib/utils'
import type { Match, BracketPrediction, Team } from '@/types/database'

interface BracketMatchCardProps {
  match: Match
  prediction?: BracketPrediction
  onPredict?: (winnerId: string) => void
  locked?: boolean
  isLoggedIn?: boolean
  compact?: boolean
}

export default function BracketMatchCard({
  match, prediction, onPredict, locked = false, isLoggedIn = false, compact = false,
}: BracketMatchCardProps) {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | undefined>(
    prediction?.predicted_winner_id
  )

  const isCompleted = match.status === 'completed'
  const isLive = match.status === 'live'

  const handleTeamClick = (team: Team) => {
    if (locked || !onPredict || !isLoggedIn) return
    const newId = selectedWinnerId === team.id ? undefined : team.id
    setSelectedWinnerId(newId)
    if (newId) onPredict(newId)
  }

  const homeTeam = match.home_team
  const awayTeam = match.away_team
  const actualWinnerId = match.winner_id

  const homeIsPredicted = selectedWinnerId === homeTeam?.id
  const awayIsPredicted = selectedWinnerId === awayTeam?.id
  const homeIsCorrect = isCompleted && homeIsPredicted && actualWinnerId === homeTeam?.id
  const awayIsCorrect = isCompleted && awayIsPredicted && actualWinnerId === awayTeam?.id
  const homeIsWrong = isCompleted && homeIsPredicted && !homeIsCorrect
  const awayIsWrong = isCompleted && awayIsPredicted && !awayIsCorrect

  const TeamRow = ({
    team, score, isWinner, isPredicted, isCorrect, isWrong,
  }: {
    team: Team | undefined | null
    score: number | null | undefined
    isWinner: boolean
    isPredicted: boolean
    isCorrect: boolean
    isWrong: boolean
  }) => (
    <div
      onClick={() => team && handleTeamClick(team)}
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150',
        team && isLoggedIn && !locked && !isCompleted && 'cursor-pointer hover:bg-blue-dim',
        isPredicted && !isCompleted && 'bg-blue-dim',
        isCorrect && 'bg-emerald-500/10',
        isWrong && 'bg-red-500/10',
        isWinner && isCompleted && !isCorrect && !isWrong && 'bg-night-3',
        !team && 'opacity-40',
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-lg leading-none flex-shrink-0">{team?.flag_emoji ?? '🏳️'}</span>
        <span className={cn(
          'text-sm font-medium truncate',
          isWinner ? 'text-white font-semibold' : 'text-slate-300',
          isPredicted && !isCompleted && 'text-blue-light',
          isCorrect && 'text-emerald-400 font-semibold',
          isWrong && 'text-red-400',
          !team && 'text-slate-600 italic'
        )}>
          {team ? (compact ? team.code : team.name) : 'TBD'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isCompleted && score != null && (
          <span className={cn('text-base tabular-nums font-bold w-5 text-right', isWinner ? 'text-white' : 'text-slate-500')}>
            {score}
          </span>
        )}
        {isPredicted && !isCompleted && <span className="text-blue-light text-xs">●</span>}
        {isCorrect && <span className="text-emerald-400 text-xs">✓</span>}
        {isWrong && <span className="text-red-400 text-xs">✗</span>}
      </div>
    </div>
  )

  return (
    <div className={cn(
      'glass rounded-2xl overflow-hidden',
      isLive && 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      compact ? 'min-w-[180px] max-w-[220px]' : 'min-w-[220px] max-w-[280px]'
    )}>
      {/* Header */}
      <div className="px-3 py-2 bg-night-2/60 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-600 tabular-nums">#{match.match_number}</span>
        {isLive && <span className="text-xs text-red-400 font-bold animate-pulse">● LIVE</span>}
        {match.scheduled_at && (
          <span className="text-xs text-slate-600">{formatMatchDate(match.scheduled_at)}</span>
        )}
      </div>

      {/* Teams */}
      <div className="p-2 flex flex-col gap-1">
        <TeamRow
          team={homeTeam} score={match.home_score}
          isWinner={isCompleted && actualWinnerId === homeTeam?.id}
          isPredicted={homeIsPredicted} isCorrect={homeIsCorrect} isWrong={homeIsWrong}
        />
        <div className="text-center py-0.5">
          <span className="text-xs text-slate-700 font-medium">vs</span>
        </div>
        <TeamRow
          team={awayTeam} score={match.away_score}
          isWinner={isCompleted && actualWinnerId === awayTeam?.id}
          isPredicted={awayIsPredicted} isCorrect={awayIsCorrect} isWrong={awayIsWrong}
        />
      </div>

      {/* Penalties */}
      {isCompleted && match.home_penalties != null && match.away_penalties != null && (
        <div className="px-3 py-1.5 bg-night-2/40 text-center">
          <span className="text-xs text-slate-500">Rig: {match.home_penalties}–{match.away_penalties}</span>
        </div>
      )}

      {/* CTA footer */}
      {isLoggedIn && !locked && !isCompleted && (homeTeam || awayTeam) && (
        <div className="px-3 py-2 bg-night-2/30 text-center">
          {selectedWinnerId ? (
            <p className="text-xs text-blue-light font-medium">● Salvato</p>
          ) : (
            <p className="text-xs text-slate-600">Clicca una squadra</p>
          )}
        </div>
      )}
      {locked && selectedWinnerId && (
        <div className="px-3 py-2 bg-night-2/30 text-center">
          <p className="text-xs text-blue-light">🔒 Confermato</p>
        </div>
      )}
    </div>
  )
}

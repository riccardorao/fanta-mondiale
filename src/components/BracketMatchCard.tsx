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
  match,
  prediction,
  onPredict,
  locked = false,
  isLoggedIn = false,
  compact = false,
}: BracketMatchCardProps) {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | undefined>(
    prediction?.predicted_winner_id
  )

  const isCompleted = match.status === 'completed'

  const handleTeamClick = (team: Team) => {
    if (locked || !onPredict || !isLoggedIn) return
    const newWinnerId = selectedWinnerId === team.id ? undefined : team.id
    setSelectedWinnerId(newWinnerId)
    if (newWinnerId) {
      onPredict(newWinnerId)
    }
  }

  const TeamSlot = ({
    team,
    score,
    isWinner,
    isPredicted,
    isCorrect,
    isWrong,
  }: {
    team: Team | undefined | null
    score: number | null | undefined
    isWinner: boolean
    isPredicted: boolean
    isCorrect: boolean
    isWrong: boolean
  }) => (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150',
        team && isLoggedIn && !locked && !isCompleted && 'cursor-pointer hover:bg-[#d4af37]/10',
        isPredicted && !isCompleted && 'bg-[#d4af37]/10 border border-[#d4af37]/40',
        isWinner && isCompleted && 'bg-green-900/20',
        isCorrect && 'bg-green-900/20 border border-green-700/40',
        isWrong && 'border border-red-700/30',
        !team && 'opacity-50'
      )}
      onClick={() => team && handleTeamClick(team)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-lg leading-none flex-shrink-0">
          {team ? team.flag_emoji : '🏳️'}
        </span>
        <span
          className={cn(
            'text-sm font-medium truncate',
            isWinner ? 'text-white font-bold' : 'text-gray-300',
            isPredicted && !isCompleted && 'text-[#d4af37]',
            isCorrect && 'text-green-400',
            !team && 'text-gray-600 italic'
          )}
        >
          {team ? (compact ? team.code : team.name) : 'TBD'}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isCompleted && score !== null && score !== undefined && (
          <span
            className={cn(
              'text-lg font-bold w-6 text-center',
              isWinner ? 'text-white' : 'text-gray-400'
            )}
          >
            {score}
          </span>
        )}
        {isPredicted && !isCompleted && (
          <span className="text-[#d4af37] text-sm">★</span>
        )}
        {isCorrect && (
          <span className="text-green-400 text-xs">✓</span>
        )}
        {isWrong && (
          <span className="text-red-400 text-xs">✗</span>
        )}
      </div>
    </div>
  )

  const homeTeam = match.home_team
  const awayTeam = match.away_team
  const actualWinnerId = match.winner_id

  const homeIsPredicted = selectedWinnerId === homeTeam?.id
  const awayIsPredicted = selectedWinnerId === awayTeam?.id
  const homeIsCorrect = isCompleted && homeIsPredicted && actualWinnerId === homeTeam?.id
  const awayIsCorrect = isCompleted && awayIsPredicted && actualWinnerId === awayTeam?.id
  const homeIsWrong = isCompleted && homeIsPredicted && actualWinnerId !== homeTeam?.id
  const awayIsWrong = isCompleted && awayIsPredicted && actualWinnerId !== awayTeam?.id

  return (
    <div
      className={cn(
        'bg-[#1a3d2b]/60 border border-[#2d5a3d] rounded-xl overflow-hidden',
        match.status === 'live' && 'border-red-600/40',
        compact ? 'min-w-[180px] max-w-[220px]' : 'min-w-[220px] max-w-[280px]'
      )}
    >
      {/* Header */}
      <div className="px-3 py-1.5 bg-[#0f2318]/60 border-b border-[#2d5a3d] flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 font-medium">#{match.match_number}</span>
        {match.status === 'live' && (
          <span className="text-xs text-red-400 font-bold animate-pulse">● LIVE</span>
        )}
        {match.scheduled_at && (
          <span className="text-xs text-gray-600">{formatMatchDate(match.scheduled_at)}</span>
        )}
      </div>

      {/* Teams */}
      <div className="p-2 flex flex-col gap-1">
        <TeamSlot
          team={homeTeam}
          score={match.home_score}
          isWinner={isCompleted && actualWinnerId === homeTeam?.id}
          isPredicted={homeIsPredicted}
          isCorrect={homeIsCorrect}
          isWrong={homeIsWrong}
        />

        <div className="text-center">
          <span className="text-xs text-gray-600 font-medium">vs</span>
        </div>

        <TeamSlot
          team={awayTeam}
          score={match.away_score}
          isWinner={isCompleted && actualWinnerId === awayTeam?.id}
          isPredicted={awayIsPredicted}
          isCorrect={awayIsCorrect}
          isWrong={awayIsWrong}
        />
      </div>

      {/* Penalties */}
      {isCompleted && match.home_penalties !== null && match.away_penalties !== null && (
        <div className="px-3 py-1 border-t border-[#2d5a3d] text-center">
          <span className="text-xs text-gray-500">
            Penalties: {match.home_penalties}–{match.away_penalties}
          </span>
        </div>
      )}

      {/* CTA */}
      {isLoggedIn && !locked && !isCompleted && (homeTeam || awayTeam) && (
        <div className="px-3 py-1.5 border-t border-[#2d5a3d] bg-[#0f2318]/30">
          {selectedWinnerId ? (
            <p className="text-xs text-[#d4af37] text-center font-medium">
              ★ Prediction saved
            </p>
          ) : (
            <p className="text-xs text-gray-500 text-center">Click a team to predict winner</p>
          )}
        </div>
      )}
      {locked && selectedWinnerId && (
        <div className="px-3 py-1.5 border-t border-[#2d5a3d]">
          <p className="text-xs text-[#d4af37] text-center">🔒 Locked in</p>
        </div>
      )}
    </div>
  )
}

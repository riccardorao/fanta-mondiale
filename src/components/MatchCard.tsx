'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatMatchDate } from '@/lib/utils'
import type { Match, GroupPrediction, PredictedOutcome } from '@/types/database'
import TeamFlag from '@/components/TeamFlag'
import Badge from '@/components/ui/Badge'

interface MatchCardProps {
  match: Match
  prediction?: GroupPrediction
  onPredict?: (outcome: PredictedOutcome, homeScore?: number, awayScore?: number) => void
  locked?: boolean
  showPrediction?: boolean
  isLoggedIn?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-Final',
  sf: 'Semi-Final',
  third_place: 'Third Place',
  final: 'Final',
}

const STATUS_VARIANTS: Record<string, 'default' | 'gold' | 'red' | 'gray' | 'blue' | 'green'> = {
  upcoming: 'gray',
  live: 'red',
  completed: 'default',
}

export default function MatchCard({
  match,
  prediction,
  onPredict,
  locked = false,
  showPrediction = true,
  isLoggedIn = false,
}: MatchCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<PredictedOutcome | undefined>(
    prediction?.predicted_outcome
  )
  const [homeScore, setHomeScore] = useState<string>(
    prediction?.predicted_home_score?.toString() ?? ''
  )
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.predicted_away_score?.toString() ?? ''
  )

  const isGroupStage = match.stage === 'group'
  const isCompleted = match.status === 'completed'

  const actualResult =
    isCompleted && match.home_score !== null && match.away_score !== null
      ? match.home_score > match.away_score
        ? '1'
        : match.home_score === match.away_score
        ? 'X'
        : '2'
      : null

  const handleOutcomeClick = (outcome: PredictedOutcome) => {
    if (locked || !onPredict) return
    const newOutcome = selectedOutcome === outcome ? undefined : outcome
    setSelectedOutcome(newOutcome)
    if (newOutcome) {
      onPredict(
        newOutcome,
        homeScore !== '' ? parseInt(homeScore) : undefined,
        awayScore !== '' ? parseInt(awayScore) : undefined
      )
    }
  }

  const handleScoreChange = (side: 'home' | 'away', val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 2)
    if (side === 'home') {
      setHomeScore(sanitized)
      if (selectedOutcome && onPredict) {
        onPredict(
          selectedOutcome,
          sanitized !== '' ? parseInt(sanitized) : undefined,
          awayScore !== '' ? parseInt(awayScore) : undefined
        )
      }
    } else {
      setAwayScore(sanitized)
      if (selectedOutcome && onPredict) {
        onPredict(
          selectedOutcome,
          homeScore !== '' ? parseInt(homeScore) : undefined,
          sanitized !== '' ? parseInt(sanitized) : undefined
        )
      }
    }
  }

  return (
    <div
      className={cn(
        'bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl p-4 transition-colors duration-150',
        match.status === 'live' && 'border-red-600/50 bg-red-900/5'
      )}
    >
      {/* Top row: badges + date + venue */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant={STATUS_VARIANTS[match.status]}>
          {match.status === 'live' ? '● LIVE' : STAGE_LABELS[match.stage]}
        </Badge>
        {match.group && (
          <Badge variant="gold">Group {match.group.name}</Badge>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          {formatMatchDate(match.scheduled_at)}
        </span>
        {match.venue && (
          <span className="text-xs text-gray-600 hidden sm:block">📍 {match.venue}</span>
        )}
        {locked && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            🔒 Locked
          </span>
        )}
      </div>

      {/* Main match row */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 flex justify-end">
          <TeamFlag team={match.home_team} className="flex-row-reverse sm:flex-row" />
        </div>

        {/* Score / VS */}
        <div className="flex-shrink-0 px-2 text-center min-w-[80px]">
          {isCompleted && match.home_score !== null && match.away_score !== null ? (
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-white">{match.home_score}</span>
              <span className="text-lg text-gray-500">-</span>
              <span className="text-2xl font-bold text-white">{match.away_score}</span>
            </div>
          ) : match.status === 'live' ? (
            <span className="text-lg font-bold text-red-400 animate-pulse">LIVE</span>
          ) : (
            <span className="text-lg font-semibold text-gray-500">vs</span>
          )}
          {match.home_penalties !== null && match.away_penalties !== null && (
            <div className="text-xs text-gray-500 text-center mt-0.5">
              ({match.home_penalties}–{match.away_penalties} pens)
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex justify-start">
          <TeamFlag team={match.away_team} />
        </div>
      </div>

      {/* Prediction UI: Group stage only */}
      {isGroupStage && showPrediction && isLoggedIn && (
        <div className="mt-4 border-t border-[#2d5a3d] pt-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* 1 X 2 buttons */}
            <div className="flex gap-2">
              {(['1', 'X', '2'] as PredictedOutcome[]).map((outcome) => {
                const isSelected = selectedOutcome === outcome
                const isCorrect = isCompleted && actualResult === outcome
                const isWrong =
                  isCompleted && selectedOutcome === outcome && actualResult !== outcome
                return (
                  <button
                    key={outcome}
                    onClick={() => handleOutcomeClick(outcome)}
                    disabled={locked}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-bold border transition-all duration-150',
                      isSelected
                        ? 'bg-[#d4af37] text-[#0f2318] border-[#d4af37]'
                        : 'bg-[#0f2318] text-gray-300 border-[#2d5a3d] hover:border-[#d4af37] hover:text-[#d4af37]',
                      isCorrect && !isSelected && 'border-green-500 text-green-400',
                      isWrong && 'border-red-500',
                      locked && 'cursor-not-allowed opacity-70'
                    )}
                    title={
                      outcome === '1'
                        ? 'Home Win'
                        : outcome === 'X'
                        ? 'Draw'
                        : 'Away Win'
                    }
                  >
                    {outcome}
                  </button>
                )
              })}
              <span className="text-xs text-gray-500 self-center ml-1 hidden sm:block">
                {selectedOutcome === '1'
                  ? 'Home Win'
                  : selectedOutcome === 'X'
                  ? 'Draw'
                  : selectedOutcome === '2'
                  ? 'Away Win'
                  : 'Pick result'}
              </span>
            </div>

            {/* Score inputs */}
            {selectedOutcome && !locked && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Score (optional):</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={homeScore}
                  onChange={(e) => handleScoreChange('home', e.target.value)}
                  placeholder="0"
                  className="w-12 text-center bg-[#0f2318] border border-[#2d5a3d] rounded-lg px-2 py-1 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                />
                <span className="text-gray-500 text-sm">–</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={awayScore}
                  onChange={(e) => handleScoreChange('away', e.target.value)}
                  placeholder="0"
                  className="w-12 text-center bg-[#0f2318] border border-[#2d5a3d] rounded-lg px-2 py-1 text-white text-sm focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            )}

            {/* Show saved prediction if locked */}
            {locked && selectedOutcome && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Your pick:</span>
                <span className="font-bold text-[#d4af37]">
                  {selectedOutcome === '1'
                    ? 'Home Win'
                    : selectedOutcome === 'X'
                    ? 'Draw'
                    : 'Away Win'}
                </span>
                {prediction?.predicted_home_score !== null &&
                  prediction?.predicted_home_score !== undefined && (
                    <span className="text-gray-500">
                      ({prediction.predicted_home_score}–{prediction.predicted_away_score})
                    </span>
                  )}
              </div>
            )}
          </div>

          {/* Result feedback */}
          {isCompleted && selectedOutcome && (
            <div className="mt-2">
              {selectedOutcome === actualResult ? (
                <span className="text-xs text-green-400 font-medium">
                  ✓ Correct! +3 pts
                  {prediction?.predicted_home_score === match.home_score &&
                    prediction?.predicted_away_score === match.away_score &&
                    ' +2 exact score bonus'}
                </span>
              ) : (
                <span className="text-xs text-red-400 font-medium">✗ Wrong result</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Match number badge */}
      <div className="mt-2 text-right">
        <span className="text-xs text-gray-600">#{match.match_number}</span>
      </div>
    </div>
  )
}

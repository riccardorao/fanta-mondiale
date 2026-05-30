'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatMatchDate } from '@/lib/utils'
import type { Match, GroupPrediction, PredictedOutcome } from '@/types/database'
import TeamFlag from '@/components/TeamFlag'

interface MatchCardProps {
  match: Match
  prediction?: GroupPrediction
  onPredict?: (outcome: PredictedOutcome, homeScore?: number, awayScore?: number) => void
  locked?: boolean
  showPrediction?: boolean
  isLoggedIn?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  group: 'Gironi', r32: 'R32', r16: 'Ottavi', qf: 'Quarti', sf: 'Semifinali',
  third_place: 'Terzo posto', final: 'Finale',
}

export default function MatchCard({
  match, prediction, onPredict, locked = false, showPrediction = true, isLoggedIn = false,
}: MatchCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<PredictedOutcome | undefined>(
    prediction?.predicted_outcome
  )
  const [homeScore, setHomeScore] = useState<string>(prediction?.predicted_home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(prediction?.predicted_away_score?.toString() ?? '')

  const isCompleted = match.status === 'completed'
  const isLive = match.status === 'live'

  const actualResult =
    isCompleted && match.home_score !== null && match.away_score !== null
      ? match.home_score > match.away_score ? '1' : match.home_score === match.away_score ? 'X' : '2'
      : null

  const handleOutcomeClick = (outcome: PredictedOutcome) => {
    if (locked || !onPredict) return
    const newOutcome = selectedOutcome === outcome ? undefined : outcome
    setSelectedOutcome(newOutcome)
    if (newOutcome) {
      onPredict(newOutcome,
        homeScore !== '' ? parseInt(homeScore) : undefined,
        awayScore !== '' ? parseInt(awayScore) : undefined
      )
    }
  }

  const handleScoreChange = (side: 'home' | 'away', val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 2)
    const newHome = side === 'home' ? sanitized : homeScore
    const newAway = side === 'away' ? sanitized : awayScore
    if (side === 'home') setHomeScore(sanitized); else setAwayScore(sanitized)
    if (selectedOutcome && onPredict) {
      onPredict(selectedOutcome,
        newHome !== '' ? parseInt(newHome) : undefined,
        newAway !== '' ? parseInt(newAway) : undefined
      )
    }
  }

  const outcomeLabel = { '1': 'Casa', 'X': 'Pareggio', '2': 'Ospite' }

  return (
    <div className={cn(
      'glass rounded-2xl p-4 transition-all duration-200',
      isLive && 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    )}>
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-xs font-bold px-2.5 py-0.5 rounded-full',
            isLive ? 'bg-red-500/20 text-red-400' : 'bg-night-2 text-slate-400'
          )}>
            {isLive ? '● LIVE' : STAGE_LABELS[match.stage]}
          </span>
          {match.group && (
            <span className="text-xs font-semibold text-blue-light/60">
              Gruppo {match.group.name}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-600">{formatMatchDate(match.scheduled_at)}</span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex justify-end">
          <TeamFlag team={match.home_team} className="flex-row-reverse sm:flex-row" />
        </div>

        <div className="flex-shrink-0 px-3 text-center min-w-[80px]">
          {isCompleted && match.home_score !== null ? (
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl tabular-nums font-bold text-white">{match.home_score}</span>
              <span className="text-slate-600 text-lg mx-0.5">–</span>
              <span className="text-2xl tabular-nums font-bold text-white">{match.away_score}</span>
            </div>
          ) : isLive ? (
            <span className="text-base font-bold text-red-400 animate-pulse">LIVE</span>
          ) : (
            <span className="text-base font-semibold text-slate-600">vs</span>
          )}
          {match.home_penalties !== null && match.away_penalties !== null && (
            <div className="text-xs text-slate-600 mt-0.5">
              ({match.home_penalties}–{match.away_penalties} rig.)
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-start">
          <TeamFlag team={match.away_team} />
        </div>
      </div>

      {/* Prediction UI */}
      {match.stage === 'group' && showPrediction && isLoggedIn && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            {/* 1 X 2 */}
            <div className="flex gap-2">
              {(['1', 'X', '2'] as PredictedOutcome[]).map((outcome) => {
                const isSelected = selectedOutcome === outcome
                const isCorrect = isCompleted && actualResult === outcome && isSelected
                const isWrong = isCompleted && isSelected && actualResult !== outcome
                return (
                  <button
                    key={outcome}
                    onClick={() => handleOutcomeClick(outcome)}
                    disabled={locked}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-bold transition-all duration-150 active:scale-95',
                      isSelected
                        ? isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isWrong
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-primary text-white shadow-blue-sm'
                        : 'bg-night-1 text-slate-400 hover:bg-night-2 hover:text-white',
                      !isSelected && isCompleted && actualResult === outcome && 'bg-emerald-500/10 text-emerald-500',
                      locked && 'cursor-default'
                    )}
                  >
                    {outcome}
                  </button>
                )
              })}
              {selectedOutcome && (
                <span className="text-xs text-slate-500 self-center ml-1 hidden sm:block">
                  {outcomeLabel[selectedOutcome]}
                </span>
              )}
            </div>

            {/* Score inputs */}
            {selectedOutcome && !locked && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">+5 se esatto:</span>
                <input
                  type="number" min={0} max={99} value={homeScore}
                  onChange={(e) => handleScoreChange('home', e.target.value)}
                  placeholder="0"
                  className="w-10 text-center bg-night-1 rounded-lg py-1.5 text-white text-sm tabular-nums"
                />
                <span className="text-slate-600 text-sm">–</span>
                <input
                  type="number" min={0} max={99} value={awayScore}
                  onChange={(e) => handleScoreChange('away', e.target.value)}
                  placeholder="0"
                  className="w-10 text-center bg-night-1 rounded-lg py-1.5 text-white text-sm tabular-nums"
                />
              </div>
            )}

            {locked && selectedOutcome && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Il tuo pick:</span>
                <span className="font-bold text-blue-light">{outcomeLabel[selectedOutcome]}</span>
                {prediction?.predicted_home_score != null && (
                  <span className="text-slate-600">
                    ({prediction.predicted_home_score}–{prediction.predicted_away_score})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Result feedback */}
          {isCompleted && selectedOutcome && (
            <div className="mt-2.5">
              {selectedOutcome === actualResult ? (
                <span className="text-xs text-emerald-400 font-medium">
                  ✓ Risultato esatto! +10 punti
                  {prediction?.predicted_home_score === match.home_score &&
                    prediction?.predicted_away_score === match.away_score &&
                    ' +5 risultato esatto'}
                </span>
              ) : (
                <span className="text-xs text-red-400 font-medium">✗ Risultato sbagliato</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-right">
        <span className="text-xs text-slate-700">#{match.match_number}</span>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isPredictionLocked } from '@/lib/utils'
import BracketMatchCard from '@/components/BracketMatchCard'
import type { Match, BracketPrediction, Stage } from '@/types/database'

const STAGE_CONFIG: { stage: Stage; label: string; cols: number }[] = [
  { stage: 'r32', label: 'Round of 32', cols: 16 },
  { stage: 'r16', label: 'Round of 16', cols: 8 },
  { stage: 'qf', label: 'Quarter-Finals', cols: 4 },
  { stage: 'sf', label: 'Semi-Finals', cols: 2 },
  { stage: 'final', label: 'Final', cols: 1 },
]

const STAGE_POINTS: Record<Stage, number> = {
  group: 0,
  r32: 5,
  r16: 7,
  qf: 10,
  sf: 12,
  third_place: 8,
  final: 20,
}

export default function BracketPredictionsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<BracketPrediction[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      const { data: matchesData, error: matchErr } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(*),
          away_team:away_team_id(*),
          winner:winner_id(*)
        `)
        .in('stage', ['r32', 'r16', 'qf', 'sf', 'third_place', 'final'])
        .order('match_number')

      if (matchErr) {
        setError('Failed to load bracket matches.')
        setLoading(false)
        return
      }

      const { data: predsData } = await supabase
        .from('bracket_predictions')
        .select('*, predicted_winner:predicted_winner_id(*)')
        .eq('user_id', user.id)

      setMatches(matchesData as Match[] || [])
      setPredictions(predsData as BracketPrediction[] || [])

      const firstMatch = matchesData?.[0]
      if (firstMatch) {
        setLocked(isPredictionLocked(firstMatch.scheduled_at))
      }

      setLoading(false)
    }
    load()
  }, [])

  const handlePredict = useCallback(
    async (matchId: string, winnerId: string) => {
      if (!userId || locked) return

      const predObj: BracketPrediction = {
        id: crypto.randomUUID(),
        user_id: userId,
        match_id: matchId,
        predicted_winner_id: winnerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistic update
      setPredictions((prev) => {
        const existing = prev.findIndex((p) => p.match_id === matchId)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = predObj
          return next
        }
        return [...prev, predObj]
      })

      const { error } = await supabase
        .from('bracket_predictions')
        .upsert(predObj, { onConflict: 'user_id,match_id' })

      if (error) {
        toast.error('Failed to save prediction')
        // Revert optimistic update
        setPredictions((prev) => prev.filter((p) => p.match_id !== matchId))
      } else {
        toast.success('Prediction saved!', { id: `bp-${matchId}` })
      }
    },
    [userId, locked]
  )

  // Calculate current score from completed bracket predictions
  const computedPoints = predictions.reduce((total, pred) => {
    const match = matches.find((m) => m.id === pred.match_id)
    if (!match || match.status !== 'completed' || !match.winner_id) return total
    if (pred.predicted_winner_id === match.winner_id) {
      return total + (STAGE_POINTS[match.stage] ?? 0)
    }
    return total
  }, 0)

  const thirdPlaceMatch = matches.find((m) => m.stage === 'third_place')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f2318] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading bracket...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f2318] flex items-center justify-center px-4">
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f2318]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Knockout <span className="text-[#d4af37]">Bracket</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Pick the winner of every knockout match
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {locked && (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                🔒 Predictions Locked
              </span>
            )}
            <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Bracket Points</p>
              <p className="text-2xl font-bold text-[#d4af37]">{computedPoints}</p>
            </div>
            <div className="bg-[#1a3d2b]/50 border border-[#2d5a3d] rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Picks Made</p>
              <p className="text-2xl font-bold text-white">{predictions.length}/32</p>
            </div>
          </div>
        </div>

        {locked && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 mb-5 text-amber-400 text-sm flex items-center gap-2">
            🔒 The prediction deadline has passed. Your locked-in bracket predictions are shown below.
          </div>
        )}

        {/* Stage points legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STAGE_CONFIG.map(({ stage, label }) => (
            <div
              key={stage}
              className="bg-[#1a3d2b]/40 border border-[#2d5a3d] rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <span className="text-gray-400">{label}</span>
              <span className="text-[#d4af37] font-bold">{STAGE_POINTS[stage]} pts</span>
            </div>
          ))}
        </div>

        {/* Bracket rounds */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {STAGE_CONFIG.map(({ stage, label }) => {
              const stageMatches = matches.filter((m) => m.stage === stage)
              if (stageMatches.length === 0) return null

              return (
                <div key={stage} className="flex flex-col gap-2">
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">
                      {label}
                    </span>
                    <div className="text-xs text-gray-600">{STAGE_POINTS[stage]} pts each</div>
                  </div>
                  <div
                    className="flex flex-col gap-4"
                    style={{
                      justifyContent: 'space-around',
                      height: `${stageMatches.length * 160}px`,
                    }}
                  >
                    {stageMatches.map((match) => {
                      const pred = predictions.find((p) => p.match_id === match.id)
                      return (
                        <BracketMatchCard
                          key={match.id}
                          match={match}
                          prediction={pred}
                          onPredict={(winnerId) => handlePredict(match.id, winnerId)}
                          locked={locked}
                          isLoggedIn
                          compact
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Third place match */}
        {thirdPlaceMatch && (
          <div className="mt-8 border-t border-[#2d5a3d] pt-6">
            <h2 className="text-lg font-bold text-white mb-4">
              🥉 Third Place Match{' '}
              <span className="text-[#d4af37] text-sm font-normal ml-2">
                {STAGE_POINTS['third_place']} pts
              </span>
            </h2>
            <div className="max-w-xs">
              <BracketMatchCard
                match={thirdPlaceMatch}
                prediction={predictions.find((p) => p.match_id === thirdPlaceMatch.id)}
                onPredict={(winnerId) => handlePredict(thirdPlaceMatch.id, winnerId)}
                locked={locked}
                isLoggedIn
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

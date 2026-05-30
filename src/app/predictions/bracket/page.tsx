'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<BracketPrediction[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = (supabaseRef.current ??= createClient())
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
      if (!userId || locked || !supabaseRef.current) return
      const supabase = supabaseRef.current

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
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Caricamento bracket...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-syne font-black text-white">
              Bracket <span className="gradient-text-ai">Knockout</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Scegli il vincitore di ogni match</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {locked && <span className="text-xs text-amber-accent font-semibold">🔒 Bloccato</span>}
            <div className="bg-night-2 rounded-2xl px-4 py-2 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Punti Bracket</p>
              <p className="text-2xl tabular-nums font-bold gradient-text-gold">{computedPoints}</p>
            </div>
            <div className="bg-night-2 rounded-2xl px-4 py-2 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Scelte</p>
              <p className="text-2xl tabular-nums font-bold text-white">{predictions.length}<span className="text-slate-600 text-base">/32</span></p>
            </div>
          </div>
        </div>

        {locked && (
          <div className="bg-amber-accent/10 rounded-2xl px-4 py-3 mb-5 text-amber-accent text-sm flex items-center gap-2">
            🔒 La scadenza è passata. Il tuo bracket è mostrato qui sotto.
          </div>
        )}

        {/* Stage points legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STAGE_CONFIG.map(({ stage, label }) => (
            <div key={stage} className="bg-night-2 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
              <span className="text-slate-500">{label}</span>
              <span className="text-blue-light font-bold">{STAGE_POINTS[stage]}</span>
            </div>
          ))}
        </div>

        {/* Bracket rounds */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGE_CONFIG.map(({ stage, label }) => {
              const stageMatches = matches.filter((m) => m.stage === stage)
              if (stageMatches.length === 0) return null
              return (
                <div key={stage} className="flex flex-col gap-2">
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-blue-light uppercase tracking-wider">{label}</span>
                    <div className="text-xs text-slate-600">{STAGE_POINTS[stage]} pt</div>
                  </div>
                  <div className="flex flex-col gap-3"
                    style={{ justifyContent: 'space-around', height: `${stageMatches.length * 160}px` }}
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
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <h2 className="text-base font-syne font-black text-white mb-4">
              🥉 Terzo Posto
              <span className="text-blue-light text-sm font-normal ml-2">{STAGE_POINTS['third_place']} pt</span>
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

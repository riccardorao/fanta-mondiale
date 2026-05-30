'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isPredictionLocked } from '@/lib/utils'
import MatchCard from '@/components/MatchCard'
import GroupStandings from '@/components/GroupStandings'
import type { Match, Team, GroupPrediction, PredictedOutcome, Group } from '@/types/database'

interface GroupData {
  group: Group
  teams: Team[]
  matches: Match[]
}

export default function PredictionsPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()

  const [groups, setGroups] = useState<GroupData[]>([])
  const [predictions, setPredictions] = useState<GroupPrediction[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [saving, setSaving] = useState(false)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSavesRef = useRef<Map<string, GroupPrediction>>(new Map())

  useEffect(() => {
    const load = async () => {
      const supabase = (supabaseRef.current ??= createClient())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      // Fetch all groups
      const { data: groupsData, error: groupsErr } = await supabase
        .from('groups')
        .select('*')
        .order('name')

      if (groupsErr || !groupsData) {
        setError('Failed to load groups.')
        setLoading(false)
        return
      }

      // Fetch all teams with groups
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('name')

      // Fetch all group matches with joined teams and groups
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(*),
          away_team:away_team_id(*),
          group:group_id(*)
        `)
        .eq('stage', 'group')
        .order('match_number')

      // Fetch user's predictions
      const { data: predsData } = await supabase
        .from('group_predictions')
        .select('*')
        .eq('user_id', user.id)

      // Assemble group data
      const groupDataList: GroupData[] = groupsData.map((g) => ({
        group: g,
        teams: (teamsData || []).filter((t: Team) => t.group_id === g.id),
        matches: (matchesData || []).filter((m: any) => m.group_id === g.id) as Match[],
      }))

      setGroups(groupDataList)
      setPredictions(predsData as GroupPrediction[] || [])

      if (groupDataList.length > 0) {
        setActiveGroupId(groupDataList[0].group.id)
      }

      // Check if predictions are locked (use first match as reference)
      const firstMatch = matchesData?.[0]
      if (firstMatch) {
        setLocked(isPredictionLocked(firstMatch.scheduled_at))
      }

      setLoading(false)
    }

    load()
  }, [])

  const flushSaves = useCallback(async () => {
    if (pendingSavesRef.current.size === 0) return
    if (!userId || !supabaseRef.current) return

    const supabase = supabaseRef.current
    setSaving(true)
    const toSave = Array.from(pendingSavesRef.current.values())
    pendingSavesRef.current.clear()

    try {
      const { error } = await supabase
        .from('group_predictions')
        .upsert(toSave, { onConflict: 'user_id,match_id' })

      if (error) {
        toast.error('Failed to save predictions')
      } else {
        toast.success('Predictions saved!', { id: 'pred-save' })
      }
    } catch {
      toast.error('Failed to save predictions')
    } finally {
      setSaving(false)
    }
  }, [userId])

  const handlePredict = useCallback(
    (
      matchId: string,
      outcome: PredictedOutcome,
      homeScore?: number,
      awayScore?: number
    ) => {
      if (!userId || locked) return

      const predObj: GroupPrediction = {
        id: crypto.randomUUID(),
        user_id: userId,
        match_id: matchId,
        predicted_outcome: outcome,
        predicted_home_score: homeScore ?? null,
        predicted_away_score: awayScore ?? null,
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

      // Queue debounced save
      pendingSavesRef.current.set(matchId, predObj)

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        flushSaves()
      }, 1200)
    },
    [userId, locked, flushSaves]
  )

  const activeGroup = groups.find((g) => g.group.id === activeGroupId)

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Caricamento pronostici...</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-syne font-black text-white">
              Pronostici <span className="gradient-text-ai">Gironi</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Pronostica tutte le 72 partite</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 border border-blue-light border-t-transparent rounded-full animate-spin" />
                Salvataggio...
              </div>
            )}
            <span className="text-sm text-slate-500 tabular-nums">{predictions.length}/72</span>
            {locked && <span className="text-xs text-amber-accent font-semibold">🔒 Bloccato</span>}
          </div>
        </div>

        {locked && (
          <div className="bg-amber-accent/10 rounded-2xl px-4 py-3 mb-5 text-amber-accent text-sm flex items-center gap-2">
            🔒 La scadenza è passata. I tuoi pronostici salvati sono mostrati qui sotto.
          </div>
        )}

        {/* Group tabs */}
        <div className="overflow-x-auto mb-5 -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-1">
            {groups.map((g) => {
              const myPreds = predictions.filter((p) =>
                g.matches.some((m) => m.id === p.match_id)
              ).length
              const isActive = g.group.id === activeGroupId
              return (
                <button
                  key={g.group.id}
                  onClick={() => setActiveGroupId(g.group.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-primary text-white shadow-blue-sm'
                      : 'bg-night-2 text-slate-400 hover:bg-night-3 hover:text-white'
                  }`}
                >
                  Gruppo {g.group.name}
                  {myPreds > 0 && (
                    <span className={`ml-1.5 text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-blue-light'}`}>
                      {myPreds}/{g.matches.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active group content */}
        {activeGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Standings - sticky on desktop */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="glass rounded-2xl p-4 lg:sticky lg:top-20">
                <GroupStandings
                  teams={activeGroup.teams}
                  matches={activeGroup.matches}
                  groupName={activeGroup.group.name}
                  predictions={predictions.filter((p) =>
                    activeGroup.matches.some((m) => m.id === p.match_id)
                  )}
                />
              </div>
            </div>

            {/* Matches */}
            <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col gap-3">
              {activeGroup.matches.map((match) => {
                const pred = predictions.find((p) => p.match_id === match.id)
                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={pred}
                    onPredict={(outcome, hs, as_) => handlePredict(match.id, outcome, hs, as_)}
                    locked={locked}
                    showPrediction
                    isLoggedIn
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

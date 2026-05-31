'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { isPredictionLocked } from '@/lib/utils'
import { useLang } from '@/contexts/LanguageContext'
import BracketMatchCard from '@/components/BracketMatchCard'
import BonusPredictions from '@/components/BonusPredictions'
import ShareButtons from '@/components/ShareButtons'
import BuyMeACoffee from '@/components/BuyMeACoffee'
import {
  buildBracketFromPredictions,
  type GroupInput,
} from '@/lib/bracket'
import type { Match, Team, Group, GroupPrediction, BracketPrediction, Stage } from '@/types/database'

const STAGE_CONFIG: { stage: Stage; label: string }[] = [
  { stage: 'r32', label: 'Round of 32' },
  { stage: 'r16', label: 'Ottavi' },
  { stage: 'qf', label: 'Quarti' },
  { stage: 'sf', label: 'Semifinali' },
  { stage: 'final', label: 'Finale' },
]

// Points awarded for a correctly-placed pick at each stage (see lib/scoring.ts).
const STAGE_POINTS: Record<Stage, number> = {
  group: 0, r32: 10, r16: 15, qf: 25, sf: 40, third_place: 40, final: 70,
}

const TOTAL_KO_MATCHES = 32

export default function BracketPredictionsPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()
  const { t } = useLang()

  const [koMatches, setKoMatches] = useState<Match[]>([])
  const [groups, setGroups] = useState<GroupInput[]>([])
  const [teamMap, setTeamMap] = useState<Map<string, Team>>(new Map())
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([])
  const [winnersByMatch, setWinnersByMatch] = useState<Record<number, string>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // match_number <-> match_id maps for the knockout shells
  const idByNumber = useMemo(() => {
    const m = new Map<number, string>()
    koMatches.forEach((k) => m.set(k.match_number, k.id))
    return m
  }, [koMatches])

  useEffect(() => {
    const load = async () => {
      const supabase = (supabaseRef.current ??= createClient())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)

      const [groupsRes, teamsRes, matchesRes, groupPredsRes, bracketPredsRes] = await Promise.all([
        supabase.from('groups').select('*').order('name'),
        supabase.from('teams').select('*'),
        supabase
          .from('matches')
          .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
          .order('match_number'),
        supabase.from('group_predictions').select('*').eq('user_id', user.id),
        supabase.from('bracket_predictions').select('*').eq('user_id', user.id),
      ])

      if (matchesRes.error || groupsRes.error) {
        setError('Failed to load bracket.')
        setLoading(false)
        return
      }

      const allMatches = (matchesRes.data as Match[]) ?? []
      const teams = (teamsRes.data as Team[]) ?? []
      const tMap = new Map(teams.map((t) => [t.id, t]))

      const groupList: GroupInput[] = ((groupsRes.data as Group[]) ?? []).map((g) => ({
        name: g.name,
        teams: teams.filter((tm) => tm.group_id === g.id),
        matches: allMatches.filter((m) => m.stage === 'group' && m.group_id === g.id),
      }))

      const ko = allMatches.filter((m) => m.stage !== 'group')

      // Seed chosen winners from any existing knockout predictions
      const numberById = new Map(ko.map((k) => [k.id, k.match_number]))
      const winners: Record<number, string> = {}
      for (const p of (bracketPredsRes.data as BracketPrediction[]) ?? []) {
        const num = numberById.get(p.match_id)
        if (num != null) winners[num] = p.predicted_winner_id
      }

      setTeamMap(tMap)
      setGroups(groupList)
      setKoMatches(ko)
      setGroupPredictions((groupPredsRes.data as GroupPrediction[]) ?? [])
      setWinnersByMatch(winners)

      const firstGroupMatch = allMatches.find((m) => m.stage === 'group')
      if (firstGroupMatch) setLocked(isPredictionLocked(firstGroupMatch.scheduled_at))

      setLoading(false)
    }
    load()
  }, [router])

  // Derive every knockout match's participants from group predictions + picks.
  const { participants } = useMemo(
    () => buildBracketFromPredictions(groups, groupPredictions, winnersByMatch),
    [groups, groupPredictions, winnersByMatch]
  )

  // Drop any pick whose team is no longer a participant of its match (because an
  // upstream group prediction or earlier pick changed). Keeps the bracket valid.
  useEffect(() => {
    const stale = Object.entries(winnersByMatch).filter(([num, teamId]) => {
      const p = participants[Number(num)]
      return !p || (teamId !== p.home && teamId !== p.away)
    })
    if (stale.length === 0) return

    setWinnersByMatch((prev) => {
      const next = { ...prev }
      stale.forEach(([num]) => delete next[Number(num)])
      return next
    })
    const supabase = supabaseRef.current
    if (supabase && userId) {
      const ids = stale.map(([num]) => idByNumber.get(Number(num))).filter(Boolean) as string[]
      if (ids.length > 0) {
        supabase.from('bracket_predictions').delete().eq('user_id', userId).in('match_id', ids).then(() => {})
      }
    }
  }, [participants, winnersByMatch, idByNumber, userId])

  const handlePredict = useCallback(
    async (match: Match, winnerId: string) => {
      if (!userId || locked || !supabaseRef.current) return
      const supabase = supabaseRef.current
      const num = match.match_number

      setWinnersByMatch((prev) => ({ ...prev, [num]: winnerId }))

      const { error: upErr } = await supabase
        .from('bracket_predictions')
        .upsert(
          {
            user_id: userId,
            match_id: match.id,
            predicted_winner_id: winnerId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,match_id' }
        )
      if (upErr) {
        toast.error('Errore nel salvataggio')
        setWinnersByMatch((prev) => {
          const next = { ...prev }
          delete next[num]
          return next
        })
      } else {
        toast.success('Salvato!', { id: `bp-${match.id}` })
      }
    },
    [userId, locked]
  )

  // Synthesize a Match with resolved participants for the card to render.
  const synthMatch = useCallback(
    (shell: Match): Match => {
      const p = participants[shell.match_number] ?? { home: null, away: null }
      return {
        ...shell,
        home_team_id: p.home,
        away_team_id: p.away,
        home_team: p.home ? teamMap.get(p.home) : undefined,
        away_team: p.away ? teamMap.get(p.away) : undefined,
      }
    },
    [participants, teamMap]
  )

  const picksMade = useMemo(
    () =>
      Object.entries(winnersByMatch).filter(([num, teamId]) => {
        const p = participants[Number(num)]
        return p && (teamId === p.home || teamId === p.away)
      }).length,
    [winnersByMatch, participants]
  )

  const thirdPlaceShell = koMatches.find((m) => m.stage === 'third_place')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-ink-soft text-sm">{t.loading_label}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  const renderCard = (shell: Match, compact: boolean) => {
    const synth = synthMatch(shell)
    return (
      <BracketMatchCard
        key={`${shell.id}:${synth.home_team_id ?? '_'}:${synth.away_team_id ?? '_'}`}
        match={synth}
        prediction={
          winnersByMatch[shell.match_number]
            ? ({ predicted_winner_id: winnersByMatch[shell.match_number] } as BracketPrediction)
            : undefined
        }
        onPredict={(winnerId) => handlePredict(shell, winnerId)}
        locked={locked}
        isLoggedIn
        compact={compact}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-syne font-black text-ink">
              Bracket <span className="gradient-text-ai">Knockout</span>
            </h1>
            <p className="text-ink-muted text-sm mt-1">{t.pred_bracket_subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {locked && <span className="text-xs text-amber-accent font-semibold">{t.pred_locked}</span>}
            <div className="glass rounded-2xl px-4 py-2 text-center">
              <p className="text-xs text-ink-muted uppercase tracking-wide">{t.pred_picks_made}</p>
              <p className="text-2xl tabular-nums font-bold text-ink">
                {picksMade}<span className="text-ink-muted text-base">/{TOTAL_KO_MATCHES}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Auto-build hint */}
        <div className="bg-blue-dim rounded-2xl px-4 py-3 mb-5 text-blue-light text-sm flex items-start gap-2">
          <span className="flex-shrink-0">✨</span>
          <span>{t.pred_bracket_hint}</span>
        </div>

        {locked && (
          <div className="bg-amber-accent/10 rounded-2xl px-4 py-3 mb-5 text-amber-accent text-sm flex items-center gap-2">
            {t.pred_locked_msg}
          </div>
        )}

        {/* Bonus predictions: top goalscorer + final standings */}
        <BonusPredictions locked={locked} />

        {/* Stage points legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STAGE_CONFIG.map(({ stage, label }) => (
            <div key={stage} className="glass rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
              <span className="text-ink-soft">{label}</span>
              <span className="text-blue-light font-bold tabular-nums">{STAGE_POINTS[stage]}</span>
            </div>
          ))}
        </div>

        {/* Bracket rounds */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGE_CONFIG.map(({ stage, label }) => {
              const stageMatches = koMatches.filter((m) => m.stage === stage)
              if (stageMatches.length === 0) return null
              return (
                <div key={stage} className="flex flex-col gap-2">
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold text-blue-light uppercase tracking-wider">{label}</span>
                    <div className="text-xs text-ink-muted tabular-nums">{STAGE_POINTS[stage]} pt</div>
                  </div>
                  <div
                    className="flex flex-col gap-3"
                    style={{ justifyContent: 'space-around', height: `${stageMatches.length * 160}px` }}
                  >
                    {stageMatches.map((shell) => renderCard(shell, true))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Third place match */}
        {thirdPlaceShell && (
          <div className="mt-8 pt-6 border-t border-ink/10">
            <h2 className="text-base font-syne font-black text-ink mb-4">
              🥉 Terzo Posto
              <span className="text-blue-light text-sm font-normal ml-2 tabular-nums">{STAGE_POINTS['third_place']} pt</span>
            </h2>
            <div className="max-w-xs">{renderCard(thirdPlaceShell, false)}</div>
          </div>
        )}

        {/* Submit → reveal share + support */}
        <div className="mt-10 pt-8 border-t border-ink/10">
          {!submitted ? (
            <div className="text-center">
              <button
                onClick={() => setSubmitted(true)}
                disabled={picksMade === 0 || locked}
                className="inline-flex items-center justify-center gap-2 bg-blue-primary text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-hover transition-all shadow-blue-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.bracket_submit}
              </button>
              <p className="text-ink-muted text-sm mt-3">{t.bracket_submit_hint}</p>
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-syne font-black text-ink mb-2">{t.share_title}</h2>
              <p className="text-ink-soft text-base mb-6">{t.share_desc}</p>
              <ShareButtons />
              <div className="mt-8 pt-6 border-t border-ink/10">
                <p className="text-ink-soft text-base mb-4">{t.coffee_desc}</p>
                <BuyMeACoffee />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

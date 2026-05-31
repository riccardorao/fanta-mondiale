'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Match, Stage, MatchStatus } from '@/types/database'

const STAGE_TABS: { stage: Stage | 'all'; label: string }[] = [
  { stage: 'all', label: 'All' },
  { stage: 'group', label: 'Group Stage' },
  { stage: 'r32', label: 'Round of 32' },
  { stage: 'r16', label: 'Round of 16' },
  { stage: 'qf', label: 'Quarter-Finals' },
  { stage: 'sf', label: 'Semi-Finals' },
  { stage: 'third_place', label: 'Third Place' },
  { stage: 'final', label: 'Final' },
]

interface MatchForm {
  matchId: string
  homeScore: string
  awayScore: string
  homePenalties: string
  awayPenalties: string
  winnerId: string
  status: MatchStatus
}

function getAutoWinner(match: Match, homeScore: number, awayScore: number): string {
  if (match.stage === 'group') return ''
  if (homeScore > awayScore) return match.home_team_id ?? ''
  if (awayScore > homeScore) return match.away_team_id ?? ''
  return ''
}

export default function AdminResultsPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>([])
  const [forms, setForms] = useState<Record<string, MatchForm>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<Stage | 'all'>('group')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = (supabaseRef.current ??= createClient())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) { router.push('/dashboard'); return }

      const { data: matchesData, error: matchErr } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(*),
          away_team:away_team_id(*),
          winner:winner_id(*),
          group:group_id(*)
        `)
        .order('match_number')

      if (matchErr || !matchesData) {
        setError('Failed to load matches.')
        setLoading(false)
        return
      }

      setMatches(matchesData as Match[])

      const initForms: Record<string, MatchForm> = {}
      for (const m of matchesData as Match[]) {
        initForms[m.id] = {
          matchId: m.id,
          homeScore: m.home_score?.toString() ?? '',
          awayScore: m.away_score?.toString() ?? '',
          homePenalties: m.home_penalties?.toString() ?? '',
          awayPenalties: m.away_penalties?.toString() ?? '',
          winnerId: m.winner_id ?? '',
          status: m.status,
        }
      }
      setForms(initForms)
      setLoading(false)
    }
    load()
  }, [router])

  const updateForm = useCallback(
    (matchId: string, field: keyof MatchForm, value: string) => {
      setForms((prev) => {
        const current = prev[matchId]
        if (!current) return prev

        const updated = { ...current, [field]: value }

        // Auto-compute winner for knockout matches when scores change
        const match = matches.find((m) => m.id === matchId)
        if (match && match.stage !== 'group') {
          if (field === 'homeScore' || field === 'awayScore') {
            const hs = parseInt(field === 'homeScore' ? value : updated.homeScore) || 0
            const as_ = parseInt(field === 'awayScore' ? value : updated.awayScore) || 0
            if (!isNaN(hs) && !isNaN(as_) && hs !== as_) {
              updated.winnerId = getAutoWinner(match, hs, as_)
            }
          }
        }

        return { ...prev, [matchId]: updated }
      })
    },
    [matches]
  )

  const handleSave = async (matchId: string) => {
    const form = forms[matchId]
    if (!form || !supabaseRef.current) return
    const supabase = supabaseRef.current

    setSavingId(matchId)
    try {
      const body: Record<string, unknown> = {
        matchId,
        homeScore: form.homeScore !== '' ? parseInt(form.homeScore) : null,
        awayScore: form.awayScore !== '' ? parseInt(form.awayScore) : null,
        homePenalties: form.homePenalties !== '' ? parseInt(form.homePenalties) : null,
        awayPenalties: form.awayPenalties !== '' ? parseInt(form.awayPenalties) : null,
        winnerId: form.winnerId || null,
        status: form.status,
      }

      const res = await fetch('/api/admin/update-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save result')
      } else {
        toast.success('Result saved & scores recomputed!')
        // Refresh local match data
        const { data: updated } = await supabase
          .from('matches')
          .select(`*, home_team:home_team_id(*), away_team:away_team_id(*), winner:winner_id(*), group:group_id(*)`)
          .eq('id', matchId)
          .single()
        if (updated) {
          setMatches((prev) => prev.map((m) => (m.id === matchId ? (updated as Match) : m)))
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  const filteredMatches =
    activeStage === 'all'
      ? matches
      : matches.filter((m) => m.stage === activeStage)

  if (loading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-ink-soft text-sm">Caricamento partite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <a href="/admin" className="text-sm text-ink-muted hover:text-blue-light transition-colors">
            ← Admin
          </a>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-syne font-black text-ink">
            Risultati <span className="gradient-text-ai">Partite</span>
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Salva un risultato per ricalcolare automaticamente i punteggi.
          </p>
        </div>

        {/* Stage tabs */}
        <div className="overflow-x-auto mb-6 -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-1">
            {STAGE_TABS.map(({ stage, label }) => {
              const isActive = activeStage === stage
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-primary text-white shadow-blue-sm'
                      : 'bg-night-2 text-ink-soft hover:bg-night-3 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Match forms */}
        <div className="flex flex-col gap-4">
          {filteredMatches.map((match) => {
            const form = forms[match.id]
            if (!form) return null
            const isSaving = savingId === match.id
            const isKnockout = match.stage !== 'group'

            return (
              <div key={match.id} className="glass rounded-2xl p-4">
                {/* Match header */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs text-ink-muted font-medium tabular-nums">#{match.match_number}</span>
                  <span className="text-xs bg-blue-dim text-blue-light rounded-full px-2 py-0.5 font-semibold">
                    {match.stage.toUpperCase()}
                  </span>
                  {match.group && (
                    <span className="text-xs text-amber-accent font-medium">Gruppo {match.group.name}</span>
                  )}
                  {match.scheduled_at && (
                    <span className="text-xs text-ink-muted ml-auto">
                      {new Date(match.scheduled_at).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  {/* Home team + score */}
                  <div>
                    <label className="block text-xs text-ink-muted mb-1.5 font-medium">
                      {match.home_team
                        ? `${match.home_team.flag_emoji} ${match.home_team.name}`
                        : 'Casa'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={form.homeScore}
                      onChange={(e) => updateForm(match.id, 'homeScore', e.target.value)}
                      placeholder="—"
                      className="w-full bg-night-1 rounded-xl px-3 py-2 text-ink text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-primary/50 tabular-nums"
                    />
                  </div>

                  {/* Away team + score */}
                  <div>
                    <label className="block text-xs text-ink-muted mb-1.5 font-medium">
                      {match.away_team
                        ? `${match.away_team.flag_emoji} ${match.away_team.name}`
                        : 'Ospite'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={form.awayScore}
                      onChange={(e) => updateForm(match.id, 'awayScore', e.target.value)}
                      placeholder="—"
                      className="w-full bg-night-1 rounded-xl px-3 py-2 text-ink text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-primary/50 tabular-nums"
                    />
                  </div>

                  {/* Knockout: penalties + winner */}
                  {isKnockout ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-ink-muted font-medium">Rigori (se pari)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={form.homePenalties}
                          onChange={(e) => updateForm(match.id, 'homePenalties', e.target.value)}
                          placeholder="C"
                          className="flex-1 bg-night-1 rounded-xl px-2 py-1.5 text-ink text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/50 tabular-nums"
                        />
                        <span className="text-ink-muted text-sm">–</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={form.awayPenalties}
                          onChange={(e) => updateForm(match.id, 'awayPenalties', e.target.value)}
                          placeholder="O"
                          className="flex-1 bg-night-1 rounded-xl px-2 py-1.5 text-ink text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/50 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-ink-muted font-medium block mb-1">Vincitore</label>
                        <select
                          value={form.winnerId}
                          onChange={(e) => updateForm(match.id, 'winnerId', e.target.value)}
                          className="w-full bg-night-1 rounded-xl px-3 py-1.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/50"
                        >
                          <option value="">— Seleziona vincitore —</option>
                          {match.home_team && (
                            <option value={match.home_team_id ?? ''}>
                              {match.home_team.flag_emoji} {match.home_team.name}
                            </option>
                          )}
                          {match.away_team && (
                            <option value={match.away_team_id ?? ''}>
                              {match.away_team.flag_emoji} {match.away_team.name}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Status + save */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-ink-muted font-medium">Stato</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateForm(match.id, 'status', e.target.value as MatchStatus)}
                      className="w-full bg-night-1 rounded-xl px-3 py-1.5 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-blue-primary/50"
                    >
                      <option value="upcoming">In programma</option>
                      <option value="live">In corso</option>
                      <option value="completed">Terminata</option>
                    </select>

                    <button
                      onClick={() => handleSave(match.id)}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 bg-blue-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-hover shadow-blue-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed text-sm active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        'Salva Risultato'
                      )}
                    </button>
                  </div>
                </div>

                {/* Current stored result */}
                {match.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-ink/10 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-ink-muted">Salvato:</span>
                    <span className="text-ink font-semibold tabular-nums">
                      {match.home_team?.code ?? 'Casa'} {match.home_score} – {match.away_score}{' '}
                      {match.away_team?.code ?? 'Ospite'}
                    </span>
                    {match.winner && (
                      <>
                        <span className="text-ink-muted">·</span>
                        <span className="text-emerald-600">
                          Vincitore: {match.winner.flag_emoji} {match.winner.name}
                        </span>
                      </>
                    )}
                    {match.home_penalties !== null && (
                      <span className="text-ink-muted">
                        (rig. {match.home_penalties}–{match.away_penalties})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted">Nessuna partita trovata per questa fase.</p>
          </div>
        )}
      </div>
    </div>
  )
}

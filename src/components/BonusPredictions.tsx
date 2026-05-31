'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/contexts/LanguageContext'
import type { Team } from '@/types/database'

interface BonusPredictionsProps {
  locked?: boolean
}

type Position = 'first' | 'second' | 'third' | 'fourth'
const POSITIONS: { key: Position; pts: number }[] = [
  { key: 'first', pts: 100 },
  { key: 'second', pts: 85 },
  { key: 'third', pts: 65 },
  { key: 'fourth', pts: 50 },
]

export default function BonusPredictions({ locked = false }: BonusPredictionsProps) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const { t } = useLang()

  const [userId, setUserId] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [goalscorer, setGoalscorer] = useState('')
  const [standings, setStandings] = useState<Record<Position, string>>({
    first: '', second: '', third: '', fourth: '',
  })
  const [savingGs, setSavingGs] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = (supabaseRef.current ??= createClient())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: teamsData } = await supabase.from('teams').select('*').order('name')
      setTeams((teamsData as Team[]) ?? [])

      const { data: gs } = await supabase
        .from('goalscorer_predictions')
        .select('player_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (gs?.player_name) setGoalscorer(gs.player_name)

      const { data: st } = await supabase
        .from('standings_predictions')
        .select('first_team_id, second_team_id, third_team_id, fourth_team_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (st) {
        setStandings({
          first: st.first_team_id ?? '',
          second: st.second_team_id ?? '',
          third: st.third_team_id ?? '',
          fourth: st.fourth_team_id ?? '',
        })
      }
    }
    load().catch(() => {})
  }, [])

  const saveGoalscorer = async () => {
    if (!userId || !supabaseRef.current || locked) return
    setSavingGs(true)
    const { error } = await supabaseRef.current
      .from('goalscorer_predictions')
      .upsert(
        { user_id: userId, player_name: goalscorer.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    setSavingGs(false)
    if (error) toast.error('Errore nel salvataggio')
    else toast.success('Capocannoniere salvato!', { id: 'gs-save' })
  }

  const saveStanding = async (pos: Position, teamId: string) => {
    const next = { ...standings, [pos]: teamId }
    setStandings(next)
    if (!userId || !supabaseRef.current || locked) return
    const { error } = await supabaseRef.current
      .from('standings_predictions')
      .upsert(
        {
          user_id: userId,
          first_team_id: next.first || null,
          second_team_id: next.second || null,
          third_team_id: next.third || null,
          fourth_team_id: next.fourth || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    if (error) toast.error('Errore nel salvataggio')
    else toast.success('Classifica salvata!', { id: 'st-save' })
  }

  if (!userId) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Top goalscorer */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-syne font-black text-ink">⚽ {t.pred_goalscorer_title}</h3>
          <span className="text-xs font-bold text-red-primary tabular-nums">+50 {t.pts}</span>
        </div>
        <p className="text-ink-muted text-xs mb-3">{t.pred_goalscorer_subtitle}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={goalscorer}
            onChange={(e) => setGoalscorer(e.target.value)}
            disabled={locked}
            placeholder={t.pred_goalscorer_placeholder}
            className="flex-1 bg-night-1 rounded-xl px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted focus:outline-none disabled:opacity-60"
          />
          {!locked && (
            <button
              onClick={saveGoalscorer}
              disabled={savingGs || goalscorer.trim() === ''}
              className="bg-blue-primary text-white font-bold px-4 rounded-xl text-sm hover:bg-blue-hover shadow-blue-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {savingGs ? '…' : t.pred_goalscorer_save}
            </button>
          )}
        </div>
      </div>

      {/* Final standings top 4 */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-syne font-black text-ink">🏆 {t.pred_standings_title}</h3>
          <span className="text-xs font-bold text-emerald-600 tabular-nums">+100/85/65/50</span>
        </div>
        <p className="text-ink-muted text-xs mb-3">{t.pred_standings_subtitle}</p>
        <div className="flex flex-col gap-2">
          {POSITIONS.map(({ key, pts }, idx) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-night-1 text-blue-light text-xs font-bold flex-shrink-0 tabular-nums">
                {idx + 1}
              </span>
              <select
                value={standings[key]}
                onChange={(e) => saveStanding(key, e.target.value)}
                disabled={locked}
                className="flex-1 bg-night-1 rounded-xl px-3 py-2 text-ink text-sm focus:outline-none disabled:opacity-60"
              >
                <option value="">—</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.flag_emoji} {team.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ink-muted tabular-nums w-8 text-right flex-shrink-0">+{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

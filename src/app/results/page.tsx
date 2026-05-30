export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ResultsView, { type MatchStat } from '@/components/results/ResultsView'
import type { Match, GroupPrediction, BracketPrediction } from '@/types/database'

export default async function ResultsPage() {
  const supabase = createClient()

  const [matchesRes, groupPredsRes, bracketPredsRes] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*),
        group:group_id(*)
      `)
      .in('status', ['completed', 'live'])
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('group_predictions')
      .select('match_id, predicted_outcome, predicted_home_score, predicted_away_score'),
    supabase
      .from('bracket_predictions')
      .select('match_id, predicted_winner_id'),
  ])

  const matches = (matchesRes.data as Match[]) ?? []
  const groupPreds = (groupPredsRes.data as Pick<
    GroupPrediction,
    'match_id' | 'predicted_outcome' | 'predicted_home_score' | 'predicted_away_score'
  >[]) ?? []
  const bracketPreds = (bracketPredsRes.data as Pick<
    BracketPrediction,
    'match_id' | 'predicted_winner_id'
  >[]) ?? []

  // Index predictions by match for O(1) aggregation
  const groupByMatch = new Map<string, typeof groupPreds>()
  for (const p of groupPreds) {
    const arr = groupByMatch.get(p.match_id) ?? []
    arr.push(p)
    groupByMatch.set(p.match_id, arr)
  }
  const bracketByMatch = new Map<string, typeof bracketPreds>()
  for (const p of bracketPreds) {
    const arr = bracketByMatch.get(p.match_id) ?? []
    arr.push(p)
    bracketByMatch.set(p.match_id, arr)
  }

  const stats: MatchStat[] = matches.map((m) => {
    const isGroup = m.stage === 'group'
    const completed = m.status === 'completed'
    const actualOutcome =
      m.home_score != null && m.away_score != null
        ? m.home_score > m.away_score
          ? '1'
          : m.home_score === m.away_score
          ? 'X'
          : '2'
        : null

    let totalPreds = 0
    let correctCount = 0
    let exactHits = 0
    let distA = 0 // group: '1' (home win) / ko: home pick
    let distB = 0 // group: 'X' (draw)     / ko: unused
    let distC = 0 // group: '2' (away win) / ko: away pick

    if (isGroup) {
      const preds = groupByMatch.get(m.id) ?? []
      totalPreds = preds.length
      for (const p of preds) {
        if (p.predicted_outcome === '1') distA++
        else if (p.predicted_outcome === 'X') distB++
        else distC++
        if (completed && actualOutcome && p.predicted_outcome === actualOutcome) {
          correctCount++
          if (
            p.predicted_home_score === m.home_score &&
            p.predicted_away_score === m.away_score
          ) {
            exactHits++
          }
        }
      }
    } else {
      const preds = bracketByMatch.get(m.id) ?? []
      totalPreds = preds.length
      for (const p of preds) {
        if (p.predicted_winner_id === m.home_team_id) distA++
        else if (p.predicted_winner_id === m.away_team_id) distC++
        if (completed && m.winner_id && p.predicted_winner_id === m.winner_id) {
          correctCount++
        }
      }
    }

    return {
      id: m.id,
      stage: m.stage,
      status: m.status,
      matchNumber: m.match_number,
      scheduledAt: m.scheduled_at,
      groupName: m.group?.name ?? null,
      home: m.home_team
        ? { code: m.home_team.code, name: m.home_team.name, flag: m.home_team.flag_emoji, id: m.home_team.id }
        : null,
      away: m.away_team
        ? { code: m.away_team.code, name: m.away_team.name, flag: m.away_team.flag_emoji, id: m.away_team.id }
        : null,
      homeScore: m.home_score,
      awayScore: m.away_score,
      homePenalties: m.home_penalties,
      awayPenalties: m.away_penalties,
      winnerId: m.winner_id,
      isGroup,
      totalPreds,
      correctCount,
      exactHits,
      dist: { a: distA, b: distB, c: distC },
    }
  })

  return <ResultsView stats={stats} />
}

import type { Match, GroupPrediction, BracketPrediction } from '@/types/database'

export const POINTS = {
  GROUP_OUTCOME: 3,
  GROUP_EXACT_BONUS: 2,
  R32_WINNER: 5,
  R16_WINNER: 7,
  QF_WINNER: 10,
  SF_WINNER: 12,
  THIRD_PLACE_WINNER: 8,
  FINAL_WINNER: 20,
} as const

export function getStagePoints(stage: string): number {
  switch (stage) {
    case 'r32': return POINTS.R32_WINNER
    case 'r16': return POINTS.R16_WINNER
    case 'qf': return POINTS.QF_WINNER
    case 'sf': return POINTS.SF_WINNER
    case 'third_place': return POINTS.THIRD_PLACE_WINNER
    case 'final': return POINTS.FINAL_WINNER
    default: return 0
  }
}

export function scoreGroupPrediction(prediction: GroupPrediction, match: Match): number {
  if (match.status !== 'completed') return 0
  if (match.home_score === null || match.away_score === null) return 0

  const actual = match.home_score > match.away_score ? '1' : match.home_score === match.away_score ? 'X' : '2'
  let pts = 0

  if (prediction.predicted_outcome === actual) {
    pts += POINTS.GROUP_OUTCOME
    if (
      prediction.predicted_home_score === match.home_score &&
      prediction.predicted_away_score === match.away_score
    ) {
      pts += POINTS.GROUP_EXACT_BONUS
    }
  }
  return pts
}

export function scoreBracketPrediction(prediction: BracketPrediction, match: Match): number {
  if (match.status !== 'completed' || !match.winner_id) return 0
  if (prediction.predicted_winner_id === match.winner_id) {
    return getStagePoints(match.stage)
  }
  return 0
}

export interface UserScore {
  total: number
  group_stage: number
  r32: number
  r16: number
  qf: number
  sf: number
  final: number
  exact_bonus: number
}

export function computeUserScore(
  groupPredictions: GroupPrediction[],
  bracketPredictions: BracketPrediction[],
  matches: Match[]
): UserScore {
  const matchMap = new Map(matches.map(m => [m.id, m]))
  let group_stage = 0, exact_bonus = 0
  let r32 = 0, r16 = 0, qf = 0, sf = 0, final_pts = 0

  for (const pred of groupPredictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.status !== 'completed') continue
    const actual = match.home_score! > match.away_score! ? '1' : match.home_score === match.away_score ? 'X' : '2'
    if (pred.predicted_outcome === actual) {
      group_stage += POINTS.GROUP_OUTCOME
      if (pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score) {
        exact_bonus += POINTS.GROUP_EXACT_BONUS
      }
    }
  }

  for (const pred of bracketPredictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.status !== 'completed' || !match.winner_id) continue
    if (pred.predicted_winner_id !== match.winner_id) continue
    const pts = getStagePoints(match.stage)
    switch (match.stage) {
      case 'r32': r32 += pts; break
      case 'r16': r16 += pts; break
      case 'qf': qf += pts; break
      case 'sf': sf += pts; break
      case 'third_place': sf += pts; break
      case 'final': final_pts += pts; break
    }
  }

  return {
    total: group_stage + exact_bonus + r32 + r16 + qf + sf + final_pts,
    group_stage, r32, r16, qf, sf, final: final_pts, exact_bonus
  }
}

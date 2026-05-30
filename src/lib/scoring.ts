import type { Match, GroupPrediction, BracketPrediction } from '@/types/database'

export const POINTS = {
  // Group stage
  GROUP_OUTCOME: 10,         // correct 1/X/2
  GROUP_EXACT_SCORE: 5,      // exact score bonus
  GROUP_POSITION: 15,        // correct team final group standing

  // Knockout — correct: team you predicted wins this round
  // wrong_pos: team you predicted IS in this round but loses
  R32_CORRECT: 10,
  R32_WRONG_POS: 5,
  R16_CORRECT: 15,
  R16_WRONG_POS: 10,
  QF_CORRECT: 25,
  QF_WRONG_POS: 15,
  SF_CORRECT: 40,
  SF_WRONG_POS: 25,
  FINAL_CORRECT: 70,         // correctly predicted champion
  FINAL_WRONG_POS: 40,       // predicted finalist but wrong winner

  // Final standings (predict top 4 teams in order)
  STANDING_1ST: 100,
  STANDING_2ND: 85,
  STANDING_3RD: 65,
  STANDING_4TH: 50,

  // Top goalscorer
  GOALSCORER: 50,
} as const

export function getStagePoints(stage: string): { correct: number; wrongPos: number } {
  switch (stage) {
    case 'r32':         return { correct: POINTS.R32_CORRECT,   wrongPos: POINTS.R32_WRONG_POS }
    case 'r16':         return { correct: POINTS.R16_CORRECT,   wrongPos: POINTS.R16_WRONG_POS }
    case 'qf':          return { correct: POINTS.QF_CORRECT,    wrongPos: POINTS.QF_WRONG_POS }
    case 'sf':          return { correct: POINTS.SF_CORRECT,    wrongPos: POINTS.SF_WRONG_POS }
    case 'third_place': return { correct: POINTS.SF_CORRECT,    wrongPos: POINTS.SF_WRONG_POS }
    case 'final':       return { correct: POINTS.FINAL_CORRECT, wrongPos: POINTS.FINAL_WRONG_POS }
    default:            return { correct: 0, wrongPos: 0 }
  }
}

export function scoreGroupPrediction(prediction: GroupPrediction, match: Match): number {
  if (match.status !== 'completed') return 0
  if (match.home_score === null || match.away_score === null) return 0

  const actual = match.home_score > match.away_score ? '1' : match.home_score === match.away_score ? 'X' : '2'
  if (prediction.predicted_outcome !== actual) return 0

  let pts = POINTS.GROUP_OUTCOME
  if (
    prediction.predicted_home_score === match.home_score &&
    prediction.predicted_away_score === match.away_score
  ) {
    pts += POINTS.GROUP_EXACT_SCORE
  }
  return pts
}

export function scoreBracketPrediction(prediction: BracketPrediction, match: Match): number {
  if (match.status !== 'completed' || !match.winner_id) return 0

  const { correct, wrongPos } = getStagePoints(match.stage)

  if (prediction.predicted_winner_id === match.winner_id) {
    return correct
  }

  // "Wrong position": team the user predicted IS in this match but loses
  const predictedTeamInMatch =
    prediction.predicted_winner_id === match.home_team_id ||
    prediction.predicted_winner_id === match.away_team_id

  return predictedTeamInMatch ? wrongPos : 0
}

export interface UserScore {
  total: number
  group_stage: number
  exact_score_bonus: number
  r32_points: number
  r16_points: number
  qf_points: number
  sf_points: number
  final_points: number
}

export function computeUserScore(
  groupPredictions: GroupPrediction[],
  bracketPredictions: BracketPrediction[],
  matches: Match[]
): UserScore {
  const matchMap = new Map(matches.map(m => [m.id, m]))
  let group_stage = 0, exact_score_bonus = 0
  let r32 = 0, r16 = 0, qf = 0, sf = 0, final_pts = 0

  for (const pred of groupPredictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.status !== 'completed') continue
    if (match.home_score === null || match.away_score === null) continue

    const actual = match.home_score > match.away_score ? '1' : match.home_score === match.away_score ? 'X' : '2'
    if (pred.predicted_outcome === actual) {
      group_stage += POINTS.GROUP_OUTCOME
      if (pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score) {
        exact_score_bonus += POINTS.GROUP_EXACT_SCORE
      }
    }
  }

  for (const pred of bracketPredictions) {
    const match = matchMap.get(pred.match_id)
    if (!match || match.status !== 'completed' || !match.winner_id) continue

    const pts = scoreBracketPrediction(pred, match)
    switch (match.stage) {
      case 'r32':         r32 += pts; break
      case 'r16':         r16 += pts; break
      case 'qf':          qf += pts; break
      case 'sf':          sf += pts; break
      case 'third_place': sf += pts; break
      case 'final':       final_pts += pts; break
    }
  }

  return {
    total: group_stage + exact_score_bonus + r32 + r16 + qf + sf + final_pts,
    group_stage,
    exact_score_bonus,
    r32_points: r32,
    r16_points: r16,
    qf_points: qf,
    sf_points: sf,
    final_points: final_pts,
  }
}

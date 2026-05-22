export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final'
export type MatchStatus = 'upcoming' | 'live' | 'completed'
export type PredictedOutcome = '1' | 'X' | '2'
export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC' | 'Intercon'

export interface Group {
  id: string
  name: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  code: string
  flag_emoji: string
  group_id: string | null
  confederation: Confederation
  created_at: string
}

export interface Match {
  id: string
  stage: Stage
  group_id: string | null
  match_number: number
  home_team_id: string | null
  away_team_id: string | null
  scheduled_at: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  home_penalties: number | null
  away_penalties: number | null
  winner_id: string | null
  status: MatchStatus
  created_at: string
  // joined
  home_team?: Team
  away_team?: Team
  winner?: Team
  group?: Group
}

export interface Profile {
  id: string
  name: string
  surname: string
  email: string
  is_admin: boolean
  created_at: string
}

export interface GroupPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_outcome: PredictedOutcome
  predicted_home_score: number | null
  predicted_away_score: number | null
  created_at: string
  updated_at: string
}

export interface BracketPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_winner_id: string
  created_at: string
  updated_at: string
  predicted_winner?: Team
}

export interface LeaderboardEntry {
  user_id: string
  total_points: number
  group_stage_points: number
  r32_points: number
  r16_points: number
  qf_points: number
  sf_points: number
  final_points: number
  exact_score_bonus: number
  updated_at: string
  profile?: Profile
}

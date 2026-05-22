export const TOURNAMENT_START = '2026-06-11T18:00:00Z'
export const PREDICTIONS_DEADLINE = process.env.NEXT_PUBLIC_PREDICTIONS_DEADLINE || TOURNAMENT_START

export const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-finals',
  sf: 'Semi-finals',
  third_place: 'Third Place',
  final: 'Final',
}

export const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'third_place', 'final']

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

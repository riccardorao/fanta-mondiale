// =============================================================================
// Knockout bracket engine — automates the pairing between the group phase and
// the knockout phase for the 2026 World Cup (48 teams, 12 groups).
//
// Flow it enables:
//   group results/predictions  ->  group standings  ->  qualifiers
//   (12 winners, 12 runners-up, 8 best third-placed)  ->  seeded Round of 32
//   ->  winners propagate automatically through R16 / QF / SF / 3rd / Final.
//
// It is used in two modes with the SAME code path:
//   • predicted: standings come from a user's group-stage predictions and the
//     "winners" come from the user's knockout picks (the prediction builder).
//   • actual: standings come from completed match scores and the "winners" come
//     from the real match.winner_id (the public bracket / results).
//
// FIFA structural rules honoured by the template below:
//   - group winners never meet another group winner in the Round of 32
//   - third-placed teams only ever face group winners (never runners-up/thirds)
//   - no team faces a same-group opponent in the Round of 32
// The 8 best third-placed teams are assigned to the 8 "winner-vs-third" slots by
// a deterministic constraint solver (a team never faces a winner from its own
// group), mirroring the intent of FIFA's Annex C combination table. The slot
// layout lives in R32_TEMPLATE / KO_TREE so the exact official mapping can be
// swapped in without touching any logic.
// =============================================================================

import type { Team, Match, GroupPrediction } from '@/types/database'

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

export interface StandingRow {
  teamId: string
  name: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

type Slot =
  | { t: 'W'; g: string } // group winner
  | { t: 'R'; g: string } // group runner-up
  | { t: 'T' } // best third assigned to this match
  | { t: 'win'; m: number } // winner of an earlier match
  | { t: 'lose'; m: number } // loser of an earlier match (third-place game)

// Round of 32 (matches 73–88). Winner-vs-third matches use { t: 'T' } for the
// away slot; the third team is resolved per-match by the combination solver.
export const R32_TEMPLATE: Record<number, { home: Slot; away: Slot }> = {
  73: { home: { t: 'W', g: 'A' }, away: { t: 'T' } },
  74: { home: { t: 'R', g: 'A' }, away: { t: 'R', g: 'D' } },
  75: { home: { t: 'W', g: 'B' }, away: { t: 'R', g: 'G' } },
  76: { home: { t: 'W', g: 'C' }, away: { t: 'T' } },
  77: { home: { t: 'W', g: 'D' }, away: { t: 'T' } },
  78: { home: { t: 'R', g: 'B' }, away: { t: 'R', g: 'E' } },
  79: { home: { t: 'W', g: 'E' }, away: { t: 'R', g: 'J' } },
  80: { home: { t: 'W', g: 'F' }, away: { t: 'T' } },
  81: { home: { t: 'W', g: 'G' }, away: { t: 'T' } },
  82: { home: { t: 'R', g: 'H' }, away: { t: 'R', g: 'I' } },
  83: { home: { t: 'W', g: 'H' }, away: { t: 'R', g: 'C' } },
  84: { home: { t: 'W', g: 'I' }, away: { t: 'T' } },
  85: { home: { t: 'W', g: 'J' }, away: { t: 'T' } },
  86: { home: { t: 'R', g: 'K' }, away: { t: 'R', g: 'L' } },
  87: { home: { t: 'W', g: 'K' }, away: { t: 'R', g: 'F' } },
  88: { home: { t: 'W', g: 'L' }, away: { t: 'T' } },
}

// The 8 winner-vs-third matches, paired with the group whose winner plays there.
// A third-placed team is never assigned to face the winner of its own group.
const THIRD_SLOTS: { match: number; winnerGroup: string }[] = [
  { match: 73, winnerGroup: 'A' },
  { match: 76, winnerGroup: 'C' },
  { match: 77, winnerGroup: 'D' },
  { match: 80, winnerGroup: 'F' },
  { match: 81, winnerGroup: 'G' },
  { match: 84, winnerGroup: 'I' },
  { match: 85, winnerGroup: 'J' },
  { match: 88, winnerGroup: 'L' },
]

// R16 → Final tree (matches 89–104). 103 is the third-place game (SF losers).
export const KO_TREE: Record<number, { home: Slot; away: Slot }> = {
  89: { home: { t: 'win', m: 73 }, away: { t: 'win', m: 75 } },
  90: { home: { t: 'win', m: 74 }, away: { t: 'win', m: 76 } },
  91: { home: { t: 'win', m: 77 }, away: { t: 'win', m: 79 } },
  92: { home: { t: 'win', m: 78 }, away: { t: 'win', m: 80 } },
  93: { home: { t: 'win', m: 81 }, away: { t: 'win', m: 83 } },
  94: { home: { t: 'win', m: 82 }, away: { t: 'win', m: 84 } },
  95: { home: { t: 'win', m: 85 }, away: { t: 'win', m: 87 } },
  96: { home: { t: 'win', m: 86 }, away: { t: 'win', m: 88 } },
  97: { home: { t: 'win', m: 89 }, away: { t: 'win', m: 90 } },
  98: { home: { t: 'win', m: 91 }, away: { t: 'win', m: 92 } },
  99: { home: { t: 'win', m: 93 }, away: { t: 'win', m: 94 } },
  100: { home: { t: 'win', m: 95 }, away: { t: 'win', m: 96 } },
  101: { home: { t: 'win', m: 97 }, away: { t: 'win', m: 98 } },
  102: { home: { t: 'win', m: 99 }, away: { t: 'win', m: 100 } },
  103: { home: { t: 'lose', m: 101 }, away: { t: 'lose', m: 102 } },
  104: { home: { t: 'win', m: 101 }, away: { t: 'win', m: 102 } },
}

const ALL_KO_MATCHES = [...Object.keys(R32_TEMPLATE), ...Object.keys(KO_TREE)]
  .map(Number)
  .sort((a, b) => a - b)

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

type Score = { hs: number; as: number }

function buildStandings(
  teams: Team[],
  matches: Match[],
  getScore: (m: Match) => Score | null
): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  for (const team of teams) {
    rows.set(team.id, {
      teamId: team.id,
      name: team.name,
      group: '',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    })
  }

  for (const m of matches) {
    if (!m.home_team_id || !m.away_team_id) continue
    const score = getScore(m)
    if (!score) continue
    const home = rows.get(m.home_team_id)
    const away = rows.get(m.away_team_id)
    if (!home || !away) continue

    home.played++; away.played++
    home.gf += score.hs; home.ga += score.as
    away.gf += score.as; away.ga += score.hs

    if (score.hs > score.as) { home.won++; home.points += 3; away.lost++ }
    else if (score.hs === score.as) { home.drawn++; home.points++; away.drawn++; away.points++ }
    else { away.won++; away.points += 3; home.lost++ }
  }

  const result = Array.from(rows.values()).map((r) => ({ ...r, gd: r.gf - r.ga }))
  result.sort(compareStanding)
  return result
}

function compareStanding(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.gd !== a.gd) return b.gd - a.gd
  if (b.gf !== a.gf) return b.gf - a.gf
  return a.name.localeCompare(b.name) // deterministic final tiebreak
}

function predictedScore(p: GroupPrediction): Score | null {
  if (p.predicted_home_score !== null && p.predicted_away_score !== null) {
    return { hs: p.predicted_home_score, as: p.predicted_away_score }
  }
  if (p.predicted_outcome === '1') return { hs: 1, as: 0 }
  if (p.predicted_outcome === 'X') return { hs: 0, as: 0 }
  if (p.predicted_outcome === '2') return { hs: 0, as: 1 }
  return null
}

function actualScore(m: Match): Score | null {
  if (m.status !== 'completed') return null
  if (m.home_score === null || m.away_score === null) return null
  return { hs: m.home_score, as: m.away_score }
}

export interface GroupInput {
  name: string
  teams: Team[]
  matches: Match[]
}

/** Standings per group from a user's group-stage predictions. */
export function standingsFromPredictions(
  groups: GroupInput[],
  predictions: GroupPrediction[]
): Record<string, StandingRow[]> {
  const byMatch = new Map(predictions.map((p) => [p.match_id, p]))
  const out: Record<string, StandingRow[]> = {}
  for (const g of groups) {
    const rows = buildStandings(g.teams, g.matches, (m) => {
      const p = byMatch.get(m.id)
      return p ? predictedScore(p) : null
    })
    for (const r of rows) r.group = g.name
    out[g.name] = rows
  }
  return out
}

/** Standings per group from completed match scores (real tournament). */
export function standingsFromResults(groups: GroupInput[]): Record<string, StandingRow[]> {
  const out: Record<string, StandingRow[]> = {}
  for (const g of groups) {
    const rows = buildStandings(g.teams, g.matches, actualScore)
    for (const r of rows) r.group = g.name
    out[g.name] = rows
  }
  return out
}

// ---------------------------------------------------------------------------
// Qualifiers + third-place assignment
// ---------------------------------------------------------------------------

export interface Qualifiers {
  winner: Record<string, string | null>
  runner: Record<string, string | null>
  /** R32 match number (a winner-vs-third match) -> assigned third-placed teamId */
  thirdByMatch: Record<number, string | null>
}

/**
 * Assign the (up to) 8 best third-placed teams to the 8 winner-vs-third slots
 * such that no third faces a winner from its own group. Deterministic
 * backtracking — always finds a full valid assignment when 8 thirds are present
 * (each third is incompatible with at most one slot, so Hall's condition holds).
 */
function assignThirds(bestThirds: StandingRow[]): Record<number, string | null> {
  const result: Record<number, string | null> = {}
  for (const s of THIRD_SLOTS) result[s.match] = null
  const used = new Array(THIRD_SLOTS.length).fill(false)

  const place = (i: number): boolean => {
    if (i >= bestThirds.length) return true
    const third = bestThirds[i]
    if (!third) return true
    for (let s = 0; s < THIRD_SLOTS.length; s++) {
      const slot = THIRD_SLOTS[s]
      if (used[s] || !slot) continue
      if (third.group === slot.winnerGroup) continue
      used[s] = true
      result[slot.match] = third.teamId
      if (place(i + 1)) return true
      used[s] = false
      result[slot.match] = null
    }
    return false
  }
  place(0)
  return result
}

export function computeQualifiers(standingsByGroup: Record<string, StandingRow[]>): Qualifiers {
  const winner: Record<string, string | null> = {}
  const runner: Record<string, string | null> = {}
  const thirds: StandingRow[] = []

  for (const g of GROUP_NAMES) {
    const rows = standingsByGroup[g] ?? []
    winner[g] = rows[0]?.teamId ?? null
    runner[g] = rows[1]?.teamId ?? null
    if (rows[2]) thirds.push(rows[2])
  }

  const bestThirds = [...thirds].sort(compareStanding).slice(0, 8)
  return { winner, runner, thirdByMatch: assignThirds(bestThirds) }
}

// ---------------------------------------------------------------------------
// Participants of every knockout match
// ---------------------------------------------------------------------------

export interface MatchParticipants {
  home: string | null
  away: string | null
}

/**
 * Resolve the two participants of every knockout match (73–104) from the
 * qualifiers and the chosen winners so far. `winnersByMatch[n]` is the teamId
 * picked/known to win match n; a stale winner that is no longer a participant
 * of its match is ignored, so downstream slots clear automatically.
 */
export function computeParticipants(
  qualifiers: Qualifiers,
  winnersByMatch: Record<number, string | null | undefined>
): Record<number, MatchParticipants> {
  const parts: Record<number, MatchParticipants> = {}

  const effectiveWinner = (m: number): string | undefined => {
    const w = winnersByMatch[m]
    const p = parts[m]
    if (w && p && (w === p.home || w === p.away)) return w
    return undefined
  }

  const resolve = (slot: Slot, matchNo: number): string | null => {
    switch (slot.t) {
      case 'W': return qualifiers.winner[slot.g] ?? null
      case 'R': return qualifiers.runner[slot.g] ?? null
      case 'T': return qualifiers.thirdByMatch[matchNo] ?? null
      case 'win': return effectiveWinner(slot.m) ?? null
      case 'lose': {
        const p = parts[slot.m]
        const w = effectiveWinner(slot.m)
        if (!p || !w) return null
        return w === p.home ? p.away : p.home
      }
    }
  }

  for (const m of ALL_KO_MATCHES) {
    const tmpl = R32_TEMPLATE[m] ?? KO_TREE[m]
    if (!tmpl) continue
    parts[m] = { home: resolve(tmpl.home, m), away: resolve(tmpl.away, m) }
  }
  return parts
}

/** Convenience: full bracket from group inputs + predictions + chosen winners. */
export function buildBracketFromPredictions(
  groups: GroupInput[],
  groupPredictions: GroupPrediction[],
  winnersByMatch: Record<number, string | null | undefined>
) {
  const standings = standingsFromPredictions(groups, groupPredictions)
  const qualifiers = computeQualifiers(standings)
  const participants = computeParticipants(qualifiers, winnersByMatch)
  return { standings, qualifiers, participants }
}

/** Convenience: full bracket from real results + real winners. */
export function buildBracketFromResults(
  groups: GroupInput[],
  winnersByMatch: Record<number, string | null | undefined>
) {
  const standings = standingsFromResults(groups)
  const qualifiers = computeQualifiers(standings)
  const participants = computeParticipants(qualifiers, winnersByMatch)
  return { standings, qualifiers, participants }
}

/** Whether every group match has a completed result (real bracket can lock). */
export function isGroupStageComplete(groups: GroupInput[]): boolean {
  return groups.every((g) => g.matches.length > 0 && g.matches.every((m) => m.status === 'completed'))
}

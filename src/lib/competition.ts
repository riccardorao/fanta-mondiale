// Single source of truth for "has the tournament kicked off?"
// Opening match of the FIFA World Cup 2026.
export const TOURNAMENT_START_ISO = '2026-06-11T16:00:00Z'

/**
 * Whether the competition has started. Pass the earliest match kickoff to make
 * it data-driven; falls back to the constant above.
 */
export function hasCompetitionStarted(firstMatchIso?: string | null): boolean {
  const start = firstMatchIso ?? TOURNAMENT_START_ISO
  return Date.now() >= new Date(start).getTime()
}

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { hasCompetitionStarted } from '@/lib/competition'
import { buildBracketFromResults, isGroupStageComplete, type GroupInput } from '@/lib/bracket'
import Landing from '@/components/home/Landing'
import HomeHub from '@/components/home/HomeHub'
import type { Match, Team, Group } from '@/types/database'

const HUB_LEADERS = 8

export default async function HomePage() {
  // Decide whether the tournament has kicked off (data-driven from the first match,
  // falling back to the configured opener).
  const supabase = createClient()

  const { data: firstMatch } = await supabase
    .from('matches')
    .select('scheduled_at')
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!hasCompetitionStarted(firstMatch?.scheduled_at)) {
    return <Landing />
  }

  // Competition is live → load the hub data: knockout bracket + leaderboard.
  const [{ data: { user } }, matchesRes, teamsRes, groupsRes, leadersRes, countRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*),
        winner:winner_id(*)
      `)
      .order('match_number'),
    supabase.from('teams').select('*'),
    supabase.from('groups').select('*').order('name'),
    supabase
      .from('leaderboard')
      .select('user_id, total_points, profile:user_id(name, surname)')
      .order('total_points', { ascending: false })
      .order('exact_score_bonus', { ascending: false })
      .limit(HUB_LEADERS),
    supabase.from('leaderboard').select('user_id', { count: 'exact', head: true }),
  ])

  const allMatches = (matchesRes.data as Match[]) ?? []
  const teams = (teamsRes.data as Team[]) ?? []
  const groupMatches = allMatches.filter((m) => m.stage === 'group')
  const knockoutMatches = allMatches.filter((m) => m.stage !== 'group')

  // Resolve knockout participants from real standings + real winners.
  const groupInputs: GroupInput[] = ((groupsRes.data as Group[]) ?? []).map((g) => ({
    name: g.name,
    teams: teams.filter((t) => t.group_id === g.id),
    matches: groupMatches.filter((m) => m.group_id === g.id),
  }))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const winnersByMatch: Record<number, string> = {}
  for (const m of knockoutMatches) if (m.winner_id) winnersByMatch[m.match_number] = m.winner_id
  const participants = isGroupStageComplete(groupInputs)
    ? buildBracketFromResults(groupInputs, winnersByMatch).participants
    : ({} as Record<number, { home: string | null; away: string | null }>)

  const matches: Match[] = knockoutMatches.map((m) => {
    const p = participants[m.match_number] ?? { home: null, away: null }
    return {
      ...m,
      home_team_id: m.home_team_id ?? p.home,
      away_team_id: m.away_team_id ?? p.away,
      home_team: m.home_team ?? (p.home ? teamMap.get(p.home) : undefined),
      away_team: m.away_team ?? (p.away ? teamMap.get(p.away) : undefined),
    }
  })

  const leaders = (leadersRes.data ?? []).map((row: any) => ({
    user_id: row.user_id as string,
    total_points: (row.total_points as number) ?? 0,
    name: row.profile?.name ?? '',
    surname: row.profile?.surname ?? '',
  }))

  let currentUserRank: number | null = null
  let currentUserPoints: number | null = null
  if (user) {
    const { data: myRow } = await supabase
      .from('leaderboard')
      .select('total_points')
      .eq('user_id', user.id)
      .maybeSingle()
    currentUserPoints = myRow?.total_points ?? 0
    const { count: aboveCount } = await supabase
      .from('leaderboard')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_points', currentUserPoints)
    currentUserRank = (aboveCount ?? 0) + 1
  }

  return (
    <HomeHub
      matches={matches}
      leaders={leaders}
      participants={countRes.count ?? 0}
      currentUserId={user?.id ?? null}
      currentUserRank={currentUserRank}
      currentUserPoints={currentUserPoints}
    />
  )
}

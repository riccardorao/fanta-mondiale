export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { hasCompetitionStarted } from '@/lib/competition'
import Landing from '@/components/home/Landing'
import HomeHub from '@/components/home/HomeHub'
import type { Match } from '@/types/database'

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
  const [{ data: { user } }, matchesRes, leadersRes, countRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*),
        winner:winner_id(*)
      `)
      .in('stage', ['r32', 'r16', 'qf', 'sf', 'third_place', 'final'])
      .order('match_number'),
    supabase
      .from('leaderboard')
      .select('user_id, total_points, profile:user_id(name, surname)')
      .order('total_points', { ascending: false })
      .order('exact_score_bonus', { ascending: false })
      .limit(HUB_LEADERS),
    supabase.from('leaderboard').select('user_id', { count: 'exact', head: true }),
  ])

  const matches = (matchesRes.data as Match[]) ?? []

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

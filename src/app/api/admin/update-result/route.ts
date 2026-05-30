import { createClient, createAdminClient } from '@/lib/supabase/server'
import { computeUserScore } from '@/lib/scoring'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verify session first with the regular client
  const authClient = createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin status
  const { data: profile } = await authClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { matchId, homeScore, awayScore, homePenalties, awayPenalties, winnerId, status } = body

  if (!matchId || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      home_score: homeScore ?? null,
      away_score: awayScore ?? null,
      home_penalties: homePenalties ?? null,
      away_penalties: awayPenalties ?? null,
      winner_id: winnerId ?? null,
      status,
    })
    .eq('id', matchId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Recompute all user scores
  try {
    await recomputeAllScores(supabase)
  } catch (e: unknown) {
    console.error('Score recomputation error:', e)
    // Still return success for the match update, but note the error
    const message = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({
      success: true,
      warning: 'Match updated but score recomputation failed: ' + message,
    })
  }

  return NextResponse.json({ success: true })
}

async function recomputeAllScores(supabase: ReturnType<typeof createAdminClient>) {
  // Get all profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id')

  if (profilesErr || !profiles) {
    throw new Error('Failed to fetch profiles: ' + profilesErr?.message)
  }

  // Get all matches (computeUserScore filters by status internally)
  const { data: matches, error: matchesErr } = await supabase
    .from('matches')
    .select('*')

  if (matchesErr || !matches) {
    throw new Error('Failed to fetch matches: ' + matchesErr?.message)
  }

  for (const prof of profiles) {
    const { data: groupPreds } = await supabase
      .from('group_predictions')
      .select('*')
      .eq('user_id', prof.id)

    const { data: bracketPreds } = await supabase
      .from('bracket_predictions')
      .select('*')
      .eq('user_id', prof.id)

    const score = computeUserScore(
      groupPreds ?? [],
      bracketPreds ?? [],
      matches
    )

    await supabase.from('leaderboard').upsert(
      {
        user_id: prof.id,
        total_points: score.total,
        group_stage_points: score.group_stage,
        r32_points: score.r32_points,
        r16_points: score.r16_points,
        qf_points: score.qf_points,
        sf_points: score.sf_points,
        final_points: score.final_points,
        exact_score_bonus: score.exact_score_bonus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }
}

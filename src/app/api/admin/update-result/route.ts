import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  } catch (e: any) {
    console.error('Score recomputation error:', e)
    // Still return success for the match update, but note the error
    return NextResponse.json({
      success: true,
      warning: 'Match updated but score recomputation failed: ' + (e?.message ?? 'unknown error'),
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

  // Get all completed matches
  const { data: matches, error: matchesErr } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')

  if (matchesErr || !matches) {
    throw new Error('Failed to fetch completed matches: ' + matchesErr?.message)
  }

  if (matches.length === 0) {
    // No completed matches, reset everyone to 0
    for (const profile of profiles) {
      await supabase.from('leaderboard').upsert(
        {
          user_id: profile.id,
          total_points: 0,
          group_stage_points: 0,
          r32_points: 0,
          r16_points: 0,
          qf_points: 0,
          sf_points: 0,
          final_points: 0,
          exact_score_bonus: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }
    return
  }

  const matchMap = new Map(matches.map((m: any) => [m.id, m]))

  const stagePoints: Record<string, number> = {
    r32: 5,
    r16: 7,
    qf: 10,
    sf: 12,
    third_place: 8,
    final: 20,
  }

  for (const profile of profiles) {
    const { data: groupPreds } = await supabase
      .from('group_predictions')
      .select('*')
      .eq('user_id', profile.id)

    const { data: bracketPreds } = await supabase
      .from('bracket_predictions')
      .select('*')
      .eq('user_id', profile.id)

    let group_stage = 0
    let exact_bonus = 0
    let r32 = 0
    let r16 = 0
    let qf = 0
    let sf = 0
    let final_pts = 0

    // Group stage predictions
    for (const pred of groupPreds ?? []) {
      const match: any = matchMap.get(pred.match_id)
      if (!match || match.stage !== 'group') continue
      if (match.home_score === null || match.away_score === null) continue

      const actualOutcome =
        match.home_score > match.away_score
          ? '1'
          : match.home_score === match.away_score
          ? 'X'
          : '2'

      if (pred.predicted_outcome === actualOutcome) {
        group_stage += 3
        if (
          pred.predicted_home_score === match.home_score &&
          pred.predicted_away_score === match.away_score
        ) {
          exact_bonus += 2
        }
      }
    }

    // Bracket (knockout) predictions
    for (const pred of bracketPreds ?? []) {
      const match: any = matchMap.get(pred.match_id)
      if (!match || !match.winner_id) continue
      if (pred.predicted_winner_id !== match.winner_id) continue

      const pts = stagePoints[match.stage] ?? 0
      switch (match.stage) {
        case 'r32':
          r32 += pts
          break
        case 'r16':
          r16 += pts
          break
        case 'qf':
          qf += pts
          break
        case 'sf':
          sf += pts
          break
        case 'third_place':
          // third place points go into sf bucket for simplicity
          sf += pts
          break
        case 'final':
          final_pts += pts
          break
      }
    }

    const total = group_stage + exact_bonus + r32 + r16 + qf + sf + final_pts

    await supabase.from('leaderboard').upsert(
      {
        user_id: profile.id,
        total_points: total,
        group_stage_points: group_stage,
        r32_points: r32,
        r16_points: r16,
        qf_points: qf,
        sf_points: sf,
        final_points: final_pts,
        exact_score_bonus: exact_bonus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return { supabase, user }
}

// Golfer submits their own score — allowed when round is in_progress or scoring
export async function submitMyScore(roundId: string, holeScores: number[]) {
  const { supabase, user } = await getAuthenticatedUser()

  // Verify the round is in a state that allows scoring
  const { data: round } = await supabase
    .from('rounds')
    .select('status')
    .eq('id', roundId)
    .single()

  if (!round) return { error: 'Round not found' }
  if (!['in_progress', 'scoring'].includes(round.status)) {
    return { error: 'Scoring is not open for this round' }
  }

  // Verify this user is actually in the foursome for this round
  const { data: foursomeIds } = await supabase
    .from('foursomes')
    .select('id')
    .eq('round_id', roundId)

  if (!foursomeIds || foursomeIds.length === 0) {
    return { error: 'No foursomes found for this round' }
  }

  const { data: membership } = await supabase
    .from('foursome_members')
    .select('team_id, is_sub')
    .in('foursome_id', foursomeIds.map((f) => f.id))
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return { error: 'You are not listed as a player in this round' }
  }

  // Ensure the score isn't already locked
  const { data: existing } = await supabase
    .from('scores')
    .select('id, is_locked')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.is_locked) {
    return { error: 'Your score has been locked and cannot be changed' }
  }

  if (holeScores.length !== 9) {
    return { error: 'Expected exactly 9 hole score slots' }
  }
  if (holeScores.some((h) => h < 0)) {
    return { error: 'Hole scores cannot be negative' }
  }

  // Fetch current handicap
  const { data: handicapRow } = await supabase
    .from('handicaps')
    .select('current_handicap')
    .eq('user_id', user.id)
    .maybeSingle()

  const handicap = handicapRow?.current_handicap ?? 0
  // Only sum filled holes (> 0); net score is null until all 9 are entered
  const filledScores = holeScores.filter((h) => h > 0)
  const grossScore = filledScores.reduce((a, b) => a + b, 0)
  const allFilled = filledScores.length === 9
  const netScore = allFilled ? Math.round((grossScore - handicap) * 10) / 10 : null

  const { error } = await supabase
    .from('scores')
    .upsert(
      {
        round_id: roundId,
        user_id: user.id,
        team_id: membership.team_id,
        hole_scores: holeScores,
        handicap_at_time: handicap,
        net_score: netScore,
        is_sub: membership.is_sub,
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
      },
      { onConflict: 'round_id,user_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/scores/${roundId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// Save hole-by-hole scores for a golfer in a round (does not lock)
export async function saveScore(
  roundId: string,
  userId: string,
  teamId: string,
  holeScores: number[],
  isSub: boolean = false
) {
  const { supabase, user } = await getAdminUser()

  if (holeScores.length !== 9) {
    return { error: 'Exactly 9 hole scores are required' }
  }

  // Fetch current handicap for this golfer
  const { data: handicapRow } = await supabase
    .from('handicaps')
    .select('current_handicap')
    .eq('user_id', userId)
    .maybeSingle()

  const handicap = handicapRow?.current_handicap ?? 0
  const filledScores = holeScores.filter((h) => h > 0)
  const grossScore = filledScores.reduce((a, b) => a + b, 0)
  const allFilled = filledScores.length === 9
  const netScore = allFilled ? Math.round((grossScore - handicap) * 10) / 10 : null

  const { error } = await supabase
    .from('scores')
    .upsert(
      {
        round_id: roundId,
        user_id: userId,
        team_id: teamId,
        hole_scores: holeScores,
        handicap_at_time: handicap,
        net_score: netScore,
        is_sub: isSub,
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,
      },
      { onConflict: 'round_id,user_id' }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  return { success: true }
}

// Lock a score — requires all 9 hole scores to be non-zero
export async function lockScore(scoreId: string, roundId: string) {
  const { supabase, user } = await getAdminUser()

  const { data: score } = await supabase
    .from('scores')
    .select('hole_scores, is_locked')
    .eq('id', scoreId)
    .single()

  if (!score) return { error: 'Score not found' }
  if (score.is_locked) return { error: 'Score is already locked' }

  const holes: number[] = score.hole_scores
  if (holes.length !== 9 || holes.some((h) => !h || h <= 0)) {
    return { error: 'All 9 hole scores must be entered before locking' }
  }

  const { error } = await supabase
    .from('scores')
    .update({ is_locked: true })
    .eq('id', scoreId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  return { success: true }
}

// Unlock a score (admin override)
export async function unlockScore(scoreId: string, roundId: string) {
  const { supabase } = await getAdminUser()

  const { error } = await supabase
    .from('scores')
    .update({ is_locked: false })
    .eq('id', scoreId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  return { success: true }
}

// Calculate and save round points for all teams, then mark round completed
export async function finalizeRound(roundId: string) {
  const { supabase, user } = await getAdminUser()

  // Get all locked scores for this round
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('id, user_id, team_id, net_score, is_sub')
    .eq('round_id', roundId)
    .eq('is_locked', true)

  if (scoresError) return { error: scoresError.message }
  if (!scores || scores.length === 0) return { error: 'No locked scores found' }

  // One net score per team — use the declared golfer's score (is_sub=false preferred)
  const teamScores: Record<string, number> = {}
  for (const s of scores) {
    if (!s.is_sub && s.net_score !== null) {
      teamScores[s.team_id] = s.net_score
    }
  }
  // Fall back to sub scores for teams with no regular player score
  for (const s of scores) {
    if (!(s.team_id in teamScores) && s.net_score !== null) {
      teamScores[s.team_id] = s.net_score
    }
  }

  const teamIds = Object.keys(teamScores)
  if (teamIds.length === 0) return { error: 'No team scores to finalize' }

  // Sort teams by net score ascending (lower = better)
  const sorted = teamIds
    .map((tid) => ({ teamId: tid, netScore: teamScores[tid] }))
    .sort((a, b) => a.netScore - b.netScore)

  // Points table: 1st=8, 2nd=7, ... 8th=1 (adjust for ties)
  const BASE_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]

  // Group into finish positions handling ties
  const pointsRecords: {
    round_id: string
    team_id: string
    net_score: number
    finish_position: number
    points_earned: number
    is_tied: boolean
    tied_with_teams: string[]
  }[] = []

  let i = 0
  while (i < sorted.length) {
    const currentScore = sorted[i].netScore
    // Find all teams tied at this score
    const tiedGroup = sorted.filter((t) => t.netScore === currentScore)
    const tiedTeamIds = tiedGroup.map((t) => t.teamId)
    const position = i + 1 // 1-based finish position (first place in the tied group)

    // Average the points for the tied positions
    const pointsForPositions = tiedGroup.map((_, idx) => BASE_POINTS[i + idx] ?? 0)
    const avgPoints =
      Math.round(
        (pointsForPositions.reduce((a, b) => a + b, 0) / tiedGroup.length) * 10
      ) / 10
    const isTied = tiedGroup.length > 1

    for (const team of tiedGroup) {
      pointsRecords.push({
        round_id: roundId,
        team_id: team.teamId,
        net_score: team.netScore,
        finish_position: position,
        points_earned: avgPoints,
        is_tied: isTied,
        tied_with_teams: isTied ? tiedTeamIds.filter((id) => id !== team.teamId) : [],
      })
    }
    i += tiedGroup.length
  }

  // Upsert round_points
  const { error: pointsError } = await supabase
    .from('round_points')
    .upsert(pointsRecords, { onConflict: 'round_id,team_id' })

  if (pointsError) return { error: pointsError.message }

  // Mark round as completed
  const { error: roundError } = await supabase
    .from('rounds')
    .update({ status: 'completed' })
    .eq('id', roundId)

  if (roundError) return { error: roundError.message }

  // Update handicaps for all players who scored in this round
  await updateHandicapsForRound(supabase, roundId, user.id)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_finalized',
    entity_type: 'round',
    entity_id: roundId,
    new_value: { points: pointsRecords },
  })

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  revalidatePath(`/admin/rounds/${roundId}`)
  revalidatePath('/admin/rounds')
  revalidatePath('/leaderboard')
  return { success: true }
}

// Recalculate handicaps for all players who have scores in this round
async function updateHandicapsForRound(supabase: any, roundId: string, adminUserId: string) {
  const { data: roundScores } = await supabase
    .from('scores')
    .select('user_id')
    .eq('round_id', roundId)
    .eq('is_locked', true)
    .eq('is_sub', false)

  if (!roundScores) return

  for (const { user_id } of roundScores) {
    await recalculateHandicap(supabase, user_id, adminUserId)
  }
}

// Calculate handicap for a single user from their last 10 locked scores
async function recalculateHandicap(supabase: any, userId: string, adminUserId: string) {
  const { data: eligibleScores } = await supabase
    .rpc('get_eligible_scores_for_handicap', { p_user_id: userId, p_limit: 10 })

  if (!eligibleScores || eligibleScores.length === 0) return

  const grossScores: number[] = eligibleScores.map((s: any) => s.gross_score)

  // Use best differentials: ≤10 scores → use best 3, approaching best 8 of 10
  const scoresToUse = Math.max(1, Math.floor(grossScores.length * 0.8))
  const sorted = [...grossScores].sort((a, b) => a - b)
  const best = sorted.slice(0, scoresToUse)
  const avgBest = best.reduce((a, b) => a + b, 0) / best.length
  // Simple handicap: average of best scores minus course par (36 for 9 holes)
  const newHandicap = Math.round(Math.max(0, avgBest - 36) * 10) / 10

  const { data: existing } = await supabase
    .from('handicaps')
    .select('id, current_handicap')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('handicaps')
      .update({
        current_handicap: newHandicap,
        rounds_played: grossScores.length,
        last_calculated_at: new Date().toISOString(),
        is_manual_override: false,
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('handicaps').insert({
      user_id: userId,
      current_handicap: newHandicap,
      rounds_played: grossScores.length,
      last_calculated_at: new Date().toISOString(),
      is_manual_override: false,
    })
  }

  // Record handicap history
  await supabase.from('handicap_history').insert({
    user_id: userId,
    handicap_value: newHandicap,
    calculation_method: 'calculated',
    scores_used: eligibleScores,
    changed_by: adminUserId,
    reason: 'Auto-calculated after round finalization',
  })
}

// Admin: manually set a player's handicap
export async function setHandicap(userId: string, handicap: number, reason: string) {
  const { supabase, user } = await getAdminUser()

  const rounded = Math.round(Math.max(0, handicap) * 10) / 10

  const { data: existing } = await supabase
    .from('handicaps')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('handicaps')
      .update({
        current_handicap: rounded,
        last_calculated_at: new Date().toISOString(),
        is_manual_override: true,
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('handicaps').insert({
      user_id: userId,
      current_handicap: rounded,
      rounds_played: 0,
      last_calculated_at: new Date().toISOString(),
      is_manual_override: true,
    })
  }

  await supabase.from('handicap_history').insert({
    user_id: userId,
    handicap_value: rounded,
    calculation_method: 'manual',
    changed_by: user.id,
    reason: reason || 'Manual admin override',
  })

  revalidatePath('/admin/handicaps')
  return { success: true }
}

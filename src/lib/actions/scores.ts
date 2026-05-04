'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewerContext } from '@/lib/viewer'

// Returns the effective user (impersonated if applicable) for user-facing mutations.
// realUserId is preserved for audit fields like submitted_by.
async function getEffectiveUser() {
  const ctx = await getViewerContext()
  if (!ctx) redirect('/login')
  return {
    supabase: ctx.db,
    userId: ctx.effectiveUserId,
    realUserId: ctx.realUserId,
  }
}

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
  const { supabase, userId, realUserId } = await getEffectiveUser()

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
    .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    return { error: 'You are not listed as a player in this round' }
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
    .eq('user_id', userId)
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
        user_id: userId,
        team_id: membership.team_id,
        hole_scores: holeScores,
        handicap_at_time: handicap,
        net_score: netScore,
        is_sub: membership.is_sub,
        submitted_at: new Date().toISOString(),
        submitted_by: realUserId,
      },
      { onConflict: 'round_id,user_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/scores/${roundId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// Any golfer in the same foursome can submit a score for another player in their group
export async function submitScoreForFoursome(
  roundId: string,
  targetUserId: string | null,
  targetSubId: string | null,
  holeScores: number[]
) {
  const { supabase, userId, realUserId } = await getEffectiveUser()

  // Verify the round is open for scoring
  const { data: round } = await supabase
    .from('rounds')
    .select('status')
    .eq('id', roundId)
    .single()

  if (!round) return { error: 'Round not found' }
  if (!['in_progress', 'scoring'].includes(round.status)) {
    return { error: 'Scoring is not open for this round' }
  }

  const { data: foursomeIds } = await supabase
    .from('foursomes')
    .select('id')
    .eq('round_id', roundId)

  if (!foursomeIds || foursomeIds.length === 0) {
    return { error: 'No foursomes found for this round' }
  }

  // Verify calling user is in a foursome for this round and get their foursome_id
  const { data: callerMembership } = await supabase
    .from('foursome_members')
    .select('foursome_id')
    .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
    .eq('user_id', userId)
    .maybeSingle()

  if (!callerMembership) {
    return { error: 'You are not listed as a player in this round' }
  }

  // Verify the target is in the SAME foursome as the calling user
  const targetQuery = targetSubId
    ? supabase
        .from('foursome_members')
        .select('team_id, is_sub')
        .eq('foursome_id', callerMembership.foursome_id)
        .eq('sub_id', targetSubId)
        .maybeSingle()
    : supabase
        .from('foursome_members')
        .select('team_id, is_sub')
        .eq('foursome_id', callerMembership.foursome_id)
        .eq('user_id', targetUserId!)
        .maybeSingle()

  const { data: targetMembership } = await targetQuery

  if (!targetMembership) {
    return { error: 'That player is not in your foursome' }
  }

  // Check if score already exists to decide insert vs update
  const existingQuery = targetSubId
    ? supabase.from('scores').select('id').eq('round_id', roundId).eq('sub_id', targetSubId).maybeSingle()
    : supabase.from('scores').select('id').eq('round_id', roundId).eq('user_id', targetUserId!).maybeSingle()

  const { data: existing } = await existingQuery

  if (holeScores.length !== 9) {
    return { error: 'Expected exactly 9 hole score slots' }
  }
  if (holeScores.some((h) => h < 0)) {
    return { error: 'Hole scores cannot be negative' }
  }

  // Subs don't have handicap records — default to 0
  let handicap = 0
  if (targetUserId) {
    const { data: handicapRow } = await supabase
      .from('handicaps')
      .select('current_handicap')
      .eq('user_id', targetUserId)
      .maybeSingle()
    handicap = handicapRow?.current_handicap ?? 0
  }

  const filledScores = holeScores.filter((h) => h > 0)
  const grossScore = filledScores.reduce((a, b) => a + b, 0)
  const allFilled = filledScores.length === 9
  const netScore = allFilled ? Math.round((grossScore - handicap) * 10) / 10 : null

  const scoreData = {
    round_id: roundId,
    user_id: targetSubId ? null : targetUserId,
    sub_id: targetSubId ?? null,
    team_id: targetMembership.team_id,
    hole_scores: holeScores,
    handicap_at_time: handicap,
    net_score: netScore,
    is_sub: targetMembership.is_sub,
    submitted_at: new Date().toISOString(),
    submitted_by: realUserId,
  }

  const { error } = existing
    ? await supabase.from('scores').update(scoreData).eq('id', existing.id)
    : await supabase.from('scores').insert(scoreData)

  if (error) return { error: error.message }

  revalidatePath(`/scores/${roundId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// Save hole-by-hole scores for a golfer in a round (does not lock)
export async function saveScore(
  roundId: string,
  userId: string | null,
  teamId: string,
  holeScores: number[],
  isSub: boolean = false,
  subId: string | null = null
) {
  const { supabase, user } = await getAdminUser()

  if (holeScores.length !== 9) {
    return { error: 'Exactly 9 hole scores are required' }
  }

  if (!userId && !subId) {
    return { error: 'Either userId or subId is required' }
  }

  // Fetch handicap — subs don't have handicap records, default to 0
  let handicap = 0
  if (userId) {
    const { data: handicapRow } = await supabase
      .from('handicaps')
      .select('current_handicap')
      .eq('user_id', userId)
      .maybeSingle()
    handicap = handicapRow?.current_handicap ?? 0
  }

  const filledScores = holeScores.filter((h) => h > 0)
  const grossScore = filledScores.reduce((a, b) => a + b, 0)
  const allFilled = filledScores.length === 9
  const netScore = allFilled ? Math.round((grossScore - handicap) * 10) / 10 : null

  const scoreData = {
    round_id: roundId,
    user_id: isSub ? null : userId,
    sub_id: isSub ? subId : null,
    team_id: teamId,
    hole_scores: holeScores,
    handicap_at_time: handicap,
    net_score: netScore,
    is_sub: isSub,
    submitted_at: new Date().toISOString(),
    submitted_by: user.id,
  }

  // Check for an existing score record to decide insert vs update
  const existingQuery = isSub
    ? supabase.from('scores').select('id').eq('round_id', roundId).eq('sub_id', subId!).maybeSingle()
    : supabase.from('scores').select('id').eq('round_id', roundId).eq('user_id', userId!).maybeSingle()

  const { data: existing } = await existingQuery

  const { error } = existing
    ? await supabase.from('scores').update(scoreData).eq('id', existing.id)
    : await supabase.from('scores').insert(scoreData)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  return { success: true }
}


// Helper function to calculate points from entered scores
async function calculateRoundPoints(supabase: any, roundId: string) {
  // Get all complete scores for this round (net_score is set only when all 9 holes are entered)
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('id, user_id, sub_id, team_id, net_score, is_sub')
    .eq('round_id', roundId)
    .not('net_score', 'is', null)

  if (scoresError) return { error: scoresError.message, points: null }

  // Also fetch makeup scores from other rounds that count toward this round
  const { data: makeupScores, error: makeupError } = await supabase
    .from('scores')
    .select('id, user_id, sub_id, team_id, net_score, is_sub')
    .eq('covers_missed_round_id', roundId)
    .not('net_score', 'is', null)

  if (makeupError) return { error: makeupError.message, points: null }

  const allScores = [...(scores ?? []), ...(makeupScores ?? [])]
  if (allScores.length === 0) return { error: 'No complete scores found', points: null }

  // One net score per team — three-tier priority:
  // 1. Non-sub direct score (regular golfer played that night)
  // 2. Non-sub makeup score (player made up the round later/earlier)
  // 3. Sub score (fallback if neither direct nor makeup exists)
  const teamScores: Record<string, number> = {}
  for (const s of scores ?? []) {
    if (!s.is_sub && s.net_score !== null) {
      teamScores[s.team_id] = s.net_score
    }
  }
  for (const s of makeupScores ?? []) {
    if (!(s.team_id in teamScores) && !s.is_sub && s.net_score !== null) {
      teamScores[s.team_id] = s.net_score
    }
  }
  for (const s of scores ?? []) {
    if (!(s.team_id in teamScores) && s.net_score !== null) {
      teamScores[s.team_id] = s.net_score
    }
  }

  const teamIds = Object.keys(teamScores)
  if (teamIds.length === 0) return { error: 'No team scores to finalize', points: null }

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
    let totalPoints = pointsForPositions.reduce((a, b) => a + b, 0)

    // Add 3 bonus points if any of the tied teams are in first place
    if (position === 1) {
      totalPoints += 3
    }

    const avgPoints = Math.round((totalPoints / tiedGroup.length) * 10) / 10
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

  return { error: null, points: pointsRecords }
}

// Calculate and save round points for all teams, then mark round completed
export async function finalizeRound(roundId: string) {
  const { supabase, user } = await getAdminUser()

  const { error, points: pointsRecords } = await calculateRoundPoints(supabase, roundId)
  if (error || !pointsRecords) return { error: error || 'Failed to calculate points' }

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
  revalidateTag('standings')
  return { success: true }
}

// Recalculate points for a completed round after score corrections
export async function recalculateRoundPoints(roundId: string) {
  const { supabase, user } = await getAdminUser()

  const { error, points: pointsRecords } = await calculateRoundPoints(supabase, roundId)
  if (error || !pointsRecords) return { error: error || 'Failed to calculate points' }

  // Upsert round_points (this will update existing records)
  const { error: pointsError } = await supabase
    .from('round_points')
    .upsert(pointsRecords, { onConflict: 'round_id,team_id' })

  if (pointsError) return { error: pointsError.message }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_points_recalculated',
    entity_type: 'round',
    entity_id: roundId,
    new_value: { points: pointsRecords },
  })

  revalidatePath(`/admin/rounds/${roundId}/scores`)
  revalidatePath(`/admin/rounds/${roundId}`)
  revalidatePath('/admin/rounds')
  revalidatePath('/leaderboard')
  revalidateTag('standings')
  return { success: true }
}

// Admin: link (or unlink) a score to a missed round for makeup purposes
export async function linkMakeupScore(
  scoreId: string,
  missedRoundId: string | null
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAdminUser()

  const { data: score } = await supabase
    .from('scores')
    .select('id, user_id, round_id, covers_missed_round_id')
    .eq('id', scoreId)
    .single()

  if (!score) return { error: 'Score not found' }
  if (missedRoundId === score.round_id) return { error: 'Score already belongs to this round' }

  const previousMissedRoundId = score.covers_missed_round_id

  const { error: updateError } = await supabase
    .from('scores')
    .update({ is_makeup: !!missedRoundId, covers_missed_round_id: missedRoundId ?? null })
    .eq('id', scoreId)

  if (updateError) return { error: updateError.message }

  // Recalculate points for the newly linked missed round (only if already completed)
  if (missedRoundId) {
    const { data: missedRound } = await supabase
      .from('rounds').select('status').eq('id', missedRoundId).single()
    if (missedRound?.status === 'completed') {
      const { points } = await calculateRoundPoints(supabase, missedRoundId)
      if (points) {
        await supabase.from('round_points').upsert(points, { onConflict: 'round_id,team_id' })
      }
    }
  }

  // Recalculate points for the previously linked round when re-linking or unlinking
  if (previousMissedRoundId && previousMissedRoundId !== missedRoundId) {
    const { data: prevRound } = await supabase
      .from('rounds').select('status').eq('id', previousMissedRoundId).single()
    if (prevRound?.status === 'completed') {
      const { points } = await calculateRoundPoints(supabase, previousMissedRoundId)
      if (points) {
        await supabase.from('round_points').upsert(points, { onConflict: 'round_id,team_id' })
      }
    }
  }

  // Recalculate handicap for the player (subs have no user_id — skip)
  if (score.user_id) {
    await recalculateHandicap(supabase, score.user_id, user.id)
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'makeup_score_linked',
    entity_type: 'score',
    entity_id: scoreId,
    old_value: { covers_missed_round_id: previousMissedRoundId },
    new_value: { covers_missed_round_id: missedRoundId },
  })

  revalidatePath(`/admin/rounds/${score.round_id}/scores`)
  if (missedRoundId) revalidatePath(`/admin/rounds/${missedRoundId}/scores`)
  if (previousMissedRoundId && previousMissedRoundId !== missedRoundId) {
    revalidatePath(`/admin/rounds/${previousMissedRoundId}/scores`)
  }
  revalidatePath('/leaderboard')
  revalidateTag('standings')
  return { success: true }
}

// Recalculate handicaps for all non-sub players who have scores in this round
async function updateHandicapsForRound(supabase: any, roundId: string, adminUserId: string) {
  const { data: roundScores } = await supabase
    .from('scores')
    .select('user_id')
    .eq('round_id', roundId)
    .eq('is_sub', false)
    .not('net_score', 'is', null)

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

  // LeagueGolfer formula: best 5 of last 10
  const scoresToUse = Math.min(grossScores.length, 5)
  const sorted = [...grossScores].sort((a, b) => a - b)
  const best = sorted.slice(0, scoresToUse)
  const avgBest = best.reduce((a, b) => a + b, 0) / best.length
  // Simple handicap: average of best scores minus course par (36 for 9 holes)
  const newHandicap = Math.floor(Math.max(0, avgBest - 36))

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

// Admin: recalculate handicaps for every active player
export async function recalculateAllHandicaps() {
  const { supabase, user } = await getAdminUser()

  const { data: players } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)

  if (!players) return { success: false, error: 'No players found' }

  for (const { id } of players) {
    await recalculateHandicap(supabase, id, user.id)
  }

  revalidatePath('/admin/handicaps')
  return { success: true, count: players.length }
}

// Read-only: fetch eligible scores + handicap history for breakdown display
export async function getHandicapBreakdown(userId: string) {
  const supabase = await createClient()

  const { data: eligible } = await supabase
    .rpc('get_eligible_scores_for_handicap', { p_user_id: userId, p_limit: 10 })

  const scores = (eligible ?? []) as Array<{
    score_id: string
    round_id: string
    gross_score: number
    round_date: string
    is_makeup: boolean
    covers_missed_round_id: string | null
  }>

  const scoresToUse = Math.min(scores.length, 5)
  const usedIds = new Set(
    [...scores].sort((a, b) => a.gross_score - b.gross_score).slice(0, scoresToUse).map(s => s.score_id)
  )

  const { data: history } = await supabase
    .from('handicap_history')
    .select('handicap_value, created_at, calculation_method')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(30)

  return {
    scores: scores.map(s => ({ ...s, used_for_handicap: usedIds.has(s.score_id) })),
    scoresToUse,
    history: (history ?? []) as Array<{ handicap_value: number; created_at: string; calculation_method: string }>,
  }
}

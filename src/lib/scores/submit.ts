import { revalidatePath } from 'next/cache'
import { validateHoleScores, computeNetScore } from './netScore'

// Loosely typed to match the untyped Supabase client used throughout this codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

type SubmitResult = { error: string } | { success: true }

// Golfer submits their own score — allowed when round is in_progress or scoring.
// Shared by the web Server Action (cookie-session user) and the mobile API route
// (bearer-token user) so the authorization/validation rules live in one place.
export async function submitOwnScore(
  supabase: SupabaseLike,
  userId: string,
  realUserId: string,
  roundId: string,
  holeScores: number[]
): Promise<SubmitResult> {
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

  const { data: membership } = await supabase
    .from('foursome_members')
    .select('team_id, is_sub')
    .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    return { error: 'You are not listed as a player in this round' }
  }

  const validationError = validateHoleScores(holeScores)
  if (validationError) return { error: validationError }

  const { data: handicapRow } = await supabase
    .from('handicaps')
    .select('current_handicap')
    .eq('user_id', userId)
    .maybeSingle()

  const handicap = handicapRow?.current_handicap ?? 0
  const { holeScores: paddedHoleScores, netScore } = computeNetScore(holeScores, handicap)

  const { error } = await supabase
    .from('scores')
    .upsert(
      {
        round_id: roundId,
        user_id: userId,
        team_id: membership.team_id,
        hole_scores: paddedHoleScores,
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

// Any golfer in the same foursome can submit a score for another player in their group.
export async function submitFoursomeScore(
  supabase: SupabaseLike,
  userId: string,
  realUserId: string,
  roundId: string,
  targetUserId: string | null,
  targetSubId: string | null,
  holeScores: number[]
): Promise<SubmitResult> {
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

  const { data: callerMembership } = await supabase
    .from('foursome_members')
    .select('foursome_id')
    .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
    .eq('user_id', userId)
    .maybeSingle()

  if (!callerMembership) {
    return { error: 'You are not listed as a player in this round' }
  }

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

  const existingQuery = targetSubId
    ? supabase.from('scores').select('id').eq('round_id', roundId).eq('sub_id', targetSubId).maybeSingle()
    : supabase.from('scores').select('id').eq('round_id', roundId).eq('user_id', targetUserId!).maybeSingle()

  const { data: existing } = await existingQuery

  const validationError = validateHoleScores(holeScores)
  if (validationError) return { error: validationError }

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

  const { holeScores: paddedHoleScores, netScore } = computeNetScore(holeScores, handicap)

  const scoreData = {
    round_id: roundId,
    user_id: targetSubId ? null : targetUserId,
    sub_id: targetSubId ?? null,
    team_id: targetMembership.team_id,
    hole_scores: paddedHoleScores,
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

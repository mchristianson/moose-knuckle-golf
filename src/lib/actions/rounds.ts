'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export async function createRound(prevState: any, formData: FormData) {
  const { supabase, user } = await getAdminUser()

  const roundNumber = parseInt(formData.get('roundNumber') as string)
  const roundDate = formData.get('roundDate') as string
  const roundType = formData.get('roundType') as string || 'regular'
  const course = formData.get('course') as string
  const notes = formData.get('notes') as string
  const seasonYear = parseInt(formData.get('seasonYear') as string) || new Date().getFullYear()

  // Calculate availability deadline (Tuesday before Thursday at 6pm)
  const roundDateObj = new Date(roundDate)
  const availabilityDeadline = new Date(roundDateObj)
  availabilityDeadline.setDate(availabilityDeadline.getDate() - 2) // 2 days before
  availabilityDeadline.setHours(18, 0, 0, 0) // 6pm

  if (!roundNumber || !roundDate) {
    return { error: 'Round number and date are required' }
  }

  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      round_number: roundNumber,
      round_date: roundDate,
      round_type: roundType,
      season_year: seasonYear,
      availability_deadline: availabilityDeadline.toISOString(),
      course: course || null,
      notes: notes || null,
      status: 'availability_open',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Create availability records for all team members
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      team_members (
        user_id
      )
    `)
    .eq('season_year', seasonYear)

  if (teams) {
    const availabilityRecords = []
    for (const team of teams) {
      for (const member of team.team_members as any[]) {
        availabilityRecords.push({
          round_id: round.id,
          user_id: member.user_id,
          team_id: team.id,
          status: 'undeclared',
        })
      }
    }

    if (availabilityRecords.length > 0) {
      await supabase.from('round_availability').insert(availabilityRecords)
    }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_created',
    entity_type: 'round',
    entity_id: round.id,
    new_value: round,
  })

  revalidatePath('/admin/rounds')
  redirect('/admin/rounds')
}

export async function updateRoundStatus(roundId: string, newStatus: string) {
  const { supabase, user } = await getAdminUser()

  const { data: oldRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .update({ status: newStatus })
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_status_updated',
    entity_type: 'round',
    entity_id: roundId,
    old_value: { status: oldRound?.status },
    new_value: { status: newStatus },
  })

  revalidatePath('/admin/rounds')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function updateTeeTime(roundId: string, teeTime: string) {
  const { supabase, user } = await getAdminUser()

  // Validate time format (HH:MM or HH:MM:SS)
  if (!teeTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
    return { error: 'Invalid time format. Use HH:MM or HH:MM:SS' }
  }

  const { data: oldRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .update({ tee_time: teeTime })
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_tee_time_updated',
    entity_type: 'round',
    entity_id: roundId,
    old_value: { tee_time: oldRound?.tee_time },
    new_value: { tee_time: teeTime },
  })

  revalidatePath('/admin/rounds')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function updateCourse(roundId: string, course: string) {
  const { supabase } = await getAdminUser()

  const { error } = await supabase
    .from('rounds')
    .update({ course: course || null })
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/rounds')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function updateRoundType(roundId: string, roundType: string) {
  const { supabase, user } = await getAdminUser()

  if (!['regular', 'makeup', 'practice'].includes(roundType)) {
    return { error: 'Invalid round type' }
  }

  const { data: oldRound } = await supabase
    .from('rounds')
    .select('round_type, status')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .update({ round_type: roundType })
    .eq('id', roundId)

  if (error) return { error: error.message }

  // If the round is completed, recalculate handicaps for all players who scored
  // (changing to/from practice changes which scores are eligible for handicap)
  if (oldRound?.status === 'completed') {
    const { data: roundScores } = await supabase
      .from('scores')
      .select('user_id')
      .eq('round_id', roundId)
      .eq('is_sub', false)
      .not('net_score', 'is', null)

    if (roundScores) {
      for (const { user_id } of roundScores) {
        await supabase.rpc('get_eligible_scores_for_handicap', { p_user_id: user_id, p_limit: 10 })
          .then(async ({ data: eligibleScores }: { data: any[] | null }) => {
            if (!eligibleScores || eligibleScores.length === 0) return
            const grossScores = eligibleScores.map((s: any) => s.gross_score as number)
            const scoresToUse = Math.max(1, Math.floor(grossScores.length * 0.8))
            const sorted = [...grossScores].sort((a, b) => a - b)
            const best = sorted.slice(0, scoresToUse)
            const avg = best.reduce((sum, s) => sum + s, 0) / best.length
            const handicap = Math.round(Math.max(0, avg - 36) * 10) / 10

            await supabase.from('handicaps').upsert(
              { user_id, current_handicap: handicap, rounds_played: grossScores.length, last_calculated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            )
            await supabase.from('handicap_history').insert({
              user_id,
              handicap_value: handicap,
              calculation_method: 'calculated',
              scores_used: eligibleScores,
              changed_by: user.id,
              reason: `Round type changed to ${roundType}`,
            })
          })
      }
    }
  }

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_type_updated',
    entity_type: 'round',
    entity_id: roundId,
    old_value: { round_type: oldRound?.round_type },
    new_value: { round_type: roundType },
  })

  revalidatePath('/admin/rounds')
  revalidatePath(`/admin/rounds/${roundId}`)
  revalidatePath('/leaderboard')
  revalidateTag('standings')
  return { success: true }
}

export async function deleteRound(roundId: string) {
  const { supabase, user } = await getAdminUser()

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  const { error } = await supabase
    .from('rounds')
    .delete()
    .eq('id', roundId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'round_deleted',
    entity_type: 'round',
    entity_id: roundId,
    old_value: round,
  })

  revalidatePath('/admin/rounds')
  return { success: true }
}

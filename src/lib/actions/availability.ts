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

export async function setDeclaredGolfer(roundId: string, teamId: string, golferId: string) {
  const { supabase, user } = await getAuthenticatedUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // Non-admins can only declare for their own team
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return { error: 'You can only declare golfers for your own team' }
    }
  }

  const { error } = await supabase
    .from('round_team_declarations')
    .upsert(
      {
        round_id: roundId,
        team_id: teamId,
        declared_golfer_id: golferId,
        declared_by: user.id,
        declared_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,team_id' }
    )

  if (error) {
    return { error: error.message }
  }

  // Sync round_availability: mark declared golfer 'in', all other team members 'out'
  const { data: teamAvailability } = await supabase
    .from('round_availability')
    .select('id, user_id')
    .eq('round_id', roundId)
    .eq('team_id', teamId)

  if (teamAvailability) {
    for (const avail of teamAvailability) {
      await supabase
        .from('round_availability')
        .update({
          status: avail.user_id === golferId ? 'in' : 'out',
          declared_at: new Date().toISOString(),
          declared_by: user.id,
        })
        .eq('id', avail.id)
    }
  }

  revalidatePath(`/rounds/${roundId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function declareAvailability(roundId: string, status: 'in' | 'out') {
  const { supabase, user } = await getAuthenticatedUser()

  // Block declarations once the round has started
  const { data: round } = await supabase
    .from('rounds')
    .select('status')
    .eq('id', roundId)
    .single()

  if (round && ['in_progress', 'scoring', 'completed', 'cancelled'].includes(round.status)) {
    return { error: 'Cannot declare availability after the round has started' }
  }

  // Get user's team for this round
  const { data: availability } = await supabase
    .from('round_availability')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .single()

  if (!availability) {
    return { error: 'Availability record not found' }
  }

  const { error } = await supabase
    .from('round_availability')
    .update({
      status,
      declared_at: new Date().toISOString(),
      declared_by: user.id,
    })
    .eq('id', availability.id)

  if (error) {
    return { error: error.message }
  }

  // If declaring "in", automatically set as team's golfer
  // If declaring "out", clear team's declaration
  if (status === 'in') {
    const { error: declError } = await supabase
      .from('round_team_declarations')
      .upsert(
        {
          round_id: roundId,
          team_id: availability.team_id,
          declared_golfer_id: user.id,
          declared_by: user.id,
          declared_at: new Date().toISOString(),
        },
        { onConflict: 'round_id,team_id' }
      )

    if (declError) {
      return { error: `Availability updated but failed to set team golfer: ${declError.message}` }
    }
  } else if (status === 'out') {
    // Clear the team's declaration if this user was the declared golfer
    await supabase
      .from('round_team_declarations')
      .delete()
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('declared_golfer_id', user.id)
  }

  revalidatePath(`/availability/${roundId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/rounds/${roundId}`)

  redirect('/dashboard?declared=true')
}

export async function setMyAvailability(roundId: string, status: 'in' | 'out') {
  const { supabase, user } = await getAuthenticatedUser()

  let { data: availability } = await supabase
    .from('round_availability')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .single()

  // Record may not exist if user was added to a team after the round was created
  if (!availability) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return { error: 'You are not a member of any team' }
    }

    const { data: created, error: insertError } = await supabase
      .from('round_availability')
      .insert({ round_id: roundId, user_id: user.id, team_id: membership.team_id, status: 'undeclared' })
      .select()
      .single()

    if (insertError) return { error: insertError.message }
    availability = created
  }

  const { error } = await supabase
    .from('round_availability')
    .update({ status, declared_at: new Date().toISOString(), declared_by: user.id })
    .eq('id', availability.id)

  if (error) return { error: error.message }

  if (status === 'in') {
    await supabase.from('round_team_declarations').upsert(
      {
        round_id: roundId,
        team_id: availability.team_id,
        declared_golfer_id: user.id,
        declared_by: user.id,
        declared_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,team_id' }
    )
  } else {
    await supabase
      .from('round_team_declarations')
      .delete()
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('declared_golfer_id', user.id)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/availability/${roundId}`)
  revalidatePath(`/rounds/${roundId}`)
  return { success: true }
}

export async function adminOverrideAvailability(availabilityId: string, status: 'in' | 'out') {
  const { supabase, user } = await getAuthenticatedUser()

  // Check admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('round_availability')
    .update({
      status,
      declared_at: new Date().toISOString(),
      declared_by: user.id,
    })
    .eq('id', availabilityId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/rounds')
  revalidatePath('/dashboard')
  return { success: true }
}

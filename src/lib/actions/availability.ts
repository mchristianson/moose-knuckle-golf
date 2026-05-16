'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getViewerContext } from '@/lib/viewer'

// Returns the effective user (impersonated if applicable) for user-facing mutations.
// realUserId is preserved for audit fields like declared_by/submitted_by.
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

export async function setDeclaredGolfer(roundId: string, teamId: string, golferId: string) {
  const { supabase, userId, realUserId } = await getEffectiveUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    // Non-admins can only declare for their own team
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
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
        declared_by: realUserId,
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

  const updatedUserIds = new Set<string>()
  if (teamAvailability) {
    for (const avail of teamAvailability) {
      await supabase
        .from('round_availability')
        .update({
          status: avail.user_id === golferId ? 'in' : 'out',
          declared_at: new Date().toISOString(),
          declared_by: realUserId,
        })
        .eq('id', avail.id)
      updatedUserIds.add(avail.user_id)
    }
  }

  // If the declared golfer has no availability record yet, create one marked 'in'
  if (!updatedUserIds.has(golferId)) {
    await supabase.from('round_availability').insert({
      round_id: roundId,
      team_id: teamId,
      user_id: golferId,
      status: 'in',
      declared_at: new Date().toISOString(),
      declared_by: realUserId,
    })
  }

  revalidatePath(`/rounds/${roundId}`)
  revalidatePath('/dashboard')
  revalidatePath('/leaderboard')
  revalidatePath(`/admin/rounds/${roundId}`)
  return { success: true }
}

export async function declareAvailability(roundId: string, status: 'in' | 'out') {
  const { supabase, userId, realUserId } = await getEffectiveUser()

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
    .eq('user_id', userId)
    .single()

  if (!availability) {
    return { error: 'Availability record not found' }
  }

  const { error } = await supabase
    .from('round_availability')
    .update({
      status,
      declared_at: new Date().toISOString(),
      declared_by: realUserId,
    })
    .eq('id', availability.id)

  if (error) {
    return { error: error.message }
  }

  // Auto-manage team declaration based on availability
  if (status === 'in') {
    // Check if any other team members are marked "in"
    const { data: otherInMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')
      .neq('user_id', userId)

    // Only auto-declare if this user is the only one marked "in"
    if (!otherInMembers || otherInMembers.length === 0) {
      const { error: declError } = await supabase
        .from('round_team_declarations')
        .upsert(
          {
            round_id: roundId,
            team_id: availability.team_id,
            declared_golfer_id: userId,
            declared_by: realUserId,
            declared_at: new Date().toISOString(),
          },
          { onConflict: 'round_id,team_id' }
        )

      if (declError) {
        return { error: `Availability updated but failed to set team golfer: ${declError.message}` }
      }
    }
  } else if (status === 'out') {
    // Check how many team members are still marked "in"
    const { data: inMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')

    // Clear the team's declaration if no one is marked "in", or if this user was the only one
    if (!inMembers || inMembers.length === 0) {
      await supabase
        .from('round_team_declarations')
        .delete()
        .eq('round_id', roundId)
        .eq('team_id', availability.team_id)
    } else if (inMembers.length === 1) {
      // If exactly one person is still "in", make them the declared golfer
      const { error: declError } = await supabase
        .from('round_team_declarations')
        .upsert(
          {
            round_id: roundId,
            team_id: availability.team_id,
            declared_golfer_id: inMembers[0].user_id,
            declared_by: realUserId,
            declared_at: new Date().toISOString(),
          },
          { onConflict: 'round_id,team_id' }
        )

      if (declError) {
        return { error: `Declaration update failed: ${declError.message}` }
      }
    }
  }

  revalidatePath(`/availability/${roundId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/rounds/${roundId}`)

  redirect('/dashboard?declared=true')
}

export async function setMyAvailability(roundId: string, status: 'in' | 'out') {
  const { supabase, userId, realUserId } = await getEffectiveUser()

  let { data: availability } = await supabase
    .from('round_availability')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', userId)
    .single()

  // Record may not exist if user was added to a team after the round was created
  if (!availability) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return { error: 'You are not a member of any team' }
    }

    const { data: created, error: insertError } = await supabase
      .from('round_availability')
      .insert({ round_id: roundId, user_id: userId, team_id: membership.team_id, status: 'undeclared' })
      .select()
      .single()

    if (insertError) return { error: insertError.message }
    availability = created
  }

  const { error } = await supabase
    .from('round_availability')
    .update({ status, declared_at: new Date().toISOString(), declared_by: realUserId })
    .eq('id', availability.id)

  if (error) return { error: error.message }

  // Auto-manage team declaration based on availability
  if (status === 'in') {
    // Check if any other team members are marked "in"
    const { data: otherInMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')
      .neq('user_id', userId)

    // Only auto-declare if this user is the only one marked "in"
    if (!otherInMembers || otherInMembers.length === 0) {
      await supabase.from('round_team_declarations').upsert(
        {
          round_id: roundId,
          team_id: availability.team_id,
          declared_golfer_id: userId,
          declared_by: realUserId,
          declared_at: new Date().toISOString(),
        },
        { onConflict: 'round_id,team_id' }
      )
    }
  } else {
    // Check how many team members are still marked "in"
    const { data: inMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')

    // Clear the team's declaration if no one is marked "in", or if this user was the only one
    if (!inMembers || inMembers.length === 0) {
      await supabase
        .from('round_team_declarations')
        .delete()
        .eq('round_id', roundId)
        .eq('team_id', availability.team_id)
    } else if (inMembers.length === 1) {
      // If exactly one person is still "in", make them the declared golfer
      await supabase.from('round_team_declarations').upsert(
        {
          round_id: roundId,
          team_id: availability.team_id,
          declared_golfer_id: inMembers[0].user_id,
          declared_by: realUserId,
          declared_at: new Date().toISOString(),
        },
        { onConflict: 'round_id,team_id' }
      )
    }
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

  // Get the availability record to know which round and team
  const { data: availability } = await supabase
    .from('round_availability')
    .select('round_id, team_id, user_id')
    .eq('id', availabilityId)
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
    .eq('id', availabilityId)

  if (error) {
    return { error: error.message }
  }

  // Auto-manage team declaration based on updated availability
  if (status === 'in') {
    // Check if any other team members are marked "in"
    const { data: otherInMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', availability.round_id)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')
      .neq('user_id', availability.user_id)

    // Only auto-declare if this user is the only one marked "in"
    if (!otherInMembers || otherInMembers.length === 0) {
      await supabase.from('round_team_declarations').upsert(
        {
          round_id: availability.round_id,
          team_id: availability.team_id,
          declared_golfer_id: availability.user_id,
          declared_by: user.id,
          declared_at: new Date().toISOString(),
        },
        { onConflict: 'round_id,team_id' }
      )
    }
  } else {
    // Check how many team members are still marked "in"
    const { data: inMembers } = await supabase
      .from('round_availability')
      .select('user_id')
      .eq('round_id', availability.round_id)
      .eq('team_id', availability.team_id)
      .eq('status', 'in')

    // Clear the team's declaration if no one is marked "in"
    if (!inMembers || inMembers.length === 0) {
      await supabase
        .from('round_team_declarations')
        .delete()
        .eq('round_id', availability.round_id)
        .eq('team_id', availability.team_id)
    } else if (inMembers.length === 1) {
      // If exactly one person is still "in", make them the declared golfer
      await supabase.from('round_team_declarations').upsert(
        {
          round_id: availability.round_id,
          team_id: availability.team_id,
          declared_golfer_id: inMembers[0].user_id,
          declared_by: user.id,
          declared_at: new Date().toISOString(),
        },
        { onConflict: 'round_id,team_id' }
      )
    }
  }

  revalidatePath('/admin/rounds')
  revalidatePath('/dashboard')
  return { success: true }
}

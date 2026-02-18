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

  revalidatePath(`/availability/${roundId}`)
  revalidatePath('/dashboard')
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
  return { success: true }
}

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

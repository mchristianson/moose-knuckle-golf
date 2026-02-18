'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

export async function createSub(prevState: any, formData: FormData) {
  try {
    const { supabase, user } = await getAdminUser()

    const fullName = formData.get('full_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string | null

    if (!fullName || !email) {
      return { error: 'Name and email are required' }
    }

    // Create the sub
    const { data: sub, error: subError } = await supabase
      .from('subs')
      .insert({
        full_name: fullName,
        email: email,
        phone: phone || null,
        is_active: true,
      })
      .select('*')
      .single()

    if (subError) {
      return { error: `Failed to create sub: ${subError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'create_sub',
      entity_type: 'subs',
      entity_id: sub.id,
      new_value: sub,
      metadata: { email },
    })

    return { success: true, data: sub }
  } catch (error) {
    return { error: 'Failed to create sub' }
  }
}

export async function updateSub(subId: string, data: Record<string, any>) {
  try {
    const { supabase, user } = await getAdminUser()

    // Get the old value for audit
    const { data: oldSub } = await supabase
      .from('subs')
      .select('*')
      .eq('id', subId)
      .single()

    // Update the sub
    const { data: updatedSub, error: updateError } = await supabase
      .from('subs')
      .update(data)
      .eq('id', subId)
      .select('*')
      .single()

    if (updateError) {
      return { error: `Failed to update sub: ${updateError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'update_sub',
      entity_type: 'subs',
      entity_id: subId,
      old_value: oldSub,
      new_value: updatedSub,
      metadata: { updated_fields: Object.keys(data) },
    })

    return { success: true, data: updatedSub }
  } catch (error) {
    return { error: 'Failed to update sub' }
  }
}

export async function toggleSubActive(subId: string, isActive: boolean) {
  try {
    const { supabase, user } = await getAdminUser()

    // Get the old value for audit
    const { data: oldSub } = await supabase
      .from('subs')
      .select('*')
      .eq('id', subId)
      .single()

    // Update the sub
    const { data: updatedSub, error: updateError } = await supabase
      .from('subs')
      .update({ is_active: isActive })
      .eq('id', subId)
      .select('*')
      .single()

    if (updateError) {
      return { error: `Failed to update sub status: ${updateError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'toggle_sub_active',
      entity_type: 'subs',
      entity_id: subId,
      old_value: oldSub,
      new_value: updatedSub,
      metadata: { is_active: isActive },
    })

    return { success: true, data: updatedSub }
  } catch (error) {
    return { error: 'Failed to toggle sub status' }
  }
}

export async function deleteSub(subId: string) {
  try {
    const { supabase, user } = await getAdminUser()

    // Get the sub for audit
    const { data: sub } = await supabase
      .from('subs')
      .select('*')
      .eq('id', subId)
      .single()

    // Delete the sub
    const { error: deleteError } = await supabase
      .from('subs')
      .delete()
      .eq('id', subId)

    if (deleteError) {
      return { error: `Failed to delete sub: ${deleteError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'delete_sub',
      entity_type: 'subs',
      entity_id: subId,
      old_value: sub,
      metadata: { deleted: true },
    })

    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete sub' }
  }
}

// Request a sub for a specific round and team
export async function requestSub(
  roundId: string,
  teamId: string,
  subId: string,
  notes?: string
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'You must be logged in' }
    }

    // Check if round exists
    const { data: round } = await supabase
      .from('rounds')
      .select('id')
      .eq('id', roundId)
      .single()

    if (!round) {
      return { error: 'Round not found' }
    }

    // Create the sub request
    const { data: request, error: requestError } = await supabase
      .from('round_subs')
      .insert({
        round_id: roundId,
        sub_id: subId,
        team_id: teamId,
        requested_by: user.id,
        status: 'pending',
        notes,
      })
      .select('*')
      .single()

    if (requestError) {
      return { error: `Failed to request sub: ${requestError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'request_sub',
      entity_type: 'round_subs',
      entity_id: request.id,
      new_value: request,
      metadata: { round_id: roundId, team_id: teamId, sub_id: subId },
    })

    return { success: true, data: request }
  } catch (error) {
    return { error: 'Failed to request sub' }
  }
}

// Admin approval/decline of sub request
export async function approveSub(requestId: string, approved: boolean) {
  try {
    const { supabase, user } = await getAdminUser()

    const status = approved ? 'approved' : 'declined'

    // Get the old value for audit
    const { data: oldRequest } = await supabase
      .from('round_subs')
      .select('*')
      .eq('id', requestId)
      .single()

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('round_subs')
      .update({ status })
      .eq('id', requestId)
      .select('*')
      .single()

    if (updateError) {
      return { error: `Failed to update sub request: ${updateError.message}` }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: `${approved ? 'approve' : 'decline'}_sub`,
      entity_type: 'round_subs',
      entity_id: requestId,
      old_value: oldRequest,
      new_value: updatedRequest,
      metadata: { status },
    })

    return { success: true, data: updatedRequest }
  } catch (error) {
    return { error: 'Failed to update sub request' }
  }
}

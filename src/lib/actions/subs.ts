'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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

export interface SubOption {
  /** The subs.id value (always present once resolved) */
  subId: string
  /** Display name */
  name: string
  /** Whether this person is from the subs pool ('sub') or a registered league user ('user') */
  source: 'sub' | 'user'
  /** The users.id for registered users, null for pure subs */
  userId: string | null
}

/**
 * Returns a combined, deduplicated list of sub candidates:
 * - Active entries from the subs pool
 * - All registered league users (those with a users row)
 * Registered users that already have a subs row are unified.
 */
export async function getSubOptions(): Promise<{ data?: SubOption[]; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch active subs pool entries
    const { data: subsRows, error: subsError } = await supabase
      .from('subs')
      .select('id, full_name, user_id')
      .eq('is_active', true)
      .order('full_name')

    if (subsError) {
      return { error: `Failed to fetch subs: ${subsError.message}` }
    }

    // Fetch all registered users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .order('full_name')

    if (usersError) {
      return { error: `Failed to fetch users: ${usersError.message}` }
    }

    // Build a set of user_ids that already have a subs row
    const subsRowByUserId = new Map<string, string>()
    for (const s of subsRows ?? []) {
      if (s.user_id) subsRowByUserId.set(s.user_id, s.id)
    }

    const options: SubOption[] = []

    // Add all subs pool entries
    for (const s of subsRows ?? []) {
      options.push({
        subId: s.id,
        name: s.full_name,
        source: 'sub',
        userId: s.user_id ?? null,
      })
    }

    // Add registered users not already represented as subs
    for (const u of users ?? []) {
      if (!subsRowByUserId.has(u.id)) {
        options.push({
          subId: '', // will be resolved on assignment
          name: u.full_name,
          source: 'user',
          userId: u.id,
        })
      }
    }

    return { data: options }
  } catch {
    return { error: 'Failed to load sub options' }
  }
}

/**
 * Admin action: mark all team members as 'out' for a round and assign a sub.
 * If subId is null, removes the assignment and resets availability to 'undeclared'.
 *
 * For registered users (source === 'user'), a subs row is created on-the-fly
 * if one doesn't already exist.
 */
export async function assignSubToTeam(
  roundId: string,
  teamId: string,
  subId: string | null,
  userId: string | null, // the users.id when the sub is a registered league member
  remove = false
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAdminUser()

    if (remove) {
      // --- Remove assignment ---
      // Delete the round_subs row
      await supabase
        .from('round_subs')
        .delete()
        .eq('round_id', roundId)
        .eq('team_id', teamId)

      // Reset availability to undeclared
      await supabase
        .from('round_availability')
        .update({
          status: 'undeclared',
          declared_at: new Date().toISOString(),
          declared_by: user.id,
        })
        .eq('round_id', roundId)
        .eq('team_id', teamId)

      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'remove_sub_from_team',
        entity_type: 'round_subs',
        entity_id: roundId,
        metadata: { round_id: roundId, team_id: teamId },
      })

      revalidatePath(`/admin/rounds/${roundId}`)
      return { success: true }
    }

    // --- Assign sub ---
    // If this is a registered user without a subs row, create one
    let resolvedSubId = subId
    if (!subId && userId) {
      // Check if a subs row already exists for this user
      const { data: existingSub } = await supabase
        .from('subs')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingSub) {
        resolvedSubId = existingSub.id
      } else {
        // Fetch user details to create the subs row
        const { data: userRow } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userId)
          .single()

        if (!userRow) {
          return { error: 'User not found' }
        }

        const { data: newSub, error: createError } = await supabase
          .from('subs')
          .insert({
            full_name: userRow.full_name,
            email: userRow.email,
            is_active: true,
            user_id: userId,
          })
          .select('id')
          .single()

        if (createError || !newSub) {
          return { error: `Failed to create sub record: ${createError?.message}` }
        }

        resolvedSubId = newSub.id
      }
    }

    if (!resolvedSubId) {
      return { error: 'Could not resolve sub ID' }
    }

    // Mark all team members as 'out'
    await supabase
      .from('round_availability')
      .update({
        status: 'out',
        declared_at: new Date().toISOString(),
        declared_by: user.id,
      })
      .eq('round_id', roundId)
      .eq('team_id', teamId)

    // Remove any existing declaration for this team/round
    await supabase
      .from('round_team_declarations')
      .delete()
      .eq('round_id', roundId)
      .eq('team_id', teamId)

    // Delete any existing round_subs row for this team/round, then insert fresh.
    // (round_subs has UNIQUE(round_id, team_id) so delete+insert is the
    // simplest way to replace a prior assignment regardless of which sub it was.)
    await supabase
      .from('round_subs')
      .delete()
      .eq('round_id', roundId)
      .eq('team_id', teamId)

    const { error: insertError } = await supabase
      .from('round_subs')
      .insert({
        round_id: roundId,
        team_id: teamId,
        sub_id: resolvedSubId,
        requested_by: user.id,
        approved_by: user.id,
        status: 'approved',
      })

    if (insertError) {
      return { error: `Failed to assign sub: ${insertError.message}` }
    }

    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'assign_sub_to_team',
      entity_type: 'round_subs',
      entity_id: roundId,
      metadata: { round_id: roundId, team_id: teamId, sub_id: resolvedSubId },
    })

    revalidatePath(`/admin/rounds/${roundId}`)
    return { success: true }
  } catch (err) {
    return { error: 'Failed to assign sub' }
  }
}

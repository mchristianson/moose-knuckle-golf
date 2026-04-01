'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
  const { supabase, user } = await getAdminUser()

  // Prevent removing your own admin access
  if (userId === user.id) {
    return { error: 'You cannot remove your own admin access' }
  }

  const newIsAdmin = !currentIsAdmin

  const { error } = await supabase
    .from('users')
    .update({ is_admin: newIsAdmin })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: newIsAdmin ? 'admin_granted' : 'admin_revoked',
    entity_type: 'user',
    entity_id: userId,
    old_value: { is_admin: currentIsAdmin },
    new_value: { is_admin: newIsAdmin },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deactivateUser(userId: string) {
  const { supabase, user } = await getAdminUser()

  // Prevent deactivating yourself
  if (userId === user.id) {
    return { error: 'You cannot deactivate your own account' }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'user_deactivated',
    entity_type: 'user',
    entity_id: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserPhone(userId: string, phone: string) {
  await getAdminUser() // verify caller is admin

  // Convert 10-digit input to E.164, or null to clear
  const digits = phone.replace(/\D/g, '').slice(-10)
  const e164 = digits.length === 10 ? `+1${digits}` : null

  const admin = createAdminClient()

  // 1. Update public.users.phone (used by sendPhoneOtp gate check)
  const { error: profileError } = await admin
    .from('users')
    .update({ phone: e164 })
    .eq('id', userId)

  if (profileError) {
    return { error: profileError.message }
  }

  // 2. Update auth.users.phone so Supabase OTP finds the existing user
  //    instead of trying to create a new one (which would fire the trigger
  //    and fail with "Database error saving new user").
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    phone: e164 ?? '',
  })

  if (authError) {
    return { error: `Auth update failed: ${authError.message}` }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function activateUser(userId: string) {
  const { supabase, user } = await getAdminUser()

  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'user_activated',
    entity_type: 'user',
    entity_id: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

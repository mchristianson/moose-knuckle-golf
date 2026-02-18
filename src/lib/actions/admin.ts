'use server'

import { revalidatePath } from 'next/cache'
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

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IMPERSONATION_COOKIE } from '@/lib/viewer'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return { supabase, userId: user.id }
}

export async function startImpersonation(targetUserId: string) {
  const { supabase, userId: adminId } = await verifyAdmin()

  const adminDb = createAdminClient()
  const { data: target } = await adminDb
    .from('users')
    .select('id, full_name')
    .eq('id', targetUserId)
    .single()

  if (!target) return { error: 'User not found' }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
  })

  await supabase.from('audit_log').insert({
    user_id: adminId,
    action: 'impersonation_started',
    entity_type: 'user',
    entity_id: targetUserId,
    metadata: {
      real_admin_id: adminId,
      impersonated_user_id: targetUserId,
      impersonated_user_name: target.full_name,
    },
  })

  redirect('/dashboard')
}

export async function stopImpersonation() {
  const { supabase, userId: adminId } = await verifyAdmin()

  const cookieStore = await cookies()
  const current = cookieStore.get(IMPERSONATION_COOKIE)

  if (current?.value) {
    await supabase.from('audit_log').insert({
      user_id: adminId,
      action: 'impersonation_stopped',
      entity_type: 'user',
      entity_id: current.value,
      metadata: {
        real_admin_id: adminId,
        impersonated_user_id: current.value,
      },
    })

    cookieStore.delete(IMPERSONATION_COOKIE)
  }

  redirect('/admin/users')
}

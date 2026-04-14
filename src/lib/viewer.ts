import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const IMPERSONATION_COOKIE = 'mgk_impersonate'

export type ViewerContext = {
  effectiveUserId: string
  effectiveProfile: Record<string, any>
  isImpersonating: boolean
  realUserId: string
  db: any // SupabaseClient — admin client when impersonating, regular client when not
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const supabase = await createClient()
  const { data: { user: realUser } } = await supabase.auth.getUser()
  if (!realUser) return null

  const cookieStore = await cookies()
  const impersonateCookie = cookieStore.get(IMPERSONATION_COOKIE)

  if (!impersonateCookie?.value) {
    const { data: profile } = await supabase.from('users').select('*').eq('id', realUser.id).single()
    return {
      effectiveUserId: realUser.id,
      effectiveProfile: profile,
      isImpersonating: false,
      realUserId: realUser.id,
      db: supabase,
    }
  }

  // Verify real user is still an admin before trusting the cookie
  const { data: adminCheck } = await supabase.from('users').select('is_admin').eq('id', realUser.id).single()
  if (!adminCheck?.is_admin) {
    // Real user is no longer admin — ignore the cookie, fall back to real user
    const { data: profile } = await supabase.from('users').select('*').eq('id', realUser.id).single()
    return {
      effectiveUserId: realUser.id,
      effectiveProfile: profile,
      isImpersonating: false,
      realUserId: realUser.id,
      db: supabase,
    }
  }

  const targetUserId = impersonateCookie.value
  const adminDb = createAdminClient()
  const { data: targetProfile } = await adminDb.from('users').select('*').eq('id', targetUserId).single()

  if (!targetProfile) {
    // Target user not found — fall back to real user
    const { data: profile } = await supabase.from('users').select('*').eq('id', realUser.id).single()
    return {
      effectiveUserId: realUser.id,
      effectiveProfile: profile,
      isImpersonating: false,
      realUserId: realUser.id,
      db: supabase,
    }
  }

  return {
    effectiveUserId: targetUserId,
    effectiveProfile: targetProfile,
    isImpersonating: true,
    realUserId: realUser.id,
    db: adminDb,
  }
}

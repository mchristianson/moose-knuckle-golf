import { createClient, type User } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export function createSupabaseWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )
}

type BearerAuthSuccess = {
  supabase: ReturnType<typeof createSupabaseWithToken>
  user: User
  error?: undefined
}
type BearerAuthFailure = {
  supabase?: undefined
  user?: undefined
  error: Response
}

// Shared auth check for /api/mobile/* routes: validates the Bearer token against
// Supabase Auth and returns a token-scoped client so RLS still applies as a backstop.
export async function getBearerUser(request: NextRequest): Promise<BearerAuthSuccess | BearerAuthFailure> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { error: Response.json({ error: 'Missing authorization token' }, { status: 401 }) }
  }

  const supabase = createSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { supabase, user }
}

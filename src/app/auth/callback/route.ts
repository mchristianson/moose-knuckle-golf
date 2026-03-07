import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session - this creates a new user if email doesn't exist
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }

    if (data.user) {
      const admin = await createAdminClient()

      // Query database to find if another user with this email exists
      const { data: existingUsers } = await admin
        .from('users')
        .select('id, email')
        .eq('email', data.user.email)

      const existingUser = existingUsers?.[0]

      // If this is a duplicate email scenario (OAuth with existing password account)
      if (existingUser && existingUser.id !== data.user.id) {
        // Delete the duplicate user we just created
        try {
          await admin.auth.admin.deleteUser(data.user.id)

          // Redirect to login with a message about linking
          return NextResponse.redirect(
            `${origin}/login?duplicate_email=true&email=${encodeURIComponent(data.user.email || '')}`
          )
        } catch (error) {
          console.error('Error handling duplicate account:', error)
          // Fall through to normal redirect on error
        }
      }
    }

    // User profile is automatically created by database trigger
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`)
}

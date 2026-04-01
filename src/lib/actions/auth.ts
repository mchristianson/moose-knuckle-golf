'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { phoneSchema, otpSchema } from '@/lib/validators/auth'

export async function sendPhoneOtp(prevState: { error: string | null }, formData: FormData) {
  const validation = phoneSchema.safeParse({ phone: formData.get('phone') as string })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const e164Phone = `+1${validation.data.phone}`

  // Gate: only send OTP to pre-registered league members.
  // Admin client required — anon role cannot read public.users.
  const admin = createAdminClient()
  const { data, error: lookupError } = await admin
    .from('users')
    .select('id')
    .eq('phone', e164Phone)
    .limit(1)

  if (lookupError) {
    console.error('Phone lookup error:', lookupError)
    return { error: 'Unable to verify phone number. Please try again.' }
  }

  if (!data || data.length === 0) {
    return { error: 'Phone number not registered in this league.' }
  }

  // Ensure auth.users has the phone number set for this user's existing account.
  // Without this, signInWithOtp tries to create a new auth user, which fails
  // because the handle_new_user trigger requires a non-null email.
  const userId = data[0].id
  const { error: phoneUpdateError } = await admin.auth.admin.updateUserById(userId, {
    phone: e164Phone,
  })

  if (phoneUpdateError) {
    console.error('Auth phone update error:', phoneUpdateError)
    return { error: 'Unable to set up phone login. Please contact an admin.' }
  }

  const supabase = await createClient()
  const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164Phone })

  if (otpError) {
    console.error('OTP send error:', otpError)
    return { error: 'Failed to send verification code. Please try again.' }
  }

  return { error: null } // null = success signal to client state machine
}

export async function verifyPhoneOtp(prevState: { error: string | null }, formData: FormData) {
  const validation = otpSchema.safeParse({
    phone: formData.get('phone') as string,
    token: formData.get('token') as string,
  })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    phone: `+1${validation.data.phone}`,
    token: validation.data.token,
    type: 'sms',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/leaderboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Google sign-in error:', error.message)
    redirect('/login?error=google_signin_failed')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function linkGoogleAccount() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL

  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${origin}/profile?linked=true`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function unlinkGoogleAccount() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  // Find the Google identity
  const googleIdentity = user.identities?.find(id => id.provider === 'google')

  if (!googleIdentity) {
    return { error: 'Google account not linked' }
  }

  const { error } = await supabase.auth.unlinkIdentity(googleIdentity)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

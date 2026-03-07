'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema } from '@/lib/validators/auth'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validation = loginSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const data = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validation = registerSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // User profile is automatically created by database trigger
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

  // Supabase requires using unlinkIdentity (which will be available in newer versions)
  // For now, we'll need to use the identity data to unlink
  const { error } = await supabase.auth.unlinkIdentity(googleIdentity)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function updateAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file selected' }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Image must be under 5 MB' }
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Append cache-busting timestamp so Next.js Image cache invalidates
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: urlWithBust })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { url: urlWithBust }
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Try removing all known extensions
  for (const ext of ['jpg', 'png', 'webp', 'gif']) {
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.${ext}`])
  }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return {}
}

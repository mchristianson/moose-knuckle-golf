'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { linkGoogleAccount, unlinkGoogleAccount } from '@/lib/actions/auth'
import { updateAvatar, removeAvatar } from '@/lib/actions/profile'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('users')
        .select('full_name, display_name, avatar_url')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setAvatarUrl(profileData?.avatar_url ?? null)
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return <div className="p-4 text-zinc-400">Loading...</div>
  }

  if (!user) {
    return <div className="p-4 text-zinc-400">Not authenticated</div>
  }

  const hasPhone = user.identities?.some((id: any) => id.provider === 'phone')
  const hasGoogle = user.identities?.some((id: any) => id.provider === 'google')
  const displayName = profile?.display_name ?? profile?.full_name ?? 'Golfer'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    setAvatarError(null)

    const formData = new FormData()
    formData.append('avatar', file)

    const result = await updateAvatar(formData)
    setAvatarUploading(false)

    if (result.error) {
      setAvatarError(result.error)
    } else {
      setAvatarUrl(result.url ?? null)
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true)
    setAvatarError(null)
    const result = await removeAvatar()
    setAvatarUploading(false)
    if (result.error) {
      setAvatarError(result.error)
    } else {
      setAvatarUrl(null)
    }
  }

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount()
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account')
    }
  }

  const handleUnlinkGoogle = async () => {
    setUnlinking(true)
    setError(null)
    const result = await unlinkGoogleAccount()
    if (result.error) {
      setError(result.error)
      setUnlinking(false)
    } else {
      const supabase = createClient()
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      setUser(updatedUser)
      setUnlinking(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-white text-2xl font-bold mb-6">Profile</h1>

      {/* Avatar section */}
      <Card variant="elevated" className="mb-6 bg-zinc-800 border-zinc-700">
        <div className="flex items-center gap-4">
          {/* Avatar preview */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-white text-2xl font-bold">{getInitials(displayName)}</span>
              )}
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{displayName}</p>
            <p className="text-zinc-400 text-sm mb-3">{user.email}</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm font-medium bg-zinc-700 text-zinc-100 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                {avatarUrl ? 'Change photo' : 'Upload photo'}
              </label>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>
            {avatarError && (
              <p className="text-red-400 text-xs mt-1">{avatarError}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Email */}
      <Card variant="elevated" className="mb-6 bg-zinc-800 border-zinc-700">
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Email</h2>
          <p className="text-white">{user.email}</p>
        </div>
      </Card>

      {/* Authentication Methods */}
      <Card variant="elevated" className="mb-6 bg-zinc-800 border-zinc-700">
        <h2 className="text-white font-semibold mb-4">Sign-in Methods</h2>

        <div className="flex items-center justify-between py-3 border-b border-zinc-700">
          <div>
            <p className="text-white font-medium">Phone (SMS)</p>
            <p className="text-sm text-zinc-400">{hasPhone ? 'Active' : 'Not set up'}</p>
          </div>
          {hasPhone && <span className="text-green-500 text-sm font-medium">✓</span>}
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-white font-medium">Google</p>
            <p className="text-sm text-zinc-400">{hasGoogle ? 'Linked' : 'Not linked'}</p>
          </div>
          {hasGoogle && <span className="text-green-500 text-sm font-medium">✓</span>}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="default" className="mb-6 bg-red-900/30 border-red-700">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Google link/unlink */}
      <div className="space-y-3">
        {!hasGoogle ? (
          <Button onClick={handleLinkGoogle} variant="primary" className="w-full">
            Link Google Account
          </Button>
        ) : (
          <Button
            onClick={handleUnlinkGoogle}
            variant="danger"
            disabled={unlinking || !hasPhone}
            className="w-full"
          >
            {unlinking ? 'Unlinking...' : 'Unlink Google Account'}
          </Button>
        )}
      </div>

      {hasGoogle && !hasPhone && (
        <p className="text-xs text-zinc-500 mt-4 text-center">
          You can&apos;t unlink your only sign-in method.
        </p>
      )}
    </div>
  )
}

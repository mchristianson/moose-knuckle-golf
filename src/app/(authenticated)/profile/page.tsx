'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { linkGoogleAccount, unlinkGoogleAccount } from '@/lib/actions/auth'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user and their identities
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user) {
    return <div className="p-4">Not authenticated</div>
  }

  const hasPassword = user.identities?.some((id: any) => id.provider === 'password')
  const hasGoogle = user.identities?.some((id: any) => id.provider === 'google')

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount()
    } catch (err: any) {
      // linkGoogleAccount redirects on success, so if we catch an error it's a failure
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
      // Refresh the user data
      const supabase = createClient()
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      setUser(updatedUser)
      setUnlinking(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Email */}
      <Card variant="elevated" className="mb-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Email</h2>
          <p className="text-lg">{user.email}</p>
        </div>
      </Card>

      {/* Authentication Methods */}
      <Card variant="elevated" className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Sign-in Methods</h2>

        {/* Password */}
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium">Password</p>
            <p className="text-sm text-gray-600">
              {hasPassword ? '✓ Active' : 'Not set up'}
            </p>
          </div>
          {hasPassword && <span className="text-green-600">✓</span>}
        </div>

        {/* Google */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Google</p>
            <p className="text-sm text-gray-600">
              {hasGoogle ? '✓ Linked' : 'Not linked'}
            </p>
          </div>
          {hasGoogle && <span className="text-green-600">✓</span>}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="default" className="mb-6 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!hasGoogle ? (
          <Button
            onClick={handleLinkGoogle}
            variant="primary"
            className="w-full"
          >
            Link Google Account
          </Button>
        ) : (
          <Button
            onClick={handleUnlinkGoogle}
            variant="danger"
            disabled={unlinking || !hasPassword}
            className="w-full"
          >
            {unlinking ? 'Unlinking...' : 'Unlink Google Account'}
          </Button>
        )}
      </div>

      {hasGoogle && !hasPassword && (
        <p className="text-xs text-gray-600 mt-4 text-center">
          You can't unlink your only sign-in method. Set up a password first.
        </p>
      )}
    </div>
  )
}

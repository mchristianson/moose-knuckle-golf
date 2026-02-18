'use client'

import { signout } from '@/lib/actions/auth'

export function SignOutButton() {
  return (
    <form action={signout}>
      <button
        type="submit"
        className="text-sm text-gray-700 hover:text-green-600"
      >
        Sign Out
      </button>
    </form>
  )
}

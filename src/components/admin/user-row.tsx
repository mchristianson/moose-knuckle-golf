'use client'

import { toggleAdmin, deactivateUser, activateUser } from '@/lib/actions/admin'
import { useState } from 'react'

interface UserRowProps {
  user: any
  isCurrentUser: boolean
}

export function UserRow({ user, isCurrentUser }: UserRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleAdmin = async () => {
    setIsLoading(true)
    const result = await toggleAdmin(user.id, user.is_admin)
    if (result?.error) {
      alert(result.error)
    }
    setIsLoading(false)
  }

  const handleToggleActive = async () => {
    setIsLoading(true)
    if (user.is_active) {
      const result = await deactivateUser(user.id)
      if (result?.error) {
        alert(result.error)
      }
    } else {
      const result = await activateUser(user.id)
      if (result?.error) {
        alert(result.error)
      }
    }
    setIsLoading(false)
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {user.full_name}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-gray-500">(You)</span>
          )}
        </div>
        {user.display_name && (
          <div className="text-sm text-gray-500">{user.display_name}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {user.is_active ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {user.is_admin ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Admin
          </span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Member
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={handleToggleAdmin}
          disabled={isLoading || isCurrentUser}
          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
        </button>
        <button
          onClick={handleToggleActive}
          disabled={isLoading || isCurrentUser}
          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  )
}

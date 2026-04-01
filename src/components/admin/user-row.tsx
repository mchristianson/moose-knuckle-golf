'use client'

import { toggleAdmin, deactivateUser, activateUser, updateUserPhone } from '@/lib/actions/admin'
import { useState } from 'react'

interface UserRowProps {
  user: any
  isCurrentUser: boolean
}

export function UserRow({ user, isCurrentUser }: UserRowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState(
    user.phone ? user.phone.replace('+1', '') : ''
  )
  const [phoneError, setPhoneError] = useState<string | null>(null)

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

  const handleSavePhone = async () => {
    setPhoneError(null)
    const digits = phoneInput.replace(/\D/g, '')
    if (digits.length !== 0 && digits.length !== 10) {
      setPhoneError('Must be 10 digits or empty')
      return
    }
    setIsLoading(true)
    const result = await updateUserPhone(user.id, digits)
    if (result?.error) {
      setPhoneError(result.error)
    } else {
      setEditingPhone(false)
    }
    setIsLoading(false)
  }

  const handleCancelPhone = () => {
    setPhoneInput(user.phone ? user.phone.replace('+1', '') : '')
    setPhoneError(null)
    setEditingPhone(false)
  }

  const displayPhone = user.phone
    ? user.phone.replace('+1', '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    : '—'

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
        {editingPhone ? (
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">+1</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="3334445555"
              className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button
              onClick={handleSavePhone}
              disabled={isLoading}
              className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={handleCancelPhone}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{displayPhone}</span>
            <button
              onClick={() => setEditingPhone(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Edit
            </button>
          </div>
        )}
        {phoneError && (
          <p className="text-xs text-red-600 mt-1">{phoneError}</p>
        )}
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

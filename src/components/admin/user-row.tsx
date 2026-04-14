'use client'

import { toggleAdmin, deactivateUser, activateUser, updateUserPhone, updateUserAvatarAsAdmin, removeUserAvatarAsAdmin } from '@/lib/actions/admin'
import { startImpersonation } from '@/lib/actions/impersonation'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface UserRowProps {
  user: any
  isCurrentUser: boolean
}

export function UserRow({ user, isCurrentUser }: UserRowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setIsLoading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    const result = await updateUserAvatarAsAdmin(user.id, fd)
    if (result.error) {
      setAvatarError(result.error)
    } else if (result.url) {
      setAvatarUrl(result.url)
    }
    setIsLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatarError(null)
    setIsLoading(true)
    const result = await removeUserAvatarAsAdmin(user.id)
    if (result.error) {
      setAvatarError(result.error)
    } else {
      setAvatarUrl(null)
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
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user.full_name ?? 'Avatar'}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {(user.full_name ?? '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.full_name}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-gray-500">(You)</span>
              )}
            </div>
            {user.display_name && (
              <div className="text-sm text-gray-500">{user.display_name}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {avatarUrl ? 'Change' : 'Upload'} photo
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isLoading}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            {avatarError && (
              <p className="text-xs text-red-600 mt-0.5">{avatarError}</p>
            )}
          </div>
        </div>
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
        <form action={startImpersonation.bind(null, user.id)} className="inline">
          <button
            type="submit"
            disabled={isLoading || isCurrentUser}
            className="text-amber-600 hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Impersonate
          </button>
        </form>
      </td>
    </tr>
  )
}

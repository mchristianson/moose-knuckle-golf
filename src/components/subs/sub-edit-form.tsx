'use client'

import { useState } from 'react'
import { updateSub } from '@/lib/actions/subs'

interface Sub {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_active: boolean
}

interface SubEditFormProps {
  sub: Sub
  onSuccess: () => void
}

export function SubEditForm({ sub, onSuccess }: SubEditFormProps) {
  const [formData, setFormData] = useState({
    full_name: sub.full_name,
    email: sub.email,
    phone: sub.phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await updateSub(sub.id, formData)
    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'Failed to update sub')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Phone (optional)"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onSuccess}
          className="bg-gray-400 text-white px-3 py-1 rounded-md hover:bg-gray-500 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

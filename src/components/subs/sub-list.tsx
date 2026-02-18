'use client'

import { useState } from 'react'
import { toggleSubActive, deleteSub } from '@/lib/actions/subs'
import { SubEditForm } from './sub-edit-form'

interface Sub {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_active: boolean
  created_at?: string
}

interface SubListProps {
  initialSubs: Sub[]
}

export function SubList({ initialSubs }: SubListProps) {
  const [subs, setSubs] = useState(initialSubs)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (sub: Sub) => {
    setLoading(sub.id)
    const result = await toggleSubActive(sub.id, !sub.is_active)
    if (result.success && result.data) {
      setSubs(subs.map((s) => (s.id === sub.id ? result.data : s)))
    } else {
      alert(result.error || 'Failed to update sub')
    }
    setLoading(null)
  }

  const handleDelete = async (subId: string) => {
    if (!confirm('Are you sure you want to delete this sub?')) return

    setLoading(subId)
    const result = await deleteSub(subId)
    if (result.success) {
      setSubs(subs.filter((s) => s.id !== subId))
    } else {
      alert(result.error || 'Failed to delete sub')
    }
    setLoading(null)
  }

  const handleUpdateSuccess = () => {
    setEditingId(null)
  }

  return (
    <div className="space-y-2">
      {subs.map((sub) => (
        <div key={sub.id}>
          {editingId === sub.id ? (
            <SubEditForm sub={sub} onSuccess={handleUpdateSuccess} />
          ) : (
            <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold">{sub.full_name}</div>
                <div className="text-sm text-gray-600">{sub.email}</div>
                {sub.phone && <div className="text-sm text-gray-600">{sub.phone}</div>}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sub.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sub.is_active ? 'Active' : 'Inactive'}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(sub.id)}
                    className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(sub)}
                    disabled={loading === sub.id}
                    className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    {loading === sub.id
                      ? 'Updating...'
                      : sub.is_active
                        ? 'Deactivate'
                        : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    disabled={loading === sub.id}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

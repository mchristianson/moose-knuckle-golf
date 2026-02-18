'use client'

import { useState } from 'react'
import { setHandicap } from '@/lib/actions/scores'

interface SetHandicapFormProps {
  userId: string
  currentHandicap: number
}

export function SetHandicapForm({ userId, currentHandicap }: SetHandicapFormProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentHandicap.toString())
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) {
      setError('Enter a valid handicap (0 or greater)')
      return
    }
    setLoading(true)
    setError(null)
    const result = await setHandicap(userId, num, reason) as any
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      setReason('')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Set
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 min-w-[160px]">
      <input
        type="number"
        step="0.1"
        min="0"
        max="54"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 border rounded px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoFocus
      />
      <input
        type="text"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={loading}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

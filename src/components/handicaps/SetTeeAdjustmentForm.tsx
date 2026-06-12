'use client'

import { useState } from 'react'
import { setTeeAdjustment } from '@/lib/actions/scores'

interface Props {
  userId: string
  currentAdjustment: number
}

export function SetTeeAdjustmentForm({ userId, currentAdjustment }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentAdjustment.toFixed(1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) {
      setError('Enter a valid adjustment (0 or greater)')
      return
    }
    setLoading(true)
    setError(null)
    const result = await setTeeAdjustment(userId, num) as any
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`text-xs underline ${currentAdjustment > 0 ? 'text-amber-600 hover:text-amber-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {currentAdjustment > 0 ? `+${currentAdjustment} tee adj` : 'Tee adj'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 min-w-[140px]">
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tee Adjustment (strokes)</label>
      <input
        type="number"
        step="0.5"
        min="0"
        max="10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 border rounded px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        autoFocus
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={loading}
          className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
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

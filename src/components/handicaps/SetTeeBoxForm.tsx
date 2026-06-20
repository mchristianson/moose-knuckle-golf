'use client'

import { useState } from 'react'
import { setTeeBox } from '@/lib/actions/scores'
import type { TeeBox } from '@/lib/constants/course'

interface Props {
  userId: string
  currentTeeBox: TeeBox
}

export function SetTeeBoxForm({ userId, currentTeeBox }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<TeeBox>(currentTeeBox)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await setTeeBox(userId, value) as any
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
        className={`text-xs underline ${currentTeeBox === 'white' ? 'text-amber-600 hover:text-amber-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {currentTeeBox === 'white' ? 'White tees' : 'Blue tees'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 min-w-[140px]">
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tee Box</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as TeeBox)}
        className="w-28 border rounded px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
        autoFocus
      >
        <option value="blue">Blue tees</option>
        <option value="white">White tees</option>
      </select>
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
          onClick={() => { setOpen(false); setValue(currentTeeBox) }}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

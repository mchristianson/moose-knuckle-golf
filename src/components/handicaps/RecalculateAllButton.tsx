'use client'

import { useState } from 'react'
import { recalculateAllHandicaps } from '@/lib/actions/scores'

export function RecalculateAllButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    const res = await recalculateAllHandicaps()
    setLoading(false)
    if (res.success) {
      setResult(`Recalculated ${res.count} players`)
    } else {
      setResult(res.error ?? 'Error')
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-sm text-gray-500">{result}</span>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Recalculating…' : 'Recalculate All'}
      </button>
    </div>
  )
}

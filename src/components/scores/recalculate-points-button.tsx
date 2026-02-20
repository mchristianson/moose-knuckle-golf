'use client'

import { recalculateRoundPoints } from '@/lib/actions/scores'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RecalculatePointsButtonProps {
  roundId: string
  isCompleted: boolean
}

export function RecalculatePointsButton({ roundId, isCompleted }: RecalculatePointsButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRecalculate = async () => {
    if (!isCompleted) {
      setError('Can only recalculate points for completed rounds')
      return
    }

    if (!confirm('Recalculate points for this round? This will update all team point totals based on current locked scores.')) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const result = await recalculateRoundPoints(roundId)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    }

    setIsLoading(false)
  }

  if (!isCompleted) {
    return null
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleRecalculate}
        disabled={isLoading}
        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-40 font-medium"
      >
        {isLoading ? 'Recalculating…' : '🔄 Recalculate Points'}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 mt-2">✓ Points recalculated successfully</p>
      )}
    </div>
  )
}

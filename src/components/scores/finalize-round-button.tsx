'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { finalizeRound } from '@/lib/actions/scores'

interface FinalizeRoundButtonProps {
  roundId: string
  lockedCount: number
  totalCount: number
}

export function FinalizeRoundButton({ roundId, lockedCount, totalCount }: FinalizeRoundButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const allLocked = lockedCount === totalCount && totalCount > 0

  const handleFinalize = async () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setLoading(true)
    setError(null)
    const result = await finalizeRound(roundId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      setConfirmed(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <h3 className="font-semibold mb-1">Finalize Round</h3>
      <p className="text-sm text-gray-500 mb-3">
        {lockedCount} of {totalCount} scores locked.
        {allLocked
          ? ' All scores are locked — ready to finalize.'
          : ' Lock all scores before finalizing.'}
      </p>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {confirmed && !loading && (
        <p className="text-sm text-amber-700 mb-2 font-medium">
          ⚠ This will calculate points, update handicaps, and mark the round completed. Click again to confirm.
        </p>
      )}
      <button
        onClick={handleFinalize}
        disabled={!allLocked || loading}
        className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors disabled:opacity-40 ${
          confirmed ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Finalizing…' : confirmed ? '✓ Confirm Finalize' : '🏁 Finalize Round'}
      </button>
    </div>
  )
}

'use client'

import { generateFoursomes } from '@/lib/actions/foursomes'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GenerateFoursomesButtonProps {
  roundId: string
  availableCount: number
  allDeclared: boolean
}

export function GenerateFoursomesButton({ roundId, availableCount, allDeclared }: GenerateFoursomesButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDisabled = availableCount !== 8 || !allDeclared

  const handleGenerate = async () => {
    if (!allDeclared) {
      setError('All teams must declare their golfer before generating foursomes')
      return
    }

    if (availableCount !== 8) {
      setError('Exactly 8 golfers must be available to generate foursomes')
      return
    }

    setLoading(true)
    setError(null)

    const result = await generateFoursomes(roundId)

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error || 'Failed to generate foursomes')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={isDisabled || loading}
        className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
          isDisabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        } disabled:opacity-50`}
      >
        {loading ? 'Generating...' : '🎲 Auto-Generate Foursomes'}
      </button>

      {!allDeclared && (
        <p className="text-sm text-red-600">
          All teams must declare their golfer before generating foursomes
        </p>
      )}

      {allDeclared && availableCount !== 8 && (
        <p className="text-sm text-red-600">
          {availableCount < 8
            ? `Need ${8 - availableCount} more golfer(s) available`
            : `Remove ${availableCount - 8} golfer(s) from available`}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

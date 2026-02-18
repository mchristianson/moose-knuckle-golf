'use client'

import { declareAvailability } from '@/lib/actions/availability'
import { useState } from 'react'

interface AvailabilityToggleProps {
  roundId: string
  currentStatus: string
}

export function AvailabilityToggle({ roundId, currentStatus }: AvailabilityToggleProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (newStatus: 'in' | 'out') => {
    setIsLoading(true)
    setStatus(newStatus)
    const result = await declareAvailability(roundId, newStatus)
    if (result?.error) {
      alert(result.error)
      setStatus(currentStatus)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleToggle('in')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 ${
          status === 'in'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        ✓ I'm In
      </button>
      <button
        onClick={() => handleToggle('out')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 ${
          status === 'out'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        ✗ I'm Out
      </button>
    </div>
  )
}

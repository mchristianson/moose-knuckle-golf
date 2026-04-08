'use client'

import { useState } from 'react'
import { adminOverrideAvailability } from '@/lib/actions/availability'

interface AdminAvailabilityOverrideProps {
  availabilityId: string
  currentStatus: string
}

export function AdminAvailabilityOverride({ availabilityId, currentStatus }: AdminAvailabilityOverrideProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (newStatus: 'in' | 'out') => {
    if (newStatus === status || isLoading) return
    setIsLoading(true)
    const result = await adminOverrideAvailability(availabilityId, newStatus)
    if (!result?.error) {
      setStatus(newStatus)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleToggle('in')}
        disabled={isLoading}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
          status === 'in'
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
        }`}
      >
        In
      </button>
      <button
        onClick={() => handleToggle('out')}
        disabled={isLoading}
        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
          status === 'out'
            ? 'bg-red-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
        }`}
      >
        Out
      </button>
    </div>
  )
}

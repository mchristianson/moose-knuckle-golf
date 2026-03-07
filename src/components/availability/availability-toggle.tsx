'use client'

import { declareAvailability } from '@/lib/actions/availability'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
          status === 'in'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Icon icon={CheckIcon} size="sm" className={status === 'in' ? 'text-white' : 'text-gray-700'} />
        I'm In
      </button>
      <button
        onClick={() => handleToggle('out')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
          status === 'out'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Icon icon={XMarkIcon} size="sm" className={status === 'out' ? 'text-white' : 'text-gray-700'} />
        I'm Out
      </button>
    </div>
  )
}

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
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (newStatus: 'in' | 'out') => {
    setIsLoading(true)
    try {
      await declareAvailability(roundId, newStatus)
      // Server action will redirect on success
    } catch (error) {
      // Ignore NEXT_REDIRECT error (it's intentional for redirect on success)
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        return
      }
      setIsLoading(false)
      alert(error instanceof Error ? error.message : 'Failed to declare availability')
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleToggle('in')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
          currentStatus === 'in'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Icon icon={CheckIcon} size="sm" className={currentStatus === 'in' ? 'text-white' : 'text-gray-700'} />
        I'm In
      </button>
      <button
        onClick={() => handleToggle('out')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
          currentStatus === 'out'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Icon icon={XMarkIcon} size="sm" className={currentStatus === 'out' ? 'text-white' : 'text-gray-700'} />
        I'm Out
      </button>
    </div>
  )
}

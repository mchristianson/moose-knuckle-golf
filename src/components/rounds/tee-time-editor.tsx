'use client'

import { updateTeeTime } from '@/lib/actions/rounds'
import { useState } from 'react'

interface TeeTimeEditorProps {
  roundId: string
  currentTeeTime: string | null
}

export function TeeTimeEditor({ roundId, currentTeeTime }: TeeTimeEditorProps) {
  const [teeTime, setTeeTime] = useState(currentTeeTime || '08:00')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateTeeTime(roundId, teeTime)
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  const format12Hour = (timeStr: string): string => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
  }

  const secondTeeTime = addMinutesToTime(teeTime, 10)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500">Tee times:</span>
      <span className="font-medium text-sm text-green-700">
        {currentTeeTime ? format12Hour(currentTeeTime) : '—'}
        {currentTeeTime && (
          <span className="text-gray-400 mx-1.5">/</span>
        )}
        {currentTeeTime ? format12Hour(addMinutesToTime(currentTeeTime, 10)) : ''}
      </span>

      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={teeTime}
            onChange={(e) => setTeeTime(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setTeeTime(currentTeeTime || '08:00'); setIsEditing(false) }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="px-2 py-0.5 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-100"
        >
          Edit
        </button>
      )}
    </div>
  )
}

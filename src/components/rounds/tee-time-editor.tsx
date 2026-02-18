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
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Tee Times</h2>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Tee Time
            </label>
            <input
              type="time"
              value={teeTime}
              onChange={(e) => setTeeTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Second tee time will be: <strong>{format12Hour(secondTeeTime)}</strong> (10 minutes later)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setTeeTime(currentTeeTime || '08:00')
                setIsEditing(false)
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">1st Tee Time</p>
              <p className="text-2xl font-bold text-green-700">
                {currentTeeTime ? format12Hour(currentTeeTime) : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">2nd Tee Time</p>
              <p className="text-2xl font-bold text-green-700">
                {currentTeeTime ? format12Hour(addMinutesToTime(currentTeeTime, 10)) : '—'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            ✏️ Edit Tee Times
          </button>
        </div>
      )}
    </div>
  )
}

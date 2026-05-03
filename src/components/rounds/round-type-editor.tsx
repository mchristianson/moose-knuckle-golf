'use client'

import { updateRoundType } from '@/lib/actions/rounds'
import { useState } from 'react'

interface RoundTypeEditorProps {
  roundId: string
  currentRoundType: string
}

export function RoundTypeEditor({ roundId, currentRoundType }: RoundTypeEditorProps) {
  const [roundType, setRoundType] = useState(currentRoundType)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateRoundType(roundId, roundType)
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">Type:</span>
      {isEditing ? (
        <>
          <select
            value={roundType}
            onChange={(e) => setRoundType(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
          >
            <option value="regular">Regular</option>
            <option value="makeup">Makeup</option>
            <option value="practice">Practice</option>
          </select>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setRoundType(currentRoundType); setIsEditing(false) }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="font-medium text-sm capitalize">{roundType}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 text-xs text-gray-500 border border-gray-300 rounded hover:bg-gray-100"
          >
            Edit
          </button>
        </>
      )}
    </div>
  )
}

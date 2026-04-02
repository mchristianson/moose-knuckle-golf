'use client'

import { updateCourse } from '@/lib/actions/rounds'
import { useState } from 'react'

interface CourseEditorProps {
  roundId: string
  currentCourse: string | null
}

export function CourseEditor({ roundId, currentCourse }: CourseEditorProps) {
  const [course, setCourse] = useState(currentCourse || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateCourse(roundId, course)
    if (result?.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-gray-500">Course:</span>
      <span className="font-medium text-sm text-green-700">
        {currentCourse || '—'}
      </span>

      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Pebble Beach Golf Links"
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-56"
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setCourse(currentCourse || ''); setIsEditing(false) }}
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

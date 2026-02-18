'use client'

import { setDeclaredGolfer } from '@/lib/actions/availability'
import { useState } from 'react'

interface Member {
  userId: string
  fullName: string
}

interface DeclaredGolferSelectorProps {
  roundId: string
  teamId: string
  members: Member[]
  currentDeclaredGolferId: string | null
  readOnly?: boolean
}

export function DeclaredGolferSelector({
  roundId,
  teamId,
  members,
  currentDeclaredGolferId,
  readOnly = false,
}: DeclaredGolferSelectorProps) {
  const [declaredId, setDeclaredId] = useState(currentDeclaredGolferId)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelect = async (golferId: string) => {
    if (readOnly) return
    setIsLoading(true)
    const prev = declaredId
    setDeclaredId(golferId)
    const result = await setDeclaredGolfer(roundId, teamId, golferId)
    if (result?.error) {
      alert(result.error)
      setDeclaredId(prev)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {members.map((member) => (
        <button
          key={member.userId}
          onClick={() => handleSelect(member.userId)}
          disabled={readOnly || isLoading}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            declaredId === member.userId
              ? 'bg-green-600 text-white shadow-sm'
              : readOnly
              ? 'bg-gray-100 text-gray-400 cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
          }`}
        >
          {member.fullName}
        </button>
      ))}
    </div>
  )
}

'use client'

import { updateRoundStatus, deleteRound } from '@/lib/actions/rounds'
import { formatRoundDate, formatTeeTime } from '@/lib/utils/date'
import { useState } from 'react'
import Link from 'next/link'

const STATUS_COLORS = {
  scheduled: 'bg-gray-100 text-gray-800',
  availability_open: 'bg-blue-100 text-blue-800',
  foursomes_set: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  scoring: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  availability_open: 'Availability Open',
  foursomes_set: 'Foursomes Set',
  in_progress: 'In Progress',
  scoring: 'Scoring',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

interface RoundCardProps {
  round: any
  allDeclared?: boolean
  declarationDetails?: {
    declared: Array<{
      teamId: string
      teamNumber: number
      teamName: string
      golferName: string
    }>
    notDeclared: Array<{
      teamId: string
      teamNumber: number
      teamName: string
    }>
  }
}

export function RoundCard({ round, allDeclared = false, declarationDetails }: RoundCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    await updateRoundStatus(round.id, newStatus)
  }

  const handleDelete = async () => {
    if (confirm(`Delete Round ${round.round_number}? This cannot be undone.`)) {
      setIsDeleting(true)
      const result = await deleteRound(round.id)
      if (result?.error) {
        alert(result.error)
        setIsDeleting(false)
      }
    }
  }


  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold">Round {round.round_number}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[round.status as keyof typeof STATUS_COLORS]}`}>
              {STATUS_LABELS[round.status as keyof typeof STATUS_LABELS]}
            </span>
            {round.round_type === 'makeup' && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Makeup
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-2">{formatRoundDate(round.round_date)}</p>
          {round.tee_time && (
            <p className="text-sm text-gray-600 mb-2">
              🕐 Tee times: <strong>{formatTeeTime(round.tee_time)}</strong> & <strong>{formatTeeTime(addMinutesToTime(round.tee_time, 10))}</strong>
            </p>
          )}
          {round.notes && (
            <p className="text-sm text-gray-500">{round.notes}</p>
          )}

          {/* Declaration Status */}
          {round.status === 'availability_open' && declarationDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {declarationDetails.declared.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                    ✓ Declared ({declarationDetails.declared.length}/{declarationDetails.declared.length + declarationDetails.notDeclared.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {declarationDetails.declared.map((team: any) => (
                      <span key={team.teamId} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        T{team.teamNumber}: {team.golferName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {declarationDetails.notDeclared.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                    ✗ Not Declared ({declarationDetails.notDeclared.length}/{declarationDetails.declared.length + declarationDetails.notDeclared.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {declarationDetails.notDeclared.map((team: any) => (
                      <span key={team.teamId} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        T{team.teamNumber}: {team.teamName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
        >
          {isDeleting ? '...' : '🗑️ Delete'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {round.status === 'scheduled' && (
          <button
            onClick={() => handleStatusChange('availability_open')}
            className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200"
          >
            Open Availability
          </button>
        )}
        {round.status === 'availability_open' && (
          <button
            onClick={() => handleStatusChange('foursomes_set')}
            disabled={!allDeclared}
            title={!allDeclared ? 'All teams must declare their golfer first' : ''}
            className={`text-sm px-3 py-1 rounded ${
              allDeclared
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Set Foursomes
          </button>
        )}
        {round.status === 'foursomes_set' && (
          <button
            onClick={() => handleStatusChange('in_progress')}
            className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
          >
            Start Round
          </button>
        )}
        {round.status === 'in_progress' && (
          <button
            onClick={() => handleStatusChange('scoring')}
            className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded hover:bg-orange-200"
          >
            Open Scoring
          </button>
        )}
        {round.status === 'scoring' && (
          <button
            onClick={() => handleStatusChange('completed')}
            className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200"
          >
            Complete Round
          </button>
        )}

        <Link
          href={`/admin/rounds/${round.id}`}
          className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

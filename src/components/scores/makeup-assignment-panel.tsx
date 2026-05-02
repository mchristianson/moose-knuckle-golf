'use client'

import { useTransition, useState } from 'react'
import { linkMakeupScore } from '@/lib/actions/scores'

interface ScoreRow {
  scoreId: string
  userId: string | null
  subId: string | null
  playerName: string
  teamName: string
  teamNumber: number
  coversMissedRoundId: string | null
}

interface RoundOption {
  id: string
  round_number: number
  round_date: string
  round_type: string
}

interface Props {
  makeupRoundId: string
  scores: ScoreRow[]
  allRounds: RoundOption[]
}

function formatShortDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MakeupAssignmentPanel({ makeupRoundId, scores, allRounds }: Props) {
  const [pending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (scores.length === 0) return null

  function handleChange(scoreId: string, value: string) {
    setSavingId(scoreId)
    setErrors(prev => ({ ...prev, [scoreId]: '' }))
    startTransition(async () => {
      const result = await linkMakeupScore(scoreId, value || null)
      if (result.error) {
        setErrors(prev => ({ ...prev, [scoreId]: result.error! }))
      }
      setSavingId(null)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold">Makeup Round Assignments</h2>
        <p className="text-sm text-gray-500 mt-1">
          For each player with a completed score, select which round this score should count toward.
          Leaving it set to "this round only" means the score counts for this makeup week's standings (but not the season).
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Player</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Counts Toward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scores.map(score => {
              const isSaving = pending && savingId === score.scoreId
              const err = errors[score.scoreId]
              return (
                <tr key={score.scoreId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {score.playerName}
                    {score.coversMissedRoundId && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Makeup
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    Team {score.teamNumber}
                    <span className="text-gray-400 ml-1">({score.teamName})</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={score.coversMissedRoundId ?? ''}
                        onChange={e => handleChange(score.scoreId, e.target.value)}
                        disabled={isSaving}
                        className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                      >
                        <option value="">Counts for this round only</option>
                        {allRounds.map(r => (
                          <option key={r.id} value={r.id}>
                            Round {r.round_number} — {formatShortDate(r.round_date)}
                            {r.round_type === 'makeup' ? ' (Makeup)' : ''}
                          </option>
                        ))}
                      </select>
                      {isSaving && (
                        <span className="text-xs text-gray-500">Saving…</span>
                      )}
                    </div>
                    {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

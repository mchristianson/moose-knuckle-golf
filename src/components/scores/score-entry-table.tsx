'use client'

import { useState } from 'react'
import { saveScore, lockScore, unlockScore } from '@/lib/actions/scores'
import { useRouter } from 'next/navigation'
import { HOLE_PARS } from '@/lib/constants/course'
import { Icon } from '@/components/Icon'
import { LockClosedIcon, LockOpenIcon, PencilIcon } from '@heroicons/react/24/outline'

interface ScoreRow {
  scoreId: string | null
  userId: string
  teamId: string
  fullName: string
  teamName: string
  teamNumber: number
  handicap: number
  holeScores: number[]  // length 9, 0 = not entered
  grossScore: number
  netScore: number | null
  isLocked: boolean
  isSub: boolean
}

interface ScoreEntryTableProps {
  roundId: string
  rows: ScoreRow[]
}

const HOLES = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function ScoreEntryTable({ roundId, rows: initialRows }: ScoreEntryTableProps) {
  const router = useRouter()
  const [rows, setRows] = useState<ScoreRow[]>(initialRows)
  const [saving, setSaving] = useState<string | null>(null) // userId being saved
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateHole = (userId: string, holeIdx: number, value: string) => {
    const parsed = parseInt(value)
    const score = isNaN(parsed) || parsed < 0 ? 0 : Math.min(parsed, 20)
    setRows((prev) =>
      prev.map((r) => {
        if (r.userId !== userId) return r
        const holes = [...r.holeScores]
        holes[holeIdx] = score
        const gross = holes.reduce((a, b) => a + b, 0)
        const net = Math.round((gross - r.handicap) * 10) / 10
        return { ...r, holeScores: holes, grossScore: gross, netScore: net }
      })
    )
  }

  const handleSave = async (row: ScoreRow) => {
    setSaving(row.userId)
    setErrors((e) => ({ ...e, [row.userId]: '' }))
    const result = await saveScore(roundId, row.userId, row.teamId, row.holeScores, row.isSub)
    if (result.error) {
      setErrors((e) => ({ ...e, [row.userId]: result.error! }))
    } else {
      router.refresh()
    }
    setSaving(null)
  }

  const handleLock = async (row: ScoreRow) => {
    if (!row.scoreId) {
      setErrors((e) => ({ ...e, [row.userId]: 'Please save the score first before locking' }))
      return
    }
    setSaving(row.userId)
    setErrors((e) => ({ ...e, [row.userId]: '' }))

    // Optimistic update
    setRows((prev) =>
      prev.map((r) => r.userId === row.userId ? { ...r, isLocked: true } : r)
    )

    const result = await lockScore(row.scoreId, roundId)
    if (result.error) {
      // Revert optimistic update on error
      setRows((prev) =>
        prev.map((r) => r.userId === row.userId ? { ...r, isLocked: false } : r)
      )
      setErrors((e) => ({ ...e, [row.userId]: result.error! }))
    } else {
      router.refresh()
    }
    setSaving(null)
  }

  const handleUnlock = async (row: ScoreRow) => {
    if (!row.scoreId) return
    setSaving(row.userId)
    setErrors((e) => ({ ...e, [row.userId]: '' }))

    // Optimistic update
    setRows((prev) =>
      prev.map((r) => r.userId === row.userId ? { ...r, isLocked: false } : r)
    )

    const result = await unlockScore(row.scoreId, roundId)
    if (result.error) {
      // Revert optimistic update on error
      setRows((prev) =>
        prev.map((r) => r.userId === row.userId ? { ...r, isLocked: true } : r)
      )
      setErrors((e) => ({ ...e, [row.userId]: result.error! }))
    } else {
      router.refresh()
    }
    setSaving(null)
  }

  const allLocked = rows.every((r) => r.isLocked)

  return (
    <div className="space-y-6">
      {rows
        .slice()
        .sort((a, b) => a.teamNumber - b.teamNumber)
        .map((row) => {
          const isBusy = saving === row.userId
          const allHolesEntered = row.holeScores.length === 9 && row.holeScores.every((h) => h > 0)
          const isDirty = JSON.stringify(row.holeScores) !== JSON.stringify(initialRows.find(r => r.userId === row.userId)?.holeScores)

          return (
            <div
              key={row.userId}
              className={`bg-white rounded-lg shadow border overflow-hidden ${
                row.isLocked ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                row.isLocked ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div>
                  <span className="font-semibold">{row.fullName}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    Team {row.teamNumber} — {row.teamName}
                  </span>
                  {row.isSub && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Sub</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Handicap: {row.handicap}</span>
                  {row.isLocked ? (
                    <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                      <Icon icon={LockClosedIcon} size="sm" className="text-green-700" />
                      Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Icon icon={PencilIcon} size="sm" className="text-gray-400" />
                      Editing
                    </span>
                  )}
                </div>
              </div>

              {/* Score grid */}
              <div className="p-4">
                {/* Mobile layout — 3×3 hole grid */}
                <div className="md:hidden">
                  <div className="grid grid-cols-3 gap-2">
                    {HOLES.map((h, idx) => (
                      <div key={h} className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 mb-1 font-medium">Hole {h}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={20}
                          placeholder={String(HOLE_PARS[idx])}
                          value={row.holeScores[idx] || ''}
                          onChange={(e) => updateHole(row.userId, idx, e.target.value)}
                          disabled={row.isLocked || isBusy}
                          className={`w-full h-12 text-center rounded-lg border text-lg font-semibold
                            ${row.isLocked
                              ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                              : 'bg-white border-gray-300 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'
                            }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 mt-3 text-sm">
                    <span className="text-gray-500">Gross: <strong className="text-gray-800">{row.grossScore > 0 ? row.grossScore : '—'}</strong></span>
                    <span className="text-gray-500">Net: <strong className="text-green-700">{row.netScore !== null && row.grossScore > 0 ? row.netScore : '—'}</strong></span>
                  </div>
                </div>

                {/* Desktop layout — horizontal table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 font-medium pr-3 pb-2">Hole</th>
                        {HOLES.map((h) => (
                          <th key={h} className="text-center font-medium text-gray-500 pb-2 w-10">{h}</th>
                        ))}
                        <th className="text-center font-semibold text-gray-700 pb-2 pl-3">Gross</th>
                        <th className="text-center font-semibold text-gray-700 pb-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-gray-500 text-xs pr-3">Score</td>
                        {HOLES.map((_, idx) => (
                          <td key={idx} className="text-center py-1">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={20}
                              placeholder={String(HOLE_PARS[idx])}
                              value={row.holeScores[idx] || ''}
                              onChange={(e) => updateHole(row.userId, idx, e.target.value)}
                              disabled={row.isLocked || isBusy}
                              className={`w-10 text-center rounded border py-1 text-sm font-medium
                                ${row.isLocked
                                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                                  : 'bg-white border-gray-300 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'
                                }
                              `}
                            />
                          </td>
                        ))}
                        <td className="text-center font-bold text-gray-800 pl-3">
                          {row.grossScore > 0 ? row.grossScore : '—'}
                        </td>
                        <td className="text-center font-bold text-green-700">
                          {row.netScore !== null && row.grossScore > 0 ? row.netScore : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {errors[row.userId] && (
                  <p className="text-sm text-red-600 mt-2">{errors[row.userId]}</p>
                )}

                {/* Actions */}
                {!row.isLocked && (
                  <div className="flex flex-col gap-2 mt-3 md:flex-row md:items-center">
                    <button
                      onClick={() => handleSave(row)}
                      disabled={isBusy || !isDirty}
                      className="w-full md:w-auto px-3 py-2 md:py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
                    >
                      {isBusy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleLock(row)}
                      disabled={isBusy || !allHolesEntered}
                      className="w-full md:w-auto px-3 py-2 md:py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-40"
                      title={!allHolesEntered ? 'Enter all 9 holes first' : ''}
                    >
                      {isBusy ? (
                        'Locking…'
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <Icon icon={LockClosedIcon} size="sm" />
                          Lock Score
                        </span>
                      )}
                    </button>
                    {!allHolesEntered && row.holeScores.some((h) => h > 0) && (
                      <span className="text-xs text-gray-400 text-center md:text-left">
                        {row.holeScores.filter((h) => h > 0).length}/9 holes entered
                      </span>
                    )}
                  </div>
                )}
                {row.isLocked && (
                  <button
                    onClick={() => handleUnlock(row)}
                    disabled={isBusy}
                    className="mt-3 w-full md:w-auto px-3 py-2 md:py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-40"
                  >
                    {isBusy ? (
                      'Unlocking…'
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Icon icon={LockOpenIcon} size="sm" />
                        Unlock to Edit
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}

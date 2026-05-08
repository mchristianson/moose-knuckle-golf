'use client'

import { useState } from 'react'
import { saveScore } from '@/lib/actions/scores'
import { useRouter } from 'next/navigation'
import { HOLE_PARS } from '@/lib/constants/course'

interface ScoreRow {
  scoreId: string | null
  userId: string | null   // null for external subs
  subId: string | null    // non-null for external subs
  teamId: string
  fullName: string
  teamName: string
  teamNumber: number
  handicap: number
  holeScores: number[]  // length 9-18, 0 = not entered
  grossScore: number
  netScore: number | null
  isSub: boolean
}

interface ScoreEntryTableProps {
  roundId: string
  rows: ScoreRow[]
}

const FRONT_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const BACK_NINE = [10, 11, 12, 13, 14, 15, 16, 17, 18]

export function ScoreEntryTable({ roundId, rows: initialRows }: ScoreEntryTableProps) {
  const router = useRouter()
  const [rows, setRows] = useState<ScoreRow[]>(initialRows)
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Stable key for each row regardless of whether it's a user or sub
  const rowKey = (row: ScoreRow) => row.userId ?? row.subId ?? ''

  const updateHole = (key: string, holeIdx: number, value: string) => {
    const parsed = parseInt(value)
    const score = isNaN(parsed) || parsed < 0 ? 0 : Math.min(parsed, 20)
    setRows((prev) =>
      prev.map((r) => {
        if (rowKey(r) !== key) return r
        const holes = [...r.holeScores]
        holes[holeIdx] = score
        // Only calculate on first 9 holes for gross/net
        const firstNine = holes.slice(0, 9)
        const gross = firstNine.reduce((a, b) => a + b, 0)
        const net = gross > 0 ? Math.round((gross - r.handicap) * 10) / 10 : null
        return { ...r, holeScores: holes, grossScore: gross, netScore: net }
      })
    )
  }

  const handleSave = async (row: ScoreRow) => {
    const key = rowKey(row)
    setSaving(key)
    setErrors((e) => ({ ...e, [key]: '' }))
    const result = await saveScore(roundId, row.userId, row.teamId, row.holeScores, row.isSub, row.subId)
    if (result.error) {
      setErrors((e) => ({ ...e, [key]: result.error! }))
    } else {
      router.refresh()
    }
    setSaving(null)
  }


  return (
    <div className="space-y-6">
      {rows
        .slice()
        .sort((a, b) => a.teamNumber - b.teamNumber)
        .map((row) => {
          const key = rowKey(row)
          const isBusy = saving === key
          const firstNineComplete = row.holeScores.slice(0, 9).every((h) => h > 0)
          const isDirty = JSON.stringify(row.holeScores) !== JSON.stringify(initialRows.find(r => rowKey(r) === key)?.holeScores)

          return (
            <div
              key={key}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                <div>
                  <span className="font-semibold">{row.fullName}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    Team {row.teamNumber} — {row.teamName}
                  </span>
                  {row.isSub && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Sub</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">Handicap: {row.handicap}</span>
              </div>

              {/* Score grid */}
              <div className="p-4">
                {/* Mobile layout — Front Nine and Back Nine grids */}
                <div className="md:hidden space-y-4">
                  {/* Front Nine */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Front Nine (Required)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {FRONT_NINE.map((h, idx) => (
                        <div key={h} className="flex flex-col items-center">
                          <span className="text-xs text-gray-400 mb-1 font-medium">Hole {h}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            placeholder={String(HOLE_PARS[idx])}
                            value={row.holeScores[idx] || ''}
                            onChange={(e) => updateHole(key, idx, e.target.value)}
                            disabled={isBusy}
                            className="w-full h-12 text-center rounded-lg border bg-white border-gray-300 text-lg font-semibold focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Back Nine */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Back Nine (Optional)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {BACK_NINE.map((h, idx) => (
                        <div key={h} className="flex flex-col items-center">
                          <span className="text-xs text-gray-400 mb-1 font-medium">Hole {h}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            placeholder={String(HOLE_PARS[9 + idx])}
                            value={row.holeScores[8 + idx] || ''}
                            onChange={(e) => updateHole(key, 8 + idx, e.target.value)}
                            disabled={isBusy}
                            className="w-full h-12 text-center rounded-lg border bg-white border-gray-300 text-lg font-semibold focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6 pt-2 text-sm border-t border-gray-200">
                    <span className="text-gray-500">Net (9h): <strong className="text-gray-800">{row.netScore !== null ? row.netScore : '—'}</strong></span>
                    {row.holeScores.slice(9).some((h) => h > 0) && (
                      <span className="text-gray-500">Gross (18h): <strong className="text-gray-800">{row.holeScores.reduce((a, b) => a + b, 0)}</strong></span>
                    )}
                  </div>
                </div>

                {/* Desktop layout — horizontal table with Front Nine and Back Nine */}
                <div className="hidden md:block overflow-x-auto space-y-4">
                  {/* Front Nine Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Front Nine (Required)</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left text-gray-500 font-medium pr-3 pb-2">Hole</th>
                          {FRONT_NINE.map((h) => (
                            <th key={h} className="text-center font-medium text-gray-500 pb-2 w-10">{h}</th>
                          ))}
                          <th className="text-center font-semibold text-gray-700 pb-2 pl-3">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-gray-500 text-xs pr-3">Score</td>
                          {FRONT_NINE.map((_, idx) => (
                            <td key={idx} className="text-center py-1">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={20}
                                placeholder={String(HOLE_PARS[idx])}
                                value={row.holeScores[idx] || ''}
                                onChange={(e) => updateHole(key, idx, e.target.value)}
                                disabled={isBusy}
                                className="w-10 text-center rounded border bg-white border-gray-300 py-1 text-sm font-medium focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                          ))}
                          <td className="text-center font-bold text-green-700 pl-3">
                            {row.netScore !== null ? row.netScore : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Back Nine Table */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Back Nine (Optional)</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left text-gray-500 font-medium pr-3 pb-2">Hole</th>
                          {BACK_NINE.map((h) => (
                            <th key={h} className="text-center font-medium text-gray-500 pb-2 w-10">{h}</th>
                          ))}
                          <th className="text-center font-semibold text-gray-700 pb-2 pl-3">18h Gross</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-gray-500 text-xs pr-3">Score</td>
                          {BACK_NINE.map((_, idx) => (
                            <td key={idx} className="text-center py-1">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={20}
                                placeholder={String(HOLE_PARS[9 + idx])}
                                value={row.holeScores[9 + idx] || ''}
                                onChange={(e) => updateHole(key, 9 + idx, e.target.value)}
                                disabled={isBusy}
                                className="w-10 text-center rounded border bg-white border-gray-300 py-1 text-sm font-medium focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                          ))}
                          <td className="text-center font-bold text-gray-800 pl-3">
                            {row.holeScores.slice(9).some((h) => h > 0) ? row.holeScores.reduce((a, b) => a + b, 0) : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {errors[key] && (
                  <p className="text-sm text-red-600 mt-2">{errors[key]}</p>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-3 md:flex-row md:items-center">
                  <button
                    onClick={() => handleSave(row)}
                    disabled={isBusy || !isDirty}
                    className="w-full md:w-auto px-3 py-2 md:py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40"
                  >
                    {isBusy ? 'Saving…' : 'Save'}
                  </button>
                  {!firstNineComplete && row.holeScores.slice(0, 9).some((h) => h > 0) && (
                    <span className="text-xs text-gray-400 text-center md:text-left">
                      {row.holeScores.slice(0, 9).filter((h) => h > 0).length}/9 holes entered
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { submitMyScore } from '@/lib/actions/scores'

interface MyScoreCardProps {
  roundId: string
  userId: string
  teamName: string
  teamNumber: number
  handicap: number
  holeScores: number[]
  isLocked: boolean
  scoringOpen: boolean
  existingScoreId: string | null
  grossScore: number | null
  netScore: number | null
}

export function MyScoreCard({
  roundId,
  teamName,
  teamNumber,
  handicap,
  holeScores: initialHoleScores,
  isLocked,
  scoringOpen,
}: MyScoreCardProps) {
  const [holes, setHoles] = useState<number[]>(
    initialHoleScores.length === 9 ? [...initialHoleScores] : Array(9).fill(0)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const readOnly = isLocked || !scoringOpen

  const filledHoles = holes.filter((h) => h > 0)
  const gross = filledHoles.reduce((a, b) => a + b, 0)
  const allFilled = filledHoles.length === 9
  const net = allFilled ? Math.round((gross - handicap) * 10) / 10 : null
  const isDirty = holes.some((h, i) => h !== (initialHoleScores[i] ?? 0))

  const adjust = (index: number, delta: number) => {
    if (readOnly) return
    setHoles((prev) => {
      const next = [...prev]
      next[index] = Math.max(0, Math.min(20, (next[index] || 0) + delta))
      return next
    })
    setSaved(false)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await submitMyScore(roundId, holes) as any
    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
    }
  }

  return (
    <div className="flex flex-col gap-0 rounded-xl shadow-lg overflow-hidden bg-white">

      {/* ── Score summary bar ── */}
      <div className="bg-green-700 text-white px-5 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-medium uppercase tracking-widest">Team {teamNumber}</p>
            <p className="text-lg font-bold leading-tight">{teamName || `Team ${teamNumber}`}</p>
          </div>
          {isLocked && (
            <span className="text-xs bg-green-600 border border-green-400 px-2 py-1 rounded-full font-medium">
              🔒 Locked
            </span>
          )}
          {!isLocked && scoringOpen && (
            <span className="text-xs bg-green-600 border border-green-400 px-2 py-1 rounded-full font-medium">
              ⛳ Open
            </span>
          )}
        </div>

        {/* Big stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-800/50 rounded-lg py-3 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Gross</p>
            <p className="text-4xl font-black tabular-nums">{gross > 0 ? gross : '–'}</p>
          </div>
          <div className="bg-green-800/50 rounded-lg py-3 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Handicap</p>
            <p className="text-4xl font-black tabular-nums text-green-200">{handicap}</p>
          </div>
          <div className="bg-green-800/50 rounded-lg py-3 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Net</p>
            <p className="text-4xl font-black tabular-nums">
              {net !== null ? net : <span className="text-2xl text-green-400">—</span>}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-green-300 mb-1">
            <span>{filledHoles.length} of 9 holes entered</span>
            {allFilled && <span className="text-green-200 font-medium">✓ Complete</span>}
          </div>
          <div className="h-1.5 bg-green-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-300 rounded-full transition-all duration-300"
              style={{ width: `${(filledHoles.length / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Hole grid ── */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {holes.map((val, i) => (
            <HoleCell
              key={i}
              hole={i + 1}
              value={val}
              readOnly={readOnly}
              onAdjust={(delta) => adjust(i, delta)}
            />
          ))}
        </div>
      </div>

      {/* ── Save action ── */}
      {!readOnly && (
        <div className="px-4 pb-5 pt-1">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {saved && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <p className="text-sm text-green-700 font-medium">✓ Score saved!</p>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty || filledHoles.length === 0}
            className="w-full py-4 rounded-xl text-lg font-bold bg-green-600 text-white
                       hover:bg-green-700 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Score'}
          </button>
          {!allFilled && filledHoles.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">
              You can save now and finish the remaining holes later.
            </p>
          )}
        </div>
      )}

      {readOnly && isLocked && (
        <div className="px-4 pb-5 pt-1">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-medium text-sm">🔒 Score locked by admin — no further changes allowed.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Individual hole cell ──────────────────────────────────────────────────────

interface HoleCellProps {
  hole: number
  value: number
  readOnly: boolean
  onAdjust: (delta: number) => void
}

function HoleCell({ hole, value, readOnly, onAdjust }: HoleCellProps) {
  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${
      value > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Hole label */}
      <div className={`text-center py-1 text-xs font-semibold uppercase tracking-wider ${
        value > 0 ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        Hole {hole}
      </div>

      {/* Score display */}
      <div className="text-center py-3">
        <span className={`text-4xl font-black tabular-nums ${
          value > 0 ? 'text-gray-900' : 'text-gray-300'
        }`}>
          {value > 0 ? value : '–'}
        </span>
      </div>

      {/* +/- controls */}
      {!readOnly && (
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => onAdjust(-1)}
            disabled={value <= 1}
            aria-label={`Decrease hole ${hole}`}
            className="flex-1 py-3 text-xl font-bold text-gray-600
                       hover:bg-red-50 hover:text-red-600 active:bg-red-100
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors border-r border-gray-200"
          >
            −
          </button>
          <button
            onClick={() => onAdjust(1)}
            disabled={value >= 20}
            aria-label={`Increase hole ${hole}`}
            className="flex-1 py-3 text-xl font-bold text-gray-600
                       hover:bg-green-50 hover:text-green-600 active:bg-green-100
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { submitMyScore } from '@/lib/actions/scores'

// Legend's front nine par values
const HOLE_PARS = [4, 4, 4, 5, 3, 4, 3, 4, 5]

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
  // holes: the score for each hole (starts at par)
  // touched: whether the user has adjusted this hole away from the default
  const hasExisting = initialHoleScores.some(s => s > 0)

  const [holes, setHoles] = useState<number[]>(() =>
    HOLE_PARS.map((par, i) => (initialHoleScores[i] > 0 ? initialHoleScores[i] : par))
  )
  const [touched, setTouched] = useState<boolean[]>(() =>
    HOLE_PARS.map((_, i) => initialHoleScores[i] > 0)
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const readOnly = isLocked || !scoringOpen

  const touchedCount = touched.filter(Boolean).length
  const allTouched = touchedCount === 9

  // Only include touched holes in gross/net calculations
  const gross = holes.reduce((sum, val, i) => sum + (touched[i] ? val : 0), 0)
  const net = allTouched ? Math.round((gross - handicap) * 10) / 10 : null

  // isDirty: any touched hole differs from initial, or newly touched holes
  const isDirty = holes.some((val, i) => {
    if (!touched[i]) return false
    return val !== (initialHoleScores[i] > 0 ? initialHoleScores[i] : 0)
  }) || touched.some((t, i) => t && !(initialHoleScores[i] > 0))

  const adjust = (index: number, delta: number) => {
    if (readOnly) return
    setHoles((prev) => {
      const next = [...prev]
      next[index] = Math.max(1, Math.min(20, next[index] + delta))
      return next
    })
    setTouched((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })
    setSaved(false)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    // Send 0 for untouched holes so the server knows they're not entered
    const payload = holes.map((val, i) => (touched[i] ? val : 0))
    const result = await submitMyScore(roundId, payload) as any
    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
    }
  }

  return (
    <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-white">

      {/* ── Score summary bar ── */}
      <div className="bg-green-700 text-white px-5 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-medium uppercase tracking-widest">Team {teamNumber}</p>
            <p className="text-lg font-bold leading-tight">{teamName || `Team ${teamNumber}`}</p>
          </div>
          {isLocked ? (
            <span className="text-xs bg-green-600 border border-green-400 px-2 py-1 rounded-full font-medium">
              🔒 Locked
            </span>
          ) : scoringOpen ? (
            <span className="text-xs bg-green-600 border border-green-400 px-2 py-1 rounded-full font-medium">
              ⛳ Open
            </span>
          ) : null}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-800/50 rounded-lg py-3 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Gross</p>
            <p className="text-4xl font-black tabular-nums">
              {touchedCount > 0 ? gross : <span className="text-2xl text-green-400">—</span>}
            </p>
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
            <span>{touchedCount} of 9 holes entered</span>
            {allTouched && <span className="text-green-200 font-medium">✓ Complete</span>}
          </div>
          <div className="h-1.5 bg-green-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-300 rounded-full transition-all duration-300"
              style={{ width: `${(touchedCount / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Hole grid ── */}
      <div className="p-4">
        {!readOnly && (
          <p className="text-xs text-gray-400 text-center mb-3">
            Each hole starts at par — tap + or − to enter your score
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {holes.map((val, i) => (
            <HoleCell
              key={i}
              hole={i + 1}
              par={HOLE_PARS[i]}
              value={val}
              touched={touched[i]}
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
            disabled={saving || !isDirty || touchedCount === 0}
            className="w-full py-4 rounded-xl text-lg font-bold bg-green-600 text-white
                       hover:bg-green-700 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Score'}
          </button>
          {!allTouched && touchedCount > 0 && (
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
  par: number
  value: number
  touched: boolean
  readOnly: boolean
  onAdjust: (delta: number) => void
}

/** Label relative to par */
function relLabel(diff: number): { text: string; color: string } {
  if (diff <= -2) return { text: 'Eagle', color: 'text-yellow-500' }
  if (diff === -1) return { text: 'Birdie', color: 'text-red-500' }
  if (diff === 0)  return { text: 'Par',    color: 'text-green-600' }
  if (diff === 1)  return { text: 'Bogey',  color: 'text-gray-500' }
  if (diff === 2)  return { text: 'Double', color: 'text-orange-500' }
  return { text: `+${diff}`, color: 'text-red-700' }
}

function HoleCell({ hole, par, value, touched, readOnly, onAdjust }: HoleCellProps) {
  const diff = value - par
  const rel = relLabel(diff)

  // Colour the header based on state
  const headerBg = !touched
    ? 'bg-gray-200 text-gray-500'
    : diff < 0
    ? 'bg-red-400 text-white'
    : diff === 0
    ? 'bg-green-500 text-white'
    : diff === 1
    ? 'bg-gray-400 text-white'
    : 'bg-orange-400 text-white'

  const borderColor = !touched
    ? 'border-gray-200'
    : diff < 0
    ? 'border-red-300'
    : diff === 0
    ? 'border-green-400'
    : diff === 1
    ? 'border-gray-300'
    : 'border-orange-300'

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${borderColor} ${
      !touched ? 'bg-gray-50' : 'bg-white'
    }`}>
      {/* Hole label + par */}
      <div className={`flex items-center justify-between px-2 py-1 text-xs font-semibold ${headerBg}`}>
        <span>Hole {hole}</span>
        <span className="opacity-80">Par {par}</span>
      </div>

      {/* Score display */}
      <div className="text-center py-3 relative">
        {/* Score — ghost when untouched */}
        <span className={`text-4xl font-black tabular-nums transition-all ${
          touched ? 'text-gray-900 opacity-100' : 'text-gray-300 opacity-40'
        }`}>
          {value}
        </span>

        {/* Relative label — only show when touched */}
        <div className="h-4 mt-0.5">
          {touched && (
            <span className={`text-xs font-semibold ${rel.color}`}>
              {rel.text}
            </span>
          )}
        </div>
      </div>

      {/* +/− controls */}
      {!readOnly && (
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => onAdjust(-1)}
            disabled={touched && value <= 1}
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
            disabled={touched && value >= 20}
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { submitScoreForFoursome } from '@/lib/actions/scores'

// Legend's front nine par values
const HOLE_PARS = [4, 4, 4, 5, 3, 4, 3, 4, 5]

interface MyScoreCardProps {
  roundId: string
  userId: string
  targetUserId: string
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
  targetUserId,
  teamName,
  teamNumber,
  handicap,
  holeScores: initialHoleScores,
  isLocked,
  scoringOpen,
}: MyScoreCardProps) {
  const [holes, setHoles] = useState<number[]>(() =>
    HOLE_PARS.map((par, i) => (initialHoleScores[i] > 0 ? initialHoleScores[i] : par))
  )
  const [touched, setTouched] = useState<boolean[]>(() =>
    HOLE_PARS.map((_, i) => initialHoleScores[i] > 0)
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Track whether the user has made a change in this session
  const userChangedRef = useRef(false)

  const readOnly = isLocked || !scoringOpen

  const touchedCount = touched.filter(Boolean).length
  const allTouched = touchedCount === 9

  const gross = holes.reduce((sum, val, i) => sum + (touched[i] ? val : 0), 0)
  const net = allTouched ? Math.round((gross - handicap) * 10) / 10 : null
  const projectedNet = touchedCount > 0 && !allTouched
    ? Math.round((gross / touchedCount * 9 - handicap) * 10) / 10
    : null

  // Auto-save: debounce 800ms after the last user-initiated change
  useEffect(() => {
    if (!userChangedRef.current || readOnly || !touched.some(Boolean)) return

    const holesCopy = [...holes]
    const touchedCopy = [...touched]

    const timer = setTimeout(async () => {
      setSaving(true)
      setError(null)
      setSaved(false)
      const payload = holesCopy.map((val, i) => (touchedCopy[i] ? val : 0))
      const result = await submitScoreForFoursome(roundId, targetUserId, payload) as any
      setSaving(false)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    }, 800)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holes, touched])

  const adjust = (index: number, delta: number) => {
    if (readOnly) return
    userChangedRef.current = true
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

  const setToPar = (index: number) => {
    if (readOnly) return
    userChangedRef.current = true
    setHoles((prev) => {
      const next = [...prev]
      next[index] = HOLE_PARS[index]
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
            <p className="text-green-300 text-xs uppercase tracking-wide mb-1">
              {projectedNet !== null ? 'Proj. Net' : 'Net'}
            </p>
            <p className="text-4xl font-black tabular-nums">
              {net !== null
                ? net
                : projectedNet !== null
                ? <span className="text-green-100">{projectedNet}</span>
                : <span className="text-2xl text-green-400">—</span>}
            </p>
          </div>
        </div>

        {/* Progress bar + auto-save status */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-green-300 mb-1">
            <span>{touchedCount} of 9 holes entered</span>
            <span className="text-green-200 font-medium">
              {saving
                ? '⏳ Saving…'
                : error
                ? '⚠ Save failed'
                : saved
                ? '✓ Saved'
                : allTouched
                ? '✓ Complete'
                : null}
            </span>
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
            Tap a hole to set par — use + or − to adjust
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
              onSetPar={() => setToPar(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Status / error ── */}
      {!readOnly && error && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
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
  onSetPar: () => void
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

function HoleCell({ hole, par, value, touched, readOnly, onAdjust, onSetPar }: HoleCellProps) {
  const diff = value - par
  const rel = relLabel(diff)

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

      {/* Score display — tap to set par */}
      <button
        onClick={!readOnly ? onSetPar : undefined}
        disabled={readOnly}
        className={`w-full text-center py-3 relative ${
          !readOnly ? 'cursor-pointer active:bg-gray-100' : 'cursor-default'
        }`}
        aria-label={`Set hole ${hole} to par ${par}`}
      >
        <span className={`text-4xl font-black tabular-nums transition-all ${
          touched ? 'text-gray-900 opacity-100' : 'text-gray-300 opacity-40'
        }`}>
          {value}
        </span>
        <div className="h-4 mt-0.5">
          {touched && (
            <span className={`text-xs font-semibold ${rel.color}`}>
              {rel.text}
            </span>
          )}
        </div>
      </button>

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

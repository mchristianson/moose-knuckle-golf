'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { submitScoreForFoursome } from '@/lib/actions/scores'
import { Icon } from '@/components/Icon'
import { TrophyIcon, LockClosedIcon, FlagIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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
  roundNumber: number
  roundDate: string
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
  roundNumber,
  roundDate,
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

  const userChangedRef = useRef(false)

  const readOnly = isLocked || !scoringOpen

  const touchedCount = touched.filter(Boolean).length
  const allTouched = touchedCount === 9

  const gross = holes.reduce((sum, val, i) => sum + (touched[i] ? val : 0), 0)
  const net = allTouched ? Math.round((gross - handicap) * 10) / 10 : null
  const projectedNet = touchedCount > 0 && !allTouched
    ? Math.round((gross / touchedCount * 9 - handicap) * 10) / 10
    : null

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
    <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900">

      {/* ── Score summary bar ── */}
      <div className="bg-green-800 text-white px-4 py-4">
        {/* Round info + leaderboard link */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-green-700">
          <div>
            <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Round {roundNumber}</p>
            <p className="text-sm text-green-100">{roundDate}</p>
          </div>
          <Link
            href="/leaderboard"
            className="text-xs font-medium text-white bg-green-700 hover:bg-green-600 px-2.5 py-1.5 rounded-full transition-colors shrink-0 flex items-center gap-1"
          >
            <Icon icon={TrophyIcon} size="sm" className="text-white" />
            Leaderboard
          </Link>
        </div>

        {/* Team + status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-green-300 text-xs font-medium uppercase tracking-widest">Team {teamNumber}</p>
            <p className="text-base font-bold leading-tight">{teamName || `Team ${teamNumber}`}</p>
          </div>
          {isLocked ? (
            <span className="text-xs bg-green-700 border border-green-500 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Icon icon={LockClosedIcon} size="sm" className="text-white" />
              Locked
            </span>
          ) : scoringOpen ? (
            <span className="text-xs bg-green-700 border border-green-500 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Icon icon={FlagIcon} size="sm" className="text-white" />
              Open
            </span>
          ) : null}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-900/60 rounded-lg py-2 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-0.5">Gross</p>
            <p className="text-3xl font-black tabular-nums">
              {touchedCount > 0 ? gross : <span className="text-xl text-green-500">—</span>}
            </p>
          </div>
          <div className="bg-green-900/60 rounded-lg py-2 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-0.5">Handicap</p>
            <p className="text-3xl font-black tabular-nums text-green-200">{handicap}</p>
          </div>
          <div className="bg-green-900/60 rounded-lg py-2 px-2">
            <p className="text-green-300 text-xs uppercase tracking-wide mb-0.5">
              {projectedNet !== null ? 'Proj. Net' : 'Net'}
            </p>
            <p className="text-3xl font-black tabular-nums">
              {net !== null
                ? net
                : projectedNet !== null
                ? <span className="text-green-100">{projectedNet}</span>
                : <span className="text-xl text-green-500">—</span>}
            </p>
          </div>
        </div>

        {/* Progress bar + auto-save status */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-green-300 mb-1">
            <span>{touchedCount} of 9</span>
            <span className="text-green-200 font-medium flex items-center gap-1">
              {saving ? (
                <>
                  <Icon icon={CheckIcon} size="sm" className="text-green-200 animate-pulse" />
                  Saving…
                </>
              ) : error ? (
                <>
                  <Icon icon={ExclamationTriangleIcon} size="sm" className="text-red-300" />
                  Failed
                </>
              ) : saved ? (
                <>
                  <Icon icon={CheckIcon} size="sm" className="text-green-200" />
                  Saved
                </>
              ) : allTouched ? (
                <>
                  <Icon icon={CheckIcon} size="sm" className="text-green-200" />
                  Done
                </>
              ) : null}
            </span>
          </div>
          <div className="h-1 bg-green-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-300 rounded-full transition-all duration-300"
              style={{ width: `${(touchedCount / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Hole grid ── */}
      <div className="bg-zinc-900">
        {!readOnly && (
          <p className="text-xs text-zinc-500 text-center mb-3">
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
        <div className="px-4 pb-4 bg-zinc-900">
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {readOnly && isLocked && (
        <div className="px-4 pb-5 pt-1 bg-zinc-900">
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
            <p className="text-green-400 font-medium text-sm flex items-center justify-center gap-2">
              <Icon icon={LockClosedIcon} size="sm" className="text-green-400" />
              Score locked by admin — no further changes allowed.
            </p>
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

function relLabel(diff: number): { text: string; color: string } {
  if (diff <= -2) return { text: 'Eagle',  color: 'text-yellow-400' }
  if (diff === -1) return { text: 'Birdie', color: 'text-red-400' }
  if (diff === 0)  return { text: 'Par',    color: 'text-green-400' }
  if (diff === 1)  return { text: 'Bogey',  color: 'text-zinc-400' }
  if (diff === 2)  return { text: 'Double', color: 'text-orange-400' }
  return { text: `+${diff}`,               color: 'text-red-500' }
}

function HoleCell({ hole, par, value, touched, readOnly, onAdjust, onSetPar }: HoleCellProps) {
  const diff = value - par
  const rel = relLabel(diff)

  const headerBg = !touched
    ? 'bg-zinc-700'
    : diff < 0
    ? 'bg-red-700'
    : diff === 0
    ? 'bg-green-700'
    : 'bg-zinc-700'

  const headerText = !touched
    ? 'text-zinc-400'
    : diff < 0
    ? 'text-white'
    : diff === 0
    ? 'text-white'
    : 'text-zinc-300'

  const borderColor = !touched
    ? 'border-zinc-700'
    : diff < 0
    ? 'border-red-500'
    : diff === 0
    ? 'border-green-500'
    : 'border-zinc-600'

  return (
    <div className={`rounded-xl border-2 overflow-hidden bg-zinc-800 ${borderColor}`}>
      {/* Hole label + par */}
      <div className={`flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider ${headerBg} ${headerText}`}>
        <span>Hole {hole}</span>
        <span>Par {par}</span>
      </div>

      {/* Score display — tap to set par */}
      <button
        onClick={!readOnly ? onSetPar : undefined}
        disabled={readOnly}
        className={`w-full flex flex-col items-center justify-center py-4 ${
          !readOnly ? 'active:bg-zinc-700' : 'cursor-default'
        }`}
        aria-label={`Set hole ${hole} to par ${par}`}
      >
        {touched ? (
          <>
            <span className="text-5xl font-black text-white tabular-nums leading-none">
              {value}
            </span>
            <span className={`text-xs font-semibold mt-1.5 ${rel.color}`}>
              {rel.text}
            </span>
          </>
        ) : (
          <div className="w-8 h-0.5 bg-zinc-600 rounded-full my-3" />
        )}
      </button>

      {/* +/− controls */}
      {!readOnly && (
        <div className="flex items-center justify-center gap-3 pb-3 px-2">
          <button
            onClick={() => onAdjust(-1)}
            disabled={touched && value <= 1}
            aria-label={`Decrease hole ${hole}`}
            className="w-11 h-11 rounded-xl bg-zinc-700 text-white text-2xl font-bold
                       flex items-center justify-center
                       active:bg-zinc-600
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-colors"
          >
            −
          </button>
          <button
            onClick={() => onAdjust(1)}
            disabled={touched && value >= 20}
            aria-label={`Increase hole ${hole}`}
            className="w-11 h-11 rounded-xl bg-zinc-700 text-white text-2xl font-bold
                       flex items-center justify-center
                       active:bg-zinc-600
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

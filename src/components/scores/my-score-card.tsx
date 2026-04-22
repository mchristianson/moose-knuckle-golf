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
    <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden bg-zinc-950">

      {/* ── Score summary bar ── */}
      <div className="text-white px-3 py-3 shrink-0" style={{ background: 'linear-gradient(140deg, #1b4d2e 0%, #1a5c35 60%, #206640 100%)' }}>
        {/* Single header row: round info + status + save indicator */}
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Rd {roundNumber} · {teamName || `Team ${teamNumber}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>↻ Saving…</span>
            ) : error ? (
              <span className="text-[9px] font-bold text-red-300">⚠ Error</span>
            ) : saved ? (
              <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>✓ Saved</span>
            ) : null}
            {isLocked ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>🔒 Locked</span>
            ) : scoringOpen ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>Open</span>
            ) : null}
          </div>
        </div>

        {/* Stats + progress in one row */}
        <div className="flex items-center gap-1.5">
          {[
            { label: 'Gross', value: touchedCount > 0 ? gross : '—' },
            { label: 'HCP', value: handicap },
            { label: projectedNet !== null ? 'Proj' : 'Net', value: net !== null ? net : projectedNet !== null ? projectedNet : '—' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-lg py-1.5 text-center"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <p className="text-[8px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {s.label}
              </p>
              <p className="text-[22px] font-black leading-none tabular-nums font-condensed">
                {s.value}
              </p>
            </div>
          ))}
          {/* Progress bar + holes */}
          <div className="flex-[1.4] flex flex-col gap-1.5 pl-1">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(touchedCount / 9) * 100}%`, background: '#4ade80' }}
              />
            </div>
            <span className="text-[9px] text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {touchedCount === 9 ? '✓ Done' : `${touchedCount}/9`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Hole grid ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-zinc-950 px-2 pt-1.5 pb-2">
        {!readOnly && (
          <p className="text-[9px] text-zinc-600 text-center mb-1.5 shrink-0">
            Tap score → par · − + to adjust
          </p>
        )}
        <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-3 gap-1.5">
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
        <div className="px-3 pb-3 bg-zinc-950">
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {readOnly && isLocked && (
        <div className="px-3 pb-4 pt-1 bg-zinc-950">
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-3 text-center">
            <p className="text-green-400 font-medium text-sm flex items-center justify-center gap-2">
              <Icon icon={LockClosedIcon} size="sm" className="text-green-400" />
              Score locked — no further changes allowed.
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
    ? '#27272a'
    : diff < 0
    ? 'rgba(220,38,38,0.25)'
    : diff === 0
    ? 'rgba(22,163,74,0.25)'
    : '#2d2d33'

  const borderColor = !touched
    ? '#27272a'
    : diff < 0
    ? '#dc2626'
    : diff === 0
    ? '#16a34a'
    : '#3f3f46'

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: '#000', border: `2px solid ${borderColor}`, transition: 'border-color 0.2s' }}
    >
      {/* Hole label + par */}
      <div
        className="flex items-center justify-between px-2 py-1 shrink-0"
        style={{ background: headerBg }}
      >
        <span className="text-[11px] font-extrabold uppercase tracking-widest font-condensed" style={{ color: touched ? '#fff' : '#52525b' }}>
          H{hole}
        </span>
        <span className="text-[11px] font-bold font-condensed" style={{ color: touched ? 'rgba(255,255,255,0.6)' : '#52525b' }}>
          P{par}
        </span>
      </div>

      {/* Score display — tap to set par */}
      <button
        onClick={!readOnly ? onSetPar : undefined}
        disabled={readOnly}
        className={`flex-1 flex flex-col items-center justify-center py-2 ${
          !readOnly ? 'active:opacity-70' : 'cursor-default'
        }`}
        aria-label={`Set hole ${hole} to par ${par}`}
      >
        {touched ? (
          <>
            <span className="text-[34px] font-black text-white tabular-nums leading-none font-condensed" style={{ letterSpacing: '-0.04em' }}>
              {value}
            </span>
            <span className={`text-[9px] font-bold mt-0.5 uppercase tracking-wider ${rel.color}`}>
              {rel.text}
            </span>
          </>
        ) : (
          <div className="w-5 h-0.5 rounded-full my-2" style={{ background: '#333' }} />
        )}
      </button>

      {/* +/− controls */}
      {!readOnly && (
        <div className="flex gap-1 px-1.5 pb-1.5 shrink-0">
          <button
            onClick={() => onAdjust(-1)}
            disabled={touched && value <= 1}
            aria-label={`Decrease hole ${hole}`}
            className="flex-1 h-7 rounded-lg text-white text-xl font-bold
                       flex items-center justify-center
                       active:opacity-70
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-opacity"
            style={{ background: '#1c1c1e' }}
          >
            −
          </button>
          <button
            onClick={() => onAdjust(1)}
            disabled={touched && value >= 20}
            aria-label={`Increase hole ${hole}`}
            className="flex-1 h-7 rounded-lg text-white text-xl font-bold
                       flex items-center justify-center
                       active:opacity-70
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-opacity"
            style={{ background: '#1c1c1e' }}
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

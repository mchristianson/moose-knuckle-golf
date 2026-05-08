'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { submitScoreForFoursome } from '@/lib/actions/scores'
import type { FoursomePlayer } from './foursome-scorecard-switcher'

// ─── Course data ──────────────────────────────────────────────────────────────

const HOLES = [
  { n: 1, par: 4, hcp: 7 },
  { n: 2, par: 4, hcp: 5 },
  { n: 3, par: 4, hcp: 1 },
  { n: 4, par: 5, hcp: 3 },
  { n: 5, par: 3, hcp: 9 },
  { n: 6, par: 4, hcp: 4 },
  { n: 7, par: 3, hcp: 2 },
  { n: 8, par: 4, hcp: 8 },
  { n: 9, par: 5, hcp: 6 },
]

// Palette for player avatars — assigned by foursome order
const AVATAR_COLORS = ['#7E57C2', '#42A5F5', '#26A69A', '#FFA726', '#EF5350', '#66BB6A', '#EC407A', '#78909C']

const FONT_ANTON = 'var(--font-anton), Anton, sans-serif'
const FONT_MONO = 'var(--font-jb-mono), "JetBrains Mono", monospace'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function playerKey(p: FoursomePlayer): string {
  return p.userId ? `user:${p.userId}` : `sub:${p.subId}`
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function scoreMeta(score: number | null, par: number): { label: string; color: string } {
  if (score == null) return { label: 'TAP TO LOG', color: 'rgba(255,255,255,0.35)' }
  const d = score - par
  if (d <= -2) return { label: 'EAGLE',  color: '#FFD24A' }
  if (d === -1) return { label: 'BIRDIE', color: '#5BC0EB' }
  if (d === 0)  return { label: 'PAR',    color: '#00C853' }
  if (d === 1)  return { label: 'BOGEY',  color: 'rgba(255,255,255,0.55)' }
  if (d === 2)  return { label: '+2',     color: '#FF7A6B' }
  return { label: `+${d}`,               color: '#FF5C4D' }
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface HoleByHoleScorecardProps {
  roundId: string
  currentUserId: string
  players: FoursomePlayer[]
  roundNumber: number
  roundDate: string
  scoringOpen: boolean
}

export function HoleByHoleScorecard({
  roundId,
  players,
  roundNumber,
  roundDate,
  scoringOpen,
}: HoleByHoleScorecardProps) {
  const [holeIdx, setHoleIdx] = useState(0)

  // scores[key][holeIdx] — null means not yet entered
  const [scores, setScores] = useState<Record<string, (number | null)[]>>(() => {
    const init: Record<string, (number | null)[]> = {}
    for (const p of players) {
      const key = playerKey(p)
      init[key] = p.holeScores.map((v) => (v > 0 ? v : null))
    }
    return init
  })

  // touched[key][holeIdx] — true when player has explicitly set a score
  const [touched, setTouched] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {}
    for (const p of players) {
      const key = playerKey(p)
      init[key] = p.holeScores.map((v) => v > 0)
    }
    return init
  })

  const [saveState, setSaveState] = useState<Record<string, SaveState>>(() => {
    const init: Record<string, SaveState> = {}
    for (const p of players) init[playerKey(p)] = 'idle'
    return init
  })

  // Track which players had user-driven changes (not just initial hydration)
  const userChanged = useRef<Record<string, boolean>>({})
  // Per-player debounce timers
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Single effect watches all scores/touched — dispatches per-player saves with 800ms debounce
  useEffect(() => {
    if (!scoringOpen) return
    for (const player of players) {
      const key = playerKey(player)
      if (!userChanged.current[key]) continue
      clearTimeout(timers.current[key])
      const sc = scores[key] ?? []
      const td = touched[key] ?? []
      timers.current[key] = setTimeout(async () => {
        setSaveState((prev) => ({ ...prev, [key]: 'saving' }))
        const payload = sc.map((v, i) => (td[i] ? (v ?? 0) : 0))
        const result = await submitScoreForFoursome(roundId, player.userId ?? null, player.subId ?? null, payload) as any
        setSaveState((prev) => ({ ...prev, [key]: result?.error ? 'error' : 'saved' }))
      }, 800)
    }
    return () => {
      for (const key of Object.keys(timers.current)) clearTimeout(timers.current[key])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, touched])

  const setScore = useCallback((key: string, hi: number, value: number) => {
    userChanged.current[key] = true
    setScores((prev) => {
      const next = { ...prev }
      const arr = [...(next[key] ?? [])]
      arr[hi] = Math.max(1, Math.min(20, value))
      next[key] = arr
      return next
    })
    setTouched((prev) => {
      const next = { ...prev }
      const arr = [...(next[key] ?? [])]
      arr[hi] = true
      next[key] = arr
      return next
    })
    setSaveState((prev) => ({ ...prev, [key]: 'idle' }))
  }, [])

  const commitPar = useCallback((key: string, hi: number) => {
    userChanged.current[key] = true
    const par = HOLES[hi].par
    setScores((prev) => {
      const next = { ...prev }
      const arr = [...(next[key] ?? [])]
      arr[hi] = arr[hi] ?? par
      next[key] = arr
      return next
    })
    setTouched((prev) => {
      const next = { ...prev }
      const arr = [...(next[key] ?? [])]
      arr[hi] = true
      next[key] = arr
      return next
    })
    setSaveState((prev) => ({ ...prev, [key]: 'idle' }))
  }, [])

  // Touch swipe navigation
  const swipeStart = useRef<number | null>(null)

  const hole = HOLES[holeIdx]

  return (
    <div
      style={{ background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      onTouchStart={(e) => { swipeStart.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (swipeStart.current == null) return
        const dx = e.changedTouches[0].clientX - swipeStart.current
        if (Math.abs(dx) > 40) setHoleIdx((h) => dx < 0 ? Math.min(8, h + 1) : Math.max(0, h - 1))
        swipeStart.current = null
      }}
    >
      <ScreenHeader roundNumber={roundNumber} roundDate={roundDate} scoringOpen={scoringOpen} />
      <TotalsStrip players={players} scores={scores} touched={touched} holeIdx={holeIdx} />
      <HoleHeader holeIdx={holeIdx} setHoleIdx={setHoleIdx} />
      <HoleStrip holeIdx={holeIdx} setHoleIdx={setHoleIdx} players={players} scores={scores} touched={touched} />
      <StackLayout
        holeIdx={holeIdx}
        players={players}
        scores={scores}
        touched={touched}
        saveState={saveState}
        scoringOpen={scoringOpen}
        setScore={setScore}
        commitPar={commitPar}
      />
    </div>
  )
}

// ─── Screen Header ────────────────────────────────────────────────────────────

function ScreenHeader({ roundNumber, roundDate, scoringOpen }: { roundNumber: number; roundDate: string; scoringOpen: boolean }) {
  return (
    <div style={{
      padding: '8px 14px 10px',
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#000', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* MK badge */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#0F1A0F',
        border: '1.5px solid #00C853',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_ANTON, color: '#00C853',
        fontSize: 13, letterSpacing: 0.5, flexShrink: 0,
      }}>MK</div>

      {/* Round info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-barlow), system-ui', fontWeight: 700,
          fontSize: 14, lineHeight: 1.1, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>Moose Knuckle</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10,
          color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: 0.5,
        }}>RD {roundNumber} · {roundDate}</div>
      </div>

      {/* Status */}
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textAlign: 'right' }}>
        {scoringOpen ? (
          <>
            <div>OPEN</div>
            <div style={{ color: '#00C853', marginTop: 2 }}>● LIVE</div>
          </>
        ) : (
          <div>CLOSED</div>
        )}
      </div>
    </div>
  )
}

// ─── Totals Strip ─────────────────────────────────────────────────────────────

function TotalsStrip({ players, scores, touched, holeIdx }: {
  players: FoursomePlayer[]
  scores: Record<string, (number | null)[]>
  touched: Record<string, boolean[]>
  holeIdx: number
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5,
      padding: '7px 10px',
      background: '#000', flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {players.map((p, i) => {
        const key = playerKey(p)
        const sc = scores[key] ?? []
        const td = touched[key] ?? []
        let gross = 0
        let parThru = 0
        let played = 0
        for (let hi = 0; hi <= holeIdx; hi++) {
          if (td[hi] && sc[hi] != null) {
            gross += sc[hi]!
            parThru += HOLES[hi].par
            played++
          }
        }
        const toPar = gross - parThru
        const toParStr = played === 0 ? '—' : toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`
        const toParColor = toPar < 0 ? '#00C853' : toPar > 0 ? '#FF7A6B' : 'rgba(255,255,255,0.6)'

        return (
          <div key={key} style={{
            background: '#161816', borderRadius: 10, padding: '5px 7px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <PlayerAvatar player={p} size={22} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10,
                color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5, textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1,
              }}>{p.displayName.split(' ')[0]}</div>
              <div style={{
                fontFamily: FONT_ANTON, fontSize: 15, color: '#fff',
                lineHeight: 1.1, marginTop: 2,
                display: 'flex', alignItems: 'baseline', gap: 3,
              }}>
                {played === 0 ? '—' : gross}
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: toParColor, letterSpacing: 0 }}>
                  {toParStr}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Hole Header ──────────────────────────────────────────────────────────────

function HoleHeader({ holeIdx, setHoleIdx }: { holeIdx: number; setHoleIdx: (i: number) => void }) {
  const h = HOLES[holeIdx]
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 8,
      padding: '8px 12px 6px', background: '#000', flexShrink: 0,
    }}>
      <button
        onClick={() => setHoleIdx((holeIdx - 1 + 9) % 9)}
        style={navBtnStyle()}
        aria-label="Previous hole"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
      </button>

      <div style={{
        flex: 1, background: '#0F1A0F',
        border: '1px solid rgba(0,200,83,0.25)',
        borderRadius: 10, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontFamily: FONT_ANTON, fontSize: 26, color: '#fff', lineHeight: 1, letterSpacing: 0.5 }}>
          HOLE {h.n}
        </div>
        <div style={{ flex: 1 }} />
        <HoleStat label="PAR" value={h.par} accent />
        <HoleStat label="HCP" value={h.hcp} />
      </div>

      <button
        onClick={() => setHoleIdx((holeIdx + 1) % 9)}
        style={navBtnStyle()}
        aria-label="Next hole"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 2l5 5-5 5" />
        </svg>
      </button>
    </div>
  )
}

function navBtnStyle(): React.CSSProperties {
  return {
    width: 38, background: '#161816', border: 'none', borderRadius: 10,
    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }
}

function HoleStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 28 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, lineHeight: 1 }}>{label}</div>
      <div style={{ fontFamily: FONT_ANTON, fontSize: 19, lineHeight: 1.1, marginTop: 2, color: accent ? '#00C853' : '#fff' }}>{value}</div>
    </div>
  )
}

// ─── Hole Strip ───────────────────────────────────────────────────────────────

function HoleStrip({ holeIdx, setHoleIdx, players, scores, touched }: {
  holeIdx: number
  setHoleIdx: (i: number) => void
  players: FoursomePlayer[]
  scores: Record<string, (number | null)[]>
  touched: Record<string, boolean[]>
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current.querySelector<HTMLElement>(`[data-hole-pill="${holeIdx}"]`)
    if (el) {
      const parent = ref.current
      const left = el.offsetLeft - (parent.clientWidth - el.offsetWidth) / 2
      parent.scrollTo({ left, behavior: 'smooth' })
    }
  }, [holeIdx])

  return (
    <div ref={ref} style={{
      display: 'flex', gap: 4, padding: '5px 10px 8px',
      overflowX: 'auto', scrollbarWidth: 'none',
      background: '#000', flexShrink: 0,
    }}>
      {HOLES.map((h, i) => {
        const allEntered = players.every((p) => {
          const key = playerKey(p)
          return (touched[key] ?? [])[i]
        })
        const isCur = i === holeIdx
        return (
          <button
            key={h.n}
            data-hole-pill={i}
            onClick={() => setHoleIdx(i)}
            style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 8,
              border: isCur ? '1.5px solid #00C853' : '1px solid transparent',
              background: isCur ? 'rgba(0,200,83,0.15)' : allEntered ? '#161816' : 'transparent',
              color: isCur ? '#00C853' : allEntered ? '#fff' : 'rgba(255,255,255,0.4)',
              fontFamily: FONT_ANTON, fontSize: 14,
              cursor: 'pointer', padding: 0, position: 'relative',
            }}
          >
            {h.n}
            {allEntered && !isCur && (
              <span style={{
                position: 'absolute', right: 3, top: 3,
                width: 4, height: 4, borderRadius: 2, background: '#00C853',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Stack Layout (Option A) ──────────────────────────────────────────────────

function StackLayout({ holeIdx, players, scores, touched, saveState, scoringOpen, setScore, commitPar }: {
  holeIdx: number
  players: FoursomePlayer[]
  scores: Record<string, (number | null)[]>
  touched: Record<string, boolean[]>
  saveState: Record<string, SaveState>
  scoringOpen: boolean
  setScore: (key: string, hi: number, value: number) => void
  commitPar: (key: string, hi: number) => void
}) {
  const hole = HOLES[holeIdx]

  return (
    <div style={{
      flex: 1, padding: '8px 10px 0',
      display: 'flex', flexDirection: 'column', gap: 7,
      overflowY: 'auto',
    }}>
      {players.map((p, i) => {
        const key = playerKey(p)
        const value = (scores[key] ?? [])[holeIdx] ?? null
        const isTouched = (touched[key] ?? [])[holeIdx]
        const getsStroke = p.handicap >= hole.hcp
        const sv = saveState[key]

        return (
          <div key={key} style={{
            background: '#161816', borderRadius: 14,
            padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <PlayerAvatar player={p} size={36} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />

            {/* Name + handicap */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-barlow), system-ui', fontWeight: 600, fontSize: 15,
                color: '#fff', lineHeight: 1.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{p.displayName}</div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10,
                color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, marginTop: 2,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span>HCP {p.handicap}</span>
                {getsStroke && <span style={{ color: '#00C853' }}>· 1 STROKE</span>}
                {sv === 'saving' && <span style={{ color: 'rgba(255,255,255,0.4)' }}>· ↻</span>}
                {sv === 'saved' && <span style={{ color: '#00C853' }}>· ✓</span>}
                {sv === 'error' && <span style={{ color: '#FF7A6B' }}>· !</span>}
              </div>
            </div>

            <ScoreControl
              value={isTouched ? value : null}
              defaultValue={hole.par}
              par={hole.par}
              disabled={!scoringOpen}
              onDecrement={() => setScore(key, holeIdx, Math.max(1, (isTouched && value != null ? value : hole.par) - 1))}
              onIncrement={() => setScore(key, holeIdx, (isTouched && value != null ? value : hole.par) + 1)}
              onCommit={() => commitPar(key, holeIdx)}
            />
          </div>
        )
      })}
      {/* Bottom padding so last row isn't clipped by bottom nav */}
      <div style={{ height: 8, flexShrink: 0 }} />
    </div>
  )
}

// ─── Score Control ────────────────────────────────────────────────────────────

function ScoreControl({ value, defaultValue, par, disabled, onDecrement, onIncrement, onCommit }: {
  value: number | null       // null = not yet entered
  defaultValue: number       // par (shown as placeholder)
  par: number
  disabled: boolean
  onDecrement: () => void
  onIncrement: () => void
  onCommit: () => void
}) {
  const isDefault = value == null
  const display = value ?? defaultValue
  const meta = scoreMeta(value, par)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={onDecrement}
        disabled={disabled}
        aria-label="Decrease score"
        style={ctrlBtnStyle(34, disabled)}
      >−</button>

      <button
        onClick={onCommit}
        disabled={disabled}
        style={{
          flex: '0 0 auto', minWidth: 58,
          background: '#0A0B0A',
          border: `1.5px solid ${isDefault ? 'rgba(255,255,255,0.12)' : meta.color}`,
          borderRadius: 10,
          padding: '5px 8px', cursor: disabled ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: disabled && !isDefault ? 1 : undefined,
        }}
        aria-label={isDefault ? 'Tap to log score' : `Score: ${display}`}
      >
        <span style={{
          fontFamily: FONT_ANTON, fontSize: 38,
          color: isDefault ? 'rgba(255,255,255,0.5)' : '#fff',
          lineHeight: 0.95,
          fontStyle: isDefault ? 'italic' : 'normal',
        }}>{display}</span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10,
          color: meta.color, letterSpacing: 1.5, marginTop: 2,
        }}>{isDefault ? 'TAP TO LOG' : meta.label}</span>
      </button>

      <button
        onClick={onIncrement}
        disabled={disabled}
        aria-label="Increase score"
        style={ctrlBtnStyle(34, disabled)}
      >+</button>
    </div>
  )
}

function ctrlBtnStyle(size: number, disabled: boolean): React.CSSProperties {
  return {
    width: size, height: size, flexShrink: 0,
    background: '#161816',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: Math.round(size / 3),
    color: '#fff',
    fontFamily: 'var(--font-barlow), system-ui',
    fontSize: size * 0.5, fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, padding: 0,
    opacity: disabled ? 0.4 : 1,
  }
}

// ─── Player Avatar ────────────────────────────────────────────────────────────

function PlayerAvatar({ player, size, color }: { player: FoursomePlayer; size: number; color: string }) {
  if (player.avatarUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <Image src={player.avatarUrl} alt={player.displayName} width={size} height={size} className="w-full h-full object-cover" unoptimized />
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      fontFamily: 'var(--font-barlow), system-ui',
      letterSpacing: 0.5, flexShrink: 0,
    }}>
      {getInitials(player.displayName)}
    </div>
  )
}

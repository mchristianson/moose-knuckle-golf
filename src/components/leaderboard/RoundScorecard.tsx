'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { HOLE_PARS, STROKE_INDEX } from '@/lib/constants/course'
import { formatRoundDate } from '@/lib/utils/date'
import { Icon } from '@/components/Icon'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export interface ScorecardScore {
  user_id: string
  full_name: string
  avatar_url: string | null
  team_name: string
  team_number: number
  gross_score: number | null
  net_score: number | null
  handicap_at_time: number | null
  hole_scores: number[]
}

export interface ScorecardRound {
  id: string
  round_number: number
  round_date: string
  status: string
  tee_time?: string | null
}

interface RoundScorecardProps {
  round: ScorecardRound
  scores: ScorecardScore[]
  showScoreButton?: boolean
}

type HoleView = 'front' | 'back' | 'full'

// Distribute handicap strokes across holes using stroke index (STROKE_INDEX lower = harder)
function strokesForHandicap(handicap: number): number[] {
  const hcp = Math.floor(handicap)
  return STROKE_INDEX.map((si) => {
    let strokes = 0
    if (si <= hcp) strokes += 1
    if (si <= hcp - 18) strokes += 1
    return strokes
  })
}

interface Tone {
  bg: string
  border: string
  fg: string
}

function tileTone(score: number, par: number): Tone {
  const d = score - par
  if (d <= -2) return { bg: 'rgba(202,138,4,0.20)', border: 'rgba(202,138,4,0.85)', fg: '#fbbf24' }
  if (d === -1) return { bg: 'rgba(220,38,38,0.22)', border: 'rgba(220,38,38,0.85)', fg: '#f87171' }
  if (d === 0)  return { bg: 'rgba(22,163,74,0.20)',  border: 'rgba(22,163,74,0.85)',  fg: '#4ade80' }
  if (d === 1)  return { bg: '#1f1f23',               border: '#3f3f46',               fg: '#a1a1aa' }
  if (d === 2)  return { bg: 'rgba(120,40,40,0.22)',  border: 'rgba(180,80,40,0.65)',  fg: '#fb923c' }
  return         { bg: 'rgba(120,30,30,0.30)',         border: 'rgba(239,68,68,0.85)',  fg: '#ef4444' }
}

const UNPLAYED_TONE: Tone = {
  bg: 'transparent',
  border: 'rgba(255,255,255,0.06)',
  fg: '#52525b',
}

interface TallyResult {
  gross: number | null
  net: number | null
  parSum: number
  played: number
}

function tallyRange(holeScores: number[], handicap: number, start: number, end: number): TallyResult {
  const strokes = strokesForHandicap(handicap)
  let gross = 0, net = 0, parSum = 0, played = 0
  for (let i = start; i < end; i++) {
    const s = holeScores[i]
    if (s > 0) {
      parSum += HOLE_PARS[i]
      gross += s
      net += s - strokes[i]
      played++
    }
  }
  return {
    gross: played > 0 ? gross : null,
    net:   played > 0 ? net   : null,
    parSum,
    played,
  }
}

function diffStr(value: number | null, parSum: number): string {
  if (value === null) return '—'
  const d = value - parSum
  if (d === 0) return 'E'
  return d > 0 ? `+${d}` : `${d}`
}

function netColor(netToPar: number | null): string {
  if (netToPar === null) return '#52525b'
  if (netToPar < 0) return '#f87171'
  if (netToPar === 0) return '#a1a1aa'
  return '#fafafa'
}

// ── HoleTileRow ───────────────────────────────────────────────────────────────

function HoleTileRow({
  holeScores,
  start,
  end,
  strokes,
  scoringRoundId,
}: {
  holeScores: number[]
  start: number
  end: number
  strokes: number[]
  scoringRoundId?: string
}) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: end - start }, (_, k) => {
        const i = start + k
        const score = holeScores[i]
        const played = score > 0
        const tone = played ? tileTone(score, HOLE_PARS[i]) : UNPLAYED_TONE
        const gotStroke = strokes[i] > 0 && played

        const tileContent = (
          <>
            <span
              className="tabular-nums leading-none"
              style={{ fontSize: 14, fontWeight: 800, color: tone.fg, letterSpacing: '-0.02em' }}
            >
              {played ? score : '—'}
            </span>
            {gotStroke && (
              <span
                className="absolute"
                style={{ top: 2, right: 3, width: 3, height: 3, borderRadius: 2, background: '#4ade80' }}
              />
            )}
          </>
        )

        const tileStyle: React.CSSProperties = {
          height: 38,
          borderRadius: 6,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
        }

        if (scoringRoundId) {
          return (
            <Link
              key={i}
              href={`/scores/${scoringRoundId}?hole=${i + 1}`}
              className="flex-1 min-w-0 relative flex flex-col items-center justify-center"
              style={tileStyle}
            >
              {tileContent}
            </Link>
          )
        }

        return (
          <div
            key={i}
            className="flex-1 min-w-0 relative flex flex-col items-center justify-center"
            style={tileStyle}
          >
            {tileContent}
          </div>
        )
      })}
    </div>
  )
}

// ── Subtotal ──────────────────────────────────────────────────────────────────

function Subtotal({
  label,
  tally,
  emphasized = false,
}: {
  label: string
  tally: TallyResult
  emphasized?: boolean
}) {
  const { gross, net, parSum, played } = tally
  const netToPar = net !== null ? net - parSum : null
  const diffColor = netToPar === null ? '#52525b' : netToPar < 0 ? '#f87171' : netToPar === 0 ? '#4ade80' : '#a1a1aa'

  return (
    <div className="flex items-baseline gap-1.5" style={{ fontFamily: 'inherit' }}>
      <span
        className="uppercase tabular-nums"
        style={{ fontSize: 10, color: '#52525b', fontWeight: 700, letterSpacing: '0.08em' }}
      >
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{ fontSize: emphasized ? 16 : 14, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}
      >
        {gross ?? '—'}
      </span>
      <span
        className="tabular-nums"
        style={{ fontSize: 11, fontWeight: 700, color: diffColor }}
      >
        {gross !== null ? diffStr(net, parSum) : ''}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RoundScorecard({ round, scores, showScoreButton = false }: RoundScorecardProps) {
  const [holeView, setHoleView] = useState<HoleView>('full')

  const visStart = holeView === 'back' ? 9 : 0
  const visEnd   = holeView === 'front' ? 9 : 18

  const isActive = round.status === 'in_progress' || round.status === 'scoring'
  const scoringRoundId = isActive ? round.id : undefined

  const ranked = useMemo(() => {
    return scores
      .map((s) => {
        const hcp = s.handicap_at_time ?? 0
        const t = tallyRange(s.hole_scores, hcp, visStart, visEnd)
        return { ...s, _tally: t, _hcp: hcp, _strokes: strokesForHandicap(hcp) }
      })
      .sort((a, b) => {
        if (a._tally.played === 0 && b._tally.played > 0) return 1
        if (b._tally.played === 0 && a._tally.played > 0) return -1
        const an = a._tally.net !== null ? a._tally.net - a._tally.parSum : 999
        const bn = b._tally.net !== null ? b._tally.net - b._tally.parSum : 999
        if (an !== bn) return an - bn
        return (a._tally.gross ?? 999) - (b._tally.gross ?? 999)
      })
  }, [scores, holeView, visStart, visEnd])

  const totalHoles = visEnd - visStart

  return (
    <div className="space-y-3">
      {/* Round header card */}
      <div
        className="mx-4 rounded-2xl px-4 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1b4d2e 0%, #1e6b3a 100%)' }}
      >
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Round {round.round_number}
          </p>
          <p className="text-white font-bold text-lg mt-0.5">
            {formatRoundDate(round.round_date)}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Legend&apos;s Golf Club · 18 Holes
          </p>
        </div>
        {showScoreButton && round.status === 'scoring' && (
          <Link
            href={`/scores/${round.id}`}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: '#16a34a' }}
          >
            <Icon icon={PencilSquareIcon} size="sm" />
            Enter Scores
          </Link>
        )}
      </div>

      {/* Hole view toggle */}
      <div className="px-4">
        <div className="flex bg-zinc-800 p-[3px] rounded-full gap-[2px]">
          {(['front', 'back', 'full'] as HoleView[]).map((v) => {
            const label = v === 'front' ? 'Front 9' : v === 'back' ? 'Back 9' : 'Full Round'
            return (
              <button
                key={v}
                onClick={() => setHoleView(v)}
                className="flex-1 py-[7px] px-3 rounded-full text-[13px] font-semibold transition-all duration-200"
                style={{
                  background: holeView === v ? '#27272a' : 'transparent',
                  color:      holeView === v ? '#fafafa'  : '#52525b',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="mx-4 bg-zinc-800 rounded-2xl px-4 py-10 text-center text-zinc-500">
          No scores entered yet.
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="flex items-center px-4 pb-1" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
            <div style={{ width: 36, marginRight: 10, flexShrink: 0 }} />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.08em]">Golfer</span>
            </div>
            <div style={{ width: 44, textAlign: 'center' }}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.06em]">Gross</span>
            </div>
            <div style={{ width: 50, textAlign: 'center' }}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.06em]">Net</span>
            </div>
            <div style={{ width: 32, textAlign: 'center' }}>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.06em]">Thru</span>
            </div>
          </div>

          {/* Player cards */}
          <div className="px-4 space-y-2">
            {ranked.map((s, idx) => {
              const t = s._tally
              const netToPar = t.net !== null ? t.net - t.parSum : null
              const grossToPar = t.gross !== null ? t.gross - t.parSum : null
              const isLeader = idx === 0 && t.played > 0
              const initials = s.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
              const thru = t.played === totalHoles ? 'F' : t.played === 0 ? '—' : `${t.played}`
              const thruColor = t.played === totalHoles ? '#4ade80' : t.played > 0 ? '#a1a1aa' : '#52525b'

              const frontTally = tallyRange(s.hole_scores, s._hcp, 0, 9)
              const backTally  = tallyRange(s.hole_scores, s._hcp, 9, 18)

              return (
                <div key={s.user_id} className="bg-zinc-800 rounded-2xl p-3 space-y-2.5">
                  {/* Summary row */}
                  <div className="flex items-center">
                    {/* Avatar */}
                    <div
                      className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        marginRight: 10,
                        background: s.avatar_url ? 'transparent' : '#1b4d2e',
                        outline: isLeader ? '2.5px solid #ca8a04' : 'none',
                        outlineOffset: 2,
                      }}
                    >
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold" style={{ fontSize: 12 }}>{initials}</span>
                      )}
                    </div>

                    {/* Name + team */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate" style={{ fontSize: 14 }}>{s.full_name}</p>
                      <p className="text-green-500 truncate mt-0.5" style={{ fontSize: 11 }}>{s.team_name}</p>
                    </div>

                    {/* Gross */}
                    <div style={{ width: 44, textAlign: 'center' }}>
                      <div className="tabular-nums font-semibold text-zinc-400" style={{ fontSize: 12 }}>
                        {t.gross ?? '—'}
                      </div>
                      <div className="tabular-nums text-zinc-500" style={{ fontSize: 10 }}>
                        {grossToPar !== null ? (grossToPar === 0 ? 'E' : grossToPar > 0 ? `+${grossToPar}` : `${grossToPar}`) : ''}
                      </div>
                    </div>

                    {/* Net */}
                    <div style={{ width: 50, textAlign: 'center' }}>
                      <span
                        className="tabular-nums"
                        style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: netColor(netToPar) }}
                      >
                        {netToPar === null ? '—' : netToPar === 0 ? 'E' : netToPar > 0 ? `+${netToPar}` : `${netToPar}`}
                      </span>
                    </div>

                    {/* Thru */}
                    <div style={{ width: 32, textAlign: 'center' }}>
                      <span className="tabular-nums font-bold" style={{ fontSize: 13, color: thruColor }}>
                        {thru}
                      </span>
                    </div>
                  </div>

                  {/* Hole tiles */}
                  <div className="space-y-1.5">
                    {holeView === 'front' && (
                      <>
                        <HoleTileRow holeScores={s.hole_scores} start={0} end={9} strokes={s._strokes} scoringRoundId={scoringRoundId} />
                        <div className="flex justify-end">
                          <Subtotal label="OUT" tally={t} />
                        </div>
                      </>
                    )}

                    {holeView === 'back' && (
                      <>
                        <HoleTileRow holeScores={s.hole_scores} start={9} end={18} strokes={s._strokes} scoringRoundId={scoringRoundId} />
                        <div className="flex justify-end">
                          <Subtotal label="IN" tally={t} />
                        </div>
                      </>
                    )}

                    {holeView === 'full' && (
                      <>
                        <HoleTileRow holeScores={s.hole_scores} start={0} end={9} strokes={s._strokes} scoringRoundId={scoringRoundId} />
                        <div className="flex justify-end">
                          <Subtotal label="OUT" tally={frontTally} />
                        </div>
                        <HoleTileRow holeScores={s.hole_scores} start={9} end={18} strokes={s._strokes} scoringRoundId={scoringRoundId} />
                        <div className="flex justify-end">
                          <Subtotal label="IN" tally={backTally} />
                        </div>
                        <div
                          className="flex justify-end pt-1"
                          style={{ borderTop: '1px solid #27272a', marginTop: 2 }}
                        >
                          <Subtotal label="TOTAL" tally={t} emphasized />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Score key */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-1 pb-2">
            {[
              { label: 'Eagle', color: '#fbbf24' },
              { label: 'Birdie', color: '#f87171' },
              { label: 'Par', color: '#4ade80' },
              { label: 'Bogey', color: '#a1a1aa' },
              { label: 'Double+', color: '#fb923c' },
            ].map(({ label, color }) => (
              <span key={label} className="text-[10px]" style={{ color }}>
                {label}
              </span>
            ))}
            <span className="text-[10px] text-zinc-500">· = stroke</span>
          </div>
        </>
      )}
    </div>
  )
}

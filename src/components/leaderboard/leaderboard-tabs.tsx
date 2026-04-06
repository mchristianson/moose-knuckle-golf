'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HOLE_PARS, STROKE_INDEX } from '@/lib/constants/course'
import { formatRoundDate, formatTeeTime } from '@/lib/utils/date'
import { Icon } from '@/components/Icon'
import {
  TrophyIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

interface StandingRow {
  team_id: string
  team_name: string
  team_number: number
  total_points: number
  rounds_played: number
  avg_net_score: number | null
}

interface RoundPointsRow {
  finish_position: number
  net_score: number
  points_earned: number
  is_tied: boolean
  team: { team_name: string; team_number: number }
  golfer_name?: string
}

interface RecentRound {
  id: string
  round_number: number
  round_date: string
  round_points: RoundPointsRow[]
}

interface CurrentRoundScore {
  user_id: string
  full_name: string
  avatar_url: string | null
  team_name: string
  team_number: number
  gross_score: number | null
  net_score: number | null
  handicap_at_time: number | null
  hole_scores: number[]
  is_locked: boolean
}

interface CurrentRound {
  id: string
  round_number: number
  round_date: string
  status: string
  tee_time?: string | null
}

interface NextRoundAvailability {
  user_id: string
  team_id: string
  status: 'in' | 'out'
  full_name: string
  team_name: string
  team_number: number
}

interface NextRoundFoursome {
  id: string
  tee_time_slot: number
  tee_time: string | null
  members: {
    user_id: string
    cart_number: number
    is_sub: boolean
    full_name: string
    team_name: string
    team_number: number
  }[]
}

interface NextRound {
  id: string
  round_number: number
  round_date: string
  status: string
  tee_time: string
}

interface TeamMember {
  user_id: string
  team_id: string
  full_name: string
  team_name: string
  team_number: number
}

interface LeaderboardTabsProps {
  standings: StandingRow[]
  recentRounds: RecentRound[]
  currentRound: CurrentRound | null
  currentRoundScores: CurrentRoundScore[]
  currentRoundFoursomes: NextRoundFoursome[]
  nextRound: NextRound | null
  nextRoundAvailability: NextRoundAvailability[]
  nextRoundTeamMembers: TeamMember[]
  nextRoundFoursomes: NextRoundFoursome[]
  currentYear: number
  userHasDeclared: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function strokesPerHoleForHandicap(handicap: number): number[] {
  return HOLE_PARS.map((_, i) => {
    const si = STROKE_INDEX[i]
    if (handicap >= 9) return si <= (handicap - 9) ? 2 : 1
    return si <= handicap ? 1 : 0
  })
}

function scoreToPar(holeScores: number[], handicap: number): number | null {
  const played = holeScores.map((s, i) => ({ score: s, hole: i })).filter(h => h.score > 0)
  if (played.length === 0) return null
  const strokes = strokesPerHoleForHandicap(handicap)
  let total = 0
  for (const { score, hole } of played) total += (score - strokes[hole]) - HOLE_PARS[hole]
  return total
}

function grossToPar(holeScores: number[]): number | null {
  const played = holeScores.map((s, i) => ({ score: s, hole: i })).filter(h => h.score > 0)
  if (played.length === 0) return null
  let total = 0
  for (const { score, hole } of played) total += score - HOLE_PARS[hole]
  return total
}

function fmt(score: number | null, holes: number): string {
  if (score === null || holes === 0) return '—'
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

function addMinutes(timeStr: string, offset: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + offset
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function netColor(score: number | null): string {
  if (score === null) return 'text-zinc-500'
  if (score < 0) return 'text-red-500'
  if (score === 0) return 'text-zinc-400'
  return 'text-zinc-200'
}

function grossColor(score: number | null): string {
  if (score === null) return 'text-zinc-500'
  return 'text-zinc-400'
}

// ── Foursomes ─────────────────────────────────────────────────────────────────

function FoursomesList({
  foursomes,
  roundTeeTime,
}: {
  foursomes: NextRoundFoursome[]
  roundTeeTime?: string | null
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(foursomes.slice(0, 1).map(f => f.id))
  )

  const toggle = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-2">
      {foursomes.map((foursome) => {
        const expanded = expandedIds.has(foursome.id)
        const cart1 = foursome.members.filter(m => m.cart_number === 1)
        const cart2 = foursome.members.filter(m => m.cart_number === 2)
        const slotTime =
          foursome.tee_time ??
          (roundTeeTime ? addMinutes(roundTeeTime, (foursome.tee_time_slot - 1) * 10) : null)
        const label = slotTime ? formatTeeTime(slotTime) : `Group ${foursome.tee_time_slot}`

        return (
          <div key={foursome.id} className="rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(foursome.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 font-semibold text-base transition-colors ${
                expanded ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <Icon icon={expanded ? ChevronUpIcon : ChevronDownIcon} size="sm" />
              {label}
            </button>
            {expanded && (
              <div className="bg-zinc-900 grid grid-cols-2 divide-x divide-zinc-800">
                {[{ num: 1, members: cart1 }, { num: 2, members: cart2 }].map(({ num, members: cm }) => (
                  <div key={num} className="p-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Cart {num}</p>
                    <div className="space-y-3">
                      {cm.map(member => (
                        <div key={member.user_id ?? member.full_name}>
                          <p className="font-semibold text-white text-sm">{member.full_name}</p>
                          <p className="text-xs text-green-500 mt-0.5">
                            Team {member.team_number} · {member.team_name}
                          </p>
                          {member.is_sub && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-900/50 text-blue-400 text-xs font-semibold rounded">
                              Sub
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function LeaderboardTabs({
  standings,
  recentRounds,
  currentRound,
  currentRoundScores,
  currentRoundFoursomes,
  nextRound,
  nextRoundAvailability,
  nextRoundTeamMembers,
  nextRoundFoursomes,
  currentYear,
  userHasDeclared,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'current' | 'next'>(
    currentRound ? 'current' : nextRound ? 'next' : 'season'
  )

  const tabBtn = (tab: 'season' | 'current' | 'next', label: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
        activeTab === tab
          ? 'bg-green-500 text-white'
          : 'border border-zinc-700 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )

  const scoredPlayers = currentRoundScores
    .map(s => {
      const holesPlayed = s.hole_scores.filter(h => h > 0).length
      const toPar = scoreToPar(s.hole_scores, s.handicap_at_time ?? 0)
      const gross = grossToPar(s.hole_scores)
      return { ...s, holesPlayed, toPar, gross }
    })
    .sort((a, b) => {
      if (a.holesPlayed === 0 && b.holesPlayed > 0) return 1
      if (b.holesPlayed === 0 && a.holesPlayed > 0) return -1
      const as = a.toPar ?? Infinity
      const bs = b.toPar ?? Infinity
      if (as !== bs) return as - bs
      return b.holesPlayed - a.holesPlayed
    })

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Title */}
      <div className="px-4 pt-3 pb-4">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{currentYear} Season</p>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 flex-wrap mb-4">
        {tabBtn('season', 'Season Standings')}
        {currentRound &&
          tabBtn(
            'current',
            <span className="flex items-center gap-2">
              Current Round
              {currentRound.status === 'in_progress' && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </span>
          )}
        {nextRound && tabBtn('next', 'Next Round')}
      </div>

      {/* ── Season tab ── */}
      {activeTab === 'season' && (
        <div className="space-y-4">
          {/* Standings table */}
          <div className="mx-4 bg-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-700">
              <h2 className="text-white font-semibold">Season Standings</h2>
            </div>
            {!standings || standings.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500">No completed rounds yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-12">Rank</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Team</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rds</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Avg</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {standings.map((row, idx) => (
                    <tr key={row.team_id} className="hover:bg-zinc-700/30">
                      <td className="px-4 py-3 text-center">
                        {idx === 0
                          ? <Icon icon={TrophyIcon} size="sm" className="text-yellow-400 mx-auto" />
                          : <span className="text-zinc-400 font-semibold">{idx + 1}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">{row.team_name}</td>
                      <td className="px-4 py-3 text-center text-zinc-400">{row.rounds_played}</td>
                      <td className="px-4 py-3 text-center text-zinc-400">
                        {row.avg_net_score != null ? row.avg_net_score : '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-400 text-lg">{row.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent rounds */}
          {recentRounds && recentRounds.length > 0 && (
            <div className="px-4 space-y-3">
              <h2 className="text-white text-lg font-bold">Recent Results</h2>
              {recentRounds.map(round => {
                const sorted = [...(round.round_points ?? [])].sort((a, b) => a.finish_position - b.finish_position)
                return (
                  <div key={round.id} className="bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="bg-zinc-700 px-4 py-3">
                      <p className="text-white font-semibold">Round {round.round_number}</p>
                      <p className="text-zinc-400 text-sm">{formatRoundDate(round.round_date)}</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-10">Pos</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Golfer</th>
                          <th className="text-center px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Net</th>
                          <th className="text-center px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-700/50">
                        {sorted.map((p: any) => {
                          const team = Array.isArray(p.team) ? p.team[0] : p.team
                          const golfer = p.golfer
                          return (
                            <tr key={`${p.finish_position}-${team?.team_number}`} className="hover:bg-zinc-700/30">
                              <td className="px-4 py-2.5 text-zinc-400 font-semibold">
                                {p.finish_position}{p.is_tied ? 'T' : ''}
                              </td>
                              <td className="px-4 py-2.5">
                                <p className="text-white font-medium">{golfer?.full_name ?? '—'}</p>
                                <p className="text-xs text-green-500">{team?.team_name ?? '—'}</p>
                              </td>
                              <td className="px-4 py-2.5 text-center text-zinc-300">{p.net_score}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-green-400">{p.points_earned}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Current round tab ── */}
      {activeTab === 'current' && (
        <div className="space-y-3">
          {!currentRound ? (
            <div className="mx-4 bg-zinc-800 rounded-xl px-4 py-12 text-center text-zinc-500">
              No round is currently in progress.
            </div>
          ) : (
            <>
              {/* Round header card */}
              <div className="mx-4 bg-green-600 rounded-xl px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-widest">
                    Round {currentRound.round_number}
                  </p>
                  <p className="text-white font-bold text-xl mt-0.5">
                    {formatRoundDate(currentRound.round_date)}
                  </p>
                </div>
                {currentRound.status === 'scoring' && (
                  <Link
                    href={`/scores/${currentRound.id}`}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
                  >
                    <Icon icon={PencilSquareIcon} size="sm" />
                    Enter Scores
                  </Link>
                )}
              </div>

              {/* Course + par row */}
              <div className="mx-4 bg-zinc-800 rounded-xl px-4 py-3">
                <p className="text-zinc-400 text-xs mb-2">Par 36 · Legend&apos;s Golf Club · Front 9</p>
                <div className="flex gap-1.5">
                  {HOLE_PARS.map((par, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300"
                    >
                      {par}
                    </div>
                  ))}
                </div>
              </div>

              {scoredPlayers.length === 0 ? (
                <div className="mx-4 bg-zinc-800 rounded-xl px-4 py-10 text-center text-zinc-500">
                  No scores entered yet.
                </div>
              ) : (
                <div>
                  {/* Column headers */}
                  <div className="flex items-center px-4 pb-1.5">
                    <div className="w-9 mr-3 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Golfer</span>
                    </div>
                    <div className="w-12 text-center">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Gross</span>
                    </div>
                    <div className="w-14 text-center">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Net</span>
                    </div>
                    <div className="w-10 text-center">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Thru</span>
                    </div>
                  </div>

                  {/* Player row cards */}
                  <div className="space-y-2 px-4">
                    {scoredPlayers.map((s, idx) => {
                      const netStr = fmt(s.toPar, s.holesPlayed)
                      const grossStr = fmt(s.gross, s.holesPlayed)
                      const thruStr = s.holesPlayed === 0 ? '—' : s.holesPlayed === 9 ? 'F' : `${s.holesPlayed}`
                      const isLeader = idx === 0 && s.holesPlayed > 0

                      return (
                        <div
                          key={s.user_id}
                          className="flex items-center bg-zinc-800 rounded-xl px-3 py-3"
                        >
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full shrink-0 mr-3 overflow-hidden flex items-center justify-center ${
                            isLeader ? 'ring-2 ring-yellow-400' : ''
                          } ${s.avatar_url ? '' : 'bg-green-700'}`}>
                            {s.avatar_url ? (
                              <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">
                                {s.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                              </span>
                            )}
                          </div>

                          {/* Name + team */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{s.full_name}</p>
                            <p className="text-green-500 text-xs truncate">{s.team_name}</p>
                          </div>

                          {/* Gross */}
                          <div className={`w-12 text-center text-sm font-medium tabular-nums ${grossColor(s.gross)}`}>
                            {grossStr}
                          </div>

                          {/* Net — large + colored */}
                          <div className={`w-14 text-center font-black text-2xl tabular-nums leading-none ${netColor(s.toPar)}`}>
                            {netStr}
                          </div>

                          {/* Thru */}
                          <div className={`w-10 text-center text-sm font-semibold tabular-nums ${
                            s.holesPlayed === 9 ? 'text-green-400' :
                            s.holesPlayed > 0 ? 'text-zinc-300' : 'text-zinc-600'
                          }`}>
                            {thruStr}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-x-4 flex-wrap px-4 pt-3 text-xs text-zinc-500">
                    <span><span className="font-semibold text-red-500">−#</span> Under par</span>
                    <span><span className="font-semibold text-zinc-400">E</span> Even</span>
                    <span><span className="font-semibold text-zinc-300">+#</span> Over par</span>
                  </div>
                </div>
              )}

              {/* Foursomes */}
              {currentRoundFoursomes.length > 0 && (
                <div className="px-4 pt-2">
                  <h3 className="text-white text-lg font-bold mb-3">Foursomes</h3>
                  <FoursomesList foursomes={currentRoundFoursomes} roundTeeTime={currentRound.tee_time} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Next round tab ── */}
      {activeTab === 'next' && (
        <div className="space-y-3 px-4">
          {!nextRound ? (
            <div className="bg-zinc-800 rounded-xl px-4 py-12 text-center text-zinc-500">
              No upcoming rounds scheduled.
            </div>
          ) : (
            <>
              {/* Round header */}
              <div className="bg-green-600 rounded-xl px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-xs font-semibold uppercase tracking-widest">
                    Round {nextRound.round_number}
                  </p>
                  <p className="text-white font-bold text-xl mt-0.5">{formatRoundDate(nextRound.round_date)}</p>
                  {nextRound.tee_time && (
                    <p className="text-green-200 text-sm mt-0.5">Tee time: {formatTeeTime(nextRound.tee_time)}</p>
                  )}
                </div>
                {!userHasDeclared && (
                  <Link
                    href={`/availability/${nextRound.id}`}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ml-4"
                  >
                    <Icon icon={ClipboardDocumentListIcon} size="sm" />
                    Declare
                  </Link>
                )}
              </div>

              {/* Foursomes */}
              {nextRoundFoursomes.length > 0 ? (
                <div>
                  <h3 className="text-white text-lg font-bold mb-3">Foursomes</h3>
                  <FoursomesList foursomes={nextRoundFoursomes} roundTeeTime={nextRound.tee_time} />
                </div>
              ) : (
                <div className="bg-zinc-800 rounded-xl px-4 py-8 text-center text-zinc-500">
                  Foursomes have not been generated yet.
                </div>
              )}

              {/* Availability summary */}
              {nextRoundTeamMembers.length > 0 && (
                <div className="bg-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-700">
                    <h3 className="text-white font-semibold">Availability</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {Array.from(new Set(nextRoundTeamMembers.map(m => m.team_id)))
                      .sort((a, b) => {
                        const ta = nextRoundTeamMembers.find(m => m.team_id === a)!
                        const tb = nextRoundTeamMembers.find(m => m.team_id === b)!
                        return ta.team_number - tb.team_number
                      })
                      .map(teamId => {
                        const members = nextRoundTeamMembers.filter(m => m.team_id === teamId)
                        const rep = members[0]
                        return (
                          <div key={teamId} className="bg-zinc-900 rounded-lg p-3">
                            <p className="text-xs font-semibold text-zinc-400 mb-2">T{rep.team_number}</p>
                            <div className="space-y-1">
                              {members.map(member => {
                                const avail = nextRoundAvailability.find(a => a.user_id === member.user_id)
                                const isIn = avail?.status === 'in'
                                const isOut = avail?.status === 'out'
                                return (
                                  <div key={member.user_id} className="flex items-center gap-1.5">
                                    <span className={`text-base leading-none ${isIn ? 'text-green-500' : isOut ? 'text-red-500' : 'text-zinc-600'}`}>
                                      {isIn ? '✓' : isOut ? '✗' : '?'}
                                    </span>
                                    <span className={`text-xs truncate ${isIn ? 'text-green-400' : isOut ? 'text-red-400' : 'text-zinc-500'}`}>
                                      {member.full_name}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {userHasDeclared && (
                <Link
                  href={`/availability/${nextRound.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  <Icon icon={ClipboardDocumentListIcon} size="sm" />
                  Update Declaration
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

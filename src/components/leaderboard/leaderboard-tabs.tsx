'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HOLE_PARS, STROKE_INDEX } from '@/lib/constants/course'
import { formatRoundDate, formatTeeTime } from '@/lib/utils/date'
import { Icon } from '@/components/Icon'
import { TrophyIcon, ClockIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { RoundAvailabilityGrid } from '@/components/RoundAvailabilityGrid'

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function medal(idx: number): React.ReactNode {
  if (idx === 0) return <Icon icon={TrophyIcon} size="md" />
  if (idx === 1) return <span className="font-semibold text-sm">2nd</span>
  if (idx === 2) return <span className="font-semibold text-sm">3rd</span>
  return <span className="font-semibold text-sm">{idx + 1}</span>
}


/** Short first name + last initial: "Matthew Christianson" → "Matt C" */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}`
}


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
  for (const { score, hole } of played) {
    total += (score - strokes[hole]) - HOLE_PARS[hole]
  }
  return total
}

function grossToPar(holeScores: number[]): number | null {
  const played = holeScores.map((s, i) => ({ score: s, hole: i })).filter(h => h.score > 0)
  if (played.length === 0) return null

  let total = 0
  for (const { score, hole } of played) {
    total += score - HOLE_PARS[hole]
  }
  return total
}


function formatScoreToPar(score: number | null, holesPlayed: number): string {
  if (score === null || holesPlayed === 0) return '—'
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

/** Add `offsetMinutes` to a HH:MM time string */
function addMinutes(timeStr: string, offsetMinutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + offsetMinutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score < 0) return 'text-red-600'   // under par = red (good, traditional golf)
  if (score === 0) return 'text-green-700'
  return 'text-gray-900'                 // over par
}

// ── Component ────────────────────────────────────────────────────────────────

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
    nextRound ? 'next' : currentRound ? 'current' : 'season'
  )

  const tabClass = (tab: 'season' | 'current' | 'next') =>
    `px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-green-600 text-green-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`

  // Compute score-to-par and running net score for each player and sort
  const scoredPlayers = currentRoundScores.map((s) => {
    const holesPlayed = s.hole_scores.filter(h => h > 0).length
    const toPar = scoreToPar(s.hole_scores, s.handicap_at_time ?? 0)
    const gross = grossToPar(s.hole_scores)
    return { ...s, holesPlayed, toPar, gross }
  }).sort((a, b) => {
    // Players with more holes played sort before those with none
    if (a.holesPlayed === 0 && b.holesPlayed > 0) return 1
    if (b.holesPlayed === 0 && a.holesPlayed > 0) return -1
    // Sort by score to par (lowest = best)
    const aScore = a.toPar ?? Infinity
    const bScore = b.toPar ?? Infinity
    if (aScore !== bScore) return aScore - bScore
    // Tiebreak: more holes played ranks higher (they've done more)
    return b.holesPlayed - a.holesPlayed
  })

  return (
    <div className="max-w-4xl mx-auto pt-1 pb-8">
      <h1 className="text-3xl font-bold mb-0.5 px-4">Leaderboard</h1>
      <p className="text-gray-500 mb-4 px-4">{currentYear} Season</p>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 px-4">
        <button className={tabClass('season')} onClick={() => setActiveTab('season')}>
          Season Standings
        </button>
        {currentRound && (
          <button className={tabClass('current')} onClick={() => setActiveTab('current')}>
            <span className="flex items-center gap-2">
              Current Round
              {currentRound.status === 'in_progress' && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </span>
          </button>
        )}
        {nextRound && (
          <button className={tabClass('next')} onClick={() => setActiveTab('next')}>
            Next Round
          </button>
        )}
      </div>

      {/* ── Season tab ── */}
      {activeTab === 'season' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4">
              <h2 className="text-xl font-semibold">Season Standings</h2>
            </div>
            {!standings || standings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No completed rounds yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600 w-16">Rank</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Team</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Rounds</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Avg Net</th>
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {standings.map((row, idx) => (
                    <tr key={row.team_id} className={idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 font-bold text-lg text-center">{medal(idx)}</td>
                      <td className="px-6 py-4 font-semibold">{row.team_name}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{row.rounds_played}</td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {row.avg_net_score != null ? row.avg_net_score : '—'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-green-700 text-lg">{row.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {recentRounds && recentRounds.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 px-4 sm:px-0">Recent Results</h2>
              <div className="space-y-4">
                {recentRounds.map((round) => {
                  const sorted = [...(round.round_points ?? [])].sort(
                    (a, b) => a.finish_position - b.finish_position
                  )
                  return (
                    <div key={round.id} className="bg-white rounded-xl shadow overflow-hidden">
                      <div className="bg-gray-700 text-white px-4 py-3">
                        <h3 className="font-semibold">Round {round.round_number}</h3>
                        <p className="text-gray-300 text-sm">{formatRoundDate(round.round_date)}</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 w-12">Pos</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Golfer</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">Net</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sorted.map((p: any) => {
                            const team = Array.isArray(p.team) ? p.team[0] : p.team
                            const golfer = p.golfer
                            const golferName = golfer?.full_name ?? '—'
                            const keyValue = `${p.finish_position}-${golferName}-${team?.team_number}`
                            return (
                              <tr key={keyValue} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-semibold text-gray-700">
                                  {p.finish_position}{p.is_tied ? 'T' : ''}
                                </td>
                                <td className="px-4 py-2.5 font-medium">
                                  <div>{golferName}</div>
                                  <div className="text-xs text-gray-500">{team?.team_name ?? '—'}</div>
                                </td>
                                <td className="px-4 py-2.5 text-center text-gray-600">{p.net_score}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-green-700">{p.points_earned}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Current round tab ── */}
      {activeTab === 'current' && (
        <div>
          {!currentRound ? (
            <div className="bg-white rounded-xl shadow px-6 py-12 text-center text-gray-500">
              <p className="text-lg">No round is currently in progress.</p>
              <p className="text-sm mt-1">Check back once a round has started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Round header */}
              <div className="bg-green-700 text-white px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-xs font-medium uppercase tracking-widest">Round {currentRound.round_number}</p>
                  <p className="font-semibold">{formatRoundDate(currentRound.round_date)}</p>
                </div>
                {currentRound.status === 'scoring' ? (
                  <Link
                    href={`/scores/${currentRound.id}`}
                    className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-50 transition-colors shadow-sm"
                  >
                    <Icon icon={ClipboardDocumentListIcon} size="sm" />
                    Enter Scores
                  </Link>
                ) : (
                  <span className="text-xs bg-green-600 border border-green-500 px-3 py-1 rounded-full font-medium capitalize flex items-center gap-1.5">
                    {currentRound.status === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                    {currentRound.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Par row */}
              <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">Par 36 · Legend&apos;s Golf Club · Front 9</span>
                <span>4&nbsp;4&nbsp;4&nbsp;5&nbsp;3&nbsp;4&nbsp;3&nbsp;4&nbsp;5</span>
              </div>

              {scoredPlayers.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-500">
                  No scores have been entered yet.
                </div>
              ) : (
                <>
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span>Golfer</span>
                    <span className="w-14 text-center">Gross</span>
                    <span className="w-14 text-center">Net</span>
                    <span className="w-12 text-center">Thru</span>
                  </div>

                  {/* Player rows */}
                  <div className="divide-y">
                    {scoredPlayers.map((s, idx) => {
                      const netStr = formatScoreToPar(s.toPar, s.holesPlayed)
                      const grossStr = formatScoreToPar(s.gross, s.holesPlayed)
                      const thruStr = s.holesPlayed === 0 ? '—' : s.holesPlayed === 9 ? 'F' : `${s.holesPlayed}`
                      const isLeader = idx === 0 && s.holesPlayed > 0
                      const name = shortName(s.full_name)

                      return (
                        <div
                          key={s.user_id}
                          className={`grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3.5 ${
                            isLeader ? 'bg-yellow-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Golfer info */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Position */}
                            <span className="text-sm font-bold text-gray-500 w-5 shrink-0 text-center">
                              {s.holesPlayed === 0 ? '—' : isLeader ? <Icon icon={TrophyIcon} size="sm" /> : idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{name}</p>
                              <p className="text-xs text-gray-400 truncate">{s.team_name}</p>
                            </div>
                          </div>

                          {/* Gross score to par */}
                          <div className={`w-14 text-center font-semibold text-sm tabular-nums ${scoreColor(s.gross)}`}>
                            {grossStr}
                          </div>

                          {/* Net score to par */}
                          <div className={`w-14 text-center font-black text-xl tabular-nums ${scoreColor(s.toPar)}`}>
                            {netStr}
                          </div>

                          {/* Through */}
                          <div className="w-12 text-center">
                            <span className={`text-sm font-semibold tabular-nums ${
                              s.holesPlayed === 9 ? 'text-green-700' :
                              s.holesPlayed > 0 ? 'text-gray-700' : 'text-gray-300'
                            }`}>
                              {thruStr}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="px-4 py-3 bg-gray-50 border-t flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span><span className="font-semibold text-red-600">−#</span> Under par</span>
                    <span><span className="font-semibold text-green-700">E</span> Even</span>
                    <span><span className="font-semibold text-gray-900">+#</span> Over par</span>
                    <span className="ml-auto"><span className="font-semibold">F</span> = Finished · Net adjusted for handicap</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Foursomes for current round */}
          {currentRound && currentRoundFoursomes.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-xl font-bold px-4 sm:px-0">Foursomes</h3>
              {currentRoundFoursomes.map((foursome) => {
                const cart1 = foursome.members.filter((m) => m.cart_number === 1)
                const cart2 = foursome.members.filter((m) => m.cart_number === 2)
                const roundTime = currentRound.tee_time
                const slotTime = foursome.tee_time
                  ?? (roundTime
                      ? addMinutes(roundTime, (foursome.tee_time_slot - 1) * 10)
                      : null)
                const teeLabel = slotTime ? formatTeeTime(slotTime) : `Group ${foursome.tee_time_slot}`
                return (
                  <div key={foursome.id} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-green-700 text-white px-4 py-3 flex items-center gap-2">
                      <Icon icon={ClockIcon} size="sm" className="text-gray-300" />
                      <span className="font-semibold">{teeLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-100">
                      {[{ num: 1, members: cart1 }, { num: 2, members: cart2 }].map(({ num, members: cartMembers }) => (
                        <div key={num} className="p-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                            Cart {num}
                          </p>
                          <div className="space-y-3">
                            {cartMembers.map((member) => (
                              <div key={member.user_id} className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 leading-tight">{member.full_name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Team {member.team_number} · {member.team_name}</p>
                                </div>
                                {member.is_sub && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    Sub
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Next round tab ── */}
      {activeTab === 'next' && (
        <div>
          {!nextRound ? (
            <div className="bg-white rounded-xl shadow px-6 py-12 text-center text-gray-500">
              <p className="text-lg">No upcoming rounds scheduled.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Next Round Header — only shown prominently when user hasn't declared yet */}
              {!userHasDeclared && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-blue-600 text-white px-4 py-4 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-blue-300 text-xs font-medium uppercase tracking-widest">Round {nextRound.round_number}</p>
                      <p className="font-semibold text-lg">{formatRoundDate(nextRound.round_date)}</p>
                      {nextRound.tee_time && (
                        <p className="text-blue-200 text-sm mt-1 flex items-center gap-2">
                          <Icon icon={ClockIcon} size="sm" className="text-blue-200" />
                          Tee time: {formatTeeTime(nextRound.tee_time)}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/availability/${nextRound.id}`}
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap shrink-0 ml-4"
                    >
                      <Icon icon={ClipboardDocumentListIcon} size="sm" />
                      Declare
                    </Link>
                  </div>
                </div>
              )}

              {/* Round info header when user has already declared (compact) */}
              {userHasDeclared && (
                <div className="px-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Round {nextRound.round_number}</p>
                  <p className="font-bold text-xl text-gray-900">{formatRoundDate(nextRound.round_date)}</p>
                  {nextRound.tee_time && (
                    <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                      <Icon icon={ClockIcon} size="sm" className="text-gray-400" />
                      First tee: {formatTeeTime(nextRound.tee_time)}
                    </p>
                  )}
                </div>
              )}

              {/* Foursomes */}
              {nextRoundFoursomes.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold px-4 sm:px-0">Foursomes</h3>
                  {nextRoundFoursomes.map((foursome) => {
                    const cart1 = foursome.members.filter((m) => m.cart_number === 1)
                    const cart2 = foursome.members.filter((m) => m.cart_number === 2)
                    const roundTime = nextRound.tee_time
                    const slotTime = foursome.tee_time
                      ?? (roundTime
                          ? addMinutes(roundTime, (foursome.tee_time_slot - 1) * 10)
                          : null)
                    const teeLabel = slotTime ? formatTeeTime(slotTime) : `Group ${foursome.tee_time_slot}`
                    return (
                      <div key={foursome.id} className="bg-white rounded-xl shadow overflow-hidden">
                        {/* Tee time header */}
                        <div className="bg-green-700 text-white px-4 py-3 flex items-center gap-2">
                          <Icon icon={ClockIcon} size="sm" className="text-gray-300" />
                          <span className="font-semibold">{teeLabel}</span>
                        </div>

                        {/* Cart columns */}
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                          {[{ num: 1, members: cart1 }, { num: 2, members: cart2 }].map(({ num, members: cartMembers }) => (
                            <div key={num} className="p-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                Cart {num}
                              </p>
                              <div className="space-y-3">
                                {cartMembers.map((member) => (
                                  <div key={member.user_id} className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-gray-900 leading-tight">{member.full_name}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">Team {member.team_number} · {member.team_name}</p>
                                    </div>
                                    {member.is_sub && (
                                      <span className="shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                        Sub
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow px-6 py-8 text-center text-gray-500">
                  <p className="text-sm">Foursomes have not been generated yet.</p>
                </div>
              )}

              {/* Availability Summary */}
              {nextRoundTeamMembers.length > 0 && (
                <RoundAvailabilityGrid
                  teams={Array.from(new Set(nextRoundTeamMembers.map((m) => m.team_id)))
                    .sort((a, b) => {
                      const ta = nextRoundTeamMembers.find((m) => m.team_id === a)!
                      const tb = nextRoundTeamMembers.find((m) => m.team_id === b)!
                      return ta.team_number - tb.team_number
                    })
                    .map((teamId) => {
                      const rep = nextRoundTeamMembers.find((m) => m.team_id === teamId)!
                      return {
                        id: teamId,
                        team_number: rep.team_number,
                        team_name: rep.team_name,
                        members: nextRoundTeamMembers
                          .filter((m) => m.team_id === teamId)
                          .map((m) => ({ user_id: m.user_id, full_name: m.full_name })),
                      }
                    })}
                  availability={nextRoundAvailability}
                />
              )}

              {/* Declare button — shown at bottom when user has already declared */}
              {userHasDeclared && (
                <Link
                  href={`/availability/${nextRound.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  <Icon icon={ClipboardDocumentListIcon} size="sm" />
                  Update Declaration
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatRoundDate, formatTeeTime } from '@/lib/utils/date'
import { Icon } from '@/components/Icon'
import {
  TrophyIcon,
  ClipboardDocumentListIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { RoundScorecard } from '@/components/leaderboard/RoundScorecard'
import { HandicapBreakdown } from '@/components/handicaps/HandicapBreakdown'
import { getHandicapBreakdown } from '@/lib/actions/scores'

type HandicapBreakdownData = Awaited<ReturnType<typeof getHandicapBreakdown>>

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
  golfer?: { full_name: string; gross_score: number; handicap: number | null }
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

interface AllHandicapRow {
  user_id: string
  full_name: string
  team_name: string
  team_number: number
  current_handicap: number | null
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
  allHandicaps: AllHandicapRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addMinutes(timeStr: string, offset: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + offset
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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

// ── Handicaps tab ────────────────────────────────────────────────────────────

function HandicapsTab({
  allHandicaps,
  currentYear,
}: {
  allHandicaps: AllHandicapRow[]
  currentYear: number
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [breakdowns, setBreakdowns] = useState<Record<string, HandicapBreakdownData>>({})
  const [loading, setLoading] = useState<Set<string>>(new Set())

  async function togglePlayer(userId: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
    if (!breakdowns[userId]) {
      setLoading(prev => new Set(prev).add(userId))
      const data = await getHandicapBreakdown(userId)
      setBreakdowns(prev => ({ ...prev, [userId]: data }))
      setLoading(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  return (
    <div className="mx-4">
      <div className="bg-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-700">
          <h2 className="text-white font-semibold">Golfer Handicaps</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{currentYear} Season</p>
        </div>
        {allHandicaps.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-500">No handicap data available.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide w-10">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Golfer</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Hdcp</th>
              </tr>
            </thead>
            <tbody>
              {allHandicaps.map((row, idx) => {
                const isExpanded = expandedIds.has(row.user_id)
                const isLoading = loading.has(row.user_id)
                const breakdown = breakdowns[row.user_id]
                return (
                  <React.Fragment key={row.user_id}>
                    <tr
                      className="border-t border-zinc-700/50 hover:bg-zinc-700/30 cursor-pointer"
                      onClick={() => togglePlayer(row.user_id)}
                    >
                      <td className="px-4 py-3 text-center text-zinc-400 font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                            size="sm"
                            className="text-zinc-500 shrink-0"
                          />
                          <div>
                            <p className="text-white font-medium">{row.full_name}</p>
                            <p className="text-green-500 text-xs">Team {row.team_number} · {row.team_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-400 text-lg">
                        {row.current_handicap ?? '—'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${row.user_id}-breakdown`}>
                        <td colSpan={3} className="px-4 py-3 bg-zinc-900/60 border-t border-zinc-700/50">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                            Handicap Calculation — {row.full_name}
                          </p>
                          {isLoading ? (
                            <div className="flex items-center gap-2 py-3 text-zinc-500 text-sm">
                              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                              Loading…
                            </div>
                          ) : breakdown ? (
                            <HandicapBreakdown
                              scores={breakdown.scores}
                              scoresToUse={breakdown.scoresToUse}
                              currentHandicap={row.current_handicap}
                              teeAdjustment={breakdown.teeAdjustment}
                              dark
                            />
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
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
  allHandicaps,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'current' | 'next' | 'handicaps'>(
    currentRound ? 'current' : nextRound ? 'next' : 'season'
  )

  const tabBtn = (tab: 'season' | 'current' | 'next' | 'handicaps', label: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
        activeTab === tab
          ? 'bg-zinc-950 text-white shadow-sm'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Title */}
      <div className="px-4 pt-3 pb-4">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{currentYear} Season</p>
      </div>

      {/* Tabs — iOS segmented control */}
      <div className="px-4 mb-4">
        <div className="flex bg-zinc-800 p-1 rounded-full gap-0.5">
          {tabBtn('season', 'Season')}
          {currentRound &&
            tabBtn(
              'current',
              <span className="flex items-center justify-center gap-1.5">
                Current
                {currentRound.status === 'in_progress' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
              </span>
            )}
          {nextRound && tabBtn('next', 'Next')}
          {tabBtn('handicaps', 'Handicaps')}
        </div>
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
                          <th className="text-center px-2 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Gross</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Net</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Thru</th>
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
                                <p className="text-green-500 text-xs">{team?.team_name ?? '—'}</p>
                              </td>
                              <td className="px-2 py-2.5 text-center text-zinc-300">{golfer?.gross_score ?? '—'}</td>
                              <td className="px-2 py-2.5 text-center text-zinc-300">{p.net_score}</td>
                              <td className="px-2 py-2.5 text-center text-zinc-500">F</td>
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
        <div>
          {!currentRound ? (
            <div className="mx-4 bg-zinc-800 rounded-xl px-4 py-12 text-center text-zinc-500">
              No round is currently in progress.
            </div>
          ) : (
            <>
              <RoundScorecard
                round={currentRound}
                scores={currentRoundScores}
                showScoreButton
              />
              {/* Foursomes */}
              {currentRoundFoursomes.length > 0 && (
                <div className="px-4 pt-4">
                  <h3 className="text-white text-lg font-bold mb-3">Foursomes</h3>
                  <FoursomesList foursomes={currentRoundFoursomes} roundTeeTime={currentRound.tee_time} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Handicaps tab ── */}
      {activeTab === 'handicaps' && (
        <HandicapsTab allHandicaps={allHandicaps} currentYear={currentYear} />
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
              <div
                className="rounded-xl px-4 py-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #1b4d2e 0%, #1e6b3a 100%)' }}
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Round {nextRound.round_number} · Next Up
                  </p>
                  <p className="text-white font-bold text-lg mt-0.5">{formatRoundDate(nextRound.round_date)}</p>
                  {nextRound.tee_time && (
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Tee time: {formatTeeTime(nextRound.tee_time)}</p>
                  )}
                </div>
                {!userHasDeclared && (
                  <Link
                    href={`/availability/${nextRound.id}`}
                    className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ml-4"
                    style={{ background: '#16a34a' }}
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

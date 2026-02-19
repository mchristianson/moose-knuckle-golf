'use client'

import { useState } from 'react'
import Link from 'next/link'

// Legend's front nine par values (holes 1–9)
const HOLE_PARS = [4, 4, 4, 5, 3, 4, 3, 4, 5] // total par = 36

interface StandingRow {
  team_id: string
  team_name: string
  team_number: number
  total_points: number
  rounds_played: number
}

interface RoundPointsRow {
  finish_position: number
  net_score: number
  points_earned: number
  is_tied: boolean
  team: { team_name: string; team_number: number }
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
}

interface LeaderboardTabsProps {
  standings: StandingRow[]
  recentRounds: RecentRound[]
  currentRound: CurrentRound | null
  currentRoundScores: CurrentRoundScore[]
  currentYear: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function medal(idx: number) {
  if (idx === 0) return '🏆'
  if (idx === 1) return '🥈'
  if (idx === 2) return '🥉'
  return `${idx + 1}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

/** Short first name + last initial: "Matthew Christianson" → "Matt C" */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}`
}

/**
 * Calculate score-to-par for the holes played so far.
 * We apply the player's handicap strokes across the hardest holes first
 * (using USGA stroke allocation order for Legend's front nine) then subtract
 * par for each hole played to get the running score vs par.
 *
 * Stroke index order for Legend's front 9 (hardest → easiest):
 *   Hole: 1  2  3  4  5  6  7  8  9
 *   SI:   5  7  1  3  9  2  8  4  6
 * (Lower SI = hardest = gets a stroke first)
 */
const STROKE_INDEX = [5, 7, 1, 3, 9, 2, 8, 4, 6] // per hole (1-indexed position)

function scoreToPar(holeScores: number[], handicap: number): number | null {
  const played = holeScores.map((s, i) => ({ score: s, hole: i })).filter(h => h.score > 0)
  if (played.length === 0) return null

  // How many strokes does this player get? (handicap = total strokes over 9 holes)
  // Distribute strokes: each hole whose SI ≤ handicap gets 1 extra stroke;
  // if handicap > 9, each hole gets at least 1 and holes with SI ≤ (handicap - 9) get 2.
  const strokesPerHole = HOLE_PARS.map((_, i) => {
    const si = STROKE_INDEX[i]
    if (handicap >= 9) return si <= (handicap - 9) ? 2 : 1
    return si <= handicap ? 1 : 0
  })

  let scoreToPar = 0
  for (const { score, hole } of played) {
    const netScore = score - strokesPerHole[hole]
    scoreToPar += netScore - HOLE_PARS[hole]
  }
  return scoreToPar
}

function formatScoreToPar(score: number | null, holesPlayed: number): string {
  if (score === null || holesPlayed === 0) return '—'
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
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
  currentYear,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'season' | 'current'>(currentRound ? 'current' : 'season')

  const tabClass = (tab: 'season' | 'current') =>
    `px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-green-600 text-green-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`

  // Compute score-to-par for each player and sort
  const scoredPlayers = currentRoundScores.map((s) => {
    const holesPlayed = s.hole_scores.filter(h => h > 0).length
    const toPar = scoreToPar(s.hole_scores, s.handicap_at_time ?? 0)
    return { ...s, holesPlayed, toPar }
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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-1 px-4">Leaderboard</h1>
      <p className="text-gray-500 mb-6 px-4">{currentYear} Season</p>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 px-4">
        <button className={tabClass('season')} onClick={() => setActiveTab('season')}>
          Season Standings
        </button>
        <button className={tabClass('current')} onClick={() => setActiveTab('current')}>
          {currentRound ? (
            <span className="flex items-center gap-2">
              Current Round
              {currentRound.status === 'in_progress' && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </span>
          ) : 'Current Round'}
        </button>
      </div>

      {/* ── Season tab ── */}
      {activeTab === 'season' && (
        <div className="space-y-8">
          <div className="bg-white sm:rounded-lg shadow overflow-hidden">
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
                    <th className="text-center px-6 py-3 font-medium text-gray-600">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {standings.map((row, idx) => (
                    <tr key={row.team_id} className={idx === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 font-bold text-lg text-center">{medal(idx)}</td>
                      <td className="px-6 py-4 font-semibold">{row.team_name}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{row.rounds_played}</td>
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
                    <div key={round.id} className="bg-white sm:rounded-lg shadow overflow-hidden">
                      <div className="bg-gray-700 text-white px-4 py-3">
                        <h3 className="font-semibold">Round {round.round_number}</h3>
                        <p className="text-gray-300 text-sm">{formatDate(round.round_date)}</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 w-12">Pos</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600">Team</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">Net</th>
                            <th className="text-center px-4 py-2 font-medium text-gray-600">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sorted.map((p: any) => {
                            const team = Array.isArray(p.team) ? p.team[0] : p.team
                            return (
                              <tr key={team?.team_number ?? p.finish_position} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-semibold text-gray-700">
                                  {p.finish_position}{p.is_tied ? 'T' : ''}
                                </td>
                                <td className="px-4 py-2.5 font-medium">{team?.team_name ?? '—'}</td>
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
            <div className="bg-white sm:rounded-lg shadow px-6 py-12 text-center text-gray-500">
              <p className="text-lg">No round is currently in progress.</p>
              <p className="text-sm mt-1">Check back once a round has started.</p>
            </div>
          ) : (
            <div className="bg-white sm:rounded-lg shadow overflow-hidden">
              {/* Round header */}
              <div className="bg-green-700 text-white px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-xs font-medium uppercase tracking-widest">Round {currentRound.round_number}</p>
                  <p className="font-semibold">{formatDate(currentRound.round_date)}</p>
                </div>
                {currentRound.status === 'scoring' ? (
                  <Link
                    href={`/scores/${currentRound.id}`}
                    className="text-xs bg-green-600 border border-green-500 px-3 py-1 rounded-full font-medium capitalize flex items-center gap-1.5 hover:bg-green-500 transition-colors"
                  >
                    📋 Scoring
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
                  <div className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span>Golfer</span>
                    <span className="w-16 text-center">Score</span>
                    <span className="w-12 text-center">Thru</span>
                  </div>

                  {/* Player rows */}
                  <div className="divide-y">
                    {scoredPlayers.map((s, idx) => {
                      const scoreStr = formatScoreToPar(s.toPar, s.holesPlayed)
                      const thruStr = s.holesPlayed === 0 ? '—' : s.holesPlayed === 9 ? 'F' : `${s.holesPlayed}`
                      const isLeader = idx === 0 && s.holesPlayed > 0
                      const name = shortName(s.full_name)

                      return (
                        <div
                          key={s.user_id}
                          className={`grid grid-cols-[1fr_auto_auto] items-center px-4 py-3.5 ${
                            isLeader ? 'bg-yellow-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Golfer info */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Position */}
                            <span className="text-sm font-bold text-gray-500 w-5 shrink-0 text-center">
                              {s.holesPlayed === 0 ? '—' : isLeader ? '🏆' : idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{name}</p>
                              <p className="text-xs text-gray-400 truncate">{s.team_name}</p>
                            </div>
                          </div>

                          {/* Score to par */}
                          <div className={`w-16 text-center font-black text-xl tabular-nums ${scoreColor(s.toPar)}`}>
                            {scoreStr}
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
                    <span className="ml-auto"><span className="font-semibold">F</span> = Finished · Scores adjusted for handicap</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

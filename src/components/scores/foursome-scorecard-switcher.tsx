'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MyScoreCard } from './my-score-card'

export interface FoursomePlayer {
  userId: string | null   // null for external subs without a user account
  teamId: string
  teamName: string
  teamNumber: number
  isSub: boolean
  displayName: string
  handicap: number
  holeScores: number[]
  isLocked: boolean
  existingScoreId: string | null
  grossScore: number | null
  netScore: number | null
}

interface FoursomeScorecardSwitcherProps {
  roundId: string
  currentUserId: string
  players: FoursomePlayer[]
  roundNumber: number
  roundDate: string
  scoringOpen: boolean
}

export function FoursomeScorecardSwitcher({
  roundId,
  currentUserId,
  players,
  roundNumber,
  roundDate,
  scoringOpen,
}: FoursomeScorecardSwitcherProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentUserId)

  const selected = players.find((p) => p.userId === selectedUserId) ?? players[0]

  if (!selected) return null

  return (
    <>
      {/* Player toggle button group */}
      {players.length > 1 && (
        <div className="mb-3 -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="grid grid-cols-4 gap-1">
            {players.map((player) => {
              const isActive = player.userId === selectedUserId
              const isMe = player.userId === currentUserId
              return (
                <button
                  key={player.userId}
                  onClick={() => setSelectedUserId(player.userId)}
                  className={[
                    'py-2 px-1 text-xs font-semibold border-2 rounded transition-all',
                    isActive
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50',
                  ].join(' ')}
                >
                  <div className="text-center truncate">
                    <div className="truncate">{player.displayName}</div>
                    {isMe && (
                      <span className={`text-xs ${isActive ? 'text-green-200' : 'text-gray-400'}`}>
                        you
                      </span>
                    )}
                    {player.isLocked && (
                      <span className="text-xs">🔒</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scorecard for selected player — key resets state when switching */}
      {selected.userId ? (
        <MyScoreCard
          key={selected.userId ?? selected.displayName}
          roundId={roundId}
          userId={currentUserId}
          targetUserId={selected.userId}
          teamName={selected.teamName}
          teamNumber={selected.teamNumber}
          handicap={selected.handicap}
          holeScores={selected.holeScores}
          isLocked={selected.isLocked}
          scoringOpen={scoringOpen}
          existingScoreId={selected.existingScoreId}
          grossScore={selected.grossScore}
          netScore={selected.netScore}
          roundNumber={roundNumber}
          roundDate={roundDate}
        />
      ) : (
        <div className="mx-4 sm:mx-0 bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
          <p className="text-yellow-800 font-medium text-sm">
            {selected.displayName} is an external sub — an admin must enter their score.
          </p>
        </div>
      )}
    </>
  )
}

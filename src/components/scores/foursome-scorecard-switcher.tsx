'use client'

import { useState } from 'react'
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
  scoringOpen: boolean
}

export function FoursomeScorecardSwitcher({
  roundId,
  currentUserId,
  players,
  scoringOpen,
}: FoursomeScorecardSwitcherProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentUserId)

  const selected = players.find((p) => p.userId === selectedUserId) ?? players[0]

  if (!selected) return null

  return (
    <>
      {/* Player toggle button group */}
      {players.length > 1 && (
        <div className="sm:px-0 mb-4">
          <div className="flex w-full">
            {players.map((player, idx) => {
              const isActive = player.userId === selectedUserId
              const isMe = player.userId === currentUserId
              const isFirst = idx === 0
              const isLast = idx === players.length - 1
              return (
                <button
                  key={player.userId}
                  onClick={() => setSelectedUserId(player.userId)}
                  className={[
                    'relative flex-1 py-2 px-2 text-sm font-medium border transition-colors truncate',
                    isFirst ? 'rounded-l-lg' : '-ml-px',
                    isLast ? 'rounded-r-lg' : '',
                    isActive
                      ? 'bg-green-700 text-white border-green-700 z-10'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:z-10',
                  ].join(' ')}
                >
                  <span className="truncate">
                    {player.displayName}
                    {isMe && (
                      <span className={`ml-1 text-xs ${isActive ? 'text-green-200' : 'text-gray-400'}`}>
                        (me)
                      </span>
                    )}
                    {player.isLocked && (
                      <span className="ml-1 text-xs">🔒</span>
                    )}
                  </span>
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

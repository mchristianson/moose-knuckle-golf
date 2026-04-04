'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  avatarUrl?: string | null
}

interface FoursomeScorecardSwitcherProps {
  roundId: string
  currentUserId: string
  players: FoursomePlayer[]
  roundNumber: number
  roundDate: string
  scoringOpen: boolean
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
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
      {/* Player avatar selector */}
      {players.length > 1 && (
        <div className="mb-4 px-2">
          <div className="flex justify-around">
            {players.map((player) => {
              const isActive = player.userId === selectedUserId
              const isMe = player.userId === currentUserId
              const label = player.displayName.split(' ')[0].toUpperCase() + (isMe ? ' (Me)' : '')

              return (
                <button
                  key={player.userId ?? player.displayName}
                  onClick={() => setSelectedUserId(player.userId)}
                  className="flex flex-col items-center gap-1.5 px-1 min-w-0"
                >
                  {/* Avatar circle */}
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden shrink-0 transition-all ${
                      isActive
                        ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-900'
                        : 'ring-2 ring-zinc-700'
                    }`}
                  >
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.displayName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {getInitials(player.displayName)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name label */}
                  <span
                    className={`text-xs font-semibold text-center leading-tight max-w-[72px] truncate ${
                      isActive ? 'text-green-400' : 'text-zinc-400'
                    }`}
                  >
                    {label}
                  </span>

                  {/* Lock indicator */}
                  {player.isLocked && (
                    <span className="text-xs text-zinc-500">🔒</span>
                  )}

                  {/* Active underline */}
                  <div className={`h-0.5 w-8 rounded-full transition-all ${
                    isActive ? 'bg-green-500' : 'bg-transparent'
                  }`} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scorecard for selected player */}
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
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 text-center">
          <p className="text-zinc-300 font-medium text-sm">
            {selected.displayName} is an external sub — an admin must enter their score.
          </p>
        </div>
      )}
    </>
  )
}

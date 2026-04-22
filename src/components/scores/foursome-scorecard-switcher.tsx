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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Player selector — full-width 4-across cards */}
      {players.length > 1 && (
        <div className="mb-3 px-2 shrink-0">
          <div className="flex gap-1.5">
            {players.map((player) => {
              const isActive = player.userId === selectedUserId
              const firstName = player.displayName.split(' ')[0]

              return (
                <button
                  key={player.userId ?? player.displayName}
                  onClick={() => setSelectedUserId(player.userId)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(22,163,74,0.15)' : '#27272a',
                    border: `2px solid ${isActive ? '#16a34a' : 'transparent'}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{
                      background: player.avatarUrl ? 'transparent' : '#1b4d2e',
                      outline: isActive ? '2.5px solid #16a34a' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt={player.displayName}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-white text-sm font-extrabold font-condensed tracking-wide">
                        {getInitials(player.displayName)}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <span
                    className="text-[11px] font-bold truncate w-full text-center px-0.5 leading-none"
                    style={{ color: isActive ? '#4ade80' : '#71717a' }}
                  >
                    {firstName}
                    {player.isLocked && ' 🔒'}
                  </span>
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
    </div>
  )
}

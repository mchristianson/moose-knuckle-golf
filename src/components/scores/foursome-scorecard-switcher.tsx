'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MyScoreCard } from './my-score-card'

export interface FoursomePlayer {
  userId: string | null   // null for external subs without a user account
  subId: string | null    // non-null for external subs
  teamId: string
  teamName: string
  teamNumber: number
  isSub: boolean
  displayName: string
  handicap: number
  holeScores: number[]
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

// Stable key for a player regardless of whether they're a user or sub
function playerKey(p: FoursomePlayer): string {
  return p.userId ? `user:${p.userId}` : `sub:${p.subId}`
}

export function FoursomeScorecardSwitcher({
  roundId,
  currentUserId,
  players,
  roundNumber,
  roundDate,
  scoringOpen,
}: FoursomeScorecardSwitcherProps) {
  const currentPlayer = players.find((p) => p.userId === currentUserId) ?? players[0]
  const [selectedKey, setSelectedKey] = useState<string>(() => playerKey(currentPlayer ?? players[0]))

  const selected = players.find((p) => playerKey(p) === selectedKey) ?? players[0]

  if (!selected) return null

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Player selector — full-width 4-across cards */}
      {players.length > 1 && (
        <div className="mb-3 px-2 shrink-0">
          <div className="flex gap-1.5">
            {players.map((player) => {
              const key = playerKey(player)
              const isActive = key === selectedKey
              const firstName = player.displayName.split(' ')[0]

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
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
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Scorecard for selected player */}
      <MyScoreCard
        key={playerKey(selected)}
        roundId={roundId}
        userId={currentUserId}
        targetUserId={selected.userId}
        targetSubId={selected.subId}
        teamName={selected.teamName}
        teamNumber={selected.teamNumber}
        handicap={selected.handicap}
        holeScores={selected.holeScores}
        scoringOpen={scoringOpen}
        existingScoreId={selected.existingScoreId}
        grossScore={selected.grossScore}
        netScore={selected.netScore}
        roundNumber={roundNumber}
        roundDate={roundDate}
      />
    </div>
  )
}

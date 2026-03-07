'use client'

import Link from 'next/link'

interface AppBottomNavProps {
  currentRoundId?: string
}

export function AppBottomNav({ currentRoundId }: AppBottomNavProps) {
  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-lg md:hidden z-40">
        <div className="flex h-16">
          {/* Leaderboard */}
          <Link
            href="/leaderboard"
            className="flex-1 flex items-center justify-center text-sm font-medium text-secondary hover:bg-neutral-50 transition-colors active:bg-neutral-100"
          >
            <span className="text-lg mr-1">🏆</span>
            Leaderboard
          </Link>

          {/* Scoring */}
          {currentRoundId ? (
            <Link
              href={`/scores/${currentRoundId}`}
              className="flex-1 flex items-center justify-center text-sm font-medium text-primary hover:bg-neutral-50 transition-colors active:bg-neutral-100 border-l border-r border-neutral-100"
            >
              <span className="text-lg mr-1">📊</span>
              Scoring
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 flex items-center justify-center text-sm font-medium text-neutral-400 cursor-not-allowed border-l border-r border-neutral-100"
              title="No active round"
            >
              <span className="text-lg mr-1">📊</span>
              Scoring
            </button>
          )}

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors active:bg-neutral-100"
          >
            <span className="text-lg mr-1">📋</span>
            Dashboard
          </Link>
        </div>
      </div>

      {/* Spacer to prevent content from hiding under nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}

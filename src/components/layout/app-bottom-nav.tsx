'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Squares2X2Icon } from '@heroicons/react/24/solid'

interface AppBottomNavProps {
  currentRoundId?: string
}

export function AppBottomNav({ currentRoundId }: AppBottomNavProps) {
  const pathname = usePathname()

  const isLeaderboardActive = pathname === '/leaderboard'
  const isScoringActive = pathname.startsWith('/scores')
  const isDashboardActive = pathname === '/dashboard'

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 shadow-lg md:hidden z-40">
        <div className="flex h-16">
          {/* Leaderboard */}
          <Link
            href="/leaderboard"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isLeaderboardActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon icon={TrophyIcon} size="md" />
            <span className="text-xs">Leaderboard</span>
          </Link>

          {/* Scoring */}
          {currentRoundId ? (
            <Link
              href={`/scores/${currentRoundId}`}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors border-l border-r border-zinc-800 ${
                isScoringActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon icon={ChartBarIcon} size="md" />
              <span className="text-xs">Scoring</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-zinc-600 cursor-not-allowed border-l border-r border-zinc-800"
              title="No active round"
            >
              <Icon icon={ChartBarIcon} size="md" />
              <span className="text-xs">Scoring</span>
            </button>
          )}

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isDashboardActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon icon={Squares2X2Icon} size="md" />
            <span className="text-xs">Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Spacer to prevent content from hiding under nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}

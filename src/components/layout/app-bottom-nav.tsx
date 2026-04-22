'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { TrophyIcon as TrophyOutline, ChartBarIcon as ChartOutline, UserCircleIcon as UserCircleOutline } from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid, ChartBarIcon as ChartSolid, Squares2X2Icon, UserCircleIcon as UserCircleSolid } from '@heroicons/react/24/solid'

interface AppBottomNavProps {
  currentRoundId?: string
  avatarUrl?: string | null
}

export function AppBottomNav({ currentRoundId, avatarUrl }: AppBottomNavProps) {
  const pathname = usePathname()

  const isLeaderboardActive = pathname === '/leaderboard'
  const isScoringActive = pathname.startsWith('/scores')
  const isDashboardActive = pathname === '/dashboard'
  const isProfileActive = pathname === '/profile'

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-zinc-900/85 backdrop-blur-xl border-t border-white/[0.06] shadow-lg md:hidden z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-16 px-3 pb-3">

          {/* Leaderboard */}
          <Link
            href="/leaderboard"
            className={`flex-1 flex flex-col items-center justify-center pt-1 gap-0.5 transition-colors ${
              isLeaderboardActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-1 h-1 rounded-full bg-green-500 mb-0.5 transition-opacity ${isLeaderboardActive ? 'opacity-100' : 'opacity-0'}`} />
            <Icon icon={isLeaderboardActive ? TrophySolid : TrophyOutline} size="md" />
            <span className="text-xs">Leaderboard</span>
          </Link>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center pt-1 gap-0.5 transition-colors ${
              isDashboardActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-1 h-1 rounded-full bg-green-500 mb-0.5 transition-opacity ${isDashboardActive ? 'opacity-100' : 'opacity-0'}`} />
            <Icon icon={Squares2X2Icon} size="md" />
            <span className="text-xs">Dashboard</span>
          </Link>

          {/* Scoring */}
          {currentRoundId ? (
            <Link
              href={`/scores/${currentRoundId}`}
              className={`flex-1 flex flex-col items-center justify-center pt-1 gap-0.5 transition-colors ${
                isScoringActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-1 h-1 rounded-full bg-green-500 mb-0.5 transition-opacity ${isScoringActive ? 'opacity-100' : 'opacity-0'}`} />
              <Icon icon={isScoringActive ? ChartSolid : ChartOutline} size="md" />
              <span className="text-xs">Score</span>
            </Link>
          ) : (
            <button
              disabled
              title="No active round"
              className="flex-1 flex flex-col items-center justify-center pt-1 gap-0.5 opacity-40 cursor-default"
            >
              <span className="w-1 h-1 rounded-full bg-green-500 mb-0.5 opacity-0" />
              <Icon icon={ChartOutline} size="md" />
              <span className="text-xs text-zinc-500">Score</span>
            </button>
          )}

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex-1 flex flex-col items-center justify-center pt-1 gap-0.5 transition-colors ${
              isProfileActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-1 h-1 rounded-full bg-green-500 mb-0.5 transition-opacity ${isProfileActive ? 'opacity-100' : 'opacity-0'}`} />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className={`w-6 h-6 rounded-full object-cover ${isProfileActive ? 'ring-2 ring-green-500' : ''}`}
              />
            ) : (
              <Icon icon={isProfileActive ? UserCircleSolid : UserCircleOutline} size="md" />
            )}
            <span className="text-xs">Profile</span>
          </Link>

        </div>
      </div>

      {/* Spacer to prevent content from hiding under nav */}
      <div className="md:hidden" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
    </>
  )
}

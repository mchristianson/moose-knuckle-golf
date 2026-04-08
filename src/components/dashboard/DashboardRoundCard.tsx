'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { formatRoundDate } from '@/lib/utils/date'
import { setMyAvailability } from '@/lib/actions/availability'
import type { AvailabilityTeam, AvailabilityRecord } from '@/components/RoundAvailabilityGrid'
import {
  FlagIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  ClockIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

interface DashboardRoundCardProps {
  round: any
  availability?: { id: string; round_id: string; status: 'in' | 'out' | 'undeclared' }
  canEnterScore: boolean
  foursomes?: any[]
  teams?: AvailabilityTeam[]
  roundAvailability?: AvailabilityRecord[]
  defaultExpanded?: boolean
  isAdmin?: boolean
}

function getMonth(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

function getDayNumber(dateString: string): string {
  return String(parseInt(dateString.split('-')[2]))
}

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  in_progress: { bg: 'bg-green-600', text: 'text-white', label: 'Playing', icon: FlagIcon },
  scoring: { bg: 'bg-green-600', text: 'text-white', label: 'Scoring', icon: ClipboardDocumentListIcon },
  completed: { bg: 'bg-blue-500', text: 'text-white', label: 'Completed', icon: CheckCircleIcon },
  availability_open: { bg: 'bg-yellow-500', text: 'text-zinc-900', label: 'Declare', icon: ClockIcon },
  foursomes_set: { bg: 'bg-zinc-500', text: 'text-white', label: 'Foursomes Set', icon: CheckIcon },
  scheduled: { bg: 'bg-zinc-600', text: 'text-zinc-200', label: 'Pending', icon: PauseCircleIcon },
}

export function DashboardRoundCard({
  round,
  availability,
  canEnterScore,
  teams,
  roundAvailability = [],
  defaultExpanded = false,
  isAdmin = false,
}: DashboardRoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [localStatus, setLocalStatus] = useState(availability?.status ?? 'undeclared')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAdminDeclare = async (status: 'in' | 'out') => {
    if (isLoading) return
    const prev = localStatus
    setLocalStatus(status)
    setIsLoading(true)
    const result = await setMyAvailability(round.id, status)
    setIsLoading(false)
    if (result?.error) {
      setLocalStatus(prev)
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  const roundEnded = ['in_progress', 'scoring', 'completed', 'cancelled'].includes(round.status)
  const badgeStyle = STATUS_BADGE_STYLES[round.status] || STATUS_BADGE_STYLES.scheduled

  // For expanded state, show user's availability badge using status badge styles only when
  // availability is declared and the round is ongoing
  const userIsIn = localStatus === 'in'
  const userIsOut = localStatus === 'out'
  const userUndeclared = localStatus === 'undeclared' || !availability

  return (
    <div className="bg-zinc-800 rounded-xl overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/20">
      {/* Collapsed header row — always visible */}
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="w-full flex items-stretch text-left"
        aria-expanded={isExpanded}
      >
        {/* Date sidebar */}
        <div className="bg-zinc-700 flex flex-col items-center justify-center px-4 py-3 min-w-[56px] shrink-0">
          <span className="text-zinc-400 text-xs font-medium leading-none">
            {getMonth(round.round_date)}
          </span>
          <span className="text-white text-2xl font-bold leading-tight mt-0.5">
            {getDayNumber(round.round_date)}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">Round {round.round_number}</p>
            <p className="text-zinc-400 text-xs mt-0.5">{formatRoundDate(round.round_date)}</p>
          </div>

          {/* Status / availability badge */}
          {!roundEnded && availability && !userUndeclared ? (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                userIsIn
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {userIsIn ? <Icon icon={CheckIcon} size="sm" /> : <Icon icon={XMarkIcon} size="sm" />}
              {userIsIn ? 'In' : 'Out'}
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badgeStyle.bg} ${badgeStyle.text}`}
            >
              <Icon icon={badgeStyle.icon} size="sm" />
              {badgeStyle.label}
            </span>
          )}

          {/* Chevron */}
          <Icon
            icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
            size="sm"
            className="text-zinc-500 shrink-0"
          />
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-zinc-700 px-4 pt-3.5 pb-5 space-y-3">
          {/* Action buttons */}
          <div className="flex flex-col gap-1.5">
            {!roundEnded && isAdmin ? (
              <>
                {/* Admin: inline In/Out + Declare Golfers */}
                <div className="flex flex-row gap-1.5">
                  <button
                    onClick={() => handleAdminDeclare('in')}
                    disabled={isLoading}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      userIsIn
                        ? 'bg-green-600 text-white'
                        : 'bg-zinc-700 text-zinc-200 hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    <Icon icon={CheckIcon} size="sm" />
                    I'm In
                  </button>
                  <button
                    onClick={() => handleAdminDeclare('out')}
                    disabled={isLoading}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      userIsOut
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-700 text-zinc-200 hover:bg-red-700 hover:text-white'
                    }`}
                  >
                    <Icon icon={XMarkIcon} size="sm" />
                    I'm Out
                  </button>
                </div>
                <Button variant="primary" size="small" asChild className="w-full">
                  <Link href={`/rounds/${round.id}`}>Declare Golfers</Link>
                </Button>
              </>
            ) : (
              <div className="flex flex-row gap-1.5">
                {!roundEnded && availability && (userIsIn || userIsOut) && (
                  <Button
                    variant="ghost"
                    size="small"
                    asChild
                    className="flex-1 border-zinc-600 text-zinc-100 hover:bg-zinc-700"
                  >
                    <Link href={`/availability/${round.id}`}>Change Avail.</Link>
                  </Button>
                )}
                {!roundEnded && availability && userUndeclared && (
                  <Button
                    variant="secondary"
                    size="small"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/availability/${round.id}`}>Declare Avail.</Link>
                  </Button>
                )}
                {!roundEnded && (
                  <Button
                    variant="primary"
                    size="small"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/rounds/${round.id}`}>Declare Golfers</Link>
                  </Button>
                )}
              </div>
            )}
            {canEnterScore && (
              <Button variant="danger" size="small" asChild className="w-full">
                <Link href={`/scores/${round.id}`}>Enter Score</Link>
              </Button>
            )}
          </div>

          {/* Team Availability Grid */}
          {teams && teams.length > 0 && (
            <DarkTeamAvailabilityGrid teams={teams} availability={roundAvailability} />
          )}
        </div>
      )}
    </div>
  )
}

function DarkTeamAvailabilityGrid({
  teams,
  availability,
}: {
  teams: AvailabilityTeam[]
  availability: AvailabilityRecord[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
        Team Availability
      </p>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((team) => (
          <div key={team.id} className="bg-zinc-900 rounded-lg p-2.5">
            <p className="text-xs font-semibold text-zinc-300 mb-1.5">T{team.team_number}</p>
            <div className="space-y-1">
              {team.members.map((member) => {
                const record = availability.find((a) => a.user_id === member.user_id)
                const isIn = record?.status === 'in'
                const isOut = record?.status === 'out'
                return (
                  <div key={member.user_id} className="flex items-center gap-1.5">
                    {isIn && <Icon icon={CheckIcon} size="sm" className="text-green-500 shrink-0" />}
                    {isOut && <Icon icon={XMarkIcon} size="sm" className="text-red-500 shrink-0" />}
                    {!isIn && !isOut && (
                      <Icon icon={QuestionMarkCircleIcon} size="sm" className="text-zinc-500 shrink-0" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        isIn ? 'text-green-400' : isOut ? 'text-red-400' : 'text-zinc-500'
                      }`}
                    >
                      {member.full_name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

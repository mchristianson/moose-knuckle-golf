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
              <>
                {!roundEnded && (
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
                )}
              </>
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

function memberInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
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
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
        Team Availability
      </p>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((team) => (
          <div key={team.id} className="bg-zinc-950 rounded-xl p-2.5">
            <p className="text-[11px] font-bold text-zinc-300 mb-2 uppercase tracking-wide">
              T{team.team_number}
            </p>
            <div className="space-y-2">
              {team.members.map((member) => {
                const record = availability.find((a) => a.user_id === member.user_id)
                const isIn = record?.status === 'in'
                const isOut = record?.status === 'out'
                const initials = memberInitials(member.full_name)

                return (
                  <div key={member.user_id} className="flex items-center gap-2">
                    {/* Color-coded avatar circle */}
                    <div
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        background: isIn ? '#1b4d2e' : isOut ? '#450a0a' : '#18181b',
                        border: `1.5px solid ${isIn ? '#16a34a' : isOut ? '#dc2626' : '#3f3f46'}`,
                      }}
                    >
                      <span
                        className="text-[9px] font-extrabold font-condensed"
                        style={{ color: isIn ? '#4ade80' : isOut ? '#f87171' : '#52525b' }}
                      >
                        {initials}
                      </span>
                    </div>

                    {/* Name + status */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-bold truncate leading-none"
                        style={{ color: isIn ? '#fafafa' : isOut ? '#52525b' : '#a1a1aa' }}
                      >
                        {member.full_name}
                      </p>
                      <p
                        className="text-[9px] font-bold mt-0.5"
                        style={{ color: isIn ? '#4ade80' : isOut ? '#f87171' : '#52525b' }}
                      >
                        {isIn ? '✓ In' : isOut ? '✕ Out' : '? Undeclared'}
                      </p>
                    </div>
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

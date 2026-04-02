import { Icon } from '@/components/Icon'
import { CheckIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

export interface AvailabilityMember {
  user_id: string
  full_name: string
}

export interface AvailabilityTeam {
  id: string
  team_number: number
  team_name: string
  members: AvailabilityMember[]
}

export interface AvailabilityRecord {
  user_id: string
  status: 'in' | 'out'
}

interface RoundAvailabilityGridProps {
  teams: AvailabilityTeam[]
  availability: AvailabilityRecord[]
}

export function RoundAvailabilityGrid({ teams, availability }: RoundAvailabilityGridProps) {
  if (!teams || teams.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="bg-gray-700 text-white px-4 py-3">
        <h3 className="font-semibold">Availability</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {teams.map((team) => (
          <div key={team.id} className="border rounded-lg p-3">
            <h4 className="text-xs sm:text-sm font-semibold mb-2 leading-tight">T{team.team_number} — {team.team_name}</h4>
            <div className="space-y-1 text-sm">
              {team.members.map((member) => {
                const record = availability.find((a) => a.user_id === member.user_id)
                if (record?.status === 'in') {
                  return (
                    <div key={member.user_id} className="flex items-center gap-1.5">
                      <Icon icon={CheckIcon} size="sm" className="text-green-600 shrink-0" />
                      <span className="text-green-600 font-medium">{member.full_name}</span>
                    </div>
                  )
                }
                if (record?.status === 'out') {
                  return (
                    <div key={member.user_id} className="flex items-center gap-1.5">
                      <Icon icon={XMarkIcon} size="sm" className="text-red-500 shrink-0" />
                      <span className="text-red-500 font-medium">{member.full_name}</span>
                    </div>
                  )
                }
                return (
                  <div key={member.user_id} className="flex items-center gap-1.5">
                    <Icon icon={QuestionMarkCircleIcon} size="sm" className="text-gray-400 shrink-0" />
                    <span className="text-gray-400 font-medium">{member.full_name}</span>
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

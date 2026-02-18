interface FoursomeMember {
  user_id: string
  team_id: string
  cart_number: 1 | 2
  user?: {
    id: string
    full_name: string
  }
  team?: {
    id: string
    team_name: string
    team_number: number
  }
}

interface Foursome {
  id: string
  tee_time_slot: number
  members: FoursomeMember[]
}

interface FoursomesListProps {
  foursomes: Foursome[]
  teeTime?: string | null
}

function format12Hour(timeStr: string): string {
  if (!timeStr) return '—'
  const [hours, mins] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

export function FoursomesList({ foursomes, teeTime }: FoursomesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {foursomes.map((foursome) => {
        const slotTime =
          teeTime && foursome.tee_time_slot === 1
            ? teeTime
            : teeTime && foursome.tee_time_slot === 2
              ? addMinutesToTime(teeTime, 10)
              : null

        const cart1Members = foursome.members
          .filter((m) => m.cart_number === 1)
          .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))

        const cart2Members = foursome.members
          .filter((m) => m.cart_number === 2)
          .sort((a, b) => (a.user?.full_name || '').localeCompare(b.user?.full_name || ''))

        return (
          <div key={foursome.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h3 className="text-lg font-semibold">Tee Time Slot {foursome.tee_time_slot}</h3>
              {slotTime && <p className="text-green-100">{format12Hour(slotTime)}</p>}
            </div>

            <div className="p-4 space-y-4">
              {/* Cart 1 */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🛒 Cart 1</h4>
                <div className="space-y-2">
                  {cart1Members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{member.user?.full_name}</div>
                        <div className="text-xs text-gray-600">{member.team?.team_name}</div>
                      </div>
                      <div className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
                        Team #{member.team?.team_number}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart 2 */}
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">🛒 Cart 2</h4>
                <div className="space-y-2">
                  {cart2Members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{member.user?.full_name}</div>
                        <div className="text-xs text-gray-600">{member.team?.team_name}</div>
                      </div>
                      <div className="text-xs bg-orange-200 text-orange-900 px-2 py-1 rounded">
                        Team #{member.team?.team_number}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

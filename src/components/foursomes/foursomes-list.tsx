interface FoursomeMember {
  user_id: string | null
  team_id: string
  cart_number: 1 | 2
  is_sub?: boolean
  user?: {
    id: string
    full_name: string
    display_name?: string
  } | null
  sub?: {
    id: string
    full_name: string
  } | null
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

function getMemberName(member: FoursomeMember): string {
  return member.user?.display_name ?? member.user?.full_name ?? member.sub?.full_name ?? ''
}

function MemberRow({ member, badgeClass }: { member: FoursomeMember; badgeClass: string }) {
  const name = getMemberName(member)
  return (
    <div key={member.user_id ?? member.sub?.id} className="flex items-center justify-between">
      <div>
        <div className="font-medium flex items-center gap-1.5">
          {name}
          {member.is_sub && (
            <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
              SUB
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600">{member.team?.team_name}</div>
      </div>
      <div className={`text-xs px-2 py-1 rounded ${badgeClass}`}>
        Team #{member.team?.team_number}
      </div>
    </div>
  )
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
          .sort((a, b) => getMemberName(a).localeCompare(getMemberName(b)))

        const cart2Members = foursome.members
          .filter((m) => m.cart_number === 2)
          .sort((a, b) => getMemberName(a).localeCompare(getMemberName(b)))

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
                    <MemberRow key={member.user_id ?? member.sub?.id} member={member} badgeClass="bg-blue-200 text-blue-900" />
                  ))}
                </div>
              </div>

              {/* Cart 2 */}
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">🛒 Cart 2</h4>
                <div className="space-y-2">
                  {cart2Members.map((member) => (
                    <MemberRow key={member.user_id ?? member.sub?.id} member={member} badgeClass="bg-orange-200 text-orange-900" />
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

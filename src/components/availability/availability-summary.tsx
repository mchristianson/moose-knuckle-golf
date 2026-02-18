import { DeclaredGolferSelector } from './declared-golfer-selector'

interface AvailabilitySummaryProps {
  availability: any[]
  roundId?: string
  declarations?: Record<string, string> // teamId -> declared golfer userId
  isAdmin?: boolean
}

export function AvailabilitySummary({
  availability,
  roundId,
  declarations,
  isAdmin = false,
}: AvailabilitySummaryProps) {
  // Group by team_id (the FK on the availability row — team.id is not selected in the join)
  const teamData = availability.reduce((acc: any, avail: any) => {
    const teamId = avail.team_id
    if (!acc[teamId]) {
      acc[teamId] = {
        teamId,
        team: avail.team,
        members: [],
      }
    }
    acc[teamId].members.push(avail)
    return acc
  }, {})

  const teams = Object.values(teamData).sort((a: any, b: any) => a.team.team_number - b.team.team_number)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Availability Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((teamData: any) => {
          const { teamId, team, members } = teamData
          const inCount = members.filter((m: any) => m.status === 'in').length
          const outCount = members.filter((m: any) => m.status === 'out').length

          let teamStatus = 'undeclared'
          if (inCount > 0) teamStatus = 'in'
          else if (outCount === members.length) teamStatus = 'out'

          const currentDeclaredGolferId = declarations?.[teamId] ?? null
          const memberOptions = members.map((m: any) => ({
            userId: m.user_id,
            fullName: m.user.full_name,
          }))

          return (
            <div key={teamId} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">Team {team.team_number}</h3>
                  <p className="text-sm text-gray-600">{team.team_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  teamStatus === 'in'
                    ? 'bg-green-100 text-green-800'
                    : teamStatus === 'out'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {teamStatus === 'in' ? '✓ Playing' :
                   teamStatus === 'out' ? '✗ Out' :
                   '⚠ Pending'}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {members.map((member: any) => (
                  <div key={member.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{member.user.full_name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      member.status === 'in'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'out'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.status === 'in' ? 'In' :
                       member.status === 'out' ? 'Out' :
                       'Undeclared'}
                    </span>
                  </div>
                ))}
              </div>

              {isAdmin && roundId && memberOptions.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Declared golfer</p>
                  <DeclaredGolferSelector
                    roundId={roundId}
                    teamId={teamId}
                    members={memberOptions}
                    currentDeclaredGolferId={currentDeclaredGolferId}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

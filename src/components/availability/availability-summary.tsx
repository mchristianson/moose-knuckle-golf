import { DeclaredGolferSelector } from './declared-golfer-selector'
import { SubAssignmentPanel } from './sub-assignment-panel'
import { AdminAvailabilityOverride } from './admin-availability-override'

interface RoundSubInfo {
  subId: string
  subName: string
  roundSubId: string
}

interface TeamMemberInfo {
  userId: string
  fullName: string
}

interface TeamInfo {
  teamId: string
  teamNumber: number
  teamName: string
  members: TeamMemberInfo[]
}

interface AvailabilitySummaryProps {
  availability: any[]
  roundId?: string
  declarations?: Record<string, string> // teamId -> declared golfer userId
  isAdmin?: boolean
  roundSubs?: Record<string, RoundSubInfo> // teamId -> sub info
  allTeams?: TeamInfo[] // all teams with members, used to show members without availability records
}

export function AvailabilitySummary({
  availability,
  roundId,
  declarations,
  isAdmin = false,
  roundSubs = {},
  allTeams,
}: AvailabilitySummaryProps) {
  // Build a lookup of availability records by user_id
  const availByUserId: Record<string, any> = {}
  for (const avail of availability) {
    availByUserId[avail.user_id] = avail
  }

  // Build team list — prefer allTeams (authoritative) over availability-derived grouping
  let teams: Array<{ teamId: string; team: { team_number: number; team_name: string }; members: any[] }>

  if (allTeams && allTeams.length > 0) {
    teams = allTeams.map((t) => ({
      teamId: t.teamId,
      team: { team_number: t.teamNumber, team_name: t.teamName },
      members: t.members.map((m) => {
        const avail = availByUserId[m.userId]
        return {
          id: avail?.id ?? null,
          user_id: m.userId,
          status: avail?.status ?? 'no-response',
          user: { full_name: m.fullName, display_name: null },
        }
      }),
    }))
  } else {
    // Fall back to grouping from availability records
    const teamData = availability.reduce((acc: any, avail: any) => {
      const teamId = avail.team_id
      if (!acc[teamId]) {
        acc[teamId] = { teamId, team: avail.team, members: [] }
      }
      acc[teamId].members.push(avail)
      return acc
    }, {})
    teams = (Object.values(teamData) as Array<{ teamId: string; team: { team_number: number; team_name: string }; members: any[] }>).sort((a: any, b: any) => a.team.team_number - b.team.team_number)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Availability Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((teamData: any) => {
          const { teamId, team, members } = teamData
          const inCount = members.filter((m: any) => m.status === 'in').length
          const outCount = members.filter((m: any) => m.status === 'out').length
          const totalWithResponse = members.filter((m: any) => m.status !== 'no-response').length
          const assignedSub = roundSubs[teamId] ?? null

          let teamStatus = 'undeclared'
          if (assignedSub) teamStatus = 'sub'
          else if (inCount > 0) teamStatus = 'in'
          else if (totalWithResponse > 0 && outCount === totalWithResponse) teamStatus = 'out'

          const currentDeclaredGolferId = declarations?.[teamId] ?? null

          // memberOptions for the declared golfer selector — all team members (from allTeams if available)
          const memberOptions = allTeams
            ? (allTeams.find((t) => t.teamId === teamId)?.members ?? []).map((m) => ({
                userId: m.userId,
                fullName: m.fullName,
              }))
            : members.map((m: any) => ({
                userId: m.user_id,
                fullName: m.user?.display_name ?? m.user?.full_name ?? 'Unknown',
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
                    : teamStatus === 'sub'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {teamStatus === 'in' ? '✓ Playing' :
                   teamStatus === 'out' ? '✗ Out' :
                   teamStatus === 'sub' ? '↔ Sub Assigned' :
                   '⚠ Pending'}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {members.map((member: any) => (
                  <div key={member.user_id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{member.user.full_name}</span>
                    {isAdmin && member.id ? (
                      <AdminAvailabilityOverride
                        availabilityId={member.id}
                        currentStatus={member.status}
                      />
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        member.status === 'in'
                          ? 'bg-green-100 text-green-800'
                          : member.status === 'out'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.status === 'in' ? 'In' :
                         member.status === 'out' ? 'Out' :
                         'No response'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && roundId && (
                <div className="border-t pt-3 space-y-3">
                  {!assignedSub && memberOptions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Declared golfer</p>
                      <DeclaredGolferSelector
                        roundId={roundId}
                        teamId={teamId}
                        members={memberOptions}
                        currentDeclaredGolferId={currentDeclaredGolferId}
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Sub assignment</p>
                    <SubAssignmentPanel
                      roundId={roundId}
                      teamId={teamId}
                      existingSubName={assignedSub?.subName}
                      existingRoundSubId={assignedSub?.roundSubId}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

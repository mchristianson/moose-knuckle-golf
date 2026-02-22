import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatRoundDate } from '@/lib/utils/date'

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Get upcoming rounds
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingRounds } = await supabase
    .from('rounds')
    .select('*')
    .gte('round_date', today)
    .order('round_date', { ascending: true })
    .limit(3);

  // Get rounds where scoring is open (in_progress or scoring status)
  const { data: activeRounds } = await supabase
    .from('rounds')
    .select('id, round_number, round_date, status')
    .in('status', ['in_progress', 'scoring'])
    .order('round_date', { ascending: false });

  // For active rounds, check if user is in a foursome
  const scoringRoundIds = new Set<string>()
  if (activeRounds && activeRounds.length > 0 && user) {
    const { data: foursomeRows } = await supabase
      .from('foursomes')
      .select('id, round_id')
      .in('round_id', activeRounds.map((r) => r.id))

    if (foursomeRows && foursomeRows.length > 0) {
      const { data: memberships } = await supabase
        .from('foursome_members')
        .select('foursome_id')
        .in('foursome_id', foursomeRows.map((f) => f.id))
        .eq('user_id', user.id)

      if (memberships && memberships.length > 0) {
        const memberFoursomeIds = new Set(memberships.map((m) => m.foursome_id))
        for (const f of foursomeRows) {
          if (memberFoursomeIds.has(f.id)) {
            scoringRoundIds.add(f.round_id)
          }
        }
      }
    }
  }

  // Get my availability for upcoming rounds
  const { data: myAvailability } = await supabase
    .from('round_availability')
    .select(`
      *,
      round:round_id (
        round_number,
        round_date,
        status
      )
    `)
    .eq('user_id', user?.id)
    .in('round_id', upcomingRounds?.map(r => r.id) || []);

  // Get all teams info for comparison
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, team_number, team_name')
    .order('team_number');

  const totalTeams = allTeams?.length || 0;

  // Get declarations for upcoming rounds
  let declarationsByRound: Record<string, any> = {};
  if (upcomingRounds && upcomingRounds.length > 0 && allTeams && allTeams.length > 0) {
    // First, initialize all rounds with all teams in notDeclared
    upcomingRounds.forEach((round: any) => {
      declarationsByRound[round.id] = {
        declared: [],
        notDeclared: allTeams.map((team: any) => ({
          teamId: team.id,
          teamNumber: team.team_number,
          teamName: team.team_name,
        }))
      };
    });

    // Then fetch declarations and move teams from notDeclared to declared
    const { data: allDeclarations } = await supabase
      .from('round_team_declarations')
      .select(`
        round_id,
        team_id,
        declared_golfer_id,
        team:team_id ( team_number, team_name ),
        user:declared_golfer_id ( full_name, display_name )
      `)
      .in('round_id', upcomingRounds.map((r: any) => r.id));

    if (allDeclarations) {
      allDeclarations.forEach((d: any) => {
        const team = d.team || {};
        const golfer = d.user || {};
        
        // Move from notDeclared to declared
        const notDeclaredIndex = declarationsByRound[d.round_id].notDeclared.findIndex((t: any) => t.teamId === d.team_id);
        if (notDeclaredIndex !== -1) {
          declarationsByRound[d.round_id].notDeclared.splice(notDeclaredIndex, 1);
        }
        
        declarationsByRound[d.round_id].declared.push({
          teamId: d.team_id,
          teamNumber: team.team_number,
          teamName: team.team_name,
          golferName: golfer.display_name || golfer.full_name || 'Unknown',
        });
      });
    }
  }

  // Initialize empty declarations for all rounds even if no teams
  if (!declarationsByRound || Object.keys(declarationsByRound).length === 0) {
    upcomingRounds?.forEach((round: any) => {
      declarationsByRound[round.id] = {
        declared: [],
        notDeclared: []
      };
    });
  }

  // Scoring-open rounds that are NOT already in upcomingRounds (they may be today or past)
  const upcomingIds = new Set(upcomingRounds?.map((r) => r.id) ?? [])
  const extraActiveRounds = (activeRounds ?? []).filter(
    (r) => !upcomingIds.has(r.id) && scoringRoundIds.has(r.id)
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Welcome, {(profile?.display_name ?? profile?.full_name) || 'Golfer'}!
        </h2>
        <p className="text-gray-600 mb-4">{profile?.email}</p>
        {profile?.is_admin && (
          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
            Admin
          </span>
        )}
      </div>

      {/* Scoring-open rounds not in the upcoming list (e.g. today's round already in progress) */}
      {extraActiveRounds.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Score Entry Open</h2>
          <div className="space-y-4">
            {extraActiveRounds.map((round: any) => {
              const roundDate = formatRoundDate(round.round_date)
              return (
                <div key={round.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Round {round.round_number}</h3>
                      <p className="text-gray-600">{roundDate}</p>
                    </div>
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                      {round.status === 'in_progress' ? '⛳ In Progress' : '📋 Scoring'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/scores/${round.id}`}
                      className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                    >
                      Enter My Score
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {upcomingRounds && upcomingRounds.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Rounds</h2>
          <div className="space-y-4">
            {upcomingRounds.map((round: any) => {
              const availability = myAvailability?.find(a => a.round_id === round.id);
              const roundDate = formatRoundDate(round.round_date);
              const scoringOpen = ['in_progress', 'scoring'].includes(round.status)
              const canEnterScore = scoringOpen && scoringRoundIds.has(round.id)
              const roundEnded = round.status === 'completed'

              return (
                <div key={round.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">Round {round.round_number}</h3>
                      <p className="text-gray-600">{roundDate}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {scoringOpen && (
                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                          {round.status === 'in_progress' ? '⛳ In Progress' : '📋 Scoring'}
                        </span>
                      )}
                      {roundEnded && (
                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                          ✓ Completed
                        </span>
                      )}
                      {availability && !roundEnded && (
                        <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${
                          availability.status === 'in'
                            ? 'bg-green-100 text-green-800'
                            : availability.status === 'out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {availability.status === 'in' ? '✓ Playing' :
                           availability.status === 'out' ? '✗ Not Playing' :
                           '⚠ Undeclared'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Declaration Status */}
                  {!roundEnded && ['availability_open', 'foursomes_set'].includes(round.status) && declarationsByRound[round.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                          Declared ({declarationsByRound[round.id].declared.length}/{declarationsByRound[round.id].declared.length + declarationsByRound[round.id].notDeclared.length})
                        </p>
                        {declarationsByRound[round.id].declared.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {declarationsByRound[round.id].declared.map((team: any) => (
                              <span key={team.teamId} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                ✓ T{team.teamNumber}: {team.golferName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No teams have declared yet</p>
                        )}
                      </div>
                      {declarationsByRound[round.id].notDeclared.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                            Not Declared ({declarationsByRound[round.id].notDeclared.length}/{declarationsByRound[round.id].declared.length + declarationsByRound[round.id].notDeclared.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {declarationsByRound[round.id].notDeclared.map((team: any) => (
                              <span key={team.teamId} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                ✗ T{team.teamNumber}: {team.teamName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {availability && availability.status === 'undeclared' && !roundEnded && (
                      <Link
                        href={`/availability/${round.id}`}
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Declare Availability
                      </Link>
                    )}
                    {canEnterScore && (
                      <Link
                        href={`/scores/${round.id}`}
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
                      >
                        Enter My Score
                      </Link>
                    )}
                    {!roundEnded && (
                      <Link
                        href={`/rounds/${round.id}`}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Declare Golfers
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600">No upcoming rounds scheduled yet</p>
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { RoundCard } from "@/components/rounds/round-card";

export default async function RoundsPage() {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .eq('season_year', currentYear)
    .order('round_date', { ascending: true });

  // Get declarations for all rounds to check if teams have declared
  let declarationsByRound: Record<string, number> = {};
  let teamCountByRound: Record<string, number> = {};
  let declarationDetailsByRound: Record<string, any> = {};
  if (rounds && rounds.length > 0) {
    const roundIds = rounds.map((r: any) => r.id);

    // Get distinct teams per round from availability records
    const { data: availabilityTeams } = await supabase
      .from('round_availability')
      .select('round_id, team_id')
      .in('round_id', roundIds);

    if (availabilityTeams) {
      const teamsPerRound: Record<string, Set<string>> = {};
      availabilityTeams.forEach((a: any) => {
        if (!teamsPerRound[a.round_id]) teamsPerRound[a.round_id] = new Set();
        teamsPerRound[a.round_id].add(a.team_id);
      });
      Object.entries(teamsPerRound).forEach(([roundId, teamSet]) => {
        teamCountByRound[roundId] = teamSet.size;
      });
    }

    const { data: allDeclarations } = await supabase
      .from('round_team_declarations')
      .select(`
        round_id,
        team_id,
        declared_golfer_id,
        team:team_id ( team_number, team_name ),
        user:declared_golfer_id ( full_name, display_name )
      `)
      .in('round_id', roundIds);

    if (allDeclarations) {
      allDeclarations.forEach((d: any) => {
        declarationsByRound[d.round_id] = (declarationsByRound[d.round_id] || 0) + 1;

        if (!declarationDetailsByRound[d.round_id]) {
          declarationDetailsByRound[d.round_id] = { declared: [], notDeclared: [] };
        }

        const team = d.team || {};
        const golfer = d.user || {};
        declarationDetailsByRound[d.round_id].declared.push({
          teamId: d.team_id,
          teamNumber: team.team_number,
          teamName: team.team_name,
          golferName: golfer.display_name || golfer.full_name || 'Unknown',
        });
      });
    }

    // Treat approved sub assignments as declarations
    const { data: allSubAssignments } = await supabase
      .from('round_subs')
      .select(`
        round_id,
        team_id,
        status,
        team:team_id ( team_number, team_name ),
        sub:sub_id ( full_name )
      `)
      .in('round_id', roundIds)
      .eq('status', 'approved');

    if (allSubAssignments) {
      allSubAssignments.forEach((s: any) => {
        const alreadyCounted = declarationDetailsByRound[s.round_id]?.declared.some(
          (d: any) => d.teamId === s.team_id
        );
        if (alreadyCounted) return;

        declarationsByRound[s.round_id] = (declarationsByRound[s.round_id] || 0) + 1;

        if (!declarationDetailsByRound[s.round_id]) {
          declarationDetailsByRound[s.round_id] = { declared: [], notDeclared: [] };
        }

        const team = s.team || {};
        const sub = s.sub || {};
        declarationDetailsByRound[s.round_id].declared.push({
          teamId: s.team_id,
          teamNumber: team.team_number,
          teamName: team.team_name,
          golferName: `${sub.full_name || 'Sub'} (sub)`,
        });
      });
    }

    // Add teams that haven't declared, based on round availability records
    if (availabilityTeams) {
      const { data: teamDetails } = await supabase
        .from('teams')
        .select('id, team_number, team_name');

      const teamMap = Object.fromEntries((teamDetails || []).map((t: any) => [t.id, t]));

      const teamsPerRound: Record<string, Set<string>> = {};
      availabilityTeams.forEach((a: any) => {
        if (!teamsPerRound[a.round_id]) teamsPerRound[a.round_id] = new Set();
        teamsPerRound[a.round_id].add(a.team_id);
      });

      roundIds.forEach((roundId: string) => {
        if (!declarationDetailsByRound[roundId]) {
          declarationDetailsByRound[roundId] = { declared: [], notDeclared: [] };
        }
        const roundTeams = teamsPerRound[roundId] || new Set();
        roundTeams.forEach((teamId: string) => {
          const isDeclared = declarationDetailsByRound[roundId].declared.some((d: any) => d.teamId === teamId);
          if (!isDeclared) {
            const team = teamMap[teamId] || {};
            declarationDetailsByRound[roundId].notDeclared.push({
              teamId,
              teamNumber: team.team_number,
              teamName: team.team_name,
            });
          }
        });
      });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rounds</h1>
        <Link
          href="/admin/rounds/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Create Round
        </Link>
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">No rounds scheduled yet</p>
          <Link
            href="/admin/rounds/new"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Create Your First Round
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round: any) => (
            <RoundCard
              key={round.id}
              round={round}
              allDeclared={declarationsByRound[round.id] === teamCountByRound[round.id] && (teamCountByRound[round.id] || 0) > 0}
              declarationDetails={declarationDetailsByRound[round.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

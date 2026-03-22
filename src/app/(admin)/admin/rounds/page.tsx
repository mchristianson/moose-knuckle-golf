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

    // Use all active teams as the source of truth (not round_availability records)
    const { data: allTeams } = await supabase
      .from('teams')
      .select('id, team_number, team_name')
      .eq('season_year', currentYear)
      .order('team_number', { ascending: true });

    const activeTeams = allTeams || [];
    const totalTeams = activeTeams.length;

    // Seed every round with all teams as "not declared"
    roundIds.forEach((roundId: string) => {
      declarationDetailsByRound[roundId] = {
        declared: [],
        notDeclared: activeTeams.map((t: any) => ({
          teamId: t.id,
          teamNumber: t.team_number,
          teamName: t.team_name,
        })),
      };
      teamCountByRound[roundId] = totalTeams;
    });

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
        const roundDetails = declarationDetailsByRound[d.round_id];
        if (!roundDetails) return;

        // Move team from notDeclared → declared
        roundDetails.notDeclared = roundDetails.notDeclared.filter((t: any) => t.teamId !== d.team_id);

        const team = d.team || {};
        const golfer = d.user || {};
        roundDetails.declared.push({
          teamId: d.team_id,
          teamNumber: team.team_number,
          teamName: team.team_name,
          golferName: golfer.display_name || golfer.full_name || 'Unknown',
        });

        declarationsByRound[d.round_id] = (declarationsByRound[d.round_id] || 0) + 1;
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
        const roundDetails = declarationDetailsByRound[s.round_id];
        if (!roundDetails) return;

        const alreadyDeclared = roundDetails.declared.some((d: any) => d.teamId === s.team_id);
        if (alreadyDeclared) return;

        // Move team from notDeclared → declared
        roundDetails.notDeclared = roundDetails.notDeclared.filter((t: any) => t.teamId !== s.team_id);

        const team = s.team || {};
        const sub = s.sub || {};
        roundDetails.declared.push({
          teamId: s.team_id,
          teamNumber: team.team_number,
          teamName: team.team_name,
          golferName: `${sub.full_name || 'Sub'} (sub)`,
        });

        declarationsByRound[s.round_id] = (declarationsByRound[s.round_id] || 0) + 1;
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

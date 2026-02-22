import { createClient } from "@/lib/supabase/server";
import { DeclaredGolferSelector } from "@/components/availability/declared-golfer-selector";
import { formatRoundDate } from '@/lib/utils/date'
import { redirect } from "next/navigation";

export default async function RoundDeclarationsPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { roundId } = await params;

  const [{ data: round }, { data: profile }] = await Promise.all([
    supabase.from("rounds").select("*").eq("id", roundId).single(),
    supabase.from("users").select("is_admin").eq("id", user.id).single(),
  ]);

  if (!round) {
    return <div>Round not found</div>;
  }

  const isAdmin = profile?.is_admin ?? false;

  // Get all teams with their members
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      id,
      team_number,
      team_name,
      team_members (
        user_id,
        user:user_id (
          id,
          full_name,
          display_name
        )
      )
    `)
    .eq("season_year", round.season_year)
    .order("team_number");

  // Find which team the current user belongs to
  const myTeamId = (teams || []).find((t: any) =>
    t.team_members.some((tm: any) => tm.user_id === user.id)
  )?.id ?? null;

  // Get existing declarations for this round
  const { data: declarations } = await supabase
    .from("round_team_declarations")
    .select("team_id, declared_golfer_id")
    .eq("round_id", roundId);

  const declarationMap: Record<string, string> = Object.fromEntries(
    (declarations || []).map((d) => [d.team_id, d.declared_golfer_id])
  );

  const roundDate = formatRoundDate(round.round_date);

  const declaredCount = Object.keys(declarationMap).length;
  const totalTeams = teams?.length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Round {round.round_number} — Declare Golfers</h1>
      <p className="text-gray-600 mb-6">{roundDate}</p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          {isAdmin
            ? "As an admin, you can set the declared golfer for any team."
            : "Select which member of your team will be playing this round."}
        </p>
        <p className="text-sm font-semibold text-blue-900 mt-1">
          {declaredCount} of {totalTeams} teams declared
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(teams || []).map((team: any) => {
          const members = (team.team_members || []).map((tm: any) => ({
            userId: tm.user_id,
            fullName: (tm.user?.display_name ?? tm.user?.full_name) || "Unknown",
          }));
          const currentDeclaredGolferId = declarationMap[team.id] || null;
          const canEdit = isAdmin || team.id === myTeamId;

          return (
            <div
              key={team.id}
              className={`bg-white rounded-lg shadow p-4 ${!canEdit ? "opacity-75" : ""}`}
            >
              <div className="mb-3">
                <h2 className="font-semibold">
                  Team {team.team_number} — {team.team_name}
                </h2>
                {currentDeclaredGolferId ? (
                  <p className="text-xs text-green-700 mt-0.5">✓ Declared</p>
                ) : (
                  <p className="text-xs text-yellow-700 mt-0.5">⚠ Not yet declared</p>
                )}
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">No members on this team</p>
              ) : (
                <DeclaredGolferSelector
                  roundId={roundId}
                  teamId={team.id}
                  members={members}
                  currentDeclaredGolferId={currentDeclaredGolferId}
                  readOnly={!canEdit}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

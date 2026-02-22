import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatRoundDate } from "@/lib/utils/date";
import { AvailabilitySummary } from "@/components/availability/availability-summary";
import { TeeTimeEditor } from "@/components/rounds/tee-time-editor";
import { GenerateFoursomesButton } from "@/components/foursomes/generate-foursomes-button";
import { DraggableFoursomes } from "@/components/foursomes/draggable-foursomes";

export default async function RoundDetailPage({ params }: { params: Promise<{ roundId: string }> }) {
  const supabase = await createClient();
  const { roundId } = await params;

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round) {
    return <div>Round not found</div>;
  }

  // Get all availability for this round
  const { data: availability } = await supabase
    .from('round_availability')
    .select(`
      *,
      user:user_id (
        full_name,
        email
      ),
      team:team_id (
        team_number,
        team_name
      )
    `)
    .eq('round_id', roundId)
    .order('team_id');

  // Get foursomes if they exist
  const { data: foursomes } = await supabase
    .from('foursomes')
    .select(`
      *,
      members:foursome_members (
        *,
        user:user_id (
          id,
          full_name
        ),
        team:team_id (
          id,
          team_name,
          team_number
        ),
        sub:sub_id (
          id,
          full_name
        )
      )
    `)
    .eq('round_id', roundId)
    .order('tee_time_slot');

  // Get declared golfers for this round
  const { data: declarationsRaw } = await supabase
    .from('round_team_declarations')
    .select('team_id, declared_golfer_id')
    .eq('round_id', roundId);

  // Get approved subs for this round
  const { data: roundSubsRaw } = await supabase
    .from('round_subs')
    .select('id, team_id, sub_id, subs(full_name)')
    .eq('round_id', roundId)
    .eq('status', 'approved');

  const declarations: Record<string, string> = Object.fromEntries(
    (declarationsRaw || []).map((d) => [d.team_id, d.declared_golfer_id])
  );

  const roundSubs: Record<string, { subId: string; subName: string; roundSubId: string }> =
    Object.fromEntries(
      (roundSubsRaw || []).map((rs: any) => [
        rs.team_id,
        {
          subId: rs.sub_id,
          subName: rs.subs?.full_name ?? 'Unknown',
          roundSubId: rs.id,
        },
      ])
    );

  // Get total number of teams to check if all have declared
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id')
    .order('team_number');

  const totalTeams = allTeams?.length || 0;
  const subTeamIds = new Set(Object.keys(roundSubs));
  const subTeamCount = subTeamIds.size;
  // Only count declarations for teams that don't also have a sub (avoid double-counting)
  const declaredCount = Object.keys(declarations).filter(id => !subTeamIds.has(id)).length;
  // A team is accounted for if it has a declared golfer OR an approved sub assigned
  const accountedForCount = declaredCount + subTeamCount;
  const allDeclared = accountedForCount === totalTeams && totalTeams > 0;

  const roundDate = formatRoundDate(round.round_date);

  // Each sub-assigned team removes one slot from the "in" pool (their members are all out)
  // so the effective available count adds one per sub team
  const rawAvailableCount = availability?.filter(a => a.status === 'in').length || 0;
  const availableCount = rawAvailableCount + subTeamCount;

  // Map of user_id → availability status — passed to DraggableFoursomes to flag mismatches
  const availabilityMap: Record<string, string> = Object.fromEntries(
    (availability || []).map((a) => [a.user_id, a.status])
  );

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/rounds" className="text-green-600 hover:text-green-700 text-sm">
            ← Back to Rounds
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            Round {round.round_number}
            <span className="ml-2 text-base font-normal text-gray-500">{roundDate}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="text-gray-400">Status:</span>{' '}
              <span className="font-medium capitalize">{round.status.replace(/_/g, ' ')}</span>
            </span>
            <span>
              <span className="text-gray-400">Type:</span>{' '}
              <span className="font-medium capitalize">{round.round_type}</span>
            </span>
            <span>
              <span className="text-gray-400">Season:</span>{' '}
              <span className="font-medium">{round.season_year}</span>
            </span>
            <span>
              <span className="text-gray-400">Available:</span>{' '}
              <span className="font-medium">{availableCount} / 8</span>
            </span>
            <TeeTimeEditor roundId={roundId} currentTeeTime={round.tee_time} />
          </div>
        </div>
        <Link
          href={`/admin/rounds/${roundId}/scores`}
          className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
        >
          🏌️ Enter Scores
        </Link>
      </div>

      {foursomes && foursomes.length > 0 ? (
        <div className="mb-6">
          <DraggableFoursomes
            foursomes={foursomes}
            roundId={roundId}
            teeTime={round.tee_time}
            availabilityMap={availabilityMap}
            expectedGolfers={availableCount}
            subsByTeam={Object.fromEntries(Object.entries(roundSubs).map(([teamId, rs]) => [teamId, rs.subName]))}
          />
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Foursome Assignment</h2>
          <GenerateFoursomesButton roundId={roundId} availableCount={availableCount} allDeclared={allDeclared} />
        </div>
      )}

      <div className="mb-6">
        {foursomes && foursomes.length > 0 && (
          <div className="mb-4">
            <GenerateFoursomesButton roundId={roundId} availableCount={availableCount} allDeclared={allDeclared} />
          </div>
        )}
        <AvailabilitySummary
          availability={availability || []}
          roundId={roundId}
          declarations={declarations}
          isAdmin={true}
          roundSubs={roundSubs}
        />
      </div>
    </div>
  );
}

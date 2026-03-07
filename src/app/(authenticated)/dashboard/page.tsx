import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatRoundDate } from '@/lib/utils/date'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { DashboardRoundCard } from '@/components/dashboard/DashboardRoundCard'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
import { PencilIcon, MapPinIcon, FlagIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ declared?: string }>;
}) {
  const { declared } = await searchParams;
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

  // Separate rounds into active (scoring open) and upcoming (future)
  const activeScoringSectionRounds = (activeRounds ?? []).filter(
    (r) => scoringRoundIds.has(r.id)
  )
  const futureUpcomingRounds = (upcomingRounds ?? []).filter(
    (r) => !activeScoringSectionRounds.some((ar) => ar.id === r.id)
  )
  const pastRounds = (upcomingRounds ?? []).filter((r) => r.status === 'completed')

  return (
    <div>
      {/* Success Message */}
      {declared && (
        <Card variant="elevated" className="mb-lg border-l-4 border-l-success bg-green-50">
          <div className="flex items-center gap-2">
            <Icon icon={CheckCircleIcon} size="md" className="text-success" />
            <p className="text-success font-medium">Availability declared successfully!</p>
          </div>
        </Card>
      )}

      {/* Welcome Section - Compact */}
      <Card className="mb-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h2 mb-xs">
              Welcome, {(profile?.display_name ?? profile?.full_name) || 'Golfer'}!
            </h1>
            {profile?.is_admin && (
              <span className="inline-flex items-center bg-primary text-white text-xs font-medium px-3 py-1 rounded-full mt-2">
                Admin
              </span>
            )}
          </div>
          <button className="hover:opacity-70 transition-opacity p-2" aria-label="Edit profile">
            <Icon icon={PencilIcon} size="lg" />
          </button>
        </div>
      </Card>

      {/* Active/Scoring Rounds - Highest Priority */}
      {activeScoringSectionRounds.length > 0 && (
        <div className="mb-lg">
          <h2 className="text-h2 mb-md flex items-center gap-2">
            <Icon icon={MapPinIcon} size="md" />
            <span>Round in Play</span>
          </h2>
          <div className="space-y-md">
            {activeScoringSectionRounds.map((round: any) => (
              <DashboardRoundCard
                key={round.id}
                round={round}
                availability={myAvailability?.find(a => a.round_id === round.id)}
                declarations={declarationsByRound[round.id]}
                canEnterScore={scoringRoundIds.has(round.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Extra Active Rounds (today's scoring that wasn't in upcoming) */}
      {extraActiveRounds.length > 0 && !activeScoringSectionRounds.some((r) => extraActiveRounds.some((e) => e.id === r.id)) && (
        <div className="mb-lg">
          <h2 className="text-h2 mb-md">Score Entry Open</h2>
          <div className="space-y-md">
            {extraActiveRounds.map((round: any) => (
              <Card key={round.id} variant="elevated" className="border-l-4 border-l-success">
                <div className="flex justify-between items-start gap-md mb-md">
                  <div>
                    <h3 className="text-h4 mb-xs">Round {round.round_number}</h3>
                    <p className="text-small text-neutral-700">{formatRoundDate(round.round_date)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-success text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    <Icon icon={round.status === 'in_progress' ? FlagIcon : ClipboardDocumentListIcon} size="sm" />
                    {round.status === 'in_progress' ? 'In Progress' : 'Scoring'}
                  </span>
                </div>
                <Button variant="primary" asChild>
                  <Link href={`/scores/${round.id}`}>
                    Enter My Score
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Rounds - Collapsible */}
      {futureUpcomingRounds.length > 0 ? (
        <CollapsibleSection
          title="Upcoming Rounds"
          count={futureUpcomingRounds.length}
          defaultOpen={futureUpcomingRounds.length === 1}
        >
          <div className="space-y-md">
            {futureUpcomingRounds.map((round: any) => (
              <DashboardRoundCard
                key={round.id}
                round={round}
                availability={myAvailability?.find(a => a.round_id === round.id)}
                declarations={declarationsByRound[round.id]}
                canEnterScore={scoringRoundIds.has(round.id)}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {/* Past Rounds - Collapsible */}
      {pastRounds.length > 0 && (
        <CollapsibleSection
          title="Past Rounds"
          count={pastRounds.length}
          defaultOpen={false}
        >
          <div className="space-y-md">
            {pastRounds.map((round: any) => (
              <DashboardRoundCard
                key={round.id}
                round={round}
                availability={myAvailability?.find(a => a.round_id === round.id)}
                declarations={declarationsByRound[round.id]}
                canEnterScore={false}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Empty State */}
      {upcomingRounds?.length === 0 && activeRounds?.length === 0 && (
        <Card className="text-center py-lg">
          <p className="text-neutral-700 mb-md">No upcoming rounds scheduled yet</p>
          {profile?.is_admin && (
            <Button variant="primary" asChild>
              <Link href="/admin/rounds">Create a Round</Link>
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

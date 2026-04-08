import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatRoundDate } from '@/lib/utils/date'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { DashboardRoundCard } from '@/components/dashboard/DashboardRoundCard'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
import { CalendarIcon, Cog6ToothIcon, MapPinIcon, FlagIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

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
    .order('round_date', { ascending: true });

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

  // Fetch foursomes for active rounds to display on dashboard
  let foursomesByRound: Record<string, any[]> = {}
  if (activeRounds && activeRounds.length > 0) {
    const { data: activeFoursomes } = await supabase
      .from('foursomes')
      .select(`
        *,
        members:foursome_members (
          *,
          user:user_id ( id, full_name, display_name ),
          sub:sub_id ( id, full_name ),
          team:team_id ( id, team_name, team_number )
        )
      `)
      .in('round_id', activeRounds.map((r) => r.id))
      .order('tee_time_slot')

    if (activeFoursomes) {
      for (const f of activeFoursomes) {
        if (!foursomesByRound[f.round_id]) foursomesByRound[f.round_id] = []
        foursomesByRound[f.round_id].push(f)
      }
    }
  }

  // Get my availability for upcoming rounds (for the per-round availability badge)
  const { data: myAvailability } = await supabase
    .from('round_availability')
    .select('id, round_id, status')
    .eq('user_id', user?.id)
    .in('round_id', upcomingRounds?.map(r => r.id) || []);

  // Get all teams with members
  const { data: allTeams } = await supabase
    .from('teams')
    .select(`
      id, team_number, team_name,
      team_members (
        user_id,
        user:user_id ( full_name, display_name, id )
      )
    `)
    .order('team_number');

  // Get all availability for upcoming rounds (all players)
  const allRoundIds = upcomingRounds?.map(r => r.id) ?? []
  const { data: allAvailability } = await supabase
    .from('round_availability')
    .select('round_id, user_id, status')
    .in('round_id', allRoundIds)

  // Group availability by round
  const availabilityByRound: Record<string, { user_id: string; status: 'in' | 'out' }[]> = {}
  for (const a of allAvailability ?? []) {
    if (!availabilityByRound[a.round_id]) availabilityByRound[a.round_id] = []
    availabilityByRound[a.round_id].push({ user_id: a.user_id, status: a.status })
  }

  // Normalize teams for team availability grid
  const availabilityTeams = (allTeams ?? []).map((t: any) => ({
    id: t.id,
    team_number: t.team_number,
    team_name: t.team_name,
    members: (t.team_members ?? []).map((m: any) => ({
      user_id: m.user_id,
      full_name: m.user?.display_name ?? m.user?.full_name ?? 'Unknown',
    })),
  }))

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

  const displayName = profile?.display_name ?? profile?.full_name ?? 'Golfer'

  return (
    <div>
      {/* Success Message */}
      {declared && (
        <div className="mx-4 mt-4">
          <Card variant="elevated" className="border-l-4 border-l-success bg-green-50">
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircleIcon} size="md" className="text-success" />
              <p className="text-success font-medium">Availability declared successfully!</p>
            </div>
          </Card>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-xl font-bold">Welcome back, {displayName}!</h1>
          <div className="flex items-center gap-2 mt-1">
            {profile?.is_admin && (
              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
            <span className="text-zinc-400 text-sm">Season 2026</span>
          </div>
        </div>
        <Link href="/profile" className="text-zinc-400 hover:text-white p-1 transition-colors">
          <Icon icon={Cog6ToothIcon} size="md" />
        </Link>
      </div>

      {/* Active/Scoring Rounds - Highest Priority */}
      {activeScoringSectionRounds.length > 0 && (
        <div className="mb-3">
          <h2 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
            <Icon icon={MapPinIcon} size="md" />
            <span>Round in Play</span>
          </h2>
          <div className="space-y-3">
            {activeScoringSectionRounds.map((round: any) => (
              <DashboardRoundCard
                key={round.id}
                round={round}
                availability={myAvailability?.find(a => a.round_id === round.id)}
                canEnterScore={scoringRoundIds.has(round.id)}
                foursomes={foursomesByRound[round.id]}
                teams={availabilityTeams}
                roundAvailability={availabilityByRound[round.id] ?? []}
                defaultExpanded={true}
                isAdmin={!!profile?.is_admin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Extra Active Rounds (today's scoring that wasn't in upcoming) */}
      {extraActiveRounds.length > 0 && !activeScoringSectionRounds.some((r) => extraActiveRounds.some((e) => e.id === r.id)) && (
        <div className="mb-3">
          <h2 className="text-white text-base font-semibold mb-3">Score Entry Open</h2>
          <div className="space-y-3">
            {extraActiveRounds.map((round: any) => (
              <div key={round.id} className="bg-zinc-800 rounded-xl p-4 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="text-white font-semibold">Round {round.round_number}</h3>
                    <p className="text-zinc-400 text-sm">{formatRoundDate(round.round_date)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    <Icon icon={round.status === 'in_progress' ? FlagIcon : ClipboardDocumentListIcon} size="sm" />
                    {round.status === 'in_progress' ? 'In Progress' : 'Scoring'}
                  </span>
                </div>
                <Button variant="primary" asChild className="w-full">
                  <Link href={`/scores/${round.id}`}>Enter My Score</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Rounds */}
      {futureUpcomingRounds.length > 0 && (
        <div className="mb-3">
          {/* Section header */}
          <div className="flex items-center justify-between px-4 mb-2">
            <div className="flex items-center gap-2 text-white">
              <Icon icon={CalendarIcon} size="md" />
              <span className="text-base font-semibold">Upcoming Rounds</span>
              <span className="text-zinc-400 text-sm">({futureUpcomingRounds.length})</span>
            </div>
            <Link href="/dashboard" className="text-green-500 text-sm font-medium">
              View All ›
            </Link>
          </div>
          <div className="px-4 space-y-3">
            {futureUpcomingRounds.map((round: any, index: number) => (
              <DashboardRoundCard
                key={round.id}
                round={round}
                availability={myAvailability?.find(a => a.round_id === round.id)}
                canEnterScore={scoringRoundIds.has(round.id)}
                teams={availabilityTeams}
                roundAvailability={availabilityByRound[round.id] ?? []}
                defaultExpanded={index === 0}
                isAdmin={!!profile?.is_admin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Rounds - Collapsible */}
      {pastRounds.length > 0 && (
        <div className="px-4">
          <CollapsibleSection
            title="Past Rounds"
            count={pastRounds.length}
            defaultOpen={false}
          >
            <div className="space-y-3">
              {pastRounds.map((round: any) => (
                <DashboardRoundCard
                  key={round.id}
                  round={round}
                  availability={myAvailability?.find(a => a.round_id === round.id)}
                  canEnterScore={false}
                  isAdmin={!!profile?.is_admin}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Empty State */}
      {upcomingRounds?.length === 0 && activeRounds?.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-zinc-400 mb-4">No upcoming rounds scheduled yet</p>
          {profile?.is_admin && (
            <Button variant="primary" asChild>
              <Link href="/admin/rounds">Create a Round</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

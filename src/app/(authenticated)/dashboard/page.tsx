import { redirect } from 'next/navigation'
import { getViewerContext } from '@/lib/viewer'
import Link from "next/link";
import { formatRoundDate, getTodayDateString } from '@/lib/utils/date'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { DashboardRoundCard } from '@/components/dashboard/DashboardRoundCard'
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection'
import { CalendarIcon, Cog6ToothIcon, MapPinIcon, FlagIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getAllTeams } from '@/lib/data/teams'
import { getWeatherForRound } from '@/lib/weather'

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
  const ctx = await getViewerContext();
  if (!ctx) redirect('/login');
  const { effectiveUserId: userId, effectiveProfile: profile, db: supabase } = ctx;

  const today = getTodayDateString();
  const currentYear = new Date().getFullYear();

  // Group 2: independent queries run in parallel
  const [
    { data: upcomingRounds },
    { data: activeRounds },
    allTeams,
    { data: handicapRow },
    { data: pastRoundsData },
  ] = await Promise.all([
    supabase
      .from('rounds')
      .select('*')
      .gte('round_date', today)
      .order('round_date', { ascending: true }),
    supabase
      .from('rounds')
      .select('id, round_number, round_date, status')
      .in('status', ['in_progress', 'scoring'])
      .order('round_date', { ascending: false }),
    getAllTeams(currentYear),
    supabase
      .from('handicaps')
      .select('current_handicap')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('rounds')
      .select('id, round_number, round_date, status, round_type')
      .eq('status', 'completed')
      .lt('round_date', today)
      .order('round_date', { ascending: false })
      .limit(10),
  ]);

  const activeRoundIds = (activeRounds ?? []).map((r: { id: number | string }) => String(r.id))
  const upcomingRoundIds = (upcomingRounds ?? []).map((r: { id: number | string }) => String(r.id))
  const allRoundIds = [...new Set([...upcomingRoundIds, ...activeRoundIds])]

  // Group 3: depends on round IDs from group 2 — run in parallel
  const [
    { data: foursomeRows },
    { data: myAvailability },
    { data: allAvailability },
    { data: activeFoursomesRaw },
  ] = await Promise.all([
    activeRoundIds.length
      ? supabase.from('foursomes').select('id, round_id').in('round_id', activeRoundIds)
      : Promise.resolve({ data: [] }),
    upcomingRoundIds.length
      ? supabase
          .from('round_availability')
          .select('id, round_id, status')
          .eq('user_id', userId)
          .in('round_id', upcomingRoundIds)
      : Promise.resolve({ data: [] }),
    allRoundIds.length
      ? supabase
          .from('round_availability')
          .select('round_id, user_id, status')
          .in('round_id', allRoundIds)
      : Promise.resolve({ data: [] }),
    activeRoundIds.length
      ? supabase
          .from('foursomes')
          .select(`
            id, round_id, tee_time_slot,
            members:foursome_members (
              id, cart_number, is_sub, user_id, team_id, sub_id,
              user:user_id ( id, full_name, display_name ),
              sub:sub_id ( id, full_name ),
              team:team_id ( id, team_name, team_number )
            )
          `)
          .in('round_id', activeRoundIds)
          .order('tee_time_slot')
      : Promise.resolve({ data: [] }),
  ]);

  // Group 4: membership check — needs foursomeRows IDs
  const foursomeRowIds = (foursomeRows ?? []).map((f: { id: number | string }) => f.id)
  const { data: memberships } = foursomeRowIds.length
    ? await supabase
        .from('foursome_members')
        .select('foursome_id')
        .in('foursome_id', foursomeRowIds)
        .eq('user_id', userId)
    : { data: [] }

  // Derive which rounds the current user can score
  const scoringRoundIds = new Set<string>()
  if (memberships && memberships.length > 0) {
    const memberFoursomeIds = new Set(memberships.map((m: { foursome_id: string | number }) => m.foursome_id))
    for (const f of foursomeRows ?? []) {
      if (memberFoursomeIds.has(f.id)) {
        scoringRoundIds.add(f.round_id)
      }
    }
  }

  // Group foursomes by round
  const foursomesByRound: Record<string, any[]> = {}
  for (const f of activeFoursomesRaw ?? []) {
    if (!foursomesByRound[f.round_id]) foursomesByRound[f.round_id] = []
    foursomesByRound[f.round_id].push(f)
  }

  // Group availability by round
  const availabilityByRound: Record<string, { user_id: string; status: 'in' | 'out' }[]> = {}
  for (const a of allAvailability ?? []) {
    if (!availabilityByRound[a.round_id]) availabilityByRound[a.round_id] = []
    availabilityByRound[a.round_id].push({ user_id: a.user_id, status: a.status })
  }

  // Normalize teams for team availability grid
  const availabilityTeams = allTeams.map((t: any) => ({
    id: t.id,
    team_number: t.team_number,
    team_name: t.team_name,
    members: (t.team_members ?? []).map((m: any) => ({
      user_id: m.user_id,
      full_name: m.user?.display_name ?? m.user?.full_name ?? 'Unknown',
    })),
  }))

  // Scoring-open rounds that are NOT already in upcomingRounds (they may be today or past)
  const upcomingIds = new Set(upcomingRounds?.map((r: { id: number | string }) => String(r.id)) ?? [])
  const extraActiveRounds = (activeRounds ?? []).filter(
    (r: { id: number | string }) => !upcomingIds.has(String(r.id)) && scoringRoundIds.has(String(r.id))
  )

  // Separate rounds into active (scoring open) and upcoming (future)
  const activeScoringSectionRounds = (activeRounds ?? []).filter(
    (r: { id: number | string }) => scoringRoundIds.has(String(r.id))
  )
  const futureUpcomingRounds = (upcomingRounds ?? []).filter(
    (r: { id: number | string; status?: string }) => !activeScoringSectionRounds.some((ar: { id: number | string }) => String(ar.id) === String(r.id))
  )
  const pastRounds = pastRoundsData ?? []

  const upcomingWeather = futureUpcomingRounds[0]
    ? await getWeatherForRound(futureUpcomingRounds[0].round_date)
    : null

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
            {handicapRow && (
              <span className="text-zinc-400 text-sm">•</span>
            )}
            {handicapRow && (
              <span className="text-white text-sm font-medium">Handicap: {handicapRow.current_handicap}</span>
            )}
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
                availability={myAvailability?.find((a: { round_id: string | number }) => String(a.round_id) === String(round.id))}
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
      {extraActiveRounds.length > 0 && !activeScoringSectionRounds.some((r: { id: number | string }) => extraActiveRounds.some((e: { id: number | string }) => String(e.id) === String(r.id))) && (
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
                availability={myAvailability?.find((a: { round_id: string | number }) => String(a.round_id) === String(round.id))}
                canEnterScore={scoringRoundIds.has(round.id)}
                teams={availabilityTeams}
                roundAvailability={availabilityByRound[round.id] ?? []}
                defaultExpanded={index === 0}
                isAdmin={!!profile?.is_admin}
                weather={index === 0 ? upcomingWeather : undefined}
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
                  availability={myAvailability?.find((a: { round_id: string | number }) => String(a.round_id) === String(round.id))}
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

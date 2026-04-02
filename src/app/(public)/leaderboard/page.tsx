import { createClient } from '@/lib/supabase/server'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const { data: { user } } = await supabase.auth.getUser()

  // ── Season standings ──────────────────────────────────────────────────────
  const { data: standings } = await supabase
    .rpc('get_season_leaderboard', { p_season_year: currentYear })

  // ── Recent completed rounds (last 5) ─────────────────────────────────────
  const { data: recentRoundsData } = await supabase
    .from('rounds')
    .select(`
      id,
      round_number,
      round_date,
      round_points (
        finish_position,
        net_score,
        points_earned,
        is_tied,
        team_id,
        team:team_id ( team_number, team_name )
      )
    `)
    .eq('season_year', currentYear)
    .eq('status', 'completed')
    .eq('round_type', 'regular')
    .order('round_date', { ascending: false })
    .limit(5)

  // Get scores for these rounds to map golfers to teams
  let recentRounds = recentRoundsData ?? []
  if (recentRounds.length > 0) {
    const roundIds = recentRounds.map((r: any) => r.id)
    const { data: scores } = await supabase
      .from('scores')
      .select('round_id, team_id, user:user_id ( full_name, display_name )')
      .in('round_id', roundIds)
      .eq('is_sub', false) // Only get declared golfers

    const scoresByTeamRound = new Map<string, any>()
    scores?.forEach((s: any) => {
      scoresByTeamRound.set(`${s.round_id}-${s.team_id}`, {
        full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown'
      })
    })

    // Map golfer names to round_points
    recentRounds = recentRounds.map((round: any) => ({
      ...round,
      round_points: round.round_points.map((rp: any) => ({
        ...rp,
        golfer: scoresByTeamRound.get(`${round.id}-${rp.team_id}`)
      }))
    }))
  }

  // ── Current round (in_progress or scoring) ───────────────────────────────
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('id, round_number, round_date, status, tee_time')
    .in('status', ['in_progress', 'scoring'])
    .order('round_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Foursomes for the current round ─────────────────────────────────────
  let currentRoundFoursomes: any[] = []
  if (currentRound) {
    const { data: foursomesData } = await supabase
      .from('foursomes')
      .select(`
        *,
        members:foursome_members (
          user_id,
          cart_number,
          is_sub,
          sub_id,
          user:user_id ( full_name, display_name, id ),
          sub:sub_id ( full_name ),
          team:team_id ( team_number, team_name, id )
        )
      `)
      .eq('round_id', currentRound.id)
      .order('tee_time_slot')

    currentRoundFoursomes = (foursomesData ?? []).map((f: any) => ({
      id: f.id,
      tee_time_slot: f.tee_time_slot,
      tee_time: f.tee_time ?? null,
      members: (f.members ?? []).map((m: any) => ({
        user_id: m.user_id,
        cart_number: m.cart_number,
        is_sub: m.is_sub,
        full_name: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
        team_name: m.team?.team_name ?? '',
        team_number: m.team?.team_number ?? 0,
      }))
    }))
  }

  // ── Scores for the current round ─────────────────────────────────────────
  let currentRoundScores: any[] = []
  if (currentRound) {
    const { data: scores } = await supabase
      .from('scores')
      .select(`
        user_id,
        gross_score,
        net_score,
        handicap_at_time,
        hole_scores,
        is_locked,
        user:user_id ( full_name, display_name ),
        team:team_id ( team_name, team_number )
      `)
      .eq('round_id', currentRound.id)

    currentRoundScores = (scores ?? []).map((s: any) => ({
      user_id: s.user_id,
      full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown',
      team_name: s.team?.team_name ?? '',
      team_number: s.team?.team_number ?? 0,
      gross_score: s.gross_score,
      net_score: s.net_score,
      handicap_at_time: s.handicap_at_time,
      hole_scores: s.hole_scores ?? [],
      is_locked: s.is_locked ?? false,
    }))
  }

  // ── Next round (when no current round) ───────────────────────────────────
  let nextRound: any = null
  let nextRoundAvailability: any[] = []
  let nextRoundFoursomes: any[] = []
  let nextRoundTeamMembers: any[] = []
  if (!currentRound) {
    // Fetch the next upcoming round by date
    const { data: nextRoundData } = await supabase
      .from('rounds')
      .select('id, round_number, round_date, status, tee_time')
      .eq('season_year', currentYear)
      .eq('round_type', 'regular')
      .in('status', ['scheduled', 'availability_open', 'foursomes_set'])
      .order('round_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextRoundData) {
      nextRound = nextRoundData

      // Get availability for next round
      const { data: availabilityData } = await supabase
        .from('round_availability')
        .select(`
          *,
          user:user_id ( full_name, display_name, id ),
          team:team_id ( team_number, team_name, id )
        `)
        .eq('round_id', nextRound.id)
        .order('team_id')

      nextRoundAvailability = (availabilityData ?? []).map((a: any) => ({
        user_id: a.user_id,
        team_id: a.team_id,
        status: a.status,
        full_name: a.user?.display_name ?? a.user?.full_name ?? 'Unknown',
        team_name: a.team?.team_name ?? '',
        team_number: a.team?.team_number ?? 0,
      }))

      // Get all team members so we can show undeclared players
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          id,
          team_number,
          team_name,
          team_members (
            user_id,
            user:user_id ( full_name, display_name, id )
          )
        `)
        .eq('season_year', currentYear)

      nextRoundTeamMembers = (teamsData ?? []).flatMap((t: any) =>
        (t.team_members ?? []).map((m: any) => ({
          user_id: m.user_id,
          team_id: t.id,
          full_name: m.user?.display_name ?? m.user?.full_name ?? 'Unknown',
          team_name: t.team_name,
          team_number: t.team_number,
        }))
      )

      // Get foursomes for next round (if they exist)
      const { data: foursomesData } = await supabase
        .from('foursomes')
        .select(`
          *,
          members:foursome_members (
            user_id,
            cart_number,
            is_sub,
            sub_id,
            user:user_id ( full_name, display_name, id ),
            sub:sub_id ( full_name ),
            team:team_id ( team_number, team_name, id )
          )
        `)
        .eq('round_id', nextRound.id)
        .order('tee_time_slot')

      nextRoundFoursomes = (foursomesData ?? []).map((f: any) => ({
        id: f.id,
        tee_time_slot: f.tee_time_slot,
        tee_time: f.tee_time ?? null,
        members: (f.members ?? []).map((m: any) => ({
          user_id: m.user_id,
          cart_number: m.cart_number,
          is_sub: m.is_sub,
          full_name: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
          team_name: m.team?.team_name ?? '',
          team_number: m.team?.team_number ?? 0,
        }))
      }))
    }
  }

  // ── Current user's declaration status for next round ────────────────────
  const currentUserId = user?.id ?? null
  const userHasDeclared = currentUserId
    ? nextRoundAvailability.some((a) => a.user_id === currentUserId)
    : false
  const userInFoursome = currentUserId
    ? nextRoundFoursomes.some((f) => f.members.some((m: any) => m.user_id === currentUserId))
    : false

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const calendarUrl = `${siteUrl}/api/calendar`
  const webcalUrl = calendarUrl.replace(/^https?:\/\//, 'webcal://')
  const googleCalUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(calendarUrl)}`

  return (
    <div>
      <div className="flex justify-end px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <a
            href={webcalUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Subscribe to Calendar
          </a>
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Google Cal
          </a>
        </div>
      </div>
      <LeaderboardTabs
        standings={(standings ?? []) as any}
        recentRounds={(recentRounds ?? []) as any}
        currentRound={currentRound ?? null}
        currentRoundScores={currentRoundScores}
        currentRoundFoursomes={currentRoundFoursomes}
        nextRound={nextRound}
        nextRoundAvailability={nextRoundAvailability}
        nextRoundTeamMembers={nextRoundTeamMembers}
        nextRoundFoursomes={nextRoundFoursomes}
        currentYear={currentYear}
        userHasDeclared={userHasDeclared || userInFoursome}
      />
    </div>
  )
}

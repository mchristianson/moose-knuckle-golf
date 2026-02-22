import { createClient } from '@/lib/supabase/server'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

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
    .select('id, round_number, round_date, status')
    .in('status', ['in_progress', 'scoring'])
    .order('round_date', { ascending: false })
    .limit(1)
    .maybeSingle()

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
  if (!currentRound) {
    // Get the last completed round to determine the next round number
    const { data: lastCompletedRound } = await supabase
      .from('rounds')
      .select('round_number')
      .eq('season_year', currentYear)
      .eq('status', 'completed')
      .eq('round_type', 'regular')
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextRoundNumber = (lastCompletedRound?.round_number ?? 0) + 1

    // Fetch the next round by round number
    const { data: nextRoundData } = await supabase
      .from('rounds')
      .select('id, round_number, round_date, status, tee_time')
      .eq('season_year', currentYear)
      .eq('round_number', nextRoundNumber)
      .eq('round_type', 'regular')
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

      // Get foursomes for next round (if they exist)
      const { data: foursomesData } = await supabase
        .from('foursomes')
        .select(`
          *,
          members:foursome_members (
            user_id,
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
        members: (f.members ?? []).map((m: any) => ({
          user_id: m.user_id,
          is_sub: m.is_sub,
          full_name: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
          team_name: m.team?.team_name ?? '',
          team_number: m.team?.team_number ?? 0,
        }))
      }))
    }
  }

  return (
    <LeaderboardTabs
      standings={(standings ?? []) as any}
      recentRounds={(recentRounds ?? []) as any}
      currentRound={currentRound ?? null}
      currentRoundScores={currentRoundScores}
      nextRound={nextRound}
      nextRoundAvailability={nextRoundAvailability}
      nextRoundFoursomes={nextRoundFoursomes}
      currentYear={currentYear}
    />
  )
}

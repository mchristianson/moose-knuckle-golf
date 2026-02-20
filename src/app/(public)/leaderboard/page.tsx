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

  return (
    <LeaderboardTabs
      standings={(standings ?? []) as any}
      recentRounds={(recentRounds ?? []) as any}
      currentRound={currentRound ?? null}
      currentRoundScores={currentRoundScores}
      currentYear={currentYear}
    />
  )
}

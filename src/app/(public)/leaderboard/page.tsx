import { createClient } from '@/lib/supabase/server'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  // ── Season standings ──────────────────────────────────────────────────────
  const { data: standings } = await supabase
    .rpc('get_season_leaderboard', { p_season_year: currentYear })

  // ── Recent completed rounds (last 5) ─────────────────────────────────────
  const { data: recentRounds } = await supabase
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
        team:team_id ( team_number, team_name )
      )
    `)
    .eq('season_year', currentYear)
    .eq('status', 'completed')
    .eq('round_type', 'regular')
    .order('round_date', { ascending: false })
    .limit(5)

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
        user:user_id ( full_name ),
        team:team_id ( team_name, team_number )
      `)
      .eq('round_id', currentRound.id)

    currentRoundScores = (scores ?? []).map((s: any) => ({
      user_id: s.user_id,
      full_name: s.user?.full_name ?? 'Unknown',
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

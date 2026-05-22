import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface RoundScoreRecord {
  user_id: string
  full_name: string
  avatar_url: string | null
  team_name: string
  team_number: number
  gross_score: number | null
  net_score: number | null
  handicap_at_time: number | null
  hole_scores: number[]
}

export interface RoundInfo {
  id: string
  round_number: number
  round_date: string
  status: string
  tee_time: string | null
}

export const getRoundScores = unstable_cache(
  async (roundId: string): Promise<{ round: RoundInfo | null; scores: RoundScoreRecord[] }> => {
    const supabase = getSupabaseClient()

    const [roundResult, scoresResult] = await Promise.all([
      supabase
        .from('rounds')
        .select('id, round_number, round_date, status, tee_time')
        .eq('id', roundId)
        .maybeSingle(),
      supabase
        .from('scores')
        .select(`
          user_id,
          gross_score,
          net_score,
          handicap_at_time,
          hole_scores,
          user:user_id ( full_name, display_name, avatar_url ),
          team:team_id ( team_name, team_number )
        `)
        .eq('round_id', roundId)
        .eq('is_sub', false),
    ])

    const round = roundResult.data as RoundInfo | null
    const scoresRaw = scoresResult.data ?? []

    const scores: RoundScoreRecord[] = scoresRaw.map((s: any) => ({
      user_id: s.user_id,
      full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown',
      avatar_url: s.user?.avatar_url ?? null,
      team_name: s.team?.team_name ?? '',
      team_number: s.team?.team_number ?? 0,
      gross_score: s.gross_score,
      net_score: s.net_score,
      handicap_at_time: s.handicap_at_time,
      hole_scores: s.hole_scores ?? [],
    }))

    return { round, scores }
  },
  ['round-scores'],
  { tags: ['scores'], revalidate: 300 }
)

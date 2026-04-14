import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getSeasonStandings = unstable_cache(
  async (year: number) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.rpc('get_season_leaderboard', { p_season_year: year })
    return (data ?? []) as Array<{
      team_id: string
      team_name: string
      team_number: number
      total_points: number
      rounds_played: number
    }>
  },
  ['season-standings'],
  { tags: ['standings'], revalidate: 60 }
)

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getAllTeams = unstable_cache(
  async (year: number) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('teams')
      .select(`
        id, team_number, team_name,
        team_members (
          user_id,
          user:user_id ( full_name, display_name, id )
        )
      `)
      .eq('season_year', year)
      .order('team_number')
    return (data ?? []) as Array<{
      id: string
      team_number: number
      team_name: string
      team_members: Array<{
        user_id: string
        user: { full_name: string | null; display_name: string | null; id: string } | null
      }>
    }>
  },
  ['all-teams'],
  { tags: ['teams'], revalidate: 300 }
)

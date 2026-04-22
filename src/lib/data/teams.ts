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

    // Flatten nested arrays from Supabase relational queries
    const normalizedData = (data ?? []).map((team: any) => ({
      ...team,
      team_members: (team.team_members ?? []).map((member: any) => ({
        ...member,
        user: Array.isArray(member.user) ? member.user[0] : member.user,
      })),
    }))

    return normalizedData as Array<{
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

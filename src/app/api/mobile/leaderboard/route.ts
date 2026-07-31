import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'
import { getSeasonStandings } from '@/lib/data/leaderboard'

export async function GET(request: NextRequest) {
  const { supabase, error } = await getBearerUser(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  if (Number.isNaN(year)) {
    return Response.json({ error: 'Invalid year' }, { status: 400 })
  }

  const [standings, roundsResult] = await Promise.all([
    getSeasonStandings(year),
    supabase
      .from('rounds')
      .select('id, round_number, round_date, status, tee_time')
      .eq('season_year', year)
      .neq('status', 'cancelled')
      .order('round_date', { ascending: false }),
  ])

  return Response.json({ year, standings, rounds: roundsResult.data ?? [] })
}

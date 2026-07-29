import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'
import { getSeasonStandings } from '@/lib/data/leaderboard'

export async function GET(request: NextRequest) {
  const { error } = await getBearerUser(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  if (Number.isNaN(year)) {
    return Response.json({ error: 'Invalid year' }, { status: 400 })
  }

  const standings = await getSeasonStandings(year)
  return Response.json({ year, standings })
}

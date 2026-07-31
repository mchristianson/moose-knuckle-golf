import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'

// Mirrors src/app/(authenticated)/scores/[roundId]/page.tsx's data fetching —
// the caller's own foursome roster plus existing hole scores/handicaps, so the
// iOS scoring screen has everything it needs for self + teammate entry in one call.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user, error } = await getBearerUser(request)
  if (error) return error

  const { id: roundId } = await params

  const [{ data: round }, { data: foursomeIds }] = await Promise.all([
    supabase
      .from('rounds')
      .select('id, round_number, round_date, status, tee_time')
      .eq('id', roundId)
      .maybeSingle(),
    supabase.from('foursomes').select('id').eq('round_id', roundId),
  ])

  if (!round) {
    return Response.json({ error: 'Round not found' }, { status: 404 })
  }

  const scoringOpen = ['in_progress', 'scoring'].includes(round.status)

  const { data: userMembership } = foursomeIds?.length
    ? await supabase
        .from('foursome_members')
        .select('foursome_id')
        .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  if (!userMembership) {
    return Response.json({ round, scoringOpen, players: [] })
  }

  const { data: foursomeMembers } = await supabase
    .from('foursome_members')
    .select(`
      user_id,
      sub_id,
      team_id,
      is_sub,
      user:user_id ( full_name, display_name, avatar_url ),
      sub:sub_id ( full_name ),
      team:team_id ( team_name, team_number )
    `)
    .eq('foursome_id', userMembership.foursome_id)

  const memberUserIds = (foursomeMembers ?? [])
    .map((m: any) => m.user_id)
    .filter((id: string | null): id is string => id !== null)
  const memberSubIds = (foursomeMembers ?? [])
    .map((m: any) => m.sub_id)
    .filter((id: string | null): id is string => id !== null)

  const [{ data: userScores }, { data: subScores }, { data: handicaps }] = await Promise.all([
    memberUserIds.length
      ? supabase
          .from('scores')
          .select('id, user_id, hole_scores')
          .eq('round_id', roundId)
          .in('user_id', memberUserIds)
      : Promise.resolve({ data: [] }),
    memberSubIds.length
      ? supabase
          .from('scores')
          .select('id, sub_id, hole_scores')
          .eq('round_id', roundId)
          .in('sub_id', memberSubIds)
      : Promise.resolve({ data: [] }),
    memberUserIds.length
      ? supabase.from('handicaps').select('user_id, current_handicap').in('user_id', memberUserIds)
      : Promise.resolve({ data: [] }),
  ])

  const scoreMap: Record<string, any> = {}
  for (const s of userScores ?? []) if (s.user_id) scoreMap[`user:${s.user_id}`] = s
  for (const s of subScores ?? []) if (s.sub_id) scoreMap[`sub:${s.sub_id}`] = s

  const handicapMap: Record<string, number> = Object.fromEntries(
    (handicaps ?? []).map((h: any) => [h.user_id, h.current_handicap])
  )

  const players = (foursomeMembers ?? []).map((m: any) => {
    const mapKey = m.user_id ? `user:${m.user_id}` : `sub:${m.sub_id}`
    const existing = scoreMap[mapKey]
    return {
      userId: m.user_id ?? null,
      subId: m.sub_id ?? null,
      teamName: m.team?.team_name ?? '',
      teamNumber: m.team?.team_number ?? 0,
      isSub: m.is_sub,
      displayName: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
      avatarUrl: m.user?.avatar_url ?? null,
      handicap: handicapMap[m.user_id] ?? 0,
      holeScores: existing?.hole_scores ?? Array(18).fill(0),
    }
  })

  return Response.json({ round, scoringOpen, players })
}

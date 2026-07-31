import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'

export async function POST(request: NextRequest) {
  const { supabase, user, error: authError } = await getBearerUser(request)
  if (authError) return authError

  let body: { roundId?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roundId, status } = body
  if (!roundId || !status) {
    return Response.json({ error: 'Missing roundId or status' }, { status: 400 })
  }
  if (status !== 'in' && status !== 'out') {
    return Response.json({ error: 'status must be "in" or "out"' }, { status: 400 })
  }

  const userId = user.id

  // Get or create availability record
  let { data: availability } = await supabase
    .from('round_availability')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', userId)
    .single()

  if (!availability) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return Response.json({ error: 'You are not a member of any team' }, { status: 400 })
    }

    const { data: created, error: insertError } = await supabase
      .from('round_availability')
      .insert({ round_id: roundId, user_id: userId, team_id: membership.team_id, status: 'undeclared' })
      .select()
      .single()

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 })
    }
    availability = created
  }

  const { error } = await supabase
    .from('round_availability')
    .update({
      status,
      declared_at: new Date().toISOString(),
      declared_by: userId,
    })
    .eq('id', availability.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (status === 'in') {
    await supabase.from('round_team_declarations').upsert(
      {
        round_id: roundId,
        team_id: availability.team_id,
        declared_golfer_id: userId,
        declared_by: userId,
        declared_at: new Date().toISOString(),
      },
      { onConflict: 'round_id,team_id' }
    )
  } else {
    await supabase
      .from('round_team_declarations')
      .delete()
      .eq('round_id', roundId)
      .eq('team_id', availability.team_id)
      .eq('declared_golfer_id', userId)
  }

  return Response.json({ success: true })
}

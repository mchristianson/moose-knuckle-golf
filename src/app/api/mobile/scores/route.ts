import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'
import { submitOwnScore, submitFoursomeScore } from '@/lib/scores/submit'

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getBearerUser(request)
  if (error) return error

  let body: {
    roundId?: string
    holeScores?: number[]
    targetUserId?: string | null
    targetSubId?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { roundId, holeScores, targetUserId, targetSubId } = body
  if (!roundId || !Array.isArray(holeScores)) {
    return Response.json({ error: 'Missing roundId or holeScores' }, { status: 400 })
  }

  const result = targetUserId || targetSubId
    ? await submitFoursomeScore(supabase, user.id, user.id, roundId, targetUserId ?? null, targetSubId ?? null, holeScores)
    : await submitOwnScore(supabase, user.id, user.id, roundId, holeScores)

  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 400 })
  }
  return Response.json(result)
}

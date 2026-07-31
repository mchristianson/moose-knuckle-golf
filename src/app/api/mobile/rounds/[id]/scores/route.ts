import { NextRequest } from 'next/server'
import { getBearerUser } from '@/lib/supabase/mobile'
import { getRoundScores, type RoundScoreRecord } from '@/lib/data/round-scores'
import { tallyRange, compareTallies } from '@/lib/scorecard/compute'

// Pre-computes gross/net/rank for a hole range so the client only ever renders
// numbers — none of the front-9-only net-score or ranking logic needs porting.
function buildSection(scores: RoundScoreRecord[], start: number, end: number) {
  return scores
    .map((s) => ({ score: s, tally: tallyRange(s.hole_scores, s.handicap_at_time ?? 0, start, end) }))
    .sort((a, b) => compareTallies(a.tally, b.tally))
    .map(({ score: s, tally: t }, idx) => ({
      userId: s.user_id,
      fullName: s.full_name,
      avatarUrl: s.avatar_url,
      teamName: s.team_name,
      teamNumber: s.team_number,
      makeupPending: s.makeup_pending ?? false,
      gross: t.gross,
      net: t.net,
      parSum: t.parSum,
      played: t.played,
      netToPar: t.net !== null ? t.net - t.parSum : null,
      isLeader: idx === 0 && t.played > 0,
    }))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getBearerUser(request)
  if (error) return error

  const { id: roundId } = await params
  const { round, scores } = await getRoundScores(roundId)

  if (!round) {
    return Response.json({ error: 'Round not found' }, { status: 404 })
  }

  return Response.json({
    round: {
      id: round.id,
      roundNumber: round.round_number,
      roundDate: round.round_date,
      status: round.status,
      teeTime: round.tee_time,
    },
    front: buildSection(scores, 0, 9),
    back: buildSection(scores, 9, 18),
    full: buildSection(scores, 0, 18),
  })
}

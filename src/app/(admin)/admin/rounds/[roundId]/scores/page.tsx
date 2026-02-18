import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ScoreEntryTable } from '@/components/scores/score-entry-table'
import { FinalizeRoundButton } from '@/components/scores/finalize-round-button'

export default async function ScoringPage({ params }: { params: Promise<{ roundId: string }> }) {
  const supabase = await createClient()
  const { roundId } = await params

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  if (!round) return <div>Round not found</div>

  // Get golfers playing this round — from foursome_members
  const { data: foursomeMembers } = await supabase
    .from('foursome_members')
    .select(`
      user_id,
      team_id,
      is_sub,
      user:user_id ( id, full_name ),
      team:team_id ( id, team_name, team_number )
    `)
    .in(
      'foursome_id',
      (
        await supabase
          .from('foursomes')
          .select('id')
          .eq('round_id', roundId)
      ).data?.map((f) => f.id) ?? []
    )

  // Get existing scores for this round
  const { data: existingScores } = await supabase
    .from('scores')
    .select('*')
    .eq('round_id', roundId)

  // Get handicaps for all players
  const playerIds = (foursomeMembers ?? []).map((m) => m.user_id)
  const { data: handicaps } = await supabase
    .from('handicaps')
    .select('user_id, current_handicap')
    .in('user_id', playerIds)

  const handicapMap: Record<string, number> = Object.fromEntries(
    (handicaps ?? []).map((h) => [h.user_id, h.current_handicap])
  )

  const scoreMap: Record<string, any> = Object.fromEntries(
    (existingScores ?? []).map((s) => [s.user_id, s])
  )

  // Build rows
  const rows = (foursomeMembers ?? []).map((m: any) => {
    const existing = scoreMap[m.user_id]
    const handicap = handicapMap[m.user_id] ?? 0
    const holeScores: number[] = existing?.hole_scores ?? Array(9).fill(0)
    const gross = holeScores.reduce((a: number, b: number) => a + b, 0)
    const net = existing?.net_score ?? (gross > 0 ? Math.round((gross - handicap) * 10) / 10 : null)

    return {
      scoreId: existing?.id ?? null,
      userId: m.user_id,
      teamId: m.team_id,
      fullName: m.user?.full_name ?? 'Unknown',
      teamName: m.team?.team_name ?? '',
      teamNumber: m.team?.team_number ?? 0,
      handicap,
      holeScores,
      grossScore: gross,
      netScore: net,
      isLocked: existing?.is_locked ?? false,
      isSub: m.is_sub,
    }
  })

  const lockedCount = rows.filter((r) => r.isLocked).length
  const totalCount = rows.length

  const roundDate = new Date(round.round_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const isCompleted = round.status === 'completed'

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/rounds/${roundId}`} className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Round
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-1">Round {round.round_number} — Scoring</h1>
      <p className="text-gray-500 mb-6">{roundDate}</p>

      {isCompleted && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ This round has been finalized and completed.</p>
        </div>
      )}

      {!isCompleted && totalCount === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No foursomes assigned yet. Generate foursomes first before entering scores.</p>
        </div>
      )}

      {totalCount > 0 && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="text-sm text-gray-500">Golfers</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">{lockedCount}</div>
              <div className="text-sm text-gray-500">Locked</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-amber-600">{totalCount - lockedCount}</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
          </div>

          {!isCompleted && (
            <div className="mb-6">
              <FinalizeRoundButton
                roundId={roundId}
                lockedCount={lockedCount}
                totalCount={totalCount}
              />
            </div>
          )}

          <ScoreEntryTable roundId={roundId} rows={rows} />

          {isCompleted && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Round Results</h2>
              <RoundResultsTable roundId={roundId} supabase={supabase} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

async function RoundResultsTable({ roundId, supabase }: { roundId: string; supabase: any }) {
  const { data: points } = await supabase
    .from('round_points')
    .select(`
      finish_position,
      net_score,
      points_earned,
      is_tied,
      team:team_id ( team_number, team_name )
    `)
    .eq('round_id', roundId)
    .order('finish_position')

  if (!points || points.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Pos</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Net Score</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {points.map((p: any) => (
            <tr key={p.team.team_number} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold">
                {p.finish_position}{p.is_tied ? ' (T)' : ''}
              </td>
              <td className="px-4 py-3">
                <span className="font-medium">Team {p.team.team_number}</span>
                <span className="text-gray-500 ml-2 text-xs">{p.team.team_name}</span>
              </td>
              <td className="px-4 py-3 text-center">{p.net_score}</td>
              <td className="px-4 py-3 text-center font-bold text-green-700">{p.points_earned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

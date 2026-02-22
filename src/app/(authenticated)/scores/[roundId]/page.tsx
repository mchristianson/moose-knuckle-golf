import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRoundDate } from '@/lib/utils/date'
import { MyScoreCard } from '@/components/scores/my-score-card'

export default async function MyScorePage({
  params,
}: {
  params: Promise<{ roundId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { roundId } = await params

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  if (!round) return <div>Round not found</div>

  const scoringOpen = ['in_progress', 'scoring'].includes(round.status)

  // Check user is in the foursome
  const { data: foursomeIds } = await supabase
    .from('foursomes')
    .select('id')
    .eq('round_id', roundId)

  const { data: membership } = foursomeIds?.length
    ? await supabase
        .from('foursome_members')
        .select(`
          team_id,
          is_sub,
          team:team_id ( team_number, team_name )
        `)
        .in('foursome_id', foursomeIds.map((f) => f.id))
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  // Get existing score
  const { data: existingScore } = await supabase
    .from('scores')
    .select('*')
    .eq('round_id', roundId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Get handicap
  const { data: handicapRow } = await supabase
    .from('handicaps')
    .select('current_handicap')
    .eq('user_id', user.id)
    .maybeSingle()

  const handicap = handicapRow?.current_handicap ?? 0

  const roundDate = formatRoundDate(round.round_date)

  const holeScores: number[] = existingScore?.hole_scores ?? Array(9).fill(0)
  const isLocked = existingScore?.is_locked ?? false

  return (
    <div className="max-w-lg mx-auto px-0 sm:px-4">
      {/* Nav */}
      <div className="px-4 sm:px-0 mb-4 pt-2">
        <Link href="/dashboard" className="text-green-600 hover:text-green-700 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Round header */}
      <div className="px-4 sm:px-0 mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Round {round.round_number}</h1>
          <p className="text-gray-500 text-sm">{roundDate}</p>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors shrink-0 mt-1"
        >
          🏆 Leaderboard
        </Link>
      </div>

      {/* Status banners */}
      {!scoringOpen && !isLocked && (
        <div className="mx-4 sm:mx-0 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            Score entry is not open yet. The round must be <strong>In Progress</strong> or <strong>Scoring</strong>.
          </p>
        </div>
      )}
      {!membership && (
        <div className="mx-4 sm:mx-0 mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">You are not listed as a player in this round's foursomes.</p>
        </div>
      )}

      {membership && (
        <MyScoreCard
          roundId={roundId}
          userId={user.id}
          teamName={(membership.team as any)?.team_name ?? ''}
          teamNumber={(membership.team as any)?.team_number ?? 0}
          handicap={handicap}
          holeScores={holeScores}
          isLocked={isLocked}
          scoringOpen={scoringOpen}
          existingScoreId={existingScore?.id ?? null}
          grossScore={existingScore?.gross_score ?? null}
          netScore={existingScore?.net_score ?? null}
        />
      )}
    </div>
  )
}

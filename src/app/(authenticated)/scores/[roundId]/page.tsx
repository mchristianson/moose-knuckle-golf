import { redirect } from 'next/navigation'
import { getViewerContext } from '@/lib/viewer'
import Link from 'next/link'
import { formatRoundDate } from '@/lib/utils/date'
import { HoleByHoleScorecard } from '@/components/scores/hole-by-hole-scorecard'
import type { FoursomePlayer } from '@/components/scores/foursome-scorecard-switcher'

export default async function MyScorePage({
  params,
}: {
  params: Promise<{ roundId: string }>
}) {
  const ctx = await getViewerContext()
  if (!ctx) redirect('/login')
  const { effectiveUserId: userId, db: supabase } = ctx

  const { roundId } = await params

  // Fetch round and foursome IDs in parallel — both only need roundId from params
  const [{ data: round }, { data: foursomeIds }] = await Promise.all([
    supabase
      .from('rounds')
      .select('id, status, round_number, round_date')
      .eq('id', roundId)
      .single(),
    supabase
      .from('foursomes')
      .select('id')
      .eq('round_id', roundId),
  ])

  if (!round) return <div>Round not found</div>

  const scoringOpen = ['in_progress', 'scoring'].includes(round.status)

  // Find the current user's foursome membership to get their specific foursome_id
  const { data: userMembership } = foursomeIds?.length
    ? await supabase
        .from('foursome_members')
        .select('foursome_id')
        .in('foursome_id', foursomeIds.map((f: { id: number | string }) => f.id))
        .eq('user_id', userId)
        .maybeSingle()
    : { data: null }

  // Load all members of the user's specific foursome
  const { data: foursomeMembers } = userMembership
    ? await supabase
        .from('foursome_members')
        .select(`
          user_id,
          sub_id,
          team_id,
          is_sub,
          user:user_id ( id, full_name, display_name, avatar_url ),
          sub:sub_id ( id, full_name ),
          team:team_id ( id, team_name, team_number )
        `)
        .eq('foursome_id', userMembership.foursome_id)
    : { data: null }

  // Separate member and sub IDs for targeted score/handicap queries
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
          .select('id, user_id, sub_id, hole_scores, gross_score, net_score')
          .eq('round_id', roundId)
          .in('user_id', memberUserIds)
      : Promise.resolve({ data: [] }),
    memberSubIds.length
      ? supabase
          .from('scores')
          .select('id, user_id, sub_id, hole_scores, gross_score, net_score')
          .eq('round_id', roundId)
          .in('sub_id', memberSubIds)
      : Promise.resolve({ data: [] }),
    memberUserIds.length
      ? supabase
          .from('handicaps')
          .select('user_id, current_handicap')
          .in('user_id', memberUserIds)
      : Promise.resolve({ data: [] }),
  ])

  // Key scores by prefixed ID so user and sub entries don't collide
  const scoreMap: Record<string, any> = {}
  for (const s of userScores ?? []) if (s.user_id) scoreMap[`user:${s.user_id}`] = s
  for (const s of subScores ?? []) if (s.sub_id) scoreMap[`sub:${s.sub_id}`] = s

  const handicapMap: Record<string, number> = Object.fromEntries(
    (handicaps ?? []).map((h: any) => [h.user_id, h.current_handicap])
  )

  const players: FoursomePlayer[] = (foursomeMembers ?? []).map((m: any) => {
    const mapKey = m.user_id ? `user:${m.user_id}` : `sub:${m.sub_id}`
    const existing = scoreMap[mapKey]
    const handicap = handicapMap[m.user_id] ?? 0
    return {
      userId: m.user_id ?? null,
      subId: m.sub_id ?? null,
      teamId: m.team_id,
      teamName: m.team?.team_name ?? '',
      teamNumber: m.team?.team_number ?? 0,
      isSub: m.is_sub,
      displayName: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
      avatarUrl: m.user?.avatar_url ?? null,
      handicap,
      holeScores: existing?.hole_scores ?? Array(9).fill(0),
      existingScoreId: existing?.id ?? null,
      grossScore: existing?.gross_score ?? null,
      netScore: existing?.net_score ?? null,
    }
  })

  const roundDate = formatRoundDate(round.round_date)

  return (
    <div className="max-w-lg w-full mx-auto px-0 sm:px-4 flex flex-col flex-1 min-h-0">
      {/* Status banners */}
      {!scoringOpen && (
        <div className="mx-4 sm:mx-0 mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            Score entry is not open yet. The round must be <strong>In Progress</strong> or <strong>Scoring</strong>.
          </p>
        </div>
      )}
      {!userMembership && (
        <div className="mx-4 sm:mx-0 mb-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">You are not listed as a player in this round's foursomes.</p>
        </div>
      )}

      {userMembership && players.length > 0 && (
        <HoleByHoleScorecard
          roundId={roundId}
          currentUserId={userId}
          players={players}
          roundNumber={round.round_number}
          roundDate={roundDate}
          scoringOpen={scoringOpen}
        />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRoundDate } from '@/lib/utils/date'
import { FoursomeScorecardSwitcher } from '@/components/scores/foursome-scorecard-switcher'
import type { FoursomePlayer } from '@/components/scores/foursome-scorecard-switcher'

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

  // Get all foursome IDs for this round
  const { data: foursomeIds } = await supabase
    .from('foursomes')
    .select('id')
    .eq('round_id', roundId)

  // Find the current user's foursome membership to get their specific foursome_id
  const { data: userMembership } = foursomeIds?.length
    ? await supabase
        .from('foursome_members')
        .select('foursome_id')
        .in('foursome_id', foursomeIds.map((f) => f.id))
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  // Load all members of the user's specific foursome
  const { data: foursomeMembers } = userMembership
    ? await supabase
        .from('foursome_members')
        .select(`
          user_id,
          team_id,
          is_sub,
          user:user_id ( id, full_name, display_name, avatar_url ),
          sub:sub_id ( id, full_name ),
          team:team_id ( id, team_name, team_number )
        `)
        .eq('foursome_id', userMembership.foursome_id)
    : { data: null }

  // Load scores and handicaps for all foursome members
  // Filter out null user_ids (subs without a user account) — passing null to .in() causes PostgREST to error
  const memberIds = (foursomeMembers ?? [])
    .map((m: any) => m.user_id)
    .filter((id: string | null): id is string => id !== null)

  const [{ data: scores }, { data: handicaps }] = await Promise.all([
    memberIds.length
      ? supabase
          .from('scores')
          .select('*')
          .eq('round_id', roundId)
          .in('user_id', memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? supabase
          .from('handicaps')
          .select('user_id, current_handicap')
          .in('user_id', memberIds)
      : Promise.resolve({ data: [] }),
  ])

  const scoreMap: Record<string, any> = Object.fromEntries(
    (scores ?? []).map((s) => [s.user_id, s])
  )
  const handicapMap: Record<string, number> = Object.fromEntries(
    (handicaps ?? []).map((h: any) => [h.user_id, h.current_handicap])
  )

  const players: FoursomePlayer[] = (foursomeMembers ?? []).map((m: any) => {
    const existing = scoreMap[m.user_id]
    const handicap = handicapMap[m.user_id] ?? 0
    return {
      userId: m.user_id,
      teamId: m.team_id,
      teamName: m.team?.team_name ?? '',
      teamNumber: m.team?.team_number ?? 0,
      isSub: m.is_sub,
      displayName: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
      avatarUrl: m.user?.avatar_url ?? null,
      handicap,
      holeScores: existing?.hole_scores ?? Array(9).fill(0),
      isLocked: existing?.is_locked ?? false,
      existingScoreId: existing?.id ?? null,
      grossScore: existing?.gross_score ?? null,
      netScore: existing?.net_score ?? null,
    }
  })

  const roundDate = formatRoundDate(round.round_date)

  return (
    <div className="max-w-lg mx-auto px-0 sm:px-4">
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
        <FoursomeScorecardSwitcher
          roundId={roundId}
          currentUserId={user.id}
          players={players}
          roundNumber={round.round_number}
          roundDate={roundDate}
          scoringOpen={scoringOpen}
        />
      )}
    </div>
  )
}

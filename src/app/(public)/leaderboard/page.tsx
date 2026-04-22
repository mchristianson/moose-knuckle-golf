import { createClient } from '@/lib/supabase/server'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'
import { CalendarSubscribe } from '@/components/leaderboard/CalendarSubscribe'
import { getSeasonStandings } from '@/lib/data/leaderboard'
import { getAllTeams } from '@/lib/data/teams'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const { data: { user } } = await supabase.auth.getUser()

  // ── Group 1: independent queries run in parallel ──────────────────────────
  // standings comes from cache; recentRoundsData and currentRound are fetched concurrently
  const [standings, recentRoundsData, currentRound] = await Promise.all([
    getSeasonStandings(currentYear),
    supabase
      .from('rounds')
      .select(`
        id,
        round_number,
        round_date,
        round_points (
          finish_position,
          net_score,
          points_earned,
          is_tied,
          team_id,
          team:team_id ( team_number, team_name )
        )
      `)
      .eq('season_year', currentYear)
      .eq('status', 'completed')
      .eq('round_type', 'regular')
      .order('round_date', { ascending: false })
      .limit(5)
      .then((r) => r.data ?? []),
    supabase
      .from('rounds')
      .select('id, round_number, round_date, status, tee_time')
      .in('status', ['in_progress', 'scoring'])
      .order('round_date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r) => r.data ?? null),
  ])

  // ── Group 2: depends on group 1 results ──────────────────────────────────
  const recentRoundIds = recentRoundsData.map((r: any) => r.id)

  let recentRounds = recentRoundsData
  let currentRoundFoursomes: any[] = []
  let currentRoundScores: any[] = []
  let nextRound: any = null

  if (currentRound) {
    // Fetch foursomes, scores for current round + recent round scores all in parallel
    const [foursomesData, scoresData, recentScoresData] = await Promise.all([
      supabase
        .from('foursomes')
        .select(`
          id, tee_time_slot, tee_time,
          members:foursome_members (
            user_id,
            cart_number,
            is_sub,
            sub_id,
            user:user_id ( full_name, display_name, id ),
            sub:sub_id ( full_name ),
            team:team_id ( team_number, team_name, id )
          )
        `)
        .eq('round_id', currentRound.id)
        .order('tee_time_slot')
        .then((r) => r.data ?? []),
      supabase
        .from('scores')
        .select(`
          user_id,
          gross_score,
          net_score,
          handicap_at_time,
          hole_scores,
          is_locked,
          user:user_id ( full_name, display_name, avatar_url ),
          team:team_id ( team_name, team_number )
        `)
        .eq('round_id', currentRound.id)
        .then((r) => r.data ?? []),
      recentRoundIds.length
        ? supabase
            .from('scores')
            .select('round_id, team_id, user:user_id ( full_name, display_name )')
            .in('round_id', recentRoundIds)
            .eq('is_sub', false)
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
    ])

    currentRoundFoursomes = foursomesData.map((f: any) => ({
      id: f.id,
      tee_time_slot: f.tee_time_slot,
      tee_time: f.tee_time ?? null,
      members: (f.members ?? []).map((m: any) => ({
        user_id: m.user_id,
        cart_number: m.cart_number,
        is_sub: m.is_sub,
        full_name: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
        team_name: m.team?.team_name ?? '',
        team_number: m.team?.team_number ?? 0,
      }))
    }))

    currentRoundScores = scoresData.map((s: any) => ({
      user_id: s.user_id,
      full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown',
      avatar_url: s.user?.avatar_url ?? null,
      team_name: s.team?.team_name ?? '',
      team_number: s.team?.team_number ?? 0,
      gross_score: s.gross_score,
      net_score: s.net_score,
      handicap_at_time: s.handicap_at_time,
      hole_scores: s.hole_scores ?? [],
      is_locked: s.is_locked ?? false,
    }))

    // Attach golfer names to recent round points
    if (recentRoundIds.length > 0) {
      const scoresByTeamRound = new Map<string, any>()
      recentScoresData.forEach((s: any) => {
        scoresByTeamRound.set(`${s.round_id}-${s.team_id}`, {
          full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown'
        })
      })
      recentRounds = recentRoundsData.map((round: any) => ({
        ...round,
        round_points: round.round_points.map((rp: any) => ({
          ...rp,
          golfer: scoresByTeamRound.get(`${round.id}-${rp.team_id}`)
        }))
      }))
    }
  } else {
    // No current round — fetch next round and recent scores in parallel
    const [nextRoundData, recentScoresData] = await Promise.all([
      supabase
        .from('rounds')
        .select('id, round_number, round_date, status, tee_time')
        .eq('season_year', currentYear)
        .eq('round_type', 'regular')
        .in('status', ['scheduled', 'availability_open', 'foursomes_set'])
        .order('round_date', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then((r) => r.data ?? null),
      recentRoundIds.length
        ? supabase
            .from('scores')
            .select('round_id, team_id, user:user_id ( full_name, display_name )')
            .in('round_id', recentRoundIds)
            .eq('is_sub', false)
            .then((r) => r.data ?? [])
        : Promise.resolve([]),
    ])

    // Attach golfer names to recent round points
    if (recentRoundIds.length > 0) {
      const scoresByTeamRound = new Map<string, any>()
      recentScoresData.forEach((s: any) => {
        scoresByTeamRound.set(`${s.round_id}-${s.team_id}`, {
          full_name: s.user?.display_name ?? s.user?.full_name ?? 'Unknown'
        })
      })
      recentRounds = recentRoundsData.map((round: any) => ({
        ...round,
        round_points: round.round_points.map((rp: any) => ({
          ...rp,
          golfer: scoresByTeamRound.get(`${round.id}-${rp.team_id}`)
        }))
      }))
    }

    nextRound = nextRoundData

    if (nextRound) {
      // ── Group 3: next round details — all independent, run in parallel ───
      const [availabilityData, teamsData, foursomesData] = await Promise.all([
        supabase
          .from('round_availability')
          .select(`
            user_id, team_id, status,
            user:user_id ( full_name, display_name, id ),
            team:team_id ( team_number, team_name, id )
          `)
          .eq('round_id', nextRound.id)
          .order('team_id')
          .then((r) => r.data ?? []),
        getAllTeams(currentYear),
        supabase
          .from('foursomes')
          .select(`
            id, tee_time_slot, tee_time,
            members:foursome_members (
              user_id,
              cart_number,
              is_sub,
              sub_id,
              user:user_id ( full_name, display_name, id ),
              sub:sub_id ( full_name ),
              team:team_id ( team_number, team_name, id )
            )
          `)
          .eq('round_id', nextRound.id)
          .order('tee_time_slot')
          .then((r) => r.data ?? []),
      ])

      const nextRoundAvailability = availabilityData.map((a: any) => ({
        user_id: a.user_id,
        team_id: a.team_id,
        status: a.status,
        full_name: a.user?.display_name ?? a.user?.full_name ?? 'Unknown',
        team_name: a.team?.team_name ?? '',
        team_number: a.team?.team_number ?? 0,
      }))

      const nextRoundTeamMembers = teamsData.flatMap((t) =>
        (t.team_members ?? []).map((m) => ({
          user_id: m.user_id,
          team_id: t.id,
          full_name: m.user?.display_name ?? m.user?.full_name ?? 'Unknown',
          team_name: t.team_name,
          team_number: t.team_number,
        }))
      )

      const nextRoundFoursomes = foursomesData.map((f: any) => ({
        id: f.id,
        tee_time_slot: f.tee_time_slot,
        tee_time: f.tee_time ?? null,
        members: (f.members ?? []).map((m: any) => ({
          user_id: m.user_id,
          cart_number: m.cart_number,
          is_sub: m.is_sub,
          full_name: m.user?.display_name ?? m.user?.full_name ?? m.sub?.full_name ?? 'Unknown',
          team_name: m.team?.team_name ?? '',
          team_number: m.team?.team_number ?? 0,
        }))
      }))

      const currentUserId = user?.id ?? null
      const userHasDeclared = currentUserId
        ? nextRoundAvailability.some((a) => a.user_id === currentUserId)
        : false
      const userInFoursome = currentUserId
        ? nextRoundFoursomes.some((f) => f.members.some((m: any) => m.user_id === currentUserId))
        : false

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
      const calendarUrl = `${siteUrl}/api/calendar`
      const webcalUrl = calendarUrl.replace(/^https?:\/\//, 'webcal://')

      return (
        <div>
          <div className="flex justify-end px-2 pt-2 pb-1">
            <CalendarSubscribe webcalUrl={webcalUrl} calendarUrl={calendarUrl} />
          </div>
          <LeaderboardTabs
            standings={standings as any}
            recentRounds={recentRounds as any}
            currentRound={null}
            currentRoundScores={[]}
            currentRoundFoursomes={[]}
            nextRound={nextRound}
            nextRoundAvailability={nextRoundAvailability}
            nextRoundTeamMembers={nextRoundTeamMembers}
            nextRoundFoursomes={nextRoundFoursomes}
            currentYear={currentYear}
            userHasDeclared={userHasDeclared || userInFoursome}
          />
        </div>
      )
    }
  }

  // ── Default render (current round or no next round) ──────────────────────
  const currentUserId = user?.id ?? null
  const userHasDeclared = false
  const userInFoursome = false

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const calendarUrl = `${siteUrl}/api/calendar`
  const webcalUrl = calendarUrl.replace(/^https?:\/\//, 'webcal://')

  return (
    <div>
      <div className="flex justify-end px-2 pt-2 pb-1">
        <CalendarSubscribe webcalUrl={webcalUrl} calendarUrl={calendarUrl} />
      </div>
      <LeaderboardTabs
        standings={standings as any}
        recentRounds={recentRounds as any}
        currentRound={currentRound ?? null}
        currentRoundScores={currentRoundScores}
        currentRoundFoursomes={currentRoundFoursomes}
        nextRound={nextRound}
        nextRoundAvailability={[]}
        nextRoundTeamMembers={[]}
        nextRoundFoursomes={[]}
        currentYear={currentYear}
        userHasDeclared={false}
      />
    </div>
  )
}

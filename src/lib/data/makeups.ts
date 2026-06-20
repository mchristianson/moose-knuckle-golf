// Detects "pending makeups": completed regular rounds where a team played with a
// sub and the regular golfer's real score has not yet been entered. A team in this
// state earns no round points until the makeup score is recorded (either directly
// into the missed round or linked via covers_missed_round_id).

export interface PendingMakeup {
  round_id: string
  round_number: number
  team_id: string
  team_number: number
  team_name: string
  golfer_id: string | null
  golfer_name: string | null
}

export async function getPendingMakeups(
  supabase: any,
  seasonYear: number
): Promise<PendingMakeup[]> {
  // Completed, regular (points-bearing) rounds for the season
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, round_number')
    .eq('season_year', seasonYear)
    .eq('status', 'completed')
    .eq('round_type', 'regular')

  if (!rounds || rounds.length === 0) return []

  const roundIds = rounds.map((r: any) => r.id)
  const roundNumberById = new Map<string, number>(
    rounds.map((r: any) => [r.id, r.round_number])
  )

  // All scores on those rounds, plus makeup scores covering them, plus declarations
  const [{ data: scores }, { data: makeupScores }, { data: declarations }] = await Promise.all([
    supabase
      .from('scores')
      .select('round_id, team_id, is_sub')
      .in('round_id', roundIds),
    supabase
      .from('scores')
      .select('covers_missed_round_id, team_id, is_sub')
      .in('covers_missed_round_id', roundIds),
    supabase
      .from('round_team_declarations')
      .select('round_id, team_id, declared_golfer_id, golfer:declared_golfer_id ( display_name, full_name )')
      .in('round_id', roundIds),
  ])

  const key = (roundId: string, teamId: string) => `${roundId}:${teamId}`

  // Teams that already have a counting (non-sub) score for the round
  const counted = new Set<string>()
  for (const s of scores ?? []) {
    if (!s.is_sub) counted.add(key(s.round_id, s.team_id))
  }
  for (const s of makeupScores ?? []) {
    if (!s.is_sub && s.covers_missed_round_id) {
      counted.add(key(s.covers_missed_round_id, s.team_id))
    }
  }

  // Teams that played with a sub for the round
  const subbed = new Set<string>()
  for (const s of scores ?? []) {
    if (s.is_sub) subbed.add(key(s.round_id, s.team_id))
  }

  const declByKey = new Map<string, any>()
  for (const d of declarations ?? []) {
    declByKey.set(key(d.round_id, d.team_id), d)
  }

  // Need team metadata for display
  const teamIds = [...new Set((scores ?? []).map((s: any) => s.team_id))]
  const { data: teams } = teamIds.length
    ? await supabase.from('teams').select('id, team_number, team_name').in('id', teamIds)
    : { data: [] }
  const teamById = new Map<string, any>((teams ?? []).map((t: any) => [t.id, t]))

  const pending: PendingMakeup[] = []
  for (const k of subbed) {
    if (counted.has(k)) continue
    const [roundId, teamId] = k.split(':')
    const decl = declByKey.get(k)
    const team = teamById.get(teamId)
    pending.push({
      round_id: roundId,
      round_number: roundNumberById.get(roundId) ?? 0,
      team_id: teamId,
      team_number: team?.team_number ?? 0,
      team_name: team?.team_name ?? '',
      golfer_id: decl?.declared_golfer_id ?? null,
      golfer_name: decl?.golfer?.display_name ?? decl?.golfer?.full_name ?? null,
    })
  }

  return pending.sort((a, b) => a.round_number - b.round_number || a.team_number - b.team_number)
}

/**
 * Backfill Historical Scores from LeagueGolfer Handicap Page
 *
 * Gross scores scraped from leaguegolfer.com/leagues_cache?leagueid=287&eventnumber=11&title=Handicaps
 * These are pre-2025 rounds that weren't included in import-historical-scores.ts.
 * Hole scores are synthetic (evenly distributed to sum to gross) since the handicap
 * page doesn't show hole-by-hole detail.
 *
 * Run with:  npx tsx scripts/backfill-historical-scores.ts
 *
 * Prerequisites: .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  const env: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ---------------------------------------------------------------------------
// Scraped data — gross scores from leaguegolfer.com handicap page (event 11)
// These are all pre-2025 dates not covered by import-historical-scores.ts
// ---------------------------------------------------------------------------
interface BackfillScore {
  playerName: string  // "Last, First" format — same as import-historical-scores.ts
  date: string        // ISO date
  gross: number
}

const SCRAPED: BackfillScore[] = [
  // BUSCH, JAY
  { playerName: 'Busch, Jay', date: '2024-08-22', gross: 51 },
  { playerName: 'Busch, Jay', date: '2024-08-08', gross: 51 },
  { playerName: 'Busch, Jay', date: '2024-07-25', gross: 52 },
  { playerName: 'Busch, Jay', date: '2024-07-11', gross: 48 },
  { playerName: 'Busch, Jay', date: '2024-06-27', gross: 55 },
  { playerName: 'Busch, Jay', date: '2024-06-20', gross: 51 },

  // CHRISTIANSON, MATT
  { playerName: 'Christianson, Matt', date: '2024-08-08', gross: 43 },
  { playerName: 'Christianson, Matt', date: '2024-07-25', gross: 51 },
  { playerName: 'Christianson, Matt', date: '2024-07-18', gross: 46 },
  { playerName: 'Christianson, Matt', date: '2024-07-11', gross: 48 },

  // DUPONT, MAX
  { playerName: 'DuPont, Max', date: '2024-08-22', gross: 40 },
  { playerName: 'DuPont, Max', date: '2024-07-18', gross: 50 },
  { playerName: 'DuPont, Max', date: '2024-06-20', gross: 45 },
  { playerName: 'DuPont, Max', date: '2024-06-13', gross: 45 },
  { playerName: 'DuPont, Max', date: '2024-06-06', gross: 48 },
  { playerName: 'DuPont, Max', date: '2024-05-23', gross: 40 },
  { playerName: 'DuPont, Max', date: '2023-08-24', gross: 41 },
  { playerName: 'DuPont, Max', date: '2023-08-10', gross: 37 },
  { playerName: 'DuPont, Max', date: '2023-07-20', gross: 41 },

  // GILLETT, KYLE — may not be in app; will be skipped with warning if so
  { playerName: 'Gillett, Kyle', date: '2024-07-18', gross: 44 },
  { playerName: 'Gillett, Kyle', date: '2024-06-13', gross: 49 },
  { playerName: 'Gillett, Kyle', date: '2024-05-23', gross: 46 },
  { playerName: 'Gillett, Kyle', date: '2024-05-16', gross: 56 },
  { playerName: 'Gillett, Kyle', date: '2022-08-25', gross: 43 },
  { playerName: 'Gillett, Kyle', date: '2022-08-18', gross: 46 },
  { playerName: 'Gillett, Kyle', date: '2022-07-14', gross: 42 },
  { playerName: 'Gillett, Kyle', date: '2022-07-06', gross: 45 },
  { playerName: 'Gillett, Kyle', date: '2022-06-16', gross: 45 },
  { playerName: 'Gillett, Kyle', date: '2022-05-12', gross: 49 },

  // GLIMSDAHL, MIKE
  { playerName: 'Glimsdahl, Mike', date: '2024-08-22', gross: 40 },

  // LARAMY, BRIAN
  { playerName: 'Laramy, Brian', date: '2024-08-08', gross: 48 },
  { playerName: 'Laramy, Brian', date: '2024-07-25', gross: 42 },
  { playerName: 'Laramy, Brian', date: '2024-07-11', gross: 44 },
  { playerName: 'Laramy, Brian', date: '2024-06-27', gross: 45 },
  { playerName: 'Laramy, Brian', date: '2024-06-13', gross: 53 },
  { playerName: 'Laramy, Brian', date: '2023-08-24', gross: 52 },
  { playerName: 'Laramy, Brian', date: '2023-07-27', gross: 43 },
  { playerName: 'Laramy, Brian', date: '2023-07-13', gross: 50 },

  // MCKINNEY, PATRICK
  { playerName: 'McKinney, Patrick', date: '2024-08-22', gross: 43 },
  { playerName: 'McKinney, Patrick', date: '2024-08-08', gross: 36 },
  { playerName: 'McKinney, Patrick', date: '2024-07-25', gross: 38 },

  // MISENER, DENNY (→ "Denny Misner" in app)
  { playerName: 'Misener, Denny', date: '2024-08-22', gross: 44 },
  { playerName: 'Misener, Denny', date: '2024-08-08', gross: 45 },
  { playerName: 'Misener, Denny', date: '2024-07-25', gross: 36 },
  { playerName: 'Misener, Denny', date: '2024-07-18', gross: 41 },
  { playerName: 'Misener, Denny', date: '2024-07-11', gross: 40 },
  { playerName: 'Misener, Denny', date: '2024-06-27', gross: 45 },
  { playerName: 'Misener, Denny', date: '2024-06-20', gross: 40 },

  // NORDEEN, ANDREW (→ "Andy Nordeen" in app)
  { playerName: 'Nordeen, Andrew', date: '2024-08-22', gross: 40 },
  { playerName: 'Nordeen, Andrew', date: '2024-08-08', gross: 44 },
  { playerName: 'Nordeen, Andrew', date: '2024-07-25', gross: 46 },
  { playerName: 'Nordeen, Andrew', date: '2024-07-18', gross: 43 },

  // OBERG, TOM — may not be in app; will be skipped with warning if so
  { playerName: 'Oberg, Tom', date: '2024-06-20', gross: 40 },
  { playerName: 'Oberg, Tom', date: '2024-06-06', gross: 42 },
  { playerName: 'Oberg, Tom', date: '2024-05-16', gross: 41 },
  { playerName: 'Oberg, Tom', date: '2024-05-09', gross: 40 },
  { playerName: 'Oberg, Tom', date: '2023-06-22', gross: 43 },
  { playerName: 'Oberg, Tom', date: '2023-06-15', gross: 44 },
  { playerName: 'Oberg, Tom', date: '2023-05-18', gross: 49 },

  // SADEK, JOSH
  { playerName: 'Sadek, Josh', date: '2024-08-22', gross: 42 },
  { playerName: 'Sadek, Josh', date: '2024-08-08', gross: 45 },
  { playerName: 'Sadek, Josh', date: '2024-07-25', gross: 47 },
  { playerName: 'Sadek, Josh', date: '2024-07-18', gross: 44 },
  { playerName: 'Sadek, Josh', date: '2024-07-11', gross: 37 },

  // SLETTE, GREG — may not be in app; will be skipped with warning if so
  { playerName: 'Slette, Greg', date: '2024-08-08', gross: 51 },
  { playerName: 'Slette, Greg', date: '2024-07-25', gross: 44 },
  { playerName: 'Slette, Greg', date: '2024-07-11', gross: 48 },
  { playerName: 'Slette, Greg', date: '2024-06-27', gross: 50 },
  { playerName: 'Slette, Greg', date: '2024-05-16', gross: 50 },
  { playerName: 'Slette, Greg', date: '2024-05-09', gross: 51 },
  { playerName: 'Slette, Greg', date: '2023-08-31', gross: 44 },
  { playerName: 'Slette, Greg', date: '2023-07-27', gross: 43 },
  { playerName: 'Slette, Greg', date: '2023-07-13', gross: 42 },
  { playerName: 'Slette, Greg', date: '2023-06-22', gross: 41 },

  // STELMAN, SCOTT — may not be in app; will be skipped with warning if so
  { playerName: 'Stelman, Scott', date: '2024-05-09', gross: 48 },
  { playerName: 'Stelman, Scott', date: '2023-08-31', gross: 41 },
  { playerName: 'Stelman, Scott', date: '2023-08-24', gross: 48 },
  { playerName: 'Stelman, Scott', date: '2023-07-20', gross: 45 },
  { playerName: 'Stelman, Scott', date: '2023-07-13', gross: 48 },
  { playerName: 'Stelman, Scott', date: '2023-06-29', gross: 41 },
  { playerName: 'Stelman, Scott', date: '2023-06-22', gross: 56 },
  { playerName: 'Stelman, Scott', date: '2023-06-15', gross: 51 },
  { playerName: 'Stelman, Scott', date: '2023-06-08', gross: 48 },
  { playerName: 'Stelman, Scott', date: '2023-05-25', gross: 50 },

  // WHEATCRAFT, TODD
  { playerName: 'Wheatcraft, Todd', date: '2024-08-22', gross: 45 },
  { playerName: 'Wheatcraft, Todd', date: '2024-07-25', gross: 45 },
  { playerName: 'Wheatcraft, Todd', date: '2024-06-27', gross: 49 },
  { playerName: 'Wheatcraft, Todd', date: '2024-06-06', gross: 48 },
  { playerName: 'Wheatcraft, Todd', date: '2024-05-23', gross: 39 },
  { playerName: 'Wheatcraft, Todd', date: '2024-05-09', gross: 43 },
  { playerName: 'Wheatcraft, Todd', date: '2023-08-31', gross: 45 },
  { playerName: 'Wheatcraft, Todd', date: '2023-08-24', gross: 44 },

  // WHEATCRAT, AARON (typo is intentional — normalizeLeagueName fixes it)
  { playerName: 'Wheatcrat, Aaron', date: '2024-08-08', gross: 48 },
  { playerName: 'Wheatcrat, Aaron', date: '2024-07-18', gross: 51 },
  { playerName: 'Wheatcrat, Aaron', date: '2024-07-11', gross: 50 },

  // WOLFGANG, JOSEPH (→ "Joe Wolfgang" in app)
  { playerName: 'Wolfgang, Joseph', date: '2024-08-22', gross: 42 },
  { playerName: 'Wolfgang, Joseph', date: '2024-07-18', gross: 41 },
  { playerName: 'Wolfgang, Joseph', date: '2024-06-20', gross: 49 },
  { playerName: 'Wolfgang, Joseph', date: '2024-06-06', gross: 47 },
  { playerName: 'Wolfgang, Joseph', date: '2024-05-23', gross: 42 },
]

// ---------------------------------------------------------------------------
// Name normalization — identical to import-historical-scores.ts
// ---------------------------------------------------------------------------
const NAME_ALIASES: Record<string, string> = {
  'Joseph Wolfgang': 'Joe Wolfgang',
  'Andrew Nordeen': 'Andy Nordeen',
  'Denny Misener': 'Denny Misner',
}

function normalizeLeagueName(name: string): string {
  const fixed = name.replace('Wheatcrat', 'Wheatcraft')
  const parts = fixed.split(',').map(p => p.trim())
  const firstLast = parts.length === 2 ? `${parts[1]} ${parts[0]}` : fixed
  return NAME_ALIASES[firstLast] ?? firstLast
}

// ---------------------------------------------------------------------------
// Generate synthetic hole scores that sum to gross
// ---------------------------------------------------------------------------
function generateHoleScores(gross: number, holes = 9): number[] {
  const base = Math.floor(gross / holes)
  const extra = gross % holes
  return [
    ...Array(extra).fill(base + 1),
    ...Array(holes - extra).fill(base),
  ]
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Historical Score Backfill (handicap page data) ===\n')

  // 1. Fetch all active users
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, full_name, display_name')
    .eq('is_active', true)

  if (usersErr || !users) throw new Error(`Failed to fetch users: ${usersErr?.message}`)
  console.log(`Found ${users.length} active users`)

  // 2. Fetch team memberships
  const { data: memberships, error: membErr } = await supabase
    .from('team_members')
    .select('user_id, team_id')

  if (membErr || !memberships) throw new Error(`Failed to fetch team_members: ${membErr?.message}`)

  const userToTeam = new Map<string, string>()
  for (const m of memberships) userToTeam.set(m.user_id, m.team_id)

  // 3. Build name → user_id map (prefer users with team assignments)
  const nameToUserId = new Map<string, string>()
  for (const u of users) {
    const key = u.full_name.toLowerCase()
    const existing = nameToUserId.get(key)
    const hasTeam = !!userToTeam.get(u.id)
    const existingHasTeam = existing ? !!userToTeam.get(existing) : false
    if (!existing || (!existingHasTeam && (hasTeam || u.display_name))) {
      nameToUserId.set(key, u.id)
    }
    if (u.display_name) nameToUserId.set(u.display_name.toLowerCase(), u.id)
  }

  // 4. Resolve player names → {userId, teamId}
  interface PlayerMapping { userId: string; teamId: string }
  const playerCache = new Map<string, PlayerMapping>()
  const unmapped: string[] = []

  for (const s of SCRAPED) {
    const normalized = normalizeLeagueName(s.playerName)
    if (playerCache.has(normalized)) continue

    const userId = nameToUserId.get(normalized.toLowerCase())
    if (!userId) {
      unmapped.push(`"${s.playerName}" → "${normalized}"`)
      continue
    }

    const teamId = userToTeam.get(userId)
    if (!teamId) {
      unmapped.push(`"${normalized}" (found user but no team assignment)`)
      continue
    }

    playerCache.set(normalized, { userId, teamId })
  }

  if (unmapped.length > 0) {
    console.warn('\n⚠️  Could not map these players — their scores will be SKIPPED:')
    const unique = [...new Set(unmapped)]
    unique.forEach(n => console.warn('   -', n))
    console.warn('\nApp user names for reference:')
    users.forEach(u => console.warn(`   - "${u.full_name}"${u.display_name ? ` (display: "${u.display_name}")` : ''}`))
    console.warn()
  }
  console.log(`Mapped ${playerCache.size} unique players\n`)

  // 5. Collect unique dates and find-or-create rounds
  const uniqueDates = [...new Set(SCRAPED.map(s => s.date))]
  const dateToRoundId = new Map<string, string>()

  // Check for existing historical rounds
  const { data: existingRounds } = await supabase
    .from('rounds')
    .select('id, round_date')
    .eq('status', 'completed')
    .lt('round_number', 0)

  if (existingRounds) {
    for (const r of existingRounds) {
      dateToRoundId.set(r.round_date, r.id)
    }
  }

  // Find the minimum round_number already used so we go below it
  const { data: minRow } = await supabase
    .from('rounds')
    .select('round_number')
    .lt('round_number', 0)
    .order('round_number', { ascending: true })
    .limit(1)
    .maybeSingle()

  let nextRoundNum = (minRow?.round_number ?? -100) - 1

  for (const isoDate of uniqueDates) {
    if (dateToRoundId.has(isoDate)) {
      console.log(`Round for ${isoDate} already exists`)
      continue
    }

    const seasonYear = parseInt(isoDate.slice(0, 4))
    const { data: inserted, error: roundErr } = await supabase
      .from('rounds')
      .insert({
        round_number: nextRoundNum--,
        round_date: isoDate,
        round_type: 'regular',
        status: 'completed',
        season_year: seasonYear,
        notes: `Historical backfill — leaguegolfer.com handicap page`,
      })
      .select('id')
      .single()

    if (roundErr || !inserted) {
      throw new Error(`Failed to create round for ${isoDate}: ${roundErr?.message}`)
    }
    dateToRoundId.set(isoDate, inserted.id)
    console.log(`Created round for ${isoDate}`)
  }

  // 6. Insert scores
  let inserted = 0
  let skipped = 0

  for (const s of SCRAPED) {
    const normalized = normalizeLeagueName(s.playerName)
    const player = playerCache.get(normalized)
    if (!player) continue

    const roundId = dateToRoundId.get(s.date)
    if (!roundId) { console.error(`No round found for ${s.date}`); continue }

    const holeScores = generateHoleScores(s.gross)
    const submittedAt = `${s.date}T20:00:00+00:00`

    const { error } = await supabase.from('scores').insert({
      round_id: roundId,
      user_id: player.userId,
      team_id: player.teamId,
      hole_scores: holeScores,
      handicap_at_time: null,
      net_score: null,
      is_locked: true,
      is_sub: false,
      submitted_at: submittedAt,
      submitted_by: player.userId,
    })

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        console.error(`Failed to insert score for ${normalized} on ${s.date}: ${error.message}`)
      }
    } else {
      inserted++
    }
  }

  console.log(`\nScores: ${inserted} inserted, ${skipped} skipped (already existed)`)

  // 7. Recalculate handicaps for all mapped players
  console.log('\nRecalculating handicaps...')
  const uniqueUserIds = [...new Set([...playerCache.values()].map(p => p.userId))]

  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
  const adminId = admins?.[0]?.id ?? uniqueUserIds[0]

  for (const userId of uniqueUserIds) {
    await recalculateHandicap(userId, adminId)
  }

  console.log(`\n✓ Backfill complete. ${uniqueUserIds.length} handicaps recalculated.`)
}

async function recalculateHandicap(userId: string, adminId: string) {
  const { data: eligible } = await supabase
    .rpc('get_eligible_scores_for_handicap', { p_user_id: userId, p_limit: 10 })

  if (!eligible || eligible.length === 0) return

  const grossScores: number[] = eligible.map((s: any) => s.gross_score)
  const scoresToUse = Math.min(grossScores.length, 5)
  const sorted = [...grossScores].sort((a: number, b: number) => a - b)
  const best = sorted.slice(0, scoresToUse)
  const avgBest = best.reduce((a: number, b: number) => a + b, 0) / best.length
  const newHandicap = Math.round(Math.max(0, avgBest - 36) * 10) / 10

  const { data: existing } = await supabase
    .from('handicaps')
    .select('id, current_handicap')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('handicaps')
      .update({
        current_handicap: newHandicap,
        rounds_played: grossScores.length,
        last_calculated_at: new Date().toISOString(),
        is_manual_override: false,
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('handicaps').insert({
      user_id: userId,
      current_handicap: newHandicap,
      rounds_played: grossScores.length,
      last_calculated_at: new Date().toISOString(),
      is_manual_override: false,
    })
  }

  await supabase.from('handicap_history').insert({
    user_id: userId,
    handicap_value: newHandicap,
    calculation_method: 'calculated',
    scores_used: eligible,
    changed_by: adminId,
    reason: 'Auto-calculated after historical score backfill',
  })

  const { data: u } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()
  console.log(`  ${u?.full_name ?? userId}: handicap = ${newHandicap} (from ${grossScores.length} rounds, best ${scoresToUse})`)
}

main().catch(err => {
  console.error('\n❌ Backfill failed:', err)
  process.exit(1)
})

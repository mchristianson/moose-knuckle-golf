/**
 * Import Historical Scores from LeagueGolfer.com
 *
 * Scraped from leaguegolfer.com league #287, events 1–11 (May–Aug 2025).
 * Run with:  npx tsx scripts/import-historical-scores.ts
 *
 * Prerequisites: .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
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
// Scraped data — all 11 events from leaguegolfer.com league #287
// ---------------------------------------------------------------------------
interface ScrapedScore {
  eventNum: number
  playerName: string  // "Last, First" format from leaguegolfer
  matchDate: string   // e.g. "May 08, 2025"
  holeScores: number[]
  gross: number
}

const SCRAPED: ScrapedScore[] = [
  // Event 1 — May 08, 2025
  { eventNum: 1, playerName: 'Ryan, Tim',        matchDate: 'May 08, 2025', holeScores: [5,5,6,5,4,4,4,4,4], gross: 41 },
  { eventNum: 1, playerName: 'Oberg, Tom',       matchDate: 'May 08, 2025', holeScores: [4,4,4,4,5,5,4,4,5], gross: 39 },
  { eventNum: 1, playerName: 'Wolfgang, Joseph', matchDate: 'May 08, 2025', holeScores: [5,5,7,5,3,7,3,5,5], gross: 45 },
  { eventNum: 1, playerName: 'Wheatcrat, Aaron', matchDate: 'May 08, 2025', holeScores: [6,5,6,7,7,7,5,4,5], gross: 52 },
  { eventNum: 1, playerName: 'Nordeen, Andrew',  matchDate: 'May 08, 2025', holeScores: [5,4,4,4,2,4,4,5,3], gross: 35 },
  { eventNum: 1, playerName: 'Glimsdahl, Mike',  matchDate: 'May 08, 2025', holeScores: [5,5,4,5,3,5,7,3,3], gross: 40 },
  { eventNum: 1, playerName: 'Busch, Jay',       matchDate: 'May 08, 2025', holeScores: [8,6,5,9,6,9,4,7,7], gross: 61 },
  { eventNum: 1, playerName: 'McKinney, Patrick',matchDate: 'May 08, 2025', holeScores: [5,5,4,6,3,4,3,4,5], gross: 39 },

  // Event 2 — May 15, 2025
  { eventNum: 2, playerName: 'Ryan, Tim',           matchDate: 'May 15, 2025', holeScores: [6,6,5,6,4,9,5,6,6], gross: 53 },
  { eventNum: 2, playerName: 'DuPont, Max',          matchDate: 'May 15, 2025', holeScores: [5,5,4,6,3,6,4,3,5], gross: 41 },
  { eventNum: 2, playerName: 'Wheatcraft, Todd',     matchDate: 'May 15, 2025', holeScores: [5,6,8,7,4,4,6,6,7], gross: 53 },
  { eventNum: 2, playerName: 'Christianson, Matt',   matchDate: 'May 15, 2025', holeScores: [4,7,6,7,4,5,4,6,6], gross: 49 },
  { eventNum: 2, playerName: 'Busch, Jay',           matchDate: 'May 15, 2025', holeScores: [5,7,6,7,4,5,7,6,8], gross: 55 },
  { eventNum: 2, playerName: 'Nordeen, Andrew',      matchDate: 'May 15, 2025', holeScores: [5,6,7,7,3,5,3,5,5], gross: 46 },
  { eventNum: 2, playerName: 'Wolfgang, Joseph',     matchDate: 'May 15, 2025', holeScores: [5,9,4,5,3,6,4,5,6], gross: 47 },
  { eventNum: 2, playerName: 'Glimsdahl, Mike',      matchDate: 'May 15, 2025', holeScores: [4,6,5,5,3,4,4,5,4], gross: 40 },

  // Event 3 — May 22, 2025
  { eventNum: 3, playerName: 'Oberg, Tom',       matchDate: 'May 22, 2025', holeScores: [5,6,4,5,3,5,3,4,6], gross: 41 },
  { eventNum: 3, playerName: 'Laramy, Brian',     matchDate: 'May 22, 2025', holeScores: [5,6,4,6,3,5,3,5,6], gross: 43 },
  { eventNum: 3, playerName: 'McKinney, Patrick', matchDate: 'May 22, 2025', holeScores: [6,4,4,5,3,5,2,6,6], gross: 41 },
  { eventNum: 3, playerName: 'Misener, Denny',    matchDate: 'May 22, 2025', holeScores: [5,6,5,6,4,5,3,5,5], gross: 44 },
  { eventNum: 3, playerName: 'Glimsdahl, Mike',   matchDate: 'May 22, 2025', holeScores: [4,4,4,7,3,4,6,4,6], gross: 42 },
  { eventNum: 3, playerName: 'Ryan, Tim',         matchDate: 'May 22, 2025', holeScores: [5,5,6,5,4,6,4,5,5], gross: 45 },
  { eventNum: 3, playerName: 'Sadek, Josh',       matchDate: 'May 22, 2025', holeScores: [4,4,5,6,3,5,3,5,5], gross: 40 },
  { eventNum: 3, playerName: 'Wheatcrat, Aaron',  matchDate: 'May 22, 2025', holeScores: [4,7,4,5,4,5,3,5,6], gross: 43 },

  // Event 4 — Jun 05, 2025
  { eventNum: 4, playerName: 'Sadek, Josh',        matchDate: 'Jun 05, 2025', holeScores: [5,5,6,5,3,6,4,5,6], gross: 45 },
  { eventNum: 4, playerName: 'Wolfgang, Joseph',   matchDate: 'Jun 05, 2025', holeScores: [6,5,5,5,3,5,6,4,5], gross: 44 },
  { eventNum: 4, playerName: 'Wheatcrat, Aaron',   matchDate: 'Jun 05, 2025', holeScores: [5,5,5,8,3,6,3,3,4], gross: 42 },
  { eventNum: 4, playerName: 'Ryan, Tim',          matchDate: 'Jun 05, 2025', holeScores: [5,6,5,6,3,6,6,6,6], gross: 49 },
  { eventNum: 4, playerName: 'Glimsdahl, Mike',    matchDate: 'Jun 05, 2025', holeScores: [6,5,6,5,6,5,4,5,6], gross: 48 },
  { eventNum: 4, playerName: 'McKinney, Patrick',  matchDate: 'Jun 05, 2025', holeScores: [5,4,3,5,4,4,6,4,5], gross: 40 },
  { eventNum: 4, playerName: 'Christianson, Matt', matchDate: 'Jun 05, 2025', holeScores: [5,4,5,7,5,6,5,7,6], gross: 50 },
  { eventNum: 4, playerName: 'Nordeen, Andrew',    matchDate: 'Jun 05, 2025', holeScores: [4,5,4,6,3,4,4,4,5], gross: 39 },

  // Event 5 — Jun 12, 2025
  { eventNum: 5, playerName: 'Christianson, Matt', matchDate: 'Jun 12, 2025', holeScores: [4,7,5,5,4,6,3,5,5], gross: 44 },
  { eventNum: 5, playerName: 'Glimsdahl, Mike',    matchDate: 'Jun 12, 2025', holeScores: [5,4,6,5,4,5,3,6,5], gross: 43 },
  { eventNum: 5, playerName: 'Wolfgang, Joseph',   matchDate: 'Jun 12, 2025', holeScores: [6,5,5,6,4,4,4,4,5], gross: 43 },
  { eventNum: 5, playerName: 'Nordeen, Andrew',    matchDate: 'Jun 12, 2025', holeScores: [4,4,6,6,4,4,3,6,8], gross: 45 },
  { eventNum: 5, playerName: 'Sadek, Josh',        matchDate: 'Jun 12, 2025', holeScores: [5,6,4,4,5,5,4,4,9], gross: 46 },
  { eventNum: 5, playerName: 'Ryan, Tim',          matchDate: 'Jun 12, 2025', holeScores: [5,5,5,5,3,6,4,4,5], gross: 42 },
  { eventNum: 5, playerName: 'Wheatcrat, Aaron',   matchDate: 'Jun 12, 2025', holeScores: [4,4,5,6,4,4,3,6,6], gross: 42 },
  { eventNum: 5, playerName: 'McKinney, Patrick',  matchDate: 'Jun 12, 2025', holeScores: [6,4,5,6,3,4,5,8,5], gross: 46 },

  // Event 6 — Jun 19, 2025 (7 players — one team member absent)
  { eventNum: 6, playerName: 'McKinney, Patrick', matchDate: 'Jun 19, 2025', holeScores: [4,6,5,4,4,4,4,4,5], gross: 40 },
  { eventNum: 6, playerName: 'Misener, Denny',    matchDate: 'Jun 19, 2025', holeScores: [5,3,4,6,6,6,5,4,6], gross: 45 },
  { eventNum: 6, playerName: 'Ryan, Tim',         matchDate: 'Jun 19, 2025', holeScores: [4,5,6,6,3,6,3,4,6], gross: 43 },
  { eventNum: 6, playerName: 'Glimsdahl, Mike',   matchDate: 'Jun 19, 2025', holeScores: [4,6,5,5,4,5,4,4,6], gross: 43 },
  { eventNum: 6, playerName: 'Wheatcrat, Aaron',  matchDate: 'Jun 19, 2025', holeScores: [4,6,6,4,4,3,4,4,5], gross: 40 },
  { eventNum: 6, playerName: 'Busch, Jay',        matchDate: 'Jun 19, 2025', holeScores: [4,7,7,6,6,6,6,5,7], gross: 54 },
  { eventNum: 6, playerName: 'Oberg, Tom',        matchDate: 'Jun 19, 2025', holeScores: [3,3,4,5,4,3,4,4,5], gross: 35 },

  // Event 7 — Jul 10, 2025 (7 players)
  { eventNum: 7, playerName: 'Nordeen, Andrew',    matchDate: 'Jul 10, 2025', holeScores: [5,5,4,5,2,4,5,4,6], gross: 40 },
  { eventNum: 7, playerName: 'Wheatcrat, Aaron',   matchDate: 'Jul 10, 2025', holeScores: [5,4,6,6,3,5,3,6,5], gross: 43 },
  { eventNum: 7, playerName: 'Busch, Jay',         matchDate: 'Jul 10, 2025', holeScores: [6,5,6,8,3,6,6,8,6], gross: 54 },
  { eventNum: 7, playerName: 'Ryan, Tim',          matchDate: 'Jul 10, 2025', holeScores: [4,6,4,7,3,4,5,3,6], gross: 42 },
  { eventNum: 7, playerName: 'Laramy, Brian',      matchDate: 'Jul 10, 2025', holeScores: [6,4,6,8,4,6,4,3,5], gross: 46 },
  { eventNum: 7, playerName: 'McKinney, Patrick',  matchDate: 'Jul 10, 2025', holeScores: [4,5,3,5,5,7,3,5,7], gross: 44 },
  { eventNum: 7, playerName: 'Christianson, Matt', matchDate: 'Jul 10, 2025', holeScores: [5,5,5,5,3,6,4,7,6], gross: 46 },

  // Event 8 — Jul 17, 2025
  { eventNum: 8, playerName: 'DuPont, Max',         matchDate: 'Jul 17, 2025', holeScores: [4,5,6,5,4,5,3,3,5], gross: 40 },
  { eventNum: 8, playerName: 'Sadek, Josh',         matchDate: 'Jul 17, 2025', holeScores: [4,6,4,7,3,7,4,4,7], gross: 46 },
  { eventNum: 8, playerName: 'Glimsdahl, Mike',     matchDate: 'Jul 17, 2025', holeScores: [5,5,6,5,3,6,3,4,5], gross: 42 },
  { eventNum: 8, playerName: 'Nordeen, Andrew',     matchDate: 'Jul 17, 2025', holeScores: [4,6,4,5,2,6,3,5,5], gross: 40 },
  { eventNum: 8, playerName: 'Wheatcrat, Aaron',    matchDate: 'Jul 17, 2025', holeScores: [5,4,4,5,4,4,2,6,5], gross: 39 },
  { eventNum: 8, playerName: 'Laramy, Brian',       matchDate: 'Jul 17, 2025', holeScores: [5,5,5,4,4,6,5,5,7], gross: 46 },
  { eventNum: 8, playerName: 'Christianson, Matt',  matchDate: 'Jul 17, 2025', holeScores: [5,7,5,7,4,7,5,6,6], gross: 52 },
  { eventNum: 8, playerName: 'Ryan, Tim',           matchDate: 'Jul 17, 2025', holeScores: [5,5,4,5,3,4,4,5,4], gross: 39 },

  // Event 9 — Jul 24, 2025
  { eventNum: 9, playerName: 'Glimsdahl, Mike',    matchDate: 'Jul 24, 2025', holeScores: [4,5,4,5,3,5,4,4,4], gross: 38 },
  { eventNum: 9, playerName: 'Wolfgang, Joseph',   matchDate: 'Jul 24, 2025', holeScores: [7,6,5,7,4,4,5,6,5], gross: 49 },
  { eventNum: 9, playerName: 'Misener, Denny',     matchDate: 'Jul 24, 2025', holeScores: [4,5,7,5,3,4,4,5,5], gross: 42 },
  { eventNum: 9, playerName: 'Busch, Jay',         matchDate: 'Jul 24, 2025', holeScores: [7,6,7,7,7,6,5,6,9], gross: 60 },
  { eventNum: 9, playerName: 'Christianson, Matt', matchDate: 'Jul 24, 2025', holeScores: [6,5,3,9,3,6,5,5,6], gross: 48 },
  { eventNum: 9, playerName: 'Wheatcrat, Aaron',   matchDate: 'Jul 24, 2025', holeScores: [6,9,4,5,3,4,6,5,9], gross: 51 },
  { eventNum: 9, playerName: 'McKinney, Patrick',  matchDate: 'Jul 24, 2025', holeScores: [5,5,5,5,3,5,3,6,5], gross: 42 },
  { eventNum: 9, playerName: 'Ryan, Tim',          matchDate: 'Jul 24, 2025', holeScores: [4,7,4,6,3,4,3,4,4], gross: 39 },

  // Event 10 — Jul 31, 2025
  { eventNum: 10, playerName: 'Wheatcraft, Todd',   matchDate: 'Jul 31, 2025', holeScores: [6,7,4,8,4,5,5,4,5], gross: 48 },
  { eventNum: 10, playerName: 'Sadek, Josh',        matchDate: 'Jul 31, 2025', holeScores: [4,5,4,6,4,4,2,4,6], gross: 39 },
  { eventNum: 10, playerName: 'Ryan, Tim',          matchDate: 'Jul 31, 2025', holeScores: [3,6,4,5,3,5,3,4,5], gross: 38 },
  { eventNum: 10, playerName: 'Glimsdahl, Mike',    matchDate: 'Jul 31, 2025', holeScores: [4,4,4,5,3,7,4,4,5], gross: 40 },
  { eventNum: 10, playerName: 'Misener, Denny',     matchDate: 'Jul 31, 2025', holeScores: [5,5,3,5,3,4,4,6,5], gross: 40 },
  { eventNum: 10, playerName: 'McKinney, Patrick',  matchDate: 'Jul 31, 2025', holeScores: [5,4,4,6,3,4,3,4,6], gross: 39 },
  { eventNum: 10, playerName: 'Laramy, Brian',      matchDate: 'Jul 31, 2025', holeScores: [5,7,6,6,3,10,3,6,7], gross: 53 },
  { eventNum: 10, playerName: 'Christianson, Matt', matchDate: 'Jul 31, 2025', holeScores: [4,5,6,6,4,4,3,6,7], gross: 45 },

  // Event 11 — Aug 07, 2025 (7 players)
  { eventNum: 11, playerName: 'Nordeen, Andrew',  matchDate: 'Aug 07, 2025', holeScores: [3,4,4,5,3,5,3,4,4], gross: 35 },
  { eventNum: 11, playerName: 'Oberg, Tom',       matchDate: 'Aug 07, 2025', holeScores: [4,5,5,5,3,4,4,5,6], gross: 41 },
  { eventNum: 11, playerName: 'Glimsdahl, Mike',  matchDate: 'Aug 07, 2025', holeScores: [5,4,5,5,3,4,4,4,6], gross: 40 },
  { eventNum: 11, playerName: 'Ryan, Tim',        matchDate: 'Aug 07, 2025', holeScores: [4,5,4,5,4,5,6,5,4], gross: 42 },
  { eventNum: 11, playerName: 'Wheatcraft, Todd', matchDate: 'Aug 07, 2025', holeScores: [3,4,5,10,3,6,4,5,6], gross: 46 },
  { eventNum: 11, playerName: 'Wolfgang, Joseph', matchDate: 'Aug 07, 2025', holeScores: [5,4,6,6,4,4,4,4,6], gross: 43 },
  { eventNum: 11, playerName: 'Sadek, Josh',      matchDate: 'Aug 07, 2025', holeScores: [5,5,6,6,6,6,3,5,6], gross: 48 },
]

// ---------------------------------------------------------------------------
// Name normalization
// ---------------------------------------------------------------------------
// leaguegolfer uses "Last, First" — convert to "First Last"
// Also fix typos and nickname differences between leaguegolfer and app

// Aliases: leaguegolfer "First Last" → app full_name
const NAME_ALIASES: Record<string, string> = {
  'Joseph Wolfgang': 'Joe Wolfgang',
  'Andrew Nordeen': 'Andy Nordeen',
  'Denny Misener': 'Denny Misner',
  // Tom Oberg is not yet in the app — scores will be skipped with a warning
}

function normalizeLeagueName(name: string): string {
  const fixed = name.replace('Wheatcrat', 'Wheatcraft')
  const parts = fixed.split(',').map(p => p.trim())
  const firstLast = parts.length === 2 ? `${parts[1]} ${parts[0]}` : fixed
  return NAME_ALIASES[firstLast] ?? firstLast
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Historical Score Import ===\n')

  // 1. Fetch all users
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, full_name, display_name')
    .eq('is_active', true)

  if (usersErr || !users) throw new Error(`Failed to fetch users: ${usersErr?.message}`)
  console.log(`Found ${users.length} active users`)

  // Build name → user_id map (case-insensitive).
  // When duplicate names exist (e.g. two Matt Christianson accounts from OAuth),
  // prefer the user who (a) has a team assignment or (b) has a display_name.
  // We do two passes: first pass stores all, second pass upgrades to the better match.
  const nameToUserId = new Map<string, string>()

  // 2. Fetch team memberships first so we can prefer users with team assignments
  const { data: memberships, error: membErr } = await supabase
    .from('team_members')
    .select('user_id, team_id')

  if (membErr || !memberships) throw new Error(`Failed to fetch team_members: ${membErr?.message}`)

  const userToTeam = new Map<string, string>()
  for (const m of memberships) userToTeam.set(m.user_id, m.team_id)

  for (const u of users) {
    const key = u.full_name.toLowerCase()
    const existing = nameToUserId.get(key)
    const hasTeam = !!userToTeam.get(u.id)
    const existingHasTeam = existing ? !!userToTeam.get(existing) : false
    // Prefer the user with a team assignment; fall back to the one with a display_name
    if (!existing || (!existingHasTeam && (hasTeam || u.display_name))) {
      nameToUserId.set(key, u.id)
    }
    if (u.display_name) nameToUserId.set(u.display_name.toLowerCase(), u.id)
  }

  // For players whose team can't be found via their own membership, look it up
  // via a known teammate. Key: normalized player name → teammate's normalized name.
  const TEAM_VIA_TEAMMATE: Record<string, string> = {
    'Matt Christianson': 'Denny Misner',  // Team 3: Misner/Christianson
  }

  // 3. Resolve player names → {user_id, team_id}
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

    let teamId = userToTeam.get(userId)

    // Fallback: look up team via known teammate
    if (!teamId && TEAM_VIA_TEAMMATE[normalized]) {
      const teammateName = TEAM_VIA_TEAMMATE[normalized]
      const teammateId = nameToUserId.get(teammateName.toLowerCase())
      if (teammateId) teamId = userToTeam.get(teammateId)
    }

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

  // 4. Collect unique event dates and ensure rounds exist
  const eventDates = new Map<number, string>() // eventNum → ISO date
  for (const s of SCRAPED) {
    if (!eventDates.has(s.eventNum)) {
      const d = new Date(s.matchDate)
      const iso = d.toISOString().slice(0, 10)
      eventDates.set(s.eventNum, iso)
    }
  }

  // Find or create rounds for each event date
  const dateToRoundId = new Map<string, string>() // ISO date → round UUID

  // First, check for existing historical rounds (from prior seed)
  const { data: existingRounds } = await supabase
    .from('rounds')
    .select('id, round_date, round_number, season_year')
    .eq('status', 'completed')
    .lt('round_number', 0)

  if (existingRounds) {
    for (const r of existingRounds) {
      dateToRoundId.set(r.round_date, r.id)
    }
  }

  // For event dates without an existing round, create new ones
  let nextRoundNum = -100  // well below existing -1 to -15 range
  for (const [eventNum, isoDate] of eventDates) {
    if (dateToRoundId.has(isoDate)) {
      console.log(`Round for ${isoDate} already exists (event ${eventNum})`)
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
        notes: `Historical — league import event ${eventNum}`,
      })
      .select('id')
      .single()

    if (roundErr || !inserted) {
      throw new Error(`Failed to create round for ${isoDate}: ${roundErr?.message}`)
    }
    dateToRoundId.set(isoDate, inserted.id)
    console.log(`Created round for ${isoDate} (event ${eventNum})`)
  }

  // 5. Insert scores
  let inserted = 0
  let skipped = 0

  for (const s of SCRAPED) {
    const normalized = normalizeLeagueName(s.playerName)
    const player = playerCache.get(normalized)
    if (!player) continue  // already logged above

    const isoDate = new Date(s.matchDate).toISOString().slice(0, 10)
    const roundId = dateToRoundId.get(isoDate)
    if (!roundId) { console.error(`No round found for ${isoDate}`); continue }

    const submittedAt = `${isoDate}T20:00:00+00:00`

    const { error } = await supabase.from('scores').insert({
      round_id: roundId,
      user_id: player.userId,
      team_id: player.teamId,
      hole_scores: s.holeScores,
      handicap_at_time: null,
      net_score: null,
      is_locked: true,
      is_sub: false,
      submitted_at: submittedAt,
      submitted_by: player.userId,
    })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation — score already exists
        skipped++
      } else {
        console.error(`Failed to insert score for ${normalized} on ${isoDate}: ${error.message}`)
      }
    } else {
      inserted++
    }
  }

  console.log(`\nScores: ${inserted} inserted, ${skipped} skipped (already existed)`)

  // 6. Recalculate handicaps for all mapped players
  console.log('\nRecalculating handicaps...')
  const uniqueUserIds = [...new Set([...playerCache.values()].map(p => p.userId))]

  // Use the admin user ID for "changed_by" — try to find an admin
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
  const adminId = admins?.[0]?.id ?? uniqueUserIds[0]

  for (const userId of uniqueUserIds) {
    await recalculateHandicap(userId, adminId)
  }

  console.log(`\n✓ Import complete. ${uniqueUserIds.length} handicaps recalculated.`)
}

async function recalculateHandicap(userId: string, adminId: string) {
  const { data: eligible } = await supabase
    .rpc('get_eligible_scores_for_handicap', { p_user_id: userId, p_limit: 10 })

  if (!eligible || eligible.length === 0) return

  const grossScores: number[] = eligible.map((s: any) => s.gross_score)
  const scoresToUse = Math.max(1, Math.floor(grossScores.length * 0.8))
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
    reason: 'Auto-calculated after historical score import',
  })

  // Fetch user name for logging
  const { data: u } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()
  console.log(`  ${u?.full_name ?? userId}: handicap = ${newHandicap} (from ${grossScores.length} rounds, best ${scoresToUse})`)
}

main().catch(err => {
  console.error('\n❌ Import failed:', err)
  process.exit(1)
})

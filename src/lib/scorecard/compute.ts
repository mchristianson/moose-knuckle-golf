import { HOLE_PARS, STROKE_INDEX } from '@/lib/constants/course'

export interface TallyResult {
  gross: number | null
  net: number | null
  parSum: number
  played: number
}

// Net = gross − handicap (simple subtraction). Handicap is a 9-hole number, applied once.
// Only subtract handicap for the front 9 range (start=0, end≤9); back 9 and full-round
// views show gross-only for net so the leaderboard rank is still driven by front-9 net.
export function tallyRange(holeScores: number[], handicap: number, start: number, end: number): TallyResult {
  let gross = 0, parSum = 0, played = 0
  for (let i = start; i < end; i++) {
    const s = holeScores[i]
    if (s > 0) {
      parSum += HOLE_PARS[i]
      gross += s
      played++
    }
  }
  const applyHandicap = start === 0 && end <= 9
  const net = played > 0 ? (applyHandicap ? gross - Math.floor(handicap) : gross) : null
  return {
    gross: played > 0 ? gross : null,
    net,
    parSum,
    played,
  }
}

// Allocate handicap strokes per hole for tile dot display only (not used for net totals)
export function strokesForHandicap(handicap: number): number[] {
  const hcp = Math.floor(handicap)
  return STROKE_INDEX.map((si) => {
    let strokes = 0
    if (si <= hcp) strokes += 1
    if (si <= hcp - 18) strokes += 1
    return strokes
  })
}

// Unplayed rounds sort last; otherwise ascending net-to-par, ties broken by gross.
export function compareTallies(a: TallyResult, b: TallyResult): number {
  if (a.played === 0 && b.played > 0) return 1
  if (b.played === 0 && a.played > 0) return -1
  const an = a.net !== null ? a.net - a.parSum : 999
  const bn = b.net !== null ? b.net - b.parSum : 999
  if (an !== bn) return an - bn
  return (a.gross ?? 999) - (b.gross ?? 999)
}

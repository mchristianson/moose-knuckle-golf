export interface NetScoreResult {
  holeScores: number[]
  grossFront9: number
  netScore: number | null
}

export function validateHoleScores(holeScores: number[]): string | null {
  if (holeScores.length < 9 || holeScores.length > 18) return 'Expected 9 to 18 hole scores'
  if (holeScores.some((h) => h < 0)) return 'Hole scores cannot be negative'
  return null
}

function padHoleScores(holeScores: number[]): number[] {
  if (holeScores.length >= 18) return holeScores
  return [...holeScores, ...Array(18 - holeScores.length).fill(0)]
}

// Only the front 9 counts toward gross/net; back 9 is tracking only.
export function computeNetScore(holeScores: number[], handicap: number): NetScoreResult {
  const padded = padHoleScores(holeScores)
  const frontNine = padded.slice(0, 9)
  const grossFront9 = frontNine.reduce((a, b) => a + b, 0)
  const allFilled = frontNine.every((h) => h > 0)
  const netScore = allFilled ? Math.round((grossFront9 - handicap) * 10) / 10 : null
  return { holeScores: padded, grossFront9, netScore }
}

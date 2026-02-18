/**
 * Foursome Generator Algorithm
 *
 * Purpose: Assigns 8 golfers (one per team) into two foursomes of 4 golfers each,
 * with 2 carts per foursome. Minimizes repeat pairings with pairing history.
 *
 * Approach: Greedy algorithm with random iterations
 * - Generate 100 random foursome assignments
 * - Score each based on repeat pairings from history
 * - Return the assignment with the lowest score (fewest repeats)
 */

interface Golfer {
  userId: string
  teamId: string
  fullName: string
}

interface Foursome {
  teeTimeSlot: 1 | 2
  golfers: Golfer[]
  carts: {
    cart1: Golfer[]
    cart2: Golfer[]
  }
}

interface FoursomeAssignment {
  foursomes: [Foursome, Foursome]
  score: number
}

/**
 * Generate an optimal foursome assignment
 * @param golfers - Array of 8 golfers (one per team)
 * @param pairingHistory - 2D array of pairing counts between golfers
 * @returns Assignment of 8 golfers into 2 foursomes
 */
export function generateFoursomeAssignment(
  golfers: Golfer[],
  pairingHistory?: number[][]
): { foursomes: [Foursome, Foursome]; iterations: number } {
  if (golfers.length !== 8) {
    throw new Error('Exactly 8 golfers are required')
  }

  const iterations = 100
  let bestAssignment: FoursomeAssignment | null = null

  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffleArray([...golfers])
    const foursomes = createFoursomes(shuffled)
    const score = calculateScore(foursomes, pairingHistory)

    if (!bestAssignment || score < bestAssignment.score) {
      bestAssignment = { foursomes, score }
    }
  }

  if (!bestAssignment) {
    throw new Error('Failed to generate foursome assignment')
  }

  return { foursomes: bestAssignment.foursomes, iterations }
}

/**
 * Create two foursomes from 8 golfers
 * Golfers 0-3 go to foursome 1, golfers 4-7 go to foursome 2
 * Within each foursome: carts are [0,1] and [2,3]
 */
function createFoursomes(golfers: Golfer[]): [Foursome, Foursome] {
  const firstFoursome: Foursome = {
    teeTimeSlot: 1,
    golfers: golfers.slice(0, 4),
    carts: {
      cart1: [golfers[0], golfers[1]],
      cart2: [golfers[2], golfers[3]],
    },
  }

  const secondFoursome: Foursome = {
    teeTimeSlot: 2,
    golfers: golfers.slice(4, 8),
    carts: {
      cart1: [golfers[4], golfers[5]],
      cart2: [golfers[6], golfers[7]],
    },
  }

  return [firstFoursome, secondFoursome]
}

/**
 * Calculate a score for a foursome assignment
 * Lower score = better (fewer repeat pairings)
 */
function calculateScore(foursomes: [Foursome, Foursome], pairingHistory?: number[][]): number {
  if (!pairingHistory) {
    return 0 // No history, all assignments are equally good
  }

  let score = 0

  // Score both foursomes
  for (const foursome of foursomes) {
    const golfers = foursome.golfers

    // Score all unique pairs within the foursome
    for (let i = 0; i < golfers.length; i++) {
      for (let j = i + 1; j < golfers.length; j++) {
        const userI = parseInt(golfers[i].userId)
        const userJ = parseInt(golfers[j].userId)

        // Both users must be in range for history lookup
        if (userI < pairingHistory.length && userJ < pairingHistory[userI].length) {
          score += pairingHistory[userI][userJ]
        }
      }
    }
  }

  return score
}

/**
 * Fisher-Yates shuffle - randomizes array order
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Build a pairing history matrix from past foursomes
 * Returns a 2D array where [i][j] = number of times golfers i and j played together
 * @param pastRounds - Array of past foursome assignments
 * @param totalGolfers - Total number of unique golfers
 */
export function buildPairingHistory(
  pastRounds: Array<Array<Golfer[]>>,
  totalGolfers: number
): number[][] {
  const history: number[][] = Array(totalGolfers)
    .fill(null)
    .map(() => Array(totalGolfers).fill(0))

  // For each past round
  for (const round of pastRounds) {
    // For each foursome in the round
    for (const foursome of round) {
      // For each pair of golfers
      for (let i = 0; i < foursome.length; i++) {
        for (let j = i + 1; j < foursome.length; j++) {
          const userI = parseInt(foursome[i].userId)
          const userJ = parseInt(foursome[j].userId)

          if (userI < totalGolfers && userJ < totalGolfers) {
            history[userI][userJ]++
            history[userJ][userI]++
          }
        }
      }
    }
  }

  return history
}

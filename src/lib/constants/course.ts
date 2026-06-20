// Legend's par values — holes 1–9 (front) and 10–18 (back)
export const HOLE_PARS = [4, 4, 4, 5, 3, 4, 3, 4, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4] // front 36, back 36

// Stroke index per hole (lower = harder = gets a stroke first)
//   Hole: 1  2  3  4  5  6  7  8  9  10  11  12  13  14  15  16  17  18
//   SI:   5  7  1  3  9  2  8  4  6   8   2  16  12  18  14   4  10   6
export const STROKE_INDEX = [5, 7, 1, 3, 9, 2, 8, 4, 6, 8, 2, 16, 12, 18, 14, 4, 10, 6]

// 18-hole course ratings per tee box. League baseline is Blue.
// Handicap tee adjustment = (BASELINE_RATING − playerRating) / 2 for 9-hole play.
// Positive adjustment means easier tees → fewer strokes granted.
export const TEE_RATINGS = {
  blue:  { men: 71.1 },
  white: { men: 69.5 },
} as const

export type TeeBox = keyof typeof TEE_RATINGS
export const BASELINE_TEE: TeeBox = 'blue'

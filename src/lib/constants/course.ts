// Legend's front nine par values (holes 1–9)
export const HOLE_PARS = [4, 4, 4, 5, 3, 4, 3, 4, 5] // total par = 36

// Stroke index order for Legend's front 9 (hardest → easiest):
//   Hole: 1  2  3  4  5  6  7  8  9
//   SI:   5  7  1  3  9  2  8  4  6
// (Lower SI = hardest = gets a stroke first)
export const STROKE_INDEX = [5, 7, 1, 3, 9, 2, 8, 4, 6] // per hole (1-indexed position)

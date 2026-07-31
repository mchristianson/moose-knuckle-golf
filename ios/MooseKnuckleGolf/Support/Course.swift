import Foundation

/// Mirrors src/lib/constants/course.ts — display only (which stroke gets a dot,
/// what par is shown next to a hole). The actual net-score math stays server-side
/// in src/lib/scores/netScore.ts, which doesn't even use per-hole stroke index.
enum Course {
    static let holePars = [4, 4, 4, 5, 3, 4, 3, 4, 5, 4, 5, 4, 3, 4, 4, 5, 3, 4]
    static let strokeIndex = [5, 7, 1, 3, 9, 2, 8, 4, 6, 8, 2, 16, 12, 18, 14, 4, 10, 6]
}

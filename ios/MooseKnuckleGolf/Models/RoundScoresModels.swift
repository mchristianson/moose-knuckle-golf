import Foundation

/// GET /api/mobile/rounds/[id]/scores — decoded with .convertFromSnakeCase.
/// front/back/full are pre-sorted and pre-ranked server-side (src/lib/scorecard/compute.ts);
/// this client only renders the numbers, never recomputes them.
struct RoundScoresResponse: Decodable {
    let round: RoundInfo
    let front: [PlayerScoreRow]
    let back: [PlayerScoreRow]
    let full: [PlayerScoreRow]
}

struct PlayerScoreRow: Decodable, Identifiable {
    let userId: String
    let fullName: String
    let avatarUrl: String?
    let teamName: String
    let teamNumber: Int
    let makeupPending: Bool
    let gross: Int?
    let net: Int?
    let parSum: Int
    let played: Int
    let netToPar: Int?
    let isLeader: Bool

    var id: String { userId }
}

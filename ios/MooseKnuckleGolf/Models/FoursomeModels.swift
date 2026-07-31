import Foundation

/// GET /api/mobile/rounds/[id]/foursome — decoded with .convertFromSnakeCase.
struct FoursomeResponse: Decodable {
    let round: RoundInfo
    let scoringOpen: Bool
    let players: [FoursomePlayer]
}

struct FoursomePlayer: Decodable {
    let userId: String?
    let subId: String?
    let teamName: String
    let teamNumber: Int
    let isSub: Bool
    let displayName: String
    let avatarUrl: String?
    let handicap: Double
    let holeScores: [Int]

    /// Stable identity regardless of whether this player is a user or an external sub.
    var key: String { userId.map { "user:\($0)" } ?? "sub:\(subId ?? "")" }
}

/// POST /api/mobile/scores body — property names already match the route's
/// expected JSON keys, so no snake_case conversion needed on encode.
struct SubmitScoreBody: Encodable {
    let roundId: String
    let holeScores: [Int]
    let targetUserId: String?
    let targetSubId: String?
}

struct SubmitScoreResponse: Decodable {
    let success: Bool
}

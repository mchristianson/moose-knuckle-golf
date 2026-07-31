import Foundation

/// GET /api/mobile/leaderboard — decoded with .convertFromSnakeCase.
struct LeaderboardResponse: Decodable {
    let year: Int
    let standings: [StandingRow]
    let rounds: [RoundInfo]
}

struct StandingRow: Decodable, Identifiable {
    let teamId: String
    let teamName: String
    let teamNumber: Int
    let totalPoints: Double
    let roundsPlayed: Int

    var id: String { teamId }
}

/// Shared shape between the leaderboard's `rounds` list and a round-scores
/// response's `round` field — both routes emit the same five fields.
struct RoundInfo: Decodable, Identifiable {
    let id: String
    let roundNumber: Int
    let roundDate: String
    let status: String
    let teeTime: String?
}

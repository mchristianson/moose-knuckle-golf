import SwiftUI

struct LeaderboardView: View {
    @EnvironmentObject private var authManager: AuthManager

    @State private var response: LeaderboardResponse?
    @State private var errorMessage: String?
    @State private var isLoading = false

    private var apiClient: APIClient { APIClient(authManager: authManager) }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Leaderboard")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Sign Out") {
                            Task { try? await authManager.signOut() }
                        }
                    }
                }
                .task { await load() }
                .refreshable { await load() }
        }
    }

    private var activeRound: RoundInfo? {
        response?.rounds.first { ["in_progress", "scoring"].contains($0.status) }
    }

    @ViewBuilder
    private var content: some View {
        if let response {
            List {
                if let activeRound {
                    Section {
                        NavigationLink {
                            ScoreEntryView(round: activeRound)
                        } label: {
                            HStack {
                                Image(systemName: "pencil.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(Theme.accent)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Enter Scores")
                                        .font(.body.weight(.semibold))
                                    Text("Round \(activeRound.roundNumber) is open for scoring")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .listRowBackground(Theme.rowBackground)
                    }
                }

                Section {
                    if response.standings.isEmpty {
                        Text("No completed rounds yet.")
                            .foregroundStyle(.secondary)
                            .listRowBackground(Theme.rowBackground)
                    } else {
                        ForEach(Array(response.standings.enumerated()), id: \.element.id) { index, row in
                            StandingRowView(rank: index + 1, row: row)
                                .listRowBackground(Theme.rowBackground)
                        }
                    }
                } header: {
                    Text("Season \(response.year) Standings")
                        .font(.jbMono(12))
                        .foregroundStyle(Theme.accent)
                }

                Section {
                    if response.rounds.isEmpty {
                        Text("No rounds scheduled.")
                            .foregroundStyle(.secondary)
                            .listRowBackground(Theme.rowBackground)
                    } else {
                        ForEach(response.rounds) { round in
                            NavigationLink(value: round) {
                                RoundRowView(round: round)
                            }
                            .listRowBackground(Theme.rowBackground)
                        }
                    }
                } header: {
                    Text("Rounds")
                        .font(.jbMono(12))
                        .foregroundStyle(Theme.accent)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationDestination(for: RoundInfo.self) { round in
                RoundDetailView(round: round)
            }
        } else if isLoading {
            ProgressView()
                .tint(Theme.accent)
        } else if let errorMessage {
            ContentUnavailableView("Couldn't Load Leaderboard", systemImage: "wifi.slash", description: Text(errorMessage))
        } else {
            ProgressView()
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            response = try await apiClient.get("api/mobile/leaderboard")
        } catch {
            errorMessage = "\(error)"
        }
        isLoading = false
    }
}

private struct StandingRowView: View {
    let rank: Int
    let row: StandingRow

    var body: some View {
        HStack {
            Text("\(rank)")
                .font(.subheadline.bold())
                .foregroundStyle(.secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(row.teamName)
                    .font(.body.weight(.semibold))
                Text("\(row.roundsPlayed) rounds played")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(row.totalPoints.formatted(.number.precision(.fractionLength(0...1))))
                .font(.anton(20))
                .foregroundStyle(Theme.accent)
        }
        .padding(.vertical, 4)
    }
}

private struct RoundRowView: View {
    let round: RoundInfo

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Round \(round.roundNumber)")
                    .font(.body.weight(.semibold))
                Text(DateFormatting.roundDate(round.roundDate))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            PillBadge(text: round.status.replacingOccurrences(of: "_", with: " ").capitalized)
        }
        .padding(.vertical, 2)
    }
}

extension RoundInfo: Hashable {
    static func == (lhs: RoundInfo, rhs: RoundInfo) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

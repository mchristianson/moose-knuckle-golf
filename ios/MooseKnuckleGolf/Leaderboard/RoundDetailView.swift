import SwiftUI

private enum HoleView: String, CaseIterable, Identifiable {
    case front = "Front 9"
    case back = "Back 9"
    case full = "Full Round"

    var id: String { rawValue }
}

struct RoundDetailView: View {
    let round: RoundInfo

    @EnvironmentObject private var authManager: AuthManager

    @State private var response: RoundScoresResponse?
    @State private var errorMessage: String?
    @State private var holeView: HoleView = .full

    private var apiClient: APIClient { APIClient(authManager: authManager) }

    private var scoringOpen: Bool { ["in_progress", "scoring"].contains(round.status) }

    var body: some View {
        content
            .navigationTitle("Round \(round.roundNumber)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if scoringOpen {
                    ToolbarItem(placement: .topBarTrailing) {
                        NavigationLink("Enter Scores") {
                            ScoreEntryView(round: round)
                        }
                    }
                }
            }
            .task { await load() }
            .refreshable { await load() }
    }

    @ViewBuilder
    private var content: some View {
        if let response {
            VStack(spacing: 0) {
                header

                Picker("Holes", selection: $holeView) {
                    ForEach(HoleView.allCases) { view in
                        Text(view.rawValue).tag(view)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                List(rows(for: response)) { row in
                    PlayerScoreRowView(row: row)
                        .listRowBackground(Theme.rowBackground)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .background(Theme.background)
            }
            .background(Theme.background.ignoresSafeArea())
        } else if let errorMessage {
            ContentUnavailableView("Couldn't Load Scores", systemImage: "wifi.slash", description: Text(errorMessage))
        } else {
            ProgressView()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(DateFormatting.roundDate(round.roundDate))
                .font(.headline)
            if let teeTime = round.teeTime {
                Text("Tee time: \(DateFormatting.teeTime(teeTime))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Theme.holeCardBackground)
        .foregroundStyle(.white)
        .overlay(Rectangle().frame(height: 1).foregroundStyle(Theme.holeCardBorder), alignment: .bottom)
    }

    private func rows(for response: RoundScoresResponse) -> [PlayerScoreRow] {
        switch holeView {
        case .front: return response.front
        case .back: return response.back
        case .full: return response.full
        }
    }

    private func load() async {
        errorMessage = nil
        do {
            response = try await apiClient.get("api/mobile/rounds/\(round.id)/scores")
        } catch {
            errorMessage = "\(error)"
        }
    }
}

private struct PlayerScoreRowView: View {
    let row: PlayerScoreRow

    private var netToParText: String {
        guard let netToPar = row.netToPar else { return "—" }
        if netToPar == 0 { return "E" }
        return netToPar > 0 ? "+\(netToPar)" : "\(netToPar)"
    }

    var body: some View {
        HStack {
            if row.isLeader {
                Image(systemName: "trophy.fill")
                    .foregroundStyle(Color(hex: 0xFFD24A))
                    .frame(width: 20)
            } else {
                Spacer().frame(width: 20)
            }

            VStack(alignment: .leading, spacing: 2) {
                if row.makeupPending {
                    Text(row.fullName)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("\(row.teamName) · Makeup pending")
                        .font(.caption)
                        .foregroundStyle(Theme.diceAmberBright)
                } else {
                    Text(row.fullName)
                        .font(.body.weight(.semibold))
                    Text(row.teamName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if !row.makeupPending {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(row.gross.map(String.init) ?? "—")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(netToParText)
                        .font(.title3.bold())
                }
                Text("\(row.played)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .frame(width: 24)
            }
        }
        .padding(.vertical, 4)
    }
}

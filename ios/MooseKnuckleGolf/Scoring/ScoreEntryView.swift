import SwiftUI

private enum SaveState {
    case idle, saving, saved, error
}

private struct Celebration: Identifiable {
    let id = UUID()
    let playerName: String
    let hole: Int
}

struct ScoreEntryView: View {
    let round: RoundInfo

    @EnvironmentObject private var authManager: AuthManager

    @State private var players: [FoursomePlayer] = []
    @State private var scoringOpen = false
    @State private var scores: [String: [Int?]] = [:]
    @State private var touched: [String: [Bool]] = [:]
    @State private var saveState: [String: SaveState] = [:]
    @State private var holeIdx = 0
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var saveTasks: [String: Task<Void, Never>] = [:]
    @State private var celebration: Celebration?

    private var apiClient: APIClient { APIClient(authManager: authManager) }
    private var currentUserId: String? { authManager.session?.user.id.uuidString.lowercased() }

    var body: some View {
        content
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .background(Theme.background.ignoresSafeArea())
            .task { await load() }
            .overlay {
                if let celebration {
                    BirdieCelebrationView(playerName: celebration.playerName, hole: celebration.hole) {
                        self.celebration = nil
                    }
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading {
            ProgressView().tint(Theme.accent)
        } else if let errorMessage {
            ContentUnavailableView("Couldn't Load Scorecard", systemImage: "wifi.slash", description: Text(errorMessage))
        } else if players.isEmpty {
            ContentUnavailableView("Not in a Foursome", systemImage: "person.3", description: Text("You're not listed as a player in this round's foursomes."))
        } else {
            VStack(spacing: 0) {
                ScreenHeader(roundNumber: round.roundNumber, roundDate: DateFormatting.roundDate(round.roundDate), scoringOpen: scoringOpen)
                TotalsStrip(players: players, scores: scores, touched: touched, holeIdx: holeIdx)
                DiceRollStrip(players: players, scores: scores, touched: touched)
                HoleHeader(holeIdx: holeIdx, onPrev: { holeIdx = (holeIdx - 1 + 18) % 18 }, onNext: { holeIdx = (holeIdx + 1) % 18 })
                HoleStrip(holeIdx: $holeIdx, players: players, touched: touched)

                ScrollView {
                    VStack(spacing: 7) {
                        ForEach(Array(players.enumerated()), id: \.element.key) { i, player in
                            ScoreEntryRow(
                                player: player,
                                avatarColor: Theme.avatarColors[i % Theme.avatarColors.count],
                                par: Course.holePars[holeIdx],
                                getsStroke: getsStroke(player),
                                value: touched[player.key]?[holeIdx] == true ? (scores[player.key]?[holeIdx] ?? nil) : nil,
                                saveState: saveState[player.key] ?? .idle,
                                disabled: !scoringOpen,
                                onDecrement: { adjust(player, by: -1) },
                                onIncrement: { adjust(player, by: 1) },
                                onCommitDefault: { commitDefaultIfUnset(player) }
                            )
                        }
                    }
                    .padding(10)
                }
                .gesture(
                    DragGesture(minimumDistance: 24)
                        .onEnded { value in
                            let dx = value.translation.width
                            let dy = value.translation.height
                            guard abs(dx) > 40, abs(dx) > abs(dy) else { return }
                            holeIdx = dx < 0 ? min(17, holeIdx + 1) : max(0, holeIdx - 1)
                        }
                )
            }
        }
    }

    private func getsStroke(_ player: FoursomePlayer) -> Bool {
        guard let minHandicap = players.map(\.handicap).min() else { return false }
        return (player.handicap - minHandicap) >= Double(Course.strokeIndex[holeIdx])
    }

    private func adjust(_ player: FoursomePlayer, by delta: Int) {
        let par = Course.holePars[holeIdx]
        let current = scores[player.key]?[holeIdx] ?? nil
        let base = current ?? par
        setScore(player, value: max(1, min(20, base + delta)))
    }

    private func commitDefaultIfUnset(_ player: FoursomePlayer) {
        guard (scores[player.key]?[holeIdx] ?? nil) == nil else { return }
        setScore(player, value: Course.holePars[holeIdx])
    }

    private func setScore(_ player: FoursomePlayer, value: Int) {
        var sc = scores[player.key] ?? Array(repeating: nil, count: 18)
        sc[holeIdx] = value
        scores[player.key] = sc

        var td = touched[player.key] ?? Array(repeating: false, count: 18)
        td[holeIdx] = true
        touched[player.key] = td

        saveState[player.key] = .idle

        if Course.holePars[holeIdx] == 3 && value == 2 {
            let firstName = player.displayName.split(separator: " ").first.map(String.init) ?? player.displayName
            celebration = Celebration(playerName: firstName, hole: holeIdx + 1)
        }

        scheduleSave(player)
    }

    private func scheduleSave(_ player: FoursomePlayer) {
        saveTasks[player.key]?.cancel()
        saveTasks[player.key] = Task {
            try? await Task.sleep(nanoseconds: 700_000_000)
            guard !Task.isCancelled else { return }
            await save(player)
        }
    }

    private func save(_ player: FoursomePlayer) async {
        let sc = scores[player.key] ?? Array(repeating: nil, count: 18)
        let td = touched[player.key] ?? Array(repeating: false, count: 18)
        let payload = (0..<18).map { td[$0] ? (sc[$0] ?? 0) : 0 }

        saveState[player.key] = .saving
        let isSelf = player.userId != nil && player.userId == currentUserId
        let body = SubmitScoreBody(
            roundId: round.id,
            holeScores: payload,
            targetUserId: isSelf ? nil : player.userId,
            targetSubId: isSelf ? nil : player.subId
        )
        do {
            let _: SubmitScoreResponse = try await apiClient.post("api/mobile/scores", body: body)
            saveState[player.key] = .saved
        } catch {
            saveState[player.key] = .error
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let response: FoursomeResponse = try await apiClient.get("api/mobile/rounds/\(round.id)/foursome")
            players = response.players
            scoringOpen = response.scoringOpen
            for player in response.players {
                scores[player.key] = player.holeScores.map { $0 > 0 ? $0 : nil }
                touched[player.key] = player.holeScores.map { $0 > 0 }
            }
            if let me = players.first(where: { $0.userId == currentUserId }) {
                holeIdx = (scores[me.key] ?? []).firstIndex(where: { $0 == nil }) ?? 17
            }
        } catch {
            errorMessage = "\(error)"
        }
        isLoading = false
    }
}

// MARK: - Screen Header

private struct ScreenHeader: View {
    let roundNumber: Int
    let roundDate: String
    let scoringOpen: Bool

    var body: some View {
        HStack(spacing: 10) {
            Text("MK")
                .font(.anton(13))
                .foregroundStyle(Theme.accent)
                .frame(width: 36, height: 36)
                .background(Theme.holeCardBackground)
                .clipShape(Circle())
                .overlay(Circle().stroke(Theme.accent, lineWidth: 1.5))

            VStack(alignment: .leading, spacing: 2) {
                Text("Moose Knuckle")
                    .font(.barlow(14, weight: .bold))
                    .foregroundStyle(.white)
                Text("RD \(roundNumber) · \(roundDate)")
                    .font(.jbMono(10))
                    .foregroundStyle(.white.opacity(0.5))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                if scoringOpen {
                    Text("OPEN").font(.jbMono(10)).foregroundStyle(.white.opacity(0.5))
                    Text("● LIVE").font(.jbMono(10)).foregroundStyle(Theme.accent)
                } else {
                    Text("CLOSED").font(.jbMono(10)).foregroundStyle(.white.opacity(0.5))
                }
            }
        }
        .padding(EdgeInsets(top: 8, leading: 14, bottom: 10, trailing: 14))
        .overlay(Rectangle().frame(height: 1).foregroundStyle(Theme.rowBorder), alignment: .bottom)
    }
}

// MARK: - Totals Strip

private struct TotalsStrip: View {
    let players: [FoursomePlayer]
    let scores: [String: [Int?]]
    let touched: [String: [Bool]]
    let holeIdx: Int

    private let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 5) {
            ForEach(Array(players.enumerated()), id: \.element.key) { i, player in
                cell(for: player, color: Theme.avatarColors[i % Theme.avatarColors.count])
            }
        }
        .padding(EdgeInsets(top: 7, leading: 10, bottom: 7, trailing: 10))
        .overlay(Rectangle().frame(height: 1).foregroundStyle(Theme.rowBorder), alignment: .bottom)
    }

    private func cell(for player: FoursomePlayer, color: Color) -> some View {
        let sc = scores[player.key] ?? []
        let td = touched[player.key] ?? []
        var gross = 0, parThru = 0, played = 0
        for hi in 0...holeIdx where hi < sc.count && td[safe: hi] == true {
            if let value = sc[hi] {
                gross += value
                parThru += Course.holePars[hi]
                played += 1
            }
        }
        let toPar = gross - parThru
        let toParStr = played == 0 ? "—" : toPar == 0 ? "E" : toPar > 0 ? "+\(toPar)" : "\(toPar)"
        let toParColor: Color = toPar < 0 ? Theme.accent : toPar > 0 ? Color(hex: 0xFF7A6B) : .white.opacity(0.6)

        return HStack(spacing: 5) {
            PlayerAvatar(avatarUrl: player.avatarUrl, displayName: player.displayName, color: color, size: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(player.displayName.split(separator: " ").first.map(String.init) ?? player.displayName)
                    .font(.jbMono(10))
                    .foregroundStyle(.white.opacity(0.45))
                    .lineLimit(1)
                HStack(alignment: .lastTextBaseline, spacing: 3) {
                    Text(played == 0 ? "—" : "\(gross)")
                        .font(.anton(15))
                        .foregroundStyle(.white)
                    Text(toParStr)
                        .font(.jbMono(10))
                        .foregroundStyle(toParColor)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(EdgeInsets(top: 5, leading: 7, bottom: 5, trailing: 7))
        .background(Theme.rowBackground)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Dice Roll Strip

private struct DiceRollStrip: View {
    let players: [FoursomePlayer]
    let scores: [String: [Int?]]
    let touched: [String: [Bool]]

    private var earners: [(name: String, count: Int)] {
        players.compactMap { p in
            let sc = scores[p.key] ?? []
            let td = touched[p.key] ?? []
            var count = 0
            for i in 0..<18 where Course.holePars[i] == 3 && td[safe: i] == true && sc[safe: i] == 2 {
                count += 1
            }
            guard count > 0 else { return nil }
            return (p.displayName.split(separator: " ").first.map(String.init) ?? p.displayName, count)
        }
    }

    var body: some View {
        if !earners.isEmpty {
            HStack(spacing: 8) {
                Text("🎲").font(.system(size: 13))
                Text(diceText)
                    .font(.jbMono(10))
                    .foregroundStyle(Theme.diceAmber)
            }
            .padding(EdgeInsets(top: 5, leading: 14, bottom: 5, trailing: 14))
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.diceAmberBg)
            .overlay(Rectangle().frame(height: 1).foregroundStyle(Theme.diceAmber.opacity(0.2)), alignment: .bottom)
        }
    }

    private var diceText: String {
        "DICE ROLLS: " + earners.map { $0.count > 1 ? "\($0.name) ×\($0.count)" : $0.name }.joined(separator: "  ·  ")
    }
}

// MARK: - Hole Header

private struct HoleHeader: View {
    let holeIdx: Int
    let onPrev: () -> Void
    let onNext: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            navButton(systemName: "chevron.left", action: onPrev)

            HStack(spacing: 12) {
                Text("HOLE \(holeIdx + 1)")
                    .font(.anton(26))
                    .foregroundStyle(.white)
                Spacer()
                stat(label: "PAR", value: Course.holePars[holeIdx], accent: true)
                stat(label: "HCP", value: Course.strokeIndex[holeIdx], accent: false)
            }
            .padding(EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
            .background(Theme.holeCardBackground)
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(Theme.holeCardBorder, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            navButton(systemName: "chevron.right", action: onNext)
        }
        .padding(EdgeInsets(top: 8, leading: 12, bottom: 6, trailing: 12))
    }

    private func navButton(systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .foregroundStyle(.white.opacity(0.7))
                .frame(width: 38, height: 44)
                .background(Theme.rowBackground)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func stat(label: String, value: Int, accent: Bool) -> some View {
        VStack(spacing: 2) {
            Text(label).font(.jbMono(10)).foregroundStyle(.white.opacity(0.5))
            Text("\(value)").font(.anton(19)).foregroundStyle(accent ? Theme.accent : .white)
        }
        .frame(minWidth: 28)
    }
}

// MARK: - Hole Strip

private struct HoleStrip: View {
    @Binding var holeIdx: Int
    let players: [FoursomePlayer]
    let touched: [String: [Bool]]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(0..<18, id: \.self) { i in
                        pill(for: i)
                    }
                }
                .padding(EdgeInsets(top: 5, leading: 10, bottom: 8, trailing: 10))
            }
            .onChange(of: holeIdx) { _, newValue in
                withAnimation { proxy.scrollTo(newValue, anchor: .center) }
            }
        }
    }

    private func pill(for i: Int) -> some View {
        let allEntered = players.allSatisfy { touched[$0.key]?[safe: i] == true }
        let isCur = i == holeIdx
        return Button {
            holeIdx = i
        } label: {
            ZStack(alignment: .topTrailing) {
                Text("\(i + 1)")
                    .font(.anton(14))
                    .foregroundStyle(isCur ? Theme.accent : allEntered ? .white : .white.opacity(0.4))
                    .frame(width: 32, height: 32)
                    .background(isCur ? Theme.accent.opacity(0.15) : allEntered ? Theme.rowBackground : .clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(isCur ? Theme.accent : .clear, lineWidth: 1.5)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                if allEntered && !isCur {
                    Circle().fill(Theme.accent).frame(width: 4, height: 4).padding(3)
                }
            }
        }
        .id(i)
    }
}

// MARK: - Player Score Row

private struct ScoreEntryRow: View {
    let player: FoursomePlayer
    let avatarColor: Color
    let par: Int
    let getsStroke: Bool
    let value: Int?
    let saveState: SaveState
    let disabled: Bool
    let onDecrement: () -> Void
    let onIncrement: () -> Void
    let onCommitDefault: () -> Void

    private var isPar3Birdie: Bool { par == 3 && value == 2 }

    var body: some View {
        HStack(spacing: 10) {
            PlayerAvatar(avatarUrl: player.avatarUrl, displayName: player.displayName, color: avatarColor, size: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(player.displayName)
                    .font(.barlow(15, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                HStack(spacing: 5) {
                    Text("HCP \(player.handicap.formatted(.number.precision(.fractionLength(0...1))))")
                        .font(.jbMono(10))
                        .foregroundStyle(.white.opacity(0.45))
                    if getsStroke {
                        Text("· 1 STROKE").font(.jbMono(10)).foregroundStyle(Theme.accent)
                    }
                    saveIndicator
                }
            }

            Spacer(minLength: 0)

            ScoreControl(
                value: value,
                defaultValue: par,
                par: par,
                disabled: disabled,
                isPar3Birdie: isPar3Birdie,
                onDecrement: onDecrement,
                onIncrement: onIncrement,
                onCommit: onCommitDefault
            )
        }
        .cardBackground()
    }

    @ViewBuilder
    private var saveIndicator: some View {
        switch saveState {
        case .idle: EmptyView()
        case .saving: Text("· ↻").font(.jbMono(10)).foregroundStyle(.white.opacity(0.4))
        case .saved: Text("· ✓").font(.jbMono(10)).foregroundStyle(Theme.accent)
        case .error: Text("· !").font(.jbMono(10)).foregroundStyle(Color(hex: 0xFF7A6B))
        }
    }
}

// MARK: - Score Control

private struct ScoreControl: View {
    let value: Int?
    let defaultValue: Int
    let par: Int
    let disabled: Bool
    let isPar3Birdie: Bool
    let onDecrement: () -> Void
    let onIncrement: () -> Void
    let onCommit: () -> Void

    private var isDefault: Bool { value == nil }
    private var display: Int { value ?? defaultValue }
    private var meta: (label: String, color: Color) { Theme.scoreMeta(score: value, par: par) }
    private var borderColor: Color {
        isPar3Birdie ? Theme.diceAmber : isDefault ? Color.white.opacity(0.12) : meta.color
    }

    var body: some View {
        HStack(spacing: 6) {
            ctrlButton("−", action: onDecrement)

            Button(action: onCommit) {
                VStack(spacing: 2) {
                    Text("\(display)")
                        .font(.anton(38))
                        .foregroundStyle(isDefault ? .white.opacity(0.5) : .white)
                        .italic(isDefault)
                    Text(isDefault ? "TAP TO LOG" : meta.label)
                        .font(.jbMono(10))
                        .foregroundStyle(isPar3Birdie ? Theme.diceAmber : meta.color)
                }
                .frame(minWidth: 58)
                .padding(EdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8))
                .background(isPar3Birdie ? Theme.diceAmberBg : Color(hex: 0x0A0B0A))
                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(borderColor, lineWidth: 1.5))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(alignment: .topTrailing) {
                    if isPar3Birdie {
                        Text("🎲").font(.system(size: 11)).padding(3)
                    }
                }
            }
            .disabled(disabled)

            ctrlButton("+", action: onIncrement)
        }
    }

    private func ctrlButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(symbol)
                .font(.barlow(17, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 34, height: 34)
                .background(Theme.rowBackground)
                .overlay(RoundedRectangle(cornerRadius: 11, style: .continuous).stroke(Theme.rowBorder, lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
                .opacity(disabled ? 0.4 : 1)
        }
        .disabled(disabled)
    }
}

// MARK: - Player Avatar

struct PlayerAvatar: View {
    let avatarUrl: String?
    let displayName: String
    let color: Color
    let size: CGFloat

    var body: some View {
        Group {
            if let avatarUrl, let url = URL(string: avatarUrl) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        initials
                    }
                }
            } else {
                initials
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var initials: some View {
        Circle()
            .fill(color)
            .overlay(
                Text(getInitials(displayName))
                    .font(.barlow(size * 0.38, weight: .bold))
                    .foregroundStyle(.white)
            )
    }

    private func getInitials(_ name: String) -> String {
        name.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined().uppercased()
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

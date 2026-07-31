import SwiftUI

/// Ports src/components/scores/BirdieCelebration.tsx — shown when a player logs
/// a 2 on a par-3 (a "dice roll"). Auto-dismisses after 3.5s.
struct BirdieCelebrationView: View {
    let playerName: String
    let hole: Int
    let onDismiss: () -> Void

    @State private var appeared = false
    @State private var bounce = false
    @State private var shimmer = false

    var body: some View {
        Color.black.opacity(appeared ? 0.88 : 0)
            .ignoresSafeArea()
            .onTapGesture(perform: onDismiss)
            .overlay {
                card
                    .scaleEffect(appeared ? 1 : 0.8)
                    .opacity(appeared ? 1 : 0)
            }
            .onAppear {
                withAnimation(.easeOut(duration: 0.2)) { appeared = true }
                withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) { bounce = true }
                withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { shimmer = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 3.5, execute: onDismiss)
            }
    }

    private var card: some View {
        VStack(spacing: 0) {
            Text("🎲")
                .font(.system(size: 76))
                .offset(y: bounce ? -18 : 0)
                .rotationEffect(.degrees(bounce ? -14 : 0))
                .scaleEffect(bounce ? 1.1 : 1)

            Text("BIRDIE!")
                .font(.anton(32))
                .foregroundStyle(Theme.diceAmber)
                .tracking(2)
                .opacity(shimmer ? 1 : 0.6)
                .padding(.top, 18)

            Text("PAR 3 · HOLE \(hole)")
                .font(.jbMono(11))
                .foregroundStyle(Theme.diceAmber.opacity(0.7))
                .tracking(2)
                .padding(.top, 4)

            Text(playerName)
                .font(.barlow(17, weight: .bold))
                .foregroundStyle(.white)
                .padding(.top, 14)

            Text("Dice roll earned at the\nend of the round!")
                .font(.barlow(13))
                .foregroundStyle(.white.opacity(0.5))
                .multilineTextAlignment(.center)
                .padding(.top, 8)

            Text("TAP ANYWHERE TO DISMISS")
                .font(.jbMono(10))
                .foregroundStyle(.white.opacity(0.25))
                .tracking(1.5)
                .padding(.top, 22)
        }
        .padding(EdgeInsets(top: 36, leading: 44, bottom: 36, trailing: 44))
        .frame(maxWidth: 300)
        .background(
            LinearGradient(
                colors: [Color(hex: 0x1c1a0e), Color(hex: 0x0d1a0d), Color(hex: 0x1a1505)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(Theme.diceAmber, lineWidth: 2))
        .shadow(color: Theme.diceAmber.opacity(0.25), radius: 60)
        .onTapGesture {} // swallow taps so the card itself doesn't dismiss
    }
}

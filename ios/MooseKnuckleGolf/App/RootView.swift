import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authManager: AuthManager

    var body: some View {
        Group {
            if authManager.isLoading {
                ProgressView()
                    .tint(Theme.accent)
            } else if authManager.session != nil {
                LeaderboardView()
            } else {
                SignInView()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.background.ignoresSafeArea())
    }
}

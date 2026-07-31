import SwiftUI

@main
struct MooseKnuckleGolfApp: App {
    @StateObject private var authManager = AuthManager()

    init() {
        Theme.applyNavigationBarAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authManager)
                .tint(Theme.accent)
                .preferredColorScheme(.dark)
                .onOpenURL { url in
                    authManager.handle(url: url)
                }
        }
    }
}

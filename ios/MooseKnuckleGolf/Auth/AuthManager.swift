import Foundation
import Supabase

/// Mirrors src/lib/actions/auth.ts: Google OAuth + phone/SMS OTP only, no email/password.
/// Supabase's Auth client persists the session to Keychain by default and
/// auto-refreshes the access token, so no manual token storage is needed here.
@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var session: Session?
    @Published private(set) var isLoading = true

    let client: SupabaseClient

    init() {
        client = SupabaseClient(
            supabaseURL: AppConfig.supabaseURL,
            supabaseKey: AppConfig.supabaseAnonKey
        )

        Task {
            for await (_, session) in client.auth.authStateChanges {
                self.session = session
                self.isLoading = false
            }
        }
    }

    var accessToken: String? {
        session?.accessToken
    }

    func signInWithGoogle() async throws {
        try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: AppConfig.oauthRedirectURL
        )
    }

    /// Step 1 of phone login. Server only sends a code to numbers already
    /// registered in the `users` table (see sendPhoneOtp in auth.ts) — a
    /// generic error covers that case here too, without leaking which reason.
    func sendPhoneCode(nationalNumber: String) async throws {
        let e164 = "+1\(nationalNumber)"
        try await client.auth.signInWithOTP(phone: e164)
    }

    func verifyPhoneCode(nationalNumber: String, code: String) async throws {
        let e164 = "+1\(nationalNumber)"
        try await client.auth.verifyOTP(phone: e164, token: code, type: .sms)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    /// Handles the callback URL after ASWebAuthenticationSession completes.
    func handle(url: URL) {
        Task { try? await client.auth.session(from: url) }
    }
}

import Foundation

/// Same values as the web app's NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
/// (safe to embed client-side — anon key, not service role).
enum AppConfig {
    static let supabaseURL = URL(string: "https://kynzhyvrtpjvanosjrpy.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5bnpoeXZydHBqdmFub3NqcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTY0ODgsImV4cCI6MjA4Njg3MjQ4OH0.vaad_FG1rgDpXkujCR0WFmf_oIvEoNsveLE_l9vyjZM"

    /// Base URL for the deployed Next.js app's /api/mobile/* routes.
    /// localhost:3000 works from the Simulator when `npm run dev` is running on this Mac
    /// (Simulator shares the host network stack) — swap for the deployed URL for device testing.
    static let apiBaseURL = URL(string: "http://localhost:3000")!

    /// Must match the CFBundleURLSchemes entry in project.yml and the
    /// Supabase Dashboard's allowed redirect URLs.
    static let oauthRedirectURL = URL(string: "mooseknucklegolf://auth-callback")!
}

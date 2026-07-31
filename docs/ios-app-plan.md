# iOS Native App for Scoring & Leaderboard

## Context

The league wants a native iOS app so players can check the leaderboard and enter scores from their phones, without wrapping the Next.js site in a WebView. The existing app has no REST API — pages are Server Components querying Supabase directly, and all writes go through Server Actions in `src/lib/actions/`. An iOS app can't call a Server Action directly, and (this was the key research finding) it can't safely write to Supabase directly either: RLS is deliberately wide open. `supabase/migrations/20260301000012_fix_rls_policies.sql:1-2` says outright *"allow authenticated users to write to all tables. Admin/permission checks are enforced in server actions, not RLS."* Concretely, any authenticated user's JWT could currently INSERT/UPDATE any row in `scores`, `round_points`, `handicaps`, etc. — there's no foursome-membership, round-status, or admin check at the database layer. All of that lives only in TypeScript in `src/lib/actions/scores.ts`.

The good news: the codebase already has the right template for this. `src/app/api/mobile/availability/route.ts` is an existing Bearer-token-authenticated API route (not a Server Action) that validates a Supabase access token via `supabase.auth.getUser(token)` and then proceeds with normal DB calls. This plan extends that same pattern to leaderboard and scoring, rather than inventing a new mechanism.

Decisions from the user: distribute via **TestFlight only** (no public App Store listing), support **read + write scoring** (not read-only), and produce **one phased plan** covering both the backend hardening and the iOS app.

## Architecture

- **Auth**: iOS app uses the Supabase Swift SDK (`supabase-swift`) purely for authentication — Google OAuth (via `ASWebAuthenticationSession`, same `signInWithOAuth` flow as `src/lib/actions/auth.ts:97-116`) and phone/SMS OTP (`signInWithOtp`/`verifyOtp`, mirroring `src/components/auth/phone-login-form.tsx` + `auth.ts:11-79`). Session tokens stored in Keychain. No email/password exists in this app and iOS shouldn't add one.
- **Data access**: NOT direct Supabase reads/writes from the iOS app in general. Instead, the access token from Supabase Auth is sent as `Authorization: Bearer <token>` to Next.js API routes under `src/app/api/mobile/`, following the pattern in `src/app/api/mobile/availability/route.ts`. This keeps every authorization rule (foursome membership, round status, admin-only actions) enforced server-side in one place, same as the web app today.
- **Exception**: the season leaderboard RPC (`get_season_leaderboard`, called via `src/lib/data/leaderboard.ts:11-25`) is read-only, has no sensitive logic, and RLS already allows public reads on the underlying tables — this one is safe to call directly from the Supabase Swift SDK if desired, but for consistency and to reuse the existing caching (`unstable_cache`, tag `standings`), it's routed through the API layer too.
- **No realtime today**: the web app has zero `supabase.channel(...)` subscriptions — everything is Server Action + `revalidatePath`/`revalidateTag`. iOS should follow suit initially: pull-to-refresh plus a short poll interval (e.g. 30s) while a round is `in_progress`. Real Supabase Realtime subscriptions are a valid future enhancement, not required for v1.
- **Scope carve-out that simplifies things**: admin-only actions (`finalizeRound`, `linkMakeupScore`, `recalculateAllHandicaps`, `saveScore` from the admin panel) stay web-only. iOS only needs the player-facing paths: `submitMyScore` and `submitScoreForFoursome`. The heavy stuff — points calculation cascade, handicap recalculation — never needs a mobile equivalent.

## Phase 1 — Backend: `/api/mobile/*` routes (Next.js side) — ✅ DONE

Shipped in PR #2 (branch `claude/ios-scoring-leaderboard-app-jhq9f5`). Three new routes, all authenticated the same way as the pre-existing `/api/mobile/availability`:

1. **`GET /api/mobile/leaderboard?year=`** — wraps `getSeasonStandings(year)` (`src/lib/data/leaderboard.ts`).
2. **`GET /api/mobile/rounds/[id]/scores`** — wraps `getRoundScores(roundId)` (`src/lib/data/round-scores.ts`) and returns **pre-computed net scores and rankings** for front-9/back-9/full-round views (via `src/lib/scorecard/compute.ts`), so the mobile client never needs to reimplement the front-9-only net-score quirk or stroke-index math — it just renders numbers the API already computed.
3. **`POST /api/mobile/scores`** — score submission (self or foursome-teammate), sharing validation/business logic with the web Server Actions via `src/lib/scores/submit.ts` and `src/lib/scores/netScore.ts` (foursome-membership check, round-status gate, hole-count validation/padding, net-score calculation — one source of truth instead of duplicated across three call sites).

Shared helper: `src/lib/supabase/mobile.ts` exports `getBearerUser(request)`, used by all four mobile routes (including the pre-existing availability one, refactored to match).

**Remaining before iOS can rely on it**: manual verification against a real player's Supabase access token (see Verification section below) hasn't been run yet — do this first when picking the work back up, ideally before or alongside Phase 2.

## Phase 2 — iOS app scaffold + auth — ✅ SCAFFOLDED (unverified — see below)

- SwiftUI project lives at `ios/` in this repo (xcodegen-generated from `ios/project.yml`; regenerate with `xcodegen generate` after editing `project.yml`, e.g. after adding new source files/groups).
- `ios/MooseKnuckleGolf/Auth/AuthManager.swift` wraps `supabase-swift`'s `SupabaseClient.auth`: Google OAuth via `signInWithOAuth(provider: .google, ...)` (uses `ASWebAuthenticationSession` internally on iOS — no manual web-auth-session code needed), phone OTP via `signInWithOTP`/`verifyOTP(type: .sms)`, mirroring `auth.ts`'s `+1<10-digit>` E.164 format. Session persistence + auto-refresh + Keychain storage are handled by the SDK's defaults, not custom code.
- `ios/MooseKnuckleGolf/Auth/SignInView.swift` — Google button + two-step phone flow (send code → enter code), matching the web's 10-digit/6-digit validation shape.
- `ios/MooseKnuckleGolf/Config/AppConfig.swift` — placeholder Supabase URL/anon key/API base URL/OAuth redirect scheme; **fill in real values before running**.
- `ios/MooseKnuckleGolf/Networking/APIClient.swift` — thin generic `URLSession` + `Bearer` client (get/post + JSON decode), ready for Phase 3/4 endpoint calls; doesn't yet implement the leaderboard/scores methods themselves.

**Build verified**: full Debug build (compile + link, real `Supabase` SDK, not just syntax check) succeeds under Xcode-beta 27.0 — the only Xcode currently on this Mac; plain Xcode 26.6 previously installed here was missing the iOS 26.5 simulator runtime and its `xcodebuild` couldn't resolve any Simulator destination. Build command: `xcodebuild -project ios/MooseKnuckleGolf.xcodeproj -scheme MooseKnuckleGolf -destination 'platform=iOS Simulator,name=iPhone 17' build` with `xcode-select` pointed at `/Applications/Xcode-beta.app/Contents/Developer`.

**Not yet verified**: actually running/screenshotting the app. Xcode-beta 27.0 ships `DeviceHub.app` instead of the classic `Simulator.app` in `Contents/Applications`, and Claude Code's iOS Simulator tool only knows how to drive `Simulator.app` — it can't attach, launch, or screenshot against DeviceHub. User opted to skip visual verification for now rather than install a stable (non-beta) Xcode or drive DeviceHub via generic screen-control tools. Revisit before Phase 5 (real-device/TestFlight testing) — either a stable Xcode release ships by then, or the sim tool adds DeviceHub support.

## Phase 3 — Leaderboard screens (read) — ✅ DONE (build verified, unrun in Simulator)

- `LeaderboardView.swift`: season standings + rounds list, sourced from `GET /api/mobile/leaderboard`. Pull-to-refresh via `.refreshable`.
- `RoundDetailView.swift`: round detail/scorecard, sourced from `GET /api/mobile/rounds/[id]/scores` — front/back/full segmented control renders the pre-computed net scores/rankings from Phase 1, no client-side ranking math.
- **Backend addition beyond the original Phase 1 scope**: `GET /api/mobile/leaderboard` now also returns a `rounds` array (id/round_number/round_date/status/tee_time, non-cancelled, current season, newest first) — the original three routes had no way to discover round IDs to navigate into, so this was needed for the detail screen to be reachable at all.
- **Scope-narrowed from the original plan text**: no hole-by-hole tile grid. `buildSection` in `src/app/api/mobile/rounds/[id]/scores/route.ts` only returns per-player summary fields (gross/net/parSum/played/netToPar), not `hole_scores` — so a hole grid isn't actually buildable from this response today, and `HOLE_PARS` ends up unused on the Swift side. Revisit if hole-by-hole becomes a real requirement (would mean adding `hole_scores` to the API response).
- New files: `ios/MooseKnuckleGolf/Models/{LeaderboardModels,RoundScoresModels}.swift`, `ios/MooseKnuckleGolf/Support/Formatting.swift`, `ios/MooseKnuckleGolf/Leaderboard/{LeaderboardView,RoundDetailView}.swift`. `RootView.swift` now routes signed-in users straight to `LeaderboardView` instead of the placeholder.
- Build verified the same way as Phase 2 (`xcodebuild ... build`, Xcode-beta 27.0) — succeeds. Not yet run/screenshotted in Simulator, same DeviceHub blocker noted in Phase 2.

## Phase 4 — Scoring entry (write) — ✅ DONE (build verified, unrun in Simulator)

- `ScoreEntryView.swift`: one-hole-at-a-time entry (hole nav + tappable 18-hole strip), stepper per player, 700ms debounced autosave per player (`Task` cancel/reschedule, mirrors the web's per-player debounce), save-state indicator (saving/saved/error). Reachable from `RoundDetailView`'s toolbar ("Enter Scores") when `round.status` is `in_progress` or `scoring`.
- **Backend addition beyond the original Phase 1 scope**: new `GET /api/mobile/rounds/[id]/foursome` route — none of the existing mobile routes exposed foursome membership or raw per-hole `hole_scores`, both required for entry (self + teammate). Mirrors the query in `src/app/(authenticated)/scores/[roundId]/page.tsx`. Handicap is `NUMERIC(4,1)` in the DB, decoded as `Double` (same class of bug hit and fixed in Phase 3's `total_points`).
- Submits to `POST /api/mobile/scores` (`SubmitScoreBody`: `roundId`, `holeScores` [18, untouched holes = 0], `targetUserId`/`targetSubId` — omitted for the caller's own score, set for a foursome teammate) — server enforces round-status and foursome-membership exactly as today, no duplicated logic client-side.
- `Course.holePars`/`Course.strokeIndex` ported to Swift (`ios/MooseKnuckleGolf/Support/Course.swift`) for display only (par/HCP header, "stroke" tag) — confirmed safe since `computeNetScore` in `src/lib/scores/netScore.ts` doesn't use per-hole stroke index either, it's cosmetic on the web too.
- Skipped: birdie celebration (explicitly optional in this plan), the web's dice-roll strip and per-hole color grading — functional parity, not visual parity.
- New files: `ios/MooseKnuckleGolf/Models/FoursomeModels.swift`, `ios/MooseKnuckleGolf/Support/Course.swift`, `ios/MooseKnuckleGolf/Scoring/ScoreEntryView.swift`.
- Build verified via `xcodebuild`, not run in Simulator (DeviceHub blocker, confirmed still active as of Phase 3).

## Phase 5 — TestFlight distribution

- Apple Developer Program enrollment ($99/yr) if not already in place.
- App Store Connect record + internal TestFlight group (no public listing, no App Review needed for internal testers — up to 100 via App Store Connect Users and Roles).
- Since TestFlight builds still need an app icon, launch screen, and minimal privacy-nutrition-label answers even without a public listing, budget a small amount of time for those.

## Verification

- **Phase 1** (do this first): hit the new routes with `curl -H "Authorization: Bearer <token>"` using a real player's access token (obtainable via the existing web login flow's session), confirm responses match what the web leaderboard/scorecard show, and confirm a request with someone else's foursome is rejected by `POST /api/mobile/scores`.
- **Phases 2–4**: run the iOS app in the Simulator against the deployed Supabase project + Next.js API, sign in with a test account (Google or phone OTP), confirm leaderboard data matches web, submit a test score for an `in_progress` round and confirm it appears identically in the web scorecard view.
- **Before Phase 5**: do a real device test via an ad-hoc/TestFlight internal build with at least one non-developer player.

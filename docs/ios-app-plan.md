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

## Phase 2 — iOS app scaffold + auth

- New SwiftUI project (separate repo or `/ios` folder in this repo — your call; nothing in Xcode requires monorepo layout, but keeping it alongside the backend keeps the API contract easy to cross-reference).
- Integrate `supabase-swift` for auth only: Google OAuth sign-in, phone OTP sign-in (send + verify), Keychain-backed session persistence, auto-refresh.
- App config holds `NEXT_PUBLIC_SUPABASE_URL`/anon key (safe to embed, same as the web client) and the deployed site's base URL for hitting `/api/mobile/*`.
- Build a thin networking layer (`URLSession` + `Bearer` header) mirroring the existing mobile-availability call pattern.

## Phase 3 — Leaderboard screens (read)

- Season standings list, sourced from `GET /api/mobile/leaderboard`.
- Round detail/scorecard view, sourced from `GET /api/mobile/rounds/[id]/scores` — renders the pre-computed net scores/rankings from Phase 1 (no business logic in Swift).
- Uses `HOLE_PARS` (`src/lib/constants/course.ts`) only for display of par per hole, not for any scoring math (that stays server-side).

## Phase 4 — Scoring entry (write)

- Hole-by-hole score entry screen mirroring `src/components/scores/hole-by-hole-scorecard.tsx`'s UX (enter own score, or a teammate's score if in the same foursome).
- Submits to `POST /api/mobile/scores`; server enforces round-status and foursome-membership exactly as today.
- Optional: port the birdie celebration (`src/components/scores/BirdieCelebration.tsx`) as a native equivalent — nice-to-have, not required for parity.

## Phase 5 — TestFlight distribution

- Apple Developer Program enrollment ($99/yr) if not already in place.
- App Store Connect record + internal TestFlight group (no public listing, no App Review needed for internal testers — up to 100 via App Store Connect Users and Roles).
- Since TestFlight builds still need an app icon, launch screen, and minimal privacy-nutrition-label answers even without a public listing, budget a small amount of time for those.

## Verification

- **Phase 1** (do this first): hit the new routes with `curl -H "Authorization: Bearer <token>"` using a real player's access token (obtainable via the existing web login flow's session), confirm responses match what the web leaderboard/scorecard show, and confirm a request with someone else's foursome is rejected by `POST /api/mobile/scores`.
- **Phases 2–4**: run the iOS app in the Simulator against the deployed Supabase project + Next.js API, sign in with a test account (Google or phone OTP), confirm leaderboard data matches web, submit a test score for an `in_progress` round and confirm it appears identically in the web scorecard view.
- **Before Phase 5**: do a real device test via an ad-hoc/TestFlight internal build with at least one non-developer player.

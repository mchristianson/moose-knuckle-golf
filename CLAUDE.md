# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Rules

- Never use `<>` shorthand fragments. Always use `<React.Fragment key={...}>` (keyed lists) or `<React.Fragment>` (unkeyed). This prevents the "key prop" warning when fragments are used in `.map()`.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint validation
```

No test suite is configured.

Do not run `npm run build` to verify compilation. The user will do that manually.

## Architecture

This is a **Next.js 15 App Router** application for managing a competitive golf league. It uses React Server Components + Server Actions as the primary data layer (no REST API routes). The database is **PostgreSQL via Supabase**.

### Route Groups

- `(public)/` — Unauthenticated pages: leaderboard, foursomes, manual, admin-manual
- `(auth)/` — Login, register, OAuth callback
- `(authenticated)/` — Dashboard, availability, scoring, profile
- `(admin)/` — Admin-only: rounds, teams, foursomes, users, subs, audit log, handicaps

Route protection is enforced in `middleware.ts`, which reads the Supabase session and checks `users.is_admin` for admin routes.

### Data Flow

Pages are Server Components that query Supabase directly. Forms call Server Actions in `src/lib/actions/`. Server Actions validate with Zod, write to Supabase, then call `revalidatePath()` to refresh data. There is no client-side state management library.

Supabase client selection matters:
- `src/lib/supabase/server.ts` — use in Server Components and Server Actions (cookie-based session)
- `src/lib/supabase/client.ts` — use in Client Components
- `src/lib/supabase/admin.ts` — use when bypassing RLS (admin operations only)

### Database Schema

Key tables and their relationships:
- `users` — extends Supabase auth; has `is_admin`, `is_active` flags
- `teams` → `team_members` — 8 teams per season, 1–2 members each
- `rounds` — lifecycle: `scheduled → availability_open → foursomes_set → in_progress → scoring → completed`; `round_type` is `regular` or `practice`
- `round_availability` — per-player "in"/"out"/undeclared for each round
- `round_team_declarations` — which golfer represents a team in a round
- `foursomes` → `foursome_members` — two groups of 4 per round, with `tee_time_slot` (1 or 2) and `cart_number` (1 or 2)
- `scores` — 18-hole scorecard (`hole_scores` is an 18-element array; holes 1–9 required, 10–18 optional); `gross_score` is a database-generated column (sum of `hole_scores`)
- `round_points` — points/finish position per team per round
- `subs` / `round_subs` — substitute player pool
- `handicaps` / `handicap_history` — current handicap per player with full calculation history

The season leaderboard is computed via a Supabase RPC: `get_season_leaderboard(season_year)`. Practice rounds are excluded from both the leaderboard and handicap calculations.

### Foursome Generation

`src/lib/algorithms/foursome-generator.ts` uses a greedy approach: 100 random shuffles of the 8 declared golfers, scored by number of repeat historical pairings. The lowest-score assignment wins. Foursomes are two groups of 4 with 2 carts of 2 within each group.

### Scoring

Scorecards support 18 holes. `hole_scores` is an 18-element integer array; holes 10–18 default to 0 and are optional. `src/lib/constants/course.ts` defines `HOLE_PARS` (18 values) and `STROKE_INDEX` (stroke index per hole) for Legend's Course.

Makeup scores: a player who missed a prior round can submit a makeup scorecard during any later round. The admin links it to the missed round via the makeup assignment panel (`src/components/scores/makeup-assignment-panel.tsx`). Makeup scores count toward handicap but not round points.

Birdie celebration: `src/components/scores/BirdieCelebration.tsx` renders a full-screen overlay when a player scores a birdie on a par-3 hole during score entry. Auto-dismisses after 3.5 seconds.

The leaderboard (`/leaderboard`) shows season standings plus per-round scorecards. `src/components/leaderboard/RoundScorecard.tsx` renders hole-by-hole scores with net score calculation (handicap strokes distributed via `STROKE_INDEX`). Individual round leaderboards are accessible at `/leaderboard/[roundId]`.

### Admin Impersonation

Admins can impersonate any active player via `/admin/users`. The session is stored in the `mgk_impersonate` cookie. `src/lib/viewer.ts` exports `getViewerContext()`, which all authenticated pages should use instead of reading the Supabase user directly — it returns the effective user (real or impersonated) and the appropriate DB client. Impersonation events are written to `audit_log`.

`src/components/ImpersonationBanner.tsx` shows a banner when impersonation is active. Server actions for impersonation live in `src/lib/actions/impersonation.ts`.

### Handicaps

`/admin/handicaps` (admin-only) shows each player's current handicap with an expandable breakdown of their last 10 eligible scores. A "Recalculate All" button triggers a server action that recomputes every player's handicap. Manual overrides are supported and flagged in `handicaps.is_manual_override`. The `handicap_history` table tracks every change.

### Weather

`src/lib/weather.ts` fetches a 16-day forecast from Open-Meteo for the course location and returns temperature, cloud cover, and rain probability for a given date. The dashboard displays weather tiles for the next upcoming round. Requires `WEATHER_LAT` and `WEATHER_LNG` in `.env.local`.

### Calendar Feed

`GET /api/calendar` returns an iCal feed of all non-cancelled rounds. Players can subscribe to this URL in their calendar app. Tee times are rendered in `America/Chicago` timezone; rounds without a tee time are all-day events.

### User Manual

`/manual` (public) is a player-facing guide explaining league rules and app usage. `/admin-manual` (public) is admin-specific guidance. Both are static pages with no data fetching.

### PWA

`src/app/manifest.ts` configures the app as a PWA (standalone display, MK Golf theme color `#1B4D2E`). The app is mobile-first and designed to be installed as a home-screen app.

### Environment Variables

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
WEATHER_LAT=          # optional — enables weather tiles on dashboard
WEATHER_LNG=          # optional — enables weather tiles on dashboard
```

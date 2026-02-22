# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint validation
```

No test suite is configured.

## Architecture

This is a **Next.js 15 App Router** application for managing a competitive golf league. It uses React Server Components + Server Actions as the primary data layer (no REST API routes). The database is **PostgreSQL via Supabase**.

### Route Groups

- `(public)/` — Unauthenticated pages: leaderboard, foursomes, handicaps
- `(auth)/` — Login, register, OAuth callback
- `(authenticated)/` — Dashboard, availability, scoring, profile
- `(admin)/` — Admin-only: rounds, teams, foursomes, users, subs, audit log

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
- `rounds` — lifecycle: `scheduled → availability_open → foursomes_set → in_progress → scoring → completed`
- `round_availability` — per-player "in"/"out"/undeclared for each round
- `round_team_declarations` — which golfer represents a team in a round
- `foursomes` → `foursome_members` — two groups of 4 per round, with `tee_time_slot` (1 or 2) and `cart_number` (1 or 2)
- `scores` — 9-hole scorecard; `gross_score` is a database-generated column (sum of `hole_scores`)
- `round_points` — points/finish position per team per round
- `subs` / `round_subs` — substitute player pool

The season leaderboard is computed via a Supabase RPC: `get_season_leaderboard(season_year)`.

### Foursome Generation

`src/lib/algorithms/foursome-generator.ts` uses a greedy approach: 100 random shuffles of the 8 declared golfers, scored by number of repeat historical pairings. The lowest-score assignment wins. Foursomes are two groups of 4 with 2 carts of 2 within each group.

### Environment Variables

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

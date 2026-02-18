# Moose Knuckle Golf League Management App

A mobile-first web application to manage the Moose Knuckle Golf League with team availability, foursome assignments, live scoring, handicap tracking, and season standings.

## Tech Stack

- **Next.js 15+** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** for PostgreSQL database and authentication
- **Zod** for validation

## Getting Started

### 1. Set up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Database Migrations

In the Supabase dashboard, go to **SQL Editor** and run each migration file in order:

1. `20260301000000_create_users.sql` - Users table
2. `20260301000001_create_teams.sql` - Teams and team_members tables
3. `20260301000002_create_rounds.sql` - Rounds table
4. `20260301000003_create_availability.sql` - Round availability tracking
5. `20260301000004_create_subs.sql` - Substitute pool
6. `20260301000005_create_foursomes.sql` - Foursome assignments
7. `20260301000006_create_scores.sql` - Hole-by-hole scoring
8. `20260301000007_create_handicaps.sql` - Handicap tracking
9. `20260301000008_create_points.sql` - Points and leaderboard
10. `20260301000009_create_audit_log.sql` - Admin action logging
11. `20260301000010_create_functions.sql` - Database functions
12. `20260301000011_create_auth_trigger.sql` - **IMPORTANT** Auto-create user profiles on signup
13. `20260301000012_fix_rls_policies.sql` - **IMPORTANT** Allow authenticated users to write data
14. `20260301000013_seed_users.sql` - Optional: Add users manually (template provided)
15. `20260301000014_add_tee_time_to_rounds.sql` - Add tee time tracking to rounds

**Or** use the Supabase CLI for faster migration:
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Verify tables were created in **Table Editor**.

### 4. Configure Google OAuth (Optional)

If you want to enable Google sign-in:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Google**
3. Follow the instructions to create OAuth credentials in Google Cloud Console
4. Add the credentials to Supabase

### 5. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Phase 1 Complete ✅

The following features are now working:

- ✅ Next.js 15 project with TypeScript and Tailwind CSS
- ✅ Supabase authentication (email/password + Google OAuth)
- ✅ User registration and login
- ✅ Protected routes with middleware
- ✅ Admin flag support
- ✅ User dashboard
- ✅ Database migration for users table

## Phase 2 Complete ✅

**Database schema and admin team management features:**

- ✅ All database migrations created (11 migration files)
- ✅ Teams table with 1-2 member constraint
- ✅ Rounds, availability, subs, foursomes, scores, handicaps, points tables
- ✅ Database functions for season leaderboard and handicap calculation
- ✅ Admin dashboard with navigation sidebar
- ✅ Team CRUD operations (create, read, update, delete)
- ✅ Team member assignment (drag-drop interface)
- ✅ User management (list, toggle admin, activate/deactivate)
- ✅ Audit logging for all admin actions
- ✅ Admin-only route protection

## Testing Phase 1

### Test Email/Password Registration

1. Go to http://localhost:3000
2. You'll be redirected to `/leaderboard` (public page)
3. Click **Login** → **Register**
4. Create an account with email and password
5. You should be redirected to `/dashboard`
6. Verify your name and email appear
7. Click **Sign Out**

### Test Login

1. Click **Login**
2. Enter your credentials
3. You should be redirected to `/dashboard`

### Test Protected Routes

1. Sign out
2. Try to access http://localhost:3000/dashboard directly
3. You should be redirected to `/login`

### Make Yourself Admin

1. Go to Supabase dashboard → **Table Editor** → **users**
2. Find your user record
3. Set `is_admin` to `true`
4. Refresh your dashboard
5. You should see an "Admin" badge and an "Admin" link in the navigation

## Testing Phase 2

After running all migrations and making yourself admin:

### Test Team Management

1. Go to http://localhost:3000/admin
2. Click **Teams** in the sidebar
3. Click **+ Create Team**
4. Create Team 1 with a name like "The Birdies"
5. Add 1-2 members to the team from the dropdown
6. Repeat to create all 8 teams

### Test User Management

1. Go to **Users** in the admin sidebar
2. Toggle admin access for another user (if you have multiple accounts)
3. Verify audit log shows the action

### Test Audit Log

1. Go to **Audit Log** in the admin sidebar
2. See all your recent admin actions logged with timestamps

## Next Steps

Phase 3 will add:
- Round creation and management
- Availability declaration system
- Weekly scheduling

## Project Structure

```
src/
├── app/
│   ├── (public)/        # Public pages (no auth required)
│   ├── (auth)/          # Login/register pages
│   └── (authenticated)/ # Protected pages (login required)
├── components/
│   └── auth/            # Auth-related components
└── lib/
    ├── supabase/        # Supabase clients
    ├── actions/         # Server Actions
    └── validators/      # Zod schemas
```

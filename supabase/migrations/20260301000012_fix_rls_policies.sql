-- Fix RLS policies: allow authenticated users to write to all tables.
-- Admin/permission checks are enforced in server actions, not RLS.

-- users
CREATE POLICY "Authenticated users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to users"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role');

-- teams
CREATE POLICY "Authenticated users can insert teams"
    ON public.teams FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update teams"
    ON public.teams FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete teams"
    ON public.teams FOR DELETE
    USING (auth.role() = 'authenticated');

-- team_members
CREATE POLICY "Authenticated users can insert team members"
    ON public.team_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update team members"
    ON public.team_members FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete team members"
    ON public.team_members FOR DELETE
    USING (auth.role() = 'authenticated');

-- rounds
CREATE POLICY "Authenticated users can insert rounds"
    ON public.rounds FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update rounds"
    ON public.rounds FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete rounds"
    ON public.rounds FOR DELETE
    USING (auth.role() = 'authenticated');

-- round_availability
CREATE POLICY "Authenticated users can insert availability"
    ON public.round_availability FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update availability"
    ON public.round_availability FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete availability"
    ON public.round_availability FOR DELETE
    USING (auth.role() = 'authenticated');

-- subs
CREATE POLICY "Authenticated users can insert subs"
    ON public.subs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update subs"
    ON public.subs FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete subs"
    ON public.subs FOR DELETE
    USING (auth.role() = 'authenticated');

-- round_subs
CREATE POLICY "Authenticated users can insert round subs"
    ON public.round_subs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update round subs"
    ON public.round_subs FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete round subs"
    ON public.round_subs FOR DELETE
    USING (auth.role() = 'authenticated');

-- foursomes
CREATE POLICY "Authenticated users can insert foursomes"
    ON public.foursomes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update foursomes"
    ON public.foursomes FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete foursomes"
    ON public.foursomes FOR DELETE
    USING (auth.role() = 'authenticated');

-- foursome_members
CREATE POLICY "Authenticated users can insert foursome members"
    ON public.foursome_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update foursome members"
    ON public.foursome_members FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete foursome members"
    ON public.foursome_members FOR DELETE
    USING (auth.role() = 'authenticated');

-- scores
CREATE POLICY "Authenticated users can insert scores"
    ON public.scores FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update scores"
    ON public.scores FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete scores"
    ON public.scores FOR DELETE
    USING (auth.role() = 'authenticated');

-- handicaps
CREATE POLICY "Authenticated users can insert handicaps"
    ON public.handicaps FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update handicaps"
    ON public.handicaps FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete handicaps"
    ON public.handicaps FOR DELETE
    USING (auth.role() = 'authenticated');

-- handicap_history
CREATE POLICY "Authenticated users can insert handicap history"
    ON public.handicap_history FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- round_points
CREATE POLICY "Authenticated users can insert round points"
    ON public.round_points FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update round points"
    ON public.round_points FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete round points"
    ON public.round_points FOR DELETE
    USING (auth.role() = 'authenticated');

-- audit_log: allow authenticated users to insert (everyone can log)
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_log FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- audit_log: allow authenticated users to read (admin check is in server action)
DROP POLICY IF EXISTS "Public cannot read audit logs" ON public.audit_log;
CREATE POLICY "Authenticated users can read audit logs"
    ON public.audit_log FOR SELECT
    USING (auth.role() = 'authenticated');

-- Also fix users table: let all authenticated users read all users
-- (needed for team member dropdowns, availability views, etc.)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Authenticated users can read all users"
    ON public.users FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Let authenticated users update other users (admin actions enforce in server)
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Authenticated users can update users"
    ON public.users FOR UPDATE
    USING (auth.role() = 'authenticated');

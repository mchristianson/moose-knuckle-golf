-- Add a unique constraint on (round_id, team_id) so each team can only
-- have one sub per round. This is needed for reliable upsert behaviour
-- in the admin sub-assignment flow.
ALTER TABLE public.round_subs
    ADD CONSTRAINT round_subs_round_team_unique UNIQUE (round_id, team_id);

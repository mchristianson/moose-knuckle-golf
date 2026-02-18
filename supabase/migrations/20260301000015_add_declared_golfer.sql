-- Track which team member is declared as the playing golfer for each round.
-- Any authenticated user can set this for any team.
CREATE TABLE public.round_team_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    declared_golfer_id UUID NOT NULL REFERENCES public.users(id),
    declared_by UUID NOT NULL REFERENCES public.users(id),
    declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, team_id)
);

CREATE INDEX idx_round_team_declarations_round ON public.round_team_declarations(round_id);

CREATE TRIGGER set_round_team_declarations_updated_at
    BEFORE UPDATE ON public.round_team_declarations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.round_team_declarations ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read round team declarations"
    ON public.round_team_declarations
    FOR SELECT
    USING (true);

-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert round team declarations"
    ON public.round_team_declarations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update round team declarations"
    ON public.round_team_declarations
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete round team declarations"
    ON public.round_team_declarations
    FOR DELETE
    USING (auth.role() = 'authenticated');

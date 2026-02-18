-- Create round_points table
CREATE TABLE public.round_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    net_score NUMERIC(4,1),
    finish_position INTEGER,
    points_earned NUMERIC(4,1) NOT NULL DEFAULT 0,
    is_tied BOOLEAN NOT NULL DEFAULT FALSE,
    tied_with_teams UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, team_id)
);

-- Create indexes
CREATE INDEX idx_round_points_round ON public.round_points(round_id);
CREATE INDEX idx_round_points_team ON public.round_points(team_id);

-- Apply updated_at trigger
CREATE TRIGGER set_round_points_updated_at
    BEFORE UPDATE ON public.round_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.round_points ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read round points"
    ON public.round_points
    FOR SELECT
    USING (true);

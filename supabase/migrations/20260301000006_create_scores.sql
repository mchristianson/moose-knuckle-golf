-- Create scores table
CREATE TABLE public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    hole_scores INTEGER[] NOT NULL DEFAULT '{}',
    gross_score INTEGER GENERATED ALWAYS AS (
        COALESCE(hole_scores[1], 0) + COALESCE(hole_scores[2], 0) +
        COALESCE(hole_scores[3], 0) + COALESCE(hole_scores[4], 0) +
        COALESCE(hole_scores[5], 0) + COALESCE(hole_scores[6], 0) +
        COALESCE(hole_scores[7], 0) + COALESCE(hole_scores[8], 0) +
        COALESCE(hole_scores[9], 0)
    ) STORED,
    handicap_at_time NUMERIC(4,1),
    net_score NUMERIC(4,1),
    is_sub BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    is_makeup BOOLEAN NOT NULL DEFAULT FALSE,
    covers_missed_round_id UUID REFERENCES public.rounds(id),
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, user_id)
);

-- Create indexes
CREATE INDEX idx_scores_round ON public.scores(round_id);
CREATE INDEX idx_scores_user ON public.scores(user_id);
CREATE INDEX idx_scores_team_round ON public.scores(round_id, team_id);

-- Validate exactly 9 hole scores on lock
CREATE OR REPLACE FUNCTION validate_score_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_locked = TRUE AND array_length(NEW.hole_scores, 1) != 9 THEN
        RAISE EXCEPTION 'Cannot lock score: exactly 9 hole scores required';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_score_before_lock
    BEFORE UPDATE ON public.scores
    FOR EACH ROW
    WHEN (NEW.is_locked = TRUE AND OLD.is_locked = FALSE)
    EXECUTE FUNCTION validate_score_submission();

-- Apply updated_at trigger
CREATE TRIGGER set_scores_updated_at
    BEFORE UPDATE ON public.scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read scores"
    ON public.scores
    FOR SELECT
    USING (true);

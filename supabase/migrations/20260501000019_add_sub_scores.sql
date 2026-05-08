-- Allow sub scores: make user_id nullable, add sub_id foreign key
-- Subs are not users, so they can't have user_id; their scores are keyed by sub_id instead.

-- Make user_id nullable (NULL for sub rows)
ALTER TABLE public.scores ALTER COLUMN user_id DROP NOT NULL;

-- Add sub_id column referencing the subs table
ALTER TABLE public.scores ADD COLUMN sub_id UUID REFERENCES public.subs(id) ON DELETE CASCADE;

-- Add index for sub_id lookups
CREATE INDEX idx_scores_sub ON public.scores(sub_id);

-- Partial unique index for sub scores: one score per sub per round
CREATE UNIQUE INDEX scores_round_sub_unique
    ON public.scores (round_id, sub_id)
    WHERE sub_id IS NOT NULL;

-- Enforce that exactly one of user_id or sub_id is set
ALTER TABLE public.scores ADD CONSTRAINT scores_user_or_sub_required
    CHECK (
        (user_id IS NOT NULL AND sub_id IS NULL) OR
        (user_id IS NULL AND sub_id IS NOT NULL)
    );

-- Update handicap eligibility function to use round completion status
-- instead of score lock status, so locking is no longer required
CREATE OR REPLACE FUNCTION get_eligible_scores_for_handicap(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    score_id UUID,
    round_id UUID,
    gross_score INTEGER,
    round_date DATE,
    is_makeup BOOLEAN,
    covers_missed_round_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS score_id,
        s.round_id,
        s.gross_score,
        r.round_date,
        s.is_makeup,
        s.covers_missed_round_id
    FROM public.scores s
    JOIN public.rounds r ON r.id = s.round_id
    WHERE s.user_id = p_user_id
      AND r.status = 'completed'
      AND s.is_sub = FALSE
      AND (
          s.is_makeup = FALSE
          OR (s.is_makeup = TRUE AND s.covers_missed_round_id IS NOT NULL)
      )
    ORDER BY r.round_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

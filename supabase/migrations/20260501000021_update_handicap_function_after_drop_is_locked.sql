-- Update get_eligible_scores_for_handicap function after dropping is_locked column
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
      AND s.is_sub = FALSE
      AND (
          s.is_makeup = FALSE
          OR (s.is_makeup = TRUE AND s.covers_missed_round_id IS NOT NULL)
      )
    ORDER BY r.round_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

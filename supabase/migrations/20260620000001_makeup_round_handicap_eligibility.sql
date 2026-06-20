-- Makeup-round tracking scores must not count toward handicap.
--
-- Players may enter scores during an Open Date / Makeup round (round_type = 'makeup')
-- just to track their round live. Those scores should only count toward a handicap
-- if they are explicitly linked to a missed round via covers_missed_round_id.
--
-- The admin's normal workflow is to enter a player's makeup score directly into the
-- missed (regular) round and recalculate it — those scores live on a 'regular' round
-- and continue to count as before.

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
      -- Scores recorded on a makeup-type round only count when they cover a missed round
      AND (
          r.round_type <> 'makeup'
          OR s.covers_missed_round_id IS NOT NULL
      )
    ORDER BY r.round_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

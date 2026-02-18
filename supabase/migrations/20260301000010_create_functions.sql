-- Season leaderboard function: cumulative points per team
CREATE OR REPLACE FUNCTION get_season_leaderboard(p_season_year INTEGER)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_number INTEGER,
    total_points NUMERIC,
    rounds_played BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS team_id,
        t.team_name,
        t.team_number,
        COALESCE(SUM(rp.points_earned), 0) AS total_points,
        COUNT(rp.id) AS rounds_played
    FROM public.teams t
    LEFT JOIN public.round_points rp ON rp.team_id = t.id
    LEFT JOIN public.rounds r ON r.id = rp.round_id
        AND r.season_year = p_season_year
        AND r.round_type = 'regular'
    WHERE t.season_year = p_season_year
    GROUP BY t.id, t.team_name, t.team_number
    ORDER BY total_points DESC, t.team_number ASC;
END;
$$ LANGUAGE plpgsql;

-- Get eligible scores for handicap calculation
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
      AND s.is_locked = TRUE
      AND s.is_sub = FALSE
      AND (
          s.is_makeup = FALSE
          OR (s.is_makeup = TRUE AND s.covers_missed_round_id IS NOT NULL)
      )
    ORDER BY r.round_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

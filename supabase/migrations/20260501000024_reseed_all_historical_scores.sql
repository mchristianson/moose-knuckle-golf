-- =============================================================================
-- Historical Score Re-Seed — All Players (from LeagueGolfer event 11)
-- =============================================================================
-- SOURCE: https://www.leaguegolfer.com/leagues_cache?leagueid=287&eventnumber=11&title=Handicaps
--
-- Uses AGS (Adjusted Gross Score) — not raw gross — as the effective score
-- stored in hole_scores, since the handicap formula uses gross_score (sum of
-- hole_scores). AGS accounts for ESC adjustments and is what LeagueGolfer uses
-- to compute handicap differentials.
--
-- Hole arrays are distributed uniformly: floor(AGS/9) per hole, with remainder
-- distributed to the first N holes. This keeps gross_score == AGS exactly.
--
-- Run AFTER migration 23 (reset). Safe to re-run (ON CONFLICT DO NOTHING).
-- =============================================================================

-- Helper: generate 9-hole array summing to target
CREATE OR REPLACE FUNCTION tmp_hs(target INTEGER)
RETURNS INTEGER[] AS $$
DECLARE
  b INTEGER := target / 9;   -- integer division (floor)
  x INTEGER := target - b * 9;
BEGIN
  RETURN ARRAY[
    CASE WHEN 1 <= x THEN b+1 ELSE b END,
    CASE WHEN 2 <= x THEN b+1 ELSE b END,
    CASE WHEN 3 <= x THEN b+1 ELSE b END,
    CASE WHEN 4 <= x THEN b+1 ELSE b END,
    CASE WHEN 5 <= x THEN b+1 ELSE b END,
    CASE WHEN 6 <= x THEN b+1 ELSE b END,
    CASE WHEN 7 <= x THEN b+1 ELSE b END,
    CASE WHEN 8 <= x THEN b+1 ELSE b END,
    CASE WHEN 9 <= x THEN b+1 ELSE b END
  ];
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  -- ── User IDs ──────────────────────────────────────────────────────────────
  u_busch    UUID;
  u_matt     UUID;
  u_dupont   UUID;
  u_gillett  UUID;
  u_glims    UUID;
  u_laramy   UUID;
  u_mckinney UUID;
  u_misener  UUID;
  u_ryan     UUID;
  u_sadek    UUID;
  u_slette   UUID;
  u_stelman  UUID;
  u_todd     UUID;   -- Wheatcraft, Todd
  u_aaron    UUID;   -- Wheatcraft, Aaron
  u_nordeen  UUID;   -- Nordeen, Andrew
  u_wolfgang UUID;

  -- ── Team IDs (most recent team per player) ────────────────────────────────
  t_busch    UUID;
  t_matt     UUID;
  t_dupont   UUID;
  t_gillett  UUID;
  t_glims    UUID;
  t_laramy   UUID;
  t_mckinney UUID;
  t_misener  UUID;
  t_ryan     UUID;
  t_sadek    UUID;
  t_slette   UUID;
  t_stelman  UUID;
  t_todd     UUID;
  t_aaron    UUID;
  t_nordeen  UUID;
  t_wolfgang UUID;

  -- ── Round IDs (one per unique league date) ────────────────────────────────
  -- 2022 season (Gillett only)
  r22_1 UUID; r22_2 UUID; r22_3 UUID; r22_4 UUID; r22_5 UUID; r22_6 UUID;

  -- 2023 season
  r23_1  UUID; r23_2  UUID; r23_3  UUID; r23_4  UUID;
  r23_5  UUID; r23_6  UUID; r23_7  UUID; r23_8  UUID;
  r23_9  UUID; r23_10 UUID; r23_11 UUID; r23_12 UUID;

  -- 2024 season
  r24_1  UUID; r24_2  UUID; r24_3  UUID; r24_4  UUID;
  r24_5  UUID; r24_6  UUID; r24_7  UUID; r24_8  UUID;
  r24_9  UUID; r24_10 UUID; r24_11 UUID; r24_12 UUID;

  -- 2025 season
  r25_1  UUID; r25_2  UUID; r25_3  UUID; r25_4  UUID;
  r25_5  UUID; r25_6  UUID; r25_7  UUID; r25_8  UUID;
  r25_9  UUID; r25_10 UUID; r25_11 UUID;

BEGIN

  -- ==========================================================================
  -- 1. Look up user IDs by full_name (ILIKE for case tolerance)
  -- ==========================================================================
  SELECT id INTO u_busch    FROM public.users WHERE full_name ILIKE '%Jay%Busch%'        OR full_name ILIKE '%Busch%Jay%'        LIMIT 1;
  SELECT id INTO u_matt     FROM public.users WHERE full_name ILIKE '%Matt%Christianson%' OR full_name ILIKE '%Christianson%Matt%' LIMIT 1;
  SELECT id INTO u_dupont   FROM public.users WHERE full_name ILIKE '%Max%Dupont%'        OR full_name ILIKE '%Dupont%Max%'        LIMIT 1;
  SELECT id INTO u_gillett  FROM public.users WHERE full_name ILIKE '%Kyle%Gillett%'      OR full_name ILIKE '%Gillett%Kyle%'      LIMIT 1;
  SELECT id INTO u_glims    FROM public.users WHERE full_name ILIKE '%Mike%Glimsdahl%'    OR full_name ILIKE '%Glimsdahl%Mike%'    LIMIT 1;
  SELECT id INTO u_laramy   FROM public.users WHERE full_name ILIKE '%Brian%Laramy%'      OR full_name ILIKE '%Laramy%Brian%'      LIMIT 1;
  SELECT id INTO u_mckinney FROM public.users WHERE full_name ILIKE '%Patrick%McKinney%'  OR full_name ILIKE '%McKinney%Patrick%'  LIMIT 1;
  SELECT id INTO u_misener  FROM public.users WHERE full_name ILIKE '%Denny%Misner%'      OR full_name ILIKE '%Misner%Denny%'      LIMIT 1;
  SELECT id INTO u_ryan     FROM public.users WHERE full_name ILIKE '%Tim%Ryan%'          OR full_name ILIKE '%Ryan%Tim%'          LIMIT 1;
  SELECT id INTO u_sadek    FROM public.users WHERE full_name ILIKE '%Josh%Sadek%'        OR full_name ILIKE '%Sadek%Josh%'        LIMIT 1;
  SELECT id INTO u_slette   FROM public.users WHERE full_name ILIKE '%Greg%Slette%'       OR full_name ILIKE '%Slette%Greg%'       LIMIT 1;
  SELECT id INTO u_stelman  FROM public.users WHERE full_name ILIKE '%Scott%Stelman%'     OR full_name ILIKE '%Stelman%Scott%'     LIMIT 1;
  SELECT id INTO u_todd     FROM public.users WHERE full_name ILIKE '%Todd%Wheatcraft%'   OR full_name ILIKE '%Wheatcraft%Todd%'   LIMIT 1;
  SELECT id INTO u_aaron    FROM public.users WHERE full_name ILIKE '%Aaron%Wheatcraft%'  OR full_name ILIKE '%Wheatcraft%Aaron%'  LIMIT 1;
  SELECT id INTO u_nordeen  FROM public.users WHERE full_name ILIKE '%Nordeen%'                                                     LIMIT 1;
  SELECT id INTO u_wolfgang FROM public.users WHERE full_name ILIKE '%Wolfgang%'                                                    LIMIT 1;

  -- Warn on any missing user
  IF u_busch    IS NULL THEN RAISE NOTICE 'User not found: Jay Busch';    END IF;
  IF u_matt     IS NULL THEN RAISE NOTICE 'User not found: Matt Christianson'; END IF;
  IF u_dupont   IS NULL THEN RAISE NOTICE 'User not found: Max DuPont';   END IF;
  IF u_gillett  IS NULL THEN RAISE NOTICE 'User not found: Kyle Gillett'; END IF;
  IF u_glims    IS NULL THEN RAISE NOTICE 'User not found: Mike Glimsdahl'; END IF;
  IF u_laramy   IS NULL THEN RAISE NOTICE 'User not found: Brian Laramy'; END IF;
  IF u_mckinney IS NULL THEN RAISE NOTICE 'User not found: Patrick McKinney'; END IF;
  IF u_misener  IS NULL THEN RAISE NOTICE 'User not found: Denny Misner'; END IF;
  IF u_ryan     IS NULL THEN RAISE NOTICE 'User not found: Tim Ryan';     END IF;
  IF u_sadek    IS NULL THEN RAISE NOTICE 'User not found: Josh Sadek';   END IF;
  IF u_slette   IS NULL THEN RAISE NOTICE 'User not found: Greg Slette';  END IF;
  IF u_stelman  IS NULL THEN RAISE NOTICE 'User not found: Scott Stelman'; END IF;
  IF u_todd     IS NULL THEN RAISE NOTICE 'User not found: Todd Wheatcraft'; END IF;
  IF u_aaron    IS NULL THEN RAISE NOTICE 'User not found: Aaron Wheatcraft'; END IF;
  IF u_nordeen  IS NULL THEN RAISE NOTICE 'User not found: Andrew Nordeen'; END IF;
  IF u_wolfgang IS NULL THEN RAISE NOTICE 'User not found: Joe Wolfgang'; END IF;

  -- ==========================================================================
  -- 2. Look up most recent team per player
  -- ==========================================================================
  SELECT tm.team_id INTO t_busch    FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_busch    ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_matt     FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_matt     ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_dupont   FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_dupont   ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_gillett  FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_gillett  ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_glims    FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_glims    ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_laramy   FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_laramy   ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_mckinney FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_mckinney ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_misener  FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_misener  ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_ryan     FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_ryan     ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_sadek    FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_sadek    ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_slette   FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_slette   ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_stelman  FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_stelman  ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_todd     FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_todd     ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_aaron    FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_aaron    ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_nordeen  FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_nordeen  ORDER BY t.season_year DESC LIMIT 1;
  SELECT tm.team_id INTO t_wolfgang FROM public.team_members tm JOIN public.teams t ON t.id=tm.team_id WHERE tm.user_id=u_wolfgang ORDER BY t.season_year DESC LIMIT 1;

  -- ==========================================================================
  -- 3. Insert historical rounds
  --    round_number < 0 avoids collision with real season rounds.
  --    UNIQUE(round_number, season_year) allows -1 per season.
  -- ==========================================================================

  -- ── 2022 ──────────────────────────────────────────────────────────────────
  INSERT INTO public.rounds (round_number, round_date, round_type, status, season_year, notes) VALUES
    (-1, '2022-08-25', 'regular', 'completed', 2022, 'LeagueGolfer historical import'),
    (-2, '2022-08-18', 'regular', 'completed', 2022, 'LeagueGolfer historical import'),
    (-3, '2022-07-14', 'regular', 'completed', 2022, 'LeagueGolfer historical import'),
    (-4, '2022-07-06', 'regular', 'completed', 2022, 'LeagueGolfer historical import'),
    (-5, '2022-06-16', 'regular', 'completed', 2022, 'LeagueGolfer historical import'),
    (-6, '2022-05-12', 'regular', 'completed', 2022, 'LeagueGolfer historical import')
  ON CONFLICT (round_number, season_year) DO NOTHING;

  -- ── 2023 ──────────────────────────────────────────────────────────────────
  INSERT INTO public.rounds (round_number, round_date, round_type, status, season_year, notes) VALUES
    (-1,  '2023-08-31', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-2,  '2023-08-24', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-3,  '2023-08-10', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-4,  '2023-07-27', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-5,  '2023-07-20', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-6,  '2023-07-13', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-7,  '2023-06-29', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-8,  '2023-06-22', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-9,  '2023-06-15', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-10, '2023-06-08', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-11, '2023-05-25', 'regular', 'completed', 2023, 'LeagueGolfer historical import'),
    (-12, '2023-05-18', 'regular', 'completed', 2023, 'LeagueGolfer historical import')
  ON CONFLICT (round_number, season_year) DO NOTHING;

  -- ── 2024 ──────────────────────────────────────────────────────────────────
  INSERT INTO public.rounds (round_number, round_date, round_type, status, season_year, notes) VALUES
    (-1,  '2024-08-22', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-2,  '2024-08-08', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-3,  '2024-07-25', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-4,  '2024-07-18', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-5,  '2024-07-11', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-6,  '2024-06-27', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-7,  '2024-06-20', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-8,  '2024-06-13', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-9,  '2024-06-06', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-10, '2024-05-23', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-11, '2024-05-16', 'regular', 'completed', 2024, 'LeagueGolfer historical import'),
    (-12, '2024-05-09', 'regular', 'completed', 2024, 'LeagueGolfer historical import')
  ON CONFLICT (round_number, season_year) DO NOTHING;

  -- ── 2025 ──────────────────────────────────────────────────────────────────
  INSERT INTO public.rounds (round_number, round_date, round_type, status, season_year, notes) VALUES
    (-1,  '2025-08-07', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-2,  '2025-07-31', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-3,  '2025-07-24', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-4,  '2025-07-17', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-5,  '2025-07-10', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-6,  '2025-06-19', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-7,  '2025-06-12', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-8,  '2025-06-05', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-9,  '2025-05-22', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-10, '2025-05-15', 'regular', 'completed', 2025, 'LeagueGolfer historical import'),
    (-11, '2025-05-08', 'regular', 'completed', 2025, 'LeagueGolfer historical import')
  ON CONFLICT (round_number, season_year) DO NOTHING;

  -- ==========================================================================
  -- 4. Fetch round IDs back by (round_number, season_year)
  -- ==========================================================================
  SELECT id INTO r22_1  FROM public.rounds WHERE round_number=-1  AND season_year=2022;
  SELECT id INTO r22_2  FROM public.rounds WHERE round_number=-2  AND season_year=2022;
  SELECT id INTO r22_3  FROM public.rounds WHERE round_number=-3  AND season_year=2022;
  SELECT id INTO r22_4  FROM public.rounds WHERE round_number=-4  AND season_year=2022;
  SELECT id INTO r22_5  FROM public.rounds WHERE round_number=-5  AND season_year=2022;
  SELECT id INTO r22_6  FROM public.rounds WHERE round_number=-6  AND season_year=2022;

  SELECT id INTO r23_1  FROM public.rounds WHERE round_number=-1  AND season_year=2023;
  SELECT id INTO r23_2  FROM public.rounds WHERE round_number=-2  AND season_year=2023;
  SELECT id INTO r23_3  FROM public.rounds WHERE round_number=-3  AND season_year=2023;
  SELECT id INTO r23_4  FROM public.rounds WHERE round_number=-4  AND season_year=2023;
  SELECT id INTO r23_5  FROM public.rounds WHERE round_number=-5  AND season_year=2023;
  SELECT id INTO r23_6  FROM public.rounds WHERE round_number=-6  AND season_year=2023;
  SELECT id INTO r23_7  FROM public.rounds WHERE round_number=-7  AND season_year=2023;
  SELECT id INTO r23_8  FROM public.rounds WHERE round_number=-8  AND season_year=2023;
  SELECT id INTO r23_9  FROM public.rounds WHERE round_number=-9  AND season_year=2023;
  SELECT id INTO r23_10 FROM public.rounds WHERE round_number=-10 AND season_year=2023;
  SELECT id INTO r23_11 FROM public.rounds WHERE round_number=-11 AND season_year=2023;
  SELECT id INTO r23_12 FROM public.rounds WHERE round_number=-12 AND season_year=2023;

  SELECT id INTO r24_1  FROM public.rounds WHERE round_number=-1  AND season_year=2024;
  SELECT id INTO r24_2  FROM public.rounds WHERE round_number=-2  AND season_year=2024;
  SELECT id INTO r24_3  FROM public.rounds WHERE round_number=-3  AND season_year=2024;
  SELECT id INTO r24_4  FROM public.rounds WHERE round_number=-4  AND season_year=2024;
  SELECT id INTO r24_5  FROM public.rounds WHERE round_number=-5  AND season_year=2024;
  SELECT id INTO r24_6  FROM public.rounds WHERE round_number=-6  AND season_year=2024;
  SELECT id INTO r24_7  FROM public.rounds WHERE round_number=-7  AND season_year=2024;
  SELECT id INTO r24_8  FROM public.rounds WHERE round_number=-8  AND season_year=2024;
  SELECT id INTO r24_9  FROM public.rounds WHERE round_number=-9  AND season_year=2024;
  SELECT id INTO r24_10 FROM public.rounds WHERE round_number=-10 AND season_year=2024;
  SELECT id INTO r24_11 FROM public.rounds WHERE round_number=-11 AND season_year=2024;
  SELECT id INTO r24_12 FROM public.rounds WHERE round_number=-12 AND season_year=2024;

  SELECT id INTO r25_1  FROM public.rounds WHERE round_number=-1  AND season_year=2025;
  SELECT id INTO r25_2  FROM public.rounds WHERE round_number=-2  AND season_year=2025;
  SELECT id INTO r25_3  FROM public.rounds WHERE round_number=-3  AND season_year=2025;
  SELECT id INTO r25_4  FROM public.rounds WHERE round_number=-4  AND season_year=2025;
  SELECT id INTO r25_5  FROM public.rounds WHERE round_number=-5  AND season_year=2025;
  SELECT id INTO r25_6  FROM public.rounds WHERE round_number=-6  AND season_year=2025;
  SELECT id INTO r25_7  FROM public.rounds WHERE round_number=-7  AND season_year=2025;
  SELECT id INTO r25_8  FROM public.rounds WHERE round_number=-8  AND season_year=2025;
  SELECT id INTO r25_9  FROM public.rounds WHERE round_number=-9  AND season_year=2025;
  SELECT id INTO r25_10 FROM public.rounds WHERE round_number=-10 AND season_year=2025;
  SELECT id INTO r25_11 FROM public.rounds WHERE round_number=-11 AND season_year=2025;

  -- ==========================================================================
  -- 5. Insert scores
  --    hole_scores = tmp_hs(AGS), gross_score generated = AGS
  --    handicap_at_time = LeagueGolfer HCP index (for reference only)
  --    net_score = AGS - handicap_at_time
  --    ON CONFLICT DO NOTHING = safe to re-run
  -- ==========================================================================

  -- ── BUSCH, JAY (HCP 15) ───────────────────────────────────────────────────
  -- 2025: Jul-24(59), Jul-10(53), Jun-19(54), May-15(54), May-08(59)
  -- 2024: Aug-22(51), Aug-08(51), Jul-25(52), Jul-11(48), Jun-27(53), Jun-20-expired(51)
  IF u_busch IS NOT NULL AND t_busch IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_3,  u_busch, t_busch, tmp_hs(59), 15, 44, FALSE, FALSE),  -- 2025-07-24
      (r25_5,  u_busch, t_busch, tmp_hs(53), 15, 38, FALSE, FALSE),  -- 2025-07-10
      (r25_6,  u_busch, t_busch, tmp_hs(54), 15, 39, FALSE, FALSE),  -- 2025-06-19
      (r25_10, u_busch, t_busch, tmp_hs(54), 15, 39, FALSE, FALSE),  -- 2025-05-15
      (r25_11, u_busch, t_busch, tmp_hs(59), 15, 44, FALSE, FALSE),  -- 2025-05-08
      (r24_1,  u_busch, t_busch, tmp_hs(51), 15, 36, FALSE, FALSE),  -- 2024-08-22
      (r24_2,  u_busch, t_busch, tmp_hs(51), 15, 36, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_busch, t_busch, tmp_hs(52), 15, 37, FALSE, FALSE),  -- 2024-07-25
      (r24_5,  u_busch, t_busch, tmp_hs(48), 15, 33, FALSE, FALSE),  -- 2024-07-11
      (r24_6,  u_busch, t_busch, tmp_hs(53), 15, 38, FALSE, FALSE),  -- 2024-06-27
      (r24_7,  u_busch, t_busch, tmp_hs(51), 15, 36, FALSE, FALSE)   -- 2024-06-20 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── CHRISTIANSON, MATT (HCP 8) ────────────────────────────────────────────
  -- 2025: Jul-31(45), Jul-24(47), Jul-17(52), Jul-10(46), Jun-12(44), Jun-05(49), May-15(49)
  -- 2024: Aug-08(43), Jul-25(50), Jul-18(46), Jul-11-expired(48)
  IF u_matt IS NOT NULL AND t_matt IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_2,  u_matt, t_matt, tmp_hs(45),  8, 37, FALSE, FALSE),  -- 2025-07-31
      (r25_3,  u_matt, t_matt, tmp_hs(47),  8, 39, FALSE, FALSE),  -- 2025-07-24
      (r25_4,  u_matt, t_matt, tmp_hs(52),  8, 44, FALSE, FALSE),  -- 2025-07-17
      (r25_5,  u_matt, t_matt, tmp_hs(46),  8, 38, FALSE, FALSE),  -- 2025-07-10
      (r25_7,  u_matt, t_matt, tmp_hs(44),  8, 36, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_matt, t_matt, tmp_hs(49),  8, 41, FALSE, FALSE),  -- 2025-06-05
      (r25_10, u_matt, t_matt, tmp_hs(49),  8, 41, FALSE, FALSE),  -- 2025-05-15
      (r24_2,  u_matt, t_matt, tmp_hs(43),  8, 35, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_matt, t_matt, tmp_hs(50),  8, 42, FALSE, FALSE),  -- 2024-07-25
      (r24_4,  u_matt, t_matt, tmp_hs(46),  8, 38, FALSE, FALSE),  -- 2024-07-18
      (r24_5,  u_matt, t_matt, tmp_hs(48),  8, 40, FALSE, FALSE)   -- 2024-07-11 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── DUPONT, MAX (HCP 3) ───────────────────────────────────────────────────
  -- 2025: Jul-17(40), May-15(41)
  -- 2024: Aug-22(40), Jul-18(50), Jun-20(45), Jun-13(44), Jun-06(47), May-23(40)
  -- 2023: Aug-24(41), Aug-10(37), Jul-20-expired(41)
  IF u_dupont IS NOT NULL AND t_dupont IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_4,  u_dupont, t_dupont, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2025-07-17
      (r25_10, u_dupont, t_dupont, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2025-05-15
      (r24_1,  u_dupont, t_dupont, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2024-08-22
      (r24_4,  u_dupont, t_dupont, tmp_hs(50), 3, 47, FALSE, FALSE),  -- 2024-07-18
      (r24_7,  u_dupont, t_dupont, tmp_hs(45), 3, 42, FALSE, FALSE),  -- 2024-06-20
      (r24_8,  u_dupont, t_dupont, tmp_hs(44), 3, 41, FALSE, FALSE),  -- 2024-06-13
      (r24_9,  u_dupont, t_dupont, tmp_hs(47), 3, 44, FALSE, FALSE),  -- 2024-06-06
      (r24_10, u_dupont, t_dupont, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2024-05-23
      (r23_2,  u_dupont, t_dupont, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2023-08-24
      (r23_3,  u_dupont, t_dupont, tmp_hs(37), 3, 34, FALSE, FALSE),  -- 2023-08-10
      (r23_5,  u_dupont, t_dupont, tmp_hs(41), 3, 38, FALSE, FALSE)   -- 2023-07-20 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── GILLETT, KYLE (HCP 7) ────────────────────────────────────────────────
  -- 2024: Jul-18(44), Jun-13(49), May-23(46), May-16(54)
  -- 2022: Aug-25(43), Aug-18(46), Jul-14(42), Jul-06(45), Jun-16(45), May-12(49)
  IF u_gillett IS NOT NULL AND t_gillett IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r24_4,  u_gillett, t_gillett, tmp_hs(44), 7, 37, FALSE, FALSE),  -- 2024-07-18
      (r24_8,  u_gillett, t_gillett, tmp_hs(49), 7, 42, FALSE, FALSE),  -- 2024-06-13
      (r24_10, u_gillett, t_gillett, tmp_hs(46), 7, 39, FALSE, FALSE),  -- 2024-05-23
      (r24_11, u_gillett, t_gillett, tmp_hs(54), 7, 47, FALSE, FALSE),  -- 2024-05-16
      (r22_1,  u_gillett, t_gillett, tmp_hs(43), 7, 36, FALSE, FALSE),  -- 2022-08-25
      (r22_2,  u_gillett, t_gillett, tmp_hs(46), 7, 39, FALSE, FALSE),  -- 2022-08-18
      (r22_3,  u_gillett, t_gillett, tmp_hs(42), 7, 35, FALSE, FALSE),  -- 2022-07-14
      (r22_4,  u_gillett, t_gillett, tmp_hs(45), 7, 38, FALSE, FALSE),  -- 2022-07-06
      (r22_5,  u_gillett, t_gillett, tmp_hs(45), 7, 38, FALSE, FALSE),  -- 2022-06-16
      (r22_6,  u_gillett, t_gillett, tmp_hs(49), 7, 42, FALSE, FALSE)   -- 2022-05-12
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── GLIMSDAHL, MIKE (HCP 3) ───────────────────────────────────────────────
  -- 2025: Aug-07(40), Jul-31(40), Jul-24(38), Jul-17(42), Jun-19(43),
  --       Jun-12(43), Jun-05(47), May-22(41), May-15(40), May-08(38)
  -- 2024: Aug-22-expired(39)
  IF u_glims IS NOT NULL AND t_glims IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_glims, t_glims, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2025-08-07
      (r25_2,  u_glims, t_glims, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2025-07-31
      (r25_3,  u_glims, t_glims, tmp_hs(38), 3, 35, FALSE, FALSE),  -- 2025-07-24
      (r25_4,  u_glims, t_glims, tmp_hs(42), 3, 39, FALSE, FALSE),  -- 2025-07-17
      (r25_6,  u_glims, t_glims, tmp_hs(43), 3, 40, FALSE, FALSE),  -- 2025-06-19
      (r25_7,  u_glims, t_glims, tmp_hs(43), 3, 40, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_glims, t_glims, tmp_hs(47), 3, 44, FALSE, FALSE),  -- 2025-06-05
      (r25_9,  u_glims, t_glims, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2025-05-22
      (r25_10, u_glims, t_glims, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2025-05-15
      (r25_11, u_glims, t_glims, tmp_hs(38), 3, 35, FALSE, FALSE),  -- 2025-05-08
      (r24_1,  u_glims, t_glims, tmp_hs(39), 3, 36, FALSE, FALSE)   -- 2024-08-22 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── LARAMY, BRIAN (HCP 7) ────────────────────────────────────────────────
  -- 2025: Jul-31(50), Jul-17(46), May-22(43)
  -- 2024: Aug-08(46), Jul-25(42), Jul-11(44), Jun-27(45), Jun-13(51)
  -- 2023: Aug-24(51), Jul-27(43), Jul-13-expired(50)
  IF u_laramy IS NOT NULL AND t_laramy IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_2,  u_laramy, t_laramy, tmp_hs(50), 7, 43, FALSE, FALSE),  -- 2025-07-31
      (r25_4,  u_laramy, t_laramy, tmp_hs(46), 7, 39, FALSE, FALSE),  -- 2025-07-17
      (r25_9,  u_laramy, t_laramy, tmp_hs(43), 7, 36, FALSE, FALSE),  -- 2025-05-22
      (r24_2,  u_laramy, t_laramy, tmp_hs(46), 7, 39, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_laramy, t_laramy, tmp_hs(42), 7, 35, FALSE, FALSE),  -- 2024-07-25
      (r24_5,  u_laramy, t_laramy, tmp_hs(44), 7, 37, FALSE, FALSE),  -- 2024-07-11
      (r24_6,  u_laramy, t_laramy, tmp_hs(45), 7, 38, FALSE, FALSE),  -- 2024-06-27
      (r24_8,  u_laramy, t_laramy, tmp_hs(51), 7, 44, FALSE, FALSE),  -- 2024-06-13
      (r23_2,  u_laramy, t_laramy, tmp_hs(51), 7, 44, FALSE, FALSE),  -- 2023-08-24
      (r23_4,  u_laramy, t_laramy, tmp_hs(43), 7, 36, FALSE, FALSE),  -- 2023-07-27
      (r23_6,  u_laramy, t_laramy, tmp_hs(50), 7, 43, FALSE, FALSE)   -- 2023-07-13 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── MCKINNEY, PATRICK (HCP 2) ────────────────────────────────────────────
  -- 2025: Jul-31(39), Jul-24(42), Jul-10(44), Jun-19(40), Jun-12(44),
  --       Jun-05(39), May-22(41), May-08(39)
  -- 2024: Aug-22(42), Aug-08(36), Jul-25-expired(38)
  IF u_mckinney IS NOT NULL AND t_mckinney IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_2,  u_mckinney, t_mckinney, tmp_hs(39), 2, 37, FALSE, FALSE),  -- 2025-07-31
      (r25_3,  u_mckinney, t_mckinney, tmp_hs(42), 2, 40, FALSE, FALSE),  -- 2025-07-24
      (r25_5,  u_mckinney, t_mckinney, tmp_hs(44), 2, 42, FALSE, FALSE),  -- 2025-07-10
      (r25_6,  u_mckinney, t_mckinney, tmp_hs(40), 2, 38, FALSE, FALSE),  -- 2025-06-19
      (r25_7,  u_mckinney, t_mckinney, tmp_hs(44), 2, 42, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_mckinney, t_mckinney, tmp_hs(39), 2, 37, FALSE, FALSE),  -- 2025-06-05
      (r25_9,  u_mckinney, t_mckinney, tmp_hs(41), 2, 39, FALSE, FALSE),  -- 2025-05-22
      (r25_11, u_mckinney, t_mckinney, tmp_hs(39), 2, 37, FALSE, FALSE),  -- 2025-05-08
      (r24_1,  u_mckinney, t_mckinney, tmp_hs(42), 2, 40, FALSE, FALSE),  -- 2024-08-22
      (r24_2,  u_mckinney, t_mckinney, tmp_hs(36), 2, 34, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_mckinney, t_mckinney, tmp_hs(38), 2, 36, FALSE, FALSE)   -- 2024-07-25 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── MISENER, DENNY (HCP 3) ───────────────────────────────────────────────
  -- 2025: Aug-07(41), Jun-19(35), May-22(41), May-08(39)
  -- 2024: Jun-20(40), Jun-06(42), May-16(41), May-09(40)
  -- 2023: Jun-22(43), Jun-15(44), May-18-expired(48)
  IF u_misener IS NOT NULL AND t_misener IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_misener, t_misener, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2025-08-07
      (r25_6,  u_misener, t_misener, tmp_hs(35), 3, 32, FALSE, FALSE),  -- 2025-06-19
      (r25_9,  u_misener, t_misener, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2025-05-22
      (r25_11, u_misener, t_misener, tmp_hs(39), 3, 36, FALSE, FALSE),  -- 2025-05-08
      (r24_7,  u_misener, t_misener, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2024-06-20
      (r24_9,  u_misener, t_misener, tmp_hs(42), 3, 39, FALSE, FALSE),  -- 2024-06-06
      (r24_11, u_misener, t_misener, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2024-05-16
      (r24_12, u_misener, t_misener, tmp_hs(40), 3, 37, FALSE, FALSE),  -- 2024-05-09
      (r23_8,  u_misener, t_misener, tmp_hs(43), 3, 40, FALSE, FALSE),  -- 2023-06-22
      (r23_9,  u_misener, t_misener, tmp_hs(44), 3, 41, FALSE, FALSE),  -- 2023-06-15
      (r23_12, u_misener, t_misener, tmp_hs(48), 3, 45, FALSE, FALSE)   -- 2023-05-18 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── RYAN, TIM (HCP 3) ────────────────────────────────────────────────────
  -- 2025: Aug-07(41), Jul-31(38), Jul-24(39), Jul-17(39), Jul-10(42),
  --       Jun-19(43), Jun-12(42), Jun-05(48), May-22(45), May-15(51)
  -- Expired: May-08(41)
  IF u_ryan IS NOT NULL AND t_ryan IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_ryan, t_ryan, tmp_hs(41), 3, 38, FALSE, FALSE),  -- 2025-08-07
      (r25_2,  u_ryan, t_ryan, tmp_hs(38), 3, 35, FALSE, FALSE),  -- 2025-07-31
      (r25_3,  u_ryan, t_ryan, tmp_hs(39), 3, 36, FALSE, FALSE),  -- 2025-07-24
      (r25_4,  u_ryan, t_ryan, tmp_hs(39), 3, 36, FALSE, FALSE),  -- 2025-07-17
      (r25_5,  u_ryan, t_ryan, tmp_hs(42), 3, 39, FALSE, FALSE),  -- 2025-07-10
      (r25_6,  u_ryan, t_ryan, tmp_hs(43), 3, 40, FALSE, FALSE),  -- 2025-06-19
      (r25_7,  u_ryan, t_ryan, tmp_hs(42), 3, 39, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_ryan, t_ryan, tmp_hs(48), 3, 45, FALSE, FALSE),  -- 2025-06-05
      (r25_9,  u_ryan, t_ryan, tmp_hs(45), 3, 42, FALSE, FALSE),  -- 2025-05-22
      (r25_10, u_ryan, t_ryan, tmp_hs(51), 3, 48, FALSE, FALSE),  -- 2025-05-15
      (r25_11, u_ryan, t_ryan, tmp_hs(41), 3, 38, FALSE, FALSE)   -- 2025-05-08 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── SADEK, JOSH (HCP 5) ──────────────────────────────────────────────────
  -- 2025: Aug-07(47), Jul-31(39), Jul-17(46), Jun-12(44), Jun-05(45), May-22(40)
  -- 2024: Aug-22(42), Aug-08(44), Jul-25(47), Jul-18(43), Jul-11-expired(37)
  IF u_sadek IS NOT NULL AND t_sadek IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_sadek, t_sadek, tmp_hs(47), 5, 42, FALSE, FALSE),  -- 2025-08-07
      (r25_2,  u_sadek, t_sadek, tmp_hs(39), 5, 34, FALSE, FALSE),  -- 2025-07-31
      (r25_4,  u_sadek, t_sadek, tmp_hs(46), 5, 41, FALSE, FALSE),  -- 2025-07-17
      (r25_7,  u_sadek, t_sadek, tmp_hs(44), 5, 39, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_sadek, t_sadek, tmp_hs(45), 5, 40, FALSE, FALSE),  -- 2025-06-05
      (r25_9,  u_sadek, t_sadek, tmp_hs(40), 5, 35, FALSE, FALSE),  -- 2025-05-22
      (r24_1,  u_sadek, t_sadek, tmp_hs(42), 5, 37, FALSE, FALSE),  -- 2024-08-22
      (r24_2,  u_sadek, t_sadek, tmp_hs(44), 5, 39, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_sadek, t_sadek, tmp_hs(47), 5, 42, FALSE, FALSE),  -- 2024-07-25
      (r24_4,  u_sadek, t_sadek, tmp_hs(43), 5, 38, FALSE, FALSE),  -- 2024-07-18
      (r24_5,  u_sadek, t_sadek, tmp_hs(37), 5, 32, FALSE, FALSE)   -- 2024-07-11 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── SLETTE, GREG (HCP 6) ─────────────────────────────────────────────────
  -- 2024: Aug-08(49), Jul-25(44), Jul-11(48), Jun-27(49), May-16(49), May-09(51)
  -- 2023: Aug-31(44), Jul-27(43), Jul-13(42), Jun-22(41)
  -- Note: Slette's 2024 rounds were on a different course (CR 33.9/Slope 125)
  -- but the app formula only uses par 36, so AGS is used as-is.
  IF u_slette IS NOT NULL AND t_slette IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r24_2,  u_slette, t_slette, tmp_hs(49), 6, 43, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_slette, t_slette, tmp_hs(44), 6, 38, FALSE, FALSE),  -- 2024-07-25
      (r24_5,  u_slette, t_slette, tmp_hs(48), 6, 42, FALSE, FALSE),  -- 2024-07-11
      (r24_6,  u_slette, t_slette, tmp_hs(49), 6, 43, FALSE, FALSE),  -- 2024-06-27
      (r24_11, u_slette, t_slette, tmp_hs(49), 6, 43, FALSE, FALSE),  -- 2024-05-16
      (r24_12, u_slette, t_slette, tmp_hs(51), 6, 45, FALSE, FALSE),  -- 2024-05-09
      (r23_1,  u_slette, t_slette, tmp_hs(44), 6, 38, FALSE, FALSE),  -- 2023-08-31
      (r23_4,  u_slette, t_slette, tmp_hs(43), 6, 37, FALSE, FALSE),  -- 2023-07-27
      (r23_6,  u_slette, t_slette, tmp_hs(42), 6, 36, FALSE, FALSE),  -- 2023-07-13
      (r23_8,  u_slette, t_slette, tmp_hs(41), 6, 35, FALSE, FALSE)   -- 2023-06-22
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── STELMAN, SCOTT (HCP 8) ───────────────────────────────────────────────
  -- 2024: May-09(47)
  -- 2023: Aug-31(41), Aug-24(48), Jul-20(45), Jul-13(48), Jun-29(41),
  --       Jun-22(55), Jun-15(49), Jun-08(47), May-25(49)
  IF u_stelman IS NOT NULL AND t_stelman IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r24_12, u_stelman, t_stelman, tmp_hs(47), 8, 39, FALSE, FALSE),  -- 2024-05-09
      (r23_1,  u_stelman, t_stelman, tmp_hs(41), 8, 33, FALSE, FALSE),  -- 2023-08-31
      (r23_2,  u_stelman, t_stelman, tmp_hs(48), 8, 40, FALSE, FALSE),  -- 2023-08-24
      (r23_5,  u_stelman, t_stelman, tmp_hs(45), 8, 37, FALSE, FALSE),  -- 2023-07-20
      (r23_6,  u_stelman, t_stelman, tmp_hs(48), 8, 40, FALSE, FALSE),  -- 2023-07-13
      (r23_7,  u_stelman, t_stelman, tmp_hs(41), 8, 33, FALSE, FALSE),  -- 2023-06-29
      (r23_8,  u_stelman, t_stelman, tmp_hs(55), 8, 47, FALSE, FALSE),  -- 2023-06-22
      (r23_9,  u_stelman, t_stelman, tmp_hs(49), 8, 41, FALSE, FALSE),  -- 2023-06-15
      (r23_10, u_stelman, t_stelman, tmp_hs(47), 8, 39, FALSE, FALSE),  -- 2023-06-08
      (r23_11, u_stelman, t_stelman, tmp_hs(49), 8, 41, FALSE, FALSE)   -- 2023-05-25
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── WHEATCRAFT, TODD (HCP 6) ─────────────────────────────────────────────
  -- 2025: Aug-07(44), Jul-31(48), May-15(51)
  -- 2024: Aug-22(44), Jul-25(45), Jun-27(49), Jun-06(46), May-23(39), May-09(43)
  -- 2023: Aug-31(44), Aug-24-expired(44)
  IF u_todd IS NOT NULL AND t_todd IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_todd, t_todd, tmp_hs(44), 6, 38, FALSE, FALSE),  -- 2025-08-07
      (r25_2,  u_todd, t_todd, tmp_hs(48), 6, 42, FALSE, FALSE),  -- 2025-07-31
      (r25_10, u_todd, t_todd, tmp_hs(51), 6, 45, FALSE, FALSE),  -- 2025-05-15
      (r24_1,  u_todd, t_todd, tmp_hs(44), 6, 38, FALSE, FALSE),  -- 2024-08-22
      (r24_3,  u_todd, t_todd, tmp_hs(45), 6, 39, FALSE, FALSE),  -- 2024-07-25
      (r24_6,  u_todd, t_todd, tmp_hs(49), 6, 43, FALSE, FALSE),  -- 2024-06-27
      (r24_9,  u_todd, t_todd, tmp_hs(46), 6, 40, FALSE, FALSE),  -- 2024-06-06
      (r24_10, u_todd, t_todd, tmp_hs(39), 6, 33, FALSE, FALSE),  -- 2024-05-23
      (r24_12, u_todd, t_todd, tmp_hs(43), 6, 37, FALSE, FALSE),  -- 2024-05-09
      (r23_1,  u_todd, t_todd, tmp_hs(44), 6, 38, FALSE, FALSE),  -- 2023-08-31
      (r23_2,  u_todd, t_todd, tmp_hs(44), 6, 38, FALSE, FALSE)   -- 2023-08-24 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── WHEATCRAFT, AARON (HCP 5) ────────────────────────────────────────────
  -- 2025: Jul-24(47), Jul-17(39), Jul-10(43), Jun-19(40), Jun-12(42),
  --       Jun-05(42), May-22(43), May-08(50)
  -- 2024: Aug-08(47), Jul-18(50), Jul-11-expired(49)
  IF u_aaron IS NOT NULL AND t_aaron IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_3,  u_aaron, t_aaron, tmp_hs(47), 5, 42, FALSE, FALSE),  -- 2025-07-24
      (r25_4,  u_aaron, t_aaron, tmp_hs(39), 5, 34, FALSE, FALSE),  -- 2025-07-17
      (r25_5,  u_aaron, t_aaron, tmp_hs(43), 5, 38, FALSE, FALSE),  -- 2025-07-10
      (r25_6,  u_aaron, t_aaron, tmp_hs(40), 5, 35, FALSE, FALSE),  -- 2025-06-19
      (r25_7,  u_aaron, t_aaron, tmp_hs(42), 5, 37, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_aaron, t_aaron, tmp_hs(42), 5, 37, FALSE, FALSE),  -- 2025-06-05
      (r25_9,  u_aaron, t_aaron, tmp_hs(43), 5, 38, FALSE, FALSE),  -- 2025-05-22
      (r25_11, u_aaron, t_aaron, tmp_hs(50), 5, 45, FALSE, FALSE),  -- 2025-05-08
      (r24_2,  u_aaron, t_aaron, tmp_hs(47), 5, 42, FALSE, FALSE),  -- 2024-08-08
      (r24_4,  u_aaron, t_aaron, tmp_hs(50), 5, 45, FALSE, FALSE),  -- 2024-07-18
      (r24_5,  u_aaron, t_aaron, tmp_hs(49), 5, 44, FALSE, FALSE)   -- 2024-07-11 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── NORDEEN, ANDREW (HCP 1) ──────────────────────────────────────────────
  -- 2025: Aug-07(35), Jul-17(40), Jul-10(40), Jun-12(44), Jun-05(39), May-15(46), May-08(35)
  -- 2024: Aug-22(40), Aug-08(42), Jul-25(45), Jul-18-expired(43)
  IF u_nordeen IS NOT NULL AND t_nordeen IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_nordeen, t_nordeen, tmp_hs(35), 1, 34, FALSE, FALSE),  -- 2025-08-07
      (r25_4,  u_nordeen, t_nordeen, tmp_hs(40), 1, 39, FALSE, FALSE),  -- 2025-07-17
      (r25_5,  u_nordeen, t_nordeen, tmp_hs(40), 1, 39, FALSE, FALSE),  -- 2025-07-10
      (r25_7,  u_nordeen, t_nordeen, tmp_hs(44), 1, 43, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_nordeen, t_nordeen, tmp_hs(39), 1, 38, FALSE, FALSE),  -- 2025-06-05
      (r25_10, u_nordeen, t_nordeen, tmp_hs(46), 1, 45, FALSE, FALSE),  -- 2025-05-15
      (r25_11, u_nordeen, t_nordeen, tmp_hs(35), 1, 34, FALSE, FALSE),  -- 2025-05-08
      (r24_1,  u_nordeen, t_nordeen, tmp_hs(40), 1, 39, FALSE, FALSE),  -- 2024-08-22
      (r24_2,  u_nordeen, t_nordeen, tmp_hs(42), 1, 41, FALSE, FALSE),  -- 2024-08-08
      (r24_3,  u_nordeen, t_nordeen, tmp_hs(45), 1, 44, FALSE, FALSE),  -- 2024-07-25
      (r24_4,  u_nordeen, t_nordeen, tmp_hs(43), 1, 42, FALSE, FALSE)   -- 2024-07-18 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ── WOLFGANG, JOSEPH (HCP 6) ─────────────────────────────────────────────
  -- 2025: Aug-07(43), Jul-24(48), Jun-12(43), Jun-05(43), May-15(45), May-08(45)
  -- 2024: Aug-22(42), Jul-18(41), Jun-20(48), Jun-06(47), May-23-expired(42)
  IF u_wolfgang IS NOT NULL AND t_wolfgang IS NOT NULL THEN
    INSERT INTO public.scores (round_id,user_id,team_id,hole_scores,handicap_at_time,net_score,is_sub,is_makeup) VALUES
      (r25_1,  u_wolfgang, t_wolfgang, tmp_hs(43), 6, 37, FALSE, FALSE),  -- 2025-08-07
      (r25_3,  u_wolfgang, t_wolfgang, tmp_hs(48), 6, 42, FALSE, FALSE),  -- 2025-07-24
      (r25_7,  u_wolfgang, t_wolfgang, tmp_hs(43), 6, 37, FALSE, FALSE),  -- 2025-06-12
      (r25_8,  u_wolfgang, t_wolfgang, tmp_hs(43), 6, 37, FALSE, FALSE),  -- 2025-06-05
      (r25_10, u_wolfgang, t_wolfgang, tmp_hs(45), 6, 39, FALSE, FALSE),  -- 2025-05-15
      (r25_11, u_wolfgang, t_wolfgang, tmp_hs(45), 6, 39, FALSE, FALSE),  -- 2025-05-08
      (r24_1,  u_wolfgang, t_wolfgang, tmp_hs(42), 6, 36, FALSE, FALSE),  -- 2024-08-22
      (r24_4,  u_wolfgang, t_wolfgang, tmp_hs(41), 6, 35, FALSE, FALSE),  -- 2024-07-18
      (r24_7,  u_wolfgang, t_wolfgang, tmp_hs(48), 6, 42, FALSE, FALSE),  -- 2024-06-20
      (r24_9,  u_wolfgang, t_wolfgang, tmp_hs(47), 6, 41, FALSE, FALSE),  -- 2024-06-06
      (r24_10, u_wolfgang, t_wolfgang, tmp_hs(42), 6, 36, FALSE, FALSE)   -- 2024-05-23 (expired)
    ON CONFLICT (round_id, user_id) DO NOTHING;
  END IF;

  -- ==========================================================================
  -- 6. Reset handicap records so the app recalculates cleanly
  -- ==========================================================================
  UPDATE public.handicaps
  SET current_handicap   = 0,
      rounds_played      = 0,
      last_calculated_at = NULL,
      is_manual_override = FALSE,
      updated_at         = NOW();

  RAISE NOTICE 'Historical score re-seed complete. Run admin handicap recalculate to apply new values.';

END $$;

-- Drop the temporary helper function
DROP FUNCTION IF EXISTS tmp_hs(INTEGER);

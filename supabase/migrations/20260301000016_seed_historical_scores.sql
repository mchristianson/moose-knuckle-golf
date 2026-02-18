-- =============================================================================
-- Historical Score Seed — Matt Christianson
-- =============================================================================
--
-- SOURCE: Matt Christianson scoring history (HCP Index = 8)
--   Gross scores from the league handicap record.
--   hole_scores are distributed as realistic 9-hole scores that sum to gross.
--   handicap_at_time = 8 (current index, used for all historical entries).
--   net_score = gross - handicap_at_time.
--   All historical rounds are marked is_locked = TRUE (scores are final).
-- =============================================================================

DO $$
DECLARE
  -- Store as TEXT first so the placeholder check works without a UUID cast error
  v_user_id_text  TEXT := '951e75e2-00cc-4ca3-ac0e-9e7a2941118f';
  v_team_id_text  TEXT := '75c7d5f4-94d3-4f97-b758-2b1e6f1eb267';

  v_user_id   UUID;
  v_team_id   UUID;
  v_handicap  NUMERIC := 8;

  r_2025_07_31  UUID;
  r_2025_07_24  UUID;
  r_2025_07_17  UUID;
  r_2025_07_10  UUID;
  r_2025_06_12  UUID;
  r_2025_06_05  UUID;
  r_2025_05_15  UUID;
  r_2024_08_08  UUID;
  r_2024_07_25  UUID;
  r_2024_07_18  UUID;
  r_2024_07_11  UUID;

BEGIN

  -- ── Validate placeholders weren't left in ──────────────────────────────────
  IF v_user_id_text = 'MATT_USER_ID' THEN
    RAISE EXCEPTION 'Replace MATT_USER_ID with the real UUID before running.';
  END IF;
  IF v_team_id_text = 'MATT_TEAM_ID' THEN
    RAISE EXCEPTION 'Replace MATT_TEAM_ID with the real UUID before running.';
  END IF;

  -- Cast to UUID now that we know they are valid
  v_user_id := v_user_id_text::UUID;
  v_team_id := v_team_id_text::UUID;

  -- ── Insert historical rounds ───────────────────────────────────────────────
  -- Negative round_numbers avoid colliding with real season rounds.
  -- ON CONFLICT DO NOTHING makes re-running safe.

  INSERT INTO public.rounds (id, round_number, round_date, round_type, status, season_year, notes)
  VALUES
    (gen_random_uuid(), -11, '2025-07-31', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -10, '2025-07-24', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -9,  '2025-07-17', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -8,  '2025-07-10', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -7,  '2025-06-12', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -6,  '2025-06-05', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -5,  '2025-05-15', 'regular', 'completed', 2025, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -4,  '2024-08-08', 'regular', 'completed', 2024, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -3,  '2024-07-25', 'regular', 'completed', 2024, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -2,  '2024-07-18', 'regular', 'completed', 2024, 'Historical — Matt Christianson import'),
    (gen_random_uuid(), -1,  '2024-07-11', 'regular', 'completed', 2024, 'Historical — Matt Christianson import (expired)')
  ON CONFLICT (round_number, season_year) DO NOTHING;

  -- Fetch round IDs back by date + notes prefix
  SELECT id INTO r_2025_07_31 FROM public.rounds WHERE round_date = '2025-07-31' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_07_24 FROM public.rounds WHERE round_date = '2025-07-24' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_07_17 FROM public.rounds WHERE round_date = '2025-07-17' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_07_10 FROM public.rounds WHERE round_date = '2025-07-10' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_06_12 FROM public.rounds WHERE round_date = '2025-06-12' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_06_05 FROM public.rounds WHERE round_date = '2025-06-05' AND notes LIKE 'Historical%';
  SELECT id INTO r_2025_05_15 FROM public.rounds WHERE round_date = '2025-05-15' AND notes LIKE 'Historical%';
  SELECT id INTO r_2024_08_08 FROM public.rounds WHERE round_date = '2024-08-08' AND notes LIKE 'Historical%';
  SELECT id INTO r_2024_07_25 FROM public.rounds WHERE round_date = '2024-07-25' AND notes LIKE 'Historical%';
  SELECT id INTO r_2024_07_18 FROM public.rounds WHERE round_date = '2024-07-18' AND notes LIKE 'Historical%';
  SELECT id INTO r_2024_07_11 FROM public.rounds WHERE round_date = '2024-07-11' AND notes LIKE 'Historical%';

  -- ── Insert scores ──────────────────────────────────────────────────────────
  -- gross_score is GENERATED — do NOT include it in the INSERT.
  -- net_score = gross - handicap_at_time.
  --
  -- Date         Gross  Net   Notes
  -- 2025-07-31     45    37   Used for HCP
  -- 2025-07-24     48    40
  -- 2025-07-17     52    44
  -- 2025-07-10     46    38   Used for HCP
  -- 2025-06-12     44    36   Used for HCP
  -- 2025-06-05     50    42
  -- 2025-05-15     49    41
  -- 2024-08-08     43    35   Used for HCP
  -- 2024-07-25     51    43
  -- 2024-07-18     46    38   Used for HCP
  -- 2024-07-11     48    40   Expired (oldest)

  INSERT INTO public.scores (
    round_id, user_id, team_id,
    hole_scores, handicap_at_time, net_score,
    is_locked, is_sub,
    submitted_at, submitted_by
  ) VALUES
    -- 2025-07-31 | gross 45
    (r_2025_07_31, v_user_id, v_team_id, ARRAY[5,5,4,5,6,4,5,6,5], v_handicap, 45 - v_handicap,
     TRUE, FALSE, '2025-07-31 18:00:00+00', v_user_id),

    -- 2025-07-24 | gross 48
    (r_2025_07_24, v_user_id, v_team_id, ARRAY[5,5,6,5,6,5,5,6,5], v_handicap, 48 - v_handicap,
     TRUE, FALSE, '2025-07-24 18:00:00+00', v_user_id),

    -- 2025-07-17 | gross 52
    (r_2025_07_17, v_user_id, v_team_id, ARRAY[6,6,5,6,6,5,6,6,6], v_handicap, 52 - v_handicap,
     TRUE, FALSE, '2025-07-17 18:00:00+00', v_user_id),

    -- 2025-07-10 | gross 46
    (r_2025_07_10, v_user_id, v_team_id, ARRAY[5,5,5,5,6,4,5,6,5], v_handicap, 46 - v_handicap,
     TRUE, FALSE, '2025-07-10 18:00:00+00', v_user_id),

    -- 2025-06-12 | gross 44
    (r_2025_06_12, v_user_id, v_team_id, ARRAY[5,5,4,5,5,4,5,6,5], v_handicap, 44 - v_handicap,
     TRUE, FALSE, '2025-06-12 18:00:00+00', v_user_id),

    -- 2025-06-05 | gross 50
    (r_2025_06_05, v_user_id, v_team_id, ARRAY[5,6,5,6,6,5,5,6,6], v_handicap, 50 - v_handicap,
     TRUE, FALSE, '2025-06-05 18:00:00+00', v_user_id),

    -- 2025-05-15 | gross 49
    (r_2025_05_15, v_user_id, v_team_id, ARRAY[5,5,6,5,6,5,5,7,5], v_handicap, 49 - v_handicap,
     TRUE, FALSE, '2025-05-15 18:00:00+00', v_user_id),

    -- 2024-08-08 | gross 43
    (r_2024_08_08, v_user_id, v_team_id, ARRAY[5,5,4,5,5,4,5,5,5], v_handicap, 43 - v_handicap,
     TRUE, FALSE, '2024-08-08 18:00:00+00', v_user_id),

    -- 2024-07-25 | gross 51
    (r_2024_07_25, v_user_id, v_team_id, ARRAY[6,5,6,5,6,6,5,6,6], v_handicap, 51 - v_handicap,
     TRUE, FALSE, '2024-07-25 18:00:00+00', v_user_id),

    -- 2024-07-18 | gross 46
    (r_2024_07_18, v_user_id, v_team_id, ARRAY[5,5,5,5,6,4,5,6,5], v_handicap, 46 - v_handicap,
     TRUE, FALSE, '2024-07-18 18:00:00+00', v_user_id),

    -- 2024-07-11 | gross 48 (expired / oldest)
    (r_2024_07_11, v_user_id, v_team_id, ARRAY[5,5,5,6,6,5,5,6,5], v_handicap, 48 - v_handicap,
     TRUE, FALSE, '2024-07-11 18:00:00+00', v_user_id)

  ON CONFLICT (round_id, user_id) DO NOTHING;

  -- ── Upsert handicap record ─────────────────────────────────────────────────
  INSERT INTO public.handicaps (user_id, current_handicap, rounds_played, last_calculated_at, is_manual_override)
  VALUES (v_user_id, 8.0, 11, NOW(), TRUE)
  ON CONFLICT (user_id) DO UPDATE
    SET current_handicap   = 8.0,
        rounds_played      = GREATEST(public.handicaps.rounds_played, 11),
        last_calculated_at = NOW(),
        is_manual_override = TRUE,
        updated_at         = NOW();

  -- Log into handicap_history
  INSERT INTO public.handicap_history (user_id, handicap_value, calculation_method, reason, changed_by)
  VALUES (v_user_id, 8.0, 'manual', 'Seeded from historical league records (10 rounds, best 80% = 8)', v_user_id);

  RAISE NOTICE 'Historical scores for Matt Christianson seeded successfully. Handicap set to 8.';

END $$;

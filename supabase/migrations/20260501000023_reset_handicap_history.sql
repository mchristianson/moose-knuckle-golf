-- Reset handicap history and historical seeded rounds
-- Removes all rounds with round_number < 0 (historical seeds) and their scores.
-- Preserves all current season rounds (round_number > 0) and their scores.
-- Clears handicap_history audit trail.
-- Resets handicap records so the app recalculates from scratch on next round finalization.

-- 1. Delete scores tied to historical seeded rounds
DELETE FROM public.scores
WHERE round_id IN (
  SELECT id FROM public.rounds WHERE round_number < 0
);

-- 2. Delete the historical rounds themselves
DELETE FROM public.rounds WHERE round_number < 0;

-- 3. Clear handicap audit log
DELETE FROM public.handicap_history;

-- 4. Reset all handicap records (set to 0, not manual override)
--    The app will recalculate on the next round finalization.
UPDATE public.handicaps
SET
  current_handicap   = 0,
  rounds_played      = 0,
  last_calculated_at = NULL,
  is_manual_override = FALSE,
  updated_at         = NOW();

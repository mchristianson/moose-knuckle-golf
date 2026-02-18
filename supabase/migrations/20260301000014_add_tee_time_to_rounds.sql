-- Add tee_time field to rounds table
-- Stores the first tee time (TIME type, e.g., 08:00:00)
-- The second tee time is always 10 minutes later

ALTER TABLE public.rounds
ADD COLUMN tee_time TIME;

-- Add index for queries
CREATE INDEX idx_rounds_tee_time ON public.rounds(tee_time);

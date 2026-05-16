-- Expand hole_scores to support 18 holes (first 9 required, 10-18 optional)

-- Migrate existing 9-hole scores to 18-hole format
ALTER TABLE scores
ALTER COLUMN hole_scores SET DEFAULT ARRAY[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

-- Update all existing scores: pad 9-hole arrays to 18 elements
UPDATE scores
SET hole_scores = hole_scores || ARRAY[0,0,0,0,0,0,0,0,0]
WHERE array_length(hole_scores, 1) = 9;

-- Add constraint to ensure hole_scores has exactly 18 elements
ALTER TABLE scores
ADD CONSTRAINT hole_scores_length_check CHECK (array_length(hole_scores, 1) = 18);

-- Comment for clarity
COMMENT ON COLUMN scores.hole_scores IS 'Array of 18 hole scores (1-9 required for round completion, 10-18 optional for tracking only)';

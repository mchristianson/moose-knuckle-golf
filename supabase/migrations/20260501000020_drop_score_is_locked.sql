-- Drop the is_locked column from scores table
ALTER TABLE scores DROP COLUMN IF EXISTS is_locked;

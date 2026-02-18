-- Seed Users Migration
--
-- INSTRUCTIONS:
-- 1. Create users in Supabase Authentication (auth.users) via the dashboard
-- 2. Copy their user IDs (UUID) from the Authentication → Users page
-- 3. Fill in the details below for each user
-- 4. Run this migration in SQL Editor
--
-- The auth trigger will automatically create matching records when users log in via OAuth.
-- For password logins, the auth.users email will match the users table email.

INSERT INTO public.users (
  id,
  email,
  full_name,
  display_name,
  phone,
  is_admin,
  is_active
) VALUES
  -- Example 1: Bob (Admin)
  -- Copy the UUID from auth.users after creating the user in Supabase
  ('00000000-0000-0000-0000-000000000001', 'bob@example.com', 'Bob Smith', 'Bob', '555-0001', true, true),

  -- Example 2: Jim (Regular Member)
  ('00000000-0000-0000-0000-000000000002', 'jim@example.com', 'Jim Johnson', 'Jim', '555-0002', false, true),

  -- Example 3: Matt (Regular Member)
  ('00000000-0000-0000-0000-000000000003', 'matt@example.com', 'Matt Wilson', 'Matt', '555-0003', false, true),

  -- Example 4: Sarah (Regular Member)
  ('00000000-0000-0000-0000-000000000004', 'sarah@example.com', 'Sarah Davis', 'Sarah', '555-0004', false, true),

  -- Example 5: Tom (Regular Member)
  ('00000000-0000-0000-0000-000000000005', 'tom@example.com', 'Tom Brown', 'Tom', '555-0005', false, true),

  -- Example 6: Lisa (Regular Member)
  ('00000000-0000-0000-0000-000000000006', 'lisa@example.com', 'Lisa Garcia', 'Lisa', '555-0006', false, true),

  -- Example 7: Chris (Regular Member)
  ('00000000-0000-0000-0000-000000000007', 'chris@example.com', 'Chris Martinez', 'Chris', '555-0007', false, true),

  -- Example 8: Jennifer (Regular Member)
  ('00000000-0000-0000-0000-000000000008', 'jen@example.com', 'Jennifer Lopez', 'Jennifer', '555-0008', false, true),

  -- Example 9: David (Regular Member)
  ('00000000-0000-0000-0000-000000000009', 'david@example.com', 'David Taylor', 'David', '555-0009', false, true),

  -- Example 10: Michelle (Regular Member)
  ('00000000-0000-0000-0000-000000000010', 'michelle@example.com', 'Michelle Anderson', 'Michelle', '555-0010', false, true),

  -- Example 11: Kevin (Regular Member)
  ('00000000-0000-0000-0000-000000000011', 'kevin@example.com', 'Kevin Thomas', 'Kevin', '555-0011', false, true),

  -- Example 12: Amanda (Regular Member)
  ('00000000-0000-0000-0000-000000000012', 'amanda@example.com', 'Amanda Jackson', 'Amanda', '555-0012', false, true),

  -- Example 13: Ryan (Regular Member)
  ('00000000-0000-0000-0000-000000000013', 'ryan@example.com', 'Ryan White', 'Ryan', '555-0013', false, true),

  -- Example 14: Nicole (Regular Member)
  ('00000000-0000-0000-0000-000000000014', 'nicole@example.com', 'Nicole Harris', 'Nicole', '555-0014', false, true),

  -- Example 15: Eric (Regular Member)
  ('00000000-0000-0000-0000-000000000015', 'eric@example.com', 'Eric Martin', 'Eric', '555-0015', false, true),

  -- Example 16: Jessica (Regular Member)
  ('00000000-0000-0000-0000-000000000016', 'jessica@example.com', 'Jessica Thompson', 'Jessica', '555-0016', false, true)

ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active
WHERE users.id = EXCLUDED.id;

-- Notes:
-- - is_admin = true only for admins who will manage the league
-- - is_active = true for all active players
-- - phone is optional (can be NULL)
-- - display_name is optional (will use full_name if NULL)
-- - The UUID must match the user ID from Supabase Authentication exactly
--
-- To use this:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create a user via "Add user" button (or invite via email)
-- 3. Copy the UUID from the users list
-- 4. Replace the example UUID with the real one
-- 5. Update email, full_name, etc. with actual details
-- 6. Run this migration in SQL Editor

-- Make user_id nullable on foursome_members to support subs without a user account
ALTER TABLE public.foursome_members ALTER COLUMN user_id DROP NOT NULL;

-- Drop the old unique constraint (it requires non-null user_id semantics)
ALTER TABLE public.foursome_members DROP CONSTRAINT foursome_members_foursome_id_user_id_key;

-- Re-add unique constraint only for rows with a user_id (regular golfers)
CREATE UNIQUE INDEX foursome_members_unique_user
    ON public.foursome_members (foursome_id, user_id)
    WHERE user_id IS NOT NULL;

-- Add unique constraint for sub rows (each sub appears at most once per foursome)
CREATE UNIQUE INDEX foursome_members_unique_sub
    ON public.foursome_members (foursome_id, sub_id)
    WHERE sub_id IS NOT NULL;

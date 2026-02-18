-- Create foursomes table
CREATE TABLE public.foursomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    tee_time_slot INTEGER NOT NULL,
    tee_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, tee_time_slot)
);

-- Create foursome_members table
CREATE TABLE public.foursome_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    foursome_id UUID NOT NULL REFERENCES public.foursomes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    cart_number INTEGER NOT NULL CHECK (cart_number IN (1, 2)),
    is_sub BOOLEAN NOT NULL DEFAULT FALSE,
    sub_id UUID REFERENCES public.subs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(foursome_id, user_id)
);

-- Create indexes
CREATE INDEX idx_foursomes_round ON public.foursomes(round_id);
CREATE INDEX idx_foursome_members_foursome ON public.foursome_members(foursome_id);
CREATE INDEX idx_foursome_members_user ON public.foursome_members(user_id);

-- Apply updated_at trigger
CREATE TRIGGER set_foursomes_updated_at
    BEFORE UPDATE ON public.foursomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.foursomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foursome_members ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read foursomes"
    ON public.foursomes
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read foursome members"
    ON public.foursome_members
    FOR SELECT
    USING (true);

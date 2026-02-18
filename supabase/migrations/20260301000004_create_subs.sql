-- Create subs pool table
CREATE TABLE public.subs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create round_subs assignment table
CREATE TABLE public.round_subs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    sub_id UUID NOT NULL REFERENCES public.subs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, sub_id)
);

-- Create indexes
CREATE INDEX idx_round_subs_round ON public.round_subs(round_id);
CREATE INDEX idx_round_subs_team ON public.round_subs(team_id);

-- Apply updated_at trigger
CREATE TRIGGER set_subs_updated_at
    BEFORE UPDATE ON public.subs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_subs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read subs"
    ON public.subs
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read round subs"
    ON public.round_subs
    FOR SELECT
    USING (true);

-- Create availability status enum
CREATE TYPE availability_status AS ENUM ('in', 'out', 'undeclared');

-- Create round_availability table
CREATE TABLE public.round_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    status availability_status NOT NULL DEFAULT 'undeclared',
    declared_at TIMESTAMPTZ,
    declared_by UUID REFERENCES public.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_id, user_id)
);

-- Create indexes
CREATE INDEX idx_availability_round ON public.round_availability(round_id);
CREATE INDEX idx_availability_team_round ON public.round_availability(round_id, team_id);

-- Apply updated_at trigger
CREATE TRIGGER set_availability_updated_at
    BEFORE UPDATE ON public.round_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.round_availability ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read availability"
    ON public.round_availability
    FOR SELECT
    USING (true);

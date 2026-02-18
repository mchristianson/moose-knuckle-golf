-- Create round status enum
CREATE TYPE round_status AS ENUM (
    'scheduled',
    'availability_open',
    'foursomes_set',
    'in_progress',
    'scoring',
    'completed',
    'cancelled'
);

-- Create round type enum
CREATE TYPE round_type AS ENUM (
    'regular',
    'makeup'
);

-- Create rounds table
CREATE TABLE public.rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_number INTEGER NOT NULL,
    round_date DATE NOT NULL,
    round_type round_type NOT NULL DEFAULT 'regular',
    status round_status NOT NULL DEFAULT 'scheduled',
    season_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    availability_deadline TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(round_number, season_year)
);

-- Create indexes
CREATE INDEX idx_rounds_date ON public.rounds(round_date);
CREATE INDEX idx_rounds_status ON public.rounds(status);
CREATE INDEX idx_rounds_season ON public.rounds(season_year);

-- Apply updated_at trigger
CREATE TRIGGER set_rounds_updated_at
    BEFORE UPDATE ON public.rounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read rounds"
    ON public.rounds
    FOR SELECT
    USING (true);

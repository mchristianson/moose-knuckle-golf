-- Create handicaps table
CREATE TABLE public.handicaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    current_handicap NUMERIC(4,1) NOT NULL DEFAULT 0,
    rounds_played INTEGER NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMPTZ,
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create handicap_history table
CREATE TABLE public.handicap_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    handicap_value NUMERIC(4,1) NOT NULL,
    calculation_method TEXT NOT NULL CHECK (
        calculation_method IN ('calculated', 'manual', 'initial')
    ),
    scores_used JSONB,
    changed_by UUID REFERENCES public.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_handicaps_user ON public.handicaps(user_id);
CREATE INDEX idx_handicap_history_user ON public.handicap_history(user_id);
CREATE INDEX idx_handicap_history_created ON public.handicap_history(created_at);

-- Apply updated_at trigger
CREATE TRIGGER set_handicaps_updated_at
    BEFORE UPDATE ON public.handicaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.handicaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handicap_history ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read handicaps"
    ON public.handicaps
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read handicap history"
    ON public.handicap_history
    FOR SELECT
    USING (true);

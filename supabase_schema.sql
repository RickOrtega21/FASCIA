-- Supabase Schema for FASCIA (Fabuloso Asistente del Sistema de Control Interno y sus Alcances)

-- 1. Table for auto-saving current evaluations (in-progress)
CREATE TABLE public.evaluations_state (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    area_name text NOT NULL UNIQUE,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Table for saving completed/historical reports
CREATE TABLE public.reports_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    evaluator_name text,
    period text NOT NULL,
    score integer,
    created_at timestamp with time zone DEFAULT now(),
    report_data jsonb NOT NULL
);

-- Note: In a real-world scenario, you should enable Row Level Security (RLS)
-- and configure appropriate access policies for your users.
-- Example:
-- ALTER TABLE public.evaluations_state ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access" ON public.evaluations_state FOR ALL USING (true);

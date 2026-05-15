ALTER TABLE public.completed_trips ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS transport_type text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS departure_city text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS stops jsonb DEFAULT '[]'::jsonb;
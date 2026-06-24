CREATE TABLE public.completed_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}'::text[],
  trip_month INTEGER,
  trip_year INTEGER,
  agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE SET NULL,
  client_quote TEXT,
  client_name TEXT,
  client_photo TEXT,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published completed trips"
ON public.completed_trips FOR SELECT
USING (is_published = true);

CREATE POLICY "Staff can manage completed trips"
ON public.completed_trips FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Partners can manage own agency completed trips"
ON public.completed_trips FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));

CREATE TRIGGER update_completed_trips_updated_at
BEFORE UPDATE ON public.completed_trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_completed_trips_published ON public.completed_trips(is_published, display_order DESC, created_at DESC);
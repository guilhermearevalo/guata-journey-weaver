
-- 1. Itinerary Templates table
CREATE TABLE public.itinerary_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT,
  duration_days INTEGER,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_templates ENABLE ROW LEVEL SECURITY;

-- Staff can manage all templates
CREATE POLICY "Staff can manage all templates"
  ON public.itinerary_templates FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()));

-- Partners can manage own agency templates
CREATE POLICY "Partners can manage own templates"
  ON public.itinerary_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'partner') AND agency_id = get_user_agency(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'partner') AND agency_id = get_user_agency(auth.uid()));

-- 2. Add is_external flag to partner_agencies for agencies that don't use the platform
ALTER TABLE public.partner_agencies ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- 3. Add external_notes to travel_requests for tracking comms with external agencies
ALTER TABLE public.travel_requests ADD COLUMN IF NOT EXISTS external_notes TEXT;

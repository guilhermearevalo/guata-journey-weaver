ALTER TABLE public.partner_agencies
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE OR REPLACE VIEW public.partner_agency_branding AS
SELECT id, name, logo_url, cover_image_url
FROM public.partner_agencies
WHERE is_active = true;

GRANT SELECT ON public.partner_agency_branding TO anon, authenticated;

-- Premium itinerary: document privacy default, branding phone, client name in public RPC

ALTER TABLE public.travel_documents
  ALTER COLUMN visible_in_public SET DEFAULT false;

CREATE OR REPLACE VIEW public.partner_agency_branding AS
SELECT id, name, logo_url, cover_image_url, contact_phone
FROM public.partner_agencies
WHERE is_active = true;

GRANT SELECT ON public.partner_agency_branding TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_itinerary(_token text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'request_id', p.request_id,
    'title', p.title,
    'itinerary', p.itinerary,
    'dossier', p.dossier,
    'documents_checklist', p.documents_checklist,
    'share_enabled', p.share_enabled,
    'agency_id', p.agency_id,
    'has_access_code', (p.access_code IS NOT NULL),
    'request', jsonb_build_object(
      'destination', tr.destination,
      'travel_dates', tr.travel_dates,
      'travelers_count', tr.travelers_count,
      'client_name', tr.client_name
    )
  )
  FROM public.proposals p
  LEFT JOIN public.travel_requests tr ON tr.id = p.request_id
  WHERE p.share_token = _token
    AND p.share_enabled = true
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_public_itinerary(text) TO anon, authenticated;

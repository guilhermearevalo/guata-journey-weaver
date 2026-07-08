-- Partner applications: track when admin has reviewed a pending request (clears sidebar badge)
ALTER TABLE public.partner_agencies
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_partner_agencies_unreviewed_pending
  ON public.partner_agencies (created_at DESC)
  WHERE is_active = false AND admin_reviewed_at IS NULL;

-- Public itinerary documents: include file_path (private bucket) not only file_url
CREATE OR REPLACE FUNCTION public.get_public_travel_documents(_token text, _code text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  proposal_id uuid,
  title text,
  category text,
  file_url text,
  file_path text,
  notes text,
  visible_in_public boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT td.id, td.proposal_id, td.title, td.category, td.file_url, td.file_path, td.notes,
         td.visible_in_public, td.created_at
  FROM public.travel_documents td
  JOIN public.proposals p ON p.id = td.proposal_id
  WHERE p.share_token = _token
    AND p.share_enabled = true
    AND td.visible_in_public = true
    AND (td.file_path IS NOT NULL OR td.file_url IS NOT NULL)
    AND (
      p.access_code IS NULL
      OR (_code IS NOT NULL AND upper(p.access_code) = upper(_code))
    )
  ORDER BY td.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_public_travel_documents(text, text) TO anon, authenticated;

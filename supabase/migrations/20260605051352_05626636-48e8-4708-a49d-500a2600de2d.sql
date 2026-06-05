
-- ============================================================
-- 1. Helper: a proposal is publicly shared (security definer so
--    other tables' policies don't depend on proposals RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.proposal_is_shared(_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = _proposal_id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  )
$$;

-- ============================================================
-- 2. Token-gated public proposal (requires exact token match)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_public_proposal(_token text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'total_price', p.total_price,
    'payment_status', p.payment_status,
    'payment_enabled', p.payment_enabled,
    'share_enabled', p.share_enabled,
    'payment_links', p.payment_links,
    'inclusions', p.inclusions,
    'itinerary', p.itinerary,
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

-- ============================================================
-- 3. Token-gated public itinerary (no client PII)
-- ============================================================
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
      'travelers_count', tr.travelers_count
    )
  )
  FROM public.proposals p
  LEFT JOIN public.travel_requests tr ON tr.id = p.request_id
  WHERE p.share_token = _token
    AND p.share_enabled = true
  LIMIT 1
$$;

-- ============================================================
-- 4. Validate access code without exposing it
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_proposal_access_code(_token text, _code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.share_token = _token
      AND p.share_enabled = true
      AND p.access_code IS NOT NULL
      AND upper(p.access_code) = upper(_code)
  )
$$;

-- Public read access to the token-gated RPCs only
REVOKE ALL ON FUNCTION public.get_public_proposal(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_itinerary(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_proposal_access_code(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.proposal_is_shared(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_proposal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_itinerary(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_proposal_access_code(text, text) TO anon, authenticated;

-- ============================================================
-- 5. Drop the over-permissive public SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view shared proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can view requests of shared proposals" ON public.travel_requests;

-- ============================================================
-- 6. Public document visibility now uses the security-definer
--    helper (no longer relies on direct proposals read)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view public shared travel documents" ON public.travel_documents;
CREATE POLICY "Anyone can view public shared travel documents"
ON public.travel_documents
FOR SELECT
TO anon, authenticated
USING (
  visible_in_public = true
  AND file_url IS NOT NULL
  AND public.proposal_is_shared(proposal_id)
);

-- ============================================================
-- 7. Scope partner access on the travel-documents storage bucket
-- ============================================================
DROP POLICY IF EXISTS "Partners can manage agency travel document files" ON storage.objects;

CREATE POLICY "Partners can insert agency travel document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'travel-documents'
  AND has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = get_user_agency(auth.uid())
  )
);

CREATE POLICY "Partners can update agency travel document files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = get_user_agency(auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'travel-documents'
  AND has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = get_user_agency(auth.uid())
  )
);

CREATE POLICY "Partners can delete agency travel document files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = get_user_agency(auth.uid())
  )
);

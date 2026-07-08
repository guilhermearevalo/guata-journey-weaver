-- Security hardening: itinerary access code, rate limit, document RLS, proposal checks

-- Rate limit access-code brute force
CREATE TABLE IF NOT EXISTS public.proposal_access_attempts (
  share_token text PRIMARY KEY,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_access_attempts ENABLE ROW LEVEL SECURITY;

-- No direct client access
CREATE POLICY "proposal_access_attempts_deny_all"
  ON public.proposal_access_attempts
  FOR ALL
  TO authenticated, anon
  USING (false);

-- Strict shared-proposal check (NULL share_enabled is NOT public)
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
      AND p.share_enabled IS TRUE
  )
$$;

-- Itinerary RPC: requires access code when configured; no client_name in public payload
CREATE OR REPLACE FUNCTION public.get_public_itinerary(_token text, _code text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.access_code IS NOT NULL
      AND (_code IS NULL OR upper(trim(p.access_code)) <> upper(trim(_code)))
    THEN jsonb_build_object(
      'id', p.id,
      'share_enabled', p.share_enabled,
      'has_access_code', true,
      'locked', true
    )
    ELSE jsonb_build_object(
      'id', p.id,
      'request_id', p.request_id,
      'title', p.title,
      'itinerary', p.itinerary,
      'dossier', p.dossier,
      'documents_checklist', p.documents_checklist,
      'share_enabled', p.share_enabled,
      'agency_id', p.agency_id,
      'has_access_code', (p.access_code IS NOT NULL),
      'locked', false,
      'request', jsonb_build_object(
        'destination', tr.destination,
        'travel_dates', tr.travel_dates,
        'travelers_count', tr.travelers_count
      )
    )
  END
  FROM public.proposals p
  LEFT JOIN public.travel_requests tr ON tr.id = p.request_id
  WHERE p.share_token = _token
    AND p.share_enabled IS TRUE
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_public_itinerary(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_itinerary(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_public_itinerary(text);

-- Access code verification with lockout after 5 failures (15 min)
CREATE OR REPLACE FUNCTION public.verify_proposal_access_code(_token text, _code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked timestamptz;
  v_failed integer;
  v_ok boolean;
BEGIN
  SELECT locked_until, failed_attempts
  INTO v_locked, v_failed
  FROM public.proposal_access_attempts
  WHERE share_token = _token
  FOR UPDATE;

  IF v_locked IS NOT NULL AND v_locked > now() THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.share_token = _token
      AND p.share_enabled IS TRUE
      AND p.access_code IS NOT NULL
      AND upper(trim(p.access_code)) = upper(trim(_code))
  ) INTO v_ok;

  IF v_ok THEN
    INSERT INTO public.proposal_access_attempts (share_token, failed_attempts, locked_until, updated_at)
    VALUES (_token, 0, NULL, now())
    ON CONFLICT (share_token) DO UPDATE
      SET failed_attempts = 0, locked_until = NULL, updated_at = now();
    RETURN true;
  END IF;

  INSERT INTO public.proposal_access_attempts (share_token, failed_attempts, locked_until, updated_at)
  VALUES (_token, 1, NULL, now())
  ON CONFLICT (share_token) DO UPDATE
    SET failed_attempts = proposal_access_attempts.failed_attempts + 1,
        locked_until = CASE
          WHEN proposal_access_attempts.failed_attempts + 1 >= 5
          THEN now() + interval '15 minutes'
          ELSE proposal_access_attempts.locked_until
        END,
        updated_at = now();

  RETURN false;
END;
$$;

-- Public proposal: remove client_name from anonymous payload
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
      'travelers_count', tr.travelers_count
    )
  )
  FROM public.proposals p
  LEFT JOIN public.travel_requests tr ON tr.id = p.request_id
  WHERE p.share_token = _token
    AND p.share_enabled IS TRUE
  LIMIT 1
$$;

-- Documents: no anonymous direct SELECT (use get_public_travel_documents RPC)
DROP POLICY IF EXISTS "Anyone can view public shared travel documents" ON public.travel_documents;

-- RPC for authenticated document open (staff / client / partner)
CREATE OR REPLACE FUNCTION public.can_access_travel_document(_document_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.travel_documents td
    WHERE td.id = _document_id
      AND (
        public.is_staff(_user_id)
        OR EXISTS (
          SELECT 1 FROM public.travel_requests tr
          WHERE tr.id = td.request_id AND tr.client_id = _user_id
        )
        OR (
          public.has_role(_user_id, 'partner'::app_role)
          AND EXISTS (
            SELECT 1 FROM public.proposals p
            WHERE p.id = td.proposal_id
              AND p.agency_id = public.get_user_agency(_user_id)
          )
        )
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_access_travel_document(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_travel_document(uuid, uuid) TO authenticated;

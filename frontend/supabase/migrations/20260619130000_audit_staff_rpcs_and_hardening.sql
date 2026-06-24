-- Audit: RPCs staff consolidados, aprovação pelo cliente, PII pública e demo.

-- ============================================================
-- Helpers (idempotente)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = _request_id AND tr.client_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_shared_proposal_for_request(_request_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = _request_id
      AND p.share_token IS NOT NULL
      AND COALESCE(p.share_enabled, true) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.proposal_is_shared(_proposal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = _proposal_id
      AND p.share_token IS NOT NULL
      AND COALESCE(p.share_enabled, true) = true
  );
$$;

-- ============================================================
-- Staff policies (SELECT)
-- ============================================================

DROP POLICY IF EXISTS "Staff can view all requests" ON public.travel_requests;
CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all proposals" ON public.proposals;
CREATE POLICY "Staff can view all proposals"
ON public.proposals FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all travel documents" ON public.travel_documents;
CREATE POLICY "Staff can view all travel documents"
ON public.travel_documents FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view public shared travel documents" ON public.travel_documents;
CREATE POLICY "Anyone can view public shared travel documents"
ON public.travel_documents FOR SELECT TO anon, authenticated
USING (
  visible_in_public = true
  AND file_url IS NOT NULL
  AND public.proposal_is_shared(proposal_id)
);

-- ============================================================
-- RPCs staff — leitura
-- ============================================================

CREATE OR REPLACE FUNCTION public.staff_list_travel_requests()
RETURNS SETOF public.travel_requests
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_requests
  WHERE public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.staff_get_travel_request(p_id uuid)
RETURNS SETOF public.travel_requests
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_requests
  WHERE id = p_id AND public.is_staff(auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.staff_get_proposal_by_request(p_request_id uuid)
RETURNS SETOF public.proposals
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.proposals
  WHERE request_id = p_request_id AND public.is_staff(auth.uid())
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.staff_list_proposal_request_ids()
RETURNS TABLE(request_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (p.request_id) p.request_id
  FROM public.proposals p
  WHERE public.is_staff(auth.uid())
  ORDER BY p.request_id, p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.staff_list_travel_documents(p_proposal_id uuid)
RETURNS SETOF public.travel_documents
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_documents
  WHERE proposal_id = p_proposal_id AND public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

-- ============================================================
-- RPCs staff — gravação
-- ============================================================

CREATE OR REPLACE FUNCTION public.staff_update_travel_request_status(
  p_id uuid,
  p_status public.request_status
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.travel_requests
  SET status = p_status, updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_itinerary(
  p_proposal_id uuid,
  p_itinerary jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET itinerary = p_itinerary, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_dossier(
  p_proposal_id uuid,
  p_dossier jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET dossier = p_dossier, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_share_token(
  p_proposal_id uuid,
  p_share_token text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET share_token = p_share_token, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_insert_travel_document(
  p_proposal_id uuid,
  p_request_id uuid,
  p_title text,
  p_category text DEFAULT 'other',
  p_document_type text DEFAULT 'vault',
  p_status text DEFAULT 'pending',
  p_file_url text DEFAULT NULL,
  p_file_path text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_visible_in_public boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.travel_documents (
    proposal_id, request_id, title, category, document_type, status,
    file_url, file_path, notes, visible_in_public, uploaded_by
  ) VALUES (
    p_proposal_id, p_request_id, p_title, p_category, p_document_type, p_status,
    p_file_url, p_file_path, p_notes, p_visible_in_public, auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_travel_document(
  p_id uuid,
  p_status text DEFAULT NULL,
  p_visible_in_public boolean DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.travel_documents
  SET
    status = COALESCE(p_status, status),
    visible_in_public = COALESCE(p_visible_in_public, visible_in_public),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_travel_document(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.travel_documents WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT request_id INTO v_request_id
  FROM public.proposals
  WHERE id = p_proposal_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;

  DELETE FROM public.travel_documents WHERE proposal_id = p_proposal_id;
  DELETE FROM public.proposals WHERE id = p_proposal_id;

  UPDATE public.travel_requests
  SET status = 'in_analysis', updated_at = now()
  WHERE id = v_request_id
    AND status NOT IN ('completed', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_travel_request(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.travel_documents WHERE request_id = p_id;
  DELETE FROM public.travel_documents
  WHERE proposal_id IN (SELECT id FROM public.proposals WHERE request_id = p_id);
  DELETE FROM public.proposals WHERE request_id = p_id;
  DELETE FROM public.travel_requests WHERE id = p_id;
END;
$$;

-- ============================================================
-- Cliente aprova proposta (evita UPDATE direto bloqueado por RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.client_approve_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  SELECT request_id INTO v_request_id
  FROM public.proposals
  WHERE id = p_proposal_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;

  IF NOT public.is_request_client(v_request_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.proposals
  SET is_approved = true, updated_at = now()
  WHERE id = p_proposal_id;

  UPDATE public.travel_requests
  SET status = 'approved', updated_at = now()
  WHERE id = v_request_id;
END;
$$;

-- ============================================================
-- Proposta pública sem PII do cliente
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_proposal(_token text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
    AND p.share_enabled = true
  LIMIT 1
$$;

-- ============================================================
-- Demo: só contas @guata.test; revogar em produção para demais
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_agency_id uuid;
  v_email text;
BEGIN
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL OR v_email NOT LIKE '%@guata.test' THEN
    RAISE EXCEPTION 'demo roles only available for @guata.test accounts';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email)
  SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
  FROM auth.users WHERE email LIKE '%@guata.test'
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.user_roles SET role = 'admin'
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');

  UPDATE public.user_roles SET role = 'consultant'
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');

  UPDATE public.user_roles SET role = 'partner'
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');

  SELECT id INTO v_partner_id FROM auth.users WHERE email = 'parceiro@guata.test';
  SELECT id INTO v_agency_id FROM partner_agencies LIMIT 1;

  IF v_partner_id IS NOT NULL AND v_agency_id IS NOT NULL THEN
    INSERT INTO public.partner_users (user_id, agency_id)
    VALUES (v_partner_id, v_agency_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- ============================================================
-- Grants
-- ============================================================

REVOKE ALL ON FUNCTION public.staff_list_travel_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_get_travel_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_get_proposal_by_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_list_proposal_request_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_list_travel_documents(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_travel_request_status(uuid, public.request_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_share_token(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_insert_travel_document(uuid, uuid, text, text, text, text, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_travel_document(uuid, text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_travel_document(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_proposal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_travel_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.client_approve_proposal(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.staff_list_travel_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_travel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_proposal_by_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_proposal_request_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_travel_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_request_status(uuid, public.request_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_share_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_insert_travel_document(uuid, uuid, text, text, text, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_document(uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_approve_proposal(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.proposal_is_shared(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.update_demo_roles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_demo_roles() TO authenticated;

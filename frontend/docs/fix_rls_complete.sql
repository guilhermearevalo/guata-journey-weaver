-- Fix completo: funções RLS + RPCs staff + deduplicar propostas
-- Rode no SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

-- ============================================================
-- 0) Colunas que podem faltar em bancos migrados
-- ============================================================
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS dossier jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT true;

-- ============================================================
-- 1) Funções auxiliares (policies quebram se não existirem)
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

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.proposal_is_shared(uuid) TO anon, authenticated;

-- ============================================================
-- 2) Policies explícitas de staff (SELECT)
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
-- 3) RPCs staff — leitura
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
-- 4) RPCs staff — gravação
-- ============================================================

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

REVOKE ALL ON FUNCTION public.staff_list_travel_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_get_travel_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_get_proposal_by_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_list_proposal_request_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_list_travel_documents(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_share_token(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.staff_list_travel_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_travel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_proposal_by_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_proposal_request_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_travel_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_share_token(uuid, text) TO authenticated;

-- ============================================================
-- 5) Deduplicar propostas (mantém a mais recente por demanda)
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  keep_id uuid;
BEGIN
  FOR rec IN
    SELECT request_id
    FROM public.proposals
    GROUP BY request_id
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM public.proposals
    WHERE request_id = rec.request_id
    ORDER BY created_at DESC
    LIMIT 1;

    DELETE FROM public.travel_documents
    WHERE proposal_id IN (
      SELECT id FROM public.proposals
      WHERE request_id = rec.request_id AND id <> keep_id
    );

    DELETE FROM public.proposals
    WHERE request_id = rec.request_id AND id <> keep_id;
  END LOOP;
END $$;

-- ============================================================
-- 6) Verificação
-- ============================================================

SELECT request_id, COUNT(*) AS qtd
FROM public.proposals
GROUP BY request_id
HAVING COUNT(*) > 1;

SELECT id, request_id, created_at
FROM public.proposals
WHERE request_id = 'b0602509-477e-495f-bf43-56bc4bf2a776'
ORDER BY created_at DESC;

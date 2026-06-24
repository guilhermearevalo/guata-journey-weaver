-- Corrige erros 500 em REST (RLS referencia funções que não existiam no banco migrado).
-- Rode DEPOIS de fix_travel_requests_500.sql e fix_proposals_500.sql.
-- SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

-- ============================================================
-- 1) Funções auxiliares ausentes (policies de cliente/público)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.travel_requests tr
    WHERE tr.id = _request_id
      AND tr.client_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_shared_proposal_for_request(_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proposals p
    WHERE p.request_id = _request_id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  );
$$;

CREATE OR REPLACE FUNCTION public.proposal_is_shared(_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proposals p
    WHERE p.id = _proposal_id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  );
$$;

-- ============================================================
-- 2) GRANTs nas funções usadas pelas policies
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.proposal_is_shared(uuid) TO anon, authenticated;

-- ============================================================
-- 3) Policies explícitas de staff (SELECT)
-- ============================================================

DROP POLICY IF EXISTS "Staff can view all travel documents" ON public.travel_documents;
CREATE POLICY "Staff can view all travel documents"
ON public.travel_documents FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view public shared travel documents" ON public.travel_documents;
CREATE POLICY "Anyone can view public shared travel documents"
ON public.travel_documents FOR SELECT
TO anon, authenticated
USING (
  visible_in_public = true
  AND file_url IS NOT NULL
  AND public.proposal_is_shared(proposal_id)
);

-- ============================================================
-- 4) RPCs fallback — documentos e salvar roteiro
-- ============================================================

CREATE OR REPLACE FUNCTION public.staff_list_travel_documents(p_proposal_id uuid)
RETURNS SETOF public.travel_documents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.travel_documents
  WHERE proposal_id = p_proposal_id
    AND public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.staff_list_travel_documents(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_list_travel_documents(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_itinerary(
  p_proposal_id uuid,
  p_itinerary jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.proposals
  SET itinerary = p_itinerary,
      updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_dossier(
  p_proposal_id uuid,
  p_dossier jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.proposals
  SET dossier = p_dossier,
      updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) TO authenticated;

-- ============================================================
-- 5) Verificação
-- ============================================================

SELECT proname
FROM pg_proc
WHERE proname IN (
  'is_request_client',
  'has_shared_proposal_for_request',
  'proposal_is_shared',
  'staff_list_travel_documents',
  'staff_update_proposal_itinerary'
)
ORDER BY proname;

SELECT COUNT(*) AS total_documentos FROM public.travel_documents;

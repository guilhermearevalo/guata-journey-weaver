-- Corrige erro 500 ao ler/gravar proposals via API autenticada (RLS/funções).
-- Rode no SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

-- 1) Permissões nas funções usadas pelas policies
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;

-- 2) Policy explícita de SELECT para staff
DROP POLICY IF EXISTS "Staff can view all proposals" ON public.proposals;
CREATE POLICY "Staff can view all proposals"
ON public.proposals FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 3) RPC — proposta por demanda (fallback do frontend)
CREATE OR REPLACE FUNCTION public.staff_get_proposal_by_request(p_request_id uuid)
RETURNS SETOF public.proposals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.proposals
  WHERE request_id = p_request_id
    AND public.is_staff(auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.staff_get_proposal_by_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_get_proposal_by_request(uuid) TO authenticated;

-- 4) RPC — ids de demandas que já têm proposta (Kanban)
CREATE OR REPLACE FUNCTION public.staff_list_proposal_request_ids()
RETURNS TABLE(request_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.request_id
  FROM public.proposals p
  WHERE public.is_staff(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.staff_list_proposal_request_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_list_proposal_request_ids() TO authenticated;

-- 5) RPC — demanda individual (join do roteiro quando REST falha)
CREATE OR REPLACE FUNCTION public.staff_get_travel_request(p_id uuid)
RETURNS SETOF public.travel_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.travel_requests
  WHERE id = p_id
    AND public.is_staff(auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.staff_get_travel_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_get_travel_request(uuid) TO authenticated;

-- 6) Verificação
SELECT COUNT(*) AS total_propostas FROM public.proposals;

SELECT p.id, p.title, p.request_id, tr.client_name
FROM public.proposals p
JOIN public.travel_requests tr ON tr.id = p.request_id
ORDER BY p.created_at DESC
LIMIT 5;

-- Corrige recursão infinita (42P17) entre as policies de proposals e travel_requests.
--
-- Sintoma: "infinite recursion detected in policy for relation proposals"
-- (aparece ao salvar roteiro / dossiê e em SELECTs via REST).
--
-- Causa: a policy de proposals consultava travel_requests com subconsulta inline,
-- e a de travel_requests consultava proposals inline -> loop infinito no RLS.
--
-- Solução: usar funções SECURITY DEFINER (que ignoram RLS internamente),
-- quebrando o ciclo.

CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = _request_id AND tr.client_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_shared_proposal_for_request(_request_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = _request_id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Clients can view proposals for their requests" ON public.proposals;
CREATE POLICY "Clients can view proposals for their requests"
ON public.proposals FOR SELECT TO authenticated
USING (public.is_request_client(request_id, auth.uid()));

DROP POLICY IF EXISTS "Anyone can view requests of shared proposals" ON public.travel_requests;
CREATE POLICY "Anyone can view requests of shared proposals"
ON public.travel_requests FOR SELECT TO anon, authenticated
USING (public.has_shared_proposal_for_request(id));

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
  )
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
  )
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_commission_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_demo_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_agency(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_demo_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Clients can view proposals for their requests" ON public.proposals;
CREATE POLICY "Clients can view proposals for their requests"
ON public.proposals
FOR SELECT
TO authenticated
USING (public.is_request_client(request_id, auth.uid()));

DROP POLICY IF EXISTS "Anyone can view requests of shared proposals" ON public.travel_requests;
CREATE POLICY "Anyone can view requests of shared proposals"
ON public.travel_requests
FOR SELECT
TO anon, authenticated
USING (public.has_shared_proposal_for_request(id));
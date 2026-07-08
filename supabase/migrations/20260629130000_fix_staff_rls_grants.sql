-- Corrige erro 500 em SELECT via REST quando is_staff() não tem GRANT para authenticated.
-- Mesmo conteúdo de docs/fix_proposals_500.sql (seções 1–2).

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Staff can view all proposals" ON public.proposals;
CREATE POLICY "Staff can view all proposals"
ON public.proposals FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all requests" ON public.travel_requests;
CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

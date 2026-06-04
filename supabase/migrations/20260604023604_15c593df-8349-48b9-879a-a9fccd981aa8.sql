REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_agency(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_request_client(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_shared_proposal_for_request(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;
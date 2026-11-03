CREATE OR REPLACE FUNCTION public.admin_delete_partner_agency(_agency_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  DELETE FROM public.user_roles WHERE role = 'partner' AND user_id IN (SELECT user_id FROM public.partner_users WHERE agency_id = _agency_id);
  DELETE FROM public.partner_users WHERE agency_id = _agency_id;
  DELETE FROM public.commission_payments WHERE agency_id = _agency_id;
  DELETE FROM public.monthly_settlements WHERE agency_id = _agency_id;
  UPDATE public.travel_requests SET assigned_agency_id = NULL WHERE assigned_agency_id = _agency_id;
  UPDATE public.proposals SET agency_id = NULL WHERE agency_id = _agency_id;
  UPDATE public.experiences SET operator_agency_id = NULL WHERE operator_agency_id = _agency_id;
  UPDATE public.completed_trips SET agency_id = NULL WHERE agency_id = _agency_id;
  UPDATE public.itinerary_templates SET agency_id = NULL WHERE agency_id = _agency_id;
  DELETE FROM public.partner_agencies WHERE id = _agency_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_delete_partner_agency(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_partner_agency(uuid) TO authenticated;
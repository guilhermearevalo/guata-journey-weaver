-- RPC staff para atualizar tipo de serviço (contorna 500 de RLS no REST).

CREATE OR REPLACE FUNCTION public.staff_update_travel_request_service_type(
  p_id uuid,
  p_service_type public.service_type,
  p_service_type_note text DEFAULT NULL
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

  UPDATE public.travel_requests
  SET
    service_type = p_service_type,
    service_type_note = CASE
      WHEN p_service_type = 'other' THEN NULLIF(TRIM(p_service_type_note), '')
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_update_travel_request_service_type(uuid, public.service_type, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_request_service_type(uuid, public.service_type, text) TO authenticated;

-- RPC para atualizar status de demanda (Kanban drag) quando REST PATCH retorna 500.
-- Rode no SQL Editor se arrastar colunas no Kanban falhar.

CREATE OR REPLACE FUNCTION public.staff_update_travel_request_status(
  p_id uuid,
  p_status public.request_status
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
  SET status = p_status,
      updated_at = now()
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_update_travel_request_status(uuid, public.request_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_request_status(uuid, public.request_status) TO authenticated;

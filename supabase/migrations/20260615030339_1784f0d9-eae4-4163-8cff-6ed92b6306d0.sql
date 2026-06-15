-- Remove the overly-permissive direct UPDATE policy
DROP POLICY IF EXISTS "Partners update own pending notes" ON public.commission_payments;

-- Provide a controlled way for partners to update ONLY the notes field
CREATE OR REPLACE FUNCTION public.update_commission_note(_payment_id uuid, _notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency uuid;
BEGIN
  -- Only partners may call this
  IF NOT has_role(auth.uid(), 'partner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_agency := get_user_agency(auth.uid());

  UPDATE public.commission_payments
  SET notes = _notes
  WHERE id = _payment_id
    AND agency_id = v_agency
    AND source = 'external'
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record not found or not editable';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_commission_note(uuid, text) TO authenticated;
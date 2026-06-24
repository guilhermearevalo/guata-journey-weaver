-- 1) Remove the unconstrained partner INSERT policy on commission_payments
DROP POLICY IF EXISTS "Partners insert external sales" ON public.commission_payments;

-- Server-side RPC that computes financial fields from a declared gross amount
-- and the agency's commission rate. Partners cannot self-report payout figures.
CREATE OR REPLACE FUNCTION public.partner_insert_external_sale(
  _gross_amount numeric,
  _client_name text DEFAULT NULL,
  _destination text DEFAULT NULL,
  _sale_date date DEFAULT CURRENT_DATE,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency uuid;
  v_rate numeric := 10.00;
  v_commission numeric;
  v_partner numeric;
  v_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'partner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _gross_amount IS NULL OR _gross_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid gross amount';
  END IF;

  v_agency := get_user_agency(auth.uid());
  IF v_agency IS NULL THEN
    RAISE EXCEPTION 'Partner is not linked to an agency';
  END IF;

  SELECT COALESCE(commission_rate, 10.00) INTO v_rate
  FROM partner_agencies WHERE id = v_agency;
  v_rate := COALESCE(v_rate, 10.00);

  v_commission := round(_gross_amount * v_rate / 100.0, 2);
  v_partner := _gross_amount - v_commission;

  INSERT INTO public.commission_payments (
    agency_id, proposal_id, gross_amount, guata_commission, partner_amount,
    stripe_fee, status, source, sale_date, client_name, destination, notes, created_by
  ) VALUES (
    v_agency, NULL, _gross_amount, v_commission, v_partner,
    0, 'pending', 'external', _sale_date, _client_name, _destination, _notes, auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_insert_external_sale(numeric, text, text, date, text) TO authenticated;

-- 2) Lock down Realtime Broadcast/Presence: default-deny on realtime.messages.
-- The app only uses postgres_changes (governed by table RLS), so denying
-- broadcast/presence subscriptions has no functional impact.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny realtime broadcast and presence" ON realtime.messages;
CREATE POLICY "Deny realtime broadcast and presence"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (false);
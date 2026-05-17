-- 1. proposals: switch para desativar link público
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT true;

-- 2. commission_payments: campos extras para vendas externas
ALTER TABLE public.commission_payments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS sale_date date,
  ADD COLUMN IF NOT EXISTS settlement_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. monthly_settlements: fechamento mensal por agência
CREATE TABLE IF NOT EXISTS public.monthly_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL,
  period_year int NOT NULL,
  period_month int NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, period_year, period_month)
);

ALTER TABLE public.monthly_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settlements"
  ON public.monthly_settlements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff view settlements"
  ON public.monthly_settlements FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Partners view own settlements"
  ON public.monthly_settlements FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.monthly_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS extra para parceiros lançarem vendas externas em commission_payments
CREATE POLICY "Partners insert external sales"
  ON public.commission_payments FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'partner'::app_role)
    AND agency_id = get_user_agency(auth.uid())
    AND source = 'external'
    AND proposal_id IS NULL
  );

CREATE POLICY "Partners update own pending notes"
  ON public.commission_payments FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'partner'::app_role)
    AND agency_id = get_user_agency(auth.uid())
    AND source = 'external'
    AND status = 'pending'
  );

-- 5. Trigger: ao marcar proposta como paga, gerar commission_payment automaticamente
CREATE OR REPLACE FUNCTION public.generate_commission_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric := 10.00;
  v_gross numeric;
  v_commission numeric;
  v_partner numeric;
BEGIN
  IF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status,'') <> 'paid' THEN
    -- só gera se não existir ainda
    IF EXISTS (SELECT 1 FROM commission_payments WHERE proposal_id = NEW.id) THEN
      RETURN NEW;
    END IF;
    -- só faz sentido para propostas vinculadas a agência parceira
    IF NEW.agency_id IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT commission_rate INTO v_rate FROM partner_agencies WHERE id = NEW.agency_id;
    v_rate := COALESCE(v_rate, 10.00);
    v_gross := COALESCE(NEW.total_price, 0);
    v_commission := round(v_gross * v_rate / 100.0, 2);
    v_partner := v_gross - v_commission;
    INSERT INTO commission_payments (
      agency_id, proposal_id, gross_amount, guata_commission, partner_amount,
      stripe_fee, status, source, sale_date
    ) VALUES (
      NEW.agency_id, NEW.id, v_gross, v_commission, v_partner,
      0, 'pending', 'platform', CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proposals_generate_commission ON public.proposals;
CREATE TRIGGER proposals_generate_commission
  AFTER UPDATE OF payment_status ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.generate_commission_on_paid();
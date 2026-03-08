
-- Campo para definir quem paga taxa Stripe
ALTER TABLE partner_agencies 
  ADD COLUMN stripe_fee_bearer text DEFAULT 'guata';

-- Tabela de registro de repasses/comissões
CREATE TABLE commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES partner_agencies(id) ON DELETE CASCADE NOT NULL,
  gross_amount numeric NOT NULL,
  stripe_fee numeric DEFAULT 0,
  guata_commission numeric NOT NULL,
  partner_amount numeric NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  paid_at timestamptz,
  paid_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo
CREATE POLICY "Admins can manage commission payments"
  ON commission_payments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff pode visualizar
CREATE POLICY "Staff can view commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

-- Parceiro vê apenas os seus
CREATE POLICY "Partners can view own commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));

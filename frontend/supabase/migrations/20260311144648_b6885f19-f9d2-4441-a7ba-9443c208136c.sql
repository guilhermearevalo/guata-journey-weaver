
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'active');

CREATE POLICY "Staff can view all subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage subscribers" ON newsletter_subscribers
  FOR ALL TO authenticated USING (is_staff(auth.uid()));

CREATE TABLE public.site_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 30),
  destination text CHECK (destination IS NULL OR char_length(destination) <= 200),
  source text CHECK (source IS NULL OR char_length(source) <= 60),
  lang text CHECK (lang IS NULL OR lang IN ('pt','en','es')),
  page text CHECK (page IS NULL OR char_length(page) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_leads TO anon, authenticated;
GRANT SELECT, DELETE ON public.site_leads TO authenticated;
GRANT ALL ON public.site_leads TO service_role;
ALTER TABLE public.site_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.site_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read leads" ON public.site_leads FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete leads" ON public.site_leads FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
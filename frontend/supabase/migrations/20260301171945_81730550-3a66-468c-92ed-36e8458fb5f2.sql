
-- 1. Create site_settings table
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage site settings"
  ON public.site_settings FOR ALL
  USING (is_staff(auth.uid()));

-- 2. Bucket site-assets — crie via Dashboard/API (docs/MIGRAR_STORAGE.md)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Staff can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND is_staff(auth.uid()));

CREATE POLICY "Staff can update site assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

CREATE POLICY "Staff can delete site assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

-- 3. Add payment_links column to proposals
ALTER TABLE public.proposals ADD COLUMN payment_links JSONB DEFAULT '{}'::jsonb;

-- 4. Insert default hero image setting
INSERT INTO public.site_settings (key, value) VALUES ('hero_image_url', '"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"');

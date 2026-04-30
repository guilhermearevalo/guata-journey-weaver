ALTER TABLE public.partner_agencies
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_agencies'
      AND policyname = 'Anyone can view active agency branding'
  ) THEN
    CREATE POLICY "Anyone can view active agency branding"
    ON public.partner_agencies
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
  END IF;
END $$;

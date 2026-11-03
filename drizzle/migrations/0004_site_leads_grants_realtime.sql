GRANT SELECT, DELETE ON public.site_leads TO authenticated;
GRANT INSERT ON public.site_leads TO anon, authenticated;
GRANT ALL ON public.site_leads TO service_role;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.site_leads; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
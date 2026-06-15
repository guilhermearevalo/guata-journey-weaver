ALTER TABLE public.travel_requests REPLICA IDENTITY FULL;
ALTER TABLE public.proposals REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'travel_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'proposals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
  END IF;
END $$;
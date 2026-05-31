CREATE POLICY "Anyone can view requests of shared proposals"
ON public.travel_requests
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = travel_requests.id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  )
);
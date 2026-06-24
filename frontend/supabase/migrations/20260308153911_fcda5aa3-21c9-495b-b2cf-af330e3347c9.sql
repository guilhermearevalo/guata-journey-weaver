DROP POLICY IF EXISTS "Anyone can view proposals by share_token" ON public.proposals;

CREATE POLICY "Anyone can view shared proposals"
ON public.proposals
FOR SELECT
TO anon, authenticated
USING (share_token IS NOT NULL);
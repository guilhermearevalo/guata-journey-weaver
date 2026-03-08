ALTER TABLE public.proposals ADD COLUMN share_token TEXT UNIQUE;

-- Allow public access to proposals via share_token (no auth required)
CREATE POLICY "Anyone can view proposals by share_token"
ON public.proposals
FOR SELECT
TO anon, authenticated
USING (share_token IS NOT NULL AND share_token = current_setting('request.headers', true)::json->>'x-share-token');

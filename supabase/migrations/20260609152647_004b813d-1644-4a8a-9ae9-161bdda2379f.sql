-- 1. Restrict testimonials bucket uploads to the user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload testimonial photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload testimonial photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'testimonials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Remove anonymous direct SELECT on travel_documents
DROP POLICY IF EXISTS "Anyone can view public shared travel documents" ON public.travel_documents;

-- 3. Token + access-code validated RPC for public itinerary documents
CREATE OR REPLACE FUNCTION public.get_public_travel_documents(_token text, _code text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  proposal_id uuid,
  title text,
  category text,
  file_url text,
  notes text,
  visible_in_public boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT td.id, td.proposal_id, td.title, td.category, td.file_url, td.notes,
         td.visible_in_public, td.created_at
  FROM public.travel_documents td
  JOIN public.proposals p ON p.id = td.proposal_id
  WHERE p.share_token = _token
    AND p.share_enabled = true
    AND td.visible_in_public = true
    AND td.file_url IS NOT NULL
    AND (
      p.access_code IS NULL
      OR (_code IS NOT NULL AND upper(p.access_code) = upper(_code))
    )
  ORDER BY td.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_public_travel_documents(text, text) TO anon, authenticated;
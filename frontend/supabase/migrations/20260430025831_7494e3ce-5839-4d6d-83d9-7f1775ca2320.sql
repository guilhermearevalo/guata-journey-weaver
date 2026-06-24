DROP POLICY IF EXISTS "Authenticated users can view travel document files" ON storage.objects;

CREATE POLICY "Clients can view files for own travel documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.travel_requests tr ON tr.id = td.request_id
    WHERE td.file_path = storage.objects.name
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Partners can view agency travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

CREATE POLICY "Public can view shared travel document files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'travel-documents'
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND td.visible_in_public = true
      AND p.share_token IS NOT NULL
  )
);
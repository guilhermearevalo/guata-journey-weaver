CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL,
  request_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  document_type TEXT NOT NULL DEFAULT 'vault',
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  file_path TEXT,
  notes TEXT,
  visible_in_public BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT travel_documents_category_check CHECK (category IN ('personal', 'voucher', 'ticket', 'insurance', 'reservation', 'payment', 'other')),
  CONSTRAINT travel_documents_type_check CHECK (document_type IN ('checklist', 'vault')),
  CONSTRAINT travel_documents_status_check CHECK (status IN ('pending', 'received', 'verified', 'sent')),
  CONSTRAINT travel_documents_title_length CHECK (char_length(title) BETWEEN 1 AND 160),
  CONSTRAINT travel_documents_notes_length CHECK (notes IS NULL OR char_length(notes) <= 1000)
);

ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_travel_documents_proposal_id ON public.travel_documents(proposal_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_request_id ON public.travel_documents(request_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_public ON public.travel_documents(proposal_id, visible_in_public) WHERE visible_in_public = true;

CREATE TRIGGER update_travel_documents_updated_at
BEFORE UPDATE ON public.travel_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Staff can manage all travel documents"
ON public.travel_documents
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage documents for own proposals"
ON public.travel_documents
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

CREATE POLICY "Clients can view documents for own requests"
ON public.travel_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = travel_documents.request_id
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can upload personal documents for own requests"
ON public.travel_documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND document_type = 'vault'
  AND category = 'personal'
  AND status = 'pending'
  AND visible_in_public = false
  AND EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = travel_documents.request_id
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view public shared travel documents"
ON public.travel_documents
FOR SELECT
TO anon, authenticated
USING (
  visible_in_public = true
  AND file_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.share_token IS NOT NULL
  )
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-documents', 'travel-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff can manage travel document files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'travel-documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'travel-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage agency travel document files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
)
WITH CHECK (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
);

CREATE POLICY "Clients can upload own travel document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'travel-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clients can view own travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'travel-documents');
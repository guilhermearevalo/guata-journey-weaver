
-- RLS: Partners can update status of assigned requests
CREATE POLICY "Partners can update assigned request status"
ON public.travel_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND assigned_agency_id = get_user_agency(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND assigned_agency_id = get_user_agency(auth.uid())
);

-- RLS: Partners can view own experiences
CREATE POLICY "Partners can view own experiences"
ON public.experiences FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
);

-- RLS: Partners can insert own experiences (always unpublished)
CREATE POLICY "Partners can insert own experiences"
ON public.experiences FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);

-- RLS: Partners can update own unpublished experiences
CREATE POLICY "Partners can update own unpublished experiences"
ON public.experiences FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
)
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);

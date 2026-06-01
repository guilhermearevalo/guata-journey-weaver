-- Reforço: política explícita de INSERT para staff em travel_requests
-- (a política ALL já cobre, mas tornamos o INSERT inequívoco)
DROP POLICY IF EXISTS "Staff can insert requests" ON public.travel_requests;
CREATE POLICY "Staff can insert requests"
ON public.travel_requests
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));
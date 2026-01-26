-- Fix 1: Set search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix 2: Replace the permissive anonymous insert policy with a more specific one
DROP POLICY IF EXISTS "Anyone can create travel request" ON public.travel_requests;

CREATE POLICY "Anonymous can create travel request with required fields"
ON public.travel_requests FOR INSERT
TO anon
WITH CHECK (
    client_name IS NOT NULL 
    AND client_email IS NOT NULL 
    AND client_id IS NULL
);
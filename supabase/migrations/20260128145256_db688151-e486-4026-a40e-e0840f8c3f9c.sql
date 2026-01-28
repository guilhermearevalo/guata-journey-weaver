-- Create a function to update demo account roles
-- This will be called to set proper roles for test accounts
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update admin@guata.test to admin role
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'admin@guata.test' LIMIT 1
    );

    -- Update consultor@guata.test to consultant role
    UPDATE public.user_roles 
    SET role = 'consultant' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'consultor@guata.test' LIMIT 1
    );

    -- Update parceiro@guata.test to partner role
    UPDATE public.user_roles 
    SET role = 'partner' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'parceiro@guata.test' LIMIT 1
    );

    -- cliente@guata.test keeps the default 'client' role
END;
$$;

-- Grant execute permission to authenticated users (so the function can be called)
GRANT EXECUTE ON FUNCTION public.update_demo_roles() TO authenticated;
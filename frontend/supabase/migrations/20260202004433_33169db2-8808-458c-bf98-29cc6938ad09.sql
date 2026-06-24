-- 1. Criar trigger que está faltando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Melhorar função update_demo_roles com UPSERT
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Garantir profiles
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    -- Garantir roles com valores default
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Atualizar para roles corretos
    UPDATE public.user_roles SET role = 'admin' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');
    
    UPDATE public.user_roles SET role = 'consultant' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');
    
    UPDATE public.user_roles SET role = 'partner' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
END;
$$;
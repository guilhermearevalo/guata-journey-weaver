-- Atualizar função update_demo_roles para incluir cliente e vincular parceiro à agência
CREATE OR REPLACE FUNCTION public.update_demo_roles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_partner_id UUID;
    v_agency_id UUID;
BEGIN
    -- Garantir profiles para todos os usuários demo
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
    
    -- Cliente demo mantém role 'client' (default)
    
    -- Vincular parceiro à primeira agência disponível (se não estiver vinculado)
    SELECT id INTO v_partner_id FROM auth.users WHERE email = 'parceiro@guata.test';
    SELECT id INTO v_agency_id FROM partner_agencies LIMIT 1;
    
    IF v_partner_id IS NOT NULL AND v_agency_id IS NOT NULL THEN
        INSERT INTO public.partner_users (user_id, agency_id)
        VALUES (v_partner_id, v_agency_id)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$function$;

-- Adicionar constraint unique em partner_users para evitar duplicatas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_users_user_id_key'
  ) THEN
    ALTER TABLE public.partner_users ADD CONSTRAINT partner_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;
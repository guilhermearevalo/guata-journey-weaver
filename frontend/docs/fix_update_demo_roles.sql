-- Corrige update_demo_roles: user_roles tem UNIQUE (user_id, role), não só (user_id).
-- Rode no SQL Editor se full_schema_apply.sql falhou nesta função.
-- Depois rode docs/bootstrap_admin.sql de novo.

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
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client'::public.app_role FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.user_roles SET role = 'admin'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');

    UPDATE public.user_roles SET role = 'consultant'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');

    UPDATE public.user_roles SET role = 'partner'
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');

    SELECT id INTO v_partner_id FROM auth.users WHERE email = 'parceiro@guata.test';
    SELECT id INTO v_agency_id FROM partner_agencies LIMIT 1;

    IF v_partner_id IS NOT NULL AND v_agency_id IS NOT NULL THEN
        INSERT INTO public.partner_users (user_id, agency_id)
        VALUES (v_partner_id, v_agency_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_demo_roles() TO authenticated;

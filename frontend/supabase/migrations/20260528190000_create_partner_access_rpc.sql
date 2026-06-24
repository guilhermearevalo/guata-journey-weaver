-- RPC: criar acesso de parceiro (substitui edge function invite-partner)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_partner_access(
  p_agency_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := lower(trim(p_email));
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  IF p_agency_id IS NULL OR v_email IS NULL OR v_email = '' OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'agency_id, email e nome são obrigatórios';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Este email já possui conta';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    NOW(),
    jsonb_build_object('full_name', trim(p_full_name)),
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_email,
    NOW(),
    NOW(),
    NOW()
  );

  UPDATE public.user_roles
  SET role = 'partner'::app_role
  WHERE user_id = v_user_id;

  INSERT INTO public.partner_users (user_id, agency_id)
  VALUES (v_user_id, p_agency_id)
  ON CONFLICT (user_id) DO UPDATE SET agency_id = EXCLUDED.agency_id;

  UPDATE public.partner_agencies
  SET is_active = true
  WHERE id = p_agency_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) TO authenticated;

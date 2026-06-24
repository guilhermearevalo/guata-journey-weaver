-- Gestão de senhas: troca obrigatória no 1º acesso e reset admin de parceiros.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'Quando true, o usuário deve definir nova senha antes de usar o portal.';

-- ============================================================
-- create_partner_access (atualizado: flag must_change_password)
-- ============================================================

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
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, v_encrypted_pw, NOW(),
    jsonb_build_object('full_name', trim(p_full_name), 'must_change_password', true),
    NOW(), NOW()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', v_email, NOW(), NOW(), NOW()
  );

  UPDATE public.user_roles SET role = 'partner'::app_role WHERE user_id = v_user_id;

  INSERT INTO public.partner_users (user_id, agency_id)
  VALUES (v_user_id, p_agency_id)
  ON CONFLICT (user_id) DO UPDATE SET agency_id = EXCLUDED.agency_id;

  UPDATE public.profiles
  SET must_change_password = true
  WHERE user_id = v_user_id;

  UPDATE public.partner_agencies SET is_active = true WHERE id = p_agency_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

-- ============================================================
-- reset_partner_password: nova senha temporária para parceiro ativo
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_partner_password(p_agency_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  SELECT pu.user_id, u.email
  INTO v_user_id, v_email
  FROM public.partner_users pu
  JOIN auth.users u ON u.id = pu.user_id
  WHERE pu.agency_id = p_agency_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Agência sem login vinculado';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = v_encrypted_pw, updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE public.profiles
  SET must_change_password = true, updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_partner_password(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_partner_password(UUID) TO authenticated;

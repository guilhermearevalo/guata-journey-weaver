-- ============================================================
-- create_staff_access: cria login para membro da equipe interna
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_staff_access(
  p_email TEXT,
  p_full_name TEXT,
  p_role app_role
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

  IF p_role NOT IN ('consultant'::app_role, 'manager'::app_role, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Fun├º├úo inv├ílida para equipe interna';
  END IF;

  IF v_email IS NULL OR v_email = '' OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'email e nome s├úo obrigat├│rios';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Este email j├í possui conta';
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

  -- trigger handle_new_user j├í criou profile + user_roles(client); ajusta o papel
  UPDATE public.user_roles SET role = p_role WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET must_change_password = true, full_name = trim(p_full_name)
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

-- ============================================================
-- reset_staff_password: nova senha tempor├íria para membro da equipe
-- ============================================================
CREATE OR REPLACE FUNCTION public.reset_staff_password(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_email TEXT;
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = p_user_id
    AND public.has_role(p_user_id, 'consultant'::app_role)
       OR public.has_role(p_user_id, 'manager'::app_role)
       OR public.has_role(p_user_id, 'admin'::app_role);

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usu├írio n├úo encontrado';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = v_encrypted_pw, updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE public.profiles
  SET must_change_password = true, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_staff_access(TEXT, TEXT, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_staff_password(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_staff_access(TEXT, TEXT, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_staff_password(UUID) TO authenticated;

-- ============================================================
-- Bootstrap do usuário ADMIN no Supabase EXTERNO (ojpgobftvomqxyvrqxma)
-- ============================================================
--
-- PRÉ-REQUISITO OBRIGATÓRIO (rode ANTES deste script):
--   Aplicar TODAS as migrações em supabase/migrations/ no projeto.
--   Terminal:  supabase link --project-ref ojpgobftvomqxyvrqxma
--              supabase db push
--   Se public.profiles não existir, este script VAI FALHAR.
--
-- Confirme no SQL Editor:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN ('profiles', 'user_roles');
--   (deve retornar 2 linhas)
--
-- Pré-requisito: o usuário já deve existir em Authentication.
--   Dashboard → Authentication → Users → Add user
--   E-mail: guilhermearevalo27@gmail.com  (marque "Auto Confirm User")
--
-- Depois rode este script no SQL Editor do projeto externo.
-- Ele é idempotente (pode rodar mais de uma vez sem problema).
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION
      'PARE AQUI: tabela public.profiles não existe. Rode docs/full_schema_apply.sql no SQL Editor OU supabase db push (veja docs/APPLY_MIGRATIONS.md)';
  END IF;
END $$;

-- 1) Garante um profile para o admin
INSERT INTO public.profiles (user_id, full_name, email)
SELECT id,
       COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
       email
FROM auth.users
WHERE email = 'guilhermearevalo27@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 2) Garante o papel admin (sem duplicar)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'guilhermearevalo27@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Remove outros papéis (ex.: client) — evita conflito ao promover
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'guilhermearevalo27@gmail.com')
  AND role <> 'admin'::public.app_role;

-- ============================================================
-- Verificação (descomente e rode se quiser confirmar)
-- ============================================================
-- SELECT u.email, r.role
-- FROM auth.users u
-- JOIN public.user_roles r ON r.user_id = u.id
-- WHERE u.email = 'guilhermearevalo27@gmail.com';
-- (deve retornar 1 linha: role = admin)

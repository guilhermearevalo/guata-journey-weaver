-- Atualiza a senha das contas de demonstração (@guata.test).
-- Projeto: ojpgobftvomqxyvrqxma
-- Dashboard: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma
-- Rode no SQL Editor do Supabase (Dashboard → SQL → New query).
--
-- Senha definida: 9212361701040
-- Contas: admin@guata.test, consultor@guata.test, parceiro@guata.test, cliente@guata.test

UPDATE auth.users
SET
  encrypted_password = crypt('9212361701040', gen_salt('bf')),
  updated_at = now()
WHERE email LIKE '%@guata.test';

-- Opcional: confirma e-mails das contas demo (evita bloqueio de confirmação)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email LIKE '%@guata.test';

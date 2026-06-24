-- Atualiza a senha das contas de demonstração (@guata.test).
-- Projeto: ojpgobftvomqxyvrqxma
-- Rode no SQL Editor do Supabase (Dashboard → SQL → New query).
--
-- ANTES DE RODAR: substitua SUA_SENHA_DEMO pela senha desejada (não commite a senha real).
-- Contas: admin@guata.test, consultor@guata.test, parceiro@guata.test, cliente@guata.test

UPDATE auth.users
SET
  encrypted_password = crypt('SUA_SENHA_DEMO', gen_salt('bf')),
  updated_at = now()
WHERE email LIKE '%@guata.test';

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email LIKE '%@guata.test';

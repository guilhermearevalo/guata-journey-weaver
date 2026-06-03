-- Se aparecer "partner_users_user_id_key already exists", a constraint já está ok.
-- Rode só se ainda NÃO existir (idempotente).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_users_user_id_key'
  ) THEN
    ALTER TABLE public.partner_users ADD CONSTRAINT partner_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;

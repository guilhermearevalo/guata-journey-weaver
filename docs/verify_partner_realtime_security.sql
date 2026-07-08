-- Verifica se a migration 20260617011706 (partner & realtime security) foi aplicada.
-- Rode no SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new
--
-- Se algum check falhar, execute o conteúdo de:
--   supabase/migrations/20260617011706_dce7f437-9816-4c6c-a7cd-8594dea5845a.sql

-- 1) RPC partner_insert_external_sale deve existir
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'partner_insert_external_sale'
    ) THEN 'OK — RPC partner_insert_external_sale existe'
    ELSE 'FALTA — rode a migration 20260617011706'
  END AS rpc_check;

-- 2) Policy aberta de INSERT por parceiros deve ter sido removida
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'commission_payments'
        AND policyname = 'Partners insert external sales'
    ) THEN 'OK — policy "Partners insert external sales" removida'
    ELSE 'FALTA — policy antiga ainda ativa; rode a migration 20260617011706'
  END AS policy_check;

-- 3) Realtime broadcast/presence bloqueado em realtime.messages
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'realtime'
        AND tablename = 'messages'
        AND rowsecurity = true
    )
    AND EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'realtime'
        AND tablename = 'messages'
        AND policyname = 'Deny realtime broadcast and presence'
    ) THEN 'OK — RLS deny em realtime.messages'
    ELSE 'FALTA — rode a migration 20260617011706'
  END AS realtime_check;

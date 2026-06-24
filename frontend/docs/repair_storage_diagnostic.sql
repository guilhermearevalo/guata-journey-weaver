-- Diagnóstico ampliado do Supabase Storage (só SELECT — seguro no SQL Editor).
-- Projeto: ojpgobftvomqxyvrqxma
-- Cole TODO o resultado ao abrir ticket no Supabase Support.

-- Migrações internas do Storage
SELECT id, name, executed_at FROM storage.migrations ORDER BY id;

-- Colunas de storage.objects (procure owner_id, version, level, user_metadata)
SELECT column_name, data_type, is_nullable, column_default, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

-- Tabela prefixes existe?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'storage' AND table_name = 'prefixes'
) AS prefixes_table_exists;

-- Buckets
SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at;

-- Triggers em storage.objects (conflitos causam erro 42P17 / "schema invalid")
SELECT tgname, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'storage.objects'::regclass AND NOT tgisinternal
ORDER BY tgname;

-- Owner das tabelas storage (confirma que só o suporte altera)
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'storage' AND tablename IN ('objects', 'buckets', 'prefixes')
ORDER BY tablename;

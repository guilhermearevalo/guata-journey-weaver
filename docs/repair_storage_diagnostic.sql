-- Diagnóstico do Supabase Storage (seguro — só SELECT, sem erro de permissão).
-- Projeto: ojpgobftvomqxyvrqxma
-- Cole o resultado ao abrir ticket no Supabase Support.

SELECT id, name, executed_at FROM storage.migrations ORDER BY id;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'storage' AND table_name = 'prefixes'
) AS prefixes_table_exists;

SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at;

SELECT tableowner FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects';

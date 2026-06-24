-- Reparo do Storage Guatá (erro 400 "database schema is invalid or incompatible")
-- Projeto: ojpgobftvomqxyvrqxma
--
-- ⚠️ NÃO use DELETE em storage.buckets / storage.objects — o Supabase bloqueia:
--    "42501: Direct deletion from storage tables is not allowed. Use the Storage API instead."
--
-- ORDEM CORRETA:
--   1) Rode ESTE arquivo (só diagnóstico, abaixo)
--   2) Dashboard → Storage → apague site-assets (e testimonials se existir)
--      https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
--      (⋯ no bucket → Delete bucket — ou use: node scripts/repair-storage.mjs)
--   3) Dashboard → Storage → New bucket → site-assets → Public bucket
--   4) Rode docs/ensure_site_assets_storage.sql (políticas RLS)
--   5) Teste upload em Admin → Configurações

-- ========== Diagnóstico (seguro — só SELECT) ==========
SELECT id, name, executed_at FROM storage.migrations ORDER BY id;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at;

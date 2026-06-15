-- Reparo do Storage Guatá (erro 400 "database schema is invalid or incompatible")
-- Projeto: ojpgobftvomqxyvrqxma
--
-- CAUSA: buckets criados via INSERT SQL nas migrações (Storage v3 exige criação pela UI ou API).
--
-- ORDEM (siga exatamente):
--   1) Rode ESTE arquivo no SQL Editor (passos 1 e 2 abaixo)
--   2) Dashboard → Storage → New bucket → nome: site-assets → Public bucket
--      https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
--   3) Rode docs/ensure_site_assets_storage.sql (políticas RLS)
--   4) Teste upload em Admin → Configurações

-- ========== 1) Diagnóstico (opcional — copie o resultado se precisar abrir ticket) ==========
SELECT id, name, executed_at FROM storage.migrations ORDER BY id;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at;

-- ========== 2) Remove buckets criados via SQL (quebrados no Storage v3) ==========
DELETE FROM storage.objects WHERE bucket_id IN ('site-assets', 'testimonials');
DELETE FROM storage.buckets WHERE id IN ('site-assets', 'testimonials');

-- Confirmação (deve retornar 0 linhas para site-assets)
SELECT id, name, public FROM storage.buckets WHERE id IN ('site-assets', 'testimonials');

-- PARE AQUI. Crie o bucket site-assets pela UI (passo 2 acima), depois rode ensure_site_assets_storage.sql.

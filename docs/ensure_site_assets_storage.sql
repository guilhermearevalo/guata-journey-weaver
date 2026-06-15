-- Políticas RLS para o bucket site-assets (upload admin/consultor).
-- Projeto: ojpgobftvomqxyvrqxma
--
-- IMPORTANTE: NÃO crie o bucket com INSERT SQL neste projeto (Storage v3).
-- Crie primeiro pela interface:
--   Dashboard → Storage → New bucket → nome: site-assets → Public bucket
--   https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
--
-- Se já criou via SQL e o upload dá "database schema is invalid or incompatible",
-- apague o bucket na UI e recrie pelo dashboard.
--
-- Guia completo: docs/FIX_STORAGE_UPLOAD.md

DROP POLICY IF EXISTS "Anyone can view site assets" ON storage.objects;
CREATE POLICY "Anyone can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Staff can upload site assets" ON storage.objects;
CREATE POLICY "Staff can upload site assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update site assets" ON storage.objects;
CREATE POLICY "Staff can update site assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can delete site assets" ON storage.objects;
CREATE POLICY "Staff can delete site assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

-- Confirmação (bucket deve existir — criado pela UI)
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'site-assets';

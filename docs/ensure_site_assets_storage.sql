-- Cria bucket site-assets + políticas de Storage (upload admin/consultor).
-- Projeto: ojpgobftvomqxyvrqxma
-- Dashboard: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new
--
-- Rode se uploads em Admin → Configurações falharem com "Bucket not found" ou HTTP 400.

-- 1) Bucket público para imagens/PDFs do site
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2) Políticas (idempotente)
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

-- 3) Confirmação
SELECT id, name, public FROM storage.buckets WHERE id = 'site-assets';

-- Buckets criados via INSERT SQL quebram upload no Storage v3.
-- Recrie site-assets em: Dashboard → Storage → New bucket (público).
-- Depois rode docs/ensure_site_assets_storage.sql no SQL Editor.

DELETE FROM storage.objects WHERE bucket_id IN ('site-assets', 'testimonials');
DELETE FROM storage.buckets WHERE id IN ('site-assets', 'testimonials');

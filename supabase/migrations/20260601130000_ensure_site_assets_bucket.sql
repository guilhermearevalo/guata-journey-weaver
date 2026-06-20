-- Bucket site-assets — crie via Dashboard/API (docs/MIGRAR_STORAGE.md).
-- Não corrige schema interno do Storage (storage.migrations); isso é Supabase Support.
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('site-assets', 'site-assets', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
SELECT 1;

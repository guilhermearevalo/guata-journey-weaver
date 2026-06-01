-- Garante bucket site-assets (não corrige schema interno do Storage; só cria o bucket se faltar)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

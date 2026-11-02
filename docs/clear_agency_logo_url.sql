-- Remove URL de logo PNG em cadastur_config (header público usa tipografia, não imagem).
-- Projeto: ojpgobftvomqxyvrqxma — SQL Editor → executar uma vez.

UPDATE public.site_settings
SET
  value = jsonb_set(coalesce(value, '{}'::jsonb), '{agency_logo_url}', '""'::jsonb),
  updated_at = now()
WHERE key = 'cadastur_config';

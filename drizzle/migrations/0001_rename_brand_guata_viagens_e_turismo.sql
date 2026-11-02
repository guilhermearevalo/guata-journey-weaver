-- Rename the agency everywhere: "Guatá Travel Experience" -> "Guatá Viagens e Turismo".
-- The old name was seeded in the legal/FAQ pages; this rewrites those stored values.
-- Idempotent: rows without the old name are untouched.

update public.cms_pages
set
  title = regexp_replace(title::text, 'Guat[áa] Travel Experience', 'Guatá Viagens e Turismo', 'gi'),
  meta_description = regexp_replace(meta_description::text, 'Guat[áa] Travel Experience', 'Guatá Viagens e Turismo', 'gi'),
  content = (
    regexp_replace(content::text, 'Guat[áa] Travel Experience', 'Guatá Viagens e Turismo', 'gi')
  )::jsonb,
  updated_at = now()
where
  title::text ~* 'guat[áa] travel experience'
  or meta_description::text ~* 'guat[áa] travel experience'
  or content::text ~* 'guat[áa] travel experience';
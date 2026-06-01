-- Reorganiza páginas legais: privacidade embutida em termos, nova política de serviços

UPDATE public.cms_pages
SET
  status = 'hidden',
  updated_at = now()
WHERE slug = 'privacidade';

UPDATE public.cms_pages
SET
  title = 'Termos de Uso e Política de Privacidade',
  meta_description = 'Termos de uso do site e política de privacidade da Guatá Travel Experience.',
  updated_at = now()
WHERE slug = 'termos';

INSERT INTO public.cms_pages (slug, title, content, meta_description, status)
VALUES (
  'politica-servicos',
  'Política de Prestação de Serviços da Guatá Viagens e Turismo',
  '{
    "hero": {
      "title": "Política de Prestação de Serviços da Guatá Viagens e Turismo",
      "subtitle": "Condições gerais para contratação e prestação de serviços turísticos pela agência."
    },
    "sections": [
      {
        "title": "Documento oficial",
        "content": "O documento completo da Política de Prestação de Serviços está disponível em PDF nesta página. Caso o PDF ainda não tenha sido publicado, entre em contato conosco para solicitar uma cópia."
      }
    ]
  }'::jsonb,
  'Política de prestação de serviços turísticos da Guatá Viagens e Turismo.',
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  status = EXCLUDED.status,
  updated_at = now();

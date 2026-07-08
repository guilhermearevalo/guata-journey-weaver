-- Corrige mojibake (UTF-8 salvo/lido como Latin-1) no conteúdo JSON do CMS.

CREATE OR REPLACE FUNCTION public.fix_mojibake_text(t text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF t IS NULL OR t = '' OR t !~ 'Ã' THEN
    RETURN t;
  END IF;

  BEGIN
    RETURN convert_from(convert_to(t, 'LATIN1'), 'UTF8');
  EXCEPTION
    WHEN OTHERS THEN
      RETURN t;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.fix_jsonb_mojibake(j jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result jsonb;
  k text;
  v jsonb;
BEGIN
  IF j IS NULL THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(j) = 'string' THEN
    RETURN to_jsonb(public.fix_mojibake_text(j #>> '{}'));
  END IF;

  IF jsonb_typeof(j) = 'array' THEN
    SELECT COALESCE(jsonb_agg(public.fix_jsonb_mojibake(elem)), '[]'::jsonb)
    INTO result
    FROM jsonb_array_elements(j) AS elem;
    RETURN result;
  END IF;

  IF jsonb_typeof(j) = 'object' THEN
    result := '{}'::jsonb;
    FOR k, v IN SELECT key, value FROM jsonb_each(j) LOOP
      result := result || jsonb_build_object(k, public.fix_jsonb_mojibake(v));
    END LOOP;
    RETURN result;
  END IF;

  RETURN j;
END;
$$;

-- FAQ: restaura textos UTF-8 corretos (conteúdo padrão do projeto)
UPDATE public.cms_pages
SET
  content = '{
    "hero": {
      "title": "Perguntas Frequentes",
      "subtitle": "Tire suas dúvidas sobre nossos serviços"
    },
    "items": [
      {
        "question": "Como funciona o processo de viagem personalizada?",
        "answer": "Você preenche nosso formulário com suas preferências e um consultor entra em contato para entender melhor suas expectativas. Criamos um roteiro exclusivo e, após sua aprovação, cuidamos de toda a operação."
      },
      {
        "question": "Qual a diferença entre pacotes e excursões?",
        "answer": "Pacotes são roteiros pré-definidos com datas flexíveis, ideais para quem quer praticidade. Excursões são viagens em grupo com datas fixas e preços mais acessíveis."
      },
      {
        "question": "Vocês trabalham com quais destinos?",
        "answer": "Trabalhamos com destinos nacionais e internacionais, sempre com foco em experiências autênticas e imersão cultural."
      },
      {
        "question": "Como funciona o pagamento?",
        "answer": "Oferecemos diversas formas de pagamento, incluindo parcelamento no cartão e condições especiais para pagamento à vista. Os detalhes são apresentados na proposta."
      },
      {
        "question": "Posso alterar meu roteiro depois de confirmado?",
        "answer": "Sim, dentro das políticas de cada fornecedor. Nossos consultores trabalham para acomodar mudanças sempre que possível."
      }
    ]
  }'::jsonb,
  updated_at = now()
WHERE slug = 'faq';

-- Termos: mantém conteúdo atual, só corrige acentos corrompidos
UPDATE public.cms_pages
SET
  content = public.fix_jsonb_mojibake(content),
  title = public.fix_mojibake_text(title),
  meta_description = public.fix_mojibake_text(meta_description),
  updated_at = now()
WHERE slug = 'termos';

-- Sobre e demais páginas CMS com possível mojibake
UPDATE public.cms_pages
SET
  content = public.fix_jsonb_mojibake(content),
  title = public.fix_mojibake_text(title),
  meta_description = public.fix_mojibake_text(meta_description),
  updated_at = now()
WHERE slug IN ('sobre', 'contato', 'politica-servicos')
  AND content::text ~ 'Ã';

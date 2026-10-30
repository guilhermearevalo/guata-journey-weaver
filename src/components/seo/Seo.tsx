import { Helmet } from 'react-helmet-async';
import { hrefForLang, useI18n, type Lang } from '@/lib/i18n';

const SITE_URL = 'https://www.agenciaguata.com';
export const SITE_NAME = 'Guatá Viagens e Turismo';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-guata.png`;
export const DEFAULT_LOGO = `${SITE_URL}/favicon-512.png`;

const OG_LOCALE: Record<Lang, string> = {
  pt: 'pt_BR',
  en: 'en_US',
  es: 'es_ES',
};

export interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  rawTitle?: boolean;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const Seo = ({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  rawTitle = false,
  noindex = false,
  jsonLd,
}: SeoProps) => {
  const { lang } = useI18n();
  const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const canonical = hrefForLang(path, lang);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="alternate" hrefLang="pt-BR" href={hrefForLang(path, 'pt')} />
      <link rel="alternate" hrefLang="en" href={hrefForLang(path, 'en')} />
      <link rel="alternate" hrefLang="es" href={hrefForLang(path, 'es')} />
      <link rel="alternate" hrefLang="x-default" href={hrefForLang(path, 'pt')} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={SITE_NAME} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={OG_LOCALE[lang]} />
      {lang !== 'pt' && <meta property="og:locale:alternate" content="pt_BR" />}
      {lang !== 'en' && <meta property="og:locale:alternate" content="en_US" />}
      {lang !== 'es' && <meta property="og:locale:alternate" content="es_ES" />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {blocks.map((block, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;

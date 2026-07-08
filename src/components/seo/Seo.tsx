import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.agenciaguata.com';
export const SITE_NAME = 'Guatá Viagens e Turismo';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-guata.png`;
export const DEFAULT_LOGO = `${SITE_URL}/favicon-512.png`;

export interface SeoProps {
  /** Page title. Keep under ~60 chars. The brand suffix is added unless `rawTitle` is set. */
  title: string;
  /** Meta description. Keep under ~160 chars. */
  description: string;
  /** Path of the current page, e.g. "/sobre". Used for canonical + og:url. */
  path?: string;
  /** Social share image URL. */
  image?: string;
  /** og:type, defaults to "website". */
  type?: string;
  /** Use the title exactly as given, without the brand suffix. */
  rawTitle?: boolean;
  /** Prevent indexing of this page. */
  noindex?: boolean;
  /** Extra JSON-LD structured data objects for GEO / rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-page SEO + GEO (Generative Engine Optimization) head tags.
 * Adds title, description, canonical, Open Graph, Twitter and JSON-LD.
 */
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
  const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path === '/' ? '/' : path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={SITE_NAME} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

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

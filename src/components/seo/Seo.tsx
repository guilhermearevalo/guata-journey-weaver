import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.agenciaguata.com';
const DEFAULT_IMAGE =
  'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a5b9897d-5bdb-4f65-850e-1f50c8a9fb21/id-preview-b31e3217--56f718d3-6970-41ee-91a3-e2d51d9255d3.lovable.app-1770210519079.png';

export interface SeoProps {
  /** Page title. Keep under ~60 chars. The " | Guatá Viagens" suffix is added unless `rawTitle` is set. */
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
  image = DEFAULT_IMAGE,
  type = 'website',
  rawTitle = false,
  noindex = false,
  jsonLd,
}: SeoProps) => {
  const fullTitle = rawTitle ? title : `${title} | Guatá Viagens`;
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
      <meta property="og:site_name" content="Guatá Viagens" />
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

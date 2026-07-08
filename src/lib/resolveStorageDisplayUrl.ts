const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
const PROJECT_REF = String(import.meta.env.VITE_SUPABASE_PROJECT_ID ?? '').trim();

const PUBLIC_BUCKETS = new Set(['site-assets', 'testimonials']);

const signedUrlCache = new Map<string, { url: string; expires: number }>();

/** Extrai bucket/path de URL pública do Supabase Storage deste projeto. */
export function parseSupabasePublicObjectUrl(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(PROJECT_REF)) return null;
    const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

/** URL assinada para exibir arquivos quando GET público retorna 400 (schema Storage parcial). */
export async function resolveStorageDisplayUrl(url: string | null | undefined): Promise<string> {
  if (!url) return '';

  const object = parseSupabasePublicObjectUrl(url);
  if (!object || !PUBLIC_BUCKETS.has(object.bucket)) return url;

  const cacheKey = `${object.bucket}/${object.path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.url;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
    };
    if (sessionData.session?.access_token) {
      headers.Authorization = `Bearer ${sessionData.session.access_token}`;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/storage-sign-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: object.bucket, path: object.path }),
    });

    if (!res.ok) return url;

    const body = (await res.json()) as { signedUrl?: string };
    if (!body.signedUrl) return url;

    signedUrlCache.set(cacheKey, {
      url: body.signedUrl,
      expires: Date.now() + 50 * 60 * 1000,
    });
    return body.signedUrl;
  } catch {
    return url;
  }
}

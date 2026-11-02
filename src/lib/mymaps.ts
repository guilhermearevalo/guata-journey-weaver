/**
 * Converte um link do Google My Maps (edit/viewer/embed) em URL de incorporação.
 * Retorna null se não for um link válido do My Maps.
 */
export function toMyMapsEmbedUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  // Aceita também o código <iframe src="..."> colado inteiro
  const srcMatch = value.match(/src=["']([^"']+)["']/i);
  const candidate = srcMatch ? srcMatch[1] : value;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!/(^|\.)google\.[a-z.]+$/i.test(url.hostname)) return null;
  if (!url.pathname.startsWith('/maps/d/')) return null;
  const mid = url.searchParams.get('mid');
  if (!mid || !/^[\w-]+$/.test(mid)) return null;
  return `https://www.google.com/maps/d/embed?mid=${mid}`;
}

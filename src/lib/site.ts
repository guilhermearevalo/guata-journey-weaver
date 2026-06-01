/** URL pública do site (produção). */
export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? 'https://www.agenciaguata.com';

/** Domínios em que a Ōner libera o widget BeFly. */
const ONER_WIDGET_HOSTS = new Set(['agenciaguata.com', 'www.agenciaguata.com']);

export function isOnerWidgetProductionHost(hostname = window.location.hostname): boolean {
  return ONER_WIDGET_HOSTS.has(hostname);
}

export const ONER_STORE_URL =
  import.meta.env.VITE_ONER_STORE_URL ??
  'https://www.comprarviagem.com.br/guataviagenseturismo/home';

export const ONER_WIDGET_SCRIPT =
  'https://static.onertravel.com/widget/search/production/widget-befly.js';

export const ROTEIRO_SOB_MEDIDA_LABEL = 'Roteiro sob medida';

import { interpretSearchQuery } from './interpretSearchQuery';
export function isOnerTravelQuery(query: string): boolean {
  // Kept for compatibility — use interpretSearchQuery for UI flows.
  const { primary, confidence } = interpretSearchQuery(query);
  return primary.intent === 'passagens' && confidence !== 'low';
}

export { interpretSearchQuery, getPathForSearchIntent } from './interpretSearchQuery';
export type {
  SearchIntent,
  SearchConfidence,
  SearchInterpretation,
  SearchIntentOption,
} from './interpretSearchQuery';

export function buildExperienciasSearchUrl(query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('destino', query.trim());
  const qs = params.toString();
  return qs ? `/experiencias?${qs}` : '/experiencias';
}

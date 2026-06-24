export const ONER_STORE_URL =
  import.meta.env.VITE_ONER_STORE_URL ??
  'https://www.comprarviagem.com.br/guataviagenseturismo/home';

export const ONER_WIDGET_SCRIPT =
  'https://static.onertravel.com/widget/search/production/widget-befly.js';

const ONER_TRAVEL_KEYWORDS = [
  'passagem',
  'passagens',
  'voo',
  'voos',
  'aereo',
  'aéreo',
  'aerea',
  'aérea',
  'aviao',
  'avião',
  'hotel',
  'hoteis',
  'hotéis',
  'hospedagem',
  'seguro',
  'pacote',
  'pacotes',
  'carro',
  'aluguel',
  'cruzeiro',
];

export function isOnerTravelQuery(query: string): boolean {
  const normalized = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return ONER_TRAVEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function buildExperienciasSearchUrl(query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('destino', query.trim());
  const qs = params.toString();
  return qs ? `/experiencias?${qs}` : '/experiencias';
}

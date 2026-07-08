import { ROTEIRO_SOB_MEDIDA_LABEL } from './onerTravel';

export type SearchIntent = 'passagens' | 'experiencias' | 'roteiro';

export type SearchConfidence = 'high' | 'medium' | 'low';

export interface SearchIntentOption {
  intent: SearchIntent;
  title: string;
  description: string;
}

export interface SearchInterpretation {
  query: string;
  primary: SearchIntentOption;
  confidence: SearchConfidence;
  alternatives: SearchIntentOption[];
  /** When true, always show the confirmation panel instead of auto-redirecting. */
  requiresConfirmation: boolean;
  /** When true, show all intents with equal visual weight (e.g. loose destination words). */
  balancedOptions: boolean;
  allOptions: SearchIntentOption[];
}

const PASSAGENS_KEYWORDS = [
  'passagem',
  'passagens',
  'voo',
  'voos',
  'aereo',
  'aérea',
  'aviao',
  'avião',
  'hotel',
  'hoteis',
  'hotéis',
  'hospedagem',
  'bilhete',
  'ida e volta',
  'ida volta',
  'so ida',
  'só ida',
  'aeroporto',
];

const ROTEIRO_KEYWORDS = [
  'roteiro',
  'sob medida',
  'personaliz',
  'pacote completo',
  'monte minha',
  'montar',
  'consultor',
  'orcamento',
  'orçamento',
  'sonhos',
  'inclui tudo',
];

const EXPERIENCIAS_KEYWORDS = ['excursao', 'excursão', 'passeio', 'grupo', 'day tour'];

const TOURISM_DESTINATIONS = [
  'bonito',
  'pantanal',
  'nordeste',
  'europa',
  'chapada',
  'fernando de noronha',
  'all inclusive',
];

const KNOWN_IATA = new Set([
  'cgr', 'gru', 'cgh', 'gig', 'sdu', 'bsb', 'ssa', 'rec', 'for', 'bel', 'mao', 'poa',
  'cwb', 'vcp', 'nat', 'fln', 'mcz', 'aju', 'slz', 'the', 'pvh', 'rbr', 'cnf', 'vix',
  'lpb', 'gyn', 'jpa', 'mcp', 'pmw', 'cgb', 'bvb', 'stm', 'ios', 'nvt',
]);

const ROUTE_VIA_X = /[a-z0-9][\w\s]{1,40}\s+x\s+[a-z0-9][\w\s]{1,40}/;
const ROUTE_VIA_PREP =
  /(?:de\s+)?[a-z0-9][\w\s]{1,40}\s+(?:para|pra|a)\s+[a-z0-9][\w\s]{1,40}/;
const SLASH_DATE = /\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?/;
const RANGE_DATE = /\d{1,2}\s*a\s*\d{1,2}/;
const DAY_DATE = /\bdias?\s*\d{1,2}/;

function normalizeQuery(query: string): string {
  return query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function countKeywordHits(normalized: string, keywords: string[]): number {
  return keywords.reduce((sum, kw) => (normalized.includes(kw) ? sum + 1 : sum), 0);
}

function countIataCodes(normalized: string): number {
  const tokens = normalized.match(/\b[a-z]{3}\b/g) ?? [];
  return tokens.filter((t) => KNOWN_IATA.has(t)).length;
}

function hasRoute(normalized: string): boolean {
  return ROUTE_VIA_X.test(normalized) || ROUTE_VIA_PREP.test(normalized);
}

function hasDate(normalized: string): boolean {
  return SLASH_DATE.test(normalized) || RANGE_DATE.test(normalized) || DAY_DATE.test(normalized);
}

function extractRouteSummary(normalized: string): string | null {
  const xMatch = normalized.match(
    /([a-z0-9][\w\s]{1,35}?)\s+x\s+([a-z0-9][\w\s]{1,35}?)(?:\s+(?:para|dia|dias|\d).*)?$/i,
  );
  if (xMatch) {
    return `${capitalize(xMatch[1].trim())} → ${capitalize(xMatch[2].trim())}`;
  }

  const prepMatch = normalized.match(
    /(?:de\s+)?([a-z0-9][\w\s]{1,35}?)\s+(?:para|pra|a)\s+([a-z0-9][\w\s]{1,35}?)(?:\s|$)/i,
  );
  if (prepMatch) {
    return `${capitalize(prepMatch[1].trim())} → ${capitalize(prepMatch[2].trim())}`;
  }

  return null;
}

function capitalize(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractDateSummary(normalized: string): string | null {
  const range = normalized.match(/(\d{1,2})\s*a\s*(\d{1,2})/);
  if (range) return `${range[1]} a ${range[2]}`;

  const slash = normalized.match(/(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)/);
  if (slash) return slash[1];

  const day = normalized.match(/\bdias?\s*(\d{1,2}(?:\s*(?:a|e)\s*\d{1,2})?)/);
  if (day) return `dia ${day[1]}`;

  return null;
}

function extractDestination(normalized: string): string {
  const route = extractRouteSummary(normalized);
  if (route) {
    const parts = route.split('→').map((p) => p.trim());
    return parts[parts.length - 1] || normalized;
  }

  for (const dest of TOURISM_DESTINATIONS) {
    if (normalized.includes(dest)) return capitalize(dest);
  }

  return capitalize(normalized.split(/\s+/).slice(0, 3).join(' '));
}

function scoreIntents(normalized: string): Record<SearchIntent, number> {
  const scores: Record<SearchIntent, number> = {
    passagens: 0,
    experiencias: 0,
    roteiro: 0,
  };

  scores.passagens += countKeywordHits(normalized, PASSAGENS_KEYWORDS) * 3;
  scores.roteiro += countKeywordHits(normalized, ROTEIRO_KEYWORDS) * 4;
  scores.experiencias += countKeywordHits(normalized, EXPERIENCIAS_KEYWORDS) * 3;

  if (/\b(passagem|passagens|voo|voos|bilhete)\b/.test(normalized)) {
    scores.passagens += 4;
  }
  if (/\b(hotel|hoteis|hospedagem)\b/.test(normalized)) {
    scores.passagens += 5;
  }

  const iataCount = countIataCodes(normalized);
  if (iataCount >= 2) scores.passagens += 8;
  else if (iataCount === 1) scores.passagens += 4;

  if (hasRoute(normalized)) scores.passagens += 6;
  if (hasDate(normalized)) scores.passagens += 2;
  if (hasRoute(normalized) && hasDate(normalized)) scores.passagens += 5;

  for (const dest of TOURISM_DESTINATIONS) {
    if (normalized.includes(dest)) {
      scores.experiencias += 4;
      if (!hasRoute(normalized) && !hasDate(normalized) && normalized.length < 40) {
        scores.experiencias += 3;
      }
    }
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2 && !hasRoute(normalized) && scores.passagens < 4) {
    scores.experiencias += 2;
  }

  if (scores.passagens > 0 && scores.roteiro > 0) {
    scores.roteiro -= 1;
  }

  return scores;
}

function pickWinner(scores: Record<SearchIntent, number>): SearchIntent {
  const entries = (Object.entries(scores) as [SearchIntent, number][]).sort((a, b) => b[1] - a[1]);
  if (entries[0][1] <= 0) return 'experiencias';
  return entries[0][0];
}

function resolveConfidence(
  scores: Record<SearchIntent, number>,
  winner: SearchIntent,
): SearchConfidence {
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const top = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;

  if (top >= 7 && top - second >= 4) return 'high';
  if (top >= 4 && top - second >= 2) return 'medium';
  return 'low';
}

function buildPassagensOption(normalized: string): SearchIntentOption {
  const route = extractRouteSummary(normalized);
  const date = extractDateSummary(normalized);
  const parts = [route, date].filter(Boolean);
  const detail = parts.length ? parts.join(' · ') : 'Comprar na loja com preço na hora';

  return {
    intent: 'passagens',
    title: 'Passagem ou hotel',
    description: detail,
  };
}

function buildExperienciasOption(normalized: string): SearchIntentOption {
  const dest = extractDestination(normalized);
  return {
    intent: 'experiencias',
    title: 'Experiências e excursões',
    description: dest ? `Pacotes e tours em ${dest}` : 'Explorar destinos e atividades',
  };
}

function buildRoteiroOption(normalized: string): SearchIntentOption {
  const dest = extractDestination(normalized);
  return {
    intent: 'roteiro',
    title: ROTEIRO_SOB_MEDIDA_LABEL,
    description: dest
      ? `Viagem montada pela equipe para ${dest}`
      : 'Pacote exclusivo com curadoria da Guatá',
  };
}

function buildOption(intent: SearchIntent, normalized: string): SearchIntentOption {
  if (intent === 'passagens') return buildPassagensOption(normalized);
  if (intent === 'roteiro') return buildRoteiroOption(normalized);
  return buildExperienciasOption(normalized);
}

const ALL_INTENTS: SearchIntent[] = ['passagens', 'experiencias', 'roteiro'];

function hasStrongPassagensSignal(normalized: string): boolean {
  if (/\b(passagem|passagens|voo|voos|bilhete|bilhetes)\b/.test(normalized)) return true;
  if (countIataCodes(normalized) >= 2) return true;
  if (hasRoute(normalized)) return true;
  if (hasRoute(normalized) && hasDate(normalized)) return true;
  return false;
}

function isLooseDestinationQuery(normalized: string): boolean {
  if (!normalized) return true;
  return !hasStrongPassagensSignal(normalized);
}

function buildAllOptions(normalized: string): SearchIntentOption[] {
  return ALL_INTENTS.map((intent) => buildOption(intent, normalized));
}

export function getPathForSearchIntent(intent: SearchIntent, query: string): string {
  const trimmed = query.trim();
  if (intent === 'passagens') return '/passagens';
  if (intent === 'roteiro') {
    const params = new URLSearchParams();
    if (trimmed) params.set('destino', trimmed);
    const qs = params.toString();
    return qs ? `/viagem-personalizada?${qs}` : '/viagem-personalizada';
  }
  const params = new URLSearchParams();
  if (trimmed) params.set('destino', trimmed);
  const qs = params.toString();
  return qs ? `/experiencias?${qs}` : '/experiencias';
}

export function interpretSearchQuery(query: string): SearchInterpretation {
  const trimmed = query.trim();
  const normalized = normalizeQuery(trimmed);

  if (!normalized) {
    const allOptions = buildAllOptions(normalized);
    return {
      query: trimmed,
      primary: allOptions[1],
      confidence: 'low',
      alternatives: allOptions.filter((_, i) => i !== 1),
      requiresConfirmation: true,
      balancedOptions: true,
      allOptions,
    };
  }

  const loose = isLooseDestinationQuery(normalized);
  const allOptions = buildAllOptions(normalized);

  if (loose) {
    return {
      query: trimmed,
      primary: allOptions[0],
      confidence: 'low',
      alternatives: allOptions.slice(1),
      requiresConfirmation: true,
      balancedOptions: true,
      allOptions,
    };
  }

  const scores = scoreIntents(normalized);
  const winner = pickWinner(scores);
  const confidence = resolveConfidence(scores, winner);
  const primary = buildOption(winner, normalized);
  const alternatives = ALL_INTENTS.filter((i) => i !== winner).map((i) => buildOption(i, normalized));
  const requiresConfirmation = confidence !== 'high';

  return {
    query: trimmed,
    primary,
    confidence,
    alternatives,
    requiresConfirmation,
    balancedOptions: false,
    allOptions,
  };
}

// Estrutura opcional do "dossiê de viagem" — seções extras além do roteiro dia a dia.
// Tudo é opcional: só aparece para o cliente quando preenchido.

export interface Dossier {
  cover_image?: string;
  // Aéreo
  flight_outbound?: string;
  flight_internal?: string;
  flight_inbound?: string;
  // Demais seções (texto livre)
  accommodation?: string;
  transfer?: string;
  documentation?: string;
  baggage?: string;
  insurance?: string;
  exchange?: string;
  // Títulos dos dias, indexados pelo número do dia
  day_titles?: Record<string, string>;
}

export const emptyDossier: Dossier = {};

export function parseDossier(raw: unknown): Dossier {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Dossier;
  }
  return {};
}

export function hasAnyFlight(d: Dossier): boolean {
  return Boolean(d.flight_outbound || d.flight_internal || d.flight_inbound);
}

// Estrutura opcional do "dossiê de viagem" — seções extras além do roteiro dia a dia.
// Tudo é opcional: só aparece para o cliente quando preenchido.

export interface Dossier {
  cover_image?: string;
  // Aéreo
  flight_outbound?: string;
  flight_internal?: string;
  flight_inbound?: string;
  flight_image?: string;
  // Demais seções (texto livre)
  accommodation?: string;
  accommodation_image?: string;
  transfer?: string;
  transfer_image?: string;
  documentation?: string;
  documentation_image?: string;
  baggage?: string;
  baggage_image?: string;
  insurance?: string;
  insurance_image?: string;
  exchange?: string;
  exchange_image?: string;
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

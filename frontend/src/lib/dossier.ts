// Estrutura opcional do "dossiê de viagem" — seções extras além do roteiro dia a dia.
// Tudo é opcional: só aparece para o cliente quando preenchido.

export interface Dossier {
  cover_image?: string;
  // Aéreo
  flight_outbound?: string;
  flight_internal?: string;
  flight_inbound?: string;
  /** @deprecated use flight_outbound_image */
  flight_image?: string;
  flight_outbound_image?: string;
  flight_inbound_image?: string;
  flight_internal_image?: string;
  // Demais seções (texto livre)
  accommodation?: string;
  accommodation_image?: string;
  accommodation_images?: string[];
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
  return Boolean(
    d.flight_outbound ||
      d.flight_internal ||
      d.flight_inbound ||
      d.flight_outbound_image ||
      d.flight_inbound_image ||
      d.flight_internal_image ||
      d.flight_image,
  );
}

export function getFlightOutboundImage(d: Dossier): string | undefined {
  return d.flight_outbound_image || d.flight_image;
}

export function getFlightInboundImage(d: Dossier): string | undefined {
  return d.flight_inbound_image;
}

export function getFlightInternalImage(d: Dossier): string | undefined {
  return d.flight_internal_image;
}

/** Merge legacy single accommodation image with optional gallery. */
export function getAccommodationImages(d: Dossier): string[] {
  const fromArray = (d.accommodation_images ?? []).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  if (d.accommodation_image) return [d.accommodation_image];
  return [];
}

export function setAccommodationImages(d: Dossier, images: string[]): Dossier {
  const cleaned = images.filter(Boolean);
  if (cleaned.length === 0) {
    const { accommodation_image, accommodation_images, ...rest } = d;
    return rest;
  }
  return {
    ...d,
    accommodation_image: cleaned[0],
    accommodation_images: cleaned,
  };
}

export function hasAccommodation(d: Dossier): boolean {
  return Boolean(d.accommodation?.trim() || getAccommodationImages(d).length > 0);
}

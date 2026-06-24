export type SharePath = 'proposta' | 'roteiro';

export function buildShareUrl(path: SharePath, token: string, origin = window.location.origin): string {
  return `${origin}/${path}/${token}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildProposalWhatsAppMessage(params: {
  clientName?: string | null;
  destination?: string | null;
  url: string;
}): string {
  const greeting = params.clientName ? `Olá ${params.clientName}, ` : 'Olá, ';
  const dest = params.destination ? ` para ${params.destination}` : '';
  return `${greeting}preparei sua proposta de viagem${dest}. Confira aqui: ${params.url}`;
}

export function buildItineraryWhatsAppMessage(params: {
  clientName?: string | null;
  destination?: string | null;
  url: string;
}): string {
  const greeting = params.clientName ? `Olá ${params.clientName}, ` : 'Olá, ';
  const dest = params.destination ? ` para ${params.destination}` : '';
  return `${greeting}montei um rascunho do seu roteiro${dest}. Dá uma olhada e me conta o que acha: ${params.url}`;
}

export function buildDocumentsWhatsAppMessage(params: {
  clientName?: string | null;
  url: string;
}): string {
  const greeting = params.clientName ? `Olá ${params.clientName}, ` : 'Olá, ';
  return `${greeting}seus documentos de viagem já estão disponíveis: ${params.url}`;
}

export async function ensureShareToken(
  proposalId: string,
  existingToken: string | null | undefined,
  update: (token: string) => Promise<void>,
): Promise<string> {
  if (existingToken) return existingToken;
  const token = crypto.randomUUID();
  await update(token);
  return token;
}

export async function copyShareLink(url: string): Promise<void> {
  await navigator.clipboard.writeText(url);
}

export function openWhatsAppShare(message: string): void {
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}

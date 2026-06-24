import type { Tables } from '@/integrations/supabase/types';
import { getServiceType } from '@/lib/serviceType';
import { updateTravelRequestStatus } from '@/lib/fetchTravelRequests';

type TravelRequest = Tables<'travel_requests'>;

const SENT_STATUSES = ['proposal_sent', 'approved', 'in_operation', 'completed'] as const;
const OPERATION_STATUSES = ['in_operation', 'completed'] as const;

/** Ao compartilhar proposta ou roteiro (link copiado / WhatsApp). */
export async function markSentOnShare(
  requestId: string,
  request: Pick<TravelRequest, 'status'>,
): Promise<void> {
  if (SENT_STATUSES.includes(request.status as (typeof SENT_STATUSES)[number])) return;
  await updateTravelRequestStatus(requestId, 'proposal_sent');
}

/** Pacote completo: marcar Pago → Em Operação. */
export async function markInOperationOnPaid(
  requestId: string,
  request: Pick<TravelRequest, 'status' | 'service_type'>,
): Promise<void> {
  if (getServiceType(request) !== 'full_package') return;
  if (OPERATION_STATUSES.includes(request.status as (typeof OPERATION_STATUSES)[number])) return;
  await updateTravelRequestStatus(requestId, 'in_operation');
}

/** Consultoria: encerrar manualmente. */
export async function completeConsultancy(requestId: string): Promise<void> {
  await updateTravelRequestStatus(requestId, 'completed');
}

export function canCompleteConsultancy(
  request: Pick<TravelRequest, 'status' | 'service_type'>,
): boolean {
  return (
    getServiceType(request) === 'consultancy' &&
    request.status === 'proposal_sent'
  );
}

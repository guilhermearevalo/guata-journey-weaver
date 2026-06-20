import type { Enums } from '@/integrations/supabase/types';

export type ServiceType = Enums<'service_type'>;
export type RequestStatus = Enums<'request_status'>;

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  consultancy: 'Consultoria / Roteiro',
  full_package: 'Pacote completo',
};

export const SERVICE_TYPE_SHORT: Record<ServiceType, string> = {
  consultancy: 'Consultoria',
  full_package: 'Pacote',
};

export function getServiceType(request: { service_type?: ServiceType | null } | null | undefined): ServiceType {
  return request?.service_type === 'consultancy' ? 'consultancy' : 'full_package';
}

export function isConsultancy(request: { service_type?: ServiceType | null } | null | undefined): boolean {
  return getServiceType(request) === 'consultancy';
}

/** Colunas do Kanban — consultoria oculta Aprovada e Em Operação. */
export function getVisibleKanbanStatuses(filter: 'all' | ServiceType): RequestStatus[] {
  const all: RequestStatus[] = [
    'pending',
    'in_analysis',
    'proposal_sent',
    'approved',
    'in_operation',
    'completed',
    'cancelled',
  ];

  if (filter === 'consultancy') {
    return all.filter((s) => s !== 'approved' && s !== 'in_operation');
  }
  return all;
}

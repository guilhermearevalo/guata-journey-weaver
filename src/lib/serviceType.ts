import type { Enums } from '@/integrations/supabase/types';

export type ServiceType = Enums<'service_type'>;
export type RequestStatus = Enums<'request_status'>;

export type ServiceTypeRequest = {
  service_type?: ServiceType | null;
  service_type_note?: string | null;
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  consultancy: 'Consultoria / Roteiro',
  full_package: 'Pacote completo',
  other: 'Outros',
};

export const SERVICE_TYPE_SHORT: Record<ServiceType, string> = {
  consultancy: 'Consultoria',
  full_package: 'Pacote',
  other: 'Outros',
};

export const SERVICE_TYPE_DESCRIPTIONS: Record<ServiceType, string> = {
  consultancy: 'Entrega de roteiro sem reservas',
  full_package: 'Aprovação, pagamento e operação',
  other: 'Serviço avulso ou fora do padrão',
};

export function getServiceType(request: ServiceTypeRequest | null | undefined): ServiceType {
  const type = request?.service_type;
  if (type === 'consultancy' || type === 'other') return type;
  return 'full_package';
}

export function isConsultancy(request: ServiceTypeRequest | null | undefined): boolean {
  return getServiceType(request) === 'consultancy';
}

/** Consultoria e Outros seguem fluxo simplificado (sem Aprovada / Em Operação). */
export function isSimpleWorkflow(request: ServiceTypeRequest | null | undefined): boolean {
  const type = getServiceType(request);
  return type === 'consultancy' || type === 'other';
}

export function getServiceTypeDisplay(request: ServiceTypeRequest | null | undefined): string {
  if (!request) return SERVICE_TYPE_LABELS.full_package;
  const type = getServiceType(request);
  if (type === 'other' && request.service_type_note?.trim()) {
    return request.service_type_note.trim();
  }
  return SERVICE_TYPE_LABELS[type];
}

export function getServiceTypeBadgeLabel(request: ServiceTypeRequest | null | undefined): string {
  if (!request) return SERVICE_TYPE_SHORT.full_package;
  const type = getServiceType(request);
  if (type === 'other') {
    const note = request.service_type_note?.trim();
    if (note) {
      return note.length > 28 ? `${note.slice(0, 28)}…` : note;
    }
  }
  return SERVICE_TYPE_SHORT[type];
}

/** Colunas do Kanban — consultoria e outros ocultam Aprovada e Em Operação. */
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

  if (filter === 'consultancy' || filter === 'other') {
    return all.filter((s) => s !== 'approved' && s !== 'in_operation');
  }
  return all;
}

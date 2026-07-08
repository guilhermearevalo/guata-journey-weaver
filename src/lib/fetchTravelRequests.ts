import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type TravelRequest = Tables<'travel_requests'>;

/** Lista demandas — tenta RPC staff primeiro (evita 500 de RLS no REST). */
export async function fetchTravelRequests(): Promise<TravelRequest[]> {
  const rpcQuery = supabase.rpc('staff_list_travel_requests' as never);
  const restQuery = supabase
    .from('travel_requests')
    .select('*')
    .order('created_at', { ascending: false });

  const [rpc, rest] = await Promise.allSettled([rpcQuery, restQuery]);

  const rpcResult = rpc.status === 'fulfilled' ? rpc.value : null;
  const restResult = rest.status === 'fulfilled' ? rest.value : null;

  if (rpcResult && !rpcResult.error && rpcResult.data) {
    return (rpcResult.data ?? []) as TravelRequest[];
  }

  if (restResult && !restResult.error && restResult.data) {
    return restResult.data;
  }

  const rpcError = rpc.status === 'fulfilled' ? rpc.value.error : rpc.reason;
  const restError = rest.status === 'fulfilled' ? rest.value.error : rest.reason;
  throw rpcError ?? restError ?? new Error('Erro ao carregar demandas');
}

export async function updateTravelRequestStatus(
  id: string,
  status: TravelRequest['status'],
): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_update_travel_request_status' as never,
      { p_id: id, p_status: status } as never,
    );
    if (!error) return;
  } catch {
    // fallback REST
  }

  const { error } = await supabase.from('travel_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateTravelRequestServiceType(
  id: string,
  serviceType: TravelRequest['service_type'],
  serviceTypeNote?: string | null,
): Promise<void> {
  const note = serviceType === 'other' ? serviceTypeNote?.trim() || null : null;

  try {
    const { error } = await supabase.rpc(
      'staff_update_travel_request_service_type' as never,
      {
        p_id: id,
        p_service_type: serviceType,
        p_service_type_note: note,
      } as never,
    );
    if (!error) return;
  } catch {
    // fallback REST
  }

  const payload: { service_type: TravelRequest['service_type']; service_type_note?: string | null } = {
    service_type: serviceType,
  };
  if (serviceType === 'other') {
    payload.service_type_note = note;
  }

  const { error } = await supabase.from('travel_requests').update(payload).eq('id', id);

  if (
    error &&
    (error.code === 'PGRST204' ||
      error.message?.includes('service_type_note') ||
      error.message?.includes('schema cache'))
  ) {
    const { error: fallbackError } = await supabase
      .from('travel_requests')
      .update({ service_type: serviceType })
      .eq('id', id);
    if (fallbackError) throw fallbackError;
    return;
  }

  if (error) throw error;
}

export function describeServiceTypeUpdateError(error: unknown): string {
  const err = error as { message?: string; code?: string };
  const message = err.message ?? '';

  if (
    message.includes('service_type_note') ||
    err.code === 'PGRST204' ||
    message.includes('schema cache')
  ) {
    return 'Migration pendente: rode 20260629120000_service_type_other.sql no Supabase.';
  }
  if (message.includes('invalid input value for enum') || message.includes("'other'")) {
    return 'Tipo "Outros" ainda não existe no banco. Rode a migration service_type_other no Supabase.';
  }
  if (message.includes('Could not find the function') || message.includes('staff_update_travel_request_service_type')) {
    return 'RPC pendente: rode 20260629140000_staff_update_service_type_rpc.sql no Supabase.';
  }
  if (message.includes('not authorized') || err.code === '42501') {
    return 'Sem permissão. Verifique se sua conta é staff/admin.';
  }

  return message || 'Não foi possível salvar. Verifique migrations e permissões no Supabase.';
}

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type TravelRequest = Tables<'travel_requests'>;

/** Lista demandas — tenta REST e RPC em paralelo; usa o que responder primeiro. */
export async function fetchTravelRequests(): Promise<TravelRequest[]> {
  const restQuery = supabase
    .from('travel_requests')
    .select('*')
    .order('created_at', { ascending: false });

  const rpcQuery = supabase.rpc('staff_list_travel_requests' as never);

  const [rest, rpc] = await Promise.allSettled([restQuery, rpcQuery]);

  if (rest.status === 'fulfilled' && !rest.value.error && rest.value.data) {
    return rest.value.data;
  }

  if (rpc.status === 'fulfilled' && !rpc.value.error && rpc.value.data) {
    return (rpc.value.data ?? []) as TravelRequest[];
  }

  const restError = rest.status === 'fulfilled' ? rest.value.error : rest.reason;
  const rpcError = rpc.status === 'fulfilled' ? rpc.value.error : rpc.reason;
  throw restError ?? rpcError ?? new Error('Erro ao carregar demandas');
}

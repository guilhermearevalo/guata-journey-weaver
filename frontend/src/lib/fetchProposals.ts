import { supabase } from '@/integrations/supabase/client';

import type { Tables } from '@/integrations/supabase/types';



type Proposal = Tables<'proposals'>;

type TravelRequest = Tables<'travel_requests'>;



const REQUEST_FIELDS =

  'destination, travel_dates, travelers_count, preferences, client_name, budget_range, special_requests, service_type, status';



async function rpcRows<T>(name: string, args?: Record<string, unknown>): Promise<T[]> {

  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);

  if (error) throw error;

  return (data ?? []) as T[];

}



export async function fetchProposalByRequest(requestId: string): Promise<Proposal | null> {

  try {

    const rows = await rpcRows<Proposal>('staff_get_proposal_by_request', {

      p_request_id: requestId,

    });

    if (rows[0]) return rows[0];

  } catch {

    // fallback REST

  }



  const { data, error } = await supabase

    .from('proposals')

    .select('*')

    .eq('request_id', requestId)

    .order('created_at', { ascending: false })

    .limit(1)

    .maybeSingle();



  if (error) throw error;

  return data;

}



export async function fetchProposalRequestIds(): Promise<Set<string>> {

  try {

    const rows = await rpcRows<{ request_id: string }>('staff_list_proposal_request_ids');

    return new Set(rows.map((row) => row.request_id));

  } catch {

    // fallback REST

  }



  const { data, error } = await supabase.from('proposals').select('request_id');

  if (error) throw error;

  return new Set((data ?? []).map((row) => row.request_id));

}



export type ProposalWithRequest = Proposal & {

  travel_requests: Pick<
    TravelRequest,
    'destination' | 'travel_dates' | 'travelers_count' | 'preferences' | 'client_name' | 'budget_range' | 'special_requests' | 'service_type' | 'status'
  >;

};



async function fetchTravelRequestFields(

  requestId: string,

): Promise<ProposalWithRequest['travel_requests'] | null> {

  try {

    const rows = await rpcRows<TravelRequest>('staff_get_travel_request', { p_id: requestId });

    const row = rows[0];

    if (row) {

      return {
        destination: row.destination,
        travel_dates: row.travel_dates,
        travelers_count: row.travelers_count,
        preferences: row.preferences,
        client_name: row.client_name,
        budget_range: row.budget_range,
        special_requests: row.special_requests,
        service_type: row.service_type,
        status: row.status,
      };

    }

  } catch {

    // fallback REST

  }



  const { data, error } = await supabase

    .from('travel_requests')

    .select(REQUEST_FIELDS)

    .eq('id', requestId)

    .single();



  if (error) throw error;

  return data as ProposalWithRequest['travel_requests'];

}



export async function fetchProposalForItinerary(

  requestId: string,

): Promise<ProposalWithRequest | null> {

  const proposal = await fetchProposalByRequest(requestId);

  if (!proposal) return null;



  const travel_requests = await fetchTravelRequestFields(requestId);

  if (!travel_requests) return null;



  return { ...proposal, travel_requests };

}



export async function updateProposalItinerary(

  proposalId: string,

  itinerary: unknown,

): Promise<void> {

  const payload = JSON.parse(JSON.stringify(itinerary));



  try {

    await rpcRows<void>('staff_update_proposal_itinerary', {

      p_proposal_id: proposalId,

      p_itinerary: payload,

    });

    return;

  } catch (rpcError) {

    const { error } = await supabase

      .from('proposals')

      .update({ itinerary: payload })

      .eq('id', proposalId);

    if (error) throw rpcError ?? error;

  }

}



export async function updateProposalDossier(

  proposalId: string,

  dossier: unknown,

): Promise<void> {

  const payload = JSON.parse(JSON.stringify(dossier));



  try {

    await rpcRows<void>('staff_update_proposal_dossier', {

      p_proposal_id: proposalId,

      p_dossier: payload,

    });

    return;

  } catch (rpcError) {

    const { error } = await supabase

      .from('proposals')

      .update({ dossier: payload } as never)

      .eq('id', proposalId);

    if (error) throw rpcError ?? error;

  }

}



export async function updateProposalShareToken(

  proposalId: string,

  shareToken: string,

): Promise<void> {

  try {

    await rpcRows<void>('staff_update_proposal_share_token', {

      p_proposal_id: proposalId,

      p_share_token: shareToken,

    });

    return;

  } catch (rpcError) {

    const { error } = await supabase

      .from('proposals')

      .update({ share_token: shareToken } as never)

      .eq('id', proposalId);

    if (error) throw rpcError ?? error;

  }

}



export function extractFunctionError(error: unknown, data?: { error?: string } | null): string {

  if (data?.error) return data.error;

  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError')) {

    return 'Função itinerary-ai indisponível. Rode: npx supabase functions deploy itinerary-ai';

  }

  if (msg.includes('GEMINI_API_KEY')) {

    return 'Configure GEMINI_API_KEY nos secrets do Supabase.';

  }

  if (msg.includes('not authorized')) {

    return 'Sem permissão de staff. Verifique seu papel admin no banco.';

  }

  return msg || 'Erro desconhecido.';

}



export { extractFunctionError as itineraryAiErrorMessage };



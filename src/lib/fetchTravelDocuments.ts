import { supabase } from '@/integrations/supabase/client';

export type TravelDocumentRow = {
  id: string;
  proposal_id: string;
  request_id: string;
  title: string;
  category: string;
  document_type: string;
  status: string;
  file_url: string | null;
  file_path: string | null;
  notes: string | null;
  visible_in_public: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchTravelDocumentsByProposal(
  proposalId: string,
): Promise<TravelDocumentRow[]> {
  try {
    const { data, error } = await supabase.rpc(
      'staff_list_travel_documents' as never,
      { p_proposal_id: proposalId } as never,
    );
    if (!error) return (data ?? []) as TravelDocumentRow[];
  } catch {
    // fallback REST
  }

  const { data, error } = await supabase
    .from('travel_documents' as never)
    .select('*')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TravelDocumentRow[];
}

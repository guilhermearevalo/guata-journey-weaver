import { supabase } from '@/integrations/supabase/client';
import type { TravelDocument } from '@/components/itinerary/TravelDocumentsVault';

export type TravelDocumentRow = TravelDocument & {
  created_at?: string;
  updated_at?: string;
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

export type InsertTravelDocumentInput = {
  proposal_id: string;
  request_id: string;
  title: string;
  category: string;
  document_type: 'checklist' | 'vault';
  status: string;
  file_url?: string | null;
  file_path?: string | null;
  notes?: string | null;
  visible_in_public: boolean;
};

export async function insertTravelDocument(input: InsertTravelDocumentInput): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_insert_travel_document' as never,
      {
        p_proposal_id: input.proposal_id,
        p_request_id: input.request_id,
        p_title: input.title,
        p_category: input.category,
        p_document_type: input.document_type,
        p_status: input.status,
        p_file_url: input.file_url ?? null,
        p_file_path: input.file_path ?? null,
        p_notes: input.notes ?? null,
        p_visible_in_public: input.visible_in_public,
      } as never,
    );
    if (!error) return;
    throw error;
  } catch {
    const { error } = await supabase.from('travel_documents' as never).insert(input as never);
    if (error) throw error;
  }
}

export async function updateTravelDocument(
  id: string,
  patch: { status?: string; visible_in_public?: boolean; notes?: string | null },
): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_update_travel_document' as never,
      {
        p_id: id,
        p_status: patch.status ?? null,
        p_visible_in_public: patch.visible_in_public ?? null,
        p_notes: patch.notes ?? null,
      } as never,
    );
    if (!error) return;
    throw error;
  } catch {
    const { error } = await supabase
      .from('travel_documents' as never)
      .update(patch as never)
      .eq('id', id);
    if (error) throw error;
  }
}

export async function deleteTravelDocument(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_delete_travel_document' as never,
      { p_id: id } as never,
    );
    if (!error) return;
    throw error;
  } catch {
    const { error } = await supabase.from('travel_documents' as never).delete().eq('id', id);
    if (error) throw error;
  }
}

export async function deleteProposalById(proposalId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_delete_proposal' as never,
      { p_proposal_id: proposalId } as never,
    );
    if (!error) return;
    throw error;
  } catch {
    await supabase.from('travel_documents' as never).delete().eq('proposal_id', proposalId);
    const { error } = await supabase.from('proposals').delete().eq('id', proposalId);
    if (error) throw error;
  }
}

export async function deleteTravelRequestById(requestId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'staff_delete_travel_request' as never,
      { p_id: requestId } as never,
    );
    if (!error) return;
    throw error;
  } catch {
    throw new Error('Não foi possível excluir a demanda. Rode docs/fix_travel_documents_and_delete.sql no Supabase.');
  }
}

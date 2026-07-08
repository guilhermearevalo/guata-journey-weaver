import { supabase } from '@/integrations/supabase/client';

export type ReviewableRequest = {
  status: string;
  admin_reviewed_at?: string | null;
};

export function isUnreviewedPendingRequest(request: ReviewableRequest): boolean {
  return request.status === 'pending' && !request.admin_reviewed_at;
}

export async function fetchUnreviewedRequestsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('travel_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .is('admin_reviewed_at', null);

  if (error) return 0;
  return count ?? 0;
}

export async function markTravelRequestReviewed(id: string): Promise<void> {
  const { error } = await supabase
    .from('travel_requests')
    .update({ admin_reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .is('admin_reviewed_at', null);

  if (error) throw error;
}

export function invalidateRequestNotificationQueries(
  queryClient: { invalidateQueries: (opts: { queryKey: string[] }) => void },
  userId?: string | null,
) {
  queryClient.invalidateQueries({ queryKey: ['admin-new-requests-count'] });
  queryClient.invalidateQueries({ queryKey: ['recent-requests'] });
  queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ['travel_requests', userId] });
  }
}

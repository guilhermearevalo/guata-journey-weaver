import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useMustChangePassword() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['must-change-password', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.must_change_password === true;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return {
    mustChangePassword: query.data === true,
    loading: authLoading || query.isLoading,
    refetch: query.refetch,
  };
}

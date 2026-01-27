import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type AppRole = 'client' | 'consultant' | 'manager' | 'admin' | 'partner';

interface UserRole {
  role: AppRole;
  isStaff: boolean;
  isAdmin: boolean;
  isPartner: boolean;
}

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole> => {
      if (!user?.id) {
        return { role: 'client', isStaff: false, isAdmin: false, isPartner: false };
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return { role: 'client', isStaff: false, isAdmin: false, isPartner: false };
      }

      const role = (data?.role || 'client') as AppRole;
      const isStaff = ['consultant', 'manager', 'admin'].includes(role);
      const isAdmin = role === 'admin';
      const isPartner = role === 'partner';

      return { role, isStaff, isAdmin, isPartner };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

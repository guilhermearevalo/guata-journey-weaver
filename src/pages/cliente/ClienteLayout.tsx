import { Outlet } from 'react-router-dom';
import { ClienteSidebar } from '@/components/cliente/ClienteSidebar';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ClienteLayout() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex h-screen bg-background">
      <ClienteSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <h1 className="text-lg font-semibold">Minha Conta</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || user?.email}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
                {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

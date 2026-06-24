import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { ProtectedPartnerRoute } from '@/components/partner/ProtectedPartnerRoute';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function PartnerLayout() {
  const { user } = useAuth();
  const initials = user?.email?.substring(0, 2).toUpperCase() || 'PA';

  return (
    <ProtectedPartnerRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <PartnerSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b flex items-center justify-between px-4 bg-background">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">Portal do Parceiro</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>
            <main className="flex-1 overflow-auto bg-muted/30 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedPartnerRoute>
  );
}

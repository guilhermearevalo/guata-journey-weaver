import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Compass,
  Users,
  Building2,
  UserCog,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  DollarSign,
  HelpCircle,
  Mail,
  MessageSquareQuote,
  Newspaper,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  fetchUnreviewedRequestsCount,
  invalidateRequestNotificationQueries,
  isUnreviewedPendingRequest,
} from '@/lib/travelRequestReview';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const AdminSidebar = () => {
  const { data: userRole } = useUserRole();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const { data: newPartnersCount = 0 } = useQuery({
    queryKey: ['admin-new-partners-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('partner_agencies')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false)
        .is('admin_reviewed_at', null);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: newRequestsCount = 0 } = useQuery({
    queryKey: ['admin-new-requests-count'],
    queryFn: fetchUnreviewedRequestsCount,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-new-travel-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'travel_requests' },
        (payload) => {
          const row = payload.new as {
            id: string;
            client_name: string;
            destination: string | null;
            status: string;
            admin_reviewed_at: string | null;
          };

          invalidateRequestNotificationQueries(queryClient, user.id);

          if (!isUnreviewedPendingRequest(row)) return;

          const destination = row.destination ? ` · ${row.destination}` : '';
          toast({
            title: 'Nova demanda',
            description: `${row.client_name}${destination}`,
            action: (
              <ToastAction
                altText="Abrir demanda"
                onClick={() => navigate(`/admin/demandas?demanda=${row.id}`)}
              >
                Abrir
              </ToastAction>
            ),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast, navigate]);

  const menuItems: Array<{
    icon: typeof LayoutDashboard;
    label: string;
    href: string;
    end?: boolean;
    badge?: number;
  }> = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/admin',
      end: true 
    },
    { 
      icon: ClipboardList, 
      label: 'Demandas', 
      href: '/admin/demandas',
      badge: newRequestsCount,
    },
    { 
      icon: Compass, 
      label: 'Experiências', 
      href: '/admin/experiencias' 
    },
    { 
      icon: Users, 
      label: 'Clientes', 
      href: '/admin/clientes' 
    },
    { 
      icon: Building2, 
      label: 'Parceiros', 
      href: '/admin/parceiros',
      badge: newPartnersCount,
    },
    {
      icon: Mail,
      label: 'Mensagens',
      href: '/admin/mensagens',
    },
    { 
      icon: FileText, 
      label: 'CMS', 
      href: '/admin/cms' 
    },
    { 
      icon: BarChart3, 
      label: 'Relatório Agências', 
      href: '/admin/relatorio-agencias' 
    },
    { 
      icon: DollarSign, 
      label: 'Financeiro', 
      href: '/admin/financeiro' 
    },
    {
      icon: MessageSquareQuote,
      label: 'Depoimentos',
      href: '/admin/depoimentos'
    },
    {
      icon: Newspaper,
      label: 'Newsletter',
      href: '/admin/newsletter'
    },
    {
      icon: Camera,
      label: 'Viagens Realizadas',
      href: '/admin/viagens-realizadas'
    },
  ];

  if (userRole?.isAdmin) {
    menuItems.push({ 
      icon: UserCog, 
      label: 'Equipe', 
      href: '/admin/equipe' 
    });
  }

  menuItems.push({ 
    icon: Settings, 
    label: 'Configurações', 
    href: '/admin/configuracoes' 
  });

  menuItems.push({
    icon: HelpCircle,
    label: 'Ajuda',
    href: '/admin/ajuda'
  });

  return (
    <Sidebar collapsible="icon" className="admin-sidebar-theme border-r border-sidebar-border shadow-sm">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'px-1')}>
          {!collapsed ? (
            <div>
              <p className="font-display text-base font-bold text-sidebar-foreground">Guatá Admin</p>
              <p className="text-xs font-medium capitalize text-sidebar-primary">{userRole?.role}</p>
            </div>
          ) : (
            <span className="font-display text-sm font-bold text-sidebar-primary">G</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.href}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isActive && "bg-sidebar-accent font-semibold text-sidebar-primary border-l-2 border-sidebar-primary"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {!collapsed && (item.badge ?? 0) > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className={cn("gap-2 text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "w-full justify-center")}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;

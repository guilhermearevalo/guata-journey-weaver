import { 
  LayoutDashboard, 
  ClipboardList, 
  Compass, 
  Users, 
  Building2, 
  UserCog, 
  FileText, 
  Settings,
  ChevronLeft,
  LogOut,
  BarChart3,
  DollarSign,
  HelpCircle,
  Mail,
  MessageSquareQuote,
  Newspaper,
  Camera
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { useCadasturConfig } from '@/hooks/useCadasturConfig';
import { StorageImage } from '@/components/ui/StorageImage';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-guata.png';
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
  const { data: cadasturConfig } = useCadasturConfig();
  const agencyLogo = cadasturConfig?.agency_logo_url;
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const { data: pendingPartnersCount = 0 } = useQuery({
    queryKey: ['admin-pending-partners-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('partner_agencies')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', false);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['admin-unread-messages-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/admin',
      end: true 
    },
    { 
      icon: ClipboardList, 
      label: 'Demandas', 
      href: '/admin/demandas' 
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
      badge: pendingPartnersCount,
    }, 
    {
      icon: Mail,
      label: 'Mensagens',
      href: '/admin/mensagens',
      badge: unreadMessagesCount,
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

  // Only show team management for admins
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {agencyLogo ? (
            <StorageImage
              src={agencyLogo}
              alt="Guatá"
              className={cn('h-10 w-auto transition-all', collapsed && 'h-8')}
            />
          ) : (
            <img
              src={logo}
              alt="Guatá"
              className={cn('h-10 w-auto transition-all', collapsed && 'h-8')}
            />
          )}
          {!collapsed && (
            <div>
              <p className="font-display font-semibold text-sm text-sidebar-foreground">Guatá Admin</p>
              <p className="text-xs font-medium capitalize text-sidebar-primary">{userRole?.role}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary/80">Menu Principal</SidebarGroupLabel>
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
                          "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-primary",
                          isActive && "bg-sidebar-accent/80 text-sidebar-primary font-semibold border-l-2 border-sidebar-primary"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {!collapsed && (item as any).badge > 0 && (
                        <span
                          data-testid={`sidebar-badge-${item.href}`}
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white"
                        >
                          {(item as any).badge}
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
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className={cn("gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed && "w-full justify-center")}
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

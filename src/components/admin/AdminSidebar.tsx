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
  DollarSign
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
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
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
      href: '/admin/parceiros' 
    },
    { 
      icon: FileText, 
      label: 'CMS', 
      href: '/admin/cms' 
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

  return (
    <Sidebar collapsible="icon" className="border-r bg-card">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Guatá" 
            className={cn(
              "h-10 w-auto transition-all",
              collapsed && "h-8"
            )}
          />
          {!collapsed && (
            <div>
              <p className="font-display font-semibold text-sm">Guatá Admin</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole?.role}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
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
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className={cn("gap-2", collapsed && "w-full justify-center")}
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

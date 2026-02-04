import { Link, useLocation } from 'react-router-dom';
import { Home, Plane, MessageCircle, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import logo from '@/assets/logo-guata.png';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/minha-conta' },
  { icon: Plane, label: 'Minhas Viagens', href: '/minha-conta/viagens' },
  { icon: MessageCircle, label: 'Mensagens', href: '/minha-conta/mensagens' },
  { icon: User, label: 'Meu Perfil', href: '/minha-conta/perfil' },
];

export function ClienteSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/minha-conta') {
      return location.pathname === '/minha-conta';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/">
          <img src={logo} alt="Guatá" className="h-8 w-auto" />
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

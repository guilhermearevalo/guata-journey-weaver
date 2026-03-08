import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useHomepageSections } from '@/hooks/useHomepageSections';
import logo from '@/assets/logo-guata.png';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, isStaff, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isStaff()) return '/admin';
    if (hasRole('partner')) return '/partner';
    return '/minha-conta';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Guatá Travel Experience" className="h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/experiencias"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Experiências
          </Link>
          <Link
            to="/excursoes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Excursões
          </Link>
          <Link
            to="/pacotes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Pacotes
          </Link>
          <Link
            to="/viagem-personalizada"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Viagem Personalizada
          </Link>
          <Link
            to="/sobre"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Sobre Nós
          </Link>
        </div>

        {/* Auth Section */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                  {isStaff() ? 'Painel Admin' : hasRole('partner') ? 'Painel Parceiro' : 'Minha Conta'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/cadastro')}>
                Criar Conta
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto space-y-4 px-4 py-6">
            <Link
              to="/experiencias"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Experiências
            </Link>
            <Link
              to="/excursoes"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Excursões
            </Link>
            <Link
              to="/pacotes"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pacotes
            </Link>
            <Link
              to="/viagem-personalizada"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Viagem Personalizada
            </Link>
            <Link
              to="/sobre"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre Nós
            </Link>
            
            <div className="border-t pt-4">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="block text-sm font-medium text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isStaff() ? 'Painel Admin' : hasRole('partner') ? 'Painel Parceiro' : 'Minha Conta'}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-4 block text-sm font-medium text-destructive"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')} className="justify-start">
                    Entrar
                  </Button>
                  <Button onClick={() => navigate('/cadastro')}>
                    Criar Conta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

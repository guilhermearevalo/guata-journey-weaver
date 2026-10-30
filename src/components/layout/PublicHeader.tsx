import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { TopBar } from './TopBar';
import { InfoStrip } from './InfoStrip';
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
import { useCadasturConfig } from '@/hooks/useCadasturConfig';
import { StorageImage } from '@/components/ui/StorageImage';

function BrandMark({ agencyLogo }: { agencyLogo?: string | null }) {
  const { t } = useI18n();
  if (agencyLogo) {
    return (
      <StorageImage
        src={agencyLogo}
        alt={t('brandName')}
        className="h-10 w-auto max-w-[160px] object-contain object-left"
      />
    );
  }
  return (
    <div className="flex flex-col leading-none">
      <span className="font-display text-xl font-bold tracking-tight text-primary">{t('brandName')}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {t('brandTagline')}
      </span>
    </div>
  );
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, isStaff, hasRole } = useAuth();
  const { data: sections } = useHomepageSections();
  const { data: cadasturConfig } = useCadasturConfig();
  const agencyLogo = cadasturConfig?.agency_logo_url;
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isStaff()) return '/admin';
    if (hasRole('partner')) return '/partner';
    return '/minha-conta';
  };

  const dashboardLabel = isStaff() ? t('adminPanel') : hasRole('partner') ? t('partnerPanel') : t('myAccount');

  const navLinks = (
    <>
      <Link
        to="/viagens-realizadas"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {t('navTrips')}
      </Link>
      <Link to="/excursoes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        {t('navTours')}
      </Link>
      {sections?.custom_travel_cta !== false && (
        <Link
          to="/viagem-personalizada"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {t('navCustom')}
        </Link>
      )}
      <Link to="/passagens" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        {t('navFlights')}
      </Link>
      <Link to="/sobre" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
        {t('navAbout')}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <TopBar />
      <InfoStrip />
      <nav className="container mx-auto flex h-[4.5rem] items-center justify-between gap-4 px-4 lg:px-8">
        <Link to="/" className="shrink-0">
          <BrandMark agencyLogo={agencyLogo} />
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">{navLinks}</div>

        <div className="hidden items-center gap-3 md:flex">
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
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>{dashboardLabel}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                {t('login')}
              </Button>
              <Button onClick={() => navigate('/viagem-personalizada')} className="gap-1.5">
                {t('planTrip')} <ArrowUpRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto space-y-4 px-4 py-6">
            <Link
              to="/viagens-realizadas"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navTrips')}
            </Link>
            <Link
              to="/excursoes"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navTours')}
            </Link>
            {sections?.custom_travel_cta !== false && (
              <Link
                to="/viagem-personalizada"
                className="block text-sm font-medium text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navCustom')}
              </Link>
            )}
            <Link
              to="/passagens"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navFlights')}
            </Link>
            <Link
              to="/sobre"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('navAbout')}
            </Link>

            <div className="border-t pt-4">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="block text-sm font-medium text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dashboardLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-4 block text-sm font-medium text-destructive"
                  >
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => navigate('/login')} className="justify-start">
                    {t('login')}
                  </Button>
                  <Button onClick={() => navigate('/viagem-personalizada')}>{t('planTrip')}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

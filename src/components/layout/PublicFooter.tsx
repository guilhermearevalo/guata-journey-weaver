import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Send, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContactInfo } from '@/hooks/useContactInfo';
import { useCadasturConfig } from '@/hooks/useCadasturConfig';
import { useI18n } from '@/lib/i18n';

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest text-primary-foreground/90">{children}</h4>
  );
}

function NewsletterForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.info(t('footerEmailExists'));
      } else {
        toast.error(t('footerEmailError'));
      }
      return;
    }

    setSubscribed(true);
    setEmail('');
    toast.success(t('footerEmailOk'));
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-amber-300">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{t('footerThanks')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        type="email"
        placeholder={t('footerEmailPh')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-9 min-w-0 flex-1 border-primary-foreground/20 bg-primary-foreground/10 text-sm text-primary-foreground placeholder:text-primary-foreground/40"
      />
      <Button type="submit" size="sm" disabled={loading} variant="secondary" className="shrink-0 gap-1.5 sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t('footerSubscribe')}
      </Button>
    </form>
  );
}

export function PublicFooter() {
  const { t } = useI18n();
  const { data: cadasturConfig } = useCadasturConfig();
  const { data: contact } = useContactInfo();
  const cadasturNumber = cadasturConfig?.number || '64.677.632/0001-77';

  const linkClass = 'text-sm text-primary-foreground/75 transition-colors hover:text-amber-300';

  const contactRowClass = 'grid grid-cols-[1rem_1fr] items-start gap-x-3 text-sm text-primary-foreground/75';

  return (
    <footer className="border-t border-primary-foreground/10 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-4 lg:col-span-4">
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl font-bold tracking-tight text-primary-foreground">{t('brandName')}</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-primary-foreground/60">
                {t('brandTagline')}
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/75">{t('footerTagline')}</p>
            <div className="flex gap-3">
              {contact?.instagram && (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/70 hover:text-amber-300"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {contact?.facebook && (
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/70 hover:text-amber-300"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {contact?.youtube && (
                <a
                  href={contact.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/70 hover:text-amber-300"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t('footerNav')}</FooterHeading>
            <ul className="space-y-2">
              <li>
                <Link to="/experiencias" className={linkClass}>
                  {t('footerExperiences')}
                </Link>
              </li>
              <li>
                <Link to="/passagens" className={linkClass}>
                  {t('navFlights')}
                </Link>
              </li>
              <li>
                <Link to="/viagem-personalizada" className={linkClass}>
                  {t('navCustom')}
                </Link>
              </li>
              <li>
                <Link to="/sobre" className={linkClass}>
                  {t('navAbout')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>{t('footerLegal')}</FooterHeading>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className={linkClass}>
                  {t('footerFAQ')}
                </Link>
              </li>
              <li>
                <Link to="/termos" className={linkClass}>
                  {t('footerTerms')}
                </Link>
              </li>
              <li>
                <Link to="/politica-servicos" className={linkClass}>
                  {t('footerPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/seja-parceiro" className={linkClass}>
                  {t('footerPartner')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <FooterHeading>{t('footerContact')}</FooterHeading>
            <ul className="space-y-2.5">
              {contact?.address && (
                <li className={contactRowClass}>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
                  <span>{contact.address}</span>
                </li>
              )}
              {contact?.phone && (
                <li className={contactRowClass}>
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
                  <a href={`tel:+${(contact?.whatsapp || '').replace(/\D/g, '')}`} className="hover:text-amber-300">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li className={contactRowClass}>
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
                  <a href={`mailto:${contact.email}`} className="break-all hover:text-amber-300">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/15 pt-8">
          <FooterHeading>{t('footerNewsletter')}</FooterHeading>
          <p className="mb-4 max-w-lg text-sm text-primary-foreground/70">{t('footerNewsletterSub')}</p>
          <NewsletterForm />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-primary-foreground/15 pt-8 text-center text-xs text-primary-foreground/60">
          <a
            href="https://cadastur.turismo.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-amber-300"
          >
            <ShieldCheck className="h-4 w-4 text-amber-300" />
            {t('footerCadastur')} {cadasturNumber}
          </a>
          <p>
            © {new Date().getFullYear()} {t('brandName')} — {t('footerRights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

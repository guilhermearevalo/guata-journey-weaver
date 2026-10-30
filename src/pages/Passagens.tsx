import { Seo } from '@/components/seo/Seo';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Maximize2, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ONER_STORE_URL } from '@/lib/onerTravel';
import { useI18n } from '@/lib/i18n';

export default function Passagens() {
  const { t } = useI18n();
  return (
    <div className="py-10 lg:py-14">
      <Seo path="/passagens" title={t('seoFlightsTitle')} description={t('seoFlightsDesc')} />
      <div className="container mx-auto space-y-8 px-4 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Plane className="h-4 w-4" />
            {t('pgEyebrow')}
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{t('pgTitle')}</h1>
          <p className="text-lg text-muted-foreground">{t('pgSub')}</p>
          <p className="text-sm text-muted-foreground">
            {t('pgCustomPrefix')}{' '}
            <Link to="/viagem-personalizada" className="font-medium text-primary hover:underline">
              {t('pgCustomLink')}
            </Link>
          </p>
        </div>
        <div className="mx-auto max-w-5xl rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
          <h2 className="mb-5 font-display text-xl font-bold md:text-2xl">{t('flTitle')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[t('fl1'), t('fl2'), t('fl3')].map((x) => (
              <div key={x} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                {x}
              </div>
            ))}
          </div>
          <Button asChild className="mt-6 bg-amber-400 text-foreground hover:bg-amber-300">
            <Link to="/viagem-personalizada">{t('flQuote')}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 w-full space-y-3 px-2 sm:px-4 lg:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-4 py-2.5 text-center text-sm text-foreground">
          <Maximize2 className="hidden h-4 w-4 shrink-0 sm:inline" />
          <span>{t('pgCalendarNote')}</span>
          <a
            href={ONER_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('pgOpenFullscreen')}
          </a>
        </div>

        <div className="rounded-xl border bg-background shadow-sm">
          <iframe
            title="Guatá — busca de passagens e hotéis"
            src={ONER_STORE_URL}
            className="h-[min(900px,85vh)] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="payment *; fullscreen"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t('pgIframeFail')}{' '}
          <a
            href={ONER_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t('pgOpenTab')}
          </a>
        </p>
      </div>
    </div>
  );
}

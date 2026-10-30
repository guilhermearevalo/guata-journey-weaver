import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { destinations } from '@/lib/destinations';
import { useI18n } from '@/lib/i18n';

const Destinos = () => {
  const { t } = useI18n();
  return (
    <div className="bg-muted/30">
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <Seo path="/destinos" title={t('seoDestTitle')} description={t('seoDestDesc')} />
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">{t('destPageEyebrow')}</p>
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">{t('destPageTitle')}</h1>
          <p className="mt-4 text-muted-foreground">{t('destPageSub')}</p>
        </header>
        <div className="grid gap-8 md:grid-cols-3">
          {destinations.map((d) => (
            <Link
              key={d.slug}
              to={`/destinos/${d.slug}`}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2 p-6">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {d.region}
                </p>
                <h2 className="font-display text-2xl font-semibold text-foreground">{d.name}</h2>
                <p className="text-sm text-muted-foreground">{d.tagline}</p>
                <span className="inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                  {t('destPageCta')} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Destinos;

import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, HeartHandshake, ShieldCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { destinations } from '@/lib/destinations';
import { useI18n } from '@/lib/i18n';

export function DestinationsShowcase() {
  const { t } = useI18n();
  const items = destinations.slice(0, 3);
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-8 bg-primary" />
          {t('destEyebrow')}
        </p>
        <h2 className="mb-10 max-w-2xl font-display text-4xl font-bold md:text-5xl">{t('destTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((d, i) => (
            <Link
              key={d.slug}
              to={`/destinos/${d.slug}`}
              className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'md:row-span-2 md:h-full' : ''} h-80`}
            >
              <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
                <p className="text-xs uppercase tracking-widest opacity-80">{d.region}</p>
                <h3 className="font-display text-3xl font-bold">{d.name}</h3>
                <p className="mt-1 text-sm opacity-90">{d.tagline}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-300">
                  {t('destCta')} <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyGuata() {
  const { t } = useI18n();
  const pillars = [
    { icon: Compass, title: t('why1t'), desc: t('why1d') },
    { icon: HeartHandshake, title: t('why2t'), desc: t('why2d') },
    { icon: ShieldCheck, title: t('why3t'), desc: t('why3d') },
    { icon: Headphones, title: t('why4t'), desc: t('why4d') },
  ];
  return (
    <section className="bg-primary py-20 text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          <span className="h-px w-8 bg-amber-300" />
          {t('whyEyebrow')}
        </p>
        <h2 className="mb-12 max-w-2xl font-display text-4xl font-bold md:text-5xl">{t('whyTitle')}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="border-t border-primary-foreground/20 pt-6">
              <p.icon className="mb-4 h-8 w-8 text-amber-300" />
              <h3 className="mb-2 font-display text-xl font-semibold">{p.title}</h3>
              <p className="text-sm leading-relaxed text-primary-foreground/80">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden py-24">
      <img src={destinations[1]?.image ?? destinations[0].image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-secondary/85" />
      <div className="container relative mx-auto px-4 text-center text-secondary-foreground lg:px-8">
        <h2 className="font-display text-4xl font-bold md:text-5xl">{t('finalTitle')}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">{t('finalSub')}</p>
        <Button asChild size="lg" className="mt-8 h-14 rounded-lg bg-amber-400 px-8 text-base font-semibold text-foreground hover:bg-amber-300">
          <Link to="/viagem-personalizada">{t('planTrip')} <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

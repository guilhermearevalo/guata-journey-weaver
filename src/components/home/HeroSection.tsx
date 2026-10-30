import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useEmblaCarousel from 'embla-carousel-react';
import {
  interpretSearchQuery,
  getPathForSearchIntent,
  type SearchInterpretation,
  type SearchIntent,
} from '@/lib/onerTravel';
import { SearchIntentPanel } from '@/components/home/SearchIntentPanel';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';

const QUICK_FILTERS = ['Pantanal', 'Bonito', 'Nordeste', 'Europa', 'All Inclusive'];

const ONER_CHIPS = [
  { label: 'Passagens', key: 'flights', path: '/passagens' },
  { label: 'Hotéis', key: 'hotels', path: '/passagens' },
] as const;

export function HeroSection() {
  const [destination, setDestination] = useState('');
  const [pendingInterpretation, setPendingInterpretation] = useState<SearchInterpretation | null>(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  const { data: heroSetting } = useQuery({
    queryKey: ['site-setting', 'hero_image_url'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero_image_url')
        .maybeSingle();
      if (error) throw error;
      return data?.value;
    },
    staleTime: 1000 * 60 * 5,
  });

  const slides: Slide[] = (() => {
    if (!heroSetting) return [{ type: 'image' as const, url: DEFAULT_IMAGE }];
    const val = heroSetting as unknown;
    if (typeof val === 'object' && val !== null && 'slides' in val) {
      const s = (val as { slides: Slide[] }).slides;
      return s?.length ? s : [{ type: 'image' as const, url: DEFAULT_IMAGE }];
    }
    const url = typeof val === 'string' ? val.replace(/^"|"$/g, '') : DEFAULT_IMAGE;
    return [{ type: 'image' as const, url: url || DEFAULT_IMAGE }];
  })();

  const hasMultipleSlides = slides.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    if (!emblaApi || !hasMultipleSlides) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi, hasMultipleSlides]);

  const goToIntent = (intent: SearchIntent, query: string) => {
    setPendingInterpretation(null);
    navigate(getPathForSearchIntent(intent, query));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = destination.trim();
    if (!query) {
      navigate('/experiencias');
      return;
    }

    const interpretation = interpretSearchQuery(query);
    if (!interpretation.requiresConfirmation) {
      goToIntent(interpretation.primary.intent, query);
      return;
    }

    setPendingInterpretation(interpretation);
  };

  const handleInputChange = (value: string) => {
    setDestination(value);
    if (pendingInterpretation) setPendingInterpretation(null);
  };

  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      {hasMultipleSlides ? (
        <div className="absolute inset-0" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={i} className="relative min-w-0 flex-[0_0_100%]">
                {slide.type === 'video' ? (
                  <video src={slide.url} className="h-full w-full object-cover object-center" autoPlay muted loop playsInline preload="auto" poster={DEFAULT_IMAGE} />
                ) : (
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${slide.url})` }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0">
          {slides[0]?.type === 'video' ? (
            <video src={slides[0].url} className="h-full w-full object-cover object-center" autoPlay muted loop playsInline preload="auto" poster={DEFAULT_IMAGE} />
          ) : (
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${slides[0]?.url || DEFAULT_IMAGE})` }} />
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/45 to-foreground/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/60 to-transparent" />

      <div className="container relative mx-auto flex min-h-[88vh] flex-col justify-center px-4 py-20 lg:px-8">
        <div className="max-w-3xl">
        <div className="mb-6 flex animate-fade-in items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
          <span className="h-px w-8 bg-amber-300" />
          {t('heroEyebrow')}
        </div>
        <h1 className="animate-fade-in font-display text-5xl font-bold leading-[1.05] tracking-tight text-primary-foreground md:text-7xl">
          {t('heroLine1')}
          <span className="block font-normal italic text-amber-300">{t('heroLine2')}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/90">{t('heroSub')}</p>

        <form
          onSubmit={handleSearch}
          className="mt-8 w-full max-w-2xl animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="rounded-2xl border border-white/20 bg-card/95 p-3 shadow-2xl backdrop-blur-sm md:p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('searchPh')}
                  value={destination}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="h-12 border-0 pl-10 text-base shadow-none focus-visible:ring-0 md:text-lg"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 text-base font-semibold">
                {t('search')}
              </Button>
            </div>

            {pendingInterpretation && (
              <SearchIntentPanel
                interpretation={pendingInterpretation}
                onConfirm={(intent) => goToIntent(intent, pendingInterpretation.query)}
                onDismiss={() => setPendingInterpretation(null)}
              />
            )}

            <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
              {ONER_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => navigate(chip.path)}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {t(chip.key)}
                </button>
              ))}
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => navigate(`/experiencias?destino=${encodeURIComponent(filter)}`)}
                  className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center gap-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <Button size="lg" className="h-14 rounded-lg bg-amber-400 px-8 text-base font-semibold text-foreground shadow-xl hover:bg-amber-300" onClick={() => navigate('/experiencias')}>
            {t('ctaExplore')} <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <button type="button" onClick={() => navigate('/viagem-personalizada')} className="inline-flex items-center gap-2 border-b border-primary-foreground/60 pb-1 font-medium text-primary-foreground hover:border-primary-foreground">
            {t('ctaExpert')} <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-primary-foreground/90">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-300" /> Cadastur</span>
          <span className="h-6 w-px bg-primary-foreground/30" />
          <span>{t('trust1')}</span>
          <span className="h-6 w-px bg-primary-foreground/30" />
          <span>{t('trust2')}</span>
        </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageCircle, ArrowRight, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useEmblaCarousel from 'embla-carousel-react';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  message: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';

const QUICK_FILTERS = ['Pantanal', 'Bonito', 'Nordeste', 'Europa', 'All Inclusive'];

export function HeroSection() {
  const [destination, setDestination] = useState('');
  const navigate = useNavigate();

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

  const { data: whatsappConfig } = useQuery({
    queryKey: ['site-setting', 'whatsapp_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_config')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return null;
      return data.value as unknown as WhatsAppConfig;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destino', destination);
    navigate(`/experiencias?${params.toString()}`);
  };

  const whatsappUrl = whatsappConfig?.enabled && whatsappConfig.number
    ? `https://wa.me/${whatsappConfig.number.replace(/\D/g, '')}${whatsappConfig.message ? `?text=${encodeURIComponent(whatsappConfig.message)}` : ''}`
    : null;

  return (
    <section className="relative min-h-[94vh] overflow-hidden">
      {/* Background carousel */}
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

      {/* Editorial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" style={{ height: '40%', top: 'auto', bottom: 0 }} />

      {/* Content */}
      <div className="container relative mx-auto flex min-h-[94vh] flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
        {/* Trust badge above title */}
        <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
          <span>Cadastur · Receptivo MS · Atendimento humano</span>
        </div>

        <div className="animate-fade-in">
          {/* Main title */}
          <h1 className="font-display text-5xl font-extrabold leading-[1.15] tracking-tight text-white pb-3 md:text-7xl lg:text-8xl">
            Do <span className="italic text-amber-300 hero-text-shadow">Pantanal</span>
            <br className="hidden md:block" />
            <span className="block">ao mundo,</span>
            <span className="block bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent pb-2">
              do seu jeito.
            </span>
          </h1>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="mt-10 w-full max-w-2xl animate-slide-up rounded-2xl border border-white/20 bg-card/95 p-3 shadow-2xl backdrop-blur-sm md:p-4"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Para onde você quer ir? Ex: Bonito, Maldivas, Patagônia..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 border-0 pl-10 text-base shadow-none focus-visible:ring-0 md:text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 text-base font-semibold">
              Buscar
            </Button>
          </div>

          {/* Quick filter chips */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
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
        </form>

        {/* CTA buttons */}
        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.35s' }}
        >
          <Button
            size="lg"
            className="h-12 rounded-full px-8 text-base font-semibold shadow-xl"
            onClick={() => navigate('/viagem-personalizada')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Quero um roteiro personalizado
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>

          {whatsappUrl && (
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#25D366] px-8 text-base font-semibold text-white shadow-xl hover:bg-[#20BA56]"
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar no WhatsApp
              </a>
            </Button>
          )}
        </div>

      </div>
    </section>
  );
}

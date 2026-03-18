import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageCircle, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

const QUICK_FILTERS = ['All Inclusive', 'Nacional', 'Internacional', 'Aventura', 'Praia'];

export function HeroSection() {
  const [destination, setDestination] = useState('');
  const [viewerCount] = useState(() => Math.floor(Math.random() * 30) + 15);
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
    <section className="relative min-h-[92vh] overflow-hidden">
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

      {/* Lighter gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-background/90" />

      {/* Content */}
      <div className="container relative mx-auto flex min-h-[92vh] flex-col items-center justify-center px-4 py-20 text-center lg:px-8">
        <div className="animate-fade-in space-y-5">
          {/* Social proof badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md border-white/20">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              <span className="tabular-nums">{viewerCount}</span> pessoas visualizando agora
            </Badge>
          </div>

          {/* Main title */}
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-white md:text-6xl lg:text-7xl xl:text-8xl">
            Realize sua próxima
            <span className="block text-guata-teal-light hero-text-shadow">aventura</span>
            <span className="block text-3xl font-bold text-white/90 md:text-4xl lg:text-5xl">
              com a <span className="text-guata-teal-light hero-text-shadow">Guatá</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-xl text-lg font-medium text-white/90 md:text-xl">
            Os melhores destinos com atendimento personalizado
            <br className="hidden md:block" />
            <span className="inline-flex items-center gap-1.5">
              + Suporte no <MessageCircle className="inline h-4 w-4 text-green-400" /> WhatsApp
            </span>
          </p>
        </div>

        {/* Simplified search bar */}
        <form
          onSubmit={handleSearch}
          className="mt-10 w-full max-w-2xl animate-slide-up rounded-2xl bg-card/95 p-3 shadow-2xl backdrop-blur-sm md:p-4"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Para onde você quer ir?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 pl-10 text-base md:text-lg"
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
          className="mt-6 flex flex-wrap items-center justify-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.35s' }}
        >
          <Button
            size="lg"
            className="h-12 rounded-full px-8 text-base font-semibold shadow-lg"
            onClick={() => navigate('/experiencias')}
          >
            Ver Experiências
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>

          {whatsappUrl && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5 text-green-400" />
                Falar no WhatsApp
              </a>
            </Button>
          )}
        </div>

        {/* Social proof avatars */}
        <div
          className="mt-8 flex items-center justify-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="flex -space-x-2">
            {['MR', 'AS', 'JC', 'LP'].map((initials, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-white/50">
                <AvatarFallback className="bg-primary/80 text-[10px] font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-sm text-white/80">
            <span className="font-semibold text-white">+500</span> viajantes confiam na Guatá
          </p>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useEmblaCarousel from 'embla-carousel-react';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';

export function HeroSection() {
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState('');
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

  // Parse slides from setting
  const slides: Slide[] = (() => {
    if (!heroSetting) return [{ type: 'image' as const, url: DEFAULT_IMAGE }];
    const val = heroSetting as unknown;
    if (typeof val === 'object' && val !== null && 'slides' in val) {
      const s = (val as { slides: Slide[] }).slides;
      return s?.length ? s : [{ type: 'image' as const, url: DEFAULT_IMAGE }];
    }
    // Legacy string
    const url = typeof val === 'string' ? val.replace(/^"|"$/g, '') : DEFAULT_IMAGE;
    return [{ type: 'image' as const, url: url || DEFAULT_IMAGE }];
  })();

  const hasMultipleSlides = slides.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Auto-play carousel
  useEffect(() => {
    if (!emblaApi || !hasMultipleSlides) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi, hasMultipleSlides]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destino', destination);
    if (travelDate) params.set('data', travelDate);
    if (travelers) params.set('viajantes', travelers);
    navigate(`/experiencias?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background carousel */}
      {hasMultipleSlides ? (
        <div className="absolute inset-0" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={i} className="relative min-w-0 flex-[0_0_100%]">
                {slide.type === 'video' ? (
                  <video
                    src={slide.url}
                    className="h-full w-full object-cover"
                    autoPlay muted loop playsInline
                  />
                ) : (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.url})` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0">
          {slides[0]?.type === 'video' ? (
            <video
              src={slides[0].url}
              className="h-full w-full object-cover"
              autoPlay muted loop playsInline
            />
          ) : (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slides[0]?.url || DEFAULT_IMAGE})` }}
            />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

      {/* Content */}
      <div className="container relative mx-auto flex min-h-[90vh] flex-col items-center justify-center px-4 py-20 text-center lg:px-8">
        <div className="animate-fade-in space-y-6">
          <p className="text-sm font-medium uppercase tracking-widest text-white">
            Bem-vindo à Guatá Travel Experience
          </p>
          
          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
            Descubra o Mundo com
            <span className="block text-guata-teal-light hero-text-shadow">Experiências Únicas</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
            Curadoria turística personalizada para viajantes que buscam 
            momentos inesquecíveis. Do Brasil ao mundo, sua próxima 
            aventura começa aqui.
          </p>
        </div>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch}
          className="mt-12 w-full max-w-4xl animate-slide-up rounded-2xl bg-card/95 p-4 shadow-xl backdrop-blur-sm md:p-6"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Para onde você quer ir?
              </label>
              <Input
                type="text"
                placeholder="Digite um destino..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            
            <div className="hidden flex-1 space-y-2 md:block">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Quando?
              </label>
              <Input
                type="text"
                placeholder="Escolha as datas"
                className="h-12 text-base"
              />
            </div>
            
            <div className="hidden flex-1 space-y-2 lg:block">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Viajantes
              </label>
              <Input
                type="text"
                placeholder="Quantas pessoas?"
                className="h-12 text-base"
              />
            </div>
            
            <Button type="submit" size="lg" className="h-12 px-8">
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </Button>
          </div>
        </form>

        {/* Quick Links */}
        <div 
          className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="text-sm text-white/70">Destinos populares:</span>
          {['Fernando de Noronha', 'Jalapão', 'Chapada Diamantina', 'Lençóis Maranhenses'].map((dest) => (
            <Button
              key={dest}
              variant="outline"
              size="sm"
              className="rounded-full bg-card/50 backdrop-blur-sm"
              onClick={() => navigate(`/experiencias?destino=${encodeURIComponent(dest)}`)}
            >
              {dest}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

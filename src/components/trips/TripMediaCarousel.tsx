import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TripMediaItem } from '@/lib/completedTripMedia';

interface TripMediaCarouselProps {
  items: TripMediaItem[];
  title: string;
}

export function TripMediaCarousel({ items, title }: TripMediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: items.length > 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg border bg-muted/20" ref={emblaRef}>
        <div className="flex">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 flex-[0_0_100%]">
              {item.type === 'video' ? (
                <video src={item.url} controls className="max-h-[420px] w-full bg-black object-contain" />
              ) : (
                <img
                  src={item.url}
                  alt={title}
                  className="max-h-[420px] w-full object-contain bg-black/5"
                  style={{ objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 50}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mt-3 flex justify-center gap-1.5">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir para mídia ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

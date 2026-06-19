import { useCallback, useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface ImageGalleryCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectClassName?: string;
  imagePosition?: string;
}

export default function ImageGalleryCarousel({
  images,
  alt,
  className,
  aspectClassName = 'aspect-[16/9]',
  imagePosition = 'center center',
}: ImageGalleryCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api]);

  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={cn('w-full overflow-hidden', aspectClassName, className)}>
        <img
          src={images[0]}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: imagePosition }}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-0">
          {images.map((src, i) => (
            <CarouselItem key={`${src}-${i}`} className="pl-0">
              <div className={cn('w-full overflow-hidden', aspectClassName)}>
                <img
                  src={src}
                  alt={`${alt} — foto ${i + 1}`}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: imagePosition }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Foto ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              current === i ? 'w-5 bg-guata-gold' : 'bg-white/70',
            )}
          />
        ))}
      </div>
    </div>
  );
}

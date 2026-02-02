import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ExperienceGalleryProps {
  images: string[];
  title: string;
}

export function ExperienceGallery({ images, title }: ExperienceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg"
          >
            <img
              src={image}
              alt={`${title} - Imagem ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-12 top-0 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {selectedIndex !== null && (
              <img
                src={images[selectedIndex]}
                alt={`${title} - Imagem ${selectedIndex + 1}`}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            )}

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <div className="mt-4 text-center text-sm text-white">
              {selectedIndex !== null && `${selectedIndex + 1} / ${images.length}`}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

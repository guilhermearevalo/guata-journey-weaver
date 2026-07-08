import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Film,
  GripVertical,
  Loader2,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  createMediaId,
  ensureSingleCover,
  getCoverMedia,
  type TripMediaItem,
} from '@/lib/completedTripMedia';
import { cn } from '@/lib/utils';

interface TripMediaEditorProps {
  items: TripMediaItem[];
  onChange: (items: TripMediaItem[]) => void;
  onUpload: (file: File, prefix: string) => Promise<string | null>;
  uploading: boolean;
}

export function TripMediaEditor({ items, onChange, onUpload, uploading }: TripMediaEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const cover = getCoverMedia(items);

  const updateItems = (next: TripMediaItem[]) => {
    onChange(ensureSingleCover(next));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateItems(next);
  };

  const setCover = (id: string) => {
    updateItems(
      items.map((item) => ({
        ...item,
        is_cover: item.id === id && item.type === 'image',
      })),
    );
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((item) => item.id !== id));
  };

  const updateFocal = (id: string, axis: 'focal_x' | 'focal_y', value: number) => {
    updateItems(
      items.map((item) => (item.id === id ? { ...item, [axis]: value } : item)),
    );
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUpload(file, 'trip-media');
    if (!url) return;
    const isFirstImage = !items.some((item) => item.type === 'image');
    updateItems([
      ...items,
      {
        id: createMediaId(),
        type: 'image',
        url,
        is_cover: isFirstImage,
        focal_x: 50,
        focal_y: 50,
      },
    ]);
    e.target.value = '';
  };

  const addVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) return;
    const url = await onUpload(file, 'trip-video');
    if (!url) return;
    updateItems([
      ...items,
      {
        id: createMediaId(),
        type: 'video',
        url,
        is_cover: false,
      },
    ]);
    e.target.value = '';
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    updateItems(next);
    setDragIndex(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Mídia da viagem</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Arraste para ordenar. Marque a capa do card. Ajuste o enquadramento na foto de capa.
        </p>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={cn(
                'rounded-lg border bg-card p-3',
                item.is_cover && item.type === 'image' && 'border-primary ring-1 ring-primary/20',
              )}
            >
              <div className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center gap-1 pt-1 text-muted-foreground">
                  <GripVertical className="h-4 w-4 cursor-grab" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative shrink-0 overflow-hidden rounded-md border">
                  {item.type === 'video' ? (
                    <video src={item.url} className="h-24 w-36 object-cover" muted />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      className="h-24 w-36 object-cover"
                      style={{
                        objectPosition: `${item.focal_x ?? 50}% ${item.focal_y ?? 50}%`,
                      }}
                    />
                  )}
                  <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                    {item.type === 'video' ? 'Vídeo' : 'Foto'}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {item.type === 'image' && (
                      <Button
                        type="button"
                        size="sm"
                        variant={item.is_cover ? 'default' : 'outline'}
                        onClick={() => setCover(item.id)}
                      >
                        <Star className={cn('mr-1 h-3.5 w-3.5', item.is_cover && 'fill-current')} />
                        {item.is_cover ? 'Capa' : 'Usar como capa'}
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(item.id)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>

                  {item.type === 'image' && item.is_cover && (
                    <div className="space-y-3 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-medium">Enquadramento da capa no card</p>
                      <div>
                        <Label className="text-xs">Horizontal</Label>
                        <Slider
                          value={[item.focal_x ?? 50]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([value]) => updateFocal(item.id, 'focal_x', value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vertical</Label>
                        <Slider
                          value={[item.focal_y ?? 50]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={([value]) => updateFocal(item.id, 'focal_y', value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cover && (
        <div className="overflow-hidden rounded-lg border">
          <div
            className="h-32 w-full bg-cover"
            style={{
              backgroundImage: `url(${cover.url})`,
              backgroundPosition: `${cover.focal_x ?? 50}% ${cover.focal_y ?? 50}%`,
            }}
          />
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">Prévia da capa no site</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Label htmlFor="trip-media-image" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Adicionar foto
        </Label>
        <Input id="trip-media-image" type="file" accept="image/*" className="hidden" onChange={addImage} disabled={uploading} />

        <Label htmlFor="trip-media-video" className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          Adicionar vídeo
        </Label>
        <Input id="trip-media-video" type="file" accept="video/mp4,video/webm" className="hidden" onChange={addVideo} disabled={uploading} />
      </div>
    </div>
  );
}

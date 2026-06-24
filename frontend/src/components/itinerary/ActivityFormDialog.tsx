import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, X, Upload, Loader2, Crop } from 'lucide-react';
import { uploadStorageFile } from '@/lib/uploadStorageFile';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from './ImageCropper';
import { type Activity, MAX_ACTIVITY_IMAGES, normalizeActivityImages, getActivityImages } from '@/lib/itinerary';

const FOCUS_POINTS: { label: string; value: string }[] = [
  { label: '↖', value: 'left top' },
  { label: '↑', value: 'center top' },
  { label: '↗', value: 'right top' },
  { label: '←', value: 'left center' },
  { label: '●', value: 'center center' },
  { label: '→', value: 'right center' },
  { label: '↙', value: 'left bottom' },
  { label: '↓', value: 'center bottom' },
  { label: '↘', value: 'right bottom' },
];

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (activity: Activity) => void;
  initialData?: Activity | null;
}

const categories = [
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'natureza', label: 'Natureza' },
  { value: 'compras', label: 'Compras' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'hospedagem', label: 'Hospedagem' },
];

const timeSlots = [
  { value: 'manhã', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

export default function ActivityFormDialog({ open, onOpenChange, onSave, initialData }: ActivityFormDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cultura');
  const [timeSlot, setTimeSlot] = useState('manhã');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState('center center');
  const [mapsUrl, setMapsUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSource, setCropSource] = useState('');
  const [cropTargetIndex, setCropTargetIndex] = useState<number | null>(null);

  const uploadBlob = async (blob: Blob, replaceIndex?: number) => {
    setUploading(true);
    try {
      const fileName = `activity-${Date.now()}.jpg`;
      const { publicUrl } = await uploadStorageFile('site-assets', fileName, blob, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      setImageUrls(prev => {
        if (replaceIndex != null && replaceIndex >= 0 && replaceIndex < prev.length) {
          const next = [...prev];
          next[replaceIndex] = publicUrl;
          return next;
        }
        if (prev.length >= MAX_ACTIVITY_IMAGES) return prev;
        return [...prev, publicUrl];
      });
      toast({ title: 'Imagem enviada!' });
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
      return;
    }
    if (imageUrls.length >= MAX_ACTIVITY_IMAGES) {
      toast({ title: 'Limite de fotos', description: `Máximo ${MAX_ACTIVITY_IMAGES} fotos por atividade.`, variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(reader.result as string);
      setCropTargetIndex(null);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = '';
  };

  const openCropForIndex = (index: number) => {
    if (!imageUrls[index]) return;
    setCropSource(imageUrls[index]);
    setCropTargetIndex(index);
    setCropperOpen(true);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setTimeSlot(initialData.time_slot);
      setEstimatedCost(String(initialData.estimated_cost || 0));
      setImageUrls(getActivityImages(initialData));
      setImagePosition(initialData.image_position || 'center center');
      setMapsUrl(initialData.maps_url || '');
    } else {
      setName('');
      setDescription('');
      setCategory('cultura');
      setTimeSlot('manhã');
      setEstimatedCost('0');
      setImageUrls([]);
      setImagePosition('center center');
      setMapsUrl('');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    const base: Activity = {
      name: name.trim(),
      description: description.trim(),
      category,
      time_slot: timeSlot,
      estimated_cost: parseFloat(estimatedCost) || 0,
      is_suggestion: false,
      maps_url: mapsUrl.trim() || undefined,
    };
    onSave(normalizeActivityImages({
      ...base,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      image_position: imageUrls.length > 0 ? imagePosition : undefined,
    }));
    onOpenChange(false);
  };

  const handleCropComplete = (blob: Blob) => {
    void uploadBlob(blob, cropTargetIndex ?? undefined);
    setCropTargetIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="act-name">Nome</Label>
            <Input id="act-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Visita ao Pelourinho" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-desc">Descrição</Label>
            <Textarea id="act-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da atividade..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-cost">Custo Estimado (R$)</Label>
            <Input id="act-cost" type="number" min="0" step="0.01" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="act-maps">Rota no Google Maps</Label>
            <Input id="act-maps" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." />
          </div>

          <div className="space-y-2">
            <Label>Fotos da atividade ({imageUrls.length}/{MAX_ACTIVITY_IMAGES})</Label>
            <div className="flex flex-wrap gap-2">
              <Label
                htmlFor="act-image-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Adicionar foto
              </Label>
              <Input id="act-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading || imageUrls.length >= MAX_ACTIVITY_IMAGES} />
            </div>
            {imageUrls.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover" style={{ objectPosition: imagePosition }} />
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        {i === 0 && (
                          <Button type="button" variant="secondary" size="icon" className="h-7 w-7" onClick={() => openCropForIndex(0)}>
                            <Crop className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeImage(i)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">Capa</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Foco da foto de capa</p>
                  <div className="grid w-24 grid-cols-3 gap-1">
                    {FOCUS_POINTS.map((fp) => (
                      <button
                        key={fp.value}
                        type="button"
                        onClick={() => setImagePosition(fp.value)}
                        className={`flex h-7 items-center justify-center rounded border text-xs transition-colors ${
                          imagePosition === fp.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:bg-accent'
                        }`}
                      >
                        {fp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ImagePlus className="h-3 w-3" /> Adicione até {MAX_ACTIVITY_IMAGES} fotos para o carrossel no roteiro do cliente
              </p>
            )}
          </div>
        </div>
        <ImageCropper open={cropperOpen} onOpenChange={setCropperOpen} image={cropSource} onCropComplete={handleCropComplete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { Activity };

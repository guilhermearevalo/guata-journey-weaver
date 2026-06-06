import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, X, Upload, Loader2, Crop } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageCropper from './ImageCropper';

interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
  is_suggestion?: boolean;
  image_url?: string;
  image_position?: string;
  maps_url?: string;
}

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
  const [imageUrl, setImageUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `activity-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
      toast({ title: 'Imagem enviada!' });
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setTimeSlot(initialData.time_slot);
      setEstimatedCost(String(initialData.estimated_cost || 0));
      setImageUrl(initialData.image_url || '');
      setMapsUrl(initialData.maps_url || '');
    } else {
      setName('');
      setDescription('');
      setCategory('cultura');
      setTimeSlot('manhã');
      setEstimatedCost('0');
      setImageUrl('');
      setMapsUrl('');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      time_slot: timeSlot,
      estimated_cost: parseFloat(estimatedCost) || 0,
      is_suggestion: false,
      image_url: imageUrl.trim() || undefined,
      maps_url: mapsUrl.trim() || undefined,
    });
    onOpenChange(false);
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
            <Textarea id="act-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da atividade, recomendações, horários e observações para o cliente..." rows={4} />
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
            <Input
              id="act-maps"
              value={mapsUrl}
              onChange={e => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground">Cole o link da localização ou rota para aparecer no roteiro do cliente.</p>
          </div>
          {/* Image */}
          <div className="space-y-2">
            <Label htmlFor="act-image">Imagem da atividade</Label>
            <div className="flex gap-2">
              <Label
                htmlFor="act-image-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Enviando…' : 'Enviar imagem'}
              </Label>
              <Input id="act-image-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              {imageUrl && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setImageUrl('')} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              id="act-image"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="ou cole uma URL: https://..."
            />
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-muted h-32">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ImagePlus className="h-3 w-3" /> Envie uma foto ou cole uma URL para ilustrar a atividade
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

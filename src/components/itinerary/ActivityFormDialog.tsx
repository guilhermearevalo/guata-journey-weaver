import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
  is_suggestion?: boolean;
}

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cultura');
  const [timeSlot, setTimeSlot] = useState('manhã');
  const [estimatedCost, setEstimatedCost] = useState('0');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setTimeSlot(initialData.time_slot);
      setEstimatedCost(String(initialData.estimated_cost || 0));
    } else {
      setName('');
      setDescription('');
      setCategory('cultura');
      setTimeSlot('manhã');
      setEstimatedCost('0');
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
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            <Textarea id="act-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da atividade..." rows={2} />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

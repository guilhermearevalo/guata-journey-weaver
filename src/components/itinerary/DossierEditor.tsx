import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plane, Hotel, Car, FileText, Luggage, ShieldCheck, Banknote, Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import type { Dossier } from '@/lib/dossier';

interface DossierEditorProps {
  dossier: Dossier;
  onChange: (next: Dossier) => void;
}

const textSections: { key: keyof Dossier; label: string; icon: React.ElementType; placeholder: string }[] = [
  { key: 'accommodation', label: 'Hospedagem', icon: Hotel, placeholder: 'Hotel, endereço, datas de check-in/check-out, observações...' },
  { key: 'transfer', label: 'Transfer', icon: Car, placeholder: 'Trechos inclusos, horários, instruções...' },
  { key: 'documentation', label: 'Documentações', icon: FileText, placeholder: 'Passaporte, vistos, comprovantes exigidos...' },
  { key: 'baggage', label: 'Bagagem', icon: Luggage, placeholder: 'Regras de bagagem de mão e despachada, dimensões e peso...' },
  { key: 'insurance', label: 'Seguro viagem', icon: ShieldCheck, placeholder: 'Cobertura, telefone de emergência, observações...' },
  { key: 'exchange', label: 'Comunicação e câmbio', icon: Banknote, placeholder: 'Chip internacional, cartões recomendados, dicas de câmbio...' },
];

export default function DossierEditor({ dossier, onChange }: DossierEditorProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof Dossier, value: string) => {
    onChange({ ...dossier, [key]: value || undefined });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Selecione uma imagem', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      onChange({ ...dossier, cover_image: data.publicUrl });
      toast({ title: 'Capa enviada!' });
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle className="text-lg">Seções do roteiro (opcionais)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha somente o que precisar. Seções vazias não aparecem para o cliente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capa */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Imagem de capa</Label>
          <div className="flex gap-2">
            <Label htmlFor="cover-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Enviando…' : 'Enviar capa'}
            </Label>
            <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
            {dossier.cover_image && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange({ ...dossier, cover_image: undefined })} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input value={dossier.cover_image || ''} onChange={(e) => set('cover_image', e.target.value)} placeholder="ou cole uma URL: https://..." />
          {dossier.cover_image && (
            <div className="relative h-32 overflow-hidden rounded-lg border bg-muted">
              <img src={dossier.cover_image} alt="Capa" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        <Accordion type="multiple" className="w-full">
          {/* Aéreo */}
          <AccordionItem value="flights">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2"><Plane className="h-4 w-4" /> Aéreo</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Voo de ida</Label>
                <Textarea value={dossier.flight_outbound || ''} onChange={(e) => set('flight_outbound', e.target.value)} rows={3} placeholder="Ex: Saída de Campo Grande às 09:00 • Conexão em Guarulhos • Chegada a Roma às 12:00" />
              </div>
              <div className="space-y-2">
                <Label>Voo interno</Label>
                <Textarea value={dossier.flight_internal || ''} onChange={(e) => set('flight_internal', e.target.value)} rows={2} placeholder="Trechos internos durante a viagem (se houver)" />
              </div>
              <div className="space-y-2">
                <Label>Voo de volta</Label>
                <Textarea value={dossier.flight_inbound || ''} onChange={(e) => set('flight_inbound', e.target.value)} rows={3} placeholder="Ex: Saída de Milão • Conexão em Guarulhos • Chegada a Campo Grande" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {textSections.map(({ key, label, icon: Icon, placeholder }) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <Textarea value={(dossier[key] as string) || ''} onChange={(e) => set(key, e.target.value)} rows={4} placeholder={placeholder} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

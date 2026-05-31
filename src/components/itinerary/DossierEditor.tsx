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

const textSections: { key: keyof Dossier; imageKey: keyof Dossier; label: string; icon: React.ElementType; placeholder: string }[] = [
  { key: 'accommodation', imageKey: 'accommodation_image', label: 'Hospedagem', icon: Hotel, placeholder: 'Hotel, endereço, datas de check-in/check-out, observações...' },
  { key: 'transfer', imageKey: 'transfer_image', label: 'Transfer', icon: Car, placeholder: 'Trechos inclusos, horários, instruções...' },
  { key: 'documentation', imageKey: 'documentation_image', label: 'Documentações', icon: FileText, placeholder: 'Passaporte, vistos, comprovantes exigidos...' },
  { key: 'baggage', imageKey: 'baggage_image', label: 'Bagagem', icon: Luggage, placeholder: 'Regras de bagagem de mão e despachada, dimensões e peso...' },
  { key: 'insurance', imageKey: 'insurance_image', label: 'Seguro viagem', icon: ShieldCheck, placeholder: 'Cobertura, telefone de emergência, observações...' },
  { key: 'exchange', imageKey: 'exchange_image', label: 'Comunicação e câmbio', icon: Banknote, placeholder: 'Chip internacional, cartões recomendados, dicas de câmbio...' },
];

export default function DossierEditor({ dossier, onChange }: DossierEditorProps) {
  const { toast } = useToast();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const set = (key: keyof Dossier, value: string) => {
    onChange({ ...dossier, [key]: value || undefined });
  };

  const uploadImage = async (key: keyof Dossier, file: File, prefix: string) => {
    if (!file.type.startsWith('image/')) { toast({ title: 'Selecione uma imagem', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' }); return; }
    setUploadingKey(key as string);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      onChange({ ...dossier, [key]: data.publicUrl });
      toast({ title: 'Imagem enviada!' });
    } catch {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadImage('cover_image', file, 'cover');
    e.target.value = '';
  };

  // Sub-componente: campo de upload de imagem por seção
  const SectionImage = ({ imageKey, prefix }: { imageKey: keyof Dossier; prefix: string }) => {
    const url = dossier[imageKey] as string | undefined;
    const inputId = `img-${String(imageKey)}`;
    const isUploading = uploadingKey === imageKey;
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Imagem da seção (opcional)</Label>
        <div className="flex gap-2">
          <Label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Enviando…' : 'Enviar imagem'}
          </Label>
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadImage(imageKey, f, prefix); e.target.value = ''; }}
          />
          {url && (
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange({ ...dossier, [imageKey]: undefined })} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {url && (
          <div className="relative h-28 overflow-hidden rounded-lg border bg-muted">
            <img src={url} alt="Imagem da seção" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </div>
    );
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
            <Label htmlFor="cover-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
              {uploadingKey === 'cover_image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingKey === 'cover_image' ? 'Enviando…' : 'Enviar capa'}
            </Label>
            <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingKey === 'cover_image'} />
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
              <SectionImage imageKey="flight_image" prefix="flight" />
            </AccordionContent>
          </AccordionItem>

          {textSections.map(({ key, imageKey, label, icon: Icon, placeholder }) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <Textarea value={(dossier[key] as string) || ''} onChange={(e) => set(key, e.target.value)} rows={4} placeholder={placeholder} />
                <SectionImage imageKey={imageKey} prefix={String(key)} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

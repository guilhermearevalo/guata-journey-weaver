import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, FolderOpen, Trash2, Loader2 } from 'lucide-react';

interface ItineraryDay {
  day: number;
  activities: {
    name: string;
    description: string;
    category: string;
    estimated_cost: number;
    time_slot: string;
    is_suggestion?: boolean;
    image_url?: string;
  }[];
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'save' | 'load';
  currentItinerary: ItineraryDay[];
  destination?: string;
  totalDays?: number;
  onLoadTemplate: (itinerary: ItineraryDay[]) => void;
}

export default function TemplateDialog({
  open,
  onOpenChange,
  mode,
  currentItinerary,
  destination,
  totalDays,
  onLoadTemplate,
}: TemplateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [templateName, setTemplateName] = useState('');

  // Get user's agency_id
  const { data: agencyData } = useQuery({
    queryKey: ['user-agency', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_users')
        .select('agency_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const agencyId = agencyData?.agency_id;

  const { data: templates, isLoading } = useQuery({
    queryKey: ['itinerary-templates', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itinerary_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && mode === 'load',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!templateName.trim()) throw new Error('Nome obrigatório');
      const { error } = await supabase.from('itinerary_templates').insert({
        name: templateName.trim(),
        destination: destination || null,
        duration_days: totalDays || null,
        itinerary: JSON.parse(JSON.stringify(currentItinerary)),
        created_by: user?.id,
        agency_id: agencyId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-templates'] });
      toast({ title: 'Template salvo com sucesso!' });
      setTemplateName('');
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Erro ao salvar template', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('itinerary_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-templates'] });
      toast({ title: 'Template removido' });
    },
  });

  const handleLoad = (itinerary: unknown) => {
    const days = itinerary as ItineraryDay[];
    onLoadTemplate(days);
    onOpenChange(false);
    toast({ title: 'Template aplicado!', description: 'O roteiro foi carregado. Ajuste conforme necessário.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'save' ? 'Salvar como Template' : 'Carregar Template'}</DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Salve este roteiro como modelo reutilizável para futuras propostas.'
              : 'Selecione um template para aplicar nesta proposta.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={`Ex: ${destination || 'Destino'} ${totalDays || ''}d`}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              O roteiro atual ({currentItinerary.length} dia(s),{' '}
              {currentItinerary.reduce((s, d) => s + d.activities.length, 0)} atividades) será salvo.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!templateName.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Template
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : templates && templates.length > 0 ? (
              templates.map((t) => {
                const days = Array.isArray(t.itinerary) ? (t.itinerary as unknown as ItineraryDay[]) : [];
                const totalActs = days.reduce((s, d) => s + (d.activities?.length || 0), 0);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.destination && `${t.destination} • `}
                        {days.length} dia(s) • {totalActs} atividades
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button size="sm" variant="outline" onClick={() => handleLoad(t.itinerary)}>
                        <FolderOpen className="mr-1 h-3 w-3" />
                        Usar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(t.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum template salvo ainda.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

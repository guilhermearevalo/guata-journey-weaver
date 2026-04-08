import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, Loader2, Plus, Trash2, DollarSign, Printer, Share2, Check, Copy, Pencil, ChevronUp, ChevronDown, Save, FolderOpen } from 'lucide-react';
import ActivityFormDialog from './ActivityFormDialog';
import DocumentsChecklist from './DocumentsChecklist';
import TemplateDialog from './TemplateDialog';

interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
  is_suggestion?: boolean;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
}

interface DocumentItem {
  name: string;
  checked: boolean;
  notes?: string;
}

const categoryColors: Record<string, string> = {
  gastronomia: 'bg-orange-500/10 text-orange-600',
  cultura: 'bg-purple-500/10 text-purple-600',
  aventura: 'bg-red-500/10 text-red-600',
  natureza: 'bg-green-500/10 text-green-600',
  compras: 'bg-pink-500/10 text-pink-600',
  transporte: 'bg-blue-500/10 text-blue-600',
  hospedagem: 'bg-cyan-500/10 text-cyan-600',
};

const timeSlotOrder = ['manhã', 'tarde', 'noite'];

interface ItineraryPlannerProps {
  backLink: string;
  backLabel?: string;
}

export default function ItineraryPlanner({ backLink, backLabel = 'Voltar' }: ItineraryPlannerProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generatingDay, setGeneratingDay] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Activity form state
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingDayIdx, setEditingDayIdx] = useState<number>(0);
  const [editingActIdx, setEditingActIdx] = useState<number | null>(null);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal-itinerary', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, travel_requests!inner(destination, travel_dates, travelers_count, preferences)')
        .eq('request_id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const request = proposal?.travel_requests as unknown as {
    destination: string;
    travel_dates: { start?: string; end?: string } | null;
    travelers_count: number;
    preferences: Record<string, unknown> | null;
  } | null;

  const itinerary: ItineraryDay[] = Array.isArray(proposal?.itinerary)
    ? (proposal.itinerary as unknown as ItineraryDay[])
    : [];

  const documentsChecklist: DocumentItem[] = Array.isArray((proposal as any)?.documents_checklist)
    ? ((proposal as any).documents_checklist as DocumentItem[])
    : [];

  const travelDates = request?.travel_dates;
  const totalDays = travelDates?.start && travelDates?.end
    ? Math.max(1, Math.ceil((new Date(travelDates.end).getTime() - new Date(travelDates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : itinerary.length || 3;

  const saveItinerary = useMutation({
    mutationFn: async (newItinerary: ItineraryDay[]) => {
      if (!proposal?.id) throw new Error('Sem proposta');
      const { error } = await supabase
        .from('proposals')
        .update({ itinerary: JSON.parse(JSON.stringify(newItinerary)) })
        .eq('id', proposal.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposal-itinerary', id] }),
  });

  const saveDocuments = useMutation({
    mutationFn: async (items: DocumentItem[]) => {
      if (!proposal?.id) throw new Error('Sem proposta');
      const { error } = await supabase
        .from('proposals')
        .update({ documents_checklist: JSON.parse(JSON.stringify(items)) } as any)
        .eq('id', proposal.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposal-itinerary', id] }),
  });

  const generateFullItinerary = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('itinerary-ai', {
        body: { destination: request?.destination || 'Brasil', days: totalDays, preferences: JSON.stringify(request?.preferences || {}), existing_activities: itinerary },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      const newDays = data?.days as ItineraryDay[] | undefined;
      if (newDays) {
        const merged = newDays.map(d => ({ ...d, activities: d.activities.map(a => ({ ...a, is_suggestion: true })) }));
        await saveItinerary.mutateAsync(merged);
        toast({ title: 'Roteiro gerado!', description: 'Revise as sugestões e aceite ou descarte.' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao gerar roteiro', description: 'Tente novamente.', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const suggestForDay = async (dayNum: number) => {
    setGeneratingDay(dayNum);
    try {
      const dayActivities = itinerary.find(d => d.day === dayNum)?.activities || [];
      const { data, error } = await supabase.functions.invoke('itinerary-ai', {
        body: { destination: request?.destination || 'Brasil', days: 1, day_number: dayNum, preferences: JSON.stringify(request?.preferences || {}), existing_activities: dayActivities },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      const suggestedDay = (data?.days as ItineraryDay[] | undefined)?.[0];
      if (suggestedDay) {
        const updated = [...itinerary];
        const existingIdx = updated.findIndex(d => d.day === dayNum);
        const newActivities = suggestedDay.activities.map(a => ({ ...a, is_suggestion: true }));
        if (existingIdx >= 0) { updated[existingIdx].activities.push(...newActivities); }
        else { updated.push({ day: dayNum, activities: newActivities }); }
        updated.sort((a, b) => a.day - b.day);
        await saveItinerary.mutateAsync(updated);
        toast({ title: 'Sugestões adicionadas!' });
      }
    } catch (err) { console.error(err); toast({ title: 'Erro', variant: 'destructive' }); }
    finally { setGeneratingDay(null); }
  };

  const acceptSuggestion = async (dayIdx: number, actIdx: number) => {
    const updated = [...itinerary];
    updated[dayIdx].activities[actIdx].is_suggestion = false;
    await saveItinerary.mutateAsync(updated);
  };

  const removeActivity = async (dayIdx: number, actIdx: number) => {
    const updated = [...itinerary];
    updated[dayIdx].activities.splice(actIdx, 1);
    await saveItinerary.mutateAsync(updated);
  };

  const openAddActivity = (dayIdx: number) => {
    setEditingActivity(null);
    setEditingDayIdx(dayIdx);
    setEditingActIdx(null);
    setActivityDialogOpen(true);
  };

  const openEditActivity = (dayIdx: number, actIdx: number, activity: Activity) => {
    setEditingActivity(activity);
    setEditingDayIdx(dayIdx);
    setEditingActIdx(actIdx);
    setActivityDialogOpen(true);
  };

  const handleSaveActivity = async (activity: Activity) => {
    const updated = [...itinerary];
    if (editingActIdx !== null) {
      // Edit existing
      updated[editingDayIdx].activities[editingActIdx] = activity;
    } else {
      // Add new
      updated[editingDayIdx].activities.push(activity);
    }
    await saveItinerary.mutateAsync(updated);
    toast({ title: editingActIdx !== null ? 'Atividade atualizada!' : 'Atividade adicionada!' });
  };

  const moveActivity = async (dayIdx: number, actIdx: number, direction: 'up' | 'down') => {
    const updated = [...itinerary];
    const activities = [...updated[dayIdx].activities];
    const newIdx = direction === 'up' ? actIdx - 1 : actIdx + 1;
    if (newIdx < 0 || newIdx >= activities.length) return;
    [activities[actIdx], activities[newIdx]] = [activities[newIdx], activities[actIdx]];
    updated[dayIdx] = { ...updated[dayIdx], activities };
    await saveItinerary.mutateAsync(updated);
  };

  const moveActivityToPosition = async (dayIdx: number, fromIdx: number, toIdx: number) => {
    const updated = [...itinerary];
    const activities = [...updated[dayIdx].activities];
    if (toIdx < 0 || toIdx >= activities.length || fromIdx === toIdx) return;
    const [item] = activities.splice(fromIdx, 1);
    activities.splice(toIdx, 0, item);
    updated[dayIdx] = { ...updated[dayIdx], activities };
    await saveItinerary.mutateAsync(updated);
  };

  const addEmptyDay = async () => {
    const nextDay = itinerary.length > 0 ? Math.max(...itinerary.map(d => d.day)) + 1 : 1;
    await saveItinerary.mutateAsync([...itinerary, { day: nextDay, activities: [] }]);
  };

  const generateShareLink = async () => {
    if (!proposal?.id) return;
    setSharing(true);
    try {
      let token = proposal.share_token as string | null;
      if (!token) {
        token = crypto.randomUUID();
        const { error } = await supabase
          .from('proposals')
          .update({ share_token: token } as any)
          .eq('id', proposal.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['proposal-itinerary', id] });
      }
      const url = `${window.location.origin}/roteiro/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado!', description: 'Envie para quem quiser visualizar o roteiro.' });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao gerar link', variant: 'destructive' });
    } finally { setSharing(false); }
  };

  const totalCost = itinerary.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0), 0);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">Nenhuma proposta encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">Crie uma proposta primeiro para planejar o roteiro.</p>
        <Button className="mt-4" asChild><Link to={backLink}>{backLabel}</Link></Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="icon" asChild><Link to={backLink}><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Planejador de Roteiro</h2>
          <p className="text-muted-foreground">{request?.destination || 'Destino'} • {totalDays} dia(s)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-base px-3 py-1"><DollarSign className="mr-1 h-4 w-4" />R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={generateShareLink} disabled={sharing || itinerary.length === 0}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
            {copied ? 'Copiado!' : 'Compartilhar'}
          </Button>
          <Button onClick={generateFullItinerary} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {itinerary.length > 0 ? 'Regenerar com IA' : 'Gerar Roteiro com IA'}
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block space-y-1 mb-6">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Roteiro de Viagem • Guata Viagens</p>
        <h2 className="text-3xl font-bold">{request?.destination || 'Destino'}</h2>
        <p className="text-muted-foreground">{totalDays} dia(s) • Custo estimado: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {itinerary.length > 0 && <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />}
        <div className="space-y-6">
          {itinerary.map((day, dayIdx) => {
            const dayCost = day.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0);
            const displayActivities = day.activities;
            return (
              <div key={day.day} className="relative pl-16">
                <div className="absolute left-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{day.day}</div>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dia {day.day}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">R$ {dayCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <Button variant="ghost" size="sm" className="print:hidden" onClick={() => openAddActivity(dayIdx)}>
                          <Plus className="h-4 w-4" />
                          <span className="ml-1 hidden sm:inline">Adicionar</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="print:hidden" onClick={() => suggestForDay(day.day)} disabled={generatingDay === day.day}>
                          {generatingDay === day.day ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          <span className="ml-1 hidden sm:inline">Sugerir mais</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {displayActivities.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade. Clique em "Adicionar" ou "Sugerir mais".</p>}
                    {displayActivities.map((activity, actIdx) => {
                      return (
                        <div key={actIdx} className={`rounded-lg border p-3 space-y-1 transition-colors ${activity.is_suggestion ? 'border-dashed border-primary/50 bg-primary/5' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              {/* Position badge with popover */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer print:hidden" title="Clique para mover">
                                    {actIdx + 1}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 p-3" side="right">
                                  <p className="text-xs text-muted-foreground mb-2">Mover para posição:</p>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = (e.target as HTMLFormElement).elements.namedItem('pos') as HTMLInputElement;
                                    const newPos = parseInt(input.value, 10) - 1;
                                    if (!isNaN(newPos)) moveActivityToPosition(dayIdx, actIdx, newPos);
                                  }}>
                                    <div className="flex gap-2">
                                      <Input name="pos" type="number" min={1} max={displayActivities.length} defaultValue={actIdx + 1} className="h-8 text-sm" />
                                      <Button type="submit" size="sm" className="h-8 px-3">Ir</Button>
                                    </div>
                                  </form>
                                </PopoverContent>
                              </Popover>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{activity.name}</span>
                                  <Badge variant="outline" className="text-xs">{activity.time_slot}</Badge>
                                  <Badge className={`text-xs ${categoryColors[activity.category] || 'bg-muted text-muted-foreground'}`}>{activity.category}</Badge>
                                  {activity.is_suggestion && <Badge className="bg-primary/10 text-primary text-xs print:hidden"><Sparkles className="mr-1 h-3 w-3" />Sugestão IA</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-sm font-medium">R$ {(activity.estimated_cost || 0).toLocaleString('pt-BR')}</span>
                              {activity.is_suggestion && <Button variant="ghost" size="sm" className="h-7 text-xs text-primary print:hidden" onClick={() => acceptSuggestion(dayIdx, actIdx)}>Aceitar</Button>}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground print:hidden" onClick={() => moveActivity(dayIdx, actIdx, 'up')} disabled={actIdx === 0}>
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mover para cima</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground print:hidden" onClick={() => moveActivity(dayIdx, actIdx, 'down')} disabled={actIdx === displayActivities.length - 1}>
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mover para baixo</TooltipContent>
                              </Tooltip>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground print:hidden" onClick={() => openEditActivity(dayIdx, actIdx, activity)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive print:hidden" onClick={() => removeActivity(dayIdx, actIdx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        <div className="pl-16 pt-4 print:hidden">
          <Button variant="outline" onClick={addEmptyDay}><Plus className="mr-2 h-4 w-4" />Adicionar Dia</Button>
        </div>
      </div>

      {itinerary.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Monte seu roteiro</h3>
            <p className="mt-1 mb-4 text-sm text-muted-foreground text-center max-w-md">
              Escolha como deseja começar:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={addEmptyDay} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Dia Manualmente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Checklist */}
      <DocumentsChecklist
        items={documentsChecklist}
        onChange={(items) => saveDocuments.mutate(items)}
      />

      {/* Activity Form Dialog */}
      <ActivityFormDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        onSave={handleSaveActivity}
        initialData={editingActivity}
      />
    </div>
    </TooltipProvider>
  );
}

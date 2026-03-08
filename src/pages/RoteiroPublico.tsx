import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Printer, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DocumentsChecklist from '@/components/itinerary/DocumentsChecklist';
import { useState } from 'react';

interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
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

export default function RoteiroPublico() {
  const { token } = useParams<{ token: string }>();
  const [codeInput, setCodeInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ['public-itinerary', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, travel_requests!inner(destination, travel_dates, travelers_count)')
        .eq('share_token', token!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const request = proposal?.travel_requests as unknown as {
    destination: string;
    travel_dates: { start?: string; end?: string } | null;
    travelers_count: number;
  } | null;

  const itinerary: ItineraryDay[] = Array.isArray(proposal?.itinerary)
    ? (proposal.itinerary as unknown as ItineraryDay[])
    : [];

  const documentsChecklist = Array.isArray((proposal as any)?.documents_checklist)
    ? ((proposal as any).documents_checklist as { name: string; checked: boolean; notes?: string }[])
    : [];

  const travelDates = request?.travel_dates;
  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; }
  };

  const totalCost = itinerary.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0), 0);

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (!proposal || error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Roteiro não encontrado</h1>
        <p className="text-muted-foreground">Este link pode estar expirado ou inválido.</p>
      </div>
    </div>
  );

  const proposalAccessCode = (proposal as any).access_code as string | null;
  const needsCode = !!proposalAccessCode && !isUnlocked;

  const handleCodeSubmit = () => {
    if (codeInput.trim().toUpperCase() === proposalAccessCode?.toUpperCase()) {
      setIsUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  if (needsCode) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Roteiro Protegido</CardTitle>
          <p className="text-sm text-muted-foreground">Insira o código de acesso fornecido pela agência.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={codeInput}
            onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
            placeholder="Código de acesso"
            onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
            className={codeError ? 'border-destructive' : ''}
          />
          {codeError && <p className="text-xs text-destructive">Código incorreto. Tente novamente.</p>}
          <Button className="w-full" onClick={handleCodeSubmit} disabled={!codeInput.trim()}>
            Acessar Roteiro
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between print:flex-col print:gap-2">
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Roteiro de Viagem</p>
            <h1 className="text-3xl font-bold mt-1">{request?.destination || proposal.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {travelDates?.start && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(travelDates.start)} — {formatDate(travelDates.end)}</span>
              )}
              {request?.travelers_count && (
                <span>{request.travelers_count} viajante(s)</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="text-base px-3 py-1">
              <DollarSign className="mr-1 h-4 w-4" />
              R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Imprimir
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {itinerary.length > 0 && <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />}
          <div className="space-y-6">
            {itinerary.map((day) => {
              const dayCost = day.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0);
              const sorted = [...day.activities].sort((a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot));
              return (
                <div key={day.day} className="relative pl-16">
                  <div className="absolute left-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{day.day}</div>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Dia {day.day}</CardTitle>
                        <span className="text-sm text-muted-foreground">R$ {dayCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {sorted.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem atividades planejadas</p>}
                      {sorted.map((activity, actIdx) => (
                        <div key={actIdx} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{activity.name}</span>
                                <Badge variant="outline" className="text-xs">{activity.time_slot}</Badge>
                                <Badge className={`text-xs ${categoryColors[activity.category] || 'bg-muted text-muted-foreground'}`}>{activity.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                            </div>
                            <span className="text-sm font-medium shrink-0">R$ {(activity.estimated_cost || 0).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {itinerary.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Roteiro ainda em planejamento</p>
            <p className="text-sm mt-1">As atividades serão adicionadas em breve.</p>
          </div>
        )}

        {/* Documents Checklist */}
        {documentsChecklist.length > 0 && (
          <DocumentsChecklist items={documentsChecklist} onChange={() => {}} readOnly />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t print:block">
          <p>Roteiro gerado por <strong>Guata Viagens</strong></p>
        </div>
      </div>
    </div>
  );
}

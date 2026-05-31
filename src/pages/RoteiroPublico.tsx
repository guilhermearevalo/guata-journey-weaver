import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Printer, Lock, ExternalLink, Plane, Hotel, Car, FileText, Luggage, ShieldCheck, Banknote } from 'lucide-react';
import { parseDossier, hasAnyFlight, type Dossier } from '@/lib/dossier';
import { Input } from '@/components/ui/input';
import DocumentsChecklist from '@/components/itinerary/DocumentsChecklist';
import TravelDocumentsVault, { TravelDocument } from '@/components/itinerary/TravelDocumentsVault';
import { useState } from 'react';

interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
  image_url?: string;
  maps_url?: string;
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
        .select('id, request_id, title, itinerary, dossier, documents_checklist, share_token, share_enabled, agency_id, travel_requests!inner(destination, travel_dates, travelers_count)')
        .eq('share_token', token!)
        .maybeSingle();
      
      // Check if access code exists separately (don't expose the actual code)
      if (data) {
        const { data: codeCheck } = await supabase
          .from('proposals')
          .select('access_code')
          .eq('id', data.id)
          .maybeSingle();
        (data as any)._has_access_code = !!codeCheck?.access_code;
        if (data.agency_id) {
          const { data: branding } = await supabase
            .from('partner_agency_branding' as any)
            .select('name, logo_url, cover_image_url')
            .eq('id', data.agency_id)
            .maybeSingle();
          (data as any).agency_branding = branding;
        }
      }
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const { data: travelDocuments = [] } = useQuery({
    queryKey: ['public-travel-documents', proposal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_documents' as any)
        .select('*')
        .eq('proposal_id', proposal!.id)
        .eq('visible_in_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TravelDocument[];
    },
    enabled: !!proposal?.id,
  });

  const request = proposal?.travel_requests as unknown as {
    destination: string;
    travel_dates: { start?: string; end?: string } | null;
    travelers_count: number;
  } | null;

  const itinerary: ItineraryDay[] = Array.isArray(proposal?.itinerary)
    ? (proposal.itinerary as unknown as ItineraryDay[])
    : [];

  const dossier: Dossier = parseDossier((proposal as any)?.dossier);

  const legacyDocumentsChecklist = Array.isArray((proposal as any)?.documents_checklist)
    ? ((proposal as any).documents_checklist as { name: string; checked: boolean; notes?: string }[])
    : [];

  const travelDates = request?.travel_dates;
  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; }
  };

  const totalCost = itinerary.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0), 0);
  const agency = (proposal as any)?.agency_branding as { name?: string; logo_url?: string | null; cover_image_url?: string | null } | null;
  const firstActivityImage = itinerary.flatMap(day => day.activities).find(activity => activity.image_url)?.image_url;
  const coverImage = dossier.cover_image || agency?.cover_image_url || firstActivityImage;
  const brandName = agency?.name || 'Guatá Viagens';

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

  if ((proposal as any).share_enabled === false) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2 px-4">
        <h1 className="text-2xl font-bold">Roteiro indisponível</h1>
        <p className="text-muted-foreground">Este roteiro não está mais disponível para visualização.</p>
      </div>
    </div>
  );

  const hasAccessCode = (proposal as any)._has_access_code as boolean;
  const needsCode = hasAccessCode && !isUnlocked;

  const handleCodeSubmit = async () => {
    // Validate code on backend by querying with the code
    const { data } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', proposal!.id)
      .eq('access_code', codeInput.trim().toUpperCase())
      .maybeSingle();
    
    if (data) {
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
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 print:py-0">
        {/* Capa — estilo revista de viagem */}
        <div className="animate-fade-in relative overflow-hidden rounded-2xl border bg-background shadow-lg print:rounded-none print:border-0 print:shadow-none">
          {coverImage ? (
            <div className="relative h-72 w-full overflow-hidden sm:h-80 print:h-40">
              <img src={coverImage} alt={request?.destination || proposal.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <Button variant="secondary" size="sm" onClick={() => window.print()} className="absolute right-4 top-4 print:hidden">
                <Printer className="mr-2 h-4 w-4" />Imprimir
              </Button>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white print:text-foreground">
                <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-90">Roteiro de Viagem</p>
                <h1 className="font-display text-4xl font-bold mt-2 drop-shadow-md sm:text-5xl">{request?.destination || proposal.title}</h1>
                <div className="flex items-center gap-5 mt-3 text-sm flex-wrap opacity-95">
                  {travelDates?.start && (
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(travelDates.start)} — {formatDate(travelDates.end)}</span>
                  )}
                  {request?.travelers_count && (
                    <span className="flex items-center gap-1.5">{request.travelers_count} viajante(s)</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 bg-gradient-hero p-8 text-primary-foreground">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-90">Roteiro de Viagem</p>
                <h1 className="font-display text-4xl font-bold mt-2">{request?.destination || proposal.title}</h1>
                <div className="flex items-center gap-5 mt-3 text-sm flex-wrap opacity-95">
                  {travelDates?.start && (
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(travelDates.start)} — {formatDate(travelDates.end)}</span>
                  )}
                  {request?.travelers_count && (
                    <span>{request.travelers_count} viajante(s)</span>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => window.print()} className="print:hidden shrink-0">
                <Printer className="mr-2 h-4 w-4" />Imprimir
              </Button>
            </div>
          )}
        </div>

        {travelDocuments.length > 0 && (
          <TravelDocumentsVault
            proposalId={proposal.id}
            requestId={proposal.request_id}
            documents={travelDocuments}
            queryKey={['public-travel-documents', proposal.id]}
            mode="public"
            summaryOnly
          />
        )}

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
                  <Card className="overflow-hidden bg-background">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-primary">Dia {day.day}</p>
                          {dossier.day_titles?.[String(day.day)] && (
                            <CardTitle className="font-display text-xl mt-0.5">{dossier.day_titles[String(day.day)]}</CardTitle>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">R$ {dayCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sorted.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem atividades planejadas</p>}
                      {sorted.map((activity, actIdx) => (
                        <div key={actIdx} className="overflow-hidden rounded-lg border bg-card">
                          {activity.image_url && (
                            <div className="h-48 w-full overflow-hidden sm:h-56">
                              <img src={activity.image_url} alt={activity.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3 p-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-lg font-semibold">{activity.name}</span>
                                <Badge variant="outline" className="text-xs">{activity.time_slot}</Badge>
                                <Badge className={`text-xs ${categoryColors[activity.category] || 'bg-muted text-muted-foreground'}`}>{activity.category}</Badge>
                              </div>
                              {activity.description && (
                                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{activity.description}</p>
                              )}
                              {activity.maps_url && (
                                <Button variant="outline" size="sm" asChild className="print:hidden">
                                  <a href={activity.maps_url} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="mr-2 h-4 w-4" /> Rota até aqui <ExternalLink className="ml-2 h-3 w-3" />
                                  </a>
                                </Button>
                              )}
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

        {/* Seções do dossiê (opcionais) */}
        {hasAnyFlight(dossier) && (
          <Card className="overflow-hidden bg-background shadow-sm">
            {dossier.flight_image && (
              <div className="h-48 w-full overflow-hidden">
                <img src={dossier.flight_image} alt="Aéreo" className="h-full w-full object-cover" />
              </div>
            )}
            <CardHeader className="pb-3 border-b">
              <CardTitle className="font-display text-xl flex items-center gap-2"><Plane className="h-5 w-5 text-primary" />Aéreo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {dossier.flight_outbound && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Voo de ida</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.flight_outbound}</p>
                </div>
              )}
              {dossier.flight_internal && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Voo interno</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.flight_internal}</p>
                </div>
              )}
              {dossier.flight_inbound && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Voo de volta</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.flight_inbound}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {([
          { key: 'accommodation', imageKey: 'accommodation_image', label: 'Hospedagem', Icon: Hotel },
          { key: 'transfer', imageKey: 'transfer_image', label: 'Transfer', Icon: Car },
          { key: 'documentation', imageKey: 'documentation_image', label: 'Documentações', Icon: FileText },
          { key: 'baggage', imageKey: 'baggage_image', label: 'Bagagem', Icon: Luggage },
          { key: 'insurance', imageKey: 'insurance_image', label: 'Seguro viagem', Icon: ShieldCheck },
          { key: 'exchange', imageKey: 'exchange_image', label: 'Comunicação e câmbio', Icon: Banknote },
        ] as const).map(({ key, imageKey, label, Icon }) => {
          const value = dossier[key] as string | undefined;
          const image = dossier[imageKey] as string | undefined;
          if (!value && !image) return null;
          return (
            <Card key={key} className="overflow-hidden bg-background shadow-sm">
              {image && (
                <div className="h-48 w-full overflow-hidden">
                  <img src={image} alt={label} className="h-full w-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-3 border-b">
                <CardTitle className="font-display text-xl flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{label}</CardTitle>
              </CardHeader>
              {value && (
                <CardContent className="pt-4">
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{value}</p>
                </CardContent>
              )}
            </Card>
          );
        })}



        {/* Documents Checklist */}
        {travelDocuments.length > 0 && (
          <TravelDocumentsVault
            proposalId={proposal.id}
            requestId={proposal.request_id}
            documents={travelDocuments}
            queryKey={['public-travel-documents', proposal.id]}
            mode="public"
          />
        )}

        {legacyDocumentsChecklist.length > 0 && travelDocuments.length === 0 && (
          <DocumentsChecklist items={legacyDocumentsChecklist} onChange={() => {}} readOnly />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t print:block">
          {agency?.logo_url && <img src={agency.logo_url} alt={`Logo ${brandName}`} className="mx-auto mb-3 h-10 max-w-32 object-contain" />}
          <p>Roteiro preparado por <strong>{brandName}</strong></p>
        </div>
      </div>
    </div>
  );
}

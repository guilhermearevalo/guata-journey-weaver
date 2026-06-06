import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Printer, Lock, ExternalLink, Plane, Hotel, Car, FileText, Luggage, ShieldCheck, Banknote, Users, Clock, Sparkles } from 'lucide-react';
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
  image_position?: string;
  maps_url?: string;
}

interface ItineraryDay {
  day: number;
  activities: Activity[];
}

const categoryColors: Record<string, string> = {
  gastronomia: 'bg-orange-500/10 text-orange-700',
  cultura: 'bg-purple-500/10 text-purple-700',
  aventura: 'bg-red-500/10 text-red-700',
  natureza: 'bg-green-500/10 text-green-700',
  compras: 'bg-pink-500/10 text-pink-700',
  transporte: 'bg-blue-500/10 text-blue-700',
  hospedagem: 'bg-cyan-500/10 text-cyan-700',
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
      const { data, error } = await supabase.rpc('get_public_itinerary', { _token: token! });
      if (error) throw error;
      if (!data) return null;
      const result = data as Record<string, any>;
      result._has_access_code = !!result.has_access_code;
      if (result.agency_id) {
        const { data: branding } = await supabase
          .from('partner_agency_branding' as any)
          .select('name, logo_url, cover_image_url')
          .eq('id', result.agency_id)
          .maybeSingle();
        result.agency_branding = branding;
      }
      return result;
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

  const request = (proposal?.request ?? null) as {
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

  const agency = (proposal as any)?.agency_branding as { name?: string; logo_url?: string | null; cover_image_url?: string | null } | null;
  const firstActivityImage = itinerary.flatMap(day => day.activities).find(activity => activity.image_url)?.image_url;
  const coverImage = dossier.cover_image || agency?.cover_image_url || firstActivityImage;
  const brandName = agency?.name || 'Guatá Viagens';
  const totalActivities = itinerary.reduce((s, d) => s + d.activities.length, 0);

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
        <h1 className="font-display text-2xl font-bold">Roteiro não encontrado</h1>
        <p className="text-muted-foreground">Este link pode estar expirado ou inválido.</p>
      </div>
    </div>
  );

  if ((proposal as any).share_enabled === false) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2 px-4">
        <h1 className="font-display text-2xl font-bold">Roteiro indisponível</h1>
        <p className="text-muted-foreground">Este roteiro não está mais disponível para visualização.</p>
      </div>
    </div>
  );

  const hasAccessCode = (proposal as any)._has_access_code as boolean;
  const needsCode = hasAccessCode && !isUnlocked;

  const handleCodeSubmit = async () => {
    const { data, error: rpcError } = await supabase.rpc('verify_proposal_access_code', {
      _token: token!,
      _code: codeInput.trim(),
    });
    if (!rpcError && data === true) {
      setIsUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  if (needsCode) return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4 animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display">Roteiro Protegido</CardTitle>
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
      {/* ===== Capa imersiva — estilo revista ===== */}
      <header className="relative w-full overflow-hidden print:h-48">
        {coverImage ? (
          <div className="relative h-[70vh] min-h-[460px] w-full print:h-48">
            <img src={coverImage} alt={request?.destination || proposal.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-guata-brown/90 via-guata-teal/40 to-black/30" />
          </div>
        ) : (
          <div className="relative h-[60vh] min-h-[420px] w-full gradient-hero print:h-48" />
        )}

        <Button variant="secondary" size="sm" onClick={() => window.print()} className="absolute right-4 top-4 print:hidden">
          <Printer className="mr-2 h-4 w-4" />Imprimir
        </Button>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-4xl px-6 pb-10 text-primary-foreground animate-fade-in">
            {agency?.logo_url && (
              <img src={agency.logo_url} alt={`Logo ${brandName}`} className="mb-5 h-12 max-w-[160px] object-contain drop-shadow" />
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-guata-gold/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-guata-brown">
              <Sparkles className="h-3.5 w-3.5" /> Roteiro Exclusivo
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold leading-tight drop-shadow-lg sm:text-6xl">
              {request?.destination || proposal.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium opacity-95">
              {travelDates?.start && (
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-guata-gold" />{formatDate(travelDates.start)} — {formatDate(travelDates.end)}</span>
              )}
              {request?.travelers_count != null && (
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-guata-gold" />{request.travelers_count} viajante(s)</span>
              )}
              {itinerary.length > 0 && (
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-guata-gold" />{itinerary.length} dia(s)</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 print:py-4">
        {/* ===== Faixa resumo ===== */}
        {(itinerary.length > 0 || request?.travelers_count != null) && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 -mt-4 animate-slide-up">
            {[
              { icon: MapPin, label: 'Destino', value: request?.destination || '—' },
              { icon: Clock, label: 'Duração', value: itinerary.length > 0 ? `${itinerary.length} dia(s)` : '—' },
              { icon: Users, label: 'Viajantes', value: request?.travelers_count != null ? String(request.travelers_count) : '—' },
              { icon: Sparkles, label: 'Experiências', value: String(totalActivities) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border bg-card p-4 text-center shadow-sm">
                <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate font-display text-base font-semibold text-foreground" title={value}>{value}</p>
              </div>
            ))}
          </section>
        )}

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

        {/* ===== Timeline dia a dia ===== */}
        <section className="relative">
          {itinerary.length > 0 && <div className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-guata-gold via-border to-transparent sm:left-4" />}
          <div className="space-y-10">
            {itinerary.map((day, idx) => {
              const sorted = [...day.activities].sort((a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot));
              return (
                <article key={day.day} className="relative pl-10 sm:pl-14 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="absolute left-0 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-guata-gold bg-background text-xs font-bold text-primary sm:h-9 sm:w-9 sm:text-sm">
                    {day.day}
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-guata-gold">Dia {day.day}</p>
                    {dossier.day_titles?.[String(day.day)] && (
                      <h2 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{dossier.day_titles[String(day.day)]}</h2>
                    )}
                  </div>

                  <div className="space-y-5">
                    {sorted.length === 0 && <p className="text-sm text-muted-foreground">Sem atividades planejadas.</p>}
                    {sorted.map((activity, actIdx) => (
                      <div key={actIdx} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                        {activity.image_url && (
                          <div className="aspect-[16/9] w-full overflow-hidden">
                            <img
                              src={activity.image_url}
                              alt={activity.name}
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              style={{ objectPosition: activity.image_position || 'center center' }}
                            />
                          </div>
                        )}
                        <div className="space-y-3 p-5 sm:p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-xl font-semibold text-foreground">{activity.name}</h3>
                            <Badge variant="outline" className="text-xs capitalize">{activity.time_slot}</Badge>
                            <Badge className={`text-xs capitalize ${categoryColors[activity.category] || 'bg-muted text-muted-foreground'}`}>{activity.category}</Badge>
                          </div>
                          {activity.description && (
                            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{activity.description}</p>
                          )}
                          {activity.maps_url && (
                            <Button variant="outline" size="sm" asChild className="print:hidden">
                              <a href={activity.maps_url} target="_blank" rel="noopener noreferrer">
                                <MapPin className="mr-2 h-4 w-4" /> Ver rota <ExternalLink className="ml-2 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {itinerary.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-display text-lg font-medium">Roteiro ainda em planejamento</p>
            <p className="text-sm mt-1">As atividades serão adicionadas em breve.</p>
          </div>
        )}

        {/* ===== Seções do dossiê ===== */}
        {hasAnyFlight(dossier) && (
          <Card className="overflow-hidden bg-background shadow-sm">
            {dossier.flight_image && (
              <div className="aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
                <img src={dossier.flight_image} alt="Aéreo" className="h-full w-full object-cover" />
              </div>
            )}
            <CardHeader className="pb-3 border-b">
              <CardTitle className="font-display text-xl flex items-center gap-2"><Plane className="h-5 w-5 text-primary" />Aéreo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {dossier.flight_outbound && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-guata-gold mb-1">Voo de ida</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.flight_outbound}</p>
                </div>
              )}
              {dossier.flight_internal && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-guata-gold mb-1">Voo interno</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.flight_internal}</p>
                </div>
              )}
              {dossier.flight_inbound && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-guata-gold mb-1">Voo de volta</p>
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
                <div className="aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
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
        <footer className="text-center text-xs text-muted-foreground pt-10 border-t print:block">
          {agency?.logo_url && <img src={agency.logo_url} alt={`Logo ${brandName}`} className="mx-auto mb-3 h-10 max-w-32 object-contain" />}
          <p>Roteiro preparado com cuidado por <strong className="text-foreground">{brandName}</strong></p>
        </footer>
      </main>
    </div>
  );
}

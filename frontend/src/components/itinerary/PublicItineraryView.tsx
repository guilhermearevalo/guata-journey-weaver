import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Calendar, Users, Clock, Sparkles, Plane, Hotel,
  ExternalLink, FileText, Download, Phone,
} from 'lucide-react';
import ImageGalleryCarousel from './ImageGalleryCarousel';
import type { TravelDocument } from './TravelDocumentsVault';
import {
  parseDossier, hasAnyFlight, hasAccommodation, getAccommodationImages,
  getFlightOutboundImage, getFlightInboundImage, getFlightInternalImage, type Dossier,
} from '@/lib/dossier';
import {
  type Activity, type ItineraryDay, categoryColors, timeSlotOrder, getActivityImages,
} from '@/lib/itinerary';

export interface AgencyBranding {
  name?: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  contact_phone?: string | null;
}

export interface PublicItineraryRequest {
  destination?: string;
  travel_dates?: { start?: string; end?: string } | null;
  travelers_count?: number;
  client_name?: string;
}

interface PublicItineraryViewProps {
  title: string;
  request: PublicItineraryRequest | null;
  itinerary: ItineraryDay[];
  dossierRaw: unknown;
  travelDocuments: TravelDocument[];
  agency: AgencyBranding | null;
  onOpenDocument?: (doc: TravelDocument) => void;
}

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function nightCount(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  try {
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  } catch { return null; }
}

export default function PublicItineraryView({
  title,
  request,
  itinerary,
  dossierRaw,
  travelDocuments,
  agency,
  onOpenDocument,
}: PublicItineraryViewProps) {
  const [activeTab, setActiveTab] = useState('resumo');
  const dossier: Dossier = parseDossier(dossierRaw);
  const brandName = agency?.name || 'Guatá Viagens';
  const firstActivityImage = itinerary.flatMap(d => d.activities).flatMap(a => getActivityImages(a))[0];
  const coverImage = dossier.cover_image || agency?.cover_image_url || firstActivityImage;
  const totalActivities = itinerary.reduce((s, d) => s + d.activities.length, 0);
  const nights = nightCount(request?.travel_dates?.start, request?.travel_dates?.end);
  const clientName = request?.client_name?.trim();
  const tripLabel = clientName ? `Viagem de ${clientName.split(' ')[0]}` : title;
  const publicDocs = travelDocuments.filter(d => d.file_url || d.file_path);
  const ticketDocs = publicDocs.filter(d => d.category === 'ticket' || d.category === 'voucher');

  const tabs = useMemo(() => [
    { id: 'resumo', label: 'Resumo' },
    ...(hasAnyFlight(dossier) ? [{ id: 'voos', label: 'Voos' }] : []),
    ...(hasAccommodation(dossier) ? [{ id: 'hospedagens', label: 'Hospedagens' }] : []),
    ...(itinerary.length > 0 ? [{ id: 'experiencias', label: 'Experiências' }] : []),
    ...(publicDocs.length > 0 ? [{ id: 'documentos', label: 'Documentos' }] : []),
  ], [dossier, itinerary.length, publicDocs.length]);

  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? 'resumo');
    }
  }, [tabs, activeTab]);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero */}
      <header className="relative w-full overflow-hidden">
        {coverImage ? (
          <div className="relative h-[55vh] min-h-[380px] w-full">
            <img src={coverImage} alt={request?.destination || title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-guata-brown/95 via-guata-teal/35 to-black/25" />
          </div>
        ) : (
          <div className="relative h-[45vh] min-h-[320px] w-full gradient-hero" />
        )}

        {(agency?.logo_url || agency?.name || agency?.contact_phone) && (
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
            <div className="flex max-w-[220px] items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
              {agency.logo_url && (
                <img src={agency.logo_url} alt="" className="h-7 w-7 shrink-0 rounded-full object-contain" />
              )}
              <div className="min-w-0 text-left">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-guata-brown">{brandName}</p>
                {agency.contact_phone && (
                  <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />{agency.contact_phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-guata-gold/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-guata-brown">
              <Sparkles className="h-3 w-3" /> Roteiro interativo
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary-foreground drop-shadow-lg sm:text-5xl">
              {request?.destination || title}
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-2xl overflow-x-auto px-2">
            <TabsList className="h-auto w-max min-w-full justify-start gap-0 rounded-none bg-transparent p-0">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-guata-gold data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {/* Resumo */}
          <TabsContent value="resumo" className="mt-0 space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-2xl font-bold">{tripLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Resumo da viagem compartilhada com você</p>
            </div>

            <div className="space-y-3">
              {request?.travel_dates?.start && (
                <Card>
                  <CardContent className="flex items-start gap-3 py-4">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-guata-gold" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Período</p>
                      <p className="font-medium">
                        {formatDate(request.travel_dates.start)} → {formatDate(request.travel_dates.end)}
                        {nights != null && ` (${nights} noite${nights !== 1 ? 's' : ''})`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {request?.travelers_count != null && (
                <Card>
                  <CardContent className="flex items-start gap-3 py-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-guata-gold" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viajantes</p>
                      <p className="font-medium">{request.travelers_count} viajante{request.travelers_count !== 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {request?.destination && (
                <Card>
                  <CardContent className="flex items-start gap-3 py-4">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-guata-gold" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Destino</p>
                      <p className="font-medium">{request.destination}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {itinerary.length > 0 && (
                <Card>
                  <CardContent className="flex items-start gap-3 py-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-guata-gold" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Roteiro</p>
                      <p className="font-medium">{itinerary.length} dia{itinerary.length !== 1 ? 's' : ''} · {totalActivities} experiência{totalActivities !== 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Voos */}
          <TabsContent value="voos" className="mt-0 space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-2xl font-bold">Voos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Detalhes sobre os trechos aéreos</p>
            </div>
            {(() => {
              const outboundImg = getFlightOutboundImage(dossier);
              const inboundImg = getFlightInboundImage(dossier);
              const internalImg = getFlightInternalImage(dossier);

              const renderFlightCard = (
                title: string,
                text: string | undefined,
                image: string | undefined,
                alt: string,
                withPlane?: boolean,
              ) => {
                if (!text && !image) return null;
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className={`flex items-center gap-2 text-base${withPlane ? '' : ''}`}>
                        {withPlane && <Plane className="h-4 w-4 text-primary" />}
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {image && (
                        <img
                          src={image}
                          alt={alt}
                          className="max-h-64 w-full rounded-lg border object-contain bg-muted"
                        />
                      )}
                      {text && (
                        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{text}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              };

              return (
                <>
                  {renderFlightCard('Voo de ida', dossier.flight_outbound, outboundImg, 'Passagem de ida', true)}
                  {renderFlightCard('Voo interno', dossier.flight_internal, internalImg, 'Passagem interna')}
                  {renderFlightCard('Voo de volta', dossier.flight_inbound, inboundImg, 'Passagem de volta')}
                </>
              );
            })()}
            {ticketDocs.length > 0 && onOpenDocument && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Passagens e vouchers</p>
                {ticketDocs.map(doc => (
                  <Button key={doc.id} variant="outline" className="w-full justify-start" onClick={() => onOpenDocument(doc)}>
                    <Download className="mr-2 h-4 w-4" />{doc.title}
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hospedagens */}
          <TabsContent value="hospedagens" className="mt-0 space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-2xl font-bold">Hospedagens</h2>
              <p className="mt-1 text-sm text-muted-foreground">Detalhes sobre hospedagens</p>
            </div>
            <Card className="overflow-hidden">
              <ImageGalleryCarousel images={getAccommodationImages(dossier)} alt="Hospedagem" />
              {dossier.accommodation && (
                <CardContent className="pt-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-primary" />
                    <span className="font-display text-lg font-semibold">Hospedagem</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{dossier.accommodation}</p>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Experiências */}
          <TabsContent value="experiencias" className="mt-0 space-y-8 animate-fade-in">
            <div>
              <h2 className="font-display text-2xl font-bold">Experiências</h2>
              <p className="mt-1 text-sm text-muted-foreground">Roteiro dia a dia</p>
            </div>
            <div className="relative space-y-10">
              {itinerary.length > 0 && (
                <div className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-guata-gold via-border to-transparent" />
              )}
              {itinerary.map((day, idx) => {
                const sorted = [...day.activities].sort(
                  (a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot),
                );
                return (
                  <article key={day.day} className="relative pl-10 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="absolute left-0 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-guata-gold bg-background text-xs font-bold text-primary">
                      {day.day}
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-guata-gold">Dia {day.day}</p>
                      {dossier.day_titles?.[String(day.day)] && (
                        <h3 className="mt-1 font-display text-xl font-bold">{dossier.day_titles[String(day.day)]}</h3>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sorted.map((activity, actIdx) => (
                        <ActivityCard key={actIdx} activity={activity} />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documentos" className="mt-0 space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-2xl font-bold">Documentos</h2>
              <p className="mt-1 text-sm text-muted-foreground">Passagens, vouchers e arquivos importantes</p>
            </div>
            {publicDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento disponível ainda.</p>
            ) : (
              <div className="space-y-3">
                {publicDocs.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{doc.title}</p>
                          {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
                        </div>
                      </div>
                      {onOpenDocument && (doc.file_url || doc.file_path) && (
                        <Button variant="outline" size="sm" className="shrink-0" onClick={() => onOpenDocument(doc)}>
                          <Download className="mr-2 h-4 w-4" />Baixar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        <footer className="mt-16 border-t pt-8 text-center text-xs text-muted-foreground">
          {agency?.logo_url && (
            <img src={agency.logo_url} alt="" className="mx-auto mb-3 h-10 max-w-32 object-contain" />
          )}
          <p>Roteiro preparado com cuidado por <strong className="text-foreground">{brandName}</strong></p>
        </footer>
      </main>
      </Tabs>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const images = getActivityImages(activity);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {images.length > 0 && (
        <ImageGalleryCarousel
          images={images}
          alt={activity.name}
          imagePosition={activity.image_position || 'center center'}
        />
      )}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-lg font-semibold">{activity.name}</h4>
          <Badge variant="outline" className="text-xs capitalize">{activity.time_slot}</Badge>
          <Badge className={`text-xs capitalize ${categoryColors[activity.category] || 'bg-muted text-muted-foreground'}`}>
            {activity.category}
          </Badge>
        </div>
        {activity.description && (
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{activity.description}</p>
        )}
        {activity.maps_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={activity.maps_url} target="_blank" rel="noopener noreferrer">
              <MapPin className="mr-2 h-4 w-4" />Ver rota <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

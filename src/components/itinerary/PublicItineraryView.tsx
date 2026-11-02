import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Calendar, Users, Clock, Sparkles, Plane, Hotel,
  ExternalLink, FileText, Download, Phone, FileDown, Loader2, Map as MapIcon, BedDouble,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import guataLogo from '@/assets/logo-guata.png';
import { toMyMapsEmbedUrl } from '@/lib/mymaps';
import ImageGalleryCarousel from './ImageGalleryCarousel';
import type { TravelDocument } from './TravelDocumentsVault';
import {
  parseDossier, hasAnyFlight, hasAccommodation, getAccommodationImages,
  getFlightOutboundImage, getFlightInboundImage, getFlightInternalImage, type Dossier,
} from '@/lib/dossier';
import {
  type Activity, type ItineraryDay, categoryColors, timeSlotOrder, getActivityImages,
} from '@/lib/itinerary';

function dayDate(start: string | undefined, dayNum: number): Date | null {
  if (!start) return null;
  const d = new Date(`${start.slice(0, 10)}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + dayNum - 1);
  return d;
}

interface DayCardProps {
  day: ItineraryDay;
  index: number;
  date: Date | null;
  title?: string;
  tag?: string;
  hotel?: string;
  mapUrl: string | null;
}

function DayCard({ day, index, date, title, tag, hotel, mapUrl }: DayCardProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const sorted = [...day.activities].sort(
    (a, b) => timeSlotOrder.indexOf(a.time_slot) - timeSlotOrder.indexOf(b.time_slot),
  );
  return (
    <article
      className="overflow-hidden rounded-2xl border bg-card shadow-sm animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-5 p-5 sm:p-6">
        <div className="w-14 shrink-0 text-center">
          {date ? (
            <>
              <p className="font-display text-4xl font-bold leading-none text-primary">
                {String(date.getDate()).padStart(2, '0')}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
              </p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {date.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0]}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Dia</p>
              <p className="font-display text-4xl font-bold leading-none text-primary">{String(day.day).padStart(2, '0')}</p>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1 border-l pl-5">
          <h3 className="font-display text-2xl font-bold leading-tight">{title || `Dia ${day.day}`}</h3>
          {(tag || mapUrl) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tag && (
                <span className="rounded-full border border-guata-gold/60 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-guata-brown">
                  {tag}
                </span>
              )}
              {mapUrl && (
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
                >
                  <MapIcon className="h-3 w-3" /> Ver mapa do dia
                </button>
              )}
            </div>
          )}
          <div className="mt-4 space-y-4">
            {sorted.map((activity, i) => <ActivityCard key={i} activity={activity} />)}
          </div>
          {hotel && (
            <p className="mt-5 flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
              <BedDouble className="h-4 w-4 text-guata-gold" />
              Noite no <strong className="font-semibold text-foreground">{hotel}</strong>
            </p>
          )}
        </div>
      </div>
      {mapUrl && (
        <Dialog open={mapOpen} onOpenChange={setMapOpen}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="px-5 pt-5">
              <DialogTitle className="font-display">{title || `Dia ${day.day}`}</DialogTitle>
            </DialogHeader>
            {mapOpen && <iframe src={mapUrl} title={`Mapa do dia ${day.day}`} className="h-[70vh] w-full" loading="lazy" />}
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

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
  onDownloadPdf?: () => void | Promise<void>;
  downloadingPdf?: boolean;
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
  onDownloadPdf,
  downloadingPdf = false,
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
  const mapEmbed = toMyMapsEmbedUrl(dossier.map_url);
  const cobrandName = dossier.cobrand_name?.trim();
  const cobrandLogo = dossier.cobrand_logo;
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

        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <div className="flex items-center gap-3 rounded-full bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
            <img src={agency?.logo_url || guataLogo} alt={brandName} className="h-8 max-w-[96px] object-contain" />
            {cobrandLogo || cobrandName ? (
              <>
                <span className="font-display text-lg text-guata-gold">×</span>
                {cobrandLogo ? (
                  <img src={cobrandLogo} alt={cobrandName || 'Agência parceira'} className="h-8 max-w-[96px] object-contain" />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-guata-brown">{cobrandName}</span>
                )}
              </>
            ) : agency?.contact_phone ? (
              <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                <Phone className="h-3 w-3" />{agency.contact_phone}
              </span>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-guata-gold/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-guata-brown">
              <Sparkles className="h-3 w-3" /> Roteiro interativo
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary-foreground drop-shadow-lg sm:text-5xl">
              {request?.destination || title}
            </h1>
            {onDownloadPdf && itinerary.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-4 bg-white/95 text-guata-brown shadow-md hover:bg-white"
                onClick={() => void onDownloadPdf()}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Baixar PDF do Roteiro
              </Button>
            )}
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

      <main className={`mx-auto px-4 py-8 sm:px-6 ${activeTab === 'experiencias' && mapEmbed ? 'max-w-6xl' : 'max-w-2xl'}`}>
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
          <TabsContent value="experiencias" className="mt-0 animate-fade-in">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-guata-gold">Roteiro dia a dia</p>
              <h2 className="mt-1 font-display text-3xl font-bold">Experiências</h2>
            </div>
            <div className={mapEmbed ? 'grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]' : ''}>
              {mapEmbed && (
                <aside className="lg:sticky lg:top-16 lg:self-start">
                  <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 border-b px-4 py-2.5">
                      <MapIcon className="h-4 w-4 text-guata-gold" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mapa da viagem</span>
                    </div>
                    <iframe
                      src={mapEmbed}
                      title="Mapa do roteiro"
                      className="h-[340px] w-full lg:h-[calc(100vh-10rem)]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </aside>
              )}
              <div className="space-y-6">
                {itinerary.map((day, idx) => (
                  <DayCard
                    key={day.day}
                    day={day}
                    index={idx}
                    date={dayDate(request?.travel_dates?.start, day.day)}
                    title={dossier.day_titles?.[String(day.day)]}
                    tag={dossier.day_tags?.[String(day.day)]}
                    hotel={dossier.day_hotels?.[String(day.day)]}
                    mapUrl={toMyMapsEmbedUrl(dossier.day_maps?.[String(day.day)])}
                  />
                ))}
              </div>
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

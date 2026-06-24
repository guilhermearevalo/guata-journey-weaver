import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Users, Calendar, Check, X, ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ExperienceGallery } from '@/components/experience/ExperienceGallery';
import { ExperienceItinerary } from '@/components/experience/ExperienceItinerary';
import { BookingDialog } from '@/components/experience/BookingDialog';

const typeLabels: Record<string, string> = {
  package: 'Pacote',
  excursion: 'Excursão',
  custom: 'Personalizada',
  thematic: 'Temática',
};

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export default function ExperienciaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: relatedExperiences } = useQuery({
    queryKey: ['related-experiences', experience?.destination],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title, cover_image, price, destination, duration_days, experience_type')
        .eq('is_published', true)
        .neq('id', id)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!experience,
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-8 aspect-[21/9] w-full rounded-xl" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold">Experiência não encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            A experiência que você procura não existe ou foi removida.
          </p>
          <Button asChild className="mt-6">
            <Link to="/experiencias">Ver todas as experiências</Link>
          </Button>
        </div>
      </div>
    );
  }

  const itinerary: ItineraryDay[] = Array.isArray(experience.itinerary) 
    ? (experience.itinerary as unknown as ItineraryDay[])
    : [];
  const inclusions = experience.inclusions || [];
  const exclusions = experience.exclusions || [];
  const images = experience.images || [];
  const allImages = experience.cover_image 
    ? [experience.cover_image, ...images] 
    : images;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 pl-0">
            <Link to="/experiencias">
              <ChevronLeft className="h-4 w-4" />
              Voltar para experiências
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigator.share?.({ url: window.location.href, title: experience.title })}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Hero Image */}
        {experience.cover_image && (
          <div className="relative mb-8 aspect-[16/7] max-h-[400px] overflow-hidden rounded-xl">
            <img
              src={experience.cover_image}
              alt={experience.title}
              className="h-full w-full object-cover"
            />
            <Badge className="absolute left-4 top-4 bg-primary text-lg px-4 py-1">
              {typeLabels[experience.experience_type] || experience.experience_type}
            </Badge>
          </div>
        )}
        {!experience.cover_image && (
          <Badge className="mb-4 bg-primary text-lg px-4 py-1">
            {typeLabels[experience.experience_type] || experience.experience_type}
          </Badge>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              {experience.title}
            </h1>
            
            <div className="mt-4 flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {experience.destination}
              </span>
              {experience.duration_days && (
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {experience.duration_days} dias
                </span>
              )}
              {experience.max_participants && (
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Até {experience.max_participants} pessoas
                </span>
              )}
            </div>

            <p className="mt-6 text-lg text-muted-foreground">
              {experience.short_description}
            </p>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-8">
              <TabsList className="w-full justify-center">
                <TabsTrigger value="description">Descrição</TabsTrigger>
                {itinerary.length > 0 && (
                  <TabsTrigger value="itinerary">Itinerário</TabsTrigger>
                )}
                {(inclusions.length > 0 || exclusions.length > 0) && (
                  <TabsTrigger value="inclusions">O que inclui</TabsTrigger>
                )}
                {allImages.length > 1 && (
                  <TabsTrigger value="gallery">Galeria</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="prose prose-lg max-w-none">
                  {experience.description ? (
                    <p className="whitespace-pre-line">{experience.description}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      Entre em contato para mais informações sobre esta experiência.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="itinerary" className="mt-6">
                <ExperienceItinerary itinerary={itinerary} />
              </TabsContent>

              <TabsContent value="inclusions" className="mt-6">
                <div className="grid gap-8 md:grid-cols-2">
                {inclusions.length > 0 && (
                    <div>
                      <h3 className="mb-4 font-display text-xl font-semibold text-primary">
                        O que está incluso
                      </h3>
                      <ul className="space-y-2">
                        {inclusions.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div>
                      <h3 className="mb-4 font-display text-xl font-semibold text-destructive">
                        O que não está incluso
                      </h3>
                      <ul className="space-y-2">
                        {exclusions.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                <ExperienceGallery images={allImages} title={experience.title} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Card */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">A partir de</span>
                  <div className="font-display text-3xl font-bold text-primary">
                    {experience.price?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }) || 'Sob consulta'}
                  </div>
                  {experience.price && (
                    <span className="text-sm text-muted-foreground">por pessoa</span>
                  )}
                </div>

                {experience.departure_dates && Array.isArray(experience.departure_dates) && experience.departure_dates.length > 0 && (
                  <div className="mb-4 rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Próximas datas
                    </div>
                    <div className="space-y-1 text-sm">
                      {(experience.departure_dates as Array<{ date: string }>).slice(0, 3).map((item, index) => (
                        <div key={index} className="text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setBookingOpen(true)}
                >
                  Solicitar Reserva
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Sem compromisso. Nossa equipe entrará em contato.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Experiences */}
        {relatedExperiences && relatedExperiences.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold">
              Experiências relacionadas
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedExperiences.map((exp) => (
                <Link key={exp.id} to={`/experiencias/${exp.id}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={exp.cover_image || '/placeholder.svg'}
                        alt={exp.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Badge className="absolute left-3 top-3 bg-primary">
                        {typeLabels[exp.experience_type] || exp.experience_type}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1 font-display text-lg font-semibold line-clamp-1 group-hover:text-primary">
                        {exp.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {exp.destination}
                      </div>
                      <div className="mt-2 font-display text-lg font-bold text-primary">
                        {exp.price?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        experience={experience}
      />
    </div>
  );
}

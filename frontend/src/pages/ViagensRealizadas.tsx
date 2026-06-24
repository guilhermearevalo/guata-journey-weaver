import { useState } from 'react';
import { Seo } from '@/components/seo/Seo';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Quote, Camera, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const ViagensRealizadas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const { data: realizadas, isLoading } = useQuery({
    queryKey: ['completed-trips-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('completed_trips' as any)
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: false })
        .order('trip_year', { ascending: false })
        .order('trip_month', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = realizadas?.filter((t: any) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Seo
        path="/viagens-realizadas"
        title="Viagens realizadas e pacotes"
        description="Inspire-se com viagens reais organizadas pela Guatá pelo Brasil e exterior. Veja roteiros, destinos e a experiência dos nossos viajantes."
      />
      <section className="bg-gradient-to-r from-secondary to-secondary/80 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Viagens Realizadas</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Histórico real de viagens organizadas pela Guatá e agências parceiras — do Pantanal ao mundo.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar destinos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-full border-0 bg-white pl-12 text-base text-foreground shadow-xl focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><div className="h-48 bg-muted" /><CardHeader><div className="h-6 w-3/4 bg-muted rounded" /></CardHeader></Card>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trip: any) => {
              const hasMedia = (trip.gallery?.length || 0) > 0 || trip.video_url;
              return (
                <Card key={trip.id} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                  <button type="button" onClick={() => setSelectedTrip(trip)} className="relative block w-full text-left">
                    <div
                      className="h-52 bg-cover bg-center"
                      style={{ backgroundImage: `url(${trip.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {trip.video_url && (
                      <div className="absolute top-3 right-3 rounded-full bg-black/60 p-2">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge variant="secondary" className="mb-2">
                        <Calendar className="mr-1 h-3 w-3" />
                        {trip.trip_month ? `${monthNames[trip.trip_month - 1]} ${trip.trip_year || ''}` : trip.trip_year || 'Realizada'}
                      </Badge>
                      <h3 className="font-display text-xl font-semibold text-white drop-shadow">{trip.title}</h3>
                      <p className="text-sm text-white/90"><MapPin className="mr-1 inline h-3.5 w-3.5" />{trip.destination}</p>
                    </div>
                  </button>
                  <CardContent className="space-y-3 pt-4">
                    {trip.client_quote && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <Quote className="mb-1 h-4 w-4 text-primary/40" />
                        <p className="text-sm italic text-muted-foreground line-clamp-3">"{trip.client_quote}"</p>
                        {trip.client_name && (
                          <p className="mt-2 text-xs font-medium">— {trip.client_name}</p>
                        )}
                      </div>
                    )}
                    {trip.description && !trip.client_quote && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{trip.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    {hasMedia && (
                      <Button variant="ghost" className="flex-1" onClick={() => setSelectedTrip(trip)}>
                        Ver fotos
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to={`/viagem-personalizada?inspiracao=${encodeURIComponent(trip.title)}`}>
                        Quero algo parecido
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-xl text-muted-foreground">Em breve compartilharemos viagens realizadas aqui.</p>
            <p className="mt-2 text-sm text-muted-foreground">Enquanto isso, que tal montar a sua?</p>
            <Button className="mt-4" asChild><Link to="/viagem-personalizada">Solicitar Viagem Personalizada</Link></Button>
          </div>
        )}
      </section>

      <Dialog open={!!selectedTrip} onOpenChange={(o) => !o && setSelectedTrip(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedTrip && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{selectedTrip.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />{selectedTrip.destination}
                  {selectedTrip.trip_year && <> · {selectedTrip.trip_month ? `${monthNames[selectedTrip.trip_month - 1]} ` : ''}{selectedTrip.trip_year}</>}
                </p>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTrip.video_url && (
                  <video src={selectedTrip.video_url} controls className="w-full rounded-lg" />
                )}
                {selectedTrip.cover_image && !selectedTrip.video_url && (
                  <img src={selectedTrip.cover_image} alt={selectedTrip.title} className="w-full rounded-lg" />
                )}
                {selectedTrip.gallery && selectedTrip.gallery.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {selectedTrip.gallery.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Foto ${i + 1}`} className="h-32 w-full rounded object-cover transition-transform hover:scale-105" />
                      </a>
                    ))}
                  </div>
                )}
                {selectedTrip.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedTrip.description}</p>
                )}
                {selectedTrip.client_quote && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <Quote className="mb-2 h-5 w-5 text-primary/40" />
                    <p className="italic">"{selectedTrip.client_quote}"</p>
                    {selectedTrip.client_name && (
                      <p className="mt-2 text-sm font-medium">— {selectedTrip.client_name}</p>
                    )}
                  </div>
                )}
                <Button asChild className="w-full">
                  <Link to={`/viagem-personalizada?inspiracao=${encodeURIComponent(selectedTrip.title)}`}>
                    Quero uma viagem parecida
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViagensRealizadas;

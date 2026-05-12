import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Calendar, Quote, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const Pacotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('available');

  const { data: pacotes, isLoading } = useQuery({
    queryKey: ['pacotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('is_published', true)
        .eq('experience_type', 'package')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: realizadas, isLoading: loadingRealizadas } = useQuery({
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

  const filteredPacotes = pacotes?.filter(pac =>
    pac.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pac.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRealizadas = realizadas?.filter((t: any) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Pacotes & Viagens</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Veja pacotes prontos para reservar ou se inspire em viagens já realizadas pelos nossos clientes.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="available">Pacotes disponíveis</TabsTrigger>
              <TabsTrigger value="completed">Viagens realizadas</TabsTrigger>
            </TabsList>

            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={tab === 'available' ? 'Buscar pacotes...' : 'Buscar destinos...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="available" className="mt-0">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted" />
                    <CardHeader><div className="h-6 w-3/4 bg-muted rounded" /></CardHeader>
                    <CardContent><div className="h-4 w-full bg-muted rounded mb-2" /><div className="h-4 w-2/3 bg-muted rounded" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPacotes && filteredPacotes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPacotes.map((pacote) => (
                  <Card key={pacote.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative">
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${pacote.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'})` }}
                      />
                      {pacote.is_featured && (
                        <Badge className="absolute right-3 top-3 bg-primary">
                          <Star className="mr-1 h-3 w-3" />Destaque
                        </Badge>
                      )}
                    </div>
                    <CardHeader><h3 className="font-display text-xl font-semibold">{pacote.title}</h3></CardHeader>
                    <CardContent className="space-y-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{pacote.short_description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{pacote.destination}</span>
                        {pacote.duration_days && (
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{pacote.duration_days} dias</span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      {pacote.price && (
                        <div>
                          <span className="text-xs text-muted-foreground">A partir de</span>
                          <span className="block text-lg font-bold text-primary">R$ {pacote.price.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      <Button asChild><Link to={`/experiencias/${pacote.id}`}>Ver Detalhes</Link></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-xl text-muted-foreground">Nenhum pacote disponível no momento.</p>
                <Button className="mt-4" asChild><Link to="/viagem-personalizada">Solicitar Viagem Personalizada</Link></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <div className="mb-6 rounded-xl border border-dashed bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <Camera className="mr-1 inline h-4 w-4" />
                Histórico real de viagens organizadas pela Guatá e ag\u00eancias parceiras. Inspire-se e peça algo parecido.
              </p>
            </div>

            {loadingRealizadas ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse"><div className="h-48 bg-muted" /><CardHeader><div className="h-6 w-3/4 bg-muted rounded" /></CardHeader></Card>
                ))}
              </div>
            ) : filteredRealizadas && filteredRealizadas.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRealizadas.map((trip: any) => (
                  <Card key={trip.id} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative">
                      <div
                        className="h-52 bg-cover bg-center"
                        style={{ backgroundImage: `url(${trip.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <Badge variant="secondary" className="mb-2">
                          <Calendar className="mr-1 h-3 w-3" />
                          {trip.trip_month ? `${monthNames[trip.trip_month - 1]} ${trip.trip_year || ''}` : trip.trip_year || 'Realizada'}
                        </Badge>
                        <h3 className="font-display text-xl font-semibold text-white drop-shadow">{trip.title}</h3>
                        <p className="text-sm text-white/90"><MapPin className="mr-1 inline h-3.5 w-3.5" />{trip.destination}</p>
                      </div>
                    </div>
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
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/viagem-personalizada?inspiracao=${encodeURIComponent(trip.title)}`}>
                          Quero algo parecido
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-xl text-muted-foreground">Em breve compartilharemos viagens realizadas aqui.</p>
                <p className="mt-2 text-sm text-muted-foreground">Enquanto isso, que tal montar a sua?</p>
                <Button className="mt-4" asChild><Link to="/viagem-personalizada">Solicitar Viagem Personalizada</Link></Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Pacotes;

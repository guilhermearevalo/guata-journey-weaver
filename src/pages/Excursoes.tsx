import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Excursoes = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: excursoes, isLoading } = useQuery({
    queryKey: ['excursoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('is_published', true)
        .eq('experience_type', 'excursion')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredExcursoes = excursoes?.filter(exc => 
    exc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exc.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Excursões</h1>
          <p className="mt-4 text-lg text-white/80">
            Viagens em grupo com roteiros cuidadosamente planejados
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar excursões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExcursoes && filteredExcursoes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExcursoes.map((excursao) => (
              <Card key={excursao.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${excursao.cover_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'})` }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-xl font-semibold">{excursao.title}</h3>
                    <Badge variant="secondary">Excursão</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {excursao.short_description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {excursao.destination}
                    </span>
                    {excursao.duration_days && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {excursao.duration_days} dias
                      </span>
                    )}
                    {excursao.max_participants && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Até {excursao.max_participants} pessoas
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  {excursao.price && (
                    <span className="text-lg font-bold text-primary">
                      R$ {excursao.price.toLocaleString('pt-BR')}
                    </span>
                  )}
                  <Button asChild>
                    <Link to={`/experiencias/${excursao.id}`}>Ver Detalhes</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              Nenhuma excursão encontrada no momento.
            </p>
            <p className="mt-2 text-muted-foreground">
              Entre em contato para roteiros personalizados!
            </p>
            <Button className="mt-4" asChild>
              <a href="/viagem-personalizada">Solicitar Viagem Personalizada</a>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Excursoes;

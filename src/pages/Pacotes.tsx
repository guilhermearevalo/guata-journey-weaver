import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Pacotes = () => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredPacotes = pacotes?.filter(pac => 
    pac.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pac.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Pacotes de Viagem</h1>
          <p className="mt-4 text-lg text-white/80">
            Experiências completas com hospedagem, passeios e muito mais
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar pacotes..."
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
        ) : filteredPacotes && filteredPacotes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPacotes.map((pacote) => (
              <Card key={pacote.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div 
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${pacote.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'})` }}
                  />
                  {pacote.is_featured && (
                    <Badge className="absolute top-3 right-3 bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <h3 className="font-display text-xl font-semibold">{pacote.title}</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pacote.short_description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {pacote.destination}
                    </span>
                    {pacote.duration_days && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {pacote.duration_days} dias
                      </span>
                    )}
                  </div>
                  {pacote.inclusions && pacote.inclusions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {pacote.inclusions.slice(0, 3).map((inc, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {inc}
                        </Badge>
                      ))}
                      {pacote.inclusions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pacote.inclusions.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  {pacote.price && (
                    <div>
                      <span className="text-xs text-muted-foreground">A partir de</span>
                      <span className="block text-lg font-bold text-primary">
                        R$ {pacote.price.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  <Button asChild>
                    <Link to={`/experiencias/${pacote.id}`}>Ver Detalhes</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              Nenhum pacote disponível no momento.
            </p>
            <p className="mt-2 text-muted-foreground">
              Solicite um roteiro personalizado para você!
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

export default Pacotes;

import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Users, Filter, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

interface Experience {
  id: string;
  title: string;
  short_description: string;
  destination: string;
  price: number;
  duration_days: number;
  max_participants: number;
  cover_image: string;
  experience_type: string;
}

const typeLabels: Record<string, string> = {
  package: 'Pacote',
  excursion: 'Excursão',
  custom: 'Personalizada',
  thematic: 'Temática',
};

const placeholderExperiences: Experience[] = [
  {
    id: '1',
    title: 'Fernando de Noronha Exclusivo',
    short_description: 'Uma semana de imersão em um dos arquipélagos mais preservados do mundo.',
    destination: 'Fernando de Noronha, PE',
    price: 12500,
    duration_days: 7,
    max_participants: 8,
    cover_image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop',
    experience_type: 'package',
  },
  {
    id: '2',
    title: 'Aventura no Jalapão',
    short_description: 'Trilhas, fervedouros e dunas douradas no coração do cerrado brasileiro.',
    destination: 'Jalapão, TO',
    price: 4800,
    duration_days: 5,
    max_participants: 12,
    cover_image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2126&auto=format&fit=crop',
    experience_type: 'excursion',
  },
  {
    id: '3',
    title: 'Chapada Diamantina Completa',
    short_description: 'Cachoeiras, grutas e trekking em paisagens de tirar o fôlego.',
    destination: 'Chapada Diamantina, BA',
    price: 3200,
    duration_days: 4,
    max_participants: 15,
    cover_image: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?q=80&w=2070&auto=format&fit=crop',
    experience_type: 'excursion',
  },
  {
    id: '4',
    title: 'Lençóis Maranhenses Premium',
    short_description: 'Lagos cristalinos entre dunas brancas em uma experiência inesquecível.',
    destination: 'Lençóis Maranhenses, MA',
    price: 5600,
    duration_days: 4,
    max_participants: 10,
    cover_image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2070&auto=format&fit=crop',
    experience_type: 'package',
  },
  {
    id: '5',
    title: 'Amazônia Selvagem',
    short_description: 'Expedição pela floresta amazônica com hospedagem em lodge exclusivo.',
    destination: 'Manaus, AM',
    price: 8900,
    duration_days: 6,
    max_participants: 8,
    cover_image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=2066&auto=format&fit=crop',
    experience_type: 'package',
  },
  {
    id: '6',
    title: 'Bonito e Pantanal',
    short_description: 'Águas cristalinas e vida selvagem em um roteiro inesquecível.',
    destination: 'Bonito, MS',
    price: 6200,
    duration_days: 5,
    max_participants: 12,
    cover_image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2128&auto=format&fit=crop',
    experience_type: 'excursion',
  },
];

export default function Experiencias() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('destino') || '');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  useEffect(() => {
    async function fetchExperiences() {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('is_published', true);

      if (error || !data || data.length === 0) {
        setExperiences(placeholderExperiences);
      } else {
        setExperiences(data);
      }
      setLoading(false);
    }

    fetchExperiences();
  }, []);

  const filteredExperiences = experiences
    .filter((exp) => {
      const matchesSearch = search === '' || 
        exp.title.toLowerCase().includes(search.toLowerCase()) ||
        exp.destination.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || exp.experience_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'duration') return (a.duration_days || 0) - (b.duration_days || 0);
      return 0;
    });

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de experiência</label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="package">Pacotes</SelectItem>
            <SelectItem value="excursion">Excursões</SelectItem>
            <SelectItem value="thematic">Temáticas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ordenar por</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Destaque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destaque</SelectItem>
            <SelectItem value="price-asc">Menor preço</SelectItem>
            <SelectItem value="price-desc">Maior preço</SelectItem>
            <SelectItem value="duration">Duração</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Experiências</h1>
          <p className="mt-2 text-muted-foreground">
            Descubra destinos incríveis com roteiros cuidadosamente selecionados
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por destino ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Filters */}
            <div className="hidden items-center gap-4 lg:flex">
              <FiltersContent />
            </div>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Results count */}
        <p className="mb-6 text-sm text-muted-foreground">
          {filteredExperiences.length} experiência{filteredExperiences.length !== 1 ? 's' : ''} encontrada{filteredExperiences.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array(8)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
            : filteredExperiences.map((exp) => (
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
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {exp.short_description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exp.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exp.duration_days} dias
                        </span>
                        {exp.max_participants && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Até {exp.max_participants}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">A partir de</span>
                        <span className="font-display text-xl font-bold text-primary">
                          {exp.price?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {filteredExperiences.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">
              Nenhuma experiência encontrada
            </h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              {search
                ? `Não encontramos experiências para "${search}". Que tal solicitar uma viagem personalizada?`
                : 'Nenhuma experiência corresponde aos filtros selecionados.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {search && (
                <Button
                  onClick={() =>
                    navigate(`/viagem-personalizada?destino=${encodeURIComponent(search)}`)
                  }
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Solicitar Viagem Personalizada
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

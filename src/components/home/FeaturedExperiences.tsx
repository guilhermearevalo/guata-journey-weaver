import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
];

const typeLabels: Record<string, string> = {
  package: 'Pacote',
  excursion: 'Excursão',
  custom: 'Personalizada',
  thematic: 'Temática',
};

export function FeaturedExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExperiences() {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .limit(4);

      if (error || !data || data.length === 0) {
        setExperiences(placeholderExperiences);
      } else {
        setExperiences(data);
      }
      setLoading(false);
    }

    fetchExperiences();
  }, []);

  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Experiências em Destaque
            </h2>
            <p className="mt-2 text-muted-foreground">
              Viagens selecionadas pela nossa equipe de curadoria
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/experiencias">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array(4)
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
            : experiences.map((exp) => (
                <Link key={exp.id} to={`/experiencias/${exp.id}`}>
                  <Card className="group overflow-hidden transition-all hover:shadow-lg">
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
      </div>
    </section>
  );
}

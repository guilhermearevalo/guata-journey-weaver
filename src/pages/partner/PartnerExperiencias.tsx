import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Users, DollarSign, Map } from 'lucide-react';

export default function PartnerExperiencias() {
  const { user } = useAuth();

  // Buscar agência do parceiro
  const { data: agencyData } = useQuery({
    queryKey: ['partner-agency', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_users')
        .select('agency_id, partner_agencies(name)')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const agencyId = agencyData?.agency_id;

  // Buscar experiências operadas pela agência
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['partner-experiences', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('operator_agency_id', agencyId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const typeLabels: Record<string, string> = {
    package: 'Pacote',
    excursion: 'Excursão',
    custom: 'Personalizado',
    thematic: 'Temático',
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Experiências que Você Opera</h1>
        <p className="text-muted-foreground">
          Veja as experiências cadastradas pela Guatá que sua agência opera.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : experiences && experiences.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => (
            <Card key={exp.id} className="overflow-hidden">
              {exp.cover_image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={exp.cover_image}
                    alt={exp.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{exp.title}</CardTitle>
                  <Badge variant="secondary">
                    {typeLabels[exp.experience_type] || exp.experience_type}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {exp.destination}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exp.short_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {exp.short_description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 text-sm">
                  {exp.duration_days && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {exp.duration_days} dias
                    </span>
                  )}
                  {exp.max_participants && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Até {exp.max_participants}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <DollarSign className="h-4 w-4" />
                    {formatPrice(exp.price)}
                  </span>
                  <Badge variant={exp.is_published ? 'default' : 'outline'}>
                    {exp.is_published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Map className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhuma experiência cadastrada</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              Quando a Guatá cadastrar experiências operadas pela sua agência, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

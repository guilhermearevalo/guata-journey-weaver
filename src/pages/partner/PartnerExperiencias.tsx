import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Users, DollarSign, Map, Plus, Pencil } from 'lucide-react';
import { ExperienceForm } from '@/components/admin/ExperienceForm';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

export default function PartnerExperiencias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Tables<'experiences'> | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Tables<'experiences'>>) => {
      if (editingExperience) {
        const { error } = await supabase
          .from('experiences')
          .update(data)
          .eq('id', editingExperience.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('experiences')
          .insert({
            ...data,
            operator_agency_id: agencyId!,
            is_published: false,
            is_featured: false,
            created_by: user!.id,
          } as Tables<'experiences'>);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-experiences'] });
      setFormOpen(false);
      setEditingExperience(null);
      toast({ title: editingExperience ? 'Experiência atualizada!' : 'Experiência criada! Aguardando aprovação.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    },
  });

  const typeLabels: Record<string, string> = {
    package: 'Pacote',
    excursion: 'Excursão',
    custom: 'Personalizado',
    thematic: 'Temático',
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Sob consulta';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleEdit = (exp: Tables<'experiences'>) => {
    setEditingExperience(exp);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingExperience(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Experiências</h1>
          <p className="text-muted-foreground">
            Gerencie as experiências operadas pela sua agência.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Experiência
        </Button>
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
                  <div className="flex items-center gap-2">
                    <Badge variant={exp.is_published ? 'default' : 'outline'}>
                      {exp.is_published ? 'Publicada' : 'Aguardando Aprovação'}
                    </Badge>
                    {!exp.is_published && (
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(exp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
              Cadastre experiências que sua agência opera. Elas ficarão visíveis após aprovação.
            </p>
            <Button className="mt-4" onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Experiência
            </Button>
          </CardContent>
        </Card>
      )}

      <ExperienceForm
        experience={editingExperience}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExperience(null);
        }}
        onSubmit={async (data) => {
          // Force unpublished for partner submissions
          await saveMutation.mutateAsync({ ...data, is_published: false, is_featured: false });
        }}
        isSubmitting={saveMutation.isPending}
      />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExperienceForm } from '@/components/admin/ExperienceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react';

const experienceTypeLabels: Record<string, string> = {
  package: 'Pacote',
  excursion: 'Excursão',
  custom: 'Personalizado',
  thematic: 'Temático',
};

const AdminExperiencias = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Tables<'experiences'> | null>(null);
  const [deletingExperience, setDeletingExperience] = useState<Tables<'experiences'> | null>(null);

  const { data: experiences, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tables<'experiences'>[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Tables<'experiences'>>) => {
      const insertData = {
        title: data.title!,
        destination: data.destination!,
        short_description: data.short_description,
        description: data.description,
        experience_type: data.experience_type,
        price: data.price,
        duration_days: data.duration_days,
        max_participants: data.max_participants,
        cover_image: data.cover_image,
        is_published: data.is_published,
        is_featured: data.is_featured,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
      };
      const { error } = await supabase.from('experiences').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setFormOpen(false);
      toast({ title: 'Experiência criada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar experiência', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tables<'experiences'>> }) => {
      const { error } = await supabase.from('experiences').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setFormOpen(false);
      setEditingExperience(null);
      toast({ title: 'Experiência atualizada com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar experiência', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('experiences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setDeletingExperience(null);
      toast({ title: 'Experiência excluída com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir experiência', variant: 'destructive' });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('experiences').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });

  const handleSubmit = async (data: Partial<Tables<'experiences'>>) => {
    if (editingExperience) {
      await updateMutation.mutateAsync({ id: editingExperience.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (experience: Tables<'experiences'>) => {
    setEditingExperience(experience);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setEditingExperience(null);
    }
    setFormOpen(open);
  };

  const filteredExperiences = experiences?.filter(exp => 
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Experiências</h1>
          <p className="text-muted-foreground">
            Gestão de pacotes e excursões
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Experiência
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Experiência</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredExperiences?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma experiência encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredExperiences?.map((experience) => (
                <TableRow key={experience.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {experience.cover_image && (
                        <img 
                          src={experience.cover_image} 
                          alt={experience.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{experience.title}</span>
                          {experience.is_featured && (
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{experience.destination}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {experienceTypeLabels[experience.experience_type] || experience.experience_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(experience.price)}</TableCell>
                  <TableCell>{experience.duration_days ? `${experience.duration_days} dias` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={experience.is_published ? 'default' : 'outline'}>
                      {experience.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(experience)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => togglePublish.mutate({ 
                            id: experience.id, 
                            is_published: !experience.is_published 
                          })}
                        >
                          {experience.is_published ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publicar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeletingExperience(experience)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <ExperienceForm
        experience={editingExperience}
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingExperience} onOpenChange={(open) => !open && setDeletingExperience(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingExperience?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingExperience && deleteMutation.mutate(deletingExperience.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminExperiencias;

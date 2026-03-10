import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Check, X, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminDepoimentos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('testimonials')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: 'Depoimento removido' });
    },
  });

  const pending = testimonials?.filter(t => t.status === 'pending') || [];
  const approved = testimonials?.filter(t => t.status === 'approved') || [];
  const rejected = testimonials?.filter(t => t.status === 'rejected') || [];

  const TestimonialCard = ({ t }: { t: any }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={t.client_photo_url} alt={t.client_name} />
              <AvatarFallback>{t.client_name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{t.client_name}</p>
              <p className="text-xs text-muted-foreground">{t.client_location || 'Sem localização'}</p>
            </div>
          </div>
          <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'}>
            {t.status === 'approved' ? 'Aprovado' : t.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
          </Badge>
        </div>

        <div className="flex gap-1">
          {Array(t.rating || 5).fill(0).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-warning text-warning" />
          ))}
        </div>

        <p className="text-sm text-muted-foreground">"{t.text}"</p>

        {t.trip_name && (
          <p className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded inline-block">{t.trip_name}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>

        <div className="flex gap-2 pt-2 border-t">
          {t.status !== 'approved' && (
            <Button size="sm" variant="default" onClick={() => updateStatus.mutate({ id: t.id, status: 'approved' })} className="gap-1">
              <Check className="h-3 w-3" /> Aprovar
            </Button>
          )}
          {t.status !== 'rejected' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: t.id, status: 'rejected' })} className="gap-1">
              <X className="h-3 w-3" /> Rejeitar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive gap-1 ml-auto" onClick={() => deleteMutation.mutate(t.id)}>
            <Trash2 className="h-3 w-3" /> Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Depoimentos</h1>
        <p className="text-muted-foreground">Gerencie os depoimentos enviados pelos clientes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-warning">{pending.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{approved.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rejeitados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{rejected.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({rejected.length})</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map(status => (
          <TabsContent key={status} value={status}>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {(status === 'pending' ? pending : status === 'approved' ? approved : rejected).map(t => (
                  <TestimonialCard key={t.id} t={t} />
                ))}
                {(status === 'pending' ? pending : status === 'approved' ? approved : rejected).length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum depoimento {status === 'pending' ? 'pendente' : status === 'approved' ? 'aprovado' : 'rejeitado'}</p>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminDepoimentos;

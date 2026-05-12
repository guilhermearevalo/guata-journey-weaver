import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Calendar, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Trip {
  id: string;
  title: string;
  destination: string;
  cover_image: string | null;
  trip_month: number | null;
  trip_year: number | null;
  agency_id: string | null;
  client_quote: string | null;
  client_name: string | null;
  description: string | null;
  is_published: boolean;
  display_order: number;
}

const emptyForm = {
  title: '',
  destination: '',
  cover_image: '',
  trip_month: '',
  trip_year: String(new Date().getFullYear()),
  agency_id: '',
  client_quote: '',
  client_name: '',
  description: '',
  is_published: true,
  display_order: '0',
};

export default function AdminViagensRealizadas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Trip | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['admin-completed-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('completed_trips' as any)
        .select('*')
        .order('display_order', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Trip[];
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies-options'],
    queryFn: async () => {
      const { data } = await supabase.from('partner_agencies').select('id,name').eq('is_active', true);
      return data || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) {
        const { error } = await supabase.from('completed_trips' as any).update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('completed_trips' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-completed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['completed-trips-public'] });
      toast({ title: editing ? 'Viagem atualizada' : 'Viagem cadastrada' });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('completed_trips' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-completed-trips'] });
      toast({ title: 'Viagem removida' });
    },
  });

  const togglePublished = useMutation({
    mutationFn: async (trip: Trip) => {
      const { error } = await supabase
        .from('completed_trips' as any)
        .update({ is_published: !trip.is_published })
        .eq('id', trip.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-completed-trips'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      title: form.title,
      destination: form.destination,
      cover_image: form.cover_image || null,
      trip_month: form.trip_month ? parseInt(form.trip_month) : null,
      trip_year: form.trip_year ? parseInt(form.trip_year) : null,
      agency_id: form.agency_id || null,
      client_quote: form.client_quote || null,
      client_name: form.client_name || null,
      description: form.description || null,
      is_published: form.is_published,
      display_order: parseInt(form.display_order) || 0,
    });
  };

  const handleEdit = (trip: Trip) => {
    setEditing(trip);
    setForm({
      title: trip.title,
      destination: trip.destination,
      cover_image: trip.cover_image || '',
      trip_month: trip.trip_month ? String(trip.trip_month) : '',
      trip_year: trip.trip_year ? String(trip.trip_year) : String(new Date().getFullYear()),
      agency_id: trip.agency_id || '',
      client_quote: trip.client_quote || '',
      client_name: trip.client_name || '',
      description: trip.description || '',
      is_published: trip.is_published,
      display_order: String(trip.display_order),
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Viagens Realizadas</h1>
          <p className="text-muted-foreground">Portfólio público que aparece em /pacotes na aba "Viagens realizadas".</p>
        </div>
        <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nova viagem</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !trips || trips.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhuma viagem cadastrada ainda.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="overflow-hidden">
              <div
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${trip.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'})` }}
              />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{trip.title}</CardTitle>
                  <Badge variant={trip.is_published ? 'default' : 'secondary'} className="shrink-0">
                    {trip.is_published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <MapPin className="mr-1 inline h-3 w-3" />{trip.destination}
                  {trip.trip_year && <> · <Calendar className="mr-1 inline h-3 w-3" />{trip.trip_year}</>}
                </p>
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                <Button size="sm" variant="outline" onClick={() => handleEdit(trip)}><Pencil className="mr-1 h-3 w-3" />Editar</Button>
                <Button size="sm" variant="outline" onClick={() => togglePublished.mutate(trip)}>
                  {trip.is_published ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                  {trip.is_published ? 'Ocultar' : 'Publicar'}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm('Remover esta viagem?')) deleteMutation.mutate(trip.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar viagem' : 'Nova viagem realizada'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Título *</Label>
                <Input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Lua de mel em Bonito" />
              </div>
              <div>
                <Label>Destino *</Label>
                <Input required value={form.destination} onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Bonito, MS" />
              </div>
            </div>

            <div>
              <Label>Imagem de capa (URL)</Label>
              <Input value={form.cover_image} onChange={(e) => setForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Mês</Label>
                <Input type="number" min="1" max="12" value={form.trip_month} onChange={(e) => setForm(f => ({ ...f, trip_month: e.target.value }))} />
              </div>
              <div>
                <Label>Ano</Label>
                <Input type="number" value={form.trip_year} onChange={(e) => setForm(f => ({ ...f, trip_year: e.target.value }))} />
              </div>
              <div>
                <Label>Ordem (maior aparece antes)</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm(f => ({ ...f, display_order: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Agência responsável</Label>
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.agency_id} onChange={(e) => setForm(f => ({ ...f, agency_id: e.target.value }))}>
                <option value="">Guatá (operação própria)</option>
                {agencies?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div>
              <Label>Descrição curta</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nome do cliente</Label>
                <Input value={form.client_name} onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Mariana e João" />
              </div>
              <div>
                <Label>Depoimento curto</Label>
                <Input value={form.client_quote} onChange={(e) => setForm(f => ({ ...f, client_quote: e.target.value }))} placeholder="Foi inesquecível!" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Publicar imediatamente (aparece no site)
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, MapPin, Users, Calendar, Route, Share2, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useState as useStateExtra } from 'react';

export default function AdminProposta() {
  const { id: requestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [pixLink, setPixLink] = useState('');
  const [cardLink, setCardLink] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [agencyId, setAgencyId] = useState<string>('none');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['travel-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('id', requestId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_agencies').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingProposal, isLoading: proposalLoading } = useQuery({
    queryKey: ['admin-proposal', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('request_id', requestId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  useEffect(() => {
    if (existingProposal) {
      setTitle(existingProposal.title || '');
      setDescription(existingProposal.description || '');
      setTotalPrice(existingProposal.total_price?.toString() || '');
      setInclusions(existingProposal.inclusions?.join('\n') || '');
      setPaymentStatus(existingProposal.payment_status || 'pending');
      setAgencyId(existingProposal.agency_id || 'none');
      const links = existingProposal.payment_links as { pix?: string; card?: string } | null;
      setPixLink(links?.pix || '');
      setCardLink(links?.card || '');
    }
  }, [existingProposal]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        request_id: requestId!,
        title,
        description,
        total_price: totalPrice ? parseFloat(totalPrice) : null,
        inclusions: inclusions.split('\n').filter(Boolean),
        payment_links: { pix: pixLink || null, card: cardLink || null },
        payment_status: paymentStatus,
        created_by: user?.id,
        agency_id: agencyId === 'none' ? null : agencyId,
      };

      if (existingProposal) {
        const { error } = await supabase.from('proposals').update(payload).eq('id', existingProposal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('proposals').insert(payload);
        if (error) throw error;
        // Update request status
        await supabase.from('travel_requests').update({ status: 'proposal_sent' }).eq('id', requestId!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proposal', requestId] });
      toast({ title: 'Proposta salva com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    },
  });

  const travelDates = request?.travel_dates as { start?: string; end?: string } | null;

  if (requestLoading || proposalLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/demandas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">
            {existingProposal ? 'Editar Proposta' : 'Criar Proposta'}
          </h1>
          <p className="text-muted-foreground">
            Demanda de {request?.client_name} — {request?.destination || 'Destino não definido'}
          </p>
        </div>
      </div>

      {/* Request summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Resumo da Demanda</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {request?.destination && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />{request.destination}</span>
          )}
          {request?.travelers_count && (
            <span className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" />{request.travelers_count} viajante(s)</span>
          )}
          {travelDates?.start && (
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(travelDates.start), 'dd/MM/yyyy')}</span>
          )}
          {request?.budget_range && (
            <span className="text-muted-foreground">Orçamento: {request.budget_range}</span>
          )}
        </CardContent>
      </Card>

      {/* Proposal form */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Proposta</CardTitle>
          <CardDescription>Preencha os detalhes da proposta de viagem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pacote Fernando de Noronha 5 dias" />
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Agência Responsável</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Guatá (operação própria)</SelectItem>
                {agencies?.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Descreva os detalhes da proposta..." />
          </div>

          <div className="space-y-2">
            <Label>Inclusões (uma por linha)</Label>
            <Textarea value={inclusions} onChange={e => setInclusions(e.target.value)} rows={4} placeholder="Hospedagem 4 noites&#10;Transfer aeroporto&#10;Passeio de barco" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Link de Pagamento PIX</Label>
              <Input value={pixLink} onChange={e => setPixLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Link de Pagamento Cartão</Label>
              <Input value={cardLink} onChange={e => setCardLink(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status do Pagamento</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {existingProposal ? 'Salvar Alterações' : 'Criar Proposta'}
            </Button>
            {existingProposal && ['approved', 'in_operation', 'completed'].includes(request?.status || '') && (
              <Button variant="outline" asChild>
                <Link to={`/admin/demandas/${requestId}/roteiro`}>
                  <Route className="mr-2 h-4 w-4" />
                  Ver Roteiro
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

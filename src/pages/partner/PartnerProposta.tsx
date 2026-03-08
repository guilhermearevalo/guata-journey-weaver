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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, MapPin, Users, Calendar, Route, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PartnerProposta() {
  const { id: requestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  // Buscar agência do parceiro
  const { data: agencyData } = useQuery({
    queryKey: ['partner-agency', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_users')
        .select('agency_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar detalhes da demanda
  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['travel-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('id', requestId!)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  // Buscar proposta existente
  const { data: existingProposal, isLoading: proposalLoading } = useQuery({
    queryKey: ['proposal', requestId, agencyData?.agency_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('request_id', requestId!)
        .eq('agency_id', agencyData!.agency_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!requestId && !!agencyData?.agency_id,
  });

  // Preencher formulário com proposta existente
  useEffect(() => {
    if (existingProposal) {
      setTitle(existingProposal.title || '');
      setDescription(existingProposal.description || '');
      setTotalPrice(existingProposal.total_price?.toString() || '');
      setInclusions(existingProposal.inclusions?.join('\n') || '');
      setPaymentStatus((existingProposal as any).payment_status || 'pending');
      setPaymentEnabled((existingProposal as any).payment_enabled || false);
      setAccessCode((existingProposal as any).access_code || '');
    } else if (request) {
      setTitle(`Proposta de Viagem - ${request.destination || 'Destino Personalizado'}`);
    }
  }, [existingProposal, request]);

  // Mutation para salvar proposta
  const saveMutation = useMutation({
    mutationFn: async () => {
      const inclusionsArray = inclusions
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const proposalData = {
        request_id: requestId!,
        agency_id: agencyData!.agency_id,
        created_by: user!.id,
        title,
        description,
        total_price: totalPrice ? parseFloat(totalPrice) : null,
        inclusions: inclusionsArray.length > 0 ? inclusionsArray : null,
        payment_enabled: paymentEnabled,
        access_code: accessCode.trim() || null,
      } as any;

      if (existingProposal) {
        const { error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', existingProposal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('proposals')
          .insert(proposalData);
        if (error) throw error;

        // Atualizar status da demanda para proposal_sent
        await supabase
          .from('travel_requests')
          .update({ status: 'proposal_sent' })
          .eq('id', requestId!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal'] });
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['partner-proposals'] });
      toast({
        title: existingProposal ? 'Proposta atualizada!' : 'Proposta enviada!',
        description: 'As informações foram salvas com sucesso.',
      });
      navigate('/partner/demandas');
    },
    onError: (error) => {
      console.error('Error saving proposal:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a proposta. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para a proposta.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não definida';
    try {
      return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const isLoading = requestLoading || proposalLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/partner/demandas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {existingProposal ? 'Editar Proposta' : 'Criar Proposta'}
          </h1>
          <p className="text-muted-foreground">
            {request?.client_name ? `Para: ${request.client_name}` : 'Carregando...'}
          </p>
        </div>
        {existingProposal?.is_approved && (
          <Button variant="outline" className="ml-auto" onClick={() => navigate(`/partner/proposta/${requestId}/roteiro`)}>
            <Route className="mr-2 h-4 w-4" />Ver Roteiro
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário da Proposta */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detalhes da Proposta</CardTitle>
              <CardDescription>
                Preencha as informações da proposta de viagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Proposta *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Roteiro Exclusivo para Fernando de Noronha"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva a experiência proposta, os diferenciais e o que o cliente pode esperar..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Valor Total (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inclusions">
                    Inclusões (uma por linha)
                  </Label>
                  <Textarea
                    id="inclusions"
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    placeholder={`Passagem aérea ida e volta\nHospedagem 5 noites\nTransfer aeroporto/hotel\nCafé da manhã`}
                    rows={6}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Habilitar Pagamento</Label>
                      <p className="text-xs text-muted-foreground">
                        Quando ativado, o cliente poderá pagar via Stripe na proposta pública.
                      </p>
                    </div>
                    <Switch checked={paymentEnabled} onCheckedChange={setPaymentEnabled} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessCode" className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />Código de Acesso ao Roteiro
                    </Label>
                    <Input
                      id="accessCode"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Ex: NORONHA2026 (deixe vazio para acesso livre)"
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se definido, o cliente precisará informar este código para visualizar o roteiro.
                    </p>
                  </div>

                  {existingProposal && (
                    <div className="space-y-2">
                      <Label>Status do Pagamento</Label>
                      <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-sm">
                        {paymentStatus === 'paid' ? 'Pago' : paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">O status é atualizado automaticamente pelo sistema de pagamento.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/partner/demandas')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    {existingProposal ? 'Salvar Alterações' : 'Enviar Proposta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Resumo da Demanda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo da Demanda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Destino</p>
                  <p className="text-sm text-muted-foreground">
                    {request?.destination || 'Não definido'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Viajantes</p>
                  <p className="text-sm text-muted-foreground">
                    {request?.travelers_count || 1} pessoa(s)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Período</p>
                  <p className="text-sm text-muted-foreground">
                    {request?.travel_dates && typeof request.travel_dates === 'object' && 'start' in request.travel_dates
                      ? `${formatDate(request.travel_dates.start as string)} - ${formatDate((request.travel_dates as { end?: string }).end)}`
                      : 'Datas flexíveis'}
                  </p>
                </div>
              </div>

              {request?.budget_range && (
                <div>
                  <p className="text-sm font-medium">Orçamento</p>
                  <p className="text-sm text-muted-foreground">{request.budget_range}</p>
                </div>
              )}

              {request?.special_requests && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Pedidos Especiais</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {request.special_requests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

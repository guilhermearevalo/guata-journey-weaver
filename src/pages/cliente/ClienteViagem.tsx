import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Users, MapPin, DollarSign, CheckCircle, Clock, FileText, CreditCard, QrCode, Route } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TravelDocumentsVault, { TravelDocument } from '@/components/itinerary/TravelDocumentsVault';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_analysis: 'Em Análise',
  proposal_sent: 'Proposta Enviada',
  approved: 'Aprovado',
  in_operation: 'Em Operação',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  in_analysis: 'bg-blue-500/10 text-blue-600',
  proposal_sent: 'bg-purple-500/10 text-purple-600',
  approved: 'bg-green-500/10 text-green-600',
  in_operation: 'bg-cyan-500/10 text-cyan-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pagamento Pendente', className: 'bg-yellow-500/10 text-yellow-600' },
  partial: { label: 'Pagamento Parcial', className: 'bg-orange-500/10 text-orange-600' },
  paid: { label: 'Pago', className: 'bg-green-500/10 text-green-600' },
};

export default function ClienteViagem() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['client-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('id', id!)
        .eq('client_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['client-request-proposals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('request_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const approvedProposal = proposals?.find(proposal => proposal.is_approved) || proposals?.[0];

  const { data: travelDocuments = [] } = useQuery({
    queryKey: ['client-travel-documents', approvedProposal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_documents' as any)
        .select('*')
        .eq('proposal_id', approvedProposal!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TravelDocument[];
    },
    enabled: !!approvedProposal?.id,
  });

  const approveProposal = useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('proposals')
        .update({ is_approved: true })
        .eq('id', proposalId);
      if (error) throw error;
      await supabase
        .from('travel_requests')
        .update({ status: 'approved' })
        .eq('id', id!);
    },
    onSuccess: () => {
      toast({ title: 'Proposta aprovada!', description: 'Nossa equipe entrará em contato para os próximos passos.' });
      queryClient.invalidateQueries({ queryKey: ['client-request', id] });
      queryClient.invalidateQueries({ queryKey: ['client-request-proposals', id] });
    },
    onError: () => {
      toast({ title: 'Erro ao aprovar proposta', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    },
  });

  if (requestLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">Solicitação não encontrada</p>
        <Button className="mt-4" asChild><Link to="/minha-conta/viagens">Voltar para Viagens</Link></Button>
      </div>
    );
  }

  const travelDates = request.travel_dates as { start?: string; end?: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/minha-conta/viagens"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{request.destination || 'Destino não definido'}</h2>
          <p className="text-muted-foreground">Solicitado em {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <Badge className={`ml-auto ${statusColors[request.status]}`}>{statusLabels[request.status]}</Badge>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader><CardTitle>Detalhes da Solicitação</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-sm text-muted-foreground">Destino</p><p className="font-medium">{request.destination || 'Não informado'}</p></div>
          </div>
          {travelDates?.start && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="font-medium">
                  {format(new Date(travelDates.start), "dd/MM/yyyy")}
                  {travelDates?.end && ` - ${format(new Date(travelDates.end), "dd/MM/yyyy")}`}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-sm text-muted-foreground">Viajantes</p><p className="font-medium">{request.travelers_count || 1} pessoa(s)</p></div>
          </div>
          {request.budget_range && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div><p className="text-sm text-muted-foreground">Orçamento</p><p className="font-medium">{request.budget_range}</p></div>
            </div>
          )}
        </CardContent>
        {request.special_requests && (
          <><Separator /><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pedidos especiais</p><p className="mt-1">{request.special_requests}</p></CardContent></>
        )}
      </Card>

      {/* Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Propostas Recebidas</CardTitle>
          <CardDescription>
            {proposals?.length ? `${proposals.length} proposta(s) para sua viagem` : 'Aguardando propostas dos nossos parceiros'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proposalsLoading ? (
            <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : proposals && proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map(proposal => {
                const ps = (proposal as any).payment_status as string | undefined;
                const paymentInfo = paymentStatusLabels[ps || 'pending'];
                return (
                  <div key={proposal.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{proposal.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Recebida em {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {proposal.is_approved && paymentInfo && (
                          <Badge className={paymentInfo.className}>{paymentInfo.label}</Badge>
                        )}
                        {proposal.is_approved ? (
                          <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Aprovada</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>
                        )}
                      </div>
                    </div>
                    
                    {proposal.description && <p className="text-sm">{proposal.description}</p>}

                    {proposal.total_price && (
                      <p className="text-lg font-bold text-primary">
                        R$ {proposal.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}

                    {proposal.inclusions && proposal.inclusions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Inclui:</p>
                        <ul className="text-sm space-y-1">
                          {proposal.inclusions.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" />{item}</li>
                          ))}
                          {proposal.inclusions.length > 4 && <li className="text-muted-foreground">+{proposal.inclusions.length - 4} itens</li>}
                        </ul>
                      </div>
                    )}

                    {!proposal.is_approved && (
                      <Button className="w-full" onClick={() => approveProposal.mutate(proposal.id)} disabled={approveProposal.isPending}>
                        Aprovar Proposta
                      </Button>
                    )}

                    {proposal.is_approved && (
                      <div className="space-y-2">
                        {(() => {
                          const pl = proposal.payment_links as { pix?: string; card?: string } | null;
                          return (
                            <>
                              {pl?.pix && (
                                <Button className="w-full" variant="outline" onClick={() => window.open(pl.pix!, '_blank')}>
                                  <QrCode className="mr-2 h-4 w-4" />Pagar com PIX
                                </Button>
                              )}
                              {pl?.card && (
                                <Button className="w-full" variant="outline" onClick={() => window.open(pl.card!, '_blank')}>
                                  <CreditCard className="mr-2 h-4 w-4" />Pagar com Cartão
                                </Button>
                              )}
                              <Button className="w-full" variant="secondary" asChild>
                                <Link to={`/minha-conta/viagem/${id}/roteiro`}>
                                  <Route className="mr-2 h-4 w-4" />Planejar Roteiro
                                </Link>
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Ainda não há propostas para esta solicitação.</p>
              <p className="text-sm text-muted-foreground">Nossa equipe está trabalhando para encontrar as melhores opções.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

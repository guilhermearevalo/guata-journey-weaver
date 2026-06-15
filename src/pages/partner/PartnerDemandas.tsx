import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, MapPin, Users, Calendar, FileText, Plus, Mail, Phone, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface TravelRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  destination: string | null;
  status: string;
  travelers_count: number | null;
  travel_dates: { start?: string; end?: string } | null;
  budget_range: string | null;
  special_requests: string | null;
  preferences: Record<string, unknown> | null;
  created_at: string;
}

export default function PartnerDemandas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);

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

  const agencyId = agencyData?.agency_id;

  const { data: requests, isLoading } = useQuery({
    queryKey: ['partner-requests', agencyId, searchTerm],
    enabled: !!agencyId,
    refetchOnMount: 'always',
    queryFn: async () => {
      let query = supabase
        .from('travel_requests')
        .select('*')
        .eq('assigned_agency_id', agencyId!)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`client_name.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TravelRequest[];
    },
  });

  const { data: proposals } = useQuery({
    queryKey: ['partner-proposals', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, request_id')
        .eq('agency_id', agencyId!);
      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, newStatus }: { requestId: string; newStatus: 'in_operation' | 'completed' }) => {
      const { error } = await supabase
        .from('travel_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-requests'] });
      toast({ title: 'Status atualizado com sucesso!' });
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const hasProposal = (requestId: string) =>
    proposals?.some(p => p.request_id === requestId);

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
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_analysis: 'bg-blue-100 text-blue-800 border-blue-200',
    proposal_sent: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    in_operation: 'bg-orange-100 text-orange-800 border-orange-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não definida';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const canStartOperation = (status: string) =>
    status === 'proposal_sent' || status === 'approved';

  const canComplete = (status: string) => status === 'in_operation';

  const StatusActions = ({ request }: { request: TravelRequest }) => (
    <div className="flex gap-2">
      {canStartOperation(request.status) && (
        <Button
          size="sm"
          variant="outline"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
          onClick={(e) => {
            e.stopPropagation();
            updateStatusMutation.mutate({ requestId: request.id, newStatus: 'in_operation' });
          }}
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          Iniciar Operação
        </Button>
      )}
      {canComplete(request.status) && (
        <Button
          size="sm"
          variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          onClick={(e) => {
            e.stopPropagation();
            updateStatusMutation.mutate({ requestId: request.id, newStatus: 'completed' });
          }}
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
          Concluir
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demandas Atribuídas</h1>
        <p className="text-muted-foreground">
          Gerencie as solicitações de viagem atribuídas à sua agência.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedRequest(request)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{request.client_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {request.destination || 'Destino não definido'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusColors[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {request.travelers_count || 1} viajante(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {request.travel_dates?.start
                      ? format(new Date(request.travel_dates.start), 'dd/MM/yyyy')
                      : 'A definir'}
                  </span>
                </div>
                {request.budget_range && (
                  <p className="text-sm">
                    <span className="font-medium">Orçamento:</span> {request.budget_range}
                  </p>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <StatusActions request={request} />
                  {hasProposal(request.id) ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/partner/proposta/${request.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Proposta
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full" asChild>
                      <Link to={`/partner/proposta/${request.id}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Proposta
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhuma demanda encontrada</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {searchTerm
                ? 'Tente ajustar sua busca.'
                : 'Quando novas demandas forem atribuídas à sua agência, elas aparecerão aqui.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Demanda</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação de viagem
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                  <p className="font-medium">{selectedRequest.client_name}</p>
                  <div className="flex flex-col gap-1 mt-1">
                    <a href={`mailto:${selectedRequest.client_email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <Mail className="h-3.5 w-3.5" />{selectedRequest.client_email}
                    </a>
                    {selectedRequest.client_phone && (
                      <a href={`tel:${selectedRequest.client_phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Phone className="h-3.5 w-3.5" />{selectedRequest.client_phone}
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destino</label>
                  <p>{selectedRequest.destination || 'Não definido'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Viajantes</label>
                  <p>{selectedRequest.travelers_count || 1} pessoa(s)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Orçamento</label>
                  <p>{selectedRequest.budget_range || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Ida</label>
                  <p>{formatDate(selectedRequest.travel_dates?.start)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Volta</label>
                  <p>{formatDate(selectedRequest.travel_dates?.end)}</p>
                </div>
              </div>

              {selectedRequest.special_requests && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pedidos Especiais</label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg">
                    {selectedRequest.special_requests}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <StatusActions request={selectedRequest} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Fechar
                  </Button>
                  <Button asChild>
                    <Link to={`/partner/proposta/${selectedRequest.id}`}>
                      {hasProposal(selectedRequest.id) ? 'Ver Proposta' : 'Criar Proposta'}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plane, FileText, MessageCircle, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function ClienteDashboard() {
  const { user } = useAuth();

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['client-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: proposals } = useQuery({
    queryKey: ['client-proposals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, travel_requests!inner(client_id)')
        .eq('travel_requests.client_id', user!.id)
        .eq('is_approved', false);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['client-unread-messages', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const activeRequests = requests?.filter(r => 
    !['completed', 'cancelled'].includes(r.status)
  ).length || 0;

  const pendingProposals = proposals?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Acompanhe suas viagens e propostas
          </p>
        </div>
        <Button asChild>
          <Link to="/viagem-personalizada">
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Viagens Ativas</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              solicitações em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propostas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProposals}</div>
            <p className="text-xs text-muted-foreground">
              aguardando sua aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages || 0}</div>
            <p className="text-xs text-muted-foreground">
              não lidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimas Solicitações</CardTitle>
              <CardDescription>Suas viagens mais recentes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/minha-conta/viagens">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map(request => (
                <Link
                  key={request.id}
                  to={`/minha-conta/viagem/${request.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {request.destination || 'Destino não definido'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={statusColors[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plane className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Você ainda não tem solicitações de viagem.
              </p>
              <Button className="mt-4" asChild>
                <Link to="/viagem-personalizada">
                  Solicitar Viagem
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

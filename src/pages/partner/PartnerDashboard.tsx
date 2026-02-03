import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerDashboard() {
  const { user } = useAuth();

  // Buscar agência do parceiro
  const { data: agencyData } = useQuery({
    queryKey: ['partner-agency', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_users')
        .select('agency_id, partner_agencies(id, name)')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const agencyId = agencyData?.agency_id;

  // Buscar estatísticas de demandas atribuídas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['partner-stats', agencyId],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('travel_requests')
        .select('id, status')
        .eq('assigned_agency_id', agencyId!);

      if (error) throw error;

      const total = requests?.length || 0;
      const pending = requests?.filter(r => r.status === 'pending' || r.status === 'in_analysis').length || 0;
      const proposalSent = requests?.filter(r => r.status === 'proposal_sent').length || 0;
      const completed = requests?.filter(r => r.status === 'completed').length || 0;

      return { total, pending, proposalSent, completed };
    },
    enabled: !!agencyId,
  });

  // Buscar demandas recentes
  const { data: recentRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['partner-recent-requests', agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('id, client_name, destination, status, created_at')
        .eq('assigned_agency_id', agencyId!)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const agencyName = agencyData?.partner_agencies && typeof agencyData.partner_agencies === 'object' 
    ? (agencyData.partner_agencies as { name: string }).name 
    : 'Sua Agência';

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
    pending: 'text-yellow-600 bg-yellow-100',
    in_analysis: 'text-blue-600 bg-blue-100',
    proposal_sent: 'text-purple-600 bg-purple-100',
    approved: 'text-green-600 bg-green-100',
    in_operation: 'text-orange-600 bg-orange-100',
    completed: 'text-emerald-600 bg-emerald-100',
    cancelled: 'text-red-600 bg-red-100',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo, {agencyName}!</h1>
        <p className="text-muted-foreground">
          Acompanhe suas demandas e gerencie suas propostas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Demandas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Proposta</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats?.proposalSent || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Demandas Recentes</CardTitle>
            <CardDescription>Últimas solicitações atribuídas a você</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/partner/demandas">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentRequests && recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{request.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.destination || 'Destino não definido'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[request.status] || 'text-gray-600 bg-gray-100'
                      }`}
                    >
                      {statusLabels[request.status] || request.status}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/partner/demandas?id=${request.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-50 mb-3" />
              <p>Nenhuma demanda atribuída ainda.</p>
              <p className="text-sm">Novas solicitações aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

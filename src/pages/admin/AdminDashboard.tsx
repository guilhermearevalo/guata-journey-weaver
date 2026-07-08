import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchTravelRequests } from '@/lib/fetchTravelRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Compass, Users, Building2, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const demandRoute = '/admin/demandas';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [requests, experiences, profiles, agencies] = await Promise.all([
        supabase.from('travel_requests').select('id, status', { count: 'exact' }),
        supabase.from('experiences').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('partner_agencies').select('id', { count: 'exact' }),
      ]);

      const pendingRequests = requests.data?.filter(r => r.status === 'pending').length || 0;

      return {
        totalRequests: requests.count || 0,
        pendingRequests,
        totalExperiences: experiences.count || 0,
        totalClients: profiles.count || 0,
        totalAgencies: agencies.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Demandas Pendentes',
      value: stats?.pendingRequests || 0,
      icon: Clock,
      href: demandRoute,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Total de Demandas',
      value: stats?.totalRequests || 0,
      icon: ClipboardList,
      href: '/admin/demandas',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Experiências',
      value: stats?.totalExperiences || 0,
      icon: Compass,
      href: '/admin/experiencias',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Clientes',
      value: stats?.totalClients || 0,
      icon: Users,
      href: '/admin/clientes',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Agências Parceiras',
      value: stats?.totalAgencies || 0,
      icon: Building2,
      href: '/admin/parceiros',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da operação Guatá</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              to={demandRoute}
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <p className="font-medium">Ver demandas pendentes</p>
              <p className="text-sm text-muted-foreground">
                {stats?.pendingRequests || 0} solicitações aguardando análise
              </p>
            </Link>
            <Link 
              to="/admin/experiencias?nova=1" 
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <p className="font-medium">Criar nova experiência</p>
              <p className="text-sm text-muted-foreground">
                Adicionar pacote ou excursão ao catálogo
              </p>
            </Link>
            <Link 
              to="/admin/cms" 
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <p className="font-medium">Gerenciar conteúdo do site</p>
              <p className="text-sm text-muted-foreground">
                Editar páginas institucionais
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Demandas</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentRequests />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RecentRequests = () => {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['recent-requests'],
    queryFn: async () => {
      const all = await fetchTravelRequests();
      return all.slice(0, 5).map((r) => ({
        id: r.id,
        client_name: r.client_name,
        destination: r.destination,
        status: r.status,
        created_at: r.created_at,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma demanda encontrada
      </p>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_analysis: 'Em Análise',
    proposal_sent: 'Proposta Enviada',
    approved: 'Aprovado',
    in_operation: 'Em Operação',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Link
          key={request.id}
          to={`${demandRoute}?demanda=${request.id}`}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
        >
          <div>
            <p className="font-medium text-sm">{request.client_name}</p>
            <p className="text-xs text-muted-foreground">
              {request.destination || 'Destino não definido'}
            </p>
          </div>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
            {statusLabels[request.status] || request.status}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default AdminDashboard;

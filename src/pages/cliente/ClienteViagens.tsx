import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plane, Search, Plus, Calendar, Users, MapPin } from 'lucide-react';
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

export default function ClienteViagens() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['client-all-requests', user?.id],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredRequests = requests?.filter(request => {
    const matchesSearch = !search || 
      (request.destination?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Minhas Viagens</h2>
          <p className="text-muted-foreground">
            Todas as suas solicitações de viagem
          </p>
        </div>
        <Button asChild>
          <Link to="/viagem-personalizada">
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredRequests && filteredRequests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRequests.map(request => {
            const travelDates = request.travel_dates as { start?: string; end?: string } | null;
            return (
              <Card key={request.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {request.destination || 'Destino não definido'}
                      </CardTitle>
                      <CardDescription>
                        Solicitado em {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {travelDates?.start && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(travelDates.start), "dd/MM/yyyy")}
                        {travelDates?.end && ` - ${format(new Date(travelDates.end), "dd/MM/yyyy")}`}
                      </div>
                    )}
                    {request.travelers_count && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {request.travelers_count} viajante{request.travelers_count > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/minha-conta/viagem/${request.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Plane className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Nenhuma viagem encontrada</p>
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Você ainda não fez nenhuma solicitação de viagem'}
            </p>
            <Button className="mt-4" asChild>
              <Link to="/viagem-personalizada">
                Solicitar Viagem
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

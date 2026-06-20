import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { RequestDetailDialog } from './RequestDetailDialog';
import { KanbanFilters } from './KanbanFilters';
import { NewRequestDialog } from './NewRequestDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { fetchTravelRequests } from '@/lib/fetchTravelRequests';
import { fetchProposalRequestIds } from '@/lib/fetchProposals';

type RequestStatus = Enums<'request_status'>;

interface Column {
  id: RequestStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: 'Pendente', color: 'amber' },
  { id: 'in_analysis', title: 'Em Análise', color: 'blue' },
  { id: 'proposal_sent', title: 'Proposta Enviada', color: 'purple' },
  { id: 'approved', title: 'Aprovada', color: 'green' },
  { id: 'in_operation', title: 'Em Operação', color: 'orange' },
  { id: 'completed', title: 'Concluída', color: 'gray' },
  { id: 'cancelled', title: 'Cancelada', color: 'red' },
];

const statusFilterLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  in_analysis: 'Em Análise',
  proposal_sent: 'Proposta Enviada',
  approved: 'Aprovada',
  in_operation: 'Em Operação',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export function KanbanBoard() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequest, setSelectedRequest] = useState<Tables<'travel_requests'> | null>(null);
  const [filterAgency, setFilterAgency] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const requestedStatus = searchParams.get('status') as RequestStatus | null;
  const requestedDemandId = searchParams.get('demanda');

  const { data: requests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['travel_requests', user?.id],
    queryFn: fetchTravelRequests,
    enabled: !!user && !authLoading,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-travel-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'travel_requests' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['travel_requests', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase
        .from('travel_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests', user?.id] });
      toast({
        title: 'Status atualizado',
        description: 'A demanda foi movida com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível mover a demanda.',
        variant: 'destructive',
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    e.dataTransfer.setData('requestId', requestId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const requestId = e.dataTransfer.getData('requestId');
    if (requestId) {
      updateStatusMutation.mutate({ id: requestId, status: status as RequestStatus });
    }
  };

  const { data: proposalRequestIds } = useQuery({
    queryKey: ['proposal-request-ids'],
    queryFn: fetchProposalRequestIds,
    enabled: !!user && !authLoading,
    staleTime: 30_000,
  });

  const { data: proposalMap } = useQuery({
    queryKey: ['proposals-payment-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('request_id, payment_status');
      if (error) throw error;
      const map = new Map<string, string>();
      data?.forEach((p) => map.set(p.request_id, p.payment_status || 'pending'));
      return map;
    },
    enabled: filterPayment !== 'all',
  });

  const getRequestsByStatus = (status: RequestStatus) => {
    let filtered = requests?.filter((r) => r.status === status) || [];
    if (filterAgency === 'none') {
      filtered = filtered.filter((r) => !r.assigned_agency_id);
    } else if (filterAgency !== 'all') {
      filtered = filtered.filter((r) => r.assigned_agency_id === filterAgency);
    }
    if (filterPayment !== 'all' && proposalMap) {
      filtered = filtered.filter((r) => proposalMap.get(r.id) === filterPayment);
    }
    return filtered;
  };

  const visibleColumns = useMemo(() => {
    if (requestedStatus && columns.some((column) => column.id === requestedStatus)) {
      return columns.filter((column) => column.id === requestedStatus);
    }

    return columns;
  }, [requestedStatus]);

  useEffect(() => {
    if (!requestedDemandId || !requests?.length) return;

    const match = requests.find((request) => request.id === requestedDemandId);
    if (match) {
      setSelectedRequest(match);
    }
  }, [requestedDemandId, requests]);

  const handleSelectRequest = (request: Tables<'travel_requests'>) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('demanda', request.id);
    setSearchParams(nextParams, { replace: true });
    setSelectedRequest(request);
  };

  const handleDialogChange = (open: boolean) => {
    if (open) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('demanda');
    setSearchParams(nextParams, { replace: true });
    setSelectedRequest(null);
  };

  const clearStatusFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    setSearchParams(nextParams, { replace: true });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[280px]">
            <Skeleton className="h-10 rounded-t-lg" />
            <div className="space-y-3 p-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao carregar demandas. Rode docs/fix_travel_requests_500.sql no Supabase.';
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-xs text-muted-foreground">
          SQL Editor → execute <strong>docs/fix_travel_requests_500.sql</strong>
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      {requestedStatus && columns.some((column) => column.id === requestedStatus) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Badge variant="outline" className="border-amber-300 bg-white">
            Filtrando por status
          </Badge>
          <span>
            Mostrando apenas: <strong>{statusFilterLabels[requestedStatus]}</strong>
          </span>
          <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={clearStatusFilter}>
            <X className="mr-1 h-3 w-3" />
            Ver todas as demandas
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <KanbanFilters
            agencyId={filterAgency}
            paymentStatus={filterPayment}
            onAgencyChange={setFilterAgency}
            onPaymentStatusChange={setFilterPayment}
            onClear={() => {
              setFilterAgency('all');
              setFilterPayment('all');
            }}
          />
          <Badge variant="secondary">{requests?.length ?? 0} demandas</Badge>
        </div>
        <NewRequestDialog />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 mt-4">
        {visibleColumns.map((column) => {
          const columnRequests = getRequestsByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnRequests.length}
              color={column.color}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {columnRequests.map((request) => (
                <KanbanCard
                  key={request.id}
                  request={request}
                  hasProposal={proposalRequestIds?.has(request.id) ?? false}
                  onDragStart={handleDragStart}
                  onClick={() => handleSelectRequest(request)}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}

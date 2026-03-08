import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Enums } from '@/integrations/supabase/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { RequestDetailDialog } from './RequestDetailDialog';
import { KanbanFilters } from './KanbanFilters';
import { NewRequestDialog } from './NewRequestDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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

export function KanbanBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<Tables<'travel_requests'> | null>(null);
  const [filterAgency, setFilterAgency] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['travel_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tables<'travel_requests'>[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase
        .from('travel_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
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

  // Fetch proposals for payment filter
  const { data: proposalMap } = useQuery({
    queryKey: ['proposals-payment-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('request_id, payment_status');
      if (error) throw error;
      const map = new Map<string, string>();
      data?.forEach(p => map.set(p.request_id, p.payment_status || 'pending'));
      return map;
    },
    enabled: filterPayment !== 'all',
  });

  const getRequestsByStatus = (status: RequestStatus) => {
    let filtered = requests?.filter(r => r.status === status) || [];
    if (filterAgency === 'none') {
      filtered = filtered.filter(r => !r.assigned_agency_id);
    } else if (filterAgency !== 'all') {
      filtered = filtered.filter(r => r.assigned_agency_id === filterAgency);
    }
    if (filterPayment !== 'all' && proposalMap) {
      filtered = filtered.filter(r => proposalMap.get(r.id) === filterPayment);
    }
    return filtered;
  };

  if (isLoading) {
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

  return (
    <>
      <KanbanFilters
        agencyId={filterAgency}
        paymentStatus={filterPayment}
        onAgencyChange={setFilterAgency}
        onPaymentStatusChange={setFilterPayment}
        onClear={() => { setFilterAgency('all'); setFilterPayment('all'); }}
      />
      <div className="flex gap-4 overflow-x-auto pb-4 mt-4">
        {columns.map((column) => {
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
                  onDragStart={handleDragStart}
                  onClick={() => setSelectedRequest(request)}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </>
  );
}

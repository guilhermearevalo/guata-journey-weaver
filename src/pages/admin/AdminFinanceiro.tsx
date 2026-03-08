import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const paymentLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  partial: { label: 'Parcial', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'default' },
};

const AdminFinanceiro = () => {
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['financial-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id, title, total_price, payment_status, is_approved, created_at, updated_at,
          agency_id
        `)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_agencies').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['requests-map-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('id, client_name');
      if (error) throw error;
      return data;
    },
  });

  // Join proposals with request info
  const { data: proposalRequests } = useQuery({
    queryKey: ['proposal-requests-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, request_id');
      if (error) throw error;
      return data;
    },
  });

  const agencyMap = new Map(agencies?.map(a => [a.id, a.name]) || []);
  const requestMap = new Map(requests?.map(r => [r.id, r.client_name]) || []);
  const proposalRequestMap = new Map(proposalRequests?.map(p => [p.id, p.request_id]) || []);

  const approvedProposals = proposals?.filter(p => p.is_approved) || [];
  const totalRevenue = approvedProposals.reduce((s, p) => s + (p.total_price || 0), 0);
  const paidRevenue = approvedProposals.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.total_price || 0), 0);
  const pendingRevenue = approvedProposals.filter(p => p.payment_status !== 'paid').reduce((s, p) => s + (p.total_price || 0), 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Resumo de receita e pagamentos</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total (Aprovadas)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Paga</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmt(paidRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagamento Pendente</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{fmt(pendingRevenue)}</p></CardContent>
        </Card>
      </div>

      {/* Proposals table */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas Aprovadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Pagamento</TableHead>
                <TableHead>Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma proposta aprovada
                  </TableCell>
                </TableRow>
              ) : (
                approvedProposals.map((p) => {
                  const ps = paymentLabels[p.payment_status || 'pending'] || paymentLabels.pending;
                  const requestId = proposalRequestMap.get(p.id);
                  const clientName = requestId ? requestMap.get(requestId) : '—';
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{clientName || '—'}</TableCell>
                      <TableCell>{agencyMap.get(p.agency_id || '') || 'Guatá (direto)'}</TableCell>
                      <TableCell className="text-right">{fmt(p.total_price || 0)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(p.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinanceiro;

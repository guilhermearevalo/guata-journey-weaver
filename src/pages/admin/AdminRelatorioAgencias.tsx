import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, TrendingUp, DollarSign, ClipboardList } from 'lucide-react';

const AdminRelatorioAgencias = () => {
  const [period, setPeriod] = useState<string>('all');

  const { data: agencies, isLoading: loadingAgencies } = useQuery({
    queryKey: ['all-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_agencies')
        .select('id, name, commission_rate, is_active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['all-requests-report', period],
    queryFn: async () => {
      let query = supabase
        .from('travel_requests')
        .select('id, assigned_agency_id, status, created_at')
        .not('assigned_agency_id', 'is', null);

      if (period !== 'all') {
        const now = new Date();
        const start = new Date();
        if (period === '30d') start.setDate(now.getDate() - 30);
        else if (period === '90d') start.setDate(now.getDate() - 90);
        else if (period === '12m') start.setMonth(now.getMonth() - 12);
        query = query.gte('created_at', start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: proposals } = useQuery({
    queryKey: ['all-proposals-report', period],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('id, agency_id, total_price, is_approved, payment_status, created_at');

      if (period !== 'all') {
        const now = new Date();
        const start = new Date();
        if (period === '30d') start.setDate(now.getDate() - 30);
        else if (period === '90d') start.setDate(now.getDate() - 90);
        else if (period === '12m') start.setMonth(now.getMonth() - 12);
        query = query.gte('created_at', start.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const agencyReport = agencies?.map((agency) => {
    const agencyRequests = requests?.filter(r => r.assigned_agency_id === agency.id) || [];
    const agencyProposals = proposals?.filter(p => p.agency_id === agency.id) || [];
    const approvedProposals = agencyProposals.filter(p => p.is_approved);
    const totalRevenue = approvedProposals.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const paidProposals = agencyProposals.filter(p => p.payment_status === 'paid');
    const paidRevenue = paidProposals.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const completedRequests = agencyRequests.filter(r => r.status === 'completed').length;
    const commission = totalRevenue * ((agency.commission_rate || 10) / 100);

    return {
      ...agency,
      totalRequests: agencyRequests.length,
      completedRequests,
      totalProposals: agencyProposals.length,
      approvedProposals: approvedProposals.length,
      totalRevenue,
      paidRevenue,
      commission,
    };
  }) || [];

  const totals = {
    requests: agencyReport.reduce((s, a) => s + a.totalRequests, 0),
    revenue: agencyReport.reduce((s, a) => s + a.totalRevenue, 0),
    paid: agencyReport.reduce((s, a) => s + a.paidRevenue, 0),
    commission: agencyReport.reduce((s, a) => s + a.commission, 0),
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loadingAgencies) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Relatório por Agência</h1>
          <p className="text-muted-foreground">Vendas, receita e comissões por agência parceira</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demandas Atribuídas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totals.requests}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(totals.revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Paga</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmt(totals.paid)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Devidas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{fmt(totals.commission)}</p></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agência</TableHead>
                <TableHead className="text-center">Demandas</TableHead>
                <TableHead className="text-center">Concluídas</TableHead>
                <TableHead className="text-center">Propostas Aprovadas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Comissão (%)</TableHead>
                <TableHead className="text-right">Comissão (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencyReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma agência cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                agencyReport.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.name}
                      {!a.is_active && <Badge variant="outline" className="ml-2 text-xs">Inativa</Badge>}
                    </TableCell>
                    <TableCell className="text-center">{a.totalRequests}</TableCell>
                    <TableCell className="text-center">{a.completedRequests}</TableCell>
                    <TableCell className="text-center">{a.approvedProposals}</TableCell>
                    <TableCell className="text-right">{fmt(a.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-green-600">{fmt(a.paidRevenue)}</TableCell>
                    <TableCell className="text-right">{a.commission_rate || 10}%</TableCell>
                    <TableCell className="text-right text-amber-600 font-medium">{fmt(a.commission)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRelatorioAgencias;

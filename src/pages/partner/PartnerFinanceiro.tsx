import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PartnerFinanceiro() {
  const { user } = useAuth();

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

  const { data: agency } = useQuery({
    queryKey: ['agency-detail', agencyData?.agency_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_agencies')
        .select('name, commission_rate')
        .eq('id', agencyData!.agency_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!agencyData?.agency_id,
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['partner-commissions', agencyData?.agency_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('agency_id', agencyData!.agency_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agencyData?.agency_id,
  });

  const { data: proposals } = useQuery({
    queryKey: ['partner-proposals-map', agencyData?.agency_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title')
        .eq('agency_id', agencyData!.agency_id);
      if (error) throw error;
      return data;
    },
    enabled: !!agencyData?.agency_id,
  });

  const proposalMap = new Map(proposals?.map(p => [p.id, p.title]) || []);

  const totalSold = commissions?.reduce((s, c) => s + (c.gross_amount || 0), 0) || 0;
  const totalReceived = commissions?.filter(c => c.status === 'paid').reduce((s, c) => s + (c.partner_amount || 0), 0) || 0;
  const totalPending = commissions?.filter(c => c.status === 'pending').reduce((s, c) => s + (c.partner_amount || 0), 0) || 0;

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
        <p className="text-muted-foreground">
          Acompanhe suas vendas e repasses — {agency?.name || 'Carregando...'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendido (Bruto)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(totalSold)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmt(totalReceived)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{fmt(totalPending)}</p></CardContent>
        </Card>
      </div>

      {agency && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                Comissão Guatá: <strong>{agency.commission_rate ?? 10}%</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Repasses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposta</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Comissão Guatá</TableHead>
                <TableHead className="text-right">Seu Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!commissions || commissions.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum repasse registrado ainda
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {proposalMap.get(c.proposal_id || '') || 'Proposta'}
                    </TableCell>
                    <TableCell className="text-right">{fmt(c.gross_amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(c.guata_commission)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(c.partner_amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.status === 'paid' ? 'default' : 'outline'}>
                        {c.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.status === 'paid' && c.paid_at
                        ? format(new Date(c.paid_at), 'dd/MM/yyyy', { locale: ptBR })
                        : format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

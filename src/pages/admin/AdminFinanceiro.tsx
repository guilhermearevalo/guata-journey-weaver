import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, CheckCircle2, AlertCircle, Banknote, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AdminFinanceiro = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [transferFilter, setTransferFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [transferNotes, setTransferNotes] = useState('');

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['financial-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, title, total_price, payment_status, is_approved, created_at, updated_at, agency_id, request_id')
        .eq('is_approved', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_agencies').select('id, name, commission_rate');
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['requests-map-financial'],
    queryFn: async () => {
      const { data, error } = await supabase.from('travel_requests').select('id, client_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ['all-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('commission_payments').select('*');
      if (error) throw error;
      return data;
    },
  });

  const agencyMap = new Map(agencies?.map(a => [a.id, a]) || []);
  const requestMap = new Map(requests?.map(r => [r.id, r.client_name]) || []);
  const commissionByProposal = new Map(commissions?.map(c => [c.proposal_id, c]) || []);

  const calculateBreakdown = (totalPrice: number, agencyId: string | null) => {
    const agency = agencyId ? agencyMap.get(agencyId) : null;
    const rate = agency?.commission_rate ?? 10;
    const guataCommission = totalPrice * (rate / 100);
    const partnerAmount = totalPrice - guataCommission;
    return { guataCommission, partnerAmount };
  };

  const filteredProposals = (proposals || []).filter(p => {
    if (agencyFilter !== 'all' && p.agency_id !== agencyFilter) return false;
    if (transferFilter === 'transferred') {
      const c = commissionByProposal.get(p.id);
      if (!c || c.status !== 'paid') return false;
    }
    if (transferFilter === 'pending') {
      const c = commissionByProposal.get(p.id);
      if (c && c.status === 'paid') return false;
    }
    return true;
  });

  const paidProposals = filteredProposals.filter(p => p.payment_status === 'paid');
  const totalRevenue = paidProposals.reduce((s, p) => s + (p.total_price || 0), 0);
  const totalGuataComm = paidProposals.reduce((s, p) => {
    const { guataCommission } = calculateBreakdown(p.total_price || 0, p.agency_id);
    return s + guataCommission;
  }, 0);
  const totalToTransfer = paidProposals
    .filter(p => p.agency_id && !commissionByProposal.get(p.id))
    .reduce((s, p) => {
      const { partnerAmount } = calculateBreakdown(p.total_price || 0, p.agency_id);
      return s + partnerAmount;
    }, 0);

  const registerMutation = useMutation({
    mutationFn: async (proposal: any) => {
      const { guataCommission, partnerAmount } = calculateBreakdown(proposal.total_price, proposal.agency_id);
      const { error } = await supabase.from('commission_payments').insert({
        proposal_id: proposal.id,
        agency_id: proposal.agency_id,
        gross_amount: proposal.total_price,
        stripe_fee: 0,
        guata_commission: parseFloat(guataCommission.toFixed(2)),
        partner_amount: parseFloat(partnerAmount.toFixed(2)),
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: user?.id,
        notes: transferNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-commissions'] });
      toast.success('Repasse registrado com sucesso!');
      setDialogOpen(false);
      setTransferNotes('');
      setSelectedProposal(null);
    },
    onError: () => {
      toast.error('Erro ao registrar repasse.');
    },
  });

  const openTransferDialog = (proposal: any) => {
    setSelectedProposal(proposal);
    setTransferNotes('');
    setDialogOpen(true);
  };

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
        <p className="text-muted-foreground">Receita, comissões e repasses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Paga (Bruto)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão Guatá</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{fmt(totalGuataComm)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repasses Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{fmt(totalToTransfer)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={agencyFilter} onValueChange={setAgencyFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Agência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as agências</SelectItem>
            {agencies?.filter(a => a.id).map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={transferFilter} onValueChange={setTransferFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status repasse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Repasse pendente</SelectItem>
            <SelectItem value="transferred">Repassado</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">A Repassar</TableHead>
                <TableHead className="text-center">Pgto</TableHead>
                <TableHead className="text-center">Repasse</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma proposta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredProposals.map((p) => {
                  const { guataCommission, partnerAmount } = calculateBreakdown(p.total_price || 0, p.agency_id);
                  const clientName = requestMap.get(p.request_id) || '—';
                  const agencyName = p.agency_id ? agencyMap.get(p.agency_id)?.name || '—' : 'Guatá (direto)';
                  const commission = commissionByProposal.get(p.id);
                  const isPaid = p.payment_status === 'paid';
                  const isTransferred = commission?.status === 'paid';

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">{p.title}</TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{agencyName}</TableCell>
                      <TableCell className="text-right">{fmt(p.total_price || 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{isPaid ? fmt(guataCommission) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {isPaid && p.agency_id ? fmt(partnerAmount) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isPaid ? 'default' : 'outline'}>
                          {isPaid ? 'Pago' : p.payment_status === 'partial' ? 'Parcial' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {!p.agency_id ? (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        ) : isTransferred ? (
                          <Badge variant="default" className="bg-green-600">Repassado</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPaid && p.agency_id && !isTransferred && (
                          <Button size="sm" variant="outline" onClick={() => openTransferDialog(p)}>
                            <Banknote className="mr-1 h-3 w-3" />Registrar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Repasse</DialogTitle>
          </DialogHeader>
          {selectedProposal && (() => {
            const { guataCommission, partnerAmount } = calculateBreakdown(
              selectedProposal.total_price || 0, selectedProposal.agency_id
            );
            const agencyName = selectedProposal.agency_id
              ? agencyMap.get(selectedProposal.agency_id)?.name || '—'
              : '—';
            return (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Proposta:</span><span className="font-medium">{selectedProposal.title}</span></div>
                  <div className="flex justify-between"><span>Agência:</span><span className="font-medium">{agencyName}</span></div>
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between"><span>Valor bruto:</span><span>{fmt(selectedProposal.total_price)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Comissão Guatá:</span><span>-{fmt(guataCommission)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-1">
                      <span>Valor a repassar:</span><span className="text-green-600">{fmt(partnerAmount)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    value={transferNotes}
                    onChange={e => setTransferNotes(e.target.value)}
                    placeholder="Ex: PIX enviado em 08/03, comprovante #123..."
                    rows={3}
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => registerMutation.mutate(selectedProposal)}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Repasse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinanceiro;

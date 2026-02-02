import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, Mail, Phone, MapPin, Check, X, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PartnerAgency {
  id: string;
  name: string;
  cnpj: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  commission_rate: number | null;
  is_active: boolean | null;
  created_at: string;
}

const AdminParceiros = () => {
  const [search, setSearch] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<PartnerAgency | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deactivate'; agency: PartnerAgency } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['partner-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PartnerAgency[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('partner_agencies')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do parceiro foi atualizado com sucesso.',
      });
      setConfirmAction(null);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  const activeAgencies = agencies?.filter((a) => a.is_active) || [];
  const pendingAgencies = agencies?.filter((a) => !a.is_active) || [];

  const filteredActive = activeAgencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(search.toLowerCase()) ||
      agency.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pendingAgencies.filter(
    (agency) =>
      agency.name.toLowerCase().includes(search.toLowerCase()) ||
      agency.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  const AgencyRow = ({ agency }: { agency: PartnerAgency }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{agency.name}</p>
            {agency.cnpj && (
              <p className="text-sm text-muted-foreground">{agency.cnpj}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {agency.contact_email}
        </div>
      </TableCell>
      <TableCell>
        {agency.contact_phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {agency.contact_phone}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={agency.is_active ? 'default' : 'secondary'}>
          {agency.is_active ? 'Ativo' : 'Pendente'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedAgency(agency)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            {agency.is_active ? (
              <DropdownMenuItem
                onClick={() => setConfirmAction({ type: 'deactivate', agency })}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => setConfirmAction({ type: 'activate', agency })}
                className="text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Aprovar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Parceiros</h1>
        <p className="text-muted-foreground">
          Gerencie as agências parceiras da plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Parceiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeAgencies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{pendingAgencies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({activeAgencies.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingAgencies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agência</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                  ) : filteredActive.length > 0 ? (
                    filteredActive.map((agency) => (
                      <AgencyRow key={agency.id} agency={agency} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">Nenhum parceiro ativo encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agência</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                  ) : filteredPending.length > 0 ? (
                    filteredPending.map((agency) => (
                      <AgencyRow key={agency.id} agency={agency} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agency Detail Dialog */}
      <Dialog open={!!selectedAgency} onOpenChange={(open) => !open && setSelectedAgency(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              {selectedAgency?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedAgency && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{selectedAgency.cnpj || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão</p>
                  <p className="font-medium">{selectedAgency.commission_rate || 10}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedAgency.contact_email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selectedAgency.contact_phone || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedAgency.address || 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Cadastro</p>
                <p className="font-medium">
                  {format(new Date(selectedAgency.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Badge variant={selectedAgency.is_active ? 'default' : 'secondary'} className="text-sm">
                  {selectedAgency.is_active ? 'Parceiro Ativo' : 'Pendente de Aprovação'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'activate' ? 'Aprovar Parceiro' : 'Desativar Parceiro'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'activate'
                ? `Deseja aprovar a agência "${confirmAction?.agency.name}" como parceira?`
                : `Deseja desativar a agência "${confirmAction?.agency.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmAction?.type === 'activate' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmAction) {
                  toggleActiveMutation.mutate({
                    id: confirmAction.agency.id,
                    isActive: confirmAction.type === 'activate',
                  });
                }
              }}
              disabled={toggleActiveMutation.isPending}
            >
              {confirmAction?.type === 'activate' ? 'Aprovar' : 'Desativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParceiros;

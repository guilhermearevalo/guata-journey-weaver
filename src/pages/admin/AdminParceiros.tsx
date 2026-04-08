import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, Mail, Phone, MapPin, Check, X, Eye, MoreHorizontal, UserPlus, Copy, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
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
  is_external: boolean | null;
  created_at: string;
  responsible_name: string | null;
  website: string | null;
  specialties: string[] | null;
  regions: string[] | null;
  description: string | null;
}

const AdminParceiros = () => {
  const [search, setSearch] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<PartnerAgency | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deactivate'; agency: PartnerAgency } | null>(null);
  const [inviteAgency, setInviteAgency] = useState<PartnerAgency | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteResult, setInviteResult] = useState<{ email: string; temporary_password: string } | null>(null);
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

  const inviteMutation = useMutation({
    mutationFn: async ({ agency_id, email, full_name }: { agency_id: string; email: string; full_name: string }) => {
      const { data, error } = await supabase.functions.invoke('invite-partner', {
        body: { agency_id, email, full_name },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      setInviteResult({ email: data.email, temporary_password: data.temporary_password });
      toast({
        title: 'Conta criada com sucesso!',
        description: 'A agência foi aprovada e o login do parceiro foi criado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleExternalMutation = useMutation({
    mutationFn: async ({ id, is_external }: { id: string; is_external: boolean }) => {
      const { error } = await supabase
        .from('partner_agencies')
        .update({ is_external } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      toast({ title: 'Agência atualizada!' });
    },
  });

  const handleInviteSubmit = () => {
    if (!inviteAgency || !inviteEmail || !inviteName) return;
    inviteMutation.mutate({
      agency_id: inviteAgency.id,
      email: inviteEmail,
      full_name: inviteName,
    });
  };

  const handleCopyPassword = () => {
    if (inviteResult) {
      navigator.clipboard.writeText(inviteResult.temporary_password);
      toast({ title: 'Senha copiada!' });
    }
  };

  const handleCloseInvite = () => {
    setInviteAgency(null);
    setInviteEmail('');
    setInviteName('');
    setInviteResult(null);
  };

  const handleApproveWithInvite = (agency: PartnerAgency) => {
    setInviteAgency(agency);
    setInviteEmail(agency.contact_email);
    setInviteName('');
  };

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
        <div className="flex items-center gap-1.5">
          <Badge variant={agency.is_active ? 'default' : 'secondary'}>
            {agency.is_active ? 'Ativo' : 'Pendente'}
          </Badge>
          {agency.is_external && (
            <Badge variant="outline" className="text-xs">
              Externa
            </Badge>
          )}
        </div>
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
            <DropdownMenuItem onClick={() => toggleExternalMutation.mutate({ id: agency.id, is_external: !agency.is_external })}>
              <Building2 className="mr-2 h-4 w-4" />
              {agency.is_external ? 'Remover marca externa' : 'Marcar como externa'}
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
                onClick={() => handleApproveWithInvite(agency)}
                className="text-green-600"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Aprovar e Criar Login
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
                    Array(3).fill(0).map((_, i) => (
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
                    Array(3).fill(0).map((_, i) => (
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
                <p className="text-sm text-muted-foreground">Responsável</p>
                <p className="font-medium">{selectedAgency.responsible_name || 'Não informado'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">
                  {selectedAgency.website ? (
                    <a href={selectedAgency.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedAgency.website}</a>
                  ) : 'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedAgency.address || 'Não informado'}
                </p>
              </div>

              {selectedAgency.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedAgency.description}</p>
                </div>
              )}

              {selectedAgency.specialties && selectedAgency.specialties.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Especialidades</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgency.specialties.map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAgency.regions && selectedAgency.regions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Regiões de Atuação</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgency.regions.map(r => (
                      <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Confirm Deactivate Dialog */}
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

      {/* Invite Partner Dialog */}
      <Dialog open={!!inviteAgency} onOpenChange={(open) => !open && handleCloseInvite()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Aprovar e Criar Login
            </DialogTitle>
            <DialogDescription>
              Aprovar a agência <strong>{inviteAgency?.name}</strong> e criar automaticamente o acesso ao portal do parceiro.
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                <p className="text-sm font-medium text-green-800">✅ Conta criada com sucesso!</p>
                <div>
                  <Label className="text-xs text-green-700">Email</Label>
                  <p className="font-mono text-sm">{inviteResult.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-green-700">Senha temporária</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono border">
                      {inviteResult.temporary_password}
                    </code>
                    <Button size="icon" variant="outline" onClick={handleCopyPassword}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-green-700">
                  Envie essas credenciais ao responsável da agência. Recomende que a senha seja alterada no primeiro acesso.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseInvite}>Fechar</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-name">Nome do responsável *</Label>
                <Input
                  id="invite-name"
                  placeholder="Nome completo"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-email">Email de login *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@agencia.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInvite}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleInviteSubmit}
                  disabled={!inviteEmail || !inviteName || inviteMutation.isPending}
                >
                  {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aprovar e Criar Conta
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParceiros;

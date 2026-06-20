import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, Mail, Phone, MapPin, Check, X, Eye, MoreHorizontal, UserPlus, Copy, Loader2, Save, Image as ImageIcon, Plus, KeyRound } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  logo_url: string | null;
  cover_image_url?: string | null;
}

const AdminParceiros = () => {
  const [search, setSearch] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<PartnerAgency | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deactivate'; agency: PartnerAgency } | null>(null);
  const [inviteAgency, setInviteAgency] = useState<PartnerAgency | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteResult, setInviteResult] = useState<{ email: string; temporary_password: string } | null>(null);
  const [newAgencyOpen, setNewAgencyOpen] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    name: '',
    contact_email: '',
    responsible_name: '',
    contact_phone: '',
    cnpj: '',
    createLogin: true,
  });
  const [resetAgency, setResetAgency] = useState<PartnerAgency | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temporary_password: string } | null>(null);
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

  const { data: agencyLoginIds = new Set<string>() } = useQuery({
    queryKey: ['partner-agency-logins'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_users').select('agency_id');
      if (error) throw error;
      return new Set(data.map((row) => row.agency_id));
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
      const { data, error } = await supabase.rpc('create_partner_access', {
        p_agency_id: agency_id,
        p_email: email,
        p_full_name: full_name,
      });

      if (error) throw error;
      const result = data as unknown as { email?: string; temporary_password?: string } | null;
      if (!result?.email || !result?.temporary_password) {
        throw new Error('Resposta inválida ao criar conta');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['partner-agency-logins'] });
      setInviteResult({ email: data.email!, temporary_password: data.temporary_password! });
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

  const createAgencyMutation = useMutation({
    mutationFn: async (form: typeof newAgencyForm) => {
      const { data: agency, error } = await supabase
        .from('partner_agencies')
        .insert({
          name: form.name.trim(),
          contact_email: form.contact_email.trim(),
          responsible_name: form.responsible_name.trim(),
          contact_phone: form.contact_phone.trim() || null,
          cnpj: form.cnpj.trim() || null,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (form.createLogin) {
        const { data, error: rpcError } = await supabase.rpc('create_partner_access', {
          p_agency_id: agency.id,
          p_email: form.contact_email.trim(),
          p_full_name: form.responsible_name.trim(),
        });
        if (rpcError) throw rpcError;
        const result = data as unknown as { email?: string; temporary_password?: string } | null;
        if (!result?.email || !result?.temporary_password) {
          throw new Error('Agência criada, mas falhou ao gerar login');
        }
        return { credentials: { email: result.email, temporary_password: result.temporary_password } };
      }

      return { credentials: null as null };
    },
    onSuccess: ({ credentials }) => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['partner-agency-logins'] });
      setNewAgencyOpen(false);
      setNewAgencyForm({
        name: '',
        contact_email: '',
        responsible_name: '',
        contact_phone: '',
        cnpj: '',
        createLogin: true,
      });
      if (credentials) {
        setInviteAgency(null);
        setInviteResult(credentials);
        toast({
          title: 'Agência e login criados!',
          description: 'Envie as credenciais temporárias ao parceiro.',
        });
      } else {
        toast({ title: 'Agência cadastrada!', description: 'Crie o login quando quiser pelo menu da agência.' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cadastrar agência', description: error.message, variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (agencyId: string) => {
      const { data, error } = await supabase.rpc('reset_partner_password', { p_agency_id: agencyId });
      if (error) throw error;
      const result = data as unknown as { email?: string; temporary_password?: string } | null;
      if (!result?.email || !result?.temporary_password) {
        throw new Error('Resposta inválida ao resetar senha');
      }
      return result;
    },
    onSuccess: (data) => {
      setResetResult({ email: data.email!, temporary_password: data.temporary_password! });
      toast({ title: 'Senha redefinida', description: 'Nova senha temporária gerada.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao resetar senha', description: error.message, variant: 'destructive' });
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

  const updateAgencyDetailsMutation = useMutation({
    mutationFn: async ({
      id,
      commission_rate,
      contact_phone,
      responsible_name,
      address,
    }: {
      id: string;
      commission_rate: number;
      contact_phone: string | null;
      responsible_name: string | null;
      address: string | null;
    }) => {
      const { error } = await supabase
        .from('partner_agencies')
        .update({
          commission_rate,
          contact_phone,
          responsible_name,
          address,
        })
        .eq('id', id);
      if (error) throw error;
      return { commission_rate, contact_phone, responsible_name, address };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      queryClient.invalidateQueries({ queryKey: ['all-agencies'] });
      setSelectedAgency((agency) => (agency ? { ...agency, ...data } : agency));
      toast({ title: 'Dados da agência salvos!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar dados', variant: 'destructive' });
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async ({ id, logo_url, cover_image_url }: { id: string; logo_url: string | null; cover_image_url: string | null }) => {
      const { error } = await supabase
        .from('partner_agencies')
        .update({ logo_url, cover_image_url } as any)
        .eq('id', id);
      if (error) throw error;
      return { logo_url, cover_image_url };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-agencies'] });
      setSelectedAgency((agency) => agency ? { ...agency, ...data } : agency);
      toast({ title: 'Identidade visual salva!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar identidade visual', variant: 'destructive' });
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
    setInviteName(agency.responsible_name || '');
  };

  const handleCloseReset = () => {
    setResetAgency(null);
    setResetResult(null);
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

  const AgencyRow = ({ agency }: { agency: PartnerAgency }) => {
    const hasLogin = agencyLoginIds.has(agency.id);

    return (
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
            {!hasLogin && (
              <DropdownMenuItem
                onClick={() => handleApproveWithInvite(agency)}
                className="text-green-600"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar login
              </DropdownMenuItem>
            )}
            {hasLogin && (
              <DropdownMenuItem onClick={() => setResetAgency(agency)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Resetar senha
              </DropdownMenuItem>
            )}
            {agency.is_active ? (
              <DropdownMenuItem
                onClick={() => setConfirmAction({ type: 'deactivate', agency })}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Desativar
              </DropdownMenuItem>
            ) : !hasLogin ? null : (
              <DropdownMenuItem
                onClick={() => setConfirmAction({ type: 'activate', agency })}
                className="text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Reativar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
    );
  };

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
        <Button onClick={() => setNewAgencyOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova agência
        </Button>
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
              </div>

              <form
                className="rounded-lg border p-4 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const commission = parseFloat(
                    (form.elements.namedItem('commission_rate') as HTMLInputElement).value,
                  );
                  const phone = (form.elements.namedItem('contact_phone') as HTMLInputElement).value.trim();
                  const responsible = (form.elements.namedItem('responsible_name') as HTMLInputElement).value.trim();
                  const address = (form.elements.namedItem('address') as HTMLInputElement).value.trim();
                  updateAgencyDetailsMutation.mutate({
                    id: selectedAgency.id,
                    commission_rate: Number.isFinite(commission) ? commission : 10,
                    contact_phone: phone || null,
                    responsible_name: responsible || null,
                    address: address || null,
                  });
                }}
              >
                <p className="font-medium text-sm">Dados operacionais</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Comissão Guatá (%)</Label>
                    <Input
                      id="commission_rate"
                      name="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      defaultValue={selectedAgency.commission_rate ?? 10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Telefone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      defaultValue={selectedAgency.contact_phone || ''}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsible_name">Responsável</Label>
                    <Input
                      id="responsible_name"
                      name="responsible_name"
                      defaultValue={selectedAgency.responsible_name || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={selectedAgency.address || ''}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={updateAgencyDetailsMutation.isPending}>
                  {updateAgencyDetailsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar dados
                </Button>
              </form>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selectedAgency.contact_email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">
                  {selectedAgency.website ? (
                    <a href={selectedAgency.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedAgency.website}</a>
                  ) : 'Não informado'}
                </p>
              </div>

              {selectedAgency.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedAgency.description}</p>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <p className="font-medium">Identidade visual</p>
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const logo = (form.elements.namedItem('logo_url') as HTMLInputElement).value.trim();
                    const cover = (form.elements.namedItem('cover_image_url') as HTMLInputElement).value.trim();
                    updateBrandingMutation.mutate({
                      id: selectedAgency.id,
                      logo_url: logo || null,
                      cover_image_url: cover || null,
                    });
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="agency-logo-url">Logo da agência</Label>
                    <Input id="agency-logo-url" name="logo_url" defaultValue={selectedAgency.logo_url || ''} placeholder="https://exemplo.com/logo.png" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agency-cover-url">Imagem de fundo/capa</Label>
                    <Input id="agency-cover-url" name="cover_image_url" defaultValue={selectedAgency.cover_image_url || ''} placeholder="https://exemplo.com/capa.jpg" />
                  </div>
                  {(selectedAgency.logo_url || selectedAgency.cover_image_url) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedAgency.logo_url && (
                        <div className="rounded-md border bg-muted/30 p-3">
                          <p className="mb-2 text-xs text-muted-foreground">Preview da logo</p>
                          <img src={selectedAgency.logo_url} alt={`Logo ${selectedAgency.name}`} className="h-14 max-w-full object-contain" />
                        </div>
                      )}
                      {selectedAgency.cover_image_url && (
                        <div className="overflow-hidden rounded-md border bg-muted/30">
                          <img src={selectedAgency.cover_image_url} alt={`Capa ${selectedAgency.name}`} className="h-24 w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" size="sm" disabled={updateBrandingMutation.isPending}>
                    {updateBrandingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar visual
                  </Button>
                </form>
              </div>

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

      {/* Invite / credentials dialog */}
      <Dialog open={!!inviteAgency || !!inviteResult} onOpenChange={(open) => !open && handleCloseInvite()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {inviteResult ? 'Credenciais de acesso' : 'Criar login do parceiro'}
            </DialogTitle>
            <DialogDescription>
              {inviteResult
                ? 'Copie e envie ao responsável. No primeiro acesso, será obrigatório definir nova senha.'
                : <>Criar acesso ao portal para <strong>{inviteAgency?.name}</strong>.</>}
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
                  Criar login
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Nova agência manual */}
      <Dialog open={newAgencyOpen} onOpenChange={setNewAgencyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar agência manualmente</DialogTitle>
            <DialogDescription>
              Use para parceiros que não passaram pelo formulário &quot;Seja Parceiro&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-agency-name">Nome da agência *</Label>
              <Input
                id="new-agency-name"
                value={newAgencyForm.name}
                onChange={(e) => setNewAgencyForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new-agency-responsible">Responsável *</Label>
              <Input
                id="new-agency-responsible"
                value={newAgencyForm.responsible_name}
                onChange={(e) => setNewAgencyForm((f) => ({ ...f, responsible_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new-agency-email">Email *</Label>
              <Input
                id="new-agency-email"
                type="email"
                value={newAgencyForm.contact_email}
                onChange={(e) => setNewAgencyForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new-agency-phone">Telefone</Label>
              <Input
                id="new-agency-phone"
                value={newAgencyForm.contact_phone}
                onChange={(e) => setNewAgencyForm((f) => ({ ...f, contact_phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="new-agency-cnpj">CNPJ</Label>
              <Input
                id="new-agency-cnpj"
                value={newAgencyForm.cnpj}
                onChange={(e) => setNewAgencyForm((f) => ({ ...f, cnpj: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-agency-login"
                checked={newAgencyForm.createLogin}
                onCheckedChange={(checked) =>
                  setNewAgencyForm((f) => ({ ...f, createLogin: checked === true }))
                }
              />
              <Label htmlFor="new-agency-login" className="font-normal cursor-pointer">
                Criar login com senha temporária agora
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAgencyOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createAgencyMutation.mutate(newAgencyForm)}
              disabled={
                !newAgencyForm.name.trim() ||
                !newAgencyForm.contact_email.trim() ||
                !newAgencyForm.responsible_name.trim() ||
                createAgencyMutation.isPending
              }
            >
              {createAgencyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset senha parceiro */}
      <Dialog open={!!resetAgency || !!resetResult} onOpenChange={(open) => !open && handleCloseReset()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {resetResult ? 'Nova senha temporária' : 'Resetar senha do parceiro'}
            </DialogTitle>
            <DialogDescription>
              {resetResult
                ? 'O parceiro precisará definir nova senha no próximo login.'
                : <>Gerar nova senha temporária para <strong>{resetAgency?.name}</strong>.</>}
            </DialogDescription>
          </DialogHeader>

          {resetResult ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                <div>
                  <Label className="text-xs text-green-700">Email</Label>
                  <p className="font-mono text-sm">{resetResult.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-green-700">Senha temporária</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono border">
                      {resetResult.temporary_password}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(resetResult.temporary_password);
                        toast({ title: 'Senha copiada!' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseReset}>Fechar</Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseReset}>Cancelar</Button>
              <Button
                onClick={() => resetAgency && resetPasswordMutation.mutate(resetAgency.id)}
                disabled={!resetAgency || resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar nova senha
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminParceiros;

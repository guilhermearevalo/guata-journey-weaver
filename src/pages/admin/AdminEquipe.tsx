import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Mail, Shield, MoreHorizontal, UserPlus, KeyRound, Copy, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  role: 'consultant' | 'manager' | 'admin';
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-destructive' },
  manager: { label: 'Gestor', color: 'bg-secondary' },
  consultant: { label: 'Consultor', color: 'bg-primary' },
};

const AdminEquipe = () => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ member: TeamMember; newRole: 'consultant' | 'manager' | 'admin' } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{ full_name: string; email: string; role: 'consultant' | 'manager' | 'admin' }>({
    full_name: '',
    email: '',
    role: 'consultant',
  });
  const [credResult, setCredResult] = useState<{ email: string; temporary_password: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStaffMutation = useMutation({
    mutationFn: async (payload: { full_name: string; email: string; role: 'consultant' | 'manager' | 'admin' }) => {
      const { data, error } = await supabase.rpc('create_staff_access', {
        p_email: payload.email.trim(),
        p_full_name: payload.full_name.trim(),
        p_role: payload.role,
      });
      if (error) throw error;
      const result = data as { email?: string; temporary_password?: string } | null;
      if (!result?.email || !result?.temporary_password) throw new Error('Resposta inválida do servidor');
      return { email: result.email, temporary_password: result.temporary_password };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setCreateOpen(false);
      setCreateForm({ full_name: '', email: '', role: 'consultant' });
      setCredResult({ ...result, title: 'Membro criado' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Tente novamente.';
      const hint = message.includes('Could not find the function')
        ? ' Rode a migration 20260705180014 no Supabase.'
        : '';
      toast({ title: 'Erro ao criar membro', description: message + hint, variant: 'destructive' });
    },
  });

  const resetStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('reset_staff_password', { p_user_id: userId });
      if (error) throw error;
      const result = data as { email?: string; temporary_password?: string } | null;
      if (!result?.email || !result?.temporary_password) throw new Error('Resposta inválida do servidor');
      return { email: result.email, temporary_password: result.temporary_password };
    },
    onSuccess: (result) => {
      setCredResult({ ...result, title: 'Senha redefinida' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erro ao redefinir senha',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const copyPassword = () => {
    if (!credResult) return;
    navigator.clipboard.writeText(credResult.temporary_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: async () => {
      const { data: staffRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['consultant', 'manager', 'admin']);

      if (rolesError) throw rolesError;
      if (staffRoles.length === 0) return [];

      const userIds = staffRoles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)
        .order('full_name');

      if (profilesError) throw profilesError;

      return profiles.map((profile) => {
        const userRole = staffRoles.find((r) => r.user_id === profile.user_id);
        return { ...profile, role: userRole?.role as TeamMember['role'] };
      }) as TeamMember[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'consultant' | 'manager' | 'admin' }) => {
      const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast({ title: 'Função atualizada', description: 'A função do membro foi atualizada com sucesso.' });
      setRoleChangeDialog(null);
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a função.', variant: 'destructive' });
    },
  });

  const admins = teamMembers?.filter((m) => m.role === 'admin') || [];
  const managers = teamMembers?.filter((m) => m.role === 'manager') || [];
  const consultants = teamMembers?.filter((m) => m.role === 'consultant') || [];

  const filteredMembers = teamMembers?.filter(
    (member) =>
      member.full_name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground">Gerencie consultores e gestores da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gestores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{managers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{consultants.length}</div>
          </CardContent>
        </Card>
      </div>

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
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar membro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-medium">{member.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleLabels[member.role]?.color || 'bg-gray-500'} text-white`}>
                        {roleLabels[member.role]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.created_at), 'MMM yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                            <User className="mr-2 h-4 w-4" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRoleChangeDialog({ member, newRole: 'consultant' })}
                            disabled={member.role === 'consultant'}
                          >
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            Definir como Consultor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRoleChangeDialog({ member, newRole: 'manager' })}
                            disabled={member.role === 'manager'}
                          >
                            <Shield className="mr-2 h-4 w-4 text-secondary" />
                            Definir como Gestor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setRoleChangeDialog({ member, newRole: 'admin' })}
                            disabled={member.role === 'admin'}
                          >
                            <Shield className="mr-2 h-4 w-4 text-destructive" />
                            Definir como Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => resetStaffMutation.mutate(member.user_id)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Redefinir senha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhum membro da equipe encontrado</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p>{selectedMember?.full_name}</p>
                <Badge className={`mt-1 ${roleLabels[selectedMember?.role || '']?.color || 'bg-gray-500'} text-white`}>
                  {roleLabels[selectedMember?.role || '']?.label || selectedMember?.role}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4" />
                  {selectedMember.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium">
                  {format(new Date(selectedMember.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleChangeDialog} onOpenChange={(open) => !open && setRoleChangeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função</DialogTitle>
            <DialogDescription>
              Deseja alterar a função de <strong>{roleChangeDialog?.member.full_name}</strong> de{' '}
              <strong>{roleLabels[roleChangeDialog?.member.role || '']?.label}</strong> para{' '}
              <strong>{roleLabels[roleChangeDialog?.newRole || '']?.label}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeDialog(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (roleChangeDialog) {
                  updateRoleMutation.mutate({
                    userId: roleChangeDialog.member.user_id,
                    newRole: roleChangeDialog.newRole,
                  });
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro da equipe</DialogTitle>
            <DialogDescription>
              Cria um login com senha temporária. O membro deverá trocar a senha no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nome completo *</Label>
              <Input
                id="staff-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="maria@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Função *</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as typeof createForm.role }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant">Consultor</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createStaffMutation.mutate(createForm)}
              disabled={createStaffMutation.isPending || !createForm.full_name.trim() || !createForm.email.trim()}
            >
              {createStaffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credResult} onOpenChange={(open) => { if (!open) setCredResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{credResult?.title}</DialogTitle>
            <DialogDescription>
              Copie e envie estas credenciais ao membro. A senha temporária não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          {credResult && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{credResult.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Senha temporária</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                    {credResult.temporary_password}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyPassword}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredResult(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEquipe;

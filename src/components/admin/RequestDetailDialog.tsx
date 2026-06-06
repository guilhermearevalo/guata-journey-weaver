import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tables } from '@/integrations/supabase/types';
import { Calendar, Users, MapPin, Mail, Phone, DollarSign, MessageSquare, Route, Building2, Save, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RequestDetailDialogProps {
  request: Tables<'travel_requests'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_analysis: { label: 'Em Análise', variant: 'secondary' },
  proposal_sent: { label: 'Proposta Enviada', variant: 'secondary' },
  approved: { label: 'Aprovada', variant: 'default' },
  in_operation: { label: 'Em Operação', variant: 'default' },
  completed: { label: 'Concluída', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [externalNotes, setExternalNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  // Load agency info if assigned
  const { data: agency } = useQuery({
    queryKey: ['agency-for-request', request?.assigned_agency_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_agencies')
        .select('name, is_external, contact_email, contact_phone')
        .eq('id', request!.assigned_agency_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!request?.assigned_agency_id,
  });

  // Initialize external notes when request changes
  if (request && !notesInitialized) {
    setExternalNotes((request as any).external_notes || '');
    setNotesInitialized(true);
  }
  if (!request && notesInitialized) {
    setNotesInitialized(false);
  }

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const { error } = await supabase
        .from('travel_requests')
        .update({ external_notes: externalNotes } as any)
        .eq('id', request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Notas salvas com sucesso!' });
    },
  });

  // Check whether a proposal already exists for this request
  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-exists', request?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('proposals')
        .select('id')
        .eq('request_id', request!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!request?.id,
  });

  const deleteProposalMutation = useMutation({
    mutationFn: async () => {
      if (!existingProposal?.id) return;
      // Remove travel documents linked to this proposal first
      await supabase.from('travel_documents' as any).delete().eq('proposal_id', existingProposal.id);
      const { error } = await supabase.from('proposals').delete().eq('id', existingProposal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-exists', request?.id] });
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Proposta excluída', description: 'O roteiro foi removido. Você pode criar uma nova proposta.' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a proposta.', variant: 'destructive' });
    },
  });

  if (!request) return null;

  const travelDates = request.travel_dates as { start?: string; end?: string } | null;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return 'Não informado'; }
  };

  const status = statusLabels[request.status] || { label: request.status, variant: 'outline' as const };
  const showItinerary = ['approved', 'in_operation', 'completed'].includes(request.status);
  const isExternalAgency = agency?.is_external;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setNotesInitialized(false); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl">Demanda de {request.client_name}</DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <DialogDescription>Criada em {new Date(request.created_at).toLocaleDateString('pt-BR')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${request.client_email}`} className="hover:underline">{request.client_email}</a>
              </div>
              {request.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${request.client_phone}`} className="hover:underline">{request.client_phone}</a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Detalhes da Viagem</h4>
            <div className="grid gap-2">
              {request.destination && (
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{request.destination}</span></div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(travelDates?.start)} - {formatDate(travelDates?.end)}</span>
              </div>
              {request.travelers_count && (
                <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{request.travelers_count} viajante(s)</span></div>
              )}
              {request.budget_range && (
                <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>{request.budget_range}</span></div>
              )}
            </div>
          </div>

          {request.special_requests && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Solicitações Especiais</h4>
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground">{request.special_requests}</p>
                </div>
              </div>
            </>
          )}

          {request.internal_notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Notas Internas</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{request.internal_notes}</p>
              </div>
            </>
          )}

          {/* Assigned Agency Info */}
          {agency && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Agência Atribuída
                  {isExternalAgency && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Externa
                    </Badge>
                  )}
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{agency.name}</p>
                  {agency.contact_email && <p className="text-muted-foreground">{agency.contact_email}</p>}
                  {agency.contact_phone && <p className="text-muted-foreground">{agency.contact_phone}</p>}
                </div>
              </div>
            </>
          )}

          {/* External Notes - for tracking comms with external agencies */}
          {(isExternalAgency || (request as any).external_notes) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Registro de Acompanhamento
                </h4>
                <p className="text-xs text-muted-foreground">
                  Registre aqui o andamento com a agência externa (e-mails, ligações, status).
                </p>
                <Textarea
                  value={externalNotes}
                  onChange={(e) => setExternalNotes(e.target.value)}
                  placeholder="Ex: 12/03 - Enviado por e-mail os detalhes. 15/03 - Agência confirmou recebimento..."
                  rows={4}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveNotesMutation.mutate()}
                  disabled={saveNotesMutation.isPending}
                >
                  {saveNotesMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                  Salvar Notas
                </Button>
              </div>
            </>
          )}

          <Separator />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                navigate(`/admin/proposta/${request.id}`);
              }}
            >
              Ver / Criar Proposta
            </Button>
            {showItinerary && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/admin/demandas/${request.id}/roteiro`);
                }}
              >
                <Route className="mr-2 h-4 w-4" />
                Roteiro com IA
              </Button>
            )}
          </div>

          {existingProposal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir proposta / roteiro
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A proposta e o roteiro vinculados a esta demanda serão removidos permanentemente. Esta ação não pode ser desfeita. A demanda continua existindo e você poderá criar uma nova proposta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteProposalMutation.mutate()}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

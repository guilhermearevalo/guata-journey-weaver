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
import {
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Route,
  Building2,
  Save,
  Loader2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchProposalByRequest } from '@/lib/fetchProposals';
import { StatusHelpIcon } from './StatusHelpIcon';
import type { RequestStatus } from '@/lib/requestStatusHelp';
import { updateTravelRequestServiceType, describeServiceTypeUpdateError } from '@/lib/fetchTravelRequests';
import { completeConsultancy, canCompleteConsultancy } from '@/lib/travelRequestStatus';
import { deleteProposalById, deleteTravelRequestById } from '@/lib/fetchTravelDocuments';
import { getServiceType, type ServiceType } from '@/lib/serviceType';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { cn } from '@/lib/utils';

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

function whatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function InfoCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm">
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [externalNotes, setExternalNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>('full_package');
  const [serviceTypeNote, setServiceTypeNote] = useState('');
  const [serviceInitialized, setServiceInitialized] = useState(false);

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

  if (request && !notesInitialized) {
    setExternalNotes((request as { external_notes?: string }).external_notes || '');
    setNotesInitialized(true);
  }
  if (!request && notesInitialized) {
    setNotesInitialized(false);
  }

  if (request && !serviceInitialized) {
    setServiceType(getServiceType(request));
    setServiceTypeNote(request.service_type_note || '');
    setServiceInitialized(true);
  }
  if (!request && serviceInitialized) {
    setServiceInitialized(false);
  }

  const resetDialogState = () => {
    setNotesInitialized(false);
    setServiceInitialized(false);
  };

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const { error } = await supabase
        .from('travel_requests')
        .update({ external_notes: externalNotes })
        .eq('id', request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Notas salvas com sucesso!' });
    },
  });

  const updateServiceTypeMutation = useMutation({
    mutationFn: async ({ type, note }: { type: ServiceType; note?: string | null }) => {
      if (!request) return;
      await updateTravelRequestServiceType(request.id, type, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Tipo de serviço atualizado' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar tipo',
        description: describeServiceTypeUpdateError(error),
        variant: 'destructive',
      });
    },
  });

  const persistServiceType = (type: ServiceType, note?: string | null) => {
    updateServiceTypeMutation.mutate({
      type,
      note: type === 'other' ? note : null,
    });
  };

  const completeConsultancyMutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      await completeConsultancy(request.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Demanda concluída!' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Erro ao concluir', variant: 'destructive' });
    },
  });

  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-exists', request?.id],
    queryFn: () => fetchProposalByRequest(request!.id),
    enabled: !!request?.id,
  });

  const deleteProposalMutation = useMutation({
    mutationFn: async () => {
      if (!existingProposal?.id) return;
      await deleteProposalById(existingProposal.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-exists', request?.id] });
      queryClient.invalidateQueries({ queryKey: ['proposal-request-ids'] });
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({
        title: 'Proposta excluída',
        description: 'O roteiro foi removido. A demanda voltou para Em Análise.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Rode docs/fix_travel_documents_and_delete.sql no Supabase.',
        variant: 'destructive',
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      if (!request?.id) return;
      await deleteTravelRequestById(request.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Demanda excluída', description: 'A demanda e todos os dados vinculados foram removidos.' });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: 'Erro ao excluir demanda',
        description: err instanceof Error ? err.message : 'Rode docs/fix_travel_documents_and_delete.sql no Supabase.',
        variant: 'destructive',
      });
    },
  });

  if (!request) return null;

  const travelDates = request.travel_dates as { start?: string; end?: string } | null;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return 'Não informado';
    }
  };

  const status = statusLabels[request.status] || { label: request.status, variant: 'outline' as const };
  const isExternalAgency = agency?.is_external;
  const completeLabel =
    getServiceType(request) === 'other' ? 'Concluir serviço' : 'Concluir consultoria';

  const dateRange =
    travelDates?.start || travelDates?.end
      ? `${formatDate(travelDates?.start)} – ${formatDate(travelDates?.end)}`
      : 'Datas não informadas';

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetDialogState();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl leading-tight">
                Demanda de {request.client_name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Criada em {new Date(request.created_at).toLocaleDateString('pt-BR')}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant={status.variant}>{status.label}</Badge>
              <StatusHelpIcon status={request.status as RequestStatus} />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a href={`mailto:${request.client_email}`} className="text-sm hover:underline break-all">
                {request.client_email}
              </a>
            </div>
            {request.client_phone && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${request.client_phone}`} className="text-sm hover:underline">
                    {request.client_phone}
                  </a>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={whatsAppUrl(request.client_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${request.client_phone}`}>Ligar</a>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={MapPin}
              label="Destino"
              value={request.destination || 'Não informado'}
              iconClassName="text-sky-600"
            />
            <InfoCard
              icon={Calendar}
              label="Datas"
              value={dateRange}
              iconClassName="text-violet-600"
            />
            <InfoCard
              icon={Users}
              label="Viajantes"
              value={request.travelers_count ? `${request.travelers_count} viajante(s)` : 'Não informado'}
              iconClassName="text-emerald-600"
            />
            <InfoCard
              icon={DollarSign}
              label="Orçamento"
              value={request.budget_range || 'Não informado'}
              iconClassName="text-amber-600"
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Tipo de serviço</h4>
            <ServiceTypeSelector
              value={serviceType}
              note={serviceTypeNote}
              disabled={updateServiceTypeMutation.isPending}
              onTypeChange={(type) => {
                setServiceType(type);
                if (type !== 'other') setServiceTypeNote('');
                persistServiceType(type, type === 'other' ? serviceTypeNote : null);
              }}
              onNoteChange={setServiceTypeNote}
              onNoteBlur={() => {
                if (serviceType === 'other') {
                  persistServiceType('other', serviceTypeNote);
                }
              }}
            />
          </div>

          {request.special_requests && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Solicitações especiais</h4>
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  {request.special_requests}
                </p>
              </div>
            </>
          )}

          {request.internal_notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Notas internas</h4>
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{request.internal_notes}</p>
              </div>
            </>
          )}

          {agency && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Agência atribuída
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

          {(isExternalAgency || (request as { external_notes?: string }).external_notes) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Registro de acompanhamento</h4>
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
                  {saveNotesMutation.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  Salvar notas
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2 border-t bg-muted/20 px-6 py-4">
          {canCompleteConsultancy(request) && (
            <Button
              className="w-full"
              variant="default"
              onClick={() => completeConsultancyMutation.mutate()}
              disabled={completeConsultancyMutation.isPending}
            >
              {completeConsultancyMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {completeLabel}
            </Button>
          )}
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
            {existingProposal && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/admin/demandas/${request.id}/roteiro`);
                }}
              >
                <Route className="mr-2 h-4 w-4" />
                Planejar Roteiro
              </Button>
            )}
          </div>

          {existingProposal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir proposta / roteiro
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A proposta, roteiro e documentos serão removidos. A demanda continua no Kanban e volta para{' '}
                    <strong>Em Análise</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteProposalMutation.mutate()}
                  >
                    Excluir proposta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir demanda inteira
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir demanda de {request.client_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove a demanda, proposta, roteiro e documentos permanentemente. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteRequestMutation.mutate()}
                >
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}

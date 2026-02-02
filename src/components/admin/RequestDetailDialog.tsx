import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tables } from '@/integrations/supabase/types';
import { Calendar, Users, MapPin, Mail, Phone, DollarSign, MessageSquare } from 'lucide-react';

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
  if (!request) return null;

  const travelDates = request.travel_dates as { start?: string; end?: string } | null;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Não informado';
    }
  };

  const status = statusLabels[request.status] || { label: request.status, variant: 'outline' as const };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl">
              Demanda de {request.client_name}
            </DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <DialogDescription>
            Criada em {new Date(request.created_at).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${request.client_email}`} className="hover:underline">
                  {request.client_email}
                </a>
              </div>
              {request.client_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${request.client_phone}`} className="hover:underline">
                    {request.client_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Trip Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Detalhes da Viagem</h4>
            <div className="grid gap-2">
              {request.destination && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{request.destination}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(travelDates?.start)} - {formatDate(travelDates?.end)}
                </span>
              </div>
              {request.travelers_count && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{request.travelers_count} viajante(s)</span>
                </div>
              )}
              {request.budget_range && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{request.budget_range}</span>
                </div>
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
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {request.internal_notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import type { Enums } from '@/integrations/supabase/types';

export type RequestStatus = Enums<'request_status'>;

/** Textos alinhados ao fluxo operacional de agências de viagem. */
export const REQUEST_STATUS_HELP: Record<RequestStatus, string> = {
  pending:
    'Demanda nova, ainda não analisada. Valide datas, orçamento e viabilidade antes de montar a proposta.',
  in_analysis:
    'Consultor pesquisando opções (voos, hotel, tarifas). Proposta em elaboração — ainda não enviada ao cliente.',
  proposal_sent:
    'Orçamento ou roteiro formal enviado ao cliente (link, WhatsApp ou e-mail). Aguardando resposta ou ajustes.',
  approved:
    'Cliente aceitou a proposta. Próximo passo: pagamento e reservas (passagens, hotel, transfer).',
  in_operation:
    'Reservas e emissões em andamento. Dossiê, passagens e documentos sendo finalizados.',
  completed: 'Viagem realizada. Demanda encerrada com sucesso.',
  cancelled: 'Demanda encerrada sem viagem.',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendente',
  in_analysis: 'Em Análise',
  proposal_sent: 'Proposta / Roteiro Enviado',
  approved: 'Aprovada',
  in_operation: 'Em Operação',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

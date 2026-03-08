import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileText, Map, Share2, Users, CheckSquare, DollarSign, Building2, Lock } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: '1. Criar uma Demanda (Solicitação de Viagem)',
    badge: 'Demandas',
    items: [
      'Acesse "Demandas" no menu lateral.',
      'Clique em "+ Nova Demanda" no canto superior direito.',
      'Preencha: nome do cliente, e-mail, telefone, destino, datas, número de viajantes, faixa de orçamento e pedidos especiais.',
      'A demanda será criada com status "Pendente" no Kanban.',
      'Arraste o card entre colunas conforme o andamento (Em Análise → Proposta Enviada → Aprovada → Em Operação → Concluída).',
    ],
  },
  {
    icon: Users,
    title: '2. Atribuir Agência Parceira',
    badge: 'Demandas',
    items: [
      'Clique no card da demanda para abrir os detalhes.',
      'No campo "Agência Parceira", selecione a agência que vai operar a viagem.',
      'A agência parceira verá a demanda no portal dela automaticamente.',
    ],
  },
  {
    icon: FileText,
    title: '3. Criar Proposta',
    badge: 'Proposta',
    items: [
      'Nos detalhes da demanda, clique em "Criar Proposta".',
      'Preencha título, descrição, preço total e itens inclusos.',
      'O Switch "Habilitar Pagamento" começa desligado — o cliente vê a proposta mas sem botão de pagar.',
      'Quando o cliente aprovar a viagem, ligue o Switch para liberar o pagamento via Stripe (cartão ou PIX).',
      'No campo "Código de Acesso", defina uma senha (ex: NORONHA2026) para proteger o roteiro público. Deixe em branco para acesso livre.',
      'A proposta fica vinculada à demanda e pode ser editada a qualquer momento.',
    ],
  },
  {
    icon: Map,
    title: '4. Planejar o Roteiro',
    badge: 'Roteiro',
    items: [
      'Dentro da demanda, clique em "Roteiro" para abrir o Planejador.',
      'Clique em "Gerar Roteiro com IA" para obter sugestões automáticas.',
      'Use "Adicionar" (+) em cada dia para inserir atividades manualmente.',
      'Use as setas ↑ ↓ para reordenar atividades.',
      'Clique no ícone de lápis para editar qualquer atividade.',
      'Use "Sugerir mais" para pedir mais ideias à IA em um dia específico.',
    ],
  },
  {
    icon: CheckSquare,
    title: '5. Checklist de Documentos',
    badge: 'Roteiro',
    items: [
      'No final da página do Roteiro, há a seção "Documentos Necessários".',
      'Adicione os documentos que o cliente precisa (ex: Passaporte, Visto, Seguro Viagem).',
      'Quando compartilhar o roteiro, o cliente verá essa lista.',
    ],
  },
  {
    icon: Share2,
    title: '6. Compartilhar Proposta e Roteiro',
    badge: 'Compartilhar',
    items: [
      'No Roteiro, clique em "Compartilhar" para gerar um link público.',
      'Se definiu um código de acesso, o cliente precisará digitá-lo para ver o roteiro.',
      'Envie o link para o cliente via WhatsApp, e-mail, etc.',
      'O cliente poderá visualizar o roteiro completo e o checklist de documentos.',
      'Na Proposta, também é possível gerar um link público de compartilhamento.',
    ],
  },
  {
    icon: DollarSign,
    title: '7. Controle Financeiro',
    badge: 'Financeiro',
    items: [
      'Acesse "Financeiro" no menu lateral.',
      'Veja os cards: Receita total paga, Comissão Guatá, Repasses pendentes.',
      'Filtre por agência parceira ou status de repasse.',
      'Na tabela, veja o breakdown de cada proposta: valor bruto, taxa Stripe (3,49% + R$0,39), comissão Guatá e valor líquido do parceiro.',
      'Clique em "Registrar Repasse" para confirmar que fez o PIX/TED ao parceiro.',
      'O parceiro verá o status atualizado automaticamente no portal dele.',
    ],
  },
  {
    icon: Building2,
    title: '8. Gestão de Parceiros',
    badge: 'Parceiros',
    items: [
      'Acesse "Parceiros" no menu lateral.',
      'Veja agências pendentes de aprovação na aba "Pendentes".',
      'Clique em "Aprovar" para ativar uma agência parceira.',
      'Configure a taxa de comissão (%) de cada agência.',
      'Defina quem absorve a taxa do Stripe: Guatá, Parceiro ou Dividido.',
      'Desative agências que não operam mais.',
    ],
  },
];

const AdminAjuda = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Passo a passo de como usar o sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guia Completo — Fluxo Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {steps.map((step, idx) => (
              <AccordionItem key={idx} value={`step-${idx}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <step.icon className="h-5 w-5 text-primary shrink-0" />
                    <span>{step.title}</span>
                    <Badge variant="outline" className="ml-2 hidden sm:inline-flex">{step.badge}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground pl-8">
                    {step.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAjuda;

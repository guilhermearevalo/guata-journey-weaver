import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileText, Map, Share2, CheckSquare, DollarSign, Lock } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: '1. Visualizar Demandas',
    badge: 'Demandas',
    items: [
      'Acesse "Demandas" no menu lateral.',
      'Você verá as demandas que foram atribuídas à sua agência.',
      'Clique em uma demanda para ver os detalhes: destino, datas, número de viajantes e preferências do cliente.',
    ],
  },
  {
    icon: FileText,
    title: '2. Criar Proposta',
    badge: 'Proposta',
    items: [
      'Dentro da demanda, clique em "Criar Proposta".',
      'Preencha o título, descrição, preço total e o que está incluso.',
      'O Switch "Habilitar Pagamento" começa desligado — envie a proposta para o cliente revisar primeiro.',
      'Quando o cliente aprovar a viagem, ligue o Switch para liberar o pagamento via Stripe (cartão ou PIX).',
      'No campo "Código de Acesso", defina uma senha (ex: NORONHA2026) para proteger o roteiro público. Deixe em branco para acesso livre.',
      'A proposta será visível para a Guatá e poderá ser compartilhada com o cliente.',
    ],
  },
  {
    icon: Map,
    title: '3. Planejar o Roteiro',
    badge: 'Roteiro',
    items: [
      'Na proposta, clique em "Roteiro" para abrir o Planejador.',
      'Use "Gerar Roteiro com IA" para criar sugestões automáticas.',
      'Clique em "Adicionar" (+) para inserir atividades manualmente em qualquer dia.',
      'Use as setas ↑ ↓ para mudar a ordem das atividades.',
      'Edite qualquer atividade clicando no ícone de lápis.',
      'Use "Sugerir mais" para pedir mais ideias à IA.',
    ],
  },
  {
    icon: CheckSquare,
    title: '4. Checklist de Documentos',
    badge: 'Documentos',
    items: [
      'No final da página do Roteiro, adicione os documentos necessários para a viagem.',
      'Exemplos: Passaporte válido, Visto, Seguro Viagem, Comprovante de Vacinação.',
      'Pesquise quais documentos são necessários para o destino e oriente o cliente.',
      'O cliente verá essa lista quando acessar o link do roteiro.',
    ],
  },
  {
    icon: Share2,
    title: '5. Compartilhar com o Cliente',
    badge: 'Compartilhar',
    items: [
      'No Roteiro, clique em "Compartilhar" para gerar um link público.',
      'Se definiu um código de acesso, o cliente precisará digitá-lo para ver o roteiro.',
      'Copie e envie o link para o cliente.',
      'O cliente poderá ver o roteiro completo, custos estimados e checklist de documentos.',
    ],
  },
  {
    icon: DollarSign,
    title: '6. Acompanhar Financeiro',
    badge: 'Financeiro',
    items: [
      'Acesse "Financeiro" no menu lateral.',
      'Veja os cards: Total vendido (bruto), Recebido e A receber.',
      'Na tabela, acompanhe cada proposta: valor bruto, taxa Stripe, comissão Guatá e seu valor líquido.',
      'O status do repasse (Pendente / Pago) é atualizado quando a Guatá fizer o PIX/TED.',
      'Confira a taxa de comissão e quem absorve a taxa Stripe nas informações acima da tabela.',
    ],
  },
];

const PartnerAjuda = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Passo a passo de como usar o portal do parceiro
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guia do Parceiro — Fluxo Principal</CardTitle>
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

export default PartnerAjuda;

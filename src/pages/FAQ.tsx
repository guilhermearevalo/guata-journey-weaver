import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      question: 'Como funciona o processo de solicitação de viagem?',
      answer: 'Você preenche nosso formulário com suas preferências, destino desejado, datas e orçamento. Nossa equipe analisa suas necessidades e entra em contato em até 24 horas com opções personalizadas para você.',
    },
    {
      question: 'Qual o prazo para receber uma proposta?',
      answer: 'Após o contato inicial, nossa equipe prepara propostas personalizadas em até 48 horas úteis. Roteiros mais complexos ou viagens internacionais podem levar um pouco mais de tempo para garantir a qualidade.',
    },
    {
      question: 'Vocês trabalham com quais destinos?',
      answer: 'Trabalhamos com destinos em todo o Brasil e também roteiros internacionais. Somos especialistas em destinos como Fernando de Noronha, Jalapão, Chapada Diamantina, Lençóis Maranhenses, além de destinos na América do Sul, Europa e outros continentes.',
    },
    {
      question: 'Os pacotes incluem passagens aéreas?',
      answer: 'Sim, podemos incluir passagens aéreas nos pacotes. Trabalhamos com as principais companhias aéreas para garantir os melhores preços e horários. Você também pode optar por adquirir apenas o terrestre.',
    },
    {
      question: 'Como funciona o pagamento?',
      answer: 'Aceitamos diversas formas de pagamento: cartão de crédito (parcelamos em até 12x), transferência bancária e PIX. Uma entrada é solicitada para confirmação da reserva, e o restante pode ser parcelado.',
    },
    {
      question: 'Vocês oferecem seguro viagem?',
      answer: 'Sim! Recomendamos fortemente o seguro viagem e podemos incluí-lo em seu pacote. Trabalhamos com seguradoras renomadas que oferecem cobertura médica, extravio de bagagem e outros benefícios.',
    },
    {
      question: 'Posso alterar minha reserva após a confirmação?',
      answer: 'Alterações são possíveis, sujeitas às políticas de cada fornecedor (hotéis, companhias aéreas, etc.). Recomendamos entrar em contato o mais rápido possível caso precise fazer alguma mudança.',
    },
    {
      question: 'Vocês organizam viagens em grupo?',
      answer: 'Sim! Organizamos excursões em grupo com datas programadas e também montamos roteiros exclusivos para grupos fechados (famílias, amigos, empresas). Entre em contato para saber mais.',
    },
    {
      question: 'Como posso acompanhar minha solicitação?',
      answer: 'Você receberá atualizações por e-mail e WhatsApp. Além disso, ao criar uma conta em nossa plataforma, você pode acompanhar o status de suas solicitações e histórico de viagens.',
    },
    {
      question: 'A Guatá é uma agência regularizada?',
      answer: 'Sim! Somos uma agência de turismo regularizada, cadastrada no Cadastur (Ministério do Turismo). Trabalhamos apenas com fornecedores confiáveis e parceiros de qualidade comprovada.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Perguntas Frequentes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tire suas dúvidas sobre nossos serviços, processos e políticas
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-lg border bg-card px-6"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Não encontrou sua resposta?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Nossa equipe está pronta para ajudar você
          </p>
          <Button asChild className="mt-6 gap-2" size="lg">
            <a href="/contato">
              <MessageCircle className="h-5 w-5" />
              Fale Conosco
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default FAQ;

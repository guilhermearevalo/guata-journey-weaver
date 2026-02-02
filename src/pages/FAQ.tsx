import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';

// Conteúdo padrão caso o CMS esteja vazio
const defaultContent = {
  hero: {
    title: 'Perguntas Frequentes',
    subtitle: 'Tire suas dúvidas sobre nossos serviços',
  },
  items: [
    { question: 'Como funciona o processo de reserva?', answer: 'Após escolher sua experiência ou solicitar uma viagem personalizada, nossa equipe entrará em contato para entender suas preferências. Elaboramos uma proposta sob medida, e após sua aprovação, cuidamos de toda a logística para você.' },
    { question: 'Qual é a política de cancelamento?', answer: 'Nossa política varia de acordo com cada experiência e fornecedor. Em geral, cancelamentos com mais de 30 dias de antecedência têm reembolso integral.' },
    { question: 'Vocês oferecem seguro viagem?', answer: 'Sim! Trabalhamos com as melhores seguradoras do mercado e podemos incluir o seguro viagem no seu pacote.' },
  ],
};

const FAQ = () => {
  const { data: page, isLoading } = useCmsPage('faq');

  // Usa dados do CMS ou fallback para conteúdo padrão
  const content = page?.content || defaultContent;
  const { hero, items } = content;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            {hero?.title || 'Perguntas Frequentes'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {hero?.subtitle || 'Tire suas dúvidas sobre nossos serviços'}
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {items?.map((faq, index) => (
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

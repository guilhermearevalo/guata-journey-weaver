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
import CmsPageNotFound from '@/components/cms/CmsPageNotFound';

const FAQ = () => {
  const { data: page, isLoading, error } = useCmsPage('faq');

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  if (error || !page) {
    return <CmsPageNotFound slug="faq" />;
  }

  const { hero, items } = page.content;

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

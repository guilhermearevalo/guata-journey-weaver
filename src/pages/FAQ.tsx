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
import { Seo } from '@/components/seo/Seo';
import { normalizeCmsText } from '@/lib/normalizeCmsText';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  const { data: page, isLoading } = useCmsPage('faq');

  // Usa dados do CMS ou fallback para conteúdo padrão
  const content = page?.content || defaultContent;
  const { hero, items } = content;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (items || []).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo path="/faq" title={t('seoFaqTitle')} description={t('seoFaqDesc')} jsonLd={faqJsonLd} />
      <section className="bg-gradient-to-br from-primary/15 via-background to-muted/40 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            {normalizeCmsText(hero?.title) || t('faqDefaultTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {normalizeCmsText(hero?.subtitle) || t('faqDefaultSub')}
          </p>
        </div>
      </section>

      <section className="container mx-auto bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {items?.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-lg border bg-card px-6"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {normalizeCmsText(faq.question)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {normalizeCmsText(faq.answer)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">{t('faqCtaTitle')}</h2>
          <p className="mt-4 text-primary-foreground/85">{t('faqCtaSub')}</p>
          <Button asChild className="mt-6 gap-2 bg-amber-400 text-foreground hover:bg-amber-300" size="lg">
            <a href="/contato">
              <MessageCircle className="h-5 w-5" />
              {t('faqCtaBtn')}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default FAQ;

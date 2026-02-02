import { MapPin, Heart, Users, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';

// Conteúdo padrão caso o CMS esteja vazio
const defaultContent = {
  hero: {
    title: 'Sobre a Guatá',
    subtitle: 'Conheça nossa história e missão de criar experiências de viagem inesquecíveis',
  },
  sections: [
    {
      title: 'Nossa História',
      content: 'A Guatá nasceu do amor por viagens e da vontade de proporcionar experiências únicas e autênticas. Nosso nome vem do tupi-guarani e significa "andar", "caminhar" - e é exatamente isso que fazemos: caminhamos ao lado dos nossos viajantes em cada etapa de sua jornada.\n\nDesde nossa fundação, já ajudamos centenas de pessoas a descobrir destinos incríveis, criando memórias que duram para sempre.',
    },
    {
      title: 'Nossa Missão',
      content: 'Transformar sonhos de viagem em experiências reais e inesquecíveis. Acreditamos que viajar é mais do que conhecer lugares - é expandir horizontes, conectar culturas e criar histórias que serão contadas por gerações.',
    },
  ],
};

const Sobre = () => {
  const { data: page, isLoading } = useCmsPage('sobre');

  // Usa dados do CMS ou fallback para conteúdo padrão
  const content = page?.content || defaultContent;
  const { hero, sections } = content;

  const valores = [
    {
      icon: Heart,
      title: 'Paixão por Viagens',
      description: 'Transformamos sonhos em experiências únicas e memoráveis.',
    },
    {
      icon: Users,
      title: 'Atendimento Personalizado',
      description: 'Cada viajante é único e merece um roteiro feito sob medida.',
    },
    {
      icon: Award,
      title: 'Excelência',
      description: 'Parceiros selecionados e curadoria rigorosa em cada detalhe.',
    },
    {
      icon: MapPin,
      title: 'Expertise Local',
      description: 'Conhecimento profundo dos destinos brasileiros e internacionais.',
    },
  ];

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            {hero?.title || 'Sobre a Guatá'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {hero?.subtitle || 'Conheça nossa história e missão'}
          </p>
        </div>
      </section>

      {/* Dynamic Sections from CMS */}
      {sections && sections.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl prose prose-lg dark:prose-invert">
              {sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h2 className="font-display text-2xl font-bold">{section.title}</h2>
                  <p className="whitespace-pre-line text-muted-foreground">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nossos Valores */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Nossos Valores</h2>
            <p className="mt-4 text-muted-foreground">
              O que nos move e define cada experiência que criamos
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {valores.map((valor) => (
              <Card key={valor.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <valor.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{valor.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{valor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Pronto para sua próxima aventura?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Entre em contato e deixe-nos criar a viagem dos seus sonhos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a 
              href="/viagem-personalizada" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Solicitar Orçamento
            </a>
            <a 
              href="/contato" 
              className="inline-flex items-center justify-center rounded-md border border-primary px-8 py-3 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              Fale Conosco
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;

import { Link } from 'react-router-dom';
import {
  MapPin,
  Heart,
  Users,
  Award,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Target,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import cadasturCertificate from '@/assets/cadastur-certificate.png';
import defaultLogo from '@/assets/logo-guata.png';
import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StorageImage } from '@/components/ui/StorageImage';
import { normalizeCmsText } from '@/lib/normalizeCmsText';

const defaultContent = {
  hero: {
    title: 'Sobre a Guatá',
    subtitle: 'Conheça nossa história e missão de criar experiências de viagem inesquecíveis',
  },
  sections: [
    {
      title: 'Nossa História',
      content:
        'A Guatá nasceu do amor por viagens e da vontade de proporcionar experiências únicas e autênticas. Nosso nome vem do tupi-guarani e significa "andar", "caminhar" - e é exatamente isso que fazemos: caminhamos ao lado dos nossos viajantes em cada etapa de sua jornada.\n\nDesde nossa fundação, já ajudamos centenas de pessoas a descobrir destinos incríveis, criando memórias que duram para sempre.',
    },
    {
      title: 'Nossa Missão',
      content:
        'Transformar sonhos de viagem em experiências reais e inesquecíveis. Acreditamos que viajar é mais do que conhecer lugares - é expandir horizontes, conectar culturas e criar histórias que serão contadas por gerações.',
    },
  ],
};

function isValoresSection(title: string) {
  return /valores/i.test(title);
}

function getSectionIcon(title: string): LucideIcon {
  if (/hist[oó]ria/i.test(title)) return BookOpen;
  if (/miss[aã]o/i.test(title)) return Target;
  return Compass;
}

const Sobre = () => {
  const { data: page, isLoading } = useCmsPage('sobre');

  const { data: cadasturConfig } = useQuery({
    queryKey: ['site-setting', 'cadastur_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cadastur_config')
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as {
        number?: string;
        validity?: string;
        description?: string;
        certificate_image_url?: string;
        agency_logo_url?: string;
      } | null;
    },
  });

  const cadasturNumber = cadasturConfig?.number || '64.677.632/0001-77';
  const cadasturValidity = cadasturConfig?.validity || '27/01/2026 a 27/01/2028';
  const cadasturDescription =
    cadasturConfig?.description ||
    'O Cadastur é o sistema de cadastro de pessoas físicas e jurídicas que atuam no setor de turismo. É administrado pelo Ministério do Turismo e garante que a empresa atende às exigências legais para operar como agência de turismo.';
  const certImage = cadasturConfig?.certificate_image_url || cadasturCertificate;
  const agencyLogo = cadasturConfig?.agency_logo_url;

  const content = page?.content || defaultContent;
  const { hero, sections } = content;
  const contentSections = sections?.filter((section) => !isValoresSection(section.title)) ?? [];

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
      <Seo
        path="/sobre"
        title="Sobre a Guatá — Agência de turismo jovem e tecnológica de MS"
        description="Conheça a Guatá: agência de turismo inovadora de Mato Grosso do Sul, registrada no Cadastur. Curadoria, tecnologia e parceiros locais para viagens no Pantanal, Bonito e no mundo."
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-16 lg:py-20">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent"
          aria-hidden="true"
        />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              Sobre nós
            </Badge>

            <div className="mx-auto mb-8 inline-flex rounded-2xl border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur-sm">
              {agencyLogo ? (
                <StorageImage
                  src={agencyLogo}
                  alt="Guatá Viagens e Turismo"
                  className="h-24 w-auto max-w-[min(100%,280px)] object-contain sm:h-28"
                />
              ) : (
                <img
                  src={defaultLogo}
                  alt="Guatá Viagens e Turismo"
                  className="h-24 w-auto max-w-[min(100%,220px)] object-contain sm:h-28"
                />
              )}
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              {normalizeCmsText(hero?.title) || 'Sobre a Guatá'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              {normalizeCmsText(hero?.subtitle) || 'Conheça nossa história e missão'}
            </p>
          </div>
        </div>
      </section>

      {/* História + Missão (CMS) */}
      {contentSections.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {contentSections.map((section, index) => {
                const Icon = getSectionIcon(section.title);
                return (
                  <Card
                    key={index}
                    className="h-full border-2 transition-colors hover:border-primary/50 hover:shadow-md"
                  >
                    <CardHeader>
                      <Icon className="mb-2 h-10 w-10 text-primary" />
                      <CardTitle className="font-display text-xl">{normalizeCmsText(section.title)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {normalizeCmsText(section.content)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Nossos Valores */}
      <section className="bg-muted/50 py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Nossos Valores</h2>
            <p className="mt-4 text-muted-foreground">
              O que nos move e define cada experiência que criamos
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {valores.map((valor) => (
              <Card
                key={valor.title}
                className="border-2 text-center transition-colors hover:border-primary/50 hover:shadow-md"
              >
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

      {/* Cadastur */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Credenciais e Segurança</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Somos uma agência regularizada junto ao Ministério do Turismo, garantindo segurança e
              confiabilidade para nossos clientes.
            </p>
          </div>
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:flex-row">
            <div className="flex-shrink-0 md:w-1/2">
              <StorageImage
                src={certImage}
                alt="Certificado Cadastur - Ministério do Turismo"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="font-display text-xl font-semibold">Cadastur Nº {cadasturNumber}</h3>
              </div>
              <p className="text-muted-foreground">{cadasturDescription}</p>
              <p className="text-sm text-muted-foreground">
                <strong>Validade:</strong> {cadasturValidity}
              </p>
              <a
                href="https://cadastur.turismo.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Verificar autenticidade no site do Cadastur
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Pronto para sua próxima aventura?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Entre em contato e deixe-nos criar a viagem dos seus sonhos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/viagem-personalizada">Solicitar Orçamento</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contato">Fale Conosco</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;

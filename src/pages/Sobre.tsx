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
import { Button } from '@/components/ui/button';
import cadasturCertificate from '@/assets/cadastur-certificate.png';
import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StorageImage } from '@/components/ui/StorageImage';
import { normalizeCmsText } from '@/lib/normalizeCmsText';
import { useI18n } from '@/lib/i18n';

const defaultContent = {
  hero: {
    title: 'Sobre o Guatá',
    subtitle: 'Conheça nossa história e missão de criar experiências de viagem inesquecíveis',
  },
  sections: [
    {
      title: 'Nossa História',
      content:
        'O Guatá nasceu do amor por viagens e da vontade de proporcionar experiências únicas e autênticas. Nosso nome vem do tupi-guarani e significa "andar", "caminhar" - e é exatamente isso que fazemos: caminhamos ao lado dos nossos viajantes em cada etapa de sua jornada.\n\nDesde nossa fundação, já ajudamos centenas de pessoas a descobrir destinos incríveis, criando memórias que duram para sempre.',
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
  const { t } = useI18n();
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
      } | null;
    },
  });

  const cadasturNumber = cadasturConfig?.number || '64.677.632/0001-77';
  const cadasturValidity = cadasturConfig?.validity || '27/01/2026 a 27/01/2028';
  const cadasturDescription =
    cadasturConfig?.description ||
    'O Cadastur é o cadastro oficial de prestadores de serviços turísticos no Ministério do Turismo.';
  const certImage = cadasturConfig?.certificate_image_url || cadasturCertificate;

  const content = page?.content || defaultContent;
  const { hero, sections } = content;
  const contentSections = sections?.filter((section) => !isValoresSection(section.title)) ?? [];

  const valores = [
    { icon: Heart, title: t('aboutVal1t'), description: t('aboutVal1d') },
    { icon: Users, title: t('aboutVal2t'), description: t('aboutVal2d') },
    { icon: Award, title: t('aboutVal3t'), description: t('aboutVal3d') },
    { icon: MapPin, title: t('aboutVal4t'), description: t('aboutVal4d') },
  ];

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo path="/sobre" title={t('seoAboutTitle')} description={t('seoAboutDesc')} />

      <section className="bg-gradient-to-br from-primary/20 via-primary/5 to-background py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-px w-8 bg-primary" />
              {t('aboutEyebrow')}
              <span className="h-px w-8 bg-primary" />
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              {normalizeCmsText(hero?.title) || t('aboutHeroTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {normalizeCmsText(hero?.subtitle) || t('aboutHeroSub')}
            </p>
          </div>
        </div>
      </section>

      {contentSections.length > 0 && (
        <section className="bg-muted/40 py-16 lg:py-20">
          <div className="container mx-auto max-w-4xl space-y-12 px-4 lg:px-8">
            {contentSections.map((section, index) => {
              const Icon = getSectionIcon(section.title);
              return (
                <div key={index} className="grid gap-4 md:grid-cols-[auto_1fr] md:gap-8">
                  <Icon className="h-8 w-8 text-primary" aria-hidden />
                  <div>
                    <h2 className="font-display text-2xl font-semibold">{normalizeCmsText(section.title)}</h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                      {normalizeCmsText(section.content)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="border-y bg-background py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('aboutValuesTitle')}</h2>
            <p className="mt-3 text-muted-foreground">{t('aboutValuesSub')}</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            {valores.map((valor) => (
              <div key={valor.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <valor.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{valor.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{valor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold">{t('aboutCredTitle')}</h2>
            <p className="mt-2 text-primary-foreground/80">{t('aboutCredSub')}</p>
          </div>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-start">
            <StorageImage
              src={certImage}
              alt="Certificado Cadastur"
              className="w-full max-w-xs rounded-lg border border-primary-foreground/20 shadow-sm md:max-w-sm"
            />
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
                <span className="font-display font-semibold">Cadastur Nº {cadasturNumber}</span>
              </div>
              <p className="text-sm text-primary-foreground/85">{cadasturDescription}</p>
              <p className="text-sm text-primary-foreground/85">
                {t('aboutValidity')}: {cadasturValidity}
              </p>
              <a
                href="https://cadastur.turismo.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:underline"
              >
                {t('aboutVerify')}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-primary py-16 text-primary-foreground lg:py-20">
        <div className="container mx-auto px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t('aboutCtaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-90">{t('aboutCtaSub')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-amber-400 text-foreground hover:bg-amber-300">
              <Link to="/viagem-personalizada">{t('aboutCtaQuote')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/contato">{t('aboutCtaContact')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;

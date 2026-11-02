import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedExperiences } from '@/components/home/FeaturedExperiences';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { DestinationsShowcase, WhyGuata, FinalCTA } from '@/components/home/LandingSections';
import { useHomepageSections } from '@/hooks/useHomepageSections';
import { Seo, SITE_NAME, DEFAULT_OG_IMAGE } from '@/components/seo/Seo';
import { useI18n } from '@/lib/i18n';

const Index = () => {
  const { data: sections } = useHomepageSections();
  const { t } = useI18n();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      '@id': 'https://www.agenciaguata.com/#organization',
      name: SITE_NAME,
      url: 'https://www.agenciaguata.com/',
      logo: 'https://www.agenciaguata.com/favicon-512.png',
      image: DEFAULT_OG_IMAGE,
      description: t('seoHomeDesc'),
      areaServed: [{ '@type': 'Country', name: 'Brasil' }, { '@type': 'Continent', name: 'América do Sul' }, { '@type': 'Continent', name: 'Europa' }, { '@type': 'Place', name: 'Mundo' }],
      knowsAbout: ['Viagens personalizadas', 'Viagens internacionais', 'Viagens nacionais', 'Lua de mel', 'Viagens em família', 'Pantanal', 'Bonito', 'Ecoturismo'],
      availableLanguage: ['pt-BR', 'en', 'es'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t('seoHomeTitle'),
      description: t('seoHomeDesc'),
      url: 'https://www.agenciaguata.com/',
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: 'https://www.agenciaguata.com/' },
    },
  ];

  return (
    <>
      <Seo path="/" title={t('seoHomeTitle')} description={t('seoHomeDesc')} rawTitle jsonLd={jsonLd} />
      <HeroSection />
      <DestinationsShowcase />
      <WhyGuata />
      <HowItWorks />
      {sections?.featured_experiences !== false && <FeaturedExperiences />}
      {sections?.testimonials !== false && <TestimonialsSection />}
      <FinalCTA />
    </>
  );
};

export default Index;

import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedExperiences } from '@/components/home/FeaturedExperiences';
import { CustomTravelCTA } from '@/components/home/CustomTravelCTA';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { useHomepageSections } from '@/hooks/useHomepageSections';
import { Seo } from '@/components/seo/Seo';

const Index = () => {
  const { data: sections } = useHomepageSections();

  return (
    <>
      <Seo
        path="/"
        title="Guatá Viagens — A melhor agência de turismo de Mato Grosso do Sul"
        rawTitle
        description="Agência de turismo jovem e tecnológica de Mato Grosso do Sul. Especialista no Pantanal e Bonito, criamos viagens sob medida pelo Brasil e exterior. Peça seu roteiro personalizado."
      />
      <HeroSection />
      <HowItWorks />
      {sections?.featured_experiences !== false && <FeaturedExperiences />}
      {sections?.custom_travel_cta !== false && <CustomTravelCTA />}
      {sections?.testimonials !== false && <TestimonialsSection />}
    </>
  );
};

export default Index;


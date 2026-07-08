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
        title="Guatá Viagens e Turismo"
        rawTitle
        description="Agência receptiva nascida em Mato Grosso do Sul. Organizamos viagens completas pelo Brasil e exterior com curadoria e parceiros locais credenciados."
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


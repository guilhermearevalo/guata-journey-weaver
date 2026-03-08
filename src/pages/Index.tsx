import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedExperiences } from '@/components/home/FeaturedExperiences';
import { CustomTravelCTA } from '@/components/home/CustomTravelCTA';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { useHomepageSections } from '@/hooks/useHomepageSections';

const Index = () => {
  const { data: sections } = useHomepageSections();

  return (
    <>
      <HeroSection />
      {sections?.featured_experiences !== false && <FeaturedExperiences />}
      {sections?.custom_travel_cta !== false && <CustomTravelCTA />}
      {sections?.testimonials !== false && <TestimonialsSection />}
    </>
  );
};

export default Index;

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedExperiences } from '@/components/home/FeaturedExperiences';
import { CustomTravelCTA } from '@/components/home/CustomTravelCTA';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturedExperiences />
      <CustomTravelCTA />
      <TestimonialsSection />
    </>
  );
};

export default Index;

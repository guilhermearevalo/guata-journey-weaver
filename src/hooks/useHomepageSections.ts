import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageSections {
  featured_experiences: boolean;
  custom_travel_cta: boolean;
  testimonials: boolean;
}

const DEFAULT_SECTIONS: HomepageSections = {
  featured_experiences: true,
  custom_travel_cta: true,
  testimonials: true,
};

export function useHomepageSections() {
  return useQuery({
    queryKey: ['site-setting', 'homepage_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_sections')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return DEFAULT_SECTIONS;
      return { ...DEFAULT_SECTIONS, ...(data.value as unknown as Partial<HomepageSections>) };
    },
    staleTime: 1000 * 60 * 5,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CadasturConfig = {
  number?: string;
  validity?: string;
  description?: string;
  certificate_image_url?: string;
  agency_logo_url?: string;
};

export function useCadasturConfig() {
  return useQuery({
    queryKey: ['site-setting', 'cadastur_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cadastur_config')
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as CadasturConfig | null;
    },
    staleTime: 60_000,
  });
}

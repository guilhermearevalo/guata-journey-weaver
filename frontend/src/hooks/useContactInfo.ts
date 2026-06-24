import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactInfo {
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

export interface AgencyLocation {
  address: string;
  latitude: string;
  longitude: string;
  zoom: string;
}

const defaultContact: ContactInfo = {
  address: 'Mato Grosso do Sul, Brasil',
  phone: '(67) 99999-9999',
  whatsapp: '5567999999999',
  email: 'contato@guata.travel',
  hours: 'Segunda a Sexta: 9h às 18h',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
};

const defaultLocation: AgencyLocation = {
  address: 'Campo Grande, MS - Brasil',
  latitude: '-20.4697',
  longitude: '-54.6201',
  zoom: '14',
};

export function useContactInfo() {
  return useQuery({
    queryKey: ['site-setting', 'contact_info'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact_info')
        .maybeSingle();
      return { ...defaultContact, ...((data?.value as Partial<ContactInfo>) || {}) };
    },
  });
}

export function useAgencyLocation() {
  return useQuery({
    queryKey: ['site-setting', 'agency_location'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'agency_location')
        .maybeSingle();
      return { ...defaultLocation, ...((data?.value as Partial<AgencyLocation>) || {}) };
    },
  });
}

export function buildMapEmbedUrl(loc: AgencyLocation): string {
  const lat = loc.latitude || defaultLocation.latitude;
  const lng = loc.longitude || defaultLocation.longitude;
  const zoom = loc.zoom || '14';
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

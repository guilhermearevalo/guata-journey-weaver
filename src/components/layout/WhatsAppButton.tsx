import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  message: string;
}

export function WhatsAppButton() {
  const { data: config } = useQuery({
    queryKey: ['site-setting', 'whatsapp_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_config')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return null;
      return data.value as unknown as WhatsAppConfig;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!config?.enabled || !config.number) return null;

  const cleanNumber = config.number.replace(/\D/g, '');
  const url = `https://wa.me/${cleanNumber}${config.message ? `?text=${encodeURIComponent(config.message)}` : ''}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: '#25D366' }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.129 6.744 3.047 9.379L1.054 31.27l6.1-1.957A15.907 15.907 0 0016.004 32C24.826 32 32 24.824 32 16.004S24.826 0 16.004 0zm9.32 22.608c-.39 1.1-2.283 2.103-3.156 2.166-.873.063-1.685.39-5.68-1.182-4.807-1.893-7.86-6.836-8.094-7.152-.235-.316-1.916-2.548-1.916-4.86 0-2.313 1.212-3.45 1.642-3.921.43-.47.937-.588 1.25-.588.312 0 .624.003.898.016.288.014.674-.109.054 1.615-.314.872-1.076 2.648-1.17 2.84-.094.192-.157.416-.032.67.125.254.188.412.375.636.188.224.395.5.563.672.188.188.383.392.655.537.27.145.428.072.598-.043.17-.116 1.142-1.335 1.304-1.575.162-.24.324-.198.548-.12.224.08 1.42.67 1.664.792.243.12.406.18.466.28.06.1.06.576-.33 1.676z" />
      </svg>
    </a>
  );
}

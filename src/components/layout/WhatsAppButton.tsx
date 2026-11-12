import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';

interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  message: string;
}

type BubblePhase = 'wait' | 'dots' | 'type' | 'hold' | 'hide';

function TypingDots() {
  return (
    <span className="flex h-5 items-center gap-1 px-1" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366]"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
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

  const { t, lang } = useI18n();
  const phrase = t('waChat');
  const [phase, setPhase] = useState<BubblePhase>('wait');
  const [typed, setTyped] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let timer = 0;
    if (phase === 'wait') timer = window.setTimeout(() => setPhase('dots'), 1400);
    else if (phase === 'dots') timer = window.setTimeout(() => setPhase('type'), 800);
    else if (phase === 'type') {
      if (typed < phrase.length) timer = window.setTimeout(() => setTyped((n) => n + 1), 42);
      else timer = window.setTimeout(() => setPhase('hold'), 400);
    } else if (phase === 'hold') timer = window.setTimeout(() => setPhase('hide'), 2800);
    else timer = window.setTimeout(() => {
      setTyped(0);
      setPhase('wait');
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [phase, typed, reduceMotion, phrase]);

  useEffect(() => {
    setTyped(0);
    setPhase('dots');
  }, [lang]);

  if (!config?.enabled || !config.number) return null;

  const cleanNumber = config.number.replace(/\D/g, '');
  const url = `https://wa.me/${cleanNumber}${config.message ? `?text=${encodeURIComponent(config.message)}` : ''}`;
  const showBubble = reduceMotion || phase === 'dots' || phase === 'type' || phase === 'hold';
  const showPing = !reduceMotion && (phase === 'dots' || phase === 'type');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 max-md:bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
      {showBubble && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative max-w-[15rem] rounded-2xl rounded-br-md bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-lg ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {phase === 'dots' && !reduceMotion ? (
            <TypingDots />
          ) : (
            <span>
              {reduceMotion ? phrase : phrase.slice(0, typed)}
              {!reduceMotion && phase === 'type' && typed < phrase.length && (
                <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground align-middle" />
              )}
            </span>
          )}
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('waChatAria')}
        className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#25D366' }}
      >
        {showPing && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/50" aria-hidden />
        )}
        <svg viewBox="0 0 24 24" className="relative h-7 w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

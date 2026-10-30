import { Globe, MapPin, ShieldCheck } from 'lucide-react';
import { LANGS, useI18n } from '@/lib/i18n';

export function TopBar() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container mx-auto flex h-10 items-center justify-between gap-4 px-4 text-xs lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span className="hidden sm:inline">{t('topBadge')}</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden items-center gap-1.5 md:inline-flex">
            <MapPin className="h-3.5 w-3.5" />
            {t('topLocation')}
          </span>
          <div className="flex items-center gap-1.5 border-l border-primary-foreground/20 pl-5">
            <Globe className="h-3.5 w-3.5" />
            {LANGS.map((l, i) => (
              <span key={l} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">/</span>}
                <button
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`uppercase transition-opacity ${lang === l ? 'font-bold' : 'opacity-60 hover:opacity-100'}`}
                >
                  {l}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

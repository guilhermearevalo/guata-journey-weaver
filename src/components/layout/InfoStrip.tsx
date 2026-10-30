import { useState } from 'react';
import { ChevronDown, ExternalLink, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const OFFICIAL_SOURCES = [
  {
    titleKey: 'official1Title' as const,
    bodyKey: 'official1Body' as const,
    linkKey: 'official1Link' as const,
    href: 'https://www.descubrams.com',
  },
  {
    titleKey: 'official2Title' as const,
    bodyKey: 'official2Body' as const,
    linkKey: 'official2Link' as const,
    href: 'https://www.turismo.ms.gov.br',
  },
  {
    titleKey: 'official3Title' as const,
    bodyKey: 'official3Body' as const,
    linkKey: 'official3Link' as const,
    href: 'https://www.visitbrasil.com',
  },
  {
    titleKey: 'official4Title' as const,
    bodyKey: 'official4Body' as const,
    linkKey: 'official4Link' as const,
    href: 'https://cadastur.turismo.gov.br',
  },
];

export function InfoStrip() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-sky-100 bg-sky-50/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="container mx-auto flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm lg:px-8"
      >
        <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="font-medium text-foreground">{t('infoStripTitle')}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
        <span className="sr-only">{open ? t('infoStripToggleCollapse') : t('infoStripToggleExpand')}</span>
      </button>

      {open && (
        <div className="container mx-auto grid gap-6 border-t border-sky-100/80 px-4 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {OFFICIAL_SOURCES.map((item) => (
            <div key={item.href} className="space-y-1.5">
              <h2 className="font-display text-sm font-semibold text-foreground">{t(item.titleKey)}</h2>
              <p className="text-sm leading-snug text-muted-foreground">{t(item.bodyKey)}</p>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t(item.linkKey)}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

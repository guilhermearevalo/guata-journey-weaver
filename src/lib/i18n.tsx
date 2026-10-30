import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import { localeResources, type DictKey } from './i18n-resources';

export type { DictKey };
export type Lang = 'pt' | 'en' | 'es';
export const LANGS: Lang[] = ['pt', 'en', 'es'];

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'pt';
  const params = new URLSearchParams(window.location.search);
  const q = params.get('lang');
  if (q === 'en' || q === 'es' || q === 'pt') return q;
  const s = localStorage.getItem('guata-lang');
  return s === 'en' || s === 'es' ? s : 'pt';
}

function syncUrlLang(lang: Lang) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (lang === 'pt') url.searchParams.delete('lang');
  else url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

function applyDocumentLang(lang: Lang) {
  if (typeof window === 'undefined') return;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  localStorage.setItem('guata-lang', lang);
}

if (!i18n.isInitialized) {
  const initial = readInitialLang();
  void i18n.use(initReactI18next).init({
    resources: localeResources,
    lng: initial,
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });
  applyDocumentLang(initial);
  i18n.on('languageChanged', (lng) => {
    const lang = (lng === 'en' || lng === 'es' ? lng : 'pt') as Lang;
    applyDocumentLang(lang);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lang = readInitialLang();
    if (i18n.language !== lang) void i18n.changeLanguage(lang);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function useI18n() {
  const { t: i18nT, i18n: inst } = useTranslation();
  const lang = (inst.language === 'en' || inst.language === 'es' ? inst.language : 'pt') as Lang;

  const setLang = useCallback((l: Lang) => {
    void inst.changeLanguage(l);
    syncUrlLang(l);
  }, [inst]);

  const t = useCallback(
    (k: DictKey, options?: Record<string, string | number>) => i18nT(k, options),
    [i18nT],
  );

  return useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
}

export function hrefForLang(path: string, lang: Lang): string {
  const base = `https://www.agenciaguata.com${path === '/' ? '/' : path}`;
  if (lang === 'pt') return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}lang=${lang}`;
}

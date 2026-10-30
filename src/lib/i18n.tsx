import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'pt' | 'en' | 'es';
export const LANGS: Lang[] = ['pt', 'en', 'es'];

const dict = {
  topLocation: { pt: 'Mato Grosso do Sul, Brasil', en: 'Mato Grosso do Sul, Brazil', es: 'Mato Grosso do Sul, Brasil' },
  topBadge: { pt: 'Agência certificada Cadastur', en: 'Cadastur certified agency', es: 'Agencia certificada Cadastur' },
  navTrips: { pt: 'Viagens Realizadas', en: 'Past trips', es: 'Viajes realizados' },
  navTours: { pt: 'Excursões', en: 'Group tours', es: 'Excursiones' },
  navCustom: { pt: 'Viagem Personalizada', en: 'Tailor-made trip', es: 'Viaje a medida' },
  navFlights: { pt: 'Passagens e hotéis', en: 'Flights & hotels', es: 'Vuelos y hoteles' },
  navAbout: { pt: 'Sobre Nós', en: 'About us', es: 'Nosotros' },
  login: { pt: 'Entrar', en: 'Sign in', es: 'Entrar' },
  planTrip: { pt: 'Montar meu roteiro', en: 'Plan my trip', es: 'Planear mi viaje' },
  heroEyebrow: { pt: 'Sua conexão direta com o Pantanal & Bonito', en: 'Your local connection to the Pantanal & Bonito', es: 'Tu conexión directa con el Pantanal y Bonito' },
  heroLine1: { pt: 'Lugares extraordinários.', en: 'Extraordinary places.', es: 'Lugares extraordinarios.' },
  heroLine2: { pt: 'Conexões pessoais.', en: 'Personal connections.', es: 'Conexiones personales.' },
  heroSub: {
    pt: 'Descubra o Brasil com quem vive aqui. Roteiros pensados com cuidado, especialistas locais e atendimento humano em português, inglês e espanhol.',
    en: 'Discover Brazil with people who call it home. Thoughtfully planned trips, local experts and human support in Portuguese, English and Spanish.',
    es: 'Descubre Brasil con quienes viven aquí. Viajes planeados con cuidado, expertos locales y atención humana en portugués, inglés y español.',
  },
  searchPh: { pt: 'Destino, passagem, hotel... Ex: Bonito', en: 'Destination, flight, hotel... e.g. Bonito', es: 'Destino, vuelo, hotel... Ej: Bonito' },
  search: { pt: 'Buscar', en: 'Search', es: 'Buscar' },
  flights: { pt: 'Passagens', en: 'Flights', es: 'Vuelos' },
  hotels: { pt: 'Hotéis', en: 'Hotels', es: 'Hoteles' },
  ctaExplore: { pt: 'Explorar roteiros', en: 'Explore our trips', es: 'Explorar viajes' },
  ctaExpert: { pt: 'Falar com especialista local', en: 'Talk to a local expert', es: 'Hablar con un experto local' },
  trust1: { pt: 'Receptivo nativo do MS', en: 'Local receptive agency', es: 'Receptivo local de MS' },
  trust2: { pt: 'Atendimento humano', en: 'Real human support', es: 'Atención humana' },
  destEyebrow: { pt: 'Destinos em destaque', en: 'Featured destinations', es: 'Destinos destacados' },
  destTitle: { pt: 'Onde a natureza brasileira acontece', en: 'Where Brazilian nature comes alive', es: 'Donde la naturaleza brasileña cobra vida' },
  destCta: { pt: 'Ver roteiro', en: 'See itinerary', es: 'Ver itinerario' },
  whyEyebrow: { pt: 'Por que a Guatá', en: 'Why Guatá', es: 'Por qué Guatá' },
  whyTitle: { pt: 'Viajar bem é viajar com quem conhece', en: 'Travel better with people who know', es: 'Viajar bien es viajar con quien conoce' },
  why1t: { pt: 'Especialistas locais', en: 'Local experts', es: 'Expertos locales' },
  why1d: { pt: 'Nascemos no Mato Grosso do Sul e conhecemos cada passeio pessoalmente.', en: 'Born in Mato Grosso do Sul, we know every tour first-hand.', es: 'Nacimos en Mato Grosso do Sul y conocemos cada paseo personalmente.' },
  why2t: { pt: 'Roteiro feito com você', en: 'Planned with you', es: 'Itinerario contigo' },
  why2d: { pt: 'Cada viagem é desenhada a quatro mãos, do seu jeito e no seu ritmo.', en: 'Every trip is co-designed, your way and at your pace.', es: 'Cada viaje se diseña juntos, a tu manera y a tu ritmo.' },
  why3t: { pt: 'Cadastur oficial', en: 'Officially certified', es: 'Certificación oficial' },
  why3d: { pt: 'Agência registrada no Ministério do Turismo e parceiros credenciados.', en: 'Registered with Brazil’s Ministry of Tourism, with accredited partners.', es: 'Registrada en el Ministerio de Turismo, con socios acreditados.' },
  why4t: { pt: 'Suporte do início ao fim', en: 'Support start to finish', es: 'Soporte de principio a fin' },
  why4d: { pt: 'Antes, durante e depois da viagem, nossa equipe está com você.', en: 'Before, during and after your trip, our team is with you.', es: 'Antes, durante y después del viaje, nuestro equipo está contigo.' },
  finalTitle: { pt: 'Pronto para a sua próxima história?', en: 'Ready for your next story?', es: '¿Listo para tu próxima historia?' },
  finalSub: { pt: 'Conte o que você sonha. Montamos o roteiro sem compromisso.', en: 'Tell us your dream. We’ll plan it, no strings attached.', es: 'Cuéntanos tu sueño. Armamos el viaje sin compromiso.' },
  flTitle: { pt: 'Por que comprar passagens com a Guatá?', en: 'Why book flights with Guatá?', es: '¿Por qué comprar vuelos con Guatá?' },
  fl1: { pt: 'Suporte humano antes, durante e após o voo', en: 'Human support before, during and after your flight', es: 'Soporte humano antes, durante y después del vuelo' },
  fl2: { pt: 'Agência certificada Cadastur', en: 'Cadastur certified agency', es: 'Agencia certificada Cadastur' },
  fl3: { pt: 'Pacote completo com passeios e transfer', en: 'Full packages with tours and transfers', es: 'Paquetes completos con paseos y traslados' },
  flQuote: { pt: 'Pedir cotação a um consultor', en: 'Request a quote from an expert', es: 'Pedir cotización a un asesor' },
} as const;

export type DictKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => dict[k].pt,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('guata-lang') : null;
    return s === 'en' || s === 'es' ? s : 'pt';
  });
  useEffect(() => {
    localStorage.setItem('guata-lang', lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

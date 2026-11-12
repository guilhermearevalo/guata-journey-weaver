import type { Destination } from './destinations';
import type { Lang } from './i18n';

type Copy = Omit<Destination, 'slug' | 'name' | 'image'>;

const en: Record<string, Copy> = {
  'bonito-ms': {
    region: 'Mato Grosso do Sul',
    tagline: 'Clear rivers, caves and snorkeling among fish',
    seoTitle: 'Bonito (MS) itinerary: what to do in 4 days',
    seoDescription:
      'A complete Bonito itinerary: snorkeling, Blue Lake Cave, waterfalls and the best time to go. Plan it with Guatá, a Cadastur-certified agency.',
    intro:
      'Bonito is one of Brazil’s most awarded ecotourism destinations. Clear rivers, striking caves and a well-run tourism system make it a great trip for couples, families and groups.',
    bestTime: 'December to March for full waterfalls; April to September for clearer water and milder weather.',
    idealDays: '4 to 5 days',
    highlights: ['Snorkeling in Rio da Prata or Sucuri', 'Blue Lake Cave', 'Buraco das Araras', 'Estância Mimosa waterfalls', 'Municipal bathing area'],
    itinerary: [
      { day: 'Day 1', title: 'Arrival and river beach', description: 'Arrival, check-in and an afternoon swim among fish at the municipal bathing area.' },
      { day: 'Day 2', title: 'Snorkeling', description: 'Morning snorkeling in Rio da Prata and an afternoon visit to Buraco das Araras.' },
      { day: 'Day 3', title: 'Caves', description: 'Blue Lake Cave and São Miguel Cave, with dinner downtown.' },
      { day: 'Day 4', title: 'Waterfalls', description: 'A trail with swims at Estância Mimosa or Boca da Onça.' },
    ],
    tips: ['Tours have limited spots: book ahead.', 'Do not use sunscreen or repellent before snorkeling.', 'Bring a swimsuit, a towel and shoes that can get wet.'],
    faq: [
      { q: 'How long should I stay in Bonito?', a: 'Four to five days is enough for the main tours without rushing.' },
      { q: 'Do I need an agency to visit Bonito?', a: 'Yes. The attractions must be booked through an accredited agency, such as Guatá.' },
    ],
  },
  pantanal: {
    region: 'Mato Grosso and Mato Grosso do Sul',
    tagline: 'A photo safari on the world’s largest wetland',
    seoTitle: 'Pantanal trip: itinerary, jaguars and best season',
    seoDescription:
      'Plan a Pantanal trip: photo safari, jaguar watching, lodges and the best season. A tailor-made itinerary with Guatá, a Cadastur agency.',
    intro:
      'The Pantanal is a natural World Heritage site and one of the best places on earth to watch wildlife in the open: jaguars, caimans, jabiru storks, giant otters and hundreds of bird species.',
    bestTime: 'June to October (dry season) to see more animals; December to March for flooded landscapes.',
    idealDays: '4 to 6 days',
    highlights: ['Jaguar watching', 'Dawn boat ride', 'Pantanal horseback ride', 'Night spotlighting', 'Transpantaneira'],
    itinerary: [
      { day: 'Day 1', title: 'Transpantaneira', description: 'Drive along the Transpantaneira with stops to photograph birds and caimans.' },
      { day: 'Day 2', title: 'River and wildlife', description: 'A dawn boat ride and a horseback ride in the late afternoon.' },
      { day: 'Day 3', title: 'Jaguars', description: 'A boat expedition from Porto Jofre to look for jaguars.' },
      { day: 'Day 4', title: 'Farewell', description: 'A morning trail, a Pantanal breakfast and the trip back.' },
    ],
    tips: ['Wear neutral colors and long sleeves.', 'Bring binoculars and a zoom lens.', 'Repellent is essential.'],
    faq: [
      { q: 'When is the best time to see jaguars in the Pantanal?', a: 'From July to October, around Porto Jofre, the odds are very high.' },
      { q: 'North or South Pantanal?', a: 'The North (Mato Grosso) is famous for jaguars; the South (Mato Grosso do Sul) pairs well with Bonito.' },
    ],
  },
  'chapada-dos-guimaraes': {
    region: 'Mato Grosso',
    tagline: 'Canyons, waterfalls and viewpoints an hour from Cuiabá',
    seoTitle: 'Chapada dos Guimarães: a weekend itinerary',
    seoDescription:
      'What to do in Chapada dos Guimarães: Véu de Noiva, Cidade de Pedra, waterfalls and viewpoints. A custom itinerary with Guatá, a Cadastur agency.',
    intro:
      'Chapada dos Guimarães brings sandstone cliffs, waterfalls and Mato Grosso’s most famous sunset. It is an easy weekend trip from Cuiabá.',
    bestTime: 'May to September for dry trails; November to March for full waterfalls.',
    idealDays: '2 to 3 days',
    highlights: ['Véu de Noiva waterfall', 'Cidade de Pedra', 'Waterfall circuit', 'Geodesic Center viewpoint', 'Aroe Jari cave'],
    itinerary: [
      { day: 'Day 1', title: 'Viewpoints', description: 'Véu de Noiva, the historic center and sunset at the viewpoint.' },
      { day: 'Day 2', title: 'Waterfalls', description: 'The waterfall circuit with an accredited guide.' },
      { day: 'Day 3', title: 'Cidade de Pedra', description: 'A visit to the Cidade de Pedra cliffs and the return trip.' },
    ],
    tips: ['Several sites require an accredited guide.', 'Bring trail shoes and water.', 'Start early to avoid the heat.'],
    faq: [
      { q: 'Do I need a guide in Chapada dos Guimarães?', a: 'Yes, at National Park sites such as the waterfall circuit and Cidade de Pedra.' },
      { q: 'Can I do it in one day?', a: 'Yes, but two or three days let you enjoy it without rushing.' },
    ],
  },
};

const es: Record<string, Copy> = {
  'bonito-ms': {
    region: 'Mato Grosso do Sul',
    tagline: 'Ríos transparentes, grutas y flotar entre peces',
    seoTitle: 'Itinerario en Bonito (MS): qué hacer en 4 días',
    seoDescription:
      'Itinerario completo de Bonito: flotar, Gruta del Lago Azul, cascadas y mejor época. Planéelo con Guatá, agencia certificada Cadastur.',
    intro:
      'Bonito es uno de los destinos de ecoturismo más premiados de Brasil. Ríos transparentes, grutas impresionantes y una operación turística organizada lo hacen ideal para parejas, familias y grupos.',
    bestTime: 'De diciembre a marzo para cascadas llenas; de abril a septiembre para aguas más transparentes y clima suave.',
    idealDays: '4 a 5 días',
    highlights: ['Flotar en el Río de la Plata o Sucuri', 'Gruta del Lago Azul', 'Buraco das Araras', 'Cascadas de Estância Mimosa', 'Balneario municipal'],
    itinerary: [
      { day: 'Día 1', title: 'Llegada y balneario', description: 'Llegada, check-in y tarde de baño entre peces en el balneario municipal.' },
      { day: 'Día 2', title: 'Flotar', description: 'Flotar en el Río de la Plata por la mañana y visita al Buraco das Araras por la tarde.' },
      { day: 'Día 3', title: 'Grutas', description: 'Gruta del Lago Azul y Gruta de São Miguel, con cena en el centro.' },
      { day: 'Día 4', title: 'Cascadas', description: 'Sendero con baños en las cascadas de Estância Mimosa o Boca da Onça.' },
    ],
    tips: ['Los paseos tienen cupos limitados: reserve con anticipación.', 'No use protector solar ni repelente antes de flotar.', 'Lleve traje de baño, toalla y calzado que pueda mojarse.'],
    faq: [
      { q: '¿Cuánto tiempo quedarse en Bonito?', a: 'Lo ideal son 4 a 5 días para hacer los principales paseos sin apuro.' },
      { q: '¿Hace falta una agencia para ir a Bonito?', a: 'Sí. Los atractivos exigen reserva por una agencia acreditada, como Guatá.' },
    ],
  },
  pantanal: {
    region: 'Mato Grosso y Mato Grosso do Sul',
    tagline: 'Safari fotográfico en la mayor llanura inundable del mundo',
    seoTitle: 'Viaje al Pantanal: itinerario, jaguares y mejor época',
    seoDescription:
      'Planee su viaje al Pantanal: safari fotográfico, avistaje de jaguares, posadas y mejor época. Itinerario a medida con Guatá, agencia Cadastur.',
    intro:
      'El Pantanal es patrimonio natural de la humanidad y uno de los mejores lugares del planeta para ver animales libres: jaguares, yacarés, jabirús, nutrias gigantes y cientos de especies de aves.',
    bestTime: 'De junio a octubre (seca) para ver más animales; de diciembre a marzo para paisajes inundados.',
    idealDays: '4 a 6 días',
    highlights: ['Avistaje de jaguar', 'Paseo en lancha al amanecer', 'Cabalgata pantanera', 'Focaje nocturno', 'Transpantaneira'],
    itinerary: [
      { day: 'Día 1', title: 'Transpantaneira', description: 'Salida por la Transpantaneira con paradas para fotos de aves y yacarés.' },
      { day: 'Día 2', title: 'Río y fauna', description: 'Paseo en lancha al amanecer y cabalgata al final de la tarde.' },
      { day: 'Día 3', title: 'Jaguares', description: 'Expedición en lancha desde Porto Jofre para avistar jaguares.' },
      { day: 'Día 4', title: 'Despedida', description: 'Sendero matinal, desayuno pantanero y regreso.' },
    ],
    tips: ['Use ropa de colores neutros y mangas largas.', 'Lleve binoculares y lente zoom.', 'El repelente es indispensable.'],
    faq: [
      { q: '¿Cuál es la mejor época para ver jaguares en el Pantanal?', a: 'De julio a octubre, en la región de Porto Jofre, las chances son muy altas.' },
      { q: '¿Pantanal Norte o Sur?', a: 'El Norte (Mato Grosso) es famoso por los jaguares; el Sur (Mato Grosso do Sul) combina bien con Bonito.' },
    ],
  },
  'chapada-dos-guimaraes': {
    region: 'Mato Grosso',
    tagline: 'Cañones, cascadas y miradores a una hora de Cuiabá',
    seoTitle: 'Chapada dos Guimarães: itinerario de fin de semana',
    seoDescription:
      'Qué hacer en Chapada dos Guimarães: Véu de Noiva, Cidade de Pedra, cascadas y miradores. Itinerario personalizado con Guatá, agencia Cadastur.',
    intro:
      'La Chapada dos Guimarães reúne paredones de arenisca, cascadas y la puesta de sol más famosa de Mato Grosso. Perfecta para un fin de semana desde Cuiabá.',
    bestTime: 'De mayo a septiembre para senderos secos; de noviembre a marzo para cascadas caudalosas.',
    idealDays: '2 a 3 días',
    highlights: ['Cascada Véu de Noiva', 'Cidade de Pedra', 'Circuito de las cascadas', 'Mirador del Centro Geodésico', 'Cueva Aroe Jari'],
    itinerary: [
      { day: 'Día 1', title: 'Miradores', description: 'Véu de Noiva, centro histórico y puesta de sol en el mirador.' },
      { day: 'Día 2', title: 'Cascadas', description: 'Circuito de las cascadas con guía acreditado.' },
      { day: 'Día 3', title: 'Cidade de Pedra', description: 'Paseo a los paredones de Cidade de Pedra y regreso.' },
    ],
    tips: ['Varios atractivos exigen guía acreditado.', 'Lleve zapatillas de trekking y agua.', 'Salga temprano para evitar el calor.'],
    faq: [
      { q: '¿Hace falta guía en Chapada dos Guimarães?', a: 'Sí, en atractivos del Parque Nacional como el circuito de las cascadas y Cidade de Pedra.' },
      { q: '¿Se puede ir en un día?', a: 'Sí, pero 2 o 3 días permiten disfrutarlo sin prisa.' },
    ],
  },
};

export function localizeDestination(destination: Destination, lang: Lang): Destination {
  if (lang === 'pt') return destination;
  const copy = (lang === 'en' ? en : es)[destination.slug];
  if (!copy) return destination;
  return { ...destination, ...copy };
}

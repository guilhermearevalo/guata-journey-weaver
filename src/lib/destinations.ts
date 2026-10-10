export interface Destination {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  image: string;
  intro: string;
  bestTime: string;
  idealDays: string;
  highlights: string[];
  itinerary: { day: string; title: string; description: string }[];
  tips: string[];
  faq: { q: string; a: string }[];
}

export const destinations: Destination[] = [
  {
    slug: 'bonito-ms',
    name: 'Bonito',
    region: 'Mato Grosso do Sul',
    tagline: 'Águas cristalinas, grutas e flutuação entre peixes',
    seoTitle: 'Roteiro em Bonito (MS): o que fazer em 4 dias',
    seoDescription:
      'Roteiro completo de Bonito MS: flutuação, Gruta do Lago Azul, cachoeiras e melhor época. Monte sua viagem com a Guatá, agência certificada Cadastur.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80&auto=format&fit=crop',
    intro:
      'Bonito é um dos destinos de ecoturismo mais premiados do Brasil. Rios de água transparente, grutas impressionantes e uma operação turística organizada fazem da cidade uma viagem perfeita para casais, famílias e grupos.',
    bestTime: 'De dezembro a março para cachoeiras cheias; de abril a setembro para águas mais transparentes e clima ameno.',
    idealDays: '4 a 5 dias',
    highlights: ['Flutuação no Rio da Prata ou Sucuri', 'Gruta do Lago Azul', 'Buraco das Araras', 'Estância Mimosa e cachoeiras', 'Balneário Municipal'],
    itinerary: [
      { day: 'Dia 1', title: 'Chegada e Balneário', description: 'Chegada, check-in e tarde de banho com peixes no Balneário Municipal.' },
      { day: 'Dia 2', title: 'Flutuação', description: 'Flutuação no Rio da Prata pela manhã e visita ao Buraco das Araras à tarde.' },
      { day: 'Dia 3', title: 'Grutas', description: 'Gruta do Lago Azul e Gruta de São Miguel, com jantar no centro.' },
      { day: 'Dia 4', title: 'Cachoeiras', description: 'Trilha com banhos nas cachoeiras da Estância Mimosa ou Boca da Onça.' },
    ],
    tips: ['Passeios têm vagas limitadas: reserve com antecedência.', 'Não use protetor solar ou repelente antes da flutuação.', 'Leve roupa de banho, toalha e calçado que possa molhar.'],
    faq: [
      { q: 'Quanto tempo ficar em Bonito?', a: 'O ideal são 4 a 5 dias para fazer os principais passeios sem correria.' },
      { q: 'Precisa de agência para ir a Bonito?', a: 'Sim. Os atrativos exigem reserva por agência credenciada, como a Guatá.' },
    ],
  },
  {
    slug: 'pantanal',
    name: 'Pantanal',
    region: 'Mato Grosso e Mato Grosso do Sul',
    tagline: 'Safári fotográfico na maior planície alagada do mundo',
    seoTitle: 'Viagem ao Pantanal: roteiro, onças e melhor época',
    seoDescription:
      'Planeje sua viagem ao Pantanal: safári fotográfico, observação de onças, pousadas e melhor época. Roteiro sob medida com a Guatá, agência Cadastur.',
    image: 'https://images.unsplash.com/photo-1591824438708-ce405f36ba3d?w=1600&q=80&auto=format&fit=crop',
    intro:
      'O Pantanal é patrimônio natural da humanidade e um dos melhores lugares do planeta para observar animais livres: onças-pintadas, jacarés, tuiuiús, ariranhas e centenas de espécies de aves.',
    bestTime: 'De junho a outubro (seca) para ver mais animais; de dezembro a março para paisagens alagadas.',
    idealDays: '4 a 6 dias',
    highlights: ['Observação de onça-pintada', 'Passeio de barco ao amanhecer', 'Cavalgada pantaneira', 'Focagem noturna', 'Transpantaneira'],
    itinerary: [
      { day: 'Dia 1', title: 'Transpantaneira', description: 'Saída rumo à Transpantaneira com paradas para fotos de aves e jacarés.' },
      { day: 'Dia 2', title: 'Rio e fauna', description: 'Passeio de barco ao amanhecer e cavalgada no fim da tarde.' },
      { day: 'Dia 3', title: 'Onças', description: 'Expedição de barco em Porto Jofre para avistar onças-pintadas.' },
      { day: 'Dia 4', title: 'Despedida', description: 'Trilha matinal, café pantaneiro e retorno.' },
    ],
    tips: ['Use roupas de cores neutras e mangas longas.', 'Leve binóculo e lente zoom.', 'Repelente é indispensável.'],
    faq: [
      { q: 'Qual a melhor época para ver onças no Pantanal?', a: 'De julho a outubro, na região de Porto Jofre, as chances são muito altas.' },
      { q: 'Pantanal Norte ou Sul?', a: 'O Norte (MT) é famoso pelas onças; o Sul (MS) combina bem com Bonito.' },
    ],
  },
  {
    slug: 'chapada-dos-guimaraes',
    name: 'Chapada dos Guimarães',
    region: 'Mato Grosso',
    tagline: 'Cânions, cachoeiras e mirantes a uma hora de Cuiabá',
    seoTitle: 'Chapada dos Guimarães: roteiro de fim de semana',
    seoDescription:
      'O que fazer na Chapada dos Guimarães: Véu de Noiva, Cidade de Pedra, cachoeiras e mirantes. Roteiro personalizado com a Guatá, agência Cadastur.',
    image: 'https://images.unsplash.com/photo-1601919051950-bb9f3ffb3fee?w=1600&q=80&auto=format&fit=crop',
    intro:
      'A Chapada dos Guimarães reúne paredões de arenito, cachoeiras e o pôr do sol mais famoso de Mato Grosso. Perfeita para um fim de semana saindo de Cuiabá.',
    bestTime: 'De maio a setembro para trilhas secas; de novembro a março para cachoeiras volumosas.',
    idealDays: '2 a 3 dias',
    highlights: ['Cachoeira Véu de Noiva', 'Cidade de Pedra', 'Circuito das Cachoeiras', 'Mirante do Centro Geodésico', 'Caverna Aroe Jari'],
    itinerary: [
      { day: 'Dia 1', title: 'Mirantes', description: 'Véu de Noiva, centro histórico e pôr do sol no mirante.' },
      { day: 'Dia 2', title: 'Cachoeiras', description: 'Circuito das Cachoeiras com guia credenciado.' },
      { day: 'Dia 3', title: 'Cidade de Pedra', description: 'Passeio aos paredões da Cidade de Pedra e retorno.' },
    ],
    tips: ['Vários atrativos exigem guia credenciado.', 'Leve tênis de trilha e água.', 'Saia cedo para evitar o calor.'],
    faq: [
      { q: 'Precisa de guia na Chapada dos Guimarães?', a: 'Sim, em atrativos do Parque Nacional como o Circuito das Cachoeiras e a Cidade de Pedra.' },
      { q: 'Dá para ir em um dia?', a: 'Dá, mas 2 a 3 dias permitem aproveitar sem pressa.' },
    ],
  },
];

export const getDestination = (slug?: string) => destinations.find((d) => d.slug === slug);

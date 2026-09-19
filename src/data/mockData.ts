import { DaySchedule, GroupNote, PollOption, SavedTripSummary, TravelDocument, VacationPeriod } from '../types';

export const USER_PROFILE = {
  name: 'Marcelo Costa',
  email: 'marcelo.costa@smarttrip.ai',
  handle: 'Explorador',
  level: 'Nível 4',
  isPro: true,
  bio: 'Explorando o mundo um roteiro inteligente por vez 🌍✈️ | Amante de cultura e boa gastronomia.',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  stats: {
    countriesVisited: 14,
    itinerariesGenerated: 6,
    savedWithAI: 'R$ 2.450',
    savedTips: 32,
  },
  travelDNA: {
    styles: ['Gastronomia', 'História', 'Fotografia', 'Ritmo Relaxado', 'Cidades a pé'],
    defaultBudget: 'Moderado Confort',
    suggestedPace: 'Equilibrado (3–4/dia)',
  },
  savedTrips: [
    {
      id: 'lisboa-2024',
      title: 'Lisboa 2024',
      status: 'Roteiro Ativo',
      statusColor: 'bg-[#FFF0ED] text-[#fd6a49]',
      duration: '5 dias',
      nextStop: 'Próxima parada: Miradouro de Santa Luzia',
      image: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'toquio-sonhos',
      title: 'Tóquio dos Sonhos',
      status: 'Em Rascunho',
      statusColor: 'bg-slate-700 text-purple-300',
      duration: '12 dias',
      nextStop: 'Otimizando ordem de transporte',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
    },
  ],
};

export const MOCK_VACATION_PERIODS: VacationPeriod[] = [
  {
    id: 'vac-1',
    title: 'Férias de Outono',
    startDate: '2026-10-10',
    endDate: '2026-10-20',
    status: 'em_breve',
    daysCount: 10,
  },
  {
    id: 'vac-2',
    title: 'Feriado Prolongado Novembro',
    startDate: '2026-11-14',
    endDate: '2026-11-17',
    status: 'em_breve',
    daysCount: 4,
  },
  {
    id: 'vac-3',
    title: 'Férias de Verão Passadas',
    startDate: '2026-01-05',
    endDate: '2026-01-20',
    status: 'concluida',
    daysCount: 15,
  },
];

export const MOCK_SAVED_TRIPS: SavedTripSummary[] = [
  {
    id: 'lisboa-2024',
    title: 'Lisboa & Porto',
    destination: 'Portugal',
    status: 'Roteiro Ativo',
    statusColor: 'bg-[#FFF0ED] text-[#fd6a49]',
    duration: '5 dias',
    startDate: '2026-10-10',
    endDate: '2026-10-15',
    nextStop: 'Próxima parada: Miradouro de Santa Luzia',
    image: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=400&q=80',
    isUserEdited: true,
  },
  {
    id: 'toquio-sonhos',
    title: 'Tóquio dos Sonhos',
    destination: 'Japão',
    status: 'Em Rascunho',
    statusColor: 'bg-slate-700 text-purple-300',
    duration: '12 dias',
    startDate: '2026-11-14',
    endDate: '2026-11-26',
    nextStop: 'Otimizando ordem de transporte Shinkansen',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
    isUserEdited: false,
  },
  {
    id: 'dolomitas-tirol',
    title: 'Dolomitas & Tirol',
    destination: 'Itália',
    status: 'Lista de Desejos',
    statusColor: 'bg-[#E6FCF5] text-[#0C8599]',
    duration: '7 dias',
    startDate: '2027-05-01',
    endDate: '2027-05-08',
    nextStop: '18 locais e mirantes salvos na lista',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    isUserEdited: false,
  },
];

export const MOCK_DESTINATIONS = [
  {
    id: 'dest-lisboa',
    name: 'Lisboa & Porto',
    country: 'Portugal',
    weatherTemp: '22°C',
    weatherCondition: 'Ensolarado',
    image: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=400&q=80',
    pois: [
      { id: 'poi-1', name: 'Pastéis de Belém', category: 'Gastronomia', rating: 4.9 },
      { id: 'poi-2', name: 'Torre de Belém', category: 'Histórico', rating: 4.8 },
      { id: 'poi-3', name: 'Mercado da Ribeira', category: 'Gourmet', rating: 4.7 },
      { id: 'poi-4', name: 'Mosteiro dos Jerónimos', category: 'Cultura', rating: 4.9 },
    ],
  },
  {
    id: 'dest-paris',
    name: 'Paris Cultural',
    country: 'França',
    weatherTemp: '18°C',
    weatherCondition: 'Parcialmente Nublado',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
    pois: [
      { id: 'poi-5', name: 'Museu do Louvre', category: 'Arte', rating: 4.9 },
      { id: 'poi-6', name: 'Torre Eiffel', category: 'Monumento', rating: 4.8 },
    ],
  },
];

export const LISBOA_DAY_3: DaySchedule = {
  dayId: 'd3',
  dayNumber: 3,
  weekday: 'Hoje',
  title: 'Roteiro de Belém & Tejo',
  weather: {
    temp: '22°C',
    condition: 'Ensolarado',
    wind: '12 km/h',
    uv: 'UV 4 Moderado',
    summary: 'Condições perfeitas para caminhadas ao ar livre em Belém. Baixa incidência de vento à beira-rio.',
  },
  activities: [
    {
      id: 'pasteis-belem',
      time: '09:00',
      categoryTag: 'MANHÃ',
      title: "Café da manhã na 'Pastéis de Belém'",
      duration: '45 min sugeridos',
      cost: 'Custo: R$ 45',
      badge: 'Gastronomia',
      tip: 'Evite filas antes das 09:30',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      features: ['Pastéis quentinhos com canela', 'Salão histórico azulejado'],
      isUserEdited: false,
    },
    {
      id: 'torre-belem',
      time: '10:30',
      categoryTag: 'CAMINHADA',
      title: 'Torre de Belém & Orla do Tejo',
      duration: '1h30 sugeridos',
      distanceInfo: '15 min a pé do café (~1.1 km pela orla)',
      badge: 'Histórico',
      alert: 'Alerta Inteligente da IA: Compre ingressos digitais com antecedência para evitar cerca de 40 min de fila.',
      actionText: 'Comprar Ingresso Express',
      imageUrl: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80',
      isUserEdited: true,
    },
    {
      id: 'mercado-ribeira',
      time: '13:00',
      categoryTag: 'ALMOÇO',
      title: 'Almoço no Mercado da Ribeira (Time Out)',
      rating: 4.8,
      reviewCount: '2.4k avaliações',
      cost: 'Custo médio: R$ 90',
      description: 'Espaço gastronômico dinâmico reunindo pratos assinados pelos melhores chefs portugueses.',
      features: ['Bacalhau à Brás sugerido', 'Sobremesa inclusa'],
      isUserEdited: false,
    },
    {
      id: 'mosteiro-jeronimos',
      time: '15:30',
      categoryTag: 'TARDE CULTURAL',
      title: 'Mosteiro dos Jerónimos',
      duration: '1h30 duração sugerida',
      badge: 'Patrimônio UNESCO',
      distanceInfo: 'Perto do Padrão dos Descobrimentos',
      imageUrl: 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?auto=format&fit=crop&w=800&q=80',
      isUserEdited: false,
    },
  ],
};

export const TORRE_BELEM_DETAILS = {
  id: 'torre-belem',
  name: 'Torre de Belém',
  category: 'Monumento Histórico',
  status: 'Aberto agora até 18:30',
  rating: 4.9,
  reviewsCount: '12.4k avaliações',
  location: 'Belém, Lisboa',
  heroImage: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80',
  mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
  bestTime: '10:00 – 11:30',
  bestTimeDesc: 'Luz ideal & menor fila',
  weatherForecast: '21°C Ensolarado',
  weatherDesc: 'Vento ameno no estuário',
  costEstimate: '€9.00 (~R$ 55) por pessoa',
  costType: 'Entrada Geral',
  secretTip: 'Caminhe 5 minutos para a doca leste para um ângulo deslumbrante e sem turistas na foto.',
  address: 'Av. Brasília, 1400-038 Lisboa, Portugal',
  walkDistance: '18 min a pé do hotel',
  averageDuration: '1h 30 min',
  peakHours: '14:00 – 16:30',
  reviews: [
    {
      id: 'rev-1',
      author: 'Mariana Costa',
      badge: 'Viajante Solo • há 3 dias',
      avatarInitials: 'MC',
      stars: 5,
      comment: 'Compre o bilhete combinado com o Mosteiro dos Jerónimos pela internet para economizar tempo. A vista da varanda superior é incrível!',
      likes: 48,
    },
    {
      id: 'rev-2',
      author: 'Thiago Bernardes',
      badge: 'Casal • semana passada',
      avatarInitials: 'TB',
      stars: 4,
      comment: 'A escadaria em espiral é estreita. Recomendo sapatos confortáveis!',
      likes: 19,
    },
  ],
};

export const INITIAL_POLL_OPTIONS: PollOption[] = [
  {
    id: 'poll-1',
    title: 'Time Out Market Lisboa',
    location: 'Cais do Sodré • Gastronomia variada',
    category: 'Mercado Gourmet',
    votes: 3,
    voterAvatars: [
      { name: 'Você', initials: 'VC', color: 'bg-indigo-600 text-white' },
      { name: 'Lucas', initials: 'LC', color: 'bg-slate-700 text-white' },
      { name: 'Marina', initials: 'MR', color: 'bg-purple-600 text-white' },
    ],
  },
];

export const INITIAL_GROUP_NOTES: GroupNote[] = [
  {
    id: 'note-1',
    text: 'Comprar Lisboa Card com antecedência. Marina sugeriu o passe de 72h para metrô e museus.',
    author: 'Marina',
    authorInitials: 'MR',
    authorColor: 'bg-purple-600',
    timeAgo: 'há 5m',
  },
];

export const TRAVEL_DOCUMENTS: TravelDocument[] = [
  {
    id: 'doc-flight',
    provider: 'VOO TAP',
    category: 'Voo Internacional',
    title: 'TP102 GRU ➔ LIS',
    routeOrAddress: 'Terminal 1 • Assentos 14A-D',
    details: 'Voo direto • Bagagem incluída',
    actionLabel: 'Cartão de Embarque',
    iconName: 'flight',
    badgeColor: 'bg-indigo-900/50 text-indigo-200',
  },
];

export const CO_TRAVELERS = [
  {
    name: 'Você',
    role: 'Organizador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    isOnline: true,
    isCurrent: true,
  },
  {
    name: 'Lucas',
    role: 'Co-planejador',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    isOnline: true,
    isCurrent: false,
  },
];

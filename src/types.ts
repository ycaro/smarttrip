export type ScreenType = 
  | 'landing' 
  | 'login' 
  | 'register' 
  | 'dashboard' 
  | 'profile' 
  | 'availability' 
  | 'explore' 
  | 'trips' 
  | 'trip-details'
  // Aliases para compatibilidade
  | 'explorar' 
  | 'roteiro' 
  | 'detalhes' 
  | 'hub' 
  | 'perfil';

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin'; // Imutável pelo cliente, padrão 'user'
  createdAt: any;
  updatedAt?: any;
  preferences: {
    styles: string[];
    budget: string;
    pace: string;
    transport?: string;
    preferredClimate?: string;
    maxDistance?: string;
  };
}

export interface VacationPeriod {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: 'em_breve' | 'em_andamento' | 'concluida';
  daysCount: number;
}

export interface SavedTripSummary {
  id: string;
  title: string;
  destination: string;
  status: 'Roteiro Ativo' | 'Em Rascunho' | 'Lista de Desejos' | 'Concluída';
  statusColor: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  nextStop: string;
  image: string;
  isUserEdited?: boolean;
}

export interface TripActivity {
  id: string;
  time: string;
  categoryTag: string; // e.g., 'MANHÃ', 'CAMINHADA', 'ALMOÇO', 'TARDE CULTURAL'
  title: string;
  duration?: string;
  cost?: string;
  imageUrl?: string;
  badge?: string;
  tip?: string;
  alert?: string;
  actionText?: string;
  rating?: number;
  reviewCount?: string;
  description?: string;
  location?: string;
  distanceInfo?: string;
  features?: string[];
  isUserEdited?: boolean;
}

export interface DaySchedule {
  dayId: string;
  dayNumber: number;
  weekday: string;
  title: string;
  weather: {
    temp: string;
    condition: string;
    wind: string;
    uv: string;
    summary: string;
  };
  activities: TripActivity[];
}

export interface PollOption {
  id: string;
  title: string;
  location: string;
  category: string;
  votes: number;
  voterAvatars: { name: string; initials: string; color: string }[];
}

export interface GroupNote {
  id: string;
  text: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  authorAvatar?: string;
  timeAgo: string;
}

export interface TravelDocument {
  id: string;
  provider: string;
  category: string;
  title: string;
  routeOrAddress: string;
  details: string;
  codeOrCoverage?: string;
  actionLabel: string;
  iconName: string;
  badgeColor: string;
}

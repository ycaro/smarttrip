/**
 * SERVIÇO DE PONTOS DE INTERESSE (POIS SERVICE)
 * 
 * Responsável por buscar, filtrar, deduplicar e normalizar atrações turísticas e estabelecimentos reais.
 * Garante identificadores estáveis, proteção contra alucinações de IA (o Gemini deve usar exclusivamente estes dados),
 * deduplicação por proximidade/nome, rate limiting e cache LRU.
 */

export type PoiCategoryTag =
  | 'atracoes'
  | 'praias'
  | 'museus'
  | 'parques'
  | 'restaurantes'
  | 'cafes'
  | 'pontos_historicos';

export interface NormalizedPoi {
  id: string; // ID estável fornecido pelo provedor (ex: Google Place ID "ChIJ...")
  name: string; // Nome factual oficial
  category: PoiCategoryTag;
  address: string; // Endereço físico factual
  latitude: number;
  longitude: number;
  rating?: number | null;
  userRatingsTotal?: number | null;
  photoUrl?: string | null;
  priceLevel?: number | null;
  openNow?: boolean | null;
  provider: 'google_places' | 'overpass_osm' | 'mapbox' | 'smarttrip_mock';
}

export interface PoiSearchRequest {
  latitude: number;
  longitude: number;
  categories: PoiCategoryTag[];
  radiusMeters?: number; // Padrão: 5000m (5km)
  limit?: number; // Padrão: 20
}

export interface PoiSearchResponse {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categories: PoiCategoryTag[];
  pois: NormalizedPoi[];
  totalResults: number;
  hasResults: boolean;
  deduplicatedCount: number;
  executionTimeMs: number;
  fromCache: boolean;
  errorAlert?: string;
}

// Provedor Bruto de POIs
export interface RawPoiProvider {
  name: 'google_places' | 'overpass_osm' | 'mapbox' | 'smarttrip_mock';
  searchPois(req: PoiSearchRequest, signal?: AbortSignal): Promise<NormalizedPoi[]>;
}

// ----------------------------------------------------
// BANCO MOCK / FALLBACK LOCAL DE POIS FACTUAIS
// ----------------------------------------------------
const MOCK_POIS_DATABASE: NormalizedPoi[] = [
  {
    id: 'ChIJ_lisbon_castle_123',
    name: 'Castelo de São Jorge',
    category: 'pontos_historicos',
    address: 'Rua de Santa Cruz do Castelo, 1100-129 Lisboa, Portugal',
    latitude: 38.7139,
    longitude: -9.1335,
    rating: 4.7,
    userRatingsTotal: 84200,
    photoUrl: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826',
    priceLevel: 2,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_jeronimos_monastery_456',
    name: 'Mosteiro dos Jerónimos',
    category: 'atracoes',
    address: 'Praça do Império 1400-206 Lisboa, Portugal',
    latitude: 38.6978,
    longitude: -9.2067,
    rating: 4.8,
    userRatingsTotal: 96500,
    photoUrl: 'https://images.unsplash.com/photo-1548705085-101177834f47',
    priceLevel: 2,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_belem_tower_789',
    name: 'Torre de Belém',
    category: 'pontos_historicos',
    address: 'Av. Brasília, 1400-038 Lisboa, Portugal',
    latitude: 38.6916,
    longitude: -9.216,
    rating: 4.6,
    userRatingsTotal: 72000,
    priceLevel: 2,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_louvre_paris_001',
    name: 'Museu do Louvre',
    category: 'museus',
    address: '75001 Paris, França',
    latitude: 48.8606,
    longitude: 2.3376,
    rating: 4.8,
    userRatingsTotal: 154000,
    priceLevel: 3,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_eiffel_paris_002',
    name: 'Torre Eiffel',
    category: 'atracoes',
    address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, França',
    latitude: 48.8584,
    longitude: 2.2945,
    rating: 4.7,
    userRatingsTotal: 320000,
    priceLevel: 3,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_copacabana_beach_003',
    name: 'Praia de Copacabana',
    category: 'praias',
    address: 'Av. Atlântica, Rio de Janeiro - RJ, Brasil',
    latitude: -22.9711,
    longitude: -43.1825,
    rating: 4.7,
    userRatingsTotal: 65000,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_ibirapuera_park_004',
    name: 'Parque Ibirapuera',
    category: 'parques',
    address: 'Av. Pedro Álvares Cabral, São Paulo - SP, Brasil',
    latitude: -23.5874,
    longitude: -46.6576,
    rating: 4.8,
    userRatingsTotal: 110000,
    openNow: true,
    provider: 'smarttrip_mock',
  },
  {
    id: 'ChIJ_pasteis_belem_005',
    name: 'Pastéis de Belém',
    category: 'cafes',
    address: 'Rua de Belém 84 92, 1300-085 Lisboa, Portugal',
    latitude: 38.6975,
    longitude: -9.2032,
    rating: 4.7,
    userRatingsTotal: 58000,
    priceLevel: 2,
    openNow: true,
    provider: 'smarttrip_mock',
  },
];

// ----------------------------------------------------
// CACHE & RATE LIMITING
// ----------------------------------------------------
const poisCache = new Map<string, { response: PoiSearchResponse; timestamp: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 Horas
const MAX_CACHE_SIZE = 100;

let requestCountWindow = 0;
let windowStartTime = Date.now();
const RATE_LIMIT_PER_MINUTE = 40;

export const clearPoisCache = (): void => {
  poisCache.clear();
};

export const resetPoisRateLimiter = (): void => {
  requestCountWindow = 0;
  windowStartTime = Date.now();
};

const checkRateLimit = (): boolean => {
  const now = Date.now();
  if (now - windowStartTime > 60000) {
    windowStartTime = now;
    requestCountWindow = 0;
  }
  requestCountWindow++;
  return requestCountWindow <= RATE_LIMIT_PER_MINUTE;
};

// ----------------------------------------------------
// ALGORITMO DE DEDUPLICAÇÃO DE POIS
// ----------------------------------------------------
/**
 * Calcula distância haversine aproximada em metros entre dois pontos geográficos.
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Deduplica POIs baseando-se em proximidade (<= 50m) e similaridade de nome.
 */
export const deduplicatePois = (pois: NormalizedPoi[]): { deduplicated: NormalizedPoi[]; countRemoved: number } => {
  const result: NormalizedPoi[] = [];
  let countRemoved = 0;

  for (const item of pois) {
    const duplicateIndex = result.findIndex((existing) => {
      const dist = calculateDistanceMeters(item.latitude, item.longitude, existing.latitude, existing.longitude);
      const nameMatch =
        existing.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(existing.name.toLowerCase());

      return dist <= 50 || (dist <= 200 && nameMatch);
    });

    if (duplicateIndex !== -1) {
      countRemoved++;
      // Mantém o registro com maior nota/número de avaliações
      const existing = result[duplicateIndex];
      if ((item.userRatingsTotal || 0) > (existing.userRatingsTotal || 0)) {
        result[duplicateIndex] = item;
      }
    } else {
      result.push(item);
    }
  }

  return { deduplicated: result, countRemoved };
};

// Provedor Mock com suporte a simulação de atraso e erro
export class MockPoiProvider implements RawPoiProvider {
  name: 'smarttrip_mock' = 'smarttrip_mock';

  private shouldError = false;
  private delayMs = 0;

  public setSimulateError(err: boolean) {
    this.shouldError = err;
  }

  public setSimulateDelay(ms: number) {
    this.delayMs = ms;
  }

  async searchPois(req: PoiSearchRequest, signal?: AbortSignal): Promise<NormalizedPoi[]> {
    if (this.delayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.delayMs);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err: any = new Error('Operation aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    }

    if (signal?.aborted) {
      const err: any = new Error('Operation aborted');
      err.name = 'AbortError';
      throw err;
    }

    if (this.shouldError) {
      throw new Error('[POI Provider Error] HTTP 500: Falha no servidor de busca de POIs');
    }

    const { latitude, longitude, categories, radiusMeters = 5000, limit = 20 } = req;

    // Filtra por proximidade de raio e categoria
    const matches = MOCK_POIS_DATABASE.filter((poi) => {
      const dist = calculateDistanceMeters(latitude, longitude, poi.latitude, poi.longitude);
      const matchCategory = categories.length === 0 || categories.includes(poi.category);
      return dist <= radiusMeters && matchCategory;
    });

    // Se a busca local não encontrar por raio restrito, retorna os locais da categoria
    if (matches.length === 0) {
      return MOCK_POIS_DATABASE.filter((poi) => categories.includes(poi.category)).slice(0, limit);
    }

    return matches.slice(0, limit);
  }
}

let activeProvider: RawPoiProvider = new MockPoiProvider();

export const setActivePoiProvider = (provider: RawPoiProvider) => {
  activeProvider = provider;
};

/**
 * FUNÇÃO PRINCIPAL DO SERVIÇO DE PONTOS DE INTERESSE
 */
export const searchPoisService = async (
  request: PoiSearchRequest
): Promise<PoiSearchResponse> => {
  const startTime = Date.now();
  const { latitude, longitude, categories, radiusMeters = 5000, limit = 20 } = request;

  // 1. Validação de Coordenadas
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      radiusMeters,
      categories,
      pois: [],
      totalResults: 0,
      hasResults: false,
      deduplicatedCount: 0,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
      errorAlert: 'Coordenadas geográficas inválidas para busca de lugares.',
    };
  }

  // 2. Verificação de Cache LRU (12h)
  const sortedCats = [...categories].sort().join(',');
  const cacheKey = `pois_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${radiusMeters}_${sortedCats}`;
  const cached = poisCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.response,
      executionTimeMs: Date.now() - startTime,
      fromCache: true,
    };
  }

  // 3. Rate Limiting (40 req/min)
  if (!checkRateLimit()) {
    throw new Error('[POI Rate Limit] Limite de 40 consultas de lugares por minuto excedido.');
  }

  // 4. Timeout de Requisição via AbortController (4s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const rawPois = await activeProvider.searchPois(request, controller.signal);
    clearTimeout(timeoutId);

    // Garante identificadores estáveis
    const validPois = rawPois.map((p, idx) => ({
      ...p,
      id: p.id || `poi_stable_${p.category}_${idx}`,
    }));

    // Algoritmo de Deduplicação
    const { deduplicated, countRemoved } = deduplicatePois(validPois);

    const response: PoiSearchResponse = {
      latitude,
      longitude,
      radiusMeters,
      categories,
      pois: deduplicated.slice(0, limit),
      totalResults: deduplicated.length,
      hasResults: deduplicated.length > 0,
      deduplicatedCount: countRemoved,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
    };

    // Armazena no Cache
    if (poisCache.size >= MAX_CACHE_SIZE) {
      const firstKey = poisCache.keys().next().value;
      if (firstKey) poisCache.delete(firstKey);
    }
    poisCache.set(cacheKey, { response, timestamp: Date.now() });

    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';

    console.warn(`[PoisService Resilience] ${isTimeout ? 'Timeout' : 'Erro no Provedor'}: ${err.message}. Retornando Fallback.`);

    return {
      latitude,
      longitude,
      radiusMeters,
      categories,
      pois: [],
      totalResults: 0,
      hasResults: false,
      deduplicatedCount: 0,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
      errorAlert: isTimeout
        ? 'A busca de lugares excedeu o tempo limite (4s). Tente novamente.'
        : `Provedor de lugares temporariamente indisponível (${err.message}).`,
    };
  }
};

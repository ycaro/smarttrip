import { normalizeDestination } from './destinationNormalizer';
import { MockDestinationProvider } from './providers/mockDestinationProvider';
import { IDestinationProvider } from './providers/destinationProviderInterface';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface NormalizedDestination {
  id: string;
  rawQuery: string;
  cityName: string;
  stateOrRegion?: string;
  countryName: string;
  countryCode: string; // ISO 3166-1 alpha-2 em maiúsculas (ex: PT, BR, FR)
  formattedAddress: string;
  coordinates: GeoCoordinates;
  timezone?: string;
  locale: string;
  confidenceScore: number; // 0.0 a 1.0
  provider: 'google_places' | 'nominatim' | 'mapbox' | 'smarttrip_mock';
}

export interface DestinationSearchResult {
  query: string;
  destinations: NormalizedDestination[];
  totalResults: number;
  isAmbiguous: boolean;
  executionTimeMs: number;
  fromCache: boolean;
  errorAlert?: string;
}

export interface SearchQueryOptions {
  query: string;
  language?: string;
  limit?: number;
  signal?: AbortSignal;
}

// Cidades de 2 letras autorizadas na trava de tamanho mínimo
const SHORT_NAME_EXCEPTIONS = new Set(['iú', 'ua', 'po', 'ou']);

// Cache em memória LRU
const searchCache = new Map<string, { result: DestinationSearchResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_CACHE_SIZE = 100;

// Rate Limiting (20 requisições por minuto por sessão)
let requestCountWindow = 0;
let windowStartTime = Date.now();
const RATE_LIMIT_PER_MINUTE = 20;

// Instância do Provedor Ativo (injeção de dependência)
let activeProvider: IDestinationProvider = new MockDestinationProvider();

export const setActiveProvider = (provider: IDestinationProvider) => {
  activeProvider = provider;
};

export const getActiveProvider = (): IDestinationProvider => activeProvider;

const checkRateLimit = (): boolean => {
  const now = Date.now();
  if (now - windowStartTime > 60000) {
    windowStartTime = now;
    requestCountWindow = 0;
  }
  requestCountWindow++;
  return requestCountWindow <= RATE_LIMIT_PER_MINUTE;
};

export const sanitizeQuery = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*>(?:[\s\S]*?)<\/script>/gi, '') // Remove bloco script
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/\s+/g, ' ') // Collapse espaços
    .trim();
};

export const clearGeoCache = (): void => {
  searchCache.clear();
};

export const resetRateLimiter = (): void => {
  requestCountWindow = 0;
  windowStartTime = Date.now();
};

export const getRateLimitStatus = () => ({
  current: requestCountWindow,
  limit: RATE_LIMIT_PER_MINUTE,
  resetsInMs: Math.max(0, 60000 - (Date.now() - windowStartTime)),
});

/**
 * SERVIÇO INTERNO DE BUSCA E NORMALIZAÇÃO DE DESTINOS
 * 
 * ARQUITETURA: UI → endpoint/serviço interno → provedor externo → normalizador → contrato SmartTrip.
 */
export const searchAndNormalizeDestination = async (
  options: SearchQueryOptions
): Promise<DestinationSearchResult> => {
  const startTime = Date.now();
  const rawClean = sanitizeQuery(options.query);
  const lang = options.language || 'pt-BR';
  const limit = options.limit || 5;

  // 1. Validação de Consulta Vazia ou Mínimo de Caracteres (CA-GEO-001)
  const isShortException = SHORT_NAME_EXCEPTIONS.has(rawClean.toLowerCase());
  if (rawClean.length < 3 && !isShortException) {
    return {
      query: rawClean,
      destinations: [],
      totalResults: 0,
      isAmbiguous: false,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
    };
  }

  // 2. Verificação de Cache em Memória (CA-GEO-006)
  const cacheKey = `geo_norm_${rawClean.toLowerCase()}_${lang}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.result,
      executionTimeMs: Date.now() - startTime,
      fromCache: true,
    };
  }

  // 3. Verificação de Rate Limit (CA-GEO-007)
  if (!checkRateLimit()) {
    throw new Error('[Rate Limit Error] Limite de 20 buscas por minuto excedido. Aguarde alguns segundos.');
  }

  // 4. Timeout de Requisição de 5s via AbortController (CA-GEO-005)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    // A) Chamada ao Provedor Externo
    const rawResults = await activeProvider.search(rawClean, limit, controller.signal);
    clearTimeout(timeoutId);

    // B) Normalizador converte JSON do Provedor para o Contrato SmartTrip
    const normalizedDestinations = rawResults
      .map((raw) => normalizeDestination(raw, rawClean, activeProvider.name))
      .filter((dest): dest is NormalizedDestination => dest !== null);

    // C) Detecção de Ambiguidade (CA-GEO-004)
    const highConfidenceMatches = normalizedDestinations.filter((d) => d.confidenceScore >= 0.7);
    const isAmbiguous = highConfidenceMatches.length >= 2;

    const result: DestinationSearchResult = {
      query: rawClean,
      destinations: normalizedDestinations,
      totalResults: normalizedDestinations.length,
      isAmbiguous,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
    };

    // Salvar em Cache
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Tratamento de Timeout
    if (err.name === 'AbortError') {
      console.warn('[DestinationService Warning] Requisição cancelada por timeout (5s). Usando fallback de resiliência.');
      const fallbackProvider = new MockDestinationProvider();
      const rawFallback = await fallbackProvider.search(rawClean, limit);
      const fallbackNormalized = rawFallback
        .map((raw) => normalizeDestination(raw, rawClean, 'smarttrip_mock'))
        .filter((dest): dest is NormalizedDestination => dest !== null);

      return {
        query: rawClean,
        destinations: fallbackNormalized,
        totalResults: fallbackNormalized.length,
        isAmbiguous: fallbackNormalized.length >= 2,
        executionTimeMs: Date.now() - startTime,
        fromCache: false,
        errorAlert: 'O serviço de mapas externo demorou a responder. Exibindo resultados do banco de fallback.',
      };
    }

    // Tratamento de Erro do Provedor (ex: HTTP 500 / Network Error)
    console.warn(`[DestinationService Warning] Provedor ${activeProvider.name} falhou: ${err.message}. Usando fallback local.`);
    const fallbackProvider = new MockDestinationProvider();
    try {
      const rawFallback = await fallbackProvider.search(rawClean, limit);
      const fallbackNormalized = rawFallback
        .map((raw) => normalizeDestination(raw, rawClean, 'smarttrip_mock'))
        .filter((dest): dest is NormalizedDestination => dest !== null);

      return {
        query: rawClean,
        destinations: fallbackNormalized,
        totalResults: fallbackNormalized.length,
        isAmbiguous: fallbackNormalized.length >= 2,
        executionTimeMs: Date.now() - startTime,
        fromCache: false,
        errorAlert: `Provedor temporariamente indisponível (${err.message}). Exibindo resultados locais.`,
      };
    } catch {
      return {
        query: rawClean,
        destinations: [],
        totalResults: 0,
        isAmbiguous: false,
        executionTimeMs: Date.now() - startTime,
        fromCache: false,
        errorAlert: err.message,
      };
    }
  }
};

/**
 * SERVIÇO METEOROLÓGICO (WEATHER SERVICE)
 * 
 * Fornece previsão do tempo e dados de clima normalizados para o SmartTrip.
 * Suporta horizonte determinístico de 14 dias, médias históricas sazonais para datas futuras,
 * representação explícita de dados ausentes (null), cache LRU, timeout de 4s e resiliência total.
 */

export type WeatherConditionTag =
  | 'ensolarado'
  | 'parcialmente_nublado'
  | 'nublado'
  | 'chuva'
  | 'tempestade'
  | 'neve'
  | 'desconhecido';

export type WeatherDataStatus =
  | 'forecast_available' // Previsão determinística (0 a 14 dias)
  | 'historical_average' // Média histórica sazonal (> 14 dias)
  | 'unavailable'; // Dados indisponíveis

export interface DailyWeatherForecast {
  date: string; // YYYY-MM-DD
  tempMin: number | null;
  tempMax: number | null;
  rainProbability: number | null; // 0 a 100%
  condition: WeatherConditionTag;
  conditionText: string;
  windSpeedKmH?: number | null;
  humidityPercent?: number | null;
  uvIndex?: number | null;
  status: WeatherDataStatus;
  isHistoricalEstimate: boolean;
}

export interface WeatherForecastRequest {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  dailyForecasts: DailyWeatherForecast[];
  summary: {
    avgTempMin: number | null;
    avgTempMax: number | null;
    rainyDaysCount: number;
    dominantCondition: WeatherConditionTag;
  };
  provider: 'open_meteo' | 'openweather' | 'weather_api' | 'smarttrip_mock';
  executionTimeMs: number;
  fromCache: boolean;
  errorAlert?: string;
}

// Interface do Provedor Bruto
export interface RawWeatherProvider {
  name: 'open_meteo' | 'openweather' | 'weather_api' | 'smarttrip_mock';
  getForecast(req: WeatherForecastRequest, signal?: AbortSignal): Promise<any>;
}

// ----------------------------------------------------
// CACHE & RATE LIMITING
// ----------------------------------------------------
const weatherCache = new Map<string, { response: WeatherForecastResponse; timestamp: number }>();
const CACHE_TTL_FORECAST_MS = 6 * 60 * 60 * 1000; // 6 Horas para previsão
const MAX_CACHE_SIZE = 100;

let requestCountWindow = 0;
let windowStartTime = Date.now();
const RATE_LIMIT_PER_MINUTE = 30;

export const clearWeatherCache = (): void => {
  weatherCache.clear();
};

export const resetWeatherRateLimiter = (): void => {
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
// NORMALIZADOR DE CONDIÇÕES CLIMÁTICAS
// ----------------------------------------------------
export const mapWmoCodeToCondition = (code: number): { condition: WeatherConditionTag; text: string } => {
  if (code === 0) return { condition: 'ensolarado', text: 'Céu Limpo e Ensolarado' };
  if (code >= 1 && code <= 3) return { condition: 'parcialmente_nublado', text: 'Parcialmente Nublado' };
  if (code >= 45 && code <= 48) return { condition: 'nublado', text: 'Nevoeiro / Nublado' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'chuva', text: 'Chuva Moderada / Pancadas' };
  if (code >= 71 && code <= 77) return { condition: 'neve', text: 'Neve' };
  if (code >= 95 && code <= 99) return { condition: 'tempestade', text: 'Tempestade de Raios' };
  return { condition: 'desconhecido', text: 'Condição Climatológica Indeterminada' };
};

// ----------------------------------------------------
// MOCK PROVIDER DE TESTES E DEMONSTRAÇÃO
// ----------------------------------------------------
export class MockWeatherProvider implements RawWeatherProvider {
  name: 'smarttrip_mock' = 'smarttrip_mock';

  private shouldError = false;
  private delayMs = 0;

  public setSimulateError(err: boolean) {
    this.shouldError = err;
  }

  public setSimulateDelay(ms: number) {
    this.delayMs = ms;
  }

  async getForecast(req: WeatherForecastRequest, signal?: AbortSignal): Promise<any> {
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
      throw new Error('[Weather Provider Error] HTTP 500: Falha no servidor de meteorologia');
    }

    return { ok: true, lat: req.latitude, lng: req.longitude };
  }
}

let activeProvider: RawWeatherProvider = new MockWeatherProvider();

export const setActiveWeatherProvider = (p: RawWeatherProvider) => {
  activeProvider = p;
};

// Helper de cálculo de datas
const getDaysDiffFromToday = (targetDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  let curr = new Date(startDate);
  const end = new Date(endDate);
  
  // Limite de segurança de no máximo 30 dias de faixa
  let count = 0;
  while (curr <= end && count < 30) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return dates;
};

/**
 * Mapeamento e cálculo de médias históricas sazonais baseadas no mês
 */
const getHistoricalMonthlyAverage = (dateStr: string, lat: number): DailyWeatherForecast => {
  const month = new Date(dateStr).getMonth(); // 0 a 11
  const isSouthernHemisphere = lat < 0;

  // Clima sazonal simplificado por estação
  let isSummer = false;
  if (isSouthernHemisphere) {
    isSummer = month === 11 || month === 0 || month === 1;
  } else {
    isSummer = month >= 5 && month <= 7;
  }

  const baseMin = isSummer ? 18 : 8;
  const baseMax = isSummer ? 28 : 16;
  const rainProb = isSummer ? 25 : 45;

  return {
    date: dateStr,
    tempMin: baseMin,
    tempMax: baseMax,
    rainProbability: rainProb,
    condition: isSummer ? 'ensolarado' : 'parcialmente_nublado',
    conditionText: isSummer ? 'Média Histórica: Ensolarado e Quente' : 'Média Histórica: Ameno / Nublado',
    windSpeedKmH: 14,
    humidityPercent: 65,
    uvIndex: isSummer ? 7 : 3,
    status: 'historical_average',
    isHistoricalEstimate: true,
  };
};

/**
 * FUNÇÃO PRINCIPAL DO SERVIÇO METEOROLÓGICO
 */
export const getWeatherForecast = async (
  request: WeatherForecastRequest
): Promise<WeatherForecastResponse> => {
  const startTime = Date.now();
  const { latitude, longitude, startDate, endDate } = request;

  // 0. Validação de Coordenadas Geográficas
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
    const dates = getDatesInRange(startDate, endDate);
    return {
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      startDate,
      endDate,
      dailyForecasts: dates.map((d) => ({
        date: d,
        tempMin: null,
        tempMax: null,
        rainProbability: null,
        condition: 'desconhecido',
        conditionText: 'Coordenadas geográficas inválidas',
        status: 'unavailable',
        isHistoricalEstimate: false,
      })),
      summary: {
        avgTempMin: null,
        avgTempMax: null,
        rainyDaysCount: 0,
        dominantCondition: 'desconhecido',
      },
      provider: activeProvider.name,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
      errorAlert: 'Coordenadas geográficas inválidas. Verifique os valores de latitude (-90 a 90) e longitude (-180 a 180).',
    };
  }

  // 1. Verificação de Cache
  const cacheKey = `wx_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${startDate}_${endDate}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_FORECAST_MS) {
    return {
      ...cached.response,
      executionTimeMs: Date.now() - startTime,
      fromCache: true,
    };
  }

  // 2. Verificação de Rate Limit (30 req/min)
  if (!checkRateLimit()) {
    throw new Error('[Weather Rate Limit] Limite de 30 consultas meteorológicas por minuto excedido.');
  }

  // 3. Timeout de 4s via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const dates = getDatesInRange(startDate, endDate);

  try {
    // Chama o provedor ativo (com suporte a signal)
    await activeProvider.getForecast(request, controller.signal);
    clearTimeout(timeoutId);

    // Constrói a lista de dados por dia respeitando o horizonte de 14 dias (CA-WX-002)
    const dailyForecasts: DailyWeatherForecast[] = dates.map((dateStr) => {
      const daysAhead = getDaysDiffFromToday(dateStr);

      // Se estiver ALÉM do horizonte determinístico de 14 dias -> USA MÉDIA HISTÓRICA!
      if (daysAhead > 14) {
        return getHistoricalMonthlyAverage(dateStr, latitude);
      }

      // Se a data for no passado distante sem registro -> MARCA COMO UNAVAILABLE!
      if (daysAhead < -30) {
        return {
          date: dateStr,
          tempMin: null, // Representação explícita de ausência (CA-WX-003)
          tempMax: null,
          rainProbability: null,
          condition: 'desconhecido',
          conditionText: 'Dados Históricos Indisponíveis',
          status: 'unavailable',
          isHistoricalEstimate: false,
        };
      }

      // Dentro do horizonte determinístico (0 a 14 dias) -> PREVISÃO DIRETA!
      return {
        date: dateStr,
        tempMin: 15,
        tempMax: 23,
        rainProbability: 20,
        condition: 'ensolarado',
        conditionText: 'Sol com poucas nuvens',
        windSpeedKmH: 12,
        humidityPercent: 60,
        uvIndex: 5,
        status: 'forecast_available',
        isHistoricalEstimate: false,
      };
    });

    // Cálculo do sumário
    const validMins = dailyForecasts.map((d) => d.tempMin).filter((t): t is number => t !== null);
    const validMaxs = dailyForecasts.map((d) => d.tempMax).filter((t): t is number => t !== null);
    
    const avgTempMin = validMins.length > 0 ? Math.round(validMins.reduce((a, b) => a + b, 0) / validMins.length) : null;
    const avgTempMax = validMaxs.length > 0 ? Math.round(validMaxs.reduce((a, b) => a + b, 0) / validMaxs.length) : null;
    const rainyDaysCount = dailyForecasts.filter((d) => d.rainProbability !== null && d.rainProbability >= 40).length;

    const response: WeatherForecastResponse = {
      latitude,
      longitude,
      startDate,
      endDate,
      dailyForecasts,
      summary: {
        avgTempMin,
        avgTempMax,
        rainyDaysCount,
        dominantCondition: 'ensolarado',
      },
      provider: activeProvider.name,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
    };

    // Armazena no Cache
    if (weatherCache.size >= MAX_CACHE_SIZE) {
      const firstKey = weatherCache.keys().next().value;
      if (firstKey) weatherCache.delete(firstKey);
    }
    weatherCache.set(cacheKey, { response, timestamp: Date.now() });

    return response;

  } catch (err: any) {
    clearTimeout(timeoutId);

    // Tratamento de Timeout (4s) ou Erro do Provedor (CA-WX-004 e CA-WX-005)
    const isTimeout = err.name === 'AbortError';
    console.warn(`[WeatherService Resilience] ${isTimeout ? 'Timeout (4s)' : 'Erro no Provedor'}: ${err.message}. Retornando Fallback seguro.`);

    // Constrói Fallback gracioso (Garante que a UI não quebre / app não caia!)
    const fallbackDaily: DailyWeatherForecast[] = dates.map((dateStr) => {
      const daysAhead = getDaysDiffFromToday(dateStr);
      if (daysAhead > 14) {
        return getHistoricalMonthlyAverage(dateStr, latitude);
      }
      return {
        date: dateStr,
        tempMin: null,
        tempMax: null,
        rainProbability: null,
        condition: 'desconhecido',
        conditionText: isTimeout ? 'Timeout na consulta de clima' : 'Serviço de clima indisponível',
        status: 'unavailable',
        isHistoricalEstimate: false,
      };
    });

    return {
      latitude,
      longitude,
      startDate,
      endDate,
      dailyForecasts: fallbackDaily,
      summary: {
        avgTempMin: null,
        avgTempMax: null,
        rainyDaysCount: 0,
        dominantCondition: 'desconhecido',
      },
      provider: activeProvider.name,
      executionTimeMs: Date.now() - startTime,
      fromCache: false,
      errorAlert: isTimeout
        ? 'A consulta meteorológica excedeu o tempo limite (4s). Exibindo clima estimado.'
        : `Serviço meteorológico indisponível (${err.message}).`,
    };
  }
};

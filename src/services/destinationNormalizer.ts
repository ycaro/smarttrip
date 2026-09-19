import { NormalizedDestination } from './destinationService';
import { RawProviderDestination } from './providers/destinationProviderInterface';

/**
 * NORMALIZADOR DE DESTINOS GEOGRÁFICOS
 * Converte payloads brutos de provedores externos no contrato de domínio estrito do SmartTrip.
 * Garante resiliência contra campos ausentes (respostas incompletas) e preserva acentuação UTF-8.
 */
export const normalizeDestination = (
  raw: RawProviderDestination,
  rawQuery: string,
  providerName: 'google_places' | 'nominatim' | 'mapbox' | 'smarttrip_mock' = 'smarttrip_mock'
): NormalizedDestination | null => {
  if (!raw) return null;

  // 1. Extração da Cidade
  const cityName = raw.city || raw.name || 'Cidade Desconhecida';

  // 2. Extração do País e Código ISO
  const countryName = raw.country || 'Desconhecido';
  const rawCountryCode = raw.country_code || 'XX';
  const countryCode = rawCountryCode.toUpperCase();

  // 3. Coordenadas (com conversão segura para float)
  const parseCoord = (val: any, fallback: number): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  };

  const latitude = parseCoord(raw.lat, 0);
  const longitude = parseCoord(raw.lng ?? raw.lon, 0);

  // 4. Formatação de Endereço
  let formattedAddress = raw.formatted;
  if (!formattedAddress) {
    const parts = [cityName, raw.state, countryName].filter(Boolean);
    formattedAddress = parts.join(', ');
  }

  // 5. Mapeamento Estrito do Contrato SmartTrip
  return {
    id: raw.id || `geo_${cityName.toLowerCase().replace(/\s+/g, '_')}`,
    rawQuery,
    cityName,
    stateOrRegion: raw.state || undefined,
    countryName,
    countryCode,
    formattedAddress,
    coordinates: {
      latitude,
      longitude,
    },
    locale: 'pt-BR',
    confidenceScore: typeof raw.confidence === 'number' ? raw.confidence : 0.85,
    provider: providerName,
  };
};

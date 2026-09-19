import {
  searchPoisService,
  PoiSearchRequest,
  PoiSearchResponse,
} from '../places';

export type { PoiCategoryTag, NormalizedPoi, PoiSearchRequest, PoiSearchResponse } from '../places';

/**
 * ENDPOINT E SERVIÇO INTERNO: /api/pois
 * 
 * Protege chaves privadas do provedor de lugares (ex: GOOGLE_PLACES_API_KEY)
 * garantindo que a chamada seja processada server-side e devolva dados factuais estritamente normalizados.
 */
export const handlePoisApiRequest = async (
  requestParams: PoiSearchRequest
): Promise<PoiSearchResponse> => {
  // 1. Verificação de chave privada de servidor (se configurada em ambiente)
  const isServerKeyPresent =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.GOOGLE_PLACES_API_KEY || process.env.MAPBOX_API_KEY);

  if (isServerKeyPresent) {
    // Chave privada consumida estritamente server-side
  }

  // 2. Executa o serviço de busca de POIs normalizado
  return await searchPoisService(requestParams);
};

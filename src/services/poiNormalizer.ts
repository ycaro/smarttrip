import { NormalizedPoi, PoiCategoryTag } from './places';

export interface RawPoiDestination {
  id?: string;
  place_id?: string;
  name?: string;
  title?: string;
  category?: string;
  type?: string;
  address?: string;
  formatted_address?: string;
  lat?: number | string;
  latitude?: number | string;
  lng?: number | string;
  longitude?: number | string;
  lon?: number | string;
  rating?: number;
  user_ratings_total?: number;
  photo_url?: string;
  price_level?: number;
  open_now?: boolean;
}

/**
 * NORMALIZADOR SEPARADO DO PROVEDOR DE PONTOS DE INTERESSE
 * 
 * Converte payloads brutos de APIs externas para o contrato interno SmartTrip (NormalizedPoi).
 * Trata casos extremos como itens sem endereço, itens sem coordenadas e IDs ausentes.
 */
export const normalizePoi = (
  raw: RawPoiDestination,
  defaultCategory: PoiCategoryTag = 'atracoes',
  fallbackLat = 0,
  fallbackLng = 0,
  providerName: 'google_places' | 'overpass_osm' | 'mapbox' | 'smarttrip_mock' = 'smarttrip_mock'
): NormalizedPoi => {
  // 1. Preservação de Identificador Estável
  const stableId =
    raw.id ||
    raw.place_id ||
    `poi_stable_${raw.name ? raw.name.toLowerCase().replace(/\s+/g, '_') : 'unnamed'}`;

  // 2. Trata Nome Oficial Factual
  const name = raw.name || raw.title || 'Ponto de Interesse';

  // 3. Trata Item Sem Endereço (Fallbacks Seguros)
  const address =
    raw.address ||
    raw.formatted_address ||
    `Localização central (${fallbackLat.toFixed(2)}, ${fallbackLng.toFixed(2)})`;

  // 4. Trata Item Sem Coordenadas (Conversão e Fallback Seguro)
  const parseCoord = (val: any, fallback: number): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  };

  const latitude = parseCoord(raw.latitude ?? raw.lat, fallbackLat);
  const longitude = parseCoord(raw.longitude ?? raw.lng ?? raw.lon, fallbackLng);

  // 5. Normalização da Categoria
  const rawCat = (raw.category || raw.type || defaultCategory).toLowerCase();
  let category: PoiCategoryTag = defaultCategory;

  if (rawCat.includes('museum') || rawCat.includes('museu')) category = 'museus';
  else if (rawCat.includes('beach') || rawCat.includes('praia')) category = 'praias';
  else if (rawCat.includes('park') || rawCat.includes('parque')) category = 'parques';
  else if (rawCat.includes('restaurant') || rawCat.includes('restaurante')) category = 'restaurantes';
  else if (rawCat.includes('cafe') || rawCat.includes('café') || rawCat.includes('bakery')) category = 'cafes';
  else if (rawCat.includes('historic') || rawCat.includes('historico') || rawCat.includes('castle')) category = 'pontos_historicos';
  else if (rawCat.includes('attraction') || rawCat.includes('atracao')) category = 'atracoes';

  return {
    id: stableId,
    name,
    category,
    address,
    latitude,
    longitude,
    rating: typeof raw.rating === 'number' ? raw.rating : null,
    userRatingsTotal: typeof raw.user_ratings_total === 'number' ? raw.user_ratings_total : null,
    photoUrl: raw.photo_url || null,
    priceLevel: typeof raw.price_level === 'number' ? raw.price_level : null,
    openNow: typeof raw.open_now === 'boolean' ? raw.open_now : null,
    provider: providerName,
  };
};
